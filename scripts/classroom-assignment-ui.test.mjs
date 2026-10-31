import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import * as model from '../public/shared/classroom-assignment-model.js';
import { createAssignmentNotice } from '../js/classroom-assignment-view.js';
const rid = 'r_' + 'a'.repeat(32), aid = 'a_' + 'b'.repeat(32);
const item = { id: aid, title: '<img src=x onerror=alert(1)> Wave homework', instructions: 'Read\nthen practise', status: 'published', revision: 1, dueAt: 0, targetHash: '#content/wave-quiz', quizTitleTh: 'คลื่น', quizTitleEn: 'Waves', publishedAt: 1 };
const context = (teacher = true, user = teacher ? 'teacher' : 'student') => ({ language: 'th', identity: { status: 'signed-in', uid: user }, classroom: { uid: user, state: teacher ? 'teacher' : 'student' },
  classroomRooms: { roomStatus: 'ready', selected: { id: rid } }, classroomAssignmentRoute: { roomId: rid, assignmentId: aid },
  classroomAssignments: { uid: user, connected: true, busy: '', hubUrl: 'https://example.test/learning-hub/', rooms: [{ id: rid, membership: teacher ? 'owner' : 'student', status: 'ready', items: [item], drafts: [], seen: {} }] } });
async function fixture() {
  const { window, document } = parseHTML('<html><body><section data-classroom-assignments></section></body></html>');
  const downloads = [], messages = [], parent = { postMessage: value => messages.push(value) };
  const scope = vm.createContext({ document, window, parent, location: { origin: 'https://example.test' }, navigator: { clipboard: { writeText: async () => {} } }, crypto,
    URL: class extends URL { static createObjectURL(blob) { downloads.push(blob); return 'blob:test'; } static revokeObjectURL() {} }, Blob, setTimeout: fn => fn(), Date, setInterval: () => 1, queueMicrotask, ...model });
  const script = (await readFile(new URL('../public/pages/shared/classroom-assignments-page.js', import.meta.url), 'utf8')).replace(/^import .*?;\n/, '');
  const proto = window.HTMLElement.prototype;
  proto.focus = function () {}; proto.reportValidity = () => true;
  Object.defineProperty(proto, 'elements', { configurable: true, get() { return Object.fromEntries([...this.querySelectorAll('[name]')].map(node => [node.getAttribute('name'), node])); } });
  proto.reset = function () { this.querySelectorAll('input,textarea').forEach(node => { node.value = ''; }); };
  // Linkedom has no layout/visibility engine; make this fixture explicitly visible.
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  vm.runInContext(script, scope);
  const update = value => document.dispatchEvent(new window.CustomEvent('hub-page-context', { detail: value }));
  return { document, window, messages, parent, update, scope, downloads };
}
test('teacher chooses only earlier published work as a prerequisite and the selection survives live refresh',async()=>{
  const f=await fixture(),value=context(),prior='a_'+'c'.repeat(32),future='a_'+'d'.repeat(32);
  value.classroomAssignments.rooms[0].items=[{...item,publishedAt:2000},{...item,id:prior,title:'งานแรก',publishedAt:1000},{...item,id:future,title:'งานถัดไป',publishedAt:3000}];
  f.update(value);f.document.querySelector('[data-hw-tools] [data-homework-action="edit"]').click();
  const select=f.document.querySelector('[name="requiresAssignmentId"]');
  assert.deepEqual(Array.from(select.querySelectorAll('option'),node=>node.value),['',prior]);
  for(const option of select.querySelectorAll('option'))option.selected=option.value===prior;
  f.update(value);assert.equal(select.value,prior);
  f.document.querySelector('[data-hw-save]').click();
  assert.equal(f.messages.find(message=>message.action==='save').payload.requiresAssignmentId,prior);
});
test('locked work remains readable but every launch button is disabled until the parent confirms access',async()=>{
  const f=await fixture(),value=context(false),prior='a_'+'c'.repeat(32);
  value.classroomAssignments.rooms[0].items=[{...item,requiresAssignmentId:prior},{...item,id:prior,title:'งานแรก'}];
  value.classroomSubmissions={uid:'student',roomId:rid,grades:{[aid]:{ready:true,loaded:true,rows:[]},[prior]:{ready:true,loaded:true,rows:[]}},gates:{[aid]:{status:'locked'}}};
  f.update(value);
  assert.equal(f.document.querySelector(`[data-homework-step="${aid}"]`).dataset.stepAccess,'locked');
  assert.ok(f.document.querySelector('[data-hw-detail]').textContent.includes('มากกว่า 50%'));
  for(const node of f.document.querySelectorAll(`[data-homework-action="launch"][data-id="${aid}"]`))assert.equal(node.disabled,true);
  value.classroomSubmissions.gates={};f.update(value);
  assert.equal(f.document.querySelector(`[data-homework-action="launch"][data-id="${aid}"]`).disabled,true,'Loading must not briefly unlock');
  value.classroomSubmissions.gates[aid]={status:'open'};f.update(value);
  assert.equal(f.document.querySelector(`[data-homework-action="launch"][data-id="${aid}"]`).disabled,false);
  assert.equal(f.document.querySelector(`[data-homework-step="${aid}"]`).dataset.stepAccess,'open');
});
test('homework UI renders stored user text safely and keeps published quiz destination read-only', async () => {
  const f = await fixture(); f.update(context());
  const root = f.document.querySelector('[data-classroom-assignments]');
  assert.equal(root.hidden, false); assert.equal(root.querySelectorAll('img').length, 0);
  assert.ok(root.textContent.includes(item.title));
  root.querySelector('[data-hw-tools] [data-homework-action="edit"]').click();
  assert.equal(root.querySelector('input[name="url"]').readOnly, true);
  assert.equal(root.querySelector('[data-hw-publish]').hidden, true);
  assert.equal(root.querySelector('[data-hw-save]').textContent, 'บันทึกการแก้ไข');
});
test('student UI hides teacher controls and sends only own read receipt; opening a quiz does not send scores', async () => {
  const f = await fixture(); f.update(context(false)); await new Promise(done => setImmediate(done));
  assert.equal(f.document.querySelector('[data-hw-new]').hidden, true);
  assert.equal(f.document.querySelector('[data-hw-editor]').hidden, true);
  assert.equal(f.document.querySelectorAll('[data-homework-action="edit"]').length, 0);
  const message = f.messages.find(value => value.type === 'learning-hub-assignment-command');
  assert.equal(message.uid, 'student'); assert.equal(message.action, 'seen');
  assert.deepEqual(JSON.parse(JSON.stringify(message.payload)), { roomId: rid, id: aid });
  assert.ok(!f.messages.some(value => /submit|score|grade/.test(value.type)));
});
test('account switch clears teacher draft fields and no old-account result can restore them', async () => {
  const f = await fixture(); f.update(context());
  f.document.querySelector('[data-hw-new]').click();
  f.document.querySelector('input[name="title"]').value = 'Private draft';
  f.update(context(false, 'student-b'));
  assert.equal(f.document.querySelector('[data-hw-editor]').hidden, true);
  assert.equal(f.document.querySelector('input[name="title"]').value, '');
  assert.equal(f.document.querySelector('[data-hw-new]').hidden, true);
});
test('homework notice uses private assignment link, survives language refresh and clears on sign-out', () => {
  const { document } = parseHTML('<html><body><button data-section="classroom"><span>Classroom</span></button><p id="hub-route-notice"></p></body></html>');
  const original = globalThis.document; globalThis.document = document;
  try {
    let language = 'th', hash = '';
    const notice = createAssignmentNotice({ getLanguage: () => language, navigate: value => { hash = value; } });
    notice.update({ unread: [{ id: aid, roomId: rid }] });
    document.querySelector('.assignment-notice button').click();
    assert.equal(hash, model.assignmentHash(rid, aid));
    language = 'en'; notice.refresh(); assert.ok(document.querySelector('.assignment-notice').textContent.includes('unread'));
    notice.update({ uid: null, unread: [] }); assert.equal(document.querySelector('.assignment-notice').hidden, true);
    assert.equal(document.querySelector('.assignment-badge').hidden, true);
  } finally { globalThis.document = original; }
});

