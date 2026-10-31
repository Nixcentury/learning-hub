import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function buildAssignmentRules() {
  const signed = 'auth != null';
  const teacher = "(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)";
  const owner = `${signed} && ${teacher} && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() === auth.uid`;
  const member = `${signed} && root.child('classroomV1/members').child($roomId).child(auth.uid).exists()`;
  const draft = "root.child('classroomAssignmentsV1/drafts').child($roomId).child($assignmentId)";
  const item = "root.child('classroomAssignmentsV1/items').child($roomId).child($assignmentId)";
  const none = { '.validate': false };
  const text = (max, empty = false) => ({ '.validate': `newData.isString() && newData.val().length ${empty ? '>=' : '>'} 0 && newData.val().length <= ${max}` });
  const immutable = keys => keys.map(key => `newData.child('${key}').val() === data.child('${key}').val()`).join(' && ');
  const required = ['version','ownerUid','title','instructions','dueAt','targetHash','contentId','quizTitleTh','quizTitleEn','status','createdAt','updatedAt','publishedAt','revision'];
  function record(published) {
    const creation = published ? `((${draft}.exists() && newData.child('createdAt').val() === ${draft}.child('createdAt').val()) || (!${draft}.exists() && newData.child('createdAt').val() === now))` : "newData.child('createdAt').val() === now";
    const revision = published ? `((${draft}.exists() && newData.child('revision').val() === ${draft}.child('revision').val() + 1) || (!${draft}.exists() && newData.child('revision').val() === 1))` : "newData.child('revision').val() === 1";
    return {
      '.write': `${owner} && ${published ? 'newData.exists()' : `(!newData.exists() || !${item}.exists())`}`,
      '.validate': `$roomId.matches(/^r_[a-f0-9]{32}$/) && $assignmentId.matches(/^a_[a-f0-9]{32}$/) && newData.hasChildren(${JSON.stringify(required)}) && newData.child('ownerUid').val() === auth.uid && (data.exists() ? (${immutable(['ownerUid','createdAt'])} && newData.child('revision').val() === data.child('revision').val() + 1) : (${creation} && ${revision}))` +
        (published ? ` && (!data.exists() ? newData.child('status').val() === 'published' && newData.child('publishedAt').val() === now : (${immutable(['targetHash','contentId','quizTitleTh','quizTitleEn','publishedAt'])} && (data.child('status').val() !== 'closed' || newData.child('status').val() === 'closed'))) && !newData.parent().parent().parent().child('drafts').child($roomId).child($assignmentId).exists()` : " && newData.child('status').val() === 'draft' && newData.child('publishedAt').val() === 0"),
      version: { '.validate': 'newData.val() === 1' }, ownerUid: text(128), title: text(180), instructions: text(4000, true),
      dueAt: { '.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() <= 4102444800000 && newData.val() % 1 === 0' },
      requiresAssignmentId: { '.validate': "newData.isString() && newData.val().matches(/^a_[a-f0-9]{32}$/) && newData.val() !== $assignmentId && root.child('classroomAssignmentsV1/items').child($roomId).child(newData.val()).exists()" +
        (published ? " && root.child('classroomAssignmentsV1/items').child($roomId).child(newData.val()).child('publishedAt').val() < newData.parent().child('publishedAt').val()" : '') },
      targetHash: { '.validate': "newData.isString() && newData.val().matches(/^#[a-z0-9][a-z0-9/-]{0,519}$/)" },
      contentId: { '.validate': "newData.isString() && newData.val().matches(/^[a-z0-9][a-z0-9_-]{0,127}$/)" },
      quizTitleTh: text(180), quizTitleEn: text(180),
      status: { '.validate': published ? "newData.val() === 'published' || newData.val() === 'closed'" : "newData.val() === 'draft'" },
      createdAt: { '.validate': 'newData.isNumber()' }, updatedAt: { '.validate': 'newData.val() === now' }, publishedAt: { '.validate': 'newData.isNumber()' },
      revision: { '.validate': 'newData.isNumber() && newData.val() > 0 && newData.val() <= 1000000000 && newData.val() % 1 === 0' }, '$other': none,
    };
  }
  return { '.read': false, '.write': false,
    drafts: { '$roomId': { '.read': owner, '$assignmentId': record(false) } },
    items: { '$roomId': { '.read': `(${owner}) || (${member})`, '$assignmentId': record(true) } },
    seen: { '$roomId': { '$uid': {
      '.read': `(${member}) && auth.uid === $uid`,
      '$assignmentId': {
        '.write': `(${member}) && auth.uid === $uid && ${item}.exists() && newData.exists()`,
        '.validate': "$roomId.matches(/^r_[a-f0-9]{32}$/) && $assignmentId.matches(/^a_[a-f0-9]{32}$/) && newData.isNumber() && (data.exists() ? newData.val() === data.val() : newData.val() === now)",
      },
    } } }, '$other': none,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../firebase/classroom-assignment.rules.json', import.meta.url), JSON.stringify({ rules: { classroomAssignmentsV1: buildAssignmentRules() } }, null, 2) + '\n');
  if (process.argv[2]) {
    const base = JSON.parse(await readFile(process.argv[2], 'utf8'));
    if (!base.rules?.classroomV1 || base.rules.classroomAssignmentsV1 || base.rules['.read'] === true || base.rules['.write'] === true) throw Error('Expected reviewed current Rules with classroomV1 and without classroomAssignmentsV1 or an open root.');
    await writeFile(new URL('../firebase/classroom-assignment.merged-draft.json', import.meta.url), JSON.stringify({ rules: { ...base.rules, classroomAssignmentsV1: buildAssignmentRules() } }, null, 2) + '\n');
  }
  console.log('Assignment Rules generated locally; nothing deployed.');
}
