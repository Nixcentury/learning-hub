(() => {
  'use strict';
  const W=globalThis.InterferenceWater,off=document.createElement('canvas');off.width=400;off.height=210;
  const oc=off.getContext('2d'),pixels=oc.createImageData(400,210);let cached=null,key='';
  function line(ctx,a,b,color,width=2,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
  function label(ctx,text,x,y,font){ctx.font=`600 ${font}px Tahoma,Arial,sans-serif`;ctx.textBaseline='middle';const width=ctx.measureText(text).width;ctx.fillStyle='#f3fcf3ed';ctx.fillRect(x-3,y-font*.65,width+6,font*1.3);ctx.fillStyle='#214744';ctx.fillText(text,x,y);}
  function field(p){
    const next=[p.wavelength,p.separation,p.phase].join(':');if(next===key&&cached)return;
    key=next;const re=new Float32Array(84000),im=new Float32Array(84000),k=2*Math.PI/p.wavelength,phase=p.phase*Math.PI/180;
    for(let row=0;row<210;row++)for(let col=0;col<400;col++){
      const P=W.fromScreen(col*2,row*2),a=k*Math.hypot(P.L,P.x+p.separation/2),b=k*Math.hypot(P.L,P.x-p.separation/2)+phase,i=row*400+col;
      re[i]=(Math.sin(a)+Math.sin(b))/2;im[i]=(Math.cos(a)+Math.cos(b))/2;
    }cached={re,im};
  }
  function draw(canvas,p,time){
    field(p);const ctx=canvas.getContext('2d'),phase=time*3/p.wavelength,c=Math.cos(phase*2*Math.PI),s=Math.sin(phase*2*Math.PI),data=pixels.data;
    for(let i=0;i<84000;i++){
      const v=cached.re[i]*c-cached.im[i]*s,t=(v+1)/2;
      data[4*i]=31+153*t;data[4*i+1]=78+144*t;data[4*i+2]=106+127*t;data[4*i+3]=255;
    }oc.putImageData(pixels,0,0);ctx.clearRect(0,0,800,420);ctx.drawImage(off,0,0,800,420);
    const font=13*Math.max(1,800/Math.max(canvas.clientWidth,300)),origin=W.screen(0,0),P=W.screen(p.L,p.x),S=[W.screen(0,-p.separation/2),W.screen(0,p.separation/2)];
    if(p.layers.fronts)for(let j=0;j<2;j++){
      ctx.save();ctx.beginPath();ctx.rect(origin.x,0,800-origin.x,420);ctx.clip();ctx.strokeStyle=j?'#ffce8c':'#d7fbff';ctx.globalAlpha=.6;ctx.lineWidth=1;
      for(let n=-1;n<Math.ceil(80/p.wavelength)+2;n++)for(const trough of [false,true]){
        const radius=(n+phase-j*p.phase/360+(.25+(trough ? .5 : 0)))*p.wavelength*W.scale;if(radius<=0)continue;
        ctx.setLineDash(trough?[4,5]:[]);ctx.beginPath();ctx.arc(S[j].x,S[j].y,radius,0,2*Math.PI);ctx.stroke();
      }ctx.restore();
    }
    for(const kind of ['node','antinode'])if(p.layers[kind==='node'?'nodes':'antinodes']){
      const color=kind==='node'?'#963f12':'#4c2578';
      for(const locus of W.loci(p,kind))for(const sign of locus.delta===0?[1]:[-1,1]){
        ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(kind==='node'?[7,4]:[]);
        for(let X=0;X<=64;X+=.2){const xy=W.screen(X,sign*W.locusY(p,locus.delta,X));if(X===0)ctx.moveTo(xy.x,xy.y);else ctx.lineTo(xy.x,xy.y);}ctx.stroke();ctx.setLineDash([]);
        const xy=W.screen(17,sign*W.locusY(p,locus.delta,17));if(xy.y>20&&xy.y<400&&locus.index<4)label(ctx,(kind==='node'?'N':'A')+locus.index,xy.x,xy.y,font*.85);
      }
    }
    line(ctx,W.screen(p.L,-16),W.screen(p.L,16),'#dae9f5',1.5,[5,5]);
    if(p.layers.paths){line(ctx,S[0],P,'#164c67',2.4);line(ctx,S[1],P,'#9b5016',2.4);label(ctx,'r₁',(S[0].x+P.x)/2,(S[0].y+P.y)/2+12,font);label(ctx,'r₂',(S[1].x+P.x)/2,(S[1].y+P.y)/2-14,font);}
    if(p.layers.variables){
      line(ctx,origin,W.screen(62,0),'#234e48',1.5,[5,5]);line(ctx,origin,P,'#375f50',1.5,[3,4]);
      line(ctx,{x:24,y:S[0].y},{x:24,y:S[1].y},'#304c44',2);label(ctx,'d',7,210,font);
      line(ctx,W.screen(0,-13),W.screen(p.L,-13),'#304c44',1.5);label(ctx,'L',(origin.x+P.x)/2,210+13*W.scale+16,font);
      line(ctx,W.screen(p.L,0),P,'#2d5743',2);label(ctx,'x',P.x+9,(P.y+210)/2,font);
      const a=Math.atan2(P.y-origin.y,P.x-origin.x);ctx.beginPath();ctx.strokeStyle='#244e47';ctx.arc(origin.x,origin.y,55,Math.min(a,0),Math.max(a,0));ctx.stroke();label(ctx,'θ',origin.x+64,origin.y-20,font);
    }
    S.forEach((q,j)=>{ctx.beginPath();ctx.fillStyle=j?'#a95b1c':'#124c69';ctx.arc(q.x,q.y,5,0,2*Math.PI);ctx.fill();label(ctx,j?'S₂':'S₁',q.x+9,q.y+(j?-16:17),font);});
    const handle=document.getElementById('water-probe');handle.style.left=P.x/8+'%';handle.style.top=P.y/4.2+'%';handle.setAttribute('aria-valuenow',p.x.toFixed(4));handle.setAttribute('aria-valuetext',p.x.toFixed(3)+' cm');
  }
  globalThis.InterferenceWaterView=Object.freeze({draw});
})();
