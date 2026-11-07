import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { catalogFromRepository } from './build-route-catalog.mjs';

// Real Hub, author sample and sandbox; only Firebase is stubbed. No live writes.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const browserName = 'chromium';
const browserType = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')[browserName];
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output/polymers');
const catalog = await catalogFromRepository();
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});export const initializeAuth=getAuth;export const browserPopupRedirectResolver={};export const setPersistence=async()=>{};
    export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),20);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const orderByChild=value=>value;export const equalTo=value=>value;export const query=path=>path;export const getDatabase=()=>({});export const ref=(_,path)=>path;
    export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};
    export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>0;
    export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});
    export const set=async()=>{throw Error('Live writes forbidden')};export const update=set;export const remove=set;`,
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
    res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' })[extname(name)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const sheetId = 'lower-science-polymers-l01-l08-sheet';
const quizId = 'lower-science-polymers-l01-l08-review';
const quizSource = 'content/lower-science/materials/3-1-polymers-l01-l08-review-quiz.html';
const parsed = parseHTML(await readFile(resolve(root, 'public', quizSource), 'utf8'));
const expected = readQuizContent(parsed.document.querySelector('[data-learning-activity-content]'));
assert.deepEqual(expected.errors, []);
assert.equal(expected.questions.length, 70);
let browser;
try {
  browser = await browserType.launch({ headless: true,
    ...(process.env.QA_BROWSER_EXECUTABLE ? { executablePath: process.env.QA_BROWSER_EXECUTABLE } : {}),
  });
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, hasTouch: true });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType: 'text/javascript', body: stubs[url.pathname.split('/').at(-1)] || '' });
    return route.abort();
  });
  const page = await context.newPage(), errors = [], missing = [];
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(origin)) missing.push(response.url()); });
  await page.goto(origin + prefix + '#content/' + sheetId);
  await page.locator('#guest-button').click();
  const win = page.locator(`[data-tool-id="content-html-${sheetId}"]`);
  const sheet = page.frameLocator(`[data-tool-id="content-html-${sheetId}"] iframe`);
  await sheet.locator('html[data-hub-sheet-ready]').waitFor();
  assert.equal(await win.locator('iframe').getAttribute('sandbox'), 'allow-same-origin');
  assert.equal(await sheet.locator('[data-sheet-slot]').count(), 370);
  assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(), 0);
  await win.locator('.is-maximize').click();
  const guideData = JSON.parse(await readFile(resolve(root, 'public/content/lower-science/materials/guides/3-1-polymers-l01-l08.guide.json'), 'utf8'));
  for (const lang of ['th', 'en']) {
    await win.locator(`[data-window-language="${lang}"]`).click();
    const language = sheet.locator(`[data-content-lang="${lang}"]`);
    await language.waitFor({state:'visible'});
    assert.equal(await language.locator('[data-sheet-slot]').count(), 185);
    await win.locator('.window-sheet-guide').click();
    const guide = win.locator('.learning-guide');
    await guide.locator('[data-guide-state="ready"]').waitFor();
    assert.equal(await guide.locator('.learning-guide-summary').count(), 8);
    // Every authored semantic link must jump to the current-language target.
    for (const [stepIndex, step] of guideData.steps.entries()) for (const link of [...step.links, ...(step.review || [])]) {
      await guide.locator('.learning-guide-step').nth(stepIndex).getByRole('button', {name:link.label[lang],exact:true}).first().click();
      const attribute = link.target.kind === 'slot' ? 'data-sheet-slot' : 'data-guide-anchor';
      assert.equal(await language.locator(`[${attribute}="${link.target.key}"].hub-guide-target`).count(), 1);
    }
    await guide.locator('.learning-guide-close').click();
    await language.locator('[data-sheet-slot="note-material"] [data-hub-sheet-toggle]').tap();
    assert.equal(await language.locator('[data-sheet-slot="note-material"] [data-hub-sheet-toggle]').getAttribute('aria-expanded'), 'true');
    await sheet.getByRole('button', {name:lang === 'th' ? 'เปิดทั้งหมด' : 'Reveal all',exact:true}).click();
    assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(), 370);
    assert.ok(await language.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
    await sheet.getByRole('button', {name:lang === 'th' ? 'ปิดทั้งหมด' : 'Hide all',exact:true}).click();
  }
  console.log('PASS 185 paired slots, native touch, full TH/EN, all images and eight guide steps with all semantic links');
  const printReport = [];
  for (const lang of ['th', 'en']) {
    await win.locator(`[data-window-language="${lang}"]`).click();
    await win.locator('.window-html-print').click();
    const dialog = page.locator('[data-html-print-dialog]'), paper = page.frameLocator('[data-html-print-frame]');
    for (const edition of ['blank', 'answers']) {
      if (edition === 'answers') await dialog.locator('[data-sheet-print-edition]').selectOption(edition);
      await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
      assert.equal(await paper.locator('[data-sheet-slot]').count(),185);
      assert.equal(await paper.locator('[data-sheet-answer]').count(),edition === 'blank' ? 0 : 185);
      assert.equal(await paper.locator(`[data-content-lang="${lang === 'th' ? 'en' : 'th'}"]`).count(),0);
      assert.equal(await paper.locator('[data-hub-sheet-toggle], .learning-guide').count(),0);
      const source = await paper.locator('html').evaluate(node => '<!doctype html>' + node.outerHTML);
      const pdf = await context.newPage();
      await pdf.setContent(source,{waitUntil:'load'});
      await pdf.evaluate(() => document.fonts.ready);
      const file = `polymers-sheet-${lang}-${edition}.pdf`;
      await pdf.pdf({path:resolve(output,file),preferCSSPageSize:true,printBackground:true});
      await pdf.close();
      printReport.push({lang,edition,file,pages:Number(await paper.locator('html').getAttribute('data-hub-print-pages'))});
    }
    await dialog.locator('[data-print-close]').click();
  }
  console.log('PASS actual blank/answer PDFs in TH/EN preserve all 185 note areas and remove answer DOM from blank editions');
  for (const width of [390,820]) {
    await page.setViewportSize({width,height:1100});
    for (const lang of ['th','en']) {
      await win.locator(`[data-window-language="${lang}"]`).click();
      assert.ok(await sheet.locator('html').evaluate(html => html.scrollWidth <= html.clientWidth + 2), `${width}/${lang}: horizontal overflow`);
      await page.screenshot({path:resolve(output,`sheet-${width}-${lang}.png`)});
    }
  }
  await page.setViewportSize({width:1360,height:1000});
  await page.goto(origin + prefix + '#content/' + quizId);
  const quizWin = page.locator(`[data-tool-id="content-quiz-${quizId}"]`);
  const quiz = page.frameLocator(`[data-tool-id="content-quiz-${quizId}"] iframe`);
  await quiz.locator('[data-current-options] .quiz-drag-piece').first().waitFor();
  const quizFrame = page.frames().find(frame => frame.url().includes('quiz-player.html'));
  assert.equal((await quizFrame.evaluate(() => LearningHubQuiz.getState())).contentId,quizId);
  await quizWin.locator('.is-maximize').click();
  for (const [index, question] of expected.questions.entries()) {
    assert.equal((await quizFrame.evaluate(() => LearningHubQuiz.getState())).currentIndex,index);
    if (question.type === 'drag-drop') {
      for (const slot of question.slots) {
        await quiz.locator(`[data-current-options] [data-item-id="${slot.answer}"]`).tap();
        await quiz.locator(`[data-current-options] [data-slot-id="${slot.id}"]`).tap();
      }
    } else {
      const option = question.options.findIndex(node => node.dataset.choiceId === question.answer);
      await quiz.locator('.quiz-option').nth(option).tap();
    }
    if (index < expected.questions.length - 1) {
      await quiz.locator('[data-next-button]').click();
      if (question.type === 'drag-drop') await quiz.locator('[data-navigation-confirm]').click();
    }
  }
  await quizFrame.evaluate(() => LearningHubQuiz.flushLocal());
  const answers = (await quizFrame.evaluate(() => LearningHubQuiz.getState())).answers;
  assert.equal(Object.keys(answers).length,70);
  await page.reload();
  await quiz.locator('[data-current-options] .quiz-option').first().waitFor();
  const resumed = page.frames().find(frame => frame.url().includes('quiz-player.html'));
  assert.deepEqual((await resumed.evaluate(() => LearningHubQuiz.getState())).answers, answers);
  console.log('PASS all 70 real questions accept answers, 29 drag reread confirmations, and guest progress survives reload');
  // Backward navigation needs no grading gate; inspect every English prompt.
  await quizWin.locator('[data-window-language="en"]').click();
  for (let index = expected.questions.length - 1; index >= 0; index--) {
    await quiz.locator(`[data-question-jump="${index}"]`).click();
    assert.equal((await resumed.evaluate(() => LearningHubQuiz.getState())).currentIndex,index);
    const normalized = value => value.replace(/\s+/g,' ').trim();
    assert.equal(normalized(await quiz.locator('[data-current-prompt]').innerText()),normalized(expected.questions[index].prompt.dataset.en));
    assert.ok(await quiz.locator('[data-current-context] img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
  }
  await quiz.locator('[data-topic-review-open]').click();
  await sheet.locator('html[data-hub-sheet-ready]').waitFor();
  assert.equal(await page.locator(`[data-tool-id="content-html-${sheetId}"]`).count(),1);
  assert.equal(await sheet.locator('[data-content-lang="en"]').isVisible(),true);
  assert.deepEqual((await resumed.evaluate(() => LearningHubQuiz.getState())).answers,answers);
  await page.screenshot({path:resolve(output,'quiz-sheet-pair.png')});
  await writeFile(resolve(output,'print-report.json'),JSON.stringify(printReport,null,2));
  assert.deepEqual(missing,[]);
  assert.deepEqual(errors,[]);
  console.log('PASS all English prompts, quiz images and Review opens the same sheet without resetting answers; no page errors or missing local resources');
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
