import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request } from './fixtures/classroom-emulator.mjs';
import { buildAssignmentRules } from './build-classroom-assignment-rules.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
const rid = 'r_' + 'a'.repeat(32), aid = 'a_' + 'b'.repeat(32), second = 'a_' + 'c'.repeat(32), stamp = { '.sv': 'timestamp' };
const root = 'classroomAssignmentsV1', draftPath = `${root}/drafts/${rid}/${aid}`, itemPath = `${root}/items/${rid}/${aid}`;
const record = (status = 'draft') => ({ version: 1, ownerUid: 'teacher', title: 'Wave homework', instructions: '', dueAt: 0, targetHash: '#content/wave-quiz', contentId: 'wave-quiz', quizTitleTh: 'คลื่น', quizTitleEn: 'Waves', status, createdAt: stamp, updatedAt: stamp, publishedAt: status === 'draft' ? 0 : stamp, revision: 1 });
async function denied(uid, method, path, value) { assert.equal((await request(uid, method, path, value)).ok, false, `${uid} must not ${method} ${path}`); }
test('assignment Rules — real local RTDB emulator, no production traffic', async t => {
  const rules = JSON.parse(await readFile(new URL('../firebase/classroom-phase1.merged-draft.json', import.meta.url), 'utf8'));
  rules.rules.classroomAssignmentsV1 = buildAssignmentRules(); await reset(rules);
  await good('teacher', 'PATCH', 'classroomV1', createRoomUpdates('teacher', 'Physics', { roomId: rid, code: 'ABCD2345' }, stamp));
  for (const uid of ['student','student-b']) await good(uid, 'PATCH', 'classroomV1', joinRoomUpdates(uid, rid, 'ABCD2345', uid, stamp));
  await t.test('only approved room owner creates drafts; drafts cannot be listed or read by students, outsiders, guests or other teachers', async () => {
    for (const uid of [null, 'student', 'teacher-b', 'outsider']) await denied(uid, 'PUT', draftPath, record());
    await good('teacher', 'PUT', draftPath, record());
    for (const uid of [null, 'student', 'student-b', 'teacher-b', 'outsider']) {
      await denied(uid, 'GET', draftPath); await denied(uid, 'GET', `${root}/drafts/${rid}`);
    }
    assert.equal((await good('teacher', 'GET', draftPath)).title, 'Wave homework');
  });
  await t.test('publish is atomic and members can list only published/closed work; no global listing', async () => {
    const draft = await good('teacher', 'GET', draftPath);
    const published = { ...draft, status: 'published', publishedAt: stamp, updatedAt: stamp, revision: 2 };
    await denied('teacher', 'PUT', itemPath, published); // private draft must move atomically
    await good('teacher', 'PATCH', root, { [`items/${rid}/${aid}`]: published, [`drafts/${rid}/${aid}`]: null });
    assert.equal(await good('teacher', 'GET', draftPath), null);
    assert.equal((await good('student', 'GET', `${root}/items/${rid}`))[aid].status, 'published');
    for (const uid of [null, 'teacher-b', 'outsider']) await denied(uid, 'GET', itemPath);
    await denied('student', 'GET', root); await denied('student', 'GET', `${root}/items`);
  });
  await t.test('students cannot edit, close, delete or forge work; timestamps, extra fields and invalid score-like payloads are denied', async () => {
    const item = await good('teacher', 'GET', itemPath);
    for (const uid of ['student','teacher-b','outsider']) await denied(uid, 'PUT', itemPath, { ...item, title: 'Takeover', updatedAt: stamp, revision: 3 });
    await denied('teacher', 'DELETE', itemPath);
    for (const change of [{ grade: 100 }, { dueAt: -1 }, { dueAt: 1.5 }, { updatedAt: 1 }, { ownerUid: 'student' }, { targetHash: 'https://evil.test/' }])
      await denied('teacher', 'PUT', itemPath, { ...item, updatedAt: stamp, revision: 3, ...change });
  });
  await t.test('published targets and creation IDs are immutable; revisions prevent stale-tab overwrites', async () => {
    const item = await good('teacher', 'GET', itemPath);
    await denied('teacher', 'PUT', itemPath, { ...item, title: 'Stale', updatedAt: stamp });
    await denied('teacher', 'PUT', itemPath, { ...item, targetHash: '#content/other', revision: 3, updatedAt: stamp });
    await good('teacher', 'PUT', itemPath, { ...item, title: 'Updated', revision: 3, updatedAt: stamp });
    await denied('teacher', 'PUT', itemPath, { ...item, title: 'Racing', revision: 3, updatedAt: stamp });
    await denied('teacher', 'PUT', draftPath, record());
  });
  await t.test('read receipts are first-read timestamps for self only; peers and teacher cannot spoof them', async () => {
    const seen = `${root}/seen/${rid}/student/${aid}`;
    await good('student', 'PUT', seen, stamp);
    const time = await good('student', 'GET', seen);
    assert.equal(typeof time, 'number');
    await good('student', 'PUT', seen, time);
    await denied('student', 'PUT', seen, time + 1);
    for (const uid of [null, 'teacher', 'student-b', 'outsider']) { await denied(uid, 'PUT', seen, stamp); await denied(uid, 'GET', seen); }
    await denied('student', 'PUT', `${root}/seen/${rid}/student/${second}`, stamp);
    await denied('student', 'DELETE', seen);
  });
  await t.test('prerequisites are optional, owner-only, earlier published work in the same room, and can be cleared', async () => {
    const gated='a_'+'d'.repeat(32),gatedPath=`${root}/items/${rid}/${gated}`;
    await good('teacher','PUT',gatedPath,{...record('published'),requiresAssignmentId:aid});
    const before=await good('teacher','GET',gatedPath);
    for(const requiresAssignmentId of [gated,'a_'+'9'.repeat(32),'bad-id'])await denied('teacher','PUT',gatedPath,{...before,requiresAssignmentId,revision:2,updatedAt:stamp});
    const prior=await good('teacher','GET',itemPath);
    await denied('teacher','PUT',itemPath,{...prior,requiresAssignmentId:gated,revision:prior.revision+1,updatedAt:stamp});
    await denied('student','PUT',gatedPath,{...before,revision:2,updatedAt:stamp});
    const otherRoom='r_'+'e'.repeat(32),otherWork='a_'+'f'.repeat(32);
    await good('teacher','PATCH','classroomV1',createRoomUpdates('teacher','Other room',{roomId:otherRoom,code:'EFGH2345'},stamp));
    await good('teacher','PUT',`${root}/items/${otherRoom}/${otherWork}`,record('published'));
    await denied('teacher','PUT',gatedPath,{...before,requiresAssignmentId:otherWork,revision:2,updatedAt:stamp});
    await good('teacher','PUT',gatedPath,{...before,requiresAssignmentId:null,revision:2,updatedAt:stamp});
    assert.equal((await good('student','GET',gatedPath)).requiresAssignmentId,undefined);
  });
  await t.test('closing retains readable instructions and forbids reopening; revocation removes write authority', async () => {
    const item = await good('teacher', 'GET', itemPath);
    await good('teacher', 'PUT', itemPath, { ...item, status: 'closed', updatedAt: stamp, revision: 4 });
    assert.equal((await good('student', 'GET', itemPath)).status, 'closed');
    const closed = await good('teacher', 'GET', itemPath);
    await denied('teacher', 'PUT', itemPath, { ...closed, status: 'published', updatedAt: stamp, revision: 5 });
    await good('EMULATOR_ADMIN', 'DELETE', 'learningHub/teacherApprovals/teacher');
    await denied('teacher', 'PUT', `${root}/drafts/${rid}/${second}`, record());
    assert.equal((await good('student', 'GET', `classroomV1/rooms/${rid}`)).name, 'Physics');
  });
});
