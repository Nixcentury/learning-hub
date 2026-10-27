(() => {
  'use strict';
  const M=globalThis.CGLabModel,$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
  const colors=['#bc603a','#3566ad','#8660a3'],letters=['A','B','C'];
  let lang='th',shapeId='irregular',identity='guest',subscriber=null,lastTime=null,accumulator=0;
  const work=new Map();
  const text=(th,en)=>lang==='th'?th:en;
  const shape=()=>M.shapes.find(x=>x.id===shapeId);
  function initial(sh) {return {hole:0,angle:M.wrap(M.suspension(sh,0).equilibrium+.65),omega:0,view:'overview',running:false,stable:false,calm:0,marks:[],guess:null,revealed:false};}
  function state(){if(!work.has(shapeId))work.set(shapeId,initial(shape()));return work.get(shapeId);}
  function el(tag,attrs={},parent=null){const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent?.append(n);return n;}
  function label(parent,x,y,value,attrs={}){const f=Math.max(1,672/Math.max($('bench').clientWidth,300));const a={...attrs};a['font-size']=(a['font-size']||.016)*f;const n=el('text',{x,y,fill:'#294b39','font-size':.016,'font-family':'Tahoma, Arial, sans-serif',...a},parent);n.textContent=value;return n;}
  const polygon=sh=>sh.points.map(p=>p.join(',')).join(' ');
  const publish=()=>subscriber?.();
  function transform(){
    const s=state(),sh=shape();
    if(s.view==='hanging'){
      const [x,y]=sh.holes[s.hole];
      return {x:420,y:135,scale:1000,angle:s.angle,pivot:{x,y}};
    }
    return {x:420,y:285,scale:1120,angle:0,pivot:{x:.125,y:.14}};
  }
  function updateGeometry(){
    const s=state(),sh=shape(),t=transform();
    $('lamina').setAttribute('transform',`translate(${t.x} ${t.y}) rotate(${t.angle*180/Math.PI}) scale(${t.scale}) translate(${-t.pivot.x} ${-t.pivot.y})`);
    $('support').hidden=s.view!=='hanging';$('plumb').hidden=s.view!=='hanging';
    // SVG hidden is not supported consistently by older engines.
    for(const id of ['support','plumb'])$(id).style.display=s.view==='hanging'?'':'none';
    if(s.revealed){
      const p=M.properties(sh.points).center,force=$('force');
      if(force){const d=M.rotate({x:0,y:.065},-s.angle);force.setAttribute('x2',p.x+d.x);force.setAttribute('y2',p.y+d.y);}
    }
  }
  function renderPlate(){
    const sh=shape(),s=state();
    $('plate').setAttribute('points',polygon(sh));$('clip-polygon').setAttribute('points',polygon(sh));
    $('line-extensions').replaceChildren();$('recorded-lines').replaceChildren();
    for(const mark of s.marks){
      const attrs={x1:mark.point.x-mark.direction.x*.7,y1:mark.point.y-mark.direction.y*.7,x2:mark.point.x+mark.direction.x*.7,y2:mark.point.y+mark.direction.y*.7,stroke:colors[mark.hole],'stroke-width':.0022};
      el('line',{...attrs,'stroke-dasharray':'.007 .005','stroke-opacity':.6},$('line-extensions'));
      el('line',attrs,$('recorded-lines'));
    }
    $('holes').replaceChildren();
    sh.holes.forEach(([x,y],i)=>{
      const g=el('g',{'data-svg-hole':i},$('holes'));
      el('circle',{cx:x,cy:y,r:.017,fill:'transparent'},g);
      el('circle',{cx:x,cy:y,r:.0055,fill:'#fff',stroke:s.view==='hanging'&&i===s.hole?'#264d39':'#789483','stroke-width':.002},g);
      label(g,x+.011,y+.006,letters[i]);
    });
    $('selection').replaceChildren();
    if(s.guess){
      const {x,y}=s.guess;
      el('circle',{cx:x,cy:y,r:.0075,fill:'#fff',stroke:'#bb7c1b','stroke-width':.0025},$('selection'));
      el('path',{d:`M${x-.012} ${y}h.024M${x} ${y-.012}v.024`,stroke:'#bb7c1b','stroke-width':.0015},$('selection'));
      label($('selection'),x+.014,y-.009,text('จุดที่เลือก','Your point'),{'font-size':.012,fill:'#996410'});
    }
    $('solution').replaceChildren();
    if(s.revealed){
      const {x,y}=M.properties(sh.points).center;
      el('circle',{cx:x,cy:y,r:.006,fill:'#b43e43',stroke:'#fff','stroke-width':.0018},$('solution'));
      label($('solution'),x+.010,y+.016,'CG',{'font-size':.014,fill:'#a6323c'});
      if(s.view==='hanging')el('line',{id:'force',x1:x,y1:y,x2:x,y2:y+.065,stroke:'#b43e43','stroke-width':.002,'marker-end':'url(#weight-arrow)'},$('solution'));
    }
    updateGeometry();
  }
  function drawMini(svg,sh,mark){
    // Each saved trial is shown at its own equilibrium pose, with a fixed vertical.
    const g=el('g',{transform:`translate(100 20) rotate(${mark.angle*180/Math.PI}) scale(270) translate(${-mark.point.x} ${-mark.point.y})`},svg);
    el('polygon',{points:polygon(sh),fill:'#d3e2d3',stroke:'#55775f','stroke-width':.004},g);
    el('line',{x1:mark.point.x-mark.direction.x*.38,y1:mark.point.y-mark.direction.y*.38,x2:mark.point.x+mark.direction.x*.38,y2:mark.point.y+mark.direction.y*.38,stroke:colors[mark.hole],'stroke-width':.005},g);
    el('line',{x1:100,y1:20,x2:100,y2:110,stroke:'#294b39','stroke-width':1,'stroke-dasharray':'3 3'},svg);
    el('circle',{cx:100,cy:20,r:3,fill:'#294b39'},svg);
  }
  function renderTrials(){
    const s=state(),sh=shape();$('trials').replaceChildren();
    for(let i=0;i<3;i++){
      const card=document.createElement('article');card.className='trial';card.style.setProperty('--trial-color',colors[i]);
      const heading=document.createElement('h3');heading.textContent=text('รูแขวน ','Hole ')+letters[i];card.append(heading);
      const mark=s.marks.find(m=>m.hole===i);
      if(mark){
        const svg=el('svg',{viewBox:'0 0 200 125',role:'img','aria-label':text('ผลการแขวนรู ','Saved suspension ')+letters[i]});drawMini(svg,sh,mark);card.append(svg);
        const b=document.createElement('button');b.type='button';b.textContent=text('ดูการแขวน ','View trial ')+letters[i];b.onclick=()=>revisit(i);card.append(b);
      }else {const p=document.createElement('p');p.textContent=text('ยังไม่ได้บันทึก','Not recorded yet');card.append(p);}
      $('trials').append(card);
    }
    $('progress').textContent=text('บันทึกแล้ว ','Recorded ')+s.marks.length+'/3';
  }
  function showFeedback(){
    const s=state();$('feedback').hidden=!s.revealed;
    if(!s.revealed)return;
    const c=M.properties(shape().points).center,error=Math.hypot(s.guess.x-c.x,s.guess.y-c.y),outside=!M.inside(shape().points,c);
    $('feedback').replaceChildren();
    const h=document.createElement('h3');h.textContent=error<=.006?text('จุดที่เลือกอยู่ใกล้จุดตัดแล้ว','Your point is close to the intersection'):text('ลองเทียบจุดที่เลือกกับจุดตัดอีกครั้ง','Compare your point with the intersection again');$('feedback').append(h);
    const p=document.createElement('p');p.textContent=text('เครื่องหมาย CG สีแดงคือศูนย์ถ่วง จุดที่เลือกห่างประมาณ ','The red CG marker is the centre of gravity. Your point is about ')+(error*1000).toFixed(1)+text(' มม. (ยอมให้คลาดเคลื่อนในการแตะ 6 มม.)',' mm away (6 mm touch tolerance).');$('feedback').append(p);
    const why=document.createElement('p');why.textContent=text('เมื่อแผ่นแขวนจนหยุดนิ่ง แนวน้ำหนักผ่านจุดแขวน โมเมนต์ของน้ำหนักรอบจุดแขวนจึงเป็นศูนย์ ศูนย์ถ่วงอยู่ในแนวดิ่งใต้จุดแขวนทุกครั้ง สองแนวที่ต่างกันหาตำแหน่งร่วมได้ ส่วนแนวที่สามใช้ตรวจสอบ','At rest, the weight acts along a line through the support, so its torque about the support is zero. CG lies vertically below the support in each trial. Two distinct lines locate the common point; the third checks it.');$('feedback').append(why);
    if(outside){const p=document.createElement('p');p.textContent=text('แผ่นตัว L นี้มี CG อยู่ในช่องว่างนอกเนื้อแผ่นได้ เพราะ CG บอกตำแหน่งลัพธ์ของการกระจายมวล ไม่จำเป็นต้องมีเนื้อวัตถุอยู่ที่จุดนั้น','For this L-shaped plate, CG lies in the empty notch. CG is determined by the distribution of mass; material need not exist at that point.');$('feedback').append(p);}
  }
  function updateUI(){
    const s=state(),recorded=s.marks.some(m=>m.hole===s.hole),hasTwo=s.marks.length>=2&&M.intersection(s.marks[0],s.marks[1]);
    $('status').textContent=s.view==='overview'?text('ท่าเริ่มต้น','Original view'):s.running?text('กำลังแกว่ง','Swinging'):s.stable?text('หยุดนิ่งแล้ว','Settled'):text('ยังไม่สมดุล','Not at equilibrium');
    $('release').textContent=s.running?text('หยุดชั่วคราว','Pause'):s.view==='hanging'&&!s.stable&&s.omega!==0?text('ปล่อยต่อ','Resume'):text('ปล่อยทดลอง','Release');
    $('record').disabled=s.view!=='hanging'||!s.stable||recorded;
    $('record-help').textContent=recorded?text('บันทึกรูนี้แล้ว เปลี่ยนรูเพื่อหาอีกแนว','This hole is recorded. Use another hole for a new line.'):s.stable&&s.view==='hanging'?text('แผ่นหยุดนิ่งแล้ว บันทึกแนวได้','Settled. You can mark this vertical.'):text('รอแผ่นหยุดนิ่ง การกดหยุดกลางทางยังไม่ใช่สมดุล','Wait until settled. Pausing during motion is not equilibrium.');
    $('check').disabled=!(hasTwo&&s.guess);
    $('check-help').textContent=s.revealed?text('แสดง CG บนแผ่นแล้ว คำอธิบายอยู่ใต้บันทึกการแขวน','CG is shown on the plate. The explanation is below the trial records.'):!hasTwo?text('ต้องบันทึกอย่างน้อย 2 แนวจากคนละรู','Record at least two distinct suspension lines.'):!s.guess?text('กลับท่าเริ่มต้น แล้วแตะจุดที่คิดว่าเป็น CG','Return to the original view and choose your CG point.'):text('ใช้แนวที่สามช่วยตรวจสอบได้ก่อนเปิดคำอธิบาย','You can add the third line before opening the explanation.');
    $('instruction').textContent=s.view==='overview'?text('ลองแตะตำแหน่งที่คาดว่าเป็น CG หรือเลือกรู A–C เพื่อเริ่มแขวน','Tap your predicted CG, or choose A–C to suspend the plate.'):s.stable?text('แผ่นหยุดนิ่ง สังเกตแนวลูกดิ่งแล้วบันทึกเส้นบนแผ่น','The plate is settled. Observe the vertical and mark it on the plate.'):text('ปล่อยให้แผ่นหมุนได้อิสระ แล้วรอจนหยุดนิ่ง','Release the plate and let it rotate freely until it settles.');
    $('view-text').textContent=s.view==='overview'?text('ท่าเดิมของแผ่น · เส้นและจุดติดอยู่กับตัวแผ่น','Original orientation · marks stay on the plate'):text('แขวนจากรู ','Suspended from hole ')+letters[s.hole];
    document.querySelectorAll('[data-hole]').forEach(b=>b.setAttribute('aria-pressed',String(s.view==='hanging'&&Number(b.dataset.hole)===s.hole)));
  }
  function render(){renderPlate();renderTrials();updateUI();showFeedback();}
  function chooseHole(index){
    if(!Number.isInteger(index)||index<0||index>2)return;
    const s=state();s.hole=index;s.view='hanging';s.running=false;s.stable=false;s.calm=0;s.omega=0;
    s.angle=M.wrap(M.suspension(shape(),index).equilibrium+.65);accumulator=0;render();publish();
  }
  function revisit(index){const s=state(),mark=s.marks.find(m=>m.hole===index);if(!mark)return;s.hole=index;s.angle=mark.angle;s.omega=0;s.calm=0;s.view='hanging';s.running=false;s.stable=true;render();publish();}
  function overview(){const s=state();s.view='overview';s.running=false;accumulator=0;render();publish();}
  $('release').onclick=()=>{
    const s=state();
    if(s.view!=='hanging'||s.stable)chooseHole(s.hole);
    s.running=!s.running;updateUI();if(s.running&&$('bench').clientWidth<600)$('bench-title').scrollIntoView({block:'start',behavior:'smooth'});publish();
  };
  $('record').onclick=()=>{
    const s=state();if(!s.stable||s.view!=='hanging'||s.marks.some(m=>m.hole===s.hole))return;
    s.marks.push(M.mark(shape(),s.hole,s.angle));render();publish();
  };
  $('overview').onclick=overview;
  $('check').onclick=()=>{const s=state();if(s.marks.length<2||!s.guess||!M.intersection(s.marks[0],s.marks[1]))return;s.revealed=true;overview();};
  $('reset').onclick=()=>{if(!confirm(text('ล้างเส้นและจุดที่เลือกของแผ่นนี้ แล้วเริ่มใหม่หรือไม่?','Clear this plate’s lines and point, and start again?')))return;work.set(shapeId,initial(shape()));accumulator=0;render();publish();};
  document.querySelectorAll('[data-hole]').forEach(b=>b.onclick=()=>chooseHole(Number(b.dataset.hole)));
  $('shape').onchange=()=>{state().running=false;shapeId=$('shape').value;accumulator=0;render();publish();};
  function selectPoint(p){
    const s=state();if(s.view!=='overview')return;
    // The empty notch is selectable: CG can lie outside the material.
    s.guess={x:Math.max(-.07,Math.min(.36,p.x)),y:Math.max(-.06,Math.min(.36,p.y))};s.revealed=false;render();publish();
  }
  $('bench').addEventListener('click',event=>{
    const hole=event.target.closest('[data-svg-hole]');
    if(hole){chooseHole(Number(hole.dataset.svgHole));return;}
    if(state().view!=='overview')return;
    const matrix=$('lamina').getScreenCTM();if(!matrix)return;
    const pt=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());selectPoint(pt);
  });
  $('bench').addEventListener('keydown',event=>{
    if(state().view!=='overview')return;
    const moves={ArrowLeft:[-.001,0],ArrowRight:[.001,0],ArrowUp:[0,-.001],ArrowDown:[0,.001]};
    if(!moves[event.key])return;event.preventDefault();const p=state().guess||{x:.14,y:.14},d=moves[event.key];selectPoint({x:p.x+d[0],y:p.y+d[1]});
  });
  function language(next){
    lang=next==='en'?'en':'th';document.documentElement.lang=lang;
    document.querySelectorAll('[data-th][data-en]').forEach(n=>n.textContent=n.dataset[lang]);
    $('language').textContent=lang==='th'?'English':'ภาษาไทย';
    $('bench').setAttribute('aria-label',text('แผ่นวัตถุและแนวลูกดิ่ง','Lamina and plumb line'));
    $('shape').replaceChildren();for(const sh of M.shapes){const o=document.createElement('option');o.value=sh.id;o.textContent=sh[lang];$('shape').append(o);}$('shape').value=shapeId;render();
  }
  $('language').onclick=()=>language(lang==='th'?'en':'th');
  function frame(time){
    const dt=lastTime===null?0:Math.min((time-lastTime)/1000,.05);lastTime=time;
    const s=state();
    if(s.running){
      accumulator+=dt;
      while(accumulator>=1/240){
        const next=M.step(shape(),s.hole,s,1/240);s.angle=next.angle;s.omega=next.omega;accumulator-=1/240;
        const eq=M.suspension(shape(),s.hole).equilibrium;
        if(Math.abs(M.wrap(s.angle-eq))<.003&&Math.abs(s.omega)<.008)s.calm+=1/240;else s.calm=0;
        if(s.calm>=.6){s.angle=eq;s.omega=0;s.stable=true;s.running=false;accumulator=0;render();publish();break;}
      }
      updateGeometry();
    }
    requestAnimationFrame(frame);
  }
  function getState(){
    state();return {version:1,identity,shapeId,plates:Object.fromEntries([...work].map(([key,s])=>[key,structuredClone(s)]))};
  }
  function restoreState(snapshot){
    if(!snapshot||snapshot.version!==1||snapshot.identity!==identity||!M.shapes.some(x=>x.id===snapshot.shapeId)||!snapshot.plates||typeof snapshot.plates!=='object')return false;
    const restored=new Map();
    for(const [key,raw] of Object.entries(snapshot.plates)){
      const sh=M.shapes.find(x=>x.id===key);if(!sh||!raw||!Number.isInteger(raw.hole)||raw.hole<0||raw.hole>2||!Number.isFinite(raw.angle)||Math.abs(raw.angle)>Math.PI+.001||!Number.isFinite(raw.omega)||Math.abs(raw.omega)>100||!['overview','hanging'].includes(raw.view)||!Array.isArray(raw.marks)||raw.marks.length>3)return false;
      const holes=raw.marks.map(m=>m?.hole);if(holes.some(i=>!Number.isInteger(i)||i<0||i>2)||new Set(holes).size!==holes.length)return false;
      if(raw.guess!==null&&(!raw.guess||!Number.isFinite(raw.guess.x)||!Number.isFinite(raw.guess.y)||raw.guess.x<-.07||raw.guess.x>.36||raw.guess.y<-.06||raw.guess.y>.36))return false;
      const eq=M.suspension(sh,raw.hole).equilibrium;
      const stable=Math.abs(M.wrap(raw.angle-eq))<.0001&&Math.abs(raw.omega)<.0001;
      const marks=holes.map(h=>M.mark(sh,h,M.suspension(sh,h).equilibrium));
      restored.set(key,{...initial(sh),hole:raw.hole,angle:raw.angle,omega:raw.omega,view:raw.view,stable,marks,guess:raw.guess?{...raw.guess}:null,revealed:Boolean(raw.revealed&&raw.guess&&marks.length>=2)});
    }
    if(!restored.has(snapshot.shapeId))return false;
    work.clear();for(const [k,v] of restored)work.set(k,v);shapeId=snapshot.shapeId;$('shape').value=shapeId;accumulator=0;lastTime=null;render();publish();return true;
  }
  window.LearningHubSimulation={getState,restoreState,subscribe:callback=>{subscriber=typeof callback==='function'?callback:null;return()=>{subscriber=null;};}};
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='learning-hub-context')return;
    const nextIdentity=event.data.identity?.uid||'guest';
    if(nextIdentity!==identity){identity=nextIdentity;work.clear();shapeId='irregular';accumulator=0;}
    language(event.data.language||lang);
  });
  document.addEventListener('visibilitychange',()=>{lastTime=null;accumulator=0;});
  language('th');new ResizeObserver(()=>renderPlate()).observe($('bench'));requestAnimationFrame(frame);
  if(parent!==window)parent.postMessage({type:'learning-hub-tool-ready'},location.origin);
})();
