import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../public/content/physics/ipst/wave-optics/assets/10-1-sim/model.js',import.meta.url),'utf8'),context);
const M=context.WaveMiniModel,close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('Snell example agrees with analytical angle, speed, wavelength and unchanged frequency',()=>{
  const r=M.refract({angle:30,n1:1,n2:1.5,wavelength:600});
  close(r.angle,19.47122063449069);close(r.v2,2e8);close(r.lambda2,400);close(r.frequency,5e14,.1);
  close(r.v1/(r.lambda1*1e-9),r.v2/(r.lambda2*1e-9),.1);
});
test('normal incidence stays straight and equal media do not bend rays',()=>{
  for(const n1 of [1,1.33,1.5])for(const n2 of [1,1.33,1.5])close(M.refract({angle:0,n1,n2,wavelength:500}).angle,0);
  for(const angle of [0,10,40,80])close(M.refract({angle,n1:1.33,n2:1.33,wavelength:500}).angle,angle);
});
test('Snell wavefronts have matching tangential phase and are reversible',()=>{
  for(const n1 of [1,1.33,1.5])for(const n2 of [1,1.33,1.5])for(const angle of [10,30,60]){
    const r=M.refract({angle,n1,n2,wavelength:550});if(r.tir)continue;
    close(n1*Math.sin(M.rad(angle)),n2*Math.sin(M.rad(r.angle)));
    close(M.refract({angle:r.angle,n1:n2,n2:n1,wavelength:550}).angle,angle);
  }
});
test('critical incidence is grazing, while greater incidence gives no real refracted angle',()=>{
  const critical=M.deg(Math.asin(1/1.5)),p={n1:1.5,n2:1,wavelength:600};
  close(M.refract({...p,angle:critical}).angle,90);assert.equal(M.refract({...p,angle:critical}).tir,false);
  const r=M.refract({...p,angle:critical+.01});assert.equal(r.tir,true);assert.equal(r.angle,null);close(r.critical,critical);
});
test('interference uses amplitude, not an instantaneous zero, to identify nodes',()=>{
  const p={wavelength:4,separation:8,phase:0};
  const a=M.interference(p,0,0);close(a.re,0,1e-12);close(a.amplitude,2);assert.equal(a.kind,'antinode');
  const b=M.interference({...p,phase:180},10,0);close(b.amplitude,0);assert.equal(b.kind,'node');
  for(const t of [0,.3,1.2,5.6])close(b.re*Math.cos(t)-b.im*Math.sin(t),0);
});
test('both probe positions are attainable and phase reversal swaps node and antinode over every slider range',()=>{
  for(const wavelength of [1,2.5,4])for(const separation of [4,8,12])for(const probe of ['center','side'])for(const phase of [0,180]){
    const q=M.probe({wavelength,separation,probe,phase});
    close(q.delta,probe==='center'?0:wavelength/2);assert.ok(q.delta<separation);assert.ok(q.y<6.6);
    assert.equal(q.kind,(probe==='center')===(phase===0)?'antinode':'node');
    close(q.amplitude,q.kind==='node'?0:2);
  }
});
test('single-slit first-dark directions are zeros, with nonzero side lobes beyond them',()=>{
  for(const wavelength of [400,550,700])for(const opening of [.8,1.8,4]){
    const p={wavelength,opening},r=M.diffract(p);close(M.diffractionAmplitude(p,0),1);close(M.diffractionAmplitude(p,r.angle),0);
    close(M.diffractionAmplitude(p,-r.angle),0);close(Math.sin(M.rad(r.angle)),wavelength/(opening*1000));
  }
  assert.ok(Math.abs(M.diffractionAmplitude({wavelength:600,opening:1.8},30))>.1);
  assert.equal(M.diffract({wavelength:600,opening:.3}).angle,null);
});
test('longer wavelengths and narrower openings increase spreading at fixed other quantity',()=>{
  for(const opening of [.8,1.8,4])assert.ok(M.diffract({opening,wavelength:700}).angle>M.diffract({opening,wavelength:400}).angle);
  for(const wavelength of [400,550,700])assert.ok(M.diffract({wavelength,opening:.8}).angle>M.diffract({wavelength,opening:4}).angle);
  close(M.diffract({wavelength:400,opening:1.2}).angle,M.diffract({wavelength:600,opening:1.8}).angle);
});
test('restored parameters reject nonfinite values, invalid media, phases, enums and missing fields',()=>{
  for(const mode of Object.keys(M.defaults)){
    assert.ok(M.valid(mode,M.defaults[mode]));const key=Object.keys(M.ranges[mode])[0];
    for(const value of [NaN,Infinity,'35',-100])assert.equal(M.valid(mode,{...M.defaults[mode],[key]:value}),false);
    assert.equal(M.valid(mode,{}),false);
  }
  assert.equal(M.valid('refraction',{...M.defaults.refraction,n1:1.2}),false);
  assert.equal(M.valid('interference',{...M.defaults.interference,phase:90}),false);
  assert.equal(M.valid('diffraction',{...M.defaults.diffraction,compare:'invalid'}),false);
});
