(() => {
  'use strict';
  const M=globalThis.DoubleSlitLabModel,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;}
  function draw(config,zoom,lang){
    const canvas=$('pattern'),ctx=canvas.getContext('2d'),pixels=ctx.createImageData(800,360),data=pixels.data;
    const rgb=config.color==='green'?[75,245,118]:[255,66,58],background=[10,19,17],paper=[237,244,238],horizontal=Array.from({length:800},(_,x)=>x>=40&&x<=760?M.intensity(config,M.screenToPosition(x,zoom)):0);
    for(let y=0;y<360;y++){
      const vertical=Math.exp(-.5*((y-120)/18)**2);
      for(let x=0;x<800;x++){
        const i=4*(y*800+x),v=Math.pow(horizontal[x]*vertical,.45);
        for(let c=0;c<3;c++)data[i+c]=y>=240?paper[c]:background[c]+(rgb[c]-background[c])*v;
        data[i+3]=255;
      }
    }
    ctx.putImageData(pixels,0,0);
    const ruler=$('ruler');ruler.replaceChildren();
    const half=40/zoom,minor=1/zoom,major=zoom===4?2:10/zoom,font=14*Math.max(1,800/Math.max($('stage').clientWidth,300));
    el('path',{d:'M40 240H760',stroke:'#667e6e','stroke-width':1.4},ruler);
    for(let i=-40;i<=40;i++){
      const value=i*minor,x=M.positionToScreen(value,zoom),big=Math.abs(value/major-Math.round(value/major))<1e-9;
      el('path',{d:`M${x} 240V${big?259:249}`,stroke:'#718878','stroke-width':big?1.2:.7},ruler);
      if(big){el('path',{d:`M${x} 4V236`,stroke:'#d1eadc','stroke-opacity':.14,'stroke-width':.8},ruler);const t=el('text',{x,y:285,'text-anchor':'middle',fill:'#486451','font-size':font,'font-family':'Tahoma, Arial, sans-serif'},ruler);t.textContent=String(value===0?0:value);}
    }
    el('path',{d:'M400 70V238',stroke:'#cde4d5','stroke-opacity':.35,'stroke-dasharray':'3 6','stroke-width':1},ruler);
    const unit=el('text',{x:748,y:326,'text-anchor':'end',fill:'#607968','font-size':font,'font-family':'Tahoma, Arial, sans-serif'},ruler);unit.textContent='mm';
    $('laser-dot').setAttribute('fill',config.color==='green'?'#45b76c':'#d95749');$('beam').setAttribute('stroke',config.color==='green'?'#45b76c':'#d95749');$('beam-tip').setAttribute('fill',config.color==='green'?'#45b76c':'#d95749');
    $('label-laser').textContent=lang==='th'?'เลเซอร์':'Laser';$('label-slit').textContent=lang==='th'?'สลิตคู่':'Double slit';$('label-screen').textContent=lang==='th'?'ฉาก':'Screen';$('label-distance').textContent=`L = ${config.distance.toFixed(1)} m`;
    const apparatusFont=14*Math.max(1,800/Math.max($('stage').clientWidth,300));
    for(const id of ['label-laser','label-slit','label-screen','label-distance']){$(id).style.fontSize=apparatusFont+'px';$(id).setAttribute('y',id==='label-distance'?118+apparatusFont:Math.max(25,apparatusFont+2));}
    $('apparatus-description').textContent=lang==='th'?`เลเซอร์ผ่านสลิตคู่ไปยังฉาก ระยะ ${config.distance.toFixed(1)} เมตร แผนภาพไม่ตามสเกล`:`Laser through double slit to screen at ${config.distance.toFixed(1)} metres; apparatus not to scale.`;
  }
  function cursors(state,lang){
    const half=40/state.zoom,width=$('stage').clientWidth,min=22/width*800,max=800-min;
    for(const side of ['left','right']){
      const value=state.cursors[side],actual=M.positionToScreen(value,state.zoom),x=Math.max(40,Math.min(760,actual)),handle=$('handle-'+side),outside=Math.abs(value)>half;
      $('cursor-line-'+side).setAttribute('d',`M${x} 15V240`);handle.style.left=Math.max(min,Math.min(max,x))/8+'%';handle.classList.toggle('offscreen',outside);
      handle.textContent=(side==='left'?'L':'R')+(outside?(value<0?' ←':' →'):'');
      handle.setAttribute('aria-label',lang==='th'?(side==='left'?'เส้นวัดซ้าย':'เส้นวัดขวา'):(side==='left'?'Left measurement marker':'Right measurement marker'));
      handle.setAttribute('aria-valuenow',value.toFixed(3));handle.setAttribute('aria-valuetext',value.toFixed(2)+' mm'+(outside?(lang==='th'?' อยู่นอกภาพ':' outside view'):''));
    }
    $('scale-note').textContent=(lang==='th'?`ช่วงฉาก −${half} ถึง +${half} mm`:`Screen range −${half} to +${half} mm`)+(Object.values(state.cursors).some(x=>Math.abs(x)>half)?(lang==='th'?' · เส้นวัดอยู่นอกภาพ ลดการขยายเพื่อดู':' · marker outside view; zoom out to see it'):'');
  }
  globalThis.DoubleSlitLabPlot=Object.freeze({draw,cursors});
})();
