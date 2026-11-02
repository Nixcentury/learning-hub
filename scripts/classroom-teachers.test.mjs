import test from 'node:test';
import assert from 'node:assert/strict';
import { createClassroomTeachers } from '../js/classroom-teacher-service.js';
import { createClassroomAccess } from '../js/classroom-access.js';
import { teacherDirectory, findTeacherAccount, teacherApprovalPatch, teacherShareTarget } from '../public/shared/classroom-teacher-model.js';
const session = uid => ({ status: 'signed-in', user: { uid, email: uid + '@example.test' } });
const admin = uid => ({ status: 'ready', uid, isTeacher: true, isAdmin: true, systemRole: 'admin' });
function fixture() {
  const watches = [], writes = [];
  let update = async patch => { writes.push(structuredClone(patch)); };
  const service = createClassroomTeachers({ onChange() {}, io: {
    watch(path, next, error) { const row = { path, next, error, active: true }; watches.push(row); return () => { row.active = false; }; },
    timestamp: () => ({ '.sv': 'timestamp' }), update: patch => update(patch),
  } });
  const emit = (path, value) => watches.findLast(row => row.path === path && row.active).next(value);
  return { service, watches, writes, emit, setUpdate(fn) { update = fn; },
    login(uid = 'admin') { service.setContext(session(uid), admin(uid), true); },
    load({ profiles = { friend: { email: 'friend@school.test', displayName: 'Friend' } }, approvals = {}, requests = {} } = {}) {
      service.open(); emit('.info/connected', true); emit('profiles', profiles); emit('teacherApprovals', approvals); emit('teacherRequests', requests);
    },
  };
}
test('directory follows explicit role approvals and supports legacy booleans', () => {
  assert.deepEqual(teacherDirectory({}, { a: true, b: { enabled: true }, c: {}, d: 'true', e: 1, f: { enabled: false } }).teachers.map(row => row.uid), ['a', 'b']);
});
test('email lookup is exact, case-insensitive and refuses ambiguous accounts', () => {
  const people = [{ uid: 'a', email: 'Friend@School.Test' }, { uid: 'b', email: 'other@school.test' }];
  assert.equal(findTeacherAccount(people, ' FRIEND@school.test ').person.uid, 'a');
  assert.equal(findTeacherAccount(people, 'riend@school.test').person, null);
  assert.throws(() => findTeacherAccount(people, 'friend'), /invalid-email/);
  assert.throws(() => findTeacherAccount([...people, people[0]], 'friend@school.test'), /ambiguous-email/);
});
test('share target strips private query/room data and carries no permission', () => {
  assert.equal(teacherShareTarget('https://example.test/learning-hub/index.html?token=secret&email=private#classroom/r_room').url, 'https://example.test/learning-hub/index.html#classroom');
  assert.throws(() => teacherShareTarget('javascript:alert(1)'), /invalid-link/);
});
test('management requires a ready matching admin UID and admin system role', () => {
  assert.equal(createClassroomAccess(session('a'), admin('a')).canManageTeachers, true);
  assert.equal(createClassroomAccess(session('b'), admin('a')).canManageTeachers, undefined);
  assert.equal(createClassroomAccess(session('a'), { ...admin('a'), isAdmin: false }).canManageTeachers, false);
  assert.equal(createClassroomAccess(session('a'), { ...admin('a'), systemRole: 'teacher' }).canManageTeachers, false);
});
test('guest/student/teacher/stale admin or hidden Classroom cannot read the directory or grant access', async () => {
  for (const [s, r, visible] of [
    [{ status: 'guest' }, admin('a'), true],
    [session('a'), { uid: 'a', status: 'ready', systemRole: 'student' }, true],
    [session('a'), { ...admin('a'), isAdmin: false, systemRole: 'teacher' }, true],
    [session('b'), admin('a'), true], [session('a'), admin('a'), false],
  ]) {
    const f = fixture(); f.service.setContext(s, r, visible);
    assert.throws(() => f.service.open(), /admin-required/);
    await assert.rejects(f.service.command('approve', 'friend'), /admin-required/);
    assert.equal(f.watches.length, 0); assert.equal(f.writes.length, 0);
  }
});
test('lazy listeners stop on close, navigation and account switch; stale callbacks cannot restore data', () => {
  const f = fixture(); f.login(); assert.equal(f.watches.length, 0); f.load();
  assert.equal(f.watches.filter(row => row.active).length, 4);
  const old = f.watches.slice(); f.service.close(); assert.equal(f.watches.some(row => row.active), false);
  old.forEach(row => row.next({ malicious: { email: 'wrong@school.test', enabled: true } }));
  assert.deepEqual(f.service.getState().teachers, []);
  f.load(); f.service.setContext(session('admin'), admin('admin'), false);
  assert.equal(f.watches.some(row => row.active), false);
  f.login(); f.load(); f.service.setContext(session('second'), admin('second'), true);
  assert.equal(f.watches.some(row => row.active), false); assert.equal(f.service.getState().opened, false);
});
test('partial/error/offline reads fail closed before writes', async () => {
  const f = fixture(); f.login(); f.service.open(); f.emit('.info/connected', true); f.emit('profiles', { friend: { email: 'friend@school.test' } });
  await assert.rejects(f.service.command('approve', 'friend'), /not-ready/);
  f.watches.find(row => row.path === 'teacherApprovals').error({ code: 'PERMISSION_DENIED' });
  assert.equal(f.service.getState().status, 'error'); assert.equal(f.watches.some(row => row.active), false);
  f.load(); f.emit('.info/connected', false); await assert.rejects(f.service.command('approve', 'friend'), /offline/); assert.equal(f.writes.length, 0);
});
test('direct approval does not create an incomplete teacher request', async () => {
  const f = fixture(); f.login(); f.load(); f.service.search(' FRIEND@school.test ');
  assert.equal(f.service.getState().candidate.uid, 'friend'); await f.service.command('approve', 'friend');
  assert.deepEqual(f.writes[0], { 'teacherApprovals/friend': { enabled: true, approvedAt: { '.sv': 'timestamp' }, approvedBy: 'admin' } });
  assert.equal(f.service.getState().success, 'approve'); f.service.clearSearch(); assert.equal(f.service.getState().candidate, null);
});
test('review patches preserve original request fields', async () => {
  const f = fixture(); f.login(); f.load({ requests: { friend: { status: 'pending', school: 'School', subjects: 'Physics', requestedAt: 1 } } });
  await f.service.command('approve', 'friend');
  assert.equal(f.writes[0]['teacherRequests/friend/status'], 'approved'); assert.equal(f.writes[0]['teacherRequests/friend/reviewedBy'], 'admin');
  assert.equal(Object.keys(f.writes[0]).some(key => /school|subjects|requestedAt/.test(key)), false);
});
test('legacy boolean revocation changes only its approval; unsafe account paths are rejected', async () => {
  const f = fixture(); f.login(); f.load({ approvals: { friend: true } }); await f.service.command('revoke', 'friend');
  assert.deepEqual(f.writes[0], { 'teacherApprovals/friend': null });
  await assert.rejects(f.service.command('approve', 'friend'), /already-approved/);
  assert.throws(() => teacherApprovalPatch('approve', '../elsewhere', 'admin', 0, false), /invalid-account/);
});
test('missing accounts, wrong acting UID and self-revocation fail before any write', async () => {
  const f = fixture(); f.login(); f.load({ approvals: { admin: true } });
  await assert.rejects(f.service.command('approve', 'missing'), /account-missing/);
  await assert.rejects(f.service.command('approve', 'friend', 'impostor'), /session-changed/);
  await assert.rejects(f.service.command('revoke', 'admin'), /self-revoke/); assert.equal(f.writes.length, 0);
});
test('late writes cannot paint into another account or reopen a closed dialog', async () => {
  const f = fixture(); f.login(); f.load(); let finish;
  f.setUpdate(() => new Promise(resolve => { finish = resolve; }));
  const action = f.service.command('approve', 'friend'); f.service.setContext(session('second'), admin('second'), true);
  finish(); await assert.rejects(action, /session-changed/);
  assert.equal(f.service.getState().uid, 'second'); assert.equal(f.service.getState().success, ''); assert.equal(f.service.getState().error, '');
  f.load(); const second = f.service.command('approve', 'friend'); f.service.close(); finish();
  await assert.rejects(second, /session-changed/); assert.equal(f.service.getState().opened, false);
});
test('invalid and missing search results clear the previous selected identity', () => {
  const f = fixture(); f.login(); f.load(); f.service.search('friend@school.test'); assert.ok(f.service.getState().candidate);
  f.service.search('missing@school.test'); assert.equal(f.service.getState().candidate, null); assert.equal(f.service.getState().error, 'teachers/account-missing');
  f.service.search('bad'); assert.equal(f.service.getState().query, ''); assert.equal(f.service.getState().error, 'teachers/invalid-email');
});
