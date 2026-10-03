// Shared authoring contract. Build metadata and browser DOM use the same tree shape.
const stableId = /^[a-z][a-z0-9-]{0,63}$/;
const allowed = new Set(['data-sheet-slot', 'data-sheet-answer', 'data-sheet-placeholder',
  'data-sheet-size', 'data-sheet-layout', 'data-sheet-label-th', 'data-sheet-label-en', 'data-sheet-standalone-note']);
const has = (node, name) => Object.hasOwn(node.attrs, name);

export function learningSheetTree(element) {
  return {
    tag: element.localName,
    attrs: Object.fromEntries([...element.attributes].map(attr => [attr.name, attr.value])),
    children: [...element.children].map(learningSheetTree),
  };
}

export function validateLearningSheet(root) {
  const errors = [], slots = new Map(), htmlIds = new Set(), languages = new Set();
  const fail = (id, message) => errors.push(`Learning sheet ${id || '(document)'}: ${message}`);
  if (root.tag !== 'html' || !has(root, 'data-learning-html') || root.attrs['data-learning-sheet'] !== '1') {
    fail('', 'use <html data-learning-html data-learning-sheet="1">.');
  }
  function walk(node, language = '*', owner = null, inSvg = false) {
    const a = node.attrs;
    if (has(node, 'data-content-lang')) {
      language = a['data-content-lang'];
      if (!['th', 'en'].includes(language)) fail(owner, 'language must be th or en.');
      languages.add(language);
      if (owner) fail(owner, 'put language blocks outside slots.');
    }
    inSvg ||= node.tag === 'svg';
    if (a.id) {
      if (htmlIds.has(a.id)) fail(owner, `duplicate HTML/SVG id "${a.id}".`);
      htmlIds.add(a.id);
    }
    for (const name of Object.keys(a)) {
      if (name.startsWith('data-sheet-') && !allowed.has(name)) {
        fail(a['data-sheet-slot'] || owner, `${name} is not supported in this HTML/table phase (groups and SVG controls come later).`);
      }
      if (name === 'data-learning-sheet' && node !== root) fail(owner, 'the sheet marker belongs only on html.');
    }
    if (has(node, 'data-sheet-slot')) {
      const id = a['data-sheet-slot'];
      if (owner) fail(id, 'slots cannot be nested.');
      if (inSvg || !['span', 'div'].includes(node.tag)) fail(id, 'use an HTML span or div slot; SVG slots are not supported yet.');
      if (!stableId.test(id || '')) fail(id, 'slot ID must start with a lowercase letter and use letters, digits or hyphens (max 64).');
      if (!['small', 'medium', 'large'].includes(a['data-sheet-size'] || 'small')) fail(id, 'size must be small, medium or large.');
      if (!['inline', 'block'].includes(a['data-sheet-layout'] || 'inline')) fail(id, 'layout must be inline or block.');
      for (const lang of ['th', 'en']) if (!a[`data-sheet-label-${lang}`]?.trim()) fail(id, `needs a non-answer label in ${lang}.`);
      if (['data-th', 'data-en'].some(name => has(node, name))) fail(id, 'use language blocks, not text-replacement attributes on slots.');
      const answers = node.children.filter(child => has(child, 'data-sheet-answer'));
      const placeholders = node.children.filter(child => has(child, 'data-sheet-placeholder'));
      if (answers.length !== 1) fail(id, 'needs exactly one direct child data-sheet-answer.');
      if (placeholders.length > 1) fail(id, 'allows at most one direct child data-sheet-placeholder.');
      const variants = slots.get(id) || new Set();
      if (variants.has(language) || (variants.size && (language === '*' || variants.has('*')))) fail(id, `duplicate slot in ${language}.`);
      variants.add(language); slots.set(id, variants);
      owner = id;
    }
    for (const marker of ['data-sheet-answer', 'data-sheet-placeholder']) {
      if (has(node, marker)) {
        if (!owner) fail('', `${marker} must be inside a slot.`);
        if (marker === 'data-sheet-answer' && (has(node, 'hidden') || a['aria-hidden'] === 'true' || has(node, 'inert'))) {
          fail(owner, 'authored answers must remain readable before the Hub starts.');
        }
      }
    }
    if (has(node, 'data-sheet-answer') && has(node, 'data-sheet-placeholder')) fail(owner, 'answer and placeholder must be separate elements.');
    if (owner && ['a', 'button', 'input', 'textarea', 'select', 'form', 'details', 'summary', 'iframe', 'object', 'embed', 'audio', 'video'].includes(node.tag)) {
      fail(owner, `interactive ${node.tag} is not allowed inside a slot.`);
    }
    if (owner && has(node, 'contenteditable')) fail(owner, 'editable fields are not part of a learning sheet.');
    for (const child of node.children) {
      for (const marker of ['data-sheet-answer', 'data-sheet-placeholder']) {
        if (has(child, marker) && !has(node, 'data-sheet-slot')) fail(owner, `${marker} must be a direct child of its slot.`);
      }
      walk(child, language, owner, inSvg);
    }
  }
  walk(root);
  if (!slots.size) fail('', 'needs at least one slot.');
  if (languages.has('th') && languages.has('en')) {
    for (const [id, variants] of slots) {
      if (!variants.has('*') && (!variants.has('th') || !variants.has('en'))) fail(id, 'bilingual sheets need the same slot ID in both languages.');
    }
  }
  return errors;
}
