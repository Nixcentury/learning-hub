import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { normalizeVideoSource, createVideoManifest, videoEmbedUrl } from '../public/shared/video-content-model.js';
import { videoLinkEntry } from '../js/video-link.js';
import { createContentTool } from '../js/content-tool.js';
import { activityForRoute } from '../js/hub-activity-routes.js';
import { resolveHubRoute } from '../js/hub-routes.js';
import { buildRouteCatalog } from './route-catalog.mjs';
import { createContentValidator } from './validate-activity-content.mjs';

const hub = 'https://school.test/learning-hub/';
const clip = 'M7lc1UVf-VE'; // Public example from the YouTube IFrame API docs.
const url = `https://www.youtube.com/watch?v=${clip}`;
const entry = { toolKind: 'video', subjectId: 'physics', chapterId: '12', topicId: 'sound',
  contentId: 'sound-video', source: new URL('content/p/reading.html', hub).href, videoSource: url,
  titleTh: 'วิดีโอ', titleEn: 'Video' };

test('shared video accepts watch, short, live, embed and mobile links with equivalent start times', () => {
  for (const link of [`https://youtu.be/${clip}?t=1m30s`, `${url}&t=90`,
    `https://m.youtube.com/watch?v=${clip}&t=90s`, `https://www.youtube.com/shorts/${clip}?t=90`,
    `https://www.youtube.com/live/${clip}?start=90`, `https://www.youtube-nocookie.com/embed/${clip}?start=90`]) {
    assert.deepEqual(normalizeVideoSource(link), { provider: 'youtube', videoId: clip, start: 90, url: `${url}&t=90` });
  }
  assert.equal(normalizeVideoSource(`https://youtu.be/${clip}#t=2m`).start, 120);
});

test('video URLs reject executable, foreign, ambiguous and invalid sources including unsafe drafts', () => {
  for (const link of ['javascript:alert(1)', 'data:text/html,x', `http://youtu.be/${clip}`,
    `https://youtube.com.evil.test/watch?v=${clip}`, `https://youtube.com@evil.test/watch?v=${clip}`,
    `https://user:password@www.youtube.com/watch?v=${clip}`, `https://www.youtube.com:444/watch?v=${clip}`,
    `https://youtu.be/${clip}/other`, 'https://www.youtube.com/playlist?list=PL123',
    'https://www.youtube.com/watch?v=invalid', `${url}&t=-1`, `${url}&t=99999999999`,
    `${url}&t=no`, `https://youtu.be/\\${clip}`]) assert.throws(() => normalizeVideoSource(link), undefined, link);
  assert.equal(createVideoManifest('', 'sound-video').ready, false);
  assert.throws(() => createVideoManifest(url, '../other'));
});

test('player URL is constructed from an allowlisted source, with no Quiz storage or identity', () => {
  const tool = createContentTool(entry, hub);
  const page = new URL(tool.page);
  assert.equal(page.pathname, '/learning-hub/pages/tools/video-player.html');
  assert.equal(page.searchParams.get('video'), url);
  assert.equal(tool.context.toolKind, 'video');
  assert.equal(tool.id, createContentTool({ ...entry, source: new URL('index.html', hub).href, topicId: 'another' }, hub).id);
  assert.equal(tool.source, createContentTool({ ...entry, videoSource: `https://youtu.be/${clip}` }, hub).source);
  assert.equal(createContentTool({ ...entry, videoSource: '' }, hub).preparing, true);
  assert.equal(createContentTool({ ...entry, videoSource: 'https://evil.test/x' }, hub), null);
  const embed = new URL(videoEmbedUrl(normalizeVideoSource(url), new URL(hub).origin, 'en'));
  assert.equal(embed.searchParams.get('enablejsapi'), '1');
  assert.equal(embed.searchParams.get('autoplay'), '0');
  assert.equal(embed.searchParams.get('origin'), 'https://school.test');
  assert.equal(embed.searchParams.get('hl'), 'en');
  assert.doesNotMatch(tool.page, /uid|token|identity|role/);
});

test('declarative link inherits context and permits an explicitly blank draft', () => {
  const node = { dataset: { contentId: 'sound-video', th: 'วิดีโอ', en: 'Video' },
    textContent: 'Video', getAttribute: name => ({ href: url, 'data-video-src': '' })[name] ?? null };
  const result = videoLinkEntry(node, entry.source, entry);
  assert.equal(result.videoSource, '');
  assert.equal(result.subjectId, 'physics');
  assert.equal(result.contentId, entry.contentId);
});

