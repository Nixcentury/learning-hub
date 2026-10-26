import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';
import { bankContentId, bankSnapshotBody, sha256 } from '../public/shared/question-bank-model.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const built = process.env.QA_BUILT === '1', prefix = '/learning-hub/';
const output = resolve(root, 'qa-output'); await mkdir(output, { recursive: true });
const routeCatalog = await catalogFromRepository();
const key = 'b-' + 'a'.repeat(24), contentId = bankContentId('physics', key);
const mechanics = 'กลศาสตร์(Mechanics)', sound = 'เสียง(Sound)';
const question = (text, answer = 'A') => `<div class="question-step" data-ans="${answer}"><h3>${text} $F=ma$</h3>
<table><tr><td>ข้อมูล</td><td>2</td></tr></table><div class="hint-box">Hint secret</div><div class="options">
<label><input name="q1" type="radio" value="A">A. $2$ N</label><label><input name="q1" type="radio" value="B">B. $4$ N</label></div><div class="feedback-box">เฉลย SECRET-SOLUTION</div></div>`;
async function snapshot(html) {
  const value = { schemaVersion: 1, subjectId: 'physics', bankKey: key, legacyId: 'ฟิสิกส์ - ทดสอบ', title: 'แรงและการเคลื่อนที่(Forces and Motion)', rows: [{ rowNumber: 2, html }] };
  value.revision = await sha256(JSON.stringify(bankSnapshotBody(value))); return value;
}
const first = await snapshot(question('โจทย์เดิมข้อหนึ่ง') + question('โจทย์เดิมข้อสอง', 'B'));
const second = await snapshot(question('โจทย์แก้ไขข้อหนึ่ง', 'B') + question('โจทย์เดิมข้อสอง', 'B') + question('ข้อเพิ่มท้ายชุด'));
let current = first;
const archives = new Map([[first.revision, first], [second.revision, second]]);
const bankConfig = `export const questionBankConfig={endpoint:'https://bank.test/exec',cacheMs:60000};export const questionBankTools={};`;
const auth = `let session={status:'signed-in',user:{uid:'student-a'}};const listeners=[];
export function getAuthSession(){return session} export function subscribeAuth(fn){listeners.push(fn);fn(session);return ()=>{}}
export function setUser(uid){session={status:uid?'signed-in':'guest',user:uid?{uid}:null};listeners.forEach(fn=>fn(session))}`;
const database = `export const getDatabase=()=>({});export const ref=(_,path)=>path;export const serverTimestamp=()=>Date.now();
export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};
export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});
export async function get(path){const value=structuredClone(window.bankDb?.[path]||null);return {exists:()=>value!==null,val:()=>value}}
export async function set(path,value){window.bankDb[path]=structuredClone(value)} export const update=set,remove=set;
export async function runTransaction(path,fn){const next=fn(structuredClone(window.bankDb[path]||null));if(next===undefined)return {committed:false};await set(path,next);return {committed:true}}`;
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}} export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};
    export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),10);return ()=>{}};export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('No live login')};`,
  'firebase-database.js': database,
};
const harness = `<!doctype html><html lang="th"><head><link rel="stylesheet" href="${prefix}css/styles.css"></head><body>
<button id="open">Open</button><div id="layer" class="workspace-window-layer" style="height:900px;position:relative"></div><div id="bar"><span id="count"></span><div id="items"></div></div>
<script type="module">import {createWorkspace} from '${prefix}js/workspace.js';import {getAuthSession,setUser} from '${prefix}js/auth.js';import '${prefix}js/quiz-progress.js';
window.bankDb ||= {}; window.qa={setUser(uid){setUser(uid);workspace.setContext()}};
const workspace=createWorkspace({windowLayer:document.querySelector('#layer'),taskbar:document.querySelector('#bar'),taskbarItems:document.querySelector('#items'),countElement:document.querySelector('#count'),getLanguage:()=> 'th',getRole:()=> 'student',getIdentity:()=>({status:getAuthSession().status,uid:getAuthSession().user?.uid})});
document.querySelector('#open').onclick=()=>workspace.openBank({subjectId:'physics',bankKey:'${key}',toolKey:'quiz'});</script></body></html>`;
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) throw Error('Outside prefix');
    const name = pathname.slice(prefix.length) || 'index.html';
    let data;
    if (name === '__bank-harness') data = harness;
    else if (name.endsWith('shared/question-bank-config.js')) data = bankConfig;
    else if (name === 'route-catalog.v1.json' && !built) data = JSON.stringify(routeCatalog);
    else {
      const directory = built ? resolve(root, 'dist') : root;
      if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
      try { data = await readFile(resolve(directory, name)); }
      catch { if (built) throw Error('Missing built asset'); data = await readFile(resolve(root, 'public', name)); }
    }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix).replaceAll('src="/shared/', `src="${prefix}shared/`);
    res.setHeader('Content-Type', name === '__bank-harness' ? 'text/html; charset=utf-8' : ({ '.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json' })[extname(name)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined), headless: true });
  async function makeContext(account = false) {
    const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, hasTouch: true });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (account && url.pathname === prefix + 'js/auth.js') return route.fulfill({ contentType: 'text/javascript', body: auth });
      if (account && url.pathname === prefix + 'js/firebase-config.js') return route.fulfill({ contentType: 'text/javascript', body: 'export const firebaseApp={}' });
      if (url.hostname === 'bank.test') {
        const subject = url.searchParams.get('subject');
        const value = url.searchParams.get('action') === 'catalog'
          ? { schemaVersion: 1, subjectId: subject, sets: subject === 'physics' ? [
            { bankKey: key, legacyId: current.legacyId, title: current.title, path: ['ฟิสิกส์', 'Learning hub', mechanics, current.title], questionCount: current === first ? 2 : 3 },
            { bankKey: 'b-' + 'b'.repeat(24), legacyId: 'empty-mechanics', title: 'งานและพลังงาน(Work and Energy)', path: ['ฟิสิกส์', 'Learning hub', mechanics, 'งานและพลังงาน(Work and Energy)'], questionCount: 0 },
            { bankKey: 'b-' + 'c'.repeat(24), legacyId: 'empty-sound', title: 'แรงดันเสียง(Sound Pressure)', path: ['ฟิสิกส์', 'Learning hub', sound, 'แรงดันเสียง(Sound Pressure)'], questionCount: 0 },
          ] : [{ bankKey: key, legacyId: 'chemistry-qa', title: 'กรดและเบส(Acids and Bases)', path: ['เคมี', 'Learning hub', 'กรด–เบส(Acid–base)', 'กรดและเบส(Acids and Bases)'], questionCount: 0 }] }
          : url.searchParams.get('revision') ? archives.get(url.searchParams.get('revision')) : current;
        return route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(value ? { ok: true, data: value } : { ok: false, code: 'snapshot-not-found' }) });
      }
      if (url.origin === origin) return route.continue();
      const name = url.pathname.split('/').at(-1);
      if (stubs[name]) return route.fulfill({ contentType: 'text/javascript', body: stubs[name] });
      return route.fulfill({ contentType: 'text/javascript', body: '' });
    });
    return context;
  }
  const context = await makeContext(), page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', dialog => dialog.accept());
  await page.goto(origin + prefix + '#physics'); await page.locator('#guest-button').click();
  const subject = page.frameLocator('#hub-page-frame');
  await page.waitForURL(url => url.hash === '#physics/bank');
  await subject.locator('[data-bank-chapter] option').nth(3).waitFor({ state: 'attached' });
  assert.equal(await subject.locator('#chapter-view').isVisible(), false);
  assert.equal(await subject.locator('[data-bank-back]').isVisible(), false);
  assert.equal(await subject.locator('.bank-entry').count(), 0);
  assert.equal(new URL(page.url()).hash, '#physics/bank');
  assert.equal(await subject.locator('[data-bank-cards] button').count(), 0);
  assert.equal(await subject.locator('[data-bank-search]').isDisabled(), true);
  await subject.locator('[data-bank-chapter]').selectOption('chapter:' + sound);
  assert.equal(await subject.locator('[data-bank-cards] button').count(), 1);
  await subject.locator('[data-bank-cards] button').click();
  assert.equal(await subject.getByRole('button', {name:/แสดงข้อสอบ/}).isDisabled(), true);
  await subject.locator('[data-bank-back]').click();
  await subject.locator('[data-bank-chapter]').waitFor({ state: 'visible' });
  assert.equal(await subject.locator('[data-bank-chapter]').inputValue(), 'chapter:' + sound);
  await subject.locator('[data-bank-chapter]').selectOption('all');
  assert.equal(await subject.locator('[data-bank-cards] button').count(), 0);
  await subject.locator('[data-bank-search]').fill('แรง');
  assert.equal(await subject.locator('[data-bank-cards] button').count(), 2);
  await subject.locator('[data-bank-chapter]').selectOption('chapter:' + mechanics);
  assert.equal(await subject.locator('[data-bank-cards] button').count(), 2);
  assert.equal(await subject.locator('[data-bank-search]').inputValue(), '');
  await subject.locator('[data-bank-search]').fill('ไม่เจอ'); assert.equal(await subject.locator('[data-bank-cards] button').count(), 0);
  await subject.locator('[data-bank-refresh]').click();
  await subject.locator('[data-bank-refresh]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#hub-page-frame').contentDocument.querySelector('[data-bank-refresh]').disabled);
  assert.equal(await subject.locator('[data-bank-search]').inputValue(), 'ไม่เจอ');
  await subject.locator('[data-bank-search]').fill('แรง'); await subject.locator('[data-bank-cards] button').first().click();
  await page.waitForURL(url => url.hash === `#physics/bank/${key}`);
  assert.equal(new URL(page.url()).hash, `#physics/bank/${key}`);
  await subject.locator('[data-bank-back]').click();
  await subject.locator('[data-bank-chapter]').waitFor({ state: 'visible' });
  assert.equal(await subject.locator('[data-bank-chapter]').inputValue(), 'chapter:' + mechanics);
  assert.equal(await subject.locator('[data-bank-search]').inputValue(), 'แรง');
  assert.equal(await subject.locator('[data-bank-cards] button').count(), 1);
  await page.reload();
  await subject.locator('[data-bank-chapter]').waitFor({ state: 'visible' });
  assert.equal(await subject.locator('[data-bank-chapter]').inputValue(), 'chapter:' + mechanics);
  assert.equal(await subject.locator('[data-bank-search]').inputValue(), 'แรง');
  await page.locator('[data-language="en"]:visible').click();
  await page.waitForFunction(() => document.querySelector('#hub-page-frame').contentDocument.documentElement.lang === 'en');
  assert.equal(await subject.locator('[data-bank-cards] strong').first().textContent(), 'Forces and Motion');
  assert.match(await subject.locator('[data-bank-chapter]').evaluate(node => node.selectedOptions[0].textContent), /Mechanics/);
  assert.equal(await subject.locator('[data-bank-search]').getAttribute('placeholder'), 'Topic name or ID');
  await page.locator('[data-language="th"]:visible').click();
  await page.waitForFunction(() => document.querySelector('#hub-page-frame').contentDocument.documentElement.lang === 'th');
  await subject.locator('[data-bank-cards] button').first().click();
  console.log('PASS chapter-first menu, scoped/global search, TH/EN, empty topics and remembered filters after back/refresh/reload');
  for (const width of [390, 820]) {
    await page.setViewportSize({width, height:1000});
    for (const subjectId of ['chemistry', 'physics']) {
      await page.locator(`[data-section="${subjectId}"]`).tap();
      await page.waitForURL(url => url.hash === `#${subjectId}/bank`);
      await subject.locator('[data-bank-chapter] option').nth(2).waitFor({state:'attached'});
      assert.equal(await subject.locator('#chapter-view').isVisible(), false);
      assert.equal(await subject.locator('[data-bank-back]').isVisible(), false);
      assert.equal(await subject.locator('.prototype-badge').isVisible(), false);
      assert.equal(await subject.locator('body').evaluate(body => body.scrollWidth <= innerWidth + 2), true);
      if (width === 390) await page.screenshot({path:resolve(output, `${subjectId}-library-home-mobile.png`)});
      await subject.locator('[data-bank-chapter]').selectOption({index:2});
      await subject.locator('[data-bank-cards] button').first().tap();
      await subject.locator('[data-bank-back]').tap();
      await page.waitForURL(url => url.hash === `#${subjectId}/bank`);
      assert.equal(await subject.locator('#chapter-view').isVisible(), false);
    }
  }
  await page.locator('[data-section="chemistry"]').tap();
  await page.waitForURL(url => url.hash === '#chemistry/bank');
  await page.route('https://bank.test/**', route => route.fulfill({status:503,body:'Unavailable'}));
  await page.reload();
  await subject.locator('[data-bank-notice].is-error').waitFor();
  assert.equal(await subject.locator('[data-bank-back]').isVisible(), false);
  assert.equal(await subject.locator('#chapter-view').isVisible(), false);
  await page.unroute('https://bank.test/**');
  await subject.locator('[data-bank-refresh]').tap();
  await subject.locator('[data-bank-chapter] option').nth(2).waitFor({state:'attached'});
  await page.locator('[data-section="physics"]').tap();
  await page.waitForURL(url => url.hash === '#physics/bank');
  await subject.locator('[data-bank-chapter] option').nth(2).waitFor({state:'attached'});
  await subject.locator('[data-bank-cards] button').first().tap();
  await page.setViewportSize({width:1360,height:1000});
  console.log('PASS Physics/Chemistry library homes, phone/tablet taps, hidden legacy menus, back controls and service retry');
  await subject.getByRole('button', {name:/แสดงข้อสอบ/}).click();
  let frame = page.frameLocator('.workspace-tool-frame');
  await frame.locator('[data-current-options] .quiz-option').first().waitFor();
  let child = await page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  await frame.locator('[data-current-options] .quiz-option').first().click();
  await child.evaluate(() => LearningHubQuiz.flushLocal());
  let state = await child.evaluate(() => LearningHubQuiz.getState());
  assert.equal(state.answers[contentId + '-001'], 'a'); assert.equal(state.bankRevision, first.revision);
  assert.equal(await child.locator('[data-current-context] table').count(), 1);
  await page.screenshot({ path: resolve(output, 'question-bank-quiz.png') });
  current = second;
  await page.locator('.is-close').click(); await page.locator('.workspace-tool-frame').waitFor({ state: 'detached' });
  await subject.locator('[data-bank-cards] button').first().click(); await frame.locator('[data-current-options] .quiz-option').first().waitFor();
  child = await page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  state = await child.evaluate(() => LearningHubQuiz.getState()); assert.equal(state.bankRevision, first.revision); assert.equal(state.answers[contentId + '-001'], 'a');
  console.log('PASS real Hub layers, search, fixed suffix save, close and old-version resume after edits');
  await page.goBack(); await subject.locator('[data-bank-title]').waitFor();
  await page.screenshot({ path: resolve(output, 'question-bank-tools.png') });
  await page.goForward();
  assert.equal(await page.locator('.workspace-tool-frame').count(), 1);
  await Promise.all([
    child.waitForNavigation({waitUntil:'domcontentloaded'}),
    frame.locator('[data-bank-version] button').click(),
  ]);
  await child.waitForFunction(rev => window.LearningHubQuiz?.getState().bankRevision === rev, second.revision);
  state = await child.evaluate(() => LearningHubQuiz.getState()); assert.deepEqual(state.answers, {});
  console.log('PASS latest set starts only on explicit reset; back/forward reuses the window');
  // Use a dedicated print tab with the real sanitized content and print engine,
  // avoiding the Hub window chrome in exported A4 PDFs.
  const print = await context.newPage();
  await print.goto(origin + prefix + 'pages/tools/quiz-player.html?bankSubject=physics&bankKey=' + key);
  const rootHtml = await child.locator('[data-learning-activity-content]').evaluate(node => node.outerHTML);
  await print.evaluate(html => {
    document.querySelector('[data-quiz-print-source]').innerHTML = html;
    LearningHubPrint.configure({ getTitle: () => 'คลังข้อสอบ · Question bank', getContent: () => document.querySelector('[data-learning-activity-content]') });
  }, rootHtml);
  for (const mode of ['worksheet', 'answer']) {
    await print.evaluate(mode => LearningHubPrint.prepare(mode), mode);
    await print.evaluate(() => LearningHubPrint.typesetPrint());
    assert.ok(await print.locator('[data-print-host] mjx-container').count() >= 3);
    assert.equal(await print.locator('[data-print-host] [data-question]').count(), 3);
    assert.equal(await print.locator('[data-print-host] [data-question-solution]').count(), mode === 'answer' ? 3 : 0);
    if (mode === 'worksheet') assert.equal((await print.locator('[data-print-host]').textContent()).includes('SECRET-SOLUTION'), false);
    await print.pdf({ path: resolve(output, `question-bank-${mode}.pdf`), format: 'A4', printBackground: true });
    await print.evaluate(() => LearningHubPrint.restore());
  }
  console.log('PASS blank/answer print exports preserve the attempt');
  // Real old HTML is optional and stays in ignored work/, never a public fixture.
  if (process.env.BANK_LIVE_SAMPLE) {
    const sample = JSON.parse(await readFile(process.env.BANK_LIVE_SAMPLE, 'utf8'));
    const live = await snapshot(sample.values[0][2]);
    const count = await child.evaluate(async live => { const { adaptLegacyBank } = await import('../../shared/question-bank-adapter.js'); return adaptLegacyBank(live).querySelectorAll('[data-question]').length; }, live);
    assert.equal(count, 10); console.log('PASS actual PHYSIC row with ten legacy questions');
  }
  const sanitation = await child.evaluate(async first => {
    const { adaptLegacyBank } = await import('../../shared/question-bank-adapter.js');
    first.rows[0].html = first.rows[0].html.replace('<h3>', '<h3><script>window.bankInjected=true</script><span onclick="alert(1)">text</span>');
    const root = adaptLegacyBank(first); return { dangerous: root.querySelectorAll('script,[onclick],input').length, count: root.querySelectorAll('[data-question]').length };
  }, first);
  assert.deepEqual(sanitation, { dangerous: 0, count: 2 });
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto(origin + prefix + '#physics/bank');
  await subject.locator('[data-bank-chapter]').waitFor({ state: 'visible' });
  const tabletControls = await subject.locator('.bank-controls').evaluate(node => {
    const labels = [...node.querySelectorAll('label')].map(label => label.getBoundingClientRect());
    return { stacked: labels[1].top >= labels[0].bottom, widthFits: document.body.scrollWidth <= innerWidth + 1 };
  });
  assert.deepEqual(tabletControls, { stacked: true, widthFits: true });
  await page.screenshot({ path: resolve(output, 'question-bank-chapters-tablet.png') });
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto(origin + prefix + '#physics/bank/' + key); await subject.locator('[data-bank-cards] button').first().waitFor();
  await page.screenshot({ path: resolve(output, 'question-bank-mobile.png') });
  assert.equal(await subject.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1), true);
  assert.deepEqual(errors, []);
  console.log('PASS sanitized DOM, direct links and narrow layout');
  if (!built) {
    const accountContext = await makeContext(true), account = await accountContext.newPage();
    await account.goto(origin + prefix + '__bank-harness'); await account.locator('#open').click();
    const aframe = account.frameLocator('.workspace-tool-frame'); await aframe.locator('.quiz-option').first().waitFor();
    await aframe.locator('.quiz-option').first().click();
    const achild = await account.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
    await achild.evaluate(() => LearningHubQuiz.save());
    const records = await account.evaluate(() => bankDb);
    assert.equal(records[`quizProgress/${contentId}/student-a`].bankRevision, second.revision);
    current = first;
    const newDevice = await makeContext(true);
    await newDevice.addInitScript(records => { window.bankDb = records; }, records);
    const device = await newDevice.newPage(); device.on('dialog', d => d.accept());
    await device.goto(origin + prefix + '__bank-harness'); await device.locator('#open').click();
    const dframe = device.frameLocator('.workspace-tool-frame'); await dframe.locator('.quiz-option').first().waitFor();
    const dchild = await device.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
    const resumed = await dchild.evaluate(() => LearningHubQuiz.getState());
    assert.equal(resumed.bankRevision, second.revision); assert.equal(resumed.answers[contentId + '-001'], 'a');
    await device.evaluate(() => qa.setUser('student-b')); await dchild.waitForFunction(() => window.LearningHubQuiz?.getState().identityKey === 'student-b');
    await dframe.locator('.quiz-option').first().waitFor();
    assert.deepEqual(await dchild.evaluate(() => LearningHubQuiz.getState().answers), {});
    console.log('PASS account save, clean-device archived resume and account isolation (Firebase mocked)');
    await newDevice.close(); await accountContext.close();
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
