import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {createSimulationProgressBridge} from '../js/simulation-progress-bridge.js';
import {waveAssessmentModel as Q,waveAssessmentContentId,readWaveAssessmentPayload} from '../public/shared/wave-assessment-progress.js';
const base='../public/content/physics/ipst/wave-optics/';
const code=name=>readFileSync(new URL(base+'assets/'+name,import.meta.url),'utf8');
const state=()=>({mission:Q.initial(),params:{},visual:{}});
const complete=(mode,index)=>Object.fromEntries(Q.parts(mode,index).map(p=>[p.key,String(p.answer)]));
const allWork=()=>Object.fromEntries(Q.modes.map(mode=>[mode,state()]));

test('24 main questions have exactly four dropdown concepts and two numeric calculations per mode, with 40 total points',()=>{
 let total=0;
 for(const mode of Q.modes){const s=state(),questions=[];for(const i of [0,1]){s.mission.index=i;questions.push(...Q.questions(mode,s));assert.equal(Q.questions(mode,s).length,3);}
  assert.deepEqual(questions.map(q=>q.id),['q1','q2','q3','q4','q5','q6']);
  assert.equal(questions.filter(q=>q.kind==='understanding').length,4);assert.equal(questions.filter(q=>q.kind==='calculation').length,2);
  for(const q of questions){assert.ok(q.parts.length>=2&&q.parts.length<=3);assert.ok(q.parts.every(p=>p.type===(q.kind==='calculation'?'number':'choice')));assert.equal(q.parts.reduce((n,p)=>n+p.ticks,0)/2,q.kind==='calculation'?3:1);for(const lang of [0,1])assert.ok(q.text[lang]&&q.parts.every(p=>p.text[lang]));}
  total+=questions.reduce((n,q)=>n+q.parts.reduce((v,p)=>v+p.ticks,0),0)/2;
 }
 assert.equal(total,40);
});

test('numerical keys independently match reflection, Snell, critical angle, path difference and wavelength calculations',()=>{
 const expected={reflection:[[62,62],[42,48]],refraction:[[Math.asin(1/3)*180/Math.PI,2,360],[2/3,Math.asin(2/3)*180/Math.PI]],interference:[[3.75,1.5],[3,9]],diffraction:[[625,.625],[1800,4]]};
 for(const mode of Q.modes)for(const i of [0,1]){const fields=Q.parts(mode,i).filter(p=>p.type==='number');assert.equal(fields.length,expected[mode][i].length);fields.forEach((p,j)=>assert.ok(Math.abs(p.answer-expected[mode][i][j])<1e-8));}
});

test('partial credit, latest checked scores and best scores are separate and derived from responses',()=>{
 const work=allWork();
 for(const mode of Q.modes)for(const i of [0,1]){const s=work[mode];s.mission.index=i;assert.equal(Q.evaluate(mode,i,{}).score,0);s.mission.answers[i]=complete(mode,i);Q.check(mode,s);assert.equal(Q.evaluate(mode,i,s.mission.checkedAnswers[i]).score,5);assert.ok(Q.valid(s.mission,mode));}
 assert.equal(Q.summary(work).best,40);assert.equal(Q.summary(work).answered,24);
 const s=work.reflection;s.mission.index=0;s.mission.answers[0]['q1-a']='away';Q.check('reflection',s);
 assert.equal(Q.summary(work).score,39.5);assert.equal(Q.summary(work).best,40);assert.equal(Q.summary(work).answered,24);
 s.mission.answers[0]['q1-b']='';Q.check('reflection',s);assert.equal(Q.summary(work).answered,23);
 for(const invalid of ['NaN','Infinity','0x3e','62°','6,2',' '])assert.equal(Q.evaluate('reflection',0,{'q3-a':invalid}).rows[2].fields[0].correct,false);
 assert.equal(Q.evaluate('refraction',1,{'q6-b':'41.81'}).rows[2].fields[1].correct,true);
 assert.equal(Q.evaluate('refraction',1,{'q6-b':'41.84'}).rows[2].fields[1].correct,false);
});

test('changing exploration parameters never changes fixed question data or invalidates checked scores',()=>{
 for(const mode of Q.modes){const s=state();for(const i of [0,1]){s.mission.index=i;const before=JSON.stringify(Q.questions(mode,s));s.mission.answers[i]=complete(mode,i);Q.check(mode,s);s.params={angle:75,n1:1.5,n2:1,phase:180,wavelength:700};s.visual.x=7;assert.equal(JSON.stringify(Q.questions(mode,s)),before);assert.equal(Q.evaluate(mode,i,s.mission.checkedAnswers[i]).score,5);}}
});