test('teacher gradebook shows all members, submitted scores and empty scores for non-submitters', async()=>{
  const f=await fixture(), value=context();
  value.classroomSubmissions={uid:'teacher',roomId:rid,connected:true,ready:true,grades:{[aid]:{ready:true,loaded:true,rows:[
    {uid:'student',name:'<img src=x onerror=alert(1)> Student',submitted:true,grade:{score:2,maxScore:3,percent:66.67,submittedAt:1700000000000,late:true}},
    {uid:'student-b',name:'Student B',submitted:false,grade:null},
  ]}}};
  f.update(value);const results=f.document.querySelector('[data-homework-results]');
  assert.equal(results.querySelectorAll('tbody tr').length,2);assert.ok(results.textContent.includes('ส่งแล้ว 1/2 คน'));
  assert.ok(results.querySelector('[data-result-uid="student"]').textContent.includes('2/3'));
  assert.ok(results.querySelector('[data-result-uid="student-b"]').textContent.includes('ยังไม่ส่ง'));
  assert.equal(results.querySelectorAll('img').length,0);assert.ok(f.document.querySelector('[data-hw-tools] [data-homework-action="export-sheet"]'));
  assert.equal(results.querySelectorAll('[data-homework-action="export-sheet"]').length,0);
});
test('student sees only own result; unprepared work offers a teacher recovery action, not a false zero score',async()=>{
  const f=await fixture(), value=context(false);
  value.classroomSubmissions={uid:'student',roomId:rid,connected:true,ready:true,grades:{[aid]:{ready:true,loaded:true,rows:[{uid:'student',submitted:true,grade:{score:1,maxScore:3,submittedAt:1700000000000}}]}}};
  f.update(value);assert.ok(f.document.querySelector('[data-homework-results]').textContent.includes('คะแนนคำตอบ 1/3'));
  assert.equal(f.document.querySelectorAll('.homework-results-table').length,0);assert.equal(f.document.querySelectorAll('[data-homework-action="export-sheet"]').length,0);
  const teacher=context();teacher.classroomSubmissions={uid:'teacher',roomId:rid,ready:true,grades:{[aid]:{ready:false,loaded:true,rows:[]}}};
  f.update(teacher);assert.ok(f.document.querySelector('[data-homework-action="prepare"]'));
  assert.equal(f.document.querySelectorAll('[data-homework-action="launch"]').length,0);
});


