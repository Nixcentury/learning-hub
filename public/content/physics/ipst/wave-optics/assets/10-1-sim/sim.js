(() => {
  'use strict';
  const Q=globalThis.MiniWaveMissions,W=globalThis.InterferenceWater,M=globalThis.WaveMiniModel,V=globalThis.WaveMiniView,$=id=>document.getElementById(id),modes=Object.keys(M.defaults);
  let lang='th',mode='reflection',identity='guest',subscriber=null,running=!matchMedia('(prefers-reduced-motion: reduce)').matches,time=0,last=null,dirty=true;
  const fresh=key=>({params:{...M.defaults[key]},formula:false,problem:false,solution:false,visual:M.visual(key),mission:Q.initial()});
  let work=Object.fromEntries(modes.map(key=>[key,fresh(key)]));
  const s=()=>work[mode],p=()=>s().params,T=(th,en)=>lang==='th'?th:en,F=(n,d=1)=>Number(n).toFixed(d),publish=()=>{subscriber?.();globalThis.WaveAssessmentStorage?.changed();};
  const names={reflection:['การสะท้อน','Reflection'],refraction:['การหักเห','Refraction'],interference:['การแทรกสอด','Interference'],diffraction:['การเลี้ยวเบน','Diffraction']};
  const descriptors={
    reflection:[['angle','มุมตกกระทบ θᵢ','Incidence angle θᵢ',0,75,1,'°']],
    refraction:[['angle','มุมตกกระทบ θ₁','Incidence angle θ₁',0,80,1,'°'],['n1','ตัวกลาง 1 · n₁','Medium 1 · n₁',[[1,'อากาศ · 1.00','Air · 1.00'],[1.33,'น้ำ · 1.33','Water · 1.33'],[1.5,'แก้ว · 1.50','Glass · 1.50']]],['n2','ตัวกลาง 2 · n₂','Medium 2 · n₂',[[1,'อากาศ · 1.00','Air · 1.00'],[1.33,'น้ำ · 1.33','Water · 1.33'],[1.5,'แก้ว · 1.50','Glass · 1.50']]],['wavelength','λ ในสุญญากาศ','Vacuum wavelength λ',400,700,10,'nm']],
    interference:[['wavelength','ความยาวคลื่น λ','Wavelength λ',1,4,.1,'cm'],['separation','ระยะระหว่างแหล่ง d','Source separation d',4,12,.5,'cm'],['phase','เฟสของสองแหล่ง','Source phase',[[0,'ตรงกัน · 0°','In phase · 0°'],[180,'ตรงข้าม · 180°','Opposite · 180°']]],['probe','จุดสังเกต P','Observation point P',[['center','P บนแนวกลาง','P on centre line'],['side','P ตัวอย่าง Δr=λ/2','Example P: Δr=λ/2'],['custom','เลื่อน P เอง','Custom P']]]],
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
        if(!M.valid(mode,next))return;s().params=next;if(mode==='interference'&&key==='probe'&&value==='side')s().visual.L=10;if(mode==='interference'&&key==='probe'&&value==='center')s().visual.x=0;changed();
      });group.append(label,input);$('controls').append(group);
    }
    layerControls();
    if(mode==='diffraction'){const note=document.createElement('p');note.className='lock';note.id='lock-note';$('controls').append(note);}
  }
  function syncControls(){
    for(const [key] of descriptors[mode]){const input=$('param-'+key);input.value=p()[key];const output=$('value-'+key);if(output)output.textContent=F(p()[key],['opening','separation','wavelength'].includes(key)&&mode==='interference'||key==='opening'?1:0)+' '+input.dataset.unit;}
    if(mode==='diffraction'){
      $('param-wavelength').disabled=p().compare!=='wavelength';$('param-opening').disabled=p().compare!=='opening';
      $('lock-note').textContent=T('สไลเดอร์สีจางคือค่าที่ตรึงไว้ เปลี่ยนกรณีเพื่อปรับอีกค่า','The dimmed slider is held fixed. Switch comparison to change it.');
    }
  }
  function changed(observed=true){s().solution=false;if(observed){Q.observe(mode,s(),true);}V.invalidate();dirty=true;update();publish();}
  function layerControls(){
    $('layer-controls').replaceChildren();
    const list=mode==='reflection'?[['field','ผิวน้ำ · สัน–ท้องคลื่น','Water surface · crests / troughs'],['fronts','เส้นหน้าคลื่นเสริม','Wavefront guides'],['variables','ลูกศรและมุม','Arrows and angles']]:[['field','รอยคลื่น / ค่าสนาม','Ripple / wave field'],['fronts','เส้นสัน–ท้องคลื่น','Crest / trough lines'],['variables','เส้นตัวแปร','Variables']];
    if(mode==='interference')list.push(['nodes','แนวบัพ N','Nodal lines N'],['antinodes','แนวปฏิบัพ A','Antinodal lines A'],['paths','เส้นทาง r₁ / r₂','Paths r₁ / r₂'],['graph','กราฟฉาก I(y)','Screen I(y)']);
    for(const [key,th,en] of list){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.id='layer-'+key;input.checked=s().visual[key];input.onchange=()=>{s().visual[key]=input.checked;changed(false);};label.append(input,document.createTextNode(T(th,en)));$('layer-controls').append(label);}
    $('probe-controls').replaceChildren();$('probe-controls').hidden=mode!=='interference';
    if(mode==='interference')for(const [key,min,max,step,th,en] of [['L',6,60,.5,'ระยะฉาก L','Screen distance L'],['x',-8,8,.1,'ตำแหน่ง P · x (หรือ y บนฉาก)','Probe x (screen y)']]){
      const group=document.createElement('div');group.className='control';const label=document.createElement('label');label.htmlFor='probe-'+key;label.textContent=T(th,en);const out=document.createElement('output');out.id='probe-value-'+key;label.append(out);const input=document.createElement('input');Object.assign(input,{id:'probe-'+key,type:'range',min,max,step});input.oninput=()=>{const previous=M.water(p(),s().visual);s().visual[key]=Number(input.value);if(key==='L')s().visual.x=previous.x;s().params.probe='custom';changed();};group.append(label,input);$('probe-controls').append(group);
    }
    if(mode==='interference'){const help=document.createElement('p');help.className='lock';help.textContent=T('ลาก P หรือคลิกภาพเพื่อเลือกจุด ใช้ลูกศร ↑↓ ปรับ x และ ←→ ปรับ L ได้; สูตรประมาณใช้เมื่อ L ≫ d และ |x| ≪ L','Drag P or click the picture; ↑↓ changes x and ←→ changes L. Approximations need L ≫ d and |x| ≪ L.');$('probe-controls').append(help);}
  }
  function syncVisual(){
    for(const input of $('layer-controls').querySelectorAll('input'))input.checked=s().visual[input.id.slice(6)];
    $('mini-probe').hidden=mode!=='interference';$('mini-screen').hidden=mode!=='interference'||!s().visual.graph;
    if(mode!=='interference')return;
    const w=M.water(p(),s().visual),g=W.geometry(w),xy=W.screen(w.L,w.x),handle=$('mini-probe');
    handle.style.left=xy.x/8+'%';handle.style.top=(xy.y+10)/4.4+'%';handle.setAttribute('aria-valuenow',w.x.toFixed(4));handle.setAttribute('aria-valuetext',`P: L=${F(w.L,1)} cm, x=${F(w.x,3)} cm`);
    for(const key of ['L','x']){$('probe-'+key).value=w[key];$('probe-value-'+key).textContent=F(w[key],key==='x'?2:1)+' cm';}
    const graph=InterferenceScreen.draw($('mini-screen-diagram'),{lambda:w.wavelength,d:w.separation,L:w.L,phase:w.phase,position:w.x,extent:16,unit:'cm'},lang);
    const orderText=graph.orders.filter(q=>q.m===1||q.m===2).map(q=>`m=${q.m}: y=${F(q.y,3)} cm, θ=${F(q.theta,2)}°`).join(' · ');$('mini-screen-caption').textContent=T(`P: y=${F(w.x,3)} cm · θ=${F(g.theta,2)}° · I/I₀=${F(graph.intensity,3)} · เฟส ${w.phase}°`,`P: y=${F(w.x,3)} cm · θ=${F(g.theta,2)}° · I/I₀=${F(graph.intensity,3)} · phase ${w.phase}°`)+(w.phase===0?' · '+orderText:'');
    $('mini-path-values').textContent=`r₁=${F(g.r1,4)} · r₂=${F(g.r2,4)} cm; Δr=${F(g.delta,4)} cm; d|sin θ|=${F(g.angular,4)} cm; d|x|/L=${F(g.small,4)} cm`;
  }
  function formula(){
    if(mode==='reflection')return `<p class="equation">θᵢ = θᵣ</p><p>${T('มุมตกกระทบและมุมสะท้อนวัดจากเส้นปกติ ไม่ใช่ผิวสะท้อน มุมกับผิว + มุมกับเส้นปกติ = 90°','Measure incidence and reflection angles from the normal. An angle to the surface plus its angle to the normal is 90°.')}</p>`;
    if(mode==='refraction')return `<p class="equation">n₁ sin θ₁ = n₂ sin θ₂<br>v = c/n · λ = λ₀/n · f = c/λ₀</p><p>${T('n คือดัชนีหักเห ไม่มีหน่วย; c = 3.0 × 10⁸ m/s; λ₀ คือความยาวคลื่นในสุญญากาศ ความถี่ f คงเดิมเมื่อผ่านรอยต่อที่อยู่นิ่ง','n is dimensionless; c = 3.0 × 10⁸ m/s; λ₀ is vacuum wavelength. Frequency f stays constant at a stationary interface.')}</p><p>${T('ถ้า n₁ > n₂ จะมีมุมวิกฤต θc = sin⁻¹(n₂/n₁) เมื่อ θ₁ > θc เกิดการสะท้อนกลับหมด ไม่มีรังสีหักเหที่แผ่เข้าสู่ตัวกลาง 2','If n₁ > n₂, θc = sin⁻¹(n₂/n₁). For θ₁ > θc, total internal reflection occurs: no propagating refracted ray enters medium 2.')}</p>`;
    if(mode==='interference')return `<p>${T('ผลต่างทางเดินจริง Δr ใช้ได้ทุกระยะ ส่วน Δr ≈ d|sin θ| ใช้เมื่อ L ≫ d และ ≈ d|x|/L เพิ่มเงื่อนไข |x| ≪ L; ตัวเลขทั้งสามแสดงให้เทียบด้านล่างกราฟ','Exact path difference Δr applies at all distances. Δr ≈ d|sin θ| needs L ≫ d; ≈ d|x|/L also needs |x| ≪ L. Compare the three values below the profile.')}</p><p class="equation">u = u₁ + u₂ · Δr = |r₂ − r₁|</p><p>${T('แหล่งเฟสตรงกัน: เสริมเมื่อ Δr = mλ; หักล้างเมื่อ Δr = (m + ½)λ','In-phase sources: constructive at Δr = mλ; destructive at Δr = (m + ½)λ.')}</p><p>${T('แหล่งเฟสตรงข้าม 180°: สลับสองเงื่อนไขข้างบน; m = 0, 1, 2, …','Sources 180° apart: exchange the two conditions above; m = 0, 1, 2, …')}</p><p>${T('เมื่อคลื่นย่อยมีแอมพลิจูดเท่ากัน A: บัพมีแอมพลิจูดรวม 0 ปฏิบัพมีแอมพลิจูดรวม 2A บัพไม่ใช่เพียงจุดที่การกระจัดเป็นศูนย์ชั่วขณะ','With equal component amplitudes A, a node has resultant amplitude 0; an antinode has 2A. A momentary zero displacement alone is not a node.')}</p>`;
    return `<p class="equation">λ = c/f · 1 μm = 1,000 nm</p><p>${T('ตรึงช่องเปิด: λ มากขึ้น → มุม θ มากขึ้น','Fixed opening: larger λ → larger angle θ.')}</p><p>${T('ตรึง λ: ช่องเปิดแคบลง → มุม θ มากขึ้น','Fixed λ: narrower opening → larger angle θ.')}</p><p>${T('θ วัดที่กึ่งกลางช่อง จากแนวตรงไปข้างหน้าถึงทิศมืดแรก ตามภาพในใบเรียนรู้ 10.1 ส่วน 8 เส้นประไม่ใช่ขอบเขตที่แสงไปถึง','θ is measured at the slit centre, from the forward axis to the first dark direction, as in section 8 of the learning sheet. Dashed directions do not limit the reach of light.')}</p>`;
  }
  function initStudy(){
    for(const key of modes){
      const section=document.createElement('section');section.id='study-'+key;
      const details=document.createElement('details');details.id='formula-'+key;
      const summary=document.createElement('summary');summary.dataset.th='สูตรย่อ · เปิด/ปิด';summary.dataset.en='Formula recap · open/close';summary.textContent=summary.dataset.th;
      const body=document.createElement('div');body.className='study-body';body.id='formula-body-'+key;details.append(summary,body);
      details.addEventListener('toggle',()=>{work[key].formula=details.open;publish();});section.append(details);$('study-panels').append(section);
    }
  }
  function update(){
    syncControls();syncVisual();const a=p(),r=mode==='refraction'?M.refract(a):mode==='interference'?W.geometry(M.water(a,s().visual)):mode==='diffraction'?M.diffract(a):null;
    let values,note,observe;
    if(mode==='reflection'){
      values=[[T('มุมตกกระทบ θᵢ','Incidence θᵢ'),a.angle+'°'],[T('มุมสะท้อน θᵣ','Reflection θᵣ'),a.angle+'°'],[T('มุมตกกระทบกับผิว','Incident angle to surface'),(90-a.angle)+'°']];
      note=T('มองผิวน้ำจากด้านบน: แสงเงาแสดงสัน–ท้องคลื่นรวม · ลูกศรฟ้า: ตกกระทบ · ลูกศรส้ม: สะท้อน · N: เส้นปกติ · เปิดเส้นหน้าคลื่นเพิ่มได้','Top view of water: shading shows the combined surface · blue arrow: incident · orange arrow: reflected · N: normal · wavefront guides are optional.');observe=T('กดเล่นดูผิวน้ำที่คลื่นตกกระทบซ้อนกับคลื่นสะท้อน ลูกศรแสดงทิศของคลื่นแต่ละชุด ลองปรับมุมเทียบกับเส้นปกติ ที่มุม 0° คลื่นสวนกันเกิดคลื่นนิ่ง','Play to see the combined incident and reflected water waves; arrows show each wave’s direction. Compare angles to the normal. At 0°, opposite waves form a standing wave.');
    }else if(mode==='refraction'){
      values=[[T('มุมหักเห θ₂','Refraction θ₂'),r.tir?T('สะท้อนกลับหมด','Total reflection'):F(r.angle)+'°'],[r.tir?T('มุมวิกฤต θc','Critical angle θc'):T('อัตราเร็ว v₂','Speed v₂'),r.tir?F(r.critical)+'°':F(r.v2/1e8,2)+' × 10⁸ m/s'],[r.tir?T('ความถี่ f','Frequency f'):T('ความยาวคลื่น λ₂','Wavelength λ₂'),r.tir?F(r.frequency/1e12,1)+' THz':F(r.lambda2)+' nm']];
      note=T('สีพื้น: ค่าสนามสเกลาร์บวก/ลบ · เส้นทึบ/ประ: สัน/ท้องคลื่น · ฟ้า: ตกกระทบ เขียว: หักเห · ระยะเส้นแทน λ','Background: signed scalar field · solid/dashed: crests/troughs · blue: incident, green: refracted · spacing represents λ.');
      observe=r.tir?T('มุมตกกระทบเกินมุมวิกฤตแล้ว ลองลดมุมเพื่อให้รังสีหักเหกลับมา','Incidence exceeds the critical angle. Lower it to restore a refracted ray.'):T('สังเกตการเบนและระยะระหว่างหน้าคลื่น ความถี่คงเดิมแม้อัตราเร็วและ λ เปลี่ยน ถ้าตกกระทบตั้งฉาก รังสียังตรงได้','Observe bending and front spacing. Frequency stays the same when speed and λ change. At normal incidence, the ray remains straight.');
    }else if(mode==='interference'){
      values=[['Δr',F(r.delta,2)+' cm'],['Δr/λ',F(r.delta/a.wavelength,2)],[T('จุด P','Point P'),r.kind==='node'?T('บัพ · 0','Node · 0'):r.kind==='antinode'?T('ปฏิบัพ · 2A','Antinode · 2A'):T('ระหว่างแนว','Between loci')]];
      note=T('สีพื้น: การกระจัดรวมขณะหนึ่ง · เส้นทึบ: สันคลื่น · เส้นประ: ท้องคลื่น · แนว N/A คือบัพ/ปฏิบัพ ไม่ใช่วงคลื่น','Background: instantaneous resultant displacement · solid: crests · dashed: troughs · N/A loci are nodal/antinodal lines, distinct from wavefront rings.');observe=T('สลับเฟส 0° กับ 180° แล้วดูว่า P และแนวกลางสลับเป็นบัพหรือปฏิบัพอย่างไร วงคลื่นไม่ใช่แนวบัพ','Switch 0°/180°. How do P and the centre line change between node and antinode? The rings are not nodal lines.');
    }else{
      values=[[T('มุมถึงทิศมืดแรก θ','First-dark angle θ'),F(r.angle)+'°'],['λ',a.wavelength+' nm'],['a/λ',F(r.ratio,2)]];
      note=T('ภาพมุมแผ่ระยะไกล ไม่ตามสเกล · เส้นประ: ทิศมืดแรก ยังมีแถบข้างนอกแนวนี้ · ฟ้า/ส้ม: ค่าสนามบวก/ลบ ไม่ใช้เทียบความเข้มระหว่างภาพ','Far-field angular schematic, not to scale · dashes: first-dark directions, with side bands beyond them · blue/orange: positive/negative field, not intensity comparisons.');
      observe=a.compare==='wavelength'?T(`ตรึงช่อง a = ${F(a.opening)} μm แล้วเพิ่ม λ: มุม θ มากขึ้น ตามใบเรียนรู้ส่วน 8`,`Hold a = ${F(a.opening)} μm and increase λ: θ increases, as in section 8.`):T(`ตรึง λ = ${a.wavelength} nm แล้วลดช่อง a: มุม θ มากขึ้น ตามใบเรียนรู้ส่วน 8`,`Hold λ = ${a.wavelength} nm and reduce a: θ increases, as in section 8.`);
    }
    $('diagram-note').textContent=note;$('observe').textContent=observe;$('mode-title').textContent=T(...names[mode]);
    $('bench').setAttribute('aria-label',T(...names[mode])+'. '+observe);$('mode-panel').setAttribute('aria-labelledby','tab-'+mode);
    $('play').textContent=running?T('หยุดภาพ','Pause'):T('เล่นต่อ','Play');$('play-status').textContent=running?T('กำลังแสดง','Playing'):T('หยุดภาพแล้ว','Paused');
    $('readouts').replaceChildren();for(const [title,value] of values){const group=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=title;dd.textContent=value;group.append(dt,dd);$('readouts').append(group);}
    for(const key of modes){$('study-'+key).hidden=key!==mode;for(const kind of ['formula'])$(kind+'-'+key).open=work[key][kind];}
    $('formula-body-'+mode).innerHTML=formula();
    document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});globalThis.MiniWaveGuidance?.render();globalThis.MiniWaveObjectives?.render(mode,lang);dirty=true;
  }
  function changeMode(next){if(!modes.includes(next))return;mode=next;controls();V.invalidate();update();publish();}
  document.querySelectorAll('[data-mode]').forEach(button=>{
    button.addEventListener('click',()=>changeMode(button.dataset.mode));
    button.addEventListener('keydown',event=>{let i=modes.indexOf(mode);if(event.key==='ArrowRight')i=(i+1)%4;else if(event.key==='ArrowLeft')i=(i+3)%4;else if(event.key==='Home')i=0;else if(event.key==='End')i=3;else return;event.preventDefault();changeMode(modes[i]);$('tab-'+mode).focus();});
  });
  function language(next){lang=next==='en'?'en':'th';document.documentElement.lang=lang;document.querySelectorAll('[data-th][data-en]').forEach(n=>n.textContent=n.dataset[lang]);$('language').textContent=lang==='th'?'English':'ภาษาไทย';controls();update();}
  $('language').onclick=()=>language(lang==='th'?'en':'th');$('play').onclick=()=>{running=!running;last=null;update();publish();};
  $('reset').onclick=()=>{work[mode]={...fresh(mode),mission:work[mode].mission};time=0;controls();V.invalidate();update();publish();};
  function getState(){return {version:3,identity,mode,running,time,work:structuredClone(work)};}
  function restoreState(snapshot){
    if(!snapshot||snapshot.version!==3||snapshot.identity!==identity||!modes.includes(snapshot.mode)||!Number.isFinite(snapshot.time)||snapshot.time<0||snapshot.time>1e8||!snapshot.work||typeof snapshot.work!=='object')return false;
    for(const key of modes){const v=snapshot.work[key];if(!v||!M.valid(key,v.params)||!['formula','problem','solution'].every(k=>typeof v[k]==='boolean')||(!M.visualValid(v.visual,key==='interference'?v.params:null)||!Q.valid(v.mission,key)))return false;}
    work=Object.fromEntries(modes.map(k=>[k,{...fresh(k),...structuredClone(snapshot.work[k])}]));mode=snapshot.mode;time=snapshot.time;running=false;last=null;controls();V.invalidate();update();publish();return true;
  }
  window.LearningHubSimulation={getState,restoreState,subscribe:fn=>{subscriber=typeof fn==='function'?fn:null;return()=>{subscriber=null;};}};
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='learning-hub-context')return;
    const next=event.data.identity?.uid||'guest';if(next!==identity){identity=next;work=Object.fromEntries(modes.map(k=>[k,fresh(k)]));mode='reflection';time=0;running=false;V.invalidate();globalThis.WaveAssessmentStorage?.switchIdentity(next);}language(event.data.language||lang);
  });
  document.addEventListener('visibilitychange',()=>{last=null;});
  function frame(now){const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;if(running&&!document.hidden){time+=dt*.65;dirty=true;}if(dirty){V.draw($('bench'),mode,p(),time,s().visual);dirty=false;}requestAnimationFrame(frame);}
  globalThis.WaveMiniBridge={read:()=>({mode,work,identity}),language:()=>lang,current:s,notify:publish,change:fn=>{fn(s(),mode);controls();changed(false);},restoreAssessment:record=>{if(!Q.validRecord(record))return false;for(const k of modes)work[k].mission=structuredClone(record.missions[k]);mode=record.mode;controls();V.invalidate();update();return true;}};
  const moveP=event=>{if(mode!=='interference')return;const rect=$('bench').getBoundingClientRect(),q=W.fromScreen((event.clientX-rect.left)/rect.width*800,(event.clientY-rect.top)/rect.height*440-10);s().visual.L=Math.max(6,Math.min(60,q.L));s().visual.x=Math.max(-8,Math.min(8,q.x));s().params.probe='custom';changed();};
  let dragging=false;const probe=$('mini-probe');probe.onpointerdown=event=>{dragging=true;probe.setPointerCapture(event.pointerId);event.preventDefault();};probe.onpointermove=event=>{if(dragging)moveP(event);};probe.onpointerup=()=>dragging=false;probe.onpointercancel=()=>dragging=false;
  $('bench').onclick=moveP;probe.onkeydown=event=>{if(mode!=='interference'||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();const w=M.water(p(),s().visual);s().visual.x=event.key==='Home'?0:Math.max(-8,Math.min(8,w.x+(event.key==='ArrowUp'?.1:event.key==='ArrowDown'?-.1:0)));s().visual.L=Math.max(6,Math.min(60,w.L+(event.key==='ArrowRight'?.5:event.key==='ArrowLeft'?-.5:0)));s().params.probe='custom';changed();};
  initStudy();language('th');new ResizeObserver(()=>{dirty=true;if(mode==='interference')syncVisual();}).observe($('bench'));requestAnimationFrame(frame);
  if(parent!==window)parent.postMessage({type:'learning-hub-tool-ready'},location.origin);
})();
