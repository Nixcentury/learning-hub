// Declarative read-only HTML links share one opener at every rendered Hub layer.
export function htmlLinkEntry(node, documentUrl, context = {}) {
  const d = node.dataset;
  const source = (node.getAttribute("data-html-src") || node.getAttribute("href") || "").trim();
  if (!source) return null;
  try {
    return { toolKind: "html", contentId: d.contentId,
      subjectId: d.subjectId || context.subjectId || "general",
      chapterId: d.chapterId || context.chapterId || "1",
      topicId: d.topicId || context.topicId || "html-reference",
      source: new URL(source, documentUrl).href,
      titleTh: d.th || d.titleTh || node.textContent.trim(),
      titleEn: d.en || d.titleEn || d.th || node.textContent.trim() };
  } catch { return null; }
}
