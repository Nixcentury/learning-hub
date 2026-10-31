import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { createContentTool } from '../js/content-tool.js';
import { createHubContextMessage } from '../js/content-context.js';
import { videoLinkEntry } from '../js/video-link.js';
import { htmlLinkEntry } from '../js/html-link.js';
import { pdfLinkEntry } from '../js/pdf-link.js';
import { applyContentLanguage } from '../js/content-language.js';
import { createLearningGuide } from '../js/learning-guide.js';
import { createBankTool } from '../js/question-bank-tools.js';
import { createTopicReviewTool } from '../js/topic-review-tools.js';
import { bankKeyPattern } from '../public/shared/question-bank-model.js';

// Execute the real Workspace and its DOM handlers, with iframe transport replaced.
// This checks integration and state transitions, not browser layout or live YouTube.
const code = readFileSync(new URL('../js/workspace.js', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?;\n/gm, '').replace(/^export /gm, '')
  // Linkedom reparents clock <output> nodes out of buttons. Use their surrounding
  // groups for the clock references; video handlers run unchanged.
  .replace('.window-stopwatch-toggle output', '.window-stopwatch-controls output')
  .replace('.window-timer-toggle output', '.window-timer-controls output');
const url = 'https://www.youtube.com/watch?v=M7lc1UVf-VE';
const context = { subjectId: 'physics', chapterId: '12', topicId: 'sound' };
function dom(html, path) {
  const result = parseHTML(html);
  Object.defineProperty(result.document, 'URL', { value: `https://school.test/learning-hub/${path}` });
  result.window.HTMLElement.prototype.focus = function () {};
  result.window.HTMLElement.prototype.blur = function () {};
  result.window.HTMLElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800 });
  return result;
}
function harness() {
  const { document, window: domWindow } = dom('<html><body><main id="layer"></main><nav id="bar"><div id="items"></div><output id="count"></output></nav></body></html>', 'index.html');
  const events = {}, transports = [];
  let language = 'th';
  const window = { addEventListener: (name, fn) => { events[name] = fn; }, setInterval() {} };
  const location = new URL(document.URL);
  const vmContext = vm.createContext({ document, window, location, URL, Intl, Date, console,
    createContentTool, createHubContextMessage, videoLinkEntry, htmlLinkEntry, pdfLinkEntry, applyContentLanguage, createLearningGuide,
    toolCatalog: {}, requestAnimationFrame: fn => fn(),
    renderHtmlMath: async () => {}, attachLearningSheet: async () => null,
    createBankTool, createTopicReviewTool, bankKeyPattern, openHtmlPrint() {} });
  vm.runInContext(code + '\nglobalThis.makeWorkspace=createWorkspace;', vmContext);
  const workspace = vmContext.makeWorkspace({
    windowLayer: document.getElementById('layer'), taskbar: document.getElementById('bar'),
    taskbarItems: document.getElementById('items'), countElement: document.getElementById('count'),
    getLanguage: () => language, getIdentity: () => ({ status: 'guest', isGuest: true, uid: null }), getRole: () => 'student',
  });
  workspace.bindHtmlLinks(document);
  function load(frame, child, quiz = null) {
    const sent = [];
    Object.defineProperty(frame, 'contentDocument', { configurable: true, value: child.document });
    Object.defineProperty(frame, 'contentWindow', { configurable: true, value: { postMessage: (...args) => sent.push(args), LearningHubQuiz: quiz } });
    frame.dispatchEvent(new domWindow.Event('load')); transports.push(sent); return sent;
  }
  return { document, workspace, domWindow, load, message: event => events.message(event),
    language(value) { language = value; workspace.setLanguage(); } };
}
const videoButton = `<a data-hub-video data-content-id="sound-video" href="${url}" data-subject-id="physics" data-chapter-id="12" data-topic-id="sound">Video</a>`;

