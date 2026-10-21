// Optional tools come from the same generated catalog used by deep links.
// The live Sheet remains authoritative for the set list, names and question count.
export function authoredBankTools(catalog, subjectId, bankKey) {
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.routes) || !Array.isArray(catalog.contents)) return [];
  const contents = new Map(catalog.contents.filter(content => content && typeof content.id === 'string').map(content => [content.id, content]));
  return catalog.routes.filter(route => route && route.subjectId === subjectId && route.bankKey === bankKey &&
    ['content', 'content-placeholder'].includes(route.kind) &&
    /^[a-z][a-z0-9-]{0,63}$/.test(route.toolKey || '') && !['quiz', 'notebook'].includes(route.toolKey))
    .sort((a, b) => (a.bankOrder ?? 0) - (b.bankOrder ?? 0))
    .map(route => ({
      key: route.toolKey, contentId: route.contentId,
      toolKind: contents.get(route.contentId)?.toolKind || 'html',
      status: route.status, titleTh: route.titleTh, titleEn: route.titleEn,
      descriptionTh: route.descriptionTh, descriptionEn: route.descriptionEn,
    }));
}
