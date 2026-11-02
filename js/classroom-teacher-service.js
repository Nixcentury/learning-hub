import { createClassroomAccess } from './classroom-access.js';
import { findTeacherAccount, teacherApprovalPatch, teacherDirectory, teacherError } from '../public/shared/classroom-teacher-model.js';

// Directory data stays in the parent and is observed only while explicitly open.
export function createClassroomTeachers({ io, onChange }) {
  let uid = '', canManage = false, active = false, opened = false, epoch = 0, stop = [], timer;
  let status = 'inactive', error = '', busy = '', connected = false, query = '', candidate = null, success = '';
  let values = { profiles: {}, approvals: {}, requests: {} }, directory = teacherDirectory();
  const snapshot = () => ({ uid, canManage, opened, status, error, busy, connected, query, candidate,
    teachers: directory.teachers, pending: directory.pending, success });
  const publish = () => onChange(structuredClone(snapshot()));
  function clearData() {
    ++epoch; clearTimeout(timer); for (const unsubscribe of stop.splice(0)) unsubscribe?.();
    values = { profiles: {}, approvals: {}, requests: {} }; directory = teacherDirectory();
    query = ''; candidate = null; busy = ''; error = ''; success = ''; connected = false;
  }
  function guard(expectedUid = uid, version = epoch) {
    if (!uid || !active || !canManage) throw teacherError('teachers/admin-required');
    if (expectedUid !== uid || version !== epoch || !opened) throw teacherError('teachers/session-changed');
  }
  function ready() {
    if (status !== 'ready') throw teacherError('teachers/not-ready');
    if (!connected) throw teacherError('teachers/offline');
    if (busy) throw teacherError('teachers/busy');
  }
  function setContext(session, role, visible) {
    const access = createClassroomAccess(session, role);
    const nextUid = visible && access.state === 'teacher' ? access.uid : '';
    const nextManage = Boolean(nextUid && role.isAdmin === true && role.systemRole === 'admin');
    if (uid === nextUid && canManage === nextManage && active === Boolean(visible)) return;
    clearData(); uid = nextUid; canManage = nextManage; active = Boolean(visible); opened = false;
    status = uid && canManage ? 'idle' : 'inactive'; publish();
  }
  function close() { clearData(); opened = false; status = uid && canManage ? 'idle' : 'inactive'; publish(); }
  function open() {
    if (!uid || !active || !canManage) throw teacherError('teachers/admin-required');
    clearData(); opened = true; status = 'loading'; publish();
    const version = epoch, loaded = new Set();
    const live = () => version === epoch && opened;
    const fail = failure => {
      if (!live()) return;
      clearData(); status = 'error'; error = String(failure?.code || failure?.message || 'teachers/unavailable'); publish();
    };
    timer = setTimeout(() => fail(teacherError('teachers/read-timeout')), 15000); timer.unref?.();
    function watch(path, receive) {
      const unsubscribe = io.watch(path, receive, fail);
      if (live()) stop.push(unsubscribe); else unsubscribe?.();
    }
    watch('.info/connected', value => { if (live()) { connected = value === true; publish(); } });
    for (const [key, path] of [['profiles', 'profiles'], ['approvals', 'teacherApprovals'], ['requests', 'teacherRequests']]) {
      if (!live()) break;
      watch(path, value => {
        if (!live()) return;
        values[key] = value || {}; loaded.add(key); directory = teacherDirectory(values.profiles, values.approvals, values.requests);
        if (query) { try { candidate = findTeacherAccount(directory.people, query).person; } catch (failure) { candidate = null; error = failure.code; } }
        if (loaded.size === 3) { clearTimeout(timer); status = 'ready'; }
        publish();
      });
    }
  }
  function clearSearch() { query = ''; candidate = null; error = ''; success = ''; publish(); }
  function search(value) {
    guard(); ready(); error = ''; success = ''; candidate = null; query = '';
    try {
      const result = findTeacherAccount(directory.people, value); query = result.query; candidate = result.person;
      if (!candidate) error = 'teachers/account-missing';
    } catch (failure) { error = failure.code; }
    publish();
  }
  async function command(action, targetUid, expectedUid = uid) {
    guard(expectedUid); ready();
    if (!['approve', 'revoke'].includes(action)) throw teacherError('teachers/invalid-action');
    const approved = directory.teachers.some(row => row.uid === targetUid);
    const known = directory.people.some(row => row.uid === targetUid) || directory.pending.some(row => row.uid === targetUid);
    if (action === 'approve' && approved) throw teacherError('teachers/already-approved');
    if ((action === 'approve' && !known) || (action === 'revoke' && !approved)) throw teacherError('teachers/account-missing');
    if (action === 'revoke' && targetUid === uid) throw teacherError('teachers/self-revoke');
    const version = epoch, actor = uid;
    const hasRequest = Object.hasOwn(values.requests, targetUid) && values.requests[targetUid] !== null && typeof values.requests[targetUid] === 'object';
    const patch = teacherApprovalPatch(action, targetUid, actor, io.timestamp(), hasRequest);
    busy = action; error = ''; success = ''; publish();
    try {
      await io.update(patch); guard(actor, version); success = action; publish(); return { uid: targetUid };
    } catch (failure) {
      if (version === epoch) { error = String(failure?.code || failure?.message || 'teachers/unavailable'); publish(); }
      throw failure;
    } finally { if (version === epoch) { busy = ''; publish(); } }
  }
  return { setContext, open, close, search, clearSearch, command, getState: () => structuredClone(snapshot()), dispose: close };
}
