import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildAssignmentRules } from './build-classroom-assignment-rules.mjs';

// Upgrade the reviewed CURRENT Rules, preserving co-teacher/assistance access
// and every unrelated root. Never deploys or overwrites the input file.
export function mergeUngradedRules(base) {
  const result = structuredClone(base), a = result.rules?.classroomAssignmentsV1;
  const submissions = result.rules?.classroomSubmissionsV1;
  if (result.rules?.['.read'] !== false || result.rules?.['.write'] !== false ||
      !a?.drafts?.$roomId?.$assignmentId || !a?.items?.$roomId?.$assignmentId ||
      !submissions?.quizzes?.$roomId?.$assignmentId || !result.rules.classroomV1)
    throw Error('Expected reviewed current Classroom assignment/submission Rules with a closed root.');
  const next = buildAssignmentRules();
  for (const key of ['drafts', 'items']) {
    const record = a[key].$roomId.$assignmentId;
    record.activityKind = next[key].$roomId.$assignmentId.activityKind;
    if (key === 'items' && !record['.validate'].includes("newData.child('activityKind').val() === data.child('activityKind').val()"))
      record['.validate'] += " && (!data.exists() || newData.child('activityKind').val() === data.child('activityKind').val())";
    const prerequisite = record.requiresAssignmentId;
    if (!prerequisite) throw Error('Upgrade the prerequisite Rules first.');
    const scored = " && !root.child('classroomAssignmentsV1/items').child($roomId).child(newData.val()).child('activityKind').exists()";
    if (!prerequisite['.validate'].includes(scored)) prerequisite['.validate'] += scored;
  }
  a.activityProgress = next.activityProgress;
  // Existing draft readers are the room's authorized staff, including co-teachers.
  a.activityProgress.$roomId['.read'] = a.drafts.$roomId['.read'];
  const exclude = " && !root.child('classroomAssignmentsV1/items').child($roomId).child($assignmentId).child('activityKind').exists()";
  function guardQuizWrites(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node['.write'] === 'string' && node['.write'].includes("root.child('classroomAssignmentsV1/items')") && !node['.write'].includes(exclude))
      node['.write'] = '(' + node['.write'] + ')' + exclude;
    for (const child of Object.values(node)) if (child && typeof child === 'object') guardQuizWrites(child);
  }
  guardQuizWrites(submissions);
  return result;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2] || !process.argv[3] || process.argv[2] === process.argv[3])
    throw Error('Usage: node scripts/build-classroom-ungraded-rules.mjs reviewed-current.json new-output.json');
  const base = JSON.parse(await readFile(process.argv[2], 'utf8'));
  await writeFile(process.argv[3], JSON.stringify(mergeUngradedRules(base), null, 2) + '\n', { flag: 'wx' });
  console.log('Ungraded activity Rules saved to a new file; nothing deployed.');
}
