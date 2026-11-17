import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const c=vm.createContext({structuredClone});for(const f of ['model.js','water-model.js','missions.js'])vm.runInContext(readFileSync(new URL('../public/content/physics/ipst/wave-optics/assets/10-2-lab/'+f,import.meta.url),'utf8'),c);
const W=c.InterferenceWater,Q=c.InterferenceMissions,M=c.DoubleSlitLabModel,close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const fresh=()=>({water:W.initial(),missions:Q.initial(),records:[]});
test('water geometry uses exact signed-source distances and stable absolute path difference',()=>{
 for(const L of [6,24,60])for(const x of [-8,0,3,8]){const p={...W.initial(),L,x},g=W.geometry(p);close(g.r1,Math.sqrt(L*L+(x+4)**2));close(g.delta,Math.abs(g.r1-g.r2));close(g.delta,W.geometry({...p,x:-x}).delta);assert.ok(g.delta<p.separation);}
 close(W.geometry(W.initial()).delta,0);
});
test('source phase reversal exchanges centre node and antinode without changing geometry',()=>{
 const a=W.geometry(W.initial()),b=W.geometry({...W.initial(),phase:180});assert.equal(a.kind,'antinode');assert.equal(b.kind,'node');close(a.amplitude,2);close(b.amplitude,0);close(a.delta,b.delta);
});
test('example point attains half a wavelength while arbitrary points may be between loci',()=>{
 const p={...W.initial(),L:12};p.x=W.pointForDelta(p,1.5);close(W.geometry(p).delta,1.5);assert.equal(W.geometry(p).kind,'node');assert.equal(W.geometry({...p,phase:180}).kind,'antinode');assert.equal(W.geometry({...p,x:.9}).kind,'between');assert.equal(W.pointForDelta({...p,L:60,separation:4,wavelength:4},2),null);
});
test('every drawn hyperbola has its prescribed exact path difference and phase classification',()=>{
 for(const phase of [0,180])for(const kind of ['node','antinode']){const p={...W.initial(),phase};for(const line of W.loci(p,kind))for(const L of [.5,12,60]){const x=W.locusY(p,line.delta,L),g=W.geometry({...p,L,x});close(g.delta,line.delta);assert.equal(g.kind,kind);}}
});
test('far-screen and small-angle approximations approach the exact value and handle zero',()=>{
 const near=W.geometry({...W.initial(),L:6,x:6}),far=W.geometry({...W.initial(),L:60,x:6});assert.ok(Math.abs(far.angular-far.delta)<Math.abs(near.angular-near.delta));assert.ok(Math.abs(far.small-far.delta)<Math.abs(near.small-near.delta));assert.ok(near.small>near.angular);const zero=W.geometry(W.initial());close(zero.angular,0);close(zero.small,0);
});
test('water view mappings and state validation preserve physical units and reject malformed inputs',()=>{
 for(const L of [6,24,60])for(const x of [-8,0,8]){const p=W.screen(L,x),r=W.fromScreen(p.x,p.y);close(r.L,L);close(r.x,x);}
 assert.ok(W.valid(W.initial()));for(const bad of [{x:NaN},{L:0},{phase:90},{running:'true'},{layers:{fronts:true}}])assert.equal(W.valid({...W.initial(),...bad}),false);
});
test('pi-shifted light has a dark centre while the original in-phase pattern remains unchanged',()=>{
 for(const p of Object.values(M.presets)){close(M.intensity(p,0,0),1);assert.ok(M.intensity(p,0,180)<1e-25);const x=M.theory(p).firstDark;assert.ok(M.intensity(p,x,180)>.8);}
});
test('missions 1/2 require experiment actions as well as phase-appropriate answers',()=>{
 const s=fresh();assert.ok(Q.requirements(s).some(r=>!r[0]));s.missions.played[0]=true;s.missions.answers[0].q0='antinode';assert.ok(Q.requirements(s).every(r=>r[0]));assert.ok(Q.grade(s).every(Boolean));s.missions.current=1;s.missions.answers[1].q0='node';assert.ok(Q.requirements(s).some(r=>!r[0]));s.water.phase=180;s.water.layers.nodes=true;s.missions.played[1]=true;assert.ok(Q.requirements(s).every(r=>r[0]));assert.ok(Q.grade(s).every(Boolean));
});
test('point mission grades live path differences and accepts between-locus classification',()=>{
 const s=fresh();s.missions.current=2;s.water.x=.9;s.water.layers.paths=true;s.missions.answers[2]={q0:W.geometry(s.water).delta.toFixed(4),q1:'between',q2:'1'};assert.ok(Q.grade(s).every(Boolean));s.missions.answers[2].q1='node';assert.equal(Q.grade(s)[1],false);s.missions.answers[2].q0='';assert.equal(Q.grade(s)[0],false);
});
test('approximation and A/B/C missions require both comparisons and in-phase records',()=>{
 const s=fresh();s.missions.current=3;s.missions.answers[3]={q0:'far',q1:'small',q2:'.8'};s.missions.near=true;assert.ok(Q.requirements(s).some(r=>!r[0]));s.missions.far=true;Object.assign(s.water,{L:60,x:6});s.water.layers.formulas=true;Q.observe(s);assert.ok(Q.requirements(s).every(r=>r[0]));assert.ok(Q.grade(s).every(Boolean));s.missions.current=4;s.records=Object.values(M.presets).map((config,i)=>({id:i+1,config:{...config},cursors:{left:-1,right:1},phase:0}));s.missions.answers[4]={q0:'half',q1:'C'};assert.ok(Q.requirements(s).every(r=>r[0]));s.records[2].phase=180;assert.ok(Q.requirements(s).some(r=>!r[0]));assert.ok(Q.grade(s).every(Boolean));
});
test('wavelength mission grades the student measurement, not the configured laser answer',()=>{
 const s=fresh();s.missions.current=5;s.records=[{id:1,config:{...M.presets.B},cursors:{left:-2.5,right:2.5},phase:0}];s.missions.answers[5].q0='500';assert.ok(Q.grade(s)[0]);s.missions.answers[5].q0='532';assert.equal(Q.grade(s)[0],false);
});
test('touch tolerance marks a point near a locus without changing its exact physical classification',()=>{
 const s=fresh();s.missions.current=2;s.water.L=12;s.water.x=W.pointForDelta(s.water,1.53);assert.equal(W.geometry(s.water).kind,'between');assert.equal(W.nearKind(s.water),'node');s.missions.answers[2]={q0:'1.53',q1:'node',q2:'1'};assert.ok(Q.grade(s).every(Boolean));
});
test('mission progress snapshots reject duplicates, invalid answer shapes and nonboolean evidence',()=>{
 assert.ok(Q.valid(Q.initial()));for(const bad of [{current:6},{completed:[0,0]},{near:'true'},{answers:[]},{attempted:[true]}])assert.equal(Q.valid({...Q.initial(),...bad}),false);
});

