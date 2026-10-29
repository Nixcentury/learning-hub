import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, cp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { guideUrl, validateGuide, validateGuideTargets, findGuideTarget } from '../js/learning-guide-model.js';
import { createLearningGuide } from '../js/learning-guide.js';
import { guideFingerprint, validateLearningGuides } from './validate-learning-guides.mjs';
import { learningSheetTree, validateLearningSheet } from '../js/learning-sheet-model.js';

const sheetPath = 'public/content/physics/ipst/atomic-physics/19-1-2b-bohr-radius-energy-learning-sheet.html';
const sheetSource = await readFile(new URL('../' + sheetPath, import.meta.url), 'utf8');
const sample = JSON.parse(await readFile(new URL('../public/content/physics/ipst/atomic-physics/guides/19-1-2b.guide.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(sample);
const sheet = () => parseHTML(sheetSource).document;
const tick = () => new Promise(resolve => setImmediate(resolve));

test('sample guide has bilingual summaries, correct sheet identity and unique real targets', () => {
  assert.deepEqual(validateGuide(sample, sample.source), []);
  assert.deepEqual(validateLearningSheet(learningSheetTree(sheet().documentElement)), []);
  assert.deepEqual(validateGuideTargets(sample, sheet()), []);
  assert.equal(sample.source.sha256, guideFingerprint(sheetSource));
  assert.equal(sample.steps.length, 5);
  const doc = sheet();
  assert.equal(findGuideTarget(doc, sample.steps[0].links[0].target, 'en').closest('[data-content-lang]').getAttribute('data-content-lang'), 'en');
});

test('guide metadata is a paired document-level extension, without allowing arbitrary sheet controls', () => {
  const doc = sheet();
  doc.documentElement.removeAttribute('data-sheet-revision');
  assert.match(validateLearningSheet(learningSheetTree(doc.documentElement)).join(), /declared together/);
  doc.body.setAttribute('data-sheet-guide', 'a.guide.json');
  doc.body.setAttribute('data-sheet-unknown', 'x');
  assert.match(validateLearningSheet(learningSheetTree(doc.documentElement)).join(), /belongs only on html/);
  assert.match(validateLearningSheet(learningSheetTree(doc.documentElement)).join(), /data-sheet-unknown is not supported/);
});

test('rejects missing summaries, untranslated text, stale revisions and malformed links', () => {
  const mutations = [g => delete g.steps[0].summary, g => delete g.steps[0].summary.en,
    g => g.steps[0].summary.th = '<script>alert(1)</script>', g => g.steps[0].summary.en = '\\(E=hf\\)',
    g => g.steps[1].id = g.steps[0].id, g => g.steps[0].links[0].target.key = 'x"] script',
    g => g.steps[0].links[0].target.kind = 'url'];
  for (const mutate of mutations) { const g = copy(); mutate(g); assert.ok(validateGuide(g).length); }
  assert.match(validateGuide(sample, { contentId: 'another-sheet', revision: 'old' }).join(), /contentId.*revision/s);
  const doc = sheet(); doc.querySelector('[data-content-lang="en"] [data-sheet-slot="formula-radius"]').remove();
  assert.match(validateGuideTargets(sample, doc).join(), /en.*formula-radius/);
});

test('guide URLs cannot leave local content, carry query state or execute code', () => {
  const base = 'https://example.test/learning-hub/content/physics/topic/sheet.html';
  assert.equal(guideUrl('guides/a.guide.json', base), 'https://example.test/learning-hub/content/physics/topic/guides/a.guide.json');
  for (const value of ['https://evil.test/a.guide.json', 'javascript:x', '../../../a.guide.json', 'a.guide.json?x=1', '%2e%2e/a.guide.json', 'a.json', 'a.guide.json#x', 'https://user:pass@example.test/learning-hub/content/a.guide.json']) assert.throws(() => guideUrl(value, base));
});

function setup({ width = 1100, fetcher = async () => response(sample) } = {}) {
  const { document, window } = parseHTML('<html><body><button id="open"><span></span></button><div id="stage"><iframe></iframe></div></body></html>');
  const button = document.querySelector('button'), stage = document.querySelector('#stage'), frame = document.querySelector('iframe');
  let currentWidth = width;
  stage.getBoundingClientRect = () => ({ width: currentWidth });
  frame.src = 'https://example.test/learning-hub/content/physics/ipst/atomic-physics/19-1-2b-bohr-radius-energy-learning-sheet.html';
  frame.inert = false;
  button.focus = () => { document.activeElement = button; };
  let resize;
  class Observer { constructor(callback) { resize = callback; } observe() {} disconnect() { this.disconnected = true; } }
  const control = createLearningGuide({ frame, stage, button, contentId: sample.source.contentId, fetcher, ResizeObserverClass: Observer });
  const doc = sheet();
  for (const node of doc.querySelectorAll('[data-sheet-slot]')) {
    node.scrollIntoView = () => { node.scrolled = true; };
    node.focus = () => { node.focused = true; };
  }
  control.setDocument(doc);
  return { document, window, doc, button, stage, frame, control, panel: stage.querySelector('aside'), body: stage.querySelector('.learning-guide-body'), resize: width => { currentWidth = width; resize(); } };
}
function response(value) { return { ok: true, headers: { get: () => null }, text: async () => JSON.stringify(value) }; }

test('guide loads on demand, uses plain text and keeps language/check state without touching the sheet', async () => {
  let requests = 0;
  const g = copy(); g.steps[0].story.th = 'Compare K < U & E > 0';
  const ui = setup({ fetcher: async () => { requests++; return response(g); } });
  const before = ui.doc.body.innerHTML;
  assert.equal(requests, 0);
  ui.button.click(); await tick();
  assert.equal(requests, 1); assert.equal(ui.body.dataset.guideState, 'ready');
  assert.ok(ui.body.textContent.includes('K < U & E > 0'));
  assert.equal(ui.panel.hidden, false); assert.equal(ui.frame.inert, false);
  ui.body.querySelector('details').setAttribute('open', '');
  ui.control.setLanguage('en');
  assert.ok(ui.body.textContent.includes('Start with allowed orbits'));
  assert.equal(ui.body.querySelector('details').hasAttribute('open'), true);
  assert.equal(ui.doc.body.innerHTML, before, 'Reading/revealing the guide does not reveal worksheet answers');
  ui.panel.querySelector('.learning-guide-close').click();
  assert.equal(ui.panel.hidden, true); assert.equal(ui.button.getAttribute('aria-expanded'), 'false');
  ui.button.click(); await tick();
  assert.equal(requests, 1, 'Reopening reuses the loaded guide');
  ui.control.dispose(); assert.equal(ui.stage.querySelector('aside'), null);
});

test('jump selects the active-language semantic slot and drawer restores worksheet interaction', async () => {
  const ui = setup({ width: 375 });
  ui.button.click(); await tick();
  assert.equal(ui.panel.getAttribute('aria-modal'), 'true'); assert.equal(ui.frame.inert, true);
  ui.control.setLanguage('en');
  ui.body.querySelector('.learning-guide-links button').click();
  assert.equal(ui.panel.hidden, true); assert.equal(ui.frame.inert, false);
  const target = findGuideTarget(ui.doc, sample.steps[0].links[0].target, 'en');
  assert.equal(target.scrolled, true); assert.equal(target.focused, true);
  assert.equal(findGuideTarget(ui.doc, sample.steps[0].links[0].target, 'th').scrolled, undefined);
  ui.button.click(); ui.resize(1200); assert.equal(ui.frame.inert, false); assert.equal(ui.panel.getAttribute('role'), 'region');
  ui.control.dispose(); assert.equal(target.classList.contains('hub-guide-target'), false);
});

test('missing guide, fetch failure/retry and mismatched revision stay usable', async () => {
  let fail = true;
  const ui = setup({ fetcher: async () => { if (fail) throw new Error('offline'); return response(sample); } });
  ui.button.click(); await tick(); assert.equal(ui.body.dataset.guideState, 'error');
  fail = false; ui.body.querySelector('button').click(); await tick(); assert.equal(ui.body.dataset.guideState, 'ready');
  const next = sheet(); next.documentElement.removeAttribute('data-sheet-guide'); ui.control.setDocument(next); ui.button.click();
  assert.equal(ui.button.hidden, false); assert.equal(ui.body.dataset.guideState, 'empty');
  next.documentElement.removeAttribute('data-learning-sheet'); ui.control.setDocument(next); assert.equal(ui.button.hidden, true);
  ui.control.dispose();
  const bad = copy(); bad.source.revision = 'old';
  const other = setup({ fetcher: async () => response(bad) }); other.button.click(); await tick(); assert.equal(other.body.dataset.guideState, 'error'); other.control.dispose();
});

test('stale fetches cannot populate a replacement document or a closed window', async () => {
  let finish;
  const ui = setup({ fetcher: () => new Promise(resolve => { finish = resolve; }) });
  ui.button.click();
  const next = sheet(); next.documentElement.removeAttribute('data-sheet-guide'); ui.control.setDocument(next); ui.button.click();
  finish(response(sample)); await tick(); assert.equal(ui.body.dataset.guideState, 'empty');
  ui.control.dispose();
  const a = setup(), b = setup(); a.button.click(); await tick();
  assert.equal(b.panel.hidden, true); assert.equal(b.body.dataset.guideState, 'idle');
  a.control.dispose(); b.control.dispose();
});

test('build validation catches a source edit even when semantic targets still exist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'guide-validation-'));
  try {
    await cp(new URL('../index.html', import.meta.url), join(root, 'index.html'));
    await cp(new URL('../public/', import.meta.url), join(root, 'public'), { recursive: true });
    await writeFile(join(root, sheetPath), sheetSource.replace('พลังงานจลน์', 'พลังงานจลน์ที่แก้ไข'));
    const result = await validateLearningGuides({ root });
    assert.ok(result.errors.some(error => error.includes('Source changed')));
  } finally { await rm(root, { recursive: true, force: true }); }
});
