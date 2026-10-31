import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { cleanLinkFields, newLinkId } from '../public/shared/classroom-links-model.js';
const rid = 'r_' + 'a'.repeat(32), id = 'l_' + 'b'.repeat(32);
const item = { id, version: 1, title: '<img src=x onerror=alert(1)> สมุดจด', url: 'https://example.com/notebook', authorUid: 'student', authorName: 'นักเรียนทดสอบ', createdAt: 1000, updatedAt: 1000, revision: 1 };
function context(uid = 'student', owner = false) {
  return { language: 'th', identity: { uid, status: 'signed-in' }, classroom: { uid, state: owner ? 'teacher' : 'student' }, classroomRooms: { roomStatus: 'ready', selected: { id: rid } },
    classroomLinks: { uid, roomId: rid, status: 'ready', connected: true, busy: '', error: '', owner, items: [item] } };
}
async function fixture() {
  const { window, document } = parseHTML('<html><body><details data-hw-links-panel><summary data-hw-links-heading></summary><div class="classroom-links-content"></div></details></body></html>');
  const messages = [], parent = { postMessage: value => messages.push(value) };
  const proto = window.HTMLElement.prototype; proto.focus = function() {};
  Object.defineProperty(proto,'elements',{ configurable:true,get() { return Object.fromEntries([...this.querySelectorAll('[name]')].map(node=>[node.getAttribute('name'),node])); } });
  proto.reset = function() { for(const input of this.querySelectorAll('input')) input.value=''; };
  window.confirm = () => true;
  vm.runInContext((await readFile(new URL('../public/pages/shared/classroom-links-page.js',import.meta.url),'utf8')).replace(/^import .*?;\n/,''),vm.createContext({window,document,parent,location:{origin:'https://example.test'},crypto,URL,Date,cleanLinkFields,newLinkId}));
  const update = value => document.dispatchEvent(new window.CustomEvent('hub-page-context',{detail:value}));
  const reply = (message, ok, error) => window.dispatchEvent(Object.assign(new window.Event('message'),{source:parent,origin:'https://example.test',data:{type:'learning-hub-links-result',uid:message.uid,requestId:message.requestId,ok,error}}));
  return {window,document,messages,parent,update,reply};
}
test('links render text safely with external-link protections and only the author/owner controls',async()=>{
  const f=await fixture();f.update(context());
  assert.equal(f.document.querySelectorAll('img').length,0);
  const anchor=f.document.querySelector('[data-links-list] a'); assert.equal(anchor.textContent,item.title);assert.equal(anchor.target,'_blank');assert.equal(anchor.rel,'noopener noreferrer');
  assert.equal(f.document.querySelectorAll('[data-link-action]').length,2);
  f.update(context('student-b'));assert.equal(f.document.querySelectorAll('[data-link-action]').length,0);
  f.update(context('teacher',true));assert.equal(f.document.querySelectorAll('[data-link-action]').length,2);
});
test('form survives live refresh, sends current room/UID and only closes after confirmed success',async()=>{
  const f=await fixture(),value=context();f.update(value);f.document.querySelector('[data-hw-add-link]').click();
  const form=f.document.querySelector('form');form.elements.linkTitle.value='สมุดใหม่';form.elements.linkUrl.value='https://example.com/new';f.update(value);assert.equal(form.elements.linkTitle.value,'สมุดใหม่');
  form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
  const message=f.messages.at(-1);assert.equal(message.type,'learning-hub-links-command');assert.equal(message.uid,'student');assert.equal(message.payload.roomId,rid);assert.equal(message.action,'create');assert.equal(form.hidden,false);
  // A stale reply must not clear the pending edit.
  f.reply({...message,requestId:'wrong'},true);assert.equal(form.hidden,false);
  f.reply(message,false,'links/conflict');assert.equal(form.hidden,false);assert.equal(form.elements.linkTitle.value,'สมุดใหม่');
  form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));f.reply(f.messages.at(-1),true);assert.equal(form.hidden,true);
});
test('switching account/room clears form and old links; denied/offline states disable writes and offer recovery',async()=>{
  const f=await fixture(),value=context();f.update(value);f.document.querySelector('[data-link-action="edit"]').click();
  f.update({...value,classroomLinks:{...value.classroomLinks,connected:false}});assert.equal(f.document.querySelector('[data-links-save]').disabled,true);
  const other=context('student-b');other.classroomLinks.items=[];other.classroomLinks.status='error';other.classroomLinks.error='PERMISSION_DENIED';f.update(other);
  assert.equal(f.document.querySelector('form').hidden,true);assert.equal(f.document.querySelectorAll('[data-links-list] a').length,0);assert.equal(f.document.querySelector('[data-links-retry]').disabled,false);
  f.document.querySelector('[data-links-retry]').click();assert.equal(f.messages.at(-1).action,'retry');
  f.update({language:'en',identity:{status:'guest'},classroom:{state:'guest'}});assert.equal(f.document.querySelectorAll('[data-links-list] a').length,0);
});
