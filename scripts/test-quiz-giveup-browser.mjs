import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Real authored questions and player DOM; local synthetic guest progress only.
// Block every non-local request, including AI. No live student account or data.
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = process.env.QA_BUILT === '1' ? resolve(root, 'dist') : resolve(root, 'public');
const prefix = '/learning-hub/', output = resolve(root, 'qa-output');
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith(prefix)) throw Error('Outside player');
    const file = resolve(directory, decodeURIComponent(pathname.slice(prefix.length)));
    if (!file.startsWith(directory + sep)) throw Error('Outside artifact');
    const bytes = await readFile(file);
    res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' })[extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  const state = () => page.evaluate(() => LearningHubQuiz.getState());
  async function locked(kind, id) {
    assert.equal((await state()).giveUps[id], true, kind);
    assert.equal(await page.locator('[data-giveup-button]').isEnabled(), false);
    const selector = kind === 'choice' ? '.quiz-option' : kind === 'number' ? '[data-numeric-answer]' : '.quiz-drag-piece, .quiz-drag-slot';
    assert.equal(await page.locator(selector).evaluateAll(nodes => nodes.length > 0 && nodes.every(node => node.disabled || node.readOnly)), true, kind);
    assert.equal((await state()).answers[id], undefined);
  }
  async function submit(workingRequired = false) {
    await page.locator('[data-submit-all]').click();
    if (workingRequired) await page.locator('[data-evidence-warning-continue]').click();
    await page.locator('.quiz-results').waitFor();
  }
  for (const [kind, file, id] of [
    ['choice', 'templates/quiz-template.html', 'q1'],
    ['number', 'samples/numeric-input-demo.html', 'fraction-sum'],
    ['drag-drop', 'samples/drag-drop-demo.html', 'series-passage'],
  ]) {
    await page.goto(origin + prefix + 'pages/tools/quiz-player.html?lang=en&content=../../content/' + file);
    await page.locator('[data-giveup-button]').waitFor();
    if (kind === 'number') await page.locator('math-field[data-numeric-answer]').waitFor();
    await page.locator('[data-giveup-button]').click();
    await page.locator('[data-current-solution]').waitFor({ state: 'visible' });
    assert.match(await page.locator('[data-current-solution]').textContent(), /รอบถัดไป|next attempt/);
    await locked(kind, id); await page.evaluate(() => LearningHubQuiz.flushLocal());
    await page.reload(); await page.locator('[data-current-solution]').waitFor({ state: 'visible' });
    if (kind === 'number') await page.locator('math-field[data-numeric-answer]').waitFor();
    await locked(kind, id);
    await submit(); assert.equal((await state()).latestScore.score, 0);
    await page.locator('[data-edit-results]').click();
    await page.locator('[data-question-jump="0"]').click();
    if (kind === 'number') await page.locator('math-field[data-numeric-answer]').waitFor();
    await locked(kind, id); assert.equal((await state()).attempt, 1);
    await submit(); assert.equal((await state()).latestScore.score, 0);
    await page.locator('.quiz-result-item').first().click();
    if (kind === 'number') await page.locator('math-field[data-numeric-answer]').waitFor();
    await locked(kind, id);
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: resolve(output, 'quiz-variant-giveup-' + kind + '-locked.png'), fullPage: true });
    await submit(); await page.locator('[data-retry]').click();
    assert.equal((await state()).attempt, 2); assert.equal((await state()).giveUps[id], undefined);
    assert.equal(await page.locator('[data-current-solution]').isVisible(), false);
    if (kind === 'choice') {
      const correctIndex = await page.locator('[data-quiz-print-source] [data-question]').first().evaluate(question => [...question.querySelectorAll('[data-choice-id]')].findIndex(option => option.dataset.choiceId === question.dataset.answer));
      assert.ok(correctIndex >= 0); await page.locator('.quiz-option').nth(correctIndex).click();
    } else if (kind === 'number') {
      const math = page.locator('math-field[data-numeric-answer]'); await math.waitFor();
      assert.equal(await math.evaluate(node => node.readOnly), false);
      await math.click(); await math.press('5'); await math.press('/'); await math.press('6');
    } else {
      await page.locator('[data-current-options] [data-item-id="same"]').click(); await page.locator('[data-current-options] [data-slot-id="current"]').click();
      await page.locator('[data-current-options] [data-item-id="sum"]').click(); await page.locator('[data-current-options] [data-slot-id="voltage"]').click();
    }
    await submit(kind !== 'drag-drop'); assert.equal((await state()).latestScore.score, 1);
    console.log('PASS ' + kind + ': give up → reload/edit/review stay locked and score 0 → next attempt enables answering and credit');
  }
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