test('all 12 questions retain the original six missions and require student-set experiment evidence',()=>{
 const s=fresh();assert.equal(Q.counts.reduce((a,b)=>a+b,0),12);
 s.missions.current=2;Object.assign(s.water,{wavelength:2,separation:8,L:12,phase:0});s.water.layers.paths=true;s.water.x=W.pointForDelta(s.water,1);Q.observe(s);
 assert.ok(Q.requirements(s).every(([done])=>done));assert.ok(s.missions.evidence.path);assert.equal(Q.questions(2,s).length,3);
 s.missions.current=3;Object.assign(s.water,{L:60,x:6});s.water.layers.formulas=true;s.missions.near=s.missions.far=true;Q.observe(s);assert.ok(Q.requirements(s).every(([done])=>done));assert.equal(Q.questions(3,s)[2].answer,.8);
 s.missions.current=5;s.records=[{id:1,config:{...M.presets.C,distance:2},cursors:{left:-6,right:6},phase:0}];Q.observe(s);Q.capture(s);assert.ok(Q.requirements(s).every(([done])=>done));assert.equal(Q.questions(5,s)[1].answer,600);
});
test('first attempt is immutable across wrong answers, retries and review while mastery accumulates',()=>{
 const s=fresh();s.missions.played[0]=true;
 assert.equal(Q.check(s),false);assert.equal(Q.scores(s.missions).firstChecked,0);
 s.missions.answers[0].q0='node';assert.equal(Q.check(s),true);assert.equal(Q.scores(s.missions).firstCorrect,0);assert.equal(Q.scores(s.missions).firstChecked,1);
 s.missions.answers[0].q0='antinode';Q.check(s);assert.equal(Q.scores(s.missions).mastered,1);assert.equal(Q.scores(s.missions).firstCorrect,0);assert.equal(s.missions.firstChecks[0].items[0].answer,'node');assert.equal(s.missions.lastChecks[0].items[0].answer,'antinode');
 s.missions.answers[0]={};s.missions.attempted[0]=false;assert.equal(Q.check(s),false);assert.equal(Q.scores(s.missions).mastered,1);assert.equal(Q.valid(s.missions),true);
});
test('captured P data and wavelength records are independent of later live control changes',()=>{
 const s=fresh();s.missions.current=2;s.water.L=12;s.water.x=W.pointForDelta(s.water,1.5);Q.capture(s);
 s.missions.answers[2]={q0:'1.5',q1:'node',q2:'1'};s.water.x=.9;s.water.phase=180;assert.ok(Q.grade(s).every(Boolean));
 s.missions.current=5;s.records=[{id:1,config:{...M.presets.B},cursors:{left:-2.5,right:2.5},phase:0}];Q.capture(s);
 s.records[0].cursors={left:-8,right:8};assert.equal(Q.questions(5,s)[0].answer,500);
});
test('legacy migration preserves original answers and evidence without inventing a first score',()=>{
 const old={enabled:true,answerOpen:false,current:2,completed:[0,1,2],answers:[{q0:'antinode'},{q0:'node'},{q0:'1.5',q1:'node'},{},{},{}],attempted:[true,true,true,false,false,false],played:[true,true,false,false,false,false],near:false,far:false};
 const m=Q.migrate(old);assert.ok(Q.valid(m));assert.equal(m.answers[2].q0,'1.5');assert.deepEqual(Array.from(m.completed),[0,1]);assert.deepEqual(Array.from(m.legacyCompleted),[0,1,2]);assert.equal(Q.scores(m).firstChecked,0);
 assert.equal(Q.migrate({...old,completed:'bad'}),null);
});
