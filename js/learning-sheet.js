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
    const loaded = () => finish();
    const failed = () => finish(new Error('Learning sheet styles unavailable'));
    function finish(error) {
      clearTimeout(timer);
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
  const text = (th, en) => currentLanguage === 'en' ? en : th;
  const toolbar = doc.createElement('section');
  toolbar.dataset.hubSheetToolbar = ''; toolbar.dataset.noPrint = '';
  const title = doc.createElement('strong'), note = doc.createElement('p');
  const actions = doc.createElement('div'), showAll = doc.createElement('button'), hideAll = doc.createElement('button');
  const status = doc.createElement('span'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  for (const button of [showAll, hideAll]) button.type = 'button';
  actions.append(showAll, hideAll); toolbar.append(title, note, actions, status);

  for (const [index, slot] of [...doc.querySelectorAll('[data-sheet-slot]')].entries()) {
    const answer = [...slot.children].find(node => node.hasAttribute('data-sheet-answer'));
    const placeholder = [...slot.children].find(node => node.hasAttribute('data-sheet-placeholder'));
    const originalId = answer.getAttribute('id');
    const originalAria = answer.getAttribute('aria-hidden');
    let id = originalId || `hub-sheet-answer-${index + 1}`;
    while (!originalId && doc.getElementById(id)) id += '-slot';
    answer.id = id;
    const toggle = doc.createElement('button');
    toggle.type = 'button'; toggle.dataset.hubSheetToggle = ''; toggle.dataset.noPrint = '';
    toggle.setAttribute('aria-controls', id);
    const listener = () => { const key = slot.dataset.sheetSlot; shown.has(key) ? shown.delete(key) : shown.add(key); render(); };
    toggle.addEventListener('click', listener);
    slot.append(toggle);
    entries.push({ slot, answer, placeholder, toggle, listener, originalId, originalAria,
      placeholderAria: placeholder?.getAttribute('aria-hidden') ?? null });
  }
  function render() {
    if (disposed) return;
    title.textContent = text('ใบเรียนรู้', 'Learning sheet');
    note.textContent = text('เปิดคำตอบทบทวนได้ทุกเมื่อ • เลือกพิมพ์ฉบับว่างหรือฉบับเฉลยได้จากปุ่มพิมพ์ / PDF', 'Reveal answers any time • Use Print / PDF to choose a blank or answer edition');
    showAll.textContent = text('เปิดทั้งหมด', 'Reveal all');
    hideAll.textContent = text('ปิดทั้งหมด', 'Hide all');
    const total = new Set(entries.map(entry => entry.slot.dataset.sheetSlot)).size;
    status.textContent = text(`เปิดแล้ว ${shown.size} / ${total} ช่อง`, `${shown.size} / ${total} answers revealed`);
    for (const { slot, answer, placeholder, toggle } of entries) {
      const open = shown.has(slot.dataset.sheetSlot);
      slot.dataset.hubSheetOpen = String(open);
      answer.setAttribute('aria-hidden', String(!open)); answer.inert = !open;
      if (placeholder) placeholder.setAttribute('aria-hidden', 'true');
      toggle.textContent = open ? '−' : '+';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', `${open ? text('ปิดคำตอบ', 'Hide answer') : text('เปิดคำตอบ', 'Reveal answer')}: ${slot.getAttribute(`data-sheet-label-${currentLanguage}`)}`);
      toggle.title = toggle.getAttribute('aria-label');
    }
  }
  const reveal = () => { entries.forEach(entry => shown.add(entry.slot.dataset.sheetSlot)); render(); };
  const hide = () => { shown.clear(); render(); };
  showAll.addEventListener('click', reveal); hideAll.addEventListener('click', hide);
  render();
  doc.body.prepend(toolbar);
  doc.documentElement.dataset.hubSheetReady = '';
  const controller = {
    setLanguage(value) { currentLanguage = value === 'en' ? 'en' : 'th'; render(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      showAll.removeEventListener('click', reveal); hideAll.removeEventListener('click', hide);
      for (const { slot, answer, placeholder, placeholderAria, toggle, listener, originalId, originalAria } of entries) {
        toggle.removeEventListener('click', listener); toggle.remove();
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
