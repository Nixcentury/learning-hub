import { cleanStudentEmail } from './classroom-roster-model.js';
import { classroomError, roomIdPattern } from './classroom-model.js';
export async function roomTeacherInvitationKey(roomId, value) {
  if (!roomIdPattern.test(roomId)) throw classroomError('classroom/invalid-room');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(roomId + '\nteacher\n' + cleanStudentEmail(value)));
  return 't_' + [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}
export function claimRoomTeacherUpdates(uid, inviteId, invite, name, stamp, previous = null) {
  if (!roomIdPattern.test(invite.roomId) || !/^t_[a-f0-9]{64}$/.test(inviteId)) throw classroomError('classroom/invalid-invitation');
  return {
    ['teachers/' + invite.roomId + '/' + uid]: previous || { email: cleanStudentEmail(invite.email), displayName: String(name || invite.email).trim().slice(0,120), joinedAt: stamp, invitationId: inviteId },
    ['teacherInvitations/' + inviteId + '/acceptedUid']: uid,
    ['userRooms/' + uid + '/' + invite.roomId]: 'teacher',
  };
}
export function revokeRoomTeacherUpdates(roomId, uid, record, wasStudent) {
  return { ['teachers/' + roomId + '/' + uid]: null, ['teacherInvitations/' + record.invitationId]: null,
    ['userRooms/' + uid + '/' + roomId]: wasStudent ? 'student' : null };
}