test('record merge keeps the newest draft and latest checked attempt while preserving the best attempt',()=>{
 const work=allWork();work.reflection.mission.answers[0]=complete('reflection',0);work.reflection.mission.editedAt[0]=10;Q.check('reflection',work.reflection);work.reflection.mission.checkedAt[0]=11;
 const a=Q.record(work,'reflection',12),b=structuredClone(a);b.updatedAt=20;b.missions.reflection.answers[0]['q1-a']='away';b.missions.reflection.editedAt[0]=20;b.missions.reflection.checkedAnswers[0]={...b.missions.reflection.answers[0]};b.missions.reflection.checkedAt[0]=21;b.missions.reflection.bestAnswers[0]={};
 const merged=Q.mergeRecords(a,b);assert.equal(merged.missions.reflection.answers[0]['q1-a'],'away');assert.equal(Q.evaluate('reflection',0,merged.missions.reflection.checkedAnswers[0]).score,4.5);assert.equal(Q.evaluate('reflection',0,merged.missions.reflection.bestAnswers[0]).score,5);
 assert.ok(Q.validRecord(merged));assert.deepEqual(readWaveAssessmentPayload({payload:JSON.stringify(merged)}),merged);assert.equal(readWaveAssessmentPayload({payload:'broken'}),null);
 for(const mutate of [r=>r.revision='old',r=>r.missions.reflection.answers[0].unexpected='x',r=>r.missions.reflection.answers[0]['q1-a']='invalid-option',r=>r.missions.reflection.bestAnswers[0]['q3-a']='x'.repeat(81),r=>r.missions.reflection.checkedAt[0]=NaN]){const bad=structuredClone(merged);mutate(bad);assert.equal(Q.validRecord(bad),false);}
});

function harness(storage=new Map()){
 const html=readFileSync(new URL(base+'10-1-wave-properties-mini-sim.html',import.meta.url),'utf8');
 const {document,window:domWindow}=parseHTML(html);
 Object.defineProperty(domWindow.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(v){for(const o of this.querySelectorAll('option'))o.removeAttribute('selected');const target=[...this.querySelectorAll('option')].find(o=>o.value===String(v));if(target)target.setAttribute('selected','');}});
 const listeners={},messages=[],timers=new Map();let clock=100,id=0;
 const parent={postMessage:m=>messages.push(m)};
 const context=vm.createContext({console,URL,document,structuredClone,location:{origin:'https://school.test'},parent,
  matchMedia:()=>({matches:true}),requestAnimationFrame(){},ResizeObserver:class{observe(){}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  setTimeout:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},clearTimeout:key=>timers.delete(key),
  Date:class extends Date{static now(){return ++clock;}},
  WaveMiniView:{invalidate(){},draw(){}},InterferenceScreen:{draw:()=>({orders:[],intensity:0})}});
 context.window=context;context.addEventListener=(type,fn)=>(listeners[type]||=[]).push(fn);
 for(const name of ['10-2-lab/water-model.js','10-1-sim/model.js','10-1-sim/missions.js','10-1-sim/sim.js','10-1-sim/guided.js','10-1-sim/storage.js'])vm.runInContext(code(name),context);
 const click=id=>document.getElementById(id).click();
 const input=(id,value,type='input')=>{const n=document.getElementById(id);n.value=String(value);n.dispatchEvent(new domWindow.Event(type));};
 const message=m=>{for(const fn of listeners.message||[])fn({source:parent,origin:'https://school.test',data:m});};
 const fill=(mode,index)=>{for(const [k,v] of Object.entries(complete(mode,index)))input('assessment-'+k,v,Q.parts(mode,index).find(p=>p.key===k).type==='choice'?'change':'input');};
 return {context,document,storage,messages,timers,click,input,fill,message,api:context.LearningHubSimulation};
}

test('real question UI preserves drafts across A/B, modes and reset, gives partial feedback without answer text, and resumes local work',()=>{
 const h=harness();h.click('mission-answer-toggle');assert.equal(h.document.querySelectorAll('[data-main-question]').length,3);h.fill('reflection',0);h.click('mission-check');
 assert.match(h.document.getElementById('mission-heading').textContent,/5\/10/);
 assert.equal(h.document.querySelectorAll('.answer-feedback.correct').length,6);
 assert.doesNotMatch(h.document.getElementById('mission-result').textContent,/62|42|48/);
 assert.equal(h.document.getElementById('mission-next').disabled,false);h.input('assessment-q3-a','','input');assert.equal(h.document.getElementById('mission-next').disabled,true);h.click('mission-b');assert.equal(h.document.getElementById('mission-next').disabled,true);h.input('assessment-q3-a','0','input');h.click('mission-check');assert.equal(h.document.getElementById('mission-next').disabled,false);h.fill('reflection',0);h.click('mission-check');
 const before=h.api.getState().work.reflection.mission.answers[0];h.click('mission-b');assert.deepEqual(h.api.getState().work.reflection.mission.answers[0],before);h.click('reset');assert.deepEqual(h.api.getState().work.reflection.mission.answers[0],before);
 h.click('mission-next');assert.equal(h.api.getState().work.reflection.mission.index,1);h.click('tab-refraction');h.click('tab-reflection');assert.equal(h.api.getState().work.reflection.mission.index,1);
 const next=harness(h.storage);assert.equal(next.api.getState().work.reflection.mission.index,1);assert.deepEqual(JSON.parse(JSON.stringify(next.api.getState().work.reflection.mission.answers[0])),complete('reflection',0));assert.match(next.document.getElementById('mission-heading').textContent,/5\/10/);
 assert.equal(next.document.querySelector('[id^="solution-"]'),null);
});

