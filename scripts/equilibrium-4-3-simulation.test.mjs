import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

const base=new URL('../public/content/physics/ipst/equilibrium/',import.meta.url);
const html=fs.readFileSync(new URL('4-3-translational-equilibrium-simulation.html',base),'utf8');
const scripts=['model.js','missions.js','app.js'].map(f=>fs.readFileSync(new URL('assets/4-3/'+f,base),'utf8'));
const modelContext=vm.createContext({});vm.runInContext(scripts[0]+'\nglobalThis.model=Equilibrium43Model;',modelContext);
const M=modelContext.model,close=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);

test('zero resultant preserves both stationary and non-zero velocities; force changes do not reset velocity',()=>{
  for(const vx of [0,2,-3]){const b={x:1,y:2,vx,vy:4},end=M.advance(b,{x:0,y:0},2,2);close(end.vx,vx);close(end.vy,4);close(end.x,1+2*vx);}
  let b={x:0,y:0,vx:0,vy:0};b=M.advance(b,{x:2,y:0},2,2);close(b.vx,2);
  b=M.advance(b,{x:0,y:0},2,2);close(b.vx,2);b=M.advance(b,{x:-2,y:0},2,1);close(b.vx,1);
});
test('piecewise exact integration is independent of frame rate',()=>{
  for(const fps of [30,60,120]){let b={x:0,y:0,vx:2,vy:-1};for(let j=0;j<fps*2;j++)b=M.advance(b,{x:4,y:2},2,1/fps);close(b.x,8);close(b.y,0);close(b.vx,6);close(b.vy,1);}
});
test('support force responds to downward pressing, not fixed to the weight',()=>{
  close(M.table(2,0).normal,20);close(M.table(2,20).normal,40);close(M.table(2,20).weight,20);
});
test('the 3-4-5 vector triangle closes; removing its third force leaves a 5 N resultant',()=>{
  const first=[{x:3,y:0},{x:0,y:4}];assert.ok(M.balanced(M.sum([...first,M.vector(5,233.13010235415598)])));close(M.magnitude(M.sum(first)),5);
});
test('rope tensions balance in both axes for symmetric and asymmetric angles',()=>{
  for(const a of [15,20,30,60,75])for(const b of [15,30,50,75]){const r=M.ropes(60,a,b);assert.ok(r.left>0&&r.right>0);assert.ok(M.balanced(M.sum(r.forces)));}
  close(M.ropes(60,30,30).left,60);close(M.ropes(60,60,60).left,20*Math.sqrt(3));
});
test('static friction is the required value below its limit; sliding uses kinetic friction',()=>{
  const a=M.incline(20),b=M.incline(30);assert.equal(a.resting,true);close(a.friction,20*Math.sin(20*Math.PI/180));assert.ok(a.friction<a.limit);close(a.acceleration,0);
  assert.equal(b.resting,false);close(b.friction,.3*b.normal);assert.ok(b.down>b.limit);assert.ok(b.acceleration>0);
  const threshold=M.incline(Math.atan(.5)*180/Math.PI);assert.equal(threshold.resting,true);
});

