import { bankClient } from './question-bank-client.js';
import { bankSubjects } from './question-bank-model.js';
import { reviewTopics, bankChapters, bankTitlePair, preferredReviewTopic, reviewContentUrl, reviewDocument } from './topic-review-model.js?v=review-answers-20261023-1';

const siteUrl = new URL('../', import.meta.url);
let reviewInstance = 0;

export function createTopicReviewBrowser({ root, content, printButton, language = () => document.documentElement.lang,
  client = bankClient, fetcher = (...args) => fetch(...args), Parser = DOMParser, onChange = () => {},
  typeset = async node => {
    await window.MathJax?.startup?.promise;
    if (node.isConnected) await window.MathJax?.typesetPromise?.([node]);
  } }) {
  const doc = root.ownerDocument;
  const text = (th, en) => language() === 'en' ? en : th;
  let subjectId = '', catalog = null, authored = null, topics = [], selected = '', chapter = '', version = 0, controller;
  let lastPreferred = [], opened = false, printing = false;
  let answers = [];
  const instance = ++reviewInstance;
  root.classList.add('topic-review-browser');
  root.innerHTML = `<p class="review-help" data-review-help></p><div class="review-controls">
    <label><span data-review-subject-label></span><select data-review-subject></select></label>
    <label><span data-review-chapter-label></span><select data-review-chapter></select></label>
    <label class="review-topic-control"><span data-review-topic-label></span><select data-review-topic></select></label>
    </div><p class="review-status" data-review-status role="status" aria-live="polite"></p>
    <button type="button" class="quiz-quiet-button" data-review-retry hidden></button>
    <div class="review-answer-tools" data-review-answer-tools hidden>
      <button type="button" class="review-answer-toggle" data-review-answers-toggle aria-expanded="false"></button>
      <span data-review-print-help></span>
    </div>`;
  const subject = root.querySelector('[data-review-subject]'), chapters = root.querySelector('[data-review-chapter]');
  const topic = root.querySelector('[data-review-topic]'), status = root.querySelector('[data-review-status]'), retry = root.querySelector('[data-review-retry]');
  const answerTools = root.querySelector('[data-review-answer-tools]'), answerToggle = root.querySelector('[data-review-answers-toggle]');

  function answerControls() {
    answerTools.hidden = !answers.length;
    const allOpen = answers.length > 0 && answers.every(item => !item.answer.hidden);
    answerToggle.textContent = allOpen ? text('ซ่อนเฉลยทั้งหมด', 'Hide all answers') : text('เปิดเฉลยทั้งหมด', 'Show all answers');
    answerToggle.setAttribute('aria-expanded', String(allOpen));
    answerToggle.setAttribute('aria-controls', answers.map(item => item.answer.id).join(' '));
    answerToggle.disabled = printing;
    root.querySelector('[data-review-print-help]').textContent = text('พิมพ์ตามที่เปิดอยู่ · ซ่อนเฉลยเพื่อพิมพ์ฉบับนักเรียน', 'Print what is shown · Hide answers for a student copy');
    for (const { answer, blanks, button } of answers) {
      blanks.forEach(blank => { blank.hidden = !answer.hidden; });
      button.textContent = answer.hidden ? text('เปิดเฉลย', 'Show answer') : text('ซ่อนเฉลย', 'Hide answer');
      button.setAttribute('aria-expanded', String(!answer.hidden));
      button.disabled = printing;
    }
  }
  function setupAnswers() {
    answers = [];
    content.querySelectorAll('[data-review-question]').forEach((question, index) => {
      const answer = question.querySelector('[data-review-answer]');
      if (!answer) return;
      answer.id = `review-answer-${instance}-${index}`;
      answer.hidden = true;
      const button = doc.createElement('button');
      button.type = 'button'; button.className = 'review-answer-toggle';
      button.setAttribute('data-review-answer-toggle', '');
      button.setAttribute('aria-controls', answer.id);
      const heading = question.querySelector('h3, h4');
      if (heading) heading.after(button); else question.prepend(button);
      const entry = { answer, button, blanks: [...question.querySelectorAll('[data-review-blank]')] };
      answers.push(entry);
      button.addEventListener('click', () => {
        if (printing) return;
        answer.hidden = !answer.hidden; answerControls();
      });
    });
    answerControls();
  }

  function option(select, value, title) { const item = doc.createElement('option'); item.value = value; item.textContent = title; select.append(item); }
  function message(title, detail = '') {
    answers = []; answerControls();
    window.MathJax?.typesetClear?.([content]);
    content.replaceChildren();
    const heading = doc.createElement('h2'); heading.textContent = title; content.append(heading);
    if (detail) { const p = doc.createElement('p'); p.textContent = detail; content.append(p); }
  }
  function selectedTopic() { return topics.find(item => item.bankKey === selected); }
  function localizedTitle(item) { return item.titlePair[language() === 'en' ? 1 : 0]; }
  function setPrint(enabled) { if (printButton) printButton.disabled = !enabled || printing; }
  function labels() {
    root.querySelector('[data-review-help]').textContent = text('ข้อเดียวอาจใช้หลายเรื่อง เลือกบทและหัวข้ออื่นเพื่อทวนต่อได้', 'A question may use several topics. Choose another chapter or topic to review.');
    for (const [key, th, en] of [['subject', 'วิชา', 'Subject'], ['chapter', 'เลือกบท', 'Chapter'], ['topic', 'หัวข้อที่ต้องการทวน', 'Review topic']])
      root.querySelector(`[data-review-${key}-label]`).textContent = text(th, en);
    retry.textContent = text('ลองโหลดอีกครั้ง', 'Try again');
    subject.replaceChildren(); option(subject, '', text('เลือกวิชา', 'Choose a subject'));
    Object.entries(bankSubjects).forEach(([key, value]) => option(subject, key, text(value.th, value.en)));
    subject.value = subjectId;
  }
  function controls() {
    labels(); chapters.replaceChildren(); topic.replaceChildren();
    option(chapters, '', text('ทุกบท', 'All chapters'));
    bankChapters(catalog?.sets || []).forEach(item => option(chapters, item.key, bankTitlePair(item.title)[language() === 'en' ? 1 : 0]));
    chapters.value = chapter;
    option(topic, '', text('เลือกหัวข้อเพื่อทวน', 'Choose a review topic'));
    const matches = topics.filter(item => !chapter || item.chapterKey === chapter);
    for (const item of matches) {
      const prefix = !chapter && item.path[2] ? `${bankTitlePair(item.path[2])[language() === 'en' ? 1 : 0]} · ` : '';
      option(topic, item.bankKey, `${prefix}${localizedTitle(item)}${item.source ? '' : text(' · กำลังเตรียม', ' · In preparation')}`);
    }
    topic.value = selected;
    chapters.disabled = topic.disabled = !catalog || printing;
    subject.disabled = printing;
  }
  async function read(url, signal, json = false) {
    const response = await fetcher(url.href, { cache: 'no-cache', credentials: 'omit', signal });
    if (!response.ok || response.redirected) throw Error('Review unavailable');
    const body = await response.text();
    if (body.length > 1_000_000) throw Error('Review too large');
    return json ? JSON.parse(body) : body;
  }
  async function showTopic() {
    const token = ++version;
    controller?.abort(); controller = new AbortController();
    const requestController = controller;
    retry.hidden = true;
    const item = selectedTopic(); setPrint(false);
    if (!item) { status.textContent = ''; message(text('เลือกหัวข้อที่ต้องการทวน', 'Choose a topic to review'), text('เลือกได้ทั้งเรื่องในบทนี้และบทอื่น ๆ', 'You can review topics from this chapter or another chapter.')); onChange(null); return; }
    onChange({ subjectId, bankKey: selected, title: localizedTitle(item) });
    status.textContent = item.path.slice(2).map(value => bankTitlePair(value)[language() === 'en' ? 1 : 0]).join(' › ');
    if (!authored) {
      message(localizedTitle(item), text('ยังตรวจสถานะบททวนไม่ได้ กรุณาลองโหลดอีกครั้ง', 'Review availability could not load. Please retry.'));
      retry.hidden = false; return;
    }
    if (!item.source) {
      message(localizedTitle(item), text('กำลังเตรียมเนื้อหา · เลือกทวนหัวข้ออื่นต่อได้', 'Content is being prepared. You can choose another topic.'));
      setPrint(true); return;
    }
    message(text('กำลังโหลดเนื้อหา…', 'Loading review…'));
    const timer = setTimeout(() => requestController.abort(), 12_000);
    try {
      const url = reviewContentUrl(item.source, siteUrl);
      const html = await read(url, requestController.signal);
      if (token !== version) return;
      const body = reviewDocument(html, url, { document: doc, Parser, language: language() === 'en' ? 'en' : 'th' });
      if (!body.textContent.trim() && !body.querySelector('img')) throw Error('Empty review');
      message(localizedTitle(item)); content.append(...body.childNodes); setupAnswers();
      await typeset(content);
      if (token === version) setPrint(true);
    } catch (error) {
      if (token !== version) return;
      message(text('ยังโหลดบททวนนี้ไม่ได้', 'This review could not load'), text('ลองโหลดอีกครั้ง หรือเลือกหัวข้ออื่น', 'Retry or choose another topic.'));
      retry.hidden = false;
    } finally { clearTimeout(timer); }
  }
  async function load(force = false) {
    const token = ++version;
    controller?.abort(); controller = new AbortController();
    const requestController = controller, signal = requestController.signal;
    catalog = null; authored = null; topics = []; selected = ''; chapter = '';
    controls(); retry.hidden = true; setPrint(false);
    if (!subjectId) { status.textContent = ''; message(text('เลือกวิชาเพื่อดูหัวข้อทบทวน', 'Choose a subject to browse reviews')); return; }
    status.textContent = text('กำลังโหลดรายชื่อหัวข้อ…', 'Loading topics…');
    message(text('กำลังโหลดคลังเนื้อหาทบทวน…', 'Loading review library…'));
    const timer = setTimeout(() => requestController.abort(), 12_000);
    try {
      const [value, media] = await Promise.all([client.catalog(subjectId, { force }), read(new URL('route-catalog.v1.json', siteUrl), signal, true).catch(() => null)]);
      if (token !== version) return;
      catalog = value;
      authored = media?.schemaVersion === 1 && Array.isArray(media.contents) && Array.isArray(media.routes) ? media : null;
      topics = reviewTopics(catalog, authored, subjectId);
      selected = preferredReviewTopic(topics, lastPreferred);
      chapter = selectedTopic()?.chapterKey || '';
      controls();
      await showTopic();
      if (!topics.length) message(text('ยังไม่มีหัวข้อที่เปิดใช้งานในวิชานี้', 'No published topics for this subject yet'));
      else if (!authored) { status.textContent = text('โหลดรายการบททวนไม่สำเร็จ · ลองโหลดอีกครั้ง', 'Review availability could not load. Try again.'); retry.hidden = false; }
    } catch (error) {
      if (token !== version) return;
      message(text('โหลดรายชื่อหัวข้อไม่สำเร็จ', 'Topics could not load'), text('ลองโหลดอีกครั้งได้ โดยคำตอบใน Quiz ยังอยู่', 'Retry when connected. Your quiz answers are kept.'));
      status.textContent = ''; retry.hidden = false;
    } finally { clearTimeout(timer); }
  }
  subject.addEventListener('change', () => { subjectId = subject.value; lastPreferred = []; void load(); });
  chapters.addEventListener('change', () => { chapter = chapters.value; selected = ''; controls(); void showTopic(); });
  topic.addEventListener('change', () => { selected = topic.value; void showTopic(); });
  retry.addEventListener('click', () => { lastPreferred = [selected]; void load(true); });
  answerToggle.addEventListener('click', () => {
    if (printing || !answers.length) return;
    const show = answers.some(item => item.answer.hidden);
    answers.forEach(item => { item.answer.hidden = !show; }); answerControls();
  });
  labels(); setPrint(false);
  return {
    async open({ subjectId: nextSubject = '', preferred = [] } = {}) {
      if (opened && catalog && (!nextSubject || subjectId === nextSubject)) {
        if (preferred.length) {
          lastPreferred = preferred;
          selected = preferredReviewTopic(topics, preferred);
          chapter = selectedTopic()?.chapterKey || '';
          controls();
        }
        await showTopic(); return;
      }
      opened = true; subjectId = Object.hasOwn(bankSubjects, nextSubject) ? nextSubject : '';
      lastPreferred = preferred; await load();
    },
    refreshLanguage() { if (opened) { controls(); void showTopic(); } },
    setPrinting(value) { printing = value; controls(); answerControls(); setPrint(Boolean(selectedTopic())); },
    close() { ++version; controller?.abort(); },
  };
}
