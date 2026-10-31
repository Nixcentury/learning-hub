import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseHTML, DOMParser } from 'linkedom';
import { reviewTopics, preferredReviewTopic, reviewContentUrl, reviewDocument, reviewExamNumber } from '../public/shared/topic-review-model.js';
import { createTopicReviewBrowser } from '../public/shared/topic-review.js';

const key = 'b-' + '1'.repeat(24), other = 'b-' + '2'.repeat(24);
const catalog = { sets: [
  {bankKey:key,legacyId:'real-id-1',title:'ไอโซโทป(Isotopes)',path:['Chemistry','Hub','อะตอม(Atoms)','ไอโซโทป(Isotopes)'],questionCount:0},
  {bankKey:other,legacyId:'real-id-2',title:'มวลอะตอม(Atomic Mass)',path:['Chemistry','Hub','โมล(Mole)','มวลอะตอม(Atomic Mass)'],questionCount:3},
] };
const authored = {schemaVersion:1, routes:[
  {subjectId:'chemistry',bankKey:key,toolKey:'review',kind:'content',status:'ready',contentId:'isotopes-review'},
  {subjectId:'chemistry',bankKey:other,toolKey:'review',kind:'content',status:'ready',contentId:'mass-review'},
],contents:[
  {id:'isotopes-review',toolKind:'html',source:'content/reviews/chemistry/isotopes.html'},
  {id:'mass-review',toolKind:'html',source:'content/reviews/chemistry/mass.html'},
]};

test('reviews use every published topic, preserve live identities and accept several preferred topics', () => {
  const before = JSON.stringify(catalog);
  const entries = reviewTopics(catalog, authored, 'chemistry');
  assert.deepEqual(entries.map(x=>x.bankKey), [key,other]);
  assert.equal(entries[0].legacyId, 'real-id-1');
  assert.equal(entries[0].source, 'content/reviews/chemistry/isotopes.html');
  assert.equal(preferredReviewTopic(entries, ['invented',other,key]), other);
  assert.equal(preferredReviewTopic(entries, ['invented']), '');
  assert.equal(JSON.stringify(catalog),before);
});

test('only the ready HTML review for that subject/topic is used, never a worksheet or another subject', () => {
  const value = structuredClone(authored);
  value.routes[0].subjectId = 'physics';
  value.routes[1].toolKey = 'learning-sheet';
  assert.deepEqual(reviewTopics(catalog,value,'chemistry').map(x=>x.source),[null,null]);
  value.routes[0].subjectId = 'chemistry'; value.routes[0].status='preparing';
  value.routes[1].toolKey='review'; value.contents[1].toolKind='pdf';
  assert.deepEqual(reviewTopics(catalog,value,'chemistry').map(x=>x.source),[null,null]);
});

test('review sources are constrained to this site content directory', () => {
  assert.equal(reviewContentUrl('content/reviews/chemistry/test.html','https://example.test/learning-hub/').href,'https://example.test/learning-hub/content/reviews/chemistry/test.html');
  for(const source of ['https://evil.test/a.html','content/../../outside.html','content/../index.html','content/a.html?token=secret','content/a.html#x'])
    assert.throws(()=>reviewContentUrl(source,'https://example.test/learning-hub/'));
});

test('reading content retains math, tables, links, images, writing space and safe SVG without active HTML', () => {
  const {document}=parseHTML('<html><body></body></html>');
  const body=reviewDocument(`<html><body><main data-topic-review-document>
    <p onclick="steal()">\\(p=Z, n=A-Z\\)</p><table><tr><td colspan="2">________</td></tr></table>
    <div data-review-writing-space></div><img src="figure.png" onerror="steal()"><a href="https://proj14.ipst.ac.th/">Study</a>
    <a href="javascript:steal()">Bad link</a><script>steal()</script><iframe src="https://evil.test"></iframe>
    <p data-content-lang="th">ไทย</p><p data-content-lang="en">English</p><div hidden>Hidden answer</div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>Atom</title><circle cx="5" cy="5" r="2"/></svg>
    </main></body></html>`,new URL('https://example.test/learning-hub/content/reviews/test.html'),{document,Parser:DOMParser,language:'th'});
  assert.match(body.textContent,/\\\(p=Z, n=A-Z\\\)/);
  assert.equal(body.querySelector('td').getAttribute('colspan'),'2');
  assert.equal(body.querySelector('img').src,'https://example.test/learning-hub/content/reviews/figure.png');
  assert.match(body.querySelectorAll('img')[1].src,/^data:image\/svg\+xml/);
  assert.equal(body.querySelector('a').rel,'noopener noreferrer');
  assert.ok(body.querySelector('.review-writing-space'));
  assert.doesNotMatch(body.outerHTML,/onclick|onerror|steal|<script|<iframe|English|Hidden answer/);
});

