(() => {
  'use strict';
  const M=globalThis.DoubleSlitLabModel,P=globalThis.DoubleSlitLabPlot,A=globalThis.DoubleSlitLightActivity,$=id=>document.getElementById(id),F=(n,d=2)=>Number(n).toFixed(d);
  let lang='th',identity='guest',subscriber=null,drag=null,notice='';
  let localSession=null,localReady=false,localStarted=false,identityEpoch=0,localStatus='loading';
  let guideAfterLesson=false, guideTarget=null, guideTimer, resetDone=false;
  const initial=()=>({
    config:{...M.presets.A},zoom:1,cursors:{left:-8,right:8},moved:{left:false,right:false},records:[],
    formula:false,analysis:false,exercise:false,solution:false,lightPhase:0,autoMeasured:false,
    checkout:{},checkoutOpen:false,nextRecordId:1,
  });
  let state=initial();
  let previousSnapshot={};
  const T=(th,en)=>lang==='th'?th:en;
  const publish=()=>{subscriber?.();if(localReady)localSession?.save(getState());};
  function getState(){
    return {...structuredClone(previousSnapshot),version:3,identity,...structuredClone(state),view:'light'};
  }
  function resetMarkers(){
    state.cursors={left:-8,right:8};
    state.moved={left:false,right:false};
    notice='';
  }
  function configChange(config){
    if(!M.validConfig(config))return;
    state.config={...config};
    resetMarkers();
    render(true);
    publish();
  }
  function move(side,value){
    if(!Number.isFinite(value))return;
    state.cursors[side]=Math.max(-40,Math.min(40,value));
    state.moved[side]=true;
    notice='';
    renderMeasurement();
    if(!$('light-guide-panel').hidden)renderGuide();
    publish();
  }
  function renderMeasurement(){
    P.cursors(state,lang);
    const width=M.measurement(state.cursors);
    const aroundCentre=A.surroundsCentre(state.cursors);
    $('reading-left').textContent=F(state.cursors.left)+' mm';
    $('reading-right').textContent=F(state.cursors.right)+' mm';
    $('reading-width').textContent=width>0?F(width)+' mm':'—';
    $('record').disabled=!aroundCentre||!M.canRecord(state);
    $('record-help').textContent=notice?T('บันทึกแล้ว เลือกชุดถัดไปหรือวัดใหม่ได้','Recorded. Choose another set or measure again.'):state.records.length>=30?T('ครบ 30 บันทึกแล้ว ลบรายการที่ไม่ใช้ก่อนเพิ่ม','30 records reached. Delete an unused record to add another.'):!aroundCentre?T('วาง L และ R คนละด้านของเส้นกลางที่ 0 mm','Place L and R on opposite sides of 0 mm.'):!state.moved.left||!state.moved.right?T('ขยับเส้นวัดทั้งสองไปที่ขอบมืดของแถบกลางแล้วกดบันทึก','Move both markers to the central fringe’s dark boundaries, then record.'):T('ตรวจว่าเส้นทั้งสองอยู่ที่ขอบมืดติดกับแถบกลางแล้วกดบันทึก','Check that both markers are on the dark boundaries nearest the centre, then record.');
  }
  function renderRecords(){
    $('empty-records').hidden=state.records.length>0;$('record-table-wrap').hidden=!state.records.length;$('record-count').textContent=T('บันทึกแล้ว ','Recorded ')+state.records.length;
    $('records-body').replaceChildren();
    for(const r of state.records){
      const row=document.createElement('tr');row.dataset.recordId=r.id;
      const cells=[`${r.id} · ${!r.phase&&A.trials[A.trialKey(r.config)]?.label||T('กำหนดเอง','Custom')}`,r.source==='model'?T('แบบจำลอง','Model'):T('ลากวัด','Manual'),(r.phase||0)+'°',M.wavelengths[r.config.color],r.config.slit,F(r.config.distance,1),F(r.cursors.left),F(r.cursors.right),F(M.measurement(r.cursors))];
      for(const value of cells){const td=document.createElement('td');td.textContent=value;row.append(td);}
      const td=document.createElement('td'),button=document.createElement('button');button.textContent=T('ลบ','Delete');button.setAttribute('aria-label',T('ลบบันทึกครั้งที่ ','Delete record ')+r.id);button.onclick=()=>{state.records=state.records.filter(x=>x.id!==r.id);notice='';render(false);publish();};td.append(button);row.append(td);$('records-body').append(row);
    }
  }
  function render(paint=false){
    $('color').value=state.config.color;
    $('slit').value=state.config.slit;
    $('distance').value=state.config.distance;
    $('distance-value').textContent=F(state.config.distance,1)+' m';
    $('distance-number').value=state.config.distance;
    $('zoom').value=state.zoom;
    const name=M.preset(state.config);
    $('preset-name').textContent=A.trials[A.trialKey(state.config)]?.label||T('กำหนดเอง','Custom settings');
    document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===name)));
    $('mission-answer').open=state.checkoutOpen;
    if(paint)P.draw(state.config,state.zoom,lang,0);
    renderMeasurement();
    renderRecords();
    renderActivity();
    if($('lab-report').open)renderReport();
  }
  function language(next){
    lang=next==='en'?'en':'th';
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-th][data-en]').forEach(n=>n.textContent=n.dataset[lang]);
    $('language').textContent=lang==='th'?'English':'ภาษาไทย';
    $('activity-reset-status').textContent=resetDone?T('เริ่มรอบใหม่ได้แล้ว ลองวัดชุด A','New round ready. Start with set A.'):'';
    render(true);
    storageLabel();
  }
  $('language').onclick=()=>language(lang==='th'?'en':'th');
  document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>configChange(M.presets[b.dataset.preset]));
  $('color').onchange=()=>configChange({...state.config,color:$('color').value});
  $('slit').onchange=()=>configChange({...state.config,slit:Number($('slit').value)});
  $('distance').oninput=()=>configChange({...state.config,distance:Number($('distance').value)});
  $('zoom').onchange=()=>{
    const zoom=Number($('zoom').value);
    if(![1,2,4].includes(zoom))return;
    state.zoom=zoom;
    render(true);
    publish();
  };
  $('reset-measurement').onclick=()=>{resetMarkers();render(false);publish();};
  document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>move(b.dataset.side,state.cursors[b.dataset.side]+Number(b.dataset.delta)));
  $('record').onclick=()=>{
    if(!A.surroundsCentre(state.cursors)||!M.canRecord(state))return;
    const id=state.nextRecordId++;
    state.records.push({id,config:{...state.config},cursors:{...state.cursors},phase:0,source:'manual'});
    state.moved={left:false,right:false};
    notice='saved';
    resetDone=false;
    $('activity-reset-status').textContent='';
    render(false);
    publish();
  };
  function localX(event){const m=$('overlay').getScreenCTM();return m?new DOMPoint(event.clientX,event.clientY).matrixTransform(m.inverse()).x:null;}
  for(const side of ['left','right']){
    const handle=$('handle-'+side);
    handle.addEventListener('pointerdown',event=>{if(event.button!==0&&event.pointerType==='mouse')return;const x=localX(event);if(x===null)return;event.preventDefault();handle.focus();handle.setPointerCapture(event.pointerId);drag={side,id:event.pointerId,x,start:Math.max(-40/state.zoom,Math.min(40/state.zoom,state.cursors[side]))};});
    handle.addEventListener('pointermove',event=>{if(!drag||drag.side!==side||drag.id!==event.pointerId)return;const x=localX(event);if(x!==null)move(side,drag.start+(x-drag.x)/(9*state.zoom));});
    for(const eventName of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(eventName,event=>{if(drag?.id===event.pointerId)drag=null;});
    handle.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();move(side,state.cursors[side]+(event.key==='ArrowRight'?1:-1)*(event.shiftKey ? 0.01 : 0.1));});
  }
  function restoreState(snapshot){
    if(!M.validSnapshot(snapshot,identity))return false;
    const {version,identity:owner,config,zoom,cursors,moved,records,formula,analysis,exercise,solution,
      lightPhase,autoMeasured,checkout,checkoutOpen,nextRecordId,...legacy}=structuredClone(snapshot);
    previousSnapshot=legacy;
    const keepMarkers=!lightPhase&&!autoMeasured;
    state={...initial(),config,zoom,records,formula,analysis,exercise,solution,
      ...(keepMarkers?{cursors,moved}:{}),checkoutOpen:checkoutOpen===true};
    state.nextRecordId=Math.max(1,...records.map(record=>record.id+1),Number.isSafeInteger(nextRecordId)?nextRecordId:1);
    if(checkout&&typeof checkout==='object'){
      for(const {id} of A.comparisons){
        const answer=checkout[id];
        if(typeof answer?.key==='string'&&answer.key.length<200&&['wider','narrower','same'].includes(answer.value)){
          state.checkout[id]={key:answer.key,value:answer.value};
        }
      }
    }
    drag=null;
    notice='';
    render(true);
    publish();
    return true;
  }
  function renderActivity(){
    const readings=A.latestReadings(state.records);
    const trialItems=A.firstTrials.map(key=>{
      const {label}=A.trials[key];
      const item=document.createElement('li');
      const record=readings[key];
      item.textContent=label+' · '+(record?T('บันทึกแล้ว','Recorded'):T('รอวัด','To measure'));
      item.dataset.complete=String(!!record);
      return item;
    });
    $('trial-progress').replaceChildren(...trialItems);
    const returned=readings.C2;
    $('return-reading').textContent=returned
      ? T('C ที่ 2 m · บันทึกครั้งที่ ','C at 2 m · Trial ')+returned.id+' · '+A.width(returned)+' mm'
      : T('ยังไม่มีผลวัดชุด C ที่ 2 เมตร','No C measurement at 2 metres yet.');
    $('light-comparisons').replaceChildren(...A.comparisons.map(comparison=>renderComparison(comparison,readings)));
    if(!$('light-guide-panel').hidden)renderGuide(readings);
  }
  function renderComparison(comparison,readings){
    const section=document.createElement('section');
    section.className='light-comparison';
    const label=document.createElement('label');
    label.htmlFor='trend-'+comparison.id;
    label.textContent=comparison[lang];
    section.append(label);
    const list=document.createElement('ul');
    list.id='trials-'+comparison.id;
    for(const key of comparison.pair){
      const record=readings[key];
      const item=document.createElement('li');
      item.textContent=A.trials[key].label+' · '+(record
        ? T('ครั้งที่ ','Trial ')+record.id+' · '+A.width(record)+' mm'
        : T('รอวัดและบันทึก','Measure and record'));
      list.append(item);
    }
    section.append(list);
    const evidence=A.evidence(comparison,readings);
    const select=document.createElement('select');
    select.id=label.htmlFor;
    select.setAttribute('aria-describedby',list.id);
    select.disabled=!evidence;
    const choices=[
      ['',T('เลือกจากผลที่วัดได้','Choose from your readings')],
      ['wider',T('กว้างขึ้น','Wider')],
      ['narrower',T('แคบลง','Narrower')],
      ['same',T('กว้างเท่าเดิม','Same width')],
    ];
    for(const [value,text] of choices){
      const option=document.createElement('option');
      option.value=value;
      option.textContent=text;
      select.append(option);
    }
    const feedback=document.createElement('p');
    feedback.className='small';
    feedback.setAttribute('role','status');
    const saved=state.checkout[comparison.id];
    const answer=evidence&&saved?.key===evidence.key?saved.value:'';
    select.value=answer;
    function showFeedback(value){
      feedback.textContent=value?(value===evidence.trend
        ? T('ตรงกับค่าทั้งสองที่บันทึกไว้','Matches the two recorded readings.')
        : T('ลองอ่านค่าทั้งสองอีกครั้ง เริ่มจากค่าบรรทัดแรก','Look at both readings again, starting with the first row.')):'';
    }
    showFeedback(answer);
    select.onchange=()=>{
      if(!evidence)return;
      state.checkout[comparison.id]={key:evidence.key,value:select.value};
      showFeedback(select.value);
      if(!$('light-guide-panel').hidden)renderGuide();
      publish();
    };
    section.append(select,feedback);
    return section;
  }
  function renderReport(){
    const table=$('record-table-wrap').querySelector('table').cloneNode(true);
    table.querySelectorAll('tr').forEach(row=>row.lastElementChild.remove());
    const student=previousSnapshot.student;
    $('report-student').textContent=[student?.name,student?.className].filter(value=>typeof value==='string'&&value).join(' · ');
    $('report-records').replaceChildren(state.records.length?table:document.createTextNode(T('ยังไม่มีบันทึก','No records yet.')));
  }
  $('mission-answer').addEventListener('toggle',()=>{
    if(state.checkoutOpen===$('mission-answer').open)return;
    state.checkoutOpen=$('mission-answer').open;
    publish();
  });
  $('light-answer').onclick=()=>{
    state.checkoutOpen=true;
    $('mission-answer').open=true;
    $('checkout-heading').focus();
    $('mission-answer').scrollIntoView({block:'start'});
    publish();
  };
  function renderGuide(readings=A.latestReadings(state.records)){
    const step=A.guideStep(state,readings,guideAfterLesson);
    const count=A.firstTrials.filter(key=>readings[key]).length;
    $('light-guide-progress').textContent=T(`บันทึกก่อนเรียน ${count}/4 ครั้ง`,`Before-lesson records: ${count}/4`);
    $('light-guide-step').textContent=[step.label,step[lang]].filter(Boolean).join(' · ');
    $('light-guide-cue').textContent=step.target==='record'
      ? T('อ่านความกว้างเป็น mm แล้วใช้ผลที่บันทึกไว้','Read the width in mm and use the saved reading.')
      : '';
    $('light-guide-go').textContent=step.target.startsWith('trend-')
      ? T('ไปยัง Check-out','Go to the check-out')
      : step.target==='return-heading'
        ? T('ดูขั้นหลังเรียน','Show the after-lesson step')
        : step.target==='records-heading'
          ? T('ดูบันทึกผล','Show measurement records')
          : T('พาไปยังเครื่องมือ','Show the control');
  }
  function setGuideOpen(open){
    $('light-guide-panel').hidden=!open;
    $('light-guide-toggle').hidden=open;
    $('light-guide-toggle').setAttribute('aria-expanded',String(open));
    if(open)renderGuide();
  }
  function clearGuideHighlight(){
    clearTimeout(guideTimer);
    guideTarget?.classList.remove('light-guide-target');
    guideTarget=null;
  }
  $('light-guide-toggle').onclick=()=>{
    setGuideOpen(true);
    $('light-guide-go').focus();
  };
  $('light-guide-close').onclick=()=>{
    setGuideOpen(false);
    $('light-guide-toggle').focus();
  };
  $('light-guide-go').onclick=()=>{
    const step=A.guideStep(state,A.latestReadings(state.records),guideAfterLesson);
    if(step.target.startsWith('trend-')){
      state.checkoutOpen=true;
      $('mission-answer').open=true;
      publish();
    }
    setGuideOpen(false);
    clearGuideHighlight();
    guideTarget=$(step.target);
    guideTarget.classList.add('light-guide-target');
    guideTarget.scrollIntoView({block:'center',inline:'nearest'});
    guideTarget.focus({preventScroll:true});
    guideTimer=setTimeout(clearGuideHighlight,2400);
  };
  $('guide-after-lesson').onclick=()=>{
    guideAfterLesson=true;
    setGuideOpen(true);
    $('light-guide-go').focus();
  };
  $('activity-reset').onclick=()=>{
    if(localReady)$('activity-reset-dialog').showModal();
  };
  $('activity-reset-cancel').onclick=()=>$('activity-reset-dialog').close();
  $('activity-reset-confirm').onclick=()=>{
    if(!localReady||!$('activity-reset-dialog').open)return;
    $('activity-reset-dialog').close();
    state=initial();
    previousSnapshot={};
    drag=null;
    notice='';
    guideAfterLesson=false;
    resetDone=true;
    clearGuideHighlight();
    setGuideOpen(false);
    $('activity-reset-status').textContent=T('เริ่มรอบใหม่ได้แล้ว ลองวัดชุด A','New round ready. Start with set A.');
    render(true);
    publish();
    void localSession.flush();
    $('preset-A').focus();
  };
  $('report-open').onclick=()=>{renderReport();$('lab-report').showModal();};
  $('report-return').onclick=()=>$('lab-report').close();
  $('report-print').onclick=()=>window.print();

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
    const next=event.data.identity?.uid||'guest';if(next!==identity){flushLocal();localReady=false;identity=next;state=initial();previousSnapshot={};drag=null;notice='';guideAfterLesson=false;resetDone=false;clearGuideHighlight();setGuideOpen(false);$('activity-reset-dialog').close();$('lab-report').close();localStarted=false;}language(event.data.language||lang);if(!localStarted)void startLocal();
  });
  $('distance-number').onchange=()=>{const n=$('distance-number');if(!n.checkValidity()){n.reportValidity();return;}configChange({...state.config,distance:Number(n.value)});};
  $('distance-number').onkeydown=e=>{if(e.key==='Enter')e.currentTarget.blur();};
  language('th');new ResizeObserver(()=>{P.draw(state.config,state.zoom,lang,0);renderMeasurement();}).observe($('stage'));
  if(parent===window)setTimeout(startLocal,0);
  if(parent!==window)parent.postMessage({type:'learning-hub-tool-ready'},location.origin);
})();
