import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../public/content/physics/ipst/wave-optics/assets/10-2-lab/model.js',import.meta.url),'utf8'),context);
const M=context.DoubleSlitLabModel,close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('A/B/C retain book separations and 1m geometry with explicitly chosen wavelengths',()=>{
  assert.equal(M.presets.A.color,'green');assert.equal(M.presets.A.slit,50);assert.equal(M.presets.B.slit,100);assert.equal(M.presets.C.color,'red');
  for(const p of Object.values(M.presets)){assert.equal(p.distance,1);assert.ok(M.validConfig(p));}
  assert.equal(M.wavelengths.green,532);assert.equal(M.wavelengths.red,650);
});
test('preset spacing agrees with independent SI calculations and the required A/B/C comparisons',()=>{
  close(M.theory(M.presets.A).spacing,10.64);close(M.theory(M.presets.B).spacing,5.32);close(M.theory(M.presets.C).spacing,6.5);
  close(M.theory(M.presets.A).spacing/M.theory(M.presets.B).spacing,2);assert.ok(M.theory(M.presets.C).spacing>M.theory(M.presets.B).spacing);
});
test('both central dark boundaries are intensity zeros, and their span agrees with the small-angle formula',()=>{
  for(const color of ['green','red'])for(const slit of [50,100])for(const distance of [.5,1,2]){
    const c={color,slit,distance},t=M.theory(c);
    assert.ok(M.intensity(c,t.firstDark)<1e-25);assert.ok(M.intensity(c,-t.firstDark)<1e-25);
    assert.ok(Math.abs(t.widthExact/t.spacing-1)<.00003);
  }
});
test('intensity is bounded and symmetric, with unit central peak and finite-slit missing orders',()=>{
  for(const c of Object.values(M.presets)){
    close(M.intensity(c,0),1);
    for(let x=-40;x<=40;x+=.31){const i=M.intensity(c,x);assert.ok(i>=0&&i<=1);close(i,M.intensity(c,-x));}
    const {lambda,L,a}=M.physical(c),x=L*Math.tan(Math.asin(lambda/a))*1000;
    assert.ok(M.intensity(c,x)<1e-24);
  }
});
test('doubling screen distance doubles the pattern positions at the same physical scale',()=>{
  for(const c of Object.values(M.presets)){
    close(M.theory({...c,distance:2}).spacing,2*M.theory(c).spacing);
    for(const x of [-12,-3,0,7,16])close(M.intensity({...c,distance:2},2*x),M.intensity(c,x));
  }
});
test('inverse wavelength calculation preserves units and scales with a student measurement',()=>{
  for(const c of Object.values(M.presets)){close(M.inferLambda(c,M.theory(c).spacing),M.wavelengths[c.color]);close(M.inferLambda(c,M.theory(c).spacing*1.1),M.wavelengths[c.color]*1.1);}
  close(M.inferLambda({color:'green',slit:100,distance:1},5),500);
});
test('zoom changes only the display mapping and preserves signed physical coordinates',()=>{
  for(const zoom of [1,2,4])for(const x of [-40,-8,-2.66,0,3.25,40])close(M.screenToPosition(M.positionToScreen(x,zoom),zoom),x);
  close(M.positionToScreen(0,1),400);close(M.positionToScreen(5,2)-400,2*(M.positionToScreen(5,1)-400));
});
test('recording requires both markers, positive order and room for another record',()=>{
  const s={cursors:{left:-5.3,right:5.3},moved:{left:false,right:false},records:[]};assert.equal(M.canRecord(s),false);
  s.moved.left=true;assert.equal(M.canRecord(s),false);s.moved.right=true;assert.equal(M.canRecord(s),true);
  s.cursors.left=6;assert.equal(M.canRecord(s),false);s.cursors.left=-5.3;s.records=Array(30).fill({});assert.equal(M.canRecord(s),false);
});
test('snapshot validation rejects malformed identity, geometry and historical measurements',()=>{
  const s={version:1,identity:'guest',config:{...M.presets.A},zoom:1,cursors:{left:-5.32,right:5.32},moved:{left:true,right:true},records:[{id:1,config:{...M.presets.B},cursors:{left:-2.66,right:2.66}}],formula:false,analysis:false,exercise:false,solution:false};
  assert.equal(M.validSnapshot(s,'guest'),true);assert.equal(M.validSnapshot(s,'other'),false);
  for(const mutate of [x=>x.config.distance=NaN,x=>x.config.color='blue',x=>x.config.slit=80,x=>x.zoom=3,x=>x.cursors.left=Infinity,x=>x.cursors.right=41,x=>x.records.push(x.records[0]),x=>x.records[0].cursors.left=8,x=>x.moved.left='true']){const copy=structuredClone(s);mutate(copy);assert.equal(M.validSnapshot(copy,'guest'),false);}
});

