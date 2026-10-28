(() => {
 'use strict';const B=globalThis.WaveMiniBridge,Q=globalThis.MiniWaveMissions,$=id=>document.getElementById(id),hints={};
 const T=(th,en)=>B.language()==='th'?th:en;
 function start(index){B.change((s,mode)=>{s.mission.index=index;const a=Q.setup(mode,index);s.params=a.params;s.visual=a.visual;s.mission.answers[index]={};s.mission.attempted[index]=false;s.mission.seen[index]={a:false,b:false,changed:false};Q.observe(mode,s);});}
 function render(){const {mode}=B.read(),s=B.current(),m=s.mission,i=m.index;Q.observe(mode,s);
  $('mission-heading').textContent=T(`ภารกิจ ${m.completed.filter(Boolean).length}/2 · โหมดนี้`,`Missions ${m.completed.filter(Boolean).length}/2 · this mode`);$('mission-enabled').checked=m.enabled;$('mission-content').hidden=!m.enabled;
  $('mission-select').replaceChildren();Q.titles[mode].forEach((title,j)=>{const option=document.createElement('option');option.value=j;option.textContent=(m.completed[j]?'✓ ':'')+(j+1)+'. '+T(...title);$('mission-select').append(option);});$('mission-select').value=i;
  $('mission-instruction').textContent=T(...Q.instruction[mode][i]);$('mission-a').hidden=$('mission-b').hidden=mode==='reflection'&&i===0;
  $('mission-requirements').replaceChildren();const requirements=Q.requirements(mode,s);for(const [done,label] of requirements){const li=document.createElement('li');li.textContent=(done?'✓ ':'○ ')+T(...label);li.dataset.done=String(done);$('mission-requirements').append(li);}
  $('mission-answer-panel').hidden=!m.open;$('mission-answer-toggle').textContent=m.open?T('ซ่อนช่องตอบ','Hide answers'):T('ตอบภารกิจ','Answer mission');$('mission-answer-toggle').setAttribute('aria-expanded',String(m.open));
  $('mission-questions').replaceChildren();const grades=Q.grade(mode,s);Q.questions(mode,s).forEach((q,j)=>{
   const box=document.createElement('div');box.className='mission-question';const label=document.createElement('label');label.htmlFor='mission-q'+j;label.textContent=T(...q.text);box.append(label);let input;
   if(q.type==='number'){input=document.createElement('input');input.type='text';input.inputMode='decimal';input.autocomplete='off';}else{input=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent=T('เลือกคำตอบ','Choose an answer');input.append(blank);for(const [value,th,en] of q.options){const option=document.createElement('option');option.value=value;option.textContent=T(th,en);input.append(option);}}
   input.id='mission-q'+j;input.value=m.answers[i]['q'+j]||'';input.addEventListener(q.type==='number'?'input':'change',()=>{m.answers[i]['q'+j]=input.value;m.attempted[i]=false;box.querySelector('.answer-feedback')?.remove();$('mission-result').textContent='';B.notify();});box.append(input);
   const key=mode+i+j,details=document.createElement('details');details.open=!!hints[key];const summary=document.createElement('summary');summary.textContent=T('คำใบ้','Hint');const hint=document.createElement('p');hint.textContent=T(...q.hint);details.append(summary,hint);details.ontoggle=()=>hints[key]=details.open;box.append(details);
   if(m.attempted[i]){const message=document.createElement('p');message.className='answer-feedback '+(grades[j]?'correct':'incorrect');message.textContent=grades[j]?T('✓ ถูก · ','✓ Correct · ')+T(...q.explain):T('ลองอีกครั้ง แล้วเปิดคำใบ้ช่วยได้','Try again; the hint can help.');box.append(message);} $('mission-questions').append(box);
  });
  const ready=requirements.every(([done])=>done),passed=grades.every(Boolean);$('mission-result').textContent=m.attempted[i]?(ready?(passed?T('ผ่านภารกิจแล้ว ✓ ลองภารกิจถัดไปได้','Mission complete ✓ Continue to the next mission.'):T('ยังมีข้อที่ต้องแก้ ลองตอบใหม่ได้','Some answers need another try.')):T('สังเกตตามรายการด้านบนให้ครบ แล้วตรวจอีกครั้ง','Complete the observation checklist above, then check again.')):'';
  $('mission-next').disabled=!m.completed[i];$('mission-next').hidden=i===1;
 }
 $('mission-enabled').onchange=event=>{B.current().mission.enabled=event.target.checked;render();B.notify();};$('mission-select').onchange=event=>start(Number(event.target.value));
 for(const tag of ['a','b'])$('mission-'+tag).onclick=()=>B.change((s,mode)=>{s.params={...s.params,...Q.comparison(mode,s.mission.index,tag)};if(mode==='interference'&&s.params.probe==='side')s.visual.L=10;s.mission.answers[s.mission.index]={};s.mission.attempted[s.mission.index]=false;Q.observe(mode,s,true);});
 $('mission-answer-toggle').onclick=()=>{B.current().mission.open=!B.current().mission.open;render();B.notify();};
 $('mission-check').onclick=()=>{const s=B.current(),mode=B.read().mode;s.mission.attempted[s.mission.index]=true;if(Q.requirements(mode,s).every(([done])=>done)&&Q.grade(mode,s).every(Boolean))s.mission.completed[s.mission.index]=true;render();B.notify();};
 $('mission-retry').onclick=()=>{const m=B.current().mission;m.answers[m.index]={};m.attempted[m.index]=false;render();B.notify();};$('mission-next').onclick=()=>start(1);
 globalThis.MiniWaveGuidance=Object.freeze({render});render();
})();