test('CSV download accepts only the matching parent response and leaves a clear manual-export notice',async()=>{
  const f=await fixture(),value=context();
  value.classroomSubmissions={uid:'teacher',roomId:rid,connected:true,ready:true,grades:{[aid]:{ready:true,loaded:true,rows:[]}}};f.update(value);
  f.document.querySelector('[data-homework-action="export-sheet"]').click();
  const command=f.messages.find(message=>message.action==='export-sheet');assert.ok(command);
  const reply=(source,uid='teacher')=>{
    const event=new f.window.Event('message');Object.assign(event,{source,origin:'https://example.test',data:{type:'learning-hub-assignment-result',uid,requestId:command.requestId,ok:true,result:{csv:'test csv',filename:'hub-homework-'+aid.slice(2)+'.csv'}}});f.window.dispatchEvent(event);
  };
  reply({});reply(f.parent,'student');assert.equal(f.downloads.length,0);
  reply(f.parent);assert.equal(f.downloads.length,1);assert.equal(await f.downloads[0].text(),'test csv');
  assert.ok(f.document.body.textContent.includes('ยังไม่ส่งคะแนนเข้า Google Classroom'));
});


test('Classroom feed keeps teacher management together at the top of the right column',async()=>{
  const f=await fixture();f.update(context());const root=f.document.querySelector('[data-classroom-assignments]');
  assert.ok(root.querySelector('[data-hw-next-panel]'));assert.ok(root.querySelector('[data-hw-feed]'));assert.ok(root.querySelector('[data-hw-right]'));
  const right=root.querySelector('[data-hw-right]'),tools=right.querySelector('[data-hw-tools]');
  assert.equal(right.firstElementChild,tools);assert.ok(right.querySelector('[data-room-monitor-slot]'));
  for(const action of ['edit','close','scores','export-sheet'])assert.ok(tools.querySelector(`[data-homework-action="${action}"]`));
  assert.equal(root.querySelectorAll('[data-hw-feed] [data-homework-action="edit"]').length,0);
  assert.equal(root.querySelector('[data-hw-feed] .homework-post-instructions').textContent,item.instructions);
  assert.equal(tools.querySelector('[data-hw-selection]').textContent,item.title);assert.equal(root.querySelectorAll('img').length,0);
});
test('selecting another post changes every teacher action to the same selected assignment without opening details',async()=>{
  const f=await fixture(),value=context(),id2='a_'+'c'.repeat(32);
  value.classroomAssignments.rooms[0].items.push({...item,id:id2,title:'งานที่สอง',publishedAt:2});f.update(value);
  f.document.querySelector('[data-hw-detail-close]').click();
  f.document.querySelector(`[data-assignment-id="${id2}"] [data-homework-action="select"]`).click();
  const tools=f.document.querySelector('[data-hw-tools]');
  assert.equal(tools.querySelector('[data-hw-selection]').textContent,'งานที่สอง');
  for(const node of tools.querySelectorAll('[data-homework-action]'))assert.equal(node.dataset.id,id2);
  assert.equal(f.document.querySelector('[data-hw-detail-dialog]').hasAttribute('open'),false);
  assert.equal(f.messages.at(-1).action,'view');assert.equal(f.messages.at(-1).payload.id,id2);
});
test('student path retains submitted and closed work in publication order with only own status',async()=>{
  const f=await fixture(),value=context(false),id2='a_'+'c'.repeat(32),id3='a_'+'d'.repeat(32),id4='a_'+'e'.repeat(32);
  value.classroomAssignmentRoute.assignmentId='';
  value.classroomAssignments.rooms[0].items=[{...item,publishedAt:3},{...item,id:id2,title:'งานแรก',dueAt:100,publishedAt:1},{...item,id:id3,title:'ส่งแล้ว',publishedAt:2},{...item,id:id4,title:'ปิดแล้ว',status:'closed',publishedAt:4}];
  value.classroomSubmissions={uid:'student',roomId:rid,connected:true,grades:Object.fromEntries(value.classroomAssignments.rooms[0].items.map(x=>[x.id,{ready:true,loaded:true,rows:[{uid:'student',submitted:x.id===id3},{uid:'other',name:'PRIVATE OTHER',submitted:true,grade:{score:999,maxScore:999}}]}]))};
  f.update(value);const entries=f.document.querySelectorAll('[data-next-assignment]');
  assert.deepEqual(Array.from(entries,n=>n.dataset.id),[id2,id3,aid,id4]);assert.ok(!f.document.body.textContent.includes('PRIVATE OTHER'));assert.ok(!f.document.body.textContent.includes('999'));
  assert.deepEqual(Array.from(f.document.querySelectorAll('.homework-step-number'),n=>n.textContent),['1','2','3','4']);
  assert.ok(f.document.querySelector(`[data-homework-step="${id3}"]`).textContent.includes('ส่งแล้ว'));
  assert.equal(f.document.querySelector(`[data-homework-step="${id4}"]`).dataset.stepAccess,'closed');
  assert.equal(f.document.querySelector('[data-hw-next-count]').textContent,'1/4');
  assert.equal(f.document.querySelector('[data-hw-tools]').hidden,true);assert.equal(f.document.querySelector('[data-hw-tool-actions]').children.length,0);
});

