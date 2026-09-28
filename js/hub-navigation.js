import { parseHubRoute, resolveHubRoute, routeCatalogFile, routeCatalogVersion } from './hub-routes.js';

const navigable = route => ['section', 'chapter', 'topic'].includes(route?.kind);

// Phase 2 deliberately stops before opening a workspace or touching account/work data.
export function resolveNavigation(catalog, hash) {
  const result = resolveHubRoute(catalog, hash);
  if (navigable(result.route)) return { route: result.route, notice: '' };
  let ancestor = result.route;
  const visited = new Set();
  while (ancestor?.parentHash && !visited.has(ancestor.hash)) {
    visited.add(ancestor.hash);
    ancestor = resolveHubRoute(catalog, ancestor.parentHash).route;
    if (navigable(ancestor)) return { route: ancestor, notice: 'workspace-later' };
  }
  const parts = parseHubRoute(hash)?.segments || [];
  while (parts.length) {
    const route = resolveHubRoute(catalog, '#' + parts.join('/')).route;
    if (navigable(route)) return { route, notice: 'not-found' };
    parts.pop();
  }
  return { route: resolveHubRoute(catalog, '#overview').route, notice: 'not-found' };
}

export function routeForSelection(catalog, selection) {
  if (!selection || typeof selection.subjectId !== 'string') return null;
  const { subjectId, chapterId = null, topicId = null } = selection;
  if (topicId && !chapterId) return null;
  return catalog.routes.find(route => navigable(route) &&
    (chapterId ? route.subjectId === subjectId : route.sectionId === subjectId) &&
    (route.chapterId || null) === chapterId && (route.topicId || null) === topicId) || null;
}

