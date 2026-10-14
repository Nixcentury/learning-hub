import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createPdfManifest, createInlinePdfManifest, inlinePdfSources, selectPdfVariant, pdfDownloadAction,
  resolvePdfSource, safePdfLink, resolveAuthoredPdfLinks } from '../public/shared/pdf-content-model.js';
import { pdfLinkEntry } from '../js/pdf-link.js';
import { createContentTool } from '../js/content-tool.js';
import { buildRouteCatalog } from './route-catalog.mjs';
import { createContentValidator } from './validate-activity-content.mjs';
import { activityForRoute } from '../js/hub-activity-routes.js';
import { resolveHubRoute } from '../js/hub-routes.js';

const hub = 'https://school.test/learning-hub/';
const descriptor = new URL('content/physics/sound/slides.html', hub).href;
const attrs = { 'data-learning-pdf': '1', 'data-activity-id': 'sound-slides', 'data-pdf-src': 'slides.pdf' };
const manifestHtml = '<html data-learning-pdf="1" data-activity-id="sound-slides" data-pdf-src="slides.pdf"><head><title>Slides</title></head><body></body></html>';

test('PDF sources resolve at the lesson directory and accept direct HTTPS PDFs', () => {
  assert.equal(resolvePdfSource('slides.pdf', descriptor, hub).url, new URL('slides.pdf', descriptor).href);
  assert.equal(resolvePdfSource('https://cdn.example/lesson.pdf?revision=2', descriptor, hub).kind, 'pdf');
  const drive = resolvePdfSource('https://drive.google.com/file/d/abcdefghijk12345/view?usp=sharing&resourcekey=0-abc', descriptor, hub);
  assert.equal(drive.kind, 'drive');
  assert.equal(drive.url, 'https://drive.google.com/file/d/abcdefghijk12345/preview?resourcekey=0-abc');
  assert.ok(drive.originalUrl.includes('/view?resourcekey='));
});

test('source validation rejects executable, credentialed, escaped, insecure and non-PDF URLs', () => {
  for (const value of ['javascript:alert(1)', 'data:application/pdf,abc', 'file:///tmp/x.pdf', 'http://other.test/x.pdf',
    'https://user:pass@cdn.test/x.pdf', '../../../admin.pdf', 'slides.pdf#page=2', 'slides.pdf?uid=123',
    '../%252e%252e/x.pdf', 'https://cdn.test/page.html', 'https://drive.google.com/file/d/abcdefghijk12345/edit',
    'https://drive.google.com:444/file/d/abcdefghijk12345/view', 'https:\\evil.test\\x.pdf', 'https://cdn.test/\nx.pdf']) {
    assert.throws(() => resolvePdfSource(value, descriptor, hub), undefined, value);
  }
  assert.equal(safePdfLink('javascript:alert(1)', descriptor), null);
  assert.equal(safePdfLink('https://youtube.com/watch?v=abc', descriptor), 'https://youtube.com/watch?v=abc');
});

test('manifest has a version, stable identity and bilingual related links without account data', () => {
  const link = { href: 'https://youtube.com/watch?v=abc', 'data-th': 'วิดีโอ', 'data-en': 'Video' };
  const value = createPdfManifest(attrs, [link], descriptor, hub);
  assert.equal(value.contentId, 'sound-slides');
  assert.equal(value.resources[0].titleEn, 'Video');
  for (const change of [{ 'data-learning-pdf': '2' }, { 'data-activity-id': '../x' }, { 'data-pdf-src': 'https://evil.test/x.html' }])
    assert.throws(() => createPdfManifest({ ...attrs, ...change }, [], descriptor, hub));
  assert.throws(() => createPdfManifest(attrs, [{ ...link, href: 'javascript:alert(1)' }], descriptor, hub));
  assert.throws(() => createPdfManifest(attrs, [{ ...link, 'data-en': '' }], descriptor, hub));
  assert.throws(() => createPdfManifest(attrs, Array(21).fill(link), descriptor, hub));
});

test('all-layer PDF opener uses a local descriptor and preserves one window identity across topics', () => {
  const node = { dataset: { contentId: 'sound-slides', th: 'สไลด์', en: 'Slides' }, textContent: 'Slides',
    getAttribute: name => name === 'data-pdf-src' ? 'slides.html' : null };
  const entry = pdfLinkEntry(node, descriptor, { subjectId: 'physics', chapterId: '12', topicId: 'nature' });
  const tool = createContentTool(entry, hub);
  const player = new URL(tool.page);
  assert.equal(player.pathname, '/learning-hub/pages/tools/pdf-player.html');
  assert.equal(player.searchParams.get('content'), descriptor);
  assert.equal(player.searchParams.get('id'), 'sound-slides');
  assert.equal(tool.context.toolKind, 'pdf');
  assert.equal(tool.id, createContentTool({ ...entry, topicId: 'review' }, hub).id);
  for (const source of ['https://evil.test/x.html', 'content/x.pdf', 'admin.html', 'content/x.html?uid=123'])
    assert.equal(createContentTool({ ...entry, source }, hub), null);
});

