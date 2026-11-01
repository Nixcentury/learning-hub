import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { createGoogleClassroomDialog } from '../js/classroom-google-view.js';
import { googleClassroomMessage } from '../public/shared/classroom-google-model.js';
const id = '123456789012-ownedwebclient123.apps.googleusercontent.com';
test('top-level authorization is a direct button click after preparation, and public client setup is session-only', async () => {
  const { document, window } = parseHTML('<html><body></body></html>');
  const original = globalThis.document; globalThis.document = document;
  let state = { uid: 'teacher', status: 'disconnected', error: '', account: null, courses: [], canConnect: false, busy: false }, prepared = '', clicks = 0, dialog;
  const service = { getState: () => state, getClientId: () => prepared,
    prepare: async value => { prepared = value; state = { ...state, status: 'prepared', canConnect: true }; dialog.update(state); },
    connect: () => { clicks++; state = { ...state, status: 'authorizing', canConnect: false, busy: true }; dialog.update(state); },
    disconnect: () => { state = { ...state, status: 'disconnected', busy: false }; dialog.update(state); },
  };
  window.HTMLElement.prototype.focus = function() {};
  try {
    dialog = createGoogleClassroomDialog({ service, language: () => 'th', origin: 'https://nixcentury.github.io' });
    dialog.open(); const input = document.querySelector('[data-google-client-id]'); input.value = id;
    document.querySelector('[data-google-prepare]').click(); await Promise.resolve();
    assert.equal(document.querySelector('[data-google-authorize]').disabled, false);
    document.querySelector('[data-google-authorize]').click(); assert.equal(clicks, 1, 'Authorization runs synchronously inside the click');
    dialog.close(); assert.equal(document.querySelector('dialog').hasAttribute('open'), false); assert.equal(state.busy, false);
    dialog.open(); dialog.update({ uid: '', status: 'inactive', error: '', courses: [], canConnect: false, busy: false });
    assert.equal(document.querySelector('dialog').hasAttribute('open'), false); assert.equal(input.value, '');
  } finally { globalThis.document = original; }
});
async function cardFixture() {
  const html = await readFile(new URL('../public/pages/classroom.html', import.meta.url), 'utf8');
  const { window, document } = parseHTML(html); const messages = [], parent = { postMessage: message => messages.push(message) };
  const source = (await readFile(new URL('../public/pages/shared/classroom-google-page.js', import.meta.url), 'utf8')).replace(/^import .*?;\n/, '');
  vm.runInContext(source, vm.createContext({ document, window, parent, location: { origin: 'https://example.test' }, URL, googleClassroomMessage }));
  return { document, window, messages, update: value => document.dispatchEvent(new window.CustomEvent('hub-page-context', { detail: value })) };
}
const teacherContext = () => ({ language: 'th', identity: { status: 'signed-in', uid: 'teacher' }, classroom: { uid: 'teacher', state: 'teacher' },
  classroomGoogle: { uid: 'teacher', status: 'connected', busy: false, error: '', account: { email: 'teacher@school.test' }, courses: [{ id: '123', name: '<img src=x onerror=alert(1)> TEST #1', section: 'ห้อง 1', room: '', link: 'https://classroom.google.com/c/test' }] } });
test('teacher course card renders safe text and sends no token/client configuration to its parent', async () => {
  const f = await cardFixture(); f.update(teacherContext());
  const root = f.document.querySelector('[data-google-classroom-panel]'); assert.equal(root.hidden, false);
  assert.equal(root.querySelectorAll('img').length, 0); assert.ok(root.textContent.includes('teacher@school.test'));
  assert.equal(root.querySelector('a').rel, 'noopener noreferrer');
  root.querySelector('[data-google-connect]').click();
  assert.deepEqual(JSON.parse(JSON.stringify(f.messages.at(-1))), { type: 'learning-hub-google-classroom-action', uid: 'teacher', action: 'open' });
});
test('students, stale identities and sign-out cannot display a teacher account or course list', async () => {
  const f = await cardFixture(); const context = teacherContext(); f.update(context);
  f.update({ ...context, classroom: { uid: 'teacher', state: 'student' } });
  assert.equal(f.document.querySelector('[data-google-classroom-panel]').hidden, true);
  assert.equal(f.document.querySelectorAll('[data-google-course-id]').length, 0); assert.equal(f.document.querySelector('[data-google-account]').textContent, '');
  f.update({ ...context, identity: { status: 'signed-in', uid: 'other' } }); assert.equal(f.document.querySelectorAll('[data-google-course-id]').length, 0);
  f.update({ identity: { status: 'guest' }, classroom: { state: 'guest' } }); assert.equal(f.document.querySelectorAll('[data-google-course-id]').length, 0);
});
