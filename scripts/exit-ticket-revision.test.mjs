import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { applyContentLanguage } from '../js/content-language.js';
import { buildHtmlPrintSnapshot } from '../js/html-print.js';
import { isExitTicketRevision, exitTicketPages, exitTicketRanges, prepareExitTicketPrint } from '../js/exit-ticket-revision.js';

test('4.3 revision: corrected self-study content and all 12 independent exports',async()=>{
  const path='content/physics/ipst/equilibrium/4-3-exit-ticket-revision.html';
  const {document:source}=parseHTML(await readFile(new URL('../public/'+path,import.meta.url),'utf8'));
  Object.defineProperty(source,'URL',{value:'https://example.test/learning-hub/'+path});
  Object.defineProperty(source,'defaultView',{value:undefined});
  assert.equal(source.documentElement.dataset.contentRevision,'1.3');
  assert.deepEqual(exitTicketRanges(source),['all','quiz','review']);
  assert.equal(source.querySelectorAll('script,template,iframe,form,button,input,select,[data-sheet-slot],[data-learning-activity-content]').length,0);
  const {document:menu}=parseHTML(await readFile(new URL('../public/content/bank/physics/b-d52412f9e1c700d9a5223472.html',import.meta.url),'utf8'));
  assert.equal(menu.querySelector('nav').dataset.routeSlug,'translational-equilibrium');
  const links=[...menu.querySelectorAll('a')];
  assert.deepEqual(links.map(a=>a.dataset.toolKey),['learning-sheet','quiz-set-1','quiz-set-2','simulation','exit-ticket-revision']);
  assert.equal(links.at(-1).dataset.contentId,'physics-ipst-equilibrium-4-3-exit-ticket-revision');
  assert.equal(links.at(-1).dataset.toolKind,'html');
  assert.equal(links.at(-1).dataset.th,'exit ticket revision');
  for(const lang of ['th','en'])for(const answers of [false,true])for(const range of ['all','quiz','review']){
    applyContentLanguage(source,lang);source.body.classList.toggle('answers-on',!answers);
    const before=source.documentElement.outerHTML;
    const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'4.3 revision'));
    const counts=lang==='th'?[13,9,4]:answers?[14,9,5]:[16,11,5];
    const count=prepareExitTicketPrint(copy,{range,answers});
    assert.equal(count,counts[['all','quiz','review'].indexOf(range)]);
    assert.equal(copy.querySelectorAll('.unit').length,{all:33,quiz:13,review:20}[range]);
    assert.equal(new Set([...copy.querySelectorAll('.unit')].map(u=>u.dataset.unitKey)).size,copy.querySelectorAll('.unit').length);
    const quiz=range!=='review',review=range!=='quiz';
    assert.equal(copy.querySelectorAll('.question').length,quiz?10:0);
    assert.equal(copy.querySelectorAll('.blank').length,quiz?7:0);
    assert.equal(copy.querySelectorAll('.recall-card').length,quiz?8:0);
    assert.equal(copy.querySelectorAll('.response-space').length,!answers&&quiz?38:0);
    assert.equal(copy.querySelectorAll('.answer-inline,.teacher-key').length,answers&&quiz?25:0);
    assert.equal(copy.querySelectorAll('.qa-fbd').length,answers&&quiz?3:0);
    assert.equal(copy.querySelectorAll('.unit[data-kind="review"] .response-space,.unit[data-kind="review"] .recall-card').length,0);
    assert.equal(copy.querySelectorAll('merror,[data-mjx-error]').length,0);
    if(answers&&quiz){
      const q1=copy.querySelector('.question[data-unit-key="2"]');
      assert.ok([...q1.querySelectorAll('[data-tex]')].some(n=>n.dataset.tex.includes('\\sqrt{(6\\,\\mathrm N)^2+(8\\,\\mathrm N)^2}')));
      const q10=copy.querySelector('.question[data-unit-key="11"]');
      assert.match(q10.textContent,lang==='th'?/เชือกช่วงที่ดึง A ขนานพื้นเอียง/:/rope segment acting on A is parallel to the incline/);
    }
    if(review){
      const reading=copy.querySelector('[data-unit-key="18"]');
      assert.ok([...reading.querySelectorAll('[data-tex]')].some(n=>n.dataset.tex==='F_x=F\\cos\\theta,\\qquad F_y=F\\sin\\theta'));
      assert.match(reading.textContent,/120°/);
      assert.match(copy.querySelector('[data-unit-key="19"]').textContent,/4\.2/);
      assert.doesNotMatch(copy.querySelector('[data-unit-key="19"]').textContent,/4\.1/);
      assert.match(copy.querySelector('[data-unit-key="24"]').textContent,lang==='th'?/เชือกเบาดึง A ในแนวราบ/:/rope pulls A horizontally/);
      assert.doesNotMatch(copy.querySelector('[data-unit-key="26"]').textContent,/90 N|37°/);
      assert.doesNotMatch(copy.querySelector('[data-unit-key="28"]').textContent,/60 N|37°/);
    }
    for(const img of copy.querySelectorAll('img')){
      assert.match(img.getAttribute('src'),/\/assets\/4-3\/exit-ticket\/[a-f0-9]+\.(jpg|png)$/);
      assert.ok(+img.getAttribute('width')>0&&+img.getAttribute('height')>0);
    }
    assert.equal(source.documentElement.outerHTML,before);
  }
});

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