test('PDF catalog covers top-level buttons, chapter cards, topic cards and nested HTML; shares reopen the player', async () => {
  const files = new Map([
    ['index.html', '<button data-section="physics" data-page-src="pages/physics.html"></button><a data-hub-pdf data-subject-id="physics" data-chapter-id="12" data-content-id="sound-slides" href="content/p/slides.html">Slides</a>'],
    ['pages/physics.html', '<main data-subject-page data-subject-id="physics"></main><template id="subject-chapters"><article data-chapter="12" data-chapter-src="../content/p/menu.html"><h2 data-chapter-title>Sound</h2></article></template>'],
    ['content/p/menu.html', '<nav data-learning-menu data-menu-kind="topics" data-subject-id="physics" data-chapter-id="12"><a data-tool-kind="pdf" data-content-id="sound-slides" href="slides.html">Slides</a><a data-topic-id="nature" href="tools.html">Nature</a></nav>'],
    ['content/p/tools.html', '<nav data-learning-menu data-menu-kind="tools" data-subject-id="physics" data-chapter-id="12" data-topic-id="nature"><a data-tool-kind="pdf" data-content-id="sound-slides" href="slides.html">Slides</a><a data-tool-kind="html" data-content-id="reading" href="reading.html">Read</a></nav>'],
    ['content/p/slides.html', manifestHtml],
    ['content/p/reading.html', '<html data-learning-html><button data-hub-pdf data-content-id="sound-slides" data-pdf-src="slides.html">Slides</button></html>'],
  ]);
  const read = async path => { if (!files.has(path)) throw Error('Missing: ' + path); return files.get(path); };
  const catalog = await buildRouteCatalog({ read });
  assert.equal(catalog.contents.filter(row => row.id === 'sound-slides').length, 1);
  assert.equal(catalog.contents.find(row => row.id === 'sound-slides').placements.length, 4);
  for (const hash of ['#content/sound-slides', '#physics/12/sound-slides', '#physics/12/nature/sound-slides']) {
    const { route } = resolveHubRoute(catalog, hash);
    assert.equal(activityForRoute(catalog, route, hub).tool.id, 'content-pdf-sound-slides');
  }
  files.set('content/p/slides.html', manifestHtml.replace('sound-slides', 'wrong-id'));
  await assert.rejects(buildRouteCatalog({ read }), /does not match/);
});

async function validate(source, pdf = Buffer.from('%PDF-1.7\nfixture')) {
  const file = fileURLToPath(new URL('../public/content/pdf-test/slides.html', import.meta.url));
  const validator = createContentValidator({ read: async path => {
    if (path.endsWith('slides.html')) return source;
    if (path.endsWith('slides.pdf') && pdf) return pdf;
    throw Object.assign(Error('Missing PDF'), { code: 'ENOENT' });
  } });
  await validator.validateFile(file);
  return validator.errors;
}
test('content gate allows missing PDF drafts but rejects existing non-PDF data and unsafe markup', async () => {
  assert.deepEqual(await validate(manifestHtml), []);
  assert.deepEqual(await validate(manifestHtml, null), []);
  assert.ok((await validate(manifestHtml, Buffer.from('<html>404</html>'))).length);
  for (const insertion of ['<script>alert(1)</script>', '<iframe src="x"></iframe>', '<p onclick="x()">x</p>', '<html data-learning-html>', '<a data-pdf-link href="javascript:alert(1)" data-th="x" data-en="x">x</a>'])
    assert.ok((await validate(manifestHtml.replace('</body>', insertion + '</body>'))).length, insertion);
});

