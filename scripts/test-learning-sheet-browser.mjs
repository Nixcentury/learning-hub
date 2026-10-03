import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

// Real Hub, author sample and sandbox; only Firebase is stubbed. No live writes.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output');
const catalog = await catalogFromRepository();
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};
    export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),20);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const getDatabase=()=>({});export const ref=(_,path)=>path;
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
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1360, height: 1000 } });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType: 'text/javascript', body: stubs[url.pathname.split('/').at(-1)] || '' });
    return route.abort();
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(15000);
  const windowSelector = '[data-tool-id="content-html-learning-sheet-demo"]';
  const win = page.locator(windowSelector);
  const sheet = page.frameLocator(`${windowSelector} iframe`);
  const th = sheet.locator('[data-content-lang="th"]');
  const en = sheet.locator('[data-content-lang="en"]');
  const slot = th.locator('[data-sheet-slot="acid-role"]');
  await page.goto(origin + prefix + '#content/learning-sheet-demo');
  await page.locator('#guest-button').click();
  await sheet.locator('html[data-hub-sheet-ready]').waitFor();
  await sheet.locator('html[data-hub-math-state="ready"]').waitFor();
  assert.equal(await win.locator('iframe').getAttribute('sandbox'), 'allow-same-origin');
  assert.equal(await sheet.locator('[data-hub-sheet-toolbar]').count(), 1);
  assert.equal(await sheet.locator('[data-hub-sheet-toggle]').count(), 16);
  assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(), 0);
  assert.equal(await win.locator('.window-html-print').isDisabled(), false);
  assert.equal(await win.locator('.window-timer-controls').isVisible(), false);
  assert.equal(await slot.locator('[data-sheet-answer]').getAttribute('aria-hidden'), 'true');
  assert.equal(await slot.locator('[data-sheet-answer]').evaluate(node => node.inert), true);
  console.log('PASS real deep link, scripts-disabled sandbox, one controller, eight hidden semantic slots and print control');

  const before = await slot.boundingBox();
  await slot.getByRole('button').click();
  const after = await slot.boundingBox();
  assert.ok(Math.abs(before.width - after.width) < 1 && Math.abs(before.height - after.height) < 1, 'Revealing retains the note area');
  assert.equal(await slot.locator('[data-sheet-answer]').getAttribute('aria-hidden'), 'false');
  assert.equal(await slot.getByRole('button').getAttribute('aria-expanded'), 'true');
  await slot.getByRole('button').press('Space');
  assert.equal(await slot.getByRole('button').getAttribute('aria-expanded'), 'false');
  await slot.getByRole('button').press('Enter');
  console.log('PASS mouse/keyboard toggles, accessible hidden state and stable geometry');

  const sheetFrame = page.frames().find(frame => frame.url().includes('/learning-sheet-demo.html'));
  const formulaCount = await sheet.locator('[data-hub-math]').count();
  await win.locator('[data-window-language="en"]').click();
  await en.waitFor({ state: 'visible' });
  assert.equal(await en.locator('[data-sheet-slot="acid-role"] button').getAttribute('aria-expanded'), 'true');
  assert.equal(await en.locator('[data-sheet-slot="base-role"] button').getAttribute('aria-expanded'), 'false');
  await sheet.getByRole('button', { name: 'Reveal all', exact: true }).click();
  assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(), 16);
  await sheet.getByRole('button', { name: 'Hide all', exact: true }).click();
  assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(), 0);
  await win.locator('[data-window-language="th"]').click();
  await th.waitFor({ state: 'visible' });
  assert.equal(await sheet.locator('[data-hub-math]').count(), formulaCount);
  console.log('PASS TH/EN shares state, all/none works and formulas are not duplicated');

  const longSlot = th.locator('[data-sheet-slot="oxy-definition"]');
  const longBefore = await longSlot.boundingBox();
  await longSlot.getByRole('button').click();
  const longAfter = await longSlot.boundingBox();
  assert.ok(Math.abs(longBefore.height - longAfter.height) < 1, 'Rich answer does not collapse its note area');
  await win.locator('.is-minimize').click();
  await page.locator('.taskbar-item', { hasText: 'ใบเรียนรู้กรด–เบส' }).click();
  await win.waitFor({ state: 'visible' });
  assert.equal(page.frames().find(frame => frame.url().includes('/learning-sheet-demo.html')), sheetFrame);
  assert.equal(await longSlot.getByRole('button').getAttribute('aria-expanded'), 'true');
  console.log('PASS rich HTML/math area, minimize/restore keeps the frame and answers');

  await win.locator('.is-maximize').click();
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: resolve(output, `learning-sheet-${built ? 'built' : 'source'}-wide.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  await win.locator('.is-maximize').click();
  await sheet.getByRole('button', { name: 'เปิดทั้งหมด', exact: true }).click();
  for (const language of ['th', 'en']) {
    await win.locator(`[data-window-language="${language}"]`).click();
    await sheet.locator(`[data-content-lang="${language}"]`).waitFor({ state: 'visible' });
    assert.ok(await sheet.locator('html').evaluate(node => node.scrollWidth <= node.clientWidth + 1), `${language} must not overflow the narrow frame`);
  }
  await page.screenshot({ path: resolve(output, `learning-sheet-${built ? 'built' : 'source'}-mobile.png`) });
  console.log('PASS narrow iframe in both languages and screenshots saved');

  await win.locator('.is-close').click();
  await win.waitFor({ state: 'detached' });
  await page.goto(origin + prefix + '#content/learning-sheet-demo');
  await sheet.locator('html[data-hub-sheet-ready]').waitFor();
  assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(), 0);
  assert.equal(await sheet.locator('[data-hub-sheet-toolbar]').count(), 1);
  assert.equal(await sheet.locator('[data-hub-sheet-toggle]').count(), 16);
  console.log('PASS close/reopen starts hidden without duplicate listeners or controls');

  await page.setViewportSize({ width: 1360, height: 1000 });
  const printReport = [];
  for (const lang of ['th', 'en']) {
    await win.locator(`[data-window-language="${lang}"]`).click();
    await sheet.locator(`[data-content-lang="${lang}"]`).waitFor({ state: 'visible' });
    await sheet.locator(`[data-content-lang="${lang}"] [data-sheet-slot="acid-role"] button`).click();
    const beforePrint = await sheet.locator('body').innerHTML();
    await win.locator('.window-html-print').click();
    const dialog = page.locator('[data-html-print-dialog]');
    const printFrame = page.frameLocator('[data-html-print-frame]');
    for (const edition of ['blank', 'answers']) {
      if (edition === 'answers') await dialog.locator('[data-sheet-print-edition]').selectOption(edition);
      await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
      assert.equal(await printFrame.locator('html').getAttribute('data-sheet-print-edition'), edition);
      assert.equal(await printFrame.locator('[data-sheet-slot]').count(), 8);
      assert.equal(await printFrame.locator('[data-sheet-answer]').count(), edition === 'blank' ? 0 : 8);
      assert.equal(await printFrame.locator('.definition').count(), 2, 'Keep each definition box together across pages');
      assert.ok(await printFrame.locator('.definition').evaluateAll(nodes => nodes.every(node => node.querySelector('h3') && node.querySelector('[data-sheet-slot]'))), 'A box heading stays with its note area');
      assert.ok(await printFrame.locator('.definition').evaluateAll(nodes => nodes.every(node => node.closest('section')?.querySelector('h2'))), 'The comparison section heading stays with its definition boxes');
      assert.equal(await printFrame.locator('button, [data-hub-sheet-toolbar], [data-sheet-standalone-note], [inert]').count(), 0);
      assert.equal(await printFrame.locator(`[data-content-lang="${lang === 'th' ? 'en' : 'th'}"]`).count(), 0);
      const text = (await printFrame.locator('body').textContent()).replace(/\s+/g, '');
      for (const answer of lang === 'th' ? ['ให้โปรตอน', 'รับโปรตอน', 'เปลี่ยนเป็นสีแดง'] : ['protondonor', 'protonacceptor', 'Turnsred']) {
        assert.equal(text.includes(answer), edition === 'answers', `${edition}/${lang}: ${answer}`);
      }
      const areas = await printFrame.locator('[data-sheet-slot]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
      assert.ok(areas.every(value => value > 10), 'blank note areas must retain height');
      const source = await printFrame.locator('html').evaluate(node => '<!doctype html>\n' + node.outerHTML);
      const pdfPage = await context.newPage();
      await pdfPage.setContent(source, { waitUntil: 'load' });
      await pdfPage.evaluate(() => document.fonts.ready);
      const file = `learning-sheet-${built ? 'built' : 'source'}-${lang}-${edition}.pdf`;
      await pdfPage.pdf({ path: resolve(output, file), preferCSSPageSize: true, printBackground: true });
      const pages = Number(await printFrame.locator('html').getAttribute('data-hub-print-pages'));
      printReport.push({ lang, edition, file, pages });
      await pdfPage.close();
      assert.equal(await sheet.locator('body').innerHTML(), beforePrint, 'Print editions never change the teaching state');
    }
    // Exercise the iPad layout profile, without claiming a native Safari test.
    await dialog.locator('summary').click();
    await dialog.locator('[data-print-profile]').selectOption('device-margins');
    await dialog.locator('[data-print-rebuild]').click();
    await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
    assert.equal(await printFrame.locator('html').getAttribute('data-hub-print-profile'), 'device-margins');
    await dialog.locator('[data-print-close]').click();
  }
  await writeFile(resolve(output, `learning-sheet-${built ? 'built' : 'source'}-print-report.json`), JSON.stringify(printReport, null, 2));
  console.log('PASS blank/answer PDFs in TH/EN, no answer DOM in blanks, source state unchanged, A4 and device-margin profiles');

  await page.goto(origin + prefix + '#content/chemistry-chapter-10-overview');
  const normalWindow = page.locator('[data-tool-id="content-html-chemistry-chapter-10-overview"]');
  await normalWindow.locator('.window-html-print:not([disabled])').waitFor();
  const normalFrame = page.frameLocator('[data-tool-id="content-html-chemistry-chapter-10-overview"] iframe');
  assert.equal(await normalFrame.locator('[data-hub-sheet-toolbar]').count(), 0);
  console.log('PASS ordinary reading documents retain their print control and have no sheet UI');

  const standalone = await context.newPage();
  await standalone.goto(origin + prefix + 'content/samples/learning-sheet-demo.html');
  assert.equal(await standalone.locator('[data-hub-sheet-toolbar]').count(), 0);
  assert.equal(await standalone.locator('[data-content-lang="th"] [data-sheet-slot="acid-role"] [data-sheet-answer]').isVisible(), true);
  assert.equal(await standalone.locator('[data-content-lang="en"] [data-sheet-slot="acid-role"] [data-sheet-answer]').isVisible(), true);
  console.log('PASS standalone file remains readable in both languages');
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
