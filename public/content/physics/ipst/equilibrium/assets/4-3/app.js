(() => {
  'use strict';
  const M=Equilibrium43Model,missions=Equilibrium43Missions,$=id=>document.getElementById(id);
  const ID='physics-ipst-equilibrium-4-3-sim',colors={f:'#b86217',f2:'#8250a8',f3:'#63719b',r:'#087b61',v:'#2169bd',soft:'#9caac2'};
  let identity='guest',lang=new URLSearchParams(location.search).get('lang')==='en'?'en':'th';
  try{const preferred=new URLSearchParams(location.search).get('lang')||localStorage.getItem('simulation-language:'+ID);if(['th','en'].includes(preferred))lang=preferred;}catch{}
  let running=false,pending=null,lastFrame=null,remaining=0,subscriber=null,saveFailed=false;
  const P=pair=>pair[lang==='th'?0:1],L=(th,en)=>P([th,en]);
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,d=2)=>Math.abs(n)<1e-8?(0).toFixed(d):Math.abs(n)<.5*10**(-d)?n.toPrecision(2):n.toFixed(d);
  const zero=()=>({x:0,y:0,vx:0,vy:0});
  const controlsDefault=()=>({press:0,left:0,right:2,third:5,angle:233.13010235415598,alpha:30,beta:30,slope:20,components:false});
  function blank(){return {schemaVersion:1,contentId:ID,identityKey:identity,mission:0,completed:missions.map(()=>false),predictions:missions.map(()=>null),answers:missions.map(m=>m.questions.map(()=>null)),observations:missions.map(()=>({})),body:zero(),time:0,controls:controlsDefault()};}
  let s=blank();
  const key=()=>`learning-hub-simulation:v1:${identity}:${ID}`;
  const maxUnlocked=()=>{let i=0;while(i<missions.length-1&&s.completed[i])i++;return i;};
  const allObserved=i=>missions[i].observations.every(o=>s.observations[i][o.key]);
  const predictionMade=()=>!missions[s.mission].prediction||s.predictions[s.mission]!==null;
  function finishIfReady(){const i=s.mission;if(allObserved(i)&&predictionMade()&&missions[i].questions.every((q,j)=>s.answers[i][j]===q.answer))s.completed[i]=true;}
  function state(){return structuredClone(s);}
  function status(){ $('saveStatus').textContent=saveFailed?L('ยังบันทึกในเครื่องไม่ได้','Device save unavailable'):L('บันทึกความคืบหน้าในเครื่องนี้','Progress saved on this device'); }
  function save(){try{localStorage.setItem(key(),JSON.stringify(s));saveFailed=false;}catch{saveFailed=true;}status();subscriber?.();}
  function validChoice(v,q){return v===null||(Number.isInteger(v)&&v>=0&&v<q.options.length);}
  function restore(value){
    if(!value||value.schemaVersion!==1||value.contentId!==ID||value.identityKey!==identity||!Number.isInteger(value.mission)||value.mission<0||value.mission>=missions.length)return false;
    if(!Array.isArray(value.completed)||value.completed.length!==missions.length||value.completed.some(x=>typeof x!=='boolean'))return false;
    for(const k of ['answers','predictions','observations'])if(!Array.isArray(value[k])||value[k].length!==missions.length)return false;
    for(let i=0;i<missions.length;i++){
      const m=missions[i];if(!validChoice(value.predictions[i],m.prediction||{options:[]}))return false;
      if(!Array.isArray(value.answers[i])||value.answers[i].length!==m.questions.length||value.answers[i].some((x,j)=>!validChoice(x,m.questions[j])))return false;
      const obs=value.observations[i];if(!obs||Array.isArray(obs)||typeof obs!=='object'||Object.keys(obs).some(k=>!m.observations.some(o=>o.key===k)))return false;
      for(const v of Object.values(obs))if(!v||!Array.isArray(v.readings)||!v.readings.every(a=>Array.isArray(a)&&a.length===3&&Object.hasOwn(labels,a[0])&&Number.isFinite(a[1])&&['N','m/s','m','s'].includes(a[2])))return false;
    }
    if(!value.body||['x','y','vx','vy'].some(k=>!Number.isFinite(value.body[k])||Math.abs(value.body[k])>1e7)||!Number.isFinite(value.time)||value.time<0||value.time>1e7)return false;
    const c=value.controls;if(!c||typeof c.components!=='boolean')return false;
    const ranges={press:[0,20],left:[0,6],right:[0,6],third:[0,8],angle:[180,270],alpha:[15,75],beta:[15,75],slope:[10,40]};
    if(Object.entries(ranges).some(([k,[lo,hi]])=>!Number.isFinite(c[k])||c[k]<lo||c[k]>hi))return false;
    let allowed=0;while(allowed<missions.length-1&&value.completed[allowed])allowed++;
    if(value.mission>allowed)return false;
    s=structuredClone(value);running=false;pending=null;remaining=0;return true;
  }
  function load(){try{const value=JSON.parse(localStorage.getItem(key())||'null');if(value)restore(value);}catch{saveFailed=true;}}
  function button(text,fn,className=''){const b=document.createElement('button');b.type='button';b.textContent=text;b.className=className;b.onclick=fn;return b;}
  function message(text){$('runMessage').textContent=text;}
  function forces(){
    const c=s.controls;
    if(s.mission===0){const t=M.table(2,c.press);return [{x:0,y:t.normal},{x:0,y:-t.weight},{x:0,y:-t.press}];}
    if(s.mission===1||s.mission===5)return [{x:-c.left,y:0},{x:c.right,y:0}];
    if(s.mission===2)return [{x:3,y:0},{x:0,y:4},M.vector(c.third,c.angle)];
    if(s.mission===3)return M.ropes(60,c.alpha,c.beta).forces;
    const p=M.incline(c.slope),theta=M.rad(c.slope);
    return [{x:0,y:-p.weight},{x:-p.normal*Math.sin(theta),y:p.normal*Math.cos(theta)},{x:p.friction*Math.cos(theta),y:p.friction*Math.sin(theta)}];
  }
  function readings(){
    const c=s.controls,i=s.mission;
    if(i===0){const p=M.table(2,c.press);return [['weight',p.weight,'N'],['normal',p.normal,'N'],['press',p.press,'N'],['resultant',0,'N']];}
    if(i===1||i===5)return [['left',c.left,'N'],['right',c.right,'N'],['resultantX',c.right-c.left,'N'],['velocityX',s.body.vx,'m/s'],['positionX',s.body.x,'m'],['time',s.time,'s']];
    if(i===2){const f=M.sum(forces());return [['resultantX',f.x,'N'],['resultantY',f.y,'N'],['resultant',M.magnitude(f),'N'],['speed',Math.hypot(s.body.vx,s.body.vy),'m/s']];}
    if(i===3){const p=M.ropes(60,c.alpha,c.beta),f=M.sum(p.forces),values=[['tensionLeft',p.left,'N'],['tensionRight',p.right,'N'],['weight',60,'N']];
      if(c.components)values.push(['leftX',p.forces[0].x,'N'],['leftY',p.forces[0].y,'N'],['rightX',p.forces[1].x,'N'],['rightY',p.forces[1].y,'N']);
      return [...values,['resultantX',f.x,'N'],['resultantY',f.y,'N']];}
    const p=M.incline(c.slope);return [['normal',p.normal,'N'],['needed',p.down,'N'],['limit',p.limit,'N'],['friction',p.friction,'N'],['resultantSlope',p.down-p.friction,'N'],['slopeSpeed',s.body.vx,'m/s']];
  }
  const labels={weight:['น้ำหนัก W','Weight W'],normal:['แรงตั้งฉาก N','Normal force N'],press:['แรงกด P','Hand force P'],resultant:['ขนาดแรงลัพธ์','Resultant magnitude'],left:['แรงซ้าย','Leftward force'],right:['แรงขวา','Rightward force'],resultantX:['ΣFₓ (ขวาเป็นบวก)','ΣFₓ (right positive)'],resultantY:['ΣFᵧ (ขึ้นเป็นบวก)','ΣFᵧ (up positive)'],velocityX:['vₓ (ขวาเป็นบวก)','vₓ (right positive)'],velocityBefore:['ความเร็วก่อนทดลอง','Velocity before'],velocityAfter:['ความเร็วหลังทดลอง','Velocity after'],interval:['ช่วงเวลาที่ทดลอง','Observation interval'],positionX:['ตำแหน่ง x','Position x'],time:['เวลาจำลอง','Simulation time'],speed:['อัตราเร็ว','Speed'],tensionLeft:['แรงตึงซ้าย T₁','Left tension T₁'],tensionRight:['แรงตึงขวา T₂','Right tension T₂'],leftX:['T₁ₓ = −T₁ cos α','T₁ₓ = −T₁ cos α'],leftY:['T₁ᵧ = T₁ sin α','T₁ᵧ = T₁ sin α'],rightX:['T₂ₓ = T₂ cos β','T₂ₓ = T₂ cos β'],rightY:['T₂ᵧ = T₂ sin β','T₂ᵧ = T₂ sin β'],needed:['แรงเสียดทานที่ต้องใช้ให้นิ่ง','Friction needed for rest'],limit:['แรงเสียดทานสถิตสูงสุด','Maximum static friction'],friction:['แรงเสียดทานจริง','Actual friction'],resultantSlope:['แรงลัพธ์ลงลาด','Downhill resultant'],slopeSpeed:['อัตราเร็วลงลาด','Downhill speed']};
  const evidenceReadings=(mission,values)=>mission===3?values.filter(([k])=>['tensionLeft','tensionRight','weight'].includes(k)):values;
  function renderReadings(){
    $('readings').innerHTML=readings().map(([k,v,u])=>`<div class="reading"><small>${esc(P(labels[k]))}</small><strong>${fmt(v)} <span>${u}</span></strong></div>`).join('');
    const balanced=M.balanced(M.sum(forces()));
    $('status').textContent=balanced?L('แรงลัพธ์เป็นศูนย์','Zero resultant force'):L('แรงลัพธ์ไม่เป็นศูนย์','Non-zero resultant force');
    $('status').classList.toggle('unbalanced',!balanced);
    $('play').textContent=running?L('หยุดภาพ','Pause'):L('ทดลองแรงที่ตั้ง','Run this setup');
    $('play').disabled=!predictionMade();$('play').hidden=s.mission===5;$('restart').hidden=s.mission===5;
  }
  function slider(id,label,min,max,step,value,unit,callback){
    const box=document.createElement('label');box.className='slider';box.htmlFor=id;
    const row=document.createElement('span');row.className='slider-label';const name=document.createElement('span'),out=document.createElement('output');name.textContent=label;out.textContent=fmt(value,step<1?1:0)+unit;
    const input=document.createElement('input');input.type='range';input.id=id;input.min=min;input.max=max;input.step=step;input.value=value;input.setAttribute('aria-label',label);
    input.oninput=()=>{callback(Number(input.value));out.textContent=fmt(Number(input.value),step<1?1:0)+unit;draw();renderReadings();save();};row.append(name,out);box.append(row,input);return box;
  }
  function renderControls(){
    const node=$('controls'),c=s.controls;node.replaceChildren();
    if(s.mission===1){
      for(const [k,label] of [['left',L('แรงไปซ้าย','Leftward force')],['right',L('แรงไปขวา','Rightward force')]])node.append(slider(k,label,0,6,.5,c[k],' N',v=>{c[k]=v;pending=null;}));
    }else if(s.mission===2){
      node.append(slider('third',L('ขนาดแรงที่สาม','Third force magnitude'),0,8,.1,c.third,' N',v=>{c.third=v;running=false;pending=null;s.body=zero();s.time=0;}));
      node.append(slider('angle',L('ทิศแรงที่สาม: ทวนเข็มจากแกนขวา','Third-force angle: counterclockwise from right'),180,270,.1,c.angle,'°',v=>{c.angle=v;running=false;pending=null;s.body=zero();s.time=0;}));
    }else if(s.mission===3){
      for(const [k,label] of [['alpha',L('มุมเชือกซ้าย α จากแนวระดับ','Left rope angle α from horizontal')],['beta',L('มุมเชือกขวา β จากแนวระดับ','Right rope angle β from horizontal')]])node.append(slider(k,label,15,75,1,c[k],'°',v=>{c[k]=v;pending=null;}));
    }else if(s.mission===4){
      const control=slider('slope',L('มุมพื้นเอียง: เปลี่ยนแล้วเริ่มจากหยุดนิ่ง','Slope angle: changing it resets the release'),10,40,1,c.slope,'°',v=>{running=false;pending=null;c.slope=v;s.body=zero();s.time=0;message(L('จัดมุมใหม่แล้ว เริ่มจากหยุดนิ่ง','New angle set. The block starts from rest.'));});node.append(control);
    }
    $('components').checked=c.components;$('components').disabled=![2,3,4].includes(s.mission);
  }
  function renderPrediction(){
    const m=missions[s.mission],node=$('prediction');node.replaceChildren();node.hidden=!m.prediction;if(!m.prediction)return;
    const title=document.createElement('h3');title.textContent=L('ทำนายก่อนทดลอง','Predict before you try');node.append(title);
    const p=document.createElement('p');p.textContent=P(m.prediction.text);node.append(p);
    const tried=Object.keys(s.observations[s.mission]).length>0,selected=s.predictions[s.mission];
    m.prediction.options.forEach((option,i)=>{const b=button(P(option),()=>{s.predictions[s.mission]=i;renderPrediction();renderObservations();renderReadings();save();},'choice');b.setAttribute('aria-pressed',selected===i?'true':'false');b.disabled=tried;node.append(b);});
    if(tried){const p=document.createElement('p');p.className='feedback';p.textContent=L('เทียบกับที่ทำนาย: ','Compare with your prediction: ')+P(m.prediction.explain);node.append(p);}
    else{const p=document.createElement('p');p.className='model-note';p.textContent=L('เลือกสิ่งที่คิดก่อน ทดลองแล้วค่อยเทียบผล คำทำนายผิดได้','Choose what you expect, then compare with the experiment. Your prediction may be wrong.');node.append(p);}
  }
  function renderObservations(){
    const node=$('observations'),m=missions[s.mission];node.replaceChildren();node.parentElement.hidden=s.mission===5;
    m.observations.forEach(o=>{const done=!!s.observations[s.mission][o.key],b=button((done?'✓ ':'')+P(o.label),()=>observe(o.key),'observation-button'+(done?' done':''));b.dataset.observation=o.key;b.disabled=!predictionMade()||running;node.append(b);});
    const evidence=$('evidence');evidence.replaceChildren();evidence.hidden=s.mission===5;
    const h=document.createElement('h3');h.textContent=L('ผลที่เก็บไว้','Recorded evidence');evidence.append(h);
    for(const o of m.observations){const data=s.observations[s.mission][o.key];if(!data)continue;const p=document.createElement('p');p.textContent=P(o.label);evidence.append(p);const ul=document.createElement('ul');
      evidenceReadings(s.mission,data.readings).forEach(([k,v,u])=>{const li=document.createElement('li');li.textContent=`${P(labels[k])}: ${fmt(v)} ${u}`;ul.append(li);});evidence.append(ul);
    }
    if(!Object.keys(s.observations[s.mission]).length){const p=document.createElement('p');p.textContent=L('ผลจะปรากฏหลังทดลองแต่ละกรณี','Results appear after each experiment.');evidence.append(p);}
  }
  function renderQuestions(){
    const m=missions[s.mission],ready=allObserved(s.mission),node=$('questions');node.replaceChildren();
    $('questionsHint').textContent=ready?L('เลือกคำตอบที่อธิบายผลได้ ถ้ายังไม่ตรง ลองกลับไปสังเกตแล้วตอบใหม่','Choose the explanation supported by the results. If it is incorrect, observe again and retry.'):L('ทดลองกรณีด้านบนให้ครบก่อน แล้วคำถามจะปรากฏ','Try all the cases above to reveal these questions.');
    $('questionProgress').textContent=`${s.answers[s.mission].filter((a,j)=>a===m.questions[j].answer).length}/${m.questions.length}`;
    if(ready)m.questions.forEach((q,j)=>{const section=document.createElement('section');section.className='question';section.dataset.question=String(j);
      const title=document.createElement('h3');title.textContent=`${j+1}. ${P(q.text)}`;section.append(title);const opts=document.createElement('div');opts.className='options';const selected=s.answers[s.mission][j];
      q.options.forEach((option,k)=>{const b=button(`${String.fromCharCode(65+k)}. ${P(option)}`,()=>{s.answers[s.mission][j]=k;finishIfReady();renderQuestions();renderNavigation();save();},'choice'+(selected===k?(k===q.answer?' correct':' incorrect'):''));b.setAttribute('aria-pressed',selected===k?'true':'false');opts.append(b);});section.append(opts);
      if(selected!==null){const p=document.createElement('p');p.className='feedback '+(selected===q.answer?'correct':'incorrect');p.setAttribute('role','status');p.textContent=(selected===q.answer?L('✓ ถูกต้อง · ','✓ Correct · '):L('ลองอีกครั้ง · ','Try again · '))+P(q.explain);section.append(p);}node.append(section);
    });
    $('conclusion').hidden=!s.completed[s.mission];$('conclusion').replaceChildren();
    if(s.completed[s.mission]){const h=document.createElement('h3');h.textContent=s.mission===5?L('ครบแล้ว ลองอธิบายด้วยคำของตัวเอง','Complete. Explain it in your own words.'):L('สิ่งที่สรุปได้','What the evidence shows');const p=document.createElement('p');p.textContent=P(m.conclusion);$('conclusion').append(h,p);}
    $('next').hidden=!s.completed[s.mission]||s.mission===missions.length-1;$('next').textContent=L('ไปช่วงถัดไป →','Next mission →');
  }
  function renderNavigation(){
    $('progress').textContent=L(`ผ่านแล้ว ${s.completed.filter(Boolean).length}/6 ช่วง`,`Completed ${s.completed.filter(Boolean).length}/6 missions`);
    $('missionNav').replaceChildren();missions.forEach((m,i)=>{const b=button(`${s.completed[i]?'✓ ':''}${i+1}. ${P(m.short)}`,()=>selectMission(i),s.completed[i]?'passed':'');b.disabled=i>maxUnlocked();if(i===s.mission)b.setAttribute('aria-current','step');$('missionNav').append(b);});
  }
  function selectMission(i){
    if(i>maxUnlocked())return;running=false;pending=null;s.mission=i;s.body=zero();s.time=0;s.controls=controlsDefault();
    if(i===5){s.controls.left=2;s.controls.right=2;s.body.vx=2;}
    message('');render();save();$('missionTitle').focus({preventScroll:true});
  }
  function render(){
    const m=missions[s.mission];$('stepLabel').textContent=L(`ช่วง ${s.mission+1} จาก 6`,`Mission ${s.mission+1} of 6`);$('missionTitle').textContent=P(m.title);$('missionTitle').tabIndex=-1;$('instruction').textContent=P(m.instruction);$('sceneTitle').textContent=P(m.scene);$('modelNote').textContent=P(m.note);
    renderNavigation();renderPrediction();renderObservations();renderControls();renderQuestions();renderReadings();draw();status();
  }
  function setLanguage(next){lang=next==='en'?'en':'th';try{localStorage.setItem('simulation-language:'+ID,lang);}catch{}document.documentElement.lang=lang;document.title=L('4.3 สมดุลต่อการเลื่อนที่','4.3 Translational equilibrium');document.querySelectorAll('[data-th][data-en]').forEach(n=>n.textContent=n.dataset[lang]);$('language').textContent=lang==='th'?'EN':'ไทย';$('language').setAttribute('aria-label',L('เปลี่ยนเป็นภาษาอังกฤษ','Switch to Thai'));render();}
  function snapshotObservation(key){
    let values=readings();if(s.mission===1&&pending){values=[['velocityBefore',pending.startV,'m/s'],['velocityAfter',s.body.vx,'m/s'],['resultantX',s.controls.right-s.controls.left,'N'],['interval',pending.duration,'s']];}
    s.observations[s.mission][key]={readings:values.map(x=>[...x])};pending=null;finishIfReady();renderPrediction();renderObservations();renderQuestions();renderNavigation();save();
  }
  function observe(key){
    if(!predictionMade()||running)return;
    const c=s.controls,i=s.mission;s.time=i===1?s.time:0;
    if(i===0){c.press=key==='press'?20:0;snapshotObservation(key);draw();renderReadings();return;}
    if(i===3){const angles={shallow:[30,30],steep:[60,60],asymmetric:[20,50]}[key];c.alpha=angles[0];c.beta=angles[1];c.components=true;renderControls();snapshotObservation(key);draw();renderReadings();return;}
    if(i===1){
      if(key==='accelerate'){s.body=zero();s.time=0;c.left=0;c.right=2;}
      else if(key==='coast'){if(!s.observations[i].accelerate||s.body.vx<=.1){message(L('เร่งรถไปขวาก่อน แล้วค่อยปรับแรงให้เท่ากัน','First accelerate right, then balance the forces.'));return;}c.left=2;c.right=2;}
      else{if(!s.observations[i].coast||s.body.vx<=.1){message(L('ทดลองช่วงแรงเท่ากันขณะรถวิ่งก่อน','First try balanced forces while the cart is moving.'));return;}c.left=4;c.right=2;}
      startRun(key,key==='brake'?Math.min(1,s.body.vx*.5):2);
    }else if(i===2){s.body=zero();c.third=key==='closed'?5:0;c.angle=233.13010235415598;startRun(key,1);}
    else if(i===4){s.body=zero();c.slope=key==='stick'?20:30;startRun(key,1);}
    renderControls();renderReadings();draw();
  }
  function startRun(key,duration){running=true;remaining=duration;pending=key?{key,startV:s.body.vx,duration}:null;lastFrame=null;message(L('กำลังทดลอง… ดูแรงลัพธ์เทียบกับความเร็ว','Experiment running… compare resultant force and velocity'));renderObservations();}
  function tick(dt){
    const i=s.mission,step=Math.min(dt,remaining);if(i===1)s.body=M.advance(s.body,M.sum(forces()),2,step);
    if(i===2)s.body=M.advance(s.body,M.sum(forces()),1,step);
    if(i===4){const p=M.incline(s.controls.slope);s.body=M.advance(s.body,{x:2*p.acceleration,y:0},2,step);}
    s.time+=step;remaining=Math.max(0,remaining-step);
    if(remaining<=1e-8){running=false;if(pending)snapshotObservation(pending.key);else{renderObservations();save();}message(L('ทดลองครบช่วงแล้ว ภาพหยุดให้เปรียบเทียบค่า','Observation interval complete. The view is paused for comparison.'));}
  }
  function frame(now){if(lastFrame===null)lastFrame=now;const dt=Math.min(Math.max(0,(now-lastFrame)/1000),.25);lastFrame=now;if(running&&document.visibilityState!=='hidden'){tick(dt);draw();renderReadings();}requestAnimationFrame(frame);}
  function resetExperiment(){running=false;pending=null;s.body=zero();s.time=0;if(s.mission===5)s.body.vx=2;message(L('เริ่มจากหยุดนิ่งอีกครั้ง เก็บผลเดิมไว้ให้เปรียบเทียบ','Restarted from rest. Previous evidence is kept for comparison.'));renderReadings();renderObservations();draw();save();}
  function arrow(x,y,dx,dy,color,label='',dashed=false){
    if(Math.hypot(dx,dy)<.05)return '';
    const id=Object.keys(colors).find(k=>colors[k]===color)||'f',tx=x+dx,ty=y+dy;
    return `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="${color}" stroke-width="${dashed?2:4}" ${dashed?'stroke-dasharray="6 4"':''} marker-end="url(#arrow-${id})"/>${label?`<text x="${tx+(dx<0?-8:8)}" y="${ty-9}" text-anchor="${dx<0?'end':'start'}" style="fill:${color}">${esc(label)}</text>`:''}`;
  }
  const text=(x,y,value,className='',anchor='start')=>`<text x="${x}" y="${y}" class="${className}" text-anchor="${anchor}">${esc(value)}</text>`;
  const line=(x1,y1,x2,y2,stroke='#a8b5ce',width=2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}"/>`;
  function draw(){
    const c=s.controls,i=s.mission;
    let svg=`<title id="sceneDescription">${esc(P(missions[i].scene))}</title><defs>${Object.entries(colors).map(([k,v])=>`<marker id="arrow-${k}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L9 4.5 L0 9 Z" fill="${v}"/></marker>`).join('')}</defs>`;
    if(i===0){
      const p=M.table(2,c.press);svg+=`<rect x="235" y="128" width="170" height="103" rx="9" fill="#dee9fb" stroke="#8498bc" stroke-width="3"/><rect x="246" y="139" width="148" height="77" fill="#99c4e4"/><path d="M310 230 v34 h-28 h76 h-28 v-34" fill="none" stroke="#8294ae" stroke-width="10"/><rect x="90" y="273" width="460" height="16" rx="4" fill="#d9bd8d"/>`;
      svg+=arrow(320,200,0,-p.normal*3.2,colors.f,'N')+arrow(320,200,0,p.weight*3.2,colors.f2,'W');if(p.press)svg+=arrow(320,40,0,64,colors.f3,'P');svg+=text(320,345,L(`แรงขึ้น ${p.normal} N = แรงลง ${p.weight+p.press} N`,`Up ${p.normal} N = down ${p.weight+p.press} N`),'strong','middle');
    }else if(i===1||i===5){
      const offset=((s.body.x*55)%60+60)%60;svg+=line(20,262,620,262,'#a3b2ca',4);
      for(let j=-1;j<12;j++){const x=j*60-offset;svg+=line(x,264,x-18,279,'#c7d1e0');}
      svg+=`<rect x="260" y="177" width="120" height="57" rx="12" fill="#dae4fc" stroke="#7f96c0" stroke-width="3"/><circle cx="282" cy="243" r="15" fill="#62718c"/><circle cx="358" cy="243" r="15" fill="#62718c"/>`+text(320,165,'2 kg','strong','middle');
      svg+=arrow(320,205,-c.left*19,0,colors.f,`${fmt(c.left,1)} N`)+arrow(320,205,c.right*19,0,colors.f2,`${fmt(c.right,1)} N`);
      const vscale=Math.min(45,200/Math.max(.01,Math.abs(s.body.vx)));svg+=arrow(320,100,s.body.vx*vscale,0,colors.v)+text(320,77,`v = ${fmt(s.body.vx)} m/s`,'strong','middle');
      const resultant=c.right-c.left;svg+=arrow(320,318,resultant*19,0,colors.r,'ΣF');if(!resultant)svg+=text(320,325,'ΣF = 0','strong','middle');
    }else if(i===2){
      const f=forces(),net=M.sum(f),x=200+s.body.x*17,y=210-s.body.y*17;
      svg+=line(30,210,330,210,'#d9e1ef')+line(200,70,200,340,'#d9e1ef');svg+=`<circle cx="${x}" cy="${y}" r="18" fill="#dce6fa" stroke="#7f96c0" stroke-width="3"/>`;
      f.forEach((a,j)=>svg+=arrow(x,y,a.x*14,-a.y*14,[colors.f,colors.f2,colors.f3][j],`F${j+1}`));if(c.components){const a=f[2];svg+=arrow(x,y,a.x*14,0,colors.soft,'',true)+arrow(x+a.x*14,y,0,-a.y*14,colors.soft,'',true);}
      svg+=text(455,57,L('หัวต่อหาง','Head to tail'),'strong','middle');let px=430,py=250;svg+=`<circle cx="${px}" cy="${py}" r="5" fill="#26354b"/>`;
      f.forEach((a,j)=>{svg+=arrow(px,py,a.x*18,-a.y*18,[colors.f,colors.f2,colors.f3][j],`F${j+1}`);px+=a.x*18;py-=a.y*18;});
      if(!M.balanced(net))svg+=arrow(430,250,net.x*18,-net.y*18,colors.r,'ΣF',true);
      svg+=text(455,330,M.balanced(net)?L('กลับถึงจุดเริ่มต้น','Returns to the start'):L('ปลายยังไม่ถึงจุดเริ่มต้น','Does not return to the start'),'small','middle');
      svg+=text(100,365,L('มองจากด้านบน','Top view'),'small','middle');
    }else if(i===3){
      const p=M.ropes(60,c.alpha,c.beta),x=320,y=235,a=M.rad(c.alpha),b=M.rad(c.beta),lx=x-200*Math.cos(a),ly=y-200*Math.sin(a),rx=x+200*Math.cos(b),ry=y-200*Math.sin(b);
      svg+=line(lx,ly,x,y,'#9ba8bd',5)+line(x,y,rx,ry,'#9ba8bd',5)+line(lx-22,ly-7,lx+22,ly-7,'#687892',5)+line(rx-22,ry-7,rx+22,ry-7,'#687892',5);
      svg+=line(90,y,550,y,'#c5cfdf')+`<circle cx="320" cy="235" r="20" fill="#edc67b" stroke="#a97b2e" stroke-width="3"/>`;
      const scale=Math.min(1.9,155/Math.max(p.left,p.right));p.forces.forEach((v,j)=>svg+=arrow(x,y,v.x*scale,-v.y*scale,[colors.f,colors.f2,colors.f3][j],['T₁','T₂','W'][j]));
      const radius=55;svg+=`<path d="M ${x-radius} ${y} A ${radius} ${radius} 0 0 1 ${x-radius*Math.cos(a)} ${y-radius*Math.sin(a)}" fill="none" stroke="#9caac2"/><path d="M ${x+radius} ${y} A ${radius} ${radius} 0 0 0 ${x+radius*Math.cos(b)} ${y-radius*Math.sin(b)}" fill="none" stroke="#9caac2"/>`;
      svg+=text(x-105,y-10,`α = ${c.alpha}°`,'strong','middle')+text(x+105,y-10,`β = ${c.beta}°`,'strong','middle');
      if(c.components){p.forces.slice(0,2).forEach(v=>{svg+=arrow(x,y,v.x*scale,0,colors.soft,'',true)+arrow(x+v.x*scale,y,0,-v.y*scale,colors.soft,'',true);});svg+=text(320,365,L('แนวนอนหักล้าง · แนวดิ่งรวมขึ้น 60 N','Horizontal parts cancel · upward total 60 N'),'small','middle');}
    }else{
      const theta=M.rad(c.slope),cs=Math.cos(theta),sn=Math.sin(theta),p=M.incline(c.slope),along=240-s.body.x*27,x=70+along*cs-26*sn,y=320-along*sn-26*cs;
      svg+=`<path d="M70 320 L${70+470*cs} ${320-470*sn} L${70+470*cs} 320 Z" fill="#e2e9f5" stroke="#9baccc" stroke-width="3"/><rect x="${x-30}" y="${y-24}" width="60" height="48" rx="4" transform="rotate(${-c.slope} ${x} ${y})" fill="#e9c991" stroke="#a47d40" stroke-width="3"/>`;
      svg+=arrow(x,y,0,p.weight*3.5,colors.f3,'W')+arrow(x,y,-p.normal*sn*3.5,-p.normal*cs*3.5,colors.f2,'N')+arrow(x,y,p.friction*cs*3.5,-p.friction*sn*3.5,colors.f,'f');
      if(c.components)svg+=arrow(x,y,-p.down*cs*3.5,p.down*sn*3.5,colors.soft,'W∥',true)+arrow(x,y,p.normal*sn*3.5,p.normal*cs*3.5,colors.soft,'W⊥',true);
      svg+=text(120,309,`${c.slope}°`,'strong')+text(320,365,p.resting?L('แรงเสียดทานสถิตหักล้างแรงลงลาด','Static friction balances the downhill force'):L('เริ่มไถลลง · แรงเสียดทานจลน์ต้านไว้','Sliding downhill · kinetic friction opposes motion'),'small','middle');
    }
    $('scene').innerHTML=svg;
  }
  function record(){
    let html=`<p class="record-header">PHYSICS · 4.3 · ${esc(L('สมดุลต่อการเลื่อนที่','Translational equilibrium'))}</p><h1>${esc(L('บันทึกผลการทดลอง','Learning record'))}</h1><p>${esc(L('ชื่อ ____________________ ชั้น __________','Name ____________________ Class __________'))}</p>`;
    missions.forEach((m,i)=>{html+=`<section><h2>${esc(P(m.title))}</h2>`;
      if(m.prediction)html+=`<div class="record-question"><p>${esc(P(m.prediction.text))}</p><p>${esc(L('คาดว่า: ','Prediction: '))}${s.predictions[i]===null?'____________________':esc(P(m.prediction.options[s.predictions[i]]))}</p></div>`;
      m.observations.forEach(o=>{const data=s.observations[i][o.key];html+=`<div class="record-observation"><p><strong>${esc(P(o.label))}</strong></p>`;
        html+=data?evidenceReadings(i,data.readings).map(([k,v,u])=>`<p>${esc(P(labels[k]))}: ${fmt(v)} ${esc(u)}</p>`).join(''):`<div class="record-answer"></div>`;html+='</div>';});
      m.questions.forEach((q,j)=>{html+=`<div class="record-question"><p>${j+1}. ${esc(P(q.text))}</p><ol type="A">${q.options.map(o=>`<li>${esc(P(o))}</li>`).join('')}</ol><p>${esc(L('คำตอบที่เลือก: ','Chosen answer: '))}${s.answers[i][j]===null?'________':String.fromCharCode(65+s.answers[i][j])}</p><p>${esc(L('เหตุผล:','Reason:'))}</p><div class="record-answer"></div></div>`;});html+='</section>';
    });$('record').innerHTML=html;
  }
  $('language').onclick=()=>{setLanguage(lang==='th'?'en':'th');if(parent!==window)parent.postMessage({type:'learning-hub-language-request',language:lang},location.origin);};
  $('components').onchange=()=>{s.controls.components=$('components').checked;draw();renderReadings();save();};
  $('play').onclick=()=>{if(!predictionMade())return;if(running){running=false;pending=null;message(L('หยุดภาพแล้ว กดทดลองเพื่อดูต่อ','Paused. Run the setup to continue.'));renderObservations();save();}else if(s.mission===0){snapshotObservation(s.controls.press?'press':'two');}else if(s.mission===3){message(L('ชุดนี้คำนวณแรงตึงสำหรับสมดุลในแต่ละมุม ลองกรณีเปรียบเทียบด้านข้างเพื่อเก็บผล','This setup calculates equilibrium tensions at each angle. Try the comparison cases to record evidence.'));}else{if(s.mission===2||s.mission===4){s.body=zero();s.time=0;}startRun(null,[2,4].includes(s.mission)?1:2);}renderReadings();draw();};
  $('restart').onclick=resetExperiment;$('next').onclick=()=>selectMission(s.mission+1);
  $('reset').onclick=()=>{if(!confirm(L('ล้างคำตอบและเริ่มทั้ง 6 ช่วงใหม่ในเครื่องนี้หรือไม่?','Clear this device’s answers and restart all six missions?')))return;running=false;pending=null;s=blank();message('');render();save();};
  $('print').onclick=()=>{running=false;pending=null;renderReadings();renderObservations();save();record();window.print();};
  window.addEventListener('beforeprint',record);window.addEventListener('pagehide',save);
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='learning-hub-context')return;
    const nextIdentity=event.data.identity?.uid||'guest';if(nextIdentity!==identity){save();identity=nextIdentity;running=false;pending=null;s=blank();load();}
    setLanguage(event.data.language||lang);
  });
  window.LearningHubSimulation={getState:state,restoreState:value=>{if(!restore(value))return false;setLanguage(lang);save();return true;},subscribe:callback=>{subscriber=typeof callback==='function'?callback:null;return()=>{subscriber=null;};}};
  load();setLanguage(lang);requestAnimationFrame(frame);if(parent!==window)parent.postMessage({type:'learning-hub-tool-ready'},location.origin);
})();
