import { loadBankPrintMetadata } from '../public/shared/print-bank-metadata.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { safePrintUrl, htmlPrintCSS } from '../js/html-print.js';
import { normalizePrintMetadata, resolvePrintMetadata, buildPrintFilename, resolvePrintContext, createPrintTitleSession } from '../js/print-metadata.js';
import { defaultPrintProfile, printPageCSS, tableRowGroups } from '../js/print-layout.js';

test('device margins are automatic on iOS including desktop-mode iPad, not Android or Mac', () => {
  assert.equal(defaultPrintProfile({userAgent:'Mozilla/5.0 (iPad; CPU OS 26_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.6 Mobile Safari/604.1'}), 'device-margins');
  assert.equal(defaultPrintProfile({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X)'}), 'device-margins');
  assert.equal(defaultPrintProfile({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform:'MacIntel', maxTouchPoints:5}), 'device-margins');
  assert.equal(defaultPrintProfile({platform:'MacIntel', maxTouchPoints:0}), 'standard');
  assert.equal(defaultPrintProfile({userAgent:'Mozilla/5.0 (Linux; Android 15) Chrome/130.0', maxTouchPoints:5}), 'standard');
  assert.equal(defaultPrintProfile({platform:'Win32', maxTouchPoints:10}), 'standard');
  assert.equal(defaultPrintProfile(), 'standard');
});

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


test('default print names use course codes, Thai chapter/work labels and separate paper editions', () => {
  const labels = { subjectId: 'physics', chapter: 'สมดุลกล', work: 'ใบงานที่ 1', extension: 'pdf' };
  assert.equal(buildPrintFilename({ ...labels, mode: 'worksheet' }), 'PHY-สมดุลกล-ใบงานที่ 1-โจทย์.pdf');
  assert.equal(buildPrintFilename({ ...labels, mode: 'answer' }), 'PHY-สมดุลกล-ใบงานที่ 1-เฉลย.pdf');
  assert.equal(buildPrintFilename({ subject: 'เคมี', chapter: 'กรด–เบส', work: 'ใบเรียนรู้', mode: 'blank' }), 'CHEM-กรด–เบส-ใบเรียนรู้-ฉบับว่าง');
  assert.equal(buildPrintFilename({ subjectId: 'chemistry', chapter: 'Acids', work: 'Sheet 1', mode: 'answer', language: 'en' }), 'CHEM-Acids-Sheet 1-Answers');
});

test('filenames keep Thai, remove path/control characters and reserve room for the edition suffix', () => {
  const name = buildPrintFilename({ subjectId: 'physics', chapter: '../สมดุล/กล:?', work: 'ใบ\u0000งาน*ที่ 1', extension: 'pdf' });
  assert.equal(name, 'PHY-สมดุล-กล-ใบงาน-ที่ 1.pdf');
  assert.doesNotMatch(name, /[<>:"/\\|?*]/);
  const long = buildPrintFilename({ subjectId: 'chemistry', chapter: 'ก'.repeat(240), work: 'ข'.repeat(240), mode: 'answer', extension: 'pdf' });
  assert.ok(new TextEncoder().encode(long).length <= 219);
  assert.ok(long.endsWith('-เฉลย.pdf'));
});

test('missing or repeated labels do not leak IDs or leave empty filename components', () => {
  assert.equal(buildPrintFilename({ subjectId: 'unknown', chapter: '', work: '', language: 'en' }), 'HUB-Document');
  assert.equal(buildPrintFilename({ subjectId: 'physics', chapter: 'Forces', work: 'Forces' }), 'PHY-Forces');
  assert.equal(buildPrintFilename({ subjectId: 'biology', work: 'Cells' }), 'BIO-Cells');
  assert.equal(buildPrintFilename({ subjectId: 'constructor', subject: '__proto__', work: 'Sheet' }), 'HUB-Sheet');
});

test('standalone content can recover a unique authored placement and subject folder without guessing a chapter', () => {
  const catalog = { contents: [{ source: 'content/physics/forces/quiz.html', placements: [{ subjectId: 'physics', chapterId: '2', topicId: 'force' }] }] };
  const baseUrl = 'https://school.test/learning-hub/';
  assert.deepEqual(resolvePrintContext({ catalog, source: baseUrl + 'content/physics/forces/quiz.html', baseUrl }), { subjectId: 'physics', chapterId: '2', topicId: 'force' });
  assert.deepEqual(resolvePrintContext({ source: baseUrl + 'content/chemistry/unknown.html', baseUrl }), { subjectId: 'chemistry' });
});

test('printing temporarily names the child and parent tabs, then restores their own titles', () => {
  const top = { document: { title: 'Hub' } }; top.parent = top;
  const child = { document: { title: 'Quiz' }, parent: top };
  const session = createPrintTitleSession(child);
  session.set('PHY-Forces-Questions'); assert.equal(top.document.title, 'PHY-Forces-Questions'); assert.equal(child.document.title, top.document.title);
  session.set('PHY-Forces-Answers'); session.restore();
  assert.equal(top.document.title, 'Hub'); assert.equal(child.document.title, 'Quiz');
  session.set('PHY-Next'); top.document.title = 'A new page'; session.restore();
  assert.equal(top.document.title, 'A new page'); assert.equal(child.document.title, 'Quiz');
});

test('bank print chapter labels use catalog paths without replacing the question snapshot', async () => {
  const context = { subjectId: 'physics', chapterId: 'bank', topicId: 'b-' + 'a'.repeat(24) };
  const catalog = { sets: [{ bankKey: context.topicId, path: ['ฟิสิกส์', 'Learning Hub', 'สมดุลกล(Equilibrium)', 'ใบงาน'] }] };
  const before = JSON.stringify(catalog);
  const client = { catalog: async () => catalog };
  assert.deepEqual(await loadBankPrintMetadata(context, 'th', client), { chapter: 'สมดุลกล' });
  assert.deepEqual(await loadBankPrintMetadata(context, 'en', client), { chapter: 'Equilibrium' });
  assert.equal(JSON.stringify(catalog), before);
  assert.deepEqual(await loadBankPrintMetadata(context, 'th', { catalog: async () => { throw Error('offline'); } }), {});
  assert.deepEqual(await loadBankPrintMetadata({ ...context, topicId: 'not-a-bank-key' }, 'th', client), {});
});
