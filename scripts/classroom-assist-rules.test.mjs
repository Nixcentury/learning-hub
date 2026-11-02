import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reset,good,request} from './fixtures/classroom-emulator.mjs';
import {mergeClassroomAssistRules} from './build-classroom-assist-rules.mjs';
import {createRoomUpdates,joinRoomUpdates} from '../js/classroom-model.js';
import {roomTeacherInvitationKey,claimRoomTeacherUpdates} from '../js/classroom-room-teachers-model.js';
const base=JSON.parse(await readFile(new URL('../firebase/classroom-room-teachers.merged-draft.json',import.meta.url),'utf8'));
const rules=mergeClassroomAssistRules(base),rid='r_'+'a'.repeat(32),aid='a_'+'b'.repeat(32),sid='e_'+'c'.repeat(32),rev='d'.repeat(64),stamp={'.sv':'timestamp'};
const root='classroomSubmissionsV1',leasePath=`${root}/assists/${rid}/${aid}/student`,draftPath=`${root}/attempts/${rid}/${aid}/student`,resultPath=`${root}/results/${rid}/${aid}/student`;
const deny=async(uid,method,path,value)=>assert.equal((await request(uid,method,path,value)).ok,false,`${uid} ${method} ${path} must fail`);
const lease=actor=>({version:1,id:sid,actorUid:actor,status:'active',startedAt:stamp,updatedAt:stamp,expiresAt:Date.now()+170000});
const draft=(revision=1)=>({version:1,contentId:'waves',quizRevision:rev,progressJson:'{"answers":{"one":"a"}}',createdAt:stamp,updatedAt:stamp,revision,baseSubmissionId:''});
const result=()=>({version:1,contentId:'waves',quizRevision:rev,answersJson:'{"one":"a"}',giveUpsJson:'{}',elapsedMs:10,dueAt:0,submissionId:'1'.repeat(32),submissionRevision:1,submittedAt:stamp});
async function fixture(){
 await reset(rules);
 await good('teacher','PATCH','classroomV1',createRoomUpdates('teacher','Physics',{roomId:rid,code:'ABCD2345'},stamp));
 for(const uid of ['student','student-b'])await good(uid,'PATCH','classroomV1',joinRoomUpdates(uid,rid,'ABCD2345',uid,stamp));
 await good('teacher','PUT',`classroomAssignmentsV1/items/${rid}/${aid}`,{version:1,ownerUid:'teacher',title:'Waves',instructions:'',dueAt:0,targetHash:'#content/waves',contentId:'waves',quizTitleTh:'คลื่น',quizTitleEn:'Waves',status:'published',createdAt:stamp,updatedAt:stamp,publishedAt:stamp,revision:1});
 await good('teacher','PUT',`${root}/quizzes/${rid}/${aid}`,{version:1,contentId:'waves',targetHash:'#content/waves',revision:rev,html:'<article/>',questionCount:1,createdAt:stamp});
}
test('assistance Rules reproduce the full file and preserve all unrelated roots',async()=>{
 assert.deepEqual(rules,JSON.parse(await readFile(new URL('../firebase/classroom-assist.merged-draft.json',import.meta.url),'utf8')));
 for(const key of Object.keys(base.rules))if(key!==root)assert.deepEqual(rules.rules[key],base.rules[key]);
 assert.throws(()=>mergeClassroomAssistRules(rules));
});
test('real emulator: scoped borrowing, student exclusion, immutable actor/history, handoff and expiry',async t=>{
 await fixture();
 await good('student','PUT',draftPath,draft());
 await deny('teacher','GET',draftPath);
 await deny('student-b','GET',draftPath);
 for(const uid of [null,'student','teacher-b'])await deny(uid,'PUT',leasePath,lease(uid));
 await good('teacher','PUT',leasePath,lease('teacher'));
 const active=await good('student','GET',leasePath);
 await good('teacher','GET',draftPath);
 await t.test('only this teacher, this student and this assignment; no broad draft access',async()=>{
  await deny('teacher-b','GET',draftPath);await deny('teacher','GET',`${root}/attempts/${rid}`);
  await deny('teacher','GET',`${root}/attempts/${rid}/${aid}/student-b`);
  await deny('teacher','PUT',leasePath,lease('teacher'));
  await deny('teacher','PUT',leasePath,{...active,id:'e_'+'f'.repeat(32),updatedAt:stamp});
  await deny('teacher','PUT',leasePath,{...active,expiresAt:Date.now()+3600000,updatedAt:stamp});
 });
 await t.test('student cannot overwrite during help; teacher must bind the actual session and identity',async()=>{
  const old=await good('teacher','GET',draftPath);
  await deny('student','PUT',draftPath,{...old,revision:2,updatedAt:stamp});
  const assisted={...old,revision:2,updatedAt:stamp,handoffId:sid,assistId:sid,assistedByUid:'teacher'};
  await deny('teacher','PUT',draftPath,{...assisted,assistId:'e_'+'0'.repeat(32)});
  await good('teacher','PUT',draftPath,assisted);
  await good('teacher','PUT',resultPath,{...result(),handoffId:sid,assistId:sid,assistedByUid:'teacher'});
 });
 await t.test('assisted resubmission atomically archives all actor metadata; history is immutable',async()=>{
  const old=await good('teacher','GET',resultPath),next={...old,submissionRevision:2,submissionId:'2'.repeat(32),submittedAt:stamp};
  const archive=`history/${rid}/${aid}/student/${old.submissionId}`,latest=`results/${rid}/${aid}/student`;
  const altered={...old,assistedByUid:'student'};
  await deny('teacher','PATCH',root,{[latest]:next,[archive]:altered});
  await good('teacher','PATCH',root,{[latest]:next,[archive]:old});
  await deny('teacher','DELETE',`${root}/${archive}`);
 });
 await t.test('student reclaims immediately; stale teacher and old student clients cannot save',async()=>{
  await good('student','PUT',leasePath,{...active,status:'ended',updatedAt:stamp,expiresAt:0});
  await deny('teacher','GET',draftPath);
  const saved=await good('student','GET',draftPath);
  const next={...saved,revision:3,updatedAt:stamp,baseSubmissionId:'2'.repeat(32)};delete next.assistedByUid;delete next.assistId;
  const stale={...next};delete stale.handoffId;
  await deny('student','PUT',draftPath,stale);
  await good('student','PUT',draftPath,next);
  await deny('teacher','PUT',leasePath,{...active,updatedAt:stamp,expiresAt:Date.now()+170000});
 });
 await t.test('expiry and membership/role loss end delegated access; ordinary work survives',async()=>{
  const expired={...active,id:'e_'+'f'.repeat(32),expiresAt:Date.now()-1000};
  await good('EMULATOR_ADMIN','PUT',leasePath,expired);await deny('teacher','GET',draftPath);
  await good('EMULATOR_ADMIN','PUT',leasePath,{...expired,expiresAt:Date.now()+170000});
  await good('EMULATOR_ADMIN','DELETE',`classroomV1/members/${rid}/student`);await deny('teacher','GET',draftPath);await deny('student','PUT',draftPath,draft(4));
  assert.equal((await good('teacher','GET',resultPath)).submissionRevision,2);
 });
});
test('co-teacher can help in own room; owners cannot borrow work of another room or closed assignment',async()=>{
 await fixture();
 const id=await roomTeacherInvitationKey(rid,'friend@example.test'),invite={roomId:rid,email:'friend@example.test',ownerUid:'teacher',createdAt:stamp,acceptedUid:''};
 await good('teacher','PUT',`classroomV1/teacherInvitations/${id}`,invite);await good('friend','PATCH','classroomV1',claimRoomTeacherUpdates('friend',id,invite,'Friend',stamp));
 await good('friend','PUT',leasePath,lease('friend'));await good('friend','GET',draftPath);
 await good('EMULATOR_ADMIN','DELETE',`classroomV1/teachers/${rid}/friend`);await deny('friend','GET',draftPath);
 const item=await good('teacher','GET',`classroomAssignmentsV1/items/${rid}/${aid}`);
 await good('teacher','PUT',`classroomAssignmentsV1/items/${rid}/${aid}`,{...item,status:'closed',revision:2,updatedAt:stamp});
 await good('EMULATOR_ADMIN','DELETE',leasePath);await deny('teacher','PUT',leasePath,lease('teacher'));
});