function app(storage=new Map()){
  const {document,HTMLElement}=parseHTML(html);HTMLElement.prototype.focus=function(){};Object.defineProperty(document,'visibilityState',{value:'visible'});
  const queue=[],events={};let clock=0;
  const context=vm.createContext({document,URLSearchParams,structuredClone,confirm:()=>true,location:{search:'',origin:'https://qa.invalid'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:fn=>queue.push(fn),addEventListener:(event,fn)=>events[event]=fn,print:()=>{}});
  context.window=context;context.parent=context;scripts.forEach(source=>vm.runInContext(source,context));
  const click=selector=>{const n=document.querySelector(selector);assert.ok(n,selector);assert.equal(n.disabled,false,selector+' should be enabled');n.onclick();};
  const predict=index=>click(`#prediction button:nth-of-type(${index+1})`);
  const answer=(question,option)=>click(`[data-question="${question}"] .options button:nth-child(${option+1})`);
  const run=key=>click(`[data-observation="${key}"]`);
  const tick=seconds=>{for(let i=0;i<=Math.ceil(seconds*60);i++){const fn=queue.shift();assert.ok(fn);fn(clock);clock+=1000/60;}};
  return {document,api:context.LearningHubSimulation,click,predict,answer,run,tick,events,context,storage};
}
function completeFirst(a){a.predict(0);a.run('two');a.run('press');a.answer(0,2);a.answer(1,0);}
function cartSetup(a,duration,velocity,left=2,right=2){
  for(const [id,value] of [['duration',duration],['initialVelocity',velocity]]){const input=a.document.getElementById(id);input.value=String(value);input.onchange();}
  for(const [id,value] of [['left',left],['right',right]]){const input=a.document.getElementById(id);input.value=String(value);input.oninput();}
}
test('15-second balanced trials preserve moving, stationary and leftward initial velocities and stop exactly',()=>{
  for(const velocity of [3,0,-2]){
    const a=app();completeFirst(a);a.click('#next');a.predict(2);cartSetup(a,15,velocity);a.click('#play');a.tick(15.2);
    const s=a.api.getState();close(s.time,15);close(s.body.vx,velocity);close(s.body.x,15*velocity);assert.equal(s.lastCartTrial.duration,15);close(s.lastCartTrial.initialVelocity,velocity);close(s.lastCartTrial.finalVelocity,velocity);close(s.lastCartTrial.resultantX,0);
    assert.match(a.document.getElementById('cartSummary').textContent,velocity===0?/ยังอยู่นิ่ง/:/ความเร็วเดิม/);
    a.tick(2);close(a.api.getState().time,15);close(a.api.getState().body.x,15*velocity);
    a.click('#language');assert.match(a.document.getElementById('cartSummary').textContent,/15 s complete/);a.click('#print');assert.match(a.document.getElementById('record').textContent,/15 s complete/);
    const reloaded=app(a.storage);close(reloaded.api.getState().controls.initialVelocity,velocity);assert.equal(reloaded.api.getState().controls.duration,15);close(reloaded.api.getState().lastCartTrial.finalVelocity,velocity);
  }
});
test('configured interval supports acceleration, stopping and reversal without resetting speed when force changes',()=>{
  const a=app();completeFirst(a);a.click('#next');a.predict(2);cartSetup(a,15,3,0,2);a.click('#play');a.tick(15.2);close(a.api.getState().body.vx,18);close(a.api.getState().body.x,157.5);
  const left=a.document.getElementById('left');left.value='2';left.oninput();close(a.api.getState().body.vx,18);
  a.click('#restart');close(a.api.getState().body.vx,3);close(a.api.getState().time,0);
  cartSetup(a,15,3,4,2);a.click('#play');a.tick(15.2);close(a.api.getState().body.vx,-12);assert.equal(a.api.getState().lastCartTrial.resultantX,-2);
});
test('invalid numeric controls do not run; legacy snapshots gain defaults and corrupt trial metadata is rejected',()=>{
  const a=app();completeFirst(a);a.click('#next');a.predict(2);
  for(const bad of ['',0,61,1.5,'NaN']){a.document.getElementById('duration').value=String(bad);a.click('#play');a.tick(.2);close(a.api.getState().time,0);assert.equal(a.document.getElementById('duration').getAttribute('aria-invalid'),'true');}
  a.document.getElementById('duration').value='15';a.document.getElementById('initialVelocity').value='21';a.click('#play');a.tick(.2);close(a.api.getState().time,0);
  const legacy=a.api.getState();delete legacy.controls.duration;delete legacy.controls.initialVelocity;delete legacy.lastCartTrial;assert.equal(a.api.restoreState(legacy),true);assert.equal(a.api.getState().controls.duration,2);assert.equal(a.api.getState().controls.initialVelocity,0);
  const valid=a.api.getState();for(const bad of [{...valid,controls:{...valid.controls,duration:0}},{...valid,controls:{...valid.controls,initialVelocity:Infinity}},{...valid,lastCartTrial:{duration:15,initialVelocity:3,finalVelocity:3,resultantX:99}}])assert.equal(a.api.restoreState(bad),false);
});
test('changing forces during a trial does not falsely claim zero resultant throughout',()=>{
  const a=app();completeFirst(a);a.click('#next');a.predict(2);cartSetup(a,2,3);a.click('#play');a.tick(.6);const left=a.document.getElementById('left');left.value='0';left.oninput();a.tick(2);
  assert.equal(a.api.getState().lastCartTrial.resultantX,null);assert.match(a.document.getElementById('cartSummary').textContent,/เปลี่ยนแรงระหว่าง/);assert.doesNotMatch(a.document.getElementById('cartSummary').textContent,/ความเร็วเดิม/);
});
test('prediction required; actual observations unlock questions; wrong answers can be corrected',()=>{
  const a=app();assert.equal(a.document.querySelector('[data-observation="two"]').disabled,true);assert.equal(a.document.querySelectorAll('[data-question]').length,0);
  a.predict(0);a.run('two');assert.equal(a.document.querySelectorAll('[data-question]').length,0);a.run('press');a.answer(0,0);a.answer(1,0);assert.equal(a.api.getState().completed[0],false);
  assert.match(a.document.querySelector('[data-question="0"] .feedback').textContent,/ลองอีกครั้ง/);a.answer(0,2);assert.equal(a.api.getState().completed[0],true);
  // A mistaken prediction does not block learning after observation and explanation.
  assert.equal(a.api.getState().predictions[0],0);
});
test('all five experiments and final questions complete through the actual app handlers',()=>{
  const a=app();completeFirst(a);a.click('#next');a.predict(0);
  a.run('accelerate');a.tick(2.2);close(a.api.getState().body.vx,2);a.run('coast');a.tick(2.2);close(a.api.getState().body.vx,2);a.run('brake');a.tick(2.2);close(a.api.getState().body.vx,0);
  a.answer(0,0);a.answer(1,1);a.click('#next');a.predict(1);a.run('closed');a.tick(1.2);close(a.api.getState().body.vx,0);a.run('open');a.tick(1.2);close(Math.hypot(a.api.getState().body.vx,a.api.getState().body.vy),5);
  a.answer(0,2);a.answer(1,0);a.click('#next');a.predict(0);for(const k of ['shallow','steep','asymmetric'])a.run(k);a.answer(0,1);a.answer(1,2);
  a.click('#next');a.predict(1);a.run('stick');a.tick(1.2);close(a.api.getState().body.vx,0);a.run('slide');a.tick(1.2);assert.ok(a.api.getState().body.vx>0);a.answer(0,2);a.answer(1,0);
  a.click('#next');[1,0,2,1].forEach((answer,index)=>a.answer(index,answer));assert.equal(a.api.getState().completed.filter(Boolean).length,6);assert.match(a.document.getElementById('progress').textContent,/6\/6/);
  a.click('#language');assert.match(a.document.getElementById('progress').textContent,/Completed 6\/6/);a.click('#print');assert.equal(a.document.querySelectorAll('#record section').length,6);assert.equal(a.document.querySelectorAll('#record .record-question').length,19);
  const reloaded=app(a.storage);assert.equal(reloaded.api.getState().completed.filter(Boolean).length,6);close(reloaded.api.getState().body.vx,2);
});
test('restore rejects corrupt, out-of-range, unknown-observation and cross-identity data',()=>{
  const a=app(),s=a.api.getState();assert.equal(a.api.restoreState(s),true);
  for(const bad of [{...s,identityKey:'another-student'},{...s,mission:5},{...s,time:NaN},{...s,controls:{...s.controls,alpha:0}},{...s,predictions:[99,null,null,null,null,null]},{...s,observations:[{two:{readings:[['unknown',2,'N']]}},{},{},{},{},{}]}])assert.equal(a.api.restoreState(bad),false);
});
test('identity and origin boundaries keep guest and signed-in progress separate',()=>{
  const a=app();completeFirst(a);const guest=a.api.getState();a.events.message({source:{},origin:'https://qa.invalid',data:{type:'learning-hub-context',identity:{uid:'student'}}});assert.equal(a.api.getState().identityKey,'guest');
  a.events.message({source:a.context,origin:'https://wrong.invalid',data:{type:'learning-hub-context',identity:{uid:'student'}}});assert.equal(a.api.getState().identityKey,'guest');
  // In a VM, resolve the exact in-context parent identity for the event source.
  const parent=vm.runInContext('parent',a.context);a.events.message({source:parent,origin:'https://qa.invalid',data:{type:'learning-hub-context',identity:{uid:'qa-student'},language:'en'}});assert.equal(a.api.getState().identityKey,'qa-student');assert.equal(a.api.getState().completed[0],false);assert.equal(a.api.restoreState(guest),false);
});
