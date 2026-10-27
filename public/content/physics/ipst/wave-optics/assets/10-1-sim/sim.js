(() => {
  'use strict';
  const M=globalThis.WaveMiniModel,V=globalThis.WaveMiniView,$=id=>document.getElementById(id),modes=Object.keys(M.defaults);
  let lang='th',mode='reflection',identity='guest',subscriber=null,running=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=null,dirty=true;
  const fresh=key=>({params:{...M.defaults[key]},formula:false,problem:false,solution:false});
  let work=Object.fromEntries(modes.map(key=>[key,fresh(key)]));
  const s=()=>work[mode],p=()=>s().params,T=(th,en)=>lang==='th'?th:en,F=(n,d=1)=>Number(n).toFixed(d),publish=()=>subscriber?.();
  const names={reflection:['การสะท้อน','Reflection'],refraction:['การหักเห','Refraction'],interference:['การแทรกสอด','Interference'],diffraction:['การเลี้ยวเบน','Diffraction']};
  const descriptors={
    reflection:[['angle','มุมตกกระทบ θᵢ','Incidence angle θᵢ',0,75,1,'°']],
    refraction:[['angle','มุมตกกระทบ θ₁','Incidence angle θ₁',0,80,1,'°'],['n1','ตัวกลาง 1 · n₁','Medium 1 · n₁',[[1,'อากาศ · 1.00','Air · 1.00'],[1.33,'น้ำ · 1.33','Water · 1.33'],[1.5,'แก้ว · 1.50','Glass · 1.50']]],['n2','ตัวกลาง 2 · n₂','Medium 2 · n₂',[[1,'อากาศ · 1.00','Air · 1.00'],[1.33,'น้ำ · 1.33','Water · 1.33'],[1.5,'แก้ว · 1.50','Glass · 1.50']]],['wavelength','λ ในสุญญากาศ','Vacuum wavelength λ',400,700,10,'nm']],
    interference:[['wavelength','ความยาวคลื่น λ','Wavelength λ',1,4,.1,'cm'],['separation','ระยะระหว่างแหล่ง d','Source separation d',4,12,.5,'cm'],['phase','เฟสของสองแหล่ง','Source phase',[[0,'ตรงกัน · 0°','In phase · 0°'],[180,'ตรงข้าม · 180°','Opposite · 180°']]],['probe','จุดสังเกต P','Observation point P',[['center','P บนแนวกลาง','P on centre line'],['side','P ด้านข้าง','P off centre']]]],
    diffraction:[['compare','เลือกการเปรียบเทียบ','Choose a comparison',[['wavelength','เปลี่ยน λ · ตรึงช่องเปิด','Change λ · fix opening'],['opening','เปลี่ยนช่องเปิด · ตรึง λ','Change opening · fix λ']]],['wavelength','ความยาวคลื่น λ','Wavelength λ',400,700,10,'nm'],['opening','ความกว้างช่อง a','Opening width a',.8,4,.1,'μm']],
  };
  function controls(){
    $('controls').replaceChildren();
    for(const d of descriptors[mode]){
      const [key,th,en,min,max,step,unit]=d,group=document.createElement('div');group.className='control';
      const label=document.createElement('label');label.htmlFor='param-'+key;const name=document.createElement('span');name.textContent=T(th,en);label.append(name);
      let input;
      if(Array.isArray(min)){
        input=document.createElement('select');for(const [value,a,b] of min){const option=document.createElement('option');option.value=value;option.textContent=T(a,b);input.append(option);}
      }else{
        const output=document.createElement('output');output.id='value-'+key;output.htmlFor='param-'+key;label.append(output);
        input=document.createElement('input');Object.assign(input,{type:'range',min,max,step});input.dataset.unit=unit;
      }
      input.id='param-'+key;input.value=p()[key];input.addEventListener(Array.isArray(min)?'change':'input',()=>{
        const value=typeof M.defaults[mode][key]==='number'?Number(input.value):input.value,next={...p(),[key]:value};
        if(!M.valid(mode,next))return;s().params=next;s().solution=false;V.invalidate();dirty=true;update();publish();
      });group.append(label,input);$('controls').append(group);
    }
    if(mode==='diffraction'){const note=document.createElement('p');note.className='lock';note.id='lock-note';$('controls').append(note);}
  }
  function syncControls(){
    for(const [key] of descriptors[mode]){const input=$('param-'+key);input.value=p()[key];const output=$('value-'+key);if(output)output.textContent=F(p()[key],['opening','separation','wavelength'].includes(key)&&mode==='interference'||key==='opening'?1:0)+' '+input.dataset.unit;}
    if(mode==='diffraction'){
      $('param-wavelength').disabled=p().compare!=='wavelength';$('param-opening').disabled=p().compare!=='opening';
      $('lock-note').textContent=T('สไลเดอร์สีจางคือค่าที่ตรึงไว้ เปลี่ยนกรณีเพื่อปรับอีกค่า','The dimmed slider is held fixed. Switch comparison to change it.');
    }
  }
  function formula(){
    if(mode==='reflection')return `<p class="equation">θᵢ = θᵣ</p><p>${T('มุมตกกระทบและมุมสะท้อนวัดจากเส้นปกติ ไม่ใช่ผิวสะท้อน มุมกับผิว + มุมกับเส้นปกติ = 90°','Measure incidence and reflection angles from the normal. An angle to the surface plus its angle to the normal is 90°.')}</p>`;
    if(mode==='refraction')return `<p class="equation">n₁ sin θ₁ = n₂ sin θ₂<br>v = c/n · λ = λ₀/n · f = c/λ₀</p><p>${T('n คือดัชนีหักเห ไม่มีหน่วย; c = 3.0 × 10⁸ m/s; λ₀ คือความยาวคลื่นในสุญญากาศ ความถี่ f คงเดิมเมื่อผ่านรอยต่อที่อยู่นิ่ง','n is dimensionless; c = 3.0 × 10⁸ m/s; λ₀ is vacuum wavelength. Frequency f stays constant at a stationary interface.')}</p><p>${T('ถ้า n₁ > n₂ จะมีมุมวิกฤต θc = sin⁻¹(n₂/n₁) เมื่อ θ₁ > θc เกิดการสะท้อนกลับหมด ไม่มีรังสีหักเหที่แผ่เข้าสู่ตัวกลาง 2','If n₁ > n₂, θc = sin⁻¹(n₂/n₁). For θ₁ > θc, total internal reflection occurs: no propagating refracted ray enters medium 2.')}</p>`;
    if(mode==='interference')return `<p class="equation">y = y₁ + y₂ · Δr = |r₂ − r₁|</p><p>${T('แหล่งเฟสตรงกัน: เสริมเมื่อ Δr = mλ; หักล้างเมื่อ Δr = (m + ½)λ','In-phase sources: constructive at Δr = mλ; destructive at Δr = (m + ½)λ.')}</p><p>${T('แหล่งเฟสตรงข้าม 180°: สลับสองเงื่อนไขข้างบน; m = 0, 1, 2, …','Sources 180° apart: exchange the two conditions above; m = 0, 1, 2, …')}</p><p>${T('เมื่อคลื่นย่อยมีแอมพลิจูดเท่ากัน A: บัพมีแอมพลิจูดรวม 0 ปฏิบัพมีแอมพลิจูดรวม 2A บัพไม่ใช่เพียงจุดที่การกระจัดเป็นศูนย์ชั่วขณะ','With equal component amplitudes A, a node has resultant amplitude 0; an antinode has 2A. A momentary zero displacement alone is not a node.')}</p>`;
    return `<p class="equation">λ = c/f · 1 μm = 1,000 nm</p><p>${T('ตรึงช่องเปิด: λ มากขึ้น → มุม θ มากขึ้น','Fixed opening: larger λ → larger angle θ.')}</p><p>${T('ตรึง λ: ช่องเปิดแคบลง → มุม θ มากขึ้น','Fixed λ: narrower opening → larger angle θ.')}</p><p>${T('θ วัดที่กึ่งกลางช่อง จากแนวตรงไปข้างหน้าถึงทิศมืดแรก ตามภาพในใบเรียนรู้ 10.1 ส่วน 8 เส้นประไม่ใช่ขอบเขตที่แสงไปถึง','θ is measured at the slit centre, from the forward axis to the first dark direction, as in section 8 of the learning sheet. Dashed directions do not limit the reach of light.')}</p>`;
  }
  function problem(){
    const a=p();
    if(mode==='reflection')return {
      question:T(`รังสีตกกระทบทำมุม ${90-a.angle}° กับผิวสะท้อน จงหามุมตกกระทบและมุมสะท้อนที่วัดจากเส้นปกติ`,`A ray makes ${90-a.angle}° with the reflecting surface. Find its incidence and reflection angles measured from the normal.`),
      answer:`<p class="equation">θᵢ = 90° − ${90-a.angle}° = ${a.angle}°<br>θᵣ = θᵢ = ${a.angle}°</p><p>${T('เส้นปกติตั้งฉากกับผิว จึงต้องหามุมเติมเต็มก่อนใช้กฎการสะท้อน','The normal is perpendicular to the surface. Find the complementary angle before applying the reflection law.')}</p>`};
    if(mode==='refraction'){
      const r=M.refract(a);
      if(r.tir)return {question:T(`แสงจาก n₁ = ${a.n1} ไป n₂ = ${a.n2} ด้วยมุมตกกระทบ ${a.angle}° จงคำนวณมุมวิกฤตและอธิบายว่าทำไมไม่เห็นรังสีหักเห`,`Light travels from n₁ = ${a.n1} towards n₂ = ${a.n2} at ${a.angle}°. Calculate the critical angle and explain the missing refracted ray.`),answer:`<p class="equation">θc = sin⁻¹(${a.n2}/${a.n1}) = ${F(r.critical)}°<br>θ₁ = ${a.angle}° &gt; θc</p><p>${T('จึงเกิดการสะท้อนกลับหมด ไม่ควรฝืนหามุมหักเหด้วยค่า sin θ₂ ที่เกิน 1','Total internal reflection occurs. A sine value above 1 does not give a real refracted angle.')}</p>`};
      return {question:T(`แสง λ₀ = ${a.wavelength} nm จาก n₁ = ${a.n1} ไป n₂ = ${a.n2} ด้วย θ₁ = ${a.angle}° จงหา θ₂ อัตราเร็ว และความยาวคลื่นในตัวกลาง 2`,`Light of vacuum wavelength ${a.wavelength} nm enters n₂ = ${a.n2} from n₁ = ${a.n1} at θ₁ = ${a.angle}°. Find θ₂, speed and wavelength in medium 2.`),answer:`<p class="equation">sin θ₂ = (${a.n1}/${a.n2}) sin ${a.angle}°<br>θ₂ = ${F(r.angle)}°<br>v₂ = (3.0 × 10⁸)/${a.n2} = ${F(r.v2/1e8,2)} × 10⁸ m/s<br>λ₂ = ${a.wavelength}/${a.n2} = ${F(r.lambda2)} nm</p><p>${T('ความถี่คงเดิมทั้งสองตัวกลาง','Frequency is unchanged across the interface.')} f ≈ ${F(r.frequency/1e12,2)} THz.</p>`};
    }
    if(mode==='interference'){
      const q=M.probe(a),ratio=q.delta/a.wavelength,which=q.kind==='node'?T('บัพ — หักล้างสมบูรณ์','node — complete cancellation'):T('ปฏิบัพ — เสริมเต็มที่','antinode — full reinforcement');
      return {question:T(`ที่ P มี r₁ ≈ ${F(q.r1,4)} cm และ r₂ ≈ ${F(q.r2,4)} cm เมื่อ λ = ${F(a.wavelength)} cm แหล่งกำเนิดเฟส${a.phase===0?'ตรงกัน':'ตรงข้าม 180°'} จงหา Δr และระบุว่า P เป็นบัพหรือปฏิบัพ`,`At P, r₁ ≈ ${F(q.r1,4)} cm and r₂ ≈ ${F(q.r2,4)} cm, with λ = ${F(a.wavelength)} cm and sources ${a.phase===0?'in phase':'180° apart'}. Calculate Δr and identify P as a node or antinode.`),answer:`<p class="equation">Δr = |${F(q.r2,4)} − ${F(q.r1,4)}| ≈ ${F(q.delta,2)} cm<br>Δr/λ = ${F(ratio,1)}</p><p>${T('เทียบกับเงื่อนไขของเฟสแหล่งกำเนิด จะได้','Using the condition for these source phases gives')} <strong>${which}</strong>.</p><p>${T('แอมพลิจูดรวมที่ P เท่ากับ','Resultant amplitude at P:')} ${q.kind==='node'?'0':'2A'}. ${T('คำนวณจากค่าระยะเต็มก่อนปัดตัวเลขแสดงผล','Distances are calculated before display rounding.')}</p>`};
    }
    const r=M.diffract(a),other=a.compare==='wavelength'?(a.wavelength<=600?a.wavelength+100:a.wavelength-100):Number((a.opening>=1.2?a.opening-.4:a.opening+.4).toFixed(1));
    const larger=a.compare==='wavelength'?other>a.wavelength:other<a.opening;
    return {question:T(`แสงมี f ≈ ${F(r.frequency/1e12,3)} THz ใช้ c = 3.0 × 10⁸ m/s จงหา λ จากนั้น${a.compare==='wavelength'?`ตรึงช่อง a = ${F(a.opening)} μm แล้วเปลี่ยน λ เป็น ${other} nm`:`ตรึง λ แล้วเปลี่ยนช่องจาก ${F(a.opening)} เป็น ${F(other)} μm`} มุม θ จะเพิ่มหรือลด?`,`Light has f ≈ ${F(r.frequency/1e12,3)} THz. Use c = 3.0 × 10⁸ m/s to find λ. Then ${a.compare==='wavelength'?`keep a = ${F(a.opening)} μm and change λ to ${other} nm`:`keep λ fixed and change a from ${F(a.opening)} to ${F(other)} μm`}. Does θ increase or decrease?`),answer:`<p class="equation">λ = c/f = (3.0 × 10⁸)/(${F(r.frequency/1e12,3)} × 10¹²)<br>λ ≈ ${a.wavelength} × 10⁻⁹ m = ${a.wavelength} nm</p><p>${T(`มุม θ ${larger?'เพิ่มขึ้น':'ลดลง'} เพราะ${a.compare==='wavelength'?`เมื่อช่องเปิดคงเดิม ความยาวคลื่น${larger?'มากขึ้น':'น้อยลง'}`:`เมื่อความยาวคลื่นคงเดิม ช่องเปิด${larger?'แคบลง':'กว้างขึ้น'}`}`,`θ ${larger?'increases':'decreases'}: ${a.compare==='wavelength'?`the wavelength is ${larger?'longer':'shorter'} at fixed opening`:`the opening is ${larger?'narrower':'wider'} at fixed wavelength`}.`)}</p><p class="small">${T('ข้อนี้ใช้การคำนวณความยาวคลื่นและอธิบายแนวโน้ม ยังไม่ต้องคำนวณตำแหน่งแถบมืด–สว่าง','This exercise calculates wavelength and compares spreading; fringe-position calculations are not required.')}</p>`};
  }
  function initStudy(){
    for(const key of modes){
      const section=document.createElement('section');section.id='study-'+key;
      for(const [kind,th,en] of [['formula','สูตรย่อ · เปิด/ปิด','Formula recap · open/close'],['problem','ลองคำนวณ · เปิด/ปิดโจทย์','Try a calculation · open/close']]){
        const details=document.createElement('details');details.id=kind+'-'+key;
        const summary=document.createElement('summary');summary.dataset.th=th;summary.dataset.en=en;summary.textContent=th;
        const body=document.createElement('div');body.className='study-body';body.id=kind+'-body-'+key;details.append(summary,body);
        details.addEventListener('toggle',()=>{work[key][kind]=details.open;publish();});section.append(details);
        if(kind==='problem'){
          const sol=document.createElement('details');sol.id='solution-'+key;sol.className='solution';
          const label=document.createElement('summary');label.dataset.th='เปิดวิธีทำและคำอธิบาย';label.dataset.en='Show working and explanation';label.textContent=label.dataset.th;
          const content=document.createElement('div');content.id='solution-body-'+key;content.className='study-body';sol.append(label,content);sol.addEventListener('toggle',()=>{work[key].solution=sol.open;publish();});details.append(sol);
        }
      }
      $('study-panels').append(section);
    }
  }
  function update(){
    syncControls();const a=p(),r=mode==='refraction'?M.refract(a):mode==='interference'?M.probe(a):mode==='diffraction'?M.diffract(a):null;
    let values,note,observe;
    if(mode==='reflection'){
      values=[[T('มุมตกกระทบ θᵢ','Incidence θᵢ'),a.angle+'°'],[T('มุมสะท้อน θᵣ','Reflection θᵣ'),a.angle+'°'],[T('มุมตกกระทบกับผิว','Incident angle to surface'),(90-a.angle)+'°']];
      note=T('เส้นฟ้า: หน้าคลื่นตกกระทบ · เส้นส้ม: หน้าคลื่นสะท้อน · เส้นประ: เส้นปกติ','Blue: incident wavefronts · orange: reflected wavefronts · dashed: normal.');observe=T('เมื่อเพิ่มมุมตกกระทบ มุมสะท้อนเปลี่ยนอย่างไร? ลองเทียบมุมกับเส้นปกติและกับผิว','How does the reflection angle change with incidence? Compare angles to the normal and to the surface.');
    }else if(mode==='refraction'){
      values=[[T('มุมหักเห θ₂','Refraction θ₂'),r.tir?T('สะท้อนกลับหมด','Total reflection'):F(r.angle)+'°'],[r.tir?T('มุมวิกฤต θc','Critical angle θc'):T('อัตราเร็ว v₂','Speed v₂'),r.tir?F(r.critical)+'°':F(r.v2/1e8,2)+' × 10⁸ m/s'],[r.tir?T('ความถี่ f','Frequency f'):T('ความยาวคลื่น λ₂','Wavelength λ₂'),r.tir?F(r.frequency/1e12,1)+' THz':F(r.lambda2)+' nm']];
      note=T('ฟ้า: หน้าคลื่นตกกระทบ · เขียว: หน้าคลื่นหักเห · ระยะระหว่างหน้าคลื่นแทน λ ในตัวกลางนั้น','Blue: incident fronts · green: refracted fronts · wavefront spacing represents wavelength in each medium.');
      observe=r.tir?T('มุมตกกระทบเกินมุมวิกฤตแล้ว ลองลดมุมเพื่อให้รังสีหักเหกลับมา','Incidence exceeds the critical angle. Lower it to restore a refracted ray.'):T('สังเกตการเบนและระยะระหว่างหน้าคลื่น ความถี่คงเดิมแม้อัตราเร็วและ λ เปลี่ยน ถ้าตกกระทบตั้งฉาก รังสียังตรงได้','Observe bending and front spacing. Frequency stays the same when speed and λ change. At normal incidence, the ray remains straight.');
    }else if(mode==='interference'){
      values=[['Δr',F(r.delta,2)+' cm'],['Δr/λ',F(r.delta/a.wavelength,2)],[T('จุด P','Point P'),r.kind==='node'?T('บัพ · 0','Node · 0'):T('ปฏิบัพ · 2A','Antinode · 2A')]];
      note=T('สีพื้น: แอมพลิจูดรวม (ขาว 0 → เขียว 2A) · วงฟ้า/ส้ม: สันคลื่นจาก S₁/S₂ · A คือแอมพลิจูดของแต่ละแหล่ง','Background: resultant amplitude (white 0 → green 2A) · blue/orange rings: crests from S₁/S₂ · A is each source amplitude.');observe=T('สลับเฟส 0° กับ 180° แล้วดูว่า P และแนวกลางสลับเป็นบัพหรือปฏิบัพอย่างไร วงคลื่นไม่ใช่แนวบัพ','Switch 0°/180°. How do P and the centre line change between node and antinode? The rings are not nodal lines.');
    }else{
      values=[[T('มุมถึงทิศมืดแรก θ','First-dark angle θ'),F(r.angle)+'°'],['λ',a.wavelength+' nm'],['a/λ',F(r.ratio,2)]];
      note=T('ภาพมุมแผ่ระยะไกล ไม่ตามสเกล · เส้นประ: ทิศมืดแรก ยังมีแถบข้างนอกแนวนี้ · ฟ้า/ส้ม: ค่าสนามบวก/ลบ ไม่ใช้เทียบความเข้มระหว่างภาพ','Far-field angular schematic, not to scale · dashes: first-dark directions, with side bands beyond them · blue/orange: positive/negative field, not intensity comparisons.');
      observe=a.compare==='wavelength'?T(`ตรึงช่อง a = ${F(a.opening)} μm แล้วเพิ่ม λ: มุม θ มากขึ้น ตามใบเรียนรู้ส่วน 8`,`Hold a = ${F(a.opening)} μm and increase λ: θ increases, as in section 8.`):T(`ตรึง λ = ${a.wavelength} nm แล้วลดช่อง a: มุม θ มากขึ้น ตามใบเรียนรู้ส่วน 8`,`Hold λ = ${a.wavelength} nm and reduce a: θ increases, as in section 8.`);
    }
    $('diagram-note').textContent=note;$('observe').textContent=observe;$('mode-title').textContent=T(...names[mode]);
    $('bench').setAttribute('aria-label',T(...names[mode])+'. '+observe);$('mode-panel').setAttribute('aria-labelledby','tab-'+mode);
    $('play').textContent=running?T('หยุดภาพ','Pause'):T('เล่นต่อ','Play');$('play-status').textContent=running?T('กำลังแสดง','Playing'):T('หยุดภาพแล้ว','Paused');
    $('readouts').replaceChildren();for(const [title,value] of values){const group=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=title;dd.textContent=value;group.append(dt,dd);$('readouts').append(group);}
    for(const key of modes){$('study-'+key).hidden=key!==mode;for(const kind of ['formula','problem','solution'])$(kind+'-'+key).open=work[key][kind];}
    const q=problem();$('formula-body-'+mode).innerHTML=formula();$('problem-body-'+mode).textContent=q.question;$('solution-body-'+mode).innerHTML=q.answer;
    document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});dirty=true;
  }
  function changeMode(next){if(!modes.includes(next))return;mode=next;controls();V.invalidate();update();publish();}
  document.querySelectorAll('[data-mode]').forEach(button=>{
    button.addEventListener('click',()=>changeMode(button.dataset.mode));
    button.addEventListener('keydown',event=>{let i=modes.indexOf(mode);if(event.key==='ArrowRight')i=(i+1)%4;else if(event.key==='ArrowLeft')i=(i+3)%4;else if(event.key==='Home')i=0;else if(event.key==='End')i=3;else return;event.preventDefault();changeMode(modes[i]);$('tab-'+mode).focus();});
  });
  function language(next){lang=next==='en'?'en':'th';document.documentElement.lang=lang;document.querySelectorAll('[data-th][data-en]').forEach(n=>n.textContent=n.dataset[lang]);$('language').textContent=lang==='th'?'English':'ภาษาไทย';controls();update();}
  $('language').onclick=()=>language(lang==='th'?'en':'th');$('play').onclick=()=>{running=!running;last=null;update();publish();};
  $('reset').onclick=()=>{work[mode]=fresh(mode);time=0;controls();V.invalidate();update();publish();};
  function getState(){return {version:1,identity,mode,running,time,work:structuredClone(work)};}
  function restoreState(snapshot){
    if(!snapshot||snapshot.version!==1||snapshot.identity!==identity||!modes.includes(snapshot.mode)||!Number.isFinite(snapshot.time)||snapshot.time<0||snapshot.time>1e8||!snapshot.work||typeof snapshot.work!=='object')return false;
    for(const key of modes){const v=snapshot.work[key];if(!v||!M.valid(key,v.params)||!['formula','problem','solution'].every(k=>typeof v[k]==='boolean'))return false;}
    work=structuredClone(snapshot.work);mode=snapshot.mode;time=snapshot.time;running=false;last=null;controls();V.invalidate();update();publish();return true;
  }
  window.LearningHubSimulation={getState,restoreState,subscribe:fn=>{subscriber=typeof fn==='function'?fn:null;return()=>{subscriber=null;};}};
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='learning-hub-context')return;
    const next=event.data.identity?.uid||'guest';if(next!==identity){identity=next;work=Object.fromEntries(modes.map(k=>[k,fresh(k)]));mode='reflection';time=0;running=false;V.invalidate();}language(event.data.language||lang);
  });
  document.addEventListener('visibilitychange',()=>{last=null;});
  function frame(now){const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;if(running&&!document.hidden){time+=dt*.65;dirty=true;}if(dirty){V.draw($('bench'),mode,p(),time,lang);dirty=false;}requestAnimationFrame(frame);}
  initStudy();language('th');new ResizeObserver(()=>{dirty=true;}).observe($('bench'));requestAnimationFrame(frame);
  if(parent!==window)parent.postMessage({type:'learning-hub-tool-ready'},location.origin);
})();
