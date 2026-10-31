import {
  assignmentIdPattern,
  assignmentRoomPattern,
} from './classroom-assignment-model.js';

export const classroomSheetColumns = [
  'ExportVersion',
  'ExportedAt',
  'RowType',
  'RoomID',
  'RoomName',
  'AssignmentID',
  'AssignmentTitle',
  'Instructions',
  'ContentID',
  'HubURL',
  'DueAt',
  'AssignmentStatus',
  'StudentUID',
  'StudentName',
  'Status',
  'Score',
  'MaxScore',
  'Percent',
  'SubmittedAt',
  'SubmissionRevision',
  'SubmissionID',
];
// Protect spreadsheet applications from interpreting user-authored text as a
// formula. The importer reverses this encoding before validating the payload.
export function classroomCsvText(value) {
  const text = String(value ?? '');
  return /^(?:\s*[=+@-]|['\t\r\n])/.test(text) ? "'" + text : text;
}
export function createClassroomSheetCsv({
  roomId,
  roomName = '',
  item,
  hubUrl,
  rows,
  exportedAt = Date.now(),
}) {
  if (
    !assignmentRoomPattern.test(roomId) ||
    !assignmentIdPattern.test(item?.id) ||
    !['published', 'closed'].includes(item.status)
  )
    throw Error('homework/invalid-request');
  const url = new URL(hubUrl);
  const local =
    url.protocol === 'http:' &&
    ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !local) || url.username || url.password)
    throw Error('homework/invalid-request');
  url.search = '';
  url.hash = `classroom/${roomId}/${item.id}`;
  const iso = (value) =>
    Number.isFinite(value) && value > 0
      ? new Date(value).toISOString()
      : (() => {
          throw Error('homework/invalid-result');
        })();
  const base = [
    1,
    iso(exportedAt),
    'assignment',
    roomId,
    roomName,
    item.id,
    item.title,
    item.instructions || '',
    item.contentId,
    url.href,
    item.dueAt ? iso(item.dueAt) : '',
    item.status,
  ];
  const records = [[...base, ...Array(9).fill('')]];
  const seen = new Set();
  for (const row of rows) {
    if (
      typeof row.uid !== 'string' ||
      !row.uid ||
      row.uid.length > 128 ||
      [...row.uid].some(
        (char) => char.charCodeAt(0) < 32 || '/.#$[]'.includes(char),
      ) ||
      seen.has(row.uid)
    )
      throw Error('homework/invalid-result');
    seen.add(row.uid);
    const valid = row.submitted && row.grade && !row.grade.error;
    const grade = row.grade;
    if (
      valid &&
      (!Number.isFinite(grade.score) ||
        !Number.isFinite(grade.maxScore) ||
        grade.maxScore <= 0 ||
        grade.score < 0 ||
        grade.score > grade.maxScore ||
        grade.percent !==
          Math.round((grade.score / grade.maxScore) * 10000) / 100 ||
        !Number.isSafeInteger(grade.submissionRevision) ||
        grade.submissionRevision < 1 ||
        !/^[a-f0-9]{32}$/.test(row.submissionId || ''))
    )
      throw Error('homework/invalid-result');
    records.push([
      ...base.slice(0, 2),
      'student',
      ...base.slice(3),
      row.uid,
      row.name,
      valid ? 'submitted' : row.submitted ? 'grading_error' : 'not_submitted',
      valid ? grade.score : '',
      valid ? grade.maxScore : '',
      valid ? grade.percent : '',
      valid ? iso(grade.submittedAt) : '',
      valid ? grade.submissionRevision : '',
      valid ? row.submissionId : '',
    ]);
  }
  const cell = (value) =>
    '"' +
    (typeof value === 'string'
      ? classroomCsvText(value)
      : String(value)
    ).replaceAll('"', '""') +
    '"';
  return (
    '\uFEFF' +
    [classroomSheetColumns, ...records]
      .map((row) => row.map(cell).join(','))
      .join('\r\n') +
    '\r\n'
  );
}
