(() => {
  'use strict';
  const M=globalThis.WaveMiniModel,blue='#2586ad',orange='#b67439',green='#397c65';
  const raster=document.createElement('canvas');raster.width=400;raster.height=220;
  const rc=raster.getContext('2d'),pixels=rc.createImageData(400,220);let field=null;
  function invalidate(){field=null;}
  function line(ctx,x1,y1,x2,y2,color,width=2,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
  function arrow(ctx,x1,y1,x2,y2,color){line(ctx,x1,y1,x2,y2,color,3);const a=Math.atan2(y2-y1,x2-x1);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-12*Math.cos(a-.4),y2-12*Math.sin(a-.4));ctx.lineTo(x2-12*Math.cos(a+.4),y2-12*Math.sin(a+.4));ctx.closePath();ctx.fill();}
  function label(ctx,value,x,y,size){ctx.font=`600 ${size}px Tahoma, Arial, sans-serif`;ctx.textBaseline='middle';const w=ctx.measureText(value).width;ctx.fillStyle='#f9fcfae8';ctx.fillRect(x-4,y-size*.65,w+8,size*1.3);ctx.fillStyle='#294d46';ctx.fillText(value,x,y);}
  function fronts(ctx,dir,spacing,time,color,clip){
    ctx.save();ctx.beginPath();ctx.rect(...clip);ctx.clip();ctx.translate(400,245);ctx.rotate(Math.atan2(dir.y,dir.x));
    ctx.strokeStyle=color;ctx.globalAlpha=.48;ctx.lineWidth=1.6;
    for(let u=-1200+(time%1)*spacing;u<1200;u+=spacing){ctx.beginPath();ctx.moveTo(u,-1200);ctx.lineTo(u,1200);ctx.stroke();}ctx.restore();
  }
  function rays(ctx,mode,p,time,font){
    const theta=M.rad(p.angle),incident={x:Math.sin(theta),y:Math.cos(theta)},reflection={x:Math.sin(theta),y:-Math.cos(theta)},r=mode==='refraction'?M.refract(p):null;
    ctx.fillStyle='#f4f8f6';ctx.fillRect(0,0,800,245);ctx.fillStyle=mode==='reflection'?'#dce5df':'#e3f0ea';ctx.fillRect(0,245,800,195);
    const spacing=mode==='refraction'?50*p.wavelength/600/p.n1:50;
    fronts(ctx,incident,spacing,time,blue,[0,0,800,245]);
    if(mode==='reflection'||r.tir)fronts(ctx,reflection,spacing,time,orange,[0,0,800,245]);
    else{const a=M.rad(r.angle);fronts(ctx,{x:Math.sin(a),y:Math.cos(a)},50*p.wavelength/600/p.n2,time,green,[0,245,800,195]);arrow(ctx,400,245,400+170*Math.sin(a),245+170*Math.cos(a),green);ctx.beginPath();ctx.strokeStyle=green;ctx.arc(400,245,62,Math.PI/2-a,Math.PI/2);ctx.stroke();label(ctx,'θ₂',452,300,font);}
    line(ctx,0,245,800,245,'#70897b',3);line(ctx,400,28,400,420,'#6e8278',1.5,[7,6]);
    arrow(ctx,400-210*incident.x,245-210*incident.y,400,245,blue);
    if(mode==='reflection'||r.tir)arrow(ctx,400,245,400+210*reflection.x,245+210*reflection.y,orange);
    ctx.lineWidth=2;ctx.strokeStyle=blue;ctx.beginPath();ctx.arc(400,245,70,-Math.PI/2-theta,-Math.PI/2);ctx.stroke();label(ctx,mode==='reflection'?'θᵢ':'θ₁',321,190,font);
    if(mode==='reflection'||r.tir){ctx.strokeStyle=orange;ctx.beginPath();ctx.arc(400,245,91,-Math.PI/2,-Math.PI/2+theta);ctx.stroke();label(ctx,'θᵣ',452,177,font);}
    label(ctx,'N',412,43,font);
    if(mode==='refraction'){label(ctx,`n₁ = ${p.n1.toFixed(2)}`,22,30,font);label(ctx,`n₂ = ${p.n2.toFixed(2)}`,22,408,font);}
    if(mode==='reflection'){for(let x=12;x<800;x+=22)line(ctx,x,245,x-12,263,'#94a79b',1.3);}
  }
  function buildField(mode,p){
    const amp=new Float32Array(400*220),re=new Float32Array(400*220),im=new Float32Array(400*220);
    for(let row=0;row<220;row++)for(let col=0;col<400;col++){
      const i=row*400+col;
      if(mode==='interference')amp[i]=M.interference(p,col/400*24-4,(row/220-.5)*13.2).amplitude/2;
      else{
        const x=col*2-190,y=row*2-220;if(x<=0)continue;
        const a=M.diffractionAmplitude(p,M.deg(Math.atan2(y,x))),phase=2*Math.PI*Math.hypot(x,y)/(p.wavelength/12);
        amp[i]=Math.abs(a);re[i]=a*Math.cos(phase);im[i]=a*Math.sin(phase);
      }
    }
    field={mode,amp,re,im};
  }
  function heatmap(ctx,mode,p,time){
    if(!field||field.mode!==mode)buildField(mode,p);
    const c=Math.cos(2*Math.PI*time),s=Math.sin(2*Math.PI*time),out=pixels.data,amplitudeColor=[65,136,107],positive=[58,139,172],negative=[190,122,64];
    for(let i=0;i<field.amp.length;i++){
      const value=mode==='interference'?field.amp[i]:field.re[i]*c+field.im[i]*s,weight=Math.abs(value),target=mode==='interference'?amplitudeColor:value>=0?positive:negative;
      out[4*i]=244+(target[0]-244)*weight;out[4*i+1]=249+(target[1]-249)*weight;out[4*i+2]=246+(target[2]-246)*weight;out[4*i+3]=255;
    }
    rc.putImageData(pixels,0,0);ctx.drawImage(raster,0,0,800,440);
  }
  function interference(ctx,p,time,font){
    heatmap(ctx,'interference',p,time);
    const sx=800/24*4,cy=220,scale=800/24,ys=[cy-p.separation/2*scale,cy+p.separation/2*scale];
    for(let j=0;j<2;j++){
      ctx.save();ctx.beginPath();ctx.rect(0,0,800,440);ctx.clip();ctx.strokeStyle=j?orange:blue;ctx.lineWidth=1.3;ctx.globalAlpha=.6;
      const fraction=(time-j*p.phase/360)%1;
      for(let n=0;n<40;n++){const radius=(n+fraction)*p.wavelength;if(radius<=0)continue;ctx.beginPath();ctx.arc(sx,ys[j],radius*scale,0,2*Math.PI);ctx.stroke();}ctx.restore();
      ctx.beginPath();ctx.fillStyle=j?orange:blue;ctx.arc(sx,ys[j],6,0,Math.PI*2);ctx.fill();label(ctx,j?'S₂':'S₁',sx+13,Math.max(font,ys[j]-15),font);
    }
    const q=M.probe(p),px=(q.x+4)/24*800,py=220+q.y*scale;
    line(ctx,sx,ys[0],px,py,'#315d57',1.3,[6,5]);line(ctx,sx,ys[1],px,py,'#315d57',1.3,[6,5]);
    ctx.beginPath();ctx.fillStyle='#fff';ctx.strokeStyle='#284d43';ctx.lineWidth=3;ctx.arc(px,py,7,0,Math.PI*2);ctx.fill();ctx.stroke();label(ctx,'P',px+15,py-15,font);
  }
  function diffraction(ctx,p,time,font){
    heatmap(ctx,'diffraction',p,time);
    const gap=p.opening*1000/12,half=gap/2,spacing=p.wavelength/12;
    ctx.fillStyle='#eef4f0';ctx.fillRect(0,0,190,440);ctx.save();ctx.beginPath();ctx.rect(0,0,190,440);ctx.clip();
    for(let x=-spacing+(time%1)*spacing;x<190;x+=spacing)line(ctx,x,0,x,440,blue,2);ctx.restore();
    line(ctx,190,0,190,220-half,'#627e70',8);line(ctx,190,220+half,190,440,'#627e70',8);
    line(ctx,160,220-half,160,220+half,'#3d6152',1.5);line(ctx,152,220-half,168,220-half,'#3d6152');line(ctx,152,220+half,168,220+half,'#3d6152');label(ctx,'a',132,220,font);
    line(ctx,190,220,790,220,'#3b6458',1.5,[5,5]);
    const theta=M.rad(M.diffract(p).angle);
    for(const sign of [-1,1])line(ctx,190,220,190+1100*Math.cos(theta),220+sign*1100*Math.sin(theta),'#6b537e',2,[8,6]);
    ctx.beginPath();ctx.strokeStyle='#6b537e';ctx.lineWidth=2;ctx.arc(190,220,80,-theta,0);ctx.stroke();label(ctx,'θ',277,193,font);
    arrow(ctx,42,412,112,412,blue);
  }
  function draw(canvas,mode,p,time){
    const ctx=canvas.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),width=Math.max(1,canvas.clientWidth),height=width*440/800;
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    ctx.setTransform(canvas.width/800,0,0,canvas.height/440,0,0);ctx.clearRect(0,0,800,440);
    const font=16*Math.max(1,800/Math.max(width,360));
    // A fixed time scale within each model: changing lambda changes frequency,
    // not the visible propagation speed in an unchanged medium.
    const phase=time*(mode==='reflection'?1:mode==='interference'?3/p.wavelength:600/p.wavelength);
    if(mode==='reflection'||mode==='refraction')rays(ctx,mode,p,phase,font);
    else if(mode==='interference')interference(ctx,p,phase,font);else diffraction(ctx,p,phase,font);
  }
  globalThis.WaveMiniView=Object.freeze({draw,invalidate});
})();
