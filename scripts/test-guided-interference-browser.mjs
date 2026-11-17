import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

// Real Hub and authored simulation; only Firebase is stubbed. No live writes.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const browserName = process.env.QA_BROWSER || 'chromium';
const browserType = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')[browserName];
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output/smart-lab-guide');
const catalog = await catalogFromRepository();
const stubs = {
  'firebase-app.js': 'export const getApps=()=>[];export const initializeApp=()=>({});',
  'firebase-auth.js': `export class GoogleAuthProvider{setCustomParameters(){}}
    export const browserLocalPersistence={};export const getAuth=()=>({});export const initializeAuth=getAuth;export const browserPopupRedirectResolver={};export const setPersistence=async()=>{};
    export const onAuthStateChanged=(_,fn)=>{setTimeout(()=>fn(null),20);return ()=>{}};
    export const signOut=async()=>{};export const signInWithPopup=async()=>{throw Error('Live login forbidden')};`,
  'firebase-database.js': `export const orderByChild=value=>value;export const equalTo=value=>value;export const query=path=>path;export const getDatabase=()=>({});export const ref=(_,path)=>path;
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
 browser=await browserType.launch({headless:true,executablePath:process.env.QA_BROWSER_EXECUTABLE});
 const context=await browser.newContext({viewport:{width:1420,height:1150},hasTouch:true});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[u.pathname.split('/').at(-1)]||''});return route.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.message);});page.setDefaultTimeout(20000);await mkdir(output,{recursive:true});
 await page.goto(origin+prefix+'#content/physics-ipst-wave-optics-10-2-double-slit-lab');await page.locator('#guest-button').click();
 const win=page.locator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"]');await win.waitFor();await win.locator('.is-maximize').click();
 const lab=page.frameLocator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');await lab.locator('#water-play').waitFor();
 const frame=page.frames().find(f=>f.url().includes('/10-2-double-slit-lab.html')),state=()=>frame.evaluate(()=>LearningHubSimulation.getState());

 const answer=(index,value)=>lab.locator(`#checkout-choice-${index}`).selectOption(value);
 const number=(index,value)=>lab.locator(`#mission-number-${index}`).fill(String(value));
 const setNumber=async(id,value)=>{await lab.locator('#'+id).fill(String(value));await lab.locator('#'+id).press('Tab');};
 const next=()=>lab.locator('#smart-primary').click();
 const check=()=>lab.locator('#mission-check').click();
 const scores=()=>frame.evaluate(()=>InterferenceMissions.scores(DoubleSlitLabBridge.read().missions));
 await lab.locator('main:not([inert])').waitFor();
 assert.equal((await state()).version,3);
 assert.equal(await lab.locator('#layer-nodes').isChecked(),true);
 assert.equal(await lab.locator('#layer-antinodes').isChecked(),true);
 assert.equal(await lab.locator('#mission-select option:disabled').count(),5);
 // A repeated guide jump highlights, never plays or resets the experiment.
 await next();await next();assert.equal((await state()).water.running,false);
 assert.match(await lab.locator('#smart-instruction').innerText(),/เล่นคลื่น/);
 await page.setViewportSize({width:390,height:1000});await next();await page.waitForTimeout(400);
 const controlBox=await lab.locator('#water-play').boundingBox(),guideBox=await lab.locator('#smart-guide').boundingBox();
 assert.ok(controlBox.y+controlBox.height<=guideBox.y||controlBox.x>=guideBox.x+guideBox.width||controlBox.x+controlBox.width<=guideBox.x||controlBox.y>=guideBox.y+guideBox.height,'Guide must not cover the target control');
 await page.screenshot({path:resolve(output,'phone-expanded-guide.png'),fullPage:true});
 await page.setViewportSize({width:1420,height:1150});
 await lab.locator('#water-play').click();await next();await answer(0,'node');await check();
 assert.equal((await scores()).firstCorrect,0);assert.equal((await scores()).firstChecked,1);
 await answer(0,'antinode');await check();assert.equal((await scores()).mastered,1);assert.equal((await scores()).firstCorrect,0);
 assert.match(await lab.locator('#smart-primary').innerText(),/ภารกิจถัดไป/);
 await next();assert.equal((await state()).missions.current,1);
 await lab.locator('#water-phase').selectOption('180');await lab.locator('#water-play').click();await next();await answer(0,'node');await check();await next();
 // Added numeric setup is performed through the visible fields.
 await setNumber('water-wavelength-number',2);
 await setNumber('water-separation-number',8);
 await setNumber('water-L-number',12);
 await lab.locator('#layer-paths').check();await lab.locator('#water-example').click();await next();
 await number(0,1);await answer(1,'node');await number(2,1);
 const fixed=await lab.locator('#mission-questions').innerText();
 await lab.locator('#checkout-return').click();await lab.locator('#water-probe').press('ArrowUp');await next();
 assert.equal(await lab.locator('#mission-questions').innerText(),fixed);
 assert.equal(await lab.locator('#mission-number-0').inputValue(),'1');
 await check();await next();
 await lab.locator('#mission-near').click();await lab.locator('#mission-far').click();await next();
 await answer(0,'far');await answer(1,'small');await number(2,.8);await check();await next();
 // Manual path remains available: moving only L leads the guide to R, not Exact measure.
 await lab.locator('#handle-left').press('ArrowRight');
 assert.match(await lab.locator('#smart-instruction').innerText(),/เส้นขวา/);
 for(const preset of ['A','B','C']){
   await lab.locator('#preset-'+preset).click();
   await lab.locator('#exact-measurement').click();await lab.locator('#record').click();
 }
 await next();await answer(0,'half');await answer(1,'C');await check();await next();
 // Mission 6 preserves the original latest record, then asks for a new C/2m measurement.
 assert.equal((await state()).missions.frozen[5].record.config.distance,1);
 await setNumber('distance-number',2);await lab.locator('#exact-measurement').click();await lab.locator('#record').click();
 await next();assert.equal(await lab.locator('#mission-number-1').count(),1);
 await number(0,650);await number(1,650);await check();
 assert.equal((await scores()).mastered,12);assert.equal((await scores()).firstCorrect,11);assert.equal((await scores()).progress,100);
 await next();await lab.locator('#lab-report').waitFor({state:'visible'});assert.equal((await state()).reportOpen,true);assert.equal((await state()).missions.current,5);
 await lab.locator('#report-name').fill('QA Student');await lab.locator('#report-class').fill('Y12');
 assert.match(await lab.locator('#report-metrics').innerText(),/91\.7%/);
 assert.match(await lab.locator('#report-metrics').innerText(),/100\.0%/);
 assert.match(await lab.locator('#report-answers').innerText(),/13\.00 mm/);
 // Real print media hides guides/controls and includes all answer details.
 await page.emulateMedia({media:'print'});
 assert.equal(await lab.locator('#smart-guide').isVisible(),false);
 assert.equal(await lab.locator('#report-print').isVisible(),false);
 assert.equal(await lab.locator('#report-print-name').isVisible(),true);
 await page.emulateMedia({media:'screen'});
 await page.screenshot({path:resolve(output,'report-th.png'),fullPage:true});
 if(browserName==='chromium'){
   await frame.evaluate(()=>LearningHubSimulation.flushLocal());
   const printPage=await context.newPage();
   await printPage.goto(origin+prefix+'content/physics/ipst/wave-optics/10-2-double-slit-lab.html');
   await printPage.locator('#lab-report:not([hidden])').waitFor();
   await printPage.pdf({path:resolve(output,'report-a4.pdf'),format:'A4',printBackground:true});
   await printPage.close();
 }
 // TH/EN changes text, never scores, question data, or measurements.
 const beforeLanguage=await state();await win.locator('[data-window-language="en"]').click();
 assert.match(await lab.locator('#report-title').innerText(),/Double-slit/);
 assert.deepEqual(await state(),beforeLanguage);
 // Durable restore retains first attempt, mastery, identity, report and student.
 await frame.evaluate(()=>LearningHubSimulation.flushLocal());await page.reload();
 const win2=page.locator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"]');await win2.waitFor();
 const frame2=()=>page.frames().find(f=>f.url().includes('/10-2-double-slit-lab.html'));
 await page.waitForFunction(()=>{const f=document.querySelector('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');return f?.contentDocument?.querySelector('main:not([inert])')&&f.contentWindow.LearningHubSimulation?.getState().student.name==='QA Student';});
 const restored=await frame2().evaluate(()=>LearningHubSimulation.getState());
 assert.equal(restored.reportOpen,true);assert.equal(restored.missions.completed.length,6);assert.equal(restored.student.className,'Y12');
 assert.equal(restored.missions.first[0][0],false);assert.equal(restored.missions.mastered[0][0],true);
 // Invalid snapshots fail atomically, including scores and identity.
 const invalidChecks=await frame2().evaluate(()=>{
   const saved=LearningHubSimulation.getState(),results=[];
   for(const mutate of [s=>s.identity='other',s=>s.water.x=NaN,s=>s.missions.first[0]=[1],s=>s.missions.completed=[0,0],s=>s.student.name=5,s=>s.missions.frozen=[null]]){
     const bad=structuredClone(saved);mutate(bad);results.push(LearningHubSimulation.restoreState(bad)===false);
   }
   results.push(JSON.stringify(LearningHubSimulation.getState())===JSON.stringify(saved));return results;
 });assert.ok(invalidChecks.every(Boolean));
 const legacyChecks=await frame2().evaluate(()=>{
   const current=LearningHubSimulation.getState(),legacy=structuredClone(current);legacy.version=2;
   delete legacy.student;delete legacy.guideMode;delete legacy.reportOpen;
   delete legacy.missions.answers[2].q2;delete legacy.missions.answers[3].q2;delete legacy.missions.answers[5].q1;
   const accepted=LearningHubSimulation.restoreState(legacy),migrated=LearningHubSimulation.getState();
   const retained=accepted&&migrated.records.length===current.records.length&&migrated.missions.legacyCompleted.length===6&&InterferenceMissions.scores(migrated.missions).firstChecked===0;
   return retained&&LearningHubSimulation.restoreState(current);
 });assert.equal(legacyChecks,true);
 await lab.locator('#report-review').click();
 await lab.locator('#mission-select').selectOption('0');
 assert.equal((await frame2().evaluate(()=>LearningHubSimulation.getState())).missions.first[0][0],false);
 await lab.locator('#smart-mini').click();assert.match(await lab.locator('#smart-guide').getAttribute('class'),/is-mini/);
 await lab.locator('#smart-hide').click();assert.equal(await lab.locator('#smart-guide').isVisible(),false);await lab.locator('#smart-reopen').click();
 // Responsive, finger-sized targets, actual touch P motion (Chromium emulation).
 for(const width of [820,390]){await page.setViewportSize({width,height:1000});assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));}
 await lab.locator('#smart-mini').click();
 await lab.locator('#water-probe').scrollIntoViewIfNeeded();
 const h=await lab.locator('#water-probe').boundingBox();
 assert.ok(h.width>=44&&h.height>=44);
 if(browserName==='chromium'){
   const x=h.x+h.width/2,y=h.y+h.height/2,cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-30}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   assert.ok((await frame2().evaluate(()=>LearningHubSimulation.getState())).water.x>.5);
 }
 await page.screenshot({path:resolve(output,'phone-guide.png'),fullPage:true});
 // IndexedDB failure falls back to the synchronous local copy without losing the report.
 await frame2().evaluate(()=>LearningHubSimulation.flushLocal());
 const fallback=await context.newPage();
 await fallback.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw Error('QA unavailable');}}));
 await fallback.goto(origin+prefix+'content/physics/ipst/wave-optics/10-2-double-slit-lab.html');
 await fallback.locator('main:not([inert])').waitFor();
 assert.equal(await fallback.evaluate(()=>LearningHubSimulation.getState().student.name),'QA Student');
 assert.equal(await fallback.evaluate(()=>InterferenceMissions.scores(DoubleSlitLabBridge.read().missions).mastered),12);
 await fallback.close();
 // Context handoff isolates this local guest work from another account.
 await page.evaluate(()=>{const f=document.querySelector('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');f.contentWindow.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'qa-other'}},location.origin);});
 await page.waitForFunction(()=>{const f=document.querySelector('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');return f?.contentDocument?.querySelector('main:not([inert])')&&f.contentWindow.LearningHubSimulation.getState().identity==='qa-other';});
 assert.equal((await frame2().evaluate(()=>LearningHubSimulation.getState())).student.name,'');
 await page.evaluate(()=>{const f=document.querySelector('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');f.contentWindow.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'guest'}},location.origin);});
 await page.waitForFunction(()=>{const f=document.querySelector('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');return f?.contentDocument?.querySelector('main:not([inert])')&&f.contentWindow.LearningHubSimulation.getState().identity==='guest'&&f.contentWindow.LearningHubSimulation.getState().student.name==='QA Student';});
 assert.equal((await frame2().evaluate(()=>LearningHubSimulation.getState())).missions.completed.length,6);
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,built?'report-built.json':'report-source.json'),JSON.stringify({built,browser:browserName,checks:['12 questions / 6 missions through actual Hub UI','first attempt 11/12 remains after retry','mastery 12/12','stable questions after moving P','C/2m measurement uses student data','report and A4 print media','TH/EN preserves state','local reload restore','atomic invalid snapshot rejection','guest/account isolation','guide repeat/minimise/hide/reopen','390/820px and touch targets','touch P motion'],errors},null,2));
 console.log('PASS Smart Lab Guide: six missions, 12 questions, immutable first scores, report, local restore and touch');
}catch(e){console.error(e);const p=browser?.contexts()[0]?.pages()[0];if(p)await p.screenshot({path:resolve(output,'failure.png')});process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
