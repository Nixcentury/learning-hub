import test from 'node:test';
import assert from 'node:assert/strict';
import { safePrintUrl, htmlPrintCSS } from '../js/html-print.js';
import { normalizePrintMetadata, resolvePrintMetadata } from '../js/print-metadata.js';
import { printPageCSS, tableRowGroups } from '../js/print-layout.js';

test('print image/style references resolve from the source chapter, not the Hub', () => {
  const base = 'https://example.test/learning-hub/content/chemistry/acid-base/overview.html';
  assert.equal(safePrintUrl('images/ice.svg', base), 'https://example.test/learning-hub/content/chemistry/acid-base/images/ice.svg');
  assert.equal(safePrintUrl('#MJX-1', base), '#MJX-1');
  assert.equal(safePrintUrl('data:image/png;base64,AAAA', base), 'data:image/png;base64,AAAA');
});

test('shared paper labels come from the existing subject/chapter/topic catalog', () => {
  const catalog = { routes:[
    { kind:'section', sectionId:'chemistry', titleTh:'เคมี', titleEn:'Chemistry' },
    { kind:'chapter', subjectId:'chemistry', chapterId:'10', titleTh:'บทที่ 10 กรด–เบส', titleEn:'Acids and bases' },
    { kind:'topic', subjectId:'chemistry', chapterId:'10', topicId:'titration', titleTh:'การไทเทรต', titleEn:'Titration' },
  ] };
  const context = { subjectId:'chemistry', chapterId:'10', topicId:'titration' };
  assert.deepEqual(resolvePrintMetadata({ catalog, context, title:'แบบฝึก' }), { subject:'เคมี', chapter:'บทที่ 10 กรด–เบส', topic:'การไทเทรต', work:'แบบฝึก' });
  assert.equal(resolvePrintMetadata({ catalog, context, language:'en' }).topic, 'Titration');
  assert.equal(resolvePrintMetadata({ catalog, context:{...context,topicId:'chapter-overview'} }).topic, '', 'Chapter summaries do not invent a topic');
});

test('print labels have safe bounded text and allow an intentionally blank topic', () => {
  assert.deepEqual(normalizePrintMetadata({subject:'  เคมี \n ม.5 ',chapter:null,topic:{},work:'x'.repeat(500)}), {subject:'เคมี ม.5',chapter:'',topic:'',work:'x'.repeat(240)});
  assert.equal(resolvePrintMetadata({ title:'Original', authored:{work:'Edited', topic:''} }).work, 'Edited');
  assert.equal(resolvePrintMetadata({ catalog:null, context:{subjectId:'unknown'} }).subject, '', 'Do not print raw storage IDs as course names');
});

test('table page breaks do not split connected rowspans', () => {
  const row = (...spans) => ({cells:spans.map(rowSpan=>({rowSpan}))});
  const rows = [row(2,1), row(1), row(1,3), row(1), row(1), row(1,1)];
  assert.deepEqual(tableRowGroups(rows).map(group=>group.length), [2,3,1]);
  assert.deepEqual(tableRowGroups([row(0,1),row(1),row(1)]).map(group=>group.length), [3]);
  assert.deepEqual(tableRowGroups([]), []);
});

test('shared A4 shell reserves three header/footer columns and resets preview scale for paper', () => {
  assert.match(printPageCSS, /@page \{ size:A4 portrait; margin:0/);
  assert.match(printPageCSS, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(printPageCSS, /height:297mm/);
  assert.match(printPageCSS, /@media print[^\n]*zoom:1 !important/);
  assert.doesNotMatch(printPageCSS, /overflow:hidden/);
});

test('print snapshots reject executable and local-file URL schemes', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>x</script>', 'file:///private.txt', 'vbscript:x']) {
    assert.equal(safePrintUrl(value, 'https://example.test/'), '');
  }
});

test('print layout separates long sections but keeps equations and table rows together', () => {
  assert.match(htmlPrintCSS, /@page\s*\{ size:A4; margin:15mm/);
  assert.match(htmlPrintCSS, /section[^\n]*break-inside:auto !important/);
  assert.match(htmlPrintCSS, /data-hub-math="display"[^\n]*break-inside:avoid/);
  assert.match(htmlPrintCSS, /thead[^\n]*table-header-group/);
});
