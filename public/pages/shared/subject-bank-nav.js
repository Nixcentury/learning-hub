import { bankClient } from '../../shared/question-bank-client.js';
import { bankSubjects } from '../../shared/question-bank-model.js';
import { questionBankTools } from '../../shared/question-bank-config.js';
import { authoredBankTools } from '../../shared/question-bank-authored.js?v=bank-html-20261021';
import { readMenuCatalog } from './menu-availability.js';
import { BANK_ALL_CHAPTERS, BANK_OTHER_CHAPTER, bankChapterKey, bankChapters, filterBankSets, bankTitlePair } from '../../shared/question-bank-menu.js';

export function createSubjectBankNavigation({ root, subject, setStage, requestNavigation, backToChapters }) {
  if (!Object.hasOwn(bankSubjects, subject.id)) return null;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('subject-bank.css?v=bank-html-20261021', import.meta.url); document.head.append(css);
  const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'bank-entry surface';
  launch.innerHTML = '<span class="bank-entry-icon" aria-hidden="true">▤</span><span><strong></strong><small></small></span><b aria-hidden="true">→</b>';
  const localize = (node, th, en) => { node.dataset.th = th; node.dataset.en = en || th;
    node.textContent = document.documentElement.lang === 'en' ? node.dataset.en : th; };
  localize(launch.querySelector('strong'), `คลังข้อสอบ${subject.titleTh}`, `${subject.titleEn} question bank`);
  localize(launch.querySelector('small'), 'เลือกบท ค้นหาหัวข้อ และเปิดเครื่องมือ', 'Choose a chapter, find a topic and open tools');
  root.querySelector('#chapter-view .section-intro').after(launch);
  launch.onclick = () => requestNavigation({ bank: true });
  const panel = document.createElement('section'); panel.className = 'bank-view activity-view'; panel.hidden = true;
  panel.innerHTML = `<nav class="content-breadcrumb" aria-label="เส้นทางคลังข้อสอบ / Bank path"></nav>
    <header class="activity-heading surface"><button type="button" class="back-button" data-bank-back></button>
    <div><small class="eyebrow" data-bank-layer></small><h2 tabindex="-1" data-bank-title></h2><p data-bank-description></p></div></header>
    <div class="bank-controls"><label class="bank-chapter-control"><span data-bank-chapter-label></span><select data-bank-chapter></select></label>
    <label><span data-bank-search-label></span><input type="search" data-bank-search maxlength="200" autocomplete="off"></label>
    <button type="button" class="back-button" data-bank-refresh></button></div>
    <p class="content-menu-notice" data-bank-notice role="status" aria-live="polite"></p>
    <div class="activity-grid" data-bank-cards></div><details data-bank-id hidden><summary></summary><p data-allow-selection></p></details>`;
  root.append(panel);
  const cards = panel.querySelector('[data-bank-cards]'), notice = panel.querySelector('[data-bank-notice]');
  const search = panel.querySelector('[data-bank-search]'), refresh = panel.querySelector('[data-bank-refresh]');
  const chapter = panel.querySelector('[data-bank-chapter]');
  const storageKey = `learning-hub:bank-menu:${subject.id}`;
  let selectedChapter = '';
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (typeof saved?.chapter === 'string' && saved.chapter.length <= 2100) selectedChapter = saved.chapter;
    if (typeof saved?.query === 'string') search.value = saved.query.slice(0, 200);
  } catch { /* Filters still work when session storage is unavailable. */ }
  function rememberFilters() {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ chapter: selectedChapter, query: search.value })); } catch { /* Optional session preference. */ }
  }
  let catalog = null, toolsCatalog = null, toolsState = 'idle', currentKey = null, request = 0;
  localize(panel.querySelector('[data-bank-chapter-label]'), 'เลือกบท', 'Choose chapter');
  localize(refresh, 'รีเฟรชคลัง', 'Refresh bank');
  panel.querySelector('[data-bank-id] summary').textContent = 'ID';
  function updateChapters() {
    const chapters = bankChapters(catalog.sets);
    if (selectedChapter !== BANK_ALL_CHAPTERS && !chapters.some(entry => entry.key === selectedChapter)) selectedChapter = '';
    chapter.replaceChildren();
    const option = (value, th, en) => {
      const node = document.createElement('option'); node.value = value; localize(node, th, en); chapter.append(node);
    };
    option('', `เลือกบท (${chapters.length} บท)`, `Choose a chapter (${chapters.length})`);
    option(BANK_ALL_CHAPTERS, 'ทุกบท · ค้นหาทั้งคลัง', 'All chapters · Search the bank');
    chapters.forEach((entry, index) => {
      const [th, en] = entry.key === BANK_OTHER_CHAPTER ? ['หัวข้ออื่น ๆ', 'Other topics'] : bankTitlePair(entry.title);
      option(entry.key, `${index + 1}. ${th} · ${entry.count} หัวข้อ`, `${index + 1}. ${en} · ${entry.count} topics`);
    });
    chapter.value = selectedChapter;
    rememberFilters();
  }
  function status(th, en, error = false) { localize(notice, th, en); notice.classList.toggle('is-error', error); }
  function card({ title, detail, icon = '▤', action, disabled = false }) {
    const node = document.createElement('button'); node.type = 'button'; node.className = 'activity-card bank-card'; node.disabled = disabled;
    node.innerHTML = '<span class="activity-icon" aria-hidden="true"></span><span class="activity-copy"><strong></strong><span></span></span><b aria-hidden="true">→</b>';
    node.querySelector('.activity-icon').textContent = icon;
    localize(node.querySelector('strong'), ...title); localize(node.querySelector('.activity-copy > span'), ...detail);
    node.onclick = action; cards.append(node);
  }
  function render() {
    cards.replaceChildren();
    if (!catalog) return;
    const set = currentKey && catalog.sets.find(entry => entry.bankKey === currentKey);
    const crumbs = panel.querySelector('nav'); crumbs.replaceChildren();
    const subjectButton = document.createElement('button'); subjectButton.type = 'button'; localize(subjectButton, subject.titleTh, subject.titleEn);
    subjectButton.onclick = backToChapters; crumbs.append(subjectButton);
    const bankButton = document.createElement('button'); bankButton.type = 'button'; localize(bankButton, 'คลังข้อสอบ', 'Question bank');
    bankButton.onclick = () => requestNavigation({ bank: true }); crumbs.append(bankButton);
    localize(panel.querySelector('[data-bank-back]'), currentKey ? '← กลับคลังข้อสอบ' : '← กลับหน้าวิชา', currentKey ? '← Back to bank' : '← Back to subject');
    localize(panel.querySelector('[data-bank-layer]'), currentKey ? 'ชั้นที่ 3 · เครื่องมือ' : 'ชั้นที่ 2 · เลือกชุดข้อสอบ', currentKey ? 'Layer 3 · Tools' : 'Layer 2 · Question sets');
    const title = set ? bankTitlePair(set.title) : [`คลังข้อสอบ${subject.titleTh}`, `${subject.titleEn} question bank`];
    localize(panel.querySelector('[data-bank-title]'), ...title);
    panel.querySelectorAll('.bank-controls label').forEach(node => { node.hidden = Boolean(currentKey); });
    const allChapters = selectedChapter === BANK_ALL_CHAPTERS;
    localize(panel.querySelector('[data-bank-search-label]'), allChapters ? 'ค้นหาทุกบท' : 'ค้นหาในบทนี้', allChapters ? 'Search all chapters' : 'Search this chapter');
    search.placeholder = document.documentElement.lang === 'en' ? 'Topic name or ID' : 'ชื่อหัวข้อหรือ ID';
    search.disabled = !selectedChapter;
    panel.querySelector('[data-bank-id]').hidden = !set;
    if (set) panel.querySelector('[data-bank-id] p').replaceChildren(
      set.legacyId, document.createElement('br'), `bankKey: ${set.bankKey}`);
    setStage(currentKey ? 3 : 2);
    if (currentKey && !set) {
      status('ไม่พบชุดนี้ หรือครูยังไม่ได้เปิดให้ใช้งาน', 'This set was not found or has not been published.', true); return;
    }
    if (set) {
      localize(panel.querySelector('[data-bank-description]'), ...[0, 1].map(language => set.path.map(part => bankTitlePair(part)[language]).join(' › ')));
      const open = key => requestNavigation({ bank: true, bankKey: currentKey, toolKey: key });
      card({ title: ['แสดงข้อสอบ', 'Open quiz'], detail: set.questionCount ? [`${set.questionCount} ข้อ · ทำต่อและพิมพ์ได้`, `${set.questionCount} questions · Resume and print`]
        : ['ยังไม่มีข้อสอบที่รองรับ', 'No supported questions yet'], icon: '✓', disabled: !set.questionCount, action: () => open('quiz') });
      card({ title: ['สมุดบันทึก', 'Notebook'], detail: ['จดสรุปและเขียนประกอบชุดนี้', 'Write notes for this set'], icon: '▱', action: () => open('notebook') });
      for (const tool of questionBankTools[`${subject.id}/${set.bankKey}`] || []) {
        if (!/^[a-z][a-z0-9-]{0,63}$/.test(tool.key || '') || ['quiz', 'notebook'].includes(tool.key)) continue;
        card({ title: [tool.titleTh || tool.key, tool.titleEn || tool.titleTh || tool.key], detail: ['เปิดเครื่องมือ', 'Open tool'], action: () => open(tool.key) });
      }
      for (const tool of authoredBankTools(toolsCatalog, subject.id, set.bankKey)) {
        const preparing = tool.status !== 'ready';
        card({ title: [tool.titleTh || tool.key, tool.titleEn || tool.titleTh || tool.key],
          detail: preparing ? ['กำลังเตรียมเนื้อหา', 'Content in preparation'] :
            [tool.descriptionTh || 'เปิดเครื่องมือ', tool.descriptionEn || tool.descriptionTh || 'Open tool'],
          icon: tool.toolKind === 'quiz' ? '✓' : tool.toolKind === 'simulation' ? '◉' : '▤',
          disabled: preparing, action: () => open(tool.key) });
      }
      status(toolsState === 'unavailable'
        ? 'งานที่เซฟไว้จะเปิดพร้อมโจทย์รุ่นเดิม · โหลดรายการสื่อเสริมไม่ได้ ลองรีเฟรชคลัง'
        : toolsState === 'loading' ? 'งานที่เซฟไว้จะเปิดพร้อมโจทย์รุ่นเดิม · กำลังโหลดสื่อเสริม…'
          : 'งานที่เซฟไว้จะเปิดพร้อมโจทย์รุ่นเดิม',
        toolsState === 'unavailable'
          ? 'Saved work resumes with its original question version. Extra tools could not load; refresh the bank.'
          : toolsState === 'loading' ? 'Saved work resumes with its original question version. Loading extra tools…'
            : 'Saved work resumes with its original question version.');
    } else {
      const chapters = bankChapters(catalog.sets);
      const selected = chapters.find(entry => entry.key === selectedChapter);
      const [chapterTh, chapterEn] = selected?.title ? bankTitlePair(selected.title) : ['หัวข้ออื่น ๆ', 'Other topics'];
      localize(panel.querySelector('[data-bank-description]'), selected ? chapterTh : 'เลือกบท แล้วเลือกหัวข้อเพื่อเปิดข้อสอบและเครื่องมือ', selected ? chapterEn : 'Choose a chapter, then a topic to open its quiz and tools');
      const term = search.value.trim().toLocaleLowerCase();
      const matches = filterBankSets(catalog.sets, selectedChapter, term);
      for (const entry of matches) {
        const chapterTitle = entry.path.length >= 4 ? bankTitlePair(entry.path[2]) : ['หัวข้ออื่น ๆ', 'Other topics'];
        const detail = entry.questionCount ? [`${entry.questionCount} ข้อ · เปิดเครื่องมือ`, `${entry.questionCount} questions · Open tools`]
          : ['ยังไม่มีข้อสอบ · เปิดเครื่องมือ', 'No questions yet · Open tools'];
        card({ title: bankTitlePair(entry.title), detail: detail.map((text, index) => allChapters ? `${chapterTitle[index]} · ${text}` : text),
          action: () => requestNavigation({ bank: true, bankKey: entry.bankKey }) });
      }
      if (!catalog.sets.length) status('ยังไม่มีชุดข้อสอบที่เปิดให้ใช้งาน', 'No published sets yet.');
      else if (!selectedChapter) status(`เลือกบทเพื่อดูหัวข้อ · ${chapters.length} บท · ${catalog.sets.length} หัวข้อ`, `Choose a chapter · ${chapters.length} chapters · ${catalog.sets.length} topics`);
      else if (allChapters && !term) status('พิมพ์ชื่อหัวข้อหรือ ID เพื่อค้นหาทุกบท', 'Enter a topic name or ID to search all chapters.');
      else status(matches.length ? `พบ ${matches.length} หัวข้อ` : 'ไม่พบหัวข้อที่ค้นหา', matches.length ? `${matches.length} topics` : 'No matching topics.');
    }
  }
  async function open(bankKey = null, force = false) {
    const version = ++request; currentKey = bankKey; panel.hidden = false; cards.replaceChildren();
    refresh.disabled = true; search.disabled = true; chapter.disabled = true;
    status('กำลังโหลดคลังข้อสอบ…', 'Loading question bank…');
    try {
      // Failure of the optional media catalog must not disable the Sheet bank.
      // Bound this request independently so extra tools cannot hang Open quiz.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      let sheetReady = false;
      toolsCatalog = null; toolsState = 'loading';
      void readMenuCatalog(new URL('../../route-catalog.v1.json', import.meta.url),
        { signal: controller.signal }).catch(() => null).finally(() => clearTimeout(timer)).then(authored => {
          if (version !== request) return;
          toolsCatalog = authored; toolsState = authored ? 'ready' : 'unavailable';
          if (sheetReady) render();
        });
      // Do not await the optional catalog: the original Quiz/Notebook can open
      // as soon as the live Sheet returns, even when media loading is offline.
      const value = await bankClient.catalog(subject.id, { force });
      if (version !== request) return false;
      catalog = value; sheetReady = true;
      if (currentKey && !selectedChapter) {
        const set = catalog.sets.find(entry => entry.bankKey === currentKey);
        if (set) selectedChapter = bankChapterKey(set);
      }
      updateChapters(); render(); panel.querySelector('[data-bank-title]').focus({ preventScroll: true }); return true;
    } catch (error) {
      if (version !== request) return false;
      catalog = null;
      localize(panel.querySelector('[data-bank-title]'), `คลังข้อสอบ${subject.titleTh}`, `${subject.titleEn} question bank`);
      localize(panel.querySelector('[data-bank-back]'), '← กลับหน้าวิชา', '← Back to subject');
      status(error.message, error.message, true); return true; // A useful retry page, not an unrelated chapter fallback.
    } finally { if (version === request) { refresh.disabled = false; chapter.disabled = !catalog; search.disabled = !catalog || !selectedChapter; } }
  }
  panel.querySelector('[data-bank-back]').onclick = () => currentKey && catalog
    ? requestNavigation({ bank: true }) : backToChapters();
  chapter.addEventListener('change', () => { selectedChapter = chapter.value; search.value = ''; rememberFilters(); render(); });
  search.addEventListener('input', () => { rememberFilters(); render(); });
  document.addEventListener('hub-page-context', () => { if (catalog && !panel.hidden) render(); });
  refresh.onclick = () => void open(currentKey, true);
  return { open, hide() { ++request; panel.hidden = true; }, panel };
}
