import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { DOMParser, parseHTML } from 'linkedom';
import { staticBankSvgImage } from '../public/shared/question-bank-svg.js';
import { adaptLegacyBank } from '../public/shared/question-bank-adapter.js';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { svg, legacySvgQuestions } from './fixtures/bank-static-svg.mjs';
const { document } = parseHTML('<!doctype html><html><body></body></html>');
const parse = text => new DOMParser().parseFromString(text, 'text/html').querySelector('svg');
const image = text => staticBankSvgImage(parse(text), document);
const decode = img => decodeURIComponent(img.getAttribute('src').split(',').slice(1).join(','));
const adapt = html => adaptLegacyBank({ subjectId: 'chemistry', bankKey: 'b-'+'e'.repeat(24), revision: 'a'.repeat(64), title: 'SVG QA', rows: [{ rowNumber: 9, html }] }, { document, Parser: DOMParser });

test('static SVG remains vector artwork with local markers, gradients, clipping, symbols and accessible alt', () => {
  const img = image(svg), result = decode(img);
  assert.equal(img.localName, 'img');
  assert.equal(img.alt, 'ลูกศรแสดงการเปลี่ยนจาก A ไป B');
  for (const part of ['<marker', 'marker-end="url(#arrow)"', '<linearGradient', 'clip-path="url(#clip)"', 'href="#atom"', 'viewBox="0 0 340 150"']) assert.ok(result.includes(part), part);
  assert.equal(new DOMParser().parseFromString(result, 'image/svg+xml').documentElement.localName, 'svg');
  assert.ok(img.getAttribute('src').startsWith('data:image/svg+xml;'));
});

test('SVG in prompt, context, choices, hint and solution survives the legacy adapter and print cloning', () => {
  const root = adapt(legacySvgQuestions), result = readQuizContent(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.questions.length, 2);
  for (const selector of ['[data-question-prompt]','[data-question-context]','[data-choice-id]','[data-question-hint]','[data-question-solution]']) assert.ok(root.querySelector(`${selector} img`), selector);
  assert.equal(root.querySelectorAll('svg').length, 0);
  assert.equal(root.querySelectorAll('img[src^="data:image/svg+xml"]').length, 6);
  assert.equal(root.querySelectorAll('img[src^="https:"]').length, 3);
  const clone = root.cloneNode(true);
  assert.deepEqual([...clone.querySelectorAll('img')].map(img=>img.src), [...root.querySelectorAll('img')].map(img=>img.src));
  assert.equal(root.querySelectorAll('[id]').length, 0); // IDs are private image-document data.
});

test('plain dimensions, responsive viewBox and safe SVG presentation styles are retained', () => {
  const result = decode(image('<svg width="200" height="100"><text x="10" y="20" style="fill:#174e70;font-size:18px">H₂O &amp; CO₂</text></svg>'));
  assert.match(result, /viewBox="0 0 200 100"/);
  assert.match(result, /fill="#174e70"/); assert.match(result, /font-size="18px"/);
  assert.match(result, /H₂O &amp; CO₂/); assert.doesNotMatch(result, /style=/);
  assert.match(decode(image('<svg viewBox="0 0 300 150" width="100%" height="100%"><circle cx="30" cy="30" r="10"/></svg>')), /width="300"/);
});

test('SVG also works inside numeric feedback without changing answers or tolerance', () => {
  const root = adapt(`<div class="question-step" data-type="fill-in" data-ans="6.70"><h3>หาค่า pKa</h3><div class="answer-section"><input type="number" class="num-answer"></div><div class="feedback-box">6.70 ${svg}</div></div>`);
  const {questions:[q],errors}=readQuizContent(root);
  assert.deepEqual(errors,[]); assert.equal(q.answer,'6.70'); assert.equal(q.tolerance,0);
  assert.ok(q.solution.querySelector('img'));
});