test('light Check-out binds each question to its two recorded readings and uses displayed precision',()=>{
  vm.runInContext(readFileSync(new URL('../public/content/physics/ipst/wave-optics/assets/10-2-lab/light-activity.js',import.meta.url),'utf8'),context);
  const A=context.DoubleSlitLightActivity;
  const record=(id,trial,w,extra={})=>({id,config:A.trials[trial].config,cursors:{left:-w/2,right:w/2},phase:0,source:'manual',...extra});
  const trials=[record(1,'A1',10.65),record(2,'B1',5.31),record(3,'C1',6.49),record(4,'B2',10.62),record(5,'C2',12.99)];
  const observations=A.latestReadings([...trials,record(6,'B1',5.32,{source:'model'}),record(7,'B1',7,{phase:180}),record(8,'B1',2,{cursors:{left:1,right:3}})]);
  assert.deepEqual(Object.keys(observations),['A1','B1','C1','B2','C2']);
  assert.equal(observations.B1.id,6);
  assert.equal(observations.B1.source,'model');
  for(const [index,trend] of ['narrower','wider','wider'].entries()){
    assert.equal(A.evidence(A.comparisons[index],observations).trend,trend);
  }
  const slits=A.comparisons[0];
  assert.equal(A.evidence(slits,A.latestReadings(trials.filter(r=>r.id!==2))),null);
  const equalWidths=A.latestReadings([...trials,record(9,'B1',10.6501)]);
  assert.equal(A.evidence(slits,equalWidths).trend,'same');
  assert.notEqual(A.evidence(slits,equalWidths).key,A.evidence(slits,observations).key);
  assert.equal(A.trialKey({color:'green',slit:50,distance:2}),undefined);
  close(M.inferLambda(observations.C2.config,Number(A.width(observations.C2))),649.5);
});

const labSource=new URL('../public/content/physics/ipst/wave-optics/',import.meta.url);
const storageKey=identity=>'learning-hub:double-slit:smart-v1:'+identity;
async function openLightLab(mirror=new Map(),indexed=new Map()){
  const {document}=parseHTML(readFileSync(new URL('10-2-double-slit-lab.html',labSource),'utf8'));
  const node=id=>document.getElementById(id);
  const active=[];
  function simulateElement(element){
    element.focus=()=>active.push(element.id);
    element.scrollIntoView=()=>{};
    if(element.localName==='select')Object.defineProperty(element,'value',{
      configurable:true,get(){return this.testValue;},set(value){this.testValue=String(value);},
    });
    return element;
  }
  document.querySelectorAll('[id]').forEach(simulateElement);
  const createElement=document.createElement.bind(document);
  document.createElement=(...args)=>simulateElement(createElement(...args));
  for(const dialog of document.querySelectorAll('dialog')){
    dialog.showModal=()=>{dialog.open=true;};
    dialog.close=()=>{dialog.open=false;};
  }
  const db={
    transaction(){
      const transaction={objectStore(){return {
        get(key){
          const request={};
          queueMicrotask(()=>{request.result=indexed.get(key);request.onsuccess();});
          return request;
        },
        put(value,key){
          indexed.set(key,structuredClone(value));
          queueMicrotask(()=>transaction.oncomplete());
        },
      };}};
      return transaction;
    },
  };
  const context=vm.createContext({
    document,structuredClone,
    localStorage:{getItem:key=>mirror.get(key),setItem:(key,value)=>mirror.set(key,value)},
    indexedDB:{open(){
      const request={result:db};
      queueMicrotask(()=>request.onsuccess());
      return request;
    }},
    DoubleSlitLabPlot:{draw(){},cursors(){}},
    addEventListener(){},print(){},ResizeObserver:class{observe(){}},
    setTimeout:(fn,delay)=>{if(delay===0)queueMicrotask(fn);},clearTimeout(){},
  });
  context.window=context;context.parent=context;
  for(const name of ['model.js','storage.js','light-activity.js','app.js']){
    const file=new URL('assets/10-2-lab/'+name,labSource);
    vm.runInContext(readFileSync(file,'utf8'),context,{filename:name});
  }
  await new Promise(resolve=>setImmediate(resolve));
  return {node,click:id=>node(id).onclick(),active,api:context.LearningHubSimulation,activity:context.DoubleSlitLightActivity};
}

