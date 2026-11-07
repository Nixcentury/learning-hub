import { validateSimulationGuide, simulationGuideExample } from './simulation-guide-model.js';

// Rendered by the owning workspace into a script-free guide document.
// Progress stays on that simulation's live window; no learner/account data.
export function mountSimulationGuide({ document: doc, contentId, title, state, guide = null,
  language = 'th', onLocate = () => 'missing', onReturn = () => {} }) {
  const root = doc.querySelector('[data-simulation-guide]');
  if (!root) return null;
  let lang = language === 'en' ? 'en' : 'th';
  const text = (th, en) => lang === 'th' ? th : en;
  const valid = guide?.contentId === contentId && !validateSimulationGuide(guide).length;
  const currentGuide = () => state.example ? simulationGuideExample(contentId) : valid ? guide : null;
  function button(parent, label, handler, disabled = false) {
    const node = doc.createElement('button'); node.type = 'button'; node.textContent = label;
    node.disabled = disabled; node.addEventListener('click', handler); parent.append(node); return node;
  }
  function add(parent, tag, value, className) {
    const node = doc.createElement(tag); node.textContent = value;
    if (className) node.className = className; parent.append(node); return node;
  }
  function move(delta) {
    const data = currentGuide(); if (!data) return;
    const index = Math.max(0, data.steps.findIndex(step => step.id === state.stepId));
    state.stepId = data.steps[Math.max(0, Math.min(data.steps.length - 1, index + delta))].id;
    render(); root.querySelector('h2')?.focus({ preventScroll: true });
  }
  function render() {
    const scroll = doc.scrollingElement?.scrollTop || 0;
    doc.documentElement.lang = lang;
    root.replaceChildren();
    add(root, 'p', text('คู่มือเล่น', 'Play guide'), 'guide-eyebrow');
    add(root, 'h1', title[lang]);
    const data = currentGuide();
    root.dataset.guideState = state.example ? 'example' : data ? 'ready' : 'empty';
    if (!data) {
      add(root, 'h2', text('กิจกรรมนี้ยังไม่มีคู่มือเล่น', 'No walkthrough for this activity yet'));
      add(root, 'p', text('คุณเล่น simulation ต่อได้ตามเดิม ส่วนนี้เตรียมไว้สำหรับคู่มือที่จะเพิ่มภายหลัง', 'Continue using the simulation. This space is ready for a walkthrough to be added later.'));
      button(root, text('ลองปุ่มคู่มือด้วยตัวอย่าง', 'Try the guide controls'), () => {
        state.example = true; state.stepId = 'open'; render();
      }).dataset.guideExample = '';
    } else {
      add(root, 'p', state.example ? text('ตัวอย่างระบบ · ยังไม่ใช่คู่มือการทดลอง', 'Control example · not an experiment walkthrough') : data.title[lang], 'guide-notice');
      const index = Math.max(0, data.steps.findIndex(step => step.id === state.stepId)), step = data.steps[index];
      state.stepId = step.id;
      add(root, 'p', text(`ขั้น ${index + 1} จาก ${data.steps.length}`, `Step ${index + 1} of ${data.steps.length}`), 'guide-progress');
      const heading = add(root, 'h2', step.title[lang]); heading.tabIndex = -1;
      add(root, 'p', step.instruction[lang], 'guide-instruction');
      if (index === data.steps.length - 1) add(root, 'p', text('นี่คือขั้นสุดท้ายของคู่มือ สถานะนี้ไม่ได้หมายถึงผ่านการทดลองหรือคำถาม', 'This is the last guide step. It does not mean the experiment or its questions have been passed.'), 'guide-note');
    }
    const controls = add(root, 'nav', '', 'guide-controls');
    controls.setAttribute('aria-label', text('ควบคุมคู่มือ', 'Guide controls'));
    const index = data ? Math.max(0, data.steps.findIndex(step => step.id === state.stepId)) : -1;
    button(controls, text('ย้อนกลับ', 'Previous'), () => move(-1), !data || index === 0).dataset.guidePrevious = '';
    button(controls, text('ถัดไป', 'Next'), () => move(1), !data || index === data.steps.length - 1).dataset.guideNext = '';
    const status = add(root, 'p', '', 'guide-status'); status.setAttribute('role', 'status');
    button(controls, text('ชี้ตำแหน่ง', 'Locate control'), () => {
      const result = onLocate(data.steps[index].target);
      status.textContent = result === 'ready' ? text('เน้นกรอบตำแหน่งแล้ว คุณเลือกกดได้เอง', 'Control highlighted. You choose whether to press it.')
        : result === 'disabled' ? text('เน้นกรอบแล้ว แต่ปุ่มยังไม่พร้อม ให้ทำเงื่อนไขของกิจกรรมก่อน', 'Control highlighted, but it is not ready. Complete the activity prerequisites first.')
          : text('ยังไม่พบตำแหน่งนี้ในหน้าที่เปิดอยู่ ลองเลือกโหมดหรือทำขั้นก่อนหน้าตามคู่มือ', 'This control is not visible in the current view. Select the mode or follow the previous guide step.');
      if (result !== 'ready' && data.steps[index].blocked) status.textContent += '\n' + data.steps[index].blocked[lang];
    }, !data || !data.steps[index].target).dataset.guideLocate = '';
    button(root, text('กลับไปที่ simulation', 'Return to simulation'), onReturn).dataset.guideReturn = '';
    if (state.example) button(root, text('ออกจากตัวอย่างระบบ', 'Leave control example'), () => {
      state.example = false; state.stepId = null; render();
    }).dataset.guideExampleExit = '';
    if (doc.scrollingElement) doc.scrollingElement.scrollTop = scroll;
  }
  render();
  return { setLanguage(value) { const next = value === 'en' ? 'en' : 'th'; if (next !== lang) { lang = next; render(); } },
    dispose() { root.replaceChildren(); } };
}

export function createSimulationGuideHighlighter() {
  let node, timer, disposed = false;
  function clear() { clearTimeout(timer); node?.classList.remove('hub-simulation-guide-target'); node = null; }
  return {
    clear,
    locate(owner, target) {
      clear(); if (disposed || !owner?.frame.isConnected || !target) return 'missing';
      try {
        const doc = target.scope === 'window' ? owner.element.ownerDocument : owner.frame.contentDocument;
        const selected = target.scope === 'window' ? { guide: owner.simulationGuideButton,
          language: owner.element.querySelector('.window-language'), split: owner.splitButton }[target.key]
          : target.scope === 'simulation' && /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/.test(target.key || '') ? doc?.getElementById(target.key) : null;
        if (!selected?.isConnected || selected.closest('[hidden]') || (selected.getClientRects && !selected.getClientRects().length)) return 'missing';
        if (!doc.querySelector('[data-simulation-guide-style]')) {
          const style = doc.createElement('style'); style.dataset.simulationGuideStyle = '';
          style.textContent = '.hub-simulation-guide-target{outline:3px solid #057a69!important;outline-offset:4px!important}@media print{.hub-simulation-guide-target{outline:none!important}}';
          doc.head.append(style);
        }
        node = selected; node.classList.add('hub-simulation-guide-target');
        node.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'auto' });
        timer = setTimeout(clear, 3500);
        return node.disabled ? 'disabled' : 'ready';
      } catch { return 'missing'; }
    },
    dispose() { clear(); disposed = true; },
  };
}