test('local records separate signed-in accounts from each other and from guest work',async()=>{
 const h=harness();h.click('mission-answer-toggle');h.fill('reflection',0);h.click('mission-check');
 h.message({type:'learning-hub-context',language:'th',identity:{uid:'user-a'}});assert.equal(h.context.WaveMiniBridge.read().identity,'user-a');assert.equal(h.api.getState().work.reflection.mission.answers[0]['q1-a'],undefined);
 h.click('mission-answer-toggle');h.input('assessment-q1-a','toward','change');
 h.message({type:'learning-hub-context',language:'th',identity:{uid:'user-b'}});assert.equal(h.api.getState().work.reflection.mission.answers[0]['q1-a'],undefined);
 h.message({type:'learning-hub-context',language:'th',identity:{uid:'user-a'}});assert.equal(h.api.getState().work.reflection.mission.answers[0]['q1-a'],'toward');
 h.message({type:'learning-hub-context',language:'th',identity:{uid:'guest'}});assert.equal(h.api.getState().work.reflection.mission.checkedAnswers[0]['q1-a'],'toward');
 assert.ok([...h.storage.keys()].some(k=>k.endsWith(':user-a')));await Promise.resolve();
});

test('trusted simulation storage binds uid and activity, ignores foreign frames, and suppresses late account replies',async()=>{
 let session={uid:'student-a',epoch:1};const source={},registered=new Set([source]),replies=[],writes=[];let resolveRead;
 const handle=createSimulationProgressBridge({origin:'https://school.test',getSession:()=>session,getContentId:s=>registered.has(s)?waveAssessmentContentId:null,read:()=>new Promise(resolve=>resolveRead=resolve),write:async(path,value,current)=>{if(current())writes.push({path,value});return value;},reply:(s,value)=>replies.push(value)});
 const value=Q.record(allWork(),'reflection',1),base={origin:'https://school.test',source,data:{type:'learning-hub-simulation-save',requestId:'r1',uid:'student-a',contentId:waveAssessmentContentId,value}};
 await handle({...base,origin:'https://foreign.test'});await handle({...base,source:{}});await handle({...base,data:{...base.data,uid:'other'}});assert.equal(writes.length,0);
 await handle(base);assert.equal(writes.length,1);assert.equal(writes[0].path,'quizProgress/simulation-wave-10-1-assessment-20261107/student-a');assert.equal(replies.at(-1).ok,true);
 const pending=handle({...base,data:{...base.data,type:'learning-hub-simulation-load'}});session={uid:'student-b',epoch:2};resolveRead(value);await pending;assert.equal(replies.length,1);
 session={uid:'student-a',epoch:3};const pendingAgain=handle({...base,data:{...base.data,type:'learning-hub-simulation-load'}});registered.clear();resolveRead(value);await pendingAgain;assert.equal(replies.length,1);
});

test('account load and save responses preserve edits made while requests are in flight and schedule the next sync',async()=>{
 const h=harness(),tick=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
 h.message({type:'learning-hub-context',language:'th',identity:{uid:'account'}});
 const load=h.messages.find(m=>m.type==='learning-hub-simulation-load');assert.ok(load);
 h.click('mission-answer-toggle');h.input('assessment-q1-a','away','change');const focused=h.document.getElementById('assessment-q1-a');
 const remoteWork=allWork();remoteWork.reflection.mission.answers[0]=complete('reflection',0);remoteWork.reflection.mission.editedAt[0]=1;Q.check('reflection',remoteWork.reflection);remoteWork.reflection.mission.checkedAt[0]=2;
 const remote=Q.record(remoteWork,'reflection',3);
 h.message({type:'learning-hub-simulation-storage-result',requestId:load.requestId,uid:'account',contentId:waveAssessmentContentId,ok:true,value:remote});await tick();
 assert.equal(h.document.getElementById('assessment-q1-a'),focused);assert.equal(focused.value,'away');assert.equal(h.context.MiniWaveMissions.summary(h.context.WaveMiniBridge.read().work).best,5);
 h.context.WaveAssessmentStorage.flush();const save=h.messages.findLast(m=>m.type==='learning-hub-simulation-save');assert.ok(save);
 h.input('assessment-q1-b','toward','change');
 h.message({type:'learning-hub-simulation-storage-result',requestId:save.requestId,uid:'account',contentId:waveAssessmentContentId,ok:true,value:save.value});await tick();
 assert.equal(h.document.getElementById('assessment-q1-b').value,'toward');assert.ok([...h.timers.values()].some(t=>t.delay===600));
 const local=JSON.parse([...h.storage.entries()].find(([k])=>k.endsWith(':account'))[1]);assert.equal(local.missions.reflection.answers[0]['q1-b'],'toward');assert.equal(Q.evaluate('reflection',0,local.missions.reflection.bestAnswers[0]).score,5);
});
