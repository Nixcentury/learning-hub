// Use the generated catalog to avoid downloading every Quiz just to render a
// menu. The HEAD fallback also supports standalone subject pages/older hosts.
export async function readMenuCatalog(url, { fetcher = fetch, signal } = {}) {
  try {
    const response = await fetcher(url, { cache: 'no-cache', signal });
    if (!response.ok || response.redirected) return null;
    const catalog = await response.json();
    return catalog?.schemaVersion === 1 && Array.isArray(catalog.routes) ? catalog : null;
  } catch (error) { if (signal?.aborted) throw error; return null; }
}

export async function availableMenuSource({ source, status, kind, subjectId, chapterId, topicId, contentId },
  { catalog, fetcher = fetch, signal } = {}) {
  if (status && !['draft', 'ready'].includes(status)) throw Error('Invalid data-status');
  if (!source || status === 'draft') return null;
  const route = catalog?.routes.find(row => !row.hash.startsWith('#content/') && row.subjectId === subjectId && row.chapterId === chapterId &&
    (kind === 'chapter' ? row.kind === 'chapter' : kind === 'topic' ? row.kind === 'topic' && row.topicId === topicId :
      ['content', 'content-placeholder'].includes(row.kind) && row.contentId === contentId && row.topicId === topicId));
  if (route) return route.status === 'preparing' ? null : source;
  const response = await fetcher(source, { method: 'HEAD', cache: 'no-cache', signal });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok || response.redirected) throw Error('Cannot check content availability');
  return source;
}
