import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
const roomId='r_'+'a'.repeat(32);
async function fixture(){
 const {window,document}=parseHTML('<html><body><section data-rooms-workspace><form data-create-room><input name="name"></form><form data-join-room><input name="code"></form><p data-room-list-status></p><p data-room-feedback></p><div data-room-list></div><div data-room-detail></div></section></body></html>');
 const proto=window.HTMLElement.prototype;proto.reset=function(){};proto.scrollIntoView=function(){};proto.focus=function(){};
 Object.defineProperty(proto,'elements',{configurable:true,get(){return Object.fromEntries([...this.querySelectorAll('[name]')].map(n=>[n.name,n]));}});
 const messages=[],parent={postMessage:m=>messages.push(m)};
 vm.runInContext(await readFile(new URL('../public/pages/shared/classroom-rooms.js',import.meta.url),'utf8'),vm.createContext({window,document,parent,crypto,location:{origin:'https://example.test'}}));
 const update=value=>document.dispatchEvent(new window.CustomEvent('hub-page-context',{detail:value}));
 const reply=(m,ok=true)=>window.dispatchEvent(Object.assign(new window.Event('message'),{source:parent,origin:'https://example.test',data:{type:'learning-hub-classroom-result',uid:m.uid,requestId:m.requestId,ok,error:'PERMISSION_DENIED'}}));
 return{window,document,messages,update,reply};
}
function context(owner=true){const uid=owner?'teacher':'student';return{language:'th',identity:{uid,status:'signed-in'},classroom:{uid,state:owner?'teacher':'student'},classroomRooms:{uid,status:'ready',rooms:[],busy:'',roomStatus:'ready',teacherRosterStatus:'ready',teacherRosterError:'',teachers:[],teacherInvitations:[],rosterStatus:'ready',rosterError:'',selected:{id:roomId,name:'Physics',membership:owner?'owner':'student',joinCode:'ABCD2345'},members:[{uid:'student',displayName:'<img src=x> Student',joinedAt:1,email:'student@example.test'}],invitations:[{id:'i_pending',email:'new@example.test'}],removed:[{uid:'old',member:{displayName:'Old',email:'old@example.test'}}]}};}
test('only owner sees email management; safe text and account changes clear private data',async()=>{
 const f=await fixture();f.update(context());assert.ok(f.document.querySelector('[data-invite-student]'));assert.equal(f.document.querySelectorAll('img').length,0);
 assert.equal(f.document.querySelector('[data-room-action="restore-member"]').dataset.memberUid,'old');
 f.update(context(false));assert.equal(f.document.querySelector('[data-invite-student]'),null);assert.equal(f.document.body.textContent.includes('new@example.test'),false);
});
test('email survives live snapshots and failure; commands carry selected room and authenticated UID',async()=>{
 const f=await fixture(),value=context();f.update(value);
 let input=f.document.querySelector('[data-student-email]');input.value='new+one@example.test';input.dispatchEvent(new f.window.Event('input',{bubbles:true}));
 f.update({...value,classroomRooms:{...value.classroomRooms,busy:'loading'}});input=f.document.querySelector('[data-student-email]');assert.equal(input.value,'new+one@example.test');
 f.update(value);let form=f.document.querySelector('[data-invite-student]');form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
 const command=f.messages.at(-1);assert.equal(command.action,'invite');assert.deepEqual(JSON.parse(JSON.stringify(command.payload)),{roomId,email:'new+one@example.test'});assert.equal(command.uid,'teacher');
 f.reply(command,false);assert.equal(f.document.querySelector('[data-student-email]').value,'new+one@example.test');
 form=f.document.querySelector('[data-invite-student]');form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));f.reply(f.messages.at(-1));assert.equal(f.document.querySelector('[data-student-email]').value,'');
});
test('removal needs explicit second click; unavailable Rules disable management',async()=>{
 const f=await fixture();f.update(context());f.document.querySelector('[data-room-action="remove-member"]').click();assert.equal(f.messages.length,0);
 f.document.querySelector('[data-room-action="remove-member"]').click();assert.equal(f.messages.at(-1).action,'remove-member');assert.equal(f.messages.at(-1).payload.memberUid,'student');
 f.reply(f.messages.at(-1));const value=context();value.classroomRooms.rosterStatus='error';value.classroomRooms.rosterError='PERMISSION_DENIED';f.update(value);
 assert.equal(f.document.querySelector('[data-student-email]').disabled,true);assert.equal(f.document.querySelector('[data-room-action="remove-member"]').disabled,true);
});

test('owner adds and removes room teachers; co-teacher only sees the read-only student directory',async()=>{
 const f=await fixture(),value=context();f.update(value);
 let input=f.document.querySelector('[data-room-teacher-email]');input.value='friend@example.test';input.dispatchEvent(new f.window.Event('input',{bubbles:true}));
 f.document.querySelector('[data-invite-room-teacher]').dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
 const command=f.messages.at(-1);assert.equal(command.action,'invite-teacher');assert.equal(command.payload.email,'friend@example.test');f.reply(command);
 value.classroomRooms.teachers=[{uid:'friend',email:'friend@example.test',displayName:'<img src=x>'}];f.update(value);
 f.document.querySelector('[data-room-action="remove-teacher"]').click();assert.equal(f.messages.length,1);
 f.document.querySelector('[data-room-action="remove-teacher"]').click();assert.equal(f.messages.at(-1).payload.teacherUid,'friend');assert.equal(f.document.querySelectorAll('img').length,0);
 const co=context(false);co.classroomRooms.selected.membership='teacher';f.update(co);
 assert.equal(f.document.querySelector('[data-invite-room-teacher]'),null);assert.equal(f.document.querySelector('[data-invite-student]'),null);
 assert.ok(f.document.querySelector('.classroom-co-teacher-roster').textContent.includes('Student'));
 assert.equal(f.document.querySelector('[data-room-action="remove-member"]'),null);
});
