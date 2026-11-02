// This is presentation/service logic; RTDB independently verifies each room role.
export function canTeachRoom(room, uid, approvedTeacher = false) {
  return Boolean(uid && room?.ownerUid && (room.membership === 'teacher' || approvedTeacher && room.membership === 'owner' && room.ownerUid === uid));
}
