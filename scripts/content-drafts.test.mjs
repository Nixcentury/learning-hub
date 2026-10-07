import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createContentValidator } from './validate-activity-content.mjs';
import { buildRouteCatalog } from './route-catalog.mjs';
import { resolveHubRoute } from '../js/hub-routes.js';
import { resolveNavigation } from '../js/hub-navigation.js';
import { annotation, reportContentDiagnostics } from './content-diagnostics.mjs';
import { readMetadata } from './route-html-metadata.mjs';
import { availableMenuSource, readMenuCatalog } from '../public/pages/shared/menu-availability.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = join(root, 'public/content/p/tools.html');
const card = (extra = '') => `<a data-tool-kind="quiz" data-content-id="quiz-one" data-th="ควิซ" data-en="Quiz" ${extra}>Quiz</a>`;
const menu = entries => `<!-- Keep original line numbers.\n A two-line comment. -->\n<nav data-learning-menu data-menu-kind="tools" data-subject-id="physics" data-chapter-id="1" data-topic-id="topic" data-title-th="งาน" data-title-en="Tasks">\n${entries}\n</nav>`;
const quiz = '<article data-learning-activity-content data-activity-id="quiz-one" data-activity-kind="quiz"></article>';
async function check(source, target = null, code = 'ENOENT') {
  const validator = createContentValidator({ root, read: async name => {
    if (name === file) return source;
    if (target !== null) return target;
    throw Object.assign(Error('Target unavailable'), { code });
  } });
  await validator.validateFile(file);
  return validator;
}
function fixtures(entries = card('href="quiz.html"')) {
  return new Map([
    ['index.html', '<button data-section="physics" data-page-src="pages/physics.html"></button>'],
    ['pages/physics.html', '<main data-subject-page data-subject-id="physics"></main><template id="subject-chapters"><article data-chapter="1" data-chapter-src="../content/p/chapter.html"><h2 data-chapter-title data-th="บท" data-en="Chapter"></h2></article></template>'],
    ['content/p/chapter.html', '<nav data-learning-menu data-menu-kind="topics" data-subject-id="physics" data-chapter-id="1"><a data-topic-id="topic" data-th="เรื่อง" data-en="Topic" href="tools.html"></a></nav>'],
    ['content/p/tools.html', menu(entries)],
    ['content/p/quiz.html', quiz],
  ]);
}
const catalog = records => buildRouteCatalog({ legacyCatalog: {}, read: async name => {
  if (!records.has(name)) throw Object.assign(Error('Missing file'), { code: 'ENOENT' });
  return records.get(name);
} });

