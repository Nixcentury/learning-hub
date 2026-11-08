import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { catalogFromRepository } from './build-route-catalog.mjs';

// Real Hub, author sample and sandbox; only Firebase is stubbed. No live writes.
const root = fileURLToPath(new URL('../', import.meta.url));
const built = process.env.QA_BUILT === '1';
const browserName = 'chromium';
const browserType = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright')[browserName];
const prefix = '/learning-hub/';
const output = resolve(root, 'qa-output/bohr-review');
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
const sheetId='physics-ipst-atomic-19-1-2-sheet';
const quizId='physics-ipst-atomic-19-1-2-review-quiz';
const quizSource='content/physics/ipst/atomic-physics/19-1-2-bohr-review-quiz.html';
const parsed=parseHTML(await readFile(resolve(root,'public',quizSource),'utf8'));
const expected=readQuizContent(parsed.document.querySelector('[data-learning-activity-content]'));
assert.deepEqual(expected.errors,[]);assert.equal(expected.questions.length,50);
assert.deepEqual(['drag-drop','choice','number'].map(t=>expected.questions.filter(q=>q.type===t).length),[26,13,11]);
for(const q of expected.questions)for(const lang of ['th','en']){
  assert.ok(q.solution.querySelector(`[data-quiz-language="${lang}"] p`),q.id+'/'+lang);
  if(q.type!=='drag-drop')assert.ok(q.solution.querySelector(`[data-quiz-language="${lang}"] div`),q.id+' worked math');
}
let browser;
try{
  browser=await browserType.launch({headless:true,...(process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{})});
  await mkdir(output,{recursive:true});
  const context=await browser.newContext({viewport:{width:1360,height:1000},hasTouch:true});
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin)return route.continue();
    if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:stubs[url.pathname.split('/').at(-1)]||''});
    return route.abort();
  });
  const errors=[],missing=[];
  function track(page){page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))missing.push(r.url());});}
  const page=await context.newPage();track(page);
  await page.goto(origin+prefix+'#content/'+quizId);await page.locator('#guest-button').click();
  const win=page.locator(`[data-tool-id="content-quiz-${quizId}"]`);
  const quiz=page.frameLocator(`[data-tool-id="content-quiz-${quizId}"] iframe`);
  await quiz.locator('[data-current-options] .quiz-drag-piece').first().waitFor();
  let frame=page.frames().find(f=>f.url().includes('quiz-player.html'));
  assert.equal((await frame.evaluate(()=>LearningHubQuiz.getState())).contentId,quizId);
  await win.locator('.is-maximize').click();
  for(const[index,q]of expected.questions.entries()){
    assert.equal((await frame.evaluate(()=>LearningHubQuiz.getState())).currentIndex,index);
    assert.equal(await quiz.locator('[data-current-solution]').isVisible(),false);
    if(q.type==='drag-drop'){
      for(const slot of q.slots){await quiz.locator(`[data-current-options] [data-item-id="${slot.answer}"]`).tap();await quiz.locator(`[data-current-options] [data-slot-id="${slot.id}"]`).tap();}
    }else if(q.type==='number')await quiz.locator('[data-numeric-answer]').fill(String(q.answer));
    else await quiz.locator('.quiz-option').nth(q.options.findIndex(n=>n.dataset.choiceId===q.answer)).tap();
    if(index<49){await quiz.locator('[data-next-button]').click();if(q.type==='drag-drop')await quiz.locator('[data-navigation-confirm]').click();}
  }
  await frame.evaluate(()=>LearningHubQuiz.flushLocal());
  const answers=(await frame.evaluate(()=>LearningHubQuiz.getState())).answers;assert.equal(Object.keys(answers).length,50);
  await page.reload();await quiz.locator('[data-numeric-answer]').waitFor();
  frame=page.frames().find(f=>f.url().includes('quiz-player.html'));
  assert.deepEqual((await frame.evaluate(()=>LearningHubQuiz.getState())).answers,answers);
  await quiz.locator('[data-submit-all]').click();
  await quiz.locator('[data-evidence-warning-continue]').click();
  await quiz.locator('.quiz-results-hero').waitFor();
  assert.match(await quiz.locator('.quiz-result-stats').innerText(),/50\/50/);
  assert.equal((await frame.evaluate(()=>LearningHubQuiz.getState())).masteredIds.length,50);
  await quiz.locator('.quiz-result-item').first().click();
  console.log('PASS all 50 real drag/choice/number controls, 26 reread confirmations, reload and deterministic score 50/50; no early solution leaks');
  const mathErrors='[data-mjx-error],mjx-merror,[data-mml-node="merror"]';
  const settle=()=>frame.evaluate(async()=>{await MathJax.startup.promise;await MathJax.typesetPromise([document.querySelector('[data-question-card]')]);});
  for(const lang of ['th','en']){
    await win.locator(`[data-window-language="${lang}"]`).click();
    for(const[index,q]of expected.questions.entries()){
      await quiz.locator(`[data-question-jump="${index}"]`).click();await settle();
      const solution=quiz.locator('[data-current-solution]');await solution.waitFor({state:'visible'});
      const localized=q.solution.querySelector(`[data-quiz-language="${lang}"]`);
      // Check first/last authored paragraphs, avoiding MathJax's accessible math text.
      for(const p of [localized.querySelector('p'),[...localized.querySelectorAll('p')].at(-1)])assert.ok((await solution.innerText()).includes(p.textContent),q.id+'/'+lang);
      assert.equal(await quiz.locator(mathErrors).count(),0,q.id+'/'+lang);
      if(q.type!=='drag-drop')assert.ok(await solution.locator('mjx-container').count()>=2,q.id+' formulas');
      assert.ok(await quiz.locator('[data-current-context] img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)));
      if([8,30,46,47,48].includes(index)){await solution.scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,`q${index+1}-${lang}.png`)});}
    }
  }
  console.log('PASS all 50 detailed solutions in TH/EN with real MathJax and source figures');
  for(const width of [390,820]){
    await page.setViewportSize({width,height:1100});
    for(const lang of ['th','en']){
      await win.locator(`[data-window-language="${lang}"]`).click();
      for(const index of [12,30,31,42,47,48]){
        await quiz.locator(`[data-question-jump="${index}"]`).click();await settle();
        const layout=await quiz.locator('html').evaluate(r=>({width:r.clientWidth,scroll:r.scrollWidth}));
        assert.ok(layout.scroll<=layout.width+2,`${width}/${lang}/Q${index+1}: ${JSON.stringify(layout)}`);
      }
      await quiz.locator('[data-current-solution]').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,`q49-${width}-${lang}.png`)});
    }
  }
  await page.setViewportSize({width:1360,height:1000});
  await quiz.locator('[data-topic-review-open]').click();
  const sheet=page.frameLocator(`[data-tool-id="content-html-${sheetId}"] iframe`);
  await sheet.locator('html[data-hub-sheet-ready][data-hub-math-state="ready"]').waitFor({timeout:60000});
  assert.equal(await sheet.locator('[data-content-lang="en"]').isVisible(),true);
  assert.deepEqual((await frame.evaluate(()=>LearningHubQuiz.getState())).answers,answers);
  await page.screenshot({path:resolve(output,'quiz-sheet-pair.png')});
  console.log('PASS 390/820 px long worked solutions and Review opens the current paired worksheet without resetting answers');
  const print=await context.newPage();track(print);
  await print.goto(`${origin}${prefix}pages/tools/quiz-player.html?content=../../${quizSource}&lang=th`);
  await print.waitForFunction(()=>window.LearningHubQuiz?.getState().contentId);
  await print.evaluate(()=>MathJax.startup.promise);
  const reports=[];
  for(const lang of ['th','en']){
    await print.locator(`[data-language-button="${lang}"]`).click();
    for(const mode of ['worksheet','answer']){
      await print.evaluate(async mode=>{LearningHubPrint.prepare(mode);await LearningHubPrint.typesetPrint();},mode);
      await print.emulateMedia({media:'print'});
      const host=print.locator('[data-print-host]');
      assert.equal(await host.locator('[data-question]').count(),50);
      assert.equal(await host.locator('[data-question-solution]').count(),mode==='answer'?50:0);
      assert.equal(await host.locator('.quiz-paper-workspace').count(),mode==='worksheet'?50:0);
      assert.equal(await host.locator(mathErrors).count(),0);
      assert.equal(await host.locator(`[data-quiz-language="${lang==='th'?'en':'th'}"]`).count(),0);
      assert.ok(await host.locator('mjx-container').count()>50);
      const overflow=await host.locator('[data-question-solution] mjx-container').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().right>n.closest('[data-question-solution]').getBoundingClientRect().right+2).map(n=>n.textContent));
      assert.deepEqual(overflow,[],`${lang}/${mode} print formulas`);
      const file=`bohr-quiz-${lang}-${mode}.pdf`;
      await print.pdf({path:resolve(output,file),preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
      reports.push({lang,mode,file,questions:50,solutions:mode==='answer'?50:0});
      await print.evaluate(()=>LearningHubPrint.restore());await print.emulateMedia({media:'screen'});
    }
  }
  await writeFile(resolve(output,'print-report.json'),JSON.stringify(reports,null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  console.log('PASS four actual TH/EN worksheet/answer PDFs: 50 questions, correct solution visibility, no math overflow/errors; no page errors/missing local files');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
