import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { bankSnapshotBody } from '../public/shared/question-bank-model.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || `${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/playwright`);
const root = resolve(new URL('..', import.meta.url).pathname);
const out = resolve(process.env.QA_OUTPUT_DIR || `${root}/qa-output/quiz-print`);
await mkdir(out, { recursive: true });
const contentPath = '/content/physics/ipst/equilibrium/4-1-equilibrium-quiz.html';
const content = await readFile(`${root}/public${contentPath}`, 'utf8');
let edited = false, failAssets = false, failContent = false, bankLatest = false;
const assetRequests = [];
const bankKey = 'b-' + 'a'.repeat(24);
function bankSnapshot(latest) {
  const html = text => `<div class="question-step" data-ans="A"><h3>${text}</h3><div class="options"><label><input type="radio" value="A">1</label><label><input type="radio" value="B">2</label></div><div class="feedback-box">Explanation</div></div>`;
  const snapshot = { schemaVersion: 1, subjectId: 'physics', bankKey, legacyId: 'qa-bank', title: 'QA bank',
    rows: [{ rowNumber: 2, html: html(latest ? 'Updated bank question' : 'Original bank question') + (latest ? '' : html('Removed bank question')) }] };
  snapshot.revision = createHash('sha256').update(JSON.stringify(bankSnapshotBody(snapshot))).digest('hex');
  return snapshot;
}
const harness = `<!doctype html><html><body><iframe style="width:100%;height:1000px" id="quiz"></iframe><script>
window.cloud={value:null,writes:[]};
quiz.src='/learning-hub/pages/tools/quiz-player.html?bankSubject=physics&bankKey=${bankKey}&lang=en';
addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==quiz.contentWindow)return;
const d=event.data;if(d.type==='learning-hub-quiz-ready')event.source.postMessage({type:'learning-hub-context',language:'en',identity:{status:'signed-in',uid:'qa-refresh-user'}},location.origin);
if(d.type==='learning-hub-quiz-load')event.source.postMessage({...d,type:'learning-hub-quiz-storage-result',ok:true,value:cloud.value},location.origin);
if(d.type==='learning-hub-quiz-save'){cloud.value=d.value;cloud.writes.push(d.value);event.source.postMessage({...d,type:'learning-hub-quiz-storage-result',ok:true},location.origin);}});
</script></body></html>`;
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/__bank') { response.setHeader('Content-Type', 'text/html'); response.end(harness); return; }
    const pathname = decodeURIComponent(url.pathname.replace(/^\/learning-hub/, ''));
    if (failAssets && pathname === '/shared/quiz-refresh.js') { response.writeHead(503); response.end(); return; }
    if (/\.(?:js|css)$/.test(pathname)) assetRequests.push(pathname);
    let data;
    if (pathname === contentPath) {
      if (failContent && url.searchParams.has('quizFresh')) { response.writeHead(503); response.end(); return; }
      data = edited ? content.replace(/<article data-question[^>]*data-question-id="q14[^\"]*"[\s\S]*?<\/article>/, '').replaceAll('13 ข้อ', '12 ข้อ').replaceAll('13 five-option', '12 five-option') : content;
    } else {
      let path = resolve(root, 'public', pathname.replace(/^\/+/, ''));
      if (!path.startsWith(`${root}${sep}public${sep}`)) throw Error('Outside public');
      data = await readFile(path);
    }
    if (pathname === '/shared/quiz-drag-model.js') data = `${data}\nwindow.__qaSharedRevision = ${edited ? 2 : 1};\n`;
    if (/\.(?:js|css)$/.test(pathname)) response.setHeader('Cache-Control', 'public, max-age=31536000');
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' })[extname(pathname)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'script.google.com') {
      const requested = url.searchParams.get('revision');
      const snapshot = requested === bankSnapshot(false).revision ? bankSnapshot(false) : bankSnapshot(bankLatest);
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, data: snapshot }) });
    }
    if (url.origin !== origin) return route.fulfill({ contentType: 'text/javascript', body: '' });
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [], alerts = [];
  let consent = true;
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => { if (dialog.type() === 'alert') alerts.push(dialog.message()); return consent ? dialog.accept() : dialog.dismiss(); });
  const player = `${origin}/learning-hub/pages/tools/quiz-player.html?content=../..${contentPath}&lang=th`;
  await page.goto(player);
  await page.waitForFunction(() => window.LearningHubQuiz?.getState().contentId);
  assert.equal(await page.evaluate(() => LearningHubQuiz.getState().answers && document.querySelectorAll('[data-quiz-print-source] [data-question]').length), 13);
  for (const lang of ['th', 'en']) {
    await page.locator(`[data-language-button="${lang}"]`).click();
    await page.evaluate(async () => { LearningHubPrint.prepare('worksheet'); await LearningHubPrint.typesetPrint(); });
    await page.emulateMedia({ media: 'print' });
    const paper = await page.evaluate(() => {
      const host = document.querySelector('[data-print-host]');
      return { questions: host.querySelectorAll('[data-question]').length, spaces: host.querySelectorAll('.quiz-paper-workspace').length,
        numbers: [...host.querySelectorAll('.quiz-paper-number')].map(n => n.textContent), letters: host.querySelectorAll('.quiz-paper-letter').length,
        solutions: host.querySelectorAll('[data-question-solution]').length, svg: host.querySelectorAll('svg').length,
        overflow: [...host.querySelectorAll('[data-question], [data-choice-id]')].filter(n => n.scrollWidth > n.clientWidth + 2).length };
    });
    assert.equal(paper.questions, 13); assert.equal(paper.spaces, 13); assert.equal(paper.letters, 65); assert.equal(paper.solutions, 0);
    assert.deepEqual(paper.numbers, Array.from({ length: 13 }, (_, i) => `${i + 1}.`)); assert.ok(paper.svg >= 4); assert.equal(paper.overflow, 0);
    if (process.env.QA_PRINT_PDF === '1') await page.pdf({ path: `${out}/Quiz_4_1_Worksheet_${lang.toUpperCase()}.pdf`, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    await page.evaluate(() => LearningHubPrint.restore());
    await page.emulateMedia({ media: 'screen' });
  }
  console.log('PASS TH/EN paper: 13 numbered questions, A-E choices, writing areas, SVG and no solutions/overflow');
  await page.evaluate(() => { document.querySelector('[data-print-workspace]').value = '65'; LearningHubPrint.prepare('worksheet'); });
  assert.equal(await page.locator('[data-print-host] .quiz-paper-workspace').first().evaluate(n => n.style.getPropertyValue('--quiz-paper-space')), '65mm');
  await page.evaluate(() => { LearningHubPrint.restore(); LearningHubPrint.prepare('answer'); });
  assert.equal(await page.locator('[data-print-host] .quiz-paper-workspace').count(), 0);
  assert.equal(await page.locator('[data-print-host] .is-print-correct').count(), 13);
  assert.equal(await page.locator('[data-print-host] [data-question-solution][hidden]').count(), 0);
  await page.evaluate(() => LearningHubPrint.restore());
  assert.equal(await page.locator('[data-quiz-print-source] .quiz-paper-letter').count(), 0);
  console.log('PASS print settings, teacher key, and original content remains intact');
  await page.locator('.quiz-option').first().click();
  await page.locator('[data-reasoning-input]').fill('Keep my reasoning');
  await page.evaluate(() => localStorage.setItem('unrelated-quiz-sentinel', 'keep'));
  await page.locator('[data-notebook-panel] summary').click();
  await page.waitForFunction(() => document.querySelector('[data-notebook-core]')?.inert === false);
  const canvas = page.locator('[data-notebook-canvas]');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + 60, bounds.y + 60); await page.mouse.down();
  await page.mouse.move(bounds.x + 120, bounds.y + 95, { steps: 8 }); await page.mouse.up();
  await page.evaluate(() => LearningHubQuiz.flushLocal());
  consent = false;
  await page.locator('[data-restart-latest]').click();
  assert.ok(Object.keys(await page.evaluate(() => LearningHubQuiz.getState().answers)).length);
  consent = true; failAssets = true;
  await page.locator('[data-restart-latest]').click();
  await page.waitForFunction(() => !document.querySelector('[data-restart-latest]').disabled);
  assert.ok(alerts.some(text => text.includes('503')));
  assert.ok(Object.keys(await page.evaluate(() => LearningHubQuiz.getState().answers)).length);
  failAssets = false; failContent = true;
  await page.locator('[data-restart-latest]').click();
  await page.locator('[data-quiz-error]').waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-restart-latest]').disabled);
  assert.ok(Object.keys(await page.evaluate(() => LearningHubQuiz.getState().answers)).length);
  failContent = false;
  await page.evaluate(() => {
    window.originalStorageWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.startsWith('learning-hub-quiz-restarts:')) throw Error('QA archive quota');
      return window.originalStorageWrite.call(this, key, value);
    };
  });
  await page.locator('[data-restart-latest]').click();
  await page.waitForFunction(() => document.querySelector('[data-quiz-error]').textContent.includes('QA archive quota'));
  await page.waitForFunction(() => !document.querySelector('[data-restart-latest]').disabled);
  assert.ok(Object.keys(await page.evaluate(() => LearningHubQuiz.getState().answers)).length);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStorageWrite; });
  edited = true;
  await page.locator('[data-restart-latest]').click();
  await page.waitForURL(/quizRefresh=/);
  await page.waitForFunction(() => document.querySelectorAll('[data-quiz-print-source] [data-question]').length === 12);
  assert.deepEqual(await page.evaluate(() => LearningHubQuiz.getState().answers), {});
  assert.equal(await page.evaluate(() => window.__qaSharedRevision), 2, 'Reloaded a changed transitive module despite a one-year HTTP cache');
  assert.equal(await page.locator('[data-reasoning-input]').inputValue(), 'Keep my reasoning');
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('learning-hub-quiz-restarts:v1:guest:physics-ipst-equilibrium-4-1-quiz')));
  assert.equal(history.length, 1); assert.ok(Object.keys(history[0].answers).length);
  assert.equal(await page.evaluate(() => localStorage.getItem('unrelated-quiz-sentinel')), 'keep');
  await page.locator('[data-notebook-panel] summary').click();
  await page.waitForFunction(() => document.querySelector('[data-notebook-core]')?.inert === false);
  const ink = await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('learning-hub-quiz-evidence', 1); request.onsuccess = () => resolve(request.result); request.onerror = reject; });
    const record = await new Promise(resolve => { const request = db.transaction('notebookPages').objectStore('notebookPages').get('v1:guest:physics-ipst-equilibrium-4-1-quiz:q01-bag-at-rest'); request.onsuccess = () => resolve(request.result); });
    db.close(); return record?.strokes.length || 0;
  });
  assert.ok(ink > 0, 'Handwriting survives a fresh engine navigation');
  assert.ok(assetRequests.filter(path => path === '/shared/quiz-evidence.js').length >= 2);
  assert.ok(assetRequests.filter(path => path === '/pages/tools/notebook-core.js').length >= 2);
  assert.ok(assetRequests.filter(path => path === '/shared/hub-ui.css').length >= 2, 'Restart revalidates the shared Hub tokens');
  assert.ok(assetRequests.filter(path => path === '/shared/hub-engine.css').length >= 2, 'Restart revalidates the engine theme');
  console.log('PASS cancel/network/quota failures preserve draft; latest content and cached modules reload; reasoning, ink, history and other quizzes survive');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  console.log('PASS phone width has no horizontal page overflow');

  await page.goto(`${origin}/__bank`);
  const child = await page.locator('#quiz').elementHandle().then(handle => handle.contentFrame());
  await child.waitForFunction(() => document.querySelectorAll('[data-quiz-print-source] [data-question]').length === 2);
  await child.waitForFunction(() => LearningHubQuiz.getState().identityKey === 'qa-refresh-user');
  await child.locator('.quiz-option').first().click();
  await child.evaluate(() => LearningHubQuiz.save());
  const previousRevision = await child.evaluate(() => LearningHubQuiz.getState().bankRevision);
  bankLatest = true;
  await child.locator('[data-restart-latest]').click();
  await child.waitForURL(/quizRefresh=/);
  await child.waitForFunction(() => document.querySelectorAll('[data-quiz-print-source] [data-question]').length === 1);
  assert.notEqual(await child.evaluate(() => LearningHubQuiz.getState().bankRevision), previousRevision);
  assert.deepEqual(await child.evaluate(() => LearningHubQuiz.getState().answers), {});
  assert.equal(await child.evaluate(() => LearningHubQuiz.getState().identityKey), 'qa-refresh-user');
  assert.equal(await page.evaluate(() => cloud.value.bankRevision), bankSnapshot(true).revision);
  assert.equal(await child.evaluate(() => JSON.parse(localStorage.getItem('learning-hub-quiz-restarts:v1:qa-refresh-user:bank-physics-b-aaaaaaaaaaaaaaaaaaaaaaaa')).length), 1);
  console.log('PASS signed-in Sheet bank: latest revision, cleared answers, preserved identity and archive, cloud replacement');
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
