// Change presentation only: never reload a frame or replace controls/stateful DOM.
const textSources = new WeakMap();

export function applyContentLanguage(doc, requested) {
  if (!doc?.body) return { changedText: false };
  const language = requested === 'en' ? 'en' : 'th';
  doc.documentElement.lang = language;
  let changedText = false;
  const groups = new Map();
  for (const node of doc.querySelectorAll('[data-content-lang]')) {
    if (!['th', 'en'].includes(node.dataset.contentLang)) continue;
    const owner = node.parentElement;
    if (!groups.has(owner)) groups.set(owner, []);
    groups.get(owner).push(node);
  }
  for (const nodes of groups.values()) {
    // A single-language paragraph stays readable instead of disappearing.
    const selected = nodes.some(node => node.dataset.contentLang === language)
      ? language : nodes.some(node => node.dataset.contentLang === 'th') ? 'th' : 'en';
    for (const node of nodes) node.hidden = node.dataset.contentLang !== selected;
  }
  if (groups.size && !doc.querySelector('[data-hub-language-style]')) {
    const style = doc.createElement('style');
    style.dataset.hubLanguageStyle = '';
    style.textContent = '[data-content-lang][hidden] { display:none !important; }';
    doc.head.append(style);
  }
  for (const node of doc.querySelectorAll('[data-th][data-en]')) {
    if (node.closest('script, style, textarea, input, select, [contenteditable="true"]')) continue;
    const value = node.dataset[language];
    // Rich fragments use language blocks. Do not destroy buttons/canvas/diagrams.
    const prior = textSources.get(node);
    if (!prior && node.children.length) continue;
    if (prior === value) continue; // Also preserves MathJax output for unchanged text.
    if (node.textContent !== value) {
      node.textContent = value;
      changedText = true;
    }
    textSources.set(node, value);
  }
  for (const [prefix, attribute] of [['aria', 'aria-label'], ['placeholder', 'placeholder'], ['title', 'title']]) {
    for (const node of doc.querySelectorAll(`[data-${prefix}-th][data-${prefix}-en]`)) {
      node.setAttribute(attribute, node.getAttribute(`data-${prefix}-${language}`));
    }
  }
  return { changedText };
}
