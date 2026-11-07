import assert from 'node:assert/strict';
import {waveAssessmentModel as Assessment} from '../public/shared/wave-assessment-progress.js';
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
const output = resolve(root, 'qa-output/wave-mini-sim');
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
 const context=await browser.newContext({viewport:{width:1420,height:1100},hasTouch:true,reducedMotion:'reduce'});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[u.pathname.split('/').at(-1)]||''});return route.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await mkdir(output,{recursive:true});
 await page.goto(origin+prefix+'#content/physics-ipst-wave-optics-10-1-mini-sim');await page.locator('#guest-button').click();
 const win=page.locator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-1-mini-sim"]');await win.waitFor();await win.locator('.is-maximize').click();
 const lab=page.frameLocator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-1-mini-sim"] iframe');
 await lab.locator('#param-angle').waitFor();const frame=page.frames().find(f=>f.url().includes('/10-1-wave-properties-mini-sim.html'));
 const state=()=>frame.evaluate(()=>LearningHubSimulation.getState());
 const setRange=async(key,value)=>{await lab.locator('#param-'+key).evaluate((input,value)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));},String(value));};
 const select=async(key,value)=>lab.locator('#param-'+key).selectOption(String(value));
 const mode=async key=>lab.locator('#tab-'+key).click();
 const shot=async name=>{await page.waitForTimeout(100);await page.screenshot({path:resolve(output,name+'.png')});};

 const fill=async(key,index)=>{for(const p of Assessment.parts(key,index)){const input=lab.locator('#assessment-'+p.key);if(p.type==='choice')await input.selectOption(p.answer);else await input.fill(String(p.answer));}};
 const open=async()=>{if(!await lab.locator('#mission-answer-panel').isVisible())await lab.locator('#mission-answer-toggle').click();};
 await open();await lab.locator('#mission-check').click();assert.match(await lab.locator('#mission-result').innerText(),/0\/3/);assert.equal(await lab.locator('#mission-next').isDisabled(),true);
 for(const key of ['reflection','refraction','interference','diffraction']){
   await mode(key);
   for(const index of [0,1]){
     if(index===1)await lab.locator('#mission-next').click();await open();assert.equal(await lab.locator('[data-main-question]').count(),3);
     await fill(key,index);const answers=structuredClone((await state()).work[key].mission.answers[index]);await lab.locator('#mission-b').click();assert.deepEqual((await state()).work[key].mission.answers[index],answers);
     await lab.locator('#mission-check').click();assert.match(await lab.locator('#mission-result').innerText(),/5\/5/);assert.equal(await lab.locator('.answer-feedback.correct').count(),Assessment.parts(key,index).length);
     assert.equal(await lab.locator('#readouts').isVisible(),false);assert.equal(await lab.locator('[id^="solution-"]').count(),0);
   }
 }
 assert.match(await lab.locator('#assessment-progress').innerText(),/24\/24/);assert.match(await lab.locator('#assessment-progress').innerText(),/40\/40/);
 await lab.locator('#assessment-q6-b').fill('0');await lab.locator('#mission-check').click();assert.match(await lab.locator('#assessment-progress').innerText(),/38\/40/);assert.match(await lab.locator('#assessment-progress').innerText(),/40\/40/);assert.match(await lab.locator('#assessment-q6-b').inputValue(),/^0$/);
 const latest=structuredClone((await state()).work.diffraction.mission.answers);await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual((await state()).work.diffraction.mission.answers,latest);assert.equal(await lab.locator('#assessment-q6-b').inputValue(),'0');
 await win.locator('[data-window-language="th"]').click();await lab.locator('html[lang="th"]').waitFor();
 await lab.locator('#reset').click();assert.deepEqual((await state()).work.diffraction.mission.answers,latest);
 await page.reload();await lab.locator('#assessment-progress').waitFor();assert.match(await lab.locator('#assessment-progress').innerText(),/40\/40/);
 for(const width of [1024,768,674,390]){await page.setViewportSize({width,height:1100});for(const key of ['reflection','refraction','interference','diffraction']){await mode(key);await open();assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1),key+' overflows '+width);}}
 await mode('reflection');await lab.locator('#mission-select').selectOption('0');await open();await lab.locator('#assessment-q3-a').fill('');const input=await lab.locator('#assessment-q3-a').boundingBox();assert.ok(input.height>=44);assert.equal(await lab.locator('#assessment-q3-a').getAttribute('inputmode'),'decimal');
 await lab.locator('#mission-answer-toggle').click();await win.locator('.window-simulation-guide').click();const reader=page.frameLocator('[data-tool-id="simulation-guide-content-simulation-physics-ipst-wave-optics-10-1-mini-sim"] iframe');await reader.locator('[data-simulation-guide]').waitFor();assert.equal(await reader.locator('button').count(),0);assert.equal(await reader.locator('[id^="guide-reading-"]').count(),4);
 await reader.locator('a[href="#guide-reading-diffraction"]').first().click();assert.ok(await reader.locator('#guide-reading-diffraction').evaluate(n=>Math.abs(n.getBoundingClientRect().top)<60));
 assert.deepEqual(errors,[]);assert.doesNotMatch(await lab.locator('main').innerText(),/NaN|Infinity|undefined/);
 await writeFile(resolve(output,'missions-report.json'),JSON.stringify({built,checks:['24 multipart questions','8 missions checked','40 total practice points','partial credit and retained best','A/B and reset retain responses','local reload resumes work','TH/EN retains answers','numeric decimal keypad and 44px controls','4 responsive widths','reading-only guide and native contents'],errors},null,2));
 console.log('PASS wave assessment: 24 questions, partial credit, persistence, bilingual UI and reading guide');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
