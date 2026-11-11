import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { applyContentLanguage } from '../js/content-language.js';
import { buildHtmlPrintSnapshot } from '../js/html-print.js';
import { isExitTicketRevision, exitTicketPages, prepareExitTicketPrint } from '../js/exit-ticket-revision.js';

const topics = [
  ['2-1','b-6622c75196960aae9364b231','atomic-models',4,2],
  ['2-2','b-c70956de38c1560a16651221','subatomic-particles-and-isotopes',4,2],
  ['2-3','b-1746fd491b0ecff31033ada1','electron-configurations',4,2],
  ['2-4','b-5e9670f48386783fee660857','periodic-table-main-group',10,3],
  ['10-1','b-415092278077d3c2c4fb13b9','acid-base-theories',6,3,'ipst/acid-base','learning-sheet'],
  ['10-2','b-5e60aad52e28d90a4d818b29','conjugate-acid-base-pairs',7,3,'ipst/acid-base','learning-sheet'],
];
const directory = new URL('../public/content/chemistry/', import.meta.url);
async function documentFor(topic) {
  const folder=topics.find(row=>row[0]===topic)?.[5] || 'atomic-properties';
  const name = `${folder}/${topic}-exit-ticket-revision.html`;
  const { document } = parseHTML(await readFile(new URL(name,directory),'utf8'));
  Object.defineProperty(document,'URL',{value:`https://example.test/learning-hub/content/chemistry/${name}`});
  Object.defineProperty(document,'defaultView',{value:undefined});
  return document;
}

for (const [topic, bankKey, slug, allCount, quizCount, folder='atomic-properties', existing='review'] of topics) {
  test(`${topic}: correct topic menu appends one ungraded revision after the existing review`, async () => {
    const { document } = parseHTML(await readFile(new URL(`../public/content/bank/chemistry/${bankKey}.html`,import.meta.url),'utf8'));
    const nav = document.querySelector('[data-learning-menu]');
    assert.equal(nav.dataset.topicId,bankKey); assert.equal(nav.dataset.routeSlug,slug);
    const links = [...nav.querySelectorAll('a')], revision=links.at(-1);
    assert.equal(links.filter(a=>a.dataset.toolKey==='exit-ticket-revision').length,1);
    assert.equal(links[0].dataset.toolKey,existing);
    assert.equal(revision.dataset.contentId,`chemistry-${slug}-exit-ticket-revision`);
    assert.equal(revision.dataset.toolKind,'html');
    assert.equal(revision.dataset.th,'exit ticket revision');
    assert.equal(revision.dataset.en,'exit ticket revision');
    assert.equal(revision.getAttribute('href'),`../../chemistry/${folder}/${topic}-exit-ticket-revision.html`);
  });
  test(`${topic}: both languages, both print ranges and editions preserve the approved pages`, async () => {
    const source=await documentFor(topic);
    assert.ok(isExitTicketRevision(source));
    assert.equal(source.querySelectorAll('script,iframe,form,button,select,input').length,0);
    assert.equal(source.querySelectorAll('[data-learning-activity-content],[data-sheet-slot]').length,0);
    for (const language of ['th','en']) {
      applyContentLanguage(source,language);
      assert.equal(exitTicketPages(source).length,allCount);
      assert.equal(exitTicketPages(source,'quiz').length,quizCount);
      const view=source.querySelector(`[data-content-lang="${language}"]`);
      assert.equal(view.querySelectorAll('.blank').length,10);
      assert.equal(view.querySelectorAll('.calc-item,.qbox').length,3);
      for (const range of ['all','quiz']) for (const answers of [false,true]) {
        source.body.classList.add('answers-on'); // printing a student copy must not change teaching state
        const before=source.documentElement.outerHTML;
        const { document:copy } = parseHTML(buildHtmlPrintSnapshot(source,'Revision'));
        const count=prepareExitTicketPrint(copy,{range,answers});
        assert.equal(count,range==='all'?allCount:quizCount);
        assert.equal(copy.querySelectorAll('[data-content-lang]').length,1);
        assert.equal(copy.documentElement.lang,language);
        assert.equal(copy.body.classList.contains('answers-on'),answers);
        assert.equal(copy.querySelectorAll('[data-hub-print-style]').length,0,'generic reflow styles would change authored A4 geometry');
        assert.equal(copy.querySelectorAll('.hub-print-page').length,0);
        const answerSelector='.solution-text,.answer-key,.teacher-only,.teacher-work,.teacherkey';
        if(answers) assert.ok(copy.querySelectorAll(answerSelector).length>0);
        else assert.equal(copy.querySelectorAll(answerSelector).length,0,'student export must remove answer DOM');
        if(range==='quiz') assert.equal(copy.querySelectorAll('.page.review').length,0);
        assert.match(copy.querySelector('.footer span:last-child').textContent,new RegExp(`1 / ${count}$`));
        for(const img of copy.querySelectorAll('img')) assert.ok(img.getAttribute('src').startsWith(new URL('assets/',source.URL).href));
        assert.equal(source.documentElement.outerHTML,before,'printing must not mutate the live revision');
      }
    }
  });
}