function fixture() {
  const button = `<a data-hub-video data-content-id="sound-video" href="${url}" data-th="วิดีโอ" data-en="Video">Video</a>`;
  const menuLink = `<a data-tool-kind="video" data-content-id="sound-video" href="https://youtu.be/${clip}" data-th="วิดีโอ" data-en="Video">Video</a>`;
  return new Map([
    ['index.html', `<button data-section="physics" data-page-src="pages/physics.html"></button>${button}`],
    ['pages/physics.html', '<main data-subject-page data-subject-id="physics"></main><template id="subject-chapters"><article data-chapter="12" data-chapter-src="../content/p/menu.html"><h2 data-chapter-title>Sound</h2></article></template>'],
    ['content/p/menu.html', `<nav data-learning-menu data-menu-kind="topics" data-subject-id="physics" data-chapter-id="12">${menuLink}<a data-topic-id="sound" href="tools.html">Sound</a></nav>`],
    ['content/p/tools.html', `<nav data-learning-menu data-menu-kind="tools" data-subject-id="physics" data-chapter-id="12" data-topic-id="sound">${menuLink}<a data-tool-kind="html" data-content-id="reading" href="reading.html">Reading</a><a data-tool-kind="simulation" data-content-id="sim" href="sim.html">Simulation</a><a data-tool-kind="quiz" data-content-id="practice" href="quiz.html">Quiz</a></nav>`],
    ['content/p/reading.html', `<html data-learning-html>${button}</html>`],
    ['content/p/sim.html', `<html data-learning-simulation data-activity-id="sim">${button}</html>`],
    ['content/p/quiz.html', `<article data-learning-activity-content data-activity-id="practice" data-activity-kind="quiz">${button}</article>`],
  ]);
}
const catalog = files => buildRouteCatalog({ legacyCatalog: {}, read: async path => {
  assert.ok(files.has(path), `No network access or fetching video as content: ${path}`); return files.get(path);
} });

test('one clip from menus, readings, Quiz and Simulation shares one canonical player and stable route', async () => {
  const result = await catalog(fixture());
  const video = result.contents.filter(row => row.id === 'sound-video');
  assert.equal(video.length, 1);
  assert.ok(video[0].placements.length >= 5);
  for (const hash of ['#content/sound-video', '#physics/12/sound-video', '#physics/12/sound/sound-video']) {
    const { route } = resolveHubRoute(result, hash);
    const tool = activityForRoute(result, route, hub).tool;
    assert.equal(tool.id, 'content-video-sound-video');
    assert.equal(new URL(tool.page).searchParams.get('video'), url);
  }
  const conflict = fixture();
  conflict.set('content/p/sim.html', conflict.get('content/p/sim.html').replace(url, 'https://youtu.be/dQw4w9WgXcQ'));
  await assert.rejects(catalog(conflict), /Content ID conflict/);
});

test('missing clips remain drafts and cannot silently become a playable route', async () => {
  const files = fixture();
  files.set('content/p/tools.html', files.get('content/p/tools.html').replace('</nav>', '<a data-tool-kind="video" data-content-id="future-video" href="" data-th="รอ" data-en="Soon">Soon</a></nav>'));
  const result = await catalog(files);
  assert.equal(result.contents.some(row => row.id === 'future-video'), false);
  assert.equal(resolveHubRoute(result, '#physics/12/sound/future-video').status, 'preparing');
});

test('content validation accepts data-only video buttons without allowing embedded scripts or iframes', async () => {
  const path = fileURLToPath(new URL('../public/content/video-test/reading.html', import.meta.url));
  for (const [source, valid] of [
    [`<html data-learning-html><a data-hub-video data-content-id="sound-video" href="${url}">Video</a></html>`, true],
    ['<html data-learning-html><button data-hub-video data-content-id="sound-video" data-video-src="">Video</button></html>', true],
    ['<html data-learning-html><a data-hub-video data-content-id="sound-video" href="javascript:alert(1)">Video</a></html>', false],
    [`<html data-learning-html><iframe src="${url}"></iframe></html>`, false],
    [`<html data-learning-html><a data-hub-video data-hub-pdf data-content-id="sound-video" href="${url}">Video</a></html>`, false],
  ]) {
    const validator = createContentValidator({ read: async () => source });
    await validator.validateFile(path);
    assert.equal(validator.errors.length === 0, valid, validator.errors.join('\n') || source);
  }
});
