(() => {
 'use strict';
 const M=globalThis.WaveMiniModel,blue='#257ba1',orange='#b27531',green='#34745f';
 const off=document.createElement('canvas');off.width=400;off.height=220;const oc=off.getContext('2d'),pixels=oc.createImageData(400,220);let field=null;
 const invalidate=()=>field=null;
 function line(c,x1,y1,x2,y2,color,width=2,dash=[]){c.beginPath();c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
 function arrow(c,x1,y1,x2,y2,color){line(c,x1,y1,x2,y2,color,3);const a=Math.atan2(y2-y1,x2-x1);c.fillStyle=color;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-12*Math.cos(a-.4),y2-12*Math.sin(a-.4));c.lineTo(x2-12*Math.cos(a+.4),y2-12*Math.sin(a+.4));c.closePath();c.fill();}
 function label(c,t,x,y,font){c.font=`600 ${font}px Tahoma,Arial,sans-serif`;c.textBaseline='middle';c.fillStyle='#f5faf5e8';c.fillRect(x-3,y-font*.65,c.measureText(t).width+6,font*1.3);c.fillStyle='#294d40';c.fillText(t,x,y);}
 function fronts(c,dir,spacing,time,color,clip,ripples=false){
  c.save();c.beginPath();c.rect(...clip);c.clip();c.translate(400,245);c.rotate(Math.atan2(dir.y,dir.x));c.strokeStyle=color;c.globalAlpha=.65;c.lineWidth=1.2;
  // Reflection uses crest-only ripples: a soft grey edge and a narrow water highlight.
  for(const trough of ripples?[false]:[false,true]){c.setLineDash(trough?[4,5]:[]);for(let u=-1200+((time+(trough ? .5 : 0))%1)*spacing;u<1200;u+=spacing){
   if(ripples){line(c,u,-1200,u,1200,'#82949b',2.4);line(c,u-1.8,-1200,u-1.8,1200,'#ffffff',1.2);}
   else{c.beginPath();c.moveTo(u,-1200);c.lineTo(u,1200);c.stroke();}
  }}c.restore();
 }
 function build(mode,p){const re=new Float32Array(88000),im=new Float32Array(88000),solid=new Uint8Array(88000);
  for(let y=0;y<220;y++)for(let x=0;x<400;x++){const i=y*400+x;let q;
   if(mode==='reflection'||mode==='refraction')q=M.scalar(mode,p,x*2,y*2);
   else{const X=x*2-190,Y=y*2-220,phase=2*Math.PI*(X<=0?X:Math.hypot(X,Y))/(p.wavelength/12),amp=X<=0?1:M.diffractionAmplitude(p,M.deg(Math.atan2(Y,X)));q={re:amp*Math.cos(phase),im:amp*Math.sin(phase)};}
   if(q){re[i]=q.re;im[i]=q.im;}else solid[i]=1;
  }field={re,im,solid};
 }
 function heat(c,mode,p,time){if(!field)build(mode,p);const co=Math.cos(2*Math.PI*time),si=Math.sin(2*Math.PI*time),out=pixels.data,bg=[244,249,246],wall=[220,229,223],positive=[58,139,172],negative=[190,122,64];
  for(let i=0;i<88000;i++){const v=field.re[i]*co+field.im[i]*si,w=Math.abs(v),rgb=v>=0?positive:negative;for(let k=0;k<3;k++)out[4*i+k]=field.solid[i]?wall[k]:bg[k]+(rgb[k]-bg[k])*w;out[4*i+3]=255;}oc.putImageData(pixels,0,0);c.drawImage(off,0,0,800,440);
 }
 function rays(c,mode,p,time,font,v){const a=M.rad(p.angle),inc={x:Math.sin(a),y:Math.cos(a)},refl={x:Math.sin(a),y:-Math.cos(a)},r=mode==='refraction'?M.refract(p):null,spacing=mode==='refraction'?50*p.wavelength/600/p.n1:50;
  const ripples=mode==='reflection';
  if(v.field&&!ripples)heat(c,mode,p,time);else{c.fillStyle=ripples?'#eef3f4':'#f4f8f5';c.fillRect(0,0,800,440);c.fillStyle='#dce9de';c.fillRect(0,245,800,195);}
  if(v.fronts){fronts(c,inc,spacing,time,blue,[0,0,800,245],ripples);if(ripples||r.tir)fronts(c,refl,spacing,time,orange,[0,0,800,245],ripples);else{const b=M.rad(r.angle);fronts(c,{x:Math.sin(b),y:Math.cos(b)},50*p.wavelength/600/p.n2,time,green,[0,245,800,195]);}}
  line(c,0,245,800,245,'#70897b',3);if(!v.variables)return;
  line(c,400,28,400,420,'#4b6a58',1.5,[7,6]);arrow(c,400-210*inc.x,245-210*inc.y,400,245,blue);
  if(mode==='reflection'||r.tir){arrow(c,400,245,400+210*refl.x,245+210*refl.y,orange);c.beginPath();c.strokeStyle=orange;c.arc(400,245,91,-Math.PI/2,-Math.PI/2+a);c.stroke();label(c,'θᵣ',452,177,font);}else{const b=M.rad(r.angle);arrow(c,400,245,400+170*Math.sin(b),245+170*Math.cos(b),green);c.beginPath();c.strokeStyle=green;c.arc(400,245,62,Math.PI/2-b,Math.PI/2);c.stroke();label(c,'θ₂',452,300,font);}
  c.beginPath();c.strokeStyle=blue;c.arc(400,245,70,-Math.PI/2-a,-Math.PI/2);c.stroke();label(c,mode==='reflection'?'θᵢ':'θ₁',321,190,font);label(c,'N',412,43,font);
  if(mode==='refraction'){label(c,`n₁ = ${p.n1.toFixed(2)}`,22,30,font);label(c,`n₂ = ${p.n2.toFixed(2)}`,22,408,font);}
 }
 function diffraction(c,p,time,font,v){
  if(v.field)heat(c,'diffraction',p,time);else{c.fillStyle='#f4f8f5';c.fillRect(0,0,800,440);}
  const half=p.opening*1000/24,spacing=p.wavelength/12;
  if(v.fronts){for(const trough of [false,true]){for(let n=-25;n<=0;n++){const x=190+(n+(time+(trough ? .5 : 0))%1)*spacing;if(x<=190)line(c,x,0,x,440,blue,1.3,trough?[4,5]:[]);}}
   for(let n=-1;n<35;n++)for(const trough of [false,true])for(const negative of [false,true]){
    const radius=(n+(time%1)+(negative ? .5 : 0)+(trough ? .5 : 0))*spacing;if(radius<=0)continue;c.beginPath();c.strokeStyle=trough?'#946a3a':'#377c82';c.lineWidth=1;c.setLineDash(trough?[4,5]:[]);let drawing=false;
    for(let angle=-Math.PI/2;angle<=Math.PI/2;angle+=.015){const amp=M.diffractionAmplitude(p,M.deg(angle)),show=Math.abs(amp)>.04&&(amp<0)===negative;if(!show){drawing=false;continue;}const x=190+radius*Math.cos(angle),y=220+radius*Math.sin(angle);if(drawing)c.lineTo(x,y);else c.moveTo(x,y);drawing=true;}c.stroke();c.setLineDash([]);
   }
  }
  line(c,190,0,190,220-half,'#627e70',8);line(c,190,220+half,190,440,'#627e70',8);if(!v.variables)return;
  line(c,160,220-half,160,220+half,'#3d6152',1.5);line(c,152,220-half,168,220-half,'#3d6152');line(c,152,220+half,168,220+half,'#3d6152');label(c,'a',132,220,font);
  line(c,190,220,790,220,'#3b6458',1.5,[5,5]);const theta=M.rad(M.diffract(p).angle);
  for(const sign of [-1,1])line(c,190,220,190+1100*Math.cos(theta),220+sign*1100*Math.sin(theta),'#6b537e',2,[8,6]);c.beginPath();c.strokeStyle='#6b537e';c.arc(190,220,80,-theta,0);c.stroke();label(c,'θ',277,193,font);line(c,40,398,40+spacing,398,blue,1.5);label(c,'λ',50,416,font);arrow(c,42,40,112,40,blue);
 }
 function draw(canvas,mode,p,time,v=M.visual()){
  const c=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,canvas.clientWidth),height=width*440/800;
  if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
  c.setTransform(canvas.width/800,0,0,canvas.height/440,0,0);c.clearRect(0,0,800,440);const font=16*Math.max(1,800/Math.max(width,360)),phase=time*(mode==='reflection'?1:mode==='interference'?3/p.wavelength:600/p.wavelength);
  if(mode==='interference'){const w=M.water(p,v);c.save();c.translate(0,10);InterferenceWaterView.draw(canvas,w,time,{handle:null,field:v.field});c.restore();}
  else if(mode==='diffraction')diffraction(c,p,phase,font,v);else rays(c,mode,p,phase,font,v);
 }
 globalThis.WaveMiniView=Object.freeze({draw,invalidate});
})();
