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
  const messages = [], parent = { postMessage: value => messages.push(value) };
  const scope = vm.createContext({ document, window, parent, location: { origin: 'https://example.test' }, navigator: { clipboard: { writeText: async () => {} } }, crypto,
    URL, Date, setInterval: () => 1, queueMicrotask, ...model });
  const script = (await readFile(new URL('../public/pages/shared/classroom-assignments-page.js', import.meta.url), 'utf8')).replace(/^import .*?;\n/, '');
  const proto = window.HTMLElement.prototype;
  proto.focus = function () {}; proto.reportValidity = () => true;
  Object.defineProperty(proto, 'elements', { configurable: true, get() { return Object.fromEntries([...this.querySelectorAll('[name]')].map(node => [node.getAttribute('name'), node])); } });
  proto.reset = function () { this.querySelectorAll('input,textarea').forEach(node => { node.value = ''; }); };
  // Linkedom has no layout/visibility engine; make this fixture explicitly visible.
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  vm.runInContext(script, scope);
  const update = value => document.dispatchEvent(new window.CustomEvent('hub-page-context', { detail: value }));
  return { document, window, messages, parent, update, scope };
}
test('homework UI renders stored user text safely and keeps published quiz destination read-only', async () => {
  const f = await fixture(); f.update(context());
  const root = f.document.querySelector('[data-classroom-assignments]');
  assert.equal(root.hidden, false); assert.equal(root.querySelectorAll('img').length, 0);
  assert.ok(root.textContent.includes(item.title));
  root.querySelector('[data-hw-detail] [data-homework-action="edit"]').click();
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
