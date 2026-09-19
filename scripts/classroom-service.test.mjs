import test from 'node:test';
import assert from 'node:assert/strict';
import { createClassroomService } from '../js/classroom-service.js';
import { cleanRoomName, cleanJoinCode, newRoomKey, codePattern, roomIdPattern } from '../js/classroom-model.js';
const id = 'r_' + 'a'.repeat(32), secondId = 'r_' + 'b'.repeat(32), code = 'ABCD2345';
const room = { name: 'Physics', ownerUid: 'teacher', joinCode: code, createdAt: 1 };
const tick = () => new Promise(resolve => setImmediate(resolve));
function context(uid, teacher = false) {
  return [{ status: 'signed-in', user: { uid, displayName: 'Name ' + uid } }, { uid, status: 'ready', systemRole: teacher ? 'teacher' : 'student', isTeacher: teacher }];
}
function fixture(t) {
  const db = {}, watchers = [], writes = [], reads = [], snapshots = [];
  const io = {
    async get(path) { reads.push(path); return structuredClone(db[path] ?? null); },
    watch(path, ok, error) { const listener = { path, ok, error, active: true }; watchers.push(listener); queueMicrotask(() => { if (listener.active) ok(db[path] ?? null); }); return () => { listener.active = false; }; },
    async update(patch) { writes.push(patch); Object.assign(db, structuredClone(patch)); },
    timestamp: () => 123,
  };
  const service = createClassroomService({ io, onChange: value => snapshots.push(value), makeKey: () => ({ roomId: id, code }) });
  t.after(() => service.dispose());
  return { service, db, io, writes, reads, snapshots, watchers };
}
test('room names and codes normalize; unpredictable keys have stable format', () => {
  assert.equal(cleanRoomName('  ฟิสิกส์   ม.5 '), 'ฟิสิกส์ ม.5');
  assert.equal(cleanJoinCode(' abcd-2345 '), code);
  for (const value of ['', 'I0O12345', 'ABCDEFG', 'x'.repeat(100)]) assert.throws(() => cleanJoinCode(value));
  assert.throws(() => cleanRoomName(' ')); assert.throws(() => cleanRoomName('x'.repeat(101)));
  const keys = Array.from({ length: 100 }, newRoomKey);
  assert.equal(new Set(keys.map(key => key.roomId)).size, 100);
  assert.ok(keys.every(key => roomIdPattern.test(key.roomId) && codePattern.test(key.code)));
});
test('inactive, guest, mismatched roles and students cannot create rooms', async t => {
  const f = fixture(t);
  await assert.rejects(f.service.command('create', { name: 'Class' }, 'teacher'));
  f.service.setContext(...context('student'), true); await tick();
  await assert.rejects(f.service.command('create', { name: 'Class' }, 'student'), { code: 'classroom/teacher-required' });
  await assert.rejects(f.service.command('join', { code }, 'different'), { code: 'classroom/session-changed' });
  f.service.setContext(context('student')[0], context('teacher', true)[1], true);
  assert.equal(f.service.getState().uid, null); assert.equal(f.writes.length, 0);
});
test('teacher create is one atomic write and owner detail subscribes to roster', async t => {
  const f = fixture(t); f.service.setContext(...context('teacher', true), true); await tick();
  const result = await f.service.command('create', { name: ' Physics ' }, 'teacher'); await tick();
  assert.equal(result.roomId, id); assert.equal(f.writes.length, 1);
  assert.deepEqual(Object.keys(f.writes[0]), ['rooms/' + id, 'joinCodes/' + code, 'userRooms/teacher/' + id]);
  assert.equal(f.service.getState().selected.name, 'Physics');
  assert.ok(f.watchers.some(w => w.path === 'members/' + id && w.active));
});
test('no success before server acknowledgement and duplicate clicks are blocked', async t => {
  const f = fixture(t); let finish;
  f.io.update = patch => { f.writes.push(patch); return new Promise(resolve => { finish = () => { Object.assign(f.db, patch); resolve(); }; }); };
  f.service.setContext(...context('teacher', true), true); await tick();
  let done = false; const operation = f.service.command('create', { name: 'Physics' }, 'teacher').then(() => { done = true; }); await tick();
  assert.equal(done, false); assert.equal(f.service.getState().busy, 'create');
  assert.equal(f.service.getState().selected, null);
  await assert.rejects(f.service.command('create', { name: 'Physics' }, 'teacher'), { code: 'classroom/busy' });
  finish(); await operation; assert.equal(f.writes.length, 1);
});
test('denied write reports error, clears busy, retains retry key and does not invent a room', async t => {
  const f = fixture(t); const update = f.io.update;
  f.io.update = async () => { throw Object.assign(Error('denied'), { code: 'PERMISSION_DENIED' }); };
  f.service.setContext(...context('teacher', true), true); await tick();
  await assert.rejects(f.service.command('create', { name: 'Physics' }, 'teacher'), { code: 'PERMISSION_DENIED' });
  assert.equal(f.service.getState().busy, ''); assert.equal(f.service.getState().selected, null);
  f.io.update = update;
  assert.equal((await f.service.command('create', { name: 'Physics' }, 'teacher')).roomId, id);
});
test('confirmed creation after lost acknowledgement opens the same room on retry', async t => {
  const f = fixture(t); let writes = 0;
  f.io.update = async patch => { ++writes; Object.assign(f.db, patch); throw Error('Connection lost'); };
  f.service.setContext(...context('teacher', true), true); await tick();
  await assert.rejects(f.service.command('create', { name: 'Physics' }, 'teacher'));
  assert.equal((await f.service.command('create', { name: 'Physics' }, 'teacher')).roomId, id);
  assert.equal(writes, 1);
});
test('student joins atomically; repeat join preserves original name/time; never reads peers', async t => {
  const f = fixture(t); f.db['joinCodes/' + code] = { roomId: id, ownerUid: 'teacher' }; f.db['rooms/' + id] = room;
  f.service.setContext(...context('student'), true); await tick();
  await f.service.command('join', { code: code.toLowerCase() }, 'student');
  const previous = structuredClone(f.db['members/' + id + '/student']);
  await f.service.command('join', { code }, 'student');
  assert.deepEqual(f.db['members/' + id + '/student'], previous);
  assert.deepEqual(f.service.getState().members, []);
  assert.equal(f.service.getState().selected.membership, 'student');
  assert.ok(!f.reads.includes('members/' + id)); assert.ok(!f.watchers.some(w => w.path === 'members/' + id));
});
test('concurrent duplicate join recovers the first committed membership', async t => {
  const f = fixture(t); f.db['joinCodes/' + code] = { roomId: id, ownerUid: 'teacher' }; f.db['rooms/' + id] = room;
  const previous = { displayName: 'Original', joinedAt: 100, joinCode: code }; const update = f.io.update; let first = true;
  f.io.update = async patch => { if (first) { first = false; f.db['members/' + id + '/student'] = previous; throw Error('racing write'); } await update(patch); };
  f.service.setContext(...context('student'), true); await tick();
  await f.service.command('join', { code }, 'student');
  assert.deepEqual(f.db['members/' + id + '/student'], previous);
});
test('wrong code never writes; teacher joining own code does not add self to roster', async t => {
  const f = fixture(t); f.service.setContext(...context('teacher', true), true); await tick();
  await assert.rejects(f.service.command('join', { code }, 'teacher'), { code: 'classroom/code-not-found' });
  f.db['joinCodes/' + code] = { roomId: id, ownerUid: 'teacher' }; f.db['rooms/' + id] = room;
  await f.service.command('join', { code }, 'teacher'); assert.equal(f.writes.length, 0);
});
test('account switch clears roster and ignores late callbacks/results', async t => {
  const f = fixture(t); f.db['rooms/' + id] = room;
  f.service.setContext(...context('teacher', true), true); await tick(); await f.service.command('open', { roomId: id }, 'teacher'); await tick();
  const roster = f.watchers.find(w => w.path === 'members/' + id);
  roster.ok({ student: { displayName: 'Private student', joinedAt: 1 } });
  assert.equal(f.service.getState().members.length, 1);
  f.service.setContext(...context('student-b'), true);
  roster.ok({ student: { displayName: 'Private student', joinedAt: 1 } }); await tick();
  assert.equal(f.service.getState().uid, 'student-b'); assert.deepEqual(f.service.getState().members, []); assert.equal(f.service.getState().selected, null);
});
test('UID change while looking up a code aborts before any write', async t => {
  const f = fixture(t); let finish;
  f.io.get = path => path.startsWith('joinCodes/') ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(null);
  f.service.setContext(...context('student'), true); await tick();
  const request = f.service.command('join', { code }, 'student');
  f.service.setContext(...context('student-b'), true); finish({ roomId: id, ownerUid: 'teacher' });
  await assert.rejects(request, { code: 'classroom/session-changed' }); assert.equal(f.writes.length, 0);
});
test('navigation back to Classroom reloads own rooms; malformed/denied list is not empty success', async t => {
  const f = fixture(t); f.db['userRooms/student'] = { [id]: 'student' }; f.db['rooms/' + id] = room;
  f.service.setContext(...context('student'), true); await tick(); assert.equal(f.service.getState().rooms.length, 1);
  f.service.setContext(...context('student'), false); assert.equal(f.service.getState().status, 'inactive');
  assert.ok(f.watchers.every(w => !w.active));
  f.service.setContext(...context('student'), true); await tick(); assert.equal(f.service.getState().rooms.length, 1);
  const listener = f.watchers.filter(w => w.path === 'userRooms/student').at(-1);
  listener.error(Object.assign(Error('denied'), { code: 'PERMISSION_DENIED' }));
  assert.equal(f.service.getState().status, 'error'); assert.deepEqual(f.service.getState().rooms, []);
  listener.ok({ [secondId]: 'not-valid' }); await tick(); assert.equal(f.service.getState().status, 'error');
});
