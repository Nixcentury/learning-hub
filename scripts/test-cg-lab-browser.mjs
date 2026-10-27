import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { catalogFromRepository } from './build-route-catalog.mjs';

// Real Hub, author sample and sandbox; only Firebase is stubbed. No live writes.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const browserName = process.env.QA_BROWSER || 'chromium';
const browserType = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')[browserName];
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output/cg-lab');
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
 const context=await browser.newContext({viewport:{width:1420,height:1050},hasTouch:true});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[u.pathname.split('/').at(-1)]||''});return route.abort();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await mkdir(output,{recursive:true});
 await page.goto(origin+prefix+'#content/physics-ipst-equilibrium-4-2-cg-lab');await page.locator('#guest-button').click();
 const win=page.locator('[data-tool-id="content-simulation-physics-ipst-equilibrium-4-2-cg-lab"]');
 const sf=()=>page.frames().find(f=>f.url().includes('/4-2-centre-of-gravity-lab.html'));
 await win.waitFor();await win.locator('.is-maximize').click();
 const lab=page.frameLocator('[data-tool-id="content-simulation-physics-ipst-equilibrium-4-2-cg-lab"] iframe');
 await lab.locator('#shape option').first().waitFor({state:'attached'});const frame=sf();
 const state=()=>frame.evaluate(()=>LearningHubSimulation.getState());
 const active=()=>frame.evaluate(()=>{const s=LearningHubSimulation.getState();return s.plates[s.shapeId];});
 assert.equal((await active()).marks.length,0);assert.equal(await lab.locator('#solution > *').count(),0);assert.equal(await lab.locator('#check').isDisabled(),true);
 await page.screenshot({path:resolve(output,'01-initial.png')});
 async function suspend(h){await lab.locator(`[data-hole="${h}"]`).click();await lab.locator('#release').click();await frame.waitForFunction(()=>{const s=LearningHubSimulation.getState();return s.plates[s.shapeId].stable;},{},{timeout:15000});assert.equal(await lab.locator('#record').isEnabled(),true);await lab.locator('#record').click();}
 await lab.locator('[data-hole="0"]').click();await lab.locator('#release').click();await page.waitForTimeout(220);await lab.locator('#release').click();
 const paused=await active();assert.equal(paused.stable,false);assert.equal(await lab.locator('#record').isDisabled(),true);await page.waitForTimeout(180);assert.equal((await active()).angle,paused.angle);await lab.locator('#release').click();
 await frame.waitForFunction(()=>LearningHubSimulation.getState().plates.irregular.stable,{},{timeout:15000});await lab.locator('#record').click();assert.equal((await active()).marks.length,1);assert.equal(await lab.locator('#record').isDisabled(),true);
 const first=(await active()).marks[0];await suspend(1);assert.deepEqual((await active()).marks[0],first);assert.equal((await active()).marks.length,2);
 const beforeLang=await state();await win.locator('[data-window-language="en"]').click();await lab.locator('html[lang="en"]').waitFor();assert.deepEqual(await state(),beforeLang);
 await lab.locator('#overview').click();await lab.locator('#bench').focus();await lab.locator('#bench').press('ArrowRight');assert.ok((await active()).guess);assert.equal(await lab.locator('#check').isEnabled(),true);
 await lab.locator('#check').click();assert.equal(await lab.locator('#feedback').isVisible(),true);assert.ok(await lab.locator('#solution circle').count());
 await suspend(2);
 const force=await frame.evaluate(()=>{const n=document.getElementById('force'),m=n.getScreenCTM();return [new DOMPoint(Number(n.getAttribute('x1')),Number(n.getAttribute('y1'))).matrixTransform(m),new DOMPoint(Number(n.getAttribute('x2')),Number(n.getAttribute('y2'))).matrixTransform(m)].map(p=>({x:p.x,y:p.y}));});
 assert.ok(Math.abs(force[0].x-force[1].x)<.1&&force[1].y>force[0].y);assert.equal((await active()).marks.length,3);await lab.locator('#overview').click();await page.screenshot({path:resolve(output,'02-irregular-results.png')});
 const workBeforeShape=await active();await lab.locator('#shape').selectOption('triangle');assert.equal((await active()).marks.length,0);await suspend(0);await lab.locator('#shape').selectOption('irregular');assert.deepEqual(await active(),workBeforeShape);
 await lab.locator('#shape').selectOption('ell');await suspend(0);await suspend(1);await lab.locator('#overview').click();
 // Click the empty notch using the same SVG screen transform as a touch input.
 const rel=await frame.evaluate(()=>{const r=document.getElementById('bench').getBoundingClientRect();const p=new DOMPoint(.09833,.09833).matrixTransform(document.getElementById('lamina').getScreenCTM());return{x:p.x-r.x,y:p.y-r.y};});await lab.locator('#bench').click({position:rel});
 assert.ok(Math.abs((await active()).guess.x-.09833)<.001);await lab.locator('#check').click();assert.match(await lab.locator('#feedback').innerText(),/empty notch/);
 await page.screenshot({path:resolve(output,'03-l-notch-result.png')});
 const snapshot=await state();assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState({...s,identity:'someone-else'}),snapshot),false);
 assert.equal(await frame.evaluate(s=>{s.plates.ell.angle=NaN;return LearningHubSimulation.restoreState(s);},snapshot),false);
 assert.equal(await frame.evaluate(s=>LearningHubSimulation.restoreState(s),snapshot),true);
 // Untrusted messages must not change state or language.
 await frame.evaluate(()=>window.postMessage({type:'learning-hub-context',language:'th',identity:{uid:'bad'}},location.origin));assert.equal(await lab.locator('html').getAttribute('lang'),'en');
 for(const width of [820,390]){await page.setViewportSize({width,height:1050});assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.screenshot({path:resolve(output,`04-layout-${width}.png`)});}
 // Actual touch input at phone size; preserve previous work after switching languages.
 await lab.locator('#overview').click();await lab.locator('#bench').tap({position:{x:100,y:100}});assert.ok((await active()).guess);await win.locator('[data-window-language="th"]').click();await lab.locator('html[lang="th"]').waitFor();assert.equal((await active()).marks.length,2);
 page.once('dialog',d=>d.accept());await lab.locator('#reset').click();assert.equal((await active()).marks.length,0);assert.equal((await active()).guess,null);assert.equal(await lab.locator('#feedback').isVisible(),false);
 await lab.locator('#shape').selectOption('irregular');assert.equal((await active()).marks.length,3);
 await lab.locator('#shape').selectOption('ell');await lab.locator('[data-hole="0"]').tap();await lab.locator('#release').tap();
 await frame.waitForFunction(()=>LearningHubSimulation.getState().plates.ell.stable,{},{timeout:15000});
 await page.screenshot({path:resolve(output,'05-th-phone-hanging.png')});await lab.locator('#record').tap();assert.equal((await active()).marks.length,1);
 assert.deepEqual(errors,[]);await writeFile(resolve(output,'report.json'),JSON.stringify({browser:browserName,built,checks:['all three shapes','pause is not equilibrium','three distinct lines','marks follow plate','TH/EN preserves work','shape switching preserves work','outside-material click','feedback and reveal','reset isolates one shape','restore validation','untrusted message ignored','820 and 390px layouts','phone touch'],errors},null,2));
 console.log('PASS CG lab in Hub: three shapes, experiments, pauses, marks, outside-CG answer, language/state, mobile touch');
} catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
