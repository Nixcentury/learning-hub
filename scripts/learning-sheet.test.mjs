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

test('interference calculations: all 12 printed self-check answers survive either edition without exposing blank-edition workings',async()=>{
  const {parseHTML}=await import('linkedom');
  const {buildHtmlPrintSnapshot}=await import('../js/html-print.js');
  const {applyContentLanguage}=await import('../js/content-language.js');
  const file='content/physics/interference-9-4-3-basic-calculations-learning-sheet.html';
  const html=await readFile(new URL('../public/'+file,import.meta.url),'utf8');
  for(const lang of ['th','en'])for(const edition of ['blank','answers']){
    const {document:source}=parseHTML(html);
    Object.defineProperty(source,'URL',{value:'https://example.test/learning-hub/'+file});
    Object.defineProperty(source,'defaultView',{value:undefined});
    applyContentLanguage(source,lang);
    const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'Interference self-check'));
    for(const el of copy.querySelectorAll('[data-sheet-slot],[data-sheet-answer]'))el.getBoundingClientRect=()=>({width:600,height:150});
    prepareLearningSheetPrint(copy,edition);
    assert.equal(copy.querySelectorAll('.calc-problem').length,12);
    assert.equal(copy.querySelectorAll('[data-print-check-answer]').length,12);
    assert.equal(copy.querySelectorAll('[data-sheet-answer]').length,edition==='blank'?0:12);
    assert.equal(copy.querySelectorAll('[data-sheet-blank-area]').length,edition==='blank'?12:0);
    for(const p of copy.querySelectorAll('.calc-problem')){
      assert.ok(p.querySelector(':scope>[data-print-check-answer]'));
      assert.equal(p.querySelectorAll('[data-print-check-answer] [data-sheet-answer]').length,0);
    }
    assert.match(copy.querySelector('[data-print-check-answer="1"]').textContent,/8\.0/);
    assert.match(copy.querySelector('[data-print-check-answer="4"]').textContent,lang==='th'?/บัพ/:/node/);
    assert.match(copy.querySelector('[data-print-check-answer="6"]').textContent,/90/);
    assert.equal(source.querySelectorAll('[data-sheet-answer]').length,24,'printing must preserve live answers');
  }
});

test('interference calculations: replace only Q7 with line counting and retain 12 questions',async()=>{
  const {parseHTML}=await import('linkedom');
  const path='../public/content/physics/interference-9-4-3-basic-calculations-learning-sheet.html';
  const {document:current}=parseHTML(await readFile(new URL(path,import.meta.url),'utf8'));
  const {document:before}=parseHTML(await readFile(new URL('../docs/learning-sheet/preparation/physics-interference-9-4-3/basic-calculations-before-count-lines.html',import.meta.url),'utf8'));
  for(const lang of ['th','en']){
    const a=before.querySelector(`[data-content-lang="${lang}"]`).querySelectorAll('.calc-problem');
    const b=current.querySelector(`[data-content-lang="${lang}"]`).querySelectorAll('.calc-problem');
    assert.equal(b.length,12);
    for(let i=0;i<12;i++)if(i!==6)assert.equal(b[i].outerHTML,a[i].outerHTML,`${lang} Question ${i+1} remains unchanged`);
    assert.ok(b[6].querySelector('[data-sheet-slot="count-node-antinode-lines"]'));
    assert.match(b[6].querySelector('[data-print-check-answer]').textContent,/5.*4/);
    assert.match(b[6].querySelector('[data-sheet-answer]').textContent,/2\.4/);
    assert.match(b[6].querySelector('[data-sheet-answer]').textContent,/2\.9/);
    assert.ok(b[11].querySelector('[data-sheet-slot="geometry-sound"]'));
  }
  // Enumerate allowed orders from the physical path-difference bound.
  const orders=Array.from({length:10},(_,m)=>m);
  const antinodes=orders.filter(m=>m*10<=24),nodes=orders.filter(m=>m>=1&&(m-.5)*10<=24);
  assert.deepEqual(antinodes,[0,1,2]);assert.deepEqual(nodes,[1,2]);
  assert.equal(1+2*(antinodes.length-1),5);assert.equal(2*nodes.length,4);
});

test('Bohr calculations: 14 paired questions retain printed final answers without leaking blank-edition workings', async () => {
  const { parseHTML } = await import('linkedom');
  const { buildHtmlPrintSnapshot } = await import('../js/html-print.js');
  const { applyContentLanguage } = await import('../js/content-language.js');
  const file = 'content/physics/ipst/atomic-physics/19-1-2-basic-calculations-learning-sheet.html';
  const html = await readFile(new URL('../public/' + file, import.meta.url), 'utf8');
  assert.deepEqual(check(html), []);
  const { document } = parseHTML(html);
  const keys = lang => [...document.querySelectorAll(`[data-content-lang="${lang}"] [data-sheet-slot]`)].map(node => node.dataset.sheetSlot);
  assert.equal(keys('th').length, 14);
  assert.deepEqual(keys('th'), keys('en'));
  for (const lang of ['th', 'en']) for (const edition of ['blank', 'answers']) {
    const { document: source } = parseHTML(html);
    Object.defineProperty(source, 'URL', { value: 'https://example.test/learning-hub/' + file });
    Object.defineProperty(source, 'defaultView', { value: undefined });
    applyContentLanguage(source, lang);
    const { document: copy } = parseHTML(buildHtmlPrintSnapshot(source, 'Bohr self-check'));
    for (const node of copy.querySelectorAll('[data-sheet-slot],[data-sheet-answer]')) node.getBoundingClientRect = () => ({ width: 600, height: 150 });
    prepareLearningSheetPrint(copy, edition);
    assert.equal(copy.querySelectorAll('.calc-problem').length, 14);
    assert.equal(copy.querySelectorAll('[data-print-check-answer]').length, 14);
    assert.equal(copy.querySelectorAll('[data-sheet-answer]').length, edition === 'blank' ? 0 : 14);
    assert.equal(copy.querySelectorAll('[data-sheet-blank-area]').length, edition === 'blank' ? 14 : 0);
    assert.equal(copy.querySelectorAll(`[data-content-lang="${lang === 'th' ? 'en' : 'th'}"]`).length, 0);
    assert.equal(copy.querySelectorAll('.calc-student-info').length, 1);
    for (const [i, problem] of [...copy.querySelectorAll('.calc-problem')].entries()) {
      const finalAnswer = problem.querySelector('[data-print-check-answer]');
      assert.equal(finalAnswer.dataset.printCheckAnswer, String(i + 1));
      assert.equal(finalAnswer.nextElementSibling.hasAttribute('data-sheet-slot'), true);
    }
    assert.equal(source.querySelectorAll('[data-sheet-answer]').length, 28, 'Print must not mutate the reading document');
  }
});