async function physicsRevision() {
  const path='content/physics/ipst/atomic-physics/19-1-1-exit-ticket-revision.html';
  const {document}=parseHTML(await readFile(new URL('../public/'+path,import.meta.url),'utf8'));
  Object.defineProperty(document,'URL',{value:'https://example.test/learning-hub/'+path});
  Object.defineProperty(document,'defaultView',{value:undefined});
  return document;
}

test('blackbody revision appends the approved v1.7 after the existing worksheet and quiz', async () => {
  const {document}=parseHTML(await readFile(new URL('../public/content/bank/physics/b-0f490c3358e9212cee2e2a43.html',import.meta.url),'utf8'));
  const links=[...document.querySelectorAll('a')];
  assert.deepEqual(links.map(a=>a.dataset.toolKey),['learning-sheet','quiz-set-1','exit-ticket-revision']);
  assert.equal(links.at(-1).dataset.toolKind,'html');
  assert.equal(links.at(-1).dataset.contentId,'physics-ipst-atomic-19-1-1-exit-ticket-revision');
  assert.equal(links.at(-1).dataset.th,'exit ticket revision');
  assert.equal(links.at(-1).dataset.en,'exit ticket revision');
  const source=await physicsRevision();
  assert.equal(source.documentElement.dataset.contentRevision,'1.7');
  assert.equal(source.documentElement.dataset.sourceSha256,'c549e418f85c656f983d9a635747ffa20dddc99dcc67b552bb5b67163b5a8c9f');
  assert.equal(source.querySelectorAll('script,template,iframe,form,button,select,input,[data-learning-activity-content],[data-sheet-slot]').length,0);
});

