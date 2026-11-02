import {mergeClassroomAssistRules} from './build-classroom-assist-rules.mjs';
import { mergeRoomTeacherRules } from './build-classroom-room-teacher-rules.mjs';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { reset, good, emulatorOrigin, emulatorProject, mockToken } from './fixtures/classroom-emulator.mjs';
import { mergeRosterRules } from './build-classroom-roster-rules.mjs';
import { buildLinksRules } from './build-classroom-links-rules.mjs';
import { buildMonitorRules } from './build-classroom-monitor-rules.mjs';
import { buildSubmissionRules } from './build-classroom-submission-rules.mjs';
import { buildAssignmentRules } from './build-classroom-assignment-rules.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { catalogFromRepository } from './build-route-catalog.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), prefix = '/learning-hub/', built = process.env.QA_BUILT === '1';
const qaRequire=createRequire(process.env.PLAYWRIGHT_MODULE ? resolve(process.env.PLAYWRIGHT_MODULE,'package.json') : import.meta.url);
const { chromium } = qaRequire('playwright');
const pdfLibraries=new Map([['html2canvas.min.js',await readFile(qaRequire.resolve('html2canvas/dist/html2canvas.min.js'),'utf8')],['jspdf.umd.min.js',await readFile(qaRequire.resolve('jspdf/dist/jspdf.umd.min.js'),'utf8')]]);
const rules = JSON.parse(await readFile(resolve(root, 'firebase/classroom-phase1.merged-draft.json'), 'utf8'));
rules.rules.classroomLinksV1 = buildLinksRules();
rules.rules.classroomMonitorV1 = buildMonitorRules();
rules.rules.classroomAssignmentsV1 = buildAssignmentRules();
rules.rules.classroomSubmissionsV1 = buildSubmissionRules(); await reset(mergeClassroomAssistRules(mergeRoomTeacherRules(mergeRosterRules(rules))));
const roomId = 'r_' + 'a'.repeat(32), stamp = { '.sv': 'timestamp' };
await good('teacher', 'PATCH', 'classroomV1', createRoomUpdates('teacher', 'ฟิสิกส์ ม.5/1', { roomId, code: 'ABCD2345' }, stamp));
for (const uid of ['student','student-b']) await good(uid, 'PATCH', 'classroomV1', joinRoomUpdates(uid, roomId, 'ABCD2345', uid === 'student' ? 'นักเรียนทดลอง' : 'นักเรียนอีกคน', stamp));
const catalog = await catalogFromRepository();
// A QA-only placement of the repository's two-question template makes exactly
// 50% reachable. Production navigation, freezing, grading and Rules stay intact.
const qaLocation = catalog.contents.find(content => content.source.endsWith('equilibrium/4-1-equilibrium-quiz.html')).placements[0];
const reviewBank = qaLocation.topicId;
// A small owned reading keeps this integration deterministic and independent of
// the public bank service. Production readers and homework bridges run unchanged.
catalog.routes.unshift({hash:'#content/qa-homework-review',aliases:[],subjectId:'physics',chapterId:'bank',topicId:reviewBank,
  bankKey:reviewBank,toolKey:'review',kind:'content',status:'ready',contentId:'qa-homework-review',parentHash:'#physics/bank/'+reviewBank});
