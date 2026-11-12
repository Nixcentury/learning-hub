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

const groups = {};
for (const lang of ['th', 'en']) {
  const node = source.document.querySelector('[data-content-lang="'+lang+'"]');
  const slotKeys = [...node.querySelectorAll('[data-sheet-slot]')].map(x=>x.dataset.sheetSlot);
  groups[lang] = {
    slotKeys,
    learning:node.querySelectorAll('[data-print-zone="learning"] [data-sheet-slot]').length,
    problem:node.querySelectorAll('[data-print-zone="problem"] [data-sheet-slot]').length,
    memory:node.querySelectorAll('[data-problem-key^="memory-"]').length,
    ipst:node.querySelectorAll('[data-problem-key^="ipst-"]').length,
    alevel:node.querySelectorAll('[data-problem-key^="alevel-"]').length,
    stages:node.querySelectorAll('[data-guide-anchor^="learning-"]').length
  };
}
assert.deepEqual(groups.th,groups.en,'The TH and EN sheets must match in slot order and counts');
assert.equal(groups.th.stages,7);
assert.equal(groups.th.memory,18);
assert.equal(groups.th.ipst,16);
assert.ok(groups.th.slotKeys.every(key=>!key.startsWith('magnet-') && !key.startsWith('ipst-magnet-')),'Removed magnet activity must stay excluded');
assert.ok(groups.th.slotKeys.includes('ipst-chapter-question-2'),'Retain the textbook alpha-scattering evidence question');
assert.equal(groups.th.learning,7);
assert.equal(groups.th.problem,47);
assert.equal(groups.th.alevel,10);
assert.equal(groups.th.slotKeys.length,54,'Keep the seven Learning notes and 47 focused Problem responses');
for (const lang of ['th','en']) {
  const problems=source.document.querySelector('[data-content-lang="'+lang+'"] [data-print-zone="problem"]');
  assert.equal(problems.querySelectorAll('[data-guide-anchor^="section-"], [data-problem-key^="ipst-activity-"], .practice-table, .energy-table').length,0,'Keep activities, experiments and former adapted blocks out of Problem');
}

let browser;
try {
  browser = await browserType.launch({headless:true,...(process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{})});
  await mkdir(output,{recursive:true});
  const context=await browser.newContext({viewport:{width:1360,height:1000},hasTouch:true});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin)return route.continue();
    if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[url.pathname.split('/').at(-1)]||''});
    return route.abort();
  });
  const page=await context.newPage(),errors=[],missing=[];
  page.setDefaultTimeout(60000);
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(origin))missing.push(response.url());});
  await page.goto(origin+prefix+'#content/'+sheetId);
  await page.locator('#guest-button').click();
  const win=page.locator('[data-tool-id="content-html-'+sheetId+'"]');
  const sheet=page.frameLocator('[data-tool-id="content-html-'+sheetId+'"] iframe');
  await sheet.locator('html[data-hub-sheet-ready][data-hub-math-state="ready"]').waitFor({timeout:120000});
  assert.equal(await sheet.locator('[data-hub-math-error]').count(),0,'Math must be ready with no formula errors');
  await win.locator('.is-maximize').click();
  for(const lang of ['th','en']) {
    await win.locator('[data-window-language="'+lang+'"]').click();
    const active=sheet.locator('[data-content-lang="'+lang+'"]');
    await active.waitFor({state:'visible'});
    assert.equal(await active.locator('[data-sheet-slot]').count(),groups[lang].slotKeys.length);
    assert.equal(await active.locator('[data-guide-anchor^="learning-"]').count(),7);
    assert.ok(await active.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)),lang+' missing images');
    const slots=await active.locator('[data-sheet-slot]').evaluateAll(nodes=>nodes.map(x=>x.dataset.sheetSlot));
    assert.deepEqual(slots,groups[lang].slotKeys,lang+' slot parity');
  }
  const printChecks=[];
  async function ready(label) {
    const dialog=page.locator('[data-html-print-dialog]');
    await page.waitForFunction(() => ['ready','error'].includes(document.querySelector('[data-html-print-dialog]')?.dataset.printState),null,{timeout:120000});
    const state=await dialog.getAttribute('data-print-state');
    if(state!=='ready') {
      await page.screenshot({path:resolve(output,'print-error-'+label+'.png'),fullPage:false});
      throw Error(label+': print '+state+': '+await dialog.locator('[data-print-status]').innerText());
    }
    const frame=page.frameLocator('[data-html-print-frame]');
    const pages=Number(await frame.locator('html').getAttribute('data-hub-print-pages'));
    assert.ok(pages>0 && pages<150,label+' invalid number of pages: '+pages);
    if (label.includes('problem')) assert.ok(pages<=30,label+' exceeds the teacher’s 30-page Problem budget: '+pages);
    assert.equal(await frame.locator('[data-hub-math-error]').count(),0,label+' math errors');
    return {dialog,frame,pages};
  }
  async function capture(lang,zone,edition,label){
    const {frame,pages}=await ready(label);
    const slots=await frame.locator('[data-sheet-slot]').count();
    const expected=groups[lang][zone];
    const zoneFragments=await frame.locator('[data-print-zone="'+zone+'"]').count();
    // Pagination splits a logical zone across A4 pages and clones its wrapper.
    // Validate fragments and all original slots rather than expecting one DOM wrapper.
    assert.ok(zoneFragments>=1 && zoneFragments<=pages,label+' wrong print zone fragments: '+zoneFragments);
    assert.equal(await frame.locator('[data-print-zone="'+(zone==='learning'?'problem':'learning')+'"]').count(),0,label+' extra print zone');
    assert.equal(slots,expected,label+' lost print slots');
    const answers=await frame.locator('[data-sheet-answer]').count();
    assert.equal(answers,edition==='blank'?0:expected,label+' wrong print edition');
    printChecks.push({label,lang,zone,edition,pages,slots,answers});
  }
  await win.locator('[data-window-language="th"]').click();
  await win.locator('.window-html-print').click();
  let dialog=page.locator('[data-html-print-dialog]');
  await capture('th','learning','blank','th-learning-blank');
  await dialog.locator('[data-sheet-print-zone-select]').selectOption('problem');
  await capture('th','problem','blank','th-problem-blank');
  await dialog.locator('[data-sheet-print-edition]').selectOption('answers');
  await capture('th','problem','answers','th-problem-answers');
  await dialog.locator('[data-print-close]').click();
  await win.locator('[data-window-language="en"]').click();
  await win.locator('.window-html-print').click();
  dialog=page.locator('[data-html-print-dialog]');
  await capture('en','learning','blank','en-learning-blank');
  await dialog.locator('[data-sheet-print-zone-select]').selectOption('problem');
  await capture('en','problem','blank','en-problem-blank');
  await dialog.locator('[data-print-close]').click();
  assert.deepEqual(errors,[],'Browser runtime errors');
  assert.deepEqual(missing,[],'Missing first-party resources');
  await writeFile(resolve(output,'print-report.json'),JSON.stringify({counts:groups.th,printChecks},null,2));
  console.log('PASS bilingual seven-stage Bohr sheet, 16 IPST, 10 A-Level and 18 memory items');
  console.log('PASS A4 print readiness in 5 Learning/Problem and blank/answer cases');
} finally {
  await browser?.close();
  await new Promise(done=>server.close(done));
}
