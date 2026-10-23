import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';
import { bankSnapshotBody, sha256 } from '../public/shared/question-bank-model.js';
import { bankChapterKey } from '../public/shared/question-bank-menu.js';

// Production Hub, workspace, navigation, bank, quiz and review engines. Only the
// catalog/readings/bank service and Firebase edges are virtual; no live data.
const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright`);
const prefix = '/learning-hub/', built = process.env.QA_BUILT === '1';
const output = resolve(root, 'qa-output/topic-review-hub'); await mkdir(output, { recursive: true });
const keyA = 'b-' + 'a'.repeat(24), keyB = 'b-' + 'b'.repeat(24), keyP = 'b-' + 'c'.repeat(24), missing = 'b-' + 'd'.repeat(24);
const sets = {
  chemistry: [keyA, keyB].map((bankKey, i) => ({ bankKey, legacyId: `qa-chem-${i}`, title: `เคมี ${i + 1}(Chemistry ${i + 1})`,
    path: ['Chemistry', 'Hub', 'อะตอม(Atoms)', `เคมี ${i + 1}(Chemistry ${i + 1})`], questionCount: 1 })),
  physics: [{ bankKey: keyP, legacyId: 'qa-physics', title: 'แรง(Forces)', path: ['Physics', 'Hub', 'กลศาสตร์(Mechanics)', 'แรง(Forces)'], questionCount: 0 }],
};
const catalog = await catalogFromRepository(), readings = new Map();
for (const [subjectId, topics] of Object.entries(sets)) for (const [i, topic] of topics.entries()) {
  const id = `qa-${subjectId}-review-${i}`, source = `content/qa-review/${id}.html`;
  catalog.contents.push({ id, toolKind: 'html', source });
  catalog.routes.push({ hash: `#${subjectId}/bank/${topic.bankKey}/review`, aliases: [], kind: 'content', status: 'ready',
    subjectId, bankKey: topic.bankKey, toolKey: 'review', contentId: id, chapterId: 'bank', topicId: topic.bankKey,
    parentHash: `#${subjectId}/bank/${topic.bankKey}` });
  readings.set(source, `<html data-learning-html><body><main data-topic-review-document>
    <section data-content-lang="th"><h1>QA ${id} TH</h1><p>ทบทวน \\(F=ma\\)</p><section data-review-question><h3>คำถามทบทวน</h3><p>อธิบายแนวคิด</p><div data-review-blank data-review-writing-space></div><div data-review-answer hidden>คำตอบ QA ${id}</div></section></section>
    <section data-content-lang="en"><h1>QA ${id} EN</h1><p>Review \\(F=ma\\)</p><section data-review-question><h3>Recall question</h3><p>Explain the idea.</p><div data-review-blank data-review-writing-space></div><div data-review-answer hidden>Answer QA ${id}</div></section></section>
    </main></body></html>`);
}
const snapshots = new Map();
for (const topic of sets.chemistry) {
  const value = { schemaVersion: 1, subjectId: 'chemistry', bankKey: topic.bankKey, legacyId: topic.legacyId, title: topic.title,
    rows: [{ rowNumber: 2, html: '<div class="question-step" data-ans="A"><h3>QA question</h3><div class="options"><label><input type="radio" value="A">One</label><label><input type="radio" value="B">Two</label></div><div class="feedback-box">Explanation</div></div>' }] };
  value.revision = await sha256(JSON.stringify(bankSnapshotBody(value))); snapshots.set(topic.bankKey, value);
}
const firebase = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}} export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),10);return ()=>{}};export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const getDatabase=()=>({});export const ref=(_,path)=>path;export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>0;export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});export const set=async()=>{throw Error('Live writes forbidden')};export const update=set,remove=set;export const runTransaction=set;`,
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) throw Error('Outside prefix');
    const name = pathname.slice(prefix.length) || 'index.html';
    let data;
    if (name === 'route-catalog.v1.json') data = JSON.stringify(catalog);
    else if (name === 'shared/question-bank-config.js') data = "export const questionBankConfig={endpoint:'https://bank.test/exec',cacheMs:60000};export const questionBankTools={};";
    else if (readings.has(name)) data = readings.get(name);
    else {
      const directory = built ? resolve(root, 'dist') : root;
      if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
      try { data = await readFile(resolve(directory, name)); }
      catch { if (built) throw Error('Missing built asset'); data = await readFile(resolve(root, 'public', name)); }
    }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix).replaceAll('src="/shared/', `src="${prefix}shared/`);
    response.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' })[extname(name)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  async function newContext() {
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
    await context.addInitScript(() => {
      window.__reviewCommands = [];
      addEventListener('message', event => { if (event.data?.type === 'learning-hub-review-select') window.__reviewCommands.push(event.data); });
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'bank.test') {
        const subjectId = url.searchParams.get('subject');
        const data = url.searchParams.get('action') === 'catalog' ? { schemaVersion: 1, subjectId, sets: sets[subjectId] || [] } : snapshots.get(url.searchParams.get('key'));
        return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, data }) });
      }
      if (url.origin === origin) return route.continue();
      return route.fulfill({ contentType: 'text/javascript', body: firebase[url.pathname.split('/').at(-1)] || '' });
    });
    return context;
  }
  const context = await newContext(), page = await context.newPage(), errors = [];
  page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.goto(`${origin}${prefix}#chemistry/bank`);
  await page.locator('#guest-button').click();
  const subject = page.frameLocator('#hub-page-frame');
  const reviewWindow = page.locator('.workspace-window[data-tool-id="topic-review-library"]');
  const review = reviewWindow.frameLocator('iframe');
  await subject.locator('.bank-review-entry').waitFor();
  assert.equal(await subject.locator('.bank-review-entry').getAttribute('target'), null);
  await subject.locator('.bank-review-entry').click();
  await page.waitForURL(url => url.hash === '#chemistry/review');
  await review.locator('[data-review-subject]').waitFor();
  assert.equal(context.pages().length, 1);
  assert.equal(await review.locator('[data-review-subject]').inputValue(), 'chemistry');
  console.log('PASS bank button opens the original Hub workspace without a new tab');

  await review.locator('[data-review-chapter]').selectOption(bankChapterKey(sets.chemistry[0]));
  await review.locator('[data-review-topic]').selectOption(keyA);
  await review.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-0 TH', { exact: true }).waitFor();
  await page.waitForURL(url => url.hash === `#chemistry/review/${keyA}`);
  await review.locator('[data-review-topic]').selectOption(keyB);
  await page.waitForURL(url => url.hash === `#chemistry/review/${keyB}`);
  assert.equal(await reviewWindow.count(), 1);
  await page.goBack();
  await review.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-0 TH', { exact: true }).waitFor();
  await page.goForward();
  await review.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 TH', { exact: true }).waitFor();
  await reviewWindow.locator('.window-share').click();
  const shared = await page.locator('#hub-share-url').inputValue();
  assert.equal(new URL(shared).hash, `#chemistry/review/${keyB}`); assert.equal(new URL(shared).search, '');
  await page.locator('[data-share-close]').click();
  console.log('PASS topic selection, original chapter controls, share link, Back/Forward and one reused frame');

  const historyLength = await page.evaluate(() => history.length);
  await review.locator('[data-review-language="en"]').click();
  await review.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 EN', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => history.length), historyLength);
  await review.locator('[data-review-answers-toggle]').click();
  assert.equal(await review.locator('[data-review-answer]').evaluate(node => node.hidden), false);
  assert.equal(await review.locator('[data-topic-review-print]').isEnabled(), true);
  await review.locator('body').evaluate(() => { window.print = () => { document.body.dataset.qaPrinted = 'true'; }; });
  await review.locator('[data-topic-review-print]').click();
  await review.locator('body[data-print-mode="topic-review"]').waitFor();
  assert.ok(await review.locator('[data-print-host]').getByText(/Answer QA qa-chemistry-review-1/).count());
  await review.locator('body[data-qa-printed="true"]').waitFor();
  await review.locator('body').evaluate(() => { window.dispatchEvent(new Event('afterprint')); });
  console.log('PASS bilingual rendering, answer toggles and print control remain usable');

  await review.locator('[data-review-subject]').selectOption('physics');
  await page.waitForURL(url => url.hash === '#physics/review');
  await review.locator(`[data-review-topic] option[value="${keyP}"]`).waitFor({ state: 'attached' });
  await review.locator('[data-review-topic]').selectOption(keyP);
  await review.locator('[data-topic-review-content]').getByText('QA qa-physics-review-0 EN', { exact: true }).waitFor();
  await page.waitForURL(url => url.hash === `#physics/review/${keyP}`);
  await page.screenshot({ path: resolve(output, 'hub-review-desktop.png') });
  const child = await reviewWindow.locator('iframe').elementHandle().then(handle => handle.contentFrame());
  assert.ok(await child.evaluate(() => window.__reviewCommands.every(message => !('identity' in message))));
  const before = page.url();
  await child.evaluate(({keyA}) => parent.postMessage({ type: 'learning-hub-review-selection', commandId: 0, selection: { subjectId: 'chemistry', bankKey: keyA } }, location.origin), {keyA});
  await page.evaluate(({keyA}) => window.postMessage({ type: 'learning-hub-review-selection', commandId: 999, selection: { subjectId: 'chemistry', bankKey: keyA } }, location.origin), {keyA});
  await page.waitForTimeout(100);
  assert.equal(page.url(), before);
  await review.locator('[data-review-back]').click();
  await page.waitForURL(url => url.hash === `#physics/bank/${keyP}`);
  await subject.locator('.bank-review-entry').click();
  await page.waitForURL(url => url.hash === `#physics/review/${keyP}`);
  await review.locator('[data-topic-review-content]').getByText('QA qa-physics-review-0 EN', { exact: true }).waitFor();
  console.log('PASS cross-subject navigation preserves the window; stale and unregistered-frame messages cannot change the route');

  await page.evaluate(hash => { location.hash = hash; }, `#chemistry/review/${keyA}`);
  await review.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-0 EN', { exact: true }).waitFor();
  await review.locator('[data-review-back]').click();
  await page.waitForURL(url => url.hash === `#chemistry/bank/${keyA}`);
  await subject.getByRole('button', { name: /Open quiz/ }).click();
  const quizWindow = page.locator('.workspace-window').filter({ has: page.locator('iframe[src*="bankSubject=chemistry"]') });
  const quiz = quizWindow.frameLocator('iframe');
  await quiz.locator('.quiz-option').first().click();
  await quiz.locator('[data-reasoning-input]').fill('Keep this quiz reasoning');
  const quizChild = await quizWindow.locator('iframe').elementHandle().then(handle => handle.contentFrame());
  await quizChild.evaluate(() => { LearningHubQuiz.flushLocal(); window.__frameSentinel = 'kept'; });
  await page.evaluate(hash => { location.hash = hash; }, `#chemistry/review/${keyB}`);
  await review.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 EN', { exact: true }).waitFor();
  await reviewWindow.locator('.is-minimize').click();
  if (!await quizWindow.isVisible()) await page.locator('.taskbar-item').filter({ hasText: /Open quiz/ }).click();
  await quizWindow.waitFor({ state: 'visible' });
  assert.equal(await quizChild.evaluate(() => window.__frameSentinel), 'kept');
  assert.ok(Object.keys(await quizChild.evaluate(() => LearningHubQuiz.getState().answers)).length > 0);
  assert.equal(await quiz.locator('[data-reasoning-input]').inputValue(), 'Keep this quiz reasoning');
  await quiz.locator('[data-topic-review-open]').click();
  await quiz.locator('[data-review-subject]').selectOption('chemistry');
  await quiz.locator(`[data-review-topic] option[value="${keyB}"]`).waitFor({ state: 'attached' });
  await quiz.locator('[data-review-topic]').selectOption(keyB);
  await quiz.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 EN', { exact: true }).waitFor();
  console.log('PASS returning to a real bank Quiz retains its iframe, answer and reasoning; its own review uses the same content');

  const fresh = await newContext(), direct = await fresh.newPage();
  direct.on('pageerror', error => errors.push(error.message));
  await direct.goto(shared);
  await direct.locator('#guest-button').click();
  const directReview = direct.locator('[data-tool-id="topic-review-library"]').frameLocator('iframe');
  await directReview.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 TH', { exact: true }).waitFor();
  await direct.reload();
  await directReview.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 TH', { exact: true }).waitFor();
  await direct.evaluate(hash => { location.hash = hash; }, `#chemistry/review/${missing}`);
  await directReview.locator('[data-review-status]').getByText(/ไม่พบหัวข้อ/).waitFor();
  assert.equal(await directReview.locator('[data-topic-review-print]').isDisabled(), true);
  console.log('PASS a shared link opens the correct topic after Guest entry and reload; missing topics have an explicit notice');
  await direct.setViewportSize({ width: 820, height: 1180 });
  await direct.evaluate(hash => { location.hash = hash; }, `#chemistry/review/${keyB}`);
  await directReview.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-1 TH', { exact: true }).waitFor();
  assert.ok(await direct.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await direct.screenshot({ path: resolve(output, 'hub-review-tablet.png') });
  const standalone = await fresh.newPage();
  standalone.on('pageerror', error => errors.push(error.message));
  await standalone.goto(`${origin}${prefix}pages/tools/topic-review-player.html?subject=chemistry&topic=${keyA}&lang=en`);
  await standalone.locator('[data-topic-review-content]').getByText('QA qa-chemistry-review-0 EN', { exact: true }).waitFor();
  console.log('PASS both bank buttons, working print output, tablet layout, and legacy standalone links');
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
