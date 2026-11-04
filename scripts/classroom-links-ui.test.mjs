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
async function fixture({ writeText = async () => {} } = {}) {
  const { window, document } = parseHTML('<html><body><details data-hw-links-panel><summary data-hw-links-heading></summary><div class="classroom-links-content"></div></details></body></html>');
  const messages = [], parent = { postMessage: value => messages.push(value) };
  const proto = window.HTMLElement.prototype; proto.focus = function() {};
  Object.defineProperty(proto,'elements',{ configurable:true,get() { return Object.fromEntries([...this.querySelectorAll('[name]')].map(node=>[node.getAttribute('name'),node])); } });
  proto.reset = function() { for(const input of this.querySelectorAll('input')) input.value=''; };
  proto.select = function() { this.dataset.selected = 'true'; };
  window.confirm = () => true;
  vm.runInContext((await readFile(new URL('../public/pages/shared/classroom-links-page.js',import.meta.url),'utf8')).replace(/^import .*?;\n/,''),vm.createContext({window,document,parent,location:{origin:'https://example.test'},navigator:{clipboard:{writeText}},crypto,URL,Date,cleanLinkFields,newLinkId}));
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
test('students get copy/new-tab actions on other authors’ links without write commands',async()=>{
  const copied=[],f=await fixture({writeText:async value=>copied.push(value)}),value=context('student-b');f.update(value);
  const open=f.document.querySelector('[data-links-open]'),copy=f.document.querySelector('[data-links-copy]');
  assert.equal(open.href,item.url);assert.equal(open.target,'_blank');assert.equal(open.rel,'noopener noreferrer');assert.equal(open.dataset.external,'true');
  assert.equal(open.textContent,'เปิดในแท็บใหม่');assert.ok(copy.getAttribute('aria-label').includes(item.title));
  assert.equal(f.document.querySelectorAll('[data-link-action]').length,0);
  copy.click();await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(copied,[item.url]);assert.equal(f.document.querySelector('[data-links-feedback]').textContent,'คัดลอกลิงก์แล้ว');
  assert.equal(f.messages.filter(m=>m.type==='learning-hub-links-command').length,0);
  f.update({...value,language:'en'});assert.equal(f.document.querySelector('[data-links-copy]').textContent,'Copy link');assert.equal(f.document.querySelector('[data-links-open]').textContent,'Open in new tab');
  f.update({...value,classroomLinks:{...value.classroomLinks,connected:false}});assert.equal(f.document.querySelector('[data-links-copy]').disabled,false);
  f.update(context('teacher',true));assert.equal(f.document.querySelectorAll('[data-links-copy],[data-links-open]').length,0);assert.equal(f.document.querySelectorAll('[data-link-action]').length,2);
});
test('blocked clipboard exposes a selected readonly URL and clears it when the room changes',async()=>{
  const f=await fixture({writeText:async()=>{throw Error('NotAllowedError');}}),value=context('student-b');f.update(value);
  f.document.querySelector('[data-links-copy]').click();await new Promise(resolve=>setImmediate(resolve));
  const field=f.document.querySelector('[data-links-copy-value]');
  assert.equal(f.document.querySelector('[data-links-copy-fallback]').hidden,false);assert.equal(field.value,item.url);assert.equal(field.dataset.selected,'true');assert.ok(field.hasAttribute('readonly'));assert.ok(field.hasAttribute('data-allow-selection'));
  assert.ok(f.document.querySelector('[data-links-feedback]').textContent.includes('Ctrl+C'));assert.ok(!f.document.querySelector('[data-links-feedback]').textContent.includes('คัดลอกลิงก์แล้ว'));
  const otherRoom='r_'+'c'.repeat(32);f.update({...value,classroomRooms:{...value.classroomRooms,selected:{id:otherRoom}},classroomLinks:{...value.classroomLinks,roomId:otherRoom,items:[]}});
  assert.equal(f.document.querySelector('[data-links-copy-fallback]').hidden,true);assert.equal(field.value,'');
});
test('late clipboard failure cannot expose the previous account’s link',async()=>{
  let reject;const f=await fixture({writeText:()=>new Promise((resolve,no)=>{reject=no;})});f.update(context('student-b'));
  f.document.querySelector('[data-links-copy]').click();f.update({language:'en',identity:{status:'guest'},classroom:{state:'guest'}});
  reject(Error('NotAllowedError'));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(f.document.querySelector('[data-links-copy-fallback]').hidden,true);assert.equal(f.document.querySelector('[data-links-copy-value]').value,'');assert.equal(f.document.querySelectorAll('[data-links-list] a').length,0);
});
