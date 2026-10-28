(() => {
  'use strict';
  const B=globalThis.DoubleSlitLabBridge,W=globalThis.InterferenceWater,V=globalThis.InterferenceWaterView,Q=globalThis.InterferenceMissions,M=globalThis.DoubleSlitLabModel,$=id=>document.getElementById(id);
  const s=()=>B.read(),T=(th,en)=>B.language()==='th'?th:en,F=(v,n=4)=>Number(v).toFixed(n);let time=0,last=null,drag=null,message=null;
  function event(){const m=s().missions;m.attempted[m.current]=false;message=null;}
  function mission(id,reset=false){
    B.change(state=>{
      const m=state.missions;m.current=id;m.enabled=true;m.answerOpen=false;m.attempted[id]=false;
      if(reset){m.answers[id]={};m.played[id]=false;m.completed=m.completed.filter(i=>i!==id);if(id===3){m.near=false;m.far=false;}}
      state.water=W.initial();state.water.L=id===2?12:id===3?6:24;state.water.x=id===3?6:0;
      if(id===3)Object.assign(state.water.layers,{paths:true,variables:true,formulas:true});
      if(id<4)state.view='water';else{
        state.view='light';state.lightPhase=0;
        if(id===4){state.config={...M.presets.A};state.cursors={left:-8,right:8};state.moved={left:false,right:false};}
      }message=null;
    },true);
  }
  function waterChange(fn){const p=structuredClone(s().water);fn(p);if(!W.valid(p))return;s().water=p;event();render();B.notify();}
  function renderWater(){
    const p=s().water,g=W.geometry(p);
    for(const key of ['wavelength','separation','L','x']){$('water-'+key).value=p[key];$('water-'+key+'-value').textContent=F(p[key],key==='x'?3:1)+' cm';}
    $('water-phase').value=p.phase;document.querySelectorAll('[data-layer]').forEach(n=>n.checked=p.layers[n.dataset.layer]);
    $('water-play').textContent=p.running?T('หยุดคลื่น','Pause waves'):T('เล่นคลื่น','Play waves');
    const possible=W.pointForDelta(p,p.wavelength/2)!==null;$('water-example').disabled=!possible;
    $('water-example-note').textContent=possible?T('P ตัวอย่างใช้ตำแหน่งคำนวณเต็ม จึงตรง Δr = λ/2 พอดี','The example uses full precision, giving exactly Δr = λ/2.'):T('จุดตัวอย่างอยู่นอกช่วง x ให้ลด L หรือเพิ่ม d แล้วลองใหม่','Example is outside the x range; reduce L or increase d.');
    $('water-readouts').replaceChildren();for(const [name,value] of [['r₁',F(g.r1)+' cm'],['r₂',F(g.r2)+' cm'],['Δr',F(g.delta)+' cm'],['Δr/λ',F(g.ratio)]]){const card=document.createElement('div'),label=document.createElement('span'),v=document.createElement('strong');label.textContent=name;v.textContent=value;card.append(label,v);$('water-readouts').append(card);}
    $('water-formulas').hidden=!p.layers.formulas;
    $('water-formulas').innerHTML=`<p class="equation">Δr = |r₂ − r₁| = ${F(g.delta)} cm</p><p class="equation">d|sin θ| = ${F(g.angular)} cm · ${T('ต่างจากค่าจริง','absolute error')} ${F(Math.abs(g.angular-g.delta))} cm</p><p class="equation">d|x|/L = ${F(g.small)} cm · ${T('ต่างจากค่าจริง','absolute error')} ${F(Math.abs(g.small-g.delta))} cm</p><p>θ = ${F(g.theta,2)}° · L/d = ${F(p.L/p.separation,2)}</p><p>${T('ใช้ d|sin θ| เมื่อฉากไกลเมื่อเทียบกับ d; ใช้ d|x|/L เมื่อเพิ่มเงื่อนไขมุมเล็ก θ ในภาพวัดจากแนวกลางถึงเส้นจากจุดกึ่งกลางสองแหล่งไป P','d|sin θ| assumes a screen far away compared with d. d|x|/L additionally needs a small angle. θ is measured from the central axis to the midpoint-to-P line.')}</p><p>${T('x คือตำแหน่ง P จากแนวกลาง ส่วน Δx ในสูตร λL/d คือระยะแถบ เป็นคนละปริมาณ','x is P’s offset from the centre line. Δx in λL/d is fringe spacing; these are different quantities.')}</p><p>${T('เฟส 0°: เสริมที่ Δr = mλ หักล้างที่ (m+½)λ; เฟส 180° สลับเงื่อนไข m = 0,1,2,… ใช้แอมพลิจูดที่ได้รับเท่ากัน','At 0°: constructive at Δr = mλ, destructive at (m+½)λ. At 180° exchange them; m = 0,1,2,…, assuming equal received amplitudes.')}</p>`;
    if(s().view==='water')V.draw($('water-canvas'),p,time);
  }
  function renderMission(){
    const state=s(),m=state.missions,id=m.current,req=Q.requirements(state),qs=Q.questions(id,state),ready=req.every(r=>r[0]);
    $('mission-card').hidden=!m.enabled;$('guided-toggle').textContent=m.enabled?T('สำรวจเอง','Explore freely'):T('กลับสู่ภารกิจ','Return to missions');
    $('mission-select').replaceChildren();Q.titles.forEach((title,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(m.completed.includes(i)?'✓ ':'')+T(...title);$('mission-select').append(o);});$('mission-select').value=id;
    $('mission-progress').textContent=m.completed.length+'/6 '+T('ผ่านแล้ว','completed');$('mission-instruction').textContent=T(...Q.instructions[id]);
    $('mission-steps').replaceChildren();for(const [done,words] of req){const li=document.createElement('li');li.classList.toggle('done',done);li.textContent=(done?'✓ ':'○ ')+T(...words);$('mission-steps').append(li);}
    $('mission-near').hidden=id!==3;$('mission-far').hidden=id!==3;$('mission-answer').open=m.answerOpen;
    $('mission-questions').replaceChildren();
    qs.forEach((q,i)=>{
      const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=(i+1)+'. '+T(...q.text);field.append(legend);
      if(q.type==='choice')for(const [value,th,en] of q.options){const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name=`mission-${id}-q${i}`;input.value=value;input.checked=m.answers[id]['q'+i]===value;input.onchange=()=>{m.answers[id]['q'+i]=value;m.attempted[id]=false;$('mission-feedback').replaceChildren();B.notify();};label.append(input,document.createTextNode(T(th,en)));field.append(label);}
      else{const input=document.createElement('input');input.type='text';input.inputMode='decimal';input.autocomplete='off';input.maxLength=80;input.id='mission-number-'+i;input.setAttribute('aria-label',T(...q.text));input.value=m.answers[id]['q'+i]||'';input.oninput=()=>{m.answers[id]['q'+i]=input.value;m.attempted[id]=false;$('mission-feedback').replaceChildren();B.notify();};field.append(input);}
      const hint=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent=T('ขอคำใบ้','Hint');p.textContent=T(...q.hint);hint.append(summary,p);field.append(hint);$('mission-questions').append(field);
    });
    $('mission-check').disabled=!ready;$('mission-lock-note').textContent=ready?T('ทดลองครบตามรายการแล้ว ตอบให้ครบและตรวจคำตอบได้','Experiment steps complete. Answer every question, then check.'):T('ทำรายการวงกลมด้านบนให้ครบก่อนตรวจคำตอบ','Complete the open-circle steps above before checking.');
    $('mission-feedback').replaceChildren();if(message){const p=document.createElement('p');p.textContent=T(...message);$('mission-feedback').append(p);}
    if(m.attempted[id]){const results=Q.grade(state),heading=document.createElement('p');heading.className=results.every(Boolean)?'correct':'retry';heading.textContent=results.every(Boolean)?T('ผ่านภารกิจนี้แล้ว ไปต่อหรือย้อนทดลองได้','Mission completed. Continue or explore again.'):T('ยังมีข้อที่ต้องลองใหม่ ดูคำใบ้และคำอธิบายได้','Some answers need another try. Use the hints and explanations.');$('mission-feedback').append(heading);qs.forEach((q,i)=>{const p=document.createElement('p');p.textContent=(results[i]?'✓ ':'↻ ')+(i+1)+'. '+T(...q.explain);$('mission-feedback').append(p);});}
    $('mission-next').disabled=!m.completed.includes(id);$('mission-next').textContent=id===5?T('ทบทวนภารกิจแรก','Revisit mission 1'):T('ภารกิจถัดไป','Next mission');
    $('water-answer').hidden=!m.enabled;
  }
  function render(){document.querySelectorAll('.view-tabs button[id^="view-"]').forEach(b=>b.setAttribute('aria-pressed',String(b.id==='view-'+s().view)));renderWater();renderMission();}
  for(const view of ['water','light'])$('view-'+view).onclick=()=>B.change(state=>{state.view=view;state.water.running=false;},true);
  $('guided-toggle').onclick=()=>B.change(state=>state.missions.enabled=!state.missions.enabled);
  $('mission-select').onchange=()=>mission(Number($('mission-select').value));$('mission-reset').onclick=()=>mission(s().missions.current,true);
  $('mission-next').onclick=()=>{mission((s().missions.current+1)%6);$('mission-card').scrollIntoView({block:'start'});};
  $('mission-answer').addEventListener('toggle',()=>{s().missions.answerOpen=$('mission-answer').open;B.notify();});
  $('mission-check').onclick=()=>{
    const m=s().missions,id=m.current;if(!Q.requirements(s()).every(r=>r[0]))return;
    if(Q.questions(id,s()).some((q,i)=>!(m.answers[id]['q'+i]||'').trim())){message=['ตอบคำถามให้ครบก่อนตรวจ','Answer every question before checking.'];renderMission();return;}
    message=null;m.attempted[id]=true;if(Q.grade(s()).every(Boolean)&&!m.completed.includes(id))m.completed.push(id);renderMission();B.notify();
  };
  function comparison(far){B.change(state=>{state.view='water';state.water={...W.initial(),L:far?60:6,x:6,layers:{...W.initial().layers,paths:true,variables:true,formulas:true}};state.missions[far?'far':'near']=true;state.missions.attempted[3]=false;},true);}
  $('mission-near').onclick=()=>comparison(false);$('mission-far').onclick=()=>comparison(true);
  for(const key of ['wavelength','separation','L','x'])$('water-'+key).oninput=()=>waterChange(p=>p[key]=Number($('water-'+key).value));
  $('water-phase').onchange=()=>waterChange(p=>p.phase=Number($('water-phase').value));
  document.querySelectorAll('[data-layer]').forEach(n=>n.onchange=()=>waterChange(p=>p.layers[n.dataset.layer]=n.checked));
  $('water-play').onclick=()=>{const m=s().missions;waterChange(p=>p.running=!p.running);if(s().water.running)m.played[m.current]=true;renderMission();B.notify();};
  $('water-center').onclick=()=>waterChange(p=>p.x=0);$('water-example').onclick=()=>{const x=W.pointForDelta(s().water,s().water.wavelength/2);if(x!==null)waterChange(p=>p.x=x);};
  $('water-answer').onclick=()=>{s().missions.answerOpen=true;renderMission();$('mission-answer').scrollIntoView({block:'start'});B.notify();};
  function local(event){const m=$('water-overlay').getScreenCTM();return m?new DOMPoint(event.clientX,event.clientY).matrixTransform(m.inverse()):null;}
  $('water-stage').addEventListener('click',event=>{if(event.target.closest('#water-probe'))return;const q=local(event);if(q)waterChange(p=>p.x=Math.max(-8,Math.min(8,W.fromScreen(q.x,q.y).x)));});
  const probe=$('water-probe');probe.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const q=local(e);if(!q)return;e.preventDefault();probe.focus();probe.setPointerCapture(e.pointerId);drag={id:e.pointerId,y:q.y,x:s().water.x};};
  probe.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;const q=local(e);if(q)waterChange(p=>p.x=Math.max(-8,Math.min(8,drag.x-(q.y-drag.y)/W.scale)));};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])probe.addEventListener(name,()=>drag=null);
  probe.onkeydown=e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();waterChange(p=>p.x=Math.max(-8,Math.min(8,p.x+(e.key==='ArrowUp' ? .1 : -.1))));};
  globalThis.GuidedInterference={render,event};
  new ResizeObserver(()=>{if(s().view==='water')V.draw($('water-canvas'),s().water,time);}).observe($('water-stage'));
  document.addEventListener('visibilitychange',()=>last=null);
  function frame(now){const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;if(s().view==='water'&&s().water.running&&!document.hidden){time+=dt*.7;V.draw($('water-canvas'),s().water,time);}requestAnimationFrame(frame);}requestAnimationFrame(frame);render();
})();
