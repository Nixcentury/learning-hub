import { createClassroomAccess } from './classroom-access.js';
import { cleanStudentEmail } from './classroom-roster-model.js';
import { claimRoomTeacherUpdates } from './classroom-room-teachers-model.js';

export function createRoomTeacherEnrollment({io}) {
  let signature = '', epoch = 0, stop;
  const jobs = new Set();
  function setContext(session, role) {
    const access = createClassroomAccess(session, role), user = session?.user;
    let email = ''; try { if(user?.emailVerified === true) email = cleanStudentEmail(user.email); } catch {}
    const next = ['teacher','student'].includes(access.state) && email ? access.uid + ':' + email : '';
    if(next === signature) return;
    signature = next; const version = ++epoch; stop?.(); stop = null; jobs.clear();
    if(!next) return;
    const current = () => version === epoch && signature === next;
    stop = io.watchTeacherInvitations('email',email,records => {
      if(!current()) return;
      for (const id of jobs) if (!records?.[id]) jobs.delete(id);
      for(const[id,invite] of Object.entries(records || {})) {
        if(invite.email !== email || invite.ownerUid === user.uid || invite.acceptedUid && invite.acceptedUid !== user.uid || jobs.has(id)) continue;
        jobs.add(id);
        void(async()=>{
          try {
            const previous = await io.get('teachers/' + invite.roomId + '/' + user.uid);
            if(!current()) return;
            if(previous) return;
            const patch = claimRoomTeacherUpdates(user.uid,id,invite,user.displayName || email,io.timestamp());
            if(current()) await io.update(patch);
          } catch { if(current()) jobs.delete(id); }
        })();
      }
    },()=>{}); // Old Rules must not break ordinary student/code enrollment.
  }
  return {setContext,dispose(){signature='';++epoch;stop?.();stop=null;jobs.clear();}};
}