test('empty/missing/draft menu links only warn, with the authored file and correct line', async () => {
  for (const extra of ['', 'href="future.html"', 'data-status="draft" href="quiz.html"']) {
    const result = await check(menu(card(extra)), extra.includes('draft') ? quiz : null);
    assert.equal(result.errors.length, 0);
    assert.equal(result.diagnostics.length, 1);
    assert.equal(result.diagnostics[0].level, 'warning');
    assert.equal(result.diagnostics[0].file, 'public/content/p/tools.html');
    assert.equal(result.diagnostics[0].line, 4);
  }
});
test('invalid types/IDs/status, unsafe URLs and unreadable files remain errors even on draft entries', async () => {
  for (const href of ['javascript:alert(1)', 'https://evil.test/x.html', '../../../admin.html', '%252e%252e/x.html']) {
    assert.ok((await check(menu(card(`data-status="draft" href="${href}"`)))).errors.length);
  }
  for (const source of [card().replace('data-tool-kind="quiz"', 'data-tool-kind="practice"'), card().replace('quiz-one', '123'), card('data-status="draff"')]) {
    assert.ok((await check(menu(source))).errors.length);
  }
  const denied = await check(menu(card('href="quiz.html"')), null, 'EACCES');
  assert.ok(denied.errors.length);assert.equal(denied.diagnostics.some(d => d.level === 'warning'), false);
  assert.match((await check(menu(card('href="quiz.html"')), quiz.replace('quiz-one', 'another-id'))).errors.join(), /data-activity-id/);
});
test('malformed HTML and executable menu markup report the exact offending line', async () => {
  const unclosed = await check(menu(card().replace('</a>', '')));
  assert.equal(unclosed.diagnostics[0].line, 4);assert.match(unclosed.errors.join(), /ลืมปิดแท็ก <a>/);
  const script = await check(menu(card() + '\n<script>alert(1)</script>'));
  assert.equal(script.diagnostics.find(d => d.level === 'error').line, 5);
  const duplicate = await check(menu(card('href="one.html" href="two.html"')));
  assert.equal(duplicate.diagnostics[0].line, 4);assert.match(duplicate.errors.join(), /Duplicate HTML attribute/);
  assert.doesNotThrow(() => readMetadata('<html><head><title>Title</title><body><ul><li>One<li>Two</ul><p>Text', { strict: true }));
});
test('missing tool files and explicit drafts keep both placement and canonical share URLs preparing', async () => {
  for (const extra of ['', 'href="missing.html"', 'data-status="draft" href="quiz.html"']) {
    const result = await catalog(fixtures(card(extra)));
    for (const hash of ['#content/quiz-one', '#physics/1/topic/quiz-one']) {
      assert.equal(resolveHubRoute(result, hash).status, 'preparing');
      assert.equal(resolveNavigation(result, hash).route.hash, '#physics/1/topic');
      assert.equal(resolveNavigation(result, hash).notice, 'preparing');
    }
    assert.equal(result.contents.length, 0);
  }
});
test('adding a missing file activates the same IDs and routes; explicit draft still requires removal', async () => {
  const records = fixtures();records.delete('content/p/quiz.html');
  const before = await catalog(records);
  records.set('content/p/quiz.html', quiz);
  const after = await catalog(records);
  assert.equal(resolveHubRoute(before, '#content/quiz-one').status, 'preparing');
  assert.equal(resolveHubRoute(after, '#content/quiz-one').status, 'ready');
  assert.deepEqual(after.routes.map(r => r.hash), before.routes.map(r => r.hash));
  records.set('content/p/tools.html', menu(card('data-status="draft" href="quiz.html"')));
  assert.equal(resolveHubRoute(await catalog(records), '#content/quiz-one').status, 'preparing');
});
test('chapter, topic and overview missing targets become preparing without hiding bad links', async () => {
  for (const target of ['chapter', 'tools']) {
    const records = fixtures();records.delete(`content/p/${target}.html`);
    assert.equal(resolveHubRoute(await catalog(records), target === 'chapter' ? '#physics/1' : '#physics/1/topic').status, 'preparing');
  }
  const records = fixtures();records.set('content/p/chapter.html', records.get('content/p/chapter.html').replace('<nav ', '<nav data-chapter-overview-src="future.html" '));
  assert.equal(resolveHubRoute(await catalog(records), '#physics/1/overview').status, 'preparing');
  for (const extra of ['href="https://evil.test/x.html"', 'data-status="draft" href="../../../admin.html"', 'data-status="wrong"']) {
    await assert.rejects(catalog(fixtures(card(extra))), /Invalid|escapes|data-status/);
  }
});
test('ready placement wins for a canonical content URL, without enabling an explicit draft placement', async () => {
  const records = fixtures();
  records.set('content/p/chapter.html', records.get('content/p/chapter.html').replace('</nav>', '<a data-topic-id="later" href="later.html"></a></nav>'));
  records.set('content/p/later.html', menu(card('data-status="draft" href="quiz.html"')).replace('data-topic-id="topic"', 'data-topic-id="later"'));
  const result = await catalog(records);
  assert.equal(resolveHubRoute(result, '#content/quiz-one').status, 'ready');
  assert.equal(resolveHubRoute(result, '#physics/1/later/quiz-one').status, 'preparing');
});
test('UI availability uses draft routes without fetching quiz bodies and only downgrades missing HTTP targets', async () => {
  const entry = { source: 'https://example.test/content/p/quiz.html', kind: 'content', subjectId: 'physics', chapterId: '1', topicId: 'topic', contentId: 'quiz-one' };
  const neverFetch = async () => { throw Error('Should use the catalog'); };
  assert.equal(await availableMenuSource(entry, { catalog: await catalog(fixtures(card())), fetcher: neverFetch }), null);
  assert.equal(await availableMenuSource(entry, { catalog: await catalog(fixtures()), fetcher: neverFetch }), entry.source);
  assert.equal(await availableMenuSource({ ...entry, status: 'draft' }, { fetcher: neverFetch }), null);
  assert.equal(await availableMenuSource(entry, { fetcher: async (_, options) => { assert.equal(options.method, 'HEAD');return { status: 404 }; } }), null);
  await assert.rejects(availableMenuSource(entry, { fetcher: async () => ({ status: 500, ok: false }) }), /availability/);
  await assert.rejects(availableMenuSource(entry, { fetcher: async () => { throw Error('Offline'); } }), /Offline/);
  assert.equal(await readMenuCatalog('/catalog', { fetcher: async () => ({ ok: false }) }), null);
});
test('GitHub report annotates file/line and escapes values without converting warnings to failures', async () => {
  const item = { level: 'warning', file: 'public/content/a,b.html', line: 4, message: 'Draft\n::error::fake %' };
  assert.match(annotation(item), /^::warning file=public\/content\/a%2Cb.html,line=4/);
  assert.match(annotation(item), /%0A::error::fake %25/);
  const messages = [];
  await reportContentDiagnostics([item], { github: true, summary: null, log: value => messages.push(value) });
  assert.equal(messages[0].includes('\n'), false);assert.match(messages.at(-1), /0 error\(s\), 1 draft warning/);
});
