import test from 'node:test';
import assert from 'node:assert/strict';
import { participantState, incidentNeeded, monitorLocation } from '../js/classroom-monitor-model.js';
import { createClassroomMonitor } from '../js/classroom-monitor-service.js';

const roomId = 'r_' + 'a'.repeat(32), otherRoomId = 'r_' + 'b'.repeat(32);
const auth = uid => ({ status: 'signed-in', user: { uid } });
const role = (uid, teacher = false) => ({ uid, status: 'ready', systemRole: teacher ? 'teacher' : 'student', isTeacher: teacher });
const clone = value => value === undefined ? undefined : structuredClone(value);
const flush = async () => { for (let i = 0; i < 12; i++) await new Promise(done => setImmediate(done)); };
function fixture() {
  let clock = 1_000_000, sequence = 0;
  const root = { classroomV1: { rooms: { [roomId]: { name: 'ฟิสิกส์ ม.5/1', ownerUid: 'teacher' }, [otherRoomId]: { name: 'ห้องอื่น', ownerUid: 'teacher-b' } },
    members: { [roomId]: { student: { displayName: 'Student One' }, 'student-b': { displayName: 'Student Two' } } },
    userRooms: { teacher: { [roomId]: 'owner' }, student: { [roomId]: 'student' }, 'student-b': { [roomId]: 'student' }, 'teacher-b': { [otherRoomId]: 'owner' } } }, classroomMonitorV1: {} };
  const listeners = [], clients = [], writes = [];
  const full = path => path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11) : 'classroomMonitorV1/' + path;
  const read = path => path.split('/').reduce((node, key) => node?.[key], root) ?? null;
  const resolve = value => value && typeof value === 'object' ? value['.sv'] === 'timestamp' ? clock : Array.isArray(value) ? value.map(resolve) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item)])) : value;
  function put(path, value) { const keys = path.split('/'), key = keys.pop(); let target = root; for (const part of keys) target = target[part] ||= {}; if (value === null) delete target[key]; else target[key] = resolve(clone(value)); }
  function notify() { for (const entry of listeners) if (entry.active) { const value = clone(read(entry.path)), next = JSON.stringify(value); if (next !== entry.previous) { entry.previous = next; queueMicrotask(() => { if (entry.active) entry.fn(value); }); } } }
  function client(uid, teacher = false) {
    const records = { failWrites: false, delayWrite: async () => {}, connected: true, disconnects: new Map() };
    const io = {
      watch(path, fn) { const entry = { active: true, path: full(path), fn }; listeners.push(entry); notify(); return () => { entry.active = false; }; },
      connected(fn) { records.connection = fn; queueMicrotask(() => fn(records.connected)); return () => { records.connection = null; }; },
      timestamp: () => ({ '.sv': 'timestamp' }), get: async path => clone(read(full(path))),
      async set(path, value) { if (records.failWrites) throw Object.assign(Error('denied'), { code: 'PERMISSION_DENIED' }); await records.delayWrite();
        writes.push({ uid, path, value: clone(value) }); put(full(path), value); notify(); },
      async remove(path) { put(full(path), null); notify(); },
      async update(patch) { if (records.failWrites) throw Object.assign(Error('denied'), { code: 'PERMISSION_DENIED' }); for (const [path, value] of Object.entries(patch)) put(full(path), value); notify(); },
      async transaction(path, transform) { if (records.failWrites) throw Object.assign(Error('denied'), { code: 'PERMISSION_DENIED' });
        const value = transform(clone(read(full(path)))); if (value === undefined) return { committed: false }; put(full(path), value); notify(); return { committed: true, value: clone(read(full(path))) }; },
      async disconnect(path, value) { records.disconnects.set(path, value); return { cancel: async () => records.disconnects.delete(path) }; },
    };
    let snapshot;
    const service = createClassroomMonitor({ io, now: () => clock, makeId: prefix => prefix + '_' + (++sequence).toString(16).padStart(32, '0'), onChange: value => { snapshot = value; } });
    service.setIdentity(auth(uid), role(uid, teacher));
    const result = { service, records, get state() { return snapshot; }, async disconnect() { records.connected = false; records.connection?.(false); for (const [path, value] of records.disconnects) put(full(path), value); notify(); await flush(); } };
    clients.push(result); return result;
  }
  return { client, root, read: path => read(full(path)), writes, advance: ms => { clock += ms; }, async tick() { for (const client of clients) client.service.tick(); await flush(); }, dispose() { for (const client of clients) client.service.dispose(); }, listeners, put(path, value) { put(full(path), value); notify(); } };
}

