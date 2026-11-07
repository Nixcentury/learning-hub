(() => {
 'use strict';
 const B=globalThis.WaveMiniBridge,Q=globalThis.MiniWaveMissions,contentId='physics-ipst-wave-optics-10-1-mini-sim';
 let identity='guest',epoch=0,applying=false,localOK=true,loaded=false,cloud=false,pending=false,saving=false,timer=null,request=0,changedAt=0;
 const requests=new Map(),key=()=>`learning-hub-wave-assessment:${Q.revision}:${identity}`;
 const status=()=>globalThis.MiniWaveGuidance?.syncStorageStatus();
 function snapshot(){const {work,mode}=B.read();return Q.record(work,mode,changedAt);}
 function localRead(){try{const r=JSON.parse(localStorage.getItem(key())||'null');return Q.validRecord(r)?r:null;}catch{return null;}}
 function adoptResults(record){if(!Q.validRecord(record))return;const work=B.read().work;for(const mode of Q.modes){const current=work[mode].mission,merged=record.missions[mode];for(const name of ['bestAnswers','checkedAnswers','checkedAt','completed','seen'])current[name]=structuredClone(merged[name]);}globalThis.MiniWaveGuidance?.summary();}
 function localWrite(value=snapshot()){try{localStorage.setItem(key(),JSON.stringify(value));localOK=true;}catch{localOK=false;}status();return localOK;}
 function apply(value){if(!Q.validRecord(value))return;applying=true;try{B.restoreAssessment(value);changedAt=value.updatedAt;}finally{applying=false;}}
 function call(type,value){return new Promise((resolve,reject)=>{const id=`wave-${epoch}-${++request}`,owner=identity,revision=epoch;const timeout=setTimeout(()=>{requests.delete(id);reject(Error('timeout'));},10000);requests.set(id,{owner,revision,resolve,reject,timeout});parent.postMessage({type,requestId:id,uid:owner,contentId,value},location.origin);});}
 async function sync(){
  clearTimeout(timer);timer=null;
  if(identity==='guest'||!loaded||saving||!pending||parent===window)return;
  const owner=identity,revision=epoch;let success=false;saving=true;pending=false;cloud=false;status();
  try{
    const sent=snapshot(),value=await call('learning-hub-simulation-save',sent);
    if(owner!==identity||revision!==epoch)return;
    const current=snapshot(),merged=Q.mergeRecords(current,value);
    // A response cannot replace text being typed. On the next load the saved
    // record is merged in full; the current live draft keeps its own focus.
    adoptResults(merged);localWrite(merged);cloud=!pending;success=true;
  }catch{if(owner===identity&&revision===epoch){pending=true;cloud=false;}}
  finally{if(owner===identity&&revision===epoch){saving=false;status();if(pending&&success)timer=setTimeout(sync,600);}}
 }
 function changed(){if(applying)return;changedAt=Date.now();localWrite();if(identity!=='guest'){pending=true;cloud=false;clearTimeout(timer);timer=setTimeout(sync,600);}status();}
 async function switchIdentity(next){
  epoch++;for(const r of requests.values()){clearTimeout(r.timeout);r.reject(Error('account-changed'));}requests.clear();
  clearTimeout(timer);identity=next||'guest';loaded=false;saving=false;pending=false;cloud=false;changedAt=0;
  const local=localRead();if(local)apply(local);localWrite();
  if(identity==='guest'||parent===window){loaded=true;status();return;}
  const owner=identity,revision=epoch,startedAt=changedAt;status();
  try{const remote=await call('learning-hub-simulation-load');if(owner!==identity||revision!==epoch)return;const merged=Q.mergeRecords(snapshot(),remote);if(changedAt===startedAt)apply(merged);else adoptResults(merged);localWrite(merged);cloud=true;}
  catch{if(owner===identity&&revision===epoch)cloud=false;}
  finally{if(owner===identity&&revision===epoch){loaded=true;pending=true;status();timer=setTimeout(sync,600);}}
 }
 window.addEventListener('message',event=>{
  const m=event.data;if(event.source!==parent||event.origin!==location.origin||m?.type!=='learning-hub-simulation-storage-result'||m.contentId!==contentId)return;
  const r=requests.get(m.requestId);if(!r||r.owner!==identity||r.revision!==epoch||m.uid!==identity)return;
  clearTimeout(r.timeout);requests.delete(m.requestId);if(m.ok)r.resolve(m.value);else r.reject(Error(m.code||'unavailable'));
 });
 const flush=()=>{localWrite();if(identity!=='guest')pending=true;void sync();return localOK;};
 window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});window.addEventListener('online',()=>{pending=true;void sync();});
 globalThis.WaveAssessmentStorage={changed,switchIdentity,flush,statusText:lang=>{
  const t=(th,en)=>lang==='en'?en:th;
  if(!localOK)return t('ยังบันทึกในเครื่องไม่ได้ โปรดอย่าปิดหน้านี้','Local saving failed; keep this page open.');
  if(identity==='guest'||parent===window)return t('บันทึกในเครื่องนี้ · ผู้เยี่ยมชมไม่ซิงก์ข้ามเครื่อง','Saved on this device · guest progress does not sync across devices.');
  if(!loaded)return t('บันทึกในเครื่องแล้ว · กำลังโหลดความคืบหน้าบัญชี','Saved locally · loading account progress.');
  if(cloud&&!pending)return t('บันทึกกับบัญชีแล้ว','Saved to your account.');
  return t('บันทึกในเครื่องแล้ว · รอซิงก์กับบัญชีเมื่อเชื่อมต่อได้','Saved locally · waiting to sync to your account.');
 }};
 if(window.LearningHubSimulation)window.LearningHubSimulation.flushLocal=flush;
 void switchIdentity(B.read().identity);
})();
