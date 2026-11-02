import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request, mockToken, emulatorOrigin, emulatorProject } from './fixtures/classroom-emulator.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { roomTeacherInvitationKey, claimRoomTeacherUpdates, revokeRoomTeacherUpdates } from '../js/classroom-room-teachers-model.js';
import { mergeRoomTeacherRules } from './build-classroom-room-teacher-rules.mjs';
const base = JSON.parse(await readFile(new URL('../firebase/classroom-roster.merged-draft.json',import.meta.url),'utf8'));
const rules = mergeRoomTeacherRules(base);
const rid='r_'+'a'.repeat(32), other='r_'+'b'.repeat(32), aid='a_'+'c'.repeat(32), lid='l_'+'d'.repeat(32), stamp={'.sv':'timestamp'};
const c='classroomV1', work='classroomAssignmentsV1', sub='classroomSubmissionsV1';
const deny=async(uid,method,path,body)=>assert.equal((await request(uid,method,path,body)).ok,false,`${uid} ${method} ${path} must fail`);
async function invite(uid='friend',room=rid,owner='teacher') {
 const id=await roomTeacherInvitationKey(room,uid+'@example.test');
 const record={roomId:room,ownerUid:owner,email:uid+'@example.test',createdAt:stamp,acceptedUid:''};
 await good(owner,'PUT',c+'/teacherInvitations/'+id,record);return{id,record};
}
async function query(uid,field,value,claims={}) {
 const params=new URLSearchParams({ns:emulatorProject,auth:mockToken(uid,claims),orderBy:JSON.stringify(field),equalTo:JSON.stringify(value)});
 const r=await fetch(emulatorOrigin+'/'+c+'/teacherInvitations.json?'+params);return{ok:r.ok,value:await r.json()};
}
async function withClaims(uid,claims,patch){
 const r=await fetch(emulatorOrigin+'/'+c+'.json?ns='+emulatorProject+'&auth='+encodeURIComponent(mockToken(uid,claims)),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)});return r.ok;
}
const assignment=(status='published')=>({version:1,ownerUid:'teacher',title:'Waves',instructions:'',dueAt:0,targetHash:'#content/waves-quiz',contentId:'waves-quiz',quizTitleTh:'คลื่น',quizTitleEn:'Waves',status,createdAt:stamp,updatedAt:stamp,publishedAt:status==='draft'?0:stamp,revision:1});
const quiz=()=>({version:1,contentId:'waves-quiz',targetHash:'#content/waves-quiz',revision:'e'.repeat(64),html:'<article data-learning-activity-content></article>',questionCount:3,createdAt:stamp});
test('complete co-teacher Rules are reproducible and preserve all unrelated Rules',async()=>{
 assert.deepEqual(rules,JSON.parse(await readFile(new URL('../firebase/classroom-room-teachers.merged-draft.json',import.meta.url),'utf8')));
 for(const key of Object.keys(base.rules))if(![c,work,sub,'classroomLinksV1'].includes(key))assert.deepEqual(rules.rules[key],base.rules[key],key);
 for(const key of Object.keys(base.rules[c]))if(!['rooms','members','userRooms'].includes(key))assert.deepEqual(rules.rules[c][key],base.rules[c][key],key);
 assert.deepEqual(rules.rules[c].rooms.$roomId['.write'],base.rules[c].rooms.$roomId['.write']);
 assert.deepEqual(rules.rules[c].members.$roomId.$uid,base.rules[c].members.$roomId.$uid);
 assert.throws(()=>mergeRoomTeacherRules(rules));
});
test('co-teachers: real RTDB Rules enforce verified invitations, room scope, work rights and atomic revocation',async t=>{
 await reset(rules);
 await good('teacher','PATCH',c,createRoomUpdates('teacher','Physics',{roomId:rid,code:'ABCD2345'},stamp));
 await good('teacher-b','PATCH',c,createRoomUpdates('teacher-b','Other',{roomId:other,code:'EFGH6789'},stamp));
 await good('student','PATCH',c,joinRoomUpdates('student',rid,'ABCD2345','Student',stamp));
 let entry,teacherRecord;
 await t.test('only actual approved owner invites; verified recipient can query only own email',async()=>{
  entry=await invite();
  for(const uid of [null,'student','friend','teacher-b'])await deny(uid,'PUT',c+'/teacherInvitations/t_'+'f'.repeat(64),entry.record);
  assert.equal((await query('friend','email','friend@example.test')).ok,true);
  assert.equal((await query('teacher','roomId',rid)).ok,true);
  for(const args of [['friend','email','student@example.test'],['friend','roomId',rid],['teacher-b','roomId',rid],['friend','email','friend@example.test',{email_verified:false}]])assert.equal((await query(...args)).ok,false);
  await deny('friend','GET',c+'/teacherInvitations');
  await deny('student','GET',c+'/teacherInvitations/'+entry.id);
 });
 await t.test('claim is atomic, matches ID-token email and cannot bind another UID or room',async()=>{
  const patch=claimRoomTeacherUpdates('friend',entry.id,entry.record,'Friend',stamp);
  await deny('student','PATCH',c,patch);
  await deny('friend','PUT',c+'/teachers/'+rid+'/friend',patch['teachers/'+rid+'/friend']);
  await deny('friend','PUT',c+'/userRooms/friend/'+rid,'teacher');
  assert.equal(await withClaims('friend',{email_verified:false},patch),false);
  await deny('friend','PATCH',c,{...patch,['teachers/'+other+'/friend']:patch['teachers/'+rid+'/friend']});
  await good('friend','PATCH',c,patch);teacherRecord=await good('friend','GET',c+'/teachers/'+rid+'/friend');
  assert.equal(await good('friend','GET',c+'/userRooms/friend/'+rid),'teacher');
  assert.equal(await good('EMULATOR_ADMIN','GET','learningHub/teacherApprovals/friend'),null);
  const stolen=claimRoomTeacherUpdates('second-uid',entry.id,entry.record,'Other',stamp);
  assert.equal(await withClaims('second-uid',{email:'friend@example.test'},stolen),false);
  await deny('friend','PATCH',c+'/teachers/'+rid+'/friend',{displayName:'Changed'});
 });
 await t.test('room staff manage homework and links with canonical owner; drafts and results are room scoped',async()=>{
  assert.ok((await good('friend','GET',c+'/members/'+rid)).student);
  await deny('friend','GET',c+'/members/'+other);
  await good('friend','PUT',`${work}/drafts/${rid}/${aid}`,assignment('draft'));
  const draft=await good('friend','GET',`${work}/drafts/${rid}/${aid}`);
  await deny('student','GET',`${work}/drafts/${rid}`);
  await deny('teacher-b','GET',`${work}/drafts/${rid}`);
  const item={...draft,status:'published',publishedAt:stamp,updatedAt:stamp,revision:2};
  await good('friend','PATCH',work,{[`drafts/${rid}/${aid}`]:null,[`items/${rid}/${aid}`]:item});
  await deny('friend','PUT',`${work}/items/${rid}/${aid}`,{...item,ownerUid:'friend',revision:3,updatedAt:stamp});
  await good('friend','PUT',`${sub}/quizzes/${rid}/${aid}`,quiz());
  const result={version:1,contentId:'waves-quiz',quizRevision:'e'.repeat(64),answersJson:'{"one":"a"}',giveUpsJson:'{}',elapsedMs:1000,dueAt:0,submissionId:'f'.repeat(32),submittedAt:stamp};
  await good('student','PUT',`${sub}/results/${rid}/${aid}/student`,result);
  assert.ok((await good('friend','GET',`${sub}/results/${rid}`))[aid].student);
  await deny('friend','GET',`${sub}/attempts/${rid}/${aid}/student`);
  await deny('friend','PUT',`${sub}/results/${rid}/${aid}/student`,result);
  await deny('friend','GET',`${sub}/results/${other}`);
  const link={version:1,title:'Note',url:'https://example.test/',authorUid:'student',authorName:'Student',createdAt:stamp,updatedAt:stamp,revision:1};
  const path=`classroomLinksV1/items/${rid}/${lid}`;
  await good('student','PUT',path,link);const saved=await good('friend','GET',path);
  await good('friend','PUT',path,{...saved,title:'Teacher edit',updatedAt:stamp,revision:2});
  await good('friend','DELETE',path);
  await good('friend','PUT',path,{...link,authorUid:'friend',authorName:'Friend'});
 });
 await t.test('co-teacher cannot appoint teachers, manage student enrollment, own another room or alter global roles/monitoring',async()=>{
  await deny('friend','PUT',c+'/teacherInvitations/t_'+'1'.repeat(64),{...entry.record,email:'new@example.test'});
  await deny('friend','PATCH',c,createRoomUpdates('friend','Own room',{roomId:'r_'+'1'.repeat(32),code:'JKLM2345'},stamp));
  for(const path of ['learningHub/admins/friend','learningHub/teacherApprovals/friend'])await deny('friend','PUT',path,true);
  await deny('friend','PATCH',c+'/rooms/'+rid,{ownerUid:'friend'});
  await deny('friend','DELETE',c+'/members/'+rid+'/student');
  await deny('friend','PUT','classroomMonitorV1/sessions/'+rid,{id:'s_'+'2'.repeat(32),ownerUid:'friend',active:true,startedAt:stamp,endsAt:Date.now()+60000});
  await deny('friend','GET','classroomMonitorV1/sessions/'+rid);
  await deny('friend','GET',`${work}/drafts/${other}`);
 });
 await t.test('only owner revokes all three records atomically; access ends without changing old work/results',async()=>{
  const patch=revokeRoomTeacherUpdates(rid,'friend',teacherRecord,false);
  for(const uid of ['friend','student','teacher-b'])await deny(uid,'PATCH',c,patch);
  for(const path of ['teacherInvitations/'+entry.id,'teachers/'+rid+'/friend','userRooms/friend/'+rid])await deny('teacher','DELETE',c+'/'+path);
  await deny('friend','DELETE',c+'/userRooms/friend/'+rid);
  await good('teacher','PATCH',c,patch);
  for(const path of [c+'/rooms/'+rid,c+'/members/'+rid,`${work}/drafts/${rid}`,`${sub}/results/${rid}`,`classroomLinksV1/items/${rid}`])await deny('friend','GET',path);
  assert.equal((await good('teacher','GET',`${work}/items/${rid}/${aid}`)).ownerUid,'teacher');
  assert.equal((await good('teacher','GET',`${sub}/results/${rid}/${aid}/student`)).submissionId,'f'.repeat(32));
  entry=await invite();await good('friend','PATCH',c,claimRoomTeacherUpdates('friend',entry.id,entry.record,'Friend',stamp));
  assert.ok(await good('friend','GET',c+'/rooms/'+rid));
 });
 await t.test('promoting then revoking an existing student preserves student membership, work and join date',async()=>{
  const before=await good('student','GET',c+'/members/'+rid+'/student');
  const promoted=await invite('student');
  await good('student','PATCH',c,claimRoomTeacherUpdates('student',promoted.id,promoted.record,'Student teacher',stamp));
  const row=await good('student','GET',c+'/teachers/'+rid+'/student');
  await good('teacher','PATCH',c,revokeRoomTeacherUpdates(rid,'student',row,true));
  assert.deepEqual(await good('student','GET',c+'/members/'+rid+'/student'),before);
  assert.equal(await good('student','GET',c+'/userRooms/student/'+rid),'student');
  assert.ok(await good('student','GET',`${sub}/results/${rid}/${aid}/student`));
  await deny('student','GET',`${work}/drafts/${rid}`);
 });
});
