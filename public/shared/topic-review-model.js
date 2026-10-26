import { bankChapters, bankChapterKey, bankTitlePair } from './question-bank-menu.js';
import { bankKeyPattern } from './question-bank-model.js';
import { staticBankSvgImage } from './question-bank-svg.js?v=bank-svg-2-20261026';

// Use the live published IDs; never derive a new ID from a heading or row number.
export function reviewTopics(catalog, authored, subjectId) {
  const contents = new Map((authored?.contents || []).map(item => [item.id, item]));
  const routes = authored?.routes || [];
  return (catalog?.sets || []).map(set => {
    const route = routes.find(item => item.subjectId === subjectId && item.bankKey === set.bankKey &&
      item.toolKey === 'review' && item.kind === 'content' && item.status === 'ready');
    const content = contents.get(route?.contentId);
    return { ...set, chapterKey: bankChapterKey(set), titlePair: bankTitlePair(set.title),
      source: content?.toolKind === 'html' ? content.source : null };
  });
}

export { bankChapters, bankTitlePair };

export function preferredReviewTopic(topics, preferred = []) {
  return preferred.find(key => bankKeyPattern.test(key || '') && topics.some(item => item.bankKey === key)) || '';
}

export function reviewContentUrl(source, siteUrl) {
  if (typeof source !== 'string' || !source.startsWith('content/') || source.includes('\\')) throw Error('Invalid review source');
  const base = new URL(siteUrl), url = new URL(source, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(`${base.pathname}content/`) || url.search || url.hash) throw Error('Invalid review source');
  return url;
}

const tags = new Set('article section header footer main div span p h1 h2 h3 h4 h5 h6 b strong i em u sub sup br hr ul ol li dl dt dd table thead tbody tfoot tr th td caption blockquote pre code figure figcaption a img'.split(' '));
const discard = new Set('script style iframe frame object embed form button input select textarea link meta base audio video canvas math template'.split(' '));

// Review files are repository-authored HTML. Copy only reading content, so a
// future file cannot execute scripts or borrow IDs/styles from the Quiz.
export function reviewDocument(html, sourceUrl, { document: doc, Parser = DOMParser, language = 'th' }) {
  const parsed = new Parser().parseFromString(html, 'text/html');
  const source = parsed.querySelector('[data-topic-review-document]') || parsed.querySelector('main') || parsed.body;
  const target = doc.createElement('div');
  function copy(parent, into) {
    for (const child of parent.childNodes) {
      if (child.nodeType === 3) { into.append(doc.createTextNode(child.textContent)); continue; }
      if (child.nodeType !== 1 || (child.hasAttribute('hidden') && !child.hasAttribute('data-review-answer')) || child.hasAttribute('data-no-review')) continue;
      const lang = child.dataset.contentLang || child.dataset.quizLanguage;
      if (lang && lang !== language) continue;
      if (child.localName === 'svg') { into.append(staticBankSvgImage(child, doc)); continue; }
      if (discard.has(child.localName)) continue;
      if (!tags.has(child.localName)) { copy(child, into); continue; }
      const node = doc.createElement(child.localName);
      if (child.localName === 'img' || child.localName === 'a') {
        const attribute = child.localName === 'img' ? 'src' : 'href';
        const raw = child.getAttribute(attribute);
        if (!raw) continue;
        let url;
        try { url = new URL(raw, sourceUrl); } catch { continue; }
        const base = new URL(sourceUrl);
        if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.origin === base.origin))) continue;
        node.setAttribute(attribute, url.href);
        if (attribute === 'src') { node.alt = child.getAttribute('alt') || ''; node.loading = 'eager'; }
        else { node.target = '_blank'; node.rel = 'noopener noreferrer'; }
      }
      if (['th', 'td'].includes(child.localName)) for (const attr of ['colspan', 'rowspan']) {
        if (/^[1-9]\d?$/.test(child.getAttribute(attr) || '')) node.setAttribute(attr, child.getAttribute(attr));
      }
      if (child.hasAttribute('data-review-writing-space')) node.className = 'review-writing-space';
      for (const marker of ['data-review-question', 'data-review-blank', 'data-review-answer']) {
        if (child.hasAttribute(marker)) node.setAttribute(marker, '');
      }
      // Answers always start closed, including files whose author omitted hidden.
      if (child.hasAttribute('data-review-answer')) { node.hidden = true; node.classList.add('review-answer'); }
      if (child.dataset.th && child.dataset.en && !child.children.length) node.textContent = child.dataset[language];
      else copy(child, node);
      into.append(node);
    }
  }
  copy(source, target);
  return target;
}
