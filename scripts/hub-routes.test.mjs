import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHubRoute, resolveHubRoute, createHubShareUrl } from '../js/hub-routes.js';
import { toolCatalog } from '../js/legacy-tool-catalog.js';
import { buildRouteCatalog, localCatalogPath } from './route-catalog.mjs';
import { catalogFromRepository } from './build-route-catalog.mjs';
import { readMetadata, metadataNodes } from './route-html-metadata.mjs';

function fixture() {
  return new Map([
    ['index.html', '<button data-section="physics" data-page-src="pages/physics.html"></button>'],
    ['pages/physics.html', `<main data-subject-page data-subject-id="physics" data-subject-title-th="ฟิสิกส์" data-subject-title-en="Physics"></main>
      <template id="subject-chapters"><article data-chapter="1" data-route-slug="natural" data-chapter-src="../content/p/chapter.html">
      <h2 data-chapter-title data-th="ธรรมชาติ &amp; การวัด > 0" data-en="Nature &amp; measurement">Title</h2></article></template>`],
    ['content/p/chapter.html', `<nav data-learning-menu data-menu-kind="topics" data-subject-id="physics" data-chapter-id="1" data-chapter-overview-src="summary.html">
      <a data-topic-id="measurement" data-th="การวัด" data-en="Measurement" href="topic.html"></a>
      <a data-topic-id="future" data-th="กำลังเตรียม" data-en="In preparation"></a></nav>`],
    ['content/p/topic.html', `<nav data-learning-menu data-menu-kind="tools" data-subject-id="physics" data-chapter-id="1" data-topic-id="measurement">
      <a data-tool-kind="quiz" data-content-id="quiz-one" data-th="ควิซ" data-en="Quiz" href="quiz.html"></a>
      <a data-tool-kind="simulation" data-content-id="sim-one" data-th="ทดลอง" data-en="Simulation" href="sim.html"></a></nav>`],
    ['content/p/quiz.html', '<article data-learning-activity-content data-activity-id="quiz-one" data-activity-kind="quiz"><article data-question data-answer="SECRET_ANSWER">Question</article></article>'],
    ['content/p/sim.html', '<html data-learning-simulation data-activity-id="sim-one"><script>window.untrusted=true</script></html>'],
    ['content/p/summary.html', '<html data-learning-html><body>Summary</body></html>'],
  ]);
}
const make = records => buildRouteCatalog({ read: async name => {
  if (!records.has(name)) throw Error('Missing file');
  return records.get(name);
} });
function change(records, file, from, to) { records.set(file, records.get(file).replace(from, to)); }

test('route syntax uses one hash and bounded lowercase segments, with old section links intact', () => {
  for (const hash of ['#physics', '#physics/natural', '#physics/natural/measurement', '#physics/natural/measurement/quiz-one', '#content/quiz-one', '#tool/test-c2-quiz']) assert.equal(parseHubRoute(hash).hash, hash);
  assert.equal(parseHubRoute('').hash, '#overview');
  assert.equal(parseHubRoute('#physics/').hash, '#physics');
  for (const hash of [null, {}, '#physics/#natural', '#physics//x', '#physics/../admin', '#physics/%2fadmin', '#physics/%252e', '#physics?uid=student', 'https://evil.test/#physics', '#physics/X', '#physics/a/b/c/d', '#content', '#content/id/x']) assert.equal(parseHubRoute(hash), null);
});

test('catalog extracts all layers and resolves friendly names without changing IDs', async () => {
  const catalog = await make(fixture());
  const chapter = resolveHubRoute(catalog, '#physics/natural');
  assert.equal(chapter.route.chapterId, '1');
  assert.equal(chapter.route.titleTh, 'ธรรมชาติ & การวัด > 0');
  assert.equal(resolveHubRoute(catalog, '#physics/1').canonicalHash, '#physics/natural');
  const quiz = resolveHubRoute(catalog, '#physics/1/measurement/quiz-one');
  assert.equal(quiz.content.id, 'quiz-one');
  assert.equal(quiz.content.source, 'content/p/quiz.html');
  assert.equal(quiz.route.topicId, 'measurement');
  assert.equal(resolveHubRoute(catalog, '#content/quiz-one').content.id, 'quiz-one');
  assert.equal(resolveHubRoute(catalog, '#physics/natural/overview').route.topicId, 'chapter-overview');
  assert.equal(resolveHubRoute(catalog, '#physics/natural/measurement/sim-one').content.toolKind, 'simulation');
  assert.equal(resolveHubRoute(catalog, '#physics/natural/future').status, 'preparing');
  assert.equal(resolveHubRoute(catalog, '#physics/unknown').status, 'not-found');
  assert.equal(resolveHubRoute({ ...catalog, schemaVersion: 99 }, '#physics').status, 'invalid');
  assert.equal(JSON.stringify(catalog).includes('SECRET_ANSWER'), false);
});

