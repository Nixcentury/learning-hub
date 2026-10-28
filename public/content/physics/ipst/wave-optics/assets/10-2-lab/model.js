(() => {
  'use strict';
  const presets={A:{color:'green',slit:50,distance:1},B:{color:'green',slit:100,distance:1},C:{color:'red',slit:100,distance:1}};
  const wavelengths={green:532,red:650},aperture=10e-6;
  function validConfig(c){return !!c&&typeof c==='object'&&Object.keys(c).length===3&&Object.hasOwn(wavelengths,c.color)&&[50,100].includes(c.slit)&&Number.isFinite(c.distance)&&c.distance>=.5&&c.distance<=2;}
  function validCursors(c){return !!c&&['left','right'].every(k=>Number.isFinite(c[k])&&Math.abs(c[k])<=40);}
  function preset(c){return Object.keys(presets).find(key=>Object.keys(presets[key]).every(k=>c[k]===presets[key][k]))||null;}
  function physical(c){return {lambda:wavelengths[c.color]*1e-9,d:c.slit*1e-6,L:c.distance,a:aperture};}
  const sinc=x=>Math.abs(x)<1e-8?1-x*x/6:Math.sin(x)/x;
  function intensity(c,xMm,phase=0){
    const {lambda,d,L,a}=physical(c),sinTheta=Math.sin(Math.atan(xMm*.001/L));
    return Math.cos(Math.PI*d*sinTheta/lambda+phase*Math.PI/360)**2*sinc(Math.PI*a*sinTheta/lambda)**2;
  }
  function theory(c){
    const {lambda,d,L}=physical(c),firstDark=L*Math.tan(Math.asin(lambda/(2*d)))*1000;
    return {spacing:lambda*L/d*1000,firstDark,widthExact:2*firstDark,lambdaNm:wavelengths[c.color]};
  }
  function inferLambda(c,widthMm){return physical(c).d*(widthMm*.001)/c.distance*1e9;}
  function measurement(cursors){return cursors.right-cursors.left;}
  function positionToScreen(xMm,zoom){return 400+xMm*9*zoom;}
  function screenToPosition(x,zoom){return (x-400)/(9*zoom);}
  function canRecord(s){return s.moved.left&&s.moved.right&&measurement(s.cursors)>0&&s.records.length<30;}
  function validSnapshot(s,identity){
    if(!s||![1,2].includes(s.version)||s.identity!==identity||!validConfig(s.config)||(s.lightPhase!==undefined&&![0,180].includes(s.lightPhase))||![1,2,4].includes(s.zoom)||!validCursors(s.cursors)||!s.moved||!['left','right'].every(k=>typeof s.moved[k]==='boolean')||!['formula','analysis','exercise','solution'].every(k=>typeof s[k]==='boolean')||!Array.isArray(s.records)||s.records.length>30)return false;
    const ids=new Set();
    for(const r of s.records){if(!r||!Number.isInteger(r.id)||r.id<1||r.id>1e9||ids.has(r.id)||!validConfig(r.config)||(r.phase!==undefined&&![0,180].includes(r.phase))||!validCursors(r.cursors)||measurement(r.cursors)<=0)return false;ids.add(r.id);}
    return true;
  }
  globalThis.DoubleSlitLabModel=Object.freeze({presets,wavelengths,aperture,validConfig,validCursors,preset,physical,sinc,intensity,theory,inferLambda,measurement,positionToScreen,screenToPosition,canRecord,validSnapshot});
})();
