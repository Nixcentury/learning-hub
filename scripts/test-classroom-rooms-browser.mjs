import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { reset, request, good } from './fixtures/classroom-emulator.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const prefix = '/Physic-subject/';
const rules = JSON.parse(await readFile(resolve(root, 'firebase/classroom-phase1.merged-draft.json'), 'utf8'));
await reset(rules);
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const auth = `
const listeners=new Set();
function make(uid){return uid?{status:'signed-in',isGuest:false,user:{uid,displayName:'Name '+uid,email:uid+'@example.test'}}:{status:'guest',isGuest:true,user:null};}
let session=make(localStorage.getItem('classroom-qa-user')); window.qaCurrentUid=session.user?.uid||null;
export const getAuthSession=()=>session;
export function subscribeAuth(fn){listeners.add(fn);fn(session);return ()=>listeners.delete(fn);}
window.qaSession=uid=>{window.qaCurrentUid=uid;uid?localStorage.setItem('classroom-qa-user',uid):localStorage.removeItem('classroom-qa-user');session=make(uid);listeners.forEach(fn=>fn(session));};
export async function signInWithGoogle(){window.qaSession('teacher');}
export async function continueAsGuest(){window.qaSession(null);}
export async function signOutFromHub(){window.qaSession(null);}
`;
// SDK transport shim only: actual app, roles, service and UI run against real
// RTDB emulator Rules. No mock access decisions, no production calls.
const database = `
const requests=[];window.qaRequests=requests;
export const getDatabase=()=>({});export const ref=(_,path)=>path;export const serverTimestamp=()=>({'.sv':'timestamp'});
async function call(method,path,value){
 const uid=window.qaCurrentUid;requests.push({method,path,uid});
 if(window.qaDenyRoomWrites&&path==='classroomV1'&&method==='PATCH')throw Object.assign(Error('denied'),{code:'PERMISSION_DENIED'});
 const response=await fetch('${prefix}__qa-db?path='+encodeURIComponent(path),{method,headers:{'Content-Type':'application/json','X-QA-UID':uid||''},body:value===undefined?undefined:JSON.stringify(value)});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'denied'),{code:'PERMISSION_DENIED'});return result;
}
const snap=value=>({val:()=>value,exists:()=>value!==null});
export async function get(path){return snap(await call('GET',path));}
export async function update(path,value){await call('PATCH',path,value);}
export async function set(path,value){await call('PUT',path,value);}
export async function remove(path){await call('DELETE',path);}
export function onValue(path,ok,error){let active=true,timer,previous;async function poll(){if(!active)return;try{const value=await call('GET',path);const next=JSON.stringify(value);if(active&&next!==previous){previous=next;ok(snap(value));}}catch(e){if(active)error(e);return;}if(active)timer=setTimeout(poll,150);}void poll();return ()=>{active=false;clearTimeout(timer);};}
`;
const presence = `export function setPresenceContext(){} export async function stopPresence(){} export function subscribePresence(fn){fn({connectionStatus:'OFFLINE',rows:[],counts:{active:0,online:0,idle:0,visible:0},error:''});return ()=>{};}`;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === prefix + '__qa-db') {
      const chunks = []; for await (const part of req) chunks.push(part);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
      const result = await request(req.headers['x-qa-uid'] || null, req.method, url.searchParams.get('path'), body);
      res.writeHead(result.status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result.value)); return;
    }
    if (!url.pathname.startsWith(prefix)) throw Error('Outside fixture base');
    const name = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
    let path = resolve(root, name); if (!path.startsWith(root + sep)) throw Error('Outside root');
    let data; try { data = await readFile(path); } catch { path = resolve(root, 'public', name); data = await readFile(path); }
    if (name === 'index.html') data = data.toString().replaceAll('%BASE_URL%', prefix);
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[extname(name)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(500); res.end(JSON.stringify({ error: 'Fixture request failed' })); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  async function client(uid, mobile = false) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1050 } });
    await context.addInitScript(uid => { if (!localStorage.getItem('qa-seeded')) { localStorage.setItem('classroom-qa-user', uid); localStorage.setItem('qa-seeded', 'yes'); } }, uid);
    await context.route('**/*', route => {
      const url = new URL(route.request().url()), name = url.pathname.split('/').at(-1);
      const replacements = { 'auth.js': auth, 'presence.js': presence, 'firebase-config.js': 'export const firebaseApp={};' };
      if (url.origin === origin && url.pathname.includes('/js/') && replacements[name]) return route.fulfill({ contentType: 'text/javascript', body: replacements[name] });
      if (url.hostname === 'www.gstatic.com' && name === 'firebase-database.js') return route.fulfill({ contentType: 'text/javascript', body: database });
      if (url.origin !== origin) return route.fulfill({ contentType: 'text/javascript', body: '' });
      return route.continue();
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + prefix + '#classroom');
    const frame = page.frameLocator('#hub-page-frame');
    await frame.locator('[data-rooms-workspace]').waitFor();
    return { page, frame, context };
  }
  const teacher = await client('teacher');
  await teacher.frame.locator('#room-name').fill('ฟิสิกส์ ม.5/1');
  await teacher.frame.locator('[data-create-room] button').click();
  await teacher.frame.locator('[data-room-feedback]').filter({ hasText: 'สร้างห้องเรียบร้อย' }).waitFor();
  const code = await teacher.frame.locator('.classroom-invite code').textContent();
  assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.equal(await teacher.frame.locator('[data-room-list] article').count(), 1);
  const roomId = (await good('teacher', 'GET', 'classroomV1/joinCodes/' + code)).roomId;
  console.log('PASS teacher creates a room, gets code; database confirms all three paths');

  const student = await client('student', true);
  assert.equal(await student.frame.locator('[data-create-room]').isVisible(), false);
  await student.frame.locator('#room-code').fill('ZZZZZZZZ');
  await student.frame.locator('[data-join-room] button').click();
  await student.frame.locator('[data-room-feedback]').filter({ hasText: 'ไม่พบรหัสนี้' }).waitFor();
  await student.frame.locator('#room-code').fill(code.toLowerCase());
  await student.frame.locator('[data-join-room] button').click();
  await student.frame.locator('[data-room-detail]').filter({ hasText: 'คุณเข้าร่วมห้องนี้แล้ว' }).waitFor();
  await teacher.frame.locator('.classroom-roster li').filter({ hasText: 'Name student' }).waitFor();
  assert.equal(await student.frame.locator('.classroom-roster').count(), 0);
  assert.equal(await student.page.evaluate(id => qaRequests.some(r => r.path === 'classroomV1/members/' + id), roomId), false);
  console.log('PASS student joins by code, teacher roster updates, student never requests roster');

  const before = await good('student', 'GET', 'classroomV1/members/' + roomId + '/student');
  await student.frame.locator('[data-room-action="back"]').click();
  await student.frame.locator('#room-code').fill(code);
  await student.frame.locator('[data-join-room] button').click();
  await student.frame.locator('[data-room-feedback]').filter({ hasText: 'เข้าร่วมห้องแล้ว' }).waitFor();
  assert.deepEqual(await good('student', 'GET', 'classroomV1/members/' + roomId + '/student'), before);
  assert.equal(Object.keys(await good('teacher', 'GET', 'classroomV1/members/' + roomId)).length, 1);
  await student.page.reload();
  await student.frame.locator('[data-room-list] button').waitFor();
  await student.frame.locator('[data-room-list] button').click();
  await student.frame.locator('[data-room-detail]').filter({ hasText: 'คุณเข้าร่วมห้องนี้แล้ว' }).waitFor();
  await student.page.locator('[data-section="chemistry"]').click();
  await student.page.locator('[data-section="classroom"]').click();
  await student.frame.locator('[data-room-list] button').waitFor();
  console.log('PASS repeated join preserves membership; refresh and tab navigation restore rooms');

  const output = resolve(root, 'qa-output'); await mkdir(output, { recursive: true });
  await teacher.frame.locator('.classroom-roster').scrollIntoViewIfNeeded();
  await teacher.page.screenshot({ path: resolve(output, 'classroom-phase1-teacher.png'), fullPage: true });
  const child = await student.page.locator('#hub-page-frame').elementHandle().then(handle => handle.contentFrame());
  assert.equal(await child.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await student.frame.locator('[data-room-list] button').click();
  await student.frame.locator('[data-room-detail]').filter({ hasText: 'คุณเข้าร่วมห้องนี้แล้ว' }).waitFor();
  await student.page.screenshot({ path: resolve(output, 'classroom-phase1-student-mobile.png'), fullPage: true });
  await student.page.evaluate(() => qaSession('student-b'));
  await student.frame.locator('[data-account-email]').filter({ hasText: 'student-b@example.test' }).waitFor();
  await student.frame.locator('[data-room-list-status]').filter({ hasText: 'ยังไม่มีห้อง' }).waitFor();
  assert.equal(await student.frame.locator('[data-room-list] article').count(), 0);
  assert.equal(await student.frame.locator('[data-room-detail]').isVisible(), false);
  console.log('PASS mobile fits screen; switching student accounts clears previous rooms');

  await teacher.page.evaluate(() => { window.qaDenyRoomWrites = true; });
  await teacher.frame.locator('[data-room-action="back"]').click();
  await teacher.frame.locator('#room-name').fill('Unconfirmed room');
  await teacher.frame.locator('[data-create-room] button').click();
  await teacher.frame.locator('[data-room-feedback].is-error').filter({ hasText: 'Firebase Rules' }).waitFor();
  assert.equal(await teacher.frame.locator('[data-room-list] article').count(), 1);
  await teacher.page.evaluate(() => { window.qaDenyRoomWrites = false; });
  await teacher.page.locator('#hub-view [data-language="en"]').click();
  await teacher.frame.getByRole('heading', { name: 'Create a classroom', exact: true }).waitFor();
  await teacher.frame.locator('[data-room-list] button').filter({ hasText: 'Open classroom' }).waitFor();
  console.log('PASS denied writes show actionable error without phantom room; language switches');

  await good('EMULATOR_ADMIN', 'DELETE', 'learningHub/teacherApprovals/teacher');
  await teacher.frame.locator('body[data-classroom-access="student"]').waitFor();
  assert.equal(await teacher.frame.locator('.classroom-roster').count(), 0);
  assert.equal(await teacher.frame.locator('[data-create-room]').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS live role revocation clears owner tools and roster; no browser errors');
} finally {
  await browser?.close(); await new Promise(done => server.close(done));
}
