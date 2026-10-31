export const assignmentRoot = 'classroomAssignmentsV1';
export const assignmentIdPattern = /^a_[a-f0-9]{32}$/;
export const assignmentRoomPattern = /^r_[a-f0-9]{32}$/;
export const assignmentError = code => Object.assign(new Error(code), { code });
export const newAssignmentId = () => 'a_' + crypto.randomUUID().replaceAll('-', '');

// Classroom identifiers have underscores. Only this exact private route shape
// is accepted; the public content route grammar stays unchanged.
export function parseAssignmentRoute(hash) {
  const match = /^#classroom\/(r_[a-f0-9]{32})(?:\/(a_[a-f0-9]{32}))?$/.exec(hash || '');
  return match ? { roomId: match[1], assignmentId: match[2] || '' } : null;
}
export function assignmentHash(roomId, id = '') {
  if (!assignmentRoomPattern.test(roomId) || (id && !assignmentIdPattern.test(id))) throw assignmentError('assignment/invalid-id');
  return '#classroom/' + roomId + (id ? '/' + id : '');
}
export function assignmentUrl(roomId, id, hubUrl) {
  const url = new URL('./', hubUrl);
  url.search = ''; url.hash = assignmentHash(roomId, id);
  return url.href;
}
export function cleanAssignmentFields(value) {
  const title = String(value.title || '').trim();
  const instructions = String(value.instructions || '').trim();
  const dueAt = Number(value.dueAt || 0);
  const requiresAssignmentId = String(value.requiresAssignmentId || '').trim();
  const control = text => [...text].some(char => char.charCodeAt(0) < 32);
  if (!title || title.length > 180 || control(title)) throw assignmentError('assignment/invalid-title');
  if (instructions.length > 4000 || control(instructions.replaceAll('\n', '').replaceAll('\r', '').replaceAll('\t', ''))) throw assignmentError('assignment/invalid-instructions');
  if (!Number.isSafeInteger(dueAt) || dueAt < 0 || dueAt > 4102444800000) throw assignmentError('assignment/invalid-due');
  if (requiresAssignmentId && !assignmentIdPattern.test(requiresAssignmentId)) throw assignmentError('assignment/invalid-prerequisite');
  return { title, instructions, dueAt, ...(requiresAssignmentId ? { requiresAssignmentId } : {}) };
}
export function thaiDateInput(timestamp) {
  if (!timestamp) return '';
  return new Date(Number(timestamp) + 7 * 3600000).toISOString().slice(0, 16);
}
export function parseThaiDateInput(value) {
  if (!value) return 0;
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) throw assignmentError('assignment/invalid-due');
  const time = Date.parse(value + ':00+07:00');
  if (!Number.isFinite(time) || time < 0 || time > 4102444800000 || thaiDateInput(time) !== value) throw assignmentError('assignment/invalid-due');
  return time;
}
export function assignmentStatus(item, now = Date.now()) {
  return item.status === 'draft' || item.status === 'closed' ? item.status : item.dueAt && item.dueAt < now ? 'overdue' : 'published';
}
