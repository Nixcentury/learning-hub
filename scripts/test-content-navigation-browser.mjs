import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Runs the actual Hub, navigation and Quiz Engine. Authentication/database are
// in-memory substitutes; external network traffic never reaches live services.
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const prefix = "/Physic-subject/";
const copyId = "chem-le-chatelier-copy-qa";
let copyMode = false, brokenMode = false;
const auth = `const session={status:'signed-in',isGuest:false,user:{uid:'navigation-qa',displayName:'Navigation QA',email:'qa@example.test'}};
export function getAuthSession(){return session;} export function subscribeAuth(fn){fn(session);return ()=>{};}
export async function continueAsGuest(){} export async function signInWithGoogle(){} export async function signOutFromHub(){}`;
const presence = `export function setPresenceContext(){} export async function stopPresence(){} export function subscribePresence(fn){fn({connectionStatus:'OFFLINE',rows:[],counts:{active:0,online:0,idle:0,visible:0},error:''});return ()=>{};}`;
const roles = `export function retryRoleCheck(){} export async function cancelTeacherRequest(){} export async function requestTeacherAccess(){} export function subscribeRoles(fn){fn({uid:'navigation-qa',status:'ready',systemRole:'student',isAdmin:false,isTeacher:false,requestStatus:'none',request:null,error:''});return ()=>{};}`;
const database = `const records=new Map();export const getDatabase=()=>({});export const ref=(_,path)=>path;
export const serverTimestamp=()=>Date.now();export async function get(path){const value=records.get(path);return {exists:()=>value!==undefined,val:()=>structuredClone(value)};}
export async function set(path,value){records.set(path,structuredClone(value));}
export async function update(){} export function onValue(){return ()=>{};}`;
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith(prefix)) throw new Error("Outside fixture base");
    const name = pathname.slice(prefix.length) || "index.html";
    let path = resolve(root, name);
    if (!path.startsWith(root + sep)) throw new Error("Outside root");
    let data;
    if (copyMode && name.endsWith("/quiz-copy-qa.html")) {
      data = (await readFile(resolve(root, "public/content/chemistry/equilibrium/quiz-template.html"), "utf8")).replaceAll("chem-le-chatelier-starter-v1", copyId);
    } else {
      try { data = await readFile(path); }
      catch { path = resolve(root, "public", name); data = await readFile(path); }
    }
    if (name.endsWith("/equilibrium/le-chatelier.html")) {
      let html = data.toString();
      if (brokenMode) html = html.replace('href="quiz-template.html"', 'href="https://evil.test/x.html"');
      if (copyMode) html = html.replace("</nav>", `<a data-tool-kind="quiz" data-content-id="${copyId}" href="quiz-copy-qa.html" data-th="ชุดที่คัดลอก QA" data-en="Copied QA set">ชุดที่คัดลอก QA</a></nav>`);
      data = html;
    }
    response.setHeader("Content-Type", ({".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".svg":"image/svg+xml", ".woff2":"font/woff2"})[extname(name)] || "application/octet-stream");
    response.end(data);
  } catch { response.writeHead(404); response.end("Not found"); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    const replacements = { "auth.js": auth, "presence.js": presence, "roles.js": roles, "firebase-config.js": "export const firebaseApp={};" };
    const name = url.pathname.split("/").at(-1);
    if (url.origin === origin && url.pathname.includes("/js/") && replacements[name]) return route.fulfill({contentType:"text/javascript",body:replacements[name]});
    if (url.hostname === "www.gstatic.com" && name === "firebase-database.js") return route.fulfill({contentType:"text/javascript",body:database});
    if (url.origin !== origin) return route.fulfill({contentType:"text/javascript",body:""});
    return route.continue();
  });
  const page = await context.newPage();
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", dialog => dialog.accept());
  const output = resolve(process.env.QA_OUTPUT || resolve(root, "qa-output"));
  await mkdir(output, { recursive: true });
  async function enterChapter() {
    const subject = page.frameLocator("#hub-page-frame");
    await subject.locator(".orbit-select").selectOption("8");
    await subject.locator(".orbit-open").click();
    await subject.locator('[data-menu-entry="le-chatelier"]').waitFor();
    assert.equal(await subject.locator('.stage:not([hidden])').count(), 4);
    return subject;
  }
  async function enterTopic(subject) {
    await subject.locator('[data-menu-entry="le-chatelier"]').click();
    await subject.locator('[data-menu-entry="chem-le-chatelier-starter-v1"]').waitFor();
  }
  async function quizObject(index = 0) {
    return await page.locator(".workspace-tool-frame").nth(index).elementHandle().then(handle => handle.contentFrame());
  }
  await page.goto(origin + prefix + "#chemistry");
  let subject = await enterChapter();
  assert.equal(await subject.locator('[data-menu-entry]').count(), 9);
  for (const topic of ['reversible-process', 'equilibrium-graphs', 'equilibrium-expression', 'equilibrium-manipulation', 'reaction-quotient', 'equilibrium-calculations', 'disturbance-graphs', 'equilibrium-applications']) {
    const card = subject.locator(`[data-menu-entry="${topic}"]`);
    assert.equal(await card.isDisabled(), true);
    assert.equal(await card.locator('small').textContent(), 'กำลังเตรียมเนื้อหา');
  }
  assert.equal(await subject.locator('.stage.is-active').getAttribute('data-stage'), '2');
  await page.locator('#hub-view [data-language="en"]').click();
  await subject.locator('[data-content-status="preparing"] small').first().filter({hasText:'Content in preparation'}).waitFor();
  await page.locator('#hub-view [data-language="th"]').click();
  console.log('PASS nine topics visible; eight link-free topics show bilingual preparation labels and cannot navigate');
  await enterTopic(subject);
  await page.screenshot({ path: resolve(output, "navigation-topics-desktop.png"), fullPage: true, animations: "disabled" });
  await subject.locator('[data-menu-entry="chem-le-chatelier-starter-v1"]').click();
  let quiz = page.frameLocator(".workspace-tool-frame");
  await quiz.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  await quiz.locator('[data-current-options] .quiz-option').first().click();
  await quiz.locator('[data-reasoning-input]').fill("เหตุผลทดสอบ: ระบบสร้าง HBr กลับคืน");
  let child = await quizObject();
  await child.waitForFunction(() => LearningHubQuiz.getState().answers.q21 === "a");
  assert.equal(await child.evaluate(() => LearningHubQuiz.getState().contentId), "chem-le-chatelier-starter-v1");
  await page.locator(".window-control.is-close").click();
  await page.locator(".workspace-tool-frame").waitFor({state:"detached"});
  assert.equal(await subject.locator('.stage.is-active').getAttribute('data-stage'), "3");
  await subject.locator('[data-menu-entry="chem-le-chatelier-starter-v1"]').click();
  quiz = page.frameLocator(".workspace-tool-frame"); child = await quizObject();
  await child.waitForFunction(() => window.LearningHubQuiz?.getState().answers.q21 === "a");
  assert.equal(await quiz.locator('[data-reasoning-input]').inputValue(), "เหตุผลทดสอบ: ระบบสร้าง HBr กลับคืน");
  console.log("PASS real Hub → chapter → topic → quiz; account bridge and close/reopen preserve answer/reasoning");
  await page.locator(".window-control.is-close").click();
  await page.locator(".workspace-tool-frame").waitFor({state:"detached"});
  await subject.locator('[data-menu-back]').click();
  await subject.locator('[data-menu-entry="le-chatelier"]').waitFor();
  await subject.locator('[data-menu-back]').click();
  assert.equal(await subject.locator('.orbit-select').inputValue(), "8");
  console.log("PASS back buttons retain the selected chapter");

  // Virtual copies emulate only two author edits: a copied HTML quiz plus one <a>.
  // No production content or JavaScript is changed by this test.
  copyMode = true;
  await page.reload(); subject = await enterChapter(); await enterTopic(subject);
  await subject.locator(`[data-menu-entry="${copyId}"]`).click();
  child = await quizObject();
  await child.waitForFunction(() => window.LearningHubQuiz?.getState().contentId === "chem-le-chatelier-copy-qa");
  assert.deepEqual(await child.evaluate(() => LearningHubQuiz.getState().answers), {});
  await page.locator(".window-control.is-minimize").click();
  await subject.locator('[data-menu-entry="chem-le-chatelier-starter-v1"]').click();
  await page.locator(".workspace-tool-frame").nth(1).waitFor({state:"attached"});
  assert.equal(await page.locator(".workspace-tool-frame").count(), 2);
  child = await quizObject(1);
  await child.waitForFunction(() => window.LearningHubQuiz?.getState().answers.q21 === "a");
  console.log("PASS HTML-only copied set appears and has independent work; original quiz retains its state");
  await page.reload(); subject = await enterChapter(); await enterTopic(subject);
  await page.locator('#hub-view [data-language="en"]').click();
  await subject.getByText("Copied QA set", {exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:resolve(output,"navigation-topics-mobile.png"),fullPage:true,animations:"disabled"});
  assert.equal(await subject.locator("body").evaluate(body => body.scrollWidth <= innerWidth + 2), true);
  console.log("PASS language switch and narrow-screen layout");
  copyMode = false; brokenMode = true;
  await page.reload(); subject = await enterChapter();
  await subject.locator('[data-menu-entry="le-chatelier"]').click();
  await subject.locator('.content-menu-notice.is-error').waitFor();
  assert.equal(await page.locator(".workspace-tool-frame").count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS unsafe menu destination is rejected; no live Firebase or Worker used");
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
