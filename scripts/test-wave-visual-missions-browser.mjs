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

 const finish=async answers=>{await lab.locator('#mission-answer-toggle').click();for(let i=0;i<answers.length;i++){const input=lab.locator('#mission-q'+i);if(await input.evaluate(n=>n.tagName)==='SELECT')await input.selectOption(String(answers[i]));else await input.fill(String(answers[i]));}await lab.locator('#mission-check').click();assert.match(await lab.locator('#mission-result').innerText(),/ผ่านภารกิจ/);};
 const cases=async()=>{await lab.locator('#mission-a').click();await lab.locator('#mission-b').click();};
 const next=async()=>{await lab.locator('#mission-next').click();if(!(await lab.locator('#mission-answer-panel').isHidden()))await lab.locator('#mission-answer-toggle').click();};
 for(const key of ['reflection','refraction','interference','diffraction']){const v=(await state()).work[key].visual;assert.ok(v.field&&v.fronts&&v.variables);}
 const defaultImage=await lab.locator('#bench').evaluate(n=>n.toDataURL());await lab.locator('#layer-fronts').uncheck();await page.waitForTimeout(80);assert.notEqual(await lab.locator('#bench').evaluate(n=>n.toDataURL()),defaultImage);await lab.locator('#layer-field').uncheck();await page.waitForTimeout(80);const blankImage=await lab.locator('#bench').evaluate(n=>n.toDataURL());await lab.locator('#layer-field').check();await page.waitForTimeout(80);assert.notEqual(await lab.locator('#bench').evaluate(n=>n.toDataURL()),blankImage);await lab.locator('#layer-fronts').check();
 await setRange('angle',50);await finish([50,'normal']);await next();await cases();await finish([30,'normal']);
 await mode('refraction');await cases();await finish([25.37,'same']);await next();await cases();await finish([41.81,'no']);
 await mode('interference');await cases();assert.ok(Number(await lab.locator('#mini-screen-diagram').getAttribute('data-intensity'))<1e-20);assert.ok(JSON.parse(await lab.locator('#mini-screen-diagram').getAttribute('data-orders')).every(p=>Math.abs(p.y)>0));const staticProfile=await lab.locator('#mini-screen-diagram').evaluate(n=>n.toDataURL());await lab.locator('#play').click();await page.waitForTimeout(200);await lab.locator('#play').click();assert.equal(await lab.locator('#mini-screen-diagram').evaluate(n=>n.toDataURL()),staticProfile);await finish(['antinode','node']);await next();
 await select('probe','side');await finish([1.5,'node']);
 // Graph follows the full-precision P; moving P invalidates old live answers.
 await lab.locator('#mini-probe').focus();await lab.locator('#mini-probe').press('ArrowUp');let st=await state();assert.equal(st.work.interference.params.probe,'custom');assert.deepEqual(st.work.interference.mission.answers[1],{});assert.equal(Number(await lab.locator('#mini-screen-diagram').getAttribute('data-position')),st.work.interference.visual.x);
 await lab.locator('#layer-nodes').check();await lab.locator('#layer-antinodes').check();
 await lab.locator('#bench').scrollIntoViewIfNeeded();await shot('07-ripples-and-loci');await lab.locator('#mini-screen').scrollIntoViewIfNeeded();await shot('08-linked-profile');
 await mode('diffraction');await cases();await finish(['more',700]);await next();await cases();await finish(['narrow',6.667]);
 for(const key of ['reflection','refraction','interference','diffraction'])assert.deepEqual((await state()).work[key].mission.completed,[true,true]);
 await lab.locator('#mission-q1').fill('wrong');await lab.locator('#mission-check').click();assert.match(await lab.locator('#mission-result').innerText(),/ต้องแก้/);await lab.locator('#mission-retry').click();assert.equal(await lab.locator('#mission-q1').inputValue(),'');
 await lab.locator('#mission-q1').fill('6.667');const before=await state();await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual(await state(),before);assert.equal(await lab.locator('#mission-q1').inputValue(),'6.667');await win.locator('[data-window-language="th"]').click();
 const snap=await state();for(const type of ['visual','mission','answer','probe']){assert.equal(await frame.evaluate(({snap,type})=>{const s=structuredClone(snap);if(type==='visual')s.work.interference.visual.L=Infinity;if(type==='mission')s.work.reflection.mission.completed='bad';if(type==='answer')s.work.refraction.mission.answers[0].q0={};if(type==='probe')s.work.interference.params.probe='bad';return LearningHubSimulation.restoreState(s);},{snap,type}),false);}
 assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),snap),true);
 // Legacy version-1 states gain visual/mission defaults without losing settings.
 const legacy=structuredClone(snap);legacy.version=1;for(const w of Object.values(legacy.work)){delete w.visual;delete w.mission;if(w.params.probe==='custom')w.params.probe='center';}assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),legacy),true);assert.ok((await state()).work.reflection.visual.fronts);
 for(const width of [820,390]){await page.setViewportSize({width,height:1100});for(const key of ['reflection','refraction','interference','diffraction']){await mode(key);await lab.locator('#bench').scrollIntoViewIfNeeded();assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1),`${key} overflows ${width}`);await shot('09-'+width+'-'+key);} }
 await mode('interference');await lab.locator('#mini-probe').scrollIntoViewIfNeeded();const handle=await lab.locator('#mini-probe').boundingBox();await page.touchscreen.tap(handle.x+22,handle.y+22);assert.equal(await lab.locator('#mini-probe').evaluate(n=>n.getBoundingClientRect().width),44);
 const differences=await frame.evaluate(()=>{const result={};for(const mode of ['interference','diffraction']){const s=LearningHubSimulation.getState().work[mode],canvas=document.getElementById('bench'),ctx=canvas.getContext('2d');WaveMiniView.invalidate();WaveMiniView.draw(canvas,mode,s.params,0,s.visual);const before=ctx.getImageData(0,0,canvas.width,canvas.height).data;const period=mode==='interference'?s.params.wavelength/3:s.params.wavelength/600;WaveMiniView.draw(canvas,mode,s.params,1000*period,s.visual);const after=ctx.getImageData(0,0,canvas.width,canvas.height).data;let diff=0;for(let i=0;i<before.length;i++)diff+=Math.abs(before[i]-after[i]);result[mode]=diff/before.length;}return result;});for(const diff of Object.values(differences))assert.ok(diff<.3,JSON.stringify(differences));
 assert.deepEqual(errors,[]);assert.doesNotMatch(await lab.locator('main').innerText(),/NaN|Infinity|undefined/);
 await writeFile(resolve(output,'missions-report.json'),JSON.stringify({built,checks:['8 missions answered in real Hub','live answers invalidated on P move','phase-180 dark centre and shifted orders','P and intensity profile linked','default field + fronts in 4 modes','node/antinode layers','TH/EN preserves answers/progress','atomic invalid state rejection','version-1 migration','820/390px layouts','44px touch P'],errors},null,2));console.log('PASS wave visual missions in real Hub: all 8 tasks, live P, phase, profiles, state and mobile');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
