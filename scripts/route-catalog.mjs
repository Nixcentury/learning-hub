import { routeCatalogVersion, routeSegmentPattern, parseHubRoute } from '../js/hub-routes.js';
import { toolCatalog } from '../js/legacy-tool-catalog.js';
import { readMetadata, metadataNodes, metadataText } from './route-html-metadata.mjs';

const site = new URL('https://catalog.invalid/learning-hub/');
const has = (node, attr) => Object.hasOwn(node.attrs, attr);
const nodesWith = (node, attr, templates = false) => metadataNodes(node, item => has(item, attr), templates);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

export function localCatalogPath(href, from, folder = 'content/', allowSearch = false) {
  if (!href?.trim() || /[\\\u0000-\u0020]/.test(href) || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(href)) throw Error(`Invalid local link: ${href}`);
  const url = new URL(href, new URL(from, site));
  if (url.origin !== site.origin || !url.pathname.startsWith(site.pathname + folder) ||
      !url.pathname.endsWith('.html') || url.hash || (!allowSearch && url.search) ||
      /%(?:2e|2f|5c|25|00)/i.test(url.pathname)) throw Error(`Link escapes ${folder || 'Hub'}: ${href}`);
  return decodeURIComponent(url.pathname.slice(site.pathname.length));
}

