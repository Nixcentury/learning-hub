import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request } from './fixtures/classroom-emulator.mjs';
import { teacherApprovalPatch } from '../public/shared/classroom-teacher-model.js';
import { createRoomUpdates } from '../js/classroom-model.js';
const rules = JSON.parse(await readFile(new URL('../firebase/classroom-roster.merged-draft.json', import.meta.url), 'utf8'));
const stamp = { '.sv': 'timestamp' };
async function deny(uid, method, path, body) { const result = await request(uid, method, path, body); assert.equal(result.ok, false, JSON.stringify({ uid, method, path, result })); }
test('unchanged full Rules enforce teacher approvals and account/room isolation', async t => {
  await reset(rules); await good('EMULATOR_ADMIN', 'PUT', 'learningHub/admins/admin', true);
  await good('EMULATOR_ADMIN', 'PUT', 'learningHub/profiles/friend', { displayName: 'Friend', email: 'friend@example.test', createdAt: 1, updatedAt: 1 });
  const roomA = 'r_' + 'a'.repeat(32), roomB = 'r_' + 'b'.repeat(32);
  await good('teacher', 'PATCH', 'classroomV1', createRoomUpdates('teacher', 'Room A', { roomId: roomA, code: 'ABCD2345' }, stamp));
  const preserved = { quizProgress: { 'old-quiz': { student: { score: 4, answers: [1, 2] } } }, classroomSubmissionsV1: { preserved: { score: 8, answers: [3] } } };
  for (const [root, value] of Object.entries(preserved)) await good('EMULATOR_ADMIN', 'PUT', root, value);
  await t.test('only admin lists profiles, approvals and requests', async () => {
    for (const path of ['learningHub/profiles', 'learningHub/teacherApprovals', 'learningHub/teacherRequests']) {
      await good('admin', 'GET', path); for (const uid of [null, 'student', 'teacher', 'teacher-b']) await deny(uid, 'GET', path);
    }
  });
  await t.test('ordinary accounts cannot promote another UID or write admin markers', async () => {
    for (const uid of [null, 'student', 'teacher', 'teacher-b']) {
      await deny(uid, 'PATCH', 'learningHub', teacherApprovalPatch('approve', 'friend', uid || 'guest', stamp, false));
      await deny(uid, 'PUT', 'learningHub/admins/' + (uid || 'guest'), true);
    }
    await deny('admin', 'PUT', 'learningHub/admins/friend', true);
  });
  await t.test('direct approval succeeds without inventing a request and grants only own-room creation', async () => {
    await good('admin', 'PATCH', 'learningHub', teacherApprovalPatch('approve', 'friend', 'admin', stamp, false));
    assert.equal((await good('friend', 'GET', 'learningHub/teacherApprovals/friend')).enabled, true);
    assert.equal(await good('admin', 'GET', 'learningHub/teacherRequests/friend'), null);
    await deny('student', 'GET', 'learningHub/teacherApprovals/friend');
    await good('friend', 'PATCH', 'classroomV1', createRoomUpdates('friend', 'Own Room', { roomId: roomB, code: 'EFGH6789' }, stamp));
    await deny('friend', 'GET', 'classroomV1/rooms/' + roomA); await deny('teacher', 'GET', 'classroomV1/rooms/' + roomB);
    await deny('friend', 'PATCH', 'classroomV1/rooms/' + roomA, { ownerUid: 'friend' });
  });
  await t.test('pending-request approval/revocation preserves original metadata', async () => {
    const pending = { status: 'pending', displayName: 'Applicant', email: 'applicant@example.test', school: 'School', subjects: 'Physics', note: '', requestedAt: 1, updatedAt: 1 };
    await good('applicant', 'PUT', 'learningHub/teacherRequests/applicant', pending);
    await good('admin', 'PATCH', 'learningHub', teacherApprovalPatch('approve', 'applicant', 'admin', stamp, true));
    const approved = await good('admin', 'GET', 'learningHub/teacherRequests/applicant');
    assert.equal(approved.school, 'School'); assert.equal(approved.subjects, 'Physics'); assert.equal(approved.requestedAt, 1); assert.equal(approved.status, 'approved');
    await good('admin', 'PATCH', 'learningHub', teacherApprovalPatch('revoke', 'applicant', 'admin', stamp, true));
    const revoked = await good('applicant', 'GET', 'learningHub/teacherRequests/applicant');
    assert.equal(revoked.status, 'revoked'); assert.equal(revoked.school, 'School');
    assert.equal(await good('applicant', 'GET', 'learningHub/teacherApprovals/applicant'), null);
  });
  await t.test('revocation blocks further creation and leaves rooms, scores and answers intact', async () => {
    await good('admin', 'PATCH', 'learningHub', teacherApprovalPatch('revoke', 'friend', 'admin', stamp, false));
    assert.equal(await good('friend', 'GET', 'learningHub/teacherApprovals/friend'), null);
    await deny('friend', 'PATCH', 'classroomV1', createRoomUpdates('friend', 'Denied Room', { roomId: 'r_' + 'c'.repeat(32), code: 'JKLM2345' }, stamp));
    assert.equal((await good('EMULATOR_ADMIN', 'GET', 'classroomV1/rooms/' + roomB)).ownerUid, 'friend');
    for (const [root, value] of Object.entries(preserved)) assert.deepEqual(await good('EMULATOR_ADMIN', 'GET', root), value);
  });
});
