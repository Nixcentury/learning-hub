import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const c=vm.createContext({});const base=new URL('../public/content/physics/ipst/wave-optics/assets/',import.meta.url);for(const f of ['10-2-lab/water-model.js','10-2-lab/model.js','wave-shared/screen-diagram.js','10-1-sim/model.js','10-1-sim/missions.js'])vm.runInContext(readFileSync(new URL(f,base),'utf8'),c);
const M=c.WaveMiniModel,Q=c.MiniWaveMissions,W=c.InterferenceWater,S=c.InterferenceScreen,O=c.DoubleSlitLabModel,close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const state=mode=>({...Q.setup(mode,0),mission:Q.initial()});
test('exact measure finds actual optical minima in both phases across settings, including maximum span',()=>{
 for(const color of ['green','red'])for(const slit of [50,100])for(const distance of [.5,1,2])for(const phase of [0,180]){const cfg={color,slit,distance},b=O.exactBounds(cfg,phase),{lambda,d,L}=O.physical(cfg);assert.ok(b.left<b.right&&b.right<40);close(O.intensity(cfg,b.left,phase),0);close(O.intensity(cfg,b.right,phase),0);if(phase===0)close(b.left,-b.right);else close(b.left,0);close(b.right,L*Math.tan(Math.asin((phase===0?.5:1)*lambda/d))*1000);}
});
test('shared water profile uses exact two-source paths and normalized mean intensity',()=>{
 for(const L of [6,10,60])for(const y of [-8,0,3,8])for(const phase of [0,180]){const spec={lambda:3,d:8,L,phase,extent:32},p={...W.initial(),L,x:y,phase},g=W.geometry(p);close(Math.abs(S.paths(spec,y).signed),g.delta);close(S.intensity(spec,y),g.amplitude*g.amplitude/4);}
});
test('all screen order guides attain constructive conditions; pi phase has no central bright order',()=>{
 for(const far of [false,true])for(const phase of [0,180]){const spec={lambda:3,d:8,L:10,phase,extent:100,far};for(const q of S.orders(spec)){close(S.intensity(spec,q.y),1);close(far?8*Math.sin(q.theta*Math.PI/180):S.paths(spec,q.y).signed,q.delta);if(phase===180)assert.notEqual(q.y,0);}close(S.intensity(spec,0),phase===0?1:0);}
 const pts=S.orders({lambda:3,d:8,L:10,phase:0,extent:16});for(const m of [-2,-1,0,1,2])assert.ok(pts.some(q=>q.m===m));
});
test('optical profile matches existing slit intensity including finite aperture envelope',()=>{
 for(const cfg of Object.values(O.presets))for(const phase of [0,180])for(const y of [-20,-5,0,5,20]){const p=O.physical(cfg),s={lambda:p.lambda*1000,d:p.d*1000,L:p.L*1000,a:p.a*1000,phase,far:true};close(S.intensity(s,y),O.intensity(cfg,y,phase));}
});
test('scalar refraction has continuous tangential phase; reflection has symmetric geometry',()=>{
 for(const n2 of [1,1.33,1.5])for(const angle of [0,30,60]){const p={angle,n1:1,n2,wavelength:600};for(const x of [30,250,600]){const a=M.scalar('refraction',p,x,245-1e-6),b=M.scalar('refraction',p,x,245);close(a.re,b.re,1e-6);close(a.im,b.im,1e-6);}}
 const g=M.reflectionGeometry({angle:30});assert.equal(M.scalar('reflection',{angle:30},400,g.wallY+1),null);close(M.scalar('reflection',{angle:30},450,200).re,M.scalar('reflection',{angle:30},350,200).re);
});
test('water reflection preserves wave speed, wavelength and wall phase with zero normal slope',()=>{
 for(const angle of [0,20,35,60,75]){
  const p={angle},g=M.reflectionGeometry(p);close(Math.hypot(g.kx,g.ky),2*Math.PI/g.spacing);close(g.incident.x,g.reflected.x);close(g.incident.y,-g.reflected.y);
  close(Math.atan2(g.incident.x,g.incident.y),M.rad(angle));close(Math.atan2(g.reflected.x,-g.reflected.y),M.rad(angle));
  for(const x of [20,237,400,697,780]){const q=M.reflection(p,x,g.wallY);close(q.re,Math.cos(g.kx*(x-g.originX)));close(q.im,Math.sin(g.kx*(x-g.originX)));close(q.dyRe,0);close(q.dyIm,0);}
 }
});
test('water surface lighting slopes match displacement and normal incidence has stationary nodes',()=>{
 for(const angle of [0,35,75])for(const [x,y] of [[70,30],[399,197],[680,330]]){
  const p={angle},g=M.reflectionGeometry(p),q=M.reflection(p,x,y),epsilon=1e-3;
  for(const axis of ['x','y']){const lo=M.reflection(p,x-(axis==='x'?epsilon:0),y-(axis==='y'?epsilon:0)),hi=M.reflection(p,x+(axis==='x'?epsilon:0),y+(axis==='y'?epsilon:0));for(const part of ['Re','Im'])close(q['d'+axis+part],(hi[part.toLowerCase()]-lo[part.toLowerCase()])/(2*epsilon),1e-8);}
  for(const t of [0,.13,.25,.5,.91])close(q.re*Math.cos(2*Math.PI*t)+q.im*Math.sin(2*Math.PI*t),Math.cos(g.kx*(x-g.originX)-2*Math.PI*t)*Math.cos(g.ky*(y-g.wallY)));
 }
 const g=M.reflectionGeometry({angle:0});for(const n of [0,1,2,3]){const q=M.reflection({angle:0},123,g.wallY-(n+.5)*g.spacing/2);close(q.re,0);close(q.im,0);}
});
test('reflection starts and resets missions with the water surface and optional front guides',()=>{
 for(const index of [0,1]){const v=Q.setup('reflection',index).visual;assert.equal(v.field,true);assert.equal(v.fronts,false);assert.equal(v.variables,true);assert.ok(M.visualValid(v));}
 for(const mode of ['refraction','interference','diffraction'])assert.equal(Q.setup(mode,0).visual.fronts,true);
});
test('all eight guided missions grade full correct responses and reject blank/wrong responses',()=>{
 for(const mode of Object.keys(M.defaults))for(const i of [0,1]){const s=state(mode);s.mission.index=i;Object.assign(s,Q.setup(mode,i));Q.observe(mode,s,true);Object.assign(s.params,Q.comparison(mode,i,'a'));Q.observe(mode,s);Object.assign(s.params,Q.comparison(mode,i,'b'));Q.observe(mode,s);if(mode==='interference'&&i===1)s.params.probe='side';assert.ok(Q.requirements(mode,s).every(([ok])=>ok));assert.ok(Q.grade(mode,s).every(ok=>!ok));Q.questions(mode,s).forEach((q,j)=>s.mission.answers[i]['q'+j]=String(q.answer));assert.ok(Q.grade(mode,s).every(Boolean));s.mission.answers[i].q0='wrong';assert.equal(Q.grade(mode,s)[0],false);assert.ok(Q.valid(s.mission));}
});
test('mission grading follows the current P and protects TIR from a fabricated numeric angle',()=>{
 const s=state('interference');s.mission.index=1;s.params.probe='custom';s.visual.x=.9;const g=W.geometry(M.water(s.params,s.visual));s.mission.answers[1]={q0:g.delta.toFixed(4),q1:'between'};assert.ok(Q.grade('interference',s).every(Boolean));s.visual.x=3;assert.equal(Q.grade('interference',s)[0],false);
 const r=state('refraction');r.params={angle:60,n1:1.5,n2:1,wavelength:600};assert.ok(Q.requirements('refraction',r).some(([ok])=>!ok));r.mission.answers[0].q0='0';assert.equal(Q.grade('refraction',r)[0],false);
});
test('visual/progress validators reject corrupt geometry, flags and answer structures',()=>{
 assert.ok(M.visualValid(M.visual()));for(const bad of [{L:NaN},{L:61},{x:9},{field:'yes'},{fronts:null}])assert.equal(M.visualValid({...M.visual(),...bad}),false);
 for(const bad of [{index:2},{answers:[{}, {q0:12}]},{seen:[{a:false,b:false,changed:false},{}]},{completed:[false]},{attempted:[true,'false']}])assert.equal(Q.valid({...Q.initial(),...bad}),false);
});
