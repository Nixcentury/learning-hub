import { GUIDE_MAX_BYTES, guideUrl, validateGuide, validateGuideTargets, findGuideTarget } from './learning-guide-model.js';

let sequence = 0;
export function createLearningGuide({ frame, stage, button, contentId, language = 'th', fetcher = fetch, ResizeObserverClass = globalThis.ResizeObserver }) {
  const host = stage.ownerDocument;
  const panel = host.createElement('aside');
  panel.className = 'learning-guide';
  panel.id = `learning-guide-${++sequence}`;
  panel.hidden = true;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', `${panel.id}-title`);
  panel.innerHTML = `<header class="learning-guide-header"><h2 id="${panel.id}-title"></h2><button type="button" class="learning-guide-close">×</button></header><div class="learning-guide-body"></div>`;
  stage.append(panel);
  button.setAttribute('aria-controls', panel.id);
  button.setAttribute('aria-expanded', 'false');
  const heading = panel.querySelector('h2');
  const closeButton = panel.querySelector('button');
  const body = panel.querySelector('.learning-guide-body');
  let doc, guide, status = 'empty', abort, generation = 0, disposed = false, highlight, highlightTimer;
  let compact = true, priorInert;
  const text = (th, en) => language === 'en' ? en : th;
  const t = value => value[language];
  const add = (parent, tag, value, className) => {
    const node = host.createElement(tag); if (value) node.textContent = value;
    if (className) node.className = className; parent.append(node); return node;
  };
  function updateInert() {
    const modal = !panel.hidden && compact;
    if (modal && priorInert === undefined) { priorInert = frame.inert; frame.inert = true; }
    if (!modal && priorInert !== undefined) { frame.inert = priorInert; priorInert = undefined; }
    panel.setAttribute('role', modal ? 'dialog' : 'region');
    if (modal) panel.setAttribute('aria-modal', 'true'); else panel.removeAttribute('aria-modal');
  }
  function resize() {
    compact = stage.getBoundingClientRect().width < 900;
    stage.classList.toggle('guide-is-drawer', compact);
    updateInert();
  }
  const observer = ResizeObserverClass ? new ResizeObserverClass(resize) : null;
  observer?.observe(stage);
  function clearHighlight() {
    clearTimeout(highlightTimer); highlight?.classList.remove('hub-guide-target'); highlight = null;
  }
  function close(restoreFocus = true) {
    panel.hidden = true; stage.classList.remove('guide-is-open'); button.setAttribute('aria-expanded', 'false');
    updateInert(); if (restoreFocus) button.focus();
  }
  function jump(target) {
    const node = findGuideTarget(doc, target, language);
    if (!node) return;
    clearHighlight();
    highlight = node; node.classList.add('hub-guide-target');
    node.scrollIntoView({ block: 'center', behavior: 'auto' });
    highlightTimer = setTimeout(clearHighlight, 2500);
    // Focus the sheet without opening its answer or changing its response area.
    if (compact) close(false);
    const hadTabIndex = node.getAttribute('tabindex');
    node.setAttribute('tabindex', '-1'); node.focus({ preventScroll: true });
    if (hadTabIndex === null) node.removeAttribute('tabindex'); else node.setAttribute('tabindex', hadTabIndex);
  }
  function links(parent, items) {
    const group = add(parent, 'div', '', 'learning-guide-links');
    for (const link of items) {
      const control = add(group, 'button', t(link.label)); control.type = 'button';
      control.addEventListener('click', () => jump(link.target));
    }
  }
  function check(parent, value, id, openIds) {
    add(parent, 'p', t(value.question), 'learning-guide-question');
    const details = add(parent, 'details'); details.dataset.guideCheck = id; if (openIds.has(id)) details.setAttribute('open', '');
    add(details, 'summary', text('ดูแนวคำตอบ', 'Show expected answer'));
    add(details, 'p', t(value.answer));
  }
  function render() {
    const openIds = new Set([...body.querySelectorAll('details[open]')].map(node => node.dataset.guideCheck));
    const scroll = body.scrollTop;
    heading.textContent = text('ไกด์ใบนี้', 'Sheet guide');
    panel.lang = language;
    closeButton.setAttribute('aria-label', text('ปิดไกด์', 'Close guide'));
    button.title = heading.textContent; button.setAttribute('aria-label', heading.textContent);
    button.querySelector('span').textContent = heading.textContent;
    body.replaceChildren(); body.dataset.guideState = status;
    if (status !== 'ready') {
      const messages = {
        idle: text('เปิดไกด์เพื่อดูเส้นทางของใบนี้', 'Open the guide to see a route through this sheet.'),
        empty: text('ใบนี้ยังไม่มีไกด์ คุณอ่านและทำใบเรียนรู้ต่อได้ตามเดิม', 'No guide for this sheet yet. You can continue using the full worksheet.'),
        loading: text('กำลังเปิดไกด์…', 'Loading guide…'),
        error: text('เปิดไกด์ไม่ได้ หรือไกด์ยังไม่ตรงกับใบฉบับนี้ คุณใช้ใบเรียนรู้ต่อได้', 'The guide could not be loaded or does not match this sheet. The worksheet remains available.'),
      };
      const message = add(body, 'p', messages[status]); message.setAttribute('role', status === 'error' ? 'alert' : 'status');
      if (status === 'error') { const retry = add(body, 'button', text('ลองอีกครั้ง', 'Try again')); retry.type = 'button'; retry.addEventListener('click', load); }
      return;
    }
    add(body, 'h3', t(guide.title));
    add(body, 'p', text('เส้นทางขั้นต่ำ: ทำตามแต่ละช่วง แล้วลองตอบเองก่อนเปิดแนวคำตอบ เลือกอ่านรายละเอียดต่อได้ตามที่ยังติด', 'Minimum route: follow each stop and try its question before revealing the answer. Use the full sheet for details you still need.'), 'learning-guide-intro');
    add(body, 'h4', text('ก่อนเริ่ม', 'Before starting')); add(body, 'p', t(guide.prerequisites));
    add(body, 'h4', text('เป้าหมาย', 'Goal')); add(body, 'p', t(guide.goal));
    guide.steps.forEach((step, index) => {
      const section = add(body, 'section', '', 'learning-guide-step');
      add(section, 'h3', `${index + 1}. ${t(step.title)}`);
      add(section, 'p', t(step.summary), 'learning-guide-summary');
      add(section, 'h4', text('ชวนคิดและเล่าเรื่อง', 'Think and discuss')); add(section, 'p', t(step.story));
      add(section, 'h4', text('ลงมือทำ', 'Work on the sheet')); add(section, 'p', t(step.action)); links(section, step.links);
      check(section, step.check, step.id, openIds);
      if (step.review?.length) { add(section, 'h4', text('ถ้ายังติด กลับไปดู', 'If you need help, revisit')); links(section, step.review); }
      add(section, 'p', t(step.after), 'learning-guide-after');
    });
    const finish = add(body, 'section', '', 'learning-guide-step');
    add(finish, 'h3', text('ก่อนจบใบนี้', 'Before finishing')); add(finish, 'p', t(guide.finish));
    check(finish, guide.exitCheck, 'exit', openIds);
    body.scrollTop = scroll;
  }
  async function load() {
    if (!doc?.documentElement.hasAttribute('data-sheet-guide') || disposed) return;
    abort?.abort(); abort = new AbortController();
    const current = ++generation, sourceDoc = doc;
    status = 'loading'; render();
    try {
      const url = guideUrl(doc.documentElement.getAttribute('data-sheet-guide'), frame.src);
      const response = await fetcher(url, { signal: abort.signal, credentials: 'same-origin', redirect: 'error' });
      if (!response.ok || Number(response.headers?.get('content-length')) > GUIDE_MAX_BYTES) throw new Error('Guide unavailable');
      const source = await response.text();
      if (new TextEncoder().encode(source).length > GUIDE_MAX_BYTES) throw new Error('Guide too large');
      const candidate = JSON.parse(source);
      const errors = validateGuide(candidate, { contentId, revision: sourceDoc.documentElement.getAttribute('data-sheet-revision') });
      if (!sourceDoc.documentElement.getAttribute('data-sheet-revision')) errors.push('Missing sheet revision');
      if (errors.length || validateGuideTargets(candidate, sourceDoc).length) throw new Error('Guide does not match sheet');
      if (disposed || current !== generation || doc !== sourceDoc) return;
      guide = candidate; status = 'ready'; render();
    } catch {
      if (disposed || current !== generation || doc !== sourceDoc) return;
      status = 'error'; render();
    }
  }
  function open() {
    if (disposed || button.hidden) return;
    panel.hidden = false; stage.classList.add('guide-is-open'); button.setAttribute('aria-expanded', 'true'); resize();
    if (status === 'idle') void load(); else render();
    closeButton.focus();
  }
  function toggle() { if (panel.hidden) open(); else close(); }
  function keydown(event) {
    if (panel.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (compact && event.key === 'Tab') {
      const controls = [closeButton, ...body.querySelectorAll('button, summary')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && host.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && host.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  const closeClick = () => close();
  closeButton.addEventListener('click', closeClick);
  button.addEventListener('click', toggle); stage.addEventListener('keydown', keydown);
  function setDocument(nextDoc) {
    generation++; abort?.abort(); close(false); clearHighlight();
    doc?.querySelector('[data-guide-highlight-style]')?.remove();
    doc = nextDoc; guide = null;
    button.hidden = !doc?.documentElement.hasAttribute('data-learning-sheet');
    status = doc?.documentElement.hasAttribute('data-sheet-guide') ? 'idle' : 'empty';
    if (!button.hidden) {
      const style = doc.createElement('style'); style.dataset.guideHighlightStyle = ''; style.setAttribute('data-no-print', '');
      style.textContent = '.hub-guide-target{outline:3px solid #8a6bb2;outline-offset:5px}@media print{.hub-guide-target{outline:none}}'; doc.head.append(style);
    }
    body.replaceChildren(); render();
  }
  render(); resize();
  return {
    setDocument,
    setLanguage(value) { const next = value === 'en' ? 'en' : 'th'; if (language === next) return; language = next; render(); },
    dispose() { disposed = true; generation++; abort?.abort(); close(false); clearHighlight(); observer?.disconnect(); doc?.querySelector('[data-guide-highlight-style]')?.remove(); button.removeEventListener('click', toggle); stage.removeEventListener('keydown', keydown); closeButton.removeEventListener('click', closeClick); panel.remove(); },
  };
}
