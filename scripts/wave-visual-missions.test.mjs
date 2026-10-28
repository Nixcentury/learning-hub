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
 assert.equal(M.scalar('reflection',{angle:30},400,300),null);close(M.scalar('reflection',{angle:30},450,200).re,M.scalar('reflection',{angle:30},350,200).re);
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
