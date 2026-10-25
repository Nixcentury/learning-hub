import { learningSheetTree, validateLearningSheet } from './learning-sheet-model.js';

const controllers = new WeakMap();
const pending = new WeakMap();

function loadStyles(doc, href) {
  let link = [...doc.querySelectorAll('link[rel="stylesheet"]')].find(node => node.href === href);
  if (link?.sheet) return Promise.resolve();
  const created = !link;
  if (created) { link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = href; }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Learning sheet styles timed out')), 8000);
    // WebKit also blocks link load listeners inside the scripts-disabled frame.
    const poll = setInterval(() => { if (link.sheet) finish(); }, 40);
    const loaded = () => finish();
    const failed = () => finish(new Error('Learning sheet styles unavailable'));
    function finish(error) {
      clearTimeout(timer); clearInterval(poll);
      link.removeEventListener('load', loaded); link.removeEventListener('error', failed);
      if (error) { if (created) link.remove(); reject(error); } else resolve();
    }
    link.addEventListener('load', loaded); link.addEventListener('error', failed);
    if (created) doc.head.append(link);
  });
}

// The trusted parent owns the controller; the authored iframe never runs scripts.
export function attachLearningSheet(doc, options) {
  if (!doc?.documentElement.hasAttribute('data-learning-sheet')) return Promise.resolve(null);
  if (controllers.has(doc)) return Promise.resolve(controllers.get(doc));
  if (pending.has(doc)) return pending.get(doc);
  const task = initialize(doc, options).finally(() => pending.delete(doc));
  pending.set(doc, task);
  return task;
}

async function initialize(doc, { stylesheetUrl, language = 'th', isCurrent = () => true }) {
  const errors = validateLearningSheet(learningSheetTree(doc.documentElement));
  if (errors.length) throw new Error(errors.join('\n'));
  await loadStyles(doc, stylesheetUrl);
  if (!isCurrent()) return null;
  let currentLanguage = language === 'en' ? 'en' : 'th', disposed = false;
  const shown = new Set(), entries = [];
  const controls = new Map();
  // WebKit blocks parent-installed click handlers in scripts-disabled frames.
  // Native disclosures still activate by touch/keyboard; their DOM changes are
  // observed in the trusted parent without enabling scripts in authored HTML.
  function createControl(marker, action) {
    const control = doc.createElement('details'), toggle = doc.createElement('summary');
    control.dataset.hubSheetControl = ''; control.dataset.noPrint = '';
    toggle.dataset[marker] = ''; toggle.setAttribute('role', 'button');
    control.append(toggle); controls.set(control, action);
    return { control, toggle };
  }
  const observer = new MutationObserver(records => {
    if (disposed) return;
    let changed = false;
    for (const { target } of records) {
      const action = controls.get(target);
      if (action) { action(target.open); changed = true; }
    }
    if (changed) render();
  });
  const observe = () => observer.observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  const text = (th, en) => currentLanguage === 'en' ? en : th;
  const toolbar = doc.createElement('section');
  toolbar.dataset.hubSheetToolbar = ''; toolbar.dataset.noPrint = '';
  const title = doc.createElement('strong'), note = doc.createElement('p');
  const actions = doc.createElement('div');
  const showAll = createControl('hubSheetCommand', open => { if (open) entries.forEach(entry => shown.add(entry.slot.dataset.sheetSlot)); });
  const hideAll = createControl('hubSheetCommand', open => { if (open) shown.clear(); });
  const status = doc.createElement('span'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  actions.append(showAll.control, hideAll.control); toolbar.append(title, note, actions, status);

  for (const [index, slot] of [...doc.querySelectorAll('[data-sheet-slot]')].entries()) {
    const answer = [...slot.children].find(node => node.hasAttribute('data-sheet-answer'));
    const placeholder = [...slot.children].find(node => node.hasAttribute('data-sheet-placeholder'));
    const originalId = answer.getAttribute('id');
    const originalAria = answer.getAttribute('aria-hidden');
    let id = originalId || `hub-sheet-answer-${index + 1}`;
    while (!originalId && doc.getElementById(id)) id += '-slot';
    answer.id = id;
    const { control, toggle } = createControl('hubSheetToggle', open => {
      const key = slot.dataset.sheetSlot;
      open ? shown.add(key) : shown.delete(key);
    });
    toggle.setAttribute('aria-controls', id);
    slot.append(control);
    entries.push({ slot, answer, placeholder, control, toggle, originalId, originalAria,
      placeholderAria: placeholder?.getAttribute('aria-hidden') ?? null });
  }
  function render() {
    if (disposed) return;
    // Do not interpret mirrored TH/EN state or command resets as user actions.
    observer.disconnect();
    title.textContent = text('ใบเรียนรู้', 'Learning sheet');
    note.textContent = text('เปิดคำตอบทบทวนได้ทุกเมื่อ • เลือกพิมพ์ฉบับว่างหรือฉบับเฉลยได้จากปุ่มพิมพ์ / PDF', 'Reveal answers any time • Use Print / PDF to choose a blank or answer edition');
    showAll.toggle.textContent = text('เปิดทั้งหมด', 'Reveal all');
    hideAll.toggle.textContent = text('ปิดทั้งหมด', 'Hide all');
    showAll.control.open = false; hideAll.control.open = false;
    const total = new Set(entries.map(entry => entry.slot.dataset.sheetSlot)).size;
    status.textContent = text(`เปิดแล้ว ${shown.size} / ${total} ช่อง`, `${shown.size} / ${total} answers revealed`);
    for (const { slot, answer, placeholder, control, toggle } of entries) {
      const open = shown.has(slot.dataset.sheetSlot);
      control.open = open;
      slot.dataset.hubSheetOpen = String(open);
      answer.setAttribute('aria-hidden', String(!open)); answer.inert = !open;
      if (placeholder) placeholder.setAttribute('aria-hidden', 'true');
      toggle.textContent = open ? '−' : '+';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', `${open ? text('ปิดคำตอบ', 'Hide answer') : text('เปิดคำตอบ', 'Reveal answer')}: ${slot.getAttribute(`data-sheet-label-${currentLanguage}`)}`);
      toggle.title = toggle.getAttribute('aria-label');
    }
    observe();
  }
  render();
  doc.body.prepend(toolbar);
  doc.documentElement.dataset.hubSheetReady = '';
  const controller = {
    setLanguage(value) { currentLanguage = value === 'en' ? 'en' : 'th'; render(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect(); controls.clear();
      for (const { slot, answer, placeholder, placeholderAria, control, originalId, originalAria } of entries) {
        control.remove();
        delete slot.dataset.hubSheetOpen; answer.inert = false;
        if (originalId === null) answer.removeAttribute('id');
        if (originalAria === null) answer.removeAttribute('aria-hidden'); else answer.setAttribute('aria-hidden', originalAria);
        if (placeholder) {
          if (placeholderAria === null) placeholder.removeAttribute('aria-hidden'); else placeholder.setAttribute('aria-hidden', placeholderAria);
        }
      }
      toolbar.remove(); delete doc.documentElement.dataset.hubSheetReady; controllers.delete(doc);
    },
  };
  controllers.set(doc, controller);
  return controller;
}
