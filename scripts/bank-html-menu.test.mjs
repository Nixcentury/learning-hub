import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRouteCatalog } from './route-catalog.mjs';
import { resolveHubRoute, createHubShareUrl } from '../js/hub-routes.js';
import { routeForSelection, resolveNavigation } from '../js/hub-navigation.js';
import { activityForRoute, menuForRoute, routeForTool } from '../js/hub-activity-routes.js';
import { bankContentId, bankQuestionId } from '../public/shared/question-bank-model.js';
import { createBankTool } from '../js/question-bank-tools.js';
import { authoredBankTools } from '../public/shared/question-bank-authored.js';
import { discoverBankMenus } from './build-route-catalog.mjs';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const key = 'b-' + '1'.repeat(24), other = 'b-' + '2'.repeat(24);
const menuPath = 'content/bank/physics/' + key + '.html';
const hub = 'https://example.test/learning-hub/';
function fixture() {
  return new Map([
    ['index.html', '<button data-section="physics" data-page-src="pages/physics.html"></button><button data-section="chemistry" data-page-src="pages/chemistry.html"></button>'],
    ['pages/physics.html', '<main data-subject-page data-subject-id="physics"></main><template id="subject-chapters"></template>'],
    ['pages/chemistry.html', '<main data-subject-page data-subject-id="chemistry"></main><template id="subject-chapters"></template>'],
    ['content/physics/ipst/review.html', '<html data-learning-html><body>Review. NOT_IN_CATALOG</body></html>'],
    ['content/physics/ipst/sim.html', '<html data-learning-simulation data-activity-id="phys-ipst-sim"></html>'],
    ['content/physics/ipst/quiz.html', '<article data-learning-activity-content data-activity-id="phys-ipst-practice" data-activity-kind="quiz"><article data-question data-answer="NOT_IN_CATALOG">Question</article></article>'],
  ]);
}
function menu(body = '', attributes = '') {
  return '<nav data-learning-menu data-menu-kind="tools" data-subject-id="physics" data-chapter-id="bank" data-topic-id="' + key +
    '" data-title-th="การวัด" data-title-en="Measurement" data-route-slug="measurement" ' + attributes + '>' + body + '</nav>';
}
function link(toolKey, contentId, kind = 'html', extra = 'href="../../physics/ipst/review.html"') {
  return '<a data-tool-key="' + toolKey + '" data-tool-kind="' + kind + '" data-content-id="' + contentId +
    '" data-th="ทบทวน" data-en="Review" ' + extra + '>Review</a>';
}
function make(files, { menus = files.has(menuPath) ? [menuPath] : [], bankTools = {} } = {}) {
  return buildRouteCatalog({ legacyCatalog: {}, bankMenus: menus, bankTools, read: async name => {
    if (!files.has(name)) throw Object.assign(Error('Missing file'), { code: 'ENOENT' });
    return files.get(name);
  } });
}

test('without optional HTML menus, live Sheet bank routes and question identities stay unchanged', async () => {
  const catalog = await make(fixture());
  const route = resolveHubRoute(catalog, '#physics/bank/' + key + '/quiz').route;
  const quiz = activityForRoute(catalog, route, hub).tool;
  assert.equal(quiz.context.contentId, bankContentId('physics', key));
  assert.equal(bankQuestionId('physics', key, 1), bankContentId('physics', key) + '-001');
  assert.equal(new URL(quiz.page).searchParams.get('bankKey'), key);
  assert.equal(new URL(quiz.page).searchParams.get('bankSubject'), 'physics');
  assert.equal(catalog.contents.length, 0);
  assert.equal(resolveHubRoute(catalog, '#physics/bank/' + other).status, 'ready');
});

test('friendly bank URLs retain old hash aliases for the page, mandatory quiz and notebook', async () => {
  const files = fixture();
  files.set(menuPath, menu('', 'data-route-aliases="measuring"'));
  const catalog = await make(files);
  for (const prefix of [key, 'measuring', 'measurement']) {
    assert.equal(resolveHubRoute(catalog, '#physics/bank/' + prefix).canonicalHash, '#physics/bank/measurement');
    for (const toolKey of ['quiz', 'notebook']) {
      const result = resolveHubRoute(catalog, '#physics/bank/' + prefix + '/' + toolKey);
      assert.equal(result.canonicalHash, '#physics/bank/measurement/' + toolKey);
      assert.equal(result.route.bankKey, key);
      const tool = activityForRoute(catalog, result.route, hub).tool;
      const old = createBankTool({ subjectId: 'physics', bankKey: key, toolKey }, hub);
      assert.deepEqual(tool, old, 'Friendly URLs must not change windows, sources or storage context');
      assert.equal(menuForRoute(catalog, result.route).bankKey, key);
      assert.equal(routeForTool(catalog, tool, null, hub).hash, result.canonicalHash);
    }
  }
  assert.equal(createHubShareUrl(catalog, '#physics/bank/' + key + '/quiz', hub + '?uid=private#physics'),
    hub + '#physics/bank/measurement/quiz');
  assert.equal(authoredBankTools(catalog, 'physics', key).length, 0);
});