catalog.contents.push({id:'qa-homework-review',toolKind:'html',source:'content/qa-homework-review.html'});
catalog.contents.push({ id:'qa-prerequisite-quiz',toolKind:'quiz',source:'content/templates/quiz-template.html',titleTh:'ทดสอบเงื่อนไข 2 ข้อ',titleEn:'Two-question prerequisite QA',canonicalHash:'#content/qa-prerequisite-quiz',placements:[qaLocation] });
catalog.routes.push({ hash:'#content/qa-prerequisite-quiz',aliases:[],kind:'content',status:'ready',contentId:'qa-prerequisite-quiz',...qaLocation,titleTh:'ทดสอบเงื่อนไข 2 ข้อ',titleEn:'Two-question prerequisite QA' });
const auth = `
export class GoogleAuthProvider{setCustomParameters(){}} export const browserLocalPersistence={};export const getAuth=()=>({});export const setPersistence=async()=>{};
let user=localStorage.getItem('monitor-qa-user'),callback;window.qaUid=user;
const value=()=>user?{uid:user,displayName:'Name '+user,email:user+'@example.test',photoURL:'',emailVerified:true}:null;
export function onAuthStateChanged(_,fn){callback=fn;queueMicrotask(()=>fn(value()));return ()=>{};}
window.qaSession=uid=>{user=uid;window.qaUid=uid;uid?localStorage.setItem('monitor-qa-user',uid):localStorage.removeItem('monitor-qa-user');callback?.(value());};
export async function signInWithPopup(){window.qaSession('teacher');}export async function signOut(){window.qaSession(null);}
`;
// Only the SDK transport and OAuth are replaced. Production bundle/UI/model and
// real emulator Rules execute unchanged. Transactions use REST ETag compare-and-set.
const database = `
export const getDatabase=()=>({});export const ref=(_,path)=>path;export const serverTimestamp=()=>({'.sv':'timestamp'});
export const orderByChild=field=>({field});export const equalTo=value=>({value});
export const query=(path,field,value)=>path+'?orderBy='+encodeURIComponent(JSON.stringify(field.field))+'&equalTo='+encodeURIComponent(JSON.stringify(value.value));
window.qaDbRequests=[];window.qaDbFailures=[];window.qaDbSnapshots=Object.create(null);const registrations=new Map(),connectionWatchers=new Set();let online=true;
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
 let active=true,timer,previous;async function poll(){if(!active)return;try{const result=await call('GET',path),next=JSON.stringify(result.value);if(active&&next!==previous){previous=next;fn(snapshot(result.value));window.qaDbSnapshots[path]=result.value;}}catch(e){if(e.code!=='monitor/offline'){if(active)error(e);return;}}if(active)timer=setTimeout(poll,180);}void poll();return ()=>{active=false;clearTimeout(timer);};}
export function onDisconnect(path){return {remove:async()=>registrations.set(path,null),update:async value=>registrations.set(path,value),cancel:async()=>registrations.delete(path)};}
window.qaNetwork=async value=>{if(!value)for(const [path,data]of registrations)await call(data===null?'DELETE':'PATCH',path,data).catch(()=>{});online=value;connectionWatchers.forEach(fn=>fn());};
`;
const googleRequests = [];
let googleEmail = 'teacher@school.example', googleListVersion = 0;
const googleIdentity = `window.google={accounts:{oauth2:{initTokenClient(config){window.qaGoogleConfig={client_id:config.client_id,scope:config.scope,include_granted_scopes:config.include_granted_scopes};return{requestAccessToken(){queueMicrotask(()=>window.qaGoogleMode==='closed'?config.error_callback({type:'popup_closed'}):config.callback({access_token:'mock-classroom-token-never-store',expires_in:3600,scope:config.scope}));}};}}}};`;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === prefix + '__qa-db') {
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const uid = req.headers['x-qa-uid'], path = url.searchParams.get('path');
      const headers = { 'Content-Type': 'application/json', ...(req.method === 'GET' && !path.includes('?') ? { 'X-Firebase-ETag': 'true' } : {}), ...(req.headers['if-match'] ? { 'If-Match': req.headers['if-match'] } : {}) };
      const [dbPath, dbQuery] = path.split('?');
      const response = await fetch(emulatorOrigin + '/' + dbPath + '.json?ns=' + emulatorProject + (uid ? '&auth=' + encodeURIComponent(mockToken(uid)) : '') + (dbQuery ? '&' + dbQuery : ''), { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
      res.writeHead(response.status, { 'Content-Type': 'application/json', ...(response.headers.get('etag') ? { etag: response.headers.get('etag') } : {}) }); res.end(await response.text()); return;
    }
    if (!url.pathname.startsWith(prefix)) throw Error('Outside base');
    const name = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html', directory = built ? resolve(root, 'dist') : root;
    if (!resolve(directory, name).startsWith(directory.replace(/[\\/]$/, '') + sep)) throw Error('Outside root');
    let data;
    if (name === 'route-catalog.v1.json') data = JSON.stringify(catalog);
    else if (name === 'content/qa-homework-review.html') data = `<main data-topic-review-document data-review-quiz-bank="${reviewBank}"><section data-review-exam-question="1"><h2>ทวนข้อ 1 · Review question 1</h2><p>แยกแรงและพิจารณาแรงลัพธ์ / Identify forces and their resultant.</p></section></main>`;
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
  async function client(uid, mobile = false, openRoom = true) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1360, height: 1000 }, hasTouch: mobile });
    await context.addInitScript(uid => {
      if (!localStorage.getItem('monitor-qa-user')) localStorage.setItem('monitor-qa-user', uid);
      // Deterministic tab visibility for desktop integration; real iPad behavior is a device check.
      let visible = true; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visible ? 'visible' : 'hidden' });
      window.qaVisible = value => { visible = value; document.dispatchEvent(new Event('visibilitychange')); };
      window.qaGoogleContexts=[];window.addEventListener('message',event=>{if(event.data?.type==='learning-hub-context')window.qaGoogleContexts.push(JSON.stringify(event.data));});
    }, uid);
    await context.route('**/*', route => {
      const url = new URL(route.request().url()), name = url.pathname.split('/').at(-1);
      if (url.origin === origin) return route.continue();
      if (url.hostname === 'script.google.com' && url.searchParams.get('action') === 'catalog') return route.fulfill({
        headers:{'access-control-allow-origin':'*'},json:{ok:true,data:{schemaVersion:1,subjectId:url.searchParams.get('subject'),sets:[{
          bankKey:reviewBank,legacyId:'qa-review-source',title:'สมดุล(Equilibrium)',path:['Physics','Hub','สมดุล(Equilibrium)','สมดุล(Equilibrium)'],questionCount:13,
        }]}},
      });
      if (['accounts.google.com','openidconnect.googleapis.com','classroom.googleapis.com'].includes(url.hostname)) {
        const headers={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization','access-control-allow-methods':'GET, OPTIONS'};
        if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers});
        googleRequests.push({uid,url:url.href,method:route.request().method()});
        if(url.hostname==='accounts.google.com'&&url.pathname==='/gsi/client')return route.fulfill({contentType:'text/javascript',body:googleIdentity});
        if(url.hostname==='openidconnect.googleapis.com'&&url.pathname==='/v1/userinfo')return route.fulfill({headers,json:{sub:'school-teacher-id',email:googleEmail,email_verified:true}});
        if(url.hostname==='classroom.googleapis.com'&&url.pathname==='/v1/courses') {
          assert.equal(route.request().method(),'GET');assert.equal(url.searchParams.get('teacherId'),'me');assert.equal(url.searchParams.get('courseStates'),'ACTIVE');
          assert.equal(route.request().headers().authorization,'Bearer mock-classroom-token-never-store');
          const page=url.searchParams.get('pageToken');if(!page)googleListVersion++;
          return route.fulfill({headers,json:page?{courses:[{id:'456',name:'TEST #2 · load '+googleListVersion,section:'ห้อง 2',courseState:'ACTIVE',alternateLink:'https://classroom.google.com/c/test2'}]}:{courses:[{id:'123',name:'TEST #1',section:'ห้อง 1',courseState:'ACTIVE',alternateLink:'https://classroom.google.com/c/test1'}],nextPageToken:'page2'}});
        }
      }
      if(url.hostname==='cdn.jsdelivr.net' && pdfLibraries.has(name))return route.fulfill({contentType:'text/javascript',body:pdfLibraries.get(name)});
      if (url.hostname === 'www.gstatic.com') return route.fulfill({ contentType:'text/javascript', body: name === 'firebase-app.js' ? 'export const getApps=()=>[];export const initializeApp=()=>({});' : name === 'firebase-auth.js' ? auth : name === 'firebase-database.js' ? database : '' });
      return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); page.setDefaultTimeout(18000);
    await page.goto(origin + prefix + '#classroom'); const frame = page.frameLocator('#hub-page-frame');
    if (!openRoom) { await frame.locator('[data-rooms-workspace]').waitFor(); return { context, page, frame }; }
    await frame.locator('[data-room-list] button').waitFor(); await frame.locator('[data-room-list] button').first().click();
    // Narrow layouts keep the lesson panel collapsed until requested.
    const panel = frame.locator('[data-room-monitor-panel]');
    if (await panel.count() && !await panel.evaluate(node => node.open)) await panel.locator('summary').click();
    await frame.locator('[data-classroom-monitor]').waitFor(); return { context, page, frame };
  }
  const teacher = await client('teacher'), student = await client('student', true);
  // Direct Google connection: actual parent/dialog/provider/iframe, mock Google only.
  assert.equal(googleRequests.length,0,'Google must not load or prompt until a teacher explicitly connects');
  assert.equal(await student.frame.locator('[data-google-classroom-panel]').isVisible(),false);
  await student.frame.locator('body').evaluate(()=>parent.postMessage({type:'learning-hub-google-classroom-action',uid:'student',action:'open'},location.origin));
  assert.equal(await student.page.locator('[data-google-classroom-dialog]').isVisible(),false);
  await teacher.frame.locator('[data-google-connect]').click();
  await teacher.page.locator('[data-google-classroom-dialog][open]').waitFor();
  await teacher.page.locator('[data-google-client-id]').fill('123456789012-ownedwebclient123.apps.googleusercontent.com');
  await teacher.page.locator('[data-google-prepare]').click();
  await teacher.page.locator('[data-google-authorize]:not([disabled])').waitFor();
  await teacher.page.locator('[data-google-authorize]').click();
  await teacher.frame.locator('[data-google-account]').filter({hasText:'teacher@school.example'}).waitFor();
  await teacher.frame.locator('[data-google-course-id="456"]').waitFor();
  assert.equal(await teacher.page.evaluate(()=>qaUid),'teacher','Connecting a school account must not switch Firebase/Hub identity');
  const googleConfig=await teacher.page.evaluate(()=>qaGoogleConfig);
  assert.deepEqual(googleConfig.scope.split(' ').sort(),['openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/classroom.courses.readonly'].sort());
  assert.equal(googleConfig.include_granted_scopes,false);
  await teacher.page.locator('[data-google-dialog-done]').click();
  assert.equal(await teacher.frame.locator('[data-google-course-id]').count(),2);
  assert.equal(await teacher.page.evaluate(()=>Object.keys(localStorage).map(key=>localStorage.getItem(key)).join('').includes('mock-classroom-token-never-store')),false);
  assert.equal(await teacher.frame.locator('body').evaluate(()=>window.qaGoogleContexts.some(message=>message.includes('mock-classroom-token-never-store'))),false);
  const googleOutput=resolve(root,'qa-output');await mkdir(googleOutput,{recursive:true});
  await teacher.page.screenshot({path:resolve(googleOutput,'classroom-monitor-google-connected.png'),fullPage:true});
  const reloadVersion=googleListVersion+1;await teacher.frame.locator('[data-google-reload]').click();
  await teacher.frame.locator('[data-google-course-id="456"]').filter({hasText:'load '+reloadVersion}).waitFor();
  assert.equal(await teacher.frame.locator('[data-google-course-id]').count(),2);
  await teacher.page.evaluate(()=>{window.qaGoogleMode='closed';});
  await teacher.frame.locator('[data-google-connect]').click();await teacher.page.locator('[data-google-authorize]').click();
  await teacher.page.locator('[data-google-dialog-feedback]').filter({hasText:'ปิดหน้าต่าง Google'}).waitFor();
  await teacher.frame.locator('[data-google-course-id]').first().waitFor({state:'hidden'});
  assert.equal(await teacher.frame.locator('[data-google-course-id]').count(),0);
  await teacher.page.evaluate(()=>{window.qaGoogleMode='ok';});googleEmail='second-teacher@school.example';
  await teacher.page.locator('[data-google-authorize]').click();
  await teacher.frame.locator('[data-google-account]').filter({hasText:'second-teacher@school.example'}).waitFor();
  await teacher.frame.locator('[data-google-course-id="456"]').waitFor();
  await teacher.page.locator('[data-google-dialog-done]').click();
  await teacher.page.setViewportSize({width:390,height:844});
  assert.equal(await teacher.frame.locator('html').evaluate(node=>node.scrollWidth<=innerWidth),true);
  await teacher.frame.locator('[data-google-connect]').click();
  assert.equal(await teacher.page.locator('[data-google-classroom-dialog]').evaluate(node=>{const r=node.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),true);
  await teacher.page.locator('[data-google-dialog-done]').click();await teacher.page.setViewportSize({width:1360,height:1000});
  await teacher.frame.locator('[data-google-disconnect]').click();
  await teacher.frame.locator('[data-google-account]').filter({hasText:'second-teacher@school.example'}).waitFor({state:'hidden'});
  assert.equal(await teacher.frame.locator('[data-google-course-id]').count(),0);
  assert.equal(googleRequests.some(request=>request.uid==='student'),false);
  assert.ok(googleRequests.every(request=>request.method==='GET'));
  console.log('PASS direct Classroom phase 1: teacher gesture → separate school account → paginated read-only courses → popup cancellation/reconnect → no token persistence/iframe leak → student denial → mobile dialog');

  // Homework uses the production Hub bundle, UI and real emulator Rules.
  // It remains independent of lesson lock/unlock and quiz submission/grades.
  // Live classroom links use production UI/service and the same emulator Rules.
  await student.frame.locator('[data-hw-links-panel]>summary').click();
  await student.frame.locator('[data-hw-add-link]:not([disabled])').waitFor();
  await student.frame.locator('[data-hw-add-link]').click();
  await student.frame.locator('[name="linkTitle"]').fill('สมุดจดร่วมของห้อง');
  await student.frame.locator('[name="linkUrl"]').fill('https://example.com/notebook#page=2');
  await student.frame.locator('[data-links-save]').click();
  await student.frame.locator('[data-links-form]').waitFor({state:'hidden'});
  await teacher.frame.locator('[data-links-list] a').filter({hasText:'สมุดจดร่วมของห้อง'}).waitFor();
  const links = await good('teacher','GET',`classroomLinksV1/items/${roomId}`);
  const linkId = Object.keys(links)[0]; assert.equal(links[linkId].authorUid,'student');
  await teacher.frame.locator('[data-link-action="edit"]').click();
  await teacher.frame.locator('[name="linkTitle"]').fill('สมุดจดที่ครูตรวจแล้ว');
  await teacher.frame.locator('[data-links-save]').click();
  await student.frame.locator('[data-links-list] a').filter({hasText:'สมุดจดที่ครูตรวจแล้ว'}).waitFor();
  assert.equal((await good('student','GET',`classroomLinksV1/items/${roomId}/${linkId}`)).authorUid,'student');
  student.page.once('dialog',dialog=>dialog.accept());
  await student.frame.locator('[data-link-action="delete"]').click();
  await teacher.frame.locator('[data-links-list] a').waitFor({state:'hidden'});
  assert.equal(await good('teacher','GET',`classroomLinksV1/items/${roomId}/${linkId}`),null);
  console.log('PASS live classroom links: student adds → teacher sees/edits → attribution retained → author deletes');
  const homeworkQuizRoute = catalog.routes.find(route => route.kind === 'content' && route.status === 'ready' &&
    catalog.contents.find(item => item.id === route.contentId)?.source.endsWith('equilibrium/4-1-equilibrium-quiz.html'));
  assert.ok(homeworkQuizRoute, 'An authored, available quiz is needed for assignment integration');
  await teacher.frame.locator('[data-hw-new]').click();
  await teacher.frame.locator('[data-hw-editor] [name="title"]').fill('ทวนคลื่น — การบ้านทดลอง');
  await teacher.frame.locator('[data-hw-editor] [name="url"]').fill(origin + prefix + homeworkQuizRoute.hash);
  await teacher.frame.locator('[data-hw-editor] [name="instructions"]').fill('อ่านคำชี้แจงแล้วเปิด Quiz');
  await teacher.frame.locator('[data-hw-preview]').click();
  await teacher.frame.locator('[data-hw-preview-result]').filter({ hasText: 'Quiz ที่เลือก' }).waitFor();
  await teacher.frame.locator('[data-hw-save]').click();
  await teacher.frame.locator('[data-next-assignment]').filter({hasText:'ทวนคลื่น'}).waitFor();
  assert.equal(await student.frame.locator('.homework-card').count(), 0, 'A student cannot see a private draft');
  assert.ok(!(await student.page.evaluate(() => qaDbRequests)).some(row => row.path.startsWith('classroomAssignmentsV1/drafts/')));
  await teacher.frame.locator('[data-hw-tools] [data-homework-action="edit"]').click();
  await teacher.frame.locator('[data-hw-publish]').click();
  await student.page.locator('.assignment-notice button').waitFor();
  await student.page.locator('.assignment-notice button').click();
  await student.frame.locator('[data-hw-detail] h3').filter({ hasText: 'ทวนคลื่น' }).waitFor();
  await student.page.locator('.assignment-notice').waitFor({ state: 'hidden' });
  assert.equal(await student.frame.locator('[data-hw-new]').isVisible(), false);
  const homeworkLink = await student.frame.locator('.homework-share input').inputValue();
  assert.match(homeworkLink, /#classroom\/r_[a-f0-9]{32}\/a_[a-f0-9]{32}$/);
  await student.page.reload();
  await student.frame.locator('[data-hw-detail] h3').filter({ hasText: 'ทวนคลื่น' }).waitFor();
  assert.equal(await student.page.locator('.assignment-notice').isVisible(), false, 'Read state persists after reload');
  // An old practice result must not become a homework result.
  await student.page.evaluate(id => localStorage.setItem(`learning-hub-quiz:v1:student:${id}`, JSON.stringify({version:2,identityKey:'student',contentId:id,answers:{},masteredIds:[],latestScore:{score:999,maxScore:999},savedAt:Date.now()})), homeworkQuizRoute.contentId);
  await teacher.frame.locator('[data-hw-tools] [data-homework-action="scores"]').click();
  await teacher.frame.locator('[data-homework-results] tbody tr').filter({hasText:'นักเรียนทดลอง'}).waitFor();
  await student.frame.locator('[data-hw-detail] [data-homework-action="launch"]').click();
  const homeworkFrame=student.page.frameLocator('#workspace-window-layer iframe[src*="homework=1"]');
  await homeworkFrame.locator('[data-quiz-app]').waitFor({state:'visible'});
  await homeworkFrame.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  assert.deepEqual(await homeworkFrame.locator('body').evaluate(()=>window.LearningHubQuiz.getState().answers),{});
  assert.equal(await homeworkFrame.locator('[data-homework-submit]').count(),0,'No final submit button before checking answers');
  assert.equal(await good('EMULATOR_ADMIN','GET','quizProgress'),null,'Opening homework does not touch ordinary practice');
  const homeworkWindow=student.page.locator('.workspace-window').filter({has:student.page.locator('iframe[src*="homework=1"]')});
  const homeworkSrc=await homeworkWindow.locator('iframe').getAttribute('src');
  await homeworkWindow.locator('.window-toolbar-toggle').click();
  assert.equal(await homeworkWindow.locator('.window-trailing-tools').isVisible(),false);
  await homeworkFrame.locator('[data-action-dock-panel] > summary').click();
  assert.equal(await homeworkFrame.locator('[data-next-button]').isVisible(),false);
  await homeworkFrame.locator('[data-action-dock-panel] > summary').click();
  await homeworkFrame.locator('[data-reasoning-input]').fill('Keep this homework working');
  await homeworkFrame.locator('[data-topic-review-open]').click();
  const reviewWindow=student.page.locator('[data-tool-id="topic-review-library"]');
  const reviewFrame=reviewWindow.frameLocator('iframe');
  await reviewFrame.locator('[data-review-return-question="1"]').waitFor();
  assert.equal(await homeworkWindow.getAttribute('data-window-snap'),'left');
  assert.equal(await reviewWindow.getAttribute('data-window-snap'),'right');
  assert.match(new URL(student.page.url()).hash,/^#classroom\//,'Reading must retain the selected classroom/assignment route');
  assert.equal(await homeworkFrame.locator('[data-topic-review-dialog]').isVisible(),false);
  await reviewFrame.locator('[data-review-return-question="1"]').click();
  // The iframe return crosses postMessage; wait for its observable destination.
  await student.page.locator('.workspace-window.is-active iframe[src*="homework=1"]').waitFor();
  assert.equal(await homeworkWindow.locator('iframe').getAttribute('src'),homeworkSrc);
  assert.equal(await homeworkFrame.locator('[data-reasoning-input]').inputValue(),'Keep this homework working');
  assert.equal(await homeworkWindow.locator('.window-trailing-tools').isVisible(),false,'Fold retained through review return');
  assert.equal(await student.page.locator('#workspace-window-layer iframe[src*="quiz-player"]').count(),1,'Return must not open free bank practice');
  await student.page.screenshot({path:resolve(root,'qa-output/classroom-monitor-homework-review.png'),fullPage:true});
  await reviewWindow.locator('.is-close').click();
  await homeworkFrame.locator('[data-reasoning-input]').fill('');
  await homeworkWindow.locator('.window-toolbar-toggle').click();
  assert.equal(await good('EMULATOR_ADMIN','GET','quizProgress'),null,'Reading never writes normal practice');
  const correctIndex=await homeworkFrame.locator('[data-quiz-print-source] [data-question]').first().evaluate(question=>[...question.querySelectorAll('[data-choice-id]')].findIndex(choice=>choice.dataset.choiceId===question.dataset.answer));
  assert.ok(correctIndex>=0);await homeworkFrame.locator('.quiz-option').nth(correctIndex).click();
  await homeworkFrame.locator('[data-submit-all]').click();
  await homeworkFrame.locator('[data-evidence-warning-continue]').click();
  await homeworkFrame.locator('[data-homework-submit]').waitFor();
  assert.equal(await good('EMULATOR_ADMIN','GET',`classroomSubmissionsV1/results/${roomId}`),null,'Checking answers is not final submission');
  const notSubmitted=teacher.frame.locator('[data-result-uid="student"]');
  assert.ok((await notSubmitted.textContent()).includes('ยังไม่ส่ง'));
  student.page.once('dialog',dialog=>dialog.accept());await homeworkFrame.locator('[data-homework-submit]').click();
  await homeworkFrame.locator('[data-homework-status]').filter({hasText:'ส่งงานสำเร็จ'}).waitFor();
  await teacher.frame.locator('[data-result-uid="student"]').filter({hasText:'ส่งแล้ว'}).waitFor();
  assert.ok((await teacher.frame.locator('[data-result-uid="student"]').textContent()).includes('1/'));
  assert.ok((await teacher.frame.locator('[data-result-uid="student-b"]').textContent()).includes('ยังไม่ส่ง'));
  const sent=await good('EMULATOR_ADMIN','GET',`classroomSubmissionsV1/results/${roomId}`), assignmentId=Object.keys(sent)[0];
  assert.equal(Object.keys(sent[assignmentId]).length,1);assert.equal(typeof sent[assignmentId].student.submittedAt,'number');
  assert.equal(await good('EMULATOR_ADMIN','GET','quizProgress'),null);
  assert.equal(await homeworkFrame.locator('[data-homework-submit]').count(),0);
  assert.equal(await homeworkFrame.locator('[data-retry]').isEnabled(),true,'Submitted homework can retry unmastered questions');
  const frozenQuiz=await good('teacher','GET',`classroomSubmissionsV1/quizzes/${roomId}/${assignmentId}`);
  const firstPercent=Math.round(1/frozenQuiz.questionCount*10000)/100;
  await student.frame.locator('[data-hw-overall-percent]').filter({hasText:`${firstPercent}%`}).waitFor();
  assert.equal(await student.frame.locator('[data-hw-overall-count]').textContent(),'1/1');
  assert.equal(await teacher.frame.locator('[data-hw-overall]').isVisible(),false);
  const firstSubmission=sent[assignmentId].student;
  await homeworkFrame.locator('[data-retry]').click();
  const nextQuestion=await homeworkFrame.locator('[data-quiz-print-source] [data-question]').nth(1).evaluate(question=>({id:question.dataset.questionId,index:[...question.querySelectorAll('[data-choice-id]')].findIndex(choice=>choice.dataset.choiceId===question.dataset.answer)}));
  assert.ok(nextQuestion.index>=0);await homeworkFrame.locator('.quiz-option').nth(nextQuestion.index).click();
  await homeworkFrame.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  const correctedAnswer=await homeworkFrame.locator('body').evaluate(id=>window.LearningHubQuiz.getState().answers[id],nextQuestion.id);
  assert.equal((await good('student','GET',`classroomSubmissionsV1/results/${roomId}/${assignmentId}/student`)).submissionId,firstSubmission.submissionId,'Editing retains the previously submitted result');
  await student.page.reload();
  await student.frame.locator('[data-hw-detail] [data-homework-action="launch"]').click();
  await homeworkFrame.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  assert.equal(await homeworkFrame.locator('body').evaluate(id=>window.LearningHubQuiz.getState().answers[id],nextQuestion.id),correctedAnswer,'Corrections survive reload before resubmission');
  await homeworkFrame.locator('[data-submit-all]').click();
  await homeworkFrame.locator('[data-evidence-warning-continue]').click();
  await homeworkFrame.locator('[data-homework-submit]').waitFor();
  student.page.once('dialog',dialog=>dialog.accept());await homeworkFrame.locator('[data-homework-submit]').click();
  await homeworkFrame.locator('[data-homework-status]').filter({hasText:'คะแนนที่ส่งล่าสุด 2/'}).waitFor();
  await teacher.frame.locator('[data-result-uid="student"]').filter({hasText:'2/'}).waitFor();
  const secondPercent=Math.round(2/frozenQuiz.questionCount*10000)/100;
  await student.frame.locator('[data-hw-overall-percent]').filter({hasText:`${secondPercent}%`}).waitFor();
  assert.equal(await student.frame.locator('[data-hw-overall-count]').textContent(),'1/1');
  console.log('PASS own overall progress: latest submitted score/total question points, resubmission updates, completion stays 1/1, teacher panel hidden');
  const secondSubmission=await good('student','GET',`classroomSubmissionsV1/results/${roomId}/${assignmentId}/student`);
  assert.equal(secondSubmission.submissionRevision,2);assert.notEqual(secondSubmission.submissionId,firstSubmission.submissionId);
  assert.deepEqual(await good('student','GET',`classroomSubmissionsV1/history/${roomId}/${assignmentId}/student/${firstSubmission.submissionId}`),firstSubmission);
  await teacher.frame.locator('[data-result-uid="student"] [data-homework-action="history"]').click();
  await teacher.frame.locator('[data-homework-history]').filter({hasText:'ครั้งที่ 1: 1/'}).waitFor();
  assert.ok((await teacher.frame.locator('[data-homework-history]').textContent()).includes('ครั้งที่ 2: 2/'));
  await teacher.frame.locator('[data-hw-detail-close]').click();
  const downloadEvent = teacher.page.waitForEvent('download');
  await teacher.frame.locator('[data-homework-action="export-sheet"]').click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), `hub-homework-${assignmentId.slice(2)}.csv`);
  const exportedCsv = await readFile(await download.path(), 'utf8');
  assert.ok(exportedCsv.startsWith('\uFEFF"ExportVersion","ExportedAt","RowType"'));
  assert.ok(exportedCsv.includes(`"student","นักเรียนทดลอง","submitted","2"`));
  assert.ok(exportedCsv.includes('"student-b","นักเรียนอีกคน","not_submitted","","",""'));
  assert.ok(exportedCsv.includes(secondSubmission.submissionId));
  await teacher.frame.locator('[data-hw-feedback]').filter({hasText:'ยังไม่ส่งคะแนนเข้า Google Classroom'}).waitFor();
  await homeworkFrame.locator('[data-homework-back]').click();
  await student.frame.locator('[data-homework-results]').filter({hasText:'คะแนนคำตอบ 2/'}).waitFor();
  assert.equal(await student.frame.locator('[data-homework-action="export-sheet"]').count(), 0);
  console.log('PASS teacher CSV download: latest recomputed scores, missing scores stay blank, student control hidden');
  await student.page.reload();
  await student.frame.locator('[data-hw-detail] [data-homework-action="launch"]').click();
  await student.page.frameLocator('iframe[src*="homework=1"]').locator('[data-homework-status]').filter({hasText:'ส่งงานสำเร็จ'}).waitFor();
  console.log('PASS homework resubmission: practice isolated → submit → retry incorrect answers → autosave/reload → resubmit cumulative score → teacher history');
  // The teacher borrows the student's real assignment, never the normal practice save.
  await homeworkFrame.locator('[data-edit-results]').click();
  const emergencyQuestion=await homeworkFrame.locator('[data-quiz-print-source]').evaluate(root=>{const done=window.LearningHubQuiz.getState().masteredIds;const rows=[...root.querySelectorAll('[data-question]')];const index=rows.findIndex(q=>!done.includes(q.dataset.questionId) && q.querySelectorAll('[data-choice-id]').length>1);const q=rows[index];const correct=[...q.querySelectorAll('[data-choice-id]')].findIndex(c=>c.dataset.choiceId===q.dataset.answer);return{index,correct,count:q.querySelectorAll('[data-choice-id]').length};});
  await homeworkFrame.locator('body').evaluate(index=>window.LearningHubQuiz.goToQuestion(index),emergencyQuestion.index);
  await homeworkFrame.locator('.quiz-option').nth((emergencyQuestion.correct+1)%emergencyQuestion.count).click();
  await homeworkFrame.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  const beforeAssist=await good('EMULATOR_ADMIN','GET',`classroomSubmissionsV1/attempts/${roomId}/${assignmentId}/student`);
  await teacher.frame.locator('.homework-card [data-homework-action="view"]').first().click();
  await teacher.frame.locator('[data-hw-detail] [data-homework-action="student-work"]').click();
  await teacher.page.setViewportSize({width:1024,height:768});
  assert.equal(await teacher.frame.locator('html').evaluate(node=>node.scrollWidth<=innerWidth),true);
  await teacher.page.screenshot({path:resolve(googleOutput,'classroom-emergency-student-work.png'),fullPage:true});
  teacher.page.once('dialog',dialog=>dialog.accept());
  await teacher.frame.locator('[data-homework-action="assist-start"][data-student-uid="student"]').click();
  const helper=teacher.page.frameLocator('iframe[src*="homework=1"]');
  await helper.locator('[data-assisted-student]').filter({hasText:'นักเรียนทดลอง'}).waitFor();
  assert.equal(await teacher.page.evaluate(()=>qaUid),'teacher');
  await teacher.page.screenshot({path:resolve(googleOutput,'classroom-emergency-student-banner.png'),fullPage:true});
  await teacher.page.setViewportSize({width:1360,height:1000});
  await helper.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  assert.deepEqual(await helper.locator('body').evaluate(()=>window.LearningHubQuiz.getState().answers),JSON.parse(beforeAssist.progressJson).answers);
  await homeworkFrame.locator('[data-homework-reclaim]').waitFor();
  assert.equal(await homeworkFrame.locator('.quiz-option').first().isDisabled(),true);
  await helper.locator('body').evaluate(index=>window.LearningHubQuiz.goToQuestion(index),emergencyQuestion.index);
  const helperDock=helper.locator('[data-action-dock-panel]');if(await helperDock.evaluate(node=>node.open))await helperDock.locator('summary').click();
  await helper.locator('.quiz-option').nth(emergencyQuestion.correct).evaluate(node=>{node.scrollIntoView({block:'center',behavior:'instant'});const r=node.getBoundingClientRect(),top=document.querySelector('.quiz-topbar').getBoundingClientRect().bottom;if(r.top<top+10)window.scrollBy({top:r.top-top-20,behavior:'instant'});});
  await helper.locator('.quiz-option').nth(emergencyQuestion.correct).click();
  await helper.locator('[data-reasoning-input]').fill('Emergency device: work and notes belong to the student.');
  await helper.locator('[data-notebook-panel] summary').click();
  const ink=helper.locator('[data-notebook-canvas]');await ink.waitFor();await ink.evaluate(node=>{const r=node.getBoundingClientRect(),top=document.querySelector('.quiz-topbar').getBoundingClientRect().bottom;window.scrollBy({top:r.top-top-24,behavior:'instant'});});const bounds=await ink.boundingBox();
  await teacher.page.mouse.move(bounds.x+30,bounds.y+30);await teacher.page.mouse.down();await teacher.page.mouse.move(bounds.x+150,bounds.y+90,{steps:8});await teacher.page.mouse.up();
  await helper.locator('[data-notebook-evidence-status]').filter({hasText:'เส้น'}).waitFor();
  await helper.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  if(!await helperDock.evaluate(node=>node.open))await helperDock.locator('summary').click();
  await helper.locator('[data-submit-all]').click();
  await helper.locator('[data-evidence-warning-continue]').click();
  await helper.locator('[data-homework-submit]').waitFor();
  const accept=dialog=>dialog.accept();teacher.page.on('dialog',accept);
  await helper.locator('[data-homework-submit]').click();
  await helper.locator('[data-homework-status]').filter({hasText:'ส่งงานสำเร็จ'}).waitFor();
  const pdfDownload=teacher.page.waitForEvent('download');await helper.locator('[data-export-evidence]').click();const pdf=await pdfDownload;const pdfBytes=await readFile(await pdf.path());assert.equal(pdfBytes.subarray(0,4).toString(),'%PDF');assert.ok(pdf.suggestedFilename().includes('นักเรียนทดลอง'));await pdf.saveAs(resolve(googleOutput,'classroom-emergency-student-notes.pdf'));
  const assistedResult=await good('EMULATOR_ADMIN','GET',`classroomSubmissionsV1/results/${roomId}/${assignmentId}/student`);
  assert.equal(assistedResult.assistedByUid,'teacher');
  assert.equal(await good('EMULATOR_ADMIN','GET',`classroomSubmissionsV1/results/${roomId}/${assignmentId}/teacher`),null);
  await teacher.page.setViewportSize({width:1024,height:768});
  await teacher.page.screenshot({path:resolve(googleOutput,'classroom-emergency-teacher.png'),fullPage:true});
  await helper.locator('[data-homework-finish]').click();
  await teacher.page.locator('iframe[src*="homework=1"]').waitFor({state:'detached'});
  teacher.page.off('dialog',accept);await teacher.page.setViewportSize({width:1360,height:1000});
  const returnedNavigation=student.page.waitForEvent('framenavigated',{predicate:frame=>frame.url().includes('quiz-player.html?homework=1')});
  await homeworkFrame.locator('[data-homework-reclaim]').click();await returnedNavigation;
  await homeworkFrame.locator('[data-quiz-storage-status]').filter({hasText:'บันทึกบน Cloud แล้ว'}).waitFor();
  await homeworkFrame.locator('[data-homework-status]').filter({hasText:'ส่งงานสำเร็จ'}).waitFor();
  assert.deepEqual(await homeworkFrame.locator('body').evaluate(async()=>{for(let i=0;i<100&&!window.LearningHubQuiz;i++)await new Promise(done=>setTimeout(done,50));return window.LearningHubQuiz.getState().answers;}),JSON.parse(assistedResult.answersJson));
  assert.equal(await good('EMULATOR_ADMIN','GET','quizProgress'),null);
  if(!await teacher.frame.locator('[data-student-work]').isVisible())await teacher.frame.locator('[data-homework-action="student-work"]').click();
  teacher.page.on('dialog',accept);await teacher.frame.locator('[data-homework-action="assist-start"][data-student-uid="student"]').click();
  await helper.locator('[data-assisted-student]').waitFor();await homeworkFrame.locator('[data-homework-reclaim]').waitFor();
  await homeworkFrame.locator('[data-homework-reclaim]').click();
  await helper.locator('[data-homework-banner]').filter({hasText:'สิทธิ์ช่วยสิ้นสุดแล้ว'}).waitFor();
  await helper.locator('[data-homework-finish]').click();await teacher.page.locator('iframe[src*="homework=1"]').waitFor({state:'detached'});teacher.page.off('dialog',accept);
  console.log('PASS emergency assignment: student draft → actual teacher account → exact student save → teacher submit attribution → confirmed return → student resumes; practice isolated');
  // Reset the retained homework iframe before the following independent
  // monitoring regression opens its own quiz. Read receipts remain persisted.
  await student.page.reload();
  await student.frame.locator('[data-hw-detail] [data-homework-action="launch"]').waitFor();
  await teacher.frame.locator('[data-hw-detail-close]').click();
  teacher.page.once('dialog', dialog => dialog.accept());
  await teacher.frame.locator('[data-hw-tools] [data-homework-action="close"]').click();
  await student.frame.locator('[data-hw-detail] .homework-tag').filter({ hasText: 'ปิดงาน' }).waitFor();
  assert.equal(await student.frame.locator('[data-hw-detail] [data-homework-action="launch"]').textContent(), 'ดูงานที่ส่ง');
  await student.frame.locator('[data-hw-detail] [data-homework-action="launch"]').click();
  await homeworkFrame.locator('[data-homework-status]').filter({hasText:'ส่งงานสำเร็จ'}).waitFor();
  assert.equal(await homeworkFrame.locator('[data-retry]').isDisabled(),true,'Closing stops further correction and resubmission');
  assert.equal(await homeworkFrame.locator('[data-homework-submit]').count(),0);
  await student.page.reload();
  console.log('PASS homework: private draft → publish → unread notice → deep link → read persistence → frozen homework quiz → final submission → close');
  // Lesson shortcuts navigate through the Hub to the authored parent menu,
  // including closed/submitted work; they do not open or submit a new attempt.
  await student.frame.locator('[data-hw-detail-close]').click();
  await student.frame.locator('[data-hw-next-panel]>summary').click();
  const lessonMenu = catalog.routes.find(route => route.hash === homeworkQuizRoute.parentHash);
  assert.equal(lessonMenu?.kind, 'bank');
  await student.frame.locator(`[data-homework-action="lesson"][data-id="${assignmentId}"]`).click();
  await student.page.waitForURL(url => url.hash === lessonMenu.hash);
  assert.equal((await good('student','GET',`classroomSubmissionsV1/results/${roomId}/${assignmentId}/student`)).submissionId,assistedResult.submissionId);
  await student.page.evaluate(hash => { location.hash = hash; }, new URL(homeworkLink).hash);
  await student.frame.locator('[data-classroom-assignments]').waitFor();
  console.log('PASS classroom path retains submitted/closed work and lesson shortcut opens the authored menu without changing results');
  const smallQuiz = catalog.contents.find(content => content.source === 'content/templates/quiz-template.html');
  assert.ok(smallQuiz, 'The two-question template fixture is available for the threshold check');
  async function assignStep(title, requiresAssignmentId = '') {
    const close = teacher.frame.locator('[data-hw-detail-dialog][open] [data-hw-detail-close]');
    if (await close.count()) await close.click();
    await teacher.frame.locator('[data-hw-new]').click();
    await teacher.frame.locator('[name="title"]').fill(title);
    await teacher.frame.locator('[name="url"]').fill(origin + prefix + smallQuiz.canonicalHash);
    await teacher.frame.locator('[name="requiresAssignmentId"]').selectOption(requiresAssignmentId);
    await teacher.frame.locator('[data-hw-preview]').click();
    await teacher.frame.locator('[data-hw-preview-result]').filter({hasText:'Quiz ที่เลือก'}).waitFor();
    await teacher.frame.locator('[data-hw-publish]').click();
    await teacher.frame.locator('[data-hw-selection]').filter({hasText:title}).waitFor();
    const id = await teacher.frame.locator('[data-hw-tools] [data-homework-action="edit"]').getAttribute('data-id');
    await teacher.frame.locator(`[data-hw-feed] [data-assignment-id="${id}"] [data-homework-action="launch"]`).waitFor();
    return id;
  }
  const stepA = await assignStep('ทดสอบเงื่อนไข · งาน 1'), stepB = await assignStep('ทดสอบเงื่อนไข · งาน 2', stepA);
  async function inspectStep(client, id) {
    await client.page.evaluate(hash => { location.hash = hash; }, `#classroom/${roomId}/${id}`);
    await client.frame.locator('[data-hw-detail-dialog][open]').waitFor();
    await client.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${id}"]`).waitFor();
  }
  await inspectStep(student, stepA);
  await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepA}"]`).click();
  const stepWindow = `#workspace-window-layer [data-tool-id="homework-${roomId}-${stepA}-student"] iframe`;
  const stepQuiz = student.page.frameLocator(stepWindow);
  async function answerStep(questionIndex) {
    const correctIndex = await stepQuiz.locator('[data-quiz-print-source] [data-question]').nth(questionIndex).evaluate(question => [...question.querySelectorAll('[data-choice-id]')].findIndex(choice => choice.dataset.choiceId === question.dataset.answer));
    assert.ok(correctIndex >= 0);
    const option = stepQuiz.locator('.quiz-option').nth(correctIndex);
    await option.evaluate(node => node.scrollIntoView({block:'start',behavior:'instant'}));
    assert.equal(await option.evaluate(node => {const r=node.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.quiz-option')===node;}),true);
    const rect = await option.boundingBox(), point = {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
    assert.equal(await student.page.locator(stepWindow).evaluate((frame,p)=>document.elementFromPoint(p.x,p.y)===frame,point),true);
    await student.page.mouse.click(point.x,point.y);
    await stepQuiz.locator('.quiz-option[aria-pressed="true"]').waitFor();
  }
  async function sendStep(score) {
    await stepQuiz.locator('[data-submit-all]').click();await stepQuiz.locator('[data-evidence-warning-continue]').click();
    await stepQuiz.locator('[data-homework-submit]').waitFor();student.page.once('dialog',dialog=>dialog.accept());await stepQuiz.locator('[data-homework-submit]').click();
    await stepQuiz.locator('[data-homework-status]').filter({hasText:`คะแนนที่ส่งล่าสุด ${score}/2`}).waitFor();
    await stepQuiz.locator('[data-homework-back]').click();
    await student.page.locator(stepWindow).waitFor({state:'hidden'});
    await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepA}"]`).waitFor();
  }
  await answerStep(0);await sendStep(1);
  await inspectStep(student,stepB);
  await student.frame.locator('[data-hw-detail] [data-gate-status="locked"]').waitFor();
  assert.equal(await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepB}"]`).isDisabled(),true,'Exactly 50% stays locked');
  const deniedLaunch = await student.page.locator('#hub-page-frame').elementHandle().then(handle=>handle.contentFrame()).then(frame=>frame.evaluate(({roomId,id})=>new Promise(resolve=>{
    const requestId=crypto.randomUUID(),timeout=setTimeout(()=>{window.removeEventListener('message',receive);resolve('timeout');},10000);
    function receive(event){if(event.source===parent&&event.origin===location.origin&&event.data?.type==='learning-hub-assignment-result'&&event.data.requestId===requestId){clearTimeout(timeout);window.removeEventListener('message',receive);resolve(event.data.error);}}
    window.addEventListener('message',receive);parent.postMessage({type:'learning-hub-assignment-command',uid:'student',requestId,action:'launch',payload:{roomId,id}},location.origin);
  }),{roomId,id:stepB}));
  assert.equal(deniedLaunch,'homework/prerequisite-locked','The parent also rejects direct launch requests');
  await inspectStep(student,stepA);await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepA}"]`).click();
  await stepQuiz.locator('[data-retry]').click();await answerStep(1);await sendStep(2);
  await inspectStep(student,stepB);
  await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepB}"]:not([disabled])`).waitFor();
  await student.page.reload();
  await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepB}"]:not([disabled])`).waitFor();
  const otherStudent = await client('student-b',true);await inspectStep(otherStudent,stepB);
  await otherStudent.frame.locator('[data-hw-detail] [data-gate-status="locked"]').waitFor();await otherStudent.context.close();
  await student.frame.locator(`[data-hw-detail] [data-homework-action="launch"][data-id="${stepB}"]`).click();
  await student.page.frameLocator(`#workspace-window-layer [data-tool-id="homework-${roomId}-${stepB}-student"] iframe`).locator('[data-quiz-app]').waitFor();
  await student.page.reload();await student.frame.locator('[data-classroom-assignments]').waitFor();
  console.log('PASS prerequisites: 50% locked → direct launch denied → resubmit above 50% unlocks → reload stays open → other student locked → next quiz opens');
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
  // This test transport polls instead of the real SDK's optimistic onValue.
  // A teacher-side receipt can arrive before the student's own watch catches up.
  // Wait for that local callback before sending the next user command; otherwise
  // the fake can re-send an immutable deliveredAt with a new server timestamp.
  await student.page.waitForFunction(() => Object.entries(window.qaDbSnapshots).some(([path, value]) =>
    path.startsWith('classroomMonitorV1/notices/') && path.endsWith('/student') && Object.values(value || {}).some(note => note.deliveredAt > 0)));
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
  const choice = quiz.locator('.quiz-option').first();
  await choice.waitFor({ state: 'visible' });
  await quiz.locator('[data-quiz-storage-status]').filter({ hasText: 'บันทึกบน Cloud แล้ว' }).waitFor();
  // The sticky quiz action dock covers the middle of this short mobile iframe.
  // Scroll above it, then use a pointer only after checking both documents.
  await choice.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const choiceBounds = await choice.boundingBox();
  assert.ok(choiceBounds, 'The choice has visible bounds');
  const point = { x: choiceBounds.x + choiceBounds.width / 2, y: choiceBounds.y + choiceBounds.height / 2 };
  assert.equal(await choice.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('.quiz-option') === node;
  }), true, 'The choice is unobstructed inside the quiz');
  assert.equal(await student.page.locator('.workspace-tool-frame').evaluate((frame, point) =>
    document.elementFromPoint(point.x, point.y) === frame, point), true, 'No Hub overlay covers the click');
  await student.page.mouse.click(point.x, point.y);
  await quiz.locator('.quiz-option[aria-pressed="true"]').waitFor();
  assert.equal(await choice.getAttribute('aria-pressed'), 'true', 'The quiz choice was actually selected');
  const quizFrame = await student.page.locator('.workspace-tool-frame').elementHandle().then(handle => handle.contentFrame());
  const answers = await quizFrame.evaluate(() => LearningHubQuiz.getState().answers);
  assert.ok(Object.keys(answers).length > 0, 'Preservation must start with a real quiz answer');
  assert.equal(await student.page.locator('.monitor-dialog').evaluate(node => node.open), false, 'Selecting an answer does not open messages');
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
  // Owner email roster: pending first login, automatic enrollment, live revocation,
  // blocked room-code rejoin and explicit restoration through the real UI/Rules.
  const roster = teacher.frame.locator('.classroom-roster-details');
  if (!await roster.evaluate(node => node.open)) await roster.locator('summary').click();
  await teacher.frame.locator('[data-student-email]:not([disabled])').waitFor();
  await teacher.frame.locator('[data-student-email]').fill('email-student@example.test');
  await teacher.frame.locator('[data-invite-student] button').click();
  await teacher.frame.locator('[data-room-feedback]').filter({hasText:'บันทึกอีเมลแล้ว'}).waitFor();
  await roster.locator('li').filter({hasText:'email-student@example.test'}).waitFor();
  const added = await client('email-student', true);
  const remove = teacher.frame.locator('[data-room-action="remove-member"][data-member-uid="email-student"]');
  await remove.waitFor(); await remove.click(); await remove.filter({hasText:'ยืนยันนำออก'}).click();
  await added.frame.locator('[data-room-detail]').waitFor({state:'hidden'});
  await added.frame.locator('[data-join-room] [name="code"]').fill('ABCD2345');
  await added.frame.locator('[data-join-room] button').click();
  await added.frame.locator('[data-room-feedback]').filter({hasText:'ครูนำคุณออก'}).waitFor();
  await teacher.frame.locator('[data-room-action="restore-member"][data-member-uid="email-student"]').click();
  await added.frame.locator('[data-room-list] button').waitFor(); await added.frame.locator('[data-room-list] button').click();
  await added.frame.locator('[data-room-detail]').waitFor();
  await teacher.page.screenshot({path:resolve(output,'classroom-monitor-roster.png'),fullPage:true});
  assert.equal(await added.frame.locator('[data-invite-student]').count(),0);
  assert.equal(await added.frame.locator('html').evaluate(node=>node.scrollWidth<=innerWidth),true);
  await added.context.close();
  console.log('PASS email roster: pending first login → auto-enroll → owner removal → live access cleared → code rejoin denied → restore → mobile/student isolation');
  // Production invitation, auto-enrollment, room-scoped tools and revocation.
  const roomTeachers = teacher.frame.locator('.classroom-teachers-details');
  await roomTeachers.locator('summary').click();
  await teacher.frame.locator('[data-room-teacher-email]:not([disabled])').waitFor();
  await teacher.frame.locator('[data-room-teacher-email]').fill('room-teacher@example.test');
  await teacher.frame.locator('[data-invite-room-teacher] button').click();
  await teacher.frame.locator('[data-room-feedback]').filter({hasText:'เพิ่มอีเมลครูร่วมแล้ว'}).waitFor();
  await roomTeachers.locator('li').filter({hasText:'room-teacher@example.test'}).waitFor();
  await teacher.frame.locator('[data-room-action="share-room-teachers"]').click();
  await teacher.page.locator('.hub-share-dialog[open]').waitFor();
  assert.equal(await teacher.page.locator('#hub-share-url').inputValue(), origin + prefix + '#classroom');
  assert.ok((await teacher.page.locator('.hub-share-description').textContent()).includes('ครูร่วม'));
  await teacher.page.locator('[data-share-close]').click();
  const coTeacher = await client('room-teacher', false, false);
  await coTeacher.frame.locator('[data-room-list] button').waitFor();
  await coTeacher.frame.locator('[data-room-list] button').click();
  await coTeacher.frame.locator('[data-hw-new]').waitFor();
  assert.equal(await coTeacher.frame.locator('[data-create-room]').isVisible(),false);
  assert.equal(await coTeacher.frame.locator('[data-invite-student]').count(),0);
  assert.equal(await coTeacher.frame.locator('[data-invite-room-teacher]').count(),0);
  assert.equal(await coTeacher.frame.locator('[data-room-monitor-panel]').isVisible(),false);
  assert.equal(await good('EMULATOR_ADMIN','GET','learningHub/teacherApprovals/room-teacher'),null);
  await coTeacher.frame.locator(`[data-assignment-id="${assignmentId}"] [data-homework-action="select"]`).click();
  const downloadCoTeacher=coTeacher.page.waitForEvent('download');
  await coTeacher.frame.locator('[data-hw-tools] [data-homework-action="export-sheet"]').click();await downloadCoTeacher;
  const coLinks = coTeacher.frame.locator('[data-hw-links-panel]');
  if (!await coLinks.evaluate(node=>node.open)) await coLinks.locator('summary').click();
  await coTeacher.frame.locator('[data-hw-add-link]:not([disabled])').waitFor();
  await coTeacher.frame.locator('[data-hw-add-link]').click();
  await coTeacher.frame.locator('[name="linkTitle"]').fill('เอกสารจากครูร่วม');
  await coTeacher.frame.locator('[name="linkUrl"]').fill('https://example.test/room-teacher');
  await coTeacher.frame.locator('[data-links-save]').click();
  await coTeacher.frame.locator('[data-links-form]').waitFor({state:'hidden'});
  const roomLinks=await good('teacher','GET',`classroomLinksV1/items/${roomId}`);
  assert.ok(Object.values(roomLinks).some(link=>link.authorUid==='room-teacher'));
  await coTeacher.page.setViewportSize({width:1024,height:768});
  assert.equal(await coTeacher.frame.locator('html').evaluate(node=>node.scrollWidth<=innerWidth),true);
  await coTeacher.page.screenshot({path:resolve(output,'classroom-monitor-co-teacher.png'),fullPage:true});
  const removeTeacher=teacher.frame.locator('[data-room-action="remove-teacher"][data-teacher-uid="room-teacher"]');
  await removeTeacher.waitFor();await removeTeacher.click();await removeTeacher.filter({hasText:'ยืนยันถอนครูร่วม'}).click();
  await coTeacher.frame.locator('[data-room-detail]').waitFor({state:'hidden'});
  assert.equal(await coTeacher.frame.locator('[data-hw-tools]').isVisible(),false);
  assert.ok((await good('teacher','GET',`classroomSubmissionsV1/results/${roomId}`))[assignmentId].student);
  await coTeacher.context.close();
  console.log('PASS room co-teacher: invite email → first login → auto-enroll → room-only homework/CSV/link tools → live revoke; scores retained');
  // Teacher management belongs to the Classroom overview, outside any room.
  await teacher.frame.locator('[data-room-action="back"]').click();
  await teacher.frame.locator('[data-room-detail]').waitFor({state:'hidden'});
  // Production parent/dialog/role watchers against real emulator Rules.
  assert.equal(await teacher.frame.locator('[data-manage-teachers]').isVisible(), false);
  await teacher.frame.locator('[data-classroom-action="share-teacher-link"]').click();
  await teacher.page.locator('.hub-share-dialog[open]').waitFor();
  assert.equal(await teacher.page.locator('#hub-share-url').inputValue(), origin + prefix + '#classroom');
  assert.ok((await teacher.page.locator('.hub-share-description').textContent()).includes('ไม่ให้สิทธิ์ครู'));
  await teacher.page.locator('[data-share-close]').click();
  const friend = await client('teacher-friend', true, false);
  assert.equal(await friend.frame.locator('[data-create-room]').isVisible(), false);
  await friend.frame.locator('body').evaluate(() => parent.postMessage({type:'learning-hub-classroom-action', action:'manage-teachers'}, location.origin));
  assert.equal(await friend.page.locator('[data-teacher-dialog][open]').count(), 0);
  await good('EMULATOR_ADMIN', 'PUT', 'learningHub/admins/teacher', true);
  await teacher.frame.locator('[data-manage-teachers]').waitFor();
  await teacher.frame.locator('[data-manage-teachers]').click();
  await teacher.page.locator('[data-teacher-dialog][open]').waitFor();
  await teacher.page.locator('#teacher-email:not([disabled])').waitFor();
  await teacher.page.locator('#teacher-email').fill('teacher-friend@example.test');
  await teacher.page.locator('[data-teacher-find]').click();
  await teacher.page.locator('[data-teacher-result] [data-teacher-action="approve"][data-uid="teacher-friend"]').click();
  await teacher.page.locator('[data-teacher-feedback]').filter({hasText:'อนุมัติครูแล้ว'}).waitFor();
  assert.equal((await good('teacher-friend', 'GET', 'learningHub/teacherApprovals/teacher-friend')).enabled, true);
  assert.equal(await good('teacher', 'GET', 'learningHub/teacherRequests/teacher-friend'), null);
  await friend.frame.locator('[data-create-room]').waitFor();
  assert.equal(await teacher.page.locator('#teacher-share-url').inputValue(), origin + prefix + '#classroom');
  await teacher.page.screenshot({path:resolve(output,'classroom-monitor-teachers-approved.png'),fullPage:true});
  await teacher.page.locator('[data-teacher-list] [data-teacher-action="revoke"][data-uid="teacher-friend"]').click();
  await teacher.page.locator('[data-teacher-confirm-revoke]').click();
  await teacher.page.locator('[data-teacher-feedback]').filter({hasText:'ถอนสิทธิ์ครูแล้ว'}).waitFor();
  await friend.frame.locator('[data-create-room]').waitFor({state:'hidden'});
  await teacher.page.locator('[data-teacher-close]').click();
  await friend.context.close();
  console.log('PASS teacher management: first login → email preview → admin approval → live teacher access → confirmed revoke; share link and student spoof denial');
  assert.deepEqual(errors, []);
} catch (failure) {
  const output = resolve(root, 'qa-output'); await mkdir(output, { recursive: true });
  for (const [index, context] of (browser?.contexts() || []).entries()) for (const [pageIndex, page] of context.pages().entries()) {
    console.error('BROWSER DEBUG', index, pageIndex, await page.evaluate(() => ({ text: document.querySelector('.monitor-dialog')?.textContent, homework: [...document.querySelectorAll('iframe')].map(frame => { try { return frame.contentDocument?.body?.textContent?.slice(-2000); } catch { return ''; } }), failures: window.qaDbFailures?.slice(-10), requests: window.qaDbRequests?.slice(-20) })).catch(() => ({})));
    await page.screenshot({ path: resolve(output, `classroom-monitor-failure-${index}-${pageIndex}.png`), fullPage: true }).catch(() => {});
  }
  console.error('INCIDENTS', await good('EMULATOR_ADMIN','GET',`classroomMonitorV1/incidents/${roomId}`));
  console.error('PAGE ERRORS', errors); throw failure;
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
