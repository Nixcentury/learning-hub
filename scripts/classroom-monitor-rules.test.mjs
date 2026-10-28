import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request } from './fixtures/classroom-emulator.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { buildMonitorRules } from './build-classroom-monitor-rules.mjs';
const rules = JSON.parse(await readFile(new URL('../firebase/classroom-phase1.merged-draft.json', import.meta.url), 'utf8'));
rules.rules.classroomMonitorV1 = buildMonitorRules();
const room = 'r_' + 'a'.repeat(32), session = 's_' + 'b'.repeat(32), nextSession = 's_' + 'c'.repeat(32), con = 'c_' + 'd'.repeat(32), noteId = 'n_' + 'e'.repeat(32);
const root = 'classroomMonitorV1', stamp = { '.sv': 'timestamp' }, at = kind => `${root}/${kind}/${room}/${session}`;
const metadata = id => ({ id, ownerUid: 'teacher', active: true, startedAt: stamp, endsAt: Date.now() + 3_600_000 });
const participation = () => ({ joined: true, joinedAt: stamp, updatedAt: stamp });
const connection = () => ({ connected: true, visible: true, changedAt: Date.now(), updatedAt: stamp, sequence: 1,
  location: { hash: '#physics/bank', titleTh: 'ใบงานแรง', titleEn: 'Forces', subjectId: 'physics' } });
