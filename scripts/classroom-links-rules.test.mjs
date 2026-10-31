import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { request, good, reset } from './fixtures/classroom-emulator.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { buildLinksRules, mergeLinksRules } from './build-classroom-links-rules.mjs';
const room = 'r_' + 'a'.repeat(32), other = 'r_' + 'b'.repeat(32), id = 'l_' + 'c'.repeat(32), own = 'l_' + 'd'.repeat(32), stamp = { '.sv': 'timestamp' };
const path = `classroomLinksV1/items/${room}/${id}`;
const link = (uid = 'student') => ({ version: 1, title: 'สมุดจด', url: 'https://example.com/note?a=1#page=2', authorUid: uid, authorName: uid, createdAt: stamp, updatedAt: stamp, revision: 1 });
const denied = async (uid, method, where, body) => assert.equal((await request(uid, method, where, body)).ok, false, `${uid} must not ${method} ${where}`);
test('classroom links Rules: real emulator with the full handoff Rules and separate identities', async t => {
  const full = JSON.parse(await readFile(new URL('../firebase/classroom-links.merged-draft.json', import.meta.url), 'utf8'));
  assert.deepEqual(full.rules.classroomLinksV1, buildLinksRules());
  const { classroomLinksV1, ...previous } = full.rules;
  assert.deepEqual(mergeLinksRules({ rules: previous }).rules, full.rules);
  assert.throws(() => mergeLinksRules(full));
  await reset(full);
  await good('teacher', 'PATCH', 'classroomV1', createRoomUpdates('teacher','Physics',{roomId:room,code:'ABCD2345'},stamp));
  await good('teacher-b', 'PATCH', 'classroomV1', createRoomUpdates('teacher-b','Chemistry',{roomId:other,code:'EFGH6789'},stamp));
  for (const uid of ['student','student-b']) await good(uid,'PATCH','classroomV1',joinRoomUpdates(uid,room,'ABCD2345',uid,stamp));
  await t.test('no global reads, outsider writes, cross-room access or forged authors', async () => {
    for (const uid of [null,'outsider','teacher-b']) {
      await denied(uid,'GET',`classroomLinksV1/items/${room}`); await denied(uid,'PUT',path,link(uid));
    }
    for (const uid of ['student','teacher']) {
      await denied(uid,'GET','classroomLinksV1'); await denied(uid,'GET','classroomLinksV1/items');
      await denied(uid,'GET',`classroomLinksV1/items/${other}`); await denied(uid,'PUT',`classroomLinksV1/items/${other}/${id}`,link(uid));
    }
    await denied('student','PUT',path,link('student-b'));
    await denied('student','PUT',path,{...link(),authorName:'teacher'});
  });
  await t.test('shape, IDs, timestamps, URL protocol and limits reject tampering', async () => {
    for (const change of [{url:'javascript:alert(1)'},{url:'data:text/html,Hi'},{url:'file:///tmp/a'},{url:'https://user:secret@example.com/'},{url:'https://example.com/a b'},{url:'https://example.com/a\nb'},{title:''},{title:'x'.repeat(181)},{url:'https://example.com/'+'x'.repeat(2048)},{revision:2},{createdAt:1},{updatedAt:1},{extra:true}])
      await denied('student','PUT',path,{...link(),...change});
    await denied('student','PUT',`classroomLinksV1/items/${room}/bad-id`,link());
    await good('student','PUT',path,link());
    assert.equal((await good('student-b','GET',path)).title,'สมุดจด');
    assert.equal(Object.keys(await good('teacher','GET',`classroomLinksV1/items/${room}`)).length,1);
  });
  await t.test('students edit/delete only their own; revisions and immutable attribution/date protect concurrent edits', async () => {
    const old = await good('student','GET',path);
    await denied('student-b','PUT',path,{...old,title:'Peer overwrite',revision:2,updatedAt:stamp});
    await denied('student-b','DELETE',path);
    for (const change of [{authorUid:'student-b'},{authorName:'Spoof'},{createdAt:stamp},{revision:1},{revision:3}])
      await denied('student','PUT',path,{...old,title:'Edit',revision:2,updatedAt:stamp,...change});
    await good('student','PUT',path,{...old,title:'Edited',revision:2,updatedAt:stamp});
    await denied('student','PUT',path,{...old,title:'Stale tab',revision:2,updatedAt:stamp});
    await good('student','PUT',`classroomLinksV1/items/${room}/${own}`,link());
    await good('student','DELETE',`classroomLinksV1/items/${room}/${own}`);
  });
  await t.test('approved room owner edits and deletes all links, keeping original author/date', async () => {
    const old = await good('teacher','GET',path);
    await good('teacher','PUT',path,{...old,title:'Teacher correction',revision:3,updatedAt:stamp});
    assert.equal((await good('student','GET',path)).authorUid,'student');
    await good('teacher','PUT',`classroomLinksV1/items/${room}/${own}`,link('teacher'));
    await good('teacher','DELETE',`classroomLinksV1/items/${room}/${own}`);
  });
  await t.test('membership removal and teacher revocation remove access immediately; legacy quiz progress stays usable', async () => {
    await good('EMULATOR_ADMIN','DELETE',`classroomV1/members/${room}/student`);
    await denied('student','GET',path); await denied('student','DELETE',path);
    await good('EMULATOR_ADMIN','DELETE','learningHub/teacherApprovals/teacher');
    await denied('teacher','GET',path); await denied('teacher','DELETE',path);
    await good('student-b','PUT','quizProgress/existing/student-b',{score:7});
    assert.equal((await good('student-b','GET','quizProgress/existing/student-b')).score,7);
    await good('EMULATOR_ADMIN','PUT','learningHub/teacherApprovals/teacher',true);
    await good('teacher','DELETE',path);
  });
});
