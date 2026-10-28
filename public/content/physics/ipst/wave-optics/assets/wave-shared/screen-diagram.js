(() => {
  'use strict';
  function paths(s,y){const r1=Math.hypot(s.L,y+s.d/2),r2=Math.hypot(s.L,y-s.d/2);return {r1,r2,signed:2*y*s.d/(r1+r2),theta:Math.atan2(y,s.L)};}
  function sinc(x){return Math.abs(x)<1e-8?1:Math.sin(x)/x;}
  function intensity(s,y){const g=paths(s,y),delta=s.far?s.d*Math.sin(g.theta):g.signed,envelope=s.a?sinc(Math.PI*s.a*Math.sin(g.theta)/s.lambda)**2:1;return envelope*Math.cos(Math.PI*delta/s.lambda-s.phase*Math.PI/360)**2;}
  function orders(s){
    const out=[];for(let m=-3;m<=3;m++){const delta=(m+s.phase/360)*s.lambda;if(Math.abs(delta)>=s.d)continue;
      const y=s.far?s.L*Math.tan(Math.asin(delta/s.d)):delta/2*Math.sqrt(1+4*s.L*s.L/(s.d*s.d-delta*delta));
      if(Math.abs(y)<=s.extent)out.push({m,delta,y,theta:Math.atan2(y,s.L)*180/Math.PI});
    }return out;
  }
  function draw(canvas,s,lang='th'){
    const ctx=canvas.getContext('2d'),font=13*Math.max(1,800/Math.max(canvas.clientWidth,350)),sy=y=>220-y/s.extent*170,pts=orders(s);
    ctx.clearRect(0,0,800,460);ctx.fillStyle='#f5faf6';ctx.fillRect(0,0,800,460);
    function line(x1,y1,x2,y2,color='#3c6153',dash=[]){ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);}
    function text(t,x,y,color='#294e40',size=font){ctx.font=`600 ${size}px Tahoma,Arial,sans-serif`;ctx.fillStyle='#f5faf6ee';ctx.fillRect(x-2,y-size,ctx.measureText(t).width+4,size*1.3);ctx.fillStyle=color;ctx.fillText(t,x,y);}
    // Geometry is schematic; the vertical screen scale and numerical values are physical.
    line(110,80,110,185);line(110,205,110,235);line(110,255,110,375);line(530,40,530,400,'#3c6153');line(110,220,530,220,'#6f8b7b',[6,5]);
    line(65,195,65,245);line(58,195,72,195);line(58,245,72,245);text('d',27,228);
    line(110,422,530,422);line(110,416,110,428);line(530,416,530,428);text('L',307,445);
    ctx.beginPath();ctx.strokeStyle='#c4483f';ctx.lineWidth=2.6;
    for(let j=0;j<=420;j++){const y=s.extent*(1-2*j/420),Y=sy(y),X=530+95*intensity(s,y);if(j===0)ctx.moveTo(X,Y);else ctx.lineTo(X,Y);}ctx.stroke();text('I/I₀',558,28,'#b33d35');
    const labelled=[];const candidates=[...pts].sort((a,b)=>Math.abs(a.y)-Math.abs(b.y));for(const q of candidates){if(s.phase===0?Math.abs(q.m)>2:Math.abs(q.delta/s.lambda)>2.50001)continue;const Y=sy(q.y);line(110,220,530,Y,'#738d78');line(523,Y,537,Y);
      const label=s.phase===0?`m = ${q.m}`:`Δr/λ = ${(q.delta/s.lambda).toFixed(1)}`;if(labelled.every(y=>Math.abs(y-Y)>font*1.05)){text(label,638,Y+font*.3,'#425f4c',font*.88);labelled.push(Y);}
    }
    if(s.phase===180)text(lang==='th'?'กลางมืด':'dark centre',540,sy(0)-6,'#78513e',font*.82);
    for(const [m,radius,color,xBracket] of [[1,65,'#24629a',735],[2,90,'#70468f',778]]){
      const q=pts.find(p=>p.m===m);if(!q||s.phase!==0)continue;const Y=sy(q.y),angle=Math.atan2(Y-220,420);
      ctx.beginPath();ctx.strokeStyle=color;ctx.arc(110,220,radius,angle,0);ctx.stroke();text('θ'+(m===1?'₁':'₂'),165+(m-1)*28,191-(m-1)*30,color);
      line(xBracket,220,xBracket,Y,color);line(xBracket-4,Y,xBracket+4,Y,color);line(xBracket-4,220,xBracket+4,220,color);text('y'+(m===1?'₁':'₂'),xBracket-32,(220+Y)/2,color,font*.85);
    }
    const selected=sy(s.position),shown=Math.max(40,Math.min(400,selected));line(110,220,530,shown,'#1a6974');line(530,shown,530+95*intensity(s,s.position),shown,'#1a6974',[3,3]);
    ctx.beginPath();ctx.fillStyle='#1c6975';ctx.arc(530,shown,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(530+95*intensity(s,s.position),shown,3.5,0,Math.PI*2);ctx.fill();text('P',490,shown-10,'#165e68');
    text(`+${s.extent} ${s.unit}`,372,35,'#698271',font*.8);text(`−${s.extent} ${s.unit}`,372,405,'#698271',font*.8);
    canvas.dataset.orders=JSON.stringify(pts);canvas.dataset.position=String(s.position);canvas.dataset.intensity=String(intensity(s,s.position));canvas.dataset.phase=String(s.phase);
    canvas.setAttribute('aria-label',(lang==='th'?'เรขาคณิตและกราฟความเข้มฉาก':'Geometry and screen intensity')+`: d=${s.d} ${s.unit}, L=${s.L} ${s.unit}, P=${s.position} ${s.unit}, phase=${s.phase}°`);
    return {orders:pts,intensity:intensity(s,s.position),...paths(s,s.position)};
  }
  globalThis.InterferenceScreen=Object.freeze({paths,intensity,orders,draw});
})();
