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
const output = resolve(root, 'qa-output/physics19-sheet2');
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
 const context=await browser.newContext({viewport:{width:1360,height:1000}});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[u.pathname.split('/').at(-1)]||''});return route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(20000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await mkdir(output,{recursive:true});
 await page.goto(origin+prefix+'#content/physics-ipst-atomic-19-1-2-sheet');
 await page.locator('#guest-button').click();
 const win=page.locator('[data-tool-id="content-html-physics-ipst-atomic-19-1-2-sheet"]');
 const sheet=page.frameLocator('[data-tool-id="content-html-physics-ipst-atomic-19-1-2-sheet"] iframe');
 await sheet.locator('html[data-hub-sheet-ready]').waitFor();
 await sheet.locator('html[data-hub-math-state="ready"]').waitFor();
 assert.equal(await sheet.locator('[data-hub-sheet-toggle]').count(),78);
 assert.equal(await sheet.locator('[data-hub-sheet-open="true"]').count(),0);
 assert.equal(await sheet.locator('mjx-merror').count(),0);
 await win.locator('.is-maximize').click();
 const report=[];
 for(const lang of ['th','en']){console.log('START',lang);
  await win.locator(`[data-window-language="${lang}"]`).click();console.log('language clicked');
  const current=sheet.locator(`[data-content-lang="${lang}"]`);
  await current.waitFor({state:'visible'});
  const before=await current.locator('[data-sheet-slot]').first().boundingBox();
  await current.locator('[data-hub-sheet-toggle]').first().click();
  assert.ok(Math.abs(before.height-(await current.locator('[data-sheet-slot]').first().boundingBox()).height)<1);
  await sheet.getByRole('button',{name:lang==='th'?'เปิดทั้งหมด':'Reveal all',exact:true}).click();
  assert.equal(await current.locator('[data-hub-sheet-open="true"]').count(),39);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await sheet.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1),lang+' narrow overflow');
  await page.screenshot({path:resolve(output,lang+'-mobile.png')});
  await page.setViewportSize({width:1360,height:1000});
  console.log('open print',lang);await win.locator('.window-html-print').click();
  const dialog=page.locator('[data-html-print-dialog]');
  for(const edition of ['blank','answers']){
   await dialog.locator('[data-sheet-print-edition]').selectOption(edition);
   await page.locator('[data-html-print-dialog][data-print-state="ready"]').waitFor();
   const pf=page.frameLocator('[data-html-print-frame]');
   assert.equal(await pf.locator('[data-sheet-slot]').count(),39);
   assert.equal(await pf.locator('[data-sheet-answer]').count(),edition==='blank'?0:39);
   assert.equal(await pf.locator(`[data-content-lang="${lang==='th'?'en':'th'}"]`).count(),0);
   assert.equal(await pf.locator('mjx-merror').count(),0);
   assert.equal(await pf.locator('img').count(),11);
   assert.ok(await pf.locator('img').evaluateAll(ns=>ns.every(n=>n.complete&&n.naturalWidth)));
   const pages=Number(await pf.locator('html').getAttribute('data-hub-print-pages'));
   assert.ok(pages<=33,`${lang}/${edition}: ${pages} pages`);
   const source=await pf.locator('html').evaluate(n=>'<!doctype html>\n'+n.outerHTML);
   await writeFile(resolve(output,lang+'-'+edition+'.html'),source);
   const pdfPage=await context.newPage();await pdfPage.setContent(source,{waitUntil:'load'});await pdfPage.evaluate(()=>document.fonts.ready);
   const filename=`physics-19-1-sheet-2-${lang}-${edition}.pdf`;
   await pdfPage.pdf({path:resolve(output,filename),preferCSSPageSize:true,printBackground:true});await pdfPage.close();
   const pageData=await pf.locator('.hub-print-page-body').evaluateAll(ns=>ns.map(n=>({chars:n.textContent.length,overflow:n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1,slots:n.querySelectorAll('[data-sheet-slot]').length})));
   assert.ok(pageData.every(n=>!n.overflow));
   report.push({lang,edition,pages,filename,pageData});console.log(lang,edition,pages);
  }
  await dialog.locator('[data-print-close]').click();console.log('closed print',lang);
 }
 assert.deepEqual(errors,[]);
 await writeFile(resolve(output,'browser-report.json'),JSON.stringify(report,null,2));
 console.log('PASS Hub TH/EN, 39 matching slots, answer controls, mobile, 4 central-print PDFs, no overflow');
}catch(e){console.error(e);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(d=>server.close(d));}