function uiSetup(fetcher, options = {}) {
  const {window,document}=parseHTML('<html lang="th"><body><div id="browser"></div><div id="content"></div><button id="print"></button></body></html>');
  // linkedom exposes only a getter; model the browser select setter for these interaction tests.
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
    configurable:true,
    get(){return [...this.querySelectorAll('option')].find(x=>x.hasAttribute('selected'))?.value || this.querySelector('option')?.value || '';},
    set(value){this.querySelectorAll('option').forEach(x=>x.toggleAttribute('selected',x.value===value));},
  });
  globalThis.window=window;
  let lang='th';
  const content=document.querySelector('#content'), printButton=document.querySelector('#print');
  const browser=createTopicReviewBrowser({root:document.querySelector('#browser'),content,printButton,
    client:{catalog:async()=>catalog},fetcher,Parser:DOMParser,language:()=>lang,typeset:async()=>{}, ...options});
  const choose=async(selector,value)=>{const node=document.querySelector(selector);node.value=value;node.dispatchEvent(new window.Event('change'));await new Promise(resolve=>setImmediate(resolve));};
  return {browser,document,content,printButton,choose,setLang:value=>{lang=value;browser.refreshLanguage();}};
}
const response = body => ({ok:true,redirected:false,text:async()=>typeof body==='string'?body:JSON.stringify(body)});

test('Hub history can explicitly return to the library without losing the current topic by default', async () => {
  const ui = uiSetup(async url => response(url.endsWith('.json') ? authored : '<main>Review</main>'));
  await ui.browser.open({subjectId:'chemistry',preferred:[key]});
  assert.deepEqual(ui.browser.getSelection(), {subjectId:'chemistry',bankKey:key});
  await ui.browser.open({subjectId:'chemistry'});
  assert.equal(ui.browser.getSelection().bankKey,key);
  await ui.browser.open({subjectId:'chemistry',clearSelection:true});
  assert.deepEqual(ui.browser.getSelection(), {subjectId:'chemistry',bankKey:null});
  await ui.browser.open({subjectId:'chemistry',preferred:['b-'+'f'.repeat(24)]});
  assert.match(ui.document.querySelector('[data-review-status]').textContent,/ไม่พบหัวข้อ/);
});

const recall = `<main><section data-review-question><h3>Question A</h3><p>Count particles.</p>
  <div data-review-blank data-review-writing-space></div><div data-review-answer hidden><p>Answer A \\(N_e=Z-q\\)</p></div></section>
  <section data-review-question><h3>Question B</h3><table data-review-blank><tr><td>________</td></tr></table>
  <div data-review-answer><p>Answer B</p><script>unsafe()</script></div></section><div hidden>Unrelated hidden content</div></main>`;

test('recall answers start hidden, open independently or together, and reset for another topic', async () => {
  const ui = uiSetup(async url => response(url.endsWith('.json') ? authored : recall));
  await ui.browser.open({subjectId:'chemistry',preferred:[key]});
  const buttons = [...ui.content.querySelectorAll('[data-review-answer-toggle]')];
  const answers = [...ui.content.querySelectorAll('[data-review-answer]')];
  const blanks = [...ui.content.querySelectorAll('[data-review-blank]')];
  const all = ui.document.querySelector('[data-review-answers-toggle]');
  const click = node => node.dispatchEvent(new window.Event('click'));
  assert.equal(buttons.length,2);
  assert.ok(answers.every(node=>node.hidden));
  assert.ok(blanks.every(node=>!node.hidden));
  assert.doesNotMatch(ui.content.innerHTML,/unsafe|Unrelated hidden content|<script/);
  assert.equal(buttons[0].getAttribute('aria-controls'), answers[0].id);
  click(buttons[0]);
  assert.equal(answers[0].hidden,false);
  assert.equal(answers[1].hidden,true);
  assert.equal(blanks[0].hidden,true);
  assert.equal(blanks[1].hidden,false);
  assert.equal(buttons[0].getAttribute('aria-expanded'),'true');
  click(all);
  assert.ok(answers.every(node=>!node.hidden));
  assert.equal(all.getAttribute('aria-expanded'),'true');
  ui.browser.setPrinting(true);
  assert.equal(all.disabled,true);
  assert.ok(buttons.every(node=>node.disabled));
  click(buttons[0]); click(all);
  assert.ok(answers.every(node=>!node.hidden));
  ui.browser.setPrinting(false);
  click(all);
  assert.ok(answers.every(node=>node.hidden));
  assert.ok(blanks.every(node=>!node.hidden));
  click(buttons[1]);
  ui.setLang('en'); await new Promise(resolve=>setImmediate(resolve));
  assert.ok([...ui.content.querySelectorAll('[data-review-answer]')].every(node=>node.hidden));
  assert.equal(all.textContent,'Show all answers');
  assert.equal(ui.content.querySelector('[data-review-answer-toggle]').textContent,'Show answer');
  await ui.choose('[data-review-chapter]','');
  await ui.choose('[data-review-topic]',other);
  assert.ok([...ui.content.querySelectorAll('[data-review-answer]')].every(node=>node.hidden));
});

