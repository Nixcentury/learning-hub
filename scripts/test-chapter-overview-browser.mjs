import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { catalogFromRepository } from './build-route-catalog.mjs';

// Virtual menus exercise real Hub code without changing teachers' chapter files.
// Every non-local request is intercepted; Firebase, login and AI are never used.
const root = fileURLToPath(new URL("../", import.meta.url));
const built = process.env.QA_BUILT === '1';
const servedRoot = built ? resolve(root, 'dist') : root;
const prefix = "/learning-hub/";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const summary = await readFile(resolve(root, "public/content/templates/chapter-overview-template.html"), "utf8");
const quiz = await readFile(resolve(root, "public/content/templates/quiz-template.html"), "utf8");
const quizId = quiz.match(/data-activity-id="([^"]+)"/)[1];
let mode = "ready";
const navigationCatalog = await catalogFromRepository();
// This suite substitutes a chapter menu at runtime; mirror its two topic IDs in
// the navigation fixture, without changing any teacher-authored menu on disk.
navigationCatalog.routes = navigationCatalog.routes.filter(route => !(route.kind === 'topic' && route.subjectId === 'chemistry' && route.chapterId === '10'));
for (const topicId of ['theories', 'future']) navigationCatalog.routes.push({
  hash: `#chemistry/10/${topicId}`, aliases: [], kind: 'topic', subjectId: 'chemistry', chapterId: '10', topicId,
  parentHash: '#chemistry/10', status: topicId === 'future' ? 'preparing' : 'ready',
});
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
const printRows = Array.from({length:75}, (_,i) => `<tr data-row="${i}"><td>${i+1}</td><td>Table row ${i+1}: กรดและเบส</td><td>0.10 mol/L</td></tr>`).join('');
const printRichFixture = `<!doctype html><html data-learning-html data-print-subject="เคมี" data-print-chapter="บทที่ 10 กรด–เบส" data-print-work="ทดสอบตารางและรูป"><head><style>
  body{font:16px/1.6 Tahoma,sans-serif} table{border-collapse:collapse} td,th{padding:10px;border:1px solid #aaa} main{padding:20px} p{margin:12px 0} @media print{p{font-size:40px;margin:80px}}
  </style></head><body><style>.print-inline-style { color:rgb(10, 70, 130); }</style><main><h1>ตาราง รูป และ SVG</h1><p class="print-inline-style">START-FIXTURE</p>
  <img src="sample.svg" alt="Linked SVG"><svg width="200" height="60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="diagram-gradient"><stop stop-color="#768fe5"/><stop offset="1" stop-color="#a1e0d2"/></linearGradient><g id="diagram-mark"><rect width="200" height="60" fill="url(#diagram-gradient)"/></g></defs><use href="#diagram-mark"/></svg>
  <table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ความเข้มข้น</th></tr></thead><tbody>${printRows}</tbody></table>
  <ol start="6">${Array.from({length:18},(_,i)=>`<li data-list="${i}">ผลการเรียนรู้ ${i+6} ${'อธิบายการเปลี่ยนแปลงของสารละลาย '.repeat(9)}</li>`).join('')}</ol>
  <p data-long-text>${'คำอธิบายภาษาไทยและ English with inline emphasis. '.repeat(200)}</p>
  <p>END-FIXTURE</p></main></body></html>`;
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(prefix)) throw Error("Outside fixture");
    const name = pathname.slice(prefix.length) || "index.html";
    const path = resolve(servedRoot, name);
    if (!path.startsWith(servedRoot.replace(/[\\/]$/, '') + sep)) throw Error("Outside root");
    let data;
    if (name === 'route-catalog.v1.json') data = JSON.stringify(navigationCatalog);
    else if (name === "content/qa-overview/topics.html") data = topics();
    else if (name === "content/qa-overview/tools.html") data = toolsMenu;
    // Intentionally invalid script tests runtime isolation in addition to build-time validation.
    else if (name === "content/qa-overview/summary.html") data = summary.replace("</body>", '<a data-hub-html data-content-id="qa-related-reading" href="related.html">อ่านเพิ่มเติม</a><script>parent.__overviewScriptRan=true;</script></body>');
    else if (name === "content/qa-overview/related.html") data = String.raw`<!doctype html><html data-learning-html><body><h1>เอกสารอ่านเพิ่มเติม</h1><p>\(\frac{1}{2}+\frac{1}{3}=\frac{5}{6}\)</p></body></html>`;
    else if (name === 'content/qa-overview/image-reading.html') data = '<!doctype html><html data-learning-html><body><h1>Image print</h1><img src="sample.svg" loading="lazy" alt="test diagram"><button onclick="parent.__printScriptRan=true">Must not print</button></body></html>';
    else if (name === 'content/qa-overview/print-rich.html') data = printRichFixture;
    else if (name === 'content/qa-overview/print-oversized.html') data = '<html data-learning-html><body><figure style="height:400mm">Oversized image caption</figure></body></html>';
    else if (name === 'content/qa-overview/sample.svg') data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><rect width="200" height="60" fill="#ddd9f4"/><text x="20" y="38">Diagram</text></svg>';
    else if (name === "content/qa-overview/adversarial.html") data = String.raw`<!doctype html><html data-learning-html><body>
      <h1>Formula checks</h1><p>ข้อความเดิมและราคา $5</p>
      <table><tr><td>\(K_a\)</td><td>\(\ce{SO4^2-}\)</td></tr></table>
      <p>\(\frac{1}{2}\)</p><p>\(\boguscommand{x}\)</p>
      <p>\(\href{javascript:alert(1)}{bad}\)</p><p>\(\require{html}\)</p>
      <pre>\(leaveCodeAlone\)</pre><span data-no-math>\(leaveTextAlone\)</span>
      \[\begin{aligned} y&amp;=\sin\theta+\cos\theta+\ln x+e^x \\ z&amp;=\frac{\mathrm{d}y}{\mathrm{d}x}\end{aligned}\]
      <script>parent.__overviewScriptRan=true;</script></body></html>`;
    else {
      try { data = await readFile(path); }
      catch { if (built) throw Error('Missing build file'); data = await readFile(resolve(root, "public", name)); }
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
  if (process.env.QA_PRINT_DEBUG === '1') page.on('console', message => console.log('BROWSER', message.type(), message.text()));
  page.setDefaultTimeout(12000);
  const errors = [], missing = [], mathRequests = [];
  page.on('request', request => { if (request.url().includes('/vendor/mathjax-')) mathRequests.push(request.url()); });
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
  await frame.locator('html[data-hub-math-state="ready"]').waitFor();
  assert.equal(await frame.locator('script').count(), 1, 'Only the deliberately blocked fixture script is in content');
  assert.ok(await frame.locator('mjx-container[jax="SVG"] svg').count() >= 8);
  assert.ok(await frame.locator('[data-mml-node="mfrac"]').count() >= 3);
  assert.ok(await frame.locator('[data-mml-node="msqrt"]').count() >= 1);
  assert.equal(await frame.locator('[data-mml-node="merror"]').count(), 0);
  assert.equal(await frame.locator('[data-hub-math-notice]').count(), 0);
  assert.ok(mathRequests.every(url => url.startsWith(origin + prefix + 'vendor/mathjax-3.2.2/')));
  assert.equal(await page.locator(".workspace-tool-frame").getAttribute("sandbox"), "allow-same-origin");
  assert.equal(await page.evaluate(() => Boolean(window.__overviewScriptRan)), false);
  if (!built) assert.equal(await page.evaluate(async () => (await import("./js/workspace.js")).isWorkspaceQuizSource(document.querySelector(".workspace-tool-frame").contentWindow)), false);
  assert.equal(await subject.locator(".stage.is-active").getAttribute("data-stage"), "4");
  await page.screenshot({ path: resolve(output, "chapter-overview-open.png"), fullPage: true });
  await frame.locator('[data-hub-math="display"]').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, 'html-math-desktop.png'), animations: 'disabled' });
  const sourceBeforePrint = await frame.locator('body').innerHTML();
  const printDialog = page.locator('[data-html-print-dialog]');
  const printFrame = page.frameLocator('[data-html-print-frame]');
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  assert.equal(await printFrame.locator('.hub-print-page-header').first().locator('span').first().textContent(), 'เคมี');
  assert.match(await printFrame.locator('.hub-print-page-header').first().locator('span').nth(1).textContent(), /10/);
  assert.equal(await printFrame.locator('script, button, iframe, [data-hub-html]').count(), 0);
  assert.ok(await printFrame.locator('mjx-container svg').count() >= 8);
  assert.equal(await page.locator('[data-html-print-frame]').getAttribute('sandbox'), 'allow-same-origin allow-modals');
  assert.equal(await printFrame.locator('.workspace-window-bar, .hub-taskbar').count(), 0);
  assert.equal(await page.evaluate(() => Boolean(window.__overviewScriptRan)), false);
  // In headless mode print() emits real lifecycle events without sending a printer job.
  await page.evaluate(() => {
    const frame = document.querySelector('[data-html-print-frame]');
    // Install the probe from the trusted parent, like the actual central controls.
    frame.contentWindow.addEventListener('beforeprint', () => { frame.contentDocument.body.dataset.printCalled = 'yes'; });
  });
  await page.locator('[data-print-confirm]').click();
  await printFrame.locator('body[data-print-called="yes"]').waitFor({ timeout:3000 });
  await page.locator('[data-print-close]').click();
  await printDialog.waitFor({ state:'detached' });
  assert.equal(await frame.locator('body').innerHTML(), sourceBeforePrint, 'Print preview never edits the reading content');
  assert.equal(await page.locator('.window-html-print').evaluate(node => node === document.activeElement), true);
  console.log('PASS central print preview is script-free, preserves SVG equations, calls native printing, closes back to unchanged reading content');
  await frame.locator("a[data-hub-html]").click();
  await page.frameLocator('.workspace-window[data-tool-id="content-html-qa-related-reading"] iframe').getByRole("heading", { name: "เอกสารอ่านเพิ่มเติม" }).waitFor();
  await page.frameLocator('.workspace-window[data-tool-id="content-html-qa-related-reading"] iframe').locator('html[data-hub-math-state="ready"]').waitFor();
  assert.equal(mathRequests.filter(url => url.endsWith('/tex-svg.js')).length, 1, 'One shared lazy runtime, no duplicate downloads per window');
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
  assert.equal(await page.locator('.window-html-print').count(), 0, 'Existing Quiz print workflow is unchanged');
  if (!built) assert.equal(await page.evaluate(async () => (await import("./js/workspace.js")).isWorkspaceQuizSource(document.querySelector(".workspace-tool-frame").contentWindow)), true);
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
    await frame.locator('html[data-hub-math-state="ready"]').waitFor();
    assert.equal(await frame.locator("body").evaluate(node => node.scrollWidth <= innerWidth + 2), true);
    await page.screenshot({ path: resolve(output, `chapter-overview-${viewport.width}.png`), fullPage: true });
    await frame.locator('[data-hub-math="display"]').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, `html-math-${viewport.width}.png`), animations: 'disabled' });
    await page.locator('.window-html-print').click();
    await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
    assert.equal(await printDialog.evaluate(node => node.getBoundingClientRect().right <= innerWidth + 1), true);
    assert.equal(await printFrame.locator('.hub-print-page').first().evaluate(node => node.getBoundingClientRect().right <= innerWidth + 2), true, 'A4 preview scales to narrow screens without changing pagination');
    await page.screenshot({ path:resolve(output, `html-print-preview-${viewport.width}.png`), animations:'disabled' });
    await page.locator('[data-print-close]').click();
    await closeSummary();
  }
  console.log("PASS tablet and phone-size layouts without horizontal overflow (not a real iPad hardware test)");

  async function openReading(id, source, title = 'QA reading') {
    await page.evaluate(({ id, source, title }) => {
      const link = document.createElement('a'); link.dataset.hubHtml = ''; link.dataset.contentId = id;
      link.dataset.subjectId = 'chemistry'; link.dataset.chapterId = '10';
      link.href = source; link.textContent = title; document.body.append(link); link.click(); link.remove();
    }, { id, source, title });
  }
  await page.setViewportSize({width:1440,height:1000});
  await openReading('qa-rich-print', origin + prefix + 'content/qa-overview/print-rich.html');
  await frame.getByRole('heading', {name:'ตาราง รูป และ SVG'}).waitFor();
  const originalRich = await frame.locator('body').innerHTML();
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  const count = await printFrame.locator('.hub-print-page').count();
  assert.ok(count > 3);
  assert.equal(await printFrame.locator('tr[data-row]').count(),75);
  assert.deepEqual(await printFrame.locator('tr[data-row]').evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.row))),Array.from({length:75},(_,i)=>i));
  assert.equal(await printFrame.locator('table').evaluateAll(tables=>tables.every(table=>table.querySelector('thead'))),true);
  assert.deepEqual(await printFrame.locator('li[data-list]').evaluateAll(nodes=>nodes.map(node=>Number(node.value))),Array.from({length:18},(_,i)=>i+6));
  assert.equal(await printFrame.locator('[data-long-text]').evaluateAll(nodes=>nodes.map(node=>node.textContent).join('')), 'คำอธิบายภาษาไทยและ English with inline emphasis. '.repeat(200));
  assert.equal(await printFrame.locator('svg use').getAttribute('href'),'#diagram-mark');
  assert.equal(await printFrame.locator('.print-inline-style').evaluate(node=>getComputedStyle(node).color),'rgb(10, 70, 130)');
  assert.equal(await printFrame.locator('.hub-print-page-header').evaluateAll(rows=>rows.every(row=>row.children[0].textContent==='เคมี' && row.children[1].textContent==='บทที่ 10 กรด–เบส' && row.children[2].textContent==='')),true);
  assert.deepEqual(await printFrame.locator('.hub-print-page-number').allTextContents(),Array.from({length:count},(_,i)=>`หน้า ${i+1} / ${count}`));
  async function assertNoOverflow() {
    assert.equal(await printFrame.locator('.hub-print-page-body').evaluateAll(nodes=>nodes.every(node=>node.scrollHeight<=node.clientHeight+1 && node.scrollWidth<=node.clientWidth+1)),true,'All pages retain their content within the reserved area');
  }
  await assertNoOverflow();
  await page.emulateMedia({media:'print'}); await assertNoOverflow(); await page.emulateMedia({media:'screen'});
  await printDialog.locator('summary').click();
  await page.locator('[data-print-profile]').selectOption('device-margins');
  assert.equal(await page.locator('[data-print-confirm]').isDisabled(), true);
  await page.locator('[data-print-rebuild]').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  await assertNoOverflow();
  await page.emulateMedia({media:'print'}); await assertNoOverflow(); await page.emulateMedia({media:'screen'});
  assert.deepEqual(await printFrame.locator('tr[data-row]').evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.row))),Array.from({length:75},(_,i)=>i));
  assert.equal(await printFrame.locator('table').evaluateAll(tables=>tables.every(table=>table.querySelector('thead'))),true);
  assert.deepEqual(await printFrame.locator('li[data-list]').evaluateAll(nodes=>nodes.map(node=>Number(node.value))),Array.from({length:18},(_,i)=>i+6));
  assert.equal(await printFrame.locator('[data-long-text]').evaluateAll(nodes=>nodes.map(node=>node.textContent).join('')), 'คำอธิบายภาษาไทยและ English with inline emphasis. '.repeat(200));
  await page.locator('[data-print-field="topic"]').fill('ชื่อเฉพาะการพิมพ์ครั้งนี้');
  assert.equal(await page.locator('[data-print-confirm]').isDisabled(),true);
  await page.locator('[data-print-rebuild]').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  assert.equal(await printFrame.locator('.hub-print-page-header').first().locator('span').last().textContent(),'ชื่อเฉพาะการพิมพ์ครั้งนี้');
  await page.locator('[data-print-close]').click();
  assert.equal(await frame.locator('body').innerHTML(),originalRich);
  await page.locator('.window-control.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({state:'detached'});
  await openReading('qa-oversized-print',origin+prefix+'content/qa-overview/print-oversized.html');
  await frame.locator('figure').waitFor();
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="error"]').waitFor();
  assert.equal(await page.locator('[data-print-confirm]').isDisabled(),true);
  assert.match(await page.locator('[data-print-status]').textContent(),/ใหญ่เกินพื้นที่/);
  await page.locator('[data-print-close]').click();
  await page.locator('.window-control.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({state:'detached'});
  console.log('PASS explicit A4 pages, repeat headers/footers, continuous table rows and list numbers, long Thai text, linked/inline SVG, per-print labels and oversized-content protection');
  await openReading('qa-adversarial', origin + prefix + 'content/qa-overview/adversarial.html');
  await frame.locator('html[data-hub-math-state="partial"]').waitFor();
  assert.equal(await frame.locator('[data-hub-math-error]').count(), 3);
  assert.ok(await frame.locator('table mjx-container').count() === 2);
  assert.equal(await frame.locator('pre').textContent(), String.raw`\(leaveCodeAlone\)`);
  assert.equal(await frame.locator('[data-no-math]').textContent(), String.raw`\(leaveTextAlone\)`);
  assert.equal(await frame.locator('a[href^="javascript:"]').count(), 0);
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="error"]').waitFor();
  assert.equal(await page.locator('[data-print-confirm]').isDisabled(), true, 'Do not print unfinished equations silently');
  await page.locator('[data-print-close]').click();
  assert.equal(await page.evaluate(() => Boolean(window.__overviewScriptRan)), false);
  assert.equal(mathRequests.filter(url => !/\/(?:tex-svg|mhchem|safe)\.js$/.test(url)).length, 0, 'TeX cannot autoload other packages');
  await page.locator('.window-control.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({ state: 'detached' });
  console.log('PASS real MathJax fractions, roots, chemistry, vectors, calculus and table cells; malformed/unsafe TeX preserves text; sandbox unchanged');

  await openReading('qa-image-print', origin + prefix + 'content/qa-overview/image-reading.html');
  await frame.getByRole('heading', { name:'Image print' }).waitFor();
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  assert.equal(await printFrame.locator('img').getAttribute('src'), origin + prefix + 'content/qa-overview/sample.svg');
  assert.equal(await printFrame.locator('img').evaluate(node => node.complete && node.naturalWidth > 0), true);
  assert.equal(await printFrame.locator('button, [onclick]').count(), 0);
  await page.locator('[data-print-close]').click();
  // Failure must stay actionable and never enable an incomplete print.
  await page.route('**/content/qa-overview/sample.svg', route => route.abort());
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="error"]').waitFor();
  assert.equal(await page.locator('[data-print-confirm]').isDisabled(), true);
  await page.keyboard.press('Escape');
  await printDialog.waitFor({ state:'detached' });
  await page.unroute('**/content/qa-overview/sample.svg');
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  await page.locator('[data-print-close]').click();
  await page.locator('.window-control.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({ state:'detached' });

  // Real teacher-authored chapter: read-only QA, no edits to the content file.
  await openReading('qa-acid-print', origin + prefix + 'content/chemistry/acid-base/chapter-overview.html', 'ผลการเรียนรู้และสรุปบท');
  await frame.locator('html[data-hub-math-state="ready"]').waitFor();
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  await page.setViewportSize({ width:1440, height:1000 });
  const actualPageCount = await printFrame.locator('.hub-print-page').count();
  const standardContent = await printFrame.locator('.hub-print-page-body').evaluateAll(nodes=>nodes.map(node=>node.textContent).join(''));
  const standardMathCount = await printFrame.locator('mjx-container svg').count();
  const standardFont = await printFrame.locator('h1').evaluate(node=>getComputedStyle(node).fontSize);
  console.log(`Actual acid-base summary: ${actualPageCount} pages`);
  await assertNoOverflow();
  await page.emulateMedia({media:'print'}); await assertNoOverflow(); await page.emulateMedia({media:'screen'});
  await page.screenshot({ path:resolve(output, 'html-print-preview.png'), animations:'disabled' });
  async function exportPrintPDF(name, nativeMargins = false) {
    const snapshot = await printFrame.locator('html').evaluate(node => '<!doctype html>' + node.outerHTML);
    const pdfPage = await context.newPage();
    await pdfPage.setContent(snapshot, { waitUntil:'load' });
    await pdfPage.evaluate(() => document.fonts.ready);
    // Explicit stress fixture, not an emulation of iPad's native print engine:
    // reserve device margins even when the full-A4 frame requested margin:0.
    if (nativeMargins) await pdfPage.addStyleTag({content:'@page { size:A4 portrait; margin:15mm; }'});
    const pdf = await pdfPage.pdf({ path:resolve(output, name), preferCSSPageSize:true, printBackground:true, displayHeaderFooter:nativeMargins,
      headerTemplate:'<span></span>', footerTemplate:'<div style="font-size:8px;width:100%;text-align:center">Device footer · <span class="pageNumber"></span></div>' });
    await pdfPage.close();
    // Chromium's generated PDFs have one uncompressed /Type /Page object per
    // physical sheet; this check is only for our test output, not arbitrary PDFs.
    return (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  }
  if (process.env.QA_PRINT_PDF === '1') {
    assert.equal(await exportPrintPDF('chapter-overview-print.pdf'), actualPageCount);
    const overflowCount = await exportPrintPDF('chapter-overview-device-margins-before.pdf', true);
    assert.ok(overflowCount >= actualPageCount);
    // Chromium can shrink the old full-width shell to fit; unlike the supplied
    // Safari PDF it need not add pages. Do not claim this reproduces native iOS.
    console.log(`Standard layout with margins (Chromium): ${actualPageCount} logical / ${overflowCount} physical pages`);
  }
  await printDialog.locator('summary').click();
  await page.locator('[data-print-profile]').selectOption('device-margins');
  assert.equal(await page.locator('[data-print-confirm]').isDisabled(),true);
  await page.locator('[data-print-rebuild]').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  assert.equal(await printFrame.locator('html').getAttribute('data-hub-print-profile'),'device-margins');
  assert.equal(await printFrame.locator('.hub-print-page-body').evaluateAll(nodes=>nodes.map(node=>node.textContent).join('')),standardContent);
  assert.equal(await printFrame.locator('mjx-container svg').count(),standardMathCount);
  assert.equal(await printFrame.locator('h1').evaluate(node=>getComputedStyle(node).fontSize),standardFont,'Compatibility mode does not shrink text');
  await assertNoOverflow();
  await page.emulateMedia({media:'print'}); await assertNoOverflow(); await page.emulateMedia({media:'screen'});
  const devicePageCount = await printFrame.locator('.hub-print-page').count();
  assert.deepEqual(await printFrame.locator('.hub-print-page-number').allTextContents(),Array.from({length:devicePageCount},(_,i)=>`หน้า ${i+1} / ${devicePageCount}`));
  if (process.env.QA_PRINT_PDF === '1') {
    const physicalCount = await exportPrintPDF('chapter-overview-device-margins-after.pdf',true);
    assert.equal(physicalCount,devicePageCount,'Every reserved-area page must fit one physical A4 sheet, including the last page');
    console.log(`Margin stress after fix: ${devicePageCount} logical / ${physicalCount} physical pages`);
  }
  await page.setViewportSize({width:820,height:1180});
  await page.screenshot({path:resolve(output,'html-print-ipad-margins.png'),animations:'disabled'});
  await page.locator('[data-print-profile]').selectOption('standard');
  await page.locator('[data-print-rebuild]').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  assert.equal(await printFrame.locator('.hub-print-page').count(),actualPageCount,'Switching back rebuilds the original standard pages');
  await page.locator('[data-print-close]').click();
  // Desktop-mode iPad identification only; the native Safari print dialog still
  // needs a real device acceptance test. No browser/device claim is inferred here.
  await page.evaluate(() => {
    Object.defineProperty(navigator,'platform',{value:'MacIntel',configurable:true});
    Object.defineProperty(navigator,'maxTouchPoints',{value:5,configurable:true});
  });
  await page.locator('.window-html-print').click();
  await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  assert.equal(await page.locator('[data-print-profile]').inputValue(),'device-margins');
  assert.equal(await printFrame.locator('html').getAttribute('data-hub-print-profile'),'device-margins');
  await page.locator('[data-print-close]').click();
  await page.evaluate(() => { delete navigator.platform; delete navigator.maxTouchPoints; });
  await page.locator('.window-control.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({ state:'detached' });
  console.log('PASS relative images and real acid-base chapter prepare for printing without changing authored HTML');

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

  // A fresh Hub with a failed local renderer must retain all authored content.
  mode = 'ready';
  await page.route('**/vendor/mathjax-3.2.2/es5/tex-svg.js', route => route.abort());
  await page.goto('about:blank'); // Same-URL hash navigation would reuse the loaded runtime.
  await enterChapter(); await button.click();
  await frame.locator('html[data-hub-math-state="error"]').waitFor();
  assert.ok((await frame.locator('body').textContent()).includes(String.raw`\frac{-K_a+\sqrt{K_a^2+4K_a C}}{2}`));
  assert.equal(await frame.locator('[data-hub-math-notice]').count(), 1);
  await closeSummary();
  assert.deepEqual(errors, []);
  console.log('PASS failed renderer has readable original TeX and a reload instruction, without breaking navigation');
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
