import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
export function buildSubmissionRules() {
  const teacher = "(root.child('learningHub/admins').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).val() === true || root.child('learningHub/teacherApprovals').child(auth.uid).child('enabled').val() === true)";
  const owner = `auth != null && ${teacher} && root.child('classroomV1/rooms').child($roomId).child('ownerUid').val() === auth.uid`;
  const member = "auth != null && root.child('classroomV1/members').child($roomId).child(auth.uid).exists()";
  const item = "root.child('classroomAssignmentsV1/items').child($roomId).child($assignmentId)";
  const quiz = "root.child('classroomSubmissionsV1/quizzes').child($roomId).child($assignmentId)";
  const result = "root.child('classroomSubmissionsV1/results').child($roomId).child($assignmentId).child($uid)";
  const history = "root.child('classroomSubmissionsV1/history').child($roomId).child($assignmentId).child($uid)";
  const newArchive = "newData.parent().parent().parent().parent().child('history').child($roomId).child($assignmentId).child($uid).child(data.child('submissionId').val())";
  const newLatest = "newData.parent().parent().parent().parent().parent().child('results').child($roomId).child($assignmentId).child($uid)";
  const fields = ['version','contentId','quizRevision','answersJson','giveUpsJson','elapsedMs','dueAt','submissionId','submittedAt','submissionRevision'];
  const matches = (left, right) => fields.map(field => `${left}.child('${field}').val() === ${right}.child('${field}').val()`).join(' && ');
  const self = `(${member}) && auth.uid === $uid`;
  const open = `${item}.child('status').val() === 'published'`;
  const ids = "$roomId.matches(/^r_[a-f0-9]{32}$/) && $assignmentId.matches(/^a_[a-f0-9]{32}$/)";
  const none = { '.validate': false };
  const text = max => ({ '.validate': `newData.isString() && newData.val().length > 0 && newData.val().length <= ${max}` });
  const timestamp = { '.validate': 'newData.val() === now' };
  const integer = max => ({ '.validate': `newData.isNumber() && newData.val() >= 0 && newData.val() <= ${max} && newData.val() % 1 === 0` });
  const binding = { version: { '.validate': 'newData.val() === 1' },
    contentId: { '.validate': `newData.val() === ${quiz}.child('contentId').val()` },
    quizRevision: { '.validate': `newData.isString() && newData.val() === ${quiz}.child('revision').val()` } };
  return { '.read': false, '.write': false,
    quizzes: { '$roomId': { '.read': `(${owner}) || (${member})`, '$assignmentId': {
      '.write': `(${owner}) && !data.exists() && newData.exists() && ${open}`,
      '.validate': `${ids} && newData.hasChildren(['version','contentId','targetHash','revision','html','questionCount','createdAt'])`,
      version: { '.validate': 'newData.val() === 1' },
      contentId: { '.validate': `newData.isString() && newData.val() === ${item}.child('contentId').val()` },
      targetHash: { '.validate': `newData.val() === ${item}.child('targetHash').val()` },
      revision: { '.validate': 'newData.isString() && newData.val().matches(/^[a-f0-9]{64}$/)' },
      html: text(400000), questionCount: { '.validate': 'newData.isNumber() && newData.val() >= 1 && newData.val() <= 500 && newData.val() % 1 === 0' },
      createdAt: timestamp, '$other': none,
    } } },
    attempts: { '$roomId': { '$assignmentId': { '$uid': {
      '.read': `(${self}) && ${item}.exists()`,
      '.write': `(${self}) && ${open} && ${quiz}.exists() && newData.exists()`,
      '.validate': `${ids} && newData.hasChildren(['version','contentId','quizRevision','progressJson','createdAt','updatedAt','revision']) && (${result}.exists() ? newData.child('baseSubmissionId').val() === ${result}.child('submissionId').val() : !newData.child('baseSubmissionId').exists() || newData.child('baseSubmissionId').val() === '') && (data.exists() ? newData.child('createdAt').val() === data.child('createdAt').val() && newData.child('revision').val() === data.child('revision').val() + 1 : newData.child('createdAt').val() === now && newData.child('revision').val() === 1)`,
      ...binding, progressJson: text(80000), createdAt: { '.validate': 'newData.isNumber()' }, updatedAt: timestamp,
      baseSubmissionId: { '.validate': "newData.isString() && (newData.val() === '' || newData.val().matches(/^[a-f0-9]{32}$/))" },
      revision: { '.validate': 'newData.isNumber() && newData.val() > 0 && newData.val() <= 1000000000 && newData.val() % 1 === 0' }, '$other': none,
    } } } },
    results: { '$roomId': { '.read': owner, '$assignmentId': { '$uid': {
      '.read': `(${self}) && ${item}.exists()`,
      '.write': `(${self}) && ${open} && ${quiz}.exists() && newData.exists()`,
      '.validate': `${ids} && newData.hasChildren(['version','contentId','quizRevision','answersJson','giveUpsJson','elapsedMs','dueAt','submissionId','submittedAt']) && (data.exists() ? newData.child('submissionRevision').val() === (data.child('submissionRevision').exists() ? data.child('submissionRevision').val() : 1) + 1 && newData.child('submissionId').val() !== data.child('submissionId').val() && !${history}.child(newData.child('submissionId').val()).exists() && ${newArchive}.exists() && ${matches(newArchive, 'data')} : !newData.child('submissionRevision').exists() || newData.child('submissionRevision').val() === 1)`,
      ...binding, answersJson: text(60000), giveUpsJson: text(16000), elapsedMs: integer(31536000000),
      dueAt: { '.validate': `newData.val() === ${item}.child('dueAt').val()` },
      submissionId: { '.validate': 'newData.isString() && newData.val().matches(/^[a-f0-9]{32}$/)' },
      submissionRevision: { '.validate': 'newData.isNumber() && newData.val() > 0 && newData.val() <= 1000000000 && newData.val() % 1 === 0' },
      submittedAt: timestamp, '$other': none,
    } } } },
    history: { '$roomId': { '$assignmentId': { '$uid': {
      '.read': `(${owner}) || ((${self}) && ${item}.exists())`,
      '$submissionId': {
        '.write': `(${self}) && ${open} && !data.exists() && newData.exists()`,
        '.validate': `${ids} && $submissionId === ${result}.child('submissionId').val() && ${newLatest}.child('submissionRevision').val() === (${result}.child('submissionRevision').exists() ? ${result}.child('submissionRevision').val() : 1) + 1 && ${newLatest}.child('submissionId').val() !== $submissionId && ${matches('newData', result)}`,
        ...Object.fromEntries(fields.map(field => [field, { '.validate': true }])), '$other': none,
      },
    } } } }, '$other': none,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../firebase/classroom-submission.rules.json', import.meta.url), JSON.stringify({rules:{classroomSubmissionsV1:buildSubmissionRules()}},null,2)+'\n');
  if (process.argv[2]) {
    const base = JSON.parse(await readFile(process.argv[2], 'utf8'));
    if (!base.rules?.classroomAssignmentsV1 || !base.rules?.classroomV1 || (base.rules.classroomSubmissionsV1 && !process.argv.includes('--replace-submissions')) || base.rules['.read'] !== false || base.rules['.write'] !== false) throw Error('Expected reviewed homework Rules with a closed root. To upgrade an existing submissions namespace, pass --replace-submissions.');
    await writeFile(new URL('../firebase/classroom-submission.merged-draft.json', import.meta.url),JSON.stringify({...base,rules:{...base.rules,classroomSubmissionsV1:buildSubmissionRules()}},null,2)+'\n');
  }
  console.log('Submission Rules generated locally; nothing deployed.');
}