test('the bilingual subatomic review supplies an answer and writing area for every recall question', () => {
  const html = fs.readFileSync(new URL('../public/content/reviews/chemistry/subatomic-particles-and-isotopes.html',import.meta.url),'utf8');
  const {document} = parseHTML('<html></html>');
  for (const language of ['th','en']) {
    const content = reviewDocument(html,new URL('https://example.test/content/subatomic.html'),{document,Parser:DOMParser,language});
    const questions = [...content.querySelectorAll('[data-review-question]')];
    assert.equal(questions.length,4);
    assert.ok(questions.every(node=>node.querySelector('[data-review-blank]') && node.querySelector('[data-review-answer]')?.hidden));
    assert.match(questions[2].querySelector('[data-review-answer]').textContent,/18\+2=20/);
    assert.match(questions[2].querySelector('[data-review-answer]').textContent,/42/);
  }
});

test('topic switching ignores late responses and does not let another topic overwrite the screen', async()=>{
  let finish;
  const ui=uiSetup(async url=>url.endsWith('.json')?response(authored):url.endsWith('isotopes.html')?
    new Promise(resolve=>{finish=()=>resolve(response('<main>OLD TOPIC</main>'));}):response('<main>NEW TOPIC</main>'));
  await ui.browser.open({subjectId:'chemistry'});
  await ui.choose('[data-review-topic]',key);
  await ui.choose('[data-review-topic]',other);
  assert.match(ui.content.textContent,/NEW TOPIC/);
  finish(); await new Promise(resolve=>setImmediate(resolve));
  assert.doesNotMatch(ui.content.textContent,/OLD TOPIC/);
  assert.equal(ui.printButton.disabled,false);
  await ui.choose('[data-review-chapter]','chapter:อะตอม(Atoms)');
  assert.equal(ui.printButton.disabled,true);
  assert.equal(ui.document.querySelector('[data-review-topic]').querySelectorAll('option').length,2);
});

test('a missing summary stays selectable, survives reopening and language changes, and catalog failure has retry', async()=>{
  const ui=uiSetup(async()=>response({schemaVersion:1,routes:[],contents:[]}));
  await ui.browser.open({subjectId:'chemistry',preferred:[key,other]});
  assert.match(ui.content.textContent,/ไอโซโทป|กำลังเตรียมเนื้อหา/);
  assert.equal(ui.printButton.disabled,false);
  ui.browser.close();
  await ui.browser.open({subjectId:'chemistry'});
  assert.equal(ui.document.querySelector('[data-review-topic]').value,key);
  ui.setLang('en'); await new Promise(resolve=>setImmediate(resolve));
  assert.match(ui.content.textContent,/Isotopes|Content is being prepared/);
  assert.equal(ui.document.querySelector('[data-review-topic]').value,key);
  const failed=uiSetup(async()=>{throw Error('Offline');});
  await failed.browser.open({subjectId:'chemistry',preferred:[key]});
  assert.equal(failed.document.querySelector('[data-review-retry]').hidden,false);
  assert.equal(failed.printButton.disabled,true);
  assert.match(failed.content.textContent,/ยังตรวจสถานะบททวนไม่ได้/);
});

test('reopening from a different quiz question selects that question topic', async () => {
  const ui=uiSetup(async url=>response(url.endsWith('.json')?authored:'<main>Review</main>'));
  await ui.browser.open({subjectId:'chemistry',preferred:[key]});
  assert.equal(ui.document.querySelector('[data-review-topic]').value,key);
  ui.browser.close();
  await ui.browser.open({subjectId:'chemistry',preferred:[other]});
  assert.equal(ui.document.querySelector('[data-review-topic]').value,other);
  ui.browser.close();
  await ui.browser.open({subjectId:'chemistry',preferred:['unknown']});
  assert.equal(ui.document.querySelector('[data-review-topic]').value,'');
});

const examReview = `<main data-topic-review-document data-review-quiz-bank="${other}">
<section data-review-exam-question="1"><h2>Exam question 1 — Count electrons</h2>
<section data-review-question><h3>Question 1 — Practice</h3><p>Use different data.</p><div data-review-blank></div><div data-review-answer hidden>Practice answer only.</div></section></section>
<section data-review-exam-question="3"><h2>Exam question 3 — Half-life</h2><p>Use a different isotope.</p></section></main>`;

