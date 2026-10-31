import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export function buildLinksRules() {
  const teacher = "(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)";
  const owner = `auth != null && ${teacher} && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() === auth.uid`;
  const member = "auth != null && root.child('classroomV1/members').child($roomId).child(auth.uid).exists()";
  const allowed = `((${owner}) || (${member}))`;
  const text = max => ({ '.validate': `newData.isString() && newData.val().length > 0 && newData.val().length <= ${max}` });
  return { '.read': false, '.write': false, items: { '$roomId': {
    '.read': allowed,
    '$linkId': {
      '.write': `${allowed} && $roomId.matches(/^r_[a-f0-9]{32}$/) && $linkId.matches(/^l_[a-f0-9]{32}$/) && (!data.exists() ? newData.child('authorUid').val() === auth.uid : data.child('authorUid').val() === auth.uid || (${owner}))`,
      '.validate': "newData.hasChildren(['version','title','url','authorUid','authorName','createdAt','updatedAt','revision']) && (data.exists() ? newData.child('authorUid').val() === data.child('authorUid').val() && newData.child('authorName').val() === data.child('authorName').val() && newData.child('createdAt').val() === data.child('createdAt').val() && newData.child('revision').val() === data.child('revision').val() + 1 : newData.child('createdAt').val() === now && newData.child('revision').val() === 1)",
      version: { '.validate': 'newData.val() === 1' }, title: text(180),
      url: { '.validate': 'newData.isString() && newData.val().length <= 2048 && newData.val().matches(/^https?:\\/\\/[A-Za-z0-9\\[][-A-Za-z0-9._\\[\\]:]*(\\/[!-~]*)?(\\?[!-~]*)?(#[!-~]*)?$/)' },
      authorUid: text(128),
      authorName: { '.validate': `newData.isString() && newData.val().length > 0 && newData.val().length <= 120 && (data.exists() || (${owner}) || newData.val() === root.child('classroomV1/members').child($roomId).child(auth.uid).child('displayName').val())` },
      createdAt: { '.validate': 'newData.isNumber()' }, updatedAt: { '.validate': 'newData.val() === now' },
      revision: { '.validate': 'newData.isNumber() && newData.val() > 0 && newData.val() <= 1000000000 && newData.val() % 1 === 0' },
      '$other': { '.validate': false },
    },
  } }, '$other': { '.validate': false } };
}
export function mergeLinksRules(base) {
  if (base.rules?.['.read'] !== false || base.rules?.['.write'] !== false || !base.rules.classroomV1 || !base.rules.classroomAssignmentsV1 || !base.rules.classroomSubmissionsV1 || base.rules.classroomLinksV1)
    throw Error('Expected the reviewed full Rules with a closed root and no existing classroomLinksV1. Nothing was replaced.');
  return { ...base, rules: { ...base.rules, classroomLinksV1: buildLinksRules() } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../firebase/classroom-links.rules.json', import.meta.url), JSON.stringify({ rules: { classroomLinksV1: buildLinksRules() } }, null, 2) + '\n');
  if (process.argv[2]) {
    const base = JSON.parse(await readFile(process.argv[2], 'utf8'));
    const output = process.argv[3] || fileURLToPath(new URL('../firebase/classroom-links.merged-draft.json', import.meta.url));
    await writeFile(output, JSON.stringify(mergeLinksRules(base), null, 2) + '\n');
  }
  console.log('Classroom links Rules generated locally. Nothing deployed.');
}
