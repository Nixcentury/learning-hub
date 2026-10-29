import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { createVideoManifest, videoEmbedUrl } from '../public/shared/video-content-model.js';
import { applyContentLanguage } from '../js/content-language.js';

const html = readFileSync(new URL('../public/pages/tools/video-player.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../public/pages/tools/video-player.js', import.meta.url), 'utf8').replace(/^import .*;\n/, '');
const video = 'https://www.youtube.com/watch?v=M7lc1UVf-VE';
function harness(value = video) {
  const { document } = parseHTML(html), events = {}, messages = [], timers = new Map();
  let count = 0, api, paused = 0, destroyed = 0;
  const parent = {}, window = { addEventListener: (name, fn) => { events[name] = fn; } };
  parent.postMessage = (message, origin) => messages.push({ message, origin });
  const location = new URL('https://school.test/learning-hub/pages/tools/video-player.html');
  location.search = new URLSearchParams({ video: value, id: 'sound-video', 'title-th': 'คลิปเสียง', 'title-en': 'Sound video' }).toString();
  const context = vm.createContext({ window, parent, document, location, URLSearchParams, createVideoManifest, videoEmbedUrl,
    setTimeout(fn) { timers.set(++count, fn); return count; }, clearTimeout(id) { timers.delete(id); } });
  window.YT = { Player: class {
    constructor(id, options) { api = options.events; this.id = id; }
    pauseVideo() { paused++; }
    destroy() { destroyed++; }
  } };
  vm.runInContext(source, context);
  return { document, window, events, messages, timers,
    ready() { window.onYouTubeIframeAPIReady(); api.onReady(); },
    error() { api.onError({ data: 101 }); },
    visibility(visible, origin = location.origin, caller = parent) { events.message({ origin, source: caller, data: { type: 'learning-hub-tool-visibility', visible } }); },
    paused: () => paused, destroyed: () => destroyed };
}

test('video player starts on user action, shows a fallback link and preserves its iframe on language changes', () => {
  const h = harness(); h.ready();
  const frame = h.document.getElementById('video-frame');
  const initial = frame.getAttribute('src');
  assert.equal(new URL(initial).searchParams.get('autoplay'), '0');
  assert.equal(h.document.getElementById('video-original').getAttribute('href'), video);
  applyContentLanguage(h.document, 'en');
  assert.equal(h.document.getElementById('video-title').textContent, 'Sound video');
  assert.equal(frame.getAttribute('src'), initial);
  assert.equal(h.timers.size, 0);
  assert.ok(h.messages.every(row => !JSON.stringify(row).match(/uid|identity|role|token/)));
});

test('minimize pauses video while forged messages cannot control playback; restoring never autoplays', () => {
  const h = harness(); h.ready();
  h.visibility(false, 'https://evil.test'); h.visibility(false, 'https://school.test', {});
  assert.equal(h.paused(), 0);
  h.visibility(false); assert.equal(h.paused(), 1);
  h.visibility(true); assert.equal(h.paused(), 1);
  h.events.pagehide(); assert.equal(h.destroyed(), 1);
});

test('minimize before API ready pauses immediately once the player is ready', () => {
  const h = harness(); h.visibility(false); h.ready(); assert.equal(h.paused(), 1);
});

test('blocked embeds, failed API loads and timeout retain the YouTube fallback', () => {
  for (const scenario of ['embed', 'script', 'timeout']) {
    const h = harness();
    if (scenario === 'embed') { h.ready(); h.error(); }
    else if (scenario === 'script') h.document.head.querySelector('script[src]').onerror();
    else [...h.timers.values()][0]();
    assert.equal(h.document.getElementById('video-status').classList.contains('is-error'), true);
    assert.equal(h.document.getElementById('video-original').hidden, false);
  }
});

test('invalid and unfinished links do not load YouTube or an executable iframe', () => {
  for (const value of ['', 'javascript:alert(1)', 'https://evil.test/video']) {
    const h = harness(value);
    assert.equal(h.document.getElementById('video-frame').getAttribute('src'), null);
    assert.equal(h.document.head.querySelector('script[src]'), null);
    assert.equal(h.document.getElementById('video-original').hidden, true);
  }
});
