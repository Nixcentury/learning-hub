import { createInlinePdfManifest } from "../public/shared/pdf-content-model.js";

// HTML menus select content, never an arbitrary privileged player URL.
export function createContentTool(entry, hubUrl) {
  const stableId = /^[a-z0-9][a-z0-9-]{0,127}$/;
  if (!entry || !["quiz", "simulation", "html", "pdf"].includes(entry.toolKind)) return null;
  for (const name of ["subjectId", "chapterId", "topicId", "contentId"]) {
    if (typeof entry[name] !== "string" || !stableId.test(entry[name])) return null;
  }
  if (!/^[a-z]/.test(entry.contentId)) return null;
  try {
    const hub = new URL(hubUrl);
    const base = new URL("content/", hub);
    const source = new URL(entry.source, hub);
    const inline = entry.toolKind === "pdf" && entry.pdfSources !== undefined;
    if (!["http:", "https:"].includes(source.protocol) || source.origin !== hub.origin || source.username || source.password ||
        /%(?:2e|2f|5c|25|00)/i.test(source.pathname)) return null;
    if (inline ? !source.pathname.startsWith(new URL("./", hub).pathname) :
        !source.pathname.startsWith(base.pathname) || !source.pathname.endsWith(".html") ||
        source.search || source.hash) return null;
    const manifest = inline ? createInlinePdfManifest(entry.pdfSources, entry.contentId, source.href, hub.href) : null;
    const hasPlayer = ["quiz", "pdf"].includes(entry.toolKind);
    const page = hasPlayer
      ? new URL(`pages/tools/${entry.toolKind}-player.html`, hub) : new URL(source.href);
    if (hasPlayer && !inline) page.searchParams.set("content", source.href);
    if (entry.toolKind === "pdf") {
      page.searchParams.set("id", entry.contentId);
      page.searchParams.set("v", "1.1.2");
    }
    const title = (value, fallback) => typeof value === "string" && value.trim()
      ? value.trim().slice(0, 180) : fallback;
    if (inline) {
      page.searchParams.set("inline", "1");
      for (const [key, item] of Object.entries(manifest.sources)) page.searchParams.set(`pdf-${key}`, item.originalUrl);
      page.searchParams.set("title-th", title(entry.titleTh, entry.contentId));
      page.searchParams.set("title-en", title(entry.titleEn, entry.contentId));
    }
    return {
      id: `content-${entry.toolKind}-${entry.contentId}`,
      page: page.href, source: inline ? `pdf-inline:${JSON.stringify(manifest.sources)}` : source.href,
      ...(inline ? { preparing: !manifest.ready } : {}),
      icon: entry.toolKind === "quiz" ? "✓" : ["html", "pdf"].includes(entry.toolKind) ? "▤" : "◉",
      accent: entry.toolKind === "quiz" ? "blue" : ["html", "pdf"].includes(entry.toolKind) ? "violet" : "mint",
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
