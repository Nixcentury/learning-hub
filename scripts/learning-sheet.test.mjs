import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readMetadata } from './route-html-metadata.mjs';
import { validateLearningSheet } from '../js/learning-sheet-model.js';
import { prepareLearningSheetPrint } from '../js/learning-sheet-print.js';

const slot = (id = 'one', extra = '', answer = 'Answer') => `<span data-sheet-slot="${id}" data-sheet-label-th="ช่องหนึ่ง" data-sheet-label-en="First slot" ${extra}><span data-sheet-answer>${answer}</span></span>`;
const sheet = body => `<html data-learning-html data-learning-sheet="1"><body>${body}</body></html>`;
const check = source => validateLearningSheet(readMetadata(source).children.find(node => node.tag === 'html'));

test('authored bilingual table/paragraph/multiline sample satisfies the shared contract', async () => {
  const demo = await readFile(new URL('../public/content/samples/learning-sheet-demo.html', import.meta.url), 'utf8');
  assert.deepEqual(check(demo), []);
  assert.deepEqual(check(sheet(slot('one', '', '<strong>Rich</strong> answer'))), []);
});
test('rejects missing, duplicate and nested slots/answers with the offending ID', () => {
  for (const body of [slot() + slot(), slot('one', '', slot('two')), slot().replace('data-sheet-answer', 'data-other'), slot().replace('</span></span>', '</span><span data-sheet-answer>extra</span></span>')]) {
    assert.match(check(sheet(body)).join(), /one|two/);
  }
  assert.match(check(sheet('')).join(), /at least one slot/);
  assert.match(check(sheet(slot('Uppercase'))).join(), /slot ID/);
  assert.match(check(sheet(slot()).replace('data-learning-sheet="1"', 'data-learning-sheet="2"')).join(), /data-learning-sheet="1"/);
});
test('bilingual slots share semantic IDs but not HTML IDs', () => {
  const bilingual = (a, b) => sheet(`<div data-content-lang="th">${a}</div><div data-content-lang="en">${b}</div>`);
  assert.deepEqual(check(bilingual(slot(), slot())), []);
  assert.match(check(bilingual(slot('one'), slot('two'))).join(), /same slot ID/);
  assert.match(check(bilingual(slot('one', 'id="collision"'), slot('one', 'id="collision"'))).join(), /duplicate HTML/);
});
test('keeps authoring readable and rejects unsupported interaction, groups and SVG slots', () => {
  for (const body of [slot('one', '', '<input>'), slot('one', '', '<a href="#">link</a>'), slot('one', 'data-sheet-group="g"'), `<svg>${slot()}</svg>`, slot().replace('data-sheet-answer', 'data-sheet-answer hidden')]) {
    assert.ok(check(sheet(body)).length, body);
  }
  assert.match(check(sheet(slot('one', 'data-sheet-size="huge"'))).join(), /size/);
  assert.match(check(sheet(slot('one', 'data-th="replacement"'))).join(), /text-replacement/);
  assert.match(check(sheet(slot().replace('data-sheet-answer', 'data-sheet-answer data-sheet-placeholder'))).join(), /separate elements/);
});
test('sheet print requires an explicit edition; regular reading documents are unaffected', () => {
  const source = { documentElement: { hasAttribute: () => true } };
  assert.throws(() => prepareLearningSheetPrint(source, 'screen'), /Choose blank or answers/);
  assert.doesNotThrow(() => prepareLearningSheetPrint({ documentElement: { hasAttribute: () => false } }));
});
