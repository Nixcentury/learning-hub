import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from 'linkedom';
import { bankSnapshotBody, sha256 } from '../public/shared/question-bank-model.js';
import { adaptLegacyBank } from '../public/shared/question-bank-adapter.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/learning-hub/';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const built = process.env.QA_BUILT === '1';
const out = resolve(process.env.QA_OUTPUT_DIR || `${root}/qa-output/quiz-print-rich-text`);
const legacyQuestion = (prompt, choices) => `<div class="question-step" data-ans="A"><h3>${prompt}</h3><div class="options">${choices.map((text, i) => `<label><input type="radio" value="${String.fromCharCode(65 + i)}">${text}</label>`).join('')}</div><div class="feedback-box">สูตรสำหรับทดสอบการพิมพ์ $x=2$</div></div>`;
const examples = [
  legacyQuestion(String.raw`ข้อที่ 7. พิจารณาปฏิกิริยาต่อไปนี้ $A(g)+B(g)\to AB(s)$ ในท่อแก้วยาว $90.0\ \mathrm{cm}$ ปิดปลายทั้งสอง ใส่สำลีชุบสารละลาย A (มวลโมเลกุล 17.0) ที่ปลายด้านซ้ายและสำลีชุบสารละลาย B (มวลโมเลกุล 68.0) ที่ปลายด้านขวา ที่อุณหภูมิคงที่ ปล่อยให้ไอของแก๊สทั้งสองแพร่เข้าหากันจนเกิดวงแหวนของ AB ตำแหน่งของวงแหวนควรอยู่ห่างจากปลายด้านซ้ายกี่เซนติเมตร`, ['18.0', '30.0', '45.0', '60.0', '72.0'].map(n => String.raw`$${n}\ \mathrm{cm}$`)),
  legacyQuestion(String.raw`ข้อที่ 18. พิจารณาปฏิกิริยา $\mathrm{Mg(s)+2HCl(aq)\to MgCl_2(aq)+H_2(g)}$ หากใช้แผ่น $\mathrm{Mg}$ มวล $0.10\ \mathrm{g}$ ทำปฏิกิริยากับสารละลาย $\mathrm{HCl}$ ความเข้มข้น $1.0\ \mathrm{M}$ ปริมาตร $10\ \mathrm{mL}$ ในภาชนะปิด ที่อุณหภูมิ $25\ ^\circ\mathrm{C}$ โดยไม่มีตัวเร่งปฏิกิริยา เปรียบเทียบในตัวเลือกทั้งหมด ข้อใดจะทำให้อัตราเร็วเริ่มต้นของปฏิกิริยาช้าที่สุด`, [
    String.raw`เติมตัวดูดซับ $\mathrm{H_2}$`, String.raw`เพิ่มอุณหภูมิเป็น $35\ ^\circ\mathrm{C}$`,
    String.raw`ใช้ $\mathrm{Mg}$ มวลเท่าเดิม แต่ตัดเป็นชิ้นเล็ก ๆ`,
    String.raw`เพิ่มความเข้มข้นเริ่มต้นของ $\mathrm{HCl}$ เป็น $2.0\ \mathrm{M}$`,
    String.raw`เติมสารละลาย $\mathrm{CuSO_4}$ ซึ่งเป็นตัวเร่งปฏิกิริยาลงไปเล็กน้อย`,
  ]),
];
const fixture = { schemaVersion: 1, subjectId: 'chemistry', bankKey: 'b-' + 'a'.repeat(24), legacyId: 'print-rich-text-regression', title: 'A-level 2569', rows: examples.map((html, i) => ({ rowNumber: i + 2, html })) };
fixture.revision = await sha256(JSON.stringify(bankSnapshotBody(fixture)));
// An optional public bank snapshot allows the same checks against a full set.
const snapshot = process.env.QA_BANK_SNAPSHOT ? JSON.parse(await readFile(process.env.QA_BANK_SNAPSHOT, 'utf8')).data : fixture;
const document = new DOMParser().parseFromString('<!doctype html><html><body></body></html>', 'text/html');
const content = adaptLegacyBank(snapshot, { document, Parser: DOMParser }).outerHTML;
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) throw Error('Outside prefix');
    const name = pathname.slice(prefix.length);
    if (name === 'content/qa-print-rich-text.html') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(content); return; }
    const directory = built ? resolve(root, 'dist') : root;
    if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
    let data;
    try { data = await readFile(resolve(directory, name)); }
    catch { if (built) throw Error('Missing built asset'); data = await readFile(resolve(root, 'public', name)); }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' })[extname(name)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (process.env.QA_ASSET_DIR && url.hostname === 'raw.githubusercontent.com') {
      const file = resolve(process.env.QA_ASSET_DIR, basename(decodeURIComponent(url.pathname)));
      return route.fulfill({ contentType: 'image/png', body: await readFile(file) });
    }
    if (url.hostname === 'script.google.com') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, data: snapshot }) });
    if (url.origin === origin) return route.continue();
    return route.fulfill({ contentType: 'text/javascript', body: '' });
  });
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}${prefix}pages/tools/quiz-player.html?content=../../content/qa-print-rich-text.html&lang=th`);
  try { await page.waitForFunction(() => window.LearningHubQuiz?.getState().contentId); }
  catch (error) { console.error({ errors, quizError: await page.locator('[data-quiz-error]').textContent() }); throw error; }
  await page.evaluate(() => MathJax.startup.promise);
  await page.evaluate(() => Promise.all([...document.querySelectorAll('[data-quiz-print-source] img')].map(image => image.decode())));
  const source = await page.locator('[data-quiz-print-source]').innerHTML();
  const count = await page.locator('[data-quiz-print-source] [data-question]').count();
  for (const lang of ['th', 'en']) {
    await page.locator(`[data-language-button="${lang}"]`).click();
    for (const mode of ['worksheet', 'answer']) {
      await page.evaluate(async mode => { LearningHubPrint.prepare(mode); await LearningHubPrint.typesetPrint(); }, mode);
      await page.emulateMedia({ media: 'print' });
      const paper = await page.evaluate(() => {
        const host = document.querySelector('[data-print-host]');
        const targets = [...host.querySelectorAll('[data-question]')].filter(q => /ข้อที่\s*(?:7|18)[.\s]/.test(q.querySelector('[data-question-prompt]').textContent));
        return {
          questions: host.querySelectorAll('[data-question]').length,
          solutions: host.querySelectorAll('[data-question-solution]').length,
          math: host.querySelectorAll('mjx-container').length,
          mathErrors: host.querySelectorAll('[data-mjx-error], mjx-merror').length,
          mathErrorDetails: [...host.querySelectorAll('[data-mjx-error], mjx-merror')].map(n => ({ question: n.closest('[data-question]')?.dataset.printIndex, error: n.getAttribute('data-mjx-error'), text: n.textContent })),
          targets: targets.map(q => {
            const prompt = q.querySelector('[data-question-prompt]');
            const size = parseFloat(getComputedStyle(prompt).fontSize);
            return { text: prompt.textContent.slice(0, 14), heightInEm: prompt.getBoundingClientRect().height / size,
              choiceHeights: [...q.querySelectorAll('[data-choice-id]')].map(n => n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).fontSize)) };
          }),
          overflow: [...host.querySelectorAll('[data-question-prompt], [data-choice-id]')].filter(n => n.scrollWidth > n.clientWidth + 2).length,
          overflowDetails: [...host.querySelectorAll('[data-question-prompt], [data-choice-id]')].filter(n => n.scrollWidth > n.clientWidth + 2).map(n => ({ question: n.closest('[data-question]').dataset.printIndex, text: n.textContent.slice(0, 70), width: n.clientWidth, scroll: n.scrollWidth })),
        };
      });
      assert.equal(paper.questions, count);
      assert.equal(paper.solutions, mode === 'answer' ? count : 0);
      assert.ok(paper.math >= 10, 'Real MathJax SVG typesetting is exercised');
      assert.equal(paper.mathErrors, 0, JSON.stringify(paper.mathErrorDetails));
      assert.equal(paper.targets.length, 2);
      for (const target of paper.targets) {
        assert.ok(target.heightInEm < 8, `${lang}/${mode}: ${target.text} must wrap as a paragraph, got ${target.heightInEm.toFixed(1)}em`);
        assert.ok(target.choiceHeights.every(height => height < 4), `${lang}/${mode}: mixed text/math choices must flow together`);
      }
      assert.equal(paper.overflow, 0, JSON.stringify(paper.overflowDetails));
      if (process.env.QA_PRINT_PDF === '1' && lang === 'th' && mode === 'worksheet') await page.pdf({ path: `${out}/CHEM-A-level-2569-Worksheet-Print-Fixed.pdf`, scale: Number(process.env.QA_PRINT_SCALE || 1), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
      await page.evaluate(() => LearningHubPrint.restore());
      await page.emulateMedia({ media: 'screen' });
      console.log(`PASS ${lang}/${mode}: ${count} questions, inline math paragraphs, readable choices and no overflow`);
    }
  }
  assert.equal(await page.locator('[data-quiz-print-source]').innerHTML(), source, 'Print decoration does not modify the source questions');
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
