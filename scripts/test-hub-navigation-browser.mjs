import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildRouteCatalog } from './route-catalog.mjs';

// Real Hub/router/subject pages with virtual authoring fixtures. No live accounts,
// database, AI, or authored chapter files are changed. Supports the built Pages site.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output');
const quiz = await readFile(resolve(root, 'public/content/templates/quiz-template.html'), 'utf8');
const quizId = quiz.match(/data-activity-id="([^"]+)"/)[1];
const fixtures = new Map([
  ['content/qa-routes/topics.html', `<nav data-learning-menu data-menu-kind="topics" data-subject-id="chemistry" data-chapter-id="10" data-title-th="กรด–เบส QA" data-title-en="Acid–base QA">
    <a data-topic-id="theories" data-route-slug="theory" data-route-aliases="old-theory" data-th="ทฤษฎีกรด–เบส" data-en="Acid-base theories" href="tools.html">ทฤษฎี</a>
    <a data-topic-id="future" data-th="หัวข้อที่กำลังเตรียม" data-en="Upcoming topic">หัวข้อที่กำลังเตรียม</a></nav>`],
  ['content/qa-routes/tools.html', `<nav data-learning-menu data-menu-kind="tools" data-subject-id="chemistry" data-chapter-id="10" data-topic-id="theories" data-title-th="ทฤษฎีกรด–เบส" data-title-en="Acid-base theories">
    <a data-tool-kind="quiz" data-content-id="${quizId}" data-th="แบบฝึกทดสอบ" data-en="Practice quiz" href="../templates/quiz-template.html">แบบฝึก</a>
    <a data-tool-kind="simulation" data-content-id="qa-simulation" data-th="ซิมทดสอบ" data-en="Simulation" href="simulation.html">ซิม</a>
    <a data-tool-kind="html" data-content-id="qa-summary" data-th="สรุปทดสอบ" data-en="Summary" href="summary.html">สรุป</a></nav>`],
  ['content/qa-routes/simulation.html', `<html data-learning-simulation data-activity-id="qa-simulation"><body><h1 data-th="ซิมภาษาไทย" data-en="English simulation">ซิมภาษาไทย</h1><label><span data-th="ทดลอง" data-en="Experiment">ทดลอง</span><input id="experiment" value="1"></label><script>window.addEventListener('message', event => {if(event.source === parent && event.origin === location.origin && event.data?.type === 'learning-hub-context') document.body.dataset.receivedLanguage = event.data.language;});</script></body></html>`],
  ['content/qa-routes/summary.html', String.raw`<!doctype html><html data-learning-html><head></head><body>
    <div data-content-lang="th" lang="th"><h1>สรุปภาษาไทย</h1><p>\(\frac{1}{2}\)</p></div>
    <div data-content-lang="en" lang="en" hidden><h1>English summary</h1><p>\(\ce{H2O}\)</p></div>
    <p id="inline-formula" data-th="คำไทย \(x^2\)" data-en="English \(x^3\)">คำไทย \(x^2\)</p>
    <section><p data-content-lang="th">มีภาษาไทยอย่างเดียว</p></section>
    <a data-hub-html data-content-id="qa-reading" href="reading.html">Read more</a></body></html>`],
  ['content/qa-routes/reading.html', '<!doctype html><html data-learning-html><body><h1>QA reading</h1></body></html>'],
]);
async function source(name) {
  if (fixtures.has(name)) return fixtures.get(name);
  let data = await readFile(resolve(root, name === 'index.html' ? name : 'public/' + name), 'utf8');
  if (name === 'pages/chemistry.html') data = data.replace(/<article\s+data-chapter="10"[^>]*>/,
    '<article data-chapter="10" data-route-slug="acid-base" data-route-aliases="acids" data-chapter-src="../content/qa-routes/topics.html">')
    .replace('</template>', '<article data-chapter="99"><h2 data-chapter-title data-th="บทใหม่" data-en="New chapter">บทใหม่</h2></article></template>');
  return data;
}
const catalog = await buildRouteCatalog({ read: source });
let failCatalog = false, failMenu = false, delayMenu = false;
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};
    export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),30);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const getDatabase=()=>({});export const ref=(_,path)=>path;
    export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};
    export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>0;
    export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});
    export const set=async()=>{throw Error('Live database writes forbidden')};export const update=set;export const remove=set;`,
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!path.startsWith(prefix)) throw Error('Outside prefix');
    const name = path.slice(prefix.length) || 'index.html';
    const directory = built ? resolve(root, 'dist') : root;
    if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
    if (name === 'route-catalog.v1.json') {
      response.writeHead(failCatalog ? 503 : 200, {'Content-Type':'application/json'});
      response.end(failCatalog ? '{}' : JSON.stringify(catalog)); return;
    }
    if (name === 'content/qa-routes/tools.html') {
      if (delayMenu) await new Promise(done => setTimeout(done, 450));
      if (failMenu) { response.writeHead(503); response.end('Unavailable'); return; }
    }
    let data;
    if (fixtures.has(name) || name === 'pages/chemistry.html') data = await source(name);
    else {
      try { data = await readFile(resolve(directory, name)); }
      catch { if (built) throw Error('Missing build artifact'); data = await readFile(resolve(root, 'public', name)); }
    }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix).replaceAll('src="/shared/', `src="${prefix}shared/`);
    response.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[extname(name)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel:'msedge', headless:true });
  const context = await browser.newContext({ viewport:{width:1440,height:1000} });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    return route.fulfill({contentType:'text/javascript',body:url.hostname === 'www.gstatic.com' ? stubs[url.pathname.split('/').at(-1)] || '' : ''});
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (process.env.QA_ROUTE_DEBUG === '1') page.on('console', message => console.log('BROWSER',message.type(),message.text()));
  const subject = page.frameLocator('#hub-page-frame');
  async function ready(hash) {
    await page.waitForURL(url => url.hash === hash);
    const route = catalog.routes.find(item => item.hash === hash);
    await subject.locator(`[data-subject-page][data-subject-id="${route.subjectId || route.sectionId}"][data-navigation-ready="ready"]:not([inert])`).waitFor();
  }
  async function chapter() { await ready('#chemistry/acid-base'); await subject.locator('[data-menu-entry="theories"]').waitFor(); }
  async function topic() { await ready('#chemistry/acid-base/theory'); await subject.locator(`[data-menu-entry="${quizId}"]`).waitFor(); }
  await page.goto(origin + prefix + '#chemistry/10/theories');
  await page.locator('#guest-button').click();
  await page.locator('#hub-view').waitFor({state:'visible'});
  await topic();
  assert.equal(await subject.locator('.orbit-select').inputValue(), '9');
  await page.reload(); await topic();
  console.log('PASS deep link survives login gate and refresh; aliases resolve to canonical route and original chapter ID');

  const second = await context.newPage();
  await second.goto(page.url());
  await second.locator('#guest-button').click();
  await second.frameLocator('#hub-page-frame').locator(`[data-menu-entry="${quizId}"]`).waitFor();
  await second.close();
  console.log('PASS copied address opens the same topic in a fresh tab');

  await subject.locator('[data-menu-back]').click(); await chapter();
  await subject.locator('[data-menu-back]').click(); await ready('#chemistry');
  assert.equal(await subject.locator('.orbit-select').inputValue(), '9');
  const historyBefore = await page.evaluate(() => history.length);
  await page.locator('[data-section="chemistry"]').click(); await ready('#chemistry');
  assert.equal(await page.evaluate(() => history.length), historyBefore);
  await subject.locator('.orbit-open').click(); await chapter();
  await subject.locator('[data-menu-entry="theories"]').click(); await topic();
  await page.goBack(); await chapter();
  await page.goBack(); await ready('#chemistry');
  await page.goForward(); await chapter();
  await page.goForward(); await topic();
  console.log('PASS click, local back controls, Back/Forward and repeated tab clicks have no duplicate history entries');

  await page.locator('[data-section="physics"]').click(); await ready('#physics');
  await subject.locator('.orbit-select').selectOption('2');
  await subject.locator('.orbit-open').click(); await ready('#physics/3');
  await subject.locator('#activity-view:not([hidden])').waitFor();
  await page.goBack(); await ready('#physics');
  await page.goBack(); await topic();
  console.log('PASS cross-subject history restores the menu, not an iframe-only history entry; legacy chapters still open');

  await page.locator('#hub-view [data-language="en"]').click();
  await subject.locator('[data-menu-title]').filter({hasText:'Acid-base theories'}).waitFor();
  assert.equal(new URL(page.url()).hash, '#chemistry/acid-base/theory');
  await page.locator('#hub-view [data-language="th"]').click();
  await subject.locator('.content-breadcrumb button').nth(1).click(); await chapter();
  await subject.locator('.content-breadcrumb button').first().click(); await ready('#chemistry');
  console.log('PASS language changes preserve route and breadcrumbs update it');

  await page.evaluate(() => { location.hash = '#chemistry/10/future'; });
  await ready('#chemistry/acid-base/future');
  await subject.locator('[data-menu-title]').filter({hasText:'หัวข้อที่กำลังเตรียม'}).waitFor();
  assert.equal(await subject.locator('[data-menu-cards] button').count(), 0);
  await subject.locator('.content-menu-notice').filter({hasText:'กำลังเตรียมเนื้อหา'}).waitFor();
  await page.evaluate(() => { location.hash = '#chemistry/99'; });
  await ready('#chemistry/99');
  assert.equal(await subject.locator('#activity-view .activity-grid').isVisible(), false);
  console.log('PASS preparing topics and newly authored chapters have a safe destination without fake tools');

  await page.evaluate(() => { location.hash = '#chemistry/10/missing'; }); await chapter();
  await page.locator('#hub-route-notice').filter({hasText:'ไม่พบตำแหน่ง'}).waitFor();
  await page.evaluate(id => { location.hash = '#content/' + id; }, quizId);
  await ready('#content/' + quizId);
  await page.frameLocator('.workspace-tool-frame').locator('[data-quiz-root], [data-current-options]').first().waitFor();
  assert.equal(await page.locator('.workspace-tool-frame').count(), 1);
  console.log('PASS missing locations explain the fallback; direct content link opens the Quiz');

  await page.goBack(); await chapter();
  assert.equal(await page.locator('.workspace-window:visible').count(), 0);
  assert.equal(await page.locator('.workspace-tool-frame').count(), 1);
  await page.goForward(); await ready('#content/' + quizId);
  assert.equal(await page.locator('.workspace-tool-frame').count(), 1);
  console.log('PASS Back minimizes and Forward restores the same frame without discarding work');

  // Workspace frames are not allowed to impersonate the subject page's navigation channel.
  const quizFrame = await (await page.locator('.workspace-tool-frame').elementHandle()).contentFrame();
  await quizFrame.locator('[data-current-options] .quiz-option').first().click();
  await quizFrame.locator('[data-reasoning-input]').fill('QA language draft');
  const answersBeforeLanguage = await quizFrame.evaluate(() => LearningHubQuiz.getState().answers);
  const quizWindow = page.locator('.workspace-window:visible');
  await quizWindow.locator('[data-window-language="en"]').click();
  await quizFrame.waitForFunction(() => document.documentElement.lang === 'en');
  assert.deepEqual(await quizFrame.evaluate(() => LearningHubQuiz.getState().answers), answersBeforeLanguage);
  assert.equal(await quizFrame.locator('[data-reasoning-input]').inputValue(), 'QA language draft');
  await quizFrame.locator('[data-language-button="th"]').click();
  await page.waitForFunction(() => document.documentElement.lang === 'th');
  assert.equal(await quizWindow.locator('[data-window-language="th"]').getAttribute('aria-pressed'), 'true');
  console.log('PASS shared and inner Quiz language buttons sync without clearing answers or reasoning');
  await quizFrame.evaluate(() => parent.postMessage({type:'learning-hub-navigation-ready',pageId:'fake',subjectId:'chemistry'},location.origin));
  await page.locator('[data-section="physics"]').click(); await ready('#physics');
  assert.equal(await page.locator('.workspace-tool-frame').count(), 1, 'Changing navigation must not close an open activity');
  await page.locator('.taskbar-item').click();
  await ready(`#chemistry/acid-base/theory/${quizId}`);
  await page.locator('.window-control.is-close').click();
  await page.locator('.workspace-tool-frame').waitFor({state:'detached'});
  console.log('PASS manual Quiz opening remains supported and subject navigation does not close its workspace');

  await page.goto(origin + prefix + '?qa=share#content/qa-simulation');
  const simWindow = page.locator('[data-tool-id="content-simulation-qa-simulation"]');
  await simWindow.waitFor({state:'visible'});
  const simulation = page.frameLocator('[data-tool-id="content-simulation-qa-simulation"] iframe');
  const simFrame = await (await simWindow.locator('iframe').elementHandle()).contentFrame();
  if (process.env.QA_ROUTE_DEBUG === '1') page.on('framenavigated', frame => console.log('NAV',frame === page.mainFrame() ? 'TOP' : 'CHILD',frame.url()));
  await page.evaluate(() => { window.qaDocument = 'share-test'; });
  await simFrame.evaluate(() => { window.qaFrame = 'share-test'; });
  await simulation.locator('#experiment').fill('42');
  await simWindow.locator('[data-window-language="en"]').click();
  await simulation.getByText('English simulation').waitFor();
  await simulation.locator('body[data-received-language="en"]').waitFor();
  assert.equal(await simulation.locator('#experiment').inputValue(), '42');
  await simWindow.locator('[data-window-language="th"]').click();
  await simulation.getByText('ซิมภาษาไทย').waitFor();
  console.log('PASS simulation labels and context receive the shared language without resetting controls');
  await simWindow.locator('.window-share').click();
  await page.locator('[data-share-copy]:enabled').waitFor();
  const sharedUrl = await page.locator('#hub-share-url').inputValue();
  assert.equal(sharedUrl, origin + prefix + '#content/qa-simulation');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async value => { window.qaCopied = value; }}}));
  await page.locator('[data-share-copy]').click();
  await page.locator('.hub-share-status').filter({hasText:'คัดลอกแล้ว'}).waitFor();
  assert.equal(await page.evaluate(() => window.qaCopied), sharedUrl);
  await page.keyboard.press('Escape');
  await page.locator('.hub-share-dialog').waitFor({state:'detached'});
  await page.locator('[data-section="physics"]').click(); await ready('#physics');
  await page.goBack(); await ready('#content/qa-simulation');
  if (process.env.QA_ROUTE_DEBUG === '1') console.log('RESUMED',await page.evaluate(() => window.qaDocument), await simFrame.evaluate(() => window.qaFrame).catch(() => 'detached'), page.url());
  assert.equal(await simulation.locator('#experiment').inputValue(), '42');
  assert.equal(await page.locator('.workspace-tool-frame').count(), 1);
  for (let cycle = 0; cycle < 8; cycle += 1) {
    await page.locator('[data-section="physics"]').click(); await ready('#physics');
    await page.goBack(); await ready('#content/qa-simulation');
    assert.equal(await simulation.locator('#experiment').inputValue(), '42', `Back cycle ${cycle}`);
    assert.equal(await simFrame.evaluate(() => window.qaFrame), 'share-test');
    await page.goForward(); await ready('#physics');
    await page.goBack(); await ready('#content/qa-simulation');
    assert.equal(await simulation.locator('#experiment').inputValue(), '42', `Forward/Back cycle ${cycle}`);
  }
  console.log('PASS simulation share strips queries; clipboard works; navigation preserves simulation state');

  // Cold documents exercise activity loading before the subject menu finishes.
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.goto(origin + prefix + `?qa=cold-${cycle}#content/qa-simulation`);
    await simulation.locator('#experiment').fill('73');
    await page.locator('[data-section="physics"]').click(); await ready('#physics');
    await page.goBack(); await ready('#content/qa-simulation');
    assert.equal(await simulation.locator('#experiment').inputValue(), '73', `Cold navigation ${cycle}`);
  }
  console.log('PASS cold direct links retain live fields when returning from a different subject');

  const recipient = await context.newPage();
  await recipient.goto(sharedUrl);
  await recipient.locator('#login-view').waitFor({state:'visible'});
  assert.equal(await recipient.locator('.workspace-tool-frame').count(), 0);
  await recipient.locator('#guest-button').click();
  await recipient.frameLocator('.workspace-tool-frame').locator('#experiment').waitFor();
  assert.equal(await recipient.frameLocator('.workspace-tool-frame').locator('#experiment').inputValue(), '1');
  await recipient.reload();
  await recipient.frameLocator('.workspace-tool-frame').locator('#experiment').waitFor();
  await recipient.close();
  console.log('PASS recipient waits for login/guest gate and opens the same activity without sender state');

  await page.evaluate(() => { location.hash = '#content/qa-summary'; });
  const summaryWindow = page.locator('[data-tool-id="content-html-qa-summary"]');
  await summaryWindow.waitFor({state:'visible'});
  assert.equal(await summaryWindow.locator('iframe').getAttribute('sandbox'), 'allow-same-origin');
  const reading = page.frameLocator('[data-tool-id="content-html-qa-summary"] iframe');
  await summaryWindow.locator('[data-window-language="en"]').click();
  await reading.getByText('English summary', {exact:true}).waitFor();
  assert.equal(await reading.getByText('สรุปภาษาไทย', {exact:true}).isVisible(), false);
  assert.equal(await reading.getByText('มีภาษาไทยอย่างเดียว').isVisible(), true);
  await reading.locator('#inline-formula [data-math-tex="x^3"] svg').waitFor();
  await summaryWindow.locator('[data-window-language="th"]').click();
  await reading.locator('#inline-formula [data-math-tex="x^2"] svg').waitFor();
  await summaryWindow.locator('[data-window-language="en"]').click();
  await reading.locator('#inline-formula [data-math-tex="x^3"] svg').waitFor();
  await summaryWindow.locator('.window-html-print').click();
  await page.locator('[data-print-confirm]:enabled').waitFor({timeout:25000});
  const printed = page.frameLocator('[data-html-print-frame]');
  assert.equal(await printed.locator('[data-content-lang="th"][hidden]').count(), 0);
  assert.equal(await printed.locator('h1').filter({hasText:'สรุปภาษาไทย'}).count(), 0);
  await printed.getByText('English summary', {exact:true}).waitFor();
  await page.locator('[data-print-close]').click();
  await page.locator('.html-print-dialog').waitFor({state:'detached'});
  await summaryWindow.locator('[data-window-language="th"]').click();
  console.log('PASS HTML language blocks, single-language fallback, live math and selected-language print snapshot');
  await page.frameLocator('[data-tool-id="content-html-qa-summary"] iframe').getByText('Read more').click();
  await page.waitForURL(url => url.hash === '#content/qa-reading');
  await page.frameLocator('[data-tool-id="content-html-qa-reading"] iframe').getByText('QA reading').waitFor();
  await page.locator('[data-tool-id="content-html-qa-reading"] .window-share').click();
  await page.locator('[data-share-copy]:enabled').waitFor();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async () => { throw Error('Denied'); }}}));
  await page.locator('[data-share-copy]').click();
  await page.locator('.hub-share-status').filter({hasText:'ไม่อนุญาต'}).waitFor();
  assert.equal(await page.locator('#hub-share-url').evaluate(input => input.selectionEnd - input.selectionStart), (await page.locator('#hub-share-url').inputValue()).length);
  await page.locator('[data-share-close]').click();
  await page.locator('.hub-share-dialog').waitFor({state:'detached'});
  console.log('PASS nested readings open shareable routes, retain sandbox, and clipboard denial offers manual copying');

  for (const [id, hash] of [['2','#test/2/quiz'],['3','#tool/test-c3-quiz']]) {
    await page.goto(origin + prefix + hash);
    await page.locator(`[data-tool-id="test-c${id}-quiz"]`).waitFor({state:'visible'});
    await page.frameLocator(`[data-tool-id="test-c${id}-quiz"] iframe`).locator('[data-quiz-root], [data-current-options]').first().waitFor();
    assert.equal(new URL(page.url()).hash, hash);
  }
  console.log('PASS numeric and drag/drop legacy Quiz links preserve their original window/storage IDs');

  failMenu = true;
  await page.goto(origin + prefix + '#chemistry/acid-base/theory');
  await page.locator('#hub-route-notice').filter({hasText:'โหลดเมนูปลายทาง'}).waitFor();
  failMenu = false;
  await page.locator('[data-route-retry]').click(); await topic();
  console.log('PASS failed menu fetch offers a working retry without discarding the deep link');

  delayMenu = true;
  await subject.locator('[data-menu-back]').click(); await chapter();
  await subject.locator('[data-menu-entry="theories"]').click();
  await page.waitForURL(url => url.hash === '#chemistry/acid-base/theory');
  await page.locator('[data-section="physics"]').click(); await ready('#physics');
  await page.waitForTimeout(600);
  assert.equal(new URL(page.url()).hash, '#physics');
  await subject.locator('#chapter-view:not([hidden])').waitFor();
  delayMenu = false;
  console.log('PASS rapid navigation cancels stale menu work and cannot bring an old subject back');

  failCatalog = true;
  await page.goto(origin + prefix + '?qa=outage#chemistry/10/theories'); // New document, not a hash-only navigation.
  await page.locator('#hub-route-notice').filter({hasText:'โหลดสารบัญลิงก์ไม่ได้'}).waitFor();
  assert.equal(new URL(page.url()).hash, '#chemistry/10/theories');
  await subject.locator('.orbit-select').selectOption('9');
  await subject.locator('.orbit-open').click();
  await subject.locator('[data-menu-entry="theories"]').waitFor();
  failCatalog = false;
  await page.locator('[data-route-retry]').click(); await topic();
  console.log('PASS catalog outage retains the requested URL, allows manual browsing, and recovers via retry');

  await page.setViewportSize({width:390,height:844});
  assert.equal(await subject.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 2), true);
  await mkdir(output,{recursive:true});
  await page.screenshot({path:resolve(output,'sharing-phase2-topic-mobile.png'),fullPage:true});
  await page.locator('#hub-share-button').click();
  await page.locator('[data-share-copy]:enabled').waitFor();
  assert.equal(await page.locator('#hub-share-url').inputValue(), origin + prefix + '#chemistry/acid-base/theory');
  assert.equal(await page.locator('.hub-share-dialog').evaluate(el => el.getBoundingClientRect().right <= innerWidth), true);
  await page.screenshot({path:resolve(output,'sharing-link-mobile.png'),fullPage:true});
  await page.keyboard.press('Escape');
  await page.locator('.hub-share-dialog').waitFor({state:'detached'});
  await page.setViewportSize({width:1024,height:768});
  await page.screenshot({path:resolve(output,'sharing-phase2-topic-tablet.png'),fullPage:true});
  await subject.locator(`[data-menu-entry="${quizId}"]`).click();
  await ready(`#chemistry/acid-base/theory/${quizId}`);
  await page.locator('.window-share').click();
  await page.locator('[data-share-copy]:enabled').waitFor();
  await page.screenshot({path:resolve(output,'sharing-activity-tablet.png'),fullPage:true});
  assert.deepEqual(errors, []);
  console.log('PASS mobile/tablet layouts and no uncaught browser errors; all live services blocked');
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
