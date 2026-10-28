// Shared by classic public players and bundled Hub modules. No storage or identity.
(function initializePrintNames() {
  if (globalThis.LearningHubPrintNames) return;
// Display labels only: never change content IDs, answers or saved student work.
const text = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 240) : '';

function normalizePrintMetadata(value = {}) {
  return Object.fromEntries(['subject', 'chapter', 'topic', 'work'].map(key => [key, text(value[key])]));
}

function resolvePrintMetadata({ catalog, context = {}, title = '', language = 'th', authored = {} }) {
  const routes = Array.isArray(catalog?.routes) ? catalog.routes : [];
  const label = route => text(language === 'en' ? route?.titleEn || route?.titleTh : route?.titleTh || route?.titleEn);
  const subject = routes.find(route => route.kind === 'section' && route.sectionId === context.subjectId);
  const chapter = routes.find(route => route.kind === 'chapter' && route.subjectId === context.subjectId && route.chapterId === context.chapterId);
  const topic = routes.find(route => route.kind === 'topic' && route.subjectId === context.subjectId && route.chapterId === context.chapterId && route.topicId === context.topicId);
  const fallback = { subject:label(subject), chapter:label(chapter), topic:label(topic), work:title };
  for (const key of Object.keys(fallback)) {
    // An explicitly empty author value means intentionally leave this field blank.
    if (Object.hasOwn(authored, key)) fallback[key] = authored[key];
  }
  return normalizePrintMetadata(fallback);
}

function readPrintMetadata(doc, language = 'th') {
  const result = {};
  for (const key of ['subject', 'chapter', 'topic', 'work']) {
    const localized = `data-print-${key}-${language}`;
    const plain = `data-print-${key}`;
    if (doc.documentElement.hasAttribute(localized)) result[key] = doc.documentElement.getAttribute(localized);
    else if (doc.documentElement.hasAttribute(plain)) result[key] = doc.documentElement.getAttribute(plain);
  }
  return result;
}

async function loadPrintCatalog(baseUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(new URL('route-catalog.v1.json', baseUrl), { signal:controller.signal });
    if (!response.ok || response.redirected) return null;
    const catalog = await response.json();
    return Array.isArray(catalog.routes) ? catalog : null;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}

const subjectCodes = { physics: 'PHY', chemistry: 'CHEM', biology: 'BIO', math: 'MATH', mathematics: 'MATH', science: 'SCI', computing: 'CS', english: 'ENG' };
const subjectAliases = { 'ฟิสิกส์': 'physics', 'เคมี': 'chemistry', 'ชีววิทยา': 'biology', 'คณิตศาสตร์': 'math', 'วิทยาศาสตร์': 'science' };
const encoder = new TextEncoder();
function bounded(value, bytes) {
  let out = '';
  for (const character of value) { if (encoder.encode(out + character).length > bytes) break; out += character; }
  return out.trim().replace(/[. -]+$/u, '');
}
function filenamePart(value) {
  return String(value ?? '').normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/[<>:"/\\|?*]+/gu, '-').replace(/\s+/gu, ' ').replace(/-{2,}/gu, '-').replace(/^[. -]+|[. -]+$/gu, '');
}
function buildPrintFilename({ subjectId = '', subject = '', chapter = '', work = '', mode = '', language = 'th', extension = '' } = {}) {
  const subjectKey = String(subjectId).toLowerCase();
  const labelKey = String(subject).trim().toLowerCase();
  const code = subjectCodes[subjectKey] || subjectCodes[subjectAliases[labelKey] || labelKey] || 'HUB';
  const suffixes = { worksheet: ['โจทย์','Questions'], answer: ['เฉลย','Answers'], summary: ['สรุป','Summary'],
    blank: ['ฉบับว่าง','Blank'], answers: ['เฉลย','Answers'], evidence: ['หลักฐานวิธีทำ','Reasoning'], 'topic-review': ['ทบทวน','Review'] };
  const suffix = suffixes[mode]?.[language === 'en' ? 1 : 0] || '';
  const cleanChapter = filenamePart(chapter), cleanWork = filenamePart(work);
  const parts = [cleanChapter, cleanWork].filter((value, index, all) => value && all.indexOf(value) === index);
  if (!parts.length) parts.push(language === 'en' ? 'Document' : 'เอกสาร');
  const budget = 215 - encoder.encode(code + suffix).length - parts.length - (suffix ? 1 : 0);
  const names = parts.map(part => bounded(part, Math.floor(budget / parts.length))).filter(Boolean);
  return [code, ...names, ...(suffix ? [suffix] : [])].join('-') + (extension === 'pdf' ? '.pdf' : '');
}
function resolvePrintContext({ catalog, context = {}, source = '', baseUrl = '' } = {}) {
  let placement = {};
  try {
    const url = new URL(source, baseUrl);
    const content = source && catalog?.contents?.find(item => new URL(item.source, baseUrl).pathname === url.pathname);
    const matches = content?.placements?.filter(item => !context.subjectId || item.subjectId === context.subjectId) || [];
    if (matches.length === 1) placement = matches[0];
    // Subject folder is an explicit authored location, not a guessed chapter.
    const match = /\/content\/([^/]+)\//.exec(url.pathname);
    if (!placement.subjectId && Object.hasOwn(subjectCodes, match?.[1] || '')) placement.subjectId = match[1];
  } catch { /* Unavailable source/catalog: use the supplied labels. */ }
  return { ...placement, ...context };
}
function createPrintTitleSession(win) {
  let titles = [], active = '';
  return {
    set(value) {
      if (!titles.length) {
        let current = win;
        while (current) {
          try { titles.push({ win: current, title: current.document.title }); }
          catch { break; }
          if (current.parent === current) break;
          current = current.parent;
        }
      }
      active = value;
      for (const item of titles) item.win.document.title = value;
    },
    restore() {
      for (const item of titles) {
        try { if (item.win.document.title === active) item.win.document.title = item.title; } catch { /* A parent may have navigated. */ }
      }
      titles = []; active = '';
    },
  };
}

  globalThis.LearningHubPrintNames = Object.freeze({ normalizePrintMetadata, resolvePrintMetadata, readPrintMetadata, loadPrintCatalog, buildPrintFilename, resolvePrintContext, createPrintTitleSession });
})();