test('aliases propagate to descendants, collisions fail instead of opening another chapter', async () => {
  const records = fixture();
  change(records, 'pages/physics.html', 'data-route-slug="natural"', 'data-route-slug="nature" data-route-aliases="natural"');
  change(records, 'content/p/chapter.html', 'data-topic-id="measurement"', 'data-topic-id="measurement" data-route-slug="measuring" data-route-aliases="measure"');
  const catalog = await make(records);
  for (const alias of ['#physics/1/measurement/quiz-one', '#physics/natural/measure/quiz-one']) {
    assert.equal(resolveHubRoute(catalog, alias).canonicalHash, '#physics/nature/measuring/quiz-one');
  }
  change(records, 'content/p/chapter.html', 'data-topic-id="future"', 'data-topic-id="future" data-route-slug="measuring"');
  await assert.rejects(make(records), /Route collision/);
});

test('the same Quiz in two topics has one content record and two placements', async () => {
  const records = fixture();
  change(records, 'content/p/chapter.html', 'data-topic-id="future"', 'href="topic-two.html" data-topic-id="future"');
  records.set('content/p/topic-two.html', records.get('content/p/topic.html').replace('data-topic-id="measurement"', 'data-topic-id="future"'));
  const catalog = await make(records);
  assert.equal(catalog.contents.filter(item => item.id === 'quiz-one').length, 1);
  assert.equal(catalog.contents.find(item => item.id === 'quiz-one').placements.length, 2);
  assert.equal(resolveHubRoute(catalog, '#physics/natural/future/quiz-one').content.id, 'quiz-one');
});

test('moving a file and updating its menu keeps every route and Quiz identity', async () => {
  const records = fixture(), before = await make(records);
  records.set('content/relocated/quiz.html', records.get('content/p/quiz.html'));
  records.delete('content/p/quiz.html');
  change(records, 'content/p/topic.html', 'href="quiz.html"', 'href="../relocated/quiz.html"');
  const after = await make(records);
  assert.deepEqual(after.routes, before.routes);
  assert.equal(resolveHubRoute(after, '#content/quiz-one').content.source, 'content/relocated/quiz.html');
});

test('identity conflicts, mismatching activity IDs, and missing targets fail the build', async () => {
  for (const scenario of ['duplicate', 'mismatch', 'missing', 'context']) {
    const records = fixture();
    if (scenario === 'duplicate') {
      records.set('content/p/other.html', records.get('content/p/quiz.html'));
      change(records, 'content/p/topic.html', '</nav>', '<a data-tool-kind="quiz" data-content-id="quiz-one" href="other.html"></a></nav>');
    } else if (scenario === 'mismatch') change(records, 'content/p/quiz.html', 'quiz-one', 'another-id');
    else if (scenario === 'missing') records.delete('content/p/quiz.html');
    else change(records, 'content/p/topic.html', 'data-chapter-id="1"', 'data-chapter-id="2"');
    await assert.rejects(make(records), /conflict|does not match|Missing file|context mismatch/i);
  }
});

test('HTML links at any layer and cycles are indexed once without executing HTML', async () => {
  const records = fixture();
  records.set('content/p/related.html', '<html data-learning-html><a data-hub-html data-content-id="physics-chapter-1-overview" href="summary.html">Back</a></html>');
  change(records, 'content/p/summary.html', '</body>', '<a data-hub-html data-content-id="reading-two" href="related.html">Related</a></body>');
  records.set('index.html', records.get('index.html') + '<button data-hub-html data-subject-id="physics" data-chapter-id="1" data-content-id="reading-two" data-html-src="content/p/related.html">Read</button>');
  const catalog = await make(records);
  assert.equal(catalog.contents.filter(item => item.id === 'reading-two').length, 1);
  assert.equal(resolveHubRoute(catalog, '#content/reading-two').status, 'ready');
  assert.ok(catalog.routes.length < 30, 'Cycles must not grow route paths forever');
});

