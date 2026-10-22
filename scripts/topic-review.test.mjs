import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML, DOMParser } from 'linkedom';
import { reviewTopics, preferredReviewTopic, reviewContentUrl, reviewDocument } from '../public/shared/topic-review-model.js';
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

function uiSetup(fetcher) {
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
    client:{catalog:async()=>catalog},fetcher,Parser:DOMParser,language:()=>lang,typeset:async()=>{}});
  const choose=async(selector,value)=>{const node=document.querySelector(selector);node.value=value;node.dispatchEvent(new window.Event('change'));await new Promise(resolve=>setImmediate(resolve));};
  return {browser,document,content,printButton,choose,setLang:value=>{lang=value;browser.refreshLanguage();}};
}
const response = body => ({ok:true,redirected:false,text:async()=>typeof body==='string'?body:JSON.stringify(body)});

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
