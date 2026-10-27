import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const base=new URL('../public/content/physics/ipst/equilibrium/assets/4-2-cg/',import.meta.url);
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('model.js',base),'utf8'),context);
const M=context.CGLabModel;
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('area, centroid and inertia agree with analytical rectangle and triangle results',()=>{
  const r=M.properties([[0,0],[.4,0],[.4,.2],[0,.2]]);
  close(r.area,.08);close(r.center.x,.2);close(r.center.y,.1);close(r.inertia,(.4**2+.2**2)/12);
  const tr=M.properties([[0,0],[.3,0],[0,.6]]);
  close(tr.area,.09);close(tr.center.x,.1);close(tr.center.y,.2);close(tr.inertia,(.3**2+.6**2)/18);
});
test('L lamina matches two rectangles minus their overlap, with CG in the empty notch',()=>{
  const sh=M.shapes.find(x=>x.id==='ell'),p=M.properties(sh.points);
  const area=2*.28*.08-.08**2;
  const x=(.28*.08*.14+.08*.28*.04-.08**2*.04)/area;
  close(p.area,area);close(p.center.x,x);close(p.center.y,x);
  assert.equal(M.inside(sh.points,p.center),false);
});
test('polygon winding and translation do not change physical inertia',()=>{
  for(const sh of M.shapes){
    const p=M.properties(sh.points),reverse=M.properties([...sh.points].reverse());
    close(p.inertia,reverse.inertia);close(p.area,reverse.area);
    const moved=M.properties(sh.points.map(([x,y])=>[x+2,y-3]));
    close(moved.center.x,p.center.x+2);close(moved.center.y,p.center.y-3);close(moved.inertia,p.inertia);
  }
});
test('every prescribed hole is in its plate and all stable poses put CG below the support',()=>{
  for(const sh of M.shapes)for(let h=0;h<3;h++){
    assert.ok(M.inside(sh.points,{x:sh.holes[h][0],y:sh.holes[h][1]}));
    const p=M.suspension(sh,h),r=M.rotate(p.delta,p.equilibrium);
    close(r.x,0);assert.ok(r.y>0);close(r.y,p.distance);
    close(p.inertia,M.properties(sh.points).inertia+p.distance**2);
    close(M.acceleration(sh,h,p.equilibrium,0),0);
    assert.ok(M.acceleration(sh,h,p.equilibrium+.1,0)<0);
    assert.ok(M.acceleration(sh,h,p.equilibrium-.1,0)>0);
  }
});
test('undamped pendulum conserves mechanical energy, damping reduces it',()=>{
  const sh=M.shapes[0],eq=M.suspension(sh,0).equilibrium;
  for(const damping of [0,2.6]){
    let s={angle:eq+.65,omega:0},before=M.energy(sh,0,s),initial=before;
    for(let i=0;i<240*8;i++){
      s=M.step(sh,0,s,1/240,damping);const e=M.energy(sh,0,s);
      if(damping)assert.ok(e<=before+1e-10);before=e;
    }
    if(damping)assert.ok(before<initial-.05);else close(before,initial,1e-7);
  }
});
test('all nine release experiments converge to the stable equilibrium without a time-only shortcut',()=>{
  for(const sh of M.shapes)for(let h=0;h<3;h++){
    const eq=M.suspension(sh,h).equilibrium;
    let s={angle:M.wrap(eq+.65),omega:0};
    for(let i=0;i<240*12;i++)s=M.step(sh,h,s,1/240);
    close(M.wrap(s.angle-eq),0,1e-5);close(s.omega,0,1e-5);
  }
});
test('different integration timesteps agree on physical rotation',()=>{
  const sh=M.shapes[1],eq=M.suspension(sh,1).equilibrium,results=[];
  for(const dt of [1/240,1/480]){let s={angle:eq+.65,omega:0};for(let i=0;i<4/dt;i++)s=M.step(sh,1,s,dt);results.push(s);}
  close(results[0].angle,results[1].angle,1e-7);close(results[0].omega,results[1].omega,1e-7);
});
test('marks intersect at the independently calculated centroid for every pair of holes',()=>{
  for(const sh of M.shapes){
    const c=M.properties(sh.points).center,marks=sh.holes.map((_,h)=>M.mark(sh,h,M.suspension(sh,h).equilibrium));
    for(const [a,b] of [[0,1],[1,2],[0,2]]){const p=M.intersection(marks[a],marks[b]);assert.ok(p);close(p.x,c.x);close(p.y,c.y);}
    assert.equal(M.intersection(marks[0],marks[0]),null);
    // Old lines rotate with the body; each still goes through the rotated CG.
    for(const mark of marks)for(const angle of [-2,.3,1.7]){
      const d=M.rotate(mark.direction,angle),v=M.rotate({x:c.x-mark.point.x,y:c.y-mark.point.y},angle);
      close(d.x*v.y-d.y*v.x,0);
    }
  }
});
