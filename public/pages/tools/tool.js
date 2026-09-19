const supportedLanguages = new Set(["th", "en"]);
const subscribers = new Set();
const initialLanguage = new URLSearchParams(location.search).get("lang");

let activeContext = Object.freeze({
  version: 1,
  language: "th",
  role: "student",
  identity: Object.freeze({ status: "signed-out", uid: null, isGuest: false }),
  content: null,
});

function ensureContextPreview() {
  const shell = document.querySelector(".tool-shell");
  if (!shell || shell.querySelector("[data-context-preview]")) return;

  const preview = document.createElement("aside");
  preview.className = "context-preview";
  preview.dataset.contextPreview = "";
  preview.setAttribute("aria-live", "polite");
  preview.innerHTML = `
    <span data-th="บริบทกลางพร้อมใช้งาน" data-en="Shared context ready">บริบทกลางพร้อมใช้งาน</span>
    <code data-context-summary>กำลังรอข้อมูลจาก Hub...</code>
    <small data-context-auth></small>
  `;

  const note = shell.querySelector(".tool-note");
  shell.insertBefore(preview, note);
}

function setLanguage(language) {
  const nextLanguage = supportedLanguages.has(language) ? language : "th";
  document.documentElement.lang = nextLanguage;
  document.querySelectorAll("[data-th][data-en]").forEach((element) => {
    element.textContent = element.dataset[nextLanguage];
  });
  document.querySelectorAll("[data-aria-th][data-aria-en]").forEach((element) => {
    element.setAttribute("aria-label", element.dataset[`aria${nextLanguage === "en" ? "En" : "Th"}`]);
  });
  document
    .querySelectorAll("[data-placeholder-th][data-placeholder-en]")
    .forEach((element) => {
      element.setAttribute("placeholder", element.dataset[`placeholder${nextLanguage === "en" ? "En" : "Th"}`]);
    });

  const summary = document.querySelector("[data-context-summary]");
  if (summary && !activeContext.content) {
    summary.textContent =
      nextLanguage === "en" ? "Waiting for context from Hub…" : "กำลังรอข้อมูลจาก Hub…";
  }
}

function cleanContextValue(value, fallback = "-") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function publishContext(message) {
  const identity = message.identity ?? {};
  const content = message.content ?? null;

  activeContext = Object.freeze({
    version: Number(message.version) || 1,
    language: supportedLanguages.has(message.language) ? message.language : "th",
    role: ["student", "teacher", "admin"].includes(message.role)
      ? message.role
      : "student",
    identity: Object.freeze({
      status: cleanContextValue(identity.status, "signed-out"),
      uid: identity.uid ? String(identity.uid) : null,
      isGuest: identity.isGuest === true,
    }),
    content: content
      ? Object.freeze({
          subjectId: cleanContextValue(content.subjectId),
          chapterId: cleanContextValue(content.chapterId),
          toolKind: cleanContextValue(content.toolKind),
          contentId: cleanContextValue(content.contentId),
          itemId: cleanContextValue(content.itemId, "main"),
          pageId: cleanContextValue(content.pageId, "page-001"),
        })
      : null,
  });

  const summary = document.querySelector("[data-context-summary]");
  const auth = document.querySelector("[data-context-auth]");
  if (summary && activeContext.content) {
    summary.textContent = [
      activeContext.content.contentId,
      activeContext.content.itemId,
      activeContext.content.pageId,
    ].join(" / ");
  }
  if (auth) {
    auth.textContent = activeContext.identity.uid
      ? document.documentElement.lang === "en"
        ? "Firebase UID received · Cloud connection is still disabled"
        : "รับ Firebase UID แล้ว · รอบนี้ยังไม่เชื่อม Cloud"
      : document.documentElement.lang === "en"
        ? "Guest context · Cloud saving is disabled"
        : "บริบทผู้เยี่ยมชม · ปิดการบันทึก Cloud";
  }

  document.body.dataset.authStatus = activeContext.identity.status;
  document.body.dataset.contentId = activeContext.content?.contentId ?? "";
  document.body.dataset.itemId = activeContext.content?.itemId ?? "";
  document.body.dataset.pageId = activeContext.content?.pageId ?? "";

  subscribers.forEach((subscriber) => subscriber(activeContext));
  document.dispatchEvent(
    new CustomEvent("learning-hub-context-change", { detail: activeContext }),
  );
}

window.addEventListener("message", (event) => {
  const trustedOrigin = location.origin === "null" || event.origin === location.origin;
  if (!trustedOrigin || event.source !== parent) return;
  if (event.data?.type !== "learning-hub-context") return;
  setLanguage(event.data.language);
  publishContext(event.data);
});

ensureContextPreview();
setLanguage(initialLanguage);

window.HubContext = Object.freeze({
  get: () => activeContext,
  subscribe(subscriber) {
    if (typeof subscriber !== "function") return () => {};
    subscribers.add(subscriber);
    subscriber(activeContext);
    return () => subscribers.delete(subscriber);
  },
});
