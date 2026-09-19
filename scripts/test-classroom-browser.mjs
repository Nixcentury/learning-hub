import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Sattawat.b/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const prefix = "/Physic-subject/";
// The app, role resolution and Classroom UI are real. Auth and database only
// are deterministic substitutes. All external traffic is intercepted.
const auth = `
let session={status:"guest",isGuest:true,user:null}; const subscribers=new Set();
export const getAuthSession=()=>session;
export function subscribeAuth(fn){subscribers.add(fn);fn(session);return ()=>subscribers.delete(fn);}
window.qaSession=uid=>{session=uid?{status:"signed-in",isGuest:false,user:{uid,displayName:"Account "+uid,email:uid+"@example.test"}}:{status:"signed-out",user:null};subscribers.forEach(fn=>fn(session));};
export async function continueAsGuest(){session={status:"guest",isGuest:true,user:null};subscribers.forEach(fn=>fn(session));}
export async function signInWithGoogle(){window.qaSession("teacher-a");}
export async function signOutFromHub(){window.qaSession(null);}
`;
const presence = `export function setPresenceContext(){} export async function stopPresence(){} export function subscribePresence(fn){fn({connectionStatus:'OFFLINE',rows:[],counts:{active:0,online:0,idle:0,visible:0},error:''});return ()=>{};}`;
const database = `
const watchers=[],writes=[]; export const getDatabase=()=>({}); export const ref=(_,path)=>path;
export const serverTimestamp=()=>Date.now();
export async function get(){return {exists:()=>true,val:()=>({})};}
export async function update(path,value){writes.push({path,value});}
export async function set(path,value){writes.push({path,value});}
export async function remove(path){writes.push({path,value:null});}
export function onValue(path,ok,error){const w={path,ok,error,active:true};watchers.push(w);return ()=>{w.active=false;};}
window.qaDb={
  emit(uid,kind,value,fail=false,old=false){watchers.filter(w=>(old || w.active) && w.path==="learningHub/"+kind+"/"+uid).forEach(w=>fail?w.error(new Error("permission-denied")):w.ok({exists:()=>value!==null,val:()=>value}));},
  complete(uid,teacher=false,admin=false,request=null){this.emit(uid,"admins",admin?true:null);this.emit(uid,"teacherApprovals",teacher?{enabled:true}:null);this.emit(uid,"teacherRequests",request);},
  writes
};
`;
const server=createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,"http://localhost").pathname);
    if(!pathname.startsWith(prefix)) throw Error("Outside fixture base");
    const name=pathname.slice(prefix.length)||"index.html";
    let path=resolve(root,name);
    if(!path.startsWith(root+sep)) throw Error("Outside root");
    let data;
    try {data=await readFile(path);} catch {path=resolve(root,"public",name);data=await readFile(path);}
    if(name === "index.html") data = data.toString().replaceAll("%BASE_URL%",prefix);
    response.setHeader("Content-Type",({".html":"text/html; charset=utf-8",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".woff2":"font/woff2"})[extname(name)]||"application/octet-stream");
    response.end(data);
  }catch{response.writeHead(404);response.end("Not found");}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin="http://127.0.0.1:"+server.address().port;
