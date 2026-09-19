import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createClassroomAccess } from "../js/classroom-access.js";

const account = uid => ({ status: "signed-in", user: { uid, displayName: uid, email: uid + "@example.test" } });
const approved = { uid: "teacher-a", status: "ready", systemRole: "teacher", isTeacher: true };
test("guest and startup have separate views; email does not grant teacher access", () => {
  assert.equal(createClassroomAccess({status:"guest"}, approved).state, "guest");
  assert.equal(createClassroomAccess({status:"loading"}, approved).state, "loading");
  assert.equal(createClassroomAccess(account("teacher-a"), {...approved, systemRole:"student", isTeacher:false}).state, "student");
});
test("teacher result must belong to the currently signed-in UID", () => {
  assert.equal(createClassroomAccess(account("teacher-a"), approved).state, "teacher");
  assert.equal(createClassroomAccess(account("student-b"), approved).state, "loading");
  assert.equal(createClassroomAccess(account("teacher-a"), {...approved, uid:null}).state, "loading");
});
test("partial, denied and malformed access fail closed", () => {
  assert.equal(createClassroomAccess(account("teacher-a"), {...approved, status:"loading"}).state, "loading");
  assert.equal(createClassroomAccess(account("teacher-a"), {...approved, status:"error"}).state, "error");
  assert.equal(createClassroomAccess(account("teacher-a"), {...approved, isTeacher:"true"}).state, "student");
});
test("pending approval remains a student; account names are replaced on switching", () => {
  const result = createClassroomAccess(account("student-b"), {uid:"student-b",status:"ready",systemRole:"student",requestStatus:"pending"});
  assert.equal(result.state, "student");
  assert.equal(result.requestStatus, "pending");
  assert.equal(result.email, "student-b@example.test");
});

// Execute the real role module with in-memory Firebase callbacks, no network.
function harness() {
  let session = {status:"signed-out"};
  let onAuth;
  const watchers = [];
  const writes = [];
  const io = { get: async () => ({exists:()=>true}), update: async (...args) => {writes.push(args);} };
  const context = vm.createContext({
    console: {warn(){}}, firebaseApp:{}, getDatabase:()=>({}), ref:(_,path)=>path,
    get: (...args)=>io.get(...args), update:(...args)=>io.update(...args),
    set:async (...args)=>writes.push(args), remove:async (...args)=>writes.push(args), serverTimestamp:()=>0,
    getAuthSession:()=>session, subscribeAuth:fn=>{onAuth=fn;fn(session);},
    onValue:(path,ok,error)=>{const entry={path,ok,error,active:true};watchers.push(entry);return ()=>{entry.active=false;};},
    document:{dispatchEvent(){}}, CustomEvent:class{}, window:{},
  });
  const source = readFileSync(new URL("../js/roles.js", import.meta.url),"utf8")
    .replace(/^import[\s\S]*?from\s+"[^"]+";\s*/gm,"").replace(/^export\s+/gm,"");
  vm.runInContext(source,context);
  return {
    api:context.window.HubRoles, writes, watchers, io,
    login(uid) { session=uid ? account(uid) : {status:"signed-out"};onAuth(session); },
    emit(kind,value,fail=false) {
      const entry=watchers.findLast(w=>w.active && w.path.includes("/"+kind+"/"));
      if(fail) entry.error(new Error("permission-denied"));
      else entry.ok({exists:()=>value!==null,val:()=>value});
    },
    complete(teacher=null,admin=null,request=null) {this.emit("admins",admin);this.emit("teacherApprovals",teacher);this.emit("teacherRequests",request);},
  };
}
test("real roles do not grant privileges while only one read is complete", () => {
  const h=harness(); h.login("a"); h.emit("admins",true);
  assert.equal(h.api.getState().isAdmin,false);
  assert.equal(h.api.getState().status,"loading");
  h.emit("teacherApprovals",null);h.emit("teacherRequests",null);
  assert.equal(h.api.getState().isAdmin,true);
  assert.equal(h.api.getState().uid,"a");
});
test("only explicit approvals grant teacher status", () => {
  for(const value of ["true",1,{}, {enabled:false}, {enabled:"true"}]) {
    const h=harness();h.login("a");h.complete(value);
    assert.equal(h.api.getState().isTeacher,false);
  }
  for(const value of [true,{enabled:true}]) {
    const h=harness();h.login("a");h.complete(value);
    assert.equal(h.api.getState().isTeacher,true);
  }
});
test("admin marker must be exactly true, matching the Rules contract", () => {
  const h=harness();h.login("a");h.complete(null,{enabled:true});
  assert.equal(h.api.getState().isAdmin,false);
});
test("denied permission read blocks teacher view and retry creates fresh listeners", () => {
  const h=harness();h.login("a");h.complete({enabled:true});
  h.emit("admins",null,true);
  assert.equal(h.api.getState().status,"error");
  assert.equal(h.api.getState().isTeacher,false);
  h.api.retry();
  assert.equal(h.api.getState().status,"loading");
  h.complete({enabled:true});
  assert.equal(h.api.getState().isTeacher,true);
  assert.equal(h.watchers.filter(w=>w.active).length,3);
});
test("request metadata failures warn but do not invent or revoke verified teacher permissions", () => {
  const h=harness();h.login("a");h.emit("admins",null);h.emit("teacherApprovals",{enabled:true});h.emit("teacherRequests",null,true);
  assert.equal(h.api.getState().status,"ready");
  assert.equal(h.api.getState().isTeacher,true);
  assert.equal(h.api.getState().error,"request");
});
test("switch/logout clears privileges; queued old-account callbacks cannot restore them", () => {
  const h=harness();h.login("a");h.complete({enabled:true});
  const old=h.watchers.slice();h.login("b");h.complete();
  old.forEach(w=>w.ok({exists:()=>true,val:()=>true}));
  assert.equal(h.api.getState().uid,"b");
  assert.equal(h.api.getState().isTeacher,false);
  h.login(null);old.forEach(w=>w.error(new Error("late")));
  assert.equal(h.api.getState().uid,null);
  assert.equal(h.api.getState().status,"signed-out");
});
test("pending request is not an approval, even if its status is forged as approved", () => {
  const h=harness();h.login("a");h.complete(null,null,{status:"approved"});
  assert.equal(h.api.getState().isTeacher,false);
});
test("teacher request writes only the own pending request, never an approval", async () => {
  const h=harness();h.login("a");h.complete();
  await h.api.requestTeacherAccess({school:"School",subjects:"Physics"});
  const request=h.writes.find(([path])=>path.includes("teacherRequests"));
  assert.equal(request[0],"learningHub/teacherRequests/a");
  assert.equal(request[1].status,"pending");
  assert.equal(h.writes.some(([path])=>path.includes("teacherApprovals") || path.includes("admins")),false);
  assert.equal(h.api.getState().isTeacher,false);
});
test("a profile write completing after account switch cannot clear the new account error", async () => {
  const h=harness();
  let finishOld;
  h.io.update=path=>path.endsWith("/a") ? new Promise(resolve=>{finishOld=resolve;}) : Promise.reject(new Error("profile denied"));
  h.login("a");await new Promise(setImmediate);
  h.login("b");h.complete();await new Promise(setImmediate);
  assert.equal(h.api.getState().error,"profile");
  finishOld();await new Promise(setImmediate);
  assert.equal(h.api.getState().uid,"b");
  assert.equal(h.api.getState().error,"profile");
});
