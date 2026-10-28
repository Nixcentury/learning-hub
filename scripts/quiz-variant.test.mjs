import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { parseHTML, DOMParser } from 'linkedom';
import { captureVariantSource, extractVariantHtml, parseVariantHtml, variantReference,
  variantTemplate, variantStart, variantEnd, isTemporaryQuizMessage, receiveTemporaryQuiz } from '../public/shared/quiz-variant-model.js';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { createCompanionClient } from '../js/companion-model.js';

const { document } = parseHTML('<html><body></body></html>');
const options = { document, Parser: DOMParser };
const choice = `<div class="question-step" data-ans="B"><h3>Find \\(F=ma\\) for 2 kg and 3 m/s².</h3>
<div class="options"><label><input type="radio" value="A">5 N</label><label><input type="radio" value="B">6 N</label></div>
<div class="hint-box">Multiply mass and acceleration.</div><div class="feedback-box">F = 2 × 3 = 6 N.</div></div>`;
const marked = html => `${variantStart}\n${html}\n${variantEnd}`;

test('one marked AI question becomes a central engine choice with its explanation', () => {
  const root = parseVariantHtml(extractVariantHtml(marked(choice)), options);
  const { errors, questions } = readQuizContent(root);
  assert.deepEqual(errors, []);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].answer, 'b');
  assert.equal(root.dataset.activityId, 'ai-temporary');
  assert.match(questions[0].solution.textContent, /2 × 3/);
  assert.match(questions[0].prompt.textContent, /\\\(F=ma/);
});

test('numeric variants preserve units and tolerance and reject invalid keys', () => {
  const numeric = `<div class="question-step" data-type="fill-in" data-ans="6" data-tolerance="0.1" data-unit-th="N"><h3>Calculate the force.</h3><div class="answer-section"><input class="num-answer" type="number"></div><div class="feedback-box">2 × 3 = 6 N.</div></div>`;
  const { questions } = readQuizContent(parseVariantHtml(numeric, options));
  assert.equal(questions[0].type, 'number'); assert.equal(questions[0].tolerance, 0.1); assert.equal(questions[0].unit.th, 'N');
  for (const html of [numeric.replace('data-ans="6"', 'data-ans="nan"'), choice.replace('data-ans="B"', 'data-ans="Z"'), choice + choice,
    choice.replace('<div class="feedback-box">F = 2 × 3 = 6 N.</div>', '')]) assert.throws(() => parseVariantHtml(html, options));
});

test('AI prose stays text and partial or repeated HTML markers never open a quiz', () => {
  assert.equal(extractVariantHtml('Would you like easier or harder practice?'), null);
  for (const reply of [variantStart + choice, choice, marked(choice) + marked(choice), variantEnd + variantStart]) assert.throws(() => extractVariantHtml(reply));
});

