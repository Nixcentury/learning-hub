import { createClassroomAccess } from './classroom-access.js';
import { joinRoomUpdates } from './classroom-model.js';
import { cleanStudentEmail } from './classroom-roster-model.js';

// Only the authenticated parent observes this account's indexed email query.
// Rules verify the ID-token email; no browser-supplied email is authoritative.
export function createClassroomEnrollment({ io }) {
  let signature = '', epoch = 0, stop;
  const jobs = new Set();
  function setContext(session, role) {
    const access = createClassroomAccess(session, role), user = session?.user;
    let email = '';
    try { if (user?.emailVerified === true) email = cleanStudentEmail(user.email); } catch {}
    const next = ['teacher', 'student'].includes(access.state) && email ? access.uid + ':' + email : '';
    if (next === signature) return;
    signature = next; const version = ++epoch; stop?.(); stop = null; jobs.clear();
    if (!next) return;
    const current = () => version === epoch && signature === next;
    stop = io.watchInvitations('email', email, records => {
      if (!current()) return;
      for (const [id, invite] of Object.entries(records || {})) {
        if (invite.email !== email || invite.ownerUid === user.uid || jobs.has(id)) continue;
        jobs.add(id);
        void (async () => {
          try {
            const previous = await io.get('members/' + invite.roomId + '/' + user.uid);
            if (!current() || previous?.email) return;
            const removed = await io.get('removed/' + invite.roomId + '/' + user.uid);
            if (!current() || removed) return;
            const patch = joinRoomUpdates(user.uid, invite.roomId, invite.joinCode, user.displayName || email, io.timestamp(), previous);
            Object.assign(patch['members/' + invite.roomId + '/' + user.uid], { email, invitationId: previous?.invitationId || id });
            // Never continue a pending write after the identity changed.
            if (current()) await io.update(patch);
          } catch {
            // No optimistic membership. Re-entering/reloading Hub retries pending
            // invitations; an old Rules deployment must not break code-based join.
            if (current()) jobs.delete(id);
          }
        })();
      }
    }, () => {});
  }
  return { setContext, dispose() { signature = ''; ++epoch; stop?.(); stop = null; jobs.clear(); } };
}