test('a top-level video button reuses one window, pauses on minimize/menu, and closes cleanly', () => {
  const h = harness(); h.document.body.insertAdjacentHTML('afterbegin', videoButton);
  h.document.querySelector('[data-hub-video]').click();
  const frame = h.document.querySelector('.workspace-tool-frame');
  assert.ok(frame.getAttribute('allow').includes('fullscreen'));
  const child = dom('<html lang="th"><body><h1 data-th="วิดีโอ" data-en="Video">วิดีโอ</h1></body></html>', 'pages/tools/video-player.html');
  const sent = h.load(frame, child);
  assert.equal(sent.some(([message]) => message.type === 'learning-hub-context'), false);
  h.document.querySelector('.is-minimize').click();
  assert.equal(sent.at(-1)[0].visible, false);
  h.document.querySelector('[data-hub-video]').click();
  assert.equal(h.document.querySelectorAll('.workspace-tool-frame').length, 1);
  assert.equal(sent.at(-1)[0].visible, true);
  const initial = frame.getAttribute('src'); h.language('en');
  assert.equal(frame.getAttribute('src'), initial);
  assert.equal(child.document.querySelector('h1').textContent, 'Video');
  h.workspace.showMenu(); assert.equal(sent.at(-1)[0].visible, false);
  h.document.querySelector('.taskbar-item').click();
  h.document.querySelector('.is-close').click();
  assert.equal(h.document.querySelectorAll('.workspace-tool-frame').length, 0);
});

test('Quiz review pairs the original Quiz with one reused reader and passes the current exam section', () => {
  const h = harness(), bankKey = 'b-' + 'a'.repeat(24), topic = 'b-' + 'b'.repeat(24);
  h.workspace.openBank({ subjectId: 'chemistry', bankKey });
  const quiz = h.document.querySelector('iframe'), quizWindow = quiz.closest('.workspace-window');
  const contentId = 'bank-chemistry-' + bankKey;
  const api = { getState: () => ({ contentId, currentQuestionId: 'q3', currentIndex: 2 }) };
  const sent = h.load(quiz, dom('<html><body><textarea>Keep my working</textarea></body></html>', 'pages/tools/quiz-player.html'), api);
  const request = { type: 'learning-hub-quiz-review-request', requestId: 1, contentId, questionNumber: 3, topicIds: [topic, topic, 'https://untrusted.test'] };
  h.message({ source: quiz.contentWindow, origin: 'https://school.test', data: request });
  const reader = h.document.querySelector('[data-tool-id="topic-review-library"]'), frame = reader?.querySelector('iframe');
  assert.ok(reader); assert.equal(quizWindow.dataset.windowSnap, 'left'); assert.equal(reader.dataset.windowSnap, 'right');
  assert.equal(quiz.isConnected, true); assert.equal(quiz.contentDocument.querySelector('textarea').textContent, 'Keep my working');
  assert.equal(sent.at(-1)[0].opened, true);
  const reviewSent = h.load(frame, dom('<html><body>Review</body></html>', 'pages/tools/topic-review-player.html'));
  h.message({ source: frame.contentWindow, origin: 'https://school.test', data: { type: 'learning-hub-review-ready' } });
  const command = reviewSent.at(-1)[0];
  assert.deepEqual(JSON.parse(JSON.stringify(command.quizContext)), { bankKey, questionNumber: 3, requestId: 1 });
  assert.deepEqual([...command.preferred], [topic]); assert.equal('identity' in command, false);
  // A second click restores the same reader and keeps the Quiz frame and draft.
  quizWindow.dispatchEvent(new h.domWindow.Event('pointerdown'));
  h.message({ source: quiz.contentWindow, origin: 'https://school.test', data: { ...request, requestId: 2 } });
  assert.equal(h.document.querySelectorAll('iframe').length, 2); assert.equal(reader.querySelector('iframe'), frame);
  assert.equal(quizWindow.dataset.windowSnap, 'left'); assert.equal(reader.dataset.windowSnap, 'right');
});