test('all submitted work stays in the path, and lesson shortcuts send an assignment ID to the parent',async()=>{
  const f=await fixture(),value=context(false);value.classroomAssignmentRoute.assignmentId='';
  value.classroomAssignments.rooms[0].lessonShortcuts={[aid]:{hash:'#physics/4',titleTh:'บทที่ 4 สมดุลกล',titleEn:'Chapter 4 Mechanical Equilibrium'}};
  value.classroomSubmissions={uid:'student',roomId:rid,grades:{[aid]:{loaded:true,ready:true,rows:[{uid:'student',submitted:true,grade:{percent:60}}]}}};
  f.update(value);
  assert.equal(f.document.querySelectorAll('[data-next-assignment]').length,1);
  assert.ok(f.document.querySelector('[data-hw-next]').textContent.includes('60%'));
  assert.ok(f.document.querySelector('[data-hw-next-note]').textContent.includes('ส่งครบแล้ว'));
  assert.equal(f.document.querySelector('[data-hw-add-link]').disabled,true,'Link saving is explicitly deferred');
  f.document.querySelector('[data-homework-action="lesson"]').click();
  const command=f.messages.find(message=>message.action==='lesson');assert.ok(command);
  assert.deepEqual(JSON.parse(JSON.stringify(command.payload)),{roomId:rid,id:aid});
});
test('same-account teacher role revocation closes editors and removes peer grades and teacher actions',async()=>{
  const f=await fixture(),value=context();value.classroomSubmissions={uid:'teacher',roomId:rid,grades:{[aid]:{ready:true,loaded:true,rows:[{uid:'peer',name:'PRIVATE PEER',submitted:true,grade:{score:1,maxScore:2,percent:50,submittedAt:1}}]}}};
  f.update(value);f.document.querySelector('[data-hw-tools] [data-homework-action="edit"]').click();
  const revoked=context(false,'teacher');revoked.classroomSubmissions=value.classroomSubmissions;f.update(revoked);
  assert.equal(f.document.querySelector('[data-hw-editor-dialog]').hasAttribute('open'),false);
  assert.equal(f.document.querySelector('[data-hw-tools]').hidden,true);assert.equal(f.document.querySelectorAll('[data-homework-action="edit"]').length,0);
  assert.ok(!f.document.body.textContent.includes('PRIVATE PEER'));
});
test('closing assignment details keeps the feed visible across live context refreshes',async()=>{
  const f=await fixture();f.update(context());assert.equal(f.document.querySelector('[data-hw-detail-dialog]').hasAttribute('open'),true);
  f.document.querySelector('[data-hw-detail-close]').click();f.update(context());
  assert.equal(f.document.querySelector('[data-hw-detail-dialog]').hasAttribute('open'),false);
  assert.equal(f.document.querySelector('[data-classroom-assignments]').hidden,false);
  assert.equal(f.document.querySelectorAll('[data-hw-feed] .homework-card').length,1);
});
test('assignment refresh leaves the monitoring controls to their own service and disables offline teacher actions',async()=>{
  const f=await fixture(),value=context();f.update(value);
  const monitor=f.document.createElement('button');monitor.disabled=true;f.document.querySelector('[data-room-monitor-slot]').append(monitor);
  value.classroomAssignments.connected=false;f.update(value);
  assert.equal(monitor.disabled,true);assert.equal(f.document.querySelector('[data-hw-tools] [data-homework-action="edit"]').disabled,true);
  assert.equal(f.document.querySelector('[data-hw-retry]').disabled,false);
});


test('View scores opens the selected gradebook directly while the post stays in the center feed',async()=>{
  const f=await fixture();f.update(context());f.document.querySelector('[data-hw-detail-close]').click();
  f.document.querySelector('[data-hw-tools] [data-homework-action="scores"]').click();
  const detail=f.document.querySelector('[data-hw-detail]');
  assert.equal(detail.querySelectorAll('.homework-instructions').length,0);
  assert.equal(detail.querySelectorAll('.homework-share').length,0);
  assert.ok(detail.querySelector('[data-homework-results]'));
  assert.equal(f.document.querySelector('[data-hw-feed] .homework-post-instructions').textContent,item.instructions);
});