test('common, language-specific, mixed and empty sources have explicit fallback rules', () => {
  const create = sources => createInlinePdfManifest(sources, 'sound-slides', descriptor, hub);
  const common = create({ common: 'shared.pdf', th: '', en: '   ' });
  assert.equal(selectPdfVariant(common, 'th').source.url, selectPdfVariant(common, 'en').source.url);
  assert.equal(selectPdfVariant(common, 'en').fallback, false);
  const mixed = create({ common: 'shared.pdf', en: 'en.pdf' });
  assert.equal(selectPdfVariant(mixed, 'th').key, 'common');
  assert.equal(selectPdfVariant(mixed, 'en').key, 'en');
  const separate = create({ th: 'th.pdf', en: 'en.pdf' });
  assert.equal(selectPdfVariant(separate, 'th').key, 'th');
  assert.equal(selectPdfVariant(separate, 'en').key, 'en');
  assert.equal(selectPdfVariant(create({ th: 'th.pdf' }), 'en').fallback, true);
  assert.equal(selectPdfVariant(create({ en: 'en.pdf' }), 'th').key, 'en');
  for (const sources of [{}, { common: '', th: ' ', en: '' }]) {
    const draft = create(sources);
    assert.equal(draft.ready, false);
    assert.equal(selectPdfVariant(draft, 'th').source, null);
  }
  for (const sources of [{ common: 'javascript:alert(1)' }, { en: 'http://evil.test/a.pdf' }, { other: 'a.pdf' }])
    assert.throws(() => create(sources));
  assert.equal(inlinePdfSources({ href: 'descriptor.html' }), undefined);
  assert.deepEqual(inlinePdfSources({ 'data-pdf-common': '' }), { common: '' });
  assert.throws(() => inlinePdfSources({ 'data-pdf-common': 'x.pdf', 'data-pdf-src': 'x.html' }));
});

test('inline buttons encode only validated PDFs in the fixed player and preserve file identity', () => {
  const node = { dataset: { contentId: 'sound-slides', pdfCommon: 'slides.pdf', pdfTh: '', pdfEn: '' },
    textContent: 'Slides', getAttribute: () => null };
  const entry = pdfLinkEntry(node, descriptor);
  const tool = createContentTool(entry, hub), url = new URL(tool.page);
  assert.equal(url.pathname, '/learning-hub/pages/tools/pdf-player.html');
  assert.equal(url.searchParams.get('inline'), '1');
  assert.equal(url.searchParams.get('pdf-common'), new URL('slides.pdf', descriptor).href);
  assert.equal(url.searchParams.has('content'), false);
  assert.equal(tool.preparing, false);
  const same = createContentTool({ ...entry, source: new URL('pages/physics.html', hub).href,
    pdfSources: { common: new URL('slides.pdf', descriptor).href } }, hub);
  assert.equal(tool.source, same.source);
  assert.notEqual(tool.source, createContentTool({ ...entry, pdfSources: { common: 'other.pdf' } }, hub).source);
  assert.equal(createContentTool({ ...entry, pdfSources: {} }, hub).preparing, true);
  assert.equal(createContentTool({ ...entry, source: 'https://evil.test/x.html' }, hub), null);
  assert.equal(createContentTool({ ...entry, pdfSources: { common: 'javascript:alert(1)' } }, hub), null);
});

test('download plans use the active source without changing Drive access or resource keys', () => {
  const drive = resolvePdfSource('https://drive.google.com/file/d/abcdefghijk12345/view?resourcekey=0-abc', descriptor, hub);
  const provider = pdfDownloadAction(drive, hub, 'sound-th.pdf');
  assert.equal(provider.kind, 'provider');
  assert.equal(provider.url, 'https://drive.google.com/file/d/abcdefghijk12345/view?resourcekey=0-abc');
  assert.equal(pdfDownloadAction(resolvePdfSource('slides.pdf', descriptor, hub), hub, 'sound.pdf').kind, 'native');
  assert.equal(pdfDownloadAction(resolvePdfSource('https://cdn.test/x.pdf', descriptor, hub), hub, 'sound.pdf').kind, 'blob');
});

test('inline menu and nested buttons share canonical PDF routes; empty links stay preparing', async () => {
  const inline = 'data-pdf-common="shared.pdf" data-pdf-th="" data-pdf-en=""';
  const files = new Map([
    ['index.html', '<button data-section="physics" data-page-src="pages/physics.html"></button>'],
    ['pages/physics.html', '<main data-subject-page data-subject-id="physics"></main><template id="subject-chapters"><article data-chapter="12" data-chapter-src="../content/p/menu.html"><h2 data-chapter-title>Sound</h2></article></template>'],
    ['content/p/menu.html', `<nav data-learning-menu data-menu-kind="topics" data-subject-id="physics" data-chapter-id="12"><a data-tool-kind="pdf" data-content-id="shared-slides" ${inline}>Slides</a><a data-tool-kind="pdf" data-content-id="draft-slides">Draft</a><a data-tool-kind="html" data-content-id="reading" href="reading.html">Read</a></nav>`],
    ['content/p/reading.html', `<html data-learning-html><button data-hub-pdf data-content-id="shared-slides" ${inline}>Slides</button><button data-hub-pdf data-content-id="draft-slides" data-pdf-common="">Draft</button></html>`],
  ]);
  const read = async path => { if (!files.has(path)) throw Error('Unexpected PDF network request: ' + path); return files.get(path); };
  const catalog = await buildRouteCatalog({ read });
  const content = catalog.contents.find(row => row.id === 'shared-slides');
  assert.deepEqual(content.pdfSources, { common: 'content/p/shared.pdf' });
  assert.equal(content.placements.length, 2);
  const route = resolveHubRoute(catalog, '#content/shared-slides').route;
  const player = new URL(activityForRoute(catalog, route, hub).tool.page);
  assert.equal(player.searchParams.get('pdf-common'), new URL('content/p/shared.pdf', hub).href);
  assert.equal(resolveHubRoute(catalog, '#content/draft-slides').route.status, 'preparing');
  files.set('content/p/reading.html', files.get('content/p/reading.html').replace(inline, 'data-pdf-common="different.pdf"'));
  await assert.rejects(buildRouteCatalog({ read }), /Content ID conflict/);
});

