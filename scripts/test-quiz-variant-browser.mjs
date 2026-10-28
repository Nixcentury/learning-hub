import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/learning-hub/';
const built = process.env.QA_BUILT === '1';
const output = resolve(root, 'qa-output');
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const catalog = await catalogFromRepository();
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};
    export const onAuthStateChanged=(_,fn)=>{globalThis.__companionTestAuth=fn;setTimeout(()=>fn(null),20);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const getDatabase=()=>({});export const ref=(_,path)=>path;
    export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};
    export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>0;
    export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});
    export const set=async()=>{};export const update=set;export const remove=set;`,
};
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith(prefix)) throw Error('Outside prefix');
    const name = path.slice(prefix.length) || 'index.html';
    const directory = built ? resolve(root, 'dist') : root;
    if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
    let data;
    if (name === 'route-catalog.v1.json' && !built) data = JSON.stringify(catalog);
    else {
      try { data = await readFile(resolve(directory, name)); }
      catch { if (built) throw Error('Missing artifact'); data = await readFile(resolve(root, 'public', name)); }
    }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix).replaceAll('src="/shared/', `src="${prefix}shared/`);
    res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
      '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json' })[extname(name)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
  const requests = [], errors = [];
  let heldReply, fail = false;
  const answer = `<!-- learning-hub-practice:start -->
<div class="question-step" data-ans="B"><h3>What is \\(2+3\\)?</h3><table><tr><td>First</td><td>2</td></tr></table>
<div class="options"><label><input type="radio" value="A">4</label><label><input type="radio" value="B">5</label></div>
<div class="hint-box">Count forwards three times.</div><div class="feedback-box">2 + 3 = 5, so B is correct.</div></div>
<!-- learning-hub-practice:end -->`;
  await context.addInitScript(() => {
    if (new URLSearchParams(location.search).get('temporary') !== '1') return;
    window.__temporaryStorageCalls = [];
    for (const method of ['setItem', 'removeItem', 'clear']) Storage.prototype[method] = function () { window.__temporaryStorageCalls.push(method); throw Error('Temporary storage write forbidden'); };
    IDBFactory.prototype.open = function () { window.__temporaryStorageCalls.push('indexedDB.open'); throw Error('Temporary notebook storage forbidden'); };
  });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType: 'text/javascript', body: stubs[url.pathname.split('/').at(-1)] || '' });
    if (url.hostname === 'student-work-ai-checker.micksattawatbutklo.workers.dev') {
      const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'POST, OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      const payload = route.request().postDataJSON(); requests.push(payload);
      if (payload.userMessage.includes('slow')) await new Promise(done => { heldReply = done; });
      if (payload.userMessage.includes('retry') && !fail) { fail = true; return route.fulfill({ status: 429, headers, body: '{}' }); }
      const reply = payload.userMessage.includes('unsafe') ? answer.replace('<h3>', '<img src="https://example.test/tracker"><h3>')
        : payload.userMessage.includes('discuss') ? 'Would you like a numeric question or choices?' : answer;
      return route.fulfill({ headers, body: JSON.stringify({ reply }) }).catch(() => {});
    }
    return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + prefix); await page.locator('#guest-button').click();
  await page.locator('.companion-trigger').waitFor({ state: 'visible' });
  const subject = await page.locator('#hub-page-frame').elementHandle().then(handle => handle.contentFrame());
  await subject.waitForLoadState();
  await subject.evaluate(() => parent.postMessage({ type: 'learning-hub-open-tool', toolId: 'test-c2-quiz' }, location.origin));
  const source = page.frameLocator('.workspace-tool-frame');
  await source.locator('[data-generate-variant]').waitFor();
  const sourceFrame = await page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  const before = await sourceFrame.evaluate(() => LearningHubQuiz.getState());
  // A request from the subject iframe is not a request from an owned quiz.
  await subject.evaluate(() => parent.postMessage({ type: 'learning-hub-quiz-variant-request', source: { title: 'forged', number: 1, content: 'fake', hasImages: false } }, location.origin));
  assert.equal(await page.locator('.companion-variant').isVisible(), false);
  // Ordinary chat survives entering and leaving the question-specific mode.
  await page.locator('.companion-trigger').press('Enter');
  const panel = page.locator('.companion-chat'), input = panel.locator('textarea');
  await input.fill('discuss general'); await input.press('Enter');
  await panel.locator('.is-assistant p').filter({ hasText: 'numeric question' }).waitFor();
  await panel.locator('.companion-close').click();
  await source.locator('[data-generate-variant]').click();
  await panel.locator('.companion-variant').waitFor({ state: 'visible' });
  assert.equal(requests.length, 1, 'Selecting a source does not make an unsolicited paid request');
  await input.fill('discuss style'); await input.press('Enter');
  await panel.locator('.is-assistant p').filter({ hasText: 'numeric question' }).waitFor();
  assert.equal(await page.locator('.quiz-variant-preview').count(), 0);
  await panel.locator('.companion-variant-styles button').nth(1).click();
  await page.locator('.quiz-variant-preview[open]').waitFor();
  const practice = page.frameLocator('.quiz-variant-preview iframe');
  await practice.locator('.quiz-option').first().waitFor();
  const child = await page.locator('.quiz-variant-preview iframe').elementHandle().then(handle => handle.contentFrame());
  assert.match(requests.at(-1).conversation[0].text, /REFERENCE ANSWER/);
  assert.match(requests.at(-1).conversation[0].text, /\\frac/);
  assert.match(requests.at(-1).conversation[0].text, /learning-hub-practice:start/);
  assert.equal(Object.keys(requests.at(-1)).sort().join(','), 'conversation,mode,userMessage');
  assert.equal(await practice.locator('[data-generate-variant]').count(), 0, 'Temporary practice cannot recursively create more generator windows');
  await practice.locator('.quiz-option').nth(1).click(); await practice.locator('[data-submit-all]').click();
  await practice.locator('.quiz-results').waitFor();
  assert.equal(await child.evaluate(() => LearningHubQuiz.getState().latestScore.score), 1);
  assert.equal(await practice.locator('[data-evidence-gate]').count(), 0);
  assert.match(await practice.locator('[data-quiz-storage-status]').textContent(), /ปิดแล้วหาย/);
  await practice.locator('.quiz-result-item').click();
  await practice.locator('[data-current-solution]').waitFor({ state: 'visible' });
  assert.match(await practice.locator('[data-current-solution]').textContent(), /2 \+ 3 = 5/);
  assert.deepEqual(await child.evaluate(() => window.__temporaryStorageCalls), []);
  await page.evaluate(() => document.querySelector('.quiz-variant-preview iframe').contentWindow.postMessage({
    type: 'learning-hub-context', language: 'th', identity: { status: 'signed-in', uid: 'must-not-save-this-user' },
  }, location.origin));
  assert.equal(await child.evaluate(() => LearningHubQuiz.getState().identityKey), 'guest');
  await child.evaluate(() => LearningHubQuiz.save());
  assert.deepEqual(await child.evaluate(() => window.__temporaryStorageCalls), []);
  assert.equal(await child.evaluate(() => LearningHubQuiz.flushLocal()), true);
  assert.equal(await child.evaluate(() => LearningHubQuiz.prepareClose()), true);
  await page.locator('.quiz-variant-preview > header button').click();
  assert.equal(await page.locator('.quiz-variant-preview iframe').count(), 0);
  const after = await sourceFrame.evaluate(() => LearningHubQuiz.getState());
  for (const key of ['answers', 'giveUps', 'hintLevels', 'masteredIds', 'latestScore']) assert.deepEqual(after[key], before[key]);
  await panel.locator('.companion-close').click();
  await page.locator('.companion-trigger').press('Enter');
  assert.match(await panel.locator('.companion-messages').textContent(), /discuss general/);
  assert.doesNotMatch(await panel.locator('.companion-messages').textContent(), /discuss style/);
  console.log('PASS real Hub source button, pinned raw context, shared AI, central engine grading, zero temporary storage, close destroys iframe, original attempt and general conversation preserved');

  await panel.locator('.companion-close').click(); await source.locator('[data-generate-variant]').click();
  await input.fill('unsafe'); await input.press('Enter'); await panel.locator('.is-error button').waitFor();
  assert.equal(await page.locator('.quiz-variant-preview').count(), 0, 'Unsafe AI HTML never opens a quiz');
  await input.fill('retry'); await input.press('Enter'); await panel.locator('.is-error').nth(1).locator('button').waitFor();
  await panel.locator('.is-error').nth(1).locator('button').click();
  await page.locator('.quiz-variant-preview[open]').waitFor();
  await page.locator('.quiz-variant-preview > header button').click();
  await input.fill('slow'); await input.press('Enter'); await panel.locator('.companion-stop').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('.companion-form').getAttribute('aria-busy') === 'true');
  for (let attempt = 0; !heldReply && attempt < 100; attempt++) await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(heldReply, 'Slow request reached the mock service');
  await panel.locator('.companion-close').click(); heldReply?.();
  await page.waitForFunction(() => document.querySelector('.companion-form').getAttribute('aria-busy') === 'false');
  assert.equal(await page.locator('.quiz-variant-preview').count(), 0, 'Late responses cannot revive a closed mode');
  console.log('PASS unsafe HTML, recoverable service failure, retry and cancellation');

  await page.setViewportSize({ width: 390, height: 844 });
  await source.locator('[data-generate-variant]').click();
  await input.fill('create'); await input.press('Enter');
  await page.locator('.quiz-variant-preview[open]').waitFor();
  await page.frameLocator('.quiz-variant-preview iframe').locator('.quiz-option').first().waitFor();
  const bounds = await page.locator('.quiz-variant-preview').boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391);
  await mkdir(output, { recursive: true }); await page.screenshot({ path: resolve(output, 'quiz-variant-mobile.png') });
  await page.locator('.quiz-variant-preview > header button').click(); await panel.locator('.companion-close').click();
  await page.locator('#hub-view [data-language="en"]').click();
  await source.locator('[data-generate-variant]').click();
  assert.match(await panel.locator('[data-variant-title]').textContent(), /Practice from question/);
  await input.fill('create'); await input.press('Enter'); await page.locator('.quiz-variant-preview[open]').waitFor();
  await page.frameLocator('.quiz-variant-preview iframe').locator('.quiz-option').first().waitFor();
  assert.match(await page.frameLocator('.quiz-variant-preview iframe').locator('[data-quiz-storage-status]').textContent(), /Temporary practice/);
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS mobile/tablet layout and TH/EN temporary practice');
  await page.locator('.quiz-variant-preview > header button').click();
  await sourceFrame.evaluate(() => LearningHubQuiz.goToQuestion(1));
  await source.locator('[data-generate-variant]').click();
  assert.match(await panel.locator('[data-variant-title]').textContent(), /question 2/);
  assert.doesNotMatch(await panel.locator('.companion-messages').textContent(), /discuss style/);
  await panel.locator('.companion-close').click();
  await source.locator('[data-generate-variant]').click();
  await page.locator('.workspace-window .is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({ state: 'detached' });
  assert.equal(await panel.locator('.companion-variant').isVisible(), false);
  console.log('PASS source switching starts a fresh context and closing its tool discards generation context');
  await context.close();
} finally {
  await browser?.close(); await new Promise(done => server.close(done));
}
