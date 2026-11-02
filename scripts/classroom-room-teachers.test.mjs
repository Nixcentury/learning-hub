import test from 'node:test';
import assert from 'node:assert/strict';
import { createClassroomService } from '../js/classroom-service.js';
import { createRoomTeacherEnrollment } from '../js/classroom-room-teachers-enrollment.js';
import { createClassroomEnrollment } from '../js/classroom-enrollment.js';
import { canTeachRoom } from '../public/shared/classroom-room-role.js';
import { roomTeacherInvitationKey, claimRoomTeacherUpdates, revokeRoomTeacherUpdates } from '../js/classroom-room-teachers-model.js';
const rid='r_'+'a'.repeat(32),other='r_'+'b'.repeat(32);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const context=(uid='friend',teacher=false,verified=true)=>[{status:'signed-in',user:{uid,email:uid+'@example.test',displayName:'Name '+uid,emailVerified:verified}},{uid,status:'ready',systemRole:teacher?'teacher':'student',isTeacher:teacher}];
function fixture(t) {
 const db={rooms:{[rid]:{name:'Physics',ownerUid:'owner',joinCode:'ABCD2345',createdAt:1}},userRooms:{owner:{[rid]:'owner'}},members:{[rid]:{student:{displayName:'Student',joinedAt:2,joinCode:'ABCD2345'}}}},watchers=[],writes=[];
 const get=path=>path.split('/').reduce((v,k)=>v?.[k],db)??null;
 const select=w=>w.path?get(w.path):Object.fromEntries(Object.entries(db[w.branch]||{}).filter(([,value])=>value[w.field]===w.value));
 const notify=()=>{for(const w of watchers)if(w.active)queueMicrotask(()=>{if(w.active)w.next(structuredClone(select(w)));});};
 function watch(w){w.active=true;watchers.push(w);queueMicrotask(()=>{if(w.active)w.next(structuredClone(select(w)));});return()=>{w.active=false;};}
 const io={get:async path=>structuredClone(get(path)),timestamp:()=>123,watch:(path,next,error)=>watch({path,next,error}),watchInvitations:(field,value,next,error)=>watch({branch:'invitations',field,value,next,error}),watchTeacherInvitations:(field,value,next,error)=>watch({branch:'teacherInvitations',field,value,next,error}),async update(patch){writes.push(structuredClone(patch));for(const[path,value]of Object.entries(patch)){const keys=path.split('/'),last=keys.pop();let node=db;for(const key of keys)node=node[key]??={};value===null?delete node[last]:node[last]=structuredClone(value);}notify();}};
 const service=createClassroomService({io,onChange:()=>{}}),teachers=createRoomTeacherEnrollment({io});
 t.after(()=>{teachers.dispose();service.dispose();});return{db,io,service,teachers,watchers,writes,notify,get};
}
test('room roles never turn an invitation into global teacher or owner permission',async()=>{
 assert.equal(canTeachRoom({ownerUid:'owner',membership:'owner'},'owner',false),false);
 assert.equal(canTeachRoom({ownerUid:'owner',membership:'owner'},'owner',true),true);
 assert.equal(canTeachRoom({ownerUid:'owner',membership:'student'},'friend',true),false);
 assert.equal(canTeachRoom({ownerUid:'owner',membership:'teacher'},'friend',false),true);
 assert.equal(canTeachRoom({ownerUid:'owner',membership:'teacher'},'',false),false);
 const key=await roomTeacherInvitationKey(rid,' Friend@Example.test ');
 assert.equal(key,await roomTeacherInvitationKey(rid,'friend@example.test'));
 assert.notEqual(key,await roomTeacherInvitationKey(other,'friend@example.test'));
});
test('owner email invitation is idempotent and recipient auto-enrolls without global approval',async t=>{
 const f=fixture(t);f.service.setContext(...context('owner',true),true);await tick();await f.service.command('open',{roomId:rid},'owner');await tick();
 await f.service.command('invite-teacher',{roomId:rid,email:' Friend@Example.test '},'owner');await tick();
 assert.equal(Object.keys(f.db.teacherInvitations).length,1);const writes=f.writes.length;
 await f.service.command('invite-teacher',{roomId:rid,email:'friend@example.test'},'owner');assert.equal(f.writes.length,writes);
 f.teachers.setContext(...context());await tick();await tick();
 assert.equal(f.db.userRooms.friend[rid],'teacher');assert.equal(f.db.teachers[rid].friend.email,'friend@example.test');assert.equal(f.db.members[rid].friend,undefined);
 f.service.setContext(...context(),true);await tick();await f.service.command('open',{roomId:rid},'friend');await tick();
 const state=f.service.getState();assert.equal(state.selected.membership,'teacher');assert.equal(state.members[0].uid,'student');
 for(const action of ['create','invite','invite-teacher','remove-teacher'])await assert.rejects(f.service.command(action,{roomId:rid,name:'Takeover',email:'other@example.test'},'friend'));
});
test('revocation clears selected room and listeners, preserves student membership and allows a fresh invitation',async t=>{
 const f=fixture(t),id=await roomTeacherInvitationKey(rid,'friend@example.test');
 const invite={roomId:rid,ownerUid:'owner',email:'friend@example.test',createdAt:1,acceptedUid:''};f.db.teacherInvitations={[id]:invite};
 f.db.members[rid].friend={displayName:'Prior student',joinedAt:7,joinCode:'ABCD2345'};
 f.teachers.setContext(...context());await tick();await tick();f.service.setContext(...context(),true);await tick();await f.service.command('open',{roomId:rid},'friend');await tick();
 const before=structuredClone(f.db.members[rid].friend),row=f.db.teachers[rid].friend;
 await f.io.update(revokeRoomTeacherUpdates(rid,'friend',row,true));await tick();
 assert.equal(f.service.getState().selected,null);assert.equal(f.db.userRooms.friend[rid],'student');assert.deepEqual(f.db.members[rid].friend,before);
 assert.equal(f.watchers.filter(w=>w.active && w.path?.startsWith('teachers/')).length,0);
 await f.io.update({['teacherInvitations/'+id]:invite});await tick();await tick();assert.equal(f.db.userRooms.friend[rid],'teacher');
});
test('recipient must verify matching email; account change stops queries and pending reads',async t=>{
 const f=fixture(t),id=await roomTeacherInvitationKey(rid,'friend@example.test');f.db.teacherInvitations={[id]:{roomId:rid,ownerUid:'owner',email:'friend@example.test',createdAt:1,acceptedUid:''}};
 f.teachers.setContext(...context('friend',false,false));await tick();assert.equal(f.writes.length,0);
 let finish;f.io.get=()=>new Promise(resolve=>{finish=resolve;});f.teachers.setContext(...context());await tick();
 const old=f.watchers.find(w=>w.branch==='teacherInvitations');f.teachers.setContext(...context('other'));finish(null);await tick();
 assert.equal(old.active,false);old.next(f.db.teacherInvitations);await tick();assert.equal(f.writes.length,0);
});
test('owner cancel/removal requires selected room and ready Rules; back/account switch detaches all room directories',async t=>{
 const f=fixture(t);f.service.setContext(...context('owner',true),true);await tick();await f.service.command('open',{roomId:rid},'owner');await tick();
 await assert.rejects(f.service.command('invite-teacher',{roomId:other,email:'friend@example.test'},'owner'));
 await f.service.command('invite-teacher',{roomId:rid,email:'friend@example.test'},'owner');await tick();
 const id=Object.keys(f.db.teacherInvitations)[0];await f.service.command('cancel-teacher-invite',{roomId:rid,invitationId:id},'owner');assert.equal(f.db.teacherInvitations[id],undefined);
 await f.service.command('back',{},'owner');assert.equal(f.watchers.filter(w=>w.active && (w.branch || w.path?.startsWith('teachers/') || w.path?.startsWith('members/'))).length,0);
});
test('student email enrollment never overwrites an existing co-teacher index',async t=>{
 const f=fixture(t);f.db.teachers={[rid]:{friend:{email:'friend@example.test'}}};f.db.userRooms.friend={[rid]:'teacher'};
 f.db.invitations={i:{roomId:rid,email:'friend@example.test',ownerUid:'owner',joinCode:'ABCD2345'}};
 const studentEnrollment=createClassroomEnrollment({io:f.io});t.after(()=>studentEnrollment.dispose());studentEnrollment.setContext(...context());await tick();await tick();
 assert.equal(f.writes.length,0);assert.equal(f.db.userRooms.friend[rid],'teacher');
});
test('code join does not downgrade a co-teacher to student',async t=>{
 const f=fixture(t);f.db.userRooms.friend={[rid]:'teacher'};f.db.teachers={[rid]:{friend:{email:'friend@example.test'}}};f.db.joinCodes={ABCD2345:{roomId:rid,ownerUid:'owner'}};
 f.service.setContext(...context(),true);await tick();await f.service.command('join',{code:'ABCD2345'},'friend');await tick();assert.equal(f.writes.length,0);assert.equal(f.service.getState().selected.membership,'teacher');
});
