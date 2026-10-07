import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../public/content/physics/sound/12-1/12-1-1-sound-particle-sim.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const context=vm.createContext({});
vm.runInContext(scripts[0]+'\nglobalThis.model=SoundModel;',context);
const M=context.model;
const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} differs from ${expected}`);

test('standalone scripts parse and activity identity stays stable',()=>{
  scripts.forEach(source=>new vm.Script(source));
  assert.equal(scripts.length,3);
  assert.match(html,/data-activity-id="phys-sound-12-1-1-particle-sim"/);
});
test('wavelength, period and propagation obey c = f lambda across hearing bands',()=>{
  for(const f of [1,10,20,500,20000,25000,40000]){
    const p=M.parameters(f);close(p.wavelength*f,343);close(p.period*f,1);
    const before=M.at(.27,1.14,f),after=M.at(.47,1.14+.2*M.TAU,f);
    close(before.displacement,after.displacement);close(before.pressure,after.pressure);
  }
});
test('pressure equals minus bulk modulus times spatial displacement gradient, also for a pulse',()=>{
  const dq=1e-6;
  for(const mode of ['continuous','pulse'])for(const f of [10,500,25000])for(const q of [.23,.75,1.46]){
    const phase=5.17,p=M.parameters(f);
    const derivative=(M.at(q+dq,phase,f,mode).displacement-M.at(q-dq,phase,f,mode).displacement)/(2*dq*p.wavelength);
    close(M.at(q,phase,f,mode).pressure,-M.bulk*derivative,1e-7);
  }
});
test('reported particle velocity is the time derivative of displacement',()=>{
  const dPhase=1e-6;
  for(const mode of ['continuous','pulse'])for(const f of [10,500,25000]){
    const q=.61,phase=4.77,dt=dPhase/M.parameters(f).omega;
    const derivative=(M.at(q,phase+dPhase,f,mode).displacement-M.at(q,phase-dPhase,f,mode).displacement)/(2*dt);
    close(M.at(q,phase,f,mode).velocity,derivative,1e-9);
  }
});
test('compression, rarefaction and turning point have correct displacement and velocity',()=>{
  const q=.75, f=500;
  for(const [theta,s,p] of [[Math.PI/2,0,1],[3*Math.PI/2,0,-1],[0,1,0],[Math.PI,-1,0]]){
    const r=M.at(q,M.TAU*q-theta,f);close(r.displacementNorm,s);close(r.pressureNorm,p);
    close(r.velocity,p/(M.rho*M.c));assert.ok(r.absolutePressure>0);
  }
});
test('guided stop hits the requested phase from arbitrary starting frames without jumping backwards',()=>{
  for(const start of [-7.31,0,.43,20.21,157.7])for(const theta of [0,Math.PI/2,3*Math.PI/2]){
    const end=M.nextStop(start,.75,theta);assert.ok(end-start>=.8*M.TAU-1e-12);
    close(Math.sin(M.TAU*.75-end),Math.sin(theta));close(Math.cos(M.TAU*.75-end),Math.cos(theta));
    const result=M.advance(end-.01,1/30,1,end);close(result.phase,end);assert.equal(result.reached,true);
  }
});
test('animation advances the same physical phase at different refresh rates',()=>{
  for(const rate of [1,.25])for(const fps of [30,60,120,144]){
    let phase=0;for(let frame=0;frame<fps*2;frame++)phase=M.advance(phase,1/fps,rate).phase;
    close(phase,2*M.TAU*rate);
  }
});
test('reference hearing bands include the two stated human boundary frequencies',()=>{
  for(const [f,band] of [[10,'infra'],[19,'infra'],[20,'audible'],[500,'audible'],[20000,'audible'],[20001,'ultra'],[25000,'ultra']])assert.equal(M.band(f),band);
});

// Lightweight DOM adapter tests the real mission handlers and persistence without
// substituting physics or relying on a browser. This is not visual browser QA.
function runApp(storage=new Map()) {
  class Element {
    constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';this.classList={toggle(){}};}
    append(...children){this.children.push(...children);}
    replaceChildren(...children){this.children=children;}
    setAttribute(key,value){this.attributes[key]=value;}
    getBoundingClientRect(){return {width:700,height:430};}
    getContext(){return new Proxy({},{get:()=>()=>{},set:()=>true});}
  }
  const nodes=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const events={},queue=[];
  const app=vm.createContext({
    structuredClone,devicePixelRatio:1,confirm:()=>true,
    location:{origin:'http://localhost'},parent:{postMessage(){}},
    document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),documentElement:{},querySelectorAll:()=>[]},
    localStorage:{setItem:(key,value)=>storage.set(key,value),getItem:key=>storage.get(key)},
    requestAnimationFrame:callback=>queue.push(callback),ResizeObserver:class{observe(){}},
    addEventListener:(name,callback)=>events[name]=callback,
  });
  app.window=app;scripts.forEach(source=>vm.runInContext(source,app));
  let clock=0;
  function tick(seconds=3){for(let i=0;i<=seconds*60;i++){queue.shift()(clock);clock+=1000/60;}}
  const api=app.LearningHubSimulation;
  const click=id=>nodes.get(id).onclick();
  const observe=key=>nodes.get('observeButtons').children.find(b=>b.dataset.observe===key).onclick();
  const answer=(question,option)=>nodes.get('questions').children[question].children[1].children[option].onclick();
  return {nodes,api,events,click,observe,answer,tick,storage};
}
test('all four missions require observations, reveal feedback and complete through the real handlers',()=>{
  const a=runApp();
  assert.equal(a.nodes.get('questions').children.length,0);
  a.observe('motion');a.tick();assert.equal(a.nodes.get('questions').children.length,2);
  a.answer(0,0);assert.match(a.nodes.get('questions').children[0].children[2].textContent,/ยังไม่ตรง/);
  a.answer(0,1);a.answer(1,0);assert.equal(a.nodes.get('nextMission').hidden,false);a.click('nextMission');
  a.observe('compression');a.tick();assert.match(a.nodes.get('probeReadings').children[1].textContent,/Δp = 1 Pa/);
  a.answer(0,1);a.answer(1,1);a.click('nextMission');
  a.observe('rarefaction');a.tick();assert.match(a.nodes.get('probeReadings').children[1].textContent,/Δp = -1 Pa/);
  assert.equal(a.nodes.get('questions').children.length,0);
  a.observe('turn');a.tick();assert.match(a.nodes.get('probeReadings').children[3].textContent,/u = 0/);
  a.answer(0,0);a.answer(1,1);a.click('nextMission');
  for(const key of ['infra','audible','ultra','vacuum'])a.observe(key);
  assert.equal(a.api.getState().medium,'vacuum');assert.match(a.nodes.get('bandTitle').textContent,/ไม่มีคลื่นเสียง/);
  a.answer(0,0);a.answer(1,1);a.answer(2,1);a.answer(3,1);assert.match(a.nodes.get('progress').textContent,/4\/4/);
  a.click('langButton');assert.equal(a.nodes.get('progress').textContent,'4/4 missions completed');
  const reloaded=runApp(a.storage);assert.match(reloaded.nodes.get('progress').textContent,/4\/4/);
  assert.equal(reloaded.api.getState().medium,'vacuum');
});
test('saved zero values and pulse position survive restore; wrong identity and corrupt state are rejected',()=>{
  const a=runApp(), original=a.api.getState();
  assert.equal(original.phase,0);assert.equal(a.api.restoreState(original),true);
  assert.equal(a.api.restoreState({...original,identityKey:'another-student'}),false);
  assert.equal(a.api.restoreState({...original,frequency:0}),false);
  assert.equal(a.api.restoreState({...original,observations:null}),false);
  a.click('pulseButton');a.tick(1);a.click('playButton');
  const saved=a.api.getState(),reloaded=runApp(a.storage),restored=reloaded.api.getState();
  close(saved.phase,restored.phase);close(saved.pulseStart,restored.pulseStart);
  close(M.at(.5,saved.phase,saved.frequency,saved.mode,saved.pulseStart).pressure,M.at(.5,restored.phase,restored.frequency,restored.mode,restored.pulseStart).pressure);
});