export function createHubNavigation({ pageFrame, navButtons, showSection, noticeElement }) {
  const sections = new Set([...navButtons].map(button => button.dataset.section));
  let catalogPromise = null, catalog = null, revision = 0, current = null;
  let readyPage = null, lastCommand = '', requestedHash = null, notice = '';
  const messages = {
    'not-found': ['ไม่พบตำแหน่งในลิงก์นี้ จึงเปิดหน้าที่ใกล้ที่สุดให้แล้ว', 'This location was not found. The nearest available page is open.'],
    'workspace-later': ['ลิงก์เปิดงานโดยตรงจะมาในเฟสถัดไป ขณะนี้เปิดเมนูของงานให้ก่อน', 'Direct workspace links arrive in the next phase. The activity menu is open instead.'],
    'catalog-unavailable': ['โหลดสารบัญลิงก์ไม่ได้ ยังเลือกบทผ่านเมนูได้ ลองโหลดลิงก์อีกครั้ง', 'The link catalog is unavailable. You can still browse the menus. Retry this link.'],
    'menu-unavailable': ['โหลดเมนูปลายทางไม่สำเร็จ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'The destination menu could not load. Check your connection and retry.'],
  };
  function showNotice(code) {
    notice = code;
    noticeElement.hidden = !code;
    const pair = messages[code] || ['', ''];
    const text = noticeElement.querySelector('[data-route-notice-text]');
    [text.dataset.th, text.dataset.en] = pair;
    text.textContent = pair[document.documentElement.lang === 'en' ? 1 : 0];
    noticeElement.querySelector('[data-route-retry]').hidden = !['catalog-unavailable', 'menu-unavailable'].includes(code);
  }
  async function loadCatalog() {
    if (!catalogPromise) catalogPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(new URL(routeCatalogFile, document.baseURI), { cache: 'no-cache', signal: controller.signal });
        if (!response.ok || response.redirected) throw Error('Catalog unavailable');
        const value = await response.json();
        if (value.schemaVersion !== routeCatalogVersion || !Array.isArray(value.routes) || !Array.isArray(value.contents) ||
            !value.routes.every(route => parseHubRoute(route.hash) && Array.isArray(route.aliases)) ||
            !sections.has(resolveNavigation(value, '#overview').route?.sectionId)) throw Error('Invalid catalog');
        catalog = value;
        return value;
      } finally { clearTimeout(timeout); }
    })().catch(error => { catalogPromise = null; throw error; });
    return catalogPromise;
  }
  function writeHistory(hash, mode) {
    if (location.hash === hash) return;
    const method = mode === 'push' ? 'pushState' : 'replaceState';
    history[method](null, '', hash); // URL holds navigation only, never a UID or work state.
  }
  function applyToPage() {
    if (!catalog || !readyPage || readyPage.subjectId !== current?.subjectId) return;
    const commandId = `${readyPage.pageId}:${revision}`;
    if (lastCommand === commandId) return;
    lastCommand = commandId;
    pageFrame.contentWindow?.postMessage({ type: 'learning-hub-navigate', pageId: readyPage.pageId,
      commandId, route: { subjectId: current.subjectId, chapterId: current.chapterId || null,
        topicId: current.topicId || null, status: current.status } }, location.origin);
  }
  async function navigate(hash, mode = 'push', force = false) {
    const request = ++revision;
    requestedHash = hash;
    let route, code = '';
    try { ({ route, notice: code } = resolveNavigation(await loadCatalog(), hash)); }
    catch {
      if (request !== revision) return;
      const sectionId = parseHubRoute(hash)?.segments[0];
      route = { kind: 'section', sectionId: sections.has(sectionId) ? sectionId : 'overview', subjectId: null };
      route.hash = '#' + route.sectionId;
      code = 'catalog-unavailable';
    }
    if (request !== revision || !route) return;
    const sectionId = route.sectionId || route.subjectId;
    if (!sections.has(sectionId)) return;
    if ((current?.sectionId || current?.subjectId) !== sectionId || force) readyPage = null;
    current = route;
    // Keep a requested deep link intact during a network outage so retry can restore it.
    if (code !== 'catalog-unavailable') writeHistory(route.hash, mode);
    else if (mode === 'push') writeHistory(hash, mode);
    requestedHash = location.hash;
    showNotice(code);
    showSection(sectionId, force);
    applyToPage();
  }
  function handleMessage(event) {
    if (event.origin !== location.origin || event.source !== pageFrame.contentWindow) return false;
    const data = event.data;
    if (data?.type === 'learning-hub-navigation-ready') {
      if (typeof data.pageId !== 'string' || data.pageId.length > 100 || data.subjectId !== current?.subjectId) return true;
      readyPage = { pageId: data.pageId, subjectId: data.subjectId };
      applyToPage(); return true;
    }
    if (!['learning-hub-navigation-request', 'learning-hub-navigation-result'].includes(data?.type)) return false;
    if (!readyPage || data.pageId !== readyPage.pageId || data.commandId !== lastCommand) return true;
    if (data.type === 'learning-hub-navigation-result') {
      if (!data.ok) showNotice('menu-unavailable');
      return true;
    }
    const route = catalog && data.selection?.subjectId === readyPage.subjectId && routeForSelection(catalog, data.selection);
    if (route) void navigate(route.hash);
    else showNotice('not-found');
    return true;
  }
  function fromAddressBar() {
    if (location.hash === requestedHash) return; // popstate and hashchange can describe the same traversal.
    void navigate(location.hash, 'replace');
  }
  return {
    handleMessage,
    start() {
      navButtons.forEach(button => button.addEventListener('click', () => void navigate('#' + button.dataset.section)));
      window.addEventListener('popstate', fromAddressBar);
      window.addEventListener('hashchange', fromAddressBar);
      noticeElement.querySelector('[data-route-retry]').addEventListener('click', () => {
        if (notice === 'catalog-unavailable') catalogPromise = null;
        void navigate(location.hash, 'replace', true);
      });
      void navigate(location.hash, 'replace');
    },
  };
}
