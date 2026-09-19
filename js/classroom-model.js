export const classroomRoot = "classroomV1";
export const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const codePattern = /^[A-HJ-NP-Z2-9]{8}$/;
export const roomIdPattern = /^r_[a-f0-9]{32}$/;
export function classroomError(code) { return Object.assign(new Error(code), { code }); }
export function cleanRoomName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  if (!name || name.length > 100) throw classroomError("classroom/invalid-name");
  return name;
}
export function cleanJoinCode(value) {
  const code = String(value || "").trim().toUpperCase().replace(/[\s-]/g, "");
  if (!codePattern.test(code)) throw classroomError("classroom/invalid-code");
  return code;
}
export function newRoomKey() {
  return { roomId: "r_" + crypto.randomUUID().replaceAll("-", ""), code: Array.from(crypto.getRandomValues(new Uint8Array(8)), n => codeAlphabet[n & 31]).join("") };
}
export function createRoomUpdates(uid, name, key, timestamp) {
  if (!roomIdPattern.test(key.roomId) || !codePattern.test(key.code)) throw classroomError("classroom/invalid-code");
  return {
    ["rooms/" + key.roomId]: { name: cleanRoomName(name), ownerUid: uid, joinCode: key.code, createdAt: timestamp },
    ["joinCodes/" + key.code]: { roomId: key.roomId, ownerUid: uid },
    ["userRooms/" + uid + "/" + key.roomId]: "owner",
  };
}
export function joinRoomUpdates(uid, roomId, code, displayName, timestamp, previous) {
  if (!roomIdPattern.test(roomId)) throw classroomError("classroom/invalid-room");
  return {
    ["members/" + roomId + "/" + uid]: previous || {
      displayName: String(displayName || "Student").trim().slice(0, 120) || "Student",
      joinedAt: timestamp, joinCode: cleanJoinCode(code),
    },
    ["userRooms/" + uid + "/" + roomId]: "student",
  };
}
