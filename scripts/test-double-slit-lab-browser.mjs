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
const output = resolve(root, 'qa-output/double-slit-lab');
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
 const lab=page.frameLocator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');await lab.locator('#view-light').click();await lab.locator('#guided-toggle').click();await lab.locator('#handle-left').waitFor();
 const frame=page.frames().find(f=>f.url().includes('/10-2-double-slit-lab.html')),state=()=>frame.evaluate(()=>LearningHubSimulation.getState());
 const close=(a,b,t=.03)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
 const shot=async name=>{await frame.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);await page.screenshot({path:resolve(output,name+'.png')});};
 async function dragTo(side,target,touch=false){
   const s=await state();await lab.locator('#handle-'+side).scrollIntoViewIfNeeded();
   const handle=await lab.locator('#handle-'+side).boundingBox(),overlay=await lab.locator('#overlay').boundingBox();
   const x=handle.x+handle.width/2,y=handle.y+handle.height/2,start=Math.max(-40/s.zoom,Math.min(40/s.zoom,s.cursors[side])),dx=(target-start)*9*s.zoom*overlay.width/800;
   if(touch){
     const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
     for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y}]});
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   }else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:8});await page.mouse.up();}
   close((await state()).cursors[side],target);
 }
 const width=s=>s.cursors.right-s.cursors.left;
 assert.equal((await state()).records.length,0);assert.equal(await lab.locator('#record').isDisabled(),true);
 for(const key of ['formula','analysis','exercise','solution'])assert.equal(await lab.locator('#'+key).getAttribute('open'),null);
 assert.match(await lab.locator('#record-help').innerText(),/ทั้ง L และ R/);await shot('01-initial-th');
 const patternA=await lab.locator('#pattern').evaluate(n=>n.toDataURL());
 await dragTo('left',-5.32);assert.equal(await lab.locator('#record').isDisabled(),true);await dragTo('right',5.32);assert.equal(await lab.locator('#record').isEnabled(),true);
 const beforeZoom=await state();await lab.locator('#zoom').selectOption('4');assert.deepEqual((await state()).cursors,beforeZoom.cursors);assert.deepEqual((await state()).moved,beforeZoom.moved);await lab.locator('#zoom').selectOption('1');
 await lab.locator('#record').click();assert.equal((await state()).records.length,1);assert.equal(await lab.locator('#record').isDisabled(),true);const recordedA=(await state()).records[0];
 await lab.locator('[data-preset="B"]').click();assert.equal((await state()).zoom,1);assert.deepEqual((await state()).records[0],recordedA);
 const patternB=await lab.locator('#pattern').evaluate(n=>n.toDataURL());assert.notEqual(patternB,patternA);
 await dragTo('left',-2.66);await dragTo('right',2.66);await lab.locator('#record').click();
 await lab.locator('[data-preset="C"]').click();await dragTo('left',-3.25);await dragTo('right',3.25);await lab.locator('#record').click();
 const abc=(await state()).records;close(width(abc[0])/width(abc[1]),2,.01);assert.ok(width(abc[2])>width(abc[1]));assert.equal(abc[2].config.color,'red');await shot('02-c-red-th');
 await lab.locator('#distance').evaluate(input=>{input.value='2';input.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await lab.locator('#preset-name').innerText(),/กำหนดเอง/);assert.equal(await lab.locator('#record').isDisabled(),true);
 await dragTo('left',-6.5);await dragTo('right',6.5);await lab.locator('#record').click();close(width((await state()).records[3]),2*width(abc[2]));assert.deepEqual((await state()).records.slice(0,3),abc);
 await lab.locator('#formula > summary').click();await lab.locator('#analysis > summary').click();assert.match(await lab.locator('#analysis-body').innerText(),/13.000 mm/);
 await lab.locator('#exercise > summary').click();assert.equal(await lab.locator('#solution').getAttribute('open'),null);await lab.locator('#solution > summary').click();assert.match(await lab.locator('#solution-body').innerText(),/650.0 nm/);assert.match(await lab.locator('#solution-body').innerText(),/2 เท่า/);
 const beforeLang=await state();await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual(await state(),beforeLang);assert.match(await lab.locator('#analysis-body').innerText(),/13.000 mm/);await shot('03-en-overview');
 // Delete one immutable historical row, retaining the other experiments.
 await lab.locator('[data-record-id="2"] button').click();assert.deepEqual((await state()).records.map(r=>r.id),[1,3,4]);assert.equal((await state()).solution,false);
 // Crossing markers is allowed for exploration, but not for recording a width.
 await dragTo('left',7);await dragTo('right',6);assert.equal(await lab.locator('#record').isDisabled(),true);assert.match(await lab.locator('#record-help').innerText(),/left of R/);
 await lab.locator('#reset-measurement').click();assert.equal((await state()).records.length,3);assert.equal((await state()).config.distance,2);assert.deepEqual((await state()).cursors,{left:-8,right:8});
 await lab.locator('#handle-left').focus();await lab.locator('#handle-left').press('ArrowRight');close((await state()).cursors.left,-7.9,.001);await lab.locator('#handle-left').press('Shift+ArrowRight');close((await state()).cursors.left,-7.89,.001);
 await lab.locator('[data-side="right"][data-delta="-0.1"]').click();close((await state()).cursors.right,7.9,.001);assert.equal(await lab.locator('#record').isEnabled(),true);
 await lab.locator('#analysis > summary').click();assert.match(await lab.locator('#analysis-body').innerText(),/15.79 mm/);
 // Valid snapshot restores exactly; rejection is atomic and identity-bound.
 const snapshot=await state();for(const type of ['identity','nan','order','duplicate','zoom'])assert.equal(await frame.evaluate(({snapshot,type})=>{const s=structuredClone(snapshot);if(type==='identity')s.identity='other';if(type==='nan')s.config.distance=NaN;if(type==='order')s.records[0].cursors.left=40;if(type==='duplicate')s.records.push(s.records[0]);if(type==='zoom')s.zoom=3;return LearningHubSimulation.restoreState(s);},{snapshot,type}),false);
 assert.deepEqual(await state(),snapshot);assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),snapshot),true);assert.deepEqual(await state(),snapshot);
 await frame.evaluate(()=>{window.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'bad'}},location.origin);window.dispatchEvent(new MessageEvent('message',{source:parent,origin:'https://invalid.example',data:{type:'learning-hub-context',language:'th'}}));});assert.equal(await lab.locator('html').getAttribute('lang'),'en');assert.deepEqual(await state(),snapshot);
 for(const viewportWidth of [820,390]){await page.setViewportSize({width:viewportWidth,height:1150});assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));for(const side of ['left','right']){const b=await lab.locator('#handle-'+side).boundingBox();assert.ok(b.width>=44&&b.height>=44);}}
 // Real Chromium touch events: drag both handles at phone width and 4x zoom.
 await lab.locator('[data-preset="A"]').tap();await lab.locator('#zoom').selectOption('4');await dragTo('left',-5.32,true);await dragTo('right',5.32,true);assert.equal(await lab.locator('#record').isEnabled(),true);await lab.locator('#record').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await lab.locator('#record').tap();await frame.waitForFunction(()=>LearningHubSimulation.getState().records.length===4,{},{timeout:3000});assert.equal((await state()).records.length,4);
 const physicalBeforeZoom=(await state()).cursors;await lab.locator('#zoom').selectOption('1');assert.deepEqual((await state()).cursors,physicalBeforeZoom);await win.locator('[data-window-language="th"]').click();await lab.locator('html[lang="th"]').waitFor();await shot('04-phone-th');
 // Exact measure uses full model minima, records provenance, and fits both markers.
 await page.setViewportSize({width:1420,height:1150});await lab.locator('[data-preset="A"]').click();await lab.locator('#zoom').selectOption('4');
 await lab.locator('#distance').evaluate(input=>{input.value='2';input.dispatchEvent(new Event('input',{bubbles:true}));});await lab.locator('#color').selectOption('red');await lab.locator('#light-phase').selectOption('180');await lab.locator('#exact-measurement').click();
 const exact=await state();assert.equal(exact.autoMeasured,true);assert.equal(exact.zoom,1);close(exact.cursors.left,0,1e-8);close(exact.cursors.right,2000*Math.tan(Math.asin(650e-9/50e-6)),1e-8);assert.equal(await lab.locator('#record').isEnabled(),true);assert.ok(Number(await lab.locator('#light-screen-diagram').getAttribute('data-intensity'))<1e-20);close(Number(await lab.locator('#light-screen-diagram').getAttribute('data-position')),exact.cursors.right,1e-8);
 await lab.locator('#record').click();assert.equal((await state()).records.at(-1).source,'model');assert.match(await lab.locator('#records-body tr').last().innerText(),/แบบจำลอง/);
 await lab.locator('#handle-right').focus();await lab.locator('#handle-right').press('ArrowRight');assert.equal((await state()).autoMeasured,false);
 await lab.locator('[data-preset="B"]').click();await lab.locator('#exact-measurement').click();const inPhase=await state();close(inPhase.cursors.left,-inPhase.cursors.right,1e-8);close(inPhase.cursors.right,1000*Math.tan(Math.asin(.5*532e-9/100e-6)),1e-8);await lab.locator('#record').click();
 await lab.locator('#light-screen-diagram').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,'05-exact-profile.png')});
 const saved=await state();await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual(await state(),saved);assert.match(await lab.locator('#measurement-source').innerText(),/model minima/);assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),saved),true);assert.deepEqual(await state(),saved);
 await lab.locator('#exact-measurement').evaluate(n=>n.scrollIntoView({block:'center'}));const desktopGraph=await lab.locator('#light-screen-diagram').evaluate(n=>n.toDataURL());await page.setViewportSize({width:390,height:1150});await page.waitForTimeout(150);assert.notEqual(await lab.locator('#light-screen-diagram').evaluate(n=>n.toDataURL()),desktopGraph);await lab.locator('#light-screen-diagram').screenshot({path:resolve(output,'06-phone-profile.png')});await lab.locator('#exact-measurement').evaluate(n=>n.scrollIntoView({block:'center'}));await lab.locator('#exact-measurement').tap();await frame.waitForFunction(()=>LearningHubSimulation.getState().moved.left);assert.equal((await state()).autoMeasured,true);assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
 assert.deepEqual(errors,[]);assert.doesNotMatch(await lab.locator('main').innerText(),/NaN|Infinity|undefined/);
 await writeFile(resolve(output,'report.json'),JSON.stringify({built,browser:browserName,checks:['preset A/B/C mouse measurement','fixed ruler scale between presets','zoom preserves physical readings','both-marker recording gate','immutable records','screen-distance change','formula and analysis update','measurement-derived calculation','TH/EN preserves full state','delete and reset','crossed-marker guidance','fine buttons and keyboard','atomic snapshot validation','untrusted messages','820/390px layouts','44px handles','native emulated touch dragging','exact minima in both phases','zoom fits exact markers','manual/model provenance','profile linked to R','exact button mobile touch'],errors},null,2));
 console.log('PASS double-slit lab in real Hub: A/B/C, measurement, fixed scale, records, calculations, state, language and phone touch dragging');
}catch(e){console.error(e);const failed=browser?.contexts()[0]?.pages()[0];if(failed){await failed.screenshot({path:resolve(output,'failure.png')});}process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