test('HTML, Simulation, authored Quiz and inline PDF use the existing content opener and one catalog', async () => {
  const files = fixture();
  files.set(menuPath, menu(
    link('review', 'phys-ipst-review') +
    link('simulation', 'phys-ipst-sim', 'simulation', 'href="../../physics/ipst/sim.html"') +
    link('practice', 'phys-ipst-practice', 'quiz', 'href="../../physics/ipst/quiz.html"') +
    link('handout', 'phys-ipst-pdf', 'pdf', 'data-pdf-common="https://drive.google.com/file/d/0123456789ABCDEF/view?usp=sharing" data-pdf-th="" data-pdf-en=""')));
  const catalog = await make(files);
  assert.deepEqual(authoredBankTools(catalog, 'physics', key).map(tool => tool.key), ['review', 'simulation', 'practice', 'handout']);
  for (const [toolKey, kind] of [['review', 'html'], ['simulation', 'simulation'], ['practice', 'quiz'], ['handout', 'pdf']]) {
    const route = routeForSelection(catalog, { subjectId: 'physics', bank: true, bankKey: key, toolKey });
    assert.equal(route.kind, 'content');
    assert.equal(route.bankKey, key);
    assert.equal(route.toolKey, toolKey);
    assert.equal(menuForRoute(catalog, route).hash, '#physics/bank/measurement');
    const activity = activityForRoute(catalog, route, hub);
    assert.equal(activity.tool.context.toolKind, kind);
    assert.equal(activity.tool.context.topicId, key);
    assert.equal(activity.tool.context.chapterId, 'bank');
    assert.equal(routeForTool(catalog, activity.tool, route, hub).hash, route.hash);
    assert.equal(resolveHubRoute(catalog, '#content/' + route.contentId).status, 'ready');
  }
  const pdfRoute = routeForSelection(catalog, { subjectId: 'physics', bank: true, bankKey: key, toolKey: 'handout' });
  assert.match(activityForRoute(catalog, pdfRoute, hub).tool.page, /pages\/tools\/pdf-player\.html/);
  assert.equal(JSON.stringify(catalog).includes('NOT_IN_CATALOG'), false);
});

test('tool slugs alias stable keys and authored order is independent of route sorting', async () => {
  const files = fixture();
  files.set(menuPath, menu(link('z-review', 'phys-ipst-review', 'html', 'data-route-slug="quick-review" data-route-aliases="summary" href="../../physics/ipst/review.html"') +
    link('a-sheet', 'phys-ipst-sheet', 'html', 'href=""')));
  const catalog = await make(files);
  for (const segment of ['z-review', 'summary', 'quick-review']) {
    assert.equal(resolveHubRoute(catalog, '#physics/bank/' + key + '/' + segment).canonicalHash, '#physics/bank/measurement/quick-review');
  }
  assert.deepEqual(authoredBankTools(catalog, 'physics', key).map(tool => tool.key), ['z-review', 'a-sheet']);
  assert.deepEqual(authoredBankTools(catalog, 'chemistry', key), []);
  assert.deepEqual(authoredBankTools(catalog, 'physics', other), []);
  assert.deepEqual(authoredBankTools(null, 'physics', key), []);
});

test('optional empty, absent, explicit draft and blank-PDF entries never remove the system quiz', async () => {
  const files = fixture();
  files.set(menuPath, menu(
    link('blank', 'phys-ipst-blank', 'html', 'href=""') +
    link('missing', 'phys-ipst-missing', 'simulation', 'href="../../physics/ipst/missing.html"') +
    link('draft', 'phys-ipst-draft', 'html', 'href="../../physics/ipst/review.html" data-status="draft"') +
    link('pdf', 'phys-ipst-empty-pdf', 'pdf', 'data-pdf-common="" data-pdf-th="" data-pdf-en=""')));
  const catalog = await make(files);
  assert.equal(catalog.contents.length, 0);
  assert.equal(authoredBankTools(catalog, 'physics', key).length, 4);
  assert.ok(authoredBankTools(catalog, 'physics', key).every(tool => tool.status === 'preparing'));
  for (const toolKey of ['blank', 'missing', 'draft', 'pdf']) {
    const route = routeForSelection(catalog, { subjectId: 'physics', bank: true, bankKey: key, toolKey });
    assert.equal(route.kind, 'content-placeholder');
    assert.equal(resolveNavigation(catalog, route.hash).route.hash, '#physics/bank/measurement');
    assert.equal(resolveNavigation(catalog, route.hash).notice, 'preparing');
  }
  assert.equal(activityForRoute(catalog, resolveHubRoute(catalog, '#physics/bank/' + key + '/quiz').route, hub).tool.context.contentId,
    bankContentId('physics', key));
});

