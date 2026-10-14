// Optional common/TH/EN links live on the button; legacy links use a descriptor.
export function pdfLinkEntry(node, documentUrl, context = {}) {
  const d = node.dataset;
  const pdfSources = Object.fromEntries(['common', 'th', 'en'].filter(key => typeof d[`pdf${key[0].toUpperCase() + key.slice(1)}`] === 'string')
    .map(key => [key, d[`pdf${key[0].toUpperCase() + key.slice(1)}`]]));
  const source = (node.getAttribute('data-pdf-src') || node.getAttribute('href') || '').trim();
  const inline = Object.keys(pdfSources).length > 0 || !source;
  if (inline && node.getAttribute('data-pdf-src')?.trim()) return null;
  try {
    return { toolKind: 'pdf', contentId: d.contentId,
      subjectId: d.subjectId || context.subjectId || 'general',
      chapterId: d.chapterId || context.chapterId || '1',
      topicId: d.topicId || context.topicId || 'html-reference',
      source: inline ? documentUrl : new URL(source, documentUrl).href,
      ...(inline ? { pdfSources } : {}),
      titleTh: d.th || d.titleTh || node.textContent.trim(),
      titleEn: d.en || d.titleEn || d.th || node.textContent.trim() };
  } catch { return null; }
}