test('stale, inactive, mismatched and unregistered Quiz messages cannot rearrange the workspace', () => {
  const h = harness(), bankKey = 'b-' + 'c'.repeat(24);
  h.workspace.openBank({ subjectId: 'physics', bankKey });
  const quiz = h.document.querySelector('iframe'), contentId = 'bank-physics-' + bankKey;
  h.load(quiz, dom('<html><body>Quiz</body></html>', 'pages/tools/quiz-player.html'),
    { getState: () => ({ contentId, currentQuestionId: 'q1', currentIndex: 0 }) });
  const event = { source: quiz.contentWindow, origin: 'https://school.test', data: {
    type: 'learning-hub-quiz-review-request', requestId: 1, contentId, questionNumber: 1 } };
  for (const bad of [{ ...event, source: {} }, { ...event, origin: 'https://other.test' },
    { ...event, data: { ...event.data, contentId: 'other-quiz' } }, { ...event, data: { ...event.data, questionNumber: 2 } },
    { ...event, data: { ...event.data, requestId: '1' } }]) h.message(bad);
  assert.equal(h.document.querySelectorAll('iframe').length, 1);
  h.document.querySelector('.is-minimize').click(); h.message(event);
  assert.equal(h.document.querySelectorAll('iframe').length, 1);
  h.workspace.openBank({ subjectId: 'physics', bankKey }); h.message(event);
  const reader = h.document.querySelector('[data-tool-id="topic-review-library"]');
  assert.ok(reader);
  h.document.querySelector('.workspace-window').dispatchEvent(new h.domWindow.Event('pointerdown'));
  reader.querySelector('.is-minimize').click(); h.message(event);
  assert.equal(reader.hidden, true, 'Duplicate request cannot restore the minimized reader');
});

test('nested reading, Quiz and Simulation buttons open the shared player without removing their source', () => {
  for (const toolKind of ['html', 'quiz', 'simulation']) {
    const h = harness();
    assert.equal(h.workspace.openContent({ ...context, toolKind, contentId: `${toolKind}-source`,
      source: `https://school.test/learning-hub/content/p/${toolKind}.html`, titleTh: 'ต้นทาง', titleEn: 'Source' }), true);
    const frame = h.document.querySelector('.workspace-tool-frame');
    if (toolKind === 'html') assert.equal(frame.getAttribute('sandbox'), 'allow-same-origin');
    const child = dom(`<html><body><input value="keep my draft">${videoButton}</body></html>`, `content/p/${toolKind}.html`);
    h.load(frame, child); child.document.querySelector('[data-hub-video]').click();
    assert.equal(h.document.querySelectorAll('.workspace-tool-frame').length, 2);
    assert.equal(child.document.querySelector('input').getAttribute('value'), 'keep my draft');
    const video = h.document.querySelector('[data-tool-id="content-video-sound-video"]');
    video.querySelector('.is-close').click();
    assert.equal(frame.isConnected, true);
    assert.equal(h.document.querySelectorAll('.workspace-tool-frame').length, 1);
  }
});

test('unfinished and conflicting links cannot open blank windows or replace an existing clip', () => {
  const h = harness();
  h.document.body.insertAdjacentHTML('afterbegin', '<button data-hub-video data-content-id="later-video" data-video-src="">Later</button>');
  h.document.querySelector('[data-hub-video]').click();
  assert.equal(h.document.querySelectorAll('.workspace-tool-frame').length, 0);
  assert.match(h.document.querySelector('[data-html-link-error]').textContent, /กำลังเตรียม/);
  const entry = { ...context, toolKind: 'video', contentId: 'sound-video', source: h.document.URL, videoSource: url };
  assert.equal(h.workspace.openContent(entry), true);
  assert.equal(h.workspace.openContent({ ...entry, videoSource: 'https://youtu.be/dQw4w9WgXcQ' }), false);
  assert.equal(h.document.querySelectorAll('.workspace-tool-frame').length, 1);
});
