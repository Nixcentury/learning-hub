import { get, getDatabase, ref, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { firebaseApp } from './firebase-config.js';
import { getAuthSession, subscribeAuth } from './auth.js';
import { getWorkspaceSimulationContentId } from './workspace.js';
import { createSimulationProgressBridge } from './simulation-progress-bridge.js';
import { waveAssessmentModel as model, readWaveAssessmentPayload } from '../public/shared/wave-assessment-progress.js';

const database=getDatabase(firebaseApp);
let epoch=0,previous=null;
subscribeAuth(session=>{const uid=session.status==='signed-in'?session.user?.uid:null;if(uid!==previous){epoch++;previous=uid;}});
const handle=createSimulationProgressBridge({
  origin:location.origin,
  getSession:()=>{const session=getAuthSession();return {uid:session.status==='signed-in'?session.user?.uid:null,epoch};},
  getContentId:getWorkspaceSimulationContentId,
  read:async path=>{const result=await get(ref(database,path));return result.exists()?readWaveAssessmentPayload(result.val()):null;},
  write:async(path,incoming,current,owner)=>{
    const {runTransaction}=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js');
    const result=await runTransaction(ref(database,path),old=>{
      if(!current())return;
      const merged=model.mergeRecords(readWaveAssessmentPayload(old),incoming);
      return {schemaVersion:1,revision:model.revision,...owner,payload:JSON.stringify(merged),updatedAt:serverTimestamp()};
    },{applyLocally:false});
    if(!result.committed)throw Error('simulation-progress/session-changed');
    return readWaveAssessmentPayload(result.snapshot.val());
  },
  reply:(target,message)=>target.postMessage(message,location.origin),
});
window.addEventListener('message',event=>void handle(event));
