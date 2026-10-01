import { resolveHubRoute } from './hub-routes.js';
import { createContentTool } from './content-tool.js';
import { toolCatalog } from './legacy-tool-catalog.js';

export const isMenuRoute = route => ['section', 'chapter', 'topic'].includes(route?.kind);
export const isActivityRoute = route => ['content', 'legacy-tool'].includes(route?.kind);

// Resolve only authored catalog entries, never a source URL supplied in the hash.
export function activityForRoute(catalog, route, hubUrl) {
  if (route?.kind === 'legacy-tool') {
    const tool = toolCatalog[route.toolId];
    return tool?.context?.contentId === route.storageContentId && tool
      ? { toolId: route.toolId, tool } : null;
  }
  if (route?.kind !== 'content') return null;
  const content = catalog.contents.find(item => item.id === route.contentId);
  if (!content) return null;
  const entry = {
    subjectId: route.subjectId, chapterId: route.chapterId, topicId: route.topicId,
    contentId: content.id, source: content.source, toolKind: content.toolKind,
    titleTh: route.titleTh || content.titleTh, titleEn: route.titleEn || content.titleEn,
  };
  const tool = createContentTool(entry, hubUrl);
  return tool ? { entry, tool } : null;
}

export function menuForRoute(catalog, route) {
  let ancestor = route;
  const visited = new Set();
  while (ancestor && !visited.has(ancestor.hash)) {
    if (isMenuRoute(ancestor)) return ancestor;
    visited.add(ancestor.hash);
    ancestor = resolveHubRoute(catalog, ancestor.parentHash).route;
  }
  // Linked readings can form cycles. Their stable context still identifies a menu.
  return catalog.routes.find(item => item.kind === 'topic' && item.subjectId === route?.subjectId &&
      item.chapterId === route.chapterId && item.topicId === route.topicId) ||
    catalog.routes.find(item => item.kind === 'chapter' && item.subjectId === route?.subjectId && item.chapterId === route.chapterId) ||
    catalog.routes.find(item => item.kind === 'section' && item.sectionId === route?.subjectId) ||
    resolveHubRoute(catalog, '#overview').route;
}

export function routeForTool(catalog, tool, current, hubUrl) {
  if (!tool) return null;
  const matches = catalog.routes.filter(route => {
    const activity = activityForRoute(catalog, route, hubUrl);
    return activity?.tool.id === tool.id && (!tool.source || activity.tool.source === tool.source);
  });
  const exact = matches.find(route => route.hash === current?.hash);
  if (exact) return exact;
  const context = tool.context;
  return matches.find(route => !/^#(?:content|tool)\//.test(route.hash) &&
      route.subjectId === context.subjectId && route.chapterId === context.chapterId &&
      (route.kind === 'legacy-tool' || route.topicId === context.topicId)) ||
    matches.find(route => /^#(?:content|tool)\//.test(route.hash)) || null;
}
