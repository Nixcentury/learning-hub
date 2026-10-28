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
const output = resolve(root, 'qa-output/guided-interference');
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
 const context=await browser.newContext({viewport:{width:1420,height:1150},hasTouch:true});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[u.pathname.split('/').at(-1)]||''});return route.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await mkdir(output,{recursive:true});
 await page.goto(origin+prefix+'#content/physics-ipst-wave-optics-10-2-double-slit-lab');await page.locator('#guest-button').click();
 const win=page.locator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"]');await win.waitFor();await win.locator('.is-maximize').click();
 const lab=page.frameLocator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');await lab.locator('#water-play').waitFor();
 const frame=page.frames().find(f=>f.url().includes('/10-2-double-slit-lab.html')),state=()=>frame.evaluate(()=>LearningHubSimulation.getState());
 const answer=async(q,value)=>lab.locator(`#mission-questions input[name="mission-${(await state()).missions.current}-q${q}"][value="${value}"]`).check();
 const open=async()=>{if(!(await lab.locator('#mission-answer').getAttribute('open')!==null))await lab.locator('#mission-answer > summary').click();};
 const passed=async count=>{await lab.locator('#mission-check').click();assert.equal((await state()).missions.completed.length,count);assert.match(await lab.locator('#mission-feedback').innerText(),/ผ่านภารกิจ|Mission completed/);};
 const shot=async name=>{await lab.locator('#water-stage').screenshot({path:resolve(output,name+'.png')});};
 const setWater=async(key,value)=>lab.locator('#water-'+key).evaluate((n,v)=>{n.value=v;n.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
 assert.equal((await state()).version,2);assert.equal((await state()).view,'water');assert.equal(await lab.locator('#mission-check').isDisabled(),true);
 await lab.locator('#water-play').click();await page.waitForTimeout(100);await lab.locator('#water-play').click();await open();await answer(0,'node');await lab.locator('#mission-check').click();assert.equal((await state()).missions.completed.length,0);assert.match(await lab.locator('#mission-feedback').innerText(),/ลองใหม่/);
 await answer(0,'antinode');await passed(1);await lab.locator('#mission-next').click();assert.equal((await state()).missions.current,1);
 await lab.locator('#water-phase').selectOption('180');await lab.locator('#layer-nodes').check();await lab.locator('#water-play').click();await lab.locator('#water-play').click();await shot('01-opposite-phase-nodes');await open();await answer(0,'node');await passed(2);
 await lab.locator('#mission-next').click();await lab.locator('#layer-paths').check();await lab.locator('#layer-variables').check();await lab.locator('#layer-formulas').check();await lab.locator('#water-example').click();
 const example=await frame.evaluate(()=>InterferenceWater.geometry(LearningHubSimulation.getState().water));assert.ok(Math.abs(example.delta-1.5)<1e-8);await lab.locator('#layer-antinodes').check();await lab.locator('#layer-fronts').uncheck();assert.equal((await state()).water.layers.antinodes,true);assert.equal((await state()).water.layers.fronts,false);await shot('02-selected-point-paths');await lab.locator('#layer-fronts').check();
 await open();await lab.locator('#mission-number-0').fill('1.5');await answer(1,'node');await passed(3);
 // A free point is allowed to be between loci; it must not be rounded to a node.
 await setWater('x',.9);assert.equal((await state()).missions.attempted[2],false);const between=await frame.evaluate(()=>InterferenceWater.geometry(LearningHubSimulation.getState().water));assert.equal(between.kind,'between');await lab.locator('#mission-number-0').fill(between.delta.toFixed(4));await answer(1,'between');await passed(3);
 await lab.locator('#mission-next').click();await lab.locator('#mission-near').click();const near=await frame.evaluate(()=>InterferenceWater.geometry(LearningHubSimulation.getState().water));await lab.locator('#mission-far').click();const far=await frame.evaluate(()=>InterferenceWater.geometry(LearningHubSimulation.getState().water));assert.ok(Math.abs(far.angular-far.delta)<Math.abs(near.angular-near.delta));assert.match(await lab.locator('#water-formulas').innerText(),/d\|x\|\/L/);await shot('03-far-geometry');
 await open();await answer(0,'far');await answer(1,'small');await passed(4);
 const langState=await state();await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual(await state(),langState);assert.match(await lab.locator('#mission-feedback').innerText(),/Mission completed/);
 await lab.locator('#mission-next').click();assert.equal((await state()).view,'light');
 async function measure(side,target){await lab.locator('#handle-'+side).scrollIntoViewIfNeeded();const st=await state(),h=await lab.locator('#handle-'+side).boundingBox(),o=await lab.locator('#overlay').boundingBox(),x=h.x+h.width/2,y=h.y+h.height/2,dx=(target-st.cursors[side])*9*st.zoom*o.width/800;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:6});await page.mouse.up();}
 for(const [preset,value] of [['A',5.32],['B',2.66],['C',3.25]]){await lab.locator(`[data-preset="${preset}"]`).click();await measure('left',-value);await measure('right',value);await lab.locator('#record').click();}
 assert.equal((await state()).records.length,3);await open();await answer(0,'half');await answer(1,'C');await passed(5);await lab.locator('#mission-next').click();await open();await lab.locator('#mission-number-0').fill('532');await lab.locator('#mission-check').click();assert.equal((await state()).missions.completed.length,5);await lab.locator('#mission-number-0').fill('650');await passed(6);
 const completed=await state();assert.deepEqual(completed.missions.completed,[0,1,2,3,4,5]);
 // Both optical phase cases, and book presets explicitly restore 0 degrees.
 const centre=()=>lab.locator('#pattern').evaluate(n=>Array.from(n.getContext('2d').getImageData(400,120,1,1).data));const bright=await centre();await lab.locator('#light-phase').selectOption('180');const dark=await centre();assert.ok(dark[0]+dark[1]+dark[2]<bright[0]+bright[1]+bright[2]);assert.match(await lab.locator('#light-phase-note').innerText(),/phase shifter/);await lab.locator('[data-preset="A"]').click();assert.equal((await state()).lightPhase,0);
 // Additional state validators and legacy version-1 migration.
 const snapshot=await state();for(const type of ['water','mission','answer','phase'])assert.equal(await frame.evaluate(({snapshot,type})=>{const s=structuredClone(snapshot);if(type==='water')s.water.L=NaN;if(type==='mission')s.missions.completed=[0,0];if(type==='answer')s.missions.answers=[];if(type==='phase')s.lightPhase=90;return LearningHubSimulation.restoreState(s);},{snapshot,type}),false);assert.deepEqual(await state(),snapshot);
 assert.equal(await frame.evaluate(s=>{s.version=1;delete s.water;delete s.missions;delete s.view;delete s.lightPhase;return LearningHubSimulation.restoreState(s);},snapshot),true);assert.equal((await state()).view,'light');assert.equal((await state()).missions.enabled,false);assert.equal((await state()).records.length,3);assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),snapshot),true);
 await frame.evaluate(()=>window.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'bad'}},location.origin));assert.equal(await lab.locator('html').getAttribute('lang'),'en');
 await lab.locator('#view-water').click();await lab.locator('#guided-toggle').click();for(const width of [820,390]){await page.setViewportSize({width,height:1150});assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));}
 await lab.locator('#water-probe').scrollIntoViewIfNeeded();const st=await state(),h=await lab.locator('#water-probe').boundingBox(),c=await lab.locator('#water-canvas').boundingBox();assert.ok(h.width>=44&&h.height>=44);
 const x=h.x+h.width/2,y=h.y+h.height/2,dy=-(2-st.water.x)*(800/68)*c.height/420,cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+dy*i/8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();assert.ok(Math.abs((await state()).water.x-2)<.04);
 await lab.locator('#water-probe').focus();await lab.locator('#water-probe').press('ArrowUp');assert.ok(Math.abs((await state()).water.x-2.1)<.04);await win.locator('[data-window-language="th"]').click();await lab.locator('html[lang="th"]').waitFor();await shot('04-phone-water-th');
 assert.equal((await state()).missions.completed.length,6);assert.doesNotMatch(await lab.locator('#water-formulas').textContent(),/NaN|Infinity|undefined/);
 // A genuine parent-origin identity change clears only this in-memory lab.
 await page.evaluate(()=>{const f=document.querySelector('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');f.contentWindow.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'qa-other'}},location.origin);});await frame.waitForFunction(()=>LearningHubSimulation.getState().identity==='qa-other');assert.equal((await state()).records.length,0);assert.equal((await state()).missions.completed.length,0);
 assert.deepEqual(errors,[]);await writeFile(resolve(output,built?'report-built.json':'report-source.json'),JSON.stringify({built,browser:browserName,checks:['all six missions completed through UI','wrong answer hints and retry','phase-0 and phase-180 central loci','free point and exact example','between-locus classification','actual vs far vs small-angle comparison','A/B/C measurements','measurement-derived grading','TH/EN keeps answers and progress','optical pi shifter and preset reset','atomic restore and legacy migration','untrusted messages ignored','820/390px layouts','touch P dragging and keyboard','identity change clears work'],errors},null,2));console.log('PASS guided interference: all six missions, water geometry, phases, grading, optical measurements and mobile touch');
}catch(e){console.error(e);const p=browser?.contexts()[0]?.pages()[0];if(p)await p.screenshot({path:resolve(output,'failure.png')});process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