test('real Print Core preserves SVG in worksheets and answer keys without changing the source', () => {
  const { document: printDocument } = parseHTML('<!doctype html><html lang="th"><head><title>SVG print QA</title></head><body></body></html>');
  const root = adaptLegacyBank({ subjectId: 'chemistry', bankKey: 'b-'+'e'.repeat(24), revision: 'a'.repeat(64), title: 'SVG print QA', rows: [{ rowNumber: 9, html: legacySvgQuestions }] }, { document: printDocument, Parser: DOMParser });
  // Apply the same print-source classes as Quiz Core before configuring Print Core.
  root.classList.add('activity-content', 'quiz-print-content');
  root.querySelectorAll('[data-question]').forEach((q, i) => {
    q.dataset.printIndex = String(i + 1);
    q.querySelector('[data-question-solution]').classList.add('activity-question-solution');
  });
  printDocument.body.append(root);
  const source = root.outerHTML;
  const window = { addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(new URL('../public/shared/print-core.js', import.meta.url), 'utf8'), { window, document: printDocument, Intl, Date });
  const print = window.LearningHubPrint;
  print.configure({ getTitle: () => 'SVG print QA', getContent: () => root });
  const host = printDocument.querySelector('[data-print-host]');
  assert.equal(print.prepare('worksheet'), true);
  assert.equal(host.querySelectorAll('[data-question]').length, 2);
  assert.equal(host.querySelectorAll('[data-question-solution]').length, 0);
  assert.equal(host.querySelectorAll('img').length, 7); // Includes the hidden hint image.
  assert.equal(host.querySelectorAll('[data-question-hints][hidden] img').length, 1);
  assert.equal(host.querySelectorAll('.quiz-paper-workspace').length, 2);
  assert.equal(host.querySelectorAll('.is-print-correct').length, 0);
  assert.equal(print.prepare('answer'), true);
  assert.equal(host.querySelectorAll('img').length, 9);
  assert.equal(host.querySelectorAll('[data-question-solution] img').length, 2);
  assert.equal(host.querySelectorAll('.is-print-correct').length, 2);
  assert.equal(host.querySelectorAll('.quiz-paper-workspace').length, 0);
  for (const image of host.querySelectorAll('img')) assert.ok(root.querySelector(`img[src="${image.getAttribute('src')}"]`));
  assert.equal(root.outerHTML, source);
  print.restore();
  assert.equal(host.childNodes.length, 0);
  assert.equal(root.outerHTML, source);
});

test('image-only SVG choices still require a visible text caption', () => {
  const html=legacySvgQuestions.replace('ชี้จาก A ไป B '+svg,svg);
  assert.throws(()=>adapt(html),/Image choices need a text caption/);
});

const forbidden = [
  '<script>alert(1)</script>', '<foreignObject><p>HTML</p></foreignObject>', '<animate attributeName="x"/>',
  '<image href="https://example.org/x.png"/>', '<use href="https://example.org/x.svg#shape"/>',
  '<use href="javascript:alert(1)"/>', '<path onload="alert(1)"/>', '<style>path {fill:red}</style>',
  '<path fill="url(https://example.org/a.svg#x)"/>', '<path style="fill:url(https://example.org/a.svg#x)"/>',
  '<path style="filter:blur(1px)"/>', '<path style="fill:var(--color)"/>', '<path class="external-style"/>',
  '<use href="#missing"/>', '<path fill="url(#missing)"/>', '<g id="a"/><g id="a"/>',
  '<g id="a"><use href="#a"/></g>', '<symbol id="a"><use href="#b"/></symbol><symbol id="b"><use href="#a"/></symbol>',
];
for (const part of forbidden) test(`reject unsupported or active SVG: ${part}`,()=>{
  assert.throws(()=>image(`<svg viewBox="0 0 100 100">${part}</svg>`),/Unsupported static SVG/);
});

test('invalid dimensions, excessive artwork and user-authored data URLs remain rejected with source location', () => {
  for (const attributes of ['', 'viewBox="0 0 0 100"', 'viewBox="0 0 Infinity 100"', 'viewBox="invalid" width="100" height="100"', 'viewBox="0 0 100 100" width="100001" height="100"']) assert.throws(()=>image(`<svg ${attributes}><path d="M0 0L10 10"/></svg>`));
  assert.throws(()=>image(`<svg viewBox="0 0 100 100">${'<circle r="1"/>'.repeat(2000)}</svg>`));
  assert.throws(()=>adapt(legacySvgQuestions.replace(svg,svg.replace('<defs>','<script>bad()</script><defs>'))),/แถว 9, ข้อ 1:.*Unsupported static SVG/);
  assert.throws(()=>adapt(legacySvgQuestions.replace(svg,'<img src="data:image/svg+xml,bad">')),/absolute HTTPS URL|Unsupported image URL/);
});