const notice = () => ({ text: 'กลับมาทำใบงานครับ', senderUid: 'teacher', createdAt: stamp, deliveredAt: 0, ackAt: 0, reply: '', repliedAt: 0 });
const incident = suffix => ({ id: 'i_' + suffix.repeat(32), type: 'hidden', createdAt: stamp, resolvedAt: 0, ackAt: 0 });
async function deny(uid, method, path, value) { const response = await request(uid, method, path, value); assert.equal(response.ok, false, `Must deny ${uid} ${method} ${path}: ${JSON.stringify(response.value)}`); }
test('lesson monitoring Rules — actual RTDB emulator', async t => {
  await reset(rules);
  await good('teacher', 'PATCH', 'classroomV1', createRoomUpdates('teacher', 'ฟิสิกส์ ม.5/1', { roomId: room, code: 'ABCD2345' }, stamp));
  for (const uid of ['student', 'student-b']) await good(uid, 'PATCH', 'classroomV1', joinRoomUpdates(uid, room, 'ABCD2345', uid, stamp));
  await t.test('default off; members see only their session metadata; only approved owner can lock', async () => {
    assert.equal(await good('student', 'GET', `${root}/sessions/${room}`), null);
    for (const user of [null, 'outsider', 'teacher-b']) await deny(user, 'GET', `${root}/sessions/${room}`);
    for (const user of [null, 'student', 'teacher-b']) await deny(user, 'PUT', `${root}/sessions/${room}`, metadata(session));
    await deny('teacher', 'GET', root); await deny('student', 'GET', `${root}/sessions`);
    await good('teacher', 'PUT', `${root}/sessions/${room}`, metadata(session));
    assert.equal((await good('student', 'GET', `${root}/sessions/${room}`)).id, session);
  });
  await t.test('cannot replace an active lesson, extend its time, spoof owner or add arbitrary fields', async () => {
    await deny('teacher', 'PUT', `${root}/sessions/${room}`, metadata(nextSession));
    await deny('teacher', 'PATCH', `${root}/sessions/${room}`, { endsAt: Date.now() + 7_200_000 });
    await deny('teacher', 'PATCH', `${root}/sessions/${room}`, { ownerUid: 'student' });
    await deny('teacher', 'PATCH', `${root}/sessions/${room}`, { surprise: true });
  });
  await t.test('student writes own join and connection only in active lesson, never peers or before joining', async () => {
    await deny('student', 'PUT', `${at('connections')}/student/${con}`, connection());
    await good('student', 'PUT', `${at('participants')}/student`, participation());
    await good('student', 'PUT', `${at('connections')}/student/${con}`, connection());
    await deny('student', 'PUT', `${at('participants')}/student-b`, participation());
    await deny('student', 'PUT', `${at('connections')}/student-b/${con}`, connection());
    await deny('teacher', 'PUT', `${at('connections')}/student/${con}`, connection());
    const forged = connection(); forged.location.hash = 'https://example.test/tracker';
    await deny('student', 'PUT', `${at('connections')}/student/${con}`, forged);
    await deny('student', 'PATCH', `${at('connections')}/student/${con}`, { secret: 'unexpected' });
  });
  await t.test('teacher sees own room; students cannot read peers, list participants or broaden access', async () => {
    assert.ok((await good('teacher', 'GET', at('connections'))).student);
    assert.ok(await good('student', 'GET', `${at('connections')}/student`));
    for (const user of [null, 'student', 'teacher-b', 'outsider']) await deny(user, 'GET', at('connections'));
    await deny('student-b', 'GET', `${at('connections')}/student`);
    await deny('student', 'GET', at('participants'));
    await deny('teacher-b', 'GET', at('participants'));
  });
  await t.test('connection heartbeat and disconnect marker are valid; malformed keys and oversized labels are denied', async () => {
    await good('student', 'PATCH', `${at('connections')}/student/${con}`, { visible: false, changedAt: Date.now(), updatedAt: stamp, sequence: 2 });
    await good('student', 'PATCH', `${at('connections')}/student/${con}`, { connected: false, updatedAt: stamp });
    await deny('student', 'PUT', `${at('connections')}/student/arbitrary-key`, connection());
    const oversized = connection(); oversized.location.titleTh = 'x'.repeat(201);
    await deny('student', 'PUT', `${at('connections')}/student/${con}`, oversized);
    await good('student', 'DELETE', `${at('connections')}/student/${con}`);
  });
  await t.test('only teacher creates nudges; student only edits own delivery, ack and reply', async () => {
    await deny('student', 'PUT', `${at('notices')}/student/${noteId}`, notice());
    await deny('teacher-b', 'PUT', `${at('notices')}/student/${noteId}`, notice());
    await good('teacher', 'PUT', `${at('notices')}/student/${noteId}`, notice());
    await deny('student-b', 'GET', `${at('notices')}/student`);
    await deny('student', 'GET', at('notices'));
    await deny('student', 'PATCH', `${at('notices')}/student/${noteId}`, { text: 'forged teacher text' });
    await deny('student', 'PATCH', `${at('notices')}/student/${noteId}`, { senderUid: 'student' });
    await deny('teacher', 'PATCH', `${at('notices')}/student/${noteId}`, { ackAt: stamp });
    await good('student', 'PATCH', `${at('notices')}/student/${noteId}`, { deliveredAt: stamp });
    await good('student', 'PATCH', `${at('notices')}/student/${noteId}`, { ackAt: stamp, reply: 'ติดข้อ 2', repliedAt: stamp });
    assert.equal((await good('teacher', 'GET', `${at('notices')}/student/${noteId}`)).reply, 'ติดข้อ 2');
    await deny('student', 'PATCH', `${at('notices')}/student/${noteId}`, { ackAt: 0 });
    await deny('student', 'PATCH', `${at('notices')}/student/${noteId}`, { reply: 'x'.repeat(301), repliedAt: stamp });
  });
  await t.test('incident creation, ack, resolution and next episode preserve field ownership', async () => {
    const path = `${at('incidents')}/student`;
    await deny('student', 'PUT', path, incident('1'));
    await good('teacher', 'PUT', path, incident('1'));
    await deny('teacher', 'PUT', path, incident('2'));
    await deny('student', 'PATCH', path, { type: 'unreachable' });
    await deny('student', 'PATCH', path, { resolvedAt: stamp });
    await good('student', 'PATCH', path, { ackAt: stamp });
    await good('teacher', 'PATCH', path, { resolvedAt: stamp });
    await good('teacher', 'PUT', path, incident('2'));
    const second = await good('student', 'GET', path); assert.equal(second.id, incident('2').id); assert.equal(second.ackAt, 0);
  });
  await t.test('unlock immediately denies telemetry and messages; owner may delete live lesson data', async () => {
    await good('teacher', 'PATCH', `${root}/sessions/${room}`, { active: false });
    await deny('student', 'PUT', `${at('connections')}/student/${con}`, connection());
    await deny('student', 'PATCH', `${at('participants')}/student`, { joined: true, updatedAt: stamp });
    await deny('student', 'GET', `${at('notices')}/student`);
    await deny('teacher', 'PUT', `${at('notices')}/student/n_${'f'.repeat(32)}`, notice());
    await deny('student', 'DELETE', at('incidents'));
    for (const kind of ['connections','participants','notices','incidents']) await good('teacher', 'DELETE', at(kind));
    assert.equal(await good('EMULATOR_ADMIN', 'GET', at('connections')), null);
  });
  await t.test('new lesson cannot receive old-session writes and expired lesson stops writes server-side', async () => {
    await good('teacher', 'PUT', `${root}/sessions/${room}`, metadata(nextSession));
    await deny('student', 'PUT', `${at('participants')}/student`, participation());
    await good('EMULATOR_ADMIN', 'PATCH', `${root}/sessions/${room}`, { endsAt: Date.now() - 100 });
    await deny('student', 'PUT', `${root}/participants/${room}/${nextSession}/student`, participation());
  });
  await t.test('revoked owner loses control; legacy classroom membership stays intact', async () => {
    await good('EMULATOR_ADMIN', 'DELETE', 'learningHub/teacherApprovals/teacher');
    await deny('teacher', 'PUT', `${root}/sessions/${room}`, metadata(session));
    await deny('teacher', 'DELETE', `${root}/notices/${room}`);
    assert.equal((await good('student', 'GET', `classroomV1/rooms/${room}`)).ownerUid, 'teacher');
  });
});