test('blackbody: 16 exports retain every question, calculation space and independent page count', async () => {
  const source=await physicsRevision();
  const ranges=['all','quiz','recall','review'];
  assert.deepEqual(exitTicketRanges(source),ranges);
  const expectedUnits={all:24,quiz:11,recall:5,review:8};
  for(const language of ['th','en'])for(const answers of [false,true])for(const range of ranges){
    applyContentLanguage(source,language);
    // Request the opposite edition to the reader; exporting must select the requested layout.
    source.body.classList.toggle('answers-on',!answers);
    const before=source.documentElement.outerHTML;
    const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'Blackbody revision'));
    const count=prepareExitTicketPrint(copy,{range,answers});
    const counts=language==='th'?[answers?6:7,3,1,3]:[7,4,1,3];
    assert.equal(count,counts[ranges.indexOf(range)]);
    assert.equal(copy.querySelectorAll('.page').length,count);
    assert.equal(copy.querySelectorAll('[data-revision-edition]').length,1);
    assert.equal(copy.querySelectorAll('[data-revision-range]').length,1);
    assert.equal(copy.querySelectorAll('.unit').length,expectedUnits[range]);
    assert.equal(new Set([...copy.querySelectorAll('.unit')].map(u=>u.dataset.revisionUnit)).size,expectedUnits[range]);
    assert.equal(copy.documentElement.lang,language);
    assert.equal(copy.querySelectorAll('[data-hub-print-style],.hub-print-page').length,0);
    const hasQuiz=range==='all'||range==='quiz',hasRecall=range==='all'||range==='recall';
    assert.equal(copy.querySelectorAll('.blank').length,hasQuiz?10:0);
    assert.equal(copy.querySelectorAll('.recall-card').length,hasRecall?10:0);
    assert.equal(copy.querySelectorAll('.answer-inline,.teacher-key').length,answers?(hasQuiz?15:0)+(hasRecall?10:0):0);
    assert.equal(copy.querySelectorAll('.response-space').length,answers?0:(hasQuiz?10:0)+(hasRecall?10:0));
    for(const unit of copy.querySelectorAll('.unit'))if(range!=='all')assert.equal(unit.dataset.kind,range);
    for(const img of copy.querySelectorAll('img'))assert.match(img.getAttribute('src'),/^https:\/\/example.test\/learning-hub\/content\/physics\/ipst\/atomic-physics\/assets\/19-1-1\/exit-ticket\//);
    assert.match(copy.querySelector('.footer span:last-child').textContent,new RegExp(`1 / ${count}$`));
    assert.equal(source.documentElement.outerHTML,before);
  }
});

test('blackbody: science QA and approved continuous writing lines survive import',async()=>{
  const source=await physicsRevision();
  for(const language of ['th','en']){
    const view=source.querySelector(`[data-content-lang="${language}"]`);
    const student=view.querySelector('[data-revision-edition="blank"] [data-revision-range="all"]');
    const teacher=view.querySelector('[data-revision-edition="answers"] [data-revision-range="all"]');
    assert.equal(student.querySelectorAll('.answer-rule').length,10);
    for(const blank of student.querySelectorAll('.blank'))assert.ok(blank.getAttribute('style').includes('--rule-width'));
    assert.match(teacher.textContent,/650 nm/);
    assert.match(teacher.textContent,/3\.3 × 10⁻¹⁹/);
    assert.match(teacher.textContent,/6\.5 × 10¹⁵/);
    assert.equal(student.querySelectorAll('img').length,3);
    if(language==='en')assert.match(teacher.textContent,/nonzero levels/);
  }
});

async function equilibriumRevision() {
  const path='content/physics/ipst/equilibrium/4-2-exit-ticket-revision.html';
  const {document}=parseHTML(await readFile(new URL('../public/'+path,import.meta.url),'utf8'));
  Object.defineProperty(document,'URL',{value:'https://example.test/learning-hub/'+path});
  Object.defineProperty(document,'defaultView',{value:undefined});
  return document;
}

