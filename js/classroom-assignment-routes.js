// No database access: resolving a private URL never grants room membership.
const pattern = /^#classroom\/(r_[a-f0-9]{32})(?:\/(a_[a-f0-9]{32}))?$/;
export function classroomAssignmentRoute(hash) {
  const match = pattern.exec(hash || '');
  return match ? { kind: 'classroom-assignment', hash, aliases: [], status: 'ready',
    sectionId: 'classroom', subjectId: null, roomId: match[1], assignmentId: match[2] || '',
    parentHash: '#classroom', titleTh: 'การบ้านในห้องเรียน', titleEn: 'Classroom homework' } : null;
}
