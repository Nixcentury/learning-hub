(() => {
 'use strict';
 const B=globalThis.WaveMiniBridge,Q=globalThis.MiniWaveMissions,$=id=>document.getElementById(id);
 const T=(th,en)=>B.language()==='th'?th:en;
 const label=(node,th,en)=>{node.textContent=T(th,en);};
 const add=(parent,tag,value,cls)=>{const n=document.createElement(tag);if(value)n.textContent=value;if(cls)n.className=cls;parent.append(n);return n;};
 function start(index){B.change((s,mode)=>{s.mission.index=index;const setup=Q.setup(mode,index);s.params=setup.params;s.visual=setup.visual;Q.observe(mode,s);});}
 function syncStorageStatus(){const n=$('assessment-storage-status');if(n)n.textContent=globalThis.WaveAssessmentStorage?.statusText(B.language())||T('กำลังเตรียมการบันทึก','Preparing storage');}
 function summary(){
  const {work,mode}=B.read(),all=Q.summary(work),current=all.byMode[mode];
  $('assessment-progress').replaceChildren();
  for(const [title,value] of [[T('ตรวจคำตอบครบแล้ว','Questions checked'),`${all.answered}/24`],[T('คะแนนตรวจล่าสุด','Latest checked score'),`${all.score}/40`],[T('คะแนนฝึกดีที่สุด','Best practice score'),`${all.best}/40 · ${Math.round(all.best/40*100)}%`]]){const d=add($('assessment-progress'),'div');add(d,'span',title);add(d,'strong',value);}
  $('mission-heading').textContent=T(`โหมดนี้ · ตรวจแล้ว ${current.answered}/6 ข้อ · ล่าสุด ${current.score}/10 · ดีที่สุด ${current.best}/10`,`This mode · checked ${current.answered}/6 · latest ${current.score}/10 · best ${current.best}/10`);
  $('assessment-goals').replaceChildren();
  current.goals.forEach((g,i)=>{const row=add($('assessment-goals'),'li');row.textContent=T(`จุดประสงค์ ${i+1}`,`Objective ${i+1}`)+` · ${g.score}/${g.maxScore}`;});
  syncStorageStatus();
 }
 function render(){
  const {mode}=B.read(),s=B.current(),m=s.mission,i=m.index;Q.observe(mode,s);summary();
  $('mission-enabled').checked=m.enabled;$('mission-content').hidden=!m.enabled;
  $('mission-select').replaceChildren();Q.titles[mode].forEach((title,j)=>{const o=add($('mission-select'),'option',T(...title));o.value=j;});$('mission-select').value=i;
  $('mission-instruction').textContent=T(...Q.instruction[mode][i]);
  $('mission-a').hidden=$('mission-b').hidden=false;
  $('mission-requirements').replaceChildren();for(const [done,title] of Q.requirements(mode,s))add($('mission-requirements'),'li',(done?'✓ ':'○ ')+T(...title));
  $('mission-answer-panel').hidden=!m.open;document.body.classList.toggle('is-answering',m.open&&m.enabled);
  $('mission-answer-toggle').textContent=m.open?T('กลับไปสำรวจภาพ','Return to exploration'):T('เปิดคำถาม 3 ข้อ','Open 3 questions');$('mission-answer-toggle').setAttribute('aria-expanded',String(m.open));
  $('mission-questions').replaceChildren();const report=Q.evaluate(mode,i,m.answers[i]);
  Q.questions(mode,s).forEach((q,qIndex)=>{
   const box=add($('mission-questions'),'fieldset','', 'assessment-question');box.dataset.mainQuestion=q.id;
   const number=Number(q.id.slice(1)),max=q.parts.reduce((n,p)=>n+p.ticks,0)/2;
   add(box,'legend',T(`ข้อ ${number} · ${q.kind==='calculation'?'คำนวณ':'ความเข้าใจ'} · ${max} คะแนน`,`Question ${number} · ${q.kind==='calculation'?'Calculation':'Understanding'} · ${max} ${max===1?'point':'points'}`));
   add(box,'p',T(...q.text));add(box,'p',T(`วัดจุดประสงค์ ${q.goal+1}`,`Assesses objective ${q.goal+1}`),'assessment-objective');
   q.parts.forEach((p,j)=>{
    const key=q.id+'-'+p.id,row=add(box,'div','', 'assessment-part'),title=add(row,'label',T(...p.text)+(p.unit?' · '+p.unit:''));title.htmlFor='assessment-'+key;
    let input;
    if(p.type==='number'){input=document.createElement('input');input.type='text';input.inputMode='decimal';input.autocomplete='off';input.maxLength=80;input.spellcheck=false;input.setAttribute('aria-label',T(...p.text)+(p.unit?' ('+p.unit+')':''));}
    else{input=document.createElement('select');const blank=add(input,'option',T('เลือกคำตอบ','Choose an answer'));blank.value='';for(const [value,th,en] of p.options){const o=add(input,'option',T(th,en));o.value=value;}}
    input.id='assessment-'+key;input.value=m.answers[i][key]||'';row.append(input);
    input.addEventListener(p.type==='number'?'input':'change',()=>{m.answers[i][key]=input.value;m.editedAt[i]=Date.now();m.attempted[i]=false;$('mission-next').disabled=true;row.querySelector('.answer-feedback')?.remove();$('mission-result').textContent=T('มีการแก้ไขคำตอบ กดตรวจใหม่เมื่อพร้อม คะแนนตรวจล่าสุดและคะแนนดีที่สุดยังเก็บอยู่','Answers changed. Check again when ready; your latest checked and best scores are retained.');B.notify();});
    if(m.attempted[i]){const result=report.rows[qIndex].fields[j];add(row,'p',result.correct?T('✓ ถูก','✓ Correct'):result.filled?T('ยังไม่ถูก · ทบทวนข้อมูล หน่วย หรือหลักการ แล้วลองใหม่','Not yet correct · review the data, units or principle, then retry'):T('ยังไม่ได้ตอบ','Not answered'), 'answer-feedback '+(result.correct?'correct':'incorrect'));}
   });
   const hint=add(box,'details');add(hint,'summary',T('แนวทางทำข้อนี้','How to approach this question'));
   add(hint,'p',q.kind==='calculation'?T('อ่านเฉพาะข้อมูลในโจทย์ จัดหน่วยให้ตรงกัน เลือกความสัมพันธ์ที่เรียน แล้วคำนวณแต่ละช่อง ช่องตัวเลขไม่ต้องพิมพ์หน่วย','Use the stated problem data, use matching units, choose a relevant relationship and calculate each field. Do not type units into numeric fields.'):T('อ่านสถานการณ์ให้ครบ เทียบกับสิ่งที่สังเกต และเลือกคำตอบแต่ละส่วนให้สัมพันธ์กัน','Read the entire situation, compare your observations and make consistent choices for each part.'));
  });
  const result=Q.evaluate(mode,i,m.checkedAnswers[i]);
  $('mission-result').textContent=m.attempted[i]?T(`ตรวจแล้ว ${result.answered}/3 ข้อ · คะแนนรอบนี้ ${result.score}/5 · แก้ไขแล้วตรวจซ้ำได้ ข้อที่ยังไม่ถูกจะไม่เติมเฉลยให้`,`Checked ${result.answered}/3 questions · this attempt ${result.score}/5 · revise and recheck; incorrect fields are not filled with answers`):'';
  $('mission-next').disabled=!m.attempted[i]||report.answered<3;$('mission-next').hidden=i===1;
  $('assessment-fixed-note').textContent=T('โจทย์คำนวณใช้ชุดข้อมูลที่เขียนไว้ในข้อ ไม่เปลี่ยนเมื่อปรับภาพทดลอง · กรอกตัวเลขโดยใช้จุดทศนิยม · คะแนนนี้เป็นคะแนนฝึก ไม่ใช่การส่งงาน Classroom','Calculations use their stated fixed data, independent of exploration sliders. Use a decimal point in numeric fields. These are practice scores, not Classroom submissions.');
 }
 $('mission-enabled').onchange=event=>{B.current().mission.enabled=event.target.checked;render();B.notify();};
 $('mission-select').onchange=event=>start(Number(event.target.value));
 for(const tag of ['a','b'])$('mission-'+tag).onclick=()=>B.change((s,mode)=>{s.params={...s.params,...Q.comparison(mode,s.mission.index,tag)};if(mode==='interference'&&s.params.probe==='side')s.visual.L=10;Q.observe(mode,s,true);});
 $('mission-answer-toggle').onclick=()=>{B.current().mission.open=!B.current().mission.open;render();B.notify();};
 $('mission-check').onclick=()=>{Q.check(B.read().mode,B.current());render();B.notify();};
 $('mission-retry').onclick=()=>{const m=B.current().mission;m.answers[m.index]={};m.editedAt[m.index]=Date.now();m.attempted[m.index]=false;render();B.notify();};
 $('mission-next').onclick=()=>start(1);
 globalThis.MiniWaveGuidance=Object.freeze({render,summary,syncStorageStatus});render();
})();
