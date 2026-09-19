// Generate a scoped Rules fragment. Supplying a baseline also produces a merged
// deployment draft; this script NEVER publishes to Firebase.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const teacher = `(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)`;
const signed = "auth != null";
const owner = `${signed} && ${teacher} && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() === auth.uid`;
const proposed = "newData.parent().parent()";
const proposedIndex = "newData.parent().parent().parent()";
const roomKey = "$roomId.matches(/^r_[a-f0-9]{32}$/)";
const codeKey = "$code.matches(/^[A-HJ-NP-Z2-9]{8}$/)";
const text = length => ({ ".validate": `newData.isString() && newData.val().length > 0 && newData.val().length <= ${length}` });
const timestamp = { ".validate": "newData.isNumber() && (newData.val() === now || (data.exists() && newData.val() === data.val()))" };
const none = { ".validate": false };
export const classroomRules = {
  ".read": false, ".write": false,
  rooms: { "$roomId": {
    ".read": `(${owner}) || (${signed} && root.child('classroomV1/members').child($roomId).child(auth.uid).exists())`,
    ".write": `${signed} && ${teacher} && !data.exists() && newData.exists() && newData.child('ownerUid').val() === auth.uid`,
    ".validate": `${roomKey} && newData.hasChildren(['name','ownerUid','joinCode','createdAt']) && ${proposed}.child('joinCodes').child(newData.child('joinCode').val()).child('roomId').val() === $roomId && ${proposed}.child('joinCodes').child(newData.child('joinCode').val()).child('ownerUid').val() === auth.uid && ${proposed}.child('userRooms').child(auth.uid).child($roomId).val() === 'owner'`,
    name: text(100), ownerUid: { ".validate": "newData.val() === auth.uid" },
    joinCode: { ".validate": "newData.isString() && newData.val().matches(/^[A-HJ-NP-Z2-9]{8}$/)" },
    createdAt: timestamp, "$other": none,
  } },
  joinCodes: { "$code": {
    ".read": signed,
    ".write": `${signed} && ${teacher} && !data.exists() && newData.exists() && newData.child('ownerUid').val() === auth.uid`,
    ".validate": `${codeKey} && newData.hasChildren(['roomId','ownerUid']) && ${proposed}.child('rooms').child(newData.child('roomId').val()).child('joinCode').val() === $code && ${proposed}.child('rooms').child(newData.child('roomId').val()).child('ownerUid').val() === auth.uid`,
    roomId: { ".validate": "newData.isString() && newData.val().matches(/^r_[a-f0-9]{32}$/)" },
    ownerUid: { ".validate": "newData.val() === auth.uid" }, "$other": none,
  } },
  members: { "$roomId": {
    ".read": owner,
    "$uid": {
      ".read": `${signed} && auth.uid === $uid`,
      ".write": `${signed} && auth.uid === $uid && newData.exists() && root.child('classroomV1/rooms').child($roomId).exists() && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() !== auth.uid && newData.child('joinCode').val() === root.child('classroomV1/rooms').child($roomId).child('joinCode').val() && root.child('classroomV1/joinCodes').child(newData.child('joinCode').val()).child('roomId').val() === $roomId`,
      ".validate": `${roomKey} && newData.hasChildren(['displayName','joinedAt','joinCode']) && ${proposedIndex}.child('userRooms').child($uid).child($roomId).val() === 'student' && (!data.exists() || (newData.child('displayName').val() === data.child('displayName').val() && newData.child('joinedAt').val() === data.child('joinedAt').val() && newData.child('joinCode').val() === data.child('joinCode').val()))`,
      displayName: text(120), joinedAt: timestamp,
      joinCode: { ".validate": "newData.isString() && newData.val().matches(/^[A-HJ-NP-Z2-9]{8}$/)" }, "$other": none,
    },
  } },
  userRooms: { "$uid": {
    ".read": `${signed} && auth.uid === $uid`,
    "$roomId": {
      ".write": `${signed} && auth.uid === $uid && newData.exists()`,
      ".validate": `${roomKey} && ((newData.val() === 'owner' && ${teacher} && ${proposedIndex}.child('rooms').child($roomId).child('ownerUid').val() === auth.uid) || (newData.val() === 'student' && ${proposedIndex}.child('members').child($roomId).child(auth.uid).exists() && ${proposedIndex}.child('rooms').child($roomId).child('ownerUid').val() !== auth.uid))`,
    },
  } },
  "$other": none,
};
const folder = fileURLToPath(new URL("../firebase/", import.meta.url));
await mkdir(folder, { recursive: true });
await writeFile(resolve(folder, "classroom-phase1.rules.json"), JSON.stringify({ rules: { classroomV1: classroomRules } }, null, 2) + "\n");
if (process.argv[2]) {
  const base = JSON.parse(await readFile(process.argv[2], "utf8"));
  if (!base.rules?.learningHub || base.rules.classroomV1) throw Error("Expected Phase 0 baseline without classroomV1. Review instead of overwriting an existing classroom branch.");
  await writeFile(resolve(folder, "classroom-phase1.merged-draft.json"), JSON.stringify({ rules: { ...base.rules, classroomV1: classroomRules } }, null, 2) + "\n");
}
console.log("Classroom Rules generated locally; nothing published.");
