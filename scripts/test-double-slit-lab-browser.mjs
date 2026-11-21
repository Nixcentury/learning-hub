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
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);await mkdir(output,{recursive:true});
 await page.goto(origin+prefix+'#content/physics-ipst-wave-optics-10-2-double-slit-lab');await page.locator('#guest-button').click();
 const win=page.locator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"]');await win.waitFor();await win.locator('.is-maximize').click();
 const lab=page.frameLocator('[data-tool-id="content-simulation-physics-ipst-wave-optics-10-2-double-slit-lab"] iframe');await lab.locator('#handle-left').waitFor();
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
 const measure=async (set,distance,halfWidth)=>{
   await lab.locator('#preset-'+set).click();
   if(distance!==1){
     await lab.locator('#distance-number').fill(String(distance));
     await lab.locator('#distance-number').press('Enter');
   }
   assert.equal(await lab.locator('#record').isDisabled(),true);
   await dragTo('left',-halfWidth);await dragTo('right',halfWidth,true);
   await lab.locator('#record').click();
 };
 assert.equal(await lab.locator('#light-view').isVisible(),true);
 assert.equal(await lab.locator('#water-view').count(),0);
 assert.equal((await state()).lightPhase,0);
 await shot('01-light-only');
 await lab.locator('#light-answer').click();
 assert.equal(await lab.locator('#trend-slits').isDisabled(),true);
 await lab.locator('#zoom').selectOption('2');
 await measure('A',1,5.32);
 await measure('B',1,2.66);
 assert.equal((await state()).zoom,2);
 await measure('C',1,3.25);
 await measure('B',2,5.32);
 await lab.locator('#trend-slits').selectOption('narrower');
 await lab.locator('#trend-colour').selectOption('wider');
 await lab.locator('#trend-screen').selectOption('wider');
 assert.equal(await lab.locator('#light-comparisons [role="status"]').filter({hasText:'ตรงกับค่าทั้งสอง'}).count(),3);
 await lab.locator('#mission-answer').scrollIntoViewIfNeeded();
 await lab.locator('#mission-answer').screenshot({path:resolve(output,'02-checkout.png')});
 await measure('C',2,6.5);
 assert.match(await lab.locator('#return-reading').innerText(),/13\.0\d mm|12\.9\d mm/);
 await lab.locator('#report-open').click();
 assert.equal(await lab.locator('#report-records tbody tr').count(),5);
 assert.equal(await lab.locator('#lab-report select').count(),0);
 await lab.locator('#report-return').click();
 const saved=await state();
 await win.locator('[data-window-language="en"]').click();
 await lab.locator('html[lang="en"]').waitFor();
 assert.deepEqual(await state(),saved);
 assert.equal(await lab.locator('#light-comparisons [role="status"]').filter({hasText:'Matches the two recorded readings.'}).count(),3);
 const restored=await frame.evaluate(s=>LearningHubSimulation.restoreState(s),saved);
 assert.equal(restored,true);
 await lab.locator('#records-body [data-record-id="2"] button').click();
 assert.equal(await lab.locator('#trend-slits').isDisabled(),true);
 assert.equal(await lab.locator('#trend-colour').isDisabled(),true);
 assert.equal(await lab.locator('#trend-screen').isDisabled(),true);
 await page.setViewportSize({width:390,height:1150});
 assert.ok(await lab.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
 await shot('03-phone');
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'report.json'),JSON.stringify({built,browser:browserName,checks:['light initial state','manual A/B/C and distance readings','three comparisons from recorded evidence','C at 2 m after prediction','measurement report','bilingual state','restore and delete','phone layout'],errors},null,2));
 console.log('PASS double-slit light lab in the Hub');
}catch(e){console.error(e);const failed=browser?.contexts()[0]?.pages()[0];if(failed){await failed.screenshot({path:resolve(output,'failure.png')});}process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
