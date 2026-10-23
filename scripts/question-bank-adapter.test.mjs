import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, parseHTML } from 'linkedom';
import { adaptLegacyBank } from '../public/shared/question-bank-adapter.js';
import { bankQuestionId } from '../public/shared/question-bank-model.js';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { isCorrectAnswer, isStoredAnswer } from '../public/shared/quiz-question-model.js';

const key = 'b-' + 'a'.repeat(24);
const choice = `<div class="question-step" data-ans="B"><h3>เลือกคำตอบ</h3><div class="options">
<label><input type="radio" value="A">หนึ่ง</label><label><input type="radio" value="B">สอง</label></div></div>`;
const numeric = (answer = '50', attributes = '') => `<div class="question-step" data-type="fill-in" data-ans="${answer}" ${attributes}>
<h3>ตอนที่ลูกอายุ 1 ปี พ่อและแม่มีอายุรวมกันกี่ปี</h3>
<div class="answer-section" style="margin:20px"><label for="q1-new-input">ระบุคำตอบ:</label>
<input type="number" id="q1-new-input" class="num-answer" placeholder="กรอกตัวเลขคำตอบที่นี่"></div>
<div class="hint-box">คำใบ้: อายุรวมเพิ่มปีละ 2 ปี</div>
<div class="feedback-box">เฉลย: ${answer}</div><p>ที่มา: ตัวอย่าง</p></div>`;
function adapt(rows, subjectId = 'chemistry') {
  const { document } = parseHTML('<!doctype html><html><body></body></html>');
  return adaptLegacyBank({ subjectId, bankKey: key, revision: 'a'.repeat(64), title: 'ทดสอบ',
    rows: rows.map((html, i) => ({ rowNumber: 32 + i, html })) }, { document, Parser: DOMParser });
}

test('legacy numeric template becomes a shared number question without duplicate controls or labels', () => {
  const root = adapt([numeric('50', 'data-unit-th="ปี" data-unit-en="years"')]);
  const { errors, questions: [q] } = readQuizContent(root);
  assert.deepEqual(errors, []);
  assert.equal(q.type, 'number');
  assert.equal(q.answer, '50');
  assert.equal(q.tolerance, 0);
  assert.deepEqual(q.unit, { th: 'ปี', en: 'years' });
  assert.equal(q.id, bankQuestionId('chemistry', key, 1));
  assert.equal(root.querySelectorAll('input, label, [data-choice-id], .answer-section').length, 0);
  assert.doesNotMatch(q.context.textContent, /ระบุคำตอบ|คำใบ้|เฉลย/);
  assert.match(q.context.textContent, /ที่มา: ตัวอย่าง/);
  assert.match(q.hints[0].textContent, /อายุรวม/);
  assert.match(q.solution.textContent, /เฉลย: 50/);
  assert.ok(isCorrectAnswer(q, '50'));
  assert.ok(isCorrectAnswer(q, '50.00'));
  assert.ok(!isCorrectAnswer(q, '49.99'));
  assert.ok(isStoredAnswer(q, '-'));
});

test('mixed choice and numeric questions preserve source order and existing set-scoped IDs', () => {
  for (const subject of ['physics', 'chemistry']) {
    const { errors, questions } = readQuizContent(adapt([choice + numeric('715'), numeric('6.70') + choice], subject));
    assert.deepEqual(errors, []);
    assert.deepEqual(questions.map(q => q.type), ['choice', 'number', 'number', 'choice']);
    assert.deepEqual(questions.map(q => q.id), [1, 2, 3, 4].map(i => bankQuestionId(subject, key, i)));
    assert.deepEqual(questions.map(q => q.answer), ['b', '715', '6.70', 'b']);
    assert.ok(isCorrectAnswer(questions[0], 'b'));
    assert.ok(!isCorrectAnswer(questions[0], 'a'));
    assert.ok(isCorrectAnswer(questions[2], '6.7'));
    assert.ok(!isCorrectAnswer(questions[2], '6.71'));
  }
});

test('numeric keys and explicit tolerance use the existing bounded numeric grammar', () => {
  for (const [expected, response] of [['0', '0.00'], ['-2', '-2'], ['5/6', String.raw`\frac56`], ['0715.00', '715']]) {
    const q = readQuizContent(adapt([numeric(expected)])).questions[0];
    assert.ok(isCorrectAnswer(q, response));
    assert.ok(!isCorrectAnswer(q, ''));
  }
  const q = readQuizContent(adapt([numeric('6.7', 'data-tolerance="0.01"')])).questions[0];
  assert.ok(isCorrectAnswer(q, '6.71'));
  assert.ok(!isCorrectAnswer(q, '6.72'));
});