test('empty overview is a preparing route, not a made-up content file', async () => {
  const records = fixture();
  change(records, 'content/p/chapter.html', 'data-chapter-overview-src="summary.html"', 'data-chapter-overview-src=""');
  const catalog = await make(records);
  assert.equal(resolveHubRoute(catalog, '#physics/natural/overview').status, 'preparing');
  assert.equal(catalog.contents.some(item => item.toolKind === 'html'), false);
});

test('a new chapter without a menu or registered legacy tools remains a preparing heading', async () => {
  const records = fixture();
  change(records, 'pages/physics.html', '</template>', '<article data-chapter="99"><h2 data-chapter-title data-th="บทใหม่" data-en="New chapter"></h2></article></template>');
  const catalog = await make(records);
  assert.equal(resolveHubRoute(catalog, '#physics/99').status, 'preparing');
  assert.equal(resolveHubRoute(catalog, '#physics/99/quiz').status, 'not-found');
});

test('metadata ignores fake entries in comments, code, and non-navigation templates', async () => {
  const records = fixture();
  const fake = '<button data-section="injected" data-page-src="pages/no.html"></button>';
  records.set('index.html', records.get('index.html') + `<!-- ${fake} --><script>const x='${fake}'</script><style>${fake}</style><template>${fake}</template>`);
  assert.equal((await make(records)).routes.filter(item => item.kind === 'section').length, 1);
  const tree = readMetadata('<a data-th="A > B &amp; C" href=sample.html></a>');
  assert.equal(metadataNodes(tree, node => node.tag === 'a')[0].attrs['data-th'], 'A > B & C');
  assert.throws(() => readMetadata('<a href="a" href="b">'), /Duplicate HTML attribute/);
});

test('local path validation rejects URL injection, traversal and encoded separators', () => {
  assert.equal(localCatalogPath('../p/quiz.html', 'content/p/topic.html'), 'content/p/quiz.html');
  for (const href of ['https://evil.test/a.html', '//evil.test/a.html', 'javascript:alert(1)', '../../admin.html', '/content/p/a.html', '../%252e%252e/a.html', 'a.html?uid=x', 'a.html#x', '..\\admin.html', '%2fadmin.html']) {
    assert.throws(() => localCatalogPath(href, 'content/p/topic.html'), /Invalid|escapes/);
  }
});

test('share URLs retain the deployment base but never user/session/query values', async () => {
  const catalog = await make(fixture());
  assert.equal(createHubShareUrl(catalog, '#physics/1/measurement/quiz-one', 'https://example.test/learning-hub/?v=old&uid=private#physics'), 'https://example.test/learning-hub/#physics/natural/measurement/quiz-one');
  assert.equal(createHubShareUrl(catalog, '#physics', 'http://127.0.0.1:3000/index.html'), 'http://127.0.0.1:3000/#physics');
  assert.equal(createHubShareUrl(catalog, '#physics/unknown', 'https://example.test/'), null);
  assert.equal(createHubShareUrl(catalog, '#physics', 'file:///C:/private/index.html'), null);
  assert.equal(createHubShareUrl(catalog, '#physics', 'https://user:password@example.test/'), null);
});

test('real repository is deterministic and preserves legacy storage/window identities', async () => {
  const first = await catalogFromRepository(), second = await catalogFromRepository();
  assert.deepEqual(first, second);
  assert.equal(resolveHubRoute(first, '#chemistry').status, 'ready');
  assert.equal(resolveHubRoute(first, '#chemistry/10').route.source, 'content/chemistry/acid-base.html');
  assert.equal(resolveHubRoute(first, '#chemistry/10/acid-base-theories').status, 'preparing');
  assert.equal(resolveHubRoute(first, '#chemistry/10/overview').content.id, 'chemistry-chapter-10-overview');
  assert.equal(resolveHubRoute(first, '#test/2/quiz').route.storageContentId, 'test-c2-quiz');
  assert.equal(resolveHubRoute(first, '#tool/test-c2-quiz').route.toolId, 'test-c2-quiz');
  assert.match(toolCatalog['test-c2-quiz'].page, /numeric-input-demo.html$/);
  assert.match(toolCatalog['test-c3-quiz'].page, /drag-drop-demo.html$/);
  assert.equal(resolveHubRoute(first, '#classroom/private-room').status, 'not-found');
  assert.equal(resolveHubRoute(first, '#admin').status, 'not-found');
});
