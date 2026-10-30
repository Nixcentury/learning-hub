import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/learning-hub/';
const built = process.env.QA_BUILT === '1';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = resolve(root, 'qa-output/workspace-layout');
const catalog = built ? null : await catalogFromRepository();
const fixtures = {
  'sheet': '<!doctype html><html data-learning-html><body><h1>ใบเรียนรู้ทดสอบ</h1><label>บันทึกของฉัน <input id="notes"></label><p>อ่านและจดบันทึกควบคู่กับการทดลอง</p></body></html>',
  'simulation': '<!doctype html><html><body><h1>Simulator ทดสอบ</h1><label>ค่าทดลอง <input id="experiment" type="range" min="1" max="100" value="10"></label><button id="run">ทดลอง</button><output id="result">0</output><script>let runs=0;run.onclick=()=>result.textContent=++runs;</script></body></html>',
  'extra': '<!doctype html><html data-learning-html><body><h1>งานอีกชิ้น</h1><input id="draft" value="keep"></body></html>',
};
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}} export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),20);return ()=>{}};export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const getDatabase=()=>({});export const ref=(_,path)=>path;export const onValue=(_,fn)=>{fn({exists:()=>false,val:()=>null});return ()=>{}};export const get=async()=>({exists:()=>false,val:()=>null});export const serverTimestamp=()=>0;export const onDisconnect=()=>({remove:async()=>{},cancel:async()=>{}});export const set=async()=>{throw Error('Live database writes forbidden')};export const update=set,remove=set;`,
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!path.startsWith(prefix)) throw Error('Outside prefix');
    const name = path.slice(prefix.length) || 'index.html';
    const fixture = name.match(/^content\/qa-layout\/(sheet|simulation|extra)\.html$/)?.[1];
    if (fixture) { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(fixtures[fixture]); return; }
    const directory = built ? resolve(root, 'dist') : root;
    if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
    let data;
    if (name === 'route-catalog.v1.json' && !built) data = JSON.stringify(catalog);
    else {
      try { data = await readFile(resolve(directory, name)); }
      catch { if (built) throw Error('Missing built asset'); data = await readFile(resolve(root, 'public', name)); }
    }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix).replaceAll('src="/shared/', `src="${prefix}shared/`);
    response.setHeader('Content-Type', ({ '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.html':'text/html; charset=utf-8', '.svg':'image/svg+xml' })[extname(name)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER_EXECUTABLE ? { executablePath: process.env.QA_BROWSER_EXECUTABLE } : {}) });
  const context = await browser.newContext({ viewport: { width: 1360, height: 1000 }, hasTouch: true });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'www.gstatic.com') return route.fulfill({contentType:'text/javascript',body:stubs[url.pathname.split('/').at(-1)] || ''});
    if (url.hostname === 'script.google.com') return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,data:{schemaVersion:1,subjectId:url.searchParams.get('subject'),sets:[]}})});
    return route.abort();
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(15000);
  await page.goto(origin + prefix + '#physics');
  await page.locator('#guest-button').click();
  await page.locator('#hub-view').waitFor({state:'visible'});
  await page.waitForFunction(() => document.querySelector('#hub-page-frame')?.contentWindow.location.pathname.includes('/pages/'));
  async function open(name) {
    const [kind,titleTh,titleEn] = {sheet:['html','ใบเรียนรู้ทดสอบ','Learning sheet'],simulation:['simulation','Simulator ทดสอบ','Simulator'],extra:['html','งานอีกชิ้น','Another activity']}[name];
    const frame = await page.locator('#hub-page-frame').elementHandle().then(handle => handle.contentFrame());
    await frame.evaluate(content => parent.postMessage({type:'learning-hub-open-content',content},location.origin), {subjectId:'physics',chapterId:'19',topicId:'qa',toolKind:kind,contentId:'qa-layout-'+name,source:'content/qa-layout/'+name+'.html',titleTh,titleEn});
    await page.locator(`[data-tool-id="content-${kind}-qa-layout-${name}"]`).waitFor({state:'visible'});
  }
  const sheet = page.locator('[data-tool-id="content-html-qa-layout-sheet"]');
  const simulation = page.locator('[data-tool-id="content-simulation-qa-layout-simulation"]');
  const notes = page.frameLocator('[data-tool-id="content-html-qa-layout-sheet"] iframe').locator('#notes');
  const experiment = page.frameLocator('[data-tool-id="content-simulation-qa-layout-simulation"] iframe');
  const dialog = page.locator('.workspace-layout-dialog');
  await open('sheet');
  await notes.fill('บันทึกนี้ต้องอยู่เหมือนเดิม');
  await page.evaluate(() => { window.savedSheet = document.querySelector('.workspace-tool-frame').contentDocument; });
  await sheet.locator('.is-maximize').click();
  await sheet.locator('.window-split').click();
  await dialog.locator('[data-layout-action="choose"]').click();
  assert.equal(await page.locator('.workspace-split-pending').isVisible(), true);
  assert.equal(await sheet.isHidden(), true);
  await open('simulation');
  await experiment.locator('#run').click();
  await experiment.locator('#run').click();
  await experiment.locator('#experiment').evaluate(node => { node.value = '62'; node.dispatchEvent(new Event('input')); });
  assert.equal(await page.locator('.workspace-split-pending').isVisible(), false);
  assert.equal(await notes.inputValue(), 'บันทึกนี้ต้องอยู่เหมือนเดิม');
  await page.evaluate(() => { window.savedSimulation = document.querySelector('[data-tool-id="content-simulation-qa-layout-simulation"] iframe').contentDocument; });
  async function assertState() {
    assert.equal(await notes.inputValue(), 'บันทึกนี้ต้องอยู่เหมือนเดิม');
    assert.equal(await experiment.locator('#experiment').inputValue(), '62');
    assert.equal(await experiment.locator('#result').textContent(), '2');
    assert.equal(await page.evaluate(() => savedSheet === document.querySelector('[data-tool-id="content-html-qa-layout-sheet"] iframe').contentDocument && savedSimulation === document.querySelector('[data-tool-id="content-simulation-qa-layout-simulation"] iframe').contentDocument), true, 'Arranging keeps both original documents, with no reload');
  }
  async function assertPair(stacked = false) {
    const a = await sheet.boundingBox(), b = await simulation.boundingBox();
    assert.ok(a && b);
    if (stacked) { assert.ok(Math.abs(a.width - b.width) < 2); assert.ok(Math.min(a.y + a.height, b.y + b.height) <= Math.max(a.y, b.y) + 1); }
    else { assert.ok(Math.abs(a.width - b.width) < 2); assert.ok(Math.min(a.x + a.width, b.x + b.width) <= Math.max(a.x, b.x) + 1); }
    for (const win of [sheet, simulation]) {
      const outside = await win.locator('.workspace-window-bar button:visible').evaluateAll(nodes => nodes.filter(node => { const box=node.getBoundingClientRect(), frame=node.closest('.workspace-window').getBoundingClientRect();return box.left < frame.left-1 || box.right > frame.right+1 || box.top < frame.top-1 || box.bottom > frame.bottom+1; }).length);
      assert.equal(outside, 0, 'Every toolbar action stays inside its pane');
    }
    await assertState();
  }
  await assertPair();
  assert.equal(await page.evaluate(() => document.elementFromPoint(innerWidth/2,200)?.classList.contains('workspace-window-layer')), true, 'The split gutter does not click through to the menu');
  await sheet.locator('.window-split').click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement?.classList.contains('window-split'));
  await sheet.locator('.window-split').click();
  await dialog.locator('[data-layout-action="swap"]').click();
  assert.equal(await sheet.getAttribute('data-window-snap'), 'right');
  await assertPair();
  console.log('PASS choose second activity from menu, restore both, swap and accessible dialog; drafts and simulation state survive');

  await sheet.locator('.is-maximize').click();
  assert.ok((await sheet.boundingBox()).width >= 1358);
  await sheet.locator('.is-maximize').click();
  const before = await sheet.boundingBox(), handle = await sheet.locator('.window-resize-handle').boundingBox();
  await page.mouse.move(handle.x+16, handle.y+16); await page.mouse.down();
  await page.mouse.move(handle.x-220, handle.y-90, { steps: 8 }); await page.mouse.up();
  const resized = await sheet.boundingBox();
  assert.ok(resized.width < before.width-150 && resized.height < before.height-50);
  await sheet.locator('.window-resize-handle').focus();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
  const keyed = await sheet.boundingBox();
  assert.ok(Math.abs(keyed.width-resized.width-16) < 1 && Math.abs(keyed.height-resized.height-16) < 1);
  const title = await sheet.locator('.window-title').boundingBox(), start = await sheet.boundingBox();
  await page.mouse.move(title.x+10, title.y+5); await page.mouse.down();
  await page.mouse.move(title.x+50, title.y+35, { steps: 6 }); await page.mouse.up();
  const moved = await sheet.boundingBox(); assert.ok(moved.x > start.x+25 && moved.y > start.y+20);
  await assertState();
  console.log('PASS maximize/restore, free dragging, pointer resizing and keyboard resizing without recreating either iframe');

  const cdp = await context.newCDPSession(page);
  async function touchDrag(locator, dx, dy, cancel = false) {
    const box = await locator.boundingBox(), x = box.x+box.width/2, y = box.y+box.height/2;
    const point = (x,y) => ({x,y,id:1,radiusX:2,radiusY:2,force:1});
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[point(x,y)]});
    for (let i=1;i<=6;i++) await cdp.send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[point(x+dx*i/6,y+dy*i/6)]});
    await cdp.send('Input.dispatchTouchEvent', {type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
  }
  const touchBefore = await sheet.boundingBox();
  await touchDrag(sheet.locator('.window-resize-handle'),32,24);
  const touchAfter = await sheet.boundingBox();
  assert.ok(touchAfter.width >= touchBefore.width+28 && touchAfter.height >= touchBefore.height+20);
  const touchStart = await sheet.boundingBox();
  await touchDrag(sheet.locator('.window-title'),-24,-12);
  const touchMoved = await sheet.boundingBox();
  assert.ok(touchMoved.x < touchStart.x-15 && touchMoved.y < touchStart.y-6);
  await touchDrag(sheet.locator('.window-resize-handle'),8,8,true);
  assert.equal(await sheet.evaluate(node=>node.classList.contains('is-resizing')),false);
  await assertState();
  console.log('PASS native emulated touch dragging/resizing and pointer cancellation');

  await open('extra');
  await page.locator('.taskbar-item').filter({ hasText: 'Simulator ทดสอบ' }).click();
  await simulation.locator('.is-minimize').click();
  await page.locator('.taskbar-item').filter({ hasText: 'ใบเรียนรู้ทดสอบ' }).click();
  await sheet.locator('.window-split').click();
  assert.equal(await dialog.locator('[data-layout-partner]').count(), 2);
  await dialog.locator('[data-layout-partner="content-simulation-qa-layout-simulation"]').click();
  await experiment.locator('h1').click();
  await assertPair();
  await page.locator('.taskbar-item').filter({ hasText: 'งานอีกชิ้น' }).click();
  await page.locator('[data-tool-id="content-html-qa-layout-extra"] .is-close').click();
  await assertPair();
  console.log('PASS choosing a minimized partner among several windows; closing an unrelated window preserves the pair');

  await sheet.locator('.window-split').click();
  await dialog.locator('[data-layout-action="float"]').click();
  await sheet.locator('.is-maximize').click();
  await page.setViewportSize({width:390,height:844});
  await sheet.locator('.is-maximize').click();
  let fitted = await sheet.boundingBox();
  assert.ok(fitted.x >= 0 && fitted.x+fitted.width <= 391, 'Restoring after rotation fits the smaller screen');
  await page.setViewportSize({width:1360,height:1000});
  await sheet.locator('.window-resize-handle').focus();
  for(let i=0;i<5;i++) await page.keyboard.press('Shift+ArrowRight');
  assert.ok((await sheet.boundingBox()).width > 500);
  await sheet.locator('.is-minimize').click();
  await page.setViewportSize({width:390,height:844});
  await page.locator('.taskbar-item').filter({hasText:'ใบเรียนรู้ทดสอบ'}).click();
  fitted = await sheet.boundingBox();
  assert.ok(fitted.x >= 0 && fitted.x+fitted.width <= 391, 'A minimized, resized window fits when restored after rotation');
  await assertState();
  await sheet.locator('.window-split').click();
  await dialog.locator('[data-layout-partner="content-simulation-qa-layout-simulation"]').click();
  console.log('PASS rotate while maximized or minimized, then restore a resized window inside the screen');

  await mkdir(output, { recursive: true });
  for (const [width,height] of [[1024,768],[820,1180],[390,844]]) {
    await page.setViewportSize({width,height});
    await assertPair(width <= 700);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1));
    await page.screenshot({path:resolve(output,`split-${width}.png`)});
  }
  await sheet.locator('.window-split').tap();
  await dialog.locator('[data-layout-action="swap"]').tap();
  await assertPair(true);
  await simulation.locator('.is-minimize').tap();
  assert.equal(await sheet.getAttribute('data-window-snap'), null);
  await page.locator('.taskbar-item').filter({hasText:'Simulator ทดสอบ'}).tap();
  await assertState();
  await page.locator('.taskbar-item').filter({hasText:'ใบเรียนรู้ทดสอบ'}).tap();
  await sheet.locator('[data-window-language="en"]').tap();
  assert.equal(await sheet.locator('.window-split span').textContent(), 'Split view');
  await sheet.locator('.window-split').tap();
  await dialog.locator('[data-layout-action="choose"]').tap();
  await page.locator('.workspace-split-pending button').tap();
  assert.equal(await sheet.isVisible(), true);
  await assertState();
  console.log('PASS tablet landscape/portrait, narrow-screen stacking, touch controls, translated labels, minimizing and cancelling partner selection');
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
