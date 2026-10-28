import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { reset, good, emulatorOrigin, emulatorProject, mockToken } from './fixtures/classroom-emulator.mjs';
import { buildMonitorRules } from './build-classroom-monitor-rules.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { catalogFromRepository } from './build-route-catalog.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), prefix = '/learning-hub/', built = process.env.QA_BUILT === '1';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const rules = JSON.parse(await readFile(resolve(root, 'firebase/classroom-phase1.merged-draft.json'), 'utf8'));
rules.rules.classroomMonitorV1 = buildMonitorRules(); await reset(rules);
const roomId = 'r_' + 'a'.repeat(32), stamp = { '.sv': 'timestamp' };
await good('teacher', 'PATCH', 'classroomV1', createRoomUpdates('teacher', 'ฟิสิกส์ ม.5/1', { roomId, code: 'ABCD2345' }, stamp));
for (const uid of ['student','student-b']) await good(uid, 'PATCH', 'classroomV1', joinRoomUpdates(uid, roomId, 'ABCD2345', uid === 'student' ? 'นักเรียนทดลอง' : 'นักเรียนอีกคน', stamp));
const catalog = await catalogFromRepository();
const auth = `
export class GoogleAuthProvider{setCustomParameters(){}} export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};
let user=localStorage.getItem('monitor-qa-user'),callback;window.qaUid=user;
const value=()=>user?{uid:user,displayName:'Name '+user,email:user+'@example.test',photoURL:''}:null;
export function onAuthStateChanged(_,fn){callback=fn;queueMicrotask(()=>fn(value()));return ()=>{};}
window.qaSession=uid=>{user=uid;window.qaUid=uid;uid?localStorage.setItem('monitor-qa-user',uid):localStorage.removeItem('monitor-qa-user');callback?.(value());};
export async function signInWithPopup(){window.qaSession('teacher');}export async function signOut(){window.qaSession(null);}
`;
// Only the SDK transport and OAuth are replaced. Production bundle/UI/model and
// real emulator Rules execute unchanged. Transactions use REST ETag compare-and-set.
const database = `
export const getDatabase=()=>({});export const ref=(_,path)=>path;export const serverTimestamp=()=>({'.sv':'timestamp'});
window.qaDbRequests=[];window.qaDbFailures=[];const registrations=new Map(),connectionWatchers=new Set();let online=true;
const snapshot=value=>({val:()=>value,exists:()=>value!==null});
async function call(method,path,value,etag){window.qaDbRequests.push({method,path});if(!online)throw Object.assign(Error('offline'),{code:'monitor/offline'});
 const response=await fetch('${prefix}__qa-db?path='+encodeURIComponent(path),{method,headers:{'Content-Type':'application/json','X-QA-UID':window.qaUid||'',...(etag?{'If-Match':etag}:{})},body:value===undefined?undefined:JSON.stringify(value)});
 const result=await response.json();if(!response.ok&&response.status!==412){window.qaDbFailures.push({method,path,status:response.status,error:result.error});throw Object.assign(Error(result.error||'permission denied'),{code:'PERMISSION_DENIED'});}return {value:result,etag:response.headers.get('etag'),conflict:response.status===412};}
export const get=async path=>snapshot((await call('GET',path)).value);
export const set=async(path,value)=>{await call('PUT',path,value);};export const update=async(path,value)=>{await call('PATCH',path,value);};export const remove=async path=>{await call('DELETE',path);};
export async function runTransaction(path,fn){for(let i=0;i<8;i++){const prior=await call('GET',path),next=fn(prior.value);if(next===undefined)return {committed:false,snapshot:snapshot(prior.value)};const result=await call('PUT',path,next,prior.etag);if(!result.conflict)return {committed:true,snapshot:snapshot(result.value)};}throw Error('transaction retries');}
export function onValue(path,fn,error=()=>{}){
 if(path==='.info/serverTimeOffset'){queueMicrotask(()=>fn(snapshot(0)));return ()=>{};}
 if(path==='.info/connected'){const callback=()=>fn(snapshot(online));connectionWatchers.add(callback);queueMicrotask(callback);return ()=>connectionWatchers.delete(callback);}
 let active=true,timer,previous;async function poll(){if(!active)return;try{const result=await call('GET',path),next=JSON.stringify(result.value);if(active&&next!==previous){previous=next;fn(snapshot(result.value));}}catch(e){if(e.code!=='monitor/offline'){if(active)error(e);return;}}if(active)timer=setTimeout(poll,180);}void poll();return ()=>{active=false;clearTimeout(timer);};}
export function onDisconnect(path){return {remove:async()=>registrations.set(path,null),update:async value=>registrations.set(path,value),cancel:async()=>registrations.delete(path)};}
window.qaNetwork=async value=>{if(!value)for(const [path,data]of registrations)await call(data===null?'DELETE':'PATCH',path,data).catch(()=>{});online=value;connectionWatchers.forEach(fn=>fn());};
`;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === prefix + '__qa-db') {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const uid = req.headers['x-qa-uid'], path = url.searchParams.get('path');
      const headers = { 'Content-Type': 'application/json', ...(req.method === 'GET' ? { 'X-Firebase-ETag': 'true' } : {}), ...(req.headers['if-match'] ? { 'If-Match': req.headers['if-match'] } : {}) };
      const response = await fetch(emulatorOrigin + '/' + path + '.json?ns=' + emulatorProject + (uid ? '&auth=' + encodeURIComponent(mockToken(uid)) : ''), { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
      res.writeHead(response.status, { 'Content-Type': 'application/json', ...(response.headers.get('etag') ? { etag: response.headers.get('etag') } : {}) }); res.end(await response.text()); return;
    }
    if (!url.pathname.startsWith(prefix)) throw Error('Outside base');
    const name = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html', directory = built ? resolve(root, 'dist') : root;
    if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
    let data;
    if (name === 'route-catalog.v1.json' && !built) data = JSON.stringify(catalog);
    else { try { data = await readFile(resolve(directory, name)); } catch { if (built) throw Error('Missing built resource'); data = await readFile(resolve(root, 'public', name)); } }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix);
    res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' })[extname(name)] || 'application/octet-stream'); res.end(data);
  } catch (failure) { res.writeHead(500); res.end(JSON.stringify({ error: failure.message })); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`, errors = [];
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  async function client(uid, mobile = false) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1360, height: 1000 }, hasTouch: mobile });
    await context.addInitScript(uid => {
      if (!localStorage.getItem('monitor-qa-user')) localStorage.setItem('monitor-qa-user', uid);
      // Deterministic tab visibility for desktop integration; real iPad behavior is a device check.
      let visible = true; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visible ? 'visible' : 'hidden' });
      window.qaVisible = value => { visible = value; document.dispatchEvent(new Event('visibilitychange')); };
    }, uid);
    await context.route('**/*', route => {
      const url = new URL(route.request().url()), name = url.pathname.split('/').at(-1);
      if (url.origin === origin) return route.continue();
      if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType:'text/javascript', body: name === 'firebase-app.js' ? 'export const getApps=()=>[];export const initializeApp=()=>({});' : name === 'firebase-auth.js' ? auth : name === 'firebase-database.js' ? database : '' });
      return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); page.setDefaultTimeout(18000);
    await page.goto(origin + prefix + '#classroom'); const frame = page.frameLocator('#hub-page-frame');
    await frame.locator('[data-room-list] button').waitFor(); await frame.locator('[data-room-list] button').first().click();
    await frame.locator('[data-classroom-monitor]').waitFor(); return { context, page, frame };
  }
  const teacher = await client('teacher'), student = await client('student', true);
  const people = teacher.frame.locator('[data-monitor-people]');
  await student.page.evaluate(() => { qaVisible(false); location.hash = '#chemistry/bank'; });
  assert.equal(await student.page.locator('.monitor-banner').isVisible(), false);
  assert.equal(await good('EMULATOR_ADMIN','GET','classroomMonitorV1/connections'), null);
  await student.page.evaluate(() => qaVisible(true));
  console.log('PASS unlocked is ordinary browsing: no lesson telemetry or reminders');
  await teacher.frame.locator('[data-monitor-lock]').click();
  await teacher.frame.locator('[data-monitor-badge]').filter({ hasText: 'เปิดติดตาม' }).waitFor();
  await student.page.locator('[data-monitor-open]').click();
  await student.page.locator('[data-monitor-action="join"]').click();
  await student.page.locator('.monitor-banner-text').filter({ hasText: 'เปิดติดตาม' }).waitFor();
  await student.page.locator('[data-monitor-close]').click();
  const row = people.locator('[data-monitor-uid="student"]');
  await row.locator('.monitor-person-status').filter({ hasText: 'หน้าเว็บแสดงอยู่' }).waitFor();
  await student.page.evaluate(() => { location.hash = '#physics/bank'; });
  await row.locator('.monitor-person-location').filter({ hasText: /ฟิสิกส์/ }).waitFor();
  assert.equal(await student.page.locator('.monitor-banner').isVisible(), true);
  console.log('PASS locked lesson shows roster and live location across subject navigation');
  // The same logged-in student can have two Hub tabs without a false departure.
  const second = await student.context.newPage(); second.on('pageerror', error => errors.push(error.message)); second.setDefaultTimeout(18000);
  await second.goto(origin + prefix + '#physics/bank');
  await second.locator('.monitor-banner-text').filter({ hasText: 'เปิดติดตาม' }).waitFor();
  await row.locator('.monitor-person-time').filter({ hasText: '2 หน้าต่าง' }).waitFor();
  await student.page.evaluate(() => qaVisible(false));
  await new Promise(done => setTimeout(done, 16_000));
  assert.equal(await row.locator('.monitor-person-message').textContent(), '');
  await second.evaluate(() => qaVisible(false));
  await row.locator('.monitor-person-message').filter({ hasText: 'มีเหตุเตือน' }).waitFor({ timeout: 23000 });
  await second.evaluate(() => qaVisible(true));
  await row.locator('.monitor-person-message').filter({ hasText: 'กลับมาแล้ว' }).waitFor();
  await second.locator('[data-monitor-open]').click(); await second.locator('[data-monitor-action="ack-incident"]').click();
  await row.locator('.monitor-person-message').filter({ hasText: 'รับทราบเหตุเตือนแล้ว' }).waitFor();
  await second.locator('[data-monitor-close]').click();
  console.log('PASS multi-tab aggregation, grace timer, return and explicit acknowledgement');
  await student.page.evaluate(() => qaVisible(true));
  await row.locator('[data-monitor-row-action="compose"]').click();
  await teacher.page.locator('#monitor-message').fill('<b>ลองทำข้อ 2 ต่อครับ</b>');
  await teacher.page.locator('[data-monitor-compose] button').click();
  await teacher.page.locator('.monitor-feedback').filter({ hasText: 'ส่งข้อความแล้ว' }).waitFor();
  await teacher.page.locator('[data-monitor-close]').click();
  await student.page.locator('[data-monitor-open]').click();
  await student.page.locator('.monitor-message p').filter({ hasText: '<b>ลองทำข้อ 2 ต่อครับ</b>' }).waitFor();
  assert.equal(await student.page.locator('.monitor-message b').count(), 0);
  await row.locator('.monitor-person-message').filter({ hasText: 'แสดงบนหน้าเด็กแล้ว' }).waitFor();
  await student.page.locator('[data-monitor-reply] input').fill('ขอช่วยอธิบายสูตรครับ');
  await student.page.locator('[data-monitor-reply] button').click();
  await row.locator('.monitor-person-message').filter({ hasText: 'ขอช่วยอธิบายสูตรครับ' }).waitFor();
  await student.page.locator('[data-monitor-action="ack"]').click();
  await row.locator('.monitor-person-message').filter({ hasText: 'ข้อความ: รับทราบแล้ว' }).waitFor();
  await student.page.locator('[data-monitor-close]').click();
  console.log('PASS text is escaped, delivery differs from ack, and student replies reach teacher');
  await teacher.page.evaluate(() => qaNetwork(false));
  await teacher.frame.locator('[data-monitor-feedback]').filter({ hasText: 'การเชื่อมต่อขาด' }).waitFor();
  assert.equal(await row.locator('.monitor-person-status').textContent(), 'หน้าเว็บแสดงอยู่');
  await teacher.page.evaluate(() => qaNetwork(true));
  await teacher.frame.locator('[data-monitor-lock]:not([disabled])').waitFor();
  const menuFrame = await student.page.locator('#hub-page-frame').elementHandle().then(handle => handle.contentFrame());
  await menuFrame.evaluate(() => parent.postMessage({ type: 'learning-hub-open-tool', toolId: 'test-c1-quiz' }, location.origin));
  const quiz = student.page.frameLocator('.workspace-tool-frame');
  await quiz.locator('.quiz-option').first().click();
  const quizFrame = await student.page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  const answers = await quizFrame.evaluate(() => LearningHubQuiz.getState().answers);
  await student.page.locator('[data-monitor-open]').click(); await student.page.locator('[data-monitor-close]').click();
  assert.deepEqual(await quizFrame.evaluate(() => LearningHubQuiz.getState().answers), answers);
  console.log('PASS teacher disconnect pauses status; monitoring messages preserve an authenticated quiz answer');
  const output = resolve(root, 'qa-output'); await mkdir(output, { recursive: true });
  await teacher.frame.locator('[data-classroom-monitor]').scrollIntoViewIfNeeded();
  await teacher.page.screenshot({ path: resolve(output, 'classroom-monitor-teacher.png'), fullPage: true });
  await student.page.locator('[data-monitor-open]').click(); await student.page.screenshot({ path: resolve(output, 'classroom-monitor-student-mobile.png'), fullPage: true });
  assert.ok(await student.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await student.page.locator('[data-monitor-close]').click();
  await teacher.page.locator('#hub-view [data-language="en"]').click();
  await teacher.frame.locator('[data-monitor-lock]').filter({ hasText: 'Unlock' }).waitFor();
  await teacher.page.locator('#hub-view [data-language="th"]').click();
  await teacher.frame.locator('[data-monitor-lock]').click();
  await teacher.frame.locator('[data-monitor-badge]').filter({ hasText: 'ปลดล็อก' }).waitFor();
  await student.page.locator('.monitor-banner').waitFor({ state: 'hidden' });
  await second.locator('.monitor-banner').waitFor({ state: 'hidden' });
  await student.page.evaluate(() => { qaVisible(false); location.hash = '#chemistry/bank'; });
  assert.equal(await good('EMULATOR_ADMIN','GET',`classroomMonitorV1/notices/${roomId}`), null);
  console.log('PASS unlock stops monitoring and clears lesson messages; language/mobile layout work');
  await teacher.frame.locator('[data-monitor-lock]').click();
  await student.page.evaluate(() => qaVisible(true)); await student.page.locator('[data-monitor-open]').click(); await student.page.locator('[data-monitor-action="join"]').click(); await student.page.locator('[data-monitor-close]').click();
  await student.page.evaluate(() => qaSession('student-b'));
  await student.page.locator('.monitor-banner-text').filter({ hasText: 'มีคาบติดตามเปิดอยู่' }).waitFor();
  await student.page.locator('[data-monitor-open]').click(); assert.equal(await student.page.locator('.monitor-message').filter({ hasText: 'ลองทำข้อ 2' }).count(), 0); await student.page.locator('[data-monitor-close]').click();
  await good('EMULATOR_ADMIN', 'PATCH', `classroomMonitorV1/sessions/${roomId}`, { endsAt: Date.now() - 100 });
  await teacher.frame.locator('[data-monitor-badge]').filter({ hasText: 'ปลดล็อก' }).waitFor();
  await student.page.locator('.monitor-banner').waitFor({ state: 'hidden' });
  console.log('PASS account switch clears old messages; expiry returns to ordinary browsing');
  assert.deepEqual(errors, []);
} catch (failure) {
  const output = resolve(root, 'qa-output'); await mkdir(output, { recursive: true });
  for (const [index, context] of (browser?.contexts() || []).entries()) for (const [pageIndex, page] of context.pages().entries()) {
    console.error('BROWSER DEBUG', index, pageIndex, await page.evaluate(() => ({ text: document.querySelector('.monitor-dialog')?.textContent, failures: window.qaDbFailures?.slice(-10), requests: window.qaDbRequests?.slice(-20) })).catch(() => ({})));
    await page.screenshot({ path: resolve(output, `classroom-monitor-failure-${index}-${pageIndex}.png`), fullPage: true }).catch(() => {});
  }
  console.error('INCIDENTS', await good('EMULATOR_ADMIN','GET',`classroomMonitorV1/incidents/${roomId}`));
  console.error('PAGE ERRORS', errors); throw failure;
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
