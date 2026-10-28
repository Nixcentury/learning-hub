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
const output = resolve(root, 'qa-output/wave-mini-sim');
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
 assert.equal((await state()).running,false);assert.equal(await lab.locator('#formula-reflection').getAttribute('open'),null);assert.equal(await lab.locator('#problem-reflection').getAttribute('open'),null);
 await lab.locator('#play').click();await page.waitForTimeout(180);await lab.locator('#play').click();const paused=(await state()).time;assert.ok(paused>0);await page.waitForTimeout(180);assert.equal((await state()).time,paused);
 await lab.locator('#formula-reflection > summary').click();await lab.locator('#problem-reflection > summary').click();assert.equal(await lab.locator('#solution-reflection').getAttribute('open'),null);
 await lab.locator('#solution-reflection > summary').click();await setRange('angle',55);
 assert.match(await lab.locator('#readouts').innerText(),/55°/);assert.match(await lab.locator('#solution-body-reflection').textContent(),/90° − 35° = 55°/);assert.equal(await lab.locator('#solution-reflection').getAttribute('open'),null);assert.notEqual(await lab.locator('#formula-reflection').getAttribute('open'),null);
 await shot('01-reflection-th');
 await mode('refraction');await select('n1',1.5);await select('n2',1);await setRange('angle',60);
 assert.match(await lab.locator('#readouts').innerText(),/สะท้อนกลับหมด/);assert.match(await lab.locator('#problem-body-refraction').textContent(),/มุมวิกฤต/);assert.match(await lab.locator('#solution-body-refraction').textContent(),/41.8/);
 await setRange('angle',30);assert.match(await lab.locator('#readouts').innerText(),/48.6°/);await select('n1',1);await select('n2',1.5);await setRange('angle',30);assert.match(await lab.locator('#readouts').innerText(),/19.5°/);assert.match(await lab.locator('#readouts').innerText(),/400.0 nm/);
 await lab.locator('#formula-refraction > summary').click();await shot('02-refraction-th');
 await mode('interference');assert.match(await lab.locator('#readouts').innerText(),/ปฏิบัพ/);await select('phase',180);assert.match(await lab.locator('#readouts').innerText(),/บัพ/);
 await select('probe','side');assert.match(await lab.locator('#readouts').innerText(),/ปฏิบัพ/);assert.match(await lab.locator('#readouts').innerText(),/0.50/);await select('phase',0);assert.match(await lab.locator('#readouts').innerText(),/บัพ/);
 await setRange('wavelength',4);await setRange('separation',4);await lab.locator('#problem-interference > summary').click();await lab.locator('#solution-interference > summary').click();await shot('03-interference-th');
 await mode('diffraction');assert.equal(await lab.locator('#param-opening').isDisabled(),true);
 const angle=()=>frame.evaluate(()=>{const s=LearningHubSimulation.getState();return WaveMiniModel.diffract(s.work.diffraction.params).angle;});
 const fixedOpening=(await state()).work.diffraction.params.opening;await setRange('wavelength',400);const short=await angle();await setRange('wavelength',700);assert.ok((await angle())>short);assert.equal((await state()).work.diffraction.params.opening,fixedOpening);
 await select('compare','opening');assert.equal(await lab.locator('#param-wavelength').isDisabled(),true);assert.equal(await lab.locator('#param-opening').isEnabled(),true);
 const fixedWavelength=(await state()).work.diffraction.params.wavelength;await setRange('opening',4);const wide=await angle();await setRange('opening',.8);assert.ok((await angle())>wide);assert.equal((await state()).work.diffraction.params.wavelength,fixedWavelength);
 await lab.locator('#formula-diffraction > summary').click();await lab.locator('#problem-diffraction > summary').click();assert.equal(await lab.locator('#solution-diffraction').getAttribute('open'),null);
 await lab.locator('#solution-diffraction > summary').click();assert.match(await lab.locator('#solution-body-diffraction').textContent(),/700 nm/);await shot('04-diffraction-th');
 // Parent toolbar language changes preserve mode, parameters and open panels.
 const beforeLang=await state();await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual(await state(),beforeLang);assert.match(await lab.locator('#formula-body-diffraction').innerText(),/larger λ → larger angle θ/);assert.match(await lab.locator('#solution-body-diffraction').textContent(),/increases|decreases/);await shot('05-diffraction-en');
 const savedDiffraction=(await state()).work.diffraction;await mode('reflection');assert.equal((await state()).work.reflection.params.angle,55);assert.notEqual(await lab.locator('#formula-reflection').getAttribute('open'),null);
 await mode('diffraction');assert.deepEqual((await state()).work.diffraction,savedDiffraction);
 // State validation is atomic; malformed values must not affect the picture.
 const snapshot=await state();for(const type of ['identity','nan','enum','missing'])assert.equal(await frame.evaluate(({snapshot,type})=>{const s=structuredClone(snapshot);if(type==='identity')s.identity='another-user';if(type==='nan')s.work.refraction.params.angle=NaN;if(type==='enum')s.work.diffraction.params.compare='bad';if(type==='missing')delete s.work.interference;return LearningHubSimulation.restoreState(s);},{snapshot,type}),false);
 assert.deepEqual(await state(),snapshot);assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),snapshot),true);assert.deepEqual(await state(),snapshot);
 await frame.evaluate(()=>{window.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'bad'}},location.origin);window.dispatchEvent(new MessageEvent('message',{source:parent,origin:'https://invalid.example',data:{type:'learning-hub-context',language:'th'}}));});assert.equal(await lab.locator('html').getAttribute('lang'),'en');assert.deepEqual(await state(),snapshot);
 // Keyboard tab selection and responsive layouts inside the actual Hub window.
 await lab.locator('#tab-diffraction').focus();await lab.locator('#tab-diffraction').press('Home');assert.equal((await state()).mode,'reflection');await lab.locator('#tab-reflection').press('ArrowRight');assert.equal((await state()).mode,'refraction');
 for(const width of [820,390]){
   await page.setViewportSize({width,height:1100});
   for(const key of ['reflection','refraction','interference','diffraction']){await mode(key);assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1),`${key} overflows at ${width}`);}
 }
 await lab.locator('#tab-reflection').tap();await lab.locator('#param-angle').focus();await lab.locator('#param-angle').press('ArrowRight');assert.equal((await state()).work.reflection.params.angle,56);
 await lab.locator('#tab-diffraction').tap();await win.locator('[data-window-language="th"]').click();await lab.locator('html[lang="th"]').waitFor();assert.equal((await state()).work.diffraction.params.opening,.8);
 await shot('06-phone-diffraction-th');await lab.locator('#reset').evaluate(n=>n.scrollIntoView({block:'center'}));await lab.locator('#reset').tap();await frame.waitForFunction(()=>LearningHubSimulation.getState().work.diffraction.params.opening===1.8);assert.equal((await state()).work.diffraction.params.opening,1.8);assert.equal((await state()).work.diffraction.formula,false);assert.equal((await state()).work.reflection.params.angle,56);
 assert.deepEqual(errors,[]);assert.doesNotMatch(await lab.locator('main').innerText(),/NaN|Infinity|undefined/);
 await writeFile(resolve(output,'report.json'),JSON.stringify({built,browser:browserName,checks:['four modes','play and pause','reduced motion','independent formula/problem/solution panels','updated calculation hides old solution','Snell and critical angle','centre and off-centre interference in both phases','two locked diffraction comparisons','TH/EN preserves full state','per-mode settings and reset','atomic restore validation','untrusted messages ignored','keyboard tabs and sliders','820/390px layouts and phone touch'],errors},null,2));
 console.log('PASS wave mini sim in real Hub: four modes, physics, formula/problem controls, state, language, keyboard and mobile touch');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
