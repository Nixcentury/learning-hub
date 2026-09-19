import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request } from './fixtures/classroom-emulator.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
const rules = JSON.parse(await readFile(new URL('../firebase/classroom-phase1.merged-draft.json', import.meta.url), 'utf8'));
const id = 'r_' + 'a'.repeat(32), idB = 'r_' + 'b'.repeat(32), code = 'ABCD2345', codeB = 'EFGH6789';
const root = 'classroomV1';
const room = (uid = 'teacher', roomId = id, joinCode = code) => createRoomUpdates(uid, 'ฟิสิกส์ ม.5/1', { roomId, code: joinCode }, { '.sv': 'timestamp' });
const join = (uid, roomId = id, joinCode = code) => joinRoomUpdates(uid, roomId, joinCode, 'Student ' + uid, { '.sv': 'timestamp' });
async function denied(uid, method, path, body) {
  const result = await request(uid, method, path, body);
  assert.equal(result.ok, false, `Must deny ${uid} ${method} ${path}`);
  assert.equal(result.status, 401, JSON.stringify(result));
}
test('Phase 1 Rules — actual Firebase RTDB emulator, no production traffic', async t => {
  await reset(rules);
  await t.test('guest cannot read codes, create rooms, join, or list data', async () => {
    for (const path of [root, root + '/rooms', root + '/joinCodes/' + code, root + '/userRooms/student']) await denied(null, 'GET', path);
    await denied(null, 'PATCH', root, room());
    await denied(null, 'PATCH', root, join('student'));
  });
  await t.test('student cannot create a room or self-promote through a membership', async () => {
    await denied('student', 'PATCH', root, room('student'));
    await denied('student', 'PUT', root + '/userRooms/student/' + id, 'owner');
    await denied('student', 'PUT', 'learningHub/teacherApprovals/student', true);
  });
  await t.test('atomic teacher creation creates canonical room, unique code and owner index', async () => {
    await good('teacher', 'PATCH', root, room());
    assert.equal((await good('teacher', 'GET', root + '/rooms/' + id)).ownerUid, 'teacher');
    assert.equal(await good('teacher', 'GET', root + '/userRooms/teacher/' + id), 'owner');
    assert.equal((await good('student', 'GET', root + '/joinCodes/' + code)).roomId, id);
    await denied('teacher', 'GET', root + '/rooms');
    await denied('teacher', 'GET', root + '/joinCodes');
    await denied('student', 'GET', root + '/rooms/' + id);
  });
  await t.test('partial creation, takeover, code collision, edits and deletion are denied', async () => {
    await denied('teacher-b', 'PATCH', root, room('teacher-b', idB, code));
    assert.equal(await good('EMULATOR_ADMIN', 'GET', root + '/rooms/' + idB), null);
    await denied('teacher', 'PUT', root + '/rooms/' + idB, room('teacher', idB, codeB)['rooms/' + idB]);
    await denied('teacher', 'PUT', root + '/joinCodes/' + codeB, { roomId: idB, ownerUid: 'teacher' });
    await denied('teacher', 'PATCH', root + '/rooms/' + id, { name: 'Renamed' });
    await denied('teacher-b', 'PATCH', root + '/rooms/' + id, { ownerUid: 'teacher-b' });
    await denied('teacher', 'DELETE', root + '/rooms/' + id);
    await denied('teacher', 'DELETE', root + '/joinCodes/' + code);
  });
  await t.test('wrong code, invented room and standalone index/member writes are denied', async () => {
    await denied('student', 'PATCH', root, join('student', id, codeB));
    await denied('student', 'PATCH', root, join('student', idB, codeB));
    await denied('student', 'PUT', root + '/userRooms/student/' + id, 'student');
    await denied('student', 'PUT', root + '/members/' + id + '/student', join('student')['members/' + id + '/student']);
    assert.equal(await good('EMULATOR_ADMIN', 'GET', root + '/members/' + id), null);
  });
  await t.test('atomic join persists both sides; own room visible but peers/roster denied', async () => {
    await good('student', 'PATCH', root, join('student'));
    await good('student-b', 'PATCH', root, join('student-b'));
    assert.equal((await good('student', 'GET', root + '/rooms/' + id)).name, 'ฟิสิกส์ ม.5/1');
    assert.equal((await good('student', 'GET', root + '/userRooms/student'))[id], 'student');
    assert.equal(Object.keys(await good('teacher', 'GET', root + '/members/' + id)).length, 2);
    await denied('student', 'GET', root + '/members/' + id);
    await denied('student', 'GET', root + '/members/' + id + '/student-b');
    await denied('student', 'GET', root + '/userRooms/student-b');
    await denied('teacher-b', 'GET', root + '/members/' + id);
    await denied('teacher-b', 'GET', root + '/rooms/' + id);
    await denied('teacher', 'GET', root + '/userRooms/student');
  });
  await t.test('rejoining is idempotent; cannot rewrite name/time or remove membership', async () => {
    const previous = await good('student', 'GET', root + '/members/' + id + '/student');
    await good('student', 'PATCH', root, joinRoomUpdates('student', id, code, 'ignored', { '.sv': 'timestamp' }, previous));
    assert.deepEqual(await good('student', 'GET', root + '/members/' + id + '/student'), previous);
    await denied('student', 'PATCH', root + '/members/' + id + '/student', { displayName: 'Different' });
    await denied('student', 'DELETE', root + '/members/' + id + '/student');
    await denied('student', 'DELETE', root + '/userRooms/student/' + id);
    await denied('teacher', 'PATCH', root, join('student-c'));
    await denied('student', 'PATCH', root, join('student-c'));
  });
  await t.test('second teacher can create own room but no global access; owner does not join self', async () => {
    await good('teacher-b', 'PATCH', root, room('teacher-b', idB, codeB));
    await denied('teacher', 'GET', root + '/rooms/' + idB);
    await denied('teacher', 'PATCH', root, join('teacher'));
    await good('teacher-b', 'PATCH', root, join('teacher-b'));
    await denied('teacher-b', 'GET', root + '/members/' + id);
  });
  await t.test('reject extra fields, oversized values and fabricated times atomically', async () => {
    const cases = [
      patch => { patch['rooms/' + 'r_' + 'c'.repeat(32)].extra = true; },
      patch => { patch['rooms/' + 'r_' + 'c'.repeat(32)].name = 'x'.repeat(101); },
      patch => { patch['rooms/' + 'r_' + 'c'.repeat(32)].createdAt = Date.now() + 999999; },
      patch => { patch['rooms/' + 'r_' + 'c'.repeat(32)].createdAt = 1; },
    ];
    for (const change of cases) { const patch = room('teacher', 'r_' + 'c'.repeat(32), 'JKLM2345'); change(patch); await denied('teacher', 'PATCH', root, patch); }
    const bad = join('student-c'); bad['members/' + id + '/student-c'].role = 'teacher';
    await denied('student-c', 'PATCH', root, bad);
    const backdated = join('student-c'); backdated['members/' + id + '/student-c'].joinedAt = 1;
    await denied('student-c', 'PATCH', root, backdated);
    assert.equal(await good('EMULATOR_ADMIN', 'GET', root + '/userRooms/student-c'), null);
    await denied('student', 'PUT', root + '/unexpected', { private: false });
  });
  await t.test('revoked teacher cannot create or read owner-only roster; legacy branches unchanged', async () => {
    await good('EMULATOR_ADMIN', 'DELETE', 'learningHub/teacherApprovals/teacher');
    await denied('teacher', 'GET', root + '/members/' + id);
    await denied('teacher', 'GET', root + '/rooms/' + id);
    await denied('teacher', 'PATCH', root, room('teacher', 'r_' + 'd'.repeat(32), 'NPQR2345'));
    await good('student', 'PUT', 'quizProgress/legacy-quiz/student', { score: 3 });
    assert.equal((await good('student', 'GET', 'quizProgress/legacy-quiz/student')).score, 3);
    await denied('student-b', 'GET', 'quizProgress/legacy-quiz/student');
  });
});
