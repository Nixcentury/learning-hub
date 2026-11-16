import test from 'node:test';import assert from 'node:assert/strict';import {readFile,access} from 'node:fs/promises';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
import {applyContentLanguage} from '../js/content-language.js';import {buildHtmlPrintSnapshot} from '../js/html-print.js';import {prepareExitTicketPrint,exitTicketPages} from '../js/exit-ticket-revision.js';
const base='content/physics/ipst/wave-optics/';
const files={classroom:base+'10-2-double-slit-classroom-note-v1-2.html',exit:base+'10-2-double-slit-exit-ticket-revision-v1-2.html'};
async function load(kind){const {document}=parseHTML(await readFile(new URL('../public/'+files[kind],import.meta.url),'utf8'));Object.defineProperty(document,'URL',{value:'https://example.test/learning-hub/'+files[kind]});Object.defineProperty(document,'defaultView',{value:undefined});return document;}
const view=(doc,lang,edition,range)=>doc.querySelector(`[data-content-lang="${lang}"] [data-revision-edition="${edition}"] [data-revision-range="${range}"]`);
function notes(node){return [...node.querySelectorAll('.shared-note')].map(n=>{const c=n.cloneNode(true);c.querySelectorAll('.identity').forEach(x=>x.remove());c.querySelectorAll('img[src]').forEach(x=>x.setAttribute('src',x.getAttribute('src').replace(/^.*\/assets\//,'assets/')));return c.outerHTML;});}
test('double-slit: the complete canonical answer notes survive student printing in either language',async()=>{
 const classroom=await load('classroom'),exit=await load('exit');
 const model=Buffer.concat(await Promise.all(['notes.mjs','proofs.mjs','proof-figures.json'].map(p=>readFile(new URL('../docs/learning-sheet/preparation/physics-double-slit-10-2/paired/'+p,import.meta.url)))));const sha=createHash('sha256').update(model).digest('hex');
 assert.equal(classroom.documentElement.dataset.sharedNotesSha256,sha);assert.equal(exit.documentElement.dataset.sharedNotesSha256,sha);
 for(const lang of ['th','en']){
  const canonical=notes(view(classroom,lang,'answers','all'));assert.equal(canonical.length,9);assert.equal(view(classroom,lang,'answers','all').querySelectorAll('[data-note-key$="-proof"] .proof-diagram').length,2);assert.equal(view(classroom,lang,'answers','all').querySelectorAll('.example .method-note').length,12);
  const blankClassroom=view(classroom,lang,'blank','all');assert.equal(blankClassroom.querySelectorAll('.note-answer').length,0);assert.equal(blankClassroom.querySelectorAll('.example').length,12);
  for(const edition of ['blank','answers'])for(const range of ['all','review'])assert.deepEqual(notes(view(exit,lang,edition,range)),canonical);
  for(const kind of ['classroom','exit'])for(const answers of [false,true])for(const range of ['all','quiz','review']){
   const source=kind==='classroom'?classroom:exit;applyContentLanguage(source,lang);const before=source.documentElement.outerHTML;
   const {document:copy}=parseHTML(buildHtmlPrintSnapshot(source,'10.2 paired handout'));const count=prepareExitTicketPrint(copy,{range,answers});
   assert.equal(count,kind==='classroom'?(range==='quiz'?6:9):range==='all'?17:range==='quiz'?8:9);
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
  assert.match(full.querySelector('[data-note-key="observe"]').textContent,/คงที่|constant/);
 }
 const bright=distance=>distance/500,dark=distance=>distance/500+.5;
 assert.equal(bright(1500),3);assert.equal(dark(1250),3);assert.equal(Number.isInteger(bright(1250)),false);
 assert.equal(Number.isInteger(bright(1125)),false);assert.equal(Number.isInteger(dark(1125)),false);
});
