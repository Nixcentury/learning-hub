(() => {
  'use strict';
  const activity = 'physics-photoelectric-lab';
  const { initial, teaching, measure, signed, metals } = Photoelectric;
  const { pair, missions, targets, requirements, snapshot, grade } = PhotoelectricMissions;
  const $ = id => document.getElementById(id);
  let lang = 'th', identity = 'guest', state, recordNotice, answerNotice, inputNotice, saved, highlightTimer;
  const pendingInputs = new Set();
  const subscribers = new Set();
  const { connect, spectrum, overlays } = PhotoelectricTube;
  const tube = connect();
  const t = (th, en) => lang === 'th' ? th : en;
  const txt = value => value?.[lang] || '';
  const setText = (id, value) => { if ($(id).textContent !== value) $(id).textContent = value; };
  const questionAnswers = index => missions[index].questions.map(item => item.fields.map(() => ''));
  const blank = () => ({
    version: 1, identity, index: 0, explore: false, report: false, guide: 'open',
    setup: initial(), date: new Date().toISOString(), student: { name: '', className: '' },
    benchRows: [], work: missions.map((_, i) => ({
      rows: [], frozen: null, answers: questionAnswers(i), first: null, firstAnswers: null, latest: null, latestAnswers: null, mastery: null,
    })),
  });
  const key = () => `learning-hub:${activity}:v1:${identity}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const getState = () => clone(state);
  function flushLocal() {
    if (stoppingDemo) { renderSave(); return Promise.resolve(); }
    try {
      localStorage.setItem(key(), JSON.stringify(state));
      saved = true;
    } catch { saved = false; }
    renderSave();
    return Promise.resolve();
  }
  function renderSave() {
    setText('save-status', saved ? t('เก็บสำเนาในเครื่องแล้ว', 'Saved on this device')
      : t('ความคืบหน้าอยู่ในหน้าต่างนี้', 'Progress is held in this window'));
  }
  function changed() {
    void flushLocal();
    if (subscribers.size) {
      const value = getState();
      for (const subscriber of subscribers) subscriber(value);
    }
  }
  function validNumbers(setup) {
    return Number.isFinite(setup.frequency) && setup.frequency >= 4 && setup.frequency <= 10 &&
      Number.isInteger(setup.intensity) && setup.intensity >= 0 && setup.intensity <= 100 &&
      Number.isFinite(setup.voltage) && setup.voltage >= -1 && setup.voltage <= 1;
  }
  function validSetup(setup) {
    return setup && validNumbers(setup) && typeof setup.light === 'boolean' && Object.hasOwn(metals, setup.metal);
  }
  function validAnswerSets(value, index) {
    const questions = missions[index].questions;
    return Array.isArray(value) && value.length === questions.length && value.every((row, i) =>
      Array.isArray(row) && row.length === questions[i].fields.length && row.every(field => typeof field === 'string' && field.length <= 50));
  }
  function validRows(rows, index) {
    return Array.isArray(rows) && rows.length <= targets[index].length && rows.every((row, i) => {
      if (!validSetup(row) || !requirements(index, rows.slice(0, i), row).ready) return false;
      const actual = snapshot(row);
      return row.current === actual.current && row.energy === actual.energy;
    });
  }
  function validWork(work, index) {
    if (!work || !validRows(work.rows, index) || !validAnswerSets(work.answers, index)) return false;
    const validResult = result => result === null || (Array.isArray(result) &&
      result.length === missions[index].questions.length && result.every(x => typeof x === 'boolean'));
    if (![work.first, work.latest, work.mastery].every(validResult)) return false;
    if ([work.first, work.latest, work.mastery].some(result => Boolean(result) !== Boolean(work.first))) return false;
    if (work.first ? !validAnswerSets(work.firstAnswers, index) || !validAnswerSets(work.latestAnswers, index)
      : work.firstAnswers !== null || work.latestAnswers !== null) return false;
    if (work.frozen === null) return work.first === null;
    if (!validRows(work.frozen, index) || work.frozen.length !== targets[index].length || work.rows.length !== work.frozen.length) return false;
    return !work.mastery || work.mastery.every((correct, i) => correct || !(work.first[i] || work.latest[i]));
  }
  function validState(value) {
    return value?.version === 1 && value.identity === identity && Number.isInteger(value.index) &&
      value.index >= 0 && value.index < missions.length && ['explore', 'report'].every(k => typeof value[k] === 'boolean') &&
      ['open', 'collapsed', 'hidden'].includes(value.guide) &&
      Number.isFinite(Date.parse(value.date)) &&
      typeof value.student?.name === 'string' && value.student.name.length <= 100 &&
      typeof value.student?.className === 'string' && value.student.className.length <= 50 &&
      validSetup(value.setup) && Array.isArray(value.setup.overlays) &&
      value.setup.overlays.every(item => overlays.includes(item)) &&
      Array.isArray(value.benchRows) && value.benchRows.length <= 20 && value.benchRows.every(row => {
        if (!validSetup(row)) return false;
        const actual = snapshot(row);
        return row.current === actual.current && row.energy === actual.energy;
      }) &&
      Array.isArray(value.work) && value.work.length === missions.length && value.work.every(validWork) &&
      (!value.index || value.work.slice(0, value.index).every(passed));
  }
  function readLocal() {
    try {
      const value = JSON.parse(localStorage.getItem(key()) || 'null');
      return validState(value) ? value : null;
    } catch { return null; }
  }
  function restoreState(value) {
    if (!validState(value)) return false;
    state = clone(value);
    recordNotice = answerNotice = inputNotice = null;
    pendingInputs.clear();
    questionKey = '';
    render();
    changed();
    return true;
  }
  window.LearningHubSimulation = {
    getState, restoreState, flushLocal, subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
  addEventListener('pagehide', flushLocal);
  document.addEventListener('visibilitychange', () => { if (document.hidden) void flushLocal(); });

  const query = new URLSearchParams(location.search);
  lang = query.get('lang') === 'en' ? 'en' : 'th';
  const stoppingDemo = query.get('demo') === 'stopping';
  state = (stoppingDemo ? null : readLocal()) || blank();
  if (stoppingDemo) {
    state.explore = true;
    state.report = false;
    state.setup = { ...initial(), light: true };
  }
  addEventListener('message', event => {
    if (stoppingDemo || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-context') return;
    const uid = event.data.identity?.uid;
    const next = typeof uid === 'string' && uid.length > 0 ? uid : 'guest';
    if (next !== identity) {
      void flushLocal();
      identity = next;
      state = readLocal() || blank();
      recordNotice = answerNotice = inputNotice = null;
      pendingInputs.clear();
      questionKey = '';
    }
    if (['th', 'en'].includes(event.data.language)) lang = event.data.language;
    render();
  });
  const workNow = () => state.work[state.index];
  function passed(work) { return Boolean(work.mastery?.every(Boolean)); }
  const firstPending = () => state.work.findIndex(work => !passed(work));
  const asNumber = value => value === 0 ? '0.00' : signed(value);
  function jump(id, focus = false) {
    const target = $(id);
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (focus) target.focus({ preventScroll: true });
    document.querySelector('.guide-target')?.classList.remove('guide-target');
    target.classList.add('guide-target');
    clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => target.classList.remove('guide-target'), 1400);
  }
  function nextMission() {
    const next = state.index + 1 < missions.length ? state.index + 1 : firstPending();
    if (next === -1) openReport();
    else selectMission(next);
  }
  function action() {
    const work = workNow();
    if (passed(work)) {
      return state.index === missions.length - 1 && firstPending() === -1
        ? { label: pair('จบกิจกรรมและดูรายงาน', 'Finish and view report'), run: nextMission }
        : { label: pair('ภารกิจถัดไป', 'Next mission'), run: nextMission };
    }
    const need = requirements(state.index, work.rows, state.setup);
    if (!need.complete) return { label: pair('พาไปยังเครื่องมือ', 'Find the control'), text: txt(need.text),
      run: () => jump(need.ready && pendingInputs.size ? pendingInputs.values().next().value + '-control' : need.id) };
    if (!work.frozen) return { label: pair('ไปทำ Check-out', 'Go to Check-out'),
      text: t('บันทึกครบแล้ว ใช้ผลทดลองตอบคำถาม', 'Measurements complete. Use the results to answer.'),
      run() { work.frozen = clone(work.rows); render(); changed(); jump('checkout', true); } };
    const unanswered = work.answers.findIndex(group => group.some(value => value.trim() === ''));
    const wrong = work.latest?.findIndex((correct, i) => !correct && !work.mastery[i]) ?? -1;
    const question = unanswered >= 0 ? unanswered : wrong;
    if (unanswered >= 0 || (wrong >= 0 && answersUnchanged(work)))
      return { label: pair('พาไปยังคำถาม', 'Find the question'), text: t('ใช้ตารางหรือกราฟตอบข้อที่ยังค้าง', 'Use the table or graph to answer the pending question.'),
        run: () => jump('q-' + question) };
    return { label: pair('ไปตรวจคำตอบ', 'Find Check answers'), text: t('พร้อมตรวจแล้ว', 'Your answers are ready to check.'), run: () => jump('check', true) };
  }
  function applyButton(id, control) { $(id).textContent = txt(control.label); $(id).onclick = control.run; }
  function renderNavigation() {
    const work = workNow();
    const currentAction = action();
    const steps = targets[state.index];
    const done = work.rows.length;
    const guideText = currentAction.text || (firstPending() === -1
      ? t('ผ่านทั้งสามภารกิจแล้ว เปิดรายงานเพื่อดูผล', 'All three missions are complete. Open the report.')
      : t('ผ่าน Check-out แล้ว', 'Check-out passed.'));
    setText('guide-status', t(`ภารกิจ ${state.index + 1}/3 · ขั้น ${Math.min(done + 1, steps.length)}/${steps.length} · ✓ ${done}`,
      `Mission ${state.index + 1}/3 · Step ${Math.min(done + 1, steps.length)}/${steps.length} · ✓ ${done}`));
    setText('guide-text', guideText);
    setText('guide-collapse', state.guide === 'collapsed' ? t('ขยาย', 'Expand') : t('ย่อ', 'Collapse'));
    $('guide-collapse').setAttribute('aria-expanded', String(state.guide === 'open'));
    $('dock').hidden = state.explore;
    $('guide').hidden = state.guide === 'hidden';
    $('guide-reopen').hidden = state.guide !== 'hidden';
    $('guide-text').hidden = $('guide-action').hidden = state.guide !== 'open';
    applyButton('guide-action', currentAction);
    applyButton('mission-action', currentAction);
    setText('mission-title', txt(missions[state.index].title));
    setText('mission-objective', txt(missions[state.index].objective));
    const available = firstPending();
    $('mission-select').replaceChildren(...missions.map((mission, i) => {
      const option = new Option(`${passed(state.work[i]) ? '✓ ' : ''}${i + 1} · ${txt(mission.title)}`, String(i));
      option.disabled = available >= 0 && i > available;
      option.selected = i === state.index;
      return option;
    }));
    $('step-list').replaceChildren(...steps.map((step, i) => {
      const li = document.createElement('li');
      if (i < done) li.classList.add('done');
      if (i > done) li.hidden = true;
      if (i === done) li.setAttribute('aria-current', 'step');
      li.textContent = `${i < done ? '✓ ' : ''}${txt(step.title)}`;
      return li;
    }));
    document.querySelector('.mission').hidden = state.explore;
    $('checkout').hidden = state.explore || !work.frozen;
    $('next').hidden = !passed(work);
    if (passed(work)) applyButton('next', currentAction);
  }
  function renderInstruments() {
    const setup = state.setup;
    const reading = measure(setup);
    for (const name of ['frequency', 'intensity', 'voltage']) {
      const value = name === 'frequency' && Math.abs(setup.frequency - teaching.frequency) < 1e-8
        ? teaching.frequency.toFixed(8) : String(setup[name]);
      if (!pendingInputs.has(name) && $(name).value !== value) $(name).value = value;
      $(name + '-range').value = String(setup[name]);
    }
    $('metal').value = setup.metal;
    setText('light', setup.light ? t('ปิดแสง', 'Switch off light') : t('เปิดแสง', 'Switch on light'));
    $('light').setAttribute('aria-pressed', String(setup.light));
    setText('current', reading.current.toFixed(2));
    setText('photon-energy', t(`พลังงานโฟตอน ${reading.energy.toFixed(2)} eV`, `Photon energy ${reading.energy.toFixed(2)} eV`));
    const light = spectrum(setup.frequency);
    const band = light.region === 'visible' ? t('แสงที่มองเห็น · สีโดยประมาณ', 'Visible light · approximate color')
      : light.region === 'uv' ? t('อัลตราไวโอเลต · เส้นประสีแทน', 'Ultraviolet · dashed guide color')
        : t('อินฟราเรด · เส้นประสีแทน', 'Infrared · dashed guide color');
    setText('light-spectrum', `λ ≈ ${light.wavelength.toFixed(1)} nm · ${band}`);
    $('spectrum-swatch').style.setProperty('--light-color', light.color);
    $('spectrum-swatch').classList.toggle('invisible-band', light.region !== 'visible');
    setText('signed-voltage', signed(setup.voltage) + ' V');
    setText('supply-label', signed(setup.voltage) + ' V');
    setText('polarity', setup.voltage > 0 ? t('ขั้วรับดึงอิเล็กตรอน', 'Attracting collector')
      : setup.voltage < 0 ? t('ขั้วรับต้านอิเล็กตรอน', 'Retarding collector') : t('ขั้วทั้งสองมีศักย์เท่ากัน', 'Equal electrode potentials'));
    const description = !reading.emission
      ? t('ไม่เห็นอิเล็กตรอนออกจากผิวโลหะ', 'No electrons are seen leaving the metal.')
      : reading.current > 0 ? t('เห็นอิเล็กตรอนเคลื่อนถึงขั้วรับ', 'Electrons are seen reaching the collector.')
        : t('เห็นอิเล็กตรอนออกจากผิวแล้ววกกลับ', 'Electrons are seen leaving the surface and returning.');
    setText('tube-description', description);
    setText('tube-state', description);
    for (const input of $('overlays').querySelectorAll('input')) input.checked = setup.overlays.includes(input.value);
    tube(setup, reading, light);
    const need = requirements(state.index, workNow().rows, setup);
    $('record').disabled = Boolean(pendingInputs.size) || (!state.explore && !need.ready);
    setText('input-status', txt(inputNotice));
    setText('record-status', txt(recordNotice));
  }
  function makeTable(rows) {
    const wrap = document.createElement('div');
    wrap.className = 'scroll-table';
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    const body = table.createTBody();
    for (const title of [t('แสง', 'Light'), t('โลหะ', 'Metal'), 'f (10¹⁴ Hz)', 'Eγ (eV)', t('ความเข้ม (%)', 'Intensity (%)'), 'V (V)', 'I (µA)']) {
      const th = document.createElement('th');
      th.scope = 'col'; th.textContent = title; head.append(th);
    }
    for (const row of rows) {
      const tr = body.insertRow();
      const light = row.light ? t('เปิด', 'On') : t('ปิด', 'Off');
      for (const value of [light, row.metal, row.frequency.toFixed(2), row.energy.toFixed(2), row.intensity, asNumber(row.voltage), row.current.toFixed(2)])
        tr.insertCell().textContent = String(value);
    }
    wrap.append(table);
    return wrap;
  }
  function renderObservations() {
    const rows = state.explore ? state.benchRows : workNow().rows;
    const graphRows = state.explore && rows.length
      ? rows.filter(row => row.light && ['metal', 'frequency', 'intensity'].every(field => row[field] === rows.at(-1)[field]))
      : !state.explore && state.index === 2 ? rows : [];
    if (rows.length) $('readings').replaceChildren(makeTable(rows));
    else setText('readings', t('บันทึกค่าจากมิเตอร์เพื่อเริ่มตาราง', 'Record a meter reading to start the table.'));
    $('graph').hidden = graphRows.length === 0;
    if (graphRows.length) PhotoelectricPlots.current($('iv'), graphRows,
      { title: t('กราฟกระแสกับความต่างศักย์จากข้อมูลที่บันทึก', 'Current against potential difference from recorded data') });
  }
  let questionKey = '';
  const answersUnchanged = work => JSON.stringify(work.latestAnswers) === JSON.stringify(work.answers);
  function renderAnswers() {
    const work = workNow();
    setText('answer-status', txt(answerNotice));
    if (!work.frozen) return;
    const nextKey = `${lang}:${state.index}`;
    if (nextKey !== questionKey) {
      $('questions').replaceChildren();
      missions[state.index].questions.forEach((question, i) => {
        const box = document.createElement('fieldset');
        box.className = 'question'; box.id = 'q-' + i;
        const legend = document.createElement('legend');
        legend.textContent = `${i + 1}. ${txt(question.title)}`; box.append(legend);
        question.fields.forEach((field, j) => {
          const label = document.createElement('label');
          const title = document.createElement('span'); title.textContent = txt(field.label); label.append(title);
          let input;
          if (field.options) {
            input = document.createElement('select');
            input.add(new Option(t('เลือกคำตอบ', 'Choose an answer'), ''));
            field.options.forEach((option, k) => input.add(new Option(txt(option), String(k))));
          } else {
            input = document.createElement('input');
            input.inputMode = 'decimal';
            input.maxLength = 50;
            input.autocomplete = 'off';
          }
          input.value = work.answers[i][j];
          input.addEventListener('input', () => {
            work.answers[i][j] = input.value;
            answerNotice = null;
            setText('answer-status', '');
            renderNavigation();
            changed();
          });
          label.append(input); box.append(label);
        });
        const feedback = document.createElement('p');
        feedback.className = 'question-feedback'; feedback.id = 'feedback-' + i;
        box.append(feedback);
        $('questions').append(box);
      });
      questionKey = nextKey;
    }
    missions[state.index].questions.forEach((question, i) => {
      const feedback = $('feedback-' + i);
      const success = work.mastery?.[i];
      feedback.hidden = !work.latest;
      feedback.classList.toggle('error', Boolean(work.latest && !success));
      feedback.textContent = success ? t('✓ ได้คะแนนข้อนี้แล้ว', '✓ Credit earned')
        : work.latest ? txt(question.feedback) : '';
      for (const input of $('q-' + i).querySelectorAll('input,select')) input.disabled = Boolean(success);
    });
    $('check').disabled = passed(work);
  }
  const count = flags => flags?.filter(Boolean).length || 0;
  function renderReport() {
    if (!state.report) return;
    const first = state.work.reduce((sum, work) => sum + count(work.first), 0);
    const mastery = state.work.reduce((sum, work) => sum + count(work.mastery), 0);
    const completed = state.work.filter(passed).length;
    const checked = state.work.reduce((sum, work, i) => sum + (work.first ? missions[i].questions.length : 0), 0);
    setText('report-name', t(`ชื่อ ${state.student.name || '—'} · ชั้น ${state.student.className || '—'}`,
      `Name ${state.student.name || '—'} · Class ${state.student.className || '—'}`));
    setText('report-date', new Date(state.date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'long' }));
    $('student-name').value = state.student.name;
    $('student-class').value = state.student.className;
    const format = (value, total) => `${value}/${total} · ${(100 * value / total).toFixed(1).replace(/\.0$/, '')}%`;
    $('metrics').replaceChildren(...[
      [t('ความคืบหน้า', 'Progress'), format(completed, 3)],
      [t('คะแนนครั้งแรก', 'First-attempt score'), format(first, 10)],
      [t('คะแนนหลังแก้ไข (Mastery)', 'Mastery after corrections'), format(mastery, 10)],
      [t('ตรวจแล้ว / รอตรวจ', 'Graded / pending'), `${checked} / ${10 - checked}`],
    ].map(([label, score]) => {
      const item = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent = score;
      item.append(label, strong); return item;
    }));
    $('report-detail').replaceChildren(...state.work.map((work, i) => {
      const block = document.createElement('section');
      block.className = 'report-mission';
      const heading = document.createElement('h3');
      const max = missions[i].questions.length;
      heading.textContent = `${i + 1}. ${txt(missions[i].title)}`;
      const stats = document.createElement('p');
      stats.textContent = t(`${passed(work) ? 'ผ่าน' : 'ยังทำไม่ครบ'} · ครั้งแรก ${work.first ? count(work.first) : '—'}/${max} · Mastery ${count(work.mastery)}/${max}`,
        `${passed(work) ? 'Complete' : 'In progress'} · First attempt ${work.first ? count(work.first) : '—'}/${max} · Mastery ${count(work.mastery)}/${max}`);
      block.append(heading, stats);
      if (work.rows.length) block.append(makeTable(work.rows));
      if (i === 2 && work.mastery?.some(Boolean)) {
        const resolved = [2, 3, 4].filter(n => work.mastery[n]).flatMap(n => {
          const labels = [['V', 'Vₛ'], ['Kₘₐₓ'], ['W']][n - 2];
          return work.answers[n].map((value, j) => `${labels[j]} = ${value} ${n === 2 ? 'V' : 'eV'}`);
        });
        if (resolved.length) {
          const calculation = document.createElement('p');
          calculation.textContent = resolved.join(' · ');
          block.append(calculation);
        }
      }
      return block;
    }));
    $('review').disabled = !completed;
  }
  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-th][data-en]').forEach(node => {
      if (node.textContent !== node.dataset[lang]) node.textContent = node.dataset[lang];
    });
    setText('language', t('English', 'ไทย'));
    setText('explore', state.explore ? t('กลับสู่ภารกิจ', 'Return to missions') : t('สำรวจหลอดเอง', 'Explore the tube'));
    $('explore').hidden = $('show-report').hidden = stoppingDemo;
    $('report').hidden = !state.report;
    $('work').hidden = state.report;
    renderNavigation();
    renderInstruments();
    renderObservations();
    renderAnswers();
    renderReport();
    renderSave();
  }
  function selectMission(index) {
    const pending = firstPending();
    if (!Number.isInteger(index) || index < 0 || index >= missions.length || (pending !== -1 && index > pending)) return;
    state.index = index; state.report = false; state.explore = false;
    recordNotice = answerNotice = inputNotice = null; pendingInputs.clear();
    render(); changed(); jump('mission-title');
  }
  function openReport() {
    state.report = true;
    render(); changed(); jump('report', true);
  }
  $('language').onclick = () => { lang = t('en', 'th'); render(); };
  $('explore').onclick = () => {
    state.report = false; state.explore = !state.explore; recordNotice = null; render(); changed();
    jump(state.explore ? 'tube-title' : 'mission-title');
  };
  $('mission-select').onchange = event => selectMission(Number(event.target.value));
  $('guide-collapse').onclick = () => { state.guide = state.guide === 'open' ? 'collapsed' : 'open'; renderNavigation(); changed(); };
  $('guide-hide').onclick = () => { state.guide = 'hidden'; renderNavigation(); changed(); $('guide-reopen').focus(); };
  $('guide-reopen').onclick = () => { state.guide = 'open'; renderNavigation(); changed(); $('guide-collapse').focus(); };
  new ResizeObserver(() => document.documentElement.style.setProperty('--guide-height', `${$('dock').offsetHeight}px`)).observe($('dock'));
  $('show-report').onclick = openReport;
  $('print').onclick = () => window.print();
  $('review').onclick = () => selectMission(passed(workNow()) ? state.index : state.work.findIndex(passed));
  $('return').onclick = () => { state.report = false; render(); changed(); jump('tube-title'); };
  for (const [id, key] of [['student-name', 'name'], ['student-class', 'className']]) {
    $(id).oninput = () => {
      state.student[key] = $(id).value;
      setText('report-name', t(`ชื่อ ${state.student.name || '—'} · ชั้น ${state.student.className || '—'}`,
        `Name ${state.student.name || '—'} · Class ${state.student.className || '—'}`));
      changed();
    };
  }
  function controlChange(key, value) {
    if (!pendingInputs.size) inputNotice = null;
    recordNotice = null;
    state.setup[key] = value; renderInstruments(); renderNavigation(); changed();
  }
  $('light').onclick = () => controlChange('light', !state.setup.light);
  $('metal').onchange = () => controlChange('metal', $('metal').value);
  $('teaching-frequency').onclick = () => {
    pendingInputs.delete('frequency');
    controlChange('frequency', teaching.frequency);
  };
  $('overlays').onchange = () => controlChange('overlays', Array.from($('overlays').querySelectorAll(':checked'), input => input.value));
  for (const name of ['frequency', 'intensity', 'voltage']) {
    const input = $(name);
    $(name + '-range').oninput = event => {
      pendingInputs.delete(name);
      controlChange(name, Number(event.target.value));
    };
    const commit = () => {
      if (input.value && input.validity.valid) {
        pendingInputs.delete(name);
        const value = Number(input.value);
        const exact = name === 'frequency' && Math.abs(value - teaching.frequency) < 1e-8;
        controlChange(name, exact ? teaching.frequency : value);
        return;
      }
      pendingInputs.add(name);
      inputNotice = pair(`กรอกตัวเลขระหว่าง ${input.min} ถึง ${input.max} ให้ตรงช่วงของเครื่องมือ`,
        `Enter a valid value from ${input.min} to ${input.max} for this control.`);
      renderInstruments();
    };
    input.oninput = () => { pendingInputs.add(name); $('record').disabled = true; };
    input.onchange = commit;
    input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); commit(); } };
  }
  $('record').onclick = () => {
    if (pendingInputs.size) return;
    const work = workNow();
    const row = snapshot(state.setup);
    if (state.explore) { state.benchRows.push(row); state.benchRows = state.benchRows.slice(-20); }
    else {
      if (!requirements(state.index, work.rows, state.setup).ready) return;
      work.rows.push(row);
    }
    recordNotice = pair('✓ บันทึกค่ามิเตอร์แล้ว', '✓ Meter reading recorded');
    render(); changed();
  };
  $('answer-form').onsubmit = event => {
    event.preventDefault();
    const work = workNow();
    if (!work.frozen || passed(work)) return;
    const empty = work.answers.findIndex(group => group.some(value => !value.trim()));
    if (empty !== -1) {
      answerNotice = pair('กรอกคำตอบทุกช่องก่อนตรวจ', 'Complete every answer before checking.');
      renderAnswers(); jump('q-' + empty);
      return;
    }
    const result = grade(state.index, work.frozen, work.answers);
    if (!work.first) {
      work.first = result.slice();
      work.firstAnswers = clone(work.answers);
    }
    work.latest = result;
    work.latestAnswers = clone(work.answers);
    work.mastery = result.map((ok, i) => ok || Boolean(work.mastery?.[i]));
    answerNotice = passed(work)
      ? pair('✓ ผ่าน Check-out แล้ว', '✓ Check-out passed')
      : pair('ดูคำแนะนำใต้ข้อที่ยังไม่ได้คะแนน แล้วตรวจอีกครั้ง', 'Use the feedback on questions still pending, then check again.');
    render(); changed();
  };
  render();
  changed();
})();
