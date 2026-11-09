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
const browserName = 'chromium';
const browserType = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')[browserName];
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output/wave-path-phase');
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
const id='physics-ipst-wave-optics-10-1-sheet';
const figures=['19-path-difference-far-screen.svg','20-midpoint-screen-geometry.svg'];
const slots=['wave-path-geometry-water','wave-path-phase-light'];
const route='#physics/bank/b-08c93bb5cd14a7bc7de0a8e0/learning-sheet';
let browser;
try {
  browser=await browserType.launch({headless:true,...(process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{})});
  await mkdir(output,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:1000},hasTouch:true});
  await context.route('**/*',r=>{
    const u=new URL(r.request().url());
    if(u.origin===origin)return r.continue();
    if(u.hostname==='www.gstatic.com')return r.fulfill({contentType:'text/javascript',body:stubs[u.pathname.split('/').at(-1)]||''});
    return r.abort();
  });
  const page=await context.newPage(),errors=[],missing=[];
  page.setDefaultTimeout(25000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))missing.push(r.url());});
  await page.goto(origin+prefix+route);
  await page.locator('#guest-button').click();
  const selector=`[data-tool-id="content-html-${id}"]`;
  const win=page.locator(selector),sheet=page.frameLocator(selector+' iframe');
  await sheet.locator('html[data-hub-sheet-ready][data-hub-math-state="ready"]').waitFor({timeout:60000});
  assert.equal(await win.locator('iframe').getAttribute('sandbox'),'allow-same-origin');
  assert.equal(await sheet.locator('[data-hub-math-error]').count(),0);
  await win.locator('.is-maximize').click();
  const langButton=lang=>win.locator(`[data-window-language="${lang}"]`);
  const activeLang=lang=>sheet.locator(`[data-content-lang="${lang}"]`);
  for(const lang of ['th','en']){
    await langButton(lang).click();
    const active=activeLang(lang);
    await active.waitFor({state:'visible'});
    assert.equal(await active.locator('[data-sheet-slot]').count(),104);
    for(const name of figures){
      const img=active.locator(`img[src$="${name}"]`);
      assert.equal(await img.count(),1);
      await img.evaluate(el=>el.decode());
      assert.ok(await img.evaluate(el=>el.naturalWidth>0));
    }
    for(const id of slots){
      const slot=active.locator(`[data-sheet-slot="${id}"]`),toggle=slot.locator('[data-hub-sheet-toggle]');
      if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      assert.ok(await slot.locator('[data-sheet-answer] mjx-container').count()>0);
      assert.ok(await slot.locator(`[data-sheet-answer] [data-math-tex*='${id.endsWith('water')?'2.4':'250'}']`).count());
    }
  }
  console.log('PASS normal bank deep link, both SVGs, all 104 slots and two revealed worked answers in TH/EN');
  for(const width of [390,820]){
    await page.setViewportSize({width,height:1100});
    for(const lang of ['th','en']){
      await langButton(lang).click();
      const active=activeLang(lang);
      const geometry=active.locator('figure:has(img[src$="20-midpoint-screen-geometry.svg"])');
      await geometry.screenshot({path:resolve(output,`geometry-${width}-${lang}.png`)});
      const layout=await sheet.locator('html').evaluate(n=>({client:n.clientWidth,scroll:n.scrollWidth}));
      assert.ok(layout.scroll<=layout.client+2,`${width}/${lang}: ${JSON.stringify(layout)}`);
      const overflows=await active.locator('.wave-path-equation [data-hub-math]').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.getAttribute('data-math-tex')));
      assert.deepEqual(overflows,[],`${width}/${lang} new display math fits`);
    }
  }
  console.log('PASS TH/EN geometry and equations at 390 and 820 px');
  await page.setViewportSize({width:1280,height:1000});
  const reports=[];
  for(const lang of ['th','en']){
    await langButton(lang).click();
    await win.locator('.window-html-print').click();
    const dialog=page.locator('[data-html-print-dialog]'),paper=page.frameLocator('[data-html-print-frame]');
    for(const edition of ['blank','answers']){
      if(edition==='answers')await dialog.locator('[data-sheet-print-edition]').selectOption(edition);
      await page.waitForFunction(()=>['ready','error'].includes(document.querySelector('[data-html-print-dialog]')?.dataset.printState),null,{timeout:60000});
      assert.equal(await dialog.getAttribute('data-print-state'),'ready',await dialog.locator('[data-print-status]').innerText());
      assert.equal(await paper.locator('[data-sheet-slot]').count(),104);
      assert.equal(await paper.locator('[data-sheet-answer]').count(),edition==='blank'?0:104);
      assert.equal(await paper.locator('[data-hub-math-error]').count(),0);
      const equationHeights=await paper.locator('.wave-path-equation mjx-container > svg').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
      assert.equal(equationHeights.length,9);
      assert.ok(equationHeights.every(h=>h>0&&h<80),`${lang}/${edition}: scaled equations ${equationHeights}`);
      assert.equal(await paper.locator(`[data-content-lang="${lang==='th'?'en':'th'}"]`).count(),0);
      for(const name of figures)assert.ok(await paper.locator(`img[src$="${name}"]`).evaluate(async n=>{await n.decode();return n.naturalWidth>0;}));
      const html=await paper.locator('html').evaluate(n=>'<!doctype html>'+n.outerHTML);
      const pdf=await context.newPage();await pdf.setContent(html,{waitUntil:'load'});await pdf.evaluate(()=>document.fonts.ready);
      const file=`wave-path-phase-${lang}-${edition}.pdf`;
      await pdf.pdf({path:resolve(output,file),preferCSSPageSize:true,printBackground:true});await pdf.close();
      reports.push({lang,edition,file,pages:Number(await paper.locator('html').getAttribute('data-hub-print-pages'))});
    }
    await dialog.locator('[data-print-close]').click();
  }
  await writeFile(resolve(output,'print-report.json'),JSON.stringify(reports,null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS four A4 PDFs with two diagrams and 104 paired slots, correct answer visibility, no browser/math/resource errors',JSON.stringify(reports));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
