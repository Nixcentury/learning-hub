// No database access: resolving a private URL never grants room membership.
const pattern = /^#classroom\/(r_[a-f0-9]{32})(?:\/(a_[a-f0-9]{32}))?$/;
export function classroomAssignmentRoute(hash) {
  const match = pattern.exec(hash || '');
  return match ? { kind: 'classroom-assignment', hash, aliases: [], status: 'ready',
    sectionId: 'classroom', subjectId: null, roomId: match[1], assignmentId: match[2] || '',
    parentHash: '#classroom', titleTh: 'การบ้านในห้องเรียน', titleEn: 'Classroom homework' } : null;
}

// A closed homework window returns to its own room, even if another activity
// changed the address bar meanwhile. Room access is still checked by Classroom.
export function closedHomeworkHash(homework, session) {
  const actor = homework?.actorUid || homework?.uid;
  if (!homework || !actor || session?.status !== 'signed-in' || session.user?.uid !== actor) return null;
  const route = classroomAssignmentRoute(`#classroom/${homework.roomId}/${homework.id}`);
  return route?.assignmentId ? route.hash : null;
}
