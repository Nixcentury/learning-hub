import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Browser integration with real DOM/canvas/IndexedDB and fake Firebase only.
// All non-local network requests are intercepted. No account or AI is used.
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const harness = `<!doctype html><html lang="en"><head><link rel="stylesheet" href="/css/styles.css"></head>
<body><button id="open">Open quiz</button><div id="layer" class="workspace-window-layer" style="position:relative;height:900px"></div>
<div id="taskbar"><span id="count"></span><div id="items"></div></div>
<script type="module">
import {createWorkspace} from '/js/workspace.js';
import {setUser,getAuthSession} from '/js/auth.js';
import '/js/quiz-progress.js';
window.db = { records:{}, hold:false, fail:false, releases:[], writes:[] };
const workspace = createWorkspace({windowLayer:document.querySelector('#layer'),taskbar:document.querySelector('#taskbar'),taskbarItems:document.querySelector('#items'),countElement:document.querySelector('#count'),getLanguage:()=> 'en',getRole:()=> 'student',getIdentity:()=>({uid:getAuthSession().user?.uid,status:getAuthSession().status})});
window.qa = { workspace, setUser(uid){setUser(uid);workspace.setContext();}, release(){db.hold=false;db.releases.splice(0).forEach(fn=>fn());} };
document.querySelector('#open').onclick=()=>workspace.open('test-c1-quiz');
window.qaReady = true;
</script></body></html>`;
const auth = `let session={status:'signed-in',user:{uid:'qa-a'}};const listeners=[];
export function getAuthSession(){return session;}
export function subscribeAuth(fn){listeners.push(fn);fn(session);return ()=>{};}
export function setUser(uid){session={status:uid?'signed-in':'guest',user:uid?{uid}:null};listeners.forEach(fn=>fn(session));}`;
const database = `export const getDatabase=()=>({});export const ref=(_,path)=>path;
export const serverTimestamp=()=>Date.now();
export async function get(path){const value=structuredClone(window.db.records[path]||null);if(window.db.hold)await new Promise(resolve=>window.db.releases.push(resolve));if(window.db.fail)throw {code:'permission-denied'};return {exists:()=>value!==null,val:()=>value};}
export async function set(path,value){window.db.records[path]=structuredClone(value);window.db.writes.push({path,value});}`;
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname === "/__qa") { response.setHeader("Content-Type", "text/html"); response.end(harness); return; }
    const relative = pathname.replace(/^\/+/, "");
    let path = resolve(root, relative);
    if (!path.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
    let data;
    try { data = await readFile(path); }
    catch { path = resolve(root, "public", relative); data = await readFile(path); }
    response.setHeader("Content-Type", ({".html":"text/html", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".woff2":"font/woff2"})[extname(path)] || "application/octet-stream");
    response.end(data);
  } catch { response.writeHead(404); response.end("Not found"); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({channel:"msedge",headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1100}});
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/js/auth.js") return route.fulfill({contentType:"text/javascript",body:auth});
    if (url.pathname === "/js/firebase-config.js") return route.fulfill({contentType:"text/javascript",body:"export const firebaseApp={};"});
    if (url.hostname === "www.gstatic.com" && url.pathname.endsWith("firebase-database.js")) return route.fulfill({contentType:"text/javascript",body:database});
    if (url.origin !== origin) return route.fulfill({contentType:"text/javascript",body:""});
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if(message.type() === 'warning') console.log('Browser warning:',message.text()); });
  page.on("dialog", dialog => dialog.accept());
  await page.goto(origin + "/__qa");
  await page.waitForFunction(()=>window.qaReady);
  async function open() {
    await page.locator("#open").click();
    const frame = page.frameLocator(".workspace-tool-frame");
    await frame.locator("[data-current-options] .quiz-option").first().waitFor();
    return frame;
  }
  async function frameObject() { return await page.locator(".workspace-tool-frame").elementHandle().then(handle => handle.contentFrame()); }
  const cloudKey = "quizProgress/qa-a/quiz-template-test-v1";
  const saved = {version:2,answers:{q1:"b"},giveUps:{},hintLevels:{},masteredIds:[],currentIndex:0,attempt:1,view:"exam",elapsedMs:0,savedAt:100,latestScore:null};
  await page.evaluate(({cloudKey,saved})=>{db.records[cloudKey]=saved;db.hold=true;},{cloudKey,saved});
  let frame = await open();
  await frame.locator('[data-question-jump="1"]').click();
  await page.evaluate(()=>qa.release());
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  let child = await frameObject();
  let state = await child.evaluate(()=>LearningHubQuiz.getState());
  assert.equal(state.answers.q1,"b");assert.equal(state.currentIndex,1);
  assert.equal(await page.evaluate(()=>db.writes.length),0);
  console.log("PASS delayed cloud + navigation preserves saved answers");

  await frame.locator('[data-question-jump="0"]').click();
  await frame.locator('[data-reasoning-input]').fill("QA reasoning for account A");
  await frame.locator('[data-notebook-panel] summary').click();
  await child.waitForFunction(()=>document.querySelector('[data-notebook-core]')?.inert === false);
  const canvas = frame.locator('[data-notebook-canvas]');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x+80,box.y+80);await page.mouse.down();
  await page.mouse.move(box.x+150,box.y+120,{steps:10});await page.mouse.up();
  await page.locator('.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({state:'detached'});
  frame=await open();child=await frameObject();
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await frame.locator('[data-reasoning-input]').inputValue(),"QA reasoning for account A");
  await frame.locator('[data-notebook-panel] summary').click();
  await child.waitForFunction(()=>document.querySelector('[data-notebook-core]')?.inert === false);
  const strokes = await child.evaluate(async()=>{
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('learning-hub-quiz-evidence',1);r.onsuccess=()=>resolve(r.result);r.onerror=reject;});
    const record=await new Promise(resolve=>{const r=db.transaction('notebookPages').objectStore('notebookPages').get('v1:qa-a:quiz-template-test-v1:q1');r.onsuccess=()=>resolve(r.result);});db.close();return record?.strokes.length||0;
  });
  assert.ok(strokes>0,"Real ink survives immediate window close");
  console.log("PASS real notebook + reasoning survive close/reopen");

  await page.evaluate(()=>qa.setUser('qa-b'));
  await child.waitForFunction(()=>LearningHubQuiz.getState().identityKey === 'qa-b');
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await frame.locator('[data-reasoning-input]').inputValue(),"");
  assert.deepEqual((await child.evaluate(()=>LearningHubQuiz.getState())).answers,{});
  await page.evaluate(()=>qa.setUser('qa-a'));
  await child.waitForFunction(()=>LearningHubQuiz.getState().identityKey === 'qa-a');
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await frame.locator('[data-reasoning-input]').inputValue(),"QA reasoning for account A");
  console.log("PASS account switch isolates answers and reasoning");

  await page.evaluate(()=>{db.fail=true;qa.setUser('qa-c');});
  await frame.locator('[data-quiz-storage-status][data-tone="cloud-error"]').waitFor();
  await frame.locator('.quiz-option').nth(1).click();
  await frame.locator('[data-quiz-storage-status][data-tone="cloud-error"]').waitFor();
  await page.evaluate(()=>{db.fail=false;});
  await frame.getByRole('button',{name:'Retry cloud sync',exact:true}).click();
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await page.evaluate(()=>db.records['quizProgress/qa-c/quiz-template-test-v1'].answers.q1),'b');
  console.log("PASS failed load + visible retry syncs without a stuck saving state");
  await child.evaluate(()=>window.LearningHubQuiz.flushLocal());
  await frame.locator('[data-reasoning-input]').fill('Local draft to preserve');
  // Browser-level reload of the child must preserve the local answer and reason.
  await child.evaluate(()=>LearningHubQuiz.flushLocal());
  await child.goto(child.url());
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await frame.locator('[data-reasoning-input]').inputValue(),'Local draft to preserve');
  assert.equal((await child.evaluate(()=>LearningHubQuiz.getState())).answers.q1,'b');
  console.log("PASS real iframe reload restores correct account and draft");
  await page.evaluate(({saved})=>{db.hold=true;db.records['quizProgress/qa-d/quiz-template-test-v1']=saved;qa.setUser('qa-d');},{saved});
  await frame.locator('.quiz-option').nth(0).click();
  await page.evaluate(()=>qa.release());
  await frame.locator('[data-quiz-storage-status][data-tone="conflict"]').waitFor();
  await frame.getByRole('button',{name:'Use cloud copy',exact:true}).click();
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal((await child.evaluate(()=>LearningHubQuiz.getState())).answers.q1,'b');
  console.log("PASS visible conflict choice preserves the cloud answer");
  await child.evaluate(()=>{
    window.qaOriginalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(){throw new DOMException('QA quota','QuotaExceededError');};
  });
  await page.locator('.is-close').click();
  await frame.locator('[data-quiz-storage-status][data-tone="memory"]').waitFor();
  assert.equal(await page.locator('.workspace-tool-frame').count(),1);
  await child.evaluate(()=>{Storage.prototype.setItem=window.qaOriginalSetItem;});
  await frame.getByRole('button',{name:'Retry device save',exact:true}).click();
  console.log("PASS a failed device save leaves the real window open");
  await page.locator('.is-close').click();
  await page.evaluate(()=>qa.workspace.open('test-c2-quiz'));
  frame = page.frameLocator('.workspace-tool-frame');
  child = await frameObject();
  await frame.locator('math-field[data-numeric-answer]').waitFor({timeout:12000});
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  await frame.locator('math-field').click();
  await frame.locator('math-field').press('5');
  await frame.locator('math-field').press('/');
  await frame.locator('math-field').press('6');
  const mathValue=await frame.locator('math-field').evaluate(element=>element.value);
  console.log('Numeric keyboard value:',mathValue);
  assert.match(mathValue,/frac/);
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await page.evaluate(()=>db.records['quizProgress/qa-d/numeric-input-demo-v1'].answers['fraction-sum']),mathValue);
  await page.locator('.is-close').click();
  await page.evaluate(()=>qa.workspace.open('test-c2-quiz'));
  frame=page.frameLocator('.workspace-tool-frame');child=await frameObject();
  await frame.locator('math-field').waitFor();
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal(await frame.locator('math-field').evaluate(element=>element.value),mathValue);
  console.log('PASS MathLive fraction entry + cloud save + close/reopen');
  await frame.locator('[data-submit-all]').click();
  await frame.locator('[data-evidence-warning-continue]').click();
  await frame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  assert.equal((await child.evaluate(()=>LearningHubQuiz.getState())).latestScore.score,1);
  console.log('PASS actual MathLive compact fraction is graded correctly');
  // New browser storage, same fake signed-in account: restore from cloud only.
  const second=await context.newPage();
  await second.goto(origin+'/__qa');
  await second.waitForFunction(()=>window.qaReady);
  const numericRecord=await page.evaluate(()=>db.records['quizProgress/qa-d/numeric-input-demo-v1']);
  await second.evaluate(record=>{localStorage.clear();db.records['quizProgress/qa-d/numeric-input-demo-v1']=record;qa.setUser('qa-d');qa.workspace.open('test-c2-quiz');},numericRecord);
  const secondFrame=second.frameLocator('.workspace-tool-frame');
  await secondFrame.locator('[data-quiz-storage-status][data-tone="cloud"]').waitFor();
  const secondChild=await second.locator('.workspace-tool-frame').elementHandle().then(handle=>handle.contentFrame());
  assert.equal((await secondChild.evaluate(()=>LearningHubQuiz.getState())).answers['fraction-sum'],mathValue);
  assert.equal((await secondChild.evaluate(()=>LearningHubQuiz.getState())).latestScore.score,1);
  console.log('PASS numeric answer and latest score restore from cloud without a device draft');
  await second.close();
  assert.deepEqual(errors,[]);
  const output=resolve(root,'qa-output');await mkdir(output,{recursive:true});
  await page.screenshot({path:resolve(output,'quiz-resume-desktop.png'),fullPage:true});
  console.log("Browser QA passed; no Firebase or Worker requests reached live services.");
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
