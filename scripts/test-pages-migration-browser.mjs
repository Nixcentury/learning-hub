import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Exercise the real production artifact. External SDKs are isolated test doubles;
// no Google sign-in, live database writes, or AI requests are made by this test.
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
// Optionally verify the actual independent legacy artifact, not just an alias.
const legacyDist = process.env.LEGACY_PAGES_ARTIFACT ? resolve(process.env.LEGACY_PAGES_ARTIFACT) : dist;
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const prefixes = ['/learning-hub/', '/Physic-subject/'];
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const prefix = prefixes.find(value => pathname.startsWith(value));
    assert.ok(prefix);
    const name = pathname.slice(prefix.length) || 'index.html';
    const artifact = prefix === '/Physic-subject/' ? legacyDist : dist;
    const path = resolve(artifact, name);
    assert.ok(path.startsWith(artifact + sep));
    response.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' })[extname(path)] || 'application/octet-stream');
    response.end(await readFile(path));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});
    export const setPersistence=async()=>{};export const onAuthStateChanged=(_,fn)=>{fn(null);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Real login disabled in QA')};`,
  'firebase-database.js': `export const getDatabase=()=>({});export const ref=(_,p)=>p;
    export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};
    export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>Date.now();
    export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});
    export const set=async()=>{throw Error('No database writes in migration QA')};export const update=set;export const remove=set;`,
};
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    return route.fulfill({ contentType: 'text/javascript', body: url.hostname === 'www.gstatic.com' ? (stubs[url.pathname.split('/').at(-1)] || '') : '' });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url()); });
  page.on('dialog', dialog => dialog.accept());
  await page.goto(origin + '/learning-hub/');
  await page.locator('#guest-button').click();
  await page.locator('#hub-view').waitFor({ state: 'visible' });
  for (const section of ['physics', 'chemistry', 'biology', 'lower-science', 'science-ep', 'math-ep', 'upper-math', 'test', 'classroom']) {
    await page.locator(`[data-section="${section}"]`).click();
    await page.waitForFunction(section => {
      const url = document.querySelector('#hub-page-frame')?.contentDocument?.URL;
      return url && new URL(url).pathname.endsWith(`/pages/${section}.html`);
    }, section);
    assert.ok(await page.frameLocator('#hub-page-frame').locator('body').isVisible());
  }
  console.log('PASS built Hub, all subject tabs and Classroom open under /learning-hub/');

  const quizUrl = (prefix, content) => `${origin}${prefix}pages/tools/quiz-player.html?content=../../content/${content}&lang=th`;
  await page.goto(quizUrl('/learning-hub/', 'templates/quiz-template.html'));
  await page.locator('[data-current-options] .quiz-option').first().click();
  await page.locator('[data-reasoning-input]').fill('Migration QA reason');
  await page.locator('[data-notebook-panel] summary').click();
  await page.waitForFunction(() => document.querySelector('[data-notebook-core]')?.inert === false);
  const canvas = page.locator('[data-notebook-canvas]');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 70, box.y + 70); await page.mouse.down();
  await page.mouse.move(box.x + 140, box.y + 110, { steps: 10 }); await page.mouse.up();
  await page.evaluate(() => LearningHubQuiz.prepareClose());
  const writtenPage = await canvas.evaluate(node => node.toDataURL());
  async function assertNotebookRestored(target) {
    await target.locator('[data-notebook-panel] summary').click();
    await target.waitForFunction(() => document.querySelector('[data-notebook-core]')?.inert === false);
    assert.equal(await target.locator('[data-notebook-canvas]').evaluate(node => node.toDataURL()), writtenPage,
      'Saved handwriting must be rendered again, not only remain in IndexedDB');
  }
  const answer = await page.evaluate(() => LearningHubQuiz.getState().answers);
  await page.reload();
  await page.locator('[data-current-options] .quiz-option').first().waitFor();
  assert.deepEqual(await page.evaluate(() => LearningHubQuiz.getState().answers), answer);
  assert.equal(await page.locator('[data-reasoning-input]').inputValue(), 'Migration QA reason');
  const strokes = await page.evaluate(async () => {
    const db = await new Promise((done, fail) => { const request = indexedDB.open('learning-hub-quiz-evidence', 1); request.onsuccess = () => done(request.result); request.onerror = fail; });
    const count = await new Promise(done => { const request = db.transaction('notebookPages').objectStore('notebookPages').getAll(); request.onsuccess = () => done(request.result.reduce((n, record) => n + (record.strokes?.length || 0), 0)); });
    db.close(); return count;
  });
  assert.ok(strokes > 0, 'Handwriting must be committed in IndexedDB');
  await assertNotebookRestored(page);
  console.log('PASS choice answers, reasoning and handwriting persist after reload');
  await page.goto(quizUrl('/Physic-subject/', 'templates/quiz-template.html'));
  await page.locator('[data-current-options] .quiz-option').first().waitFor();
  assert.deepEqual(await page.evaluate(() => LearningHubQuiz.getState().answers), answer);
  assert.equal(await page.locator('[data-reasoning-input]').inputValue(), 'Migration QA reason');
  await assertNotebookRestored(page);
  console.log('PASS stable quiz IDs recover the same draft across path aliases on one origin');
  const reopened = await context.newPage();
  reopened.on('pageerror', error => errors.push(error.message));
  reopened.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) missing.push(response.url()); });
  await reopened.goto(quizUrl('/learning-hub/', 'templates/quiz-template.html'));
  await reopened.locator('[data-current-options] .quiz-option').first().waitFor();
  assert.deepEqual(await reopened.evaluate(() => LearningHubQuiz.getState().answers), answer);
  assert.equal(await reopened.locator('[data-reasoning-input]').inputValue(), 'Migration QA reason');
  await assertNotebookRestored(reopened);
  await reopened.close();
  console.log('PASS a new browser tab restores the answer, reasoning and identical rendered handwriting');

  await page.goto(quizUrl('/learning-hub/', 'samples/numeric-input-demo.html'));
  await page.locator('math-field[data-numeric-answer]').waitFor();
  assert.equal(await page.locator('[data-numeric-answer]').count(), 1);
  await page.locator('[data-numeric-answer]').evaluate(field => { field.value = '5/6'; field.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForFunction(() => Boolean(LearningHubQuiz.getState().answers['fraction-sum']));
  assert.equal(await page.evaluate(async () => {
    const { parseNumericAnswer } = await import('../../shared/quiz-question-model.js');
    return parseNumericAnswer(LearningHubQuiz.getState().answers['fraction-sum']);
  }), 5 / 6);
  console.log('PASS numeric question and single answer field load with local math assets');
  await page.goto(quizUrl('/learning-hub/', 'samples/drag-drop-demo.html'));
  await page.waitForFunction(() => window.LearningHubQuiz?.getState().contentId === 'drag-drop-demo-v1');
  assert.ok(await page.locator('.quiz-drag-piece').count() > 0);
  console.log('PASS drag-drop player and content load');
  await page.setViewportSize({ width: 820, height: 1180 });
  assert.ok(await page.locator('[data-current-options]').isVisible());
  await mkdir(resolve(root, 'qa-output'), { recursive: true });
  await page.screenshot({ path: resolve(root, 'qa-output/migration-ipad-size.png'), fullPage: true });
  assert.deepEqual(missing, [], 'No local resource may return 404');
  assert.deepEqual(errors, [], 'No uncaught page errors');
  console.log('PASS tablet-size rendering; no local 404s or uncaught errors. Live OAuth/AI/Firebase are NOT tested.');
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
