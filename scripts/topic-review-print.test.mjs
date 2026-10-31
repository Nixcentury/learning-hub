import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const source = fs.readFileSync(new URL('../public/shared/print-core.js', import.meta.url), 'utf8');

function setup(language = 'th') {
  const { document } = parseHTML(`<!doctype html><html lang="${language}"><head><title>Saved quiz</title></head><body>
    <article id="quiz"><div data-question data-question-id="q1"><p data-question-prompt>Quiz question</p><input value="draft answer"></div></article>
    <div id="review"><h2 data-th="อนุภาคในอะตอม" data-en="Subatomic particles">อนุภาคในอะตอม</h2>
      <p>\\(p=Z\\)</p><table><tr><td>Recall question</td><td>________</td></tr></table>
      <p data-content-lang="th">ข้อความไทย</p><p data-content-lang="en">English text</p>
      <p hidden>Hidden answer</p><button>Screen control</button></div>
    </body></html>`);
  const handlers = {}, printed = [], alerts = [];
  const window = {
    addEventListener(name, handler) { handlers[name] = handler; },
    print() {
      handlers.beforeprint();
      printed.push({ mode:document.body.dataset.printMode, title:document.title,
        html:document.querySelector('[data-print-host]').innerHTML });
      handlers.afterprint();
    },
    alert(message) { alerts.push(message); },
    MathJax: { typesetPromise:async () => {}, typesetClear:() => {} },
  };
  window.document = document; window.parent = window;
  Object.defineProperty(document, 'currentScript', { value: { src: 'https://school.test/learning-hub/shared/print-core.js' } });
  const context = vm.createContext({ window, document, Intl, Date, URL, URLSearchParams, TextEncoder, AbortController, setTimeout, clearTimeout,
    location: { href: 'https://school.test/learning-hub/pages/tools/quiz-player.html', search: '', origin: 'https://school.test' }, parent: window,
    fetch: async () => ({ ok: true, json: async () => ({ routes: [] }) }) });
  vm.runInContext(fs.readFileSync(new URL('../public/shared/print-names.js', import.meta.url), 'utf8'), context);
  window.LearningHubPrintNames = context.LearningHubPrintNames;
  vm.runInContext(source, context);
  const api = window.LearningHubPrint;
  api.configure({ getContent:() => document.querySelector('#quiz'), getTitle:() => 'Saved quiz' });
  return {api, window, document, printed, alerts};
}

test('review printing keeps quiz drafts and selected questions intact and restores after printing', async () => {
  const {api, document, printed} = setup();
  const quiz = document.querySelector('#quiz').outerHTML;
  const review = document.querySelector('#review').outerHTML;
  const selected = [...api.getSelectedQuestionIds()];
  assert.equal(await api.printReview({content:document.querySelector('#review'),title:'ทวนเนื้อหา'}), true);
  assert.equal(printed.length, 1);
  assert.equal(printed[0].mode, 'topic-review');
  assert.match(printed[0].html, /Recall question/);
  assert.match(printed[0].html, /\\\(p=Z\\\)/);
  assert.doesNotMatch(printed[0].html, /Quiz question|draft answer|Hidden answer|Screen control|English text/);
  assert.equal(document.querySelector('#quiz').outerHTML, quiz);
  assert.equal(document.querySelector('#review').outerHTML, review);
  assert.deepEqual([...api.getSelectedQuestionIds()], selected);
  assert.equal(document.title, 'Saved quiz');
  assert.equal(document.body.dataset.printMode, undefined);
  assert.equal(document.querySelector('[data-print-host]').childNodes.length, 0);
});

test('English review printing includes the selected translation and paper table', async () => {
  const {api, document, printed} = setup('en');
  await api.printReview({content:document.querySelector('#review'),title:'Topic review'});
  assert.match(printed[0].html, /Subatomic particles/);
  assert.match(printed[0].html, /English text/);
  assert.match(printed[0].html, /<table>/);
  assert.doesNotMatch(printed[0].html, /ข้อความไทย/);
});

