// HTML menus may select content, never an arbitrary privileged player URL.
export function createContentTool(entry, hubUrl) {
  const stableId = /^[a-z0-9][a-z0-9-]{0,127}$/;
  if (!entry || !["quiz", "simulation", "html"].includes(entry.toolKind)) return null;
  for (const name of ["subjectId", "chapterId", "topicId", "contentId"]) {
    if (typeof entry[name] !== "string" || !stableId.test(entry[name])) return null;
  }
  if (!/^[a-z]/.test(entry.contentId)) return null;
  try {
    const hub = new URL(hubUrl);
    const base = new URL("content/", hub);
    const source = new URL(entry.source, hub);
    if (!["http:", "https:"].includes(source.protocol) || source.origin !== hub.origin ||
        !source.pathname.startsWith(base.pathname) || !source.pathname.endsWith(".html") ||
        source.username || source.password || source.search || source.hash ||
        /%(?:2e|2f|5c|25)/i.test(source.pathname)) return null;
    const page = entry.toolKind === "quiz"
      ? new URL("pages/tools/quiz-player.html", hub) : new URL(source.href);
    if (entry.toolKind === "quiz") page.searchParams.set("content", source.href);
    const title = (value, fallback) => typeof value === "string" && value.trim()
      ? value.trim().slice(0, 180) : fallback;
    return {
      id: `content-${entry.toolKind}-${entry.contentId}`,
      page: page.href, source: source.href,
      icon: entry.toolKind === "quiz" ? "✓" : entry.toolKind === "html" ? "▤" : "◉",
      accent: entry.toolKind === "quiz" ? "blue" : entry.toolKind === "html" ? "violet" : "mint",
      titleTh: title(entry.titleTh, entry.contentId),
      titleEn: title(entry.titleEn, entry.contentId),
      context: {
        subjectId: entry.subjectId, chapterId: entry.chapterId,
        topicId: entry.topicId, contentId: entry.contentId,
        toolKind: entry.toolKind, itemId: "main", pageId: "page-001",
      },
    };
  } catch { return null; }
}
