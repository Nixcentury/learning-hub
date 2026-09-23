import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Virtual menus exercise real Hub code without changing teachers' chapter files.
// Every non-local request is intercepted; Firebase, login and AI are never used.
const root = fileURLToPath(new URL("../", import.meta.url));
const prefix = "/learning-hub/";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const summary = await readFile(resolve(root, "public/content/templates/chapter-overview-template.html"), "utf8");
const quiz = await readFile(resolve(root, "public/content/templates/quiz-template.html"), "utf8");
const quizId = quiz.match(/data-activity-id="([^"]+)"/)[1];
let mode = "ready";
function topics() {
  const attribute = mode === "absent" ? "" : `data-chapter-overview-src="${mode === "empty" ? "" : mode === "unsafe" ? "https://evil.test/x.html" : "summary.html"}"`;
  return `<nav data-learning-menu data-menu-kind="topics" data-subject-id="chemistry" data-chapter-id="10"
    data-title-th="บทที่ 10 กรด–เบส" data-title-en="Chapter 10 · Acids and Bases" ${attribute}>
    <a data-topic-id="theories" data-th="ทฤษฎีกรด–เบส" data-en="Acid-base theories" href="tools.html">ทฤษฎี</a>
    <a data-topic-id="future" data-th="หัวข้อถัดไป" data-en="Next topic">หัวข้อถัดไป</a>
    <a data-tool-kind="html" data-content-id="chemistry-chapter-10-overview" data-th="เอกสารประกอบ" data-en="Reading" href="summary.html">เอกสารประกอบ</a></nav>`;
}
const toolsMenu = `<nav data-learning-menu data-menu-kind="tools" data-subject-id="chemistry" data-chapter-id="10"
  data-topic-id="theories" data-title-th="ทฤษฎีกรด–เบส" data-title-en="Acid-base theories">
  <a data-tool-kind="quiz" data-content-id="${quizId}" data-th="แบบฝึก" data-en="Practice" href="../templates/quiz-template.html">แบบฝึก</a>
  <a data-tool-kind="html" data-content-id="chemistry-chapter-10-overview" data-th="อ่านสรุป" data-en="Read summary" href="summary.html">อ่านสรุป</a></nav>`;
