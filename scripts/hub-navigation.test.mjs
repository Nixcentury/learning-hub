import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNavigation, routeForSelection } from '../js/hub-navigation.js';
import { activityForRoute, menuForRoute, routeForTool, isActivityRoute } from '../js/hub-activity-routes.js';
import { catalogFromRepository } from './build-route-catalog.mjs';
import { toolCatalog } from '../js/legacy-tool-catalog.js';
import { createHubShareUrl, resolveHubRoute } from '../js/hub-routes.js';
import { createTopicReviewTool } from '../js/topic-review-tools.js';

const section = { hash: '#physics', aliases: [], kind: 'section', sectionId: 'physics', subjectId: 'physics' };
const chapter = { hash: '#physics/natural', aliases: ['#physics/1'], kind: 'chapter', subjectId: 'physics', chapterId: '1', parentHash: '#physics', status: 'ready' };
const topic = { hash: '#physics/natural/measurement', aliases: ['#physics/1/measurement'], kind: 'topic', subjectId: 'physics', chapterId: '1', topicId: 'measurement', parentHash: chapter.hash, status: 'preparing' };
const hubUrl = 'https://nixcentury.github.io/learning-hub/?v=old#physics';
const catalog = { schemaVersion: 1, contents: [{ id:'quiz-one', toolKind:'quiz', source:'content/samples/quiz.html' }], routes: [section, chapter, topic,
  { hash: '#overview', aliases: [], kind: 'section', sectionId: 'overview' },
  { hash: '#content/quiz-one', aliases: [], kind: 'content', contentId:'quiz-one', subjectId:'physics',chapterId:'1',topicId:'measurement', parentHash: topic.hash },
  { hash: '#tool/physics-c1-notebook', aliases: [], kind: 'legacy-tool', toolId:'physics-c1-notebook', storageContentId:'physics-c1-notebook', parentHash: chapter.hash },
] };

test('review libraries and topic deep links share the owned Hub player and retain their bank menu', () => {
  const key = 'b-' + 'a'.repeat(24);
  for (const subjectId of ['physics', 'chemistry']) for (const bankKey of [null, key]) {
    const hash = `#${subjectId}/review${bankKey ? '/' + bankKey : ''}`;
    const { route, notice } = resolveNavigation(catalog, hash);
    assert.equal(notice, ''); assert.equal(route.kind, 'topic-review');
    assert.equal(menuForRoute(catalog, route).hash, `#${subjectId}/bank${bankKey ? '/' + bankKey : ''}`);
    const activity = activityForRoute(catalog, route, hubUrl);
    assert.equal(activity.tool.id, 'topic-review-library');
    assert.deepEqual(activity.review, { subjectId, bankKey });
    assert.equal(new URL(activity.tool.page).pathname, '/learning-hub/pages/tools/topic-review-player.html');
    assert.equal(new URL(activity.tool.page).searchParams.get('embedded'), '1');
    assert.equal(routeForTool(catalog, activity.tool, null, hubUrl).hash, hash);
    assert.equal(routeForSelection(catalog, { subjectId, review: true, bankKey }).hash, hash);
    const shared = new URL(createHubShareUrl(catalog, hash, hubUrl));
    assert.equal(shared.hash, hash); assert.equal(shared.search, '');
  }
});

test('review routes reject forged subjects, topic IDs, extra path segments and privileged source URLs', () => {
  for (const hash of ['#biology/review', '#chemistry/review/not-a-key', '#physics/review/bad/quiz'])
    assert.equal(resolveHubRoute(catalog, hash).route, undefined);
  for (const value of [{ subjectId: 'admin' }, { subjectId: 'physics', bankKey: '../../secret' }, { subjectId: 'chemistry', bankKey: 123 }])
    assert.equal(createTopicReviewTool(value, hubUrl), null);
  const tool = createTopicReviewTool({ subjectId: 'physics' }, hubUrl);
  assert.equal(routeForTool(catalog, { ...tool, source: 'https://evil.test/player.html' }, null, hubUrl), null);
  assert.equal(routeForTool(catalog, { ...tool, reviewSelection: { subjectId: 'chemistry', bankKey: null } }, null, hubUrl), null);
  assert.equal(createTopicReviewTool({ subjectId: 'physics' }, 'javascript:alert(1)'), null);
});

