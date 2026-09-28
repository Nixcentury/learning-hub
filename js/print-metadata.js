// Display labels only: never change content IDs, answers or saved student work.
const text = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 240) : '';

export function normalizePrintMetadata(value = {}) {
  return Object.fromEntries(['subject', 'chapter', 'topic', 'work'].map(key => [key, text(value[key])]));
}

export function resolvePrintMetadata({ catalog, context = {}, title = '', language = 'th', authored = {} }) {
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

export function readPrintMetadata(doc, language = 'th') {
  const result = {};
  for (const key of ['subject', 'chapter', 'topic', 'work']) {
    const localized = `data-print-${key}-${language}`;
    const plain = `data-print-${key}`;
    if (doc.documentElement.hasAttribute(localized)) result[key] = doc.documentElement.getAttribute(localized);
    else if (doc.documentElement.hasAttribute(plain)) result[key] = doc.documentElement.getAttribute(plain);
  }
  return result;
}

export async function loadPrintCatalog(baseUrl) {
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