test('untrusted output cannot execute scripts, load external content or attach active SVG', () => {
  for (const attack of ['<script>alert(1)</script>', '<img src="https://example.test/private">', '<iframe srcdoc="hi"></iframe>',
    '<svg viewBox="0 0 10 10"><foreignObject>bad</foreignObject></svg>', '<p onclick="alert(1)">bad</p>', '<p style="color:red">bad</p>',
    '<svg viewBox="0 0 10 10"><use href="https://example.test/image"></use></svg>']) {
    assert.throws(() => parseVariantHtml(choice.replace('<h3>', attack + '<h3>'), options));
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M0 0 L20 20" stroke="black"/></svg>';
  assert.match(parseVariantHtml(choice.replace('</h3>', '</h3>' + svg), options).querySelector('img').src, /^data:image\/svg\+xml/);
});

test('capture retains full context tables, raw TeX and SVG while excluding student work and identity', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><text x="2" y="10">A</text></svg>';
  const root = parseVariantHtml(choice.replace('</h3>', `</h3><table><tr><td>mass</td><td>2</td></tr></table>${svg}`), options);
  const question = readQuizContent(root).questions[0];
  const note = document.createElement('textarea'); note.value = 'PRIVATE-STUDENT-WORK'; question.element.append(note);
  const source = captureVariantSource(question, { title: 'Forces', language: 'th', uid: 'PRIVATE-UID' });
  assert.match(source.content, /<table>/); assert.match(source.content, /viewBox/); assert.match(source.content, /&lt;svg/);
  assert.match(source.content, /\\\(F=ma/); assert.match(source.content, /REFERENCE ANSWER\nb/);
  assert.doesNotMatch(JSON.stringify(source), /PRIVATE|data-question-id|data-bank-svg/);
  assert.equal(source.hasImages, false, 'Decoded static SVG is supplied as readable code');
  assert.match(variantReference(source), /learning-hub-practice:start/);
});

test('image-only references are identified honestly and oversized sources are never truncated', () => {
  const root = parseVariantHtml(choice, options), question = readQuizContent(root).questions[0];
  question.context = document.createElement('div'); question.context.innerHTML = '<img src="https://example.test/diagram.png" alt="unseen graph">';
  const source = captureVariantSource(question); assert.equal(source.hasImages, true);
  assert.match(variantReference(source), /NOT image pixels/);
  question.context.textContent = 'x'.repeat(12000); assert.throws(() => captureVariantSource(question), /source-too-large/);
});

test('pinned source survives long chat histories without changing the Worker request contract', async () => {
  let sent;
  const reference = 'SOURCE-BEGIN' + 'r'.repeat(13000) + 'SOURCE-END';
  const client = createCompanionClient({ endpoint: 'https://example.test', fetcher: async (_, init) => {
    sent = JSON.parse(init.body); return new Response('{"reply":"OK"}');
  } });
  await client.ask({ message: 'Generate practice', reference,
    history: Array.from({ length: 12 }, () => ({ role: 'assistant', content: 'h'.repeat(6000) })) });
  assert.deepEqual(Object.keys(sent).sort(), ['conversation', 'mode', 'userMessage']);
  assert.equal(sent.conversation[0].text, reference);
  assert.ok(sent.conversation.reduce((sum, item) => sum + item.text.length, 0) <= 18000);
  await assert.rejects(client.ask({ message: 'Generate practice', reference: 'r'.repeat(16001) }), { code: 'invalid-reference' });
});

test('temporary messages require the exact parent and origin', () => {
  const parent = {}, origin = 'https://school.test';
  const event = { source: parent, origin, data: { type: 'learning-hub-temporary-quiz-content', html: choice } };
  assert.equal(isTemporaryQuizMessage(event, parent, origin), true);
  assert.equal(isTemporaryQuizMessage({ ...event, source: {} }, parent, origin), false);
  assert.equal(isTemporaryQuizMessage({ ...event, origin: 'https://other.test' }, parent, origin), false);
  assert.equal(isTemporaryQuizMessage({ ...event, origin: 'null' }, parent, 'null'), false);
});

test('a standalone temporary player cannot fetch default content and handshakes time out cleanly', async () => {
  const standalone = { location: { origin: 'https://school.test' } }; standalone.parent = standalone;
  await assert.rejects(receiveTemporaryQuiz({ window: standalone }), /temporary-parent-required/);
  let removed = false, ready;
  const frame = { parent: { postMessage: message => { ready = message; } }, location: { origin: 'https://school.test' },
    addEventListener() {}, removeEventListener() { removed = true; } };
  await assert.rejects(receiveTemporaryQuiz({ window: frame, timeoutMs: 2 }), /temporary-content-timeout/);
  assert.equal(ready.type, 'learning-hub-temporary-quiz-ready'); assert.equal(removed, true);
});

test('the public authoring template matches the template sent to AI', async () => {
  assert.equal((await readFile(new URL('../public/content/templates/ai-quiz-variant-template.txt', import.meta.url), 'utf8')).trim(), variantTemplate);
});
