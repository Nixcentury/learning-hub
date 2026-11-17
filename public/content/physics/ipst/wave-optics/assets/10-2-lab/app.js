(() => {
  'use strict';
  const M=globalThis.DoubleSlitLabModel,P=globalThis.DoubleSlitLabPlot,$=id=>document.getElementById(id),F=(n,d=2)=>Number(n).toFixed(d);
  let lang='th',identity='guest',subscriber=null,drag=null,notice='';
  let localSession=null,localReady=false,localStarted=false,identityEpoch=0,localStatus='loading';
  const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Bangkok'});
  const initial=()=>({view:'water',lightPhase:0,autoMeasured:false,water:InterferenceWater.initial(),missions:InterferenceMissions.initial(),config:{...M.presets.A},zoom:1,cursors:{left:-8,right:8},moved:{left:false,right:false},records:[],formula:false,analysis:false,exercise:false,solution:false,guideMode:'expanded',reportOpen:false,student:{name:'',className:'',date:today()}});
  let state=initial();const T=(th,en)=>lang==='th'?th:en,publish=()=>{subscriber?.();if(localReady){localSession?.save(getState());}};
  function capturePanels(){for(const key of ['formula','analysis','exercise','solution'])state[key]=$(key).open;}
  function getState(){capturePanels();state.missions.answerOpen=$('mission-answer').open;return {version:3,identity,...structuredClone(state)};}
  function resetMarkers(){state.autoMeasured=false;state.cursors={left:-8,right:8};state.moved={left:false,right:false};state.analysis=false;state.solution=false;notice='';}
  function configChange(config,resetPhase=false){if(!M.validConfig(config))return;capturePanels();state.config={...config};if(resetPhase)state.lightPhase=0;resetMarkers();window.GuidedInterference?.event('config');render(true);publish();}
  function move(side,value){if(!Number.isFinite(value))return;state.autoMeasured=false;state.cursors[side]=Math.max(-40,Math.min(40,value));state.moved[side]=true;state.analysis=false;notice='';renderMeasurement();study();$('analysis').open=false;window.GuidedInterference?.event('measure');window.GuidedInterference?.render();publish();}
  function renderMeasurement(){
    if(state.view==='light')P.cursors(state,lang);$('measurement-source').textContent=state.autoMeasured?T('เส้นวัดวางที่ตำแหน่งมืดตามแบบจำลอง กดบันทึกหรือขยับวัดเองต่อได้','Markers are on model minima. Record or move them to measure manually.'):T('กำลังวัดด้วยการเลือกตำแหน่งเอง','Measuring with manually selected positions.');const width=M.measurement(state.cursors);
    $('reading-left').textContent=F(state.cursors.left)+' mm';$('reading-right').textContent=F(state.cursors.right)+' mm';$('reading-width').textContent=width>0?F(width)+' mm':'—';
    $('record').disabled=!M.canRecord(state);if(state.view==='light'){const z=M.physical(state.config),g=InterferenceScreen.draw($('light-screen-diagram'),{lambda:z.lambda*1000,d:z.d*1000,L:z.L*1000,a:z.a*1000,phase:state.lightPhase,position:state.cursors.right,extent:40,unit:'mm',far:true},lang);$('light-screen-caption').textContent=T('เส้นแดงคือความเข้มเฉลี่ย I(y) · P ตามเส้นวัด R · เรขาคณิตไม่ตามสเกล เส้น m แสดงเงื่อนไขเสริมของสองช่อง กราฟรวมซองเลี้ยวเบน','Red: mean intensity I(y). P follows marker R. Geometry is schematic; m guides show two-slit constructive conditions and the curve includes diffraction.')+' · y(P)='+F(state.cursors.right)+' mm · θ(P)='+F(g.theta*180/Math.PI)+'°'+(state.lightPhase===0?' · '+g.orders.filter(q=>q.m===1||q.m===2).map(q=>`m=${q.m}: y=${F(q.y,3)} mm, θ=${F(q.theta,3)}°`).join(' · '):'')+T(' · I₀: ความเข้มกลางเมื่อเฟส 0°',' · I₀: in-phase axial intensity');}
    $('record-help').textContent=notice?T('บันทึกแล้ว เลือกชุดถัดไปหรือวัดใหม่ได้','Recorded. Choose another set or measure again.'):state.records.length>=30?T('ครบ 30 บันทึกแล้ว ลบรายการที่ไม่ใช้ก่อนเพิ่ม','30 records reached. Delete an unused record to add another.'):width<=0?T('เส้นซ้ายต้องอยู่ทางซ้ายของเส้นขวา','Place L to the left of R.'):!state.moved.left||!state.moved.right?T('ขยับเส้นวัดทั้ง L และ R ไปขอบมืดของแถบกลาง แล้วกดบันทึก','Move both L and R to the central fringe’s dark boundaries, then record.'):T('บันทึกตำแหน่งที่เลือกได้ หากยังไม่แน่ใจ ขยายฉากแล้วปรับละเอียด','Ready to record your selected boundaries. Zoom in and fine-tune if needed.');
    if(state.lightPhase===180&&!notice&&(!state.moved.left||!state.moved.right)&&width>0)$('record-help').textContent=T('แนวกลางมืด วาง L/R ที่ขอบมืดสองข้างของแถบสว่างข้างกลางหนึ่งแถบ','The centre is dark. Place L/R at the two minima bounding one adjacent bright fringe.');
  }
  function renderRecords(){
    $('empty-records').hidden=state.records.length>0;$('record-table-wrap').hidden=!state.records.length;$('record-count').textContent=T('บันทึกแล้ว ','Recorded ')+state.records.length;
    $('records-body').replaceChildren();
    for(const r of state.records){
      const row=document.createElement('tr');row.dataset.recordId=r.id;
      const cells=[`${r.id} · ${!(r.phase||0)&&M.preset(r.config)||T('กำหนดเอง','Custom')}`,r.source==='model'?T('แบบจำลอง','Model'):T('ลากวัด','Manual'),(r.phase||0)+'°',M.wavelengths[r.config.color],r.config.slit,F(r.config.distance,1),F(r.cursors.left),F(r.cursors.right),F(M.measurement(r.cursors))];
      for(const value of cells){const td=document.createElement('td');td.textContent=value;row.append(td);}
      const td=document.createElement('td'),button=document.createElement('button');button.textContent=T('ลบ','Delete');button.setAttribute('aria-label',T('ลบบันทึกครั้งที่ ','Delete record ')+r.id);button.onclick=()=>{capturePanels();state.records=state.records.filter(x=>x.id!==r.id);state.solution=false;notice='';window.GuidedInterference?.event('record');render(false);publish();};td.append(button);row.append(td);$('records-body').append(row);
    }
  }
  function study(){
    const c=state.config,t=M.theory(c),width=M.measurement(state.cursors),latest=state.records.at(-1);
    $('formula-body').innerHTML=`<p class="equation">Δx ≈ λL/d · λ ≈ dΔx/L</p><p>${T('λ คือความยาวคลื่น, L คือระยะสลิตถึงฉาก, d คือระยะกึ่งกลางสองสลิต แปลงทุกค่าเป็นเมตรก่อนแทนสูตร แล้วแปลงผลกลับเป็น mm หรือ nm','λ is wavelength, L is slit-to-screen distance and d is centre-to-centre slit separation. Convert values to metres before substitution; convert the result back to mm or nm.')}</p><p>${T('สำหรับเฟส 0° แถบสว่างกลางวัดจากตำแหน่งมืดที่ติดกันสองข้าง ในการประมาณมุมเล็ก ความกว้างนี้เท่ากับระยะห่างของแถบสว่างติดกันหนึ่งช่วง ไม่ใช่ความกว้างทั้งกลุ่มแถบ','For 0° phase, measure the central bright fringe between its two immediately adjacent minima. At small angles this width equals one adjacent bright-fringe spacing, not the width of the whole group of fringes.')}</p><p class="equation">1 μm = 10⁻⁶ m · 1 nm = 10⁻⁹ m · 1 mm = 10⁻³ m</p>`;
    $('analysis-body').innerHTML=`<p>${T('เงื่อนไขปัจจุบัน','Current settings')}: λ = ${t.lambdaNm} nm, d = ${c.slit} μm, L = ${F(c.distance,1)} m.</p><p class="equation">Δx ≈ (${t.lambdaNm} × 10⁻⁹) × ${F(c.distance,1)}/(${c.slit} × 10⁻⁶)<br>≈ ${F(t.spacing,3)} mm</p><p>${width>0?T(`เส้นวัดปัจจุบันห่าง ${F(width)} mm ต่างจากทฤษฎีประมาณ ${F(Math.abs(width-t.spacing))} mm`,`Current marker separation is ${F(width)} mm, about ${F(Math.abs(width-t.spacing))} mm from theory.`):T('ยังเทียบไม่ได้ วาง L ทางซ้ายของ R ก่อน','Place L left of R before comparing.')}</p><p>${T('ถ้าค่าต่างกัน ลองตรวจว่าเลือกตำแหน่งมืดที่อยู่ติดกับแถบกลางจริงหรือไม่ และอ่านสเกลละเอียดเพียงใด การลากวัดเองไม่ดูดเข้าขอบแถบ ส่วนปุ่มวัดพอดีวางตามแบบจำลอง','If values differ, check that you selected the immediate minima bounding the central fringe and read the scale carefully. Manual dragging does not snap to fringes; Exact measure places markers using the model.')}</p>`;
    if(state.records.length){
      const list=document.createElement('ul');for(const r of state.records){const li=document.createElement('li');li.textContent=T('ครั้งที่ ','Trial ')+r.id+`: ${T('วัดได้','measured')} ${F(M.measurement(r.cursors))} mm · ${T('ทฤษฎี','theory')} ≈ ${F(M.theory(r.config).spacing,3)} mm`;list.append(li);}$('analysis-body').append(list);
    }
    if(!latest){$('exercise-body').textContent=T('บันทึกอย่างน้อย 1 ครั้ง เพื่อใช้ค่าที่วัดเองในโจทย์','Record at least one measurement to use your own data in these problems.');$('solution').hidden=true;$('solution-body').replaceChildren();return;}
    $('solution').hidden=false;const r=latest,measured=Number(F(M.measurement(r.cursors))),lambda=M.inferLambda(r.config,measured);
    $('exercise-body').innerHTML=`<p><strong>${T('ข้อ 1 · หาความยาวคลื่น','1 · Find the wavelength')}</strong></p><p>${T(`ใช้บันทึกครั้งที่ ${r.id}: d = ${r.config.slit} μm, L = ${F(r.config.distance,1)} m และความกว้างที่วัดได้ ${F(measured)} mm จงประมาณ λ ในหน่วย nm`,`Use trial ${r.id}: d = ${r.config.slit} μm, L = ${F(r.config.distance,1)} m, measured width ${F(measured)} mm. Estimate λ in nm.`)}</p><p><strong>${T('ข้อ 2 · อธิบายผลของระยะฉาก','2 · Explain screen-distance changes')}</strong></p><p>${T('ถ้าเพิ่มระยะฉากเป็น 2 เท่า โดยใช้เลเซอร์และสลิตเดิม ระยะแถบตามสูตรมุมเล็กเปลี่ยนกี่เท่า?','If screen distance doubles while laser and slits stay the same, by what factor does the small-angle fringe spacing change?')}</p>`;
    $('solution-body').innerHTML=`<p class="equation">λ ≈ dΔx/L<br>≈ (${r.config.slit} × 10⁻⁶) × (${F(measured,4)} × 10⁻³)/${F(r.config.distance,1)}<br>≈ ${F(lambda,1)} nm</p><p>${T(`ค่าที่ตั้งให้เลเซอร์คือ ${M.wavelengths[r.config.color]} nm ความต่างจากค่าคำนวณสะท้อนการเลือกขอบแถบและการอ่านสเกล`,`The configured laser wavelength is ${M.wavelengths[r.config.color]} nm. Differences reflect boundary selection and scale reading.`)}</p><p class="equation">Δx₂/Δx₁ ≈ L₂/L₁ = 2</p><p>${T('ระยะแถบเพิ่มเป็น 2 เท่าเมื่อ λ และ d คงเดิม','Spacing doubles when λ and d remain fixed.')}</p>`;
  }
  function render(paint=false){
    $('color').value=state.config.color;$('slit').value=state.config.slit;$('distance').value=state.config.distance;$('distance-value').textContent=F(state.config.distance,1)+' m';$('distance-number').value=state.config.distance;$('zoom').value=state.zoom;
    const name=state.lightPhase===0?M.preset(state.config):null;$('preset-name').textContent=name?T('ชุด ','Set ')+name:T('กำหนดเอง','Custom settings');
    document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===name)));
    for(const key of ['formula','analysis','exercise','solution'])$(key).open=state[key];
    $('light-view').hidden=state.reportOpen||state.view!=='light';$('water-view').hidden=state.reportOpen||state.view!=='water';$('light-phase').value=state.lightPhase;
    $('light-phase-note').textContent=state.lightPhase===180?T('เพิ่มตัวเลื่อนเฟส π ที่ช่องหนึ่ง: แนวกลางเป็นมืด ให้วัดแถบสว่างข้างกลางหนึ่งแถบ','Added π phase shifter at one slit: the centre is dark. Measure one adjacent bright fringe.'):T('เฟสตรงกัน: แนวกลางเป็นแถบสว่าง ชุด A/B/C ใช้กรณีนี้','In phase: the centre is bright. A/B/C use this case.');
    $('measurement-help').textContent=state.lightPhase===180?T('แนวกลางมืด เลือกแถบสว่างข้างกลางหนึ่งแถบ แล้ววาง L/R ที่มืดสองข้างของแถบนั้น','The centre is dark. Select one adjacent bright fringe and place L/R at its bounding minima.'):$('measurement-help').dataset[lang];
    if(paint&&state.view==='light')P.draw(state.config,state.zoom,lang,state.lightPhase);renderMeasurement();renderRecords();study();window.GuidedInterference?.render();
  }
  function language(next){capturePanels();lang=next==='en'?'en':'th';document.documentElement.lang=lang;document.querySelectorAll('[data-th][data-en]').forEach(n=>n.textContent=n.dataset[lang]);$('language').textContent=lang==='th'?'English':'ภาษาไทย';render(true);storageLabel();}
  $('language').onclick=()=>language(lang==='th'?'en':'th');
  document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>configChange(M.presets[b.dataset.preset],true));
  $('light-phase').onchange=()=>{capturePanels();state.lightPhase=Number($('light-phase').value);resetMarkers();window.GuidedInterference?.event('phase');render(true);publish();};
  $('color').onchange=()=>configChange({...state.config,color:$('color').value});$('slit').onchange=()=>configChange({...state.config,slit:Number($('slit').value)});$('distance').oninput=()=>configChange({...state.config,distance:Number($('distance').value)});
  $('zoom').onchange=()=>{const zoom=Number($('zoom').value);if(![1,2,4].includes(zoom))return;capturePanels();state.zoom=zoom;render(true);publish();};
  $('exact-measurement').onclick=()=>{capturePanels();state.cursors=M.exactBounds(state.config,state.lightPhase);state.moved={left:true,right:true};state.autoMeasured=true;state.analysis=false;notice='';const max=Math.max(Math.abs(state.cursors.left),Math.abs(state.cursors.right));while(state.zoom>1&&max>40/state.zoom)state.zoom/=2;window.GuidedInterference?.event('measure');render(true);publish();};
  $('reset-measurement').onclick=()=>{capturePanels();resetMarkers();render(false);publish();};
  document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>move(b.dataset.side,state.cursors[b.dataset.side]+Number(b.dataset.delta)));
  $('record').onclick=()=>{
    if(!M.canRecord(state))return;capturePanels();const id=Math.max(0,...state.records.map(r=>r.id))+1;
    state.records.push({id,config:{...state.config},cursors:{...state.cursors},phase:state.lightPhase,source:state.autoMeasured?'model':'manual'});state.moved={left:false,right:false};state.solution=false;notice='saved';window.GuidedInterference?.event('record');render(false);publish();
  };
  function localX(event){const m=$('overlay').getScreenCTM();return m?new DOMPoint(event.clientX,event.clientY).matrixTransform(m.inverse()).x:null;}
  for(const side of ['left','right']){
    const handle=$('handle-'+side);
    handle.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;const x=localX(event);if(x===null)return;event.preventDefault();handle.focus();handle.setPointerCapture(event.pointerId);drag={side,id:event.pointerId,x,start:Math.max(-40/state.zoom,Math.min(40/state.zoom,state.cursors[side]))};});
    handle.addEventListener('pointermove',event=>{if(!drag||drag.side!==side||drag.id!==event.pointerId)return;const x=localX(event);if(x!==null)move(side,drag.start+(x-drag.x)/(9*state.zoom));});
    for(const eventName of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(eventName,event=>{if(drag?.id===event.pointerId)drag=null;});
    handle.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();move(side,state.cursors[side]+(event.key==='ArrowRight'?1:-1)*(event.shiftKey ? 0.01 : 0.1));});
  }
  for(const key of ['formula','analysis','exercise','solution'])$(key).addEventListener('toggle',()=>{state[key]=$(key).open;publish();});
  function restoreState(snapshot){
    if(!M.validSnapshot(snapshot,identity))return false;
    const incoming=structuredClone(snapshot);
    if(incoming.version>=2&&(!['water','light'].includes(incoming.view)||!InterferenceWater.valid(incoming.water)))return false;
    const missions=incoming.version===3?incoming.missions:incoming.version===2?InterferenceMissions.migrate(incoming.missions):{...InterferenceMissions.initial(),enabled:false};
    if(!InterferenceMissions.valid(missions))return false;
    const student=incoming.version===3?incoming.student:{name:'',className:'',date:today()};
    if(!student||typeof student.name!=='string'||student.name.length>100||typeof student.className!=='string'||student.className.length>60||typeof student.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(student.date))return false;
    if(incoming.version===3&&(!['expanded','mini','hidden'].includes(incoming.guideMode)||typeof incoming.reportOpen!=='boolean'))return false;
    state={config:incoming.config,zoom:incoming.zoom,cursors:incoming.cursors,moved:incoming.moved,records:incoming.records,formula:incoming.formula,analysis:incoming.analysis,exercise:incoming.exercise,solution:incoming.solution,view:incoming.version>=2?incoming.view:'light',lightPhase:incoming.lightPhase||0,autoMeasured:incoming.autoMeasured||false,water:incoming.version>=2?incoming.water:InterferenceWater.initial(),missions,student,guideMode:incoming.guideMode||'expanded',reportOpen:incoming.reportOpen||false};
    state.water.running=false;
    state.records=state.records.map(r=>({...r,phase:r.phase||0}));
    $('mission-answer').open=state.missions.answerOpen;
    drag=null;notice='';render(true);publish();return true;
  }
  function storageLabel(status=localStatus){
    localStatus=status;
    $('lab-load-status').textContent=status==='loading'?T('กำลังกู้คืนงานในเครื่อง…','Restoring work on this device…'):status==='indexed'?T('บันทึกในเครื่องแล้ว · ใช้เครื่องและบัญชีเดิมเพื่อทำต่อ','Saved on this device · Resume with the same device and account'):status==='local'?T('เก็บสำเนาในเครื่องแล้ว','Local backup saved'):status==='invalid'?T('อ่านงานเดิมไม่ได้ เก็บข้อมูลเดิมไว้แล้ว เริ่มทำงานรอบนี้ได้','Previous work could not be read and was left intact. You can start this session.'):T('บันทึกถาวรไม่ได้ งานยังอยู่ในหน้าต่างนี้ อย่าปิดก่อนพิมพ์รายงาน','Persistent storage is unavailable. Keep this window open until you print the report.');
  }
  async function startLocal(){
    localStarted=true;localReady=false;const epoch=++identityEpoch;
    document.querySelector('main').inert=true;storageLabel('loading');
    localSession=DoubleSlitLabStorage.session(identity,status=>{if(epoch===identityEpoch)storageLabel(status);});
    let candidates=[];
    try{candidates=await localSession.load();}catch{/* Still allow the activity when storage is unavailable. */}
    if(epoch!==identityEpoch)return;
    let restored=false;for(const candidate of candidates){try{if(restoreState(candidate)){restored=true;break;}}catch{/* Invalid old snapshots never partially replace current work. */}}
    localReady=true;document.querySelector('main').inert=false;
    storageLabel(candidates.length&&!restored?'invalid':'local');
    render(true);
  }
  const flushLocal=()=>{if(localReady){localSession?.save(getState());return localSession?.flush();}};
  window.LearningHubSimulation={getState,restoreState,flushLocal,subscribe:fn=>{subscriber=typeof fn==='function'?fn:null;return()=>{subscriber=null;};}};
  addEventListener('pagehide',flushLocal);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)flushLocal();});
  window.addEventListener('message',event=>{
    if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='learning-hub-context')return;
    const next=event.data.identity?.uid||'guest';if(next!==identity){flushLocal();localReady=false;identity=next;state=initial();drag=null;notice='';for(const key of ['formula','analysis','exercise','solution'])$(key).open=false;localStarted=false;}language(event.data.language||lang);if(!localStarted)void startLocal();
  });
  window.DoubleSlitLabBridge={read:()=>state,language:()=>lang,notify:publish,change:(fn,paint=false)=>{capturePanels();fn(state);render(paint);publish();}};
  $('distance-number').onchange=()=>{const n=$('distance-number');if(!n.checkValidity()){n.reportValidity();return;}configChange({...state.config,distance:Number(n.value)});};
  $('distance-number').onkeydown=e=>{if(e.key==='Enter')e.currentTarget.blur();};
  language('th');new ResizeObserver(()=>{if(state.view==='light'){P.draw(state.config,state.zoom,lang,state.lightPhase);renderMeasurement();}}).observe($('stage'));
  if(parent===window)setTimeout(startLocal,0);
  if(parent!==window)parent.postMessage({type:'learning-hub-tool-ready'},location.origin);
})();
