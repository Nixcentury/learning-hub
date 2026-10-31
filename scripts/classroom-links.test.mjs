import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanLinkFields } from '../public/shared/classroom-links-model.js';
import { createClassroomLinks } from '../js/classroom-links-service.js';
const rid = 'r_' + 'a'.repeat(32), other = 'r_' + 'b'.repeat(32), id = 'l_' + 'c'.repeat(32);
const record = { version: 1, title: 'สมุดจด', url: 'https://example.com/', authorUid: 'student', authorName: 'Student', createdAt: 1, updatedAt: 1, revision: 1 };
function fixture() {
  const watches = [], connections = [], calls = [], updates = [];
  let data = null, wait;
  const service = createClassroomLinks({ onChange: value => updates.push(value), io: {
    timestamp: () => 100,
    connected: fn => { const entry = { fn, stopped: false }; connections.push(entry); return () => { entry.stopped = true; }; },
    watch: (path, fn, error) => { const entry = { path, fn, error, stopped: false }; watches.push(entry); return () => { entry.stopped = true; }; },
    transaction: async (path, transform) => { calls.push(path); if (wait) await wait; const value = transform(data); if (value === undefined) return { committed: false }; data = value; return { committed: true }; },
  } });
  const open = (uid = 'student', room = rid, teacher = false) => service.setContext(
    { status: 'signed-in', user: { uid, displayName: uid } }, { uid, status: 'ready', systemRole: teacher ? 'teacher' : 'student', isTeacher: teacher },
    { uid, roomStatus: 'ready', selected: { id: room, ownerUid: 'teacher', membership: teacher ? 'owner' : 'student' } }, true);
  const emit = (path, value) => watches.filter(w => !w.stopped && w.path === path).forEach(w => w.fn(value));
  const ready = (items = {}) => {
    connections.at(-1).fn(true); emit(`@classroom/rooms/${service.getState().roomId}`, { ownerUid: 'teacher' });
    emit(`@classroom/members/${service.getState().roomId}/${service.getState().uid}`, { displayName: 'Student' }); emit(`items/${service.getState().roomId}`, items);
  };
  return { service, watches, connections, calls, updates, open, emit, ready, setData: value => { data = value; }, data: () => data, hold: value => { wait = value; } };
}
test('links accept complete http(s) URLs, preserve query/fragment and reject executable/credential/control URLs', () => {
  assert.deepEqual(cleanLinkFields({ title: '  สมุด   จด  ', url: 'https://example.com/notebook?q=ไทย#page=2' }), { title: 'สมุด จด', url: 'https://example.com/notebook?q=%E0%B9%84%E0%B8%97%E0%B8%A2#page=2' });
  for (const url of ['javascript:alert(1)', 'data:text/html,Hi', 'file:///tmp/test', '//example.com', 'https://user:secret@example.com', 'https://example.com/a\nb', 'https:example.com', 'https://example.com/' + 'a'.repeat(2048)])
    assert.throws(() => cleanLinkFields({ title: 'x', url }), /links\/invalid-url/);
  assert.throws(() => cleanLinkFields({ title: ' ', url: 'https://example.com' }), /links\/invalid-title/);
});
test('only the open room is watched; exit, account switch and revocation clear data and ignore stale callbacks', () => {
  const f = fixture(); f.open(); f.ready({ [id]: record }); assert.equal(f.service.getState().items.length, 1);
  const old = [...f.watches]; f.open('student', other); assert.ok(old.every(w => w.stopped)); assert.equal(f.service.getState().items.length, 0);
  old.at(-1).fn({ [id]: record }); assert.equal(f.service.getState().items.length, 0);
  f.ready(); const second = [...f.watches]; f.open('student-b', other); assert.ok(second.every(w => w.stopped));
  f.ready({ [id]: record }); f.emit(`@classroom/members/${other}/student-b`, null);
  assert.equal(f.service.getState().status, 'error'); assert.deepEqual(f.service.getState().items, []); assert.ok(f.watches.every(w => w.stopped));
  f.service.setContext(null, null, null, false); assert.equal(f.service.getState().uid, '');
});
test('creates use current account and membership name; edits preserve author/date; stale revisions and offline writes fail', async () => {
  const f = fixture(); f.open(); f.ready();
  await f.service.command('create', { roomId: rid, id, title: 'Notebook', url: 'https://example.com' }, 'student');
  assert.equal(f.data().authorUid, 'student'); assert.equal(f.data().authorName, 'Student'); assert.equal(f.data().revision, 1);
  const saved = { ...f.data() }; f.emit(`items/${rid}`, { [id]: saved });
  await f.service.command('edit', { roomId: rid, id, revision: 1, title: 'Edited', url: 'https://example.com/2' }, 'student');
  assert.equal(f.data().revision, 2); assert.equal(f.data().createdAt, saved.createdAt);
  await assert.rejects(f.service.command('edit', { roomId: rid, id, revision: 1, title: 'Old tab', url: 'https://example.com' }), /links\/conflict/);
  f.connections.at(-1).fn(false);
  await assert.rejects(f.service.command('delete', { roomId: rid, id, revision: 1 }), /links\/offline/);
  await assert.rejects(f.service.command('delete', { roomId: rid, id, revision: 1 }, 'student-b'), /links\/session-changed/);
});
test('students cannot edit peers; owner can edit/delete while preserving peer attribution', async () => {
  const f = fixture(); f.open('student-b'); f.ready({ [id]: record }); f.setData(record);
  await assert.rejects(f.service.command('delete', { roomId: rid, id, revision: 1 }), /links\/access-lost/);
  f.open('teacher', rid, true); f.ready({ [id]: record });
  await f.service.command('edit', { roomId: rid, id, revision: 1, title: 'Teacher fix', url: 'https://example.com' });
  assert.equal(f.data().authorUid, 'student'); assert.equal(f.data().authorName, 'Student');
  f.emit(`items/${rid}`, { [id]: f.data() });
  await f.service.command('delete', { roomId: rid, id, revision: 2 }); assert.equal(f.data(), null);
});
test('an early link snapshot does not enable writes before room and own membership are verified', async () => {
  const f = fixture(); f.open(); f.connections.at(-1).fn(true); f.emit(`items/${rid}`, {});
  assert.equal(f.service.getState().status, 'loading');
  await assert.rejects(f.service.command('create', { roomId: rid, id, title: 'A', url: 'https://example.com' }), /links\/session-changed/);
  f.emit(`@classroom/rooms/${rid}`, { ownerUid: 'teacher' }); assert.equal(f.service.getState().status, 'loading');
  f.emit(`@classroom/members/${rid}/student`, { displayName: 'Verified name' }); assert.equal(f.service.getState().status, 'ready');
  await f.service.command('create', { roomId: rid, id, title: 'A', url: 'https://example.com' }); assert.equal(f.data().authorName, 'Verified name');
});
test('switching room/account while a write waits cannot commit to the old context or report success', async () => {
  const f = fixture(); f.open(); f.ready(); let resolve; f.hold(new Promise(done => { resolve = done; }));
  const task = f.service.command('create', { roomId: rid, id, title: 'A', url: 'https://example.com' });
  f.open('student-b', other); f.ready(); resolve(); await assert.rejects(task, /links\/session-changed/); assert.equal(f.data(), null);
});