test('same content can be reused from an outside lesson and bank without duplicate identities/files', async () => {
  const files = fixture();
  files.set('pages/physics.html', '<main data-subject-page data-subject-id="physics"></main><template id="subject-chapters"><article data-chapter="1" data-chapter-src="../content/physics/chapter.html"><h2 data-chapter-title>Chapter</h2></article></template>');
  files.set('content/physics/chapter.html', '<nav data-learning-menu data-menu-kind="topics" data-subject-id="physics" data-chapter-id="1"><a data-topic-id="measurement" href="topic.html"></a></nav>');
  files.set('content/physics/topic.html', '<nav data-learning-menu data-menu-kind="tools" data-subject-id="physics" data-chapter-id="1" data-topic-id="measurement"><a data-tool-kind="html" data-content-id="phys-ipst-review" href="ipst/review.html"></a></nav>');
  files.set(menuPath, menu(link('review', 'phys-ipst-review')));
  const catalog = await make(files);
  assert.equal(catalog.contents.length, 1);
  assert.equal(catalog.contents[0].placements.length, 2);
  assert.equal(resolveHubRoute(catalog, '#physics/1/measurement/phys-ipst-review').content.id, 'phys-ipst-review');
  assert.equal(resolveHubRoute(catalog, '#physics/bank/measurement/review').content.id, 'phys-ipst-review');
});

test('reserved keys, duplicate tool keys and manual registry collisions fail instead of overriding', async () => {
  for (const toolKey of ['quiz', 'notebook']) {
    const files = fixture();
    files.set(menuPath, menu(link(toolKey, 'phys-ipst-review')));
    await assert.rejects(make(files), /not quiz or notebook/);
  }
  for (const body of [
    link('review', 'phys-ipst-review') + link('review', 'phys-ipst-draft', 'html', 'href=""'),
    link('review', 'phys-ipst-review', 'html', 'data-route-slug="quiz" href="../../physics/ipst/review.html"'),
  ]) {
    const files = fixture(); files.set(menuPath, menu(body));
    await assert.rejects(make(files), /Route collision/);
  }
  const files = fixture(); files.set(menuPath, menu(link('review', 'phys-ipst-review')));
  await assert.rejects(make(files, { bankTools: { ['physics/' + key]: [{ key: 'review', titleTh: 'Old review' }] } }), /Route collision/);
});

test('different bank keys cannot steal hash-shaped IDs or the same friendly URL', async () => {
  const files = fixture();
  files.set(menuPath, menu('', 'data-route-aliases="' + other + '"'));
  await assert.rejects(make(files), /cannot alias a different bankKey/);
  files.set(menuPath, menu());
  const second = 'content/bank/physics/' + other + '.html';
  files.set(second, menu().replace(key, other));
  await assert.rejects(make(files, { menus: [menuPath, second] }), /Route collision/);
  const chemistry = 'content/bank/chemistry/' + other + '.html';
  files.set(chemistry, menu().replace(key, other).replace('data-subject-id="physics"', 'data-subject-id="chemistry"'));
  assert.equal(resolveHubRoute(await make(files, { menus: [menuPath, chemistry] }), '#chemistry/bank/measurement').route.bankKey, other);
});

test('bad paths, mismatched menu context, unsafe links and content identity conflicts are errors, not drafts', async () => {
  const files = fixture(); files.set(menuPath, menu());
  await assert.rejects(make(files, { menus: ['content/bank/physics/not-a-key.html'] }), /Bank menu path/);
  for (const replacement of ['data-chapter-id="2"', 'data-subject-id="chemistry"', 'data-topic-id="' + other + '"']) {
    const bad = fixture();
    const attr = replacement.startsWith('data-chapter') ? 'data-chapter-id="bank"' :
      replacement.startsWith('data-subject') ? 'data-subject-id="physics"' : 'data-topic-id="' + key + '"';
    bad.set(menuPath, menu().replace(attr, replacement));
    await assert.rejects(make(bad), /Menu context mismatch/);
  }
  const bad = fixture(); bad.set(menuPath, menu(link('review', 'phys-ipst-review', 'html', 'href="https://evil.test/review.html"')));
  await assert.rejects(make(bad), /Invalid local link/);
  const conflict = fixture();
  conflict.set(menuPath, menu(link('one', 'phys-ipst-review') + link('two', 'phys-ipst-other')));
  await assert.rejects(make(conflict), /two IDs/);
});

test('repository discovery is optional, deterministic and rejects unexpected locations and symlinks', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'learning-hub-bank-menu-'));
  try {
    assert.deepEqual(await discoverBankMenus(folder), []);
    await mkdir(join(folder, 'content/bank/physics'), { recursive: true });
    await writeFile(join(folder, menuPath), menu());
    await writeFile(join(folder, 'content/bank/README.txt'), 'Authoring instructions');
    assert.deepEqual(await discoverBankMenus(folder), [menuPath]);
    await mkdir(join(folder, 'content/bank/biology'));
    await assert.rejects(discoverBankMenus(folder), /physics or content\/bank\/chemistry/);
    await rm(join(folder, 'content/bank/biology'), { recursive: true });
    if (process.platform !== 'win32') {
      await symlink(join(folder, menuPath), join(folder, 'content/bank/physics/' + other + '.html'));
      await assert.rejects(discoverBankMenus(folder), /no nested folders or symlinks/);
    }
  } finally { await rm(folder, { recursive: true, force: true }); }
});
