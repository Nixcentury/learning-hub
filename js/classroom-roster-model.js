import { classroomError, roomIdPattern } from './classroom-model.js';

export function cleanStudentEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw classroomError('classroom/invalid-email');
  return email;
}
export async function invitationKey(roomId, email) {
  if (!roomIdPattern.test(roomId)) throw classroomError('classroom/invalid-room');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(roomId + '\n' + cleanStudentEmail(email)));
  return 'i_' + Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
export function removeMemberUpdates(roomId, uid, member, timestamp) {
  return {
    ['members/' + roomId + '/' + uid]: null,
    ['userRooms/' + uid + '/' + roomId]: null,
    ['removed/' + roomId + '/' + uid]: { member, removedAt: timestamp },
  };
}
export function restoreMemberUpdates(roomId, uid, record) {
  return {
    ['members/' + roomId + '/' + uid]: record.member,
    ['userRooms/' + uid + '/' + roomId]: 'student',
    ['removed/' + roomId + '/' + uid]: null,
  };
}
