import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { createPwaUpdates } from '../js/pwa-updates.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const { document, window: dom } = parseHTML(html);
  const serviceWorker = new EventTarget(), registration = new EventTarget();
  let reloads = 0, prepares = 0, updates = 0, allow = true, fail = false;
  const timers = new Map();
  Object.assign(registration, { active: {}, installing: null, waiting: null, async update() { updates++; if (fail) throw Error('offline'); } });
  const window = { navigator: { onLine: true }, location: { reload() { reloads++; } },
    setTimeout(fn) { const key = {}; timers.set(key, fn); return key; }, clearTimeout(key) { timers.delete(key); } };
  const controller = createPwaUpdates({ registration, serviceWorker, document, window, beforeReload: async () => { prepares++; return allow; } });
  function ready() {
    const worker = new EventTarget();
    Object.assign(worker, { state: 'installing', messages: [], postMessage(value) { this.messages.push(value); } });
    registration.installing = worker; registration.dispatchEvent(new Event('updatefound'));
    worker.state = 'installed'; registration.waiting = worker; registration.installing = null;
    worker.dispatchEvent(new Event('statechange')); return worker;
  }
  return { document, registration, serviceWorker, window, controller, ready, timers,
    click(selector) { document.querySelector(selector).dispatchEvent(new dom.Event('click')); },
    get reloads() { return reloads; }, get prepares() { return prepares; }, get updates() { return updates; },
    set allow(value) { allow = value; }, set fail(value) { fail = value; } };
}
void test('background installation and activation from another tab never reload this workspace', () => {
  const f = fixture(), worker = f.ready();
  assert.equal(f.document.querySelector('#hub-update-notice').hidden, false);
  assert.equal(f.document.querySelector('#hub-check-update').textContent, 'อัปเดตและเปิดใหม่');
  f.click('[data-update-later]');
  worker.state = 'activated'; f.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(f.reloads, 0); assert.equal(f.prepares, 0); assert.deepEqual(worker.messages, []);
});
void test('manual update waits for save checks and reloads once after activation', async () => {
  const f = fixture(), worker = f.ready(); f.click('[data-update-apply]');
  assert.deepEqual(worker.messages, []); await tick();
  assert.equal(f.prepares, 1);
  assert.deepEqual(worker.messages, [{ type: 'HUB_APPLY_UPDATE' }]);
  assert.equal(f.reloads, 0);
  worker.state = 'activated'; worker.dispatchEvent(new Event('statechange'));
  f.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(f.reloads, 1); assert.equal(f.timers.size, 0);
});
void test('cancelled saving keeps the worker waiting and the workspace open', async () => {
  const f = fixture(), worker = f.ready(); f.allow = false;
  f.click('#hub-check-update'); await tick();
  assert.equal(f.prepares, 1); assert.deepEqual(worker.messages, []);
  assert.equal(f.reloads, 0);
  assert.equal(f.document.querySelector('#hub-check-update').disabled, false);
});
void test('latest, offline and failed checks are visible in TH/EN without a reload', async () => {
  const f = fixture(); f.document.documentElement.lang = 'en'; await f.controller.check();
  assert.equal(f.updates, 1);
  assert.equal(f.document.querySelector('[data-update-message]').textContent, 'You are using the latest version.');
  f.window.navigator.onLine = false; await f.controller.check();
  assert.equal(f.updates, 1); assert.match(f.document.querySelector('[data-update-message]').textContent, /internet/);
  f.window.navigator.onLine = true; f.fail = true; await f.controller.check();
  assert.match(f.document.querySelector('[data-update-message]').textContent, /try again/);
  assert.equal(f.document.querySelector('#hub-check-update').disabled, false);
  assert.equal(f.reloads, 0);
});
void test('an activation failure times out without destroying work and can be retried', async () => {
  const f = fixture(), worker = f.ready(); f.click('[data-update-apply]'); await tick();
  [...f.timers.values()][0]();
  assert.equal(f.reloads, 0); assert.equal(f.document.querySelector('#hub-check-update').disabled, false);
  f.click('[data-update-apply]'); await tick(); assert.equal(worker.messages.length, 2);
});
void test('entry requests stay online-first and only the explicit message activates early', async () => {
  const handlers = {}, requests = []; let activations = 0;
  const scope = vm.createContext({ URL, Response, OFFLINE_PAGE: '<h1>Offline</h1>',
    fetch: async (...args) => { requests.push(args); return new Response('online'); },
    self: { registration: { scope: 'https://example.test/learning-hub/' }, addEventListener(type, fn) { handlers[type] = fn; }, skipWaiting() { activations++; return Promise.resolve(); } } });
  vm.runInContext(readFileSync(new URL('./pwa-worker.js', import.meta.url), 'utf8'), scope);
  assert.equal(activations, 0); handlers.message({ data: { type: 'other' } }); assert.equal(activations, 0);
  await new Promise(resolve => handlers.message({ data: { type: 'HUB_APPLY_UPDATE' }, waitUntil: promise => promise.then(resolve) }));
  assert.equal(activations, 1);
  const event = pathname => ({ request: { url: 'https://example.test' + pathname, method: 'GET', mode: 'navigate' }, respondWith(value) { this.response = value; } });
  const entry = event('/learning-hub/'); handlers.fetch(entry);
  assert.equal(await (await entry.response).text(), 'online'); assert.equal(requests[0][1].cache, 'no-cache');
  const lesson = event('/learning-hub/content/lesson.html'); handlers.fetch(lesson);
  assert.equal(lesson.response, undefined);
});
