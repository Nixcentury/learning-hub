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
import { createTopicReviewTool, reviewSelection } from '../js/topic-review-tools.js';
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
function harness(initialIdentity = { status: 'guest', isGuest: true, uid: null }) {
  const { document, window: domWindow } = dom('<html><body><main id="layer"></main><nav id="bar"><div id="items"></div><output id="count"></output></nav></body></html>', 'index.html');
  const events = {}, transports = [];
  let language = 'th', identity = initialIdentity;
  const activated = [];
  const window = { addEventListener: (name, fn) => { events[name] = fn; }, setInterval() {} };
  const location = new URL(document.URL);
  const vmContext = vm.createContext({ document, window, location, URL, Intl, Date, console,
    createContentTool, createHubContextMessage, videoLinkEntry, htmlLinkEntry, pdfLinkEntry, applyContentLanguage, createLearningGuide,
    toolCatalog: {}, requestAnimationFrame: fn => fn(),
    renderHtmlMath: async () => {}, attachLearningSheet: async () => null,
    createBankTool, createTopicReviewTool, reviewSelection, bankKeyPattern, openHtmlPrint() {} });
  vm.runInContext(code + '\nglobalThis.makeWorkspace=createWorkspace;', vmContext);
  const workspace = vmContext.makeWorkspace({
    windowLayer: document.getElementById('layer'), taskbar: document.getElementById('bar'),
    taskbarItems: document.getElementById('items'), countElement: document.getElementById('count'),
    getLanguage: () => language, getIdentity: () => identity, getRole: () => 'student',
    onToolActivated: tool => activated.push(tool),
  });
  workspace.bindHtmlLinks(document);
  function load(frame, child, quiz = null) {
    const sent = [];
    Object.defineProperty(frame, 'contentDocument', { configurable: true, value: child.document });
    Object.defineProperty(frame, 'contentWindow', { configurable: true, value: { postMessage: (...args) => sent.push(args), LearningHubQuiz: quiz } });
    frame.dispatchEvent(new domWindow.Event('load')); transports.push(sent); return sent;
  }
  return { document, workspace, domWindow, load, activated, setIdentity(value) { identity = value; }, message: event => events.message(event),
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

test('Classroom review pairs the correct bank section and returns to that exact assignment with folds and work retained', () => {
  const h=harness({status:'signed-in',uid:'student'}), bankKey='b-'+'e'.repeat(24);
  const homework={uid:'student',roomId:'room-a',id:'assignment-a',contentId:`bank-chemistry-${bankKey}`,title:'Homework',reviewSource:{subjectId:'chemistry',bankKey}};
  h.workspace.openHomework(homework);
  const quiz=h.document.querySelector('iframe'), owner=quiz.closest('.workspace-window'), returned=[];
  const api={getState:()=>({contentId:homework.contentId,currentQuestionId:'q3',currentIndex:2}),returnToQuestion:index=>{returned.push(index);return true;}};
  h.load(quiz,dom('<html><body><textarea>My assignment working</textarea></body></html>','pages/tools/quiz-player.html'),api);
  owner.querySelector('.window-toolbar-toggle').click();
  h.message({source:quiz.contentWindow,origin:'https://school.test',data:{type:'learning-hub-quiz-review-request',requestId:1,contentId:homework.contentId,questionNumber:3}});
  const reader=h.document.querySelector('[data-tool-id="topic-review-library"]'), frame=reader.querySelector('iframe');
  assert.equal(owner.dataset.windowSnap,'left');assert.equal(reader.dataset.windowSnap,'right');
  assert.equal(h.activated.at(-1).reviewHomeworkId,owner.dataset.toolId,'App retains the Classroom route on reader focus');
  const sent=h.load(frame,dom('<html><body>Reading</body></html>','pages/tools/topic-review-player.html'));
  h.message({source:frame.contentWindow,origin:'https://school.test',data:{type:'learning-hub-review-ready'}});
  const command=sent.at(-1)[0];
  assert.equal(command.selection.subjectId,'chemistry');assert.equal(command.quizContext.questionNumber,3);assert.equal(command.returnToHomework,true);
  assert.equal(command.selection.bankKey,bankKey);
  for(const secret of ['identity','homework','uid','roomId','answers'])assert.equal(secret in command,false);
  const practice={source:frame.contentWindow,origin:'https://school.test',data:{type:'learning-hub-review-practice',commandId:command.commandId,selection:command.selection,questionNumber:3}};
  h.message(practice);
  assert.deepEqual(returned,[2]);assert.equal(h.document.querySelectorAll('iframe').length,2);
  assert.equal(owner.classList.contains('is-active'),true);assert.equal(owner.classList.contains('is-toolbar-collapsed'),true);
  assert.equal(quiz.contentDocument.querySelector('textarea').textContent,'My assignment working');
  // Opening the same bank in another assignment must not steal this reader's return.
  h.workspace.openHomework({...homework,id:'assignment-b'});
  reader.dispatchEvent(new h.domWindow.Event('pointerdown'));h.message(practice);
  assert.equal(owner.classList.contains('is-active'),true);assert.deepEqual(returned,[2,2]);
  // Browsing another topic retains ownership, including a language change.
  reader.dispatchEvent(new h.domWindow.Event('pointerdown'));
  h.message({source:frame.contentWindow,origin:'https://school.test',data:{type:'learning-hub-review-selection',commandId:command.commandId,selection:{subjectId:'physics',bankKey:null}}});
  assert.equal(h.activated.at(-1).reviewHomeworkId,owner.dataset.toolId);
  h.language('en');const after=sent.at(-1)[0];assert.equal(after.returnToHomework,true);
  h.message({source:frame.contentWindow,origin:'https://school.test',data:{type:'learning-hub-review-back',commandId:after.commandId}});
  assert.equal(owner.classList.contains('is-active'),true);
});

test('homework reader cannot restore an assignment under another account or without a verified review source', () => {
  const h=harness({status:'signed-in',uid:'student'}), bankKey='b-'+'f'.repeat(24);
  const binding={uid:'student',roomId:'room-a',id:'assignment-a',contentId:'sample-quiz',title:'Homework'};
  h.workspace.openHomework(binding);const quiz=h.document.querySelector('iframe');
  h.load(quiz,dom('<html><body>Quiz</body></html>','pages/tools/quiz-player.html'),{getState:()=>({contentId:'sample-quiz',currentQuestionId:'q1',currentIndex:0})});
  const request={type:'learning-hub-quiz-review-request',requestId:1,contentId:'sample-quiz',questionNumber:1};
  h.message({source:quiz.contentWindow,origin:'https://school.test',data:request});
  assert.equal(h.document.querySelectorAll('iframe').length,1);
  assert.equal(h.workspace.openReview({subjectId:'chemistry',bankKey},{homeworkId:quiz.closest('.workspace-window').dataset.toolId}),true);
  const reader=h.document.querySelector('[data-tool-id="topic-review-library"]'), frame=reader.querySelector('iframe');
  const sent=h.load(frame,dom('<html><body>Reading</body></html>','pages/tools/topic-review-player.html'));
  h.message({source:frame.contentWindow,origin:'https://school.test',data:{type:'learning-hub-review-ready'}});
  h.setIdentity({status:'signed-in',uid:'other-student'});
  h.message({source:frame.contentWindow,origin:'https://school.test',data:{type:'learning-hub-review-back',commandId:sent.at(-1)[0].commandId}});
  assert.equal(reader.classList.contains('is-active'),true);
  assert.equal(h.document.querySelectorAll('iframe').length,2);
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

test('each window folds its own tools without reloading content, then restores them after language changes', () => {
  const h = harness();
  for (const id of ['first', 'second']) h.workspace.openContent({ ...context, toolKind: 'simulation', contentId: id,
    source: `https://school.test/learning-hub/content/p/${id}.html`, titleTh: id, titleEn: id });
  const [first, second] = [...h.document.querySelectorAll('.workspace-window')];
  const frame = first.querySelector('iframe');
  h.load(frame, dom('<html><body><input value="keep my experiment"></body></html>', 'content/p/first.html'));
  const toggle = first.querySelector('.window-toolbar-toggle'), tools = first.querySelector('.window-trailing-tools');
  toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'false'); assert.equal(tools.hidden, true);
  assert.equal(first.classList.contains('is-toolbar-collapsed'), true);
  assert.equal(second.querySelector('.window-trailing-tools').hidden, false);
  assert.equal(frame, first.querySelector('iframe')); assert.equal(frame.contentDocument.querySelector('input').getAttribute('value'), 'keep my experiment');
  first.querySelector('.is-minimize').click(); h.workspace.openContent({ ...context, toolKind: 'simulation', contentId: 'first',
    source: 'https://school.test/learning-hub/content/p/first.html', titleTh: 'first', titleEn: 'first' });
  h.language('en'); assert.equal(tools.hidden, true); assert.equal(toggle.getAttribute('aria-label'), 'Show window tools');
  toggle.click(); assert.equal(tools.hidden, false); assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(first.querySelector('iframe'), frame);
});