test('phase 2 resolves aliases and preparing topics without rewriting their stable IDs', () => {
  assert.deepEqual(resolveNavigation(catalog, '#physics/1'), { route: chapter, notice: '' });
  assert.deepEqual(resolveNavigation(catalog, '#physics/1/measurement'), { route: topic, notice: '' });
});
test('Physics and Chemistry enter their library while existing chapter links keep their IDs', async () => {
  const value = await catalogFromRepository();
  for (const subjectId of ['physics', 'chemistry']) {
    assert.equal(resolveNavigation(value, `#${subjectId}`).route.hash, `#${subjectId}/bank`);
    assert.equal(routeForSelection(value, { subjectId }).hash, `#${subjectId}/bank`);
    const chapter = value.routes.find(route => route.kind === 'chapter' && route.subjectId === subjectId);
    assert.equal(resolveNavigation(value, chapter.hash).route, chapter);
    assert.equal(routeForSelection(value, { subjectId, chapterId: chapter.chapterId }), chapter);
  }
  assert.equal(resolveNavigation(value, '#biology').route.hash, '#biology');
});
test('invalid and missing locations use the closest known parent with an explicit notice', () => {
  assert.equal(resolveNavigation(catalog, '#physics/1/no-topic').route, chapter);
  assert.equal(resolveNavigation(catalog, '#physics/no-chapter').route, section);
  assert.equal(resolveNavigation(catalog, '#unknown').route.sectionId, 'overview');
  for (const hash of ['#physics//chapter', '#physics/../admin', '#unknown']) assert.equal(resolveNavigation(catalog, hash).notice, 'not-found');
});
test('workspace links resolve the activity while retaining their parent menu', () => {
  for (const [hash, parent] of [['#content/quiz-one', topic], ['#tool/physics-c1-notebook', chapter]]) {
    const result = resolveNavigation(catalog, hash);
    assert.equal(result.route.hash, hash);
    assert.equal(result.notice, '');
    assert.equal(menuForRoute(catalog, result.route), parent);
  }
});

test('activity links use safe catalog sources and preserve the existing storage identity', () => {
  const route = resolveNavigation(catalog, '#content/quiz-one').route;
  const activity = activityForRoute(catalog, route, hubUrl);
  assert.equal(activity.tool.id, 'content-quiz-quiz-one');
  assert.equal(activity.tool.context.contentId, 'quiz-one');
  assert.equal(new URL(activity.tool.page).searchParams.get('content'), 'https://nixcentury.github.io/learning-hub/content/samples/quiz.html');
  assert.equal(routeForTool(catalog, activity.tool, route, hubUrl), route);
  assert.equal(routeForTool(catalog, {...activity.tool,source:'https://evil.example/quiz.html'}, route, hubUrl), null);
  const legacy = resolveNavigation(catalog, '#tool/physics-c1-notebook').route;
  assert.equal(activityForRoute(catalog, legacy, hubUrl).tool, toolCatalog['physics-c1-notebook']);
  assert.equal(activityForRoute(catalog, {...legacy,storageContentId:'other'}, hubUrl), null);
  for (const source of ['https://evil.example/a.html','../private.html','content/a.html?uid=student']) {
    assert.equal(activityForRoute({...catalog, contents:[{...catalog.contents[0],source}]}, route, hubUrl), null);
  }
});

test('cyclic reading links fall back to a stable menu and preparing content has a notice', () => {
  const a = {...catalog.routes[4], hash:'#content/a', parentHash:'#content/b'};
  const b = {...a, hash:'#content/b', parentHash:'#content/a'};
  const placeholder = {hash:'#physics/natural/overview',aliases:[],kind:'content-placeholder',parentHash:chapter.hash};
  const value = {...catalog,routes:[...catalog.routes,a,b,placeholder]};
  assert.equal(menuForRoute(value, a), topic);
  assert.equal(resolveNavigation(value, placeholder.hash).notice, 'preparing');
});

test('every currently authored activity route opens with a valid descriptor and a known menu', async () => {
  const value = await catalogFromRepository();
  for (const route of value.routes.filter(isActivityRoute)) {
    assert.ok(activityForRoute(value, route, hubUrl), route.hash);
    assert.ok(menuForRoute(value, route), route.hash);
  }
});
test('navigation requests use stable context IDs, not HTML-supplied URLs or storage state', () => {
  assert.equal(routeForSelection(catalog, { subjectId: 'physics', chapterId: '1' }), chapter);
  assert.equal(routeForSelection(catalog, { subjectId: 'physics', chapterId: '1', topicId: 'measurement' }), topic);
  assert.equal(routeForSelection(catalog, { subjectId: 'physics' }).hash, '#physics/bank');
  for (const value of [null, {}, {subjectId:'physics',chapterId:'natural'}, {subjectId:'physics',topicId:'measurement'}, {subjectId:'admin'}, {subjectId:'physics',chapterId:'1',topicId:'other'}]) assert.equal(routeForSelection(catalog, value), null);
});