test('monitor aggregation distinguishes ordinary reading, hidden, stale, disconnected and multiple windows', () => {
  const now = 100_000, joined = { joined: true, updatedAt: now };
  const con = { connected: true, visible: true, changedAt: 1, updatedAt: now, location: { hash: '#physics/bank', titleTh: 'ฟิสิกส์' } };
  assert.equal(participantState(joined, { one: con }, now).status, 'visible');
  assert.equal(participantState(joined, { one: { ...con, visible: false }, two: con }, now).status, 'visible');
  const hidden = participantState(joined, { one: { ...con, visible: false, changedAt: now - 16_000 } }, now);
  assert.equal(incidentNeeded(hidden, now), 'hidden');
  assert.equal(incidentNeeded({ ...hidden, since: now - 1000 }, now), '');
  assert.equal(participantState(joined, { one: { ...con, updatedAt: 1 } }, now).status, 'stale');
  assert.equal(participantState(joined, { one: { ...con, visible: false }, two: { ...con, updatedAt: 1 } }, now).status, 'stale');
  assert.equal(participantState(joined, { one: { ...con, connected: false } }, now).status, 'disconnected');
  assert.equal(participantState(null, {}, now).status, 'not-joined');
  assert.equal(participantState({ joined: false }, {}, now).status, 'left');
});
test('monitor location strips controls, bounds labels and accepts only an internal hash', () => {
  assert.equal(monitorLocation({ hash: 'https://example.test/#physics', titleTh: '<script>\u0000' }).hash, '#overview');
  assert.equal(monitorLocation({ hash: '#physics/bank/chapter/c-123', titleTh: 'x'.repeat(300) }).titleTh.length, 200);
});
test('monitor starts off, explicit lesson join reports, unlock stops all detailed telemetry', async t => {
  const f = fixture(); t.after(() => f.dispose());
  const teacher = f.client('teacher', true), student = f.client('student'); await flush();
  student.service.setLocation({ hash: '#physics/bank', titleTh: 'ใบงานแรง', titleEn: 'Force worksheet' });
  student.service.setVisible(false); await flush(); assert.equal(f.writes.length, 0);
  teacher.service.selectRoom(roomId); await teacher.service.command('lock', { roomId }); await flush();
  assert.equal(student.state.lesson.joined, false); assert.equal(f.writes.length, 0);
  await student.service.command('join', { roomId }); await flush();
  assert.equal(student.state.lesson.joined, true); assert.equal(teacher.state.rows.find(row => row.uid === 'student').location.titleTh, 'ใบงานแรง');
  assert.equal(teacher.state.rows.find(row => row.uid === 'student-b').status, 'not-joined');
  const oldId = teacher.state.session.id;
  await teacher.service.command('unlock', { roomId }); await flush();
  assert.equal(student.state.lesson, null); assert.equal(teacher.state.session, null);
  const before = f.writes.length;
  student.service.setVisible(true); student.service.setLocation({ hash: '#chemistry/bank' }); f.advance(200_000); await f.tick();
  assert.equal(f.writes.length, before);
  assert.equal(f.read(`notices/${roomId}/${oldId}`), null);
});
test('hidden grace, return and acknowledgement are separate; steady hidden does not create duplicates', async t => {
  const f = fixture(); t.after(() => f.dispose()); const teacher = f.client('teacher', true), student = f.client('student'); await flush();
  teacher.service.selectRoom(roomId); await teacher.service.command('lock', { roomId }); await flush(); await student.service.command('join', { roomId }); await flush();
  student.service.setVisible(false); await flush(); f.advance(10_000); await f.tick(); assert.equal(student.state.selfIncident, null);
  f.advance(6000); await f.tick(); assert.equal(student.state.selfIncident.type, 'hidden');
  const id = student.state.selfIncident.id; await f.tick(); assert.equal(student.state.selfIncident.id, id);
  student.service.setVisible(true); await flush(); await f.tick();
  assert.ok(student.state.selfIncident.resolvedAt); assert.equal(student.state.selfIncident.ackAt, 0);
  await student.service.command('ack-incident', { roomId, id }); await flush(); assert.ok(teacher.state.rows[0].incident.ackAt);
  student.service.setVisible(false); await flush(); f.advance(16_000); await f.tick(); assert.notEqual(student.state.selfIncident.id, id);
});
test('a second visible tab prevents a hidden-page incident; disconnecting one tab preserves the other', async t => {
  const f = fixture(); t.after(() => f.dispose()); const teacher = f.client('teacher', true), one = f.client('student'); await flush();
  teacher.service.selectRoom(roomId); await teacher.service.command('lock', { roomId }); await flush(); await one.service.command('join', { roomId }); await flush();
  const two = f.client('student'); await flush(); one.service.setVisible(false); await flush();
  f.advance(16_000); await f.tick(); assert.equal(teacher.state.rows[0].status, 'visible'); assert.equal(teacher.state.rows[0].incident, null);
  await one.disconnect(); assert.equal(teacher.state.rows[0].status, 'visible'); assert.equal(teacher.state.rows[0].windows, 1);
  two.service.setVisible(false); await flush(); f.advance(16_000); await f.tick(); assert.equal(teacher.state.rows[0].incident.type, 'hidden');
});
test('manual messages need delivery/ack commands; short replies remain private and unlock clears them', async t => {
  const f = fixture(); t.after(() => f.dispose()); const teacher = f.client('teacher', true), student = f.client('student'), peer = f.client('student-b'); await flush();
  teacher.service.selectRoom(roomId); await teacher.service.command('lock', { roomId }); await flush(); await student.service.command('join', { roomId }); await flush();
  await teacher.service.command('nudge', { roomId, targetUid: 'student', text: '<b>กลับมาทำใบงาน</b>' }); await flush();
  const note = student.state.selfNotices[0]; assert.equal(note.ackAt, 0); assert.equal(note.deliveredAt, 0); assert.equal(peer.state.selfNotices.length, 0);
  await student.service.command('delivered', { roomId, id: note.id }); await flush(); assert.ok(student.state.selfNotices[0].deliveredAt); assert.equal(student.state.selfNotices[0].ackAt, 0);
  await student.service.command('reply', { roomId, id: note.id, text: 'ติดข้อ 2 ครับ' }); await flush(); assert.equal(teacher.state.rows[0].notices[0].reply, 'ติดข้อ 2 ครับ');
  await student.service.command('ack', { roomId, id: note.id }); await flush(); assert.ok(student.state.selfNotices[0].ackAt);
  await teacher.service.command('unlock', { roomId }); await flush(); assert.deepEqual(student.state.selfNotices, []);
});
test('expiry, account switching and old callbacks cannot resume a previous lesson', async t => {
  const f = fixture(); t.after(() => f.dispose()); const teacher = f.client('teacher', true), student = f.client('student'); await flush();
  teacher.service.selectRoom(roomId); await teacher.service.command('lock', { roomId, minutes: 5 }); await flush(); await student.service.command('join', { roomId }); await flush();
  const oldCallbacks = f.listeners.filter(entry => entry.path.includes('/student')).map(entry => entry.fn);
  student.service.setIdentity(auth('student-b'), role('student-b')); await flush();
  for (const fn of oldCallbacks) fn({ joined: true, updatedAt: 1 }); await flush();
  assert.equal(student.state.uid, 'student-b'); assert.equal(student.state.lesson.joined, false);
  f.advance(6 * 60_000); await f.tick(); assert.equal(student.state.lesson, null); assert.equal(teacher.state.session, null);
  const before = f.writes.length; student.service.setVisible(false); await f.tick(); assert.equal(f.writes.length, before);
});
test('offline/denied actions do not report phantom success; other-room teachers and students cannot lock', async t => {
  const f = fixture(); t.after(() => f.dispose()); const teacher = f.client('teacher', true), student = f.client('student'), other = f.client('teacher-b', true); await flush();
  await assert.rejects(student.service.command('lock', { roomId }), /owner-required/);
  await assert.rejects(other.service.command('lock', { roomId }), /invalid-room/);
  teacher.records.failWrites = true; await assert.rejects(teacher.service.command('lock', { roomId }), /denied/);
  assert.equal(teacher.state.session, null); assert.equal(teacher.state.busy, ''); assert.equal(teacher.state.error, 'PERMISSION_DENIED');
  teacher.records.failWrites = false; await teacher.disconnect(); await assert.rejects(teacher.service.command('lock', { roomId }), /offline/);
});
