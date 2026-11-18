import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
import {applyContentLanguage} from '../js/content-language.js';import {buildHtmlPrintSnapshot} from '../js/html-print.js';import {prepareExitTicketPrint,exitTicketPages} from '../js/exit-ticket-revision.js';
const base='content/physics/ipst/wave-optics/';
const files={classroom:base+'10-2-double-slit-classroom-note-v1-3.html',exit:base+'10-2-double-slit-exit-ticket-revision-v1-3.html'};
async function load(kind){const {document}=parseHTML(await readFile(new URL('../public/'+files[kind],import.meta.url),'utf8'));Object.defineProperty(document,'URL',{value:'https://example.test/learning-hub/'+files[kind]});Object.defineProperty(document,'defaultView',{value:undefined});return document;}
const view=(doc,lang,edition,range)=>doc.querySelector(`[data-content-lang="${lang}"] [data-revision-edition="${edition}"] [data-revision-range="${range}"]`);
function notes(node){return [...node.querySelectorAll('.shared-note')].map(n=>{const c=n.cloneNode(true);c.querySelectorAll('.identity').forEach(x=>x.remove());c.querySelectorAll('[data-title-th]').forEach(x=>x.removeAttribute('title'));c.querySelectorAll('img[src]').forEach(x=>x.setAttribute('src',x.getAttribute('src').replace(/^.*\/assets\//,'assets/')));return c.outerHTML;});}
test('double-slit: the complete canonical answer notes survive student printing in either language',async()=>{
 const classroom=await load('classroom'),exit=await load('exit');
 const model=Buffer.concat(await Promise.all(['notes.mjs','proofs.mjs','proof-figures.json','intro-v1.3.json','examples-v1.2.json','equation-starts.mjs','note-diagrams.mjs'].map(p=>readFile(new URL('../docs/learning-sheet/preparation/physics-double-slit-10-2/paired/'+p,import.meta.url)))));const sha=createHash('sha256').update(model).digest('hex');
 assert.equal(classroom.documentElement.dataset.sharedNotesSha256,sha);assert.equal(exit.documentElement.dataset.sharedNotesSha256,sha);
 for(const lang of ['th','en']){
  const canonical=notes(view(classroom,lang,'answers','all'));assert.equal(canonical.length,12);assert.equal(view(classroom,lang,'answers','all').querySelectorAll('.proof-diagram').length,2);assert.equal(view(classroom,lang,'answers','all').querySelectorAll('.example .method-note').length,12);
  const blankClassroom=view(classroom,lang,'blank','all');assert.equal(blankClassroom.querySelectorAll('.note-answer').length,0);assert.equal(blankClassroom.querySelectorAll('.example').length,12);
  for(const edition of ['blank','answers'])for(const range of ['all','review'])assert.deepEqual(notes(view(exit,lang,edition,range)),canonical);
  for(const kind of ['classroom','exit'])for(const answers of [false,true])for(const range of ['all','quiz','review']){
   const source=kind==='classroom'?classroom:exit;applyContentLanguage(source,lang);const before=source.documentElement.outerHTML;
   const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'10.2 paired handout'));const count=prepareExitTicketPrint(copy,{range,answers});
   assert.equal(count,kind==='classroom'?(range==='quiz'?6:range==='review'?6:12):range==='all'?(answers?25:20):range==='quiz'?(answers?13:8):12);
   assert.equal(copy.querySelectorAll('[data-content-lang]').length,1);assert.equal(copy.querySelectorAll('[data-revision-edition]').length,1);assert.equal(copy.querySelectorAll('.identity').length,1);assert.equal(exitTicketPages(copy).length,count);
   assert.equal(source.documentElement.outerHTML,before,'printing must not change the live lesson');
   if(kind==='exit'){
    assert.equal(copy.querySelectorAll('[data-unit-key^="problem-"]').length,range==='review'?0:9);
    assert.equal(copy.querySelectorAll('[data-recall-key]').length,range==='review'?0:14);
    if(range!=='quiz'){assert.deepEqual(notes(copy),canonical);assert.equal(copy.querySelectorAll('.shared-note .teacher-key,.shared-note .answer-inline').length,0);assert.equal(copy.querySelectorAll('.shared-note .example').length,12);}
   }
   if(!answers)assert.equal(copy.querySelectorAll('.teacher-key,.answer-inline').length,0);
   assert.equal(copy.querySelectorAll('script,iframe,form,button,template').length,0);
  }
 }
});
test('double-slit: menu links preserve existing tools and all visual assets are local',async()=>{
 const {document:menu}=parseHTML(await readFile(new URL('../public/content/bank/physics/b-21460452889578f11c3a8bac.html',import.meta.url),'utf8'));
 for(const [key,id] of [['classroom-note','classroom-note'],['exit-ticket-revision','exit-ticket-revision']]){const a=menu.querySelector(`[data-tool-key="${key}"]`);assert.equal(a.dataset.contentId,'physics-ipst-wave-optics-10-2-'+id);assert.equal(a.dataset.toolKind,'html');}
 for(const key of ['video-01','learning-sheet','quiz-set-1','double-slit-lab'])assert.ok(menu.querySelector(`[data-tool-key="${key}"]`));
 for(const kind of ['classroom','exit']){const d=await load(kind);assert.equal(d.querySelectorAll('script,[onload],[onerror],img[src^="http"],img[src^="data:"]').length,0);const paths=new Set([...d.querySelectorAll('img[src]')].map(i=>i.getAttribute('src')));for(const p of paths){assert.ok(p.startsWith('assets/'));await access(new URL('../public/'+base+p,import.meta.url));}}
});
test('double-slit: numerical reference cases include phase, inverse, ratios and signed separations',()=>{
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
 close(2*Math.PI*.006/600e-9/(2*Math.PI),10000); // complete phase cycles
 close((4*Math.PI/(2*Math.PI))*550e-9*1/.011,1e-4); // d from phase and x
 close((3e-3*.3e-3/1.5)/1e-9,600); // wavelength from three intervals
 close(1.5/(1.2*1.25),1);close(2/.8,2.5);
 close(2/(3-.5),.8);close(Math.abs(1.5-(-1))*4,10);close(Math.abs(3-(-3))*4,24);
 close((1.35-1.3)/1.3*100,3.8461538461538494);
 assert.ok(Math.abs(.5*.15/Math.sqrt(1-.15**2)*1000-75.9)<.05);
});
test('double-slit: classify fringes by rearranging the taught formula and checking integer m',async()=>{
 const doc=await load('classroom');
 for(const lang of ['th','en']){
  const full=view(doc,lang,'answers','all');
  const equations=[...full.querySelectorAll('[data-tex]')].map(e=>e.dataset.tex);
  assert.ok(equations.every(t=>!/(?<![A-Za-z])q(?![A-Za-z])/.test(t)),'do not add the auxiliary q');
  const first=full.querySelector('.example>.note-answer');
  const steps=[...first.querySelectorAll('[data-tex]')].map(e=>e.dataset.tex);
  assert.ok(steps.includes(String.raw`\Delta r=m\lambda\Rightarrow m=\Delta r/\lambda`));
  assert.ok(steps.includes(String.raw`\Delta r=(m-\tfrac12)\lambda\Rightarrow m=\Delta r/\lambda+\tfrac12`));
  assert.match(first.textContent,/จำนวนเต็ม|integer/);
  assert.ok(first.querySelectorAll('[data-tex]').length>=4);
  assert.match(full.querySelector('[data-note-key="observe"]').textContent,/คงเดิม|คงที่|constant|fixed|unchanged/);
 }
 const bright=distance=>distance/500,dark=distance=>distance/500+.5;
 assert.equal(bright(1500),3);assert.equal(dark(1250),3);assert.equal(Number.isInteger(bright(1250)),false);
 assert.equal(Number.isInteger(bright(1125)),false);assert.equal(Number.isInteger(dark(1125)),false);
});

test('double-slit: experiment precedes 15 numbered formulas, every formula precedes all 12 examples',async()=>{
 const classroom=await load('classroom');
 const texByLanguage={};
 for(const lang of ['th','en']){
  const full=view(classroom,lang,'answers','all');
  const intro=full.querySelector('[data-note-key="observe"]');
  assert.equal(intro.querySelectorAll('[data-tex]').length,0,'experiment introduction must not reveal equations before the theory');
  assert.equal(intro.querySelectorAll('.experiment-conclusions li').length,3);
  const lab=intro.querySelector('a[data-hub-simulation]');
  assert.equal(lab.dataset.contentId,'physics-ipst-wave-optics-10-2-double-slit-lab');
  assert.equal(lab.dataset.htmlSrc,'10-2-double-slit-lab.html');
  const boxes=[...full.querySelectorAll('[data-equation]')];
  assert.deepEqual(boxes.map(x=>Number(x.dataset.equation)),Array.from({length:15},(_,i)=>i+1));
  texByLanguage[lang]=boxes.map(x=>x.querySelector('[data-tex]').dataset.tex);
  const sequence=[...full.querySelectorAll('[data-equation],.example')];
  assert.ok(sequence.slice(0,15).every(x=>x.hasAttribute('data-equation')),'finish all theory before starting examples');
  assert.ok(sequence.slice(15).every(x=>x.classList.contains('example')));
  assert.ok(full.querySelector('.variable-table'));
  for(const item of full.querySelectorAll('[data-equation-ref]'))assert.ok(boxes.some(x=>x.dataset.equation===item.dataset.equationRef));
  for(const formula of full.querySelectorAll('[data-tex]'))assert.doesNotMatch(formula.dataset.tex,/\\beta/);
  for(const example of full.querySelectorAll('.example')){
   const answer=example.querySelector('.note-answer');
   const start=answer.querySelector('.equation-start');
   assert.ok(start);
   if(example.dataset.exampleNumber!=='11')assert.equal(start,answer.firstElementChild);
   assert.ok(start.querySelector('[data-equation-ref]'));
   assert.ok(start.querySelector('[data-tex]'),'state the referenced symbolic equation before numerical substitution');
  }
 }
 assert.deepEqual(texByLanguage.th,texByLanguage.en);
});

test('double-slit: original example questions and numerical workings survive equation citations and typography',async()=>{
 const current=await load('classroom');
 const original=JSON.parse(await readFile(new URL('../docs/learning-sheet/preparation/physics-double-slit-10-2/paired/examples-v1.2.json',import.meta.url),'utf8'));
 const normalize=t=>t.replaceAll('\\beta','\\Delta x').replace(/\\displaystyle\s*/g,'').replace(/\\begin\{aligned\}|\\end\{aligned\}/g,'').replace(/\\\\/g,'').replaceAll('&','').replace(/\s+/g,'');
 for(const lang of ['th','en']){
  const examples=[...view(current,lang,'answers','all').querySelectorAll('.example')];
  assert.equal(examples.length,12);
  for(let i=0;i<12;i++){
   const actual=examples[i],old=original.languages[lang][i];
   assert.equal(actual.querySelector('p').textContent,old.prompt,lang+' example '+(i+1)+' question');
   assert.equal(actual.querySelector('h3').textContent,old.title);
   if(actual.dataset.exampleNumber==='11')continue; // The full signed-coordinate calculations are checked below.
   const expected=[...old.html.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(m=>normalize(m[1].replaceAll(i===2?'|x_2|':i===3?'|x_m|':'__no_match__',i===2?'x_{\\mathrm B,2}':'x_{\\mathrm D,m}')));
   const found=[...actual.querySelectorAll('[data-tex]')].map(x=>normalize(x.dataset.tex));
   let previous=-1;
   for(const formula of expected){
    const next=found.findIndex((x,j)=>j>previous&&x===formula);
    assert.ok(next>=0,lang+' example '+(i+1)+' lost an original calculation: '+formula);previous=next;
   }
  }
 }
});

test('double-slit: example 11 explains fringe position before substituting signed coordinates',async()=>{
 const exit=await load('exit');
 for(const lang of ['th','en']){
  const answer=view(exit,lang,'blank','review').querySelector('[data-example-number="11"] .note-answer');
  const [signs,spacing,start,...cases]=answer.children;
  assert.ok(signs.matches('.method-note'));
  assert.match(signs.textContent,lang==='th'?/ด้านขวาเป็นบวกและด้านซ้ายเป็นลบ/:/positive to the right and negative to the left/);
  assert.match(spacing.textContent,lang==='th'?/กึ่งกลาง.*1\.5 ช่วง/:/halfway.*1\.5 spacings/);
  assert.equal(start.querySelector('[data-equation-ref]').dataset.equationRef,'14');
  assert.deepEqual(cases.map(item=>item.querySelector('[data-tex]').dataset.tex.match(/\|[^|]+\|.*=(2\.0|10|24)/)[0]),[
   '|(+6.0)-(+4.0)|\\,\\mathrm{mm}=2.0',
   '|(+6.0)-(-4.0)|\\,\\mathrm{mm}=10',
   '|(+12)-(-12)|\\,\\mathrm{mm}=24',
  ]);
 }
});

test('double-slit: original Exit questions, figures and calculations remain intact; all calculated solutions cite theory',async()=>{
 const current=await load('exit');
 const {document:before}=parseHTML(await readFile(new URL('../public/content/physics/ipst/wave-optics/10-2-double-slit-exit-ticket-revision-v1-2.html',import.meta.url),'utf8'));
 const normalize=t=>t.replace(/\\displaystyle\s*/g,'').replace(/\\begin\{aligned\}|\\end\{aligned\}/g,'').replace(/\\\\/g,'').replaceAll('&','').replace(/\s+/g,'');
 for(const lang of ['th','en']){
  for(const edition of ['blank','answers']){
   const old=view(before,lang,edition,'all'),now=view(current,lang,edition,'all');
   const oldUnits=[...old.querySelectorAll('.unit')],units=[...now.querySelectorAll('.unit')];
   assert.deepEqual(units.map(x=>x.dataset.unitKey),oldUnits.map(x=>x.dataset.unitKey));
   for(let i=0;i<units.length;i++){
    const clean=node=>{const copy=node.cloneNode(true);copy.querySelectorAll('.teacher-key,.answer-inline').forEach(x=>x.remove());return copy.outerHTML;};
    assert.equal(clean(units[i]),clean(oldUnits[i]),lang+'/'+edition+'/'+units[i].dataset.unitKey+' question or figure changed');
    if(edition!=='answers')continue;
    const original=[...oldUnits[i].querySelectorAll('[data-tex]')].map(x=>normalize(x.dataset.tex));
    const actual=[...units[i].querySelectorAll('[data-tex]')].map(x=>normalize(x.dataset.tex));
    let previous=-1;
    for(const formula of original){const next=actual.findIndex((x,j)=>j>previous&&x===formula);assert.ok(next>=0,lang+'/'+units[i].dataset.unitKey+' lost calculation '+formula);previous=next;}
   }
   for(const solution of now.querySelectorAll('[data-solution-key]')){
    if(!solution.querySelector('[data-tex]'))continue;
    assert.ok(solution.querySelector('.equation-start [data-equation-ref]'),solution.dataset.solutionKey+' needs an initial equation reference');
   }
  }
 }
});


test('double-slit: added Notes diagrams use local, pre-rendered MathJax labels', async () => {
 const visuals = [
  ['.measurement-visual', String.raw`x_{\mathrm{first}}`, String.raw`\dfrac{0.2}{5.0}\times100\%=4\%`],
  ['.worked-visual[data-visual-example="10"]', String.raw`\mathrm{D}_3`, String.raw`2.5\lambda_1=2\lambda_2`],
  ['.worked-visual[data-visual-example="11"]', String.raw`\mathrm{D}_2`, String.raw`24\,\mathrm{mm}`],
  ['.worked-visual[data-visual-example="12"]', String.raw`\theta\approx8.63^\circ`, String.raw`x=L\tan\theta`],
 ];
 const checked = new Set();
 for (const kind of ['classroom','exit']) {
  const doc = await load(kind);
  for (const lang of ['th','en']) for (const edition of ['blank','answers']) {
   const selected = view(doc,lang,edition,'all');
   for (const [selector,...formulas] of visuals) {
    const figure = selected.querySelector(selector);
    assert.ok(figure, `${kind}/${lang}/${edition} needs ${selector}`);
    assert.ok(figure.querySelector('figcaption').textContent.trim().length > 10);
    const image = figure.querySelector('img.diagram-svg');
    const src = image.getAttribute('src');
    assert.match(src, /^assets\/10-2-paired\/[a-f0-9]{24}\.svg$/);
    assert.ok(image.getAttribute('alt').trim());
    if (checked.has(src)) continue;
    checked.add(src);
    const svg = await readFile(new URL('../public/'+base+src,import.meta.url),'utf8');
    assert.match(svg, /<svg\b[^>]*viewBox=/);
    assert.doesNotMatch(svg, /<(?:script|foreignObject|text)\b|(?:href|src)="https?:\/\//i);
    const {document} = parseHTML(`<html><body>${svg}</body></html>`);
    const labels = new Map([...document.querySelectorAll('svg[data-tex]')].map(node => [node.getAttribute('data-tex'),node]));
    for (const formula of formulas) assert.ok(labels.get(formula)?.querySelector('path'), `Missing MathJax paths for ${formula}`);
   }
  }
 }
});
