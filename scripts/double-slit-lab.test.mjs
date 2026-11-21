import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
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

test('light Check-out binds each question to its two manual readings and uses displayed precision',()=>{
  vm.runInContext(readFileSync(new URL('../public/content/physics/ipst/wave-optics/assets/10-2-lab/light-activity.js',import.meta.url),'utf8'),context);
  const A=context.DoubleSlitLightActivity;
  const record=(id,trial,w,extra={})=>({id,config:A.trials[trial].config,cursors:{left:-w/2,right:w/2},phase:0,source:'manual',...extra});
  const trials=[record(1,'A1',10.65),record(2,'B1',5.31),record(3,'C1',6.49),record(4,'B2',10.62),record(5,'C2',12.99)];
  const observations=A.latestReadings([...trials,record(6,'B1',5.32,{source:'model'}),record(7,'B1',7,{phase:180}),record(8,'B1',2,{cursors:{left:1,right:3}})]);
  assert.deepEqual(Object.keys(observations),['A1','B1','C1','B2','C2']);
  assert.equal(observations.B1.id,2);
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