test('printing follows each answer state, keeps student space when hidden, and omits toggle buttons', async () => {
  const {api, document, printed} = setup();
  const content = document.querySelector('#review');
  content.innerHTML = `<section><h3>Recall A</h3><button>Show answer</button>
    <div data-review-blank>STUDENT SPACE A</div><div data-review-answer hidden>ANSWER A \\(N_e=Z-q\\)</div></section>
    <section><h3>Recall B</h3><button>Show answer</button>
    <div data-review-blank>STUDENT SPACE B</div><div data-review-answer hidden>ANSWER B</div></section>`;
  await api.printReview({content});
  assert.match(printed[0].html,/STUDENT SPACE A/);
  assert.match(printed[0].html,/STUDENT SPACE B/);
  assert.doesNotMatch(printed[0].html,/ANSWER A|ANSWER B|<button/);
  const answers = content.querySelectorAll('[data-review-answer]');
  const blanks = content.querySelectorAll('[data-review-blank]');
  answers[0].hidden = false; blanks[0].hidden = true;
  await api.printReview({content});
  assert.match(printed[1].html,/ANSWER A/);
  assert.match(printed[1].html,/STUDENT SPACE B/);
  assert.doesNotMatch(printed[1].html,/STUDENT SPACE A|ANSWER B|<button/);
  assert.equal(answers[0].hidden,false);
  assert.equal(answers[1].hidden,true);
  answers[1].hidden = false; blanks[1].hidden = true;
  await api.printReview({content});
  assert.match(printed[2].html,/ANSWER A/);
  assert.match(printed[2].html,/ANSWER B/);
  assert.doesNotMatch(printed[2].html,/STUDENT SPACE|<button/);
});

test('a failed math preparation restores the screen and allows a later print', async () => {
  const {api, window, document, printed, alerts} = setup();
  window.MathJax.typesetPromise = async () => { throw Error('Math unavailable'); };
  assert.equal(await api.printReview({content:document.querySelector('#review')}), false);
  assert.equal(printed.length, 0);
  assert.equal(alerts.length, 1);
  assert.equal(document.body.dataset.printMode, undefined);
  assert.equal(document.title, 'Saved quiz');
  window.MathJax.typesetPromise = async () => {};
  assert.equal(await api.printReview({content:document.querySelector('#review')}), true);
  assert.equal(printed.length, 1);
});

test('closing the review during resource preparation cancels the deferred print', async () => {
  const {api, window, document, printed} = setup();
  const dialog = document.createElement('dialog');
  dialog.open = true;
  const content = document.querySelector('#review');
  dialog.append(content); document.body.append(dialog);
  let finish;
  window.MathJax.typesetPromise = () => new Promise(resolve => { finish = resolve; });
  const pending = api.printReview({content});
  for (let i = 0; !finish && i < 20; i++) await Promise.resolve();
  dialog.open = false;
  finish();
  assert.equal(await pending, false);
  assert.equal(printed.length, 0);
  assert.equal(document.body.dataset.printMode, undefined);
  assert.equal(document.title, 'Saved quiz');
});

test('per-exam printing includes only visible exam sections and retains independent answer states', async () => {
  const {api,document,printed}=setup(); const content=document.querySelector('#review');
  content.innerHTML='<section data-review-exam-question="1"><h2>EXAM ONE</h2><div data-review-blank>SPACE ONE</div><div data-review-answer hidden>ANSWER ONE</div><button data-no-print>RETURN ONE</button></section><section data-review-exam-question="2" hidden><h2>EXAM TWO</h2><div data-review-blank hidden>SPACE TWO</div><div data-review-answer>ANSWER TWO</div><button data-no-print>RETURN TWO</button></section>';
  const sections=content.querySelectorAll('[data-review-exam-question]');
  await api.printReview({content}); assert.match(printed[0].html,/EXAM ONE/); assert.match(printed[0].html,/SPACE ONE/);
  assert.doesNotMatch(printed[0].html,/EXAM TWO|ANSWER ONE|ANSWER TWO|RETURN/);
  sections[0].hidden=true; sections[1].hidden=false;
  await api.printReview({content}); assert.match(printed[1].html,/EXAM TWO/); assert.match(printed[1].html,/ANSWER TWO/);
  assert.doesNotMatch(printed[1].html,/EXAM ONE|SPACE TWO|RETURN/);
  sections[0].hidden=false;
  await api.printReview({content}); assert.match(printed[2].html,/EXAM ONE/); assert.match(printed[2].html,/EXAM TWO/);
  assert.match(printed[2].html,/SPACE ONE/); assert.match(printed[2].html,/ANSWER TWO/);
  assert.doesNotMatch(printed[2].html,/ANSWER ONE|SPACE TWO|RETURN/);
});
