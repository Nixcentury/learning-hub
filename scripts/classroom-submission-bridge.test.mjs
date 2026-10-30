import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const code=(await readFile(new URL('../js/classroom-submission-bridge.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/gm,'').replace('export function','function');
function fixture() {
  let handler,uid='student',live=true;
  const replies=[],calls=[],binding={uid,roomId:'room',id:'assignment'},source={postMessage:message=>replies.push(message)};
  const scope=vm.createContext({window:{addEventListener:(_,fn)=>{handler=fn;}},location:{origin:'https://example.test'},getWorkspaceHomework:from=>live&&from===source?binding:null});
  vm.runInContext(code,scope);
  const service={async quizCommand(...args){calls.push(args);return{storageRevision:1};}};
  scope.installHomeworkBridge({submissions:service,getSession:()=>({status:'signed-in',user:{uid}}),onBack:()=>calls.push('back')});
  return{replies,calls,service,source,binding,setUid:value=>{uid=value;},remove:()=>{live=false;},
    send:(data={},extra={})=>handler({source,origin:'https://example.test',...extra,data:{type:'learning-hub-homework-save',uid:'student',requestId:'request',contentId:'quiz',...data}})};
}
test('homework bridge uses the workspace binding rather than student-supplied room and assignment IDs',async()=>{
  const f=fixture();await f.send({roomId:'forged',id:'forged'});assert.equal(f.calls[0][1],f.binding);assert.equal(f.replies[0].ok,true);
  for(const event of [{origin:'https://evil.test'},{source:{}}])await f.send({},event);
  await f.send({uid:'other'});assert.equal(f.calls.length,1);
});
test('removed frames and account changes cannot receive late submission results',async()=>{
  const f=fixture();let finish;f.service.quizCommand=()=>new Promise(done=>{finish=done;});const operation=f.send();
  f.setUid('other');finish({result:{private:true}});await operation;assert.equal(f.replies.length,0);
  f.setUid('student');const second=f.send();f.remove();finish({result:{private:true}});await second;assert.equal(f.replies.length,0);
});
test('permission failures stay failures and do not become successful submissions',async()=>{
  const f=fixture();f.service.quizCommand=async()=>{throw{code:'PERMISSION_DENIED'};};await f.send();assert.equal(f.replies[0].ok,false);assert.equal(f.replies[0].code,'PERMISSION_DENIED');
});