test('4.2 revision preserves the topic tools and keeps Recall inside Quiz in all 12 exports',async()=>{
  const {document:menu}=parseHTML(await readFile(new URL('../public/content/bank/physics/b-c54c2d76bc074671ec10618f.html',import.meta.url),'utf8'));
  assert.equal(menu.querySelector('nav').dataset.routeSlug,'centre-of-mass-and-gravity');
  const links=[...menu.querySelectorAll('a')];
  assert.deepEqual(links.map(a=>a.dataset.toolKey),['learning-sheet','quiz-set-1','cg-lab','exit-ticket-revision']);
  assert.equal(links.at(-1).dataset.contentId,'physics-ipst-equilibrium-4-2-exit-ticket-revision');
  assert.equal(links.at(-1).dataset.toolKind,'html');
  const source=await equilibriumRevision();
  assert.deepEqual(exitTicketRanges(source),['all','quiz','review']);
  assert.equal(source.documentElement.dataset.sourceSha256,'9485216bee0d8e1de8d45903f08b7ae2b5e9f3059f82272511424b56c9f687bf');
  assert.equal(source.querySelectorAll('script,template,iframe,form,button,input,select,[data-sheet-slot],[data-learning-activity-content]').length,0);
  assert.throws(()=>exitTicketPages(source,'recall'),/range/,'Recall is not a separate print range for this document');
  for(const language of ['th','en'])for(const answers of [false,true])for(const range of ['all','quiz','review']){
    applyContentLanguage(source,language);source.body.classList.toggle('answers-on',!answers);
    const before=source.documentElement.outerHTML;
    const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'4.1–4.2 revision'));
    assert.equal(prepareExitTicketPrint(copy,{range,answers}),range==='all'?8:4);
    assert.equal(copy.querySelectorAll('.page').length,range==='all'?8:4);
    assert.equal(copy.querySelectorAll('.unit').length,{all:39,quiz:7,review:32}[range]);
    assert.equal(new Set([...copy.querySelectorAll('.unit')].map(u=>u.dataset.unitKey)).size,copy.querySelectorAll('.unit').length);
    const quiz=range!=='review',review=range!=='quiz';
    assert.equal(copy.querySelectorAll('.question').length,quiz?4:0);
    assert.equal(copy.querySelectorAll('.blank').length,quiz?7:0);
    assert.equal(copy.querySelectorAll('.recall-card').length,quiz?4:0);
    assert.equal(copy.querySelectorAll('.response-space').length,!answers&&quiz?16:0);
    assert.equal(copy.querySelectorAll('.answer-inline,.teacher-key').length,answers&&quiz?15:0);
    assert.equal(copy.querySelectorAll('.worked-fbd').length,review?1:0,'retain one representative numerical example');
    assert.equal(copy.querySelectorAll('[data-hub-print-style],.hub-print-page').length,0);
    if(quiz){
      const units=[...copy.querySelectorAll('.unit')];
      assert.equal(units.findIndex(u=>u.querySelector('.recall-card')),units.findIndex(u=>u.dataset.group==='q4')+1);
    }
    assert.equal(source.documentElement.outerHTML,before,'print choices cannot change the teaching document');
    for(const img of copy.querySelectorAll('img')){
      assert.match(img.getAttribute('src'),/\/assets\/4-2\/exit-ticket\/[a-f0-9]+\.jpg$/);
      assert.ok(Number(img.getAttribute('width'))>0&&Number(img.getAttribute('height'))>0,'reserve original figure geometry before decoding');
    }
  }
});

test('4.2 reading covers cloze and Recall concepts without a numbered cloze key or parallel problem set',async()=>{
  const source=await equilibriumRevision();
  for(const language of ['th','en']){
    const view=source.querySelector(`[data-content-lang="${language}"] [data-revision-edition="blank"] [data-revision-range="all"]`);
    const reading=[...view.querySelectorAll('.unit[data-kind="review"]')];
    const text=reading.map(u=>u.textContent).join(' ');
    assert.doesNotMatch(text,/A[1-7]\s*[=:]/);
    assert.equal(reading.reduce((n,u)=>n+u.querySelectorAll('.recall-card,.response-space').length,0),0);
    assert.equal(reading.reduce((n,u)=>n+u.querySelectorAll('.worked-fbd').length,0),1);
    assert.ok(reading.reduce((n,u)=>n+u.querySelectorAll('.math-asset svg').length,0)>8);
    if(language==='en'){
      assert.match(text,/Static equilibrium/);assert.match(text,/Dynamic equilibrium/);
      assert.match(text,/uniform gravitational field/);assert.match(text,/fixed relative to the material/);
      assert.match(text,/net torque/);assert.match(text,/different objects/);
      assert.match(text,/two.*nonparallel|second, nonparallel/);
    }else{
      assert.match(text,/สมดุลสถิต/);assert.match(text,/สมดุลจลน์/);
      assert.match(text,/สนามโน้มถ่วงสม่ำเสมอ/);assert.match(text,/สองแนวที่ไม่ขนาน/);
    }
  }
});
