import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reset, good, request, mockToken, emulatorOrigin, emulatorProject } from './fixtures/classroom-emulator.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { invitationKey, removeMemberUpdates, restoreMemberUpdates } from '../js/classroom-roster-model.js';
import { mergeRosterRules } from './build-classroom-roster-rules.mjs';
const baseline = JSON.parse(await readFile(new URL('../firebase/classroom-links.merged-draft.json',import.meta.url),'utf8'));
const rules = mergeRosterRules(baseline);
const rid = 'r_'+'a'.repeat(32), ridB = 'r_'+'b'.repeat(32), code='ABCD2345', codeB='EFGH6789', root='classroomV1';
const stamp={'.sv':'timestamp'};
const read = path => good('EMULATOR_ADMIN','GET',root+'/'+path);
async function deny(uid,method,path,body) { const r=await request(uid,method,root+'/'+path,body);assert.equal(r.ok,false,JSON.stringify({uid,method,path,r})); }
async function query(uid,field,value,claims={}) {
 const params=new URLSearchParams({ns:emulatorProject,auth:mockToken(uid,claims),orderBy:JSON.stringify(field),equalTo:JSON.stringify(value)});
 const r=await fetch(emulatorOrigin+'/'+root+'/invitations.json?'+params);return {ok:r.ok,value:await r.json()};
}
const addRoom=(uid,id,c)=>good(uid,'PATCH',root,createRoomUpdates(uid,'Physics',{roomId:id,code:c},stamp));
async function invite(uid,id,email,c) { const key=await invitationKey(id,email);await good(uid,'PUT',root+'/invitations/'+key,{roomId:id,ownerUid:uid,email,joinCode:c,createdAt:stamp});return key; }
function claim(uid,key,id=rid,c=code) { const patch=joinRoomUpdates(uid,id,c,'Student '+uid,stamp);Object.assign(patch['members/'+id+'/'+uid],{email:uid+'@example.test',invitationId:key});return patch; }
test('roster extension keeps all non-membership Rules byte-for-byte equivalent',()=>{
 for(const key of Object.keys(baseline.rules)) if(key!==root) assert.deepEqual(rules.rules[key],baseline.rules[key],key);
 for(const key of Object.keys(baseline.rules[root])) if(!['members','userRooms'].includes(key)) assert.deepEqual(rules.rules[root][key],baseline.rules[root][key],key);
 assert.throws(()=>mergeRosterRules(rules));
});
test('real Rules: email enrollment, owner removal/restore, cross-account and cross-room denial',async t=>{
 await reset(rules);await addRoom('teacher',rid,code);await addRoom('teacher-b',ridB,codeB);
 let key,keyB,previous,removed;
 await t.test('only approved owner can create invitations; identity fields cannot be forged',async()=>{
  key=await invite('teacher',rid,'student@example.test',code);keyB=await invite('teacher-b',ridB,'student-b@example.test',codeB);
  const fake={roomId:rid,ownerUid:'teacher-b',email:'student-c@example.test',joinCode:code,createdAt:stamp};
  for(const uid of [null,'student','teacher-b']) await deny(uid,'PUT','invitations/'+await invitationKey(rid,'student-c@example.test'),fake);
  await deny('teacher','PATCH','invitations/'+key,{email:'other@example.test'});
 });
 await t.test('indexed reads reveal only verified own email or owner-selected room',async()=>{
  const own=await query('student','email','student@example.test');assert.equal(own.ok,true);assert.deepEqual(Object.keys(own.value),[key]);
  for(const [uid,field,value,claims] of [['student','email','student-b@example.test',{}],['student','roomId',rid,{}],['teacher-b','roomId',rid,{}],['student','email','student@example.test',{email_verified:false}]]) assert.equal((await query(uid,field,value,claims)).ok,false);
  assert.equal((await query('teacher','roomId',rid)).ok,true);
  for(const uid of [null,'student','teacher','teacher-b']) await deny(uid,'GET','invitations');
  await deny('student-b','GET','invitations/'+key);
 });
 await t.test('claim requires token email and atomic index; cannot claim another invite or room',async()=>{
  await deny('student-b','PATCH','',claim('student-b',key));
  await deny('student','PATCH','',claim('student',key,ridB,codeB));
  await deny('student','PUT','members/'+rid+'/student',claim('student',key)['members/'+rid+'/student']);
  await good('student','PATCH',root,claim('student',key));previous=await read('members/'+rid+'/student');
  assert.equal(previous.email,'student@example.test');assert.equal(await read('userRooms/student/'+rid),'student');
  await deny('student-b','GET','members/'+rid+'/student');
  await deny('student','PATCH','members/'+rid+'/student',{email:'other@example.test'});
 });
 await t.test('only owner can remove atomically; scores, work and links are untouched',async()=>{
  await good('EMULATOR_ADMIN','PUT','classroomSubmissionsV1/qa-preserved',{score:8,answers:[1,2]});
  const patch=removeMemberUpdates(rid,'student',previous,stamp);
  for(const uid of ['student','student-b','teacher-b']) await deny(uid,'PATCH','',patch);
  await deny('teacher','DELETE','members/'+rid+'/student');
  await deny('teacher','DELETE','userRooms/student/'+rid);
  await deny('teacher','PUT','removed/'+rid+'/student',patch['removed/'+rid+'/student']);
  await good('teacher','PATCH',root,patch);removed=await read('removed/'+rid+'/student');
  assert.equal(await read('members/'+rid+'/student'),null);assert.equal(await read('userRooms/student/'+rid),null);
  assert.deepEqual((await good('EMULATOR_ADMIN','GET','classroomSubmissionsV1/qa-preserved')),{score:8,answers:[1,2]});
  await deny('student','GET','rooms/'+rid);
  await deny('student','GET','removed/'+rid);
  await deny('teacher-b','GET','removed/'+rid);
 });
 await t.test('removed student cannot rejoin with room code, invitation, forged membership or delete block',async()=>{
  await deny('student','PATCH','',joinRoomUpdates('student',rid,code,'Again',stamp));
  await deny('student','PATCH','',claim('student',key));
  await deny('student','DELETE','removed/'+rid+'/student');
  await deny('student','PATCH','',{...claim('student',key),['removed/'+rid+'/student']:null});
 });
 await t.test('restore is owner-only and atomic; original member name/time/email remain canonical',async()=>{
  const patch=restoreMemberUpdates(rid,'student',removed);
  for(const uid of ['student','teacher-b']) await deny(uid,'PATCH','',patch);
  await deny('teacher','DELETE','removed/'+rid+'/student');
  const fake=structuredClone(patch);fake['members/'+rid+'/student'].email='other@example.test';await deny('teacher','PATCH','',fake);
  await good('teacher','PATCH',root,patch);
  assert.deepEqual(await read('members/'+rid+'/student'),previous);assert.equal(await read('removed/'+rid+'/student'),null);
  assert.equal((await good('student','GET',root+'/rooms/'+rid)).ownerUid,'teacher');
 });
 await t.test('legacy code member without email can be removed/restored; revoked owner loses management',async()=>{
  await good('student-c','PATCH',root,joinRoomUpdates('student-c',rid,code,'Legacy',stamp));
  const legacy=await read('members/'+rid+'/student-c');await good('teacher','PATCH',root,removeMemberUpdates(rid,'student-c',legacy,stamp));
  await good('teacher','PATCH',root,restoreMemberUpdates(rid,'student-c',await read('removed/'+rid+'/student-c')));
  assert.deepEqual(await read('members/'+rid+'/student-c'),legacy);
  await good('EMULATOR_ADMIN','DELETE','learningHub/teacherApprovals/teacher');
  await deny('teacher','PATCH','',removeMemberUpdates(rid,'student',previous,stamp));
  await deny('teacher','DELETE','invitations/'+key);
  assert.equal((await query('teacher','roomId',rid)).ok,false);
 });
});