let browser;
try{
  browser=await chromium.launch({channel:"msedge",headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route("**/*",route=>{
    const url=new URL(route.request().url()),name=url.pathname.split("/").at(-1);
    const replacements={"auth.js":auth,"presence.js":presence,"firebase-config.js":"export const firebaseApp={};"};
    if(url.origin===origin && url.pathname.includes("/js/") && replacements[name]) return route.fulfill({contentType:"text/javascript",body:replacements[name]});
    if(url.hostname==="www.gstatic.com" && name==="firebase-database.js") return route.fulfill({contentType:"text/javascript",body:database});
    if(url.origin!==origin) return route.fulfill({contentType:"text/javascript",body:""});
    return route.continue();
  });
  const page=await context.newPage();
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(origin+prefix+"#classroom");
  const classroom=page.frameLocator("#hub-page-frame");
  async function state(expected) {
    await classroom.locator('body[data-classroom-access="'+expected+'"]').waitFor();
    assert.equal(await classroom.locator("[data-classroom-state]:visible").count(),1);
  }
  async function child() {return page.locator("#hub-page-frame").elementHandle().then(handle=>handle.contentFrame());}
  await state("guest");
  assert.equal(await classroom.locator("[data-classroom-account]").isVisible(),false);
  await classroom.locator('[data-classroom-action="sign-in"]').click();
  await state("loading");
  assert.equal(await classroom.locator('[data-classroom-state="teacher"]').isVisible(),false);
  await page.evaluate(()=>qaDb.emit("teacher-a","admins",true));
  await state("loading");
  await page.evaluate(()=>qaDb.complete("teacher-a",true));
  await state("teacher");
  assert.equal(await classroom.locator("[data-account-email]").textContent(),"teacher-a@example.test");
  console.log("PASS guest sign-in → loading with partial roles → approved teacher");
  const output=resolve(process.env.QA_OUTPUT||resolve(root,"qa-output"));
  await mkdir(output,{recursive:true});
  await page.screenshot({path:resolve(output,"classroom-phase0-teacher.png"),fullPage:true,animations:"disabled"});
  await page.locator('[data-section="physics"]').click();
  await page.locator('[data-section="classroom"]').click();
  await state("teacher");
  assert.equal(await classroom.locator("[data-account-email]").textContent(),"teacher-a@example.test");

  await classroom.locator('[data-classroom-state="teacher"] [data-classroom-action="account"]').click();
  await page.locator("#role-panel").waitFor({state:"visible"});
  await page.evaluate(()=>qaSession("student-b"));
  await state("loading");
  assert.equal(await page.locator("#role-panel").isVisible(),false);
  assert.equal(await classroom.locator("[data-account-email]").textContent(),"student-b@example.test");
  await page.evaluate(()=>{
    qaDb.complete("student-b",false,false,{status:"pending"});
    qaDb.emit("teacher-a","teacherApprovals",{enabled:true},false,true);
  });
  await state("student");
  await classroom.locator("[data-request-pending]").waitFor();
  assert.equal(await classroom.locator("body").innerText().then(text=>text.includes("teacher-a@example.test")),false);
  await page.evaluate(()=>qaSession("student-c"));
  await state("loading");
  await page.evaluate(()=>qaDb.complete("student-c"));
  await state("student");
  assert.equal(await classroom.locator("[data-request-pending]").isVisible(),false);
  assert.equal(await classroom.locator("[data-account-email]").textContent(),"student-c@example.test");
  console.log("PASS teacher → student B → student C clears account/request UI; late teacher callbacks ignored");

  await page.evaluate(()=>qaDb.emit("student-c","teacherApprovals",null,true));
  await state("error");
  assert.equal(await classroom.locator('[data-classroom-state="student"]').isVisible(),false);
  await classroom.locator('[data-classroom-state="error"] [data-classroom-action="retry"]').click();
  await state("loading");
  await page.evaluate(()=>qaDb.complete("student-c",true));
  await state("teacher");
  await page.evaluate(()=>qaDb.emit("student-c","teacherApprovals",null));
  await state("student");
  console.log("PASS denied permissions show error (not student); retry recovers; revocation hides teacher immediately");

  // Same-origin alone is insufficient: a sibling/self frame cannot claim to be the Hub.
  const frame=await child();
  await frame.evaluate(()=>{
    const data={type:"learning-hub-context",role:"teacher",identity:{status:"signed-in",uid:"student-c"},classroom:{state:"teacher",uid:"student-c",email:"forged@example.test"}};
    window.dispatchEvent(new MessageEvent("message",{data,origin:location.origin,source:window}));
    window.dispatchEvent(new MessageEvent("message",{data,origin:"https://foreign.test",source:parent}));
  });
  await state("student");
  assert.equal(await classroom.locator("[data-account-email]").textContent(),"student-c@example.test");
  await page.evaluate(()=>qaDb.emit("student-c","teacherRequests",{status:"approved"}));
  await state("student");
  console.log("PASS wrong-source/origin messages and forged request status do not promote account");

  await page.locator('#hub-view [data-language="en"]').click();
  await classroom.getByRole("heading",{name:"My classroom workspace",exact:true}).waitFor();
  assert.equal(await classroom.locator('[data-classroom-state="student"] h2').textContent(),"My classroom workspace");
  await page.setViewportSize({width:390,height:844});
  assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:resolve(output,"classroom-phase0-student-mobile.png"),fullPage:true,animations:"disabled"});
  await page.locator("#sign-out-button").click();
  await classroom.locator('body[data-classroom-access="guest"]').waitFor({state:"attached"});
  assert.equal(await classroom.locator("[data-account-name]").textContent(),"");
  assert.equal(await page.locator("#login-view").isVisible(),true);
  assert.equal(await page.locator("#role-panel").isVisible(),false);
  console.log("PASS language/mobile layout; logout clears identity and returns to sign-in");

  // Direct file/page must not infer login from role query/localStorage.
  const direct=await context.newPage();
  await direct.goto(origin+prefix+"pages/classroom.html?role=teacher&lang=en");
  await direct.locator('body[data-classroom-access="standalone"]').waitFor();
  assert.equal(await direct.locator('[data-classroom-state="teacher"]').isVisible(),false);
  assert.equal(await direct.locator('[data-classroom-state="standalone"] a').evaluate(a=>a.href),origin+prefix+"index.html#classroom");
  assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(()=>qaDb.writes.some(w=>/teacherApprovals|admins/.test(w.path))),false);
  console.log("PASS standalone guard; no role promotion writes; no live Firebase traffic");
} finally {
  await browser?.close();
  await new Promise(done=>server.close(done));
}
