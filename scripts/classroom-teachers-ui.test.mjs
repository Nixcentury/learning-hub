import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { createClassroomTeachers } from '../js/classroom-teacher-service.js';
import { createClassroomTeacherDialog } from '../js/classroom-teacher-view.js';
const account = { status: 'signed-in', user: { uid: 'admin' } };
const role = { uid: 'admin', status: 'ready', systemRole: 'admin', isAdmin: true, isTeacher: true };
function fixture(copyFails = false) {
  const { document, window } = parseHTML('<html><body><button id="opener">Open</button></body></html>');
  const watchers = [], writes = [], copies = []; let view, lang = 'th';
  window.HTMLElement.prototype.focus = function() {};
  const service = createClassroomTeachers({ onChange: value => view?.update(value), io: {
    watch(path, next, error) { const row = { path, next, error, active: true }; watchers.push(row); return () => { row.active = false; }; },
    timestamp: () => 123, update: async patch => { writes.push(patch); },
  } });
  return { document, window, service, watchers, writes, copies,
    init() { view = createClassroomTeacherDialog({ service, language: () => lang, baseUrl: 'https://example.test/learning-hub/?private=secret#classroom/r_room', clipboard: async value => { if (copyFails) throw Error('denied'); copies.push(value); } }); return view; },
    load() {
      service.setContext(account, role, true); view.open(document.querySelector('#opener'));
      for (const [path, value] of [['.info/connected', true], ['profiles', { friend: { email: 'friend@school.test', displayName: '<img src=x onerror=alert(1)>' } }], ['teacherApprovals', { other: true }], ['teacherRequests', {}]]) watchers.findLast(row => row.path === path && row.active).next(value);
    },
    search(value) { const input = document.querySelector('#teacher-email'); input.value = value; input.dispatchEvent(new window.Event('input')); document.querySelector('[data-teacher-search]').dispatchEvent(new window.Event('submit', { cancelable: true })); },
    language(value) { lang = value; view.update(service.getState()); },
  };
}
test('dialog previews exact identity as safe text, clears edited selection, then approves', async () => {
  const f = fixture(), original = globalThis.document; globalThis.document = f.document;
  try {
    f.init(); f.load(); f.search('friend@school.test'); assert.equal(f.document.querySelectorAll('img').length, 0); assert.ok(f.document.querySelector('[data-teacher-result]').textContent.includes('<img'));
    assert.equal(f.document.querySelector('[data-teacher-result] button').dataset.uid, 'friend');
    f.document.querySelector('#teacher-email').dispatchEvent(new f.window.Event('input')); assert.equal(f.document.querySelector('[data-teacher-result] button'), null);
    f.search('friend@school.test'); f.document.querySelector('[data-teacher-result] button').click(); await Promise.resolve(); assert.ok(f.writes[0]['teacherApprovals/friend']);
  } finally { globalThis.document = original; }
});
test('revocation waits for visible confirmation; cancellation changes nothing', async () => {
  const f = fixture(), original = globalThis.document; globalThis.document = f.document;
  try {
    f.init(); f.load(); f.document.querySelector('[data-teacher-action="revoke"]').click();
    assert.equal(f.document.querySelector('[data-teacher-confirm]').hidden, false); assert.equal(f.writes.length, 0);
    f.document.querySelector('[data-teacher-cancel-revoke]').click(); assert.equal(f.document.querySelector('[data-teacher-confirm]').hidden, true);
    f.document.querySelector('[data-teacher-action="revoke"]').click(); f.document.querySelector('[data-teacher-confirm-revoke]').click(); await Promise.resolve(); assert.equal(f.writes[0]['teacherApprovals/other'], null);
  } finally { globalThis.document = original; }
});
test('share URL contains no account data and offers manual copy fallback', async () => {
  for (const fails of [false, true]) {
    const f = fixture(fails), original = globalThis.document; globalThis.document = f.document;
    try {
      f.init(); f.load(); f.document.querySelector('[data-teacher-copy]').click(); await Promise.resolve(); await Promise.resolve();
      assert.equal(f.document.querySelector('#teacher-share-url').value, 'https://example.test/learning-hub/#classroom');
      if (fails) assert.ok(f.document.querySelector('[data-teacher-copy-status]').textContent.includes('Ctrl+C'));
      else assert.deepEqual(f.copies, ['https://example.test/learning-hub/#classroom']);
    } finally { globalThis.document = original; }
  }
});
test('English and account/role loss clear the dialog and all listeners', () => {
  const f = fixture(), original = globalThis.document; globalThis.document = f.document;
  try {
    f.init(); f.load(); f.search('friend@school.test'); f.language('en'); assert.equal(f.document.querySelector('h2').textContent, 'Add and manage teachers');
    f.service.setContext({ status: 'signed-in', user: { uid: 'student' } }, { uid: 'student', status: 'ready', systemRole: 'student' }, true);
    assert.equal(f.document.querySelector('dialog').hasAttribute('open'), false); assert.equal(f.document.querySelector('#teacher-email').value, '');
    assert.equal(f.document.querySelector('[data-teacher-result]').textContent, ''); assert.equal(f.watchers.some(row => row.active), false);
  } finally { globalThis.document = original; }
});
test('Classroom management visibility follows the matching admin capability', async () => {
  const { document, window } = parseHTML(await readFile(new URL('../public/pages/classroom.html', import.meta.url), 'utf8'));
  const parent = { postMessage() {} };
  vm.runInContext(await readFile(new URL('../public/pages/shared/classroom-page.js', import.meta.url), 'utf8'), vm.createContext({ document, window, parent, location: { origin: 'https://example.test' }, setTimeout: () => 0, clearTimeout() {} }));
  const send = classroom => document.dispatchEvent(new window.CustomEvent('hub-page-context', { detail: { identity: { status: 'signed-in', uid: 'a' }, classroom } }));
  send({ uid: 'a', state: 'teacher', canManageTeachers: true }); assert.equal(document.querySelector('[data-manage-teachers]').hidden, false);
  send({ uid: 'a', state: 'teacher', canManageTeachers: false }); assert.equal(document.querySelector('[data-manage-teachers]').hidden, true);
  send({ uid: 'old', state: 'teacher', canManageTeachers: true }); assert.equal(document.querySelector('[data-manage-teachers]').hidden, true);
});
test('late clipboard completion cannot paint into a reopened dialog', async () => {
  const f = fixture(), original = globalThis.document; globalThis.document = f.document; let finish;
  try {
    const view = createClassroomTeacherDialog({ service: f.service, language: () => 'en', baseUrl: 'https://example.test/', clipboard: () => new Promise(resolve => { finish = resolve; }) });
    f.service.setContext(account, role, true); view.open(); f.document.querySelector('[data-teacher-copy]').click(); view.close(); view.open(); finish(); await Promise.resolve();
    assert.equal(f.document.querySelector('[data-teacher-copy-status]').textContent, '');
  } finally { globalThis.document = original; f.service.close(); }
});
