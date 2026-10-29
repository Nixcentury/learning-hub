// The same declarative link works in owned readings, quizzes and simulations.
export function videoLinkEntry(node, documentUrl, context = {}) {
  const d = node.dataset;
  return { toolKind: 'video', contentId: d.contentId,
    subjectId: d.subjectId || context.subjectId || 'general',
    chapterId: d.chapterId || context.chapterId || '1',
    topicId: d.topicId || context.topicId || 'video-reference',
    source: documentUrl,
    videoSource: (node.getAttribute('data-video-src') ?? node.getAttribute('href') ?? '').trim(),
    titleTh: d.th || d.titleTh || node.textContent.trim(),
    titleEn: d.en || d.titleEn || d.th || node.textContent.trim() };
}
