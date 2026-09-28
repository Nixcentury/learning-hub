import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNavigation, routeForSelection } from '../js/hub-navigation.js';

const section = { hash: '#physics', aliases: [], kind: 'section', sectionId: 'physics', subjectId: 'physics' };
const chapter = { hash: '#physics/natural', aliases: ['#physics/1'], kind: 'chapter', subjectId: 'physics', chapterId: '1', parentHash: '#physics', status: 'ready' };
const topic = { hash: '#physics/natural/measurement', aliases: ['#physics/1/measurement'], kind: 'topic', subjectId: 'physics', chapterId: '1', topicId: 'measurement', parentHash: chapter.hash, status: 'preparing' };
const catalog = { schemaVersion: 1, contents: [], routes: [section, chapter, topic,
  { hash: '#overview', aliases: [], kind: 'section', sectionId: 'overview' },
  { hash: '#content/quiz-one', aliases: [], kind: 'content', parentHash: topic.hash },
  { hash: '#tool/physics-c1-notebook', aliases: [], kind: 'legacy-tool', parentHash: chapter.hash },
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
test('workspace links stop at the menu during phase 2 and never invoke tools', () => {
  assert.deepEqual(resolveNavigation(catalog, '#content/quiz-one'), { route: topic, notice: 'workspace-later' });
  assert.deepEqual(resolveNavigation(catalog, '#tool/physics-c1-notebook'), { route: chapter, notice: 'workspace-later' });
});
test('navigation requests use stable context IDs, not HTML-supplied URLs or storage state', () => {
  assert.equal(routeForSelection(catalog, { subjectId: 'physics', chapterId: '1' }), chapter);
  assert.equal(routeForSelection(catalog, { subjectId: 'physics', chapterId: '1', topicId: 'measurement' }), topic);
  assert.equal(routeForSelection(catalog, { subjectId: 'physics' }), section);
  for (const value of [null, {}, {subjectId:'physics',chapterId:'natural'}, {subjectId:'physics',topicId:'measurement'}, {subjectId:'admin'}, {subjectId:'physics',chapterId:'1',topicId:'other'}]) assert.equal(routeForSelection(catalog, value), null);
});
