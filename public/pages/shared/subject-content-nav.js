// Menu HTML is data only: copy text/links into shared cards, never execute its markup.
export function createSubjectContentNavigation({ root, subject, setStage, backToChapters }) {
  const panel = document.createElement("section");
  panel.className = "activity-view content-menu-view";
  panel.hidden = true;
  panel.innerHTML = `<nav class="content-breadcrumb" aria-label="เส้นทางเนื้อหา / Content path"></nav>
    <header class="activity-heading surface">
      <button type="button" class="back-button" data-menu-back></button>
      <div><small class="eyebrow" data-menu-layer></small><h2 data-menu-title tabindex="-1"></h2>
      <p data-menu-description></p></div>
    </header>
    <p class="content-menu-notice" role="status" aria-live="polite" hidden></p>
    <div class="activity-grid" data-menu-cards></div>`;
  root.append(panel);
  const cards = panel.querySelector("[data-menu-cards]");
  const notice = panel.querySelector(".content-menu-notice");
  const base = new URL("../content/", location.href);
  const idPattern = /^[a-z0-9][a-z0-9-]{0,127}$/;
  let chapter = null, chapterMenu = null, topicMenu = null, mode = "topics";
  let loadVersion = 0, controller = null, pending = null, lastToolId = null;

  function localized(node, th, en) {
    node.dataset.th = th || ""; node.dataset.en = en || th || "";
    node.textContent = document.documentElement.lang === "en" ? node.dataset.en : node.dataset.th;
  }
  function message(th, en, error = false) {
    notice.hidden = false;
    notice.classList.toggle("is-error", error);
    localized(notice, th, en);
  }
  function urlFor(source, parentUrl) {
    const url = new URL(source, parentUrl);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) ||
        !url.pathname.endsWith(".html") || url.search || url.hash || url.username || url.password ||
        /%(?:2e|2f|5c|25)/i.test(url.pathname)) throw new Error("Invalid content path");
    return url.href;
  }
  async function readMenu(source, parentUrl, kind, topicId) {
    const version = ++loadVersion;
    controller?.abort(); controller = new AbortController();
    message("กำลังโหลดรายการ…", "Loading activities…");
    const url = urlFor(source, parentUrl);
    const response = await fetch(url, { signal: controller.signal, cache: "no-cache" });
    if (!response.ok || response.redirected) throw new Error("Menu unavailable");
    const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
    if (version !== loadVersion) return null;
    const menus = parsed.querySelectorAll("[data-learning-menu]");
    const menu = menus[0];
    if (menus.length !== 1 || menu.dataset.menuKind !== kind ||
        menu.dataset.subjectId !== subject.id || menu.dataset.chapterId !== chapter.id ||
        (kind === "tools" && menu.dataset.topicId !== topicId)) throw new Error("Menu context mismatch");
    const seen = new Set();
    const entries = [...menu.querySelectorAll("a")].map(link => {
      const d = link.dataset;
      const key = kind === "topics" ? d.topicId : d.contentId;
      const href = (link.getAttribute("href") || "").trim();
      if (!idPattern.test(key || "") || seen.has(key) || !d.th || !d.en ||
          (kind === "tools" && (!href || !["quiz", "simulation"].includes(d.toolKind)))) {
        throw new Error("Invalid menu entry");
      }
      seen.add(key);
      return { id: key, th: d.th, en: d.en, descriptionTh: d.descriptionTh || "",
        descriptionEn: d.descriptionEn || "", toolKind: d.toolKind,
        source: href ? urlFor(href, url) : null };
    });
    return { url, entries, kind, topicId, th: menu.dataset.titleTh || chapter.th,
      en: menu.dataset.titleEn || chapter.en, descriptionTh: menu.dataset.descriptionTh || "",
      descriptionEn: menu.dataset.descriptionEn || "" };
  }
  function cancelPending() {
    if (pending) { clearTimeout(pending.timer); pending.button.disabled = false; pending = null; }
  }
  function hide() {
    ++loadVersion; controller?.abort(); cancelPending(); panel.hidden = true;
  }
  function breadcrumbs() {
    const host = panel.querySelector(".content-breadcrumb");
    host.replaceChildren();
    const add = (th, en, callback) => {
      const button = document.createElement("button"); button.type = "button";
      localized(button, th, en); button.addEventListener("click", callback); host.append(button);
    };
    add(subject.titleTh, subject.titleEn, backToChapters);
    add(chapter.th, chapter.en, showTopics);
    if (mode === "tools" && topicMenu) {
      const current = document.createElement("span");
      localized(current, topicMenu.th, topicMenu.en); current.setAttribute("aria-current", "page"); host.append(current);
    }
  }
  function render(menu) {
    mode = menu.kind; notice.hidden = true; cards.replaceChildren(); cancelPending();
    setStage(mode === "topics" ? 2 : 3);
    localized(panel.querySelector("[data-menu-layer]"), mode === "topics" ? "ชั้นที่ 2 · เรื่องย่อย" : "ชั้นที่ 3 · เลือกงาน", mode === "topics" ? "Layer 2 · Topics" : "Layer 3 · Activities");
    localized(panel.querySelector("[data-menu-title]"), menu.th, menu.en);
    localized(panel.querySelector("[data-menu-description]"), menu.descriptionTh, menu.descriptionEn);
    localized(panel.querySelector("[data-menu-back]"), mode === "topics" ? "← กลับไปเลือกบท" : "← กลับไปเลือกเรื่องย่อย", mode === "topics" ? "← Back to chapters" : "← Back to topics");
    breadcrumbs();
    if (!menu.entries.length) message("กำลังเตรียมเนื้อหา", "Content in preparation");
    menu.entries.forEach(entry => {
      const button = document.createElement("button"); button.type = "button"; button.className = "activity-card";
      button.dataset.menuEntry = entry.id;
      button.innerHTML = `<span class="activity-icon" aria-hidden="true"></span><span class="activity-copy"><small></small><strong></strong><span></span></span><b aria-hidden="true">↗</b>`;
      button.querySelector(".activity-icon").textContent = mode === "topics" ? "▤" : entry.toolKind === "quiz" ? "✓" : "◉";
      localized(button.querySelector("small"), mode === "topics" ? "เรื่องย่อย" : entry.toolKind === "quiz" ? "แบบฝึกหัด · Quiz" : "Simulation", mode === "topics" ? "Topic" : entry.toolKind === "quiz" ? "Quiz" : "Simulation");
      localized(button.querySelector("strong"), entry.th, entry.en);
      localized(button.querySelector(".activity-copy > span"), entry.descriptionTh, entry.descriptionEn);
      if (!entry.source) {
        button.disabled = true;
        button.dataset.contentStatus = "preparing";
        localized(button.querySelector("small"), "กำลังเตรียมเนื้อหา", "Content in preparation");
        button.querySelector("b").textContent = "…";
      } else button.addEventListener("click", () => menu.kind === "topics" ? showTools(entry) : openTool(entry, button));
      cards.append(button);
    });
    panel.querySelector("[data-menu-title]").focus({ preventScroll: true });
  }
  function failure(error) {
    if (error.name === "AbortError") return;
    message("เปิดรายการไม่ได้ กรุณาตรวจชื่อไฟล์และลิงก์ใน HTML แล้วลองเข้าบทอีกครั้ง", "Cannot load this menu. Check the HTML file path, then reopen the chapter.", true);
  }
  function showTopics() {
    ++loadVersion; controller?.abort();
    if (chapterMenu) render(chapterMenu); else backToChapters();
  }
  async function showTools(entry) {
    try {
      const menu = await readMenu(entry.source, chapterMenu.url, "tools", entry.id);
      if (menu) { topicMenu = menu; render(menu); }
    } catch (error) { failure(error); }
  }
  function openTool(entry, button) {
    if (parent === window) {
      message("กรุณาเปิดบทนี้จากหน้า Learning Hub เพื่อเชื่อมหน้าต่างงานและบัญชี", "Open this chapter from Learning Hub to connect the workspace and account.", true); return;
    }
    cancelPending(); button.disabled = true;
    const requestId = crypto.randomUUID();
    pending = { requestId, button, timer: setTimeout(() => {
      cancelPending(); message("ยังเปิดงานไม่ได้ กรุณาลองอีกครั้ง", "The workspace did not respond. Please try again.", true);
    }, 8000) };
    lastToolId = `content-${entry.toolKind}-${entry.id}`;
    parent.postMessage({ type: "learning-hub-open-content", requestId, content: {
      subjectId: subject.id, chapterId: chapter.id, topicId: topicMenu.topicId,
      contentId: entry.id, toolKind: entry.toolKind, source: entry.source,
      titleTh: entry.th, titleEn: entry.en,
    } }, location.origin);
  }
  window.addEventListener("message", event => {
    if (event.source !== parent || event.origin !== location.origin) return;
    if (event.data?.type === "learning-hub-tool-closed" && event.data.toolId === lastToolId && !panel.hidden && mode === "tools") {
      setStage(3); notice.hidden = true;
    }
    if (event.data?.type !== "learning-hub-content-opened" || !pending || event.data.requestId !== pending.requestId) return;
    cancelPending();
    if (event.data.ok) { setStage(4); message("เปิดงานในหน้าต่างกลางแล้ว · ปิดหน้าต่างเพื่อกลับมาเลือกรายการนี้", "Opened in the workspace. Close the window to return to this list."); }
    else message("เปิดงานไม่ได้ ตรวจประเภทเครื่องมือ รหัสชุด และไฟล์ปลายทาง", "Cannot open the activity. Check its type, content ID and target file.", true);
  });
  panel.querySelector("[data-menu-back]").addEventListener("click", () => mode === "topics" ? backToChapters() : showTopics());
  return {
    hide,
    async open(definition) {
      hide(); panel.hidden = false; cards.replaceChildren(); mode = "topics"; chapterMenu = null; topicMenu = null; lastToolId = null;
      const title = definition.querySelector("[data-chapter-title]");
      chapter = { id: definition.dataset.chapter, th: title.dataset.th, en: title.dataset.en };
      render({ kind: "topics", th: chapter.th, en: chapter.en, entries: [] });
      try {
        const menu = await readMenu(definition.dataset.chapterSrc, location.href, "topics");
        if (menu) { chapterMenu = menu; render(menu); }
      } catch (error) { failure(error); }
    },
  };
}
