import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function fixture(persistenceFails = false) {
  let callback, options, popupResolver;
  const auth = { currentUser: null }, storage = new Map(), remembered = [];
  const local = {}, resolver = {}, user = { uid: 'user-a', displayName: 'A', email: 'a@example.test' };
  const context = vm.createContext({ window: {}, document: { dispatchEvent() {} },
    location: { protocol: 'https:' }, CustomEvent: class {}, console: { warn() {} },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    firebaseApp: {}, browserLocalPersistence: local, browserPopupRedirectResolver: resolver,
    initializeAuth(_app, dependencies) { options = dependencies; return auth; },
    GoogleAuthProvider: class { setCustomParameters() {} },
    setPersistence: async () => { if (persistenceFails) throw Error('storage blocked'); },
    onAuthStateChanged(_auth, fn) { callback = fn; },
    signInWithPopup: async (_auth, _provider, dependency) => { popupResolver = dependency; auth.currentUser = user; return { user }; },
    firebaseSignOut: async () => { auth.currentUser = null; },
    rememberHubView: session => remembered.push(session.status),
  });
  const source = readFileSync(new URL('../js/auth.js', import.meta.url), 'utf8')
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm, '').replace(/^export\s+/gm, '');
  vm.runInContext(source, context);
  return { api: context.window.HubAuth, get options() { return options; }, local, resolver, remembered,
    get popupResolver() { return popupResolver; }, resolve(user) { auth.currentUser = user; callback(user); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

void test('restoration uses local persistence and leaves mobile OAuth idle until sign-in', async () => {
  const f = fixture(); await tick();
  assert.equal(f.options.persistence, f.local);
  assert.equal(f.options.popupRedirectResolver, undefined);
  assert.equal(f.api.getSession().status, 'loading');
  assert.equal(f.popupResolver, undefined);
  await f.api.signInWithGoogle();
  assert.equal(f.popupResolver, f.resolver);
  assert.equal(f.api.getSession().user.uid, 'user-a');
});
void test('a saved session becomes usable only after Firebase confirms the user', async () => {
  const f = fixture(); await tick();
  let resolved = false; const session = f.api.waitForSession().then(value => { resolved = true; return value; });
  await tick(); assert.equal(resolved, false);
  f.resolve({ uid: 'restored-user', email: 'saved@example.test' });
  assert.equal((await session).user.uid, 'restored-user');
  assert.deepEqual(f.remembered, ['signed-in']);
  await f.api.signOut();
  assert.equal(f.api.getSession().status, 'signed-out');
  assert.equal(f.remembered.at(-1), 'signed-out');
});
void test('unavailable persistence still installs the observer and lets guests continue', async () => {
  const f = fixture(true); await tick(); f.resolve(null);
  assert.equal(f.api.getSession().status, 'signed-out');
  await f.api.continueAsGuest();
  assert.equal(f.api.getSession().status, 'guest');
});
