import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const prefix = '/learning-hub/';
const built = process.env.QA_BUILT === '1';
const output = resolve(root, 'qa-output');
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
  browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1360, height: 900 }, hasTouch: true });
  const requests = [], errors = [];
  let heldReply, live = false, failed = false;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin) return route.continue();
    if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType:'text/javascript', body: stubs[url.pathname.split('/').at(-1)] || '' });
    if (url.hostname === 'student-work-ai-checker.micksattawatbutklo.workers.dev') {
      if (live) return route.continue();
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status:204,
        headers:{ 'access-control-allow-origin':'*', 'access-control-allow-methods':'POST, OPTIONS', 'access-control-allow-headers':'Content-Type' } });
      const payload = route.request().postDataJSON(); requests.push(payload);
      const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (payload.userMessage.includes('slow')) await new Promise(done => { heldReply = done; });
      if (payload.userMessage.includes('fail') && !failed) { failed = true; return route.fulfill({ status:429, headers, body:'{"error":"busy"}' }); }
      return route.fulfill({ headers, body:JSON.stringify({ success:true, mode:'text_chat', reply:'คำตอบทดสอบ <img src=x onerror="alert(1)">\nอธิบายทีละขั้น' }) }).catch(() => {});
    }
    return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  const pet = page.locator('.companion-pet'), trigger = page.locator('.companion-trigger');
  const panel = page.locator('.companion-chat'), input = panel.locator('textarea');
  await page.goto(origin + prefix);
  assert.equal(await page.locator('.hub-companion').isVisible(), false);
  await page.locator('#guest-button').click();
  await trigger.waitFor({ state:'visible' });
  await page.locator('[data-owl-pose="idle"]').evaluate(image => image.decode());
  await trigger.click(); await panel.waitFor({ state:'visible' });
  assert.equal(await panel.locator('textarea').isEnabled(), true);
  await input.fill('คำถามแรก'); await panel.locator('.companion-send').click();
  await panel.locator('.companion-message.is-assistant p').filter({ hasText:'คำตอบทดสอบ' }).waitFor();
  assert.equal(await panel.locator('.companion-message img').count(), 0, 'Model output is text, not executable HTML');
  assert.equal(requests[0].mode, 'text_chat');
  assert.equal(requests[0].conversation.length, 0);
  assert.equal(Object.keys(requests[0]).sort().join(','), 'conversation,mode,userMessage');
  await input.fill('ถามต่อ'); await input.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.companion-message.is-assistant').length === 2 && document.querySelector('.companion-form').getAttribute('aria-busy') === 'false');
  assert.equal(requests[1].conversation.length, 2);
  console.log('PASS real Hub integration, image asset, verified text_chat contract, conversation history and inert model output');

  await page.locator('#hub-view [data-language="en"]').click();
  assert.equal(await page.locator('#companion-title').textContent(), 'Study Owl');
  assert.equal(await panel.locator('.companion-message.is-user').count(), 2, 'Language switch preserves conversation');
  await panel.locator('.companion-close').click();
  let box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(800, 420, { steps:12 }); await page.mouse.up();
  assert.equal(await panel.isVisible(), false, 'Dragging never opens chat');
  const moved = await pet.boundingBox(); assert.ok(moved.x < box.x - 100);
  await page.locator('.companion-hide').click();
  assert.equal(await pet.isVisible(), false);
  await page.locator('.companion-recall').click();
  assert.equal(await pet.isVisible(), true);
  const restored = await pet.boundingBox(); assert.ok(Math.abs(restored.x - moved.x) < 1);
  await trigger.press('Enter'); await panel.waitFor({ state:'visible' });
  const panelBefore = await panel.boundingBox();
  await panel.locator('.companion-grip').press('ArrowLeft');
  assert.ok((await panel.boundingBox()).x < panelBefore.x, 'Chat panel can move separately');
  console.log('PASS shared TH/EN, drag vs click, hide/recall, remembered pet position and keyboard panel movement');

  await input.fill('fail'); await input.press('Enter');
  await panel.locator('.is-error button').waitFor();
  await panel.locator('.is-error button').click();
  await page.waitForFunction(() => !document.querySelector('.companion-message.is-error') && document.querySelector('.companion-form').getAttribute('aria-busy') === 'false');
  await input.fill('slow'); await input.press('Enter');
  await panel.locator('.companion-stop').waitFor({ state:'visible' });
  await panel.locator('.companion-clear').click();
  heldReply?.();
  assert.equal(await panel.locator('.companion-message').count(), 0);
  await input.fill('บัญชีเก่า'); await input.press('Enter');
  await page.waitForFunction(() => document.querySelector('.companion-form').getAttribute('aria-busy') === 'false');
  await page.evaluate(() => globalThis.__companionTestAuth({ uid:'qa-another-user', displayName:'QA' }));
  assert.equal(await panel.locator('.companion-message').count(), 0, 'An account switch clears conversation');
  assert.equal(await panel.isVisible(), false);
  console.log('PASS rate-limit retry, cancellation/new conversation and account isolation');

  await trigger.press('Enter');
  await page.setViewportSize({ width:390, height:844 });
  await page.locator('.companion-reset').click();
  const portrait = await panel.boundingBox();
  assert.ok(portrait.x >= 0 && portrait.x + portrait.width <= 390 && portrait.y + portrait.height <= 844);
  await page.setViewportSize({ width:390, height:330 });
  await page.waitForFunction(() => {
    const box = document.querySelector('.companion-chat').getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  });
  const keyboard = await panel.boundingBox();
  assert.ok(keyboard.y >= 0 && keyboard.y + keyboard.height <= 330);
  assert.equal(await panel.locator('.companion-send').isVisible(), true);
  await page.setViewportSize({ width:1024, height:768 });
  await panel.locator('.companion-reset').click();
  await mkdir(output, { recursive:true });
  await page.screenshot({ path:resolve(output, 'companion-tablet.png') });
  await page.setViewportSize({ width:390, height:844 });
  await page.screenshot({ path:resolve(output, 'companion-mobile.png') });
  await page.emulateMedia({ media:'print' });
  assert.equal(await page.locator('.hub-companion').isVisible(), false);
  await page.emulateMedia({ media:'screen' });
  assert.deepEqual(errors, []);
  console.log('PASS tablet/mobile/keyboard-height layout, controls, print exclusion and no uncaught browser errors');

  if (process.env.QA_COMPANION_LIVE === '1') {
    await page.locator('#hub-view [data-language="th"]').click();
    await panel.locator('.companion-clear').click();
    live = true;
    await input.fill('ทักทายนักเรียนเป็นภาษาไทยสั้น ๆ หนึ่งประโยค'); await input.press('Enter');
    await page.waitForFunction(() => document.querySelector('.companion-message.is-assistant p')?.textContent.length > 10 && document.querySelector('.companion-form').getAttribute('aria-busy') === 'false', undefined, { timeout:60000 });
    assert.equal(await panel.locator('.is-error').count(), 0);
    console.log('PASS one real AI reply through the browser and existing Worker, with no student account/database writes');
    await page.screenshot({ path:resolve(output, 'companion-live-reply.png') });
  }
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
