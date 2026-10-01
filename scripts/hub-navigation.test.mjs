import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNavigation, routeForSelection } from '../js/hub-navigation.js';
import { activityForRoute, menuForRoute, routeForTool, isActivityRoute } from '../js/hub-activity-routes.js';
import { catalogFromRepository } from './build-route-catalog.mjs';
import { toolCatalog } from '../js/legacy-tool-catalog.js';

const section = { hash: '#physics', aliases: [], kind: 'section', sectionId: 'physics', subjectId: 'physics' };
const chapter = { hash: '#physics/natural', aliases: ['#physics/1'], kind: 'chapter', subjectId: 'physics', chapterId: '1', parentHash: '#physics', status: 'ready' };
const topic = { hash: '#physics/natural/measurement', aliases: ['#physics/1/measurement'], kind: 'topic', subjectId: 'physics', chapterId: '1', topicId: 'measurement', parentHash: chapter.hash, status: 'preparing' };
const hubUrl = 'https://nixcentury.github.io/learning-hub/?v=old#physics';
const catalog = { schemaVersion: 1, contents: [{ id:'quiz-one', toolKind:'quiz', source:'content/samples/quiz.html' }], routes: [section, chapter, topic,
  { hash: '#overview', aliases: [], kind: 'section', sectionId: 'overview' },
  { hash: '#content/quiz-one', aliases: [], kind: 'content', contentId:'quiz-one', subjectId:'physics',chapterId:'1',topicId:'measurement', parentHash: topic.hash },
  { hash: '#tool/physics-c1-notebook', aliases: [], kind: 'legacy-tool', toolId:'physics-c1-notebook', storageContentId:'physics-c1-notebook', parentHash: chapter.hash },
] };

test('phase 2 resolves aliases and preparing topics without rewriting their stable IDs', () => {
  assert.deepEqual(resolveNavigation(catalog, '#physics/1'), { route: chapter, notice: '' });
  assert.deepEqual(resolveNavigation(catalog, '#physics/1/measurement'), { route: topic, notice: '' });
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
  assert.equal(routeForSelection(catalog, { subjectId: 'physics' }), section);
  for (const value of [null, {}, {subjectId:'physics',chapterId:'natural'}, {subjectId:'physics',topicId:'measurement'}, {subjectId:'admin'}, {subjectId:'physics',chapterId:'1',topicId:'other'}]) assert.equal(routeForSelection(catalog, value), null);
});
