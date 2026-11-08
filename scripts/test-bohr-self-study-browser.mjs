import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { catalogFromRepository } from './build-route-catalog.mjs';

// Real Hub, author sample and sandbox; only Firebase is stubbed. No live writes.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const browserName = 'chromium';
const browserType = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')[browserName];
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output/bohr-self-study');
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
const sheetId = 'physics-ipst-atomic-19-1-2-sheet';
const source = parseHTML(await readFile(resolve(root,'public/content/physics/ipst/atomic-physics/19-1-2-evidence-bohr-learning-sheet.html'),'utf8'));
const changedSlots = [...source.document.querySelectorAll('[data-content-lang="th"] [data-sheet-slot]')]
  .filter(n=>n.querySelector('.worked-solution')).map(n=>n.dataset.sheetSlot);
assert.equal(changedSlots.length,39);
let browser;
try {
  browser = await browserType.launch({headless:true,...(process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{})});
  await mkdir(output,{recursive:true});
  const context = await browser.newContext({viewport:{width:1360,height:1000},hasTouch:true});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin)return route.continue();
    if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[url.pathname.split('/').at(-1)]||''});
    return route.abort();
  });
  const page=await context.newPage(),errors=[],missing=[];page.setDefaultTimeout(30000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))missing.push(r.url());});
  await page.goto(origin+prefix+'#content/'+sheetId);await page.locator('#guest-button').click();
  const win=page.locator(`[data-tool-id="content-html-${sheetId}"]`);
  const sheet=page.frameLocator(`[data-tool-id="content-html-${sheetId}"] iframe`);
  await sheet.locator('html[data-hub-sheet-ready][data-hub-math-state="ready"]').waitFor({timeout:60000});
  assert.equal(await win.locator('iframe').getAttribute('sandbox'),'allow-same-origin');
  assert.equal(await sheet.locator('[data-sheet-slot]').count(),186);
  assert.equal(await sheet.locator('[data-hub-math-error]').count(),0);
  await win.locator('.is-maximize').click();
  for(const lang of ['th','en']){
    await win.locator(`[data-window-language="${lang}"]`).click();
    const active=sheet.locator(`[data-content-lang="${lang}"]`);await active.waitFor({state:'visible'});
    assert.equal(await active.locator('[data-sheet-slot]').count(),93);
    assert.ok(await active.evaluate(r=>Boolean(r.querySelector('[data-guide-anchor="spectrum-calculation-method"]').compareDocumentPosition(r.querySelector('[data-guide-anchor="section-4"] table'))&Node.DOCUMENT_POSITION_FOLLOWING)));
    await active.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    assert.ok(await active.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)));
    await sheet.getByRole('button',{name:lang==='th'?'เปิดทั้งหมด':'Reveal all',exact:true}).click();
    for(const id of changedSlots){
      const slot=active.locator(`[data-sheet-slot="${id}"]`);
      assert.equal(await slot.locator('[data-hub-sheet-toggle]').getAttribute('aria-expanded'),'true');
      assert.ok(await slot.locator('.derivation mjx-container').count()>=1,id);
    }
    for(const id of ['radius-ratio','rydberg-sign']){
      const slot=active.locator(`[data-sheet-slot="${id}"]`);await slot.scrollIntoViewIfNeeded();
      await page.screenshot({path:resolve(output,`${id}-${lang}.png`)});
    }
    await active.locator('[data-guide-anchor="water-interference-review"] figure').scrollIntoViewIfNeeded();
    await page.screenshot({path:resolve(output,`water-figure-${lang}.png`)});
    await win.locator('.window-sheet-guide').click();
    const guide=win.locator('.learning-guide');await guide.locator('[data-guide-state="ready"]').waitFor();
    for(const [key,labelTh,labelEn]of[
      ['water-interference-review','คลื่นน้ำและผลต่างทางเดิน','Water-wave path difference'],
      ['spectrum-objectives','จุดประสงค์การทดลอง','Experiment aims'],
      ['spectrum-geometry','เรขาคณิตระยะที่วัด','Measurement geometry'],
      ['spectrum-calculation-method','จัดรูปสูตรก่อนตาราง','Formulas before the tables']]){
      await guide.getByRole('button',{name:lang==='th'?labelTh:labelEn,exact:true}).click();
      assert.equal(await active.locator(`[data-guide-anchor="${key}"].hub-guide-target`).count(),1);
    }
    await guide.locator('.learning-guide-close').click();
    await sheet.getByRole('button',{name:lang==='th'?'ปิดทั้งหมด':'Hide all',exact:true}).click();
  }
  console.log('PASS 93 paired slots, 39 expanded solutions, all TeX/images and four new guide targets in TH/EN');
  const prints=[];
  for(const lang of ['th','en']){
    await win.locator(`[data-window-language="${lang}"]`).click();await win.locator('.window-html-print').click();
    const dialog=page.locator('[data-html-print-dialog]'),paper=page.frameLocator('[data-html-print-frame]');
    for(const edition of ['blank','answers']){
      if(edition==='answers')await dialog.locator('[data-sheet-print-edition]').selectOption(edition);
      await page.waitForFunction(()=>['ready','error'].includes(document.querySelector('[data-html-print-dialog]')?.dataset.printState),{},{timeout:60000});
      if(await dialog.getAttribute('data-print-state')!=='ready'){
        await page.screenshot({path:resolve(output,`print-error-${lang}-${edition}.png`)});
        throw Error(`Print ${lang}/${edition}: ${await dialog.locator('[data-print-status]').innerText()}`);
      }
      assert.equal(await paper.locator('[data-sheet-slot]').count(),93);
      assert.equal(await paper.locator('[data-sheet-answer]').count(),edition==='blank'?0:93);
      assert.equal(await paper.locator('[data-hub-math-error]').count(),0);
      assert.equal(await paper.locator(`[data-content-lang="${lang==='th'?'en':'th'}"]`).count(),0);
      assert.equal(await paper.locator('[data-hub-sheet-toggle],.learning-guide').count(),0);
      const html=await paper.locator('html').evaluate(n=>'<!doctype html>'+n.outerHTML);
      const pdf=await context.newPage();await pdf.setContent(html,{waitUntil:'load'});await pdf.evaluate(()=>document.fonts.ready);
      const file=`bohr-${lang}-${edition}.pdf`;await pdf.pdf({path:resolve(output,file),preferCSSPageSize:true,printBackground:true});await pdf.close();
      prints.push({lang,edition,file,pages:Number(await paper.locator('html').getAttribute('data-hub-print-pages'))});
    }
    await dialog.locator('[data-print-close]').click();
  }
  console.log('PASS four actual TH/EN blank/answer PDFs with all 93 answer areas and no TeX errors');
  for(const width of [390,820]){
    await page.setViewportSize({width,height:1100});
    for(const lang of ['th','en']){
      await win.locator(`[data-window-language="${lang}"]`).click();
      const active=sheet.locator(`[data-content-lang="${lang}"]`);
      await sheet.getByRole('button',{name:lang==='th'?'เปิดทั้งหมด':'Reveal all',exact:true}).click();
      await active.locator('[data-sheet-slot="rydberg-sign"]').scrollIntoViewIfNeeded();
      await page.screenshot({path:resolve(output,`rydberg-${width}-${lang}.png`)});
      const layout=await sheet.locator('html').evaluate(r=>({client:r.clientWidth,scroll:r.scrollWidth}));
      assert.ok(layout.scroll<=layout.client+2,`${width}/${lang}: ${JSON.stringify(layout)}`);
    }
  }
  await writeFile(resolve(output,'print-report.json'),JSON.stringify(prints,null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS revealed formulas at 390/820 px in TH/EN, no page errors or missing resources');
} finally {await browser?.close();await new Promise(done=>server.close(done));}