test('numeric tables, images and MathJax survive while executable HTML and legacy values are discarded', () => {
  const math = String.raw`\(K_a=\frac{x^2}{C-x}\)`;
  const html = numeric().replace('</h3>', `${math}</h3><table><tr><td colspan="2">ข้อมูล</td></tr></table>
    <img src="https://example.org/energy.png" alt="ตารางพลังงาน" onerror="bad()">`)
    .replace('<h3>', '<h3><script>bad()</script><span onclick="bad()" style="color:red" data-answer="wrong">โจทย์</span>')
    .replace('class="num-answer"', 'class="num-answer" value="999" oninput="bad()"');
  const root = adapt([html]);
  assert.equal(root.querySelectorAll('script,input,[onclick],[onerror],[oninput],[style],[id]').length, 0);
  assert.equal(root.querySelectorAll('[data-answer]').length, 1);
  assert.equal(root.querySelector('td').getAttribute('colspan'), '2');
  assert.equal(root.querySelector('img').getAttribute('src'), 'https://example.org/energy.png');
  assert.ok(root.querySelector('[data-question-prompt]').textContent.includes(math));
  assert.equal(readQuizContent(root).questions[0].answer, '50');
});

test('numeric controls outside the answer wrapper do not leave labels in context', () => {
  const html = numeric().replace('<div class="answer-section" style="margin:20px">', '').replace('</div>\n<div class="hint-box">', '\n<div class="hint-box">');
  assert.doesNotMatch(adapt([html]).textContent, /ระบุคำตอบ/);
});

test('missing numeric feedback uses the preserved numeric answer', () => {
  const html = numeric('6.70').replace('<div class="feedback-box">เฉลย: 6.70</div>', '');
  assert.equal(adapt([html]).querySelector('[data-question-solution]').textContent, 'เฉลย / Answer: 6.70');
});

test('malformed numeric questions stop the set with row and ordinal context', () => {
  const invalid = [
    ...['', 'NaN', 'Infinity', 'x', '50kg', '1/0'].map(answer => numeric(answer)),
    ...['', '-1', 'x', 'Infinity'].map(t => numeric('50', `data-tolerance="${t}"`)),
    numeric().replace(/<input[^>]+>/, ''),
    numeric().replace('type="number"', 'type="radio"'),
    numeric().replace('class="num-answer"', 'class="num-answer"><input type="number" class="num-answer"'),
    numeric().replace('</h3>', '</h3><div class="options"><input type="radio" value="A"></div>'),
  ];
  for (const html of invalid) assert.throws(() => adapt([choice, html]), /แถว 33, ข้อ 2:/);
});

test('numeric questions retain the same rich content restrictions as choice questions', () => {
  for (const extra of ['<svg></svg>', '<iframe src="https://example.org"></iframe>', '<img src="C:/image.png">', '<img src="http://example.org/x.png">']) {
    assert.throws(() => adapt([numeric().replace('</h3>', `</h3>${extra}`)]));
  }
  assert.throws(() => adapt([choice.replace('data-ans="B"', 'data-ans="E"')]), /Invalid answer/);
});

test('all questions in a sheet row inherit its column B topic while keeping their IDs', () => {
  const { document } = parseHTML('<html><body></body></html>');
  const topic = 'b-' + 'c'.repeat(24);
  const root = adaptLegacyBank({subjectId:'chemistry',bankKey:key,revision:'a'.repeat(64),title:'Exam',rows:[
    {rowNumber:2,html:choice+numeric(),reviewTopicKey:topic},
    {rowNumber:3,html:choice,reviewTopicKey:''}
  ]},{document,Parser:DOMParser});
  const {questions,errors}=readQuizContent(root);
  assert.deepEqual(errors,[]);
  assert.deepEqual(questions.map(q=>q.topicIds),[[topic],[topic],[]]);
  assert.deepEqual(questions.map(q=>q.id),[1,2,3].map(i=>bankQuestionId('chemistry',key,i)));
});

test('opening a pinned attempt enriches review links without replacing its revision, even if current metadata is unavailable', async () => {
  const {loadBankQuiz}=await import('../public/shared/question-bank-player.js');
  const {bankContentId}=await import('../public/shared/question-bank-model.js');
  const previous={document:globalThis.document,DOMParser:globalThis.DOMParser,localStorage:globalThis.localStorage};
  const {document}=parseHTML('<html><body></body></html>');
  const oldRevision='1'.repeat(64), topic='b-'+'c'.repeat(24);
  const selection={subjectId:'chemistry',bankKey:key,contentId:bankContentId('chemistry',key)};
  globalThis.document=document;globalThis.DOMParser=DOMParser;
  globalThis.localStorage={getItem:()=>JSON.stringify({identityKey:'guest',contentId:selection.contentId,bankRevision:oldRevision})};
  try {
    for(const unavailable of [false,true]) {
      const calls=[];
      const client={snapshot:async(subject,bank,revision)=>{
        calls.push(revision);
        if(!revision && unavailable) throw Error('Offline');
        return {subjectId:subject,bankKey:bank,title:'Exam',revision:revision||'2'.repeat(64),rows:[
          {rowNumber:2,html:choice,...(!revision?{reviewTopicKey:topic}:{})}
        ]};
      }};
      const result=await loadBankQuiz({selection,identityKey:'guest',client});
      assert.deepEqual(calls,[oldRevision,undefined]);
      assert.equal(result.revision,oldRevision);
      assert.equal(result.pinned,true);
      assert.equal(result.root.dataset.bankRevision,oldRevision);
      const q=readQuizContent(result.root).questions[0];
      assert.equal(q.id,bankQuestionId('chemistry',key,1));
      assert.equal(q.answer,'b');
      assert.deepEqual(q.topicIds,unavailable?[]:[topic]);
    }
  } finally { Object.assign(globalThis,previous); }
});
