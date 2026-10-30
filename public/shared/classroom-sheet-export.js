import { assignmentIdPattern, assignmentRoomPattern } from './classroom-assignment-model.js';

export const classroomSheetColumns = ['ExportVersion','RowType','RoomID','RoomName','AssignmentID','AssignmentTitle','Instructions','ContentID','HubURL','DueAt','AssignmentStatus','StudentUID','StudentName','Status','Score','MaxScore','Percent','SubmittedAt','SubmissionRevision','SubmissionID'];
// Protect spreadsheet applications from interpreting user-authored text as a
// formula. The importer reverses this encoding before validating the payload.
export function classroomCsvText(value) {
  const text = String(value ?? '');
  return /^(?:\s*[=+@-]|['\t\r\n])/.test(text) ? "'" + text : text;
}
export function createClassroomSheetCsv({ roomId, roomName = '', item, hubUrl, rows }) {
  if (!assignmentRoomPattern.test(roomId) || !assignmentIdPattern.test(item?.id) || !['published','closed'].includes(item.status)) throw Error('homework/invalid-request');
  const url = new URL(hubUrl);
  if (url.protocol !== 'https:') throw Error('homework/invalid-request');
  url.search = ''; url.hash = `classroom/${roomId}/${item.id}`;
  const iso = value => value ? new Date(value).toISOString() : '';
  const base = [1,'assignment',roomId,roomName,item.id,item.title,item.instructions || '',item.contentId,url.href,iso(item.dueAt),item.status];
  const records = [[...base,...Array(9).fill('')]];
  for (const row of rows) {
    const valid = row.submitted && row.grade && !row.grade.error;
    const grade = row.grade;
    if (valid && (!Number.isFinite(grade.score) || !Number.isFinite(grade.maxScore) || grade.maxScore <= 0 || grade.score < 0 || grade.score > grade.maxScore || !Number.isFinite(grade.percent) || !Number.isSafeInteger(grade.submissionRevision) || grade.submissionRevision < 1 || !/^[a-f0-9]{32}$/.test(row.submissionId || ''))) throw Error('homework/invalid-result');
    records.push([...base.slice(0,1),'student',...base.slice(2),row.uid,row.name,valid ? 'submitted' : row.submitted ? 'grading_error' : 'not_submitted',
      valid ? grade.score : '',valid ? grade.maxScore : '',valid ? grade.percent : '',valid ? iso(grade.submittedAt) : '',valid ? grade.submissionRevision : '',valid ? row.submissionId : '']);
  }
  const cell = value => '"' + (typeof value === 'string' ? classroomCsvText(value) : String(value)).replaceAll('"','""') + '"';
  return '\uFEFF' + [classroomSheetColumns,...records].map(row=>row.map(cell).join(',')).join('\r\n') + '\r\n';
}