test('exam markers survive only with a valid declared bank and strict question numbers', () => {
  for (const value of [1, '1', 1000, '1000']) assert.equal(reviewExamNumber(value), Number(value));
  for (const value of [0, -1, 1001, 1.5, '01', '+1', '1.0', ' 1 ', [1], {}, null]) assert.equal(reviewExamNumber(value), null);
  const {document}=parseHTML('<html></html>');
  const render = html => reviewDocument(html,new URL('https://example.test/learning-hub/content/reviews/exam.html'),{document,Parser:DOMParser});
  const good = render(examReview); assert.equal(good.dataset.reviewQuizBank, other);
  assert.deepEqual([...good.querySelectorAll('[data-review-exam-question]')].map(x=>x.dataset.reviewExamQuestion), ['1','3']);
  assert.equal(render(examReview.replace(other,'invalid')).querySelectorAll('[data-review-exam-question]').length,0);
  assert.equal(render(examReview.replace('data-review-exam-question="1"','data-review-exam-question="-1"')).querySelectorAll('[data-review-exam-question]').length,1);
});

test('a published exam review opens at the current exam question and return identifies its actual question', async () => {
  const returned=[];
  const ui=uiSetup(async url=>response(url.endsWith('.json')?authored:examReview),{onExamQuestion:value=>returned.push(value)});
  await ui.browser.open({subjectId:'chemistry',preferred:[key,other],quizContext:{bankKey:other,questionNumber:3}});
  assert.equal(ui.browser.getSelection().bankKey,other);
  assert.equal(ui.document.querySelector('[data-review-exam-select]').value,'3');
  assert.equal(ui.content.querySelector('[data-review-exam-question="1"]').hidden,true);
  assert.equal(ui.content.querySelector('[data-review-exam-question="3"]').hidden,false);
  await ui.choose('[data-review-exam-select]','1');
  ui.content.querySelector('[data-review-return-question="1"]').dispatchEvent(new ui.document.defaultView.Event('click'));
  assert.deepEqual(returned,[{subjectId:'chemistry',bankKey:other,questionNumber:1}]);
  assert.ok(ui.content.querySelector('[data-review-answer]').hidden);
  ui.browser.setPrinting(true);
  ui.content.querySelector('[data-review-return-question="1"]').dispatchEvent(new ui.document.defaultView.Event('click'));
  assert.equal(returned.length,1,'Printing cannot navigate the quiz');
});

test('an unfinished question review is reported honestly and all prepared sections remain available', async () => {
  const ui=uiSetup(async url=>response(url.endsWith('.json')?authored:examReview));
  await ui.browser.open({subjectId:'chemistry',preferred:[key],quizContext:{bankKey:other,questionNumber:2}});
  assert.equal(ui.document.querySelector('[data-review-exam-select]').value,'');
  assert.match(ui.document.querySelector('[data-review-exam-status]').textContent,/ข้อ 2.*ยังไม่จัดทำ/);
  assert.ok([...ui.content.querySelectorAll('[data-review-exam-question]')].every(section=>!section.hidden));
  const link=ui.content.querySelector('[data-review-return-question="3"]');
  assert.equal(link.localName,'a'); assert.match(link.textContent,/เลือกข้อ 3/);
});

test('language changes keep the chosen exam section while resetting the practice answers', async () => {
  const ui=uiSetup(async url=>response(url.endsWith('.json')?authored:examReview),{onExamQuestion:()=>{}});
  await ui.browser.open({subjectId:'chemistry',preferred:[other],quizContext:{bankKey:other,questionNumber:3}});
  await ui.choose('[data-review-exam-select]','1');
  ui.content.querySelector('[data-review-answer-toggle]').dispatchEvent(new ui.document.defaultView.Event('click'));
  assert.equal(ui.content.querySelector('[data-review-answer]').hidden,false);
  ui.setLang('en'); await new Promise(resolve=>setImmediate(resolve));
  assert.equal(ui.document.querySelector('[data-review-exam-select]').value,'1');
  assert.equal(ui.content.querySelector('[data-review-return-question="1"]').textContent,'Return to question 1');
  assert.ok(ui.content.querySelector('[data-review-answer]').hidden);
});

test('ordinary topic review remains the fallback when no exam content is published', async () => {
  const available=structuredClone(authored); available.routes[1].status='preparing';
  const ui=uiSetup(async url=>response(url.endsWith('.json')?available:examReview));
  await ui.browser.open({subjectId:'chemistry',preferred:[key,other],quizContext:{bankKey:other,questionNumber:1}});
  assert.equal(ui.browser.getSelection().bankKey,key);
  assert.equal(ui.document.querySelector('[data-review-exam-tools]').hidden,true);
  assert.equal(ui.content.querySelector('[data-review-return-question]'),null);
});
