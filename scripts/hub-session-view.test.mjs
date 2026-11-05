import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { rememberHubView, shouldResumeHub, canOpenHubWorkspace, renderHubSessionView } from '../js/hub-session-view.js';

function storageFixture(run) {
  const saved = ['localStorage', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  const store = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), data }; };
  try { globalThis.localStorage = store(); globalThis.sessionStorage = store(); run(); }
  finally { for (const [key, descriptor] of saved) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
  } }
}
void test('the resume hint stores no identity and clears on sign-out or guest mode', () => storageFixture(() => {
  assert.equal(shouldResumeHub(), false);
  rememberHubView({ status: 'signed-in', user: { uid: 'private-user', email: 'private@example.test' } });
  assert.equal(shouldResumeHub(), true);
  assert.deepEqual([...localStorage.data.values()], ['1']);
  rememberHubView({ status: 'loading' }); assert.equal(shouldResumeHub(), true);
  for (const status of ['signed-out', 'guest']) {
    rememberHubView({ status }); assert.equal(shouldResumeHub(), false);
  }
  sessionStorage.setItem('learning-hub-guest-session', '1');
  assert.equal(shouldResumeHub(), true);
}));
void test('unavailable storage cannot break authentication or startup', () => storageFixture(() => {
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  globalThis.sessionStorage = { getItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => rememberHubView({ status: 'signed-in' }));
  assert.equal(shouldResumeHub(), false);
}));
void test('returning users see menus during restore while account-dependent work stays blocked', () => {
  const { document } = parseHTML('<div id="login"></div><div id="hub" hidden></div><aside hidden></aside>');
  const views = { loginView: document.querySelector('#login'), hubView: document.querySelector('#hub'), pendingNotice: document.querySelector('aside') };
  const render = status => renderHubSessionView({ session: { status }, restoring: true, resume: true, ...views });
  assert.equal(render('loading').pending, true);
  assert.equal(views.hubView.hidden, false);
  assert.equal(views.pendingNotice.hidden, false);
  assert.equal(canOpenHubWorkspace({ status: 'loading', user: { uid: 'cached-user' } }), false);
  for (const status of ['signed-in', 'guest']) {
    assert.equal(render(status).showHub, true);
    assert.equal(views.pendingNotice.hidden, true);
    assert.equal(canOpenHubWorkspace({ status }), true);
  }
  assert.equal(render('signed-out').showHub, false);
  assert.equal(views.hubView.hidden, true);
  assert.equal(views.loginView.hidden, false);
});
void test('new visitors and explicit sign-in attempts retain the login screen', () => {
  const nodes = { loginView: {}, hubView: {}, pendingNotice: {} };
  for (const [restoring, resume] of [[true, false], [false, true]]) {
    assert.equal(renderHubSessionView({ session: { status: 'loading' }, restoring, resume, ...nodes }).pending, false);
    assert.equal(nodes.loginView.hidden, false);
    assert.equal(nodes.pendingNotice.hidden, true);
  }
});
