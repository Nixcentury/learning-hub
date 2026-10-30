import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request } from './fixtures/classroom-emulator.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { buildAssignmentRules } from './build-classroom-assignment-rules.mjs';
import { buildSubmissionRules } from './build-classroom-submission-rules.mjs';
const room='r_'+'a'.repeat(32), otherRoom='r_'+'b'.repeat(32), aid='a_'+'c'.repeat(32), second='a_'+'d'.repeat(32), revision='e'.repeat(64), stamp={'.sv':'timestamp'};
const path='classroomSubmissionsV1', q=`${path}/quizzes/${room}/${aid}`, d=`${path}/attempts/${room}/${aid}/student`, r=`${path}/results/${room}/${aid}/student`;
const assignment=()=>({version:1,ownerUid:'teacher',title:'Waves',instructions:'',dueAt:0,targetHash:'#content/waves-quiz',contentId:'waves-quiz',quizTitleTh:'คลื่น',quizTitleEn:'Waves',status:'published',createdAt:stamp,updatedAt:stamp,publishedAt:stamp,revision:1});
const quiz=()=>({version:1,contentId:'waves-quiz',targetHash:'#content/waves-quiz',revision,html:'<article data-learning-activity-content></article>',questionCount:3,createdAt:stamp});
const draft=()=>({version:1,contentId:'waves-quiz',quizRevision:revision,progressJson:'{"answers":{}}',createdAt:stamp,updatedAt:stamp,revision:1});
const result=()=>({version:1,contentId:'waves-quiz',quizRevision:revision,answersJson:'{"one":"a"}',giveUpsJson:'{}',elapsedMs:1000,dueAt:0,submissionId:'f'.repeat(32),submittedAt:stamp});
async function denied(uid,method,where,value){assert.equal((await request(uid,method,where,value)).ok,false,`${uid} must not ${method} ${where}`);}
test('homework submission Rules — real RTDB emulator and isolated synthetic identities',async t=>{
  const rules=JSON.parse(await readFile(new URL('../firebase/classroom-phase1.merged-draft.json',import.meta.url),'utf8'));
  assert.deepEqual(JSON.parse(await readFile(new URL('../firebase/classroom-submission.rules.json',import.meta.url),'utf8')).rules.classroomSubmissionsV1,buildSubmissionRules());
  rules.rules.classroomAssignmentsV1=buildAssignmentRules();rules.rules.classroomSubmissionsV1=buildSubmissionRules();await reset(rules);
  await good('teacher','PATCH','classroomV1',createRoomUpdates('teacher','Physics',{roomId:room,code:'ABCD2345'},stamp));
  await good('teacher-b','PATCH','classroomV1',createRoomUpdates('teacher-b','Other',{roomId:otherRoom,code:'EFGH6789'},stamp));
  for(const uid of ['student','student-b'])await good(uid,'PATCH','classroomV1',joinRoomUpdates(uid,room,'ABCD2345',uid,stamp));
  await good('teacher','PUT',`classroomAssignmentsV1/items/${room}/${aid}`,assignment());
  await good('teacher','PUT',`classroomAssignmentsV1/items/${room}/${second}`,assignment());
  await t.test('only approved owner pins a published assignment; snapshot binding and shape are validated',async()=>{
    for(const uid of [null,'student','student-b','teacher-b','outsider'])await denied(uid,'PUT',q,quiz());
    for(const change of [{contentId:'wrong'},{targetHash:'#content/wrong'},{revision:'wrong'},{questionCount:0},{questionCount:1.5},{createdAt:1},{extra:true},{html:'x'.repeat(400001)}])await denied('teacher','PUT',q,{...quiz(),...change});
    await good('teacher','PUT',q,quiz());assert.equal((await good('student','GET',q)).revision,revision);
    await denied('teacher','PUT',q,quiz());await denied('teacher','DELETE',q);
    await denied('teacher','PUT',`${path}/quizzes/${room}/a_${'1'.repeat(32)}`,quiz());
  });
  await t.test('no global listing or outsider access; only a student can read and save their own draft',async()=>{
    for(const uid of [null,'outsider','teacher-b'])await denied(uid,'GET',q);
    await denied('student','GET',path);await denied('teacher','GET',`${path}/results`);
    for(const uid of [null,'teacher','teacher-b','student-b','outsider']){await denied(uid,'GET',d);await denied(uid,'PUT',d,draft());}
    for(const change of [{quizRevision:'x'},{contentId:'other'},{progressJson:'x'.repeat(80001)},{extra:true},{revision:2},{createdAt:1}])await denied('student','PUT',d,{...draft(),...change});
    await good('student','PUT',d,draft());const saved=await good('student','GET',d);
    await denied('student','PUT',d,{...saved,updatedAt:stamp});
    await good('student','PUT',d,{...saved,revision:2,updatedAt:stamp});await denied('student','DELETE',d);
    await denied('student','PUT',`${path}/attempts/${room}/${second}/student`,draft());
  });
  await t.test('submission requires matching assignment/version, own membership and a server timestamp',async()=>{
    for(const uid of [null,'teacher','teacher-b','student-b','outsider'])await denied(uid,'PUT',r,result());
    for(const change of [{quizRevision:'x'},{contentId:'other'},{dueAt:100},{submittedAt:1},{score:100},{elapsedMs:-1},{elapsedMs:1.5},{answersJson:'x'.repeat(60001)},{submissionId:'bad'}])await denied('student','PUT',r,{...result(),...change});
    await good('student','PUT',r,result());assert.equal((await good('student','GET',r)).contentId,'waves-quiz');
  });
  await t.test('submitted work is immutable and freezes its draft; teacher can read results but not private drafts',async()=>{
    for(const uid of ['student','teacher','student-b']){await denied(uid,'PUT',r,result());await denied(uid,'DELETE',r);}
    const saved=await good('student','GET',d);await denied('student','PUT',d,{...saved,revision:3,updatedAt:stamp});
    assert.ok((await good('teacher','GET',`${path}/results/${room}`))[aid].student);
    await denied('teacher','GET',d);await denied('student-b','GET',r);await denied('student','GET',`${path}/results/${room}/${aid}`);
    assert.equal(await good('student-b','GET',`${path}/results/${room}/${aid}/student-b`),null);
  });
  await t.test('closing rejects new submissions while prior results remain readable',async()=>{
    const item=await good('teacher','GET',`classroomAssignmentsV1/items/${room}/${aid}`);
    await good('teacher','PUT',`classroomAssignmentsV1/items/${room}/${aid}`,{...item,status:'closed',updatedAt:stamp,revision:2});
    await denied('student-b','PUT',`${path}/results/${room}/${aid}/student-b`,result());
    assert.ok(await good('student','GET',r));assert.ok(await good('teacher','GET',r));
  });
  await t.test('membership removal and teacher revocation withdraw read and write access',async()=>{
    await good('EMULATOR_ADMIN','DELETE',`classroomV1/members/${room}/student`);
    await denied('student','GET',r);await denied('student','GET',q);await denied('student','GET',d);
    await good('EMULATOR_ADMIN','DELETE','learningHub/teacherApprovals/teacher');
    await denied('teacher','GET',`${path}/results/${room}`);await denied('teacher','PUT',`${path}/quizzes/${room}/${second}`,quiz());
    await good('student-b','PUT','quizProgress/legacy-quiz/student-b',{score:7});assert.equal((await good('student-b','GET','quizProgress/legacy-quiz/student-b')).score,7);
  });
});
