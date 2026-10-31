// Presentation QA: the production Classroom page, with synthetic context from
// a same-origin parent. No Google/Firebase requests or real student data.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
const root = resolve(new URL('../', import.meta.url).pathname), prefix = '/learning-hub/';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const rid = 'r_'+'a'.repeat(32), aid = 'a_'+'b'.repeat(32), aid2 = 'a_'+'c'.repeat(32), draft = 'a_'+'d'.repeat(32), closed = 'a_'+'e'.repeat(32);
const stamp = Date.now();
const base = {title:'ทวนเรื่องคลื่น',instructions:'ทบทวนการเคลื่อนที่ของคลื่น แล้วทำ Quiz\nกลับไปแก้ข้อผิดและส่งใหม่ได้จนกว่าครูปิดงาน',targetHash:'#content/wave-quiz',contentId:'wave-quiz',quizTitleTh:'คลื่นและสมบัติของคลื่น',quizTitleEn:'Waves and their properties',status:'published',revision:1,publishedAt:stamp-3600000,dueAt:stamp+86400000};
function context(owner = true, uid = owner?'teacher':'student', language='th') {
  const room = {id:rid,name:'ฟิสิกส์ ม.5/1 · ห้องทดสอบ',ownerUid:'teacher',membership:owner?'owner':'student',joinCode:'ABCD2345'};
  const items = [{...base,id:aid},{...base,id:aid2,title:'งานที่ 2 · การสะท้อนและหักเห',publishedAt:stamp-7200000,dueAt:stamp+172800000},{...base,id:closed,title:'งานทบทวนที่ปิดแล้ว',status:'closed',publishedAt:stamp-86400000,dueAt:0}];
  const grades = Object.fromEntries(items.map(item=>[item.id,{ready:true,loaded:true,rows:owner?[
    {uid:'student',name:'นักเรียนทดสอบ ก',submitted:item.id!==aid,grade:item.id!==aid?{score:5,maxScore:10,percent:50,submittedAt:stamp-300000,submissionRevision:1}:null},
    {uid:'student-b',name:'นักเรียนทดสอบ ข',submitted:true,grade:{score:8,maxScore:10,percent:80,submittedAt:stamp-600000,submissionRevision:2}},
  ]:[{uid,name:'นักเรียนทดสอบ ก',submitted:item.id!==aid,grade:item.id!==aid?{score:5,maxScore:10,percent:50,submittedAt:stamp-300000,submissionRevision:1}:null}]}]));
  return {type:'learning-hub-context',language,role:owner?'teacher':'student',identity:{status:'signed-in',uid},classroom:{uid,state:owner?'teacher':'student',displayName:owner?'ครูทดสอบ':'นักเรียนทดสอบ',email:uid+'@example.test'},
    classroomRooms:{uid,status:'ready',roomStatus:'ready',busy:'',rooms:[room],selected:room,members:owner?[{uid:'student',displayName:'นักเรียนทดสอบ ก',joinedAt:stamp},{uid:'student-b',displayName:'นักเรียนทดสอบ ข',joinedAt:stamp}]:[]},
    classroomAssignments:{uid,connected:true,busy:'',hubUrl:'https://example.test/learning-hub/',rooms:[{...room,status:'ready',items,lessonShortcuts:Object.fromEntries(items.map(item=>[item.id,{hash:'#physics/10',titleTh:'บทที่ 10 แสงเชิงคลื่น',titleEn:'Chapter 10 Wave Optics'}])),drafts:owner?[{...base,id:draft,title:'งานร่าง · ยังไม่เผยแพร่',status:'draft',publishedAt:0}]:[],seen:{}}]},
    classroomSubmissions:{uid,roomId:rid,connected:true,ready:true,grades},
    classroomMonitor:{uid,selectedRoomId:rid,connected:true,ready:true,busy:'',rooms:[{...room,session:{id:'s_'+'f'.repeat(32),active:true,startedAt:stamp,endsAt:stamp+3600000}}],lesson:owner?null:{roomId:rid,joined:true},rows:owner?[
      {uid:'student',displayName:'นักเรียนทดสอบ ก',status:'visible',lastSeenAt:stamp,windows:1,location:{hash:'#content/wave-quiz',titleTh:'Quiz · คลื่น',titleEn:'Quiz · Waves'}},
      {uid:'student-b',displayName:'นักเรียนทดสอบ ข',status:'hidden',lastSeenAt:stamp-20000,windows:1,location:{hash:'#physics/bank',titleTh:'คลังข้อสอบฟิสิกส์',titleEn:'Physics question bank'},incident:{id:'qa-incident',ackAt:0}},
    ]:[]}
  };
}
const harness = `<!doctype html><html lang="th"><head><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#edf2f8;font:14px system-ui}header{height:44px;box-sizing:border-box;padding:12px 20px;background:#1d355e;color:white}iframe{display:block;width:100%;height:calc(100vh - 44px);border:0}</style></head><body><header>Learning Hub · Classroom layout QA</header><iframe title="Classroom" id="room" src="${prefix}pages/classroom.html"></iframe><script>
const frame=document.getElementById('room');window.qa={context:${JSON.stringify(context()).replaceAll('<','\\u003c')},commands:[],send(){frame.contentWindow.postMessage(this.context,location.origin);},replace(value){this.context=value;this.send();}};
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow||event.origin!==location.origin)return;const m=event.data;
 if(m.type==='learning-hub-page-ready'){qa.send();return;}
 if(m.type==='learning-hub-assignment-command'){
  qa.commands.push(m);let result={};
  if(m.action==='view'){result={id:m.payload.id,roomId:m.payload.roomId};qa.context.classroomAssignmentRoute={roomId:m.payload.roomId,assignmentId:m.payload.id};}
  if(m.action==='seen'){qa.context.classroomAssignments.rooms[0].seen[m.payload.id]=Date.now();}
  if(m.action==='export-sheet')result={filename:'hub-homework-'+m.payload.id.slice(2)+'.csv',csv:'QA presentation CSV\\r\\n'};
  frame.contentWindow.postMessage({type:'learning-hub-assignment-result',uid:m.uid,requestId:m.requestId,ok:true,result},location.origin);qa.send();
 }
 if(m.type==='learning-hub-monitor-command'){qa.commands.push(m);frame.contentWindow.postMessage({type:'learning-hub-monitor-result',uid:m.uid,requestId:m.requestId,ok:true},location.origin);}
});</script></body></html>`;
const server = createServer(async(req,res)=>{
  try {
    const path = new URL(req.url,'http://localhost').pathname;
    if(path===prefix+'__layout'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(harness);return;}
    if(!path.startsWith(prefix))throw Error('Outside base');
    const file=resolve(root,'dist',decodeURIComponent(path.slice(prefix.length)));
    if(!file.startsWith(resolve(root,'dist')+sep))throw Error('Outside build');
    const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port, output=resolve(root,'qa-output'), errors=[];
let browser, page;
try {
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  const browserContext=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
  await browserContext.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  page=await browserContext.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+prefix+'__layout');const frame=page.frameLocator('#room');
  await frame.locator('[data-hw-feed] .homework-card').first().waitFor();await frame.locator('[data-room-monitor-slot] [data-monitor-uid="student"]').waitFor();
  const bounds=await frame.locator('[data-classroom-assignments]').evaluate(node=>{
    const get=selector=>{const r=node.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
    return {left:get('[data-hw-next-panel]'),feed:get('[data-hw-feed]'),right:get('[data-hw-right]'),tools:get('[data-hw-tools]'),monitor:get('[data-room-monitor-panel]')};
  });
  assert.ok(bounds.left.right<bounds.feed.x && bounds.feed.right<bounds.right.x,'Three separate desktop columns');assert.ok(bounds.tools.bottom<bounds.monitor.y,'Teacher tools above monitoring');
  assert.equal(await frame.locator('[data-hw-feed] [data-homework-action="edit"]').count(),0);
  await frame.locator(`[data-assignment-id="${aid}"] [data-homework-action="select"]`).click();
  await frame.locator('[data-hw-selection]').filter({hasText:base.title}).waitFor();
  for(const action of ['edit','close','scores','export-sheet'])assert.equal(await frame.locator(`[data-hw-tools] [data-homework-action="${action}"]`).getAttribute('data-id'),aid);
  assert.equal(await frame.locator('[data-hw-detail-dialog]').evaluate(node=>node.open),false,'Selecting a post preserves the feed');
  await mkdir(output,{recursive:true});await page.screenshot({path:resolve(output,'classroom-monitor-layout-teacher-desktop.png'),fullPage:true});
  await frame.locator('[data-hw-tools] [data-homework-action="scores"]').click();
  await frame.locator('[data-hw-detail-dialog][open] [data-result-uid="student-b"]').waitFor();
  assert.ok((await frame.locator('[data-hw-detail]').textContent()).includes('8/10'));
  await frame.locator('[data-hw-detail-close]').click();
  await frame.locator('[data-hw-tools] [data-homework-action="edit"]').click();
  await frame.locator('[data-hw-editor-dialog][open]').waitFor();assert.equal(await frame.locator('[name="url"]').evaluate(node=>node.readOnly),true);
  await frame.locator('[name="title"]').fill('QA draft retained');
  await page.evaluate(()=>qa.send());assert.equal(await frame.locator('[name="title"]').inputValue(),'QA draft retained');
  await frame.locator('[data-hw-cancel]').click();
  const downloadPromise=page.waitForEvent('download');await frame.locator('[data-hw-tools] [data-homework-action="export-sheet"]').click();
  const download=await downloadPromise;assert.equal(download.suggestedFilename(),'hub-homework-'+aid.slice(2)+'.csv');
  console.log('PASS Classroom layout: desktop columns, top-right selected-work tools, modal scores/edit and CSV');

  await page.evaluate(value=>qa.replace(value),context(false));
  await frame.locator('[data-hw-tools]').waitFor({state:'hidden'});
  assert.equal(await frame.locator('[data-hw-editor]').isVisible(),false);
  assert.equal(await frame.locator('[data-monitor-people] [data-monitor-uid]').count(),0);
  assert.equal(await frame.locator('.classroom-roster').count(),0);
  assert.equal(await frame.locator('[data-hw-feed]').getByText('งานร่าง · ยังไม่เผยแพร่',{exact:true}).count(),0);
  assert.equal(await frame.locator('[data-next-assignment]').count(),3,'Submitted and closed assignments stay in the path');
  assert.equal(await frame.locator('.homework-step.is-submitted').count(),2);
  assert.equal(await frame.locator('[data-hw-add-link]').isDisabled(),true);
  await frame.locator(`[data-homework-action="lesson"][data-id="${aid}"]`).click();
  await page.waitForFunction(()=>qa.commands.some(command=>command.action==='lesson'));
  assert.equal(await page.evaluate(()=>qa.commands.at(-1).action),'lesson');
  await page.screenshot({path:resolve(output,'classroom-monitor-layout-student-path.png'),fullPage:true});
  await frame.locator('[data-hw-left]').screenshot({path:resolve(output,'classroom-monitor-layout-left-sidebar.png')});
  assert.equal(await frame.locator('[data-room-monitor-slot] [data-monitor-inbox-open]').isVisible(),true);
  for(const [width,height,name,language] of [[1024,900,'student-ipad-landscape','th'],[768,1024,'student-ipad-portrait','th'],[390,844,'student-mobile-en','en']]){
    await page.setViewportSize({width,height});await page.evaluate(value=>qa.replace(value),context(false,'student',language));
    await frame.locator('[data-hw-heading]').filter({hasText:language==='en'?'Assignment posts':'โพสต์งาน'}).waitFor();
    await frame.locator('[data-hw-next-panel]:not([open])').waitFor({state:'attached'});
    assert.equal(await frame.locator('[data-hw-next-panel]').evaluate(node=>node.open),false);
    assert.equal(await frame.locator('[data-room-monitor-panel]').evaluate(node=>node.open),false);
    assert.equal(await frame.locator('html').evaluate(node=>node.scrollWidth<=innerWidth),true,'No horizontal overflow at '+width);
    await frame.locator('[data-hw-next-panel]>summary').click();await frame.locator('[data-next-assignment]').first().waitFor();
    await frame.locator('[data-next-assignment]').first().click();
    assert.equal(await frame.locator('[data-hw-detail-dialog]').evaluate(node=>node.open),false);
    await frame.locator('[data-hw-next-panel]>summary').click();
    await page.screenshot({path:resolve(output,'classroom-monitor-layout-'+name+'.png'),fullPage:true});
  }
  console.log('PASS Classroom layout: student-only data, collapsible side panels, TH/EN at 1024/768/390');

  await page.setViewportSize({width:1440,height:1100});await page.evaluate(value=>qa.replace(value),context());
  await frame.locator('[data-hw-new]').click();await frame.locator('[data-hw-editor-dialog][open]').waitFor();
  await page.evaluate(value=>qa.replace(value),context(false,'teacher'));
  await frame.locator('[data-hw-editor-dialog]').waitFor({state:'hidden'});assert.equal(await frame.locator('[data-hw-tools]').isVisible(),false);
  const empty=context();empty.classroomAssignments.rooms[0].items=[];empty.classroomAssignments.rooms[0].drafts=[];empty.classroomSubmissions.grades={};await page.evaluate(value=>qa.replace(value),empty);
  await frame.locator('.homework-empty').waitFor();assert.equal(await frame.locator('[data-hw-new]').isEnabled(),true);
  await page.evaluate(()=>{qa.context.classroomAssignments.connected=false;qa.send();});await frame.locator('[data-hw-feedback]').filter({hasText:'การเชื่อมต่อขาด'}).waitFor();assert.equal(await frame.locator('[data-hw-new]').isEnabled(),false);
  const signedOut={type:'learning-hub-context',language:'th',identity:{status:'guest'},classroom:{state:'guest'},classroomRooms:null};await page.evaluate(value=>qa.replace(value),signedOut);
  await frame.locator('[data-classroom-assignments]').waitFor({state:'hidden'});assert.equal(await frame.locator('[data-hw-detail-dialog]').evaluate(node=>node.open),false);
  assert.deepEqual(errors,[]);console.log('PASS Classroom layout: revocation closes editor, empty/offline states and sign-out clear private content');
} catch (failure) {
  if(page){
    await mkdir(output,{recursive:true});
    await page.screenshot({path:resolve(output,'classroom-monitor-layout-failure.png'),fullPage:true}).catch(()=>{});
    console.error('LAYOUT PAGE ERRORS',errors);
    console.error('LAYOUT STATE',await page.frameLocator('#room').locator('body').evaluate(node=>({access:node.dataset.classroomAccess,owner:node.querySelector('[data-classroom-assignments]')?.dataset.owner,monitor:node.querySelector('[data-room-monitor-slot]')?.textContent.slice(0,1400)})).catch(()=>null));
  }
  throw failure;
} finally { await browser?.close();await new Promise(done=>server.close(done)); }