const stubs = {
  "firebase-app.js": "export const getApps=()=>[];export const initializeApp=()=>({});",
  "firebase-auth.js": `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});
    export const setPersistence=async()=>{};export const onAuthStateChanged=(_,fn)=>{fn(null);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden in QA')};`,
  "firebase-database.js": `export const getDatabase=()=>({});export const ref=(_,path)=>path;
    export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};
    export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>0;
    export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});
    export const set=async()=>{throw Error('Database writes forbidden in QA')};export const update=set;export const remove=set;`,
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(prefix)) throw Error("Outside fixture");
    const name = pathname.slice(prefix.length) || "index.html";
    const path = resolve(root, name);
    if (!path.startsWith(resolve(root) + sep)) throw Error("Outside root");
    let data;
    if (name === "content/qa-overview/topics.html") data = topics();
    else if (name === "content/qa-overview/tools.html") data = toolsMenu;
    // Intentionally invalid script tests runtime isolation in addition to build-time validation.
    else if (name === "content/qa-overview/summary.html") data = summary.replace("</body>", '<a data-hub-html data-content-id="qa-related-reading" href="related.html">อ่านเพิ่มเติม</a><script>parent.__overviewScriptRan=true;</script></body>');
    else if (name === "content/qa-overview/related.html") data = '<!doctype html><html data-learning-html><body><h1>เอกสารอ่านเพิ่มเติม</h1></body></html>';
    else {
      try { data = await readFile(path); }
      catch { data = await readFile(resolve(root, "public", name)); }
    }
    if (name === "pages/chemistry.html") data = data.toString().replace(/<article\s+data-chapter="10"[^>]*>/,
      '<article data-chapter="10" data-chapter-src="../content/qa-overview/topics.html">')
      .replace('</main>', '</main><a data-hub-html data-content-id="chemistry-chapter-10-overview" data-chapter-id="10" id="qa-layer1-html" href="../content/qa-overview/summary.html">อ่าน HTML จากหน้าเลือกบท</a>');
    // Match Vite's base substitutions without modifying production source HTML.
    if (name === "index.html") data = data.toString().replaceAll("%BASE_URL%", prefix).replaceAll('src="/shared/', `src="${prefix}shared/`);
    response.setHeader("Content-Type", ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2" })[extname(name)] || "application/octet-stream");
    response.end(data);
  } catch { response.writeHead(404); response.end("Not found"); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const output = resolve(process.env.QA_OUTPUT || resolve(root, "qa-output"));
let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    return route.fulfill({ contentType: "text/javascript", body: url.hostname === "www.gstatic.com" ? (stubs[url.pathname.split("/").at(-1)] || "") : "" });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [], missing = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => { if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url()); });
  const subject = page.frameLocator("#hub-page-frame");
  const button = subject.locator("[data-chapter-overview-button]");
  async function enterChapter() {
    await page.goto(origin + prefix + "#chemistry");
    if (await page.locator("#guest-button").isVisible()) await page.locator("#guest-button").click();
    await page.locator("#hub-view").waitFor({ state: "visible" });
    await subject.locator(".orbit-select").selectOption("9");
    await subject.locator(".orbit-open").click();
    await subject.locator(".content-menu-view").waitFor({ state: "visible" });
    if (mode === "unsafe") await subject.locator(".content-menu-notice.is-error").waitFor();
    else await subject.locator('[data-menu-entry="theories"]').waitFor();
  }
  async function closeSummary() {
    await page.locator(".window-control.is-close").click();
    await page.locator(".workspace-tool-frame").waitFor({ state: "detached" });
    // Closing notifies the subject frame through an asynchronous postMessage.
    await subject.locator('.stage.is-active[data-stage="2"]').waitFor();
    assert.equal(await subject.locator(".stage.is-active").getAttribute("data-stage"), "2");
  }
  await enterChapter();
  assert.equal(await subject.locator("[data-menu-entry]").count(), 3);
  assert.equal(await subject.locator('[data-menu-entry="future"]').isDisabled(), true);
  assert.equal(await button.isEnabled(), true);
  assert.equal(await button.evaluate(node => Boolean(node.ownerDocument.querySelector("[data-menu-cards]").compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: resolve(output, "chapter-overview-layer2.png"), fullPage: true });
  await button.click();
  const frame = page.frameLocator(".workspace-tool-frame");
  await frame.getByRole("heading", { name: "ผลการเรียนรู้ที่คาดหวัง", exact: true }).waitFor();
  assert.equal(await page.locator(".workspace-tool-frame").getAttribute("sandbox"), "allow-same-origin");
  assert.equal(await page.evaluate(() => Boolean(window.__overviewScriptRan)), false);
  assert.equal(await page.evaluate(async () => (await import("./js/workspace.js")).isWorkspaceQuizSource(document.querySelector(".workspace-tool-frame").contentWindow)), false);
  assert.equal(await subject.locator(".stage.is-active").getAttribute("data-stage"), "4");
  await page.screenshot({ path: resolve(output, "chapter-overview-open.png"), fullPage: true });
  await frame.locator("a[data-hub-html]").click();
  await page.frameLocator('.workspace-window[data-tool-id="content-html-qa-related-reading"] iframe').getByRole("heading", { name: "เอกสารอ่านเพิ่มเติม" }).waitFor();
  assert.equal(await page.locator(".workspace-tool-frame").count(), 2);
  await page.locator('.workspace-window[data-tool-id="content-html-qa-related-reading"] .is-close').click();
  await page.locator('.workspace-window[data-tool-id="content-html-qa-related-reading"]').waitFor({ state: "detached" });
  assert.equal(await page.locator(".workspace-tool-frame").count(), 1);
  await page.locator(".window-control.is-minimize").click();
  await button.click();
  assert.equal(await page.locator(".workspace-tool-frame").count(), 1, "Reopening focuses the existing window");
  await closeSummary();
  assert.equal(await button.evaluate(node => node.ownerDocument.activeElement === node), true);
  await subject.locator('[data-menu-entry="chemistry-chapter-10-overview"]').click();
  await frame.getByRole("heading", { name: "ผลการเรียนรู้ที่คาดหวัง", exact: true }).waitFor();
  await closeSummary();
  console.log("PASS footer after topics; sandboxed HTML opens without quiz bridge; minimize/reopen uses one window; close restores layer 2 and focus");

  await page.locator('#hub-view [data-language="en"]').click();
  await button.getByText("Learning outcomes and chapter summary", { exact: true }).waitFor();
  await subject.locator('[data-menu-entry="theories"]').click();
  await subject.locator(`[data-menu-entry="${quizId}"]`).waitFor();
  assert.equal(await subject.locator("[data-chapter-overview-footer]").isVisible(), false);
  await subject.locator('[data-menu-entry="chemistry-chapter-10-overview"]').click();
  await frame.getByRole("heading", { name: "ผลการเรียนรู้ที่คาดหวัง", exact: true }).waitFor();
  await page.locator(".window-control.is-close").click();
  await page.locator(".workspace-tool-frame").waitFor({ state: "detached" });
  await subject.locator('.stage.is-active[data-stage="3"]').waitFor();
  await subject.locator(`[data-menu-entry="${quizId}"]`).click();
  await page.frameLocator(".workspace-tool-frame").locator(".quiz-option").first().waitFor();
  assert.equal(await page.evaluate(async () => (await import("./js/workspace.js")).isWorkspaceQuizSource(document.querySelector(".workspace-tool-frame").contentWindow)), true);
  await page.locator(".window-control.is-close").click();
  await page.locator(".workspace-tool-frame").waitFor({ state: "detached" });
  await subject.locator('.stage.is-active[data-stage="3"]').waitFor();
  assert.equal(await subject.locator(".stage.is-active").getAttribute("data-stage"), "3");
  await subject.locator("[data-menu-back]").click();
  await button.waitFor({ state: "visible" });
  console.log("PASS bilingual button; footer hidden in layer 3; existing quiz opens/closes to layer 3");

  await subject.locator("[data-menu-back]").click();
  await subject.locator("#qa-layer1-html").click();
  await frame.getByRole("heading", { name: "ผลการเรียนรู้ที่คาดหวัง", exact: true }).waitFor();
  await page.locator(".window-control.is-close").click();
  await page.locator(".workspace-tool-frame").waitFor({ state: "detached" });
  assert.equal(await subject.locator(".stage.is-active").getAttribute("data-stage"), "1");
  await subject.locator(".orbit-open").click();
  await button.waitFor({ state: "visible" });
  console.log("PASS the same HTML opener works from layer 1, layer 2, layer 3 and another reading window in layer 4 without replacing menus");

  await page.locator('#hub-view [data-language="th"]').click();
  for (const viewport of [{ width: 820, height: 1180 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    assert.equal(await subject.locator("body").evaluate(node => node.scrollWidth <= innerWidth + 2), true);
    await button.click();
    await frame.getByRole("heading", { name: "สาระสำคัญทั้งบท", exact: true }).waitFor();
    assert.equal(await frame.locator("body").evaluate(node => node.scrollWidth <= innerWidth + 2), true);
    await page.screenshot({ path: resolve(output, `chapter-overview-${viewport.width}.png`), fullPage: true });
    await closeSummary();
  }
  console.log("PASS tablet and phone-size layouts without horizontal overflow (not a real iPad hardware test)");

  mode = "empty"; await enterChapter();
  assert.equal(await button.isDisabled(), true);
  assert.equal(await button.locator("small").textContent(), "กำลังเตรียมเนื้อหา");
  mode = "absent"; await enterChapter();
  assert.equal(await subject.locator("[data-chapter-overview-footer]").isVisible(), false);
  mode = "unsafe"; await enterChapter();
  assert.equal(await page.locator(".workspace-tool-frame").count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(missing, []);
  console.log("PASS empty/absent configuration and unsafe link rejection; no uncaught errors/404s; no live Firebase or AI traffic");
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