test('confirmed reset replaces both old backups for the current user and reloads into a new round',async()=>{
  const first=await openLightLab();
  const empty=first.api.getState();
  const old={...empty,view:'water',lightPhase:180,zoom:4,
    water:{running:false},missions:{completed:[0,1,2,3,4,5]},student:{name:'Previous student'},
    records:[{id:41,config:{...M.presets.B},cursors:{left:-2.66,right:2.66}}],
    checkout:{slits:{key:'some old width',value:'same'}},checkoutOpen:true,nextRecordId:42};
  const key=storageKey('guest');
  const other=storageKey('other-student');
  const savedAt=Date.now()+50000;
  const mirror=new Map([[key,JSON.stringify({schema:1,savedAt:savedAt-1,snapshot:old})],[other,'other account data']]);
  const indexed=new Map([[key,{schema:1,savedAt,snapshot:old}],[other,{keep:true}]]);
  const app=await openLightLab(mirror,indexed);
  assert.equal(app.api.getState().records[0].id,41);
  assert.equal(app.node('mission-answer').open,true);
  app.click('activity-reset');
  assert.equal(app.node('activity-reset-dialog').open,true);
  app.click('activity-reset-cancel');
  assert.equal(app.api.getState().records.length,1);
  app.click('activity-reset');
  app.click('activity-reset-confirm');
  await app.api.flushLocal();
  const cleared=app.api.getState();
  assert.equal(cleared.records.length,0);
  assert.equal(cleared.nextRecordId,1);
  assert.equal(cleared.zoom,1);
  assert.equal(cleared.config.slit,50);
  assert.equal(cleared.checkoutOpen,false);
  assert.deepEqual(Object.keys(cleared.checkout),[]);
  for(const key of ['water','missions','student'])assert.equal(Object.hasOwn(cleared,key),false);
  for(const value of [JSON.parse(mirror.get(key)),indexed.get(key)]){
    assert.ok(value.savedAt>savedAt);
    assert.equal(value.snapshot.records.length,0);
    assert.equal(Object.hasOwn(value.snapshot,'missions'),false);
  }
  assert.equal(mirror.get(other),'other account data');
  assert.equal(indexed.get(other).keep,true);
  const reloaded=await openLightLab(mirror,indexed);
  assert.equal(reloaded.api.getState().records.length,0);
  assert.equal(reloaded.node('trend-slits').disabled,true);
  assert.equal(reloaded.node('record').disabled,true);
});

test('floating helper points to the real next control without changing experiment settings or answers',async()=>{
  const app=await openLightLab();
  const start=app.api.getState();
  assert.equal(app.node('light-guide-panel').hidden,false);
  app.click('light-guide-close');
  assert.equal(app.node('light-guide-panel').hidden,false);
  assert.equal(app.node('light-guide-go').hidden,true);
  app.click('light-guide-hide');
  assert.equal(app.node('light-guide-panel').hidden,true);
  assert.equal(app.node('light-guide-toggle').hidden,false);
  app.click('light-guide-toggle');
  app.click('light-guide-go');
  assert.equal(app.node('light-guide-panel').hidden,false);
  assert.equal(app.node('light-guide-go').hidden,false);
  assert.equal(app.active.at(-1),'handle-left');
  assert.equal(app.node('handle-left').classList.contains('light-guide-target'),true);
  assert.deepEqual(app.api.getState(),start);
  const records=app.activity.firstTrials.map((key,index)=>({
    id:index+1,config:app.activity.trials[key].config,cursors:M.exactBounds(app.activity.trials[key].config),
  }));
  assert.equal(app.api.restoreState({...start,records,nextRecordId:5}),true);
  app.click('light-guide-toggle');
  app.click('light-guide-go');
  assert.equal(app.active.at(-1),'trend-slits');
  assert.equal(app.node('mission-answer').open,true);
  assert.equal(app.node('trend-slits').value,'');
  for(const [id,value] of [['slits','narrower'],['colour','wider'],['screen','wider']]){
    app.node('trend-'+id).value=value;
    app.node('trend-'+id).onchange();
  }
  app.click('light-guide-toggle');
  app.click('light-guide-go');
  assert.equal(app.active.at(-1),'return-heading');
  app.click('guide-after-lesson');
  app.click('light-guide-go');
  assert.equal(app.active.at(-1),'preset-C');
  assert.equal(app.api.getState().config.color,'green');
  app.click('preset-C');
  app.click('language');
  app.click('light-guide-toggle');
  assert.match(app.node('light-guide-step').textContent,/2 m/);
  assert.match(app.node('light-guide-step').textContent,/Set the screen distance/);
  app.click('light-guide-go');
  assert.equal(app.active.at(-1),'distance');
  assert.equal(app.api.getState().config.distance,1);
  const before=app.api.getState();
  const repeat=app.activity.trials.C2.config;
  assert.equal(app.api.restoreState({...before,records:[...before.records,{id:5,config:repeat,cursors:M.exactBounds(repeat)}]}),true);
  app.click('light-guide-toggle');
  assert.match(app.node('light-guide-step').textContent,/Measurements complete/);
  app.click('light-guide-go');
  assert.equal(app.active.at(-1),'records-heading');
});


test('Exact measurement places both markers, waits for Record and labels its provenance',async()=>{
  const app=await openLightLab();
  assert.equal(app.node('record').disabled,true);
  app.click('exact-measurement');
  assert.equal(app.node('reading-width').textContent,'10.64 mm');
  assert.equal(app.node('record').disabled,false);
  assert.equal(app.api.getState().records.length,0);
  assert.equal(app.api.getState().autoMeasured,true);
  app.click('record');
  assert.equal(app.api.getState().records[0].source,'model');
  assert.equal(app.activity.latestReadings(app.api.getState().records).A1.id,1);
  app.click('preset-B');
  app.click('exact-measurement');
  app.click('record');
  assert.equal(app.node('trend-slits').disabled,false);
  assert.match(app.node('trials-slits').textContent,/10\.64 mm.*5\.32 mm/);
  app.click('exact-measurement');
  const tweaked=app.node('handle-left').ownerDocument.querySelector('[data-side="left"]');
  tweaked.onclick();
  app.click('record');
  assert.equal(app.api.getState().records.at(-1).source,'manual');
});
