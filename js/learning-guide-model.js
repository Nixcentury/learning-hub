// Guide content is authored alongside a sheet; the Hub owns all interaction.
export const GUIDE_MAX_BYTES = 128 * 1024;
const keyPattern = /^[a-z][a-z0-9-]{0,63}$/;

export function guideUrl(value, sheetUrl) {
  if (typeof value !== 'string' || !value || /[%?#\\\s]/.test(value)) throw new Error('Invalid guide URL');
  const base = new URL(sheetUrl);
  const url = new URL(value, base);
  const contentRoot = base.pathname.indexOf('/content/');
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin || url.username || url.password ||
      contentRoot < 0 || !url.pathname.startsWith(base.pathname.slice(0, contentRoot) + '/content/') ||
      !url.pathname.endsWith('.guide.json')) throw new Error('Guide must be a local .guide.json file under content/');
  return url.href;
}

export function validateGuide(guide, expected = {}) {
  const errors = [];
  const fail = message => errors.push(message);
  const text = (value, path) => {
    if (!value || typeof value !== 'object') { fail(`${path}: TH/EN text required`); return; }
    for (const lang of ['th', 'en']) {
      if (typeof value[lang] !== 'string' || !value[lang].trim() || value[lang].length > 2400 || /<\/?[a-z]|\\[([]/i.test(value[lang]))
        fail(`${path}.${lang}: use nonempty plain text (Unicode math), up to 2400 characters`);
    }
  };
  const target = (value, path) => {
    if (!value || !['slot', 'anchor'].includes(value.kind) || !keyPattern.test(value.key || '')) fail(`${path}: invalid target`);
  };
  const links = (value, path, required = true) => {
    if (!Array.isArray(value) || (required && !value.length) || value.length > 12) { fail(`${path}: expected links`); return; }
    value.forEach((link, i) => { text(link?.label, `${path}[${i}].label`); target(link?.target, `${path}[${i}].target`); });
  };
  const check = (value, path) => { text(value?.question, `${path}.question`); text(value?.answer, `${path}.answer`); };
  if (!guide || typeof guide !== 'object') return ['Guide must be an object'];
  if (guide.schemaVersion !== 1) fail('schemaVersion must be 1');
  if (!/^[a-z][a-z0-9-]{0,127}$/.test(guide.source?.contentId || '')) fail('source.contentId required');
  if (!/^[a-z0-9][a-z0-9.-]{0,63}$/i.test(guide.source?.revision || '')) fail('source.revision required');
  if (!/^[a-f0-9]{64}$/.test(guide.source?.sha256 || '')) fail('source.sha256 required');
  for (const field of ['contentId', 'revision']) if (expected[field] && guide.source?.[field] !== expected[field]) fail(`Guide ${field} does not match this sheet`);
  for (const field of ['title', 'prerequisites', 'goal', 'finish']) text(guide[field], field);
  check(guide.exitCheck, 'exitCheck');
  if (!Array.isArray(guide.steps) || !guide.steps.length || guide.steps.length > 20) { fail('steps: expected 1–20 steps'); return errors; }
  const ids = new Set();
  guide.steps.forEach((step, i) => {
    const path = `steps[${i}]`;
    if (!keyPattern.test(step?.id || '') || ids.has(step.id)) fail(`${path}: unique step id required`);
    ids.add(step?.id);
    for (const field of ['title', 'summary', 'story', 'action', 'after']) text(step?.[field], `${path}.${field}`);
    links(step?.links, `${path}.links`);
    if (step?.review !== undefined) links(step.review, `${path}.review`, false);
    check(step?.check, `${path}.check`);
  });
  return errors;
}

export function guideLinks(guide) {
  return (guide.steps || []).flatMap(step => [...(step.links || []), ...(step.review || [])]);
}

// Match semantic targets only inside the selected language, never a hidden twin.
export function findGuideTarget(doc, target, language) {
  if (!target || !keyPattern.test(target.key || '') || !['slot', 'anchor'].includes(target.kind)) return null;
  const attribute = target.kind === 'slot' ? 'data-sheet-slot' : 'data-guide-anchor';
  const matches = [...doc.querySelectorAll(`[${attribute}="${target.key}"]`)].filter(node =>
    !node.closest('[data-sheet-answer]') && node.closest('[data-content-lang]')?.getAttribute('data-content-lang') === language);
  return matches.length === 1 ? matches[0] : null;
}

export function validateGuideTargets(guide, doc) {
  return [...new Set(guideLinks(guide).flatMap(link => ['th', 'en'].flatMap(language =>
    findGuideTarget(doc, link.target, language) ? [] : [`${language}: missing or duplicate ${link.target?.kind} ${link.target?.key}`])))];
}
