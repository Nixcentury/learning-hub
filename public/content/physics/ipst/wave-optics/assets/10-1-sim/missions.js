(() => {
  'use strict';
  const revision='wave-10-1-assessment-20261107',modes=['reflection','refraction','interference','diffraction'];
  const bi=(th,en)=>[th,en], opt=(id,th,en)=>[id,th,en];
  const choice=(id,th,en,options,answer,ticks=1)=>({id,type:'choice',text:bi(th,en),options,answer,ticks});
  const number=(id,th,en,answer,unit,ticks=2,tolerance=.01)=>({id,type:'number',text:bi(th,en),answer,unit,ticks,tolerance});
  const group=(id,kind,goal,th,en,parts)=>({id,kind,goal,text:bi(th,en),parts});
  const direction=[opt('toward','เข้าหากำแพง','Towards the wall'),opt('away','ออกจากกำแพง','Away from the wall')];
  const change=[opt('increase','เพิ่มขึ้น','Increases'),opt('decrease','ลดลง','Decreases'),opt('same','คงเดิม','Unchanged')];
  const node=[opt('node','บัพ','Node'),opt('antinode','ปฏิบัพ','Antinode'),opt('between','ระหว่างแนว','Between loci')];
  const critical=Math.asin(1/1.5)*180/Math.PI;
  // Frozen assessment data. The exploration sliders never change these prompts.
  // Answers are used only by the checker; the UI and guide never render them.
  const bank={
    reflection:[
      [group('q1','understanding',0,'ทิศของคลื่นสองชุด','Directions of the two waves',[
        choice('a','คลื่นตกกระทบเคลื่อนที่อย่างไร?','How does the incident wave propagate?',direction,'toward'),
        choice('b','คลื่นสะท้อนเคลื่อนที่อย่างไร?','How does the reflected wave propagate?',direction,'away')]),
       group('q2','understanding',1,'เส้นอ้างอิงและกฎที่ใช้','Reference line and governing law',[
        choice('a','มุมในกฎการสะท้อนวัดจากเส้นใด?','From which line are reflection-law angles measured?',[opt('surface','ผิวสะท้อน','Reflecting surface'),opt('normal','เส้นปกติ','Normal')],'normal'),
        choice('b','ความสัมพันธ์ใดใช้กับมุมเหล่านี้?','Which relationship applies to these angles?',[opt('equal','θᵢ = θᵣ','θᵢ = θᵣ'),opt('complement','θᵢ + θᵣ = 90°','θᵢ + θᵣ = 90°'),opt('double','θᵣ = 2θᵢ','θᵣ = 2θᵢ')],'equal')]),
       group('q3','calculation',1,'รังสีตกกระทบทำมุม 28° กับผิวสะท้อน จงหามุมที่ถาม','The incident ray makes 28° with the reflecting surface. Find the requested angles.',[
        number('a','มุมตกกระทบ θᵢ','Incidence angle θᵢ',90-28,'°',2,.1),
        number('b','มุมสะท้อน θᵣ','Reflection angle θᵣ',90-28,'°',4,.1)])],
      [group('q4','understanding',2,'คาดการณ์เมื่อเพิ่มมุมตกกระทบ','Predict an increase in incidence',[
        choice('a','มุมสะท้อนจะเปลี่ยนอย่างไร?','How does the reflection angle change?',change,'increase'),
        choice('b','เหตุผลใดสอดคล้องกับกฎที่ใช้?','Which reason agrees with the governing law?',[opt('follow','มุมสะท้อนเปลี่ยนตามมุมตกกระทบ','Reflection angle follows incidence'),opt('fixed','กำแพงเดิมทำให้มุมสะท้อนคงเดิมเสมอ','An unchanged wall always fixes the reflection angle'),opt('frequency','ความถี่เป็นตัวกำหนดมุมสะท้อน','Frequency determines the reflection angle')],'follow')]),
       group('q5','understanding',2,'มุมกับผิวและสมบัติคลื่น','Surface angle and wave properties',[
        choice('a','เมื่อมุมตกกระทบเพิ่ม มุมที่รังสีสะท้อนทำกับผิวเปลี่ยนอย่างไร?','When incidence increases, how does the reflected ray’s angle to the surface change?',change,'decrease'),
        choice('b','เมื่อสะท้อนในตัวกลางเดิมที่กำแพงอยู่นิ่ง ความถี่เป็นอย่างไร?','At a stationary wall in the same medium, what happens to frequency?',change,'same')]),
       group('q6','calculation',2,'เริ่มจาก θᵢ = 24° แล้วเพิ่มมุมตกกระทบอีก 18°','Start at θᵢ = 24° and increase incidence by 18°.',[
        number('a','มุมสะท้อนใหม่','New reflection angle',24+18,'°',2,.1),
        number('b','มุมที่รังสีสะท้อนใหม่ทำกับผิว','New reflected ray’s angle to the surface',90-24-18,'°',4,.1)])]
    ],
    refraction:[
      [group('q1','understanding',0,'จากอากาศเข้าแก้วที่มุมตกกระทบไม่เป็นศูนย์','From air into glass at nonzero incidence',[
        choice('a','แนวหักเหเบนอย่างไร?','How does the transmitted ray bend?',[opt('toward','เข้าหาเส้นปกติ','Towards the normal'),opt('away','ออกจากเส้นปกติ','Away from the normal'),opt('always-straight','ตรงเสมอ','Always straight')],'toward'),
        choice('b','เมื่อเข้าสู่ตัวกลางที่มีดัชนีมากขึ้น อัตราเร็วเปลี่ยนอย่างไร?','On entering a higher-index medium, how does speed change?',change,'decrease')]),
       group('q2','understanding',1,'ความสัมพันธ์และปริมาณที่รอยต่อ','Relationships and interface quantities',[
        choice('a','เลือกความสัมพันธ์สำหรับหามุมหักเห','Choose the relationship for refraction angle',[opt('snell','n₁ sin θ₁ = n₂ sin θ₂','n₁ sin θ₁ = n₂ sin θ₂'),opt('equal','θ₁ = θ₂ ทุกตัวกลาง','θ₁ = θ₂ in all media'),opt('sum','θ₁ + θ₂ = 90° เสมอ','θ₁ + θ₂ always equals 90°')],'snell'),
        choice('b','ความถี่เมื่อผ่านรอยต่อที่อยู่นิ่งเป็นอย่างไร?','What happens to frequency across a stationary interface?',change,'same')]),
       group('q3','calculation',1,'แสงจาก n₁ = 1.00 เข้า n₂ = 1.50 ที่ θ₁ = 30° โดย λ₀ ในสุญญากาศ = 540 nm ใช้ c = 3.0 × 10⁸ m/s ปัดมุมสองตำแหน่ง','Light goes from n₁ = 1.00 to n₂ = 1.50 at θ₁ = 30°, with vacuum λ₀ = 540 nm. Use c = 3.0 × 10⁸ m/s. Round angles to two decimals.',[
        number('a','มุมหักเห θ₂','Refraction angle θ₂',Math.asin(Math.sin(Math.PI/6)/1.5)*180/Math.PI,'°',2,.02),
        number('b','อัตราเร็ว v₂ (กรอกตัวคูณของ 10⁸)','Speed v₂ (enter the coefficient of 10⁸)',3/1.5,'×10⁸ m/s',2,.01),
        number('c','ความยาวคลื่น λ₂','Wavelength λ₂',540/1.5,'nm',2,.1)])],
      [group('q4','understanding',0,'กรณีตัวกลางเหมือนกันและการตกกระทบตั้งฉาก','Equal media and normal incidence',[
        choice('a','ถ้า n₁ = n₂ รังสีที่ผ่านรอยต่อมีแนวอย่างไร?','If n₁ = n₂, what is the transmitted direction?',[opt('straight','แนวเดิม','Unchanged direction'),opt('bend','ต้องเบนเสมอ','Must bend'),opt('none','ไม่มีรังสีผ่านเสมอ','Never transmitted')],'straight'),
        choice('b','ถ้าตกกระทบตั้งฉากแต่ดัชนีต่างกัน ข้อใดถูก?','At normal incidence with unequal indices, which statement is correct?',[opt('speed','แนวยังตรงได้ แต่อัตราเร็วเปลี่ยนได้','The ray can remain straight while its speed changes'),opt('nothing','แนวตรงจึงไม่มีปริมาณใดเปลี่ยน','A straight ray means no quantities change'),opt('tir','ต้องสะท้อนกลับหมด','Total reflection must occur')],'speed')]),
       group('q5','understanding',2,'เงื่อนไขการสะท้อนกลับหมด','Total internal reflection conditions',[
        choice('a','ดัชนีของตัวกลางต้นทางและปลายทางต้องเป็นอย่างไร?','Which index relationship is required?',[opt('higher','n₁ > n₂','n₁ > n₂'),opt('lower','n₁ < n₂','n₁ < n₂'),opt('equal','n₁ = n₂','n₁ = n₂')],'higher'),
        choice('b','มุมตกกระทบต้องเทียบกับมุมวิกฤตอย่างไรจึงสะท้อนกลับหมด?','How must incidence compare with the critical angle for total reflection?',[opt('above','มากกว่า θc','Greater than θc'),opt('below','น้อยกว่า θc','Less than θc'),opt('equal','เท่ากับ θc','Equal to θc')],'above')]),
       group('q6','calculation',2,'แสงจากแก้ว n₁ = 1.50 สู่อากาศ n₂ = 1.00 จงหามุมวิกฤต ปัดสองตำแหน่ง','For light from glass n₁ = 1.50 to air n₂ = 1.00, find the critical angle. Round to two decimals.',[
        number('a','อัตราส่วน n₂/n₁ (ปัดสี่ตำแหน่ง)','Ratio n₂/n₁ (four decimals)',1/1.5,'',2,.0001),
        number('b','มุมวิกฤต θc','Critical angle θc',critical,'°',4,.02)])]
    ],
    interference:[
      [group('q1','understanding',0,'แนวกลางของแหล่งกำเนิดสองแหล่งที่มีแอมพลิจูดเท่ากัน','Centre line for two equal-amplitude sources',[
        choice('a','แหล่งเฟสตรงกัน แนวกลางเป็นแนวใด?','For in-phase sources, which locus is the centre line?',node,'antinode'),
        choice('b','แหล่งเฟสตรงข้าม 180° แนวกลางเป็นแนวใด?','For sources 180° apart, which locus is the centre line?',node,'node')]),
       group('q2','understanding',1,'แยกรอยคลื่นออกจากแนวบัพ','Distinguish wavefronts from nodes',[
        choice('a','เส้นหน้าคลื่นแทนอะไร?','What does a wavefront represent?',[opt('phase','จุดที่มีเฟสเดียวกันในขณะนั้น','Points with the same phase at that instant'),opt('node','จุดที่หักล้างตลอดเวลาเสมอ','Always points of permanent cancellation'),opt('path','เส้นทางของอนุภาคน้ำ','Water-particle trajectories')],'phase'),
        choice('b','การกระจัดที่จุดหนึ่งเป็นศูนย์ชั่วขณะ เพียงพอจะเรียกว่าบัพหรือไม่?','Is an instantaneous zero displacement enough to call a point nodal?',[opt('no','ไม่พอ ต้องดูแอมพลิจูดการสั่น','No; examine its oscillation amplitude'),opt('yes','พอ เป็นบัพเสมอ','Yes; it is always nodal')],'no')]),
       group('q3','calculation',2,'ที่ P มี r₁ = 12.30 cm, r₂ = 16.05 cm และ λ = 2.50 cm','At P, r₁ = 12.30 cm, r₂ = 16.05 cm and λ = 2.50 cm.',[
        number('a','ผลต่างทางเดิน Δr','Path difference Δr',16.05-12.30,'cm',2,.01),
        number('b','อัตราส่วน Δr/λ','Ratio Δr/λ',(16.05-12.30)/2.5,'',4,.01)])],
      [group('q4','understanding',0,'คาดการณ์เมื่อสลับเฟสแหล่งกำเนิด','Predict a source-phase reversal',[
        choice('a','เมื่อสลับเฟสจาก 0° เป็น 180° ที่เรขาคณิตเดิม แนวบัพและปฏิบัพเป็นอย่างไร?','At unchanged geometry, how do nodal and antinodal loci change from 0° to 180°?',[opt('swap','สลับกัน','Exchange'),opt('same','เหมือนเดิมทั้งหมด','All unchanged'),opt('disappear','หายไปทุกแนว','All disappear')],'swap'),
        choice('b','เพราะเหตุใดจึงต้องพิจารณาเฟสแหล่งกำเนิดร่วมกับผลต่างทางเดิน?','Why must source phase be considered with path difference?',[opt('total','ทั้งสองมีผลต่อเฟสต่างกันที่จุดสังเกต','Both affect the phase difference at the point'),opt('distance','เฟสทำให้ระยะทางจริงเปลี่ยนเสมอ','Source phase always changes geometric distances'),opt('speed','เฟสกำหนดอัตราเร็วในตัวกลาง','Source phase determines medium wave speed')],'total')]),
       group('q5','understanding',1,'จำแนก P จากข้อมูลที่กำหนด ไม่ใช่จากสีเพียงขณะหนึ่ง','Classify P using the given data, not one instantaneous colour',[
        choice('a','ถ้าแหล่งเฟสตรงกันและ Δr/λ = 1 จุด P อยู่บนแนวใด?','For in-phase sources with Δr/λ = 1, which locus contains P?',node,'antinode'),
        choice('b','หากสลับแหล่งเป็นเฟสตรงข้ามที่จุดเดิม P จะเป็นแนวใด?','After reversing source phase at the same P, which locus contains it?',node,'node')]),
       group('q6','calculation',2,'แหล่งเฟสตรงกัน จุดปฏิบัพ m = 2 มี Δr = 6.00 cm กำหนด m = 0 ที่แนวกลาง','For in-phase sources, antinodal order m = 2 has Δr = 6.00 cm. Define m = 0 at the centre line.',[
        number('a','ความยาวคลื่น λ','Wavelength λ',6/2,'cm',2,.01),
        number('b','ผลต่างทางเดินของปฏิบัพ m = 3','Path difference at antinodal order m = 3',3*(6/2),'cm',4,.01)])]
    ],
    diffraction:[
      [group('q1','understanding',0,'ออกแบบการเปรียบเทียบทีละตัวแปร','Design a one-variable comparison',[
        choice('a','เมื่อต้องการศึกษาผลของ λ ควรตรึงค่าใด?','To study the effect of λ, which quantity should be fixed?',[opt('opening','ความกว้างช่อง a','Opening width a'),opt('lambda','ความยาวคลื่น λ','Wavelength λ'),opt('none','เปลี่ยนทุกค่าไปพร้อมกัน','Change every quantity together')],'opening'),
        choice('b','สไลเดอร์สีจางในโหมดเปรียบเทียบหมายถึงอะไร?','What does a dimmed comparison slider mean?',[opt('held','เป็นค่าที่ตรึงไว้ในการเปรียบเทียบนี้','The quantity is held fixed for this comparison'),opt('zero','ค่านั้นต้องเป็นศูนย์','Its value must be zero'),opt('broken','การทดลองใช้ไม่ได้','The experiment is broken')],'held')]),
       group('q2','understanding',2,'สูตรและหน่วยที่ใช้','Relationship and units',[
        choice('a','ความสัมพันธ์ใดใช้หาความยาวคลื่นแสงในสุญญากาศ?','Which relationship gives vacuum light wavelength?',[opt('c','c = fλ','c = fλ'),opt('divide','c = f/λ','c = f/λ'),opt('add','c = f + λ','c = f + λ')],'c'),
        choice('b','ก่อนหา a/λ ต้องจัดหน่วยอย่างไร?','Before finding a/λ, how should the units be handled?',[opt('match','ให้ a และ λ ใช้หน่วยความยาวเดียวกัน','Use the same length unit for a and λ'),opt('different','ใช้หน่วยต่างกันเสมอ','Always use different units'),opt('ignore','ไม่ต้องสนใจหน่วย','Ignore the units')],'match')]),
       group('q3','calculation',2,'แสงในสุญญากาศมี f = 4.80 × 10¹⁴ Hz ใช้ c = 3.00 × 10⁸ m/s','Vacuum light has f = 4.80 × 10¹⁴ Hz. Use c = 3.00 × 10⁸ m/s.',[
        number('a','ความยาวคลื่น','Wavelength',3e8/4.8e14*1e9,'nm',2,.1),
        number('b','ความยาวคลื่นค่าเดียวกันในหน่วย µm','The same wavelength in µm',3e8/4.8e14*1e6,'µm',4,.001)])],
      [group('q4','understanding',1,'เพิ่ม λ โดยตรึงช่องเปิด','Increase λ at fixed opening',[
        choice('a','มุมแผ่ถึงทิศมืดแรกเปลี่ยนอย่างไร?','How does the angle to the first dark direction change?',change,'increase'),
        choice('b','อัตราส่วน λ/a เปลี่ยนอย่างไร?','How does λ/a change?',change,'increase')]),
       group('q5','understanding',1,'ลดช่องเปิดโดยตรึง λ','Reduce the opening at fixed λ',[
        choice('a','มุมแผ่เปลี่ยนอย่างไร?','How does spreading change?',change,'increase'),
        choice('b','เส้นประถึงทิศมืดแรกเป็นขอบเขตสุดท้ายที่คลื่นไปถึงหรือไม่?','Do the first-dark dashed directions mark the final reach of the wave?',[opt('no','ไม่ใช่ ยังมีแถบข้างนอกแนวนี้','No; side bands exist beyond them'),opt('yes','ใช่ คลื่นไปไม่ถึงด้านนอก','Yes; no wave exists outside them')],'no')]),
       group('q6','calculation',2,'ช่องเปิด a = 1.80 µm และ λ = 450 nm','The opening is a = 1.80 µm and λ = 450 nm.',[
        number('a','แปลง a เป็น nm','Convert a to nm',1.8*1000,'nm',2,.1),
        number('b','อัตราส่วน a/λ','Ratio a/λ',1.8*1000/450,'',4,.01)])]
    ]
  };
  const titles=Object.fromEntries(modes.map(m=>[m,[bi('ภารกิจ 1 · พื้นฐานและคำนวณ','Mission 1 · Foundations and calculation'),bi('ภารกิจ 2 · เปรียบเทียบและประยุกต์','Mission 2 · Compare and apply')]]));
  const instruction=Object.fromEntries(modes.map(m=>[m,[bi('สำรวจภาพและกรณีตัวอย่าง แล้วตอบความเข้าใจ 2 ข้อกับคำนวณ 1 ข้อ โจทย์คำนวณใช้ข้อมูลที่เขียนกำกับไว้','Explore the picture and cases, then answer two understanding questions and one calculation using its stated data.'),bi('เปรียบเทียบสิ่งที่สังเกต แล้วตอบอีก 3 ข้อ ให้ตอบทุกข้อย่อยก่อนตรวจ','Compare your observations and answer three more questions. Answer every subpart before checking.')]]));
  const initial=()=>({index:0,enabled:true,open:false,completed:[false,false],answers:[{},{}],attempted:[false,false],seen:[{a:false,b:false,changed:false},{a:false,b:false,changed:false}],checkedAnswers:[{},{}],bestAnswers:[{},{}],editedAt:[0,0],checkedAt:[0,0]});
  const questions=(mode,s)=>bank[mode][s.mission.index];
  const parts=(mode,index)=>bank[mode][index].flatMap(q=>q.parts.map(p=>({...p,key:q.id+'-'+p.id,questionId:q.id,kind:q.kind,goal:q.goal})));
  const finiteNumber=value=>typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())&&Number.isFinite(Number(value));
  const correct=(p,value)=>p.type==='choice'?value===p.answer:finiteNumber(value)&&Math.abs(Number(value)-p.answer)<=p.tolerance+1e-10;
  function evaluate(mode,index,answers={}){
    const rows=bank[mode][index].map(q=>{const fields=q.parts.map(p=>{const key=q.id+'-'+p.id,value=answers[key]||'',filled=!!value.trim(),ok=correct(p,value);return {key,filled,correct:ok,ticks:ok?p.ticks:0,maxTicks:p.ticks,goal:q.goal};});return {id:q.id,kind:q.kind,goal:q.goal,fields,filled:fields.every(f=>f.filled),correct:fields.every(f=>f.correct),ticks:fields.reduce((n,f)=>n+f.ticks,0),maxTicks:fields.reduce((n,f)=>n+f.maxTicks,0)};});
    return {rows,score:rows.reduce((n,q)=>n+q.ticks,0)/2,maxScore:5,answered:rows.filter(q=>q.filled).length,perfect:rows.every(q=>q.correct)};
  }
  function answerValid(mode,index,a){if(!a||typeof a!=='object'||Array.isArray(a))return false;const allowed=new Map(parts(mode,index).map(p=>[p.key,p]));return Object.entries(a).every(([k,v])=>allowed.has(k)&&typeof v==='string'&&v.length<=80&&(allowed.get(k).type==='number'||v===''||allowed.get(k).options.some(o=>o[0]===v)));}
  function valid(s,mode){
    if(!modes.includes(mode)||!s||![0,1].includes(s.index)||typeof s.enabled!=='boolean'||typeof s.open!=='boolean')return false;
    if(!['completed','attempted'].every(k=>Array.isArray(s[k])&&s[k].length===2&&s[k].every(v=>typeof v==='boolean')))return false;
    if(!['answers','checkedAnswers','bestAnswers'].every(k=>Array.isArray(s[k])&&s[k].length===2&&s[k].every((a,i)=>answerValid(mode,i,a))))return false;
    if(!['editedAt','checkedAt'].every(k=>Array.isArray(s[k])&&s[k].length===2&&s[k].every(v=>Number.isSafeInteger(v)&&v>=0)))return false;
    return Array.isArray(s.seen)&&s.seen.length===2&&s.seen.every(a=>a&&['a','b','changed'].every(k=>typeof a[k]==='boolean'));
  }
  function check(mode,s){const m=s.mission,i=m.index,result=evaluate(mode,i,m.answers[i]);m.checkedAnswers[i]={...m.answers[i]};m.checkedAt[i]=Date.now();m.attempted[i]=true;m.completed[i]=result.perfect;if(result.score>=evaluate(mode,i,m.bestAnswers[i]).score)m.bestAnswers[i]={...m.answers[i]};return result;}
  function summary(work){let score=0,best=0,answered=0;const byMode={};for(const mode of modes){const m=work[mode].mission,latest=[0,1].map(i=>evaluate(mode,i,m.checkedAnswers[i])),high=[0,1].map(i=>evaluate(mode,i,m.bestAnswers[i]));const item={score:latest.reduce((n,r)=>n+r.score,0),best:high.reduce((n,r)=>n+r.score,0),answered:latest.reduce((n,r)=>n+r.answered,0),maxScore:10,goals:[0,1,2].map(goal=>{const fields=latest.flatMap(r=>r.rows.flatMap(q=>q.fields)).filter(p=>p.goal===goal);return {score:fields.reduce((n,f)=>n+f.ticks,0)/2,maxScore:fields.reduce((n,f)=>n+f.maxTicks,0)/2};})};byMode[mode]=item;score+=item.score;best+=item.best;answered+=item.answered;}return {score,best,answered,maxScore:40,totalQuestions:24,byMode};}
  function setup(mode,index){const defaults=globalThis.WaveMiniModel.defaults;let params={...defaults[mode]};if(mode==='refraction')params=index?{angle:20,n1:1.5,n2:1,wavelength:600}:{angle:40,n1:1,n2:1,wavelength:600};if(mode==='diffraction')params.compare=index?'opening':'wavelength';return {params,visual:globalThis.WaveMiniModel.visual(mode)};}
  function comparison(mode,index,which){if(mode==='reflection')return {angle:which==='a'?20:60};if(mode==='refraction')return index?{angle:which==='a'?20:60,n1:1.5,n2:1}:{n1:1,n2:which==='a'?1:1.5};if(mode==='interference')return index?{probe:which==='a'?'center':'side'}:{phase:which==='a'?0:180,probe:'center'};return index?{compare:'opening',opening:which==='a'?.8:4}:{compare:'wavelength',wavelength:which==='a'?400:700};}
  function observe(mode,s,changed=false){const o=s.mission.seen[s.mission.index];if(changed)o.changed=true;for(const tag of ['a','b'])if(Object.entries(comparison(mode,s.mission.index,tag)).every(([k,v])=>s.params[k]===v))o[tag]=true;}
  function requirements(mode,s){const i=s.mission.index,o=s.mission.seen[i];if(mode==='reflection'&&i===0)return [[o.changed,bi('ลองปรับมุมเพื่อสังเกต','Try changing the angle')]];return [[o.a,bi('สำรวจกรณี A','Explore A')],[o.b,bi('สำรวจกรณี B','Explore B')]];}
  function record(work,mode,updatedAt=Date.now()){return {schemaVersion:1,revision,mode,updatedAt,missions:Object.fromEntries(modes.map(k=>[k,structuredClone(work[k].mission)]))};}
  function validRecord(r){return !!r&&r.schemaVersion===1&&r.revision===revision&&modes.includes(r.mode)&&Number.isSafeInteger(r.updatedAt)&&r.updatedAt>=0&&r.missions&&modes.every(mode=>valid(r.missions[mode],mode));}
  function mergeRecords(a,b){if(!validRecord(a))return validRecord(b)?structuredClone(b):null;if(!validRecord(b))return structuredClone(a);const out=structuredClone(a.updatedAt>b.updatedAt?a:b);for(const mode of modes){const x=a.missions[mode],y=b.missions[mode],z=out.missions[mode];for(const i of [0,1]){const draft=x.editedAt[i]>y.editedAt[i]?x:y;z.answers[i]={...draft.answers[i]};z.editedAt[i]=draft.editedAt[i];const checked=x.checkedAt[i]>y.checkedAt[i]?x:y;z.checkedAnswers[i]={...checked.checkedAnswers[i]};z.checkedAt[i]=checked.checkedAt[i];z.attempted[i]=z.checkedAt[i]>0&&JSON.stringify(parts(mode,i).map(p=>z.answers[i][p.key]||''))===JSON.stringify(parts(mode,i).map(p=>z.checkedAnswers[i][p.key]||''));const high=evaluate(mode,i,x.bestAnswers[i]).score>evaluate(mode,i,y.bestAnswers[i]).score?x:y;z.bestAnswers[i]={...high.bestAnswers[i]};z.completed[i]=evaluate(mode,i,z.checkedAnswers[i]).perfect;for(const tag of ['a','b','changed'])z.seen[i][tag]=x.seen[i][tag]||y.seen[i][tag];}}return out;}
  globalThis.MiniWaveMissions=Object.freeze({revision,modes,initial,valid,questions,parts,evaluate,check,summary,setup,comparison,observe,requirements,titles,instruction,record,validRecord,mergeRecords,grade:(mode,s)=>evaluate(mode,s.mission.index,s.mission.answers[s.mission.index]).rows.map(q=>q.correct)});
})();
