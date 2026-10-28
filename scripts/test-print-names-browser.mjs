import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/learning-hub/';
const built = process.env.QA_BUILT === '1';
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
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1100, height: 950 } });
  const labels = 'data-print-chapter-th="สมดุลกล" data-print-chapter-en="Equilibrium" data-print-work-th="ใบเรียนรู้ที่ 1" data-print-work-en="Learning sheet 1"';
  const reading = `<!doctype html><html lang="th" data-learning-html ${labels}><head><title>Original reading</title></head><body><main><h1>Forces</h1><p>Read and practise forces.</p></main></body></html>`;
  const sheet = reading.replace('data-learning-html', 'data-learning-html data-learning-sheet data-sheet-id="qa-print-sheet"');
  const quiz = `<article data-learning-activity-content data-activity-kind="quiz" data-activity-id="qa-print-quiz" data-print-chapter-th="สมดุลกล" data-print-chapter-en="Equilibrium"><header data-activity-intro><h1 data-activity-title data-quiz-title data-th="ใบงานที่ 1" data-en="Worksheet 1">ใบงานที่ 1</h1></header><section data-activity-questions><article data-question data-question-id="q1" data-answer="a"><h3 data-question-prompt>One plus one?</h3><ol data-question-options><li data-choice-id="a">2</li><li data-choice-id="b">3</li></ol><div data-question-solution>1 + 1 = 2.</div></article></section></article>`;
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/content/qa-print/reading.html')) return route.fulfill({ contentType: 'text/html', body: reading });
    if (url.pathname.endsWith('/content/qa-print/sheet.html')) return route.fulfill({ contentType: 'text/html', body: sheet });
    if (url.pathname.endsWith('/content/qa-print/quiz.html')) return route.fulfill({ contentType: 'text/html', body: quiz });
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType: 'text/javascript', body: stubs[url.pathname.split('/').at(-1)] || '' });
    return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + prefix); await page.locator('#guest-button').click();
  await page.locator('#hub-view').waitFor({ state: 'visible' });
  async function openReading(name) {
    await page.evaluate(({ name, origin, prefix }) => {
      const link = document.createElement('a'); link.dataset.hubHtml = ''; link.dataset.contentId = `qa-print-${name}`;
      link.dataset.subjectId = 'physics'; link.dataset.chapterId = '1'; link.href = `${origin}${prefix}content/qa-print/${name}.html`;
      link.textContent = 'Printable reading'; document.body.append(link); link.click(); link.remove();
    }, { name, origin, prefix });
    await page.frameLocator('.workspace-tool-frame').locator('h1').waitFor();
    await page.locator('.window-html-print').click();
    await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
  }
  await openReading('reading');
  const mainTitle = await page.title();
  const preview = page.frameLocator('[data-html-print-frame]');
  assert.equal(await preview.locator('title').textContent(), 'PHY-สมดุลกล-ใบเรียนรู้ที่ 1');
  assert.match(await page.locator('[data-print-filename]').textContent(), /PHY-สมดุลกล-ใบเรียนรู้ที่ 1.pdf/);
  await page.evaluate(() => {
    const frame = document.querySelector('[data-html-print-frame]');
    frame.contentWindow.print = () => {
      window.__readingPrint = { parent: document.title, child: frame.contentDocument.title };
      frame.contentWindow.dispatchEvent(new Event('afterprint'));
    };
  });
  await page.locator('[data-print-confirm]').click();
  const printed = await page.evaluate(() => window.__readingPrint);
  assert.deepEqual(printed, { parent: 'PHY-สมดุลกล-ใบเรียนรู้ที่ 1', child: 'PHY-สมดุลกล-ใบเรียนรู้ที่ 1' });
  assert.equal(await page.title(), mainTitle);
  await page.locator('.html-print-metadata summary').click();
  await page.locator('[data-print-field="work"]').fill('ใบใหม่');
  await page.locator('[data-print-rebuild]').click(); await page.locator('[data-print-state="ready"]').waitFor();
  assert.equal(await preview.locator('title').textContent(), 'PHY-สมดุลกล-ใบใหม่');
  const sourceFrame = await page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  assert.equal(await sourceFrame.evaluate(() => document.title), 'Original reading');
  await page.locator('[data-print-close]').click(); await page.locator('.workspace-window .is-close').click();
  console.log('PASS reading default filename, parent/iframe print titles, afterprint restoration and edited labels without changing the source');

  await openReading('sheet');
  assert.equal(await preview.locator('title').textContent(), 'PHY-สมดุลกล-ใบเรียนรู้ที่ 1-ฉบับว่าง');
  await page.locator('[data-sheet-print-edition]').selectOption('answers');
  await page.locator('[data-print-state="ready"]').waitFor();
  assert.equal(await preview.locator('title').textContent(), 'PHY-สมดุลกล-ใบเรียนรู้ที่ 1-เฉลย');
  await page.locator('[data-print-close]').click(); await page.locator('.workspace-window .is-close').click();
  console.log('PASS learning-sheet blank and answer editions have different default filenames');

  const subject = await page.locator('#hub-page-frame').elementHandle().then(handle => handle.contentFrame());
  await subject.evaluate(() => parent.postMessage({ type: 'learning-hub-open-content', content: {
    toolKind: 'quiz', subjectId: 'physics', chapterId: '1', topicId: 'forces', contentId: 'qa-print-quiz',
    source: new URL('content/qa-print/quiz.html', parent.location.href).href, titleTh: 'ใบงานที่ 1', titleEn: 'Worksheet 1',
  } }, location.origin));
  const player = page.frameLocator('.workspace-tool-frame'); await player.locator('.quiz-option').first().waitFor();
  const child = await page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  await child.evaluate(() => { window.__prints = []; window.print = () => {
    window.dispatchEvent(new Event('beforeprint'));
    window.__prints.push({ child: document.title, parent: parent.document.title });
    window.dispatchEvent(new Event('afterprint'));
  }; });
  await child.evaluate(() => LearningHubPrint.print('worksheet'));
  assert.deepEqual(await child.evaluate(() => window.__prints.at(-1)), { child: 'PHY-สมดุลกล-ใบงานที่ 1-โจทย์', parent: 'PHY-สมดุลกล-ใบงานที่ 1-โจทย์' });
  assert.equal(await page.title(), mainTitle);
  await child.evaluate(() => LearningHubPrint.print('answer'));
  assert.match((await child.evaluate(() => window.__prints.at(-1))).child, /-เฉลย$/);
  await player.locator('[data-language-button="en"]').click();
  await child.evaluate(() => LearningHubPrint.print('answer'));
  assert.equal((await child.evaluate(() => window.__prints.at(-1))).child, 'PHY-Equilibrium-Worksheet 1-Answers');
  await child.evaluate(async () => {
    const content = document.createElement('section'); content.textContent = 'Acid-base review'; document.body.append(content);
    await LearningHubPrint.printReview({ content, title: 'ทบทวน', metadata: { subjectId: 'chemistry', chapter: 'กรด–เบส', work: 'การไทเทรต' } });
    content.remove();
  });
  assert.equal((await child.evaluate(() => window.__prints.at(-1))).child, 'CHEM-กรด–เบส-การไทเทรต-Review');
  assert.equal(await page.title(), mainTitle);
  console.log('PASS shared quiz question/answer names, TH/EN, selected review overrides and parent title restoration');

  const names = await child.evaluate(async () => {
    const { QuizEvidenceManager } = await import(new URL('../../shared/quiz-evidence.js', location.href));
    const saved = [], oldPdf = window.jspdf, oldCanvas = window.html2canvas;
    window.html2canvas = () => {}; window.jspdf = { jsPDF: class { save(name) { saved.push(name); } } };
    const manager = { lifecycle: 1, state: { globalRevision: 1, submissionRevision: 1 }, language: () => 'en',
      flushCurrent() {}, hasEvidence: () => true, buildCoverPage: async () => ({}), buildQuestionPage: async () => ({}), renderPdfPage: async () => {}, updateCurrentUi() {}, onChange() {} };
    try { await QuizEvidenceManager.prototype.exportPdf.call(manager, { title: 'Worksheet 1', filename: LearningHubPrint.getFilename({ mode: 'evidence' }),
      results: Array.from({ length: 21 }, (_, i) => ({ question: { id: `q${i}` } })) }); }
    finally { window.jspdf = oldPdf; window.html2canvas = oldCanvas; }
    return saved;
  });
  assert.deepEqual(names, ['PHY-Equilibrium-Worksheet 1-Reasoning-part-1-of-2.pdf', 'PHY-Equilibrium-Worksheet 1-Reasoning-part-2-of-2.pdf']);
  assert.deepEqual(errors, []);
  console.log('PASS direct evidence PDF filenames retain human labels and numbered parts; no uncaught browser errors');
  await context.close();
} finally {
  await browser?.close(); await new Promise(done => server.close(done));
}
