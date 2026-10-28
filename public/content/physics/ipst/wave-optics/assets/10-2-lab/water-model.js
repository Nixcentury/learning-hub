(() => {
  'use strict';
  const initial=()=>({wavelength:3,separation:8,phase:0,L:24,x:0,running:false,layers:{fronts:true,nodes:false,antinodes:false,paths:false,variables:false,formulas:false}});
  function valid(p){return !!p&&[0,180].includes(p.phase)&&typeof p.running==='boolean'&&[['wavelength',1,4],['separation',4,12],['L',6,60],['x',-8,8]].every(([k,lo,hi])=>Number.isFinite(p[k])&&p[k]>=lo&&p[k]<=hi)&&p.layers&&Object.keys(initial().layers).every(k=>typeof p.layers[k]==='boolean');}
  function geometry(p){
    const r1=Math.hypot(p.L,p.x+p.separation/2),r2=Math.hypot(p.L,p.x-p.separation/2),delta=Math.abs(2*p.x*p.separation/(r1+r2)),theta=Math.atan2(p.x,p.L),angular=p.separation*Math.abs(Math.sin(theta)),small=p.separation*Math.abs(p.x)/p.L;
    const phase=2*Math.PI*(r2-r1)/p.wavelength+p.phase*Math.PI/180,amplitude=2*Math.abs(Math.cos(phase/2));
    return {r1,r2,delta,theta:theta*180/Math.PI,angular,small,amplitude,ratio:delta/p.wavelength,kind:amplitude<1e-7?'node':Math.abs(amplitude-2)<1e-7?'antinode':'between'};
  }
  function pointForDelta(p,delta){if(delta<0||delta>=p.separation)return null;const x=delta/2*Math.sqrt(1+4*p.L*p.L/(p.separation*p.separation-delta*delta));return x<=8?x:null;}
  function nearKind(p){const t=(geometry(p).ratio+p.phase/360)%1;if(Math.min(t,1-t)<=.04)return 'antinode';if(Math.abs(t-.5)<=.04)return 'node';return 'between';}
  function loci(p,kind){
    const central=kind===(p.phase===0?'antinode':'node'),out=[];
    if(central)out.push({delta:0,index:0});
    for(let i=1;i<=24;i++){const delta=(central?i:i-.5)*p.wavelength;if(delta>=p.separation-1e-9)break;out.push({delta,index:i});}return out;
  }
  function locusY(p,delta,X){return delta===0?0:delta/2*Math.sqrt(1+4*X*X/(p.separation*p.separation-delta*delta));}
  const scale=800/68,screen=(L,x)=>({x:(L+4)*scale,y:210-x*scale});
  const fromScreen=(x,y)=>({L:x/scale-4,x:(210-y)/scale});
  globalThis.InterferenceWater=Object.freeze({initial,valid,geometry,pointForDelta,nearKind,loci,locusY,screen,fromScreen,scale});
})();
