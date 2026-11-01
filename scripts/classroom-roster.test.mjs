import test from 'node:test';
import assert from 'node:assert/strict';
import { createClassroomEnrollment } from '../js/classroom-enrollment.js';
import { createClassroomService } from '../js/classroom-service.js';
import { cleanStudentEmail, invitationKey } from '../js/classroom-roster-model.js';
const rid='r_'+'a'.repeat(32),other='r_'+'b'.repeat(32),code='ABCD2345';
const tick=()=>new Promise(done=>setImmediate(done));
const ctx=(uid='student',teacher=false,verified=true)=>[{status:'signed-in',user:{uid,email:uid+'@example.test',displayName:uid,emailVerified:verified}},{uid,status:'ready',isTeacher:teacher,systemRole:teacher?'teacher':'student'}];
function fixture(t) {
 const db={},watchers=[],writes=[];
 const get=path=>path.split('/').reduce((v,key)=>v?.[key],db)??null;
 const io={async get(path){return structuredClone(get(path));},timestamp:()=>123,
  watch(path,ok,error){const w={path,ok,error,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active)ok(structuredClone(get(path)));});return()=>{w.active=false;};},
  watchInvitations(field,value,ok,error){const w={field,value,ok,error,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active)ok(select(w));});return()=>{w.active=false;};},
  async update(patch){writes.push(structuredClone(patch));for(const[path,value]of Object.entries(patch)){const keys=path.split('/'),last=keys.pop();let node=db;for(const k of keys)node=node[k]??={};value===null?delete node[last]:node[last]=structuredClone(value);}notify();},
 };
 const select=w=>Object.fromEntries(Object.entries(db.invitations||{}).filter(([,v])=>v[w.field]===w.value));
 const notify=()=>{for(const w of watchers)if(w.active)queueMicrotask(()=>{if(w.active)w.ok(w.path?structuredClone(get(w.path)):select(w));});};
 const enrollment=createClassroomEnrollment({io});const service=createClassroomService({io,onChange:()=>{}});
 t.after(()=>{enrollment.dispose();service.dispose();});
 return{db,io,writes,watchers,enrollment,service,notify};
}
const invite=(email='student@example.test')=>({roomId:rid,email,joinCode:code,ownerUid:'teacher',createdAt:1});
test('email normalizes without changing Gmail dots/plus aliases; keys are deterministic and room-specific',async()=>{
 assert.equal(cleanStudentEmail(' Student+One@Example.test '),'student+one@example.test');
 for(const value of ['', 'no-at-sign', 'a@b', 'a b@c.test'])assert.throws(()=>cleanStudentEmail(value));
 assert.equal(await invitationKey(rid,' A@Example.test '),await invitationKey(rid,'a@example.test'));
 assert.notEqual(await invitationKey(rid,'a@example.test'),await invitationKey(other,'a@example.test'));
});
test('verified account automatically joins its email entry once, including pending first login; keeps server acknowledgement',async t=>{
 const f=fixture(t),id=await invitationKey(rid,'student@example.test');f.db.invitations={[id]:invite()};
 f.enrollment.setContext(...ctx());await tick();await tick();
 assert.equal(f.writes.length,1);assert.equal(f.db.userRooms.student[rid],'student');assert.equal(f.db.members[rid].student.email,'student@example.test');
 const previous=structuredClone(f.db.members[rid].student);f.notify();await tick();assert.equal(f.writes.length,1);assert.deepEqual(f.db.members[rid].student,previous);
});
test('wrong email, unverified account, guest and mismatched roles never claim an invitation',async t=>{
 const f=fixture(t);f.db.invitations={i:invite('other@example.test')};
 f.enrollment.setContext(...ctx());await tick();assert.equal(f.writes.length,0);
 f.enrollment.setContext(...ctx('student',false,false));await tick();assert.equal(f.watchers.filter(w=>w.active).length,0);
 f.enrollment.setContext(ctx()[0],ctx('other')[1]);await tick();assert.equal(f.writes.length,0);
 f.enrollment.setContext({status:'guest'},null);assert.equal(f.watchers.filter(w=>w.active).length,0);
});
test('removed member is never auto-enrolled; account switch ignores late lookups and callbacks',async t=>{
 const f=fixture(t);f.db.invitations={i:invite()};f.db.removed={[rid]:{student:{removedAt:1}}};
 f.enrollment.setContext(...ctx());await tick();await tick();assert.equal(f.writes.length,0);
 f.enrollment.setContext({status:'guest'},null);delete f.db.removed;
 let resolve;f.io.get=()=>new Promise(done=>{resolve=done;});f.enrollment.setContext(...ctx());await tick();
 const old=f.watchers.at(-1);f.enrollment.setContext(...ctx('other'));resolve(null);old.ok({i:invite()});await tick();assert.equal(f.writes.length,0);
});
test('owner adds pending email, removes/restores atomically and guards peers; detail listeners stop on exit',async t=>{
 const f=fixture(t);f.db.rooms={[rid]:{name:'Physics',ownerUid:'teacher',joinCode:code}};f.db.userRooms={teacher:{[rid]:'owner'}};
 f.service.setContext(...ctx('teacher',true),true);await tick();await f.service.command('open',{roomId:rid},'teacher');await tick();
 await f.service.command('invite',{roomId:rid,email:' Student@Example.test '},'teacher');await tick();
 assert.equal(Object.values(f.db.invitations)[0].email,'student@example.test');
 await assert.rejects(f.service.command('invite',{roomId:other,email:'x@example.test'},'teacher'),{code:'classroom/owner-required'});
 f.db.members={[rid]:{student:{displayName:'Original',joinedAt:7,joinCode:code,email:'student@example.test'}}};f.notify();await tick();
 await f.service.command('remove-member',{roomId:rid,memberUid:'student'},'teacher');await tick();assert.equal(f.db.members[rid].student,undefined);assert.equal(f.db.removed[rid].student.member.joinedAt,7);
 assert.deepEqual(Object.keys(f.writes.at(-1)).sort(),['members/'+rid+'/student','removed/'+rid+'/student','userRooms/student/'+rid].sort());
 await f.service.command('restore-member',{roomId:rid,memberUid:'student'},'teacher');await tick();assert.equal(f.db.members[rid].student.joinedAt,7);assert.equal(f.db.removed[rid].student,undefined);
 await f.service.command('back',{},'teacher');assert.equal(f.watchers.filter(w=>w.active&&(w.field||w.path.startsWith('members/')||w.path.startsWith('removed/'))).length,0);
});
test('live removal clears the selected room; denied enrollment never invents membership',async t=>{
 const f=fixture(t);f.db.rooms={[rid]:{name:'Physics',ownerUid:'teacher',joinCode:code}};f.db.userRooms={student:{[rid]:'student'}};f.db.members={[rid]:{student:{displayName:'Student',joinedAt:7,joinCode:code}}};
 f.service.setContext(...ctx(),true);await tick();await f.service.command('open',{roomId:rid},'student');
 delete f.db.userRooms.student[rid];delete f.db.members[rid].student;f.notify();await tick();assert.equal(f.service.getState().selected,null);
 f.db.invitations={i:invite()};f.io.update=async()=>{throw Error('denied');};f.enrollment.setContext(...ctx());await tick();await tick();assert.equal(f.db.members[rid].student,undefined);
});

test('code join remains compatible before new Rules are applied; no email field on old Rules',async t=>{
 const f=fixture(t),original=f.io.get;
 f.db.rooms={[rid]:{name:'Physics',ownerUid:'teacher',joinCode:code}};f.db.joinCodes={[code]:{roomId:rid,ownerUid:'teacher'}};
 f.io.get=async path=>{if(path.startsWith('removed/'))throw Object.assign(Error('denied'),{code:'PERMISSION_DENIED'});return original(path);};
 f.service.setContext(...ctx(),true);await tick();await f.service.command('join',{code},'student');
 assert.equal(f.db.userRooms.student[rid],'student');assert.equal(f.db.members[rid].student.email,undefined);
});