// read(webPath) is injected: build uses the repository; unit tests use memory.
// Only reachable, declared navigation is indexed. Never include answers/user data.
export async function buildRouteCatalog({ read, legacyCatalog = toolCatalog }) {
  const files = new Map(), routeKeys = new Map(), contentById = new Map(), contentFiles = new Map();
  const routes = [], pendingReadings = [], scannedReadings = new Set();
  function fail(file, text) { throw Error(`${file}: ${text}`); }
  function id(value, file, label = 'ID') {
    if (!routeSegmentPattern.test(value || '')) fail(file, `Invalid ${label}: ${value}`);
    return value;
  }
  async function load(file) {
    if (!files.has(file)) files.set(file, Promise.resolve().then(() => read(file)).then(readMetadata)
      .catch(error => { throw Error(`${file}: ${error.message}`); }));
    return files.get(file);
  }
  function unique(root, attribute, file, templates = false) {
    const found = nodesWith(root, attribute, templates);
    if (found.length !== 1) fail(file, `Expected exactly one ${attribute}`);
    return found[0];
  }
  function labels(node, prefix = 'data-', fallback = '') {
    return { titleTh: node.attrs[prefix + 'th']?.trim() || fallback,
      titleEn: node.attrs[prefix + 'en']?.trim() || node.attrs[prefix + 'th']?.trim() || fallback };
  }
  function addRoute(route, file) {
    const keys = [route.hash, ...route.aliases];
    if (keys.length > 64) fail(file, `Too many route aliases: ${route.hash}`);
    for (const key of keys) {
      if (!parseHubRoute(key)) fail(file, `Invalid route: ${key}`);
      if (routeKeys.has(key)) fail(file, `Route collision ${key}; already declared in ${routeKeys.get(key)}`);
      routeKeys.set(key, file);
    }
    routes.push(route);
    return route;
  }
  function childPath(parent, node, stableId, file) {
    const preferred = id(node.attrs['data-route-slug'] || stableId, file, 'route slug');
    const extra = (node.attrs['data-route-aliases'] || '').trim().split(/\s+/).filter(Boolean);
    extra.forEach(value => id(value, file, 'route alias'));
    const hash = `${parent.hash}/${preferred}`;
    const all = [parent.hash, ...parent.aliases].flatMap(prefix =>
      [...new Set([preferred, stableId, ...extra])].map(segment => `${prefix}/${segment}`));
    return { hash, aliases: [...new Set(all)].filter(value => value !== hash).sort(compare) };
  }
  function contextOf(route) {
    return { subjectId: route.subjectId || route.sectionId || 'general', chapterId: route.chapterId || '1', topicId: route.topicId || 'html-reference' };
  }
  async function registerContent({ contentId, toolKind, source, parent, title, placement, file }) {
    id(contentId, file, 'content ID');
    if (!/^[a-z]/.test(contentId) || !['quiz', 'simulation', 'html'].includes(toolKind)) fail(file, 'Invalid content kind or ID');
    const doc = await load(source);
    const marker = toolKind === 'html' ? 'data-learning-html' : toolKind === 'quiz' ? 'data-learning-activity-content' : 'data-learning-simulation';
    const target = unique(doc, marker, source);
    if (toolKind === 'html' && target.tag !== 'html') fail(source, 'Reading marker must be on html');
    if (toolKind !== 'html' && target.attrs['data-activity-id'] !== contentId) fail(file, `Content ID ${contentId} does not match destination activity ID`);
    if (toolKind === 'quiz' && target.attrs['data-activity-kind'] !== 'quiz') fail(source, 'Expected a quiz');
    const previous = contentById.get(contentId);
    if (previous && (previous.source !== source || previous.toolKind !== toolKind)) fail(file, `Content ID conflict: ${contentId} already points to ${previous.source}`);
    const otherId = contentFiles.get(source);
    if (otherId && otherId !== contentId) fail(file, `Content file ${source} has two IDs: ${otherId}, ${contentId}`);
    const content = previous || { id: contentId, toolKind, source, ...title, canonicalHash: `#content/${contentId}`, placements: [] };
    contentById.set(contentId, content); contentFiles.set(source, contentId);
    const where = { parentHash: parent.hash, ...contextOf(parent) };
    if (!content.placements.some(item => JSON.stringify(item) === JSON.stringify(where))) content.placements.push(where);
    if (placement) addRoute({ ...placement, kind: 'content', status: 'ready', contentId, ...where, ...title }, file);
    // Shared HTML buttons may also appear inside an authored Quiz or simulation.
    pendingReadings.push({ doc, source, parent: { ...where, hash: content.canonicalHash, aliases: [] } });
  }
  async function htmlLinks(doc, file, parent) {
    for (const node of nodesWith(doc, 'data-hub-html')) {
      if (!['a', 'button'].includes(node.tag)) continue;
      const a = node.attrs;
      const where = { ...parent, subjectId: a['data-subject-id'] || contextOf(parent).subjectId,
        chapterId: a['data-chapter-id'] || contextOf(parent).chapterId, topicId: a['data-topic-id'] || contextOf(parent).topicId };
      for (const field of ['subjectId', 'chapterId', 'topicId']) id(where[field], file, field);
      await registerContent({ contentId: a['data-content-id'], toolKind: 'html',
        source: localCatalogPath(a['data-html-src'] || a.href, file), parent: where,
        title: labels(node, 'data-', metadataText(node)), file });
    }
  }
  async function menu(file, parent, kind) {
    const doc = await load(file);
    const root = unique(doc, 'data-learning-menu', file);
    const a = root.attrs;
    if (root.tag !== 'nav' || a['data-menu-kind'] !== kind || a['data-subject-id'] !== parent.subjectId ||
        a['data-chapter-id'] !== parent.chapterId || (kind === 'tools' && a['data-topic-id'] !== parent.topicId)) fail(file, 'Menu context mismatch');
    for (const node of metadataNodes(root, item => item.tag === 'a')) {
      const entry = node.attrs;
      const isContent = kind === 'tools' || entry['data-tool-kind'] === 'html';
      const key = id(entry[isContent ? 'data-content-id' : 'data-topic-id'], file);
      const title = labels(node, 'data-', key);
      const placement = childPath(parent, node, key, file);
      const href = entry.href?.trim();
      if (!isContent) {
        const source = href ? localCatalogPath(href, file) : null;
        const topic = addRoute({ ...placement, kind: 'topic', status: source ? 'ready' : 'preparing',
          subjectId: parent.subjectId, chapterId: parent.chapterId, topicId: key, parentHash: parent.hash, source, ...title }, file);
        if (source) await menu(source, topic, 'tools');
      } else {
        const toolKind = entry['data-tool-kind'];
        if (!['quiz', 'simulation', 'html'].includes(toolKind)) fail(file, `Content ${key}: data-tool-kind must be quiz, simulation, or html (received ${toolKind || '(empty)'})`);
        if (!href) fail(file, `Content ${key}: missing href to the destination HTML file`);
        await registerContent({ contentId: key, toolKind,
          source: localCatalogPath(href, file), parent: kind === 'topics' ? { ...parent, topicId: 'chapter-reference' } : parent, placement, title, file });
      }
    }
    if (has(root, 'data-chapter-overview-src')) {
      if (kind !== 'topics') fail(file, 'Overview belongs to a chapter, not a topic');
      const key = `${parent.subjectId}-chapter-${parent.chapterId}-overview`;
      const source = a['data-chapter-overview-src'].trim();
      const placement = childPath(parent, { attrs: {} }, 'overview', file);
      const title = { titleTh: 'ผลการเรียนรู้และสรุปบท', titleEn: 'Learning outcomes and chapter summary' };
      if (source) await registerContent({ contentId: key, toolKind: 'html', source: localCatalogPath(source, file), parent: { ...parent, topicId: 'chapter-overview' }, placement, title, file });
      else addRoute({ ...placement, kind: 'content-placeholder', status: 'preparing', parentHash: parent.hash, ...contextOf(parent), ...title }, file);
    }
  }
  async function legacyTools(chapter, file) {
    // These are the controls currently shown by subject-page.js, not every internal tool.
    const kinds = chapter.subjectId === 'test' ? ['quiz', 'simulation', 'notebook'] : ['simulation', 'notebook'];
    let available = 0;
    for (const kind of kinds) {
      const toolId = `${chapter.subjectId}-c${chapter.chapterId}-${kind}`;
      const tool = legacyCatalog[toolId];
      if (!tool) continue; // A new heading may be published before any tools exist.
      available += 1;
      const page = localCatalogPath(tool.page, 'index.html', 'pages/tools/', true);
      await load(page);
      const pageUrl = new URL(tool.page, site);
      const content = pageUrl.searchParams.get('content');
      if (content) await load(localCatalogPath(content, page));
      const value = { kind: 'legacy-tool', status: 'legacy', toolId, storageContentId: tool.context.contentId,
        subjectId: chapter.subjectId, chapterId: chapter.chapterId, parentHash: chapter.hash,
        titleTh: tool.titleTh, titleEn: tool.titleEn };
      addRoute({ ...childPath(chapter, { attrs: {} }, kind, file), ...value }, file);
      addRoute({ hash: `#tool/${toolId}`, aliases: [], ...value }, file);
    }
    if (!available) chapter.status = 'preparing';
  }

  const index = await load('index.html');
  const sections = nodesWith(index, 'data-section').filter(node => has(node, 'data-page-src'));
  if (!sections.length) fail('index.html', 'No Hub sections found');
  for (const section of sections) {
    const key = id(section.attrs['data-section'], 'index.html', 'section ID');
    if (['content', 'tool'].includes(key)) fail('index.html', `Reserved section ID: ${key}`);
    const page = localCatalogPath(section.attrs['data-page-src'], 'index.html', 'pages/');
    const doc = await load(page);
    const subjectNodes = nodesWith(doc, 'data-subject-page');
    if (subjectNodes.length > 1) fail(page, 'Multiple subject roots');
    const subject = subjectNodes[0];
    const sectionRoute = addRoute({ hash: `#${key}`, aliases: [], kind: 'section', status: 'ready',
      sectionId: key, subjectId: subject ? key : null, source: page,
      ...(subject ? labels(subject, 'data-subject-title-', key) : { titleTh: key, titleEn: key }) }, 'index.html');
    if (subject) {
      if (subject.attrs['data-subject-id'] !== key) fail(page, 'Subject ID does not match Hub section');
      const template = metadataNodes(doc, node => node.tag === 'template' && node.attrs.id === 'subject-chapters', true);
      if (template.length !== 1) fail(page, 'Expected one subject-chapters template');
      const seenIds = new Set();
      for (const node of nodesWith(template[0], 'data-chapter', true)) {
        const chapterId = id(node.attrs['data-chapter'], page, 'chapter ID');
        if (seenIds.has(chapterId)) fail(page, `Duplicate chapter ID ${chapterId}`);
        seenIds.add(chapterId);
        const title = unique(node, 'data-chapter-title', page);
        const source = node.attrs['data-chapter-src'] ? localCatalogPath(node.attrs['data-chapter-src'], page) : null;
        const chapter = addRoute({ ...childPath(sectionRoute, node, chapterId, page), kind: 'chapter', status: source ? 'ready' : 'legacy',
          subjectId: key, chapterId, source, parentHash: sectionRoute.hash, ...labels(title, 'data-', chapterId) }, page);
        if (source) await menu(source, chapter, 'topics'); else await legacyTools(chapter, page);
      }
    }
    await htmlLinks(doc, page, sectionRoute);
  }
  await htmlLinks(index, 'index.html', routes.find(route => route.hash === '#overview') || routes[0]);
  for (let i = 0; i < pendingReadings.length; i += 1) {
    const reading = pendingReadings[i];
    const key = JSON.stringify([reading.source, contextOf(reading.parent)]);
    if (scannedReadings.has(key)) continue;
    scannedReadings.add(key);
    await htmlLinks(reading.doc, reading.source, reading.parent);
  }
  for (const content of contentById.values()) {
    content.placements.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)));
    const first = content.placements[0];
    addRoute({ hash: content.canonicalHash, aliases: [], kind: 'content', status: 'ready', contentId: content.id,
      ...first, titleTh: content.titleTh, titleEn: content.titleEn }, content.source);
  }
  return { schemaVersion: routeCatalogVersion, routes: routes.sort((a, b) => compare(a.hash, b.hash)),
    contents: [...contentById.values()].sort((a, b) => compare(a.id, b.id)) };
}
