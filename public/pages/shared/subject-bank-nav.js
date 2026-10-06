import { bankClient } from '../../shared/question-bank-client.js';
import { bankSubjects } from '../../shared/question-bank-model.js';
import { questionBankTools } from '../../shared/question-bank-config.js';

export function createSubjectBankNavigation({ root, subject, setStage, requestNavigation, backToChapters }) {
  if (!Object.hasOwn(bankSubjects, subject.id)) return null;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('subject-bank.css', import.meta.url); document.head.append(css);
  const launch = document.createElement('button'); launch.type = 'button'; launch.className = 'bank-entry surface';
  launch.innerHTML = '<span class="bank-entry-icon" aria-hidden="true">▤</span><span><strong></strong><small></small></span><b aria-hidden="true">→</b>';
  const localize = (node, th, en) => { node.dataset.th = th; node.dataset.en = en || th;
    node.textContent = document.documentElement.lang === 'en' ? node.dataset.en : th; };
  localize(launch.querySelector('strong'), `คลังข้อสอบ${subject.titleTh}`, `${subject.titleEn} question bank`);
  localize(launch.querySelector('small'), 'ค้นหาชุดข้อสอบ เปิดเครื่องมือ และพิมพ์ใบงาน', 'Find a question set, open tools and print worksheets');
  root.querySelector('#chapter-view .section-intro').after(launch);
  launch.onclick = () => requestNavigation({ bank: true });
  const panel = document.createElement('section'); panel.className = 'bank-view activity-view'; panel.hidden = true;
  panel.innerHTML = `<nav class="content-breadcrumb" aria-label="เส้นทางคลังข้อสอบ / Bank path"></nav>
    <header class="activity-heading surface"><button type="button" class="back-button" data-bank-back></button>
    <div><small class="eyebrow" data-bank-layer></small><h2 tabindex="-1" data-bank-title></h2><p data-bank-description></p></div></header>
    <div class="bank-controls"><label><span data-bank-search-label></span><input type="search" data-bank-search maxlength="200" autocomplete="off"></label>
    <button type="button" class="back-button" data-bank-refresh></button></div>
    <p class="content-menu-notice" data-bank-notice role="status" aria-live="polite"></p>
    <div class="activity-grid" data-bank-cards></div><details data-bank-id hidden><summary></summary><p data-allow-selection></p></details>`;
  root.append(panel);
  const cards = panel.querySelector('[data-bank-cards]'), notice = panel.querySelector('[data-bank-notice]');
  const search = panel.querySelector('[data-bank-search]'), refresh = panel.querySelector('[data-bank-refresh]');
  let catalog = null, currentKey = null, request = 0;
  localize(panel.querySelector('[data-bank-search-label]'), 'ค้นหาชื่อหรือ ID', 'Search name or ID');
  localize(refresh, 'รีเฟรชคลัง', 'Refresh bank');
  panel.querySelector('[data-bank-id] summary').textContent = 'ID';
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
    localize(panel.querySelector('[data-bank-title]'), set?.title || `คลังข้อสอบ${subject.titleTh}`, set?.title || `${subject.titleEn} question bank`);
    panel.querySelector('.bank-controls label').hidden = Boolean(currentKey);
    panel.querySelector('[data-bank-id]').hidden = !set;
    if (set) panel.querySelector('[data-bank-id] p').textContent = set.legacyId;
    setStage(currentKey ? 3 : 2);
    if (currentKey && !set) {
      status('ไม่พบชุดนี้ หรือครูยังไม่ได้เปิดให้ใช้งาน', 'This set was not found or has not been published.', true); return;
    }
    if (set) {
      localize(panel.querySelector('[data-bank-description]'), set.path.join(' › '), set.path.join(' › '));
      const open = key => requestNavigation({ bank: true, bankKey: currentKey, toolKey: key });
      card({ title: ['แสดงข้อสอบ', 'Open quiz'], detail: set.questionCount ? [`${set.questionCount} ข้อ · ทำต่อและพิมพ์ได้`, `${set.questionCount} questions · Resume and print`]
        : ['ยังไม่มีข้อสอบที่รองรับ', 'No supported questions yet'], icon: '✓', disabled: !set.questionCount, action: () => open('quiz') });
      card({ title: ['สมุดบันทึก', 'Notebook'], detail: ['จดสรุปและเขียนประกอบชุดนี้', 'Write notes for this set'], icon: '▱', action: () => open('notebook') });
      for (const tool of questionBankTools[`${subject.id}/${set.bankKey}`] || []) {
        if (!/^[a-z][a-z0-9-]{0,63}$/.test(tool.key || '') || ['quiz', 'notebook'].includes(tool.key)) continue;
        card({ title: [tool.titleTh || tool.key, tool.titleEn || tool.titleTh || tool.key], detail: ['เปิดเครื่องมือ', 'Open tool'], action: () => open(tool.key) });
      }
      status('งานที่เซฟไว้จะเปิดพร้อมโจทย์รุ่นเดิม', 'Saved work resumes with its original question version.');
    } else {
      localize(panel.querySelector('[data-bank-description]'), 'เลือกชุดเพื่อเปิดข้อสอบและเครื่องมือประกอบ', 'Choose a set to open its quiz and tools');
      const term = search.value.trim().toLocaleLowerCase();
      const matches = catalog.sets.filter(set => `${set.title} ${set.legacyId} ${set.path.join(' ')}`.toLocaleLowerCase().includes(term));
      for (const entry of matches) card({ title: [entry.title, entry.title], detail: [entry.path.join(' › '), entry.path.join(' › ')],
        action: () => requestNavigation({ bank: true, bankKey: entry.bankKey }) });
      status(!catalog.sets.length ? 'ยังไม่มีชุดข้อสอบที่เปิดให้ใช้งาน' : !matches.length ? 'ไม่พบรายการที่ค้นหา' : `พบ ${matches.length} ชุด`,
        !catalog.sets.length ? 'No published sets yet.' : !matches.length ? 'No matching sets.' : `${matches.length} sets`);
    }
  }
  async function open(bankKey = null, force = false) {
    const version = ++request; currentKey = bankKey; panel.hidden = false; cards.replaceChildren();
    refresh.disabled = true; search.disabled = true;
    status('กำลังโหลดคลังข้อสอบ…', 'Loading question bank…');
    try {
      const value = await bankClient.catalog(subject.id, { force });
      if (version !== request) return false;
      catalog = value; render(); panel.querySelector('[data-bank-title]').focus({ preventScroll: true }); return true;
    } catch (error) {
      if (version !== request) return false;
      catalog = null;
      localize(panel.querySelector('[data-bank-title]'), `คลังข้อสอบ${subject.titleTh}`, `${subject.titleEn} question bank`);
      localize(panel.querySelector('[data-bank-back]'), '← กลับหน้าวิชา', '← Back to subject');
      status(error.message, error.message, true); return true; // A useful retry page, not an unrelated chapter fallback.
    } finally { if (version === request) { refresh.disabled = false; search.disabled = false; } }
  }
  panel.querySelector('[data-bank-back]').onclick = () => currentKey && catalog
    ? requestNavigation({ bank: true }) : backToChapters();
  search.addEventListener('input', render);
  refresh.onclick = () => void open(currentKey, true);
  return { open, hide() { ++request; panel.hidden = true; }, panel };
}