test('PDF drafts and unavailable local files yield warnings, but supplied unsafe links still fail', async () => {
  const file = fileURLToPath(new URL('../public/content/pdf-test/reading.html', import.meta.url));
  const check = async attributes => {
    const source = `<html data-learning-html><button data-hub-pdf data-content-id="sound-slides" ${attributes}>Slides</button></html>`;
    const validator = createContentValidator({ read: async path => {
      if (path === file) return source;
      throw Object.assign(Error('Missing'), { code: 'ENOENT' });
    } });
    await validator.validateFile(file); return validator;
  };
  for (const attributes of ['', 'data-pdf-common="" data-pdf-th="" data-pdf-en=""', 'data-pdf-th="slides.pdf"',
    'data-pdf-en="https://drive.google.com/file/d/abcdefghijk12345/view"']) {
    const validator = await check(attributes);
    assert.deepEqual(validator.errors, []);
  }
  assert.ok((await check('data-pdf-common="javascript:alert(1)"')).errors.length);
  assert.ok((await check('data-pdf-en="https://cdn.test/not-a-pdf.html"')).errors.length);
});

test('PDF menu cards validate destination identity and read-only HTML can call the descriptor', async () => {
  const file = fileURLToPath(new URL('../public/content/pdf-test/menu.html', import.meta.url));
  const check = async source => {
    const validator = createContentValidator({ read: async path => path === file ? source : manifestHtml });
    await validator.validateFile(file); return validator.errors;
  };
  const card = '<a data-tool-kind="pdf" data-content-id="sound-slides" href="slides.html" data-th="สไลด์" data-en="Slides">Slides</a>';
  for (const kind of ['topics', 'tools']) assert.deepEqual(await check(`<nav data-learning-menu data-menu-kind="${kind}" data-subject-id="physics" data-chapter-id="12" data-topic-id="nature" data-title-th="เสียง" data-title-en="Sound">${card}</nav>`), []);
  const reading = '<html data-learning-html><body><button data-hub-pdf data-content-id="sound-slides" data-pdf-src="slides.html">Slides</button></body></html>';
  assert.deepEqual(await check(reading), []);
  assert.ok((await check(reading.replace('sound-slides', 'wrong-id'))).length);
});

test('repository sample PDF descriptor and nested reader pass the real content gate', async () => {
  const validator = createContentValidator();
  for (const file of ['pdf-viewer-demo.html', 'pdf-demo-reading.html', 'pdf-demo-menu.html', 'pdf-demo-tools.html'])
    await validator.validateFile(fileURLToPath(new URL('../public/content/samples/' + file, import.meta.url)));
  assert.deepEqual(validator.errors, []);
});

test('quiz fragment links keep the lesson base after copying into the central player', () => {
  const attrs = [{ href: '../slides.html' }, { 'data-pdf-src': 'slides.html', href: 'fallback.html' },
    { 'data-pdf-common': '../shared.pdf', 'data-pdf-th': '', 'data-pdf-en': 'https://cdn.test/en.pdf' }];
  const links = attrs.map(a => ({ hasAttribute: name => Object.hasOwn(a, name), getAttribute: name => a[name], setAttribute: (name, value) => { a[name] = value; } }));
  resolveAuthoredPdfLinks({ querySelectorAll: () => links }, descriptor);
  assert.equal(attrs[0].href, new URL('../slides.html', descriptor).href);
  assert.equal(attrs[1]['data-pdf-src'], descriptor);
  assert.equal(attrs[1].href, 'fallback.html');
  assert.equal(attrs[2]['data-pdf-common'], new URL('../shared.pdf', descriptor).href);
  assert.equal(attrs[2]['data-pdf-th'], '');
  assert.equal(attrs[2]['data-pdf-en'], 'https://cdn.test/en.pdf');
});
