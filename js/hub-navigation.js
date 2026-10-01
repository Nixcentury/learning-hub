import { parseHubRoute, resolveHubRoute, createHubShareUrl, routeCatalogFile, routeCatalogVersion } from './hub-routes.js';
import { isMenuRoute as navigable, isActivityRoute, activityForRoute, menuForRoute, routeForTool } from './hub-activity-routes.js';

export function resolveNavigation(catalog, hash) {
  const result = resolveHubRoute(catalog, hash);
  if (navigable(result.route) || isActivityRoute(result.route)) return { route: result.route, notice: '' };
  let ancestor = result.route;
  const visited = new Set();
  while (ancestor?.parentHash && !visited.has(ancestor.hash)) {
    visited.add(ancestor.hash);
    ancestor = resolveHubRoute(catalog, ancestor.parentHash).route;
    if (navigable(ancestor)) return { route: ancestor, notice: 'preparing' };
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

export function createHubNavigation({ pageFrame, navButtons, showSection, noticeElement,
  canOpenWorkspace = () => false, openActivity = () => false, showMenu = () => {} }) {
  const sections = new Set([...navButtons].map(button => button.dataset.section));
  let catalogPromise = null, catalog = null, revision = 0, current = null;
  let readyPage = null, lastCommand = '', requestedHash = null, notice = '';
  let currentMenu = null, applyingWorkspace = false, activeTool = null;
  const messages = {
    'not-found': ['ไม่พบตำแหน่งในลิงก์นี้ จึงเปิดหน้าที่ใกล้ที่สุดให้แล้ว', 'This location was not found. The nearest available page is open.'],
    'preparing': ['เนื้อหานี้กำลังเตรียม เปิดเมนูบทเรียนให้ก่อน', 'This content is being prepared. The lesson menu is open.'],
    'activity-unavailable': ['เปิดงานจากลิงก์ไม่ได้ ลองใหม่หรือเลือกงานผ่านเมนู', 'This activity could not open. Retry or choose an activity from its menu.'],
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
    noticeElement.querySelector('[data-route-retry]').hidden = !['catalog-unavailable', 'menu-unavailable', 'activity-unavailable'].includes(code);
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
    if (!catalog || !readyPage || readyPage.subjectId !== currentMenu?.subjectId) return;
    const commandId = `${readyPage.pageId}:${revision}`;
    if (lastCommand === commandId) return;
    lastCommand = commandId;
    pageFrame.contentWindow?.postMessage({ type: 'learning-hub-navigate', pageId: readyPage.pageId,
      commandId, route: { subjectId: currentMenu.subjectId, chapterId: currentMenu.chapterId || null,
        topicId: currentMenu.topicId || null, status: currentMenu.status } }, location.origin);
  }
  async function navigate(hash, mode = 'push', force = false, alreadyOpen = null) {
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
    const menu = catalog ? menuForRoute(catalog, route) : route;
    const sectionId = menu.sectionId || menu.subjectId;
    if (!sections.has(sectionId)) return;
    if ((currentMenu?.sectionId || currentMenu?.subjectId) !== sectionId || force) readyPage = null;
    current = route;
    currentMenu = menu;
    // Keep a requested deep link intact during a network outage so retry can restore it.
    if (code !== 'catalog-unavailable') writeHistory(route.hash, mode);
    else if (mode === 'push') writeHistory(hash, mode);
    requestedHash = location.hash;
    showNotice(code);
    showSection(sectionId, force);
    applyToPage();
    applyingWorkspace = true;
    try {
      activeTool = null;
      if (isActivityRoute(route)) {
        if (canOpenWorkspace()) {
          const activity = activityForRoute(catalog, route, location.href);
          if (!activity || (!alreadyOpen && !openActivity(activity))) showNotice('activity-unavailable');
          else activeTool = alreadyOpen || activity.tool;
        }
      } else showMenu(); // Keep frames/answers alive when Back returns to a menu.
    } finally { applyingWorkspace = false; }
  }
  function handleMessage(event) {
    if (event.origin !== location.origin || event.source !== pageFrame.contentWindow) return false;
    const data = event.data;
    if (data?.type === 'learning-hub-navigation-ready') {
      if (typeof data.pageId !== 'string' || data.pageId.length > 100 || data.subjectId !== currentMenu?.subjectId) return true;
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
    sessionChanged() { void navigate(location.hash, 'replace'); },
    toolActivated(tool) {
      if (applyingWorkspace || !canOpenWorkspace()) return;
      activeTool = tool;
      const route = catalog && routeForTool(catalog, tool, current, location.href);
      if (route && route.hash !== location.hash) void navigate(route.hash, 'push', false, tool);
    },
    workspaceIdle() {
      if (applyingWorkspace) return;
      activeTool = null;
      if (catalog && current) void navigate(menuForRoute(catalog, current).hash, 'replace');
    },
    async shareTarget(tool = activeTool) {
      try {
        const value = await loadCatalog();
        const route = tool ? routeForTool(value, tool, current, location.href) : resolveHubRoute(value, location.hash).route;
        const url = route && createHubShareUrl(value, route.hash, location.href);
        return url ? { url, titleTh: route.titleTh || 'Learning Hub', titleEn: route.titleEn || 'Learning Hub' } : null;
      } catch { return null; }
    },
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
