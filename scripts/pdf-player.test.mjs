import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as model from '../public/shared/pdf-content-model.js';

// Run the actual player with a tiny DOM/PDF.js substitute. No browser, Drive,
// authentication, external downloads or live services are touched by these tests.
const hub = 'https://school.test/learning-hub/';
const code = readFileSync(new URL('../public/pages/tools/pdf-player.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/m, '')
  .replace("await import(new URL('legacy/build/pdf.min.mjs', vendor).href)", 'await loadPdfJs()');

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness(sources = {}, { auto = true, language = 'th', legacy = false } = {}) {
  const nodes = {}, tasks = [], renders = [], clicks = [], blobs = [], revoked = [], fetches = [];
  const timers = new Map(), listeners = {};
  let languageCallback, timerId = 0;
  class Element {
    constructor(tag = 'div') {
      this.tag = tag; this.dataset = {}; this.style = {}; this.children = [];
      this.attributes = new Map(); this.events = {}; this.hidden = false;
      this.clientWidth = 900; this.clientHeight = 650; this.value = '';
      const classes = new Set();
      this.classList = { contains: key => classes.has(key), toggle(key, on) { on ? classes.add(key) : classes.delete(key); } };
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); if (name === 'src') this.src = ''; }
    addEventListener(type, fn) { this.events[type] = fn; }
    append(node) { this.children.push(node); }
    replaceChildren(...nodes) { this.children = nodes; }
    getContext() { return {}; }
    remove() {}
    click() { clicks.push({ href: this.href, download: this.download }); }
  }
  for (const id of ['pdf-controls', 'pdf-viewport', 'pdf-page-stage', 'pdf-status', 'pdf-page', 'pdf-zoom',
    'pdf-prev', 'pdf-next', 'pdf-download', 'pdf-original', 'pdf-language-note', 'pdf-drive-frame', 'pdf-drive-note', 'pdf-total', 'pdf-resources']) nodes[id] = new Element();
  nodes['pdf-zoom'].value = 'page';
  const document = { documentElement: { lang: language }, body: new Element('body'),
    getElementById: id => nodes[id], createElement: tag => new Element(tag),
    querySelectorAll: () => Object.values(nodes).filter(node => node.dataset.th !== undefined && node.dataset.en !== undefined) };
  const params = new URLSearchParams({ id: 'sound-sheet' });
  if (legacy) params.set('content', 'content/p/descriptor.html');
  else {
    params.set('inline', '1');
    for (const [key, value] of Object.entries(sources)) params.set(`pdf-${key}`, value);
  }
  class PlayerURL extends URL {
    static createObjectURL(blob) { blobs.push(blob); return `blob:pdf-${blobs.length}`; }
    static revokeObjectURL(url) { revoked.push(url); }
  }
  const context = vm.createContext({ ...model, document, URL: PlayerURL, URLSearchParams, Blob, AbortController,
    location: { href: new URL(`pages/tools/pdf-player.html?${params}`, hub).href, search: '?' + params },
    window: { devicePixelRatio: 1, addEventListener: (key, fn) => { listeners[key] = fn; } },
    MutationObserver: class { constructor(fn) { languageCallback = fn; } observe() {} disconnect() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
    fetch: async url => { fetches.push(String(url)); return { ok: true, redirected: false, text: async () => '<fixture>' }; },
    DOMParser: class { parseFromString() { return {
      title: 'Legacy slides', documentElement: { hasAttribute: () => true, attributes: [
        { name: 'data-learning-pdf', value: '1' }, { name: 'data-activity-id', value: 'sound-sheet' },
        { name: 'data-pdf-src', value: 'slides.pdf' }] }, querySelectorAll: () => [],
    }; } },
    loadPdfJs: async () => ({ GlobalWorkerOptions: {}, getDocument(options) {
      const loading = deferred();
      const pdf = { numPages: 10,
        getPage: async number => ({
          getViewport: ({ scale }) => ({ width: 400 * scale, height: 300 * scale,
            convertToViewportRectangle: box => box }),
          render: () => { renders.push({ url: options.url, page: number }); return { promise: Promise.resolve(), cancel() {} }; },
          getAnnotations: async () => [],
        }),
        getData: async () => new Uint8Array([37, 80, 68, 70, 45]),
        getDestination: async () => [0], getPageIndex: async () => 0,
      };
      const task = { ...loading, pdf, url: options.url, destroyed: 0,
        destroy: async () => { ++task.destroyed; } };
      tasks.push(task);
      if (auto) task.resolve(pdf);
      return task;
    } }),
  });
  vm.runInContext(code, context);
  const flush = async () => { for (let i = 0; i < 3; i++) await new Promise(resolve => setImmediate(resolve)); };
  return { nodes, tasks, renders, clicks, blobs, revoked, fetches, timers, flush,
    async language(code) { document.documentElement.lang = code; languageCallback(); await flush(); },
    async page(number) { nodes['pdf-page'].value = number; nodes['pdf-page'].events.change(); await flush(); },
    async zoom(value) { nodes['pdf-zoom'].value = value; nodes['pdf-zoom'].events.change(); await flush(); },
    download() { return nodes['pdf-download'].events.click({ preventDefault() {} }); },
    close() { listeners.pagehide(); },
  };
}

test('shared PDF keeps page and zoom on TH/EN changes without fetching or reloading', async () => {
  const h = harness({ common: new URL('content/p/shared.pdf', hub).href });
  await h.flush(); await h.page(7); await h.zoom('1.5');
  const renders = h.renders.length;
  await h.language('en');
  assert.equal(h.tasks.length, 1);
  assert.equal(h.renders.length, renders);
  assert.equal(h.nodes['pdf-page-stage'].dataset.pageNumber, 7);
  assert.equal(h.nodes['pdf-zoom'].value, '1.5');
  assert.equal(h.nodes['pdf-language-note'].hidden, true);
  assert.equal(h.fetches.length, 0);
  h.close();
});

test('separate language files restore independent reading positions and download URLs', async () => {
  const th = new URL('content/p/th.pdf', hub).href, en = new URL('content/p/en.pdf', hub).href;
  const h = harness({ th, en });
  await h.flush(); await h.page(8); await h.zoom('width');
  await h.language('en');
  assert.equal(h.nodes['pdf-page-stage'].dataset.pageNumber, 1);
  assert.equal(h.nodes['pdf-original'].href, en);
  assert.equal(h.nodes['pdf-download'].getAttribute('download'), 'sound-sheet-en.pdf');
  await h.page(3); await h.language('th');
  assert.equal(h.nodes['pdf-page-stage'].dataset.pageNumber, 8);
  assert.equal(h.nodes['pdf-zoom'].value, 'width');
  await h.language('en');
  assert.equal(h.nodes['pdf-page-stage'].dataset.pageNumber, 3);
  assert.ok(h.tasks.slice(0, -1).every(task => task.destroyed === 1));
  h.close();
});

test('one available language falls back with a visible notice and does not reload', async () => {
  const h = harness({ th: new URL('content/p/th.pdf', hub).href }, { language: 'en' });
  await h.flush();
  assert.equal(h.nodes['pdf-language-note'].hidden, false);
  assert.match(h.nodes['pdf-language-note'].textContent, /English is not available/);
  await h.language('th');
  assert.equal(h.nodes['pdf-language-note'].hidden, true);
  assert.equal(h.tasks.length, 1);
  h.close();
});

test('empty inline links show preparation without a PDF request or blank download button', async () => {
  const h = harness({ common: '', en: ' ' });
  await h.flush(); await h.language('en');
  assert.equal(h.tasks.length, 0);
  assert.equal(h.fetches.length, 0);
  assert.equal(h.nodes['pdf-download'].hidden, true);
  assert.equal(h.nodes['pdf-original'].hidden, true);
  assert.match(h.nodes['pdf-status'].textContent, /in preparation/);
  h.close();
});

test('Drive preview, open and download links follow the selected file and keep resource keys', async () => {
  const th = 'https://drive.google.com/file/d/abcdefghijk12345/view?resourcekey=0-abc';
  const en = 'https://drive.google.com/file/d/lmnopqrstuv67890/view';
  const h = harness({ th, en });
  await h.flush();
  assert.equal(h.nodes['pdf-drive-frame'].src, th.replace('/view', '/preview'));
  assert.equal(h.nodes['pdf-download'].href, th);
  assert.equal(h.nodes['pdf-download'].getAttribute('download'), null);
  assert.match(h.nodes['pdf-original'].textContent, /Google Drive/);
  await h.language('en');
  assert.equal(h.nodes['pdf-drive-frame'].src, en.replace('/view', '/preview'));
  assert.equal(h.nodes['pdf-original'].href, en);
  assert.equal(h.nodes['pdf-download'].href, en);
  assert.equal(h.tasks.length, 0);
  assert.equal(h.fetches.length, 0);
  h.close();
});

test('a late load from the previous language cannot replace the active document', async () => {
  const th = new URL('content/p/th.pdf', hub).href, en = new URL('content/p/en.pdf', hub).href;
  const h = harness({ th, en }, { auto: false });
  await h.flush(); await h.language('en');
  const [old, current] = h.tasks;
  current.resolve(current.pdf); await h.flush();
  old.resolve(old.pdf); await h.flush();
  assert.equal(h.nodes['pdf-original'].href, en);
  assert.equal(h.renders.at(-1).url, en);
  assert.ok(h.renders.every(render => render.url === en));
  h.close();
});

test('cross-origin downloads use the active PDF bytes and revoke Blob URLs on close', async () => {
  const h = harness({ en: 'https://cdn.test/en.pdf' }, { language: 'en' });
  await h.flush(); await h.download();
  assert.equal(h.blobs.length, 1);
  assert.equal(h.blobs[0].type, 'application/pdf');
  assert.equal(h.clicks[0].download, 'sound-sheet-en.pdf');
  h.close();
  assert.equal(h.revoked[0], h.clicks[0].href);
});

test('switching language during download cannot save the old document as the new language', async () => {
  const h = harness({ th: 'https://cdn.test/th.pdf', en: 'https://cdn.test/en.pdf' });
  await h.flush();
  const data = deferred(); h.tasks[0].pdf.getData = () => data.promise;
  const pending = h.download();
  await h.language('en'); data.resolve(new Uint8Array([1, 2, 3])); await pending;
  assert.equal(h.blobs.length, 0);
  assert.equal(h.nodes['pdf-download'].href, 'https://cdn.test/en.pdf');
  h.close();
});

test('legacy single-source descriptors still fetch local HTML and open the same shared player', async () => {
  const h = harness({}, { legacy: true });
  await h.flush();
  assert.equal(h.fetches[0], new URL('content/p/descriptor.html', hub).href);
  assert.equal(h.tasks[0].url, new URL('content/p/slides.pdf', hub).href);
  await h.language('en');
  assert.equal(h.tasks.length, 1);
  h.close();
});