test('ordinary documents do not opt in; snapshots require an explicit language and valid range', async () => {
  const {document:ordinary}=parseHTML('<html data-learning-html><body></body></html>');
  assert.equal(isExitTicketRevision(ordinary),false);
  assert.throws(()=>exitTicketPages(ordinary));
  const source=await documentFor('2-1');
  assert.throws(()=>prepareExitTicketPrint(source),/detached/);
  const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'Revision'));
  assert.throws(()=>prepareExitTicketPrint(copy,{range:'unknown'}),/range/);
  source.querySelector('[data-content-lang="en"]').removeAttribute('hidden');
  assert.throws(()=>exitTicketPages(source),/exactly one/);
});

test('acid-base revisions retain correct word-bank keys and content QA corrections', async () => {
  for(const topic of ['10-1','10-2']) {
    const source=await documentFor(topic);
    for(const language of ['th','en']) {
      const view=source.querySelector(`[data-content-lang="${language}"]`);
      const banks=[...view.querySelectorAll('.bank-box')];
      assert.equal(banks.length,2);
      for(const [index,bank] of banks.entries()) {
        const options=[...bank.querySelectorAll('.bank-item')].map(item=>item.textContent.replace(/^\s*\d+\.?\s*/,'').trim());
        assert.equal(options.length,25);
        const letter=index===0?'A':'B';
        const blanks=[...view.querySelectorAll('.blank')].filter(blank=>blank.dataset.answer.startsWith(letter));
        assert.equal(blanks.length,5);
        assert.equal(new Set(blanks.map(blank=>blank.dataset.answer)).size,5);
        for(const blank of blanks) {
          const answer=blank.querySelector('.solution-text').textContent.replace(/\s*\[[AB]\d{2}\]$/,'').trim();
          assert.equal(answer,options[Number(blank.dataset.answer.slice(1))-1]);
        }
      }
      if(language==='en') assert.doesNotMatch(view.textContent,/[\u0E00-\u0E7F]/u);
    }
  }
  const theories=await documentFor('10-1'),pairs=await documentFor('10-2');
  assert.match(theories.body.textContent,/Ca\(OH\)₂\(s\) ⇌ Ca²⁺\(aq\) \+ 2OH⁻\(aq\)/);
  assert.match(theories.body.textContent,/dissolved portion is a strong base/);
  assert.match(pairs.body.textContent,/H₃O⁺ is the acid and F⁻ the base/);
  assert.doesNotMatch(pairs.body.textContent,/ทั้งสองไอออน|reverses the acid\/base roles/);
  assert.equal(pairs.querySelector('[data-content-lang="en"]').querySelectorAll('img').length,2);
});

test('content QA corrections are present in the imported versions', async () => {
  const a=await documentFor('2-1'),b=await documentFor('2-2'),c=await documentFor('2-3'),d=await documentFor('2-4');
  assert.match(a.body.textContent,/656\.52.*657/s);
  assert.match(b.body.textContent,/5\.49 × 10⁻⁴ u/);
  assert.match(c.body.textContent,/theoretical capacity is 50/);
  assert.match(d.body.textContent,/Pauling electronegativity in bonds/);
  assert.match(d.body.textContent,/Mg 1\.20 < Al 1\.22/);
});
