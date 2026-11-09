import { doubleSlitPlayGuide } from './guide-data.js?v=checkout-20261109';

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
    if(s().view==='water')V.draw($('water-canvas'),p,time);const screenGraph=InterferenceScreen.draw($('water-screen-diagram'),{lambda:p.wavelength,d:p.separation,L:p.L,phase:p.phase,position:p.x,extent:32,unit:'cm'},B.language());$('water-screen-caption').textContent=T('เส้นแดงแสดงความเข้มเฉลี่ยจากคลื่นสองแหล่งเดียวกับภาพด้านบน ช่วง y ±32 cm · P และค่าตัวแปรเปลี่ยนตามกัน · เรขาคณิตไม่ตามสเกล · I₀: ความเข้มกลางเมื่อเฟส 0°','Red: mean intensity from the same two sources above, over y ±32 cm. P and variables stay linked. Geometry is schematic; I₀ is the in-phase axial intensity.')+(p.phase===0?' · '+screenGraph.orders.filter(q=>q.m===1||q.m===2).map(q=>`m=${q.m}: y=${F(q.y,3)} cm, θ=${F(q.theta,2)}°`).join(' · '):'');
  }
  function renderObjectives(id) {
    const list = $('mission-objectives-list');
    const key = `${id}:${B.language()}`;
    if (list.dataset.missionLanguage === key) return;
    list.dataset.missionLanguage = key;
    list.replaceChildren();
    for (const objective of doubleSlitPlayGuide.sections[id].objectives) {
      const item = document.createElement('li');
      item.textContent = T(objective.th, objective.en);
      list.append(item);
    }
  }

  function comparisonWater(far) {
    const water = W.initial();
    water.L = far ? 60 : 6;
    water.x = 6;
    Object.assign(water.layers, { paths: true, variables: true, formulas: true });
    return water;
  }

  function renderComparison(id) {
    const state = s();
    const panel = $('checkout-comparison');
    const cases = $('checkout-comparison-cases');
    cases.replaceChildren();
    const addCase = (label, readings) => {
      const article = document.createElement('article');
      const heading = document.createElement('h3');
      heading.textContent = label;
      const list = document.createElement('dl');
      for (const [name, value] of readings) {
        const term = document.createElement('dt');
        const amount = document.createElement('dd');
        term.textContent = name;
        amount.textContent = value;
        list.append(term, amount);
      }
      article.append(heading, list);
      cases.append(article);
    };
    if (id === 3) {
      $('checkout-comparison-title').textContent = T('ค่าที่ได้จากสองกรณี', 'Values from the two cases');
      for (const far of [false, true]) {
        if (!state.missions[far ? 'far' : 'near']) continue;
        const water = comparisonWater(far);
        const geometry = W.geometry(water);
        addCase(far ? T('ไกล / มุมเล็ก', 'Far / small angle') : T('ใกล้ / มุมมาก', 'Near / large angle'), [
          ['L/d', F(water.L / water.separation, 2)],
          [T('มุม θ', 'Angle θ'), `${F(geometry.theta, 2)}°`],
          [T('ผลต่างทางเดินจริง', 'Exact path difference'), `${F(geometry.delta)} cm`],
          ['d|sin θ|', `${F(geometry.angular)} cm`],
          ['d|x|/L', `${F(geometry.small)} cm`],
        ]);
      }
    }
    if (id === 4) {
      $('checkout-comparison-title').textContent = T('บันทึกล่าสุดของแต่ละชุดที่เฟส 0°', 'Latest in-phase record for each set');
      for (const key of ['A', 'B', 'C']) {
        const trial = Q.trialForPreset(state.records, key);
        if (!trial) continue;
        addCase(T(`ชุด ${key} · บันทึก ${trial.id}`, `Set ${key} · Trial ${trial.id}`), [
          [T('ระยะห่างสลิต d', 'Slit separation d'), `${trial.config.slit} μm`],
          [T('ความยาวคลื่น λ', 'Wavelength λ'), `${M.wavelengths[trial.config.color]} nm`],
          [T('ระยะฉาก L', 'Screen distance L'), `${F(trial.config.distance, 1)} m`],
          [T('ระยะห่างแถบที่วัดได้', 'Measured fringe spacing'), `${F(M.measurement(trial.cursors), 2)} mm`],
        ]);
      }
    }
    panel.hidden = cases.childElementCount === 0;
  }

  function renderQuestion(question, index, mission) {
    const field = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = `${index + 1}. ${T(...question.text)}`;
    field.append(legend);
    const label = document.createElement('label');
    const answers = mission.answers[mission.current];
    const key = `q${index}`;
    let input;
    if (question.type === 'choice') {
      input = document.createElement('select');
      input.id = `checkout-choice-${index}`;
      label.textContent = T('เลือกคำตอบ', 'Choose an answer');
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = T('แตะเพื่อเลือก', 'Select an option');
      input.append(placeholder);
      for (const [value, th, en] of question.options) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = T(th, en);
        input.append(option);
      }
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.maxLength = 80;
      input.id = `mission-number-${index}`;
      label.textContent = T(`คำตอบเป็นตัวเลข (${question.unit})`, `Numerical answer (${question.unit})`);
    }
    label.htmlFor = input.id;
    input.value = answers[key] || '';
    input.addEventListener(question.type === 'choice' ? 'change' : 'input', () => {
      answers[key] = input.value;
      event();
      $('mission-feedback').replaceChildren();
      B.notify();
    });
    const hint = document.createElement('details');
    const summary = document.createElement('summary');
    const guidance = document.createElement('p');
    summary.textContent = T('แนวทางทบทวน', 'Review hint');
    guidance.textContent = T(...question.hint);
    hint.append(summary, guidance);
    field.append(label, input, hint);
    return field;
  }

  function updateCheckoutVisibility() {
    const mission = s().missions;
    document.body.classList.toggle('is-checkout-open', mission.enabled && mission.answerOpen);
    $('water-answer').hidden = !mission.enabled;
    $('light-answer').hidden = !mission.enabled;
  }

  function renderMission() {
    const state = s(), mission = state.missions, id = mission.current;
    const requirements = Q.requirements(state);
    const ready = requirements.every(([done]) => done);
    $('mission-card').hidden = !mission.enabled;
    $('guided-toggle').textContent = mission.enabled ? T('สำรวจเอง', 'Explore freely') : T('กลับสู่ภารกิจ', 'Return to missions');
    $('mission-select').replaceChildren();
    Q.titles.forEach((title, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = (mission.completed.includes(index) ? '✓ ' : '') + T(...title);
      $('mission-select').append(option);
    });
    $('mission-select').value = id;
    $('mission-progress').textContent = `${mission.completed.length}/6 ${T('ผ่าน Check-out', 'check-outs passed')}`;
    renderObjectives(id);
    $('mission-instruction').textContent = T(...Q.instructions[id]);
    $('mission-steps').replaceChildren();
    for (const [done, words] of requirements) {
      const item = document.createElement('li');
      item.classList.toggle('done', done);
      item.textContent = (done ? '✓ ' : '○ ') + T(...words);
      $('mission-steps').append(item);
    }
    $('mission-next-action').textContent = ready ? T('ไปทำ Check-out', 'Open check-out') : T('ไปขั้นทดลองถัดไป', 'Go to next experiment step');
    $('mission-near').hidden = id !== 3;
    $('mission-far').hidden = id !== 3;
    $('mission-answer').open = mission.answerOpen;
    renderComparison(id);
    const questions = Q.questions(id, state);
    $('mission-questions').replaceChildren(...questions.map((question, index) => renderQuestion(question, index, mission)));
    $('mission-check').disabled = !ready;
    $('mission-lock-note').textContent = ready
      ? T('ทดลองครบแล้ว ตอบให้ครบแล้วกดตรวจ', 'Experiment steps complete. Answer each question, then check.')
      : T('ทำรายการที่มีวงกลม ○ ให้ครบก่อนตรวจ ใช้ปุ่มไปขั้นทดลองถัดไปด้านบนเพื่อหาเครื่องมือ', 'Complete the open-circle steps before checking. Use the next-step button above to find the control.');
    const feedback = $('mission-feedback');
    feedback.replaceChildren();
    if (message) {
      const note = document.createElement('p');
      note.textContent = T(...message);
      feedback.append(note);
    }
    if (mission.attempted[id]) {
      const results = Q.grade(state), passed = results.every(Boolean);
      const heading = document.createElement('p');
      heading.className = passed ? 'correct' : 'retry';
      heading.textContent = passed
        ? T('ผ่านภารกิจนี้แล้ว ไปภารกิจถัดไปได้', 'Mission completed. Continue to the next mission.')
        : T('ยังมีข้อให้ลองใหม่ ทบทวนข้อมูลแล้วตรวจอีกครั้งได้', 'Some answers need another try. Review the data and check again.');
      const statuses = document.createElement('ol');
      for (const correct of results) {
        const item = document.createElement('li');
        item.textContent = correct ? T('ถูก', 'Correct') : T('ลองใหม่', 'Try again');
        statuses.append(item);
      }
      feedback.append(heading, statuses);
    }
    $('mission-next').disabled = !mission.completed.includes(id);
    $('mission-next').textContent = id === 5 ? T('ทบทวนภารกิจแรก', 'Revisit mission 1') : T('ภารกิจถัดไป', 'Next mission');
    updateCheckoutVisibility();
  }

  function render() {
    document.querySelectorAll('.view-tabs button[id^="view-"]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.id === 'view-' + s().view));
    });
    renderWater();
    renderMission();
  }

  function focusControl(control) {
    control.scrollIntoView({ block: 'center' });
    control.focus({ preventScroll: true });
  }

  function openCheckout() {
    s().missions.answerOpen = true;
    renderMission();
    focusControl($('mission-answer').querySelector('summary'));
    B.notify();
  }

  function returnToExperiment(targetId) {
    const view = s().missions.current < 4 ? 'water' : 'light';
    B.change(state => {
      state.missions.answerOpen = false;
      if (state.view !== view) state.water.running = false;
      state.view = view;
    }, true);
    focusControl($(targetId || (view === 'water' ? 'water-play' : 'exact-measurement')));
  }

  function nextExperimentStep() {
    const state = s(), id = state.missions.current;
    const next = Q.requirements(state).findIndex(([done]) => !done);
    if (next === -1) return openCheckout();
    if (id === 0) return returnToExperiment(next === 0 ? 'water-play' : state.water.phase !== 0 ? 'water-phase' : 'water-center');
    if (id === 1) return returnToExperiment(['water-phase', 'layer-nodes', 'water-center', 'water-play'][next]);
    if (id === 2) return returnToExperiment(next === 0 ? 'layer-paths' : $('water-example').disabled ? 'water-probe' : 'water-example');
    if (id === 3) return returnToExperiment(next === 0 ? 'mission-near' : 'mission-far');
    if (id === 4) {
      const expected = ['A', 'B', 'C'][next];
      if (M.preset(state.config) !== expected || state.lightPhase !== 0) return returnToExperiment(`preset-${expected}`);
    }
    returnToExperiment(state.moved.left && state.moved.right ? 'record' : 'exact-measurement');
  }

  for (const view of ['water', 'light']) $('view-' + view).onclick = () => B.change(state => {
    state.view = view;
    state.water.running = false;
  }, true);
  $('guided-toggle').onclick = () => B.change(state => state.missions.enabled = !state.missions.enabled);
  $('mission-select').onchange = () => mission(Number($('mission-select').value));
  $('mission-reset').onclick = () => mission(s().missions.current, true);
  $('mission-next').onclick = () => {
    mission((s().missions.current + 1) % 6);
    $('mission-card').scrollIntoView({ block: 'start' });
  };
  $('mission-next-action').onclick = nextExperimentStep;
  $('checkout-return').onclick = () => returnToExperiment();
  $('mission-answer').addEventListener('toggle', () => {
    s().missions.answerOpen = $('mission-answer').open;
    updateCheckoutVisibility();
    B.notify();
  });
  $('mission-check').onclick = () => {
    const state = s(), mission = state.missions, id = mission.current;
    if (!Q.requirements(state).every(([done]) => done)) return;
    if (Q.questions(id, state).some((_, index) => !(mission.answers[id][`q${index}`] || '').trim())) {
      message = ['ตอบคำถามให้ครบก่อนตรวจ', 'Answer every question before checking.'];
    } else {
      message = null;
      mission.attempted[id] = true;
      if (Q.grade(state).every(Boolean) && !mission.completed.includes(id)) mission.completed.push(id);
    }
    renderMission();
    B.notify();
  };
  function comparison(far) {
    B.change(state => {
      state.view = 'water';
      state.water = comparisonWater(far);
      state.missions[far ? 'far' : 'near'] = true;
      state.missions.attempted[3] = false;
    }, true);
  }
  $('mission-near').onclick = () => comparison(false);
  $('mission-far').onclick = () => comparison(true);
  for(const key of ['wavelength','separation','L','x'])$('water-'+key).oninput=()=>waterChange(p=>p[key]=Number($('water-'+key).value));
  $('water-phase').onchange=()=>waterChange(p=>p.phase=Number($('water-phase').value));
  document.querySelectorAll('[data-layer]').forEach(n=>n.onchange=()=>waterChange(p=>p.layers[n.dataset.layer]=n.checked));
  $('water-play').onclick=()=>{const m=s().missions;waterChange(p=>p.running=!p.running);if(s().water.running)m.played[m.current]=true;renderMission();B.notify();};
  $('water-center').onclick=()=>waterChange(p=>p.x=0);$('water-example').onclick=()=>{const x=W.pointForDelta(s().water,s().water.wavelength/2);if(x!==null)waterChange(p=>p.x=x);};
  $('water-answer').onclick = openCheckout;
  $('light-answer').onclick = openCheckout;
  function local(event){const m=$('water-overlay').getScreenCTM();return m?new DOMPoint(event.clientX,event.clientY).matrixTransform(m.inverse()):null;}
  $('water-stage').addEventListener('click',event=>{if(event.target.closest('#water-probe'))return;const q=local(event);if(q)waterChange(p=>p.x=Math.max(-8,Math.min(8,W.fromScreen(q.x,q.y).x)));});
  const probe=$('water-probe');probe.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const q=local(e);if(!q)return;e.preventDefault();probe.focus();probe.setPointerCapture(e.pointerId);drag={id:e.pointerId,y:q.y,x:s().water.x};};
  probe.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;const q=local(e);if(q)waterChange(p=>p.x=Math.max(-8,Math.min(8,drag.x-(q.y-drag.y)/W.scale)));};
  for(const name of ['pointerup','pointercancel','lostpointercapture'])probe.addEventListener(name,()=>drag=null);
  probe.onkeydown=e=>{if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();waterChange(p=>p.x=Math.max(-8,Math.min(8,p.x+(e.key==='ArrowUp' ? .1 : -.1))));};
  globalThis.GuidedInterference={render,event};
  new ResizeObserver(()=>{if(s().view==='water')renderWater();}).observe($('water-stage'));
  document.addEventListener('visibilitychange',()=>last=null);
  function frame(now){const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;if(s().view==='water'&&s().water.running&&!document.hidden){time+=dt*.7;V.draw($('water-canvas'),s().water,time);}requestAnimationFrame(frame);}requestAnimationFrame(frame);render();
})();
