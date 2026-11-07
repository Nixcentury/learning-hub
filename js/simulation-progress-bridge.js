import { waveAssessmentModel as model, waveAssessmentContentId, waveAssessmentStorageId } from '../public/shared/wave-assessment-progress.js';

// The host determines the account and canonical activity from its live frame.
export function createSimulationProgressBridge({ origin, getSession, getContentId, read, write, reply }) {
  return async event => {
    const m=event.data,contentId=getContentId(event.source);
    if(event.origin!==origin||contentId!==waveAssessmentContentId||!['learning-hub-simulation-load','learning-hub-simulation-save'].includes(m?.type))return false;
    const session=getSession(),uid=session.uid,epoch=session.epoch;
    const current=()=>{const next=getSession();return next.uid===uid&&next.epoch===epoch&&getContentId(event.source)===contentId;};
    const respond=data=>{if(current())reply(event.source,{type:'learning-hub-simulation-storage-result',requestId:m.requestId,uid,contentId,...data});};
    if(!uid||m.uid!==uid)return true;
    if(typeof m.requestId!=='string'||!m.requestId||m.requestId.length>128||m.contentId!==contentId){respond({ok:false,code:'simulation-progress/invalid-request'});return true;}
    const path=`quizProgress/${waveAssessmentStorageId}/${uid}`;
    try {
      if(m.type==='learning-hub-simulation-load'){
        const value=await read(path);if(current())respond({ok:true,action:'load',value});return true;
      }
      const serialized=JSON.stringify(m.value);if(!serialized||serialized.length>80000||!model.validRecord(m.value))throw Error('simulation-progress/invalid-record');
      // Pass the session guard into the transaction, including server retries.
      const value=await write(path,m.value,current,{uid,contentId});
      if(current())respond({ok:true,action:'save',value});
    } catch(error){respond({ok:false,code:error?.code||error?.message||'simulation-progress/unavailable'});}
    return true;
  };
}
