(() => {
  'use strict';
  const rad=x=>x*Math.PI/180,deg=x=>x*180/Math.PI,c=3e8;
  const defaults={
    reflection:{angle:35},
    refraction:{angle:40,n1:1,n2:1.5,wavelength:600},
    interference:{wavelength:3,separation:8,phase:0,probe:'center'},
    diffraction:{wavelength:600,opening:1.8,compare:'wavelength'},
  };
  const ranges={reflection:{angle:[0,75]},refraction:{angle:[0,80],n1:[1,1.5],n2:[1,1.5],wavelength:[400,700]},interference:{wavelength:[1,4],separation:[4,12],phase:[0,180]},diffraction:{wavelength:[400,700],opening:[.8,4]}};
  function valid(mode,p){
    if(!Object.hasOwn(defaults,mode)||!p||typeof p!=='object'||Array.isArray(p))return false;
    if(Object.keys(p).length!==Object.keys(defaults[mode]).length)return false;
    for(const key of Object.keys(defaults[mode])){
      if(ranges[mode][key]){const [lo,hi]=ranges[mode][key];if(!Number.isFinite(p[key])||p[key]<lo||p[key]>hi)return false;}
      else if(mode==='interference'&&!['center','side'].includes(p[key]))return false;
      else if(mode==='diffraction'&&!['wavelength','opening'].includes(p[key]))return false;
    }
    if(mode==='refraction'&&![p.n1,p.n2].every(n=>[1,1.33,1.5].includes(n)))return false;
    return mode!=='interference'||[0,180].includes(p.phase);
  }
  function refract(p){
    const sine=p.n1/p.n2*Math.sin(rad(p.angle)),tir=sine>1+1e-12;
    return {tir,angle:tir?null:deg(Math.asin(Math.min(1,sine))),critical:p.n1>p.n2?deg(Math.asin(p.n2/p.n1)):null,frequency:c/(p.wavelength*1e-9),v1:c/p.n1,v2:c/p.n2,lambda1:p.wavelength/p.n1,lambda2:p.wavelength/p.n2};
  }
  function interference(p,x,y){
    const r1=Math.hypot(x,y+p.separation/2),r2=Math.hypot(x,y-p.separation/2),k=2*Math.PI/p.wavelength,phi=rad(p.phase);
    const re=Math.sin(k*r1)+Math.sin(k*r2+phi),im=Math.cos(k*r1)+Math.cos(k*r2+phi),amplitude=Math.hypot(re,im);
    return {r1,r2,delta:Math.abs(r2-r1),re,im,amplitude,kind:amplitude<1e-9?'node':Math.abs(amplitude-2)<1e-9?'antinode':'partial'};
  }
  function probe(p){
    // An equidistant point, or an attainable hyperbola with |r2-r1|=lambda/2.
    const x=10,delta=p.probe==='side'?p.wavelength/2:0;
    const y=delta/2*Math.sqrt(1+4*x*x/(p.separation*p.separation-delta*delta));
    return {x,y,...interference(p,x,y)};
  }
  function sinc(x){return Math.abs(x)<1e-8?1-x*x/6:Math.sin(x)/x;}
  function diffract(p){
    const lambda=p.wavelength*1e-9,a=p.opening*1e-6;
    return {ratio:a/lambda,angle:lambda<=a?deg(Math.asin(lambda/a)):null,frequency:c/lambda};
  }
  // Scalar Fraunhofer single-slit amplitude, normalised to the axial value.
  // The drawing is a far-field angular schematic, never a near-field solution.
  function diffractionAmplitude(p,theta){return sinc(Math.PI*p.opening*1000/p.wavelength*Math.sin(rad(theta)));}
  globalThis.WaveMiniModel=Object.freeze({c,rad,deg,defaults,ranges,valid,refract,interference,probe,sinc,diffract,diffractionAmplitude});
})();
