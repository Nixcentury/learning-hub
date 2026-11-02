import { roomTeacherInvitationKey, revokeRoomTeacherUpdates } from './classroom-room-teachers-model.js';
import { cleanStudentEmail, invitationKey, removeMemberUpdates, restoreMemberUpdates } from "./classroom-roster-model.js";
import { createClassroomAccess } from "./classroom-access.js";
import { classroomError, cleanRoomName, cleanJoinCode, newRoomKey, roomIdPattern, createRoomUpdates, joinRoomUpdates } from "./classroom-model.js";

// IO is injected. Production uses the authenticated Firebase SDK; tests can use
// the real database emulator. The page never supplies an authoritative UID/role.
export function createClassroomService({ io, onChange, makeKey = newRoomKey }) {
  let session = null, role = null, signature = "", epoch = 0, listRevision = 0, detailRevision = 0;
  let unwatchList, unwatchMembers, unwatchInvites, unwatchRemoved, unwatchTeachers, unwatchTeacherInvites, unwatchOwnTeacher, index = {}, busy = false, pendingCreate = null;
  let state = empty();
  function empty() { return { uid: null, status: "inactive", rooms: [], selected: null, members: [], invitations: [], removed: [], teachers: [], teacherInvitations: [], teacherRosterStatus: "idle", teacherRosterError: "", rosterError: "", rosterStatus: "idle", roomStatus: "idle", error: "", detailError: "", busy: "" }; }
  function publish(patch = {}) { state = { ...state, ...patch }; onChange(structuredClone(state)); }
  function alive(version) { return version === epoch && state.uid; }
  function guard(uid = state.uid) {
    const access = createClassroomAccess(session, role);
    if (!uid || uid !== state.uid || session?.user?.uid !== uid || !["student", "teacher"].includes(access.state) || state.status === "inactive") throw classroomError("classroom/session-changed");
    return { uid, teacher: access.state === "teacher" };
  }
  const codeOf = error => String(error?.code || error?.message || "classroom/unavailable");
  function watch(path, value, error) {
    const timer = setTimeout(() => error(classroomError("classroom/read-timeout")), 15000);
    const stop = io.watch(path, next => { clearTimeout(timer); value(next); }, failure => { clearTimeout(timer); error(failure); });
    return () => { clearTimeout(timer); stop?.(); };
  }
  async function read(path) {
    let timer;
    try { return await Promise.race([io.get(path), new Promise((_, reject) => { timer = setTimeout(() => reject(classroomError("classroom/read-timeout")), 15000); })]); }
    finally { clearTimeout(timer); }
  }
  async function loadList(version) {
    if (!alive(version) || busy) return;
    const revision = ++listRevision;
    publish({ status: "loading", error: "" });
    try {
      const records = await Promise.all(Object.entries(index || {}).map(async ([roomId, membership]) => {
        if (!roomIdPattern.test(roomId) || !["owner", "student", "teacher"].includes(membership)) throw classroomError("classroom/invalid-record");
        const room = await read("rooms/" + roomId);
        if (!room || !room.name || !room.ownerUid) throw classroomError("classroom/room-unavailable");
        return { id: roomId, name: room.name, ownerUid: room.ownerUid, joinCode: room.joinCode, createdAt: room.createdAt, membership };
      }));
      if (!alive(version) || revision !== listRevision || busy) return;
      publish({ rooms: records.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), status: "ready", error: "" });
    } catch (error) {
      if (alive(version) && revision === listRevision && !busy) publish({ status: "error", rooms: [], error: codeOf(error) });
    }
  }
  function startList() {
    unwatchList?.();
    const version = epoch;
    publish({ status: "loading", error: "" });
    unwatchList = watch("userRooms/" + state.uid, value => {
      if (!alive(version)) return;
      const wasSelectedMember = state.selected && index[state.selected.id];
      index = value || {};
      if (wasSelectedMember && index[state.selected.id] !== wasSelectedMember) {
        ++detailRevision; stopDetail();
        publish({ selected: null, rooms: state.rooms.filter(room => index[room.id]), members: [], invitations: [], removed: [], teachers: [], teacherInvitations: [], teacherRosterStatus: "idle", teacherRosterError: "", rosterError: "", rosterStatus: "idle", roomStatus: "idle", detailError: "classroom/removed" });
      }
      void loadList(version);
    }, error => {
      if (alive(version)) { ++listRevision; publish({ status: "error", rooms: [], error: codeOf(error) }); }
    });
  }
  function stopDetail() {
    unwatchMembers?.(); unwatchInvites?.(); unwatchRemoved?.(); unwatchTeachers?.(); unwatchTeacherInvites?.(); unwatchOwnTeacher?.();
    unwatchMembers = unwatchInvites = unwatchRemoved = unwatchTeachers = unwatchTeacherInvites = unwatchOwnTeacher = null;
  }
  function setContext(nextSession, nextRole, active) {
    session = nextSession; role = nextRole;
    const access = createClassroomAccess(session, role);
    const next = active && ["teacher", "student"].includes(access.state) ? access.uid + ":" + access.state : "";
    if (next === signature) return;
    signature = next; ++epoch; ++detailRevision; ++listRevision;
    unwatchList?.(); stopDetail(); unwatchList = null;
    index = {}; busy = false; pendingCreate = null;
    state = { ...empty(), uid: next ? access.uid : null };
    publish();
    if (next) startList();
  }
  async function openRoom(roomId) {
    const { uid, teacher } = guard();
    if (!roomIdPattern.test(roomId)) throw classroomError("classroom/invalid-room");
    const version = epoch, revision = ++detailRevision;
    stopDetail();
    publish({ selected: { id: roomId }, members: [], invitations: [], removed: [], teachers: [], teacherInvitations: [], teacherRosterStatus: "idle", teacherRosterError: "", rosterError: "", rosterStatus: "idle", roomStatus: "loading", detailError: "" });
    try {
      const room = await read("rooms/" + roomId);
      if (!alive(version) || revision !== detailRevision) return;
      if (!room) throw classroomError("classroom/room-unavailable");
      const owner = teacher && room.ownerUid === uid;
      const coTeacher = !owner && index[roomId] === "teacher";
      if (!owner) {
        const member = await read((coTeacher ? "teachers/" : "members/") + roomId + "/" + uid);
        if (!member) throw classroomError("classroom/room-unavailable");
      }
      if (!alive(version) || revision !== detailRevision) return;
      publish({ selected: { ...room, id: roomId, membership: owner ? "owner" : coTeacher ? "teacher" : "student" }, roomStatus: owner || coTeacher ? "loading" : "ready" });
      if (owner || coTeacher) {
        unwatchMembers = watch("members/" + roomId, value => {
          if (!alive(version) || revision !== detailRevision) return;
          const members = Object.entries(value || {}).map(([memberUid, record]) => ({ uid: memberUid, ...record }));
          publish({ members, roomStatus: "ready", detailError: "" });
        }, error => {
          if (alive(version) && revision === detailRevision) publish({ members: [], invitations: [], removed: [], teachers: [], teacherInvitations: [], teacherRosterStatus: "idle", teacherRosterError: "", rosterError: "", rosterStatus: "idle", roomStatus: "error", detailError: codeOf(error) });
        });
        if (owner && io.watchInvitations) {
          const current = () => alive(version) && revision === detailRevision;
          let invitesReady = false, removedReady = false;
          publish({ rosterStatus: 'loading' });
          const failed = error => { if (current()) publish({ rosterError: codeOf(error), rosterStatus: 'error' }); };
          unwatchInvites = io.watchInvitations('roomId', roomId, value => {
            if (current()) { invitesReady = true; publish({ invitations: Object.entries(value || {}).map(([id, record]) => ({ id, ...record })), rosterStatus: state.rosterError ? 'error' : removedReady ? 'ready' : 'loading' }); }
          }, failed);
          unwatchRemoved = watch('removed/' + roomId, value => {
            if (current()) { removedReady = true; publish({ removed: Object.entries(value || {}).map(([uid, record]) => ({ uid, ...record })), rosterStatus: state.rosterError ? 'error' : invitesReady ? 'ready' : 'loading' }); }
          }, failed);
        }
      }
      const current = () => alive(version) && revision === detailRevision;
      if (coTeacher) unwatchOwnTeacher = watch('teachers/' + roomId + '/' + uid, value => {
        if (!current() || value) return;
        ++detailRevision; stopDetail(); publish({ selected: null, members: [], teachers: [], teacherInvitations: [], roomStatus: 'idle', detailError: 'classroom/removed' });
      }, error => { if (current()) { ++detailRevision; stopDetail(); publish({ selected: null, members: [], teachers: [], teacherInvitations: [], roomStatus: 'error', detailError: codeOf(error) }); } });
      if (owner && io.watchTeacherInvitations) {
        let teachersReady = false, invitesReady = false;
        publish({ teacherRosterStatus: 'loading' });
        const failed = error => { if (current()) publish({ teacherRosterError: codeOf(error), teacherRosterStatus: 'error', teachers: [], teacherInvitations: [] }); };
        const ready = () => state.teacherRosterError ? 'error' : teachersReady && invitesReady ? 'ready' : 'loading';
        unwatchTeachers = watch('teachers/' + roomId, value => {
          if (current()) { teachersReady = true; publish({ teachers: Object.entries(value || {}).map(([uid, record]) => ({ uid, ...record })), teacherRosterStatus: ready() }); }
        }, failed);
        unwatchTeacherInvites = io.watchTeacherInvitations('roomId', roomId, value => {
          if (current()) { invitesReady = true; publish({ teacherInvitations: Object.entries(value || {}).map(([id, record]) => ({ id, ...record })), teacherRosterStatus: ready() }); }
        }, failed);
      }
    } catch (error) {
      if (alive(version) && revision === detailRevision) publish({ members: [], invitations: [], removed: [], teachers: [], teacherInvitations: [], teacherRosterStatus: "idle", teacherRosterError: "", rosterError: "", rosterStatus: "idle", roomStatus: "error", detailError: codeOf(error) });
    }
  }
  async function command(action, payload = {}, uid) {
    const current = guard(uid);
    if (busy) throw classroomError("classroom/busy");
    if (action === "open") return openRoom(String(payload.roomId || ""));
    if (action === "back") { ++detailRevision; stopDetail(); publish({ selected: null, members: [], invitations: [], removed: [], teachers: [], teacherInvitations: [], teacherRosterStatus: "idle", teacherRosterError: "", rosterError: "", rosterStatus: "idle", roomStatus: "idle", detailError: "" }); return; }
    if (action === "reload") { startList(); if (state.selected) await openRoom(state.selected.id); return; }
    if (['invite-teacher', 'cancel-teacher-invite', 'remove-teacher'].includes(action)) return manageTeachers(action, payload, current);
    if (['invite', 'cancel-invite', 'remove-member', 'restore-member'].includes(action)) return manageRoster(action, payload, current);
    if (!["create", "join"].includes(action)) throw classroomError("classroom/invalid-action");
    if (action === "create" && !current.teacher) throw classroomError("classroom/teacher-required");
    const name = action === "create" ? cleanRoomName(payload.name) : null;
    const code = action === "join" ? cleanJoinCode(payload.code) : null;
    const version = epoch;
    busy = true; ++listRevision;
    publish({ busy: action });
    let openedId;
    try {
      if (action === "create") {
        // Retain a retry key for an uncertain write while this account/page stays open.
        if (!pendingCreate || pendingCreate.name !== name) pendingCreate = { name, ...makeKey() };
        for (let attempt = 0; attempt < 5; attempt++) {
          const plan = pendingCreate;
          const existing = await read("joinCodes/" + plan.code);
          if (!alive(version)) throw classroomError("classroom/session-changed");
          if (existing) {
            if (existing.roomId === plan.roomId && existing.ownerUid === current.uid) { openedId = plan.roomId; break; }
            pendingCreate = { name, ...makeKey() }; continue;
          }
          guard(current.uid);
          try {
            await io.update(createRoomUpdates(current.uid, name, plan, io.timestamp()));
            openedId = plan.roomId; break;
          } catch (error) {
            if (!alive(version)) throw classroomError("classroom/session-changed");
            // A competing creation can claim the invitation code after our lookup.
            const collision = await read("joinCodes/" + plan.code).catch(() => null);
            if (collision && collision.roomId !== plan.roomId) { pendingCreate = { name, ...makeKey() }; continue; }
            throw error;
          }
        }
        if (!openedId) throw classroomError("classroom/code-collision");
        pendingCreate = null;
      } else {
        const match = await read("joinCodes/" + code);
        if (!alive(version)) throw classroomError("classroom/session-changed");
        if (!match || !roomIdPattern.test(match.roomId)) throw classroomError("classroom/code-not-found");
        if (match.ownerUid === current.uid || index[match.roomId] === "teacher") { openedId = match.roomId; }
        else {
          const previous = await read("members/" + match.roomId + "/" + current.uid);
          if (!alive(version)) throw classroomError("classroom/session-changed");
          guard(current.uid);
          try {
            let supportsRosterRules = true;
            const removed = await read('removed/' + match.roomId + '/' + current.uid).catch(error => {
              if (/permission.?denied/i.test(codeOf(error))) { supportsRosterRules = false; return null; }
              throw error;
            });
            if (!alive(version)) throw classroomError('classroom/session-changed');
            if (removed) throw classroomError('classroom/removed');
            guard(current.uid);
            const patch = joinRoomUpdates(current.uid, match.roomId, code, session.user.displayName || session.user.email, io.timestamp(), previous);
            if (!previous && supportsRosterRules && session.user.emailVerified === true) patch['members/' + match.roomId + '/' + current.uid].email = cleanStudentEmail(session.user.email);
            await io.update(patch);
          } catch (error) {
            if (!alive(version)) throw classroomError("classroom/session-changed");
            // Two tabs may both read an absent membership. Preserve the first
            // committed joinedAt/name instead of overwriting or reporting a duplicate.
            const committed = await read("members/" + match.roomId + "/" + current.uid).catch(() => null);
            if (!committed || committed.joinCode !== code) throw error;
            guard(current.uid);
            await io.update(joinRoomUpdates(current.uid, match.roomId, code, "", io.timestamp(), committed));
          }
          openedId = match.roomId;
        }
      }
      if (!alive(version)) throw classroomError("classroom/session-changed");
      // Success is acknowledged only after Firebase confirms the entire update.
      return { roomId: openedId };
    } finally {
      if (alive(version)) {
        busy = false; publish({ busy: "" });
        startList();
        if (openedId) await openRoom(openedId);
      }
    }
  }
  async function manageRoster(action, payload, current) {
    const roomId = String(payload.roomId || '');
    if (!current.teacher || state.selected?.membership !== 'owner' || state.selected?.id !== roomId) throw classroomError('classroom/owner-required');
    if (state.rosterError || state.roomStatus !== 'ready' || state.rosterStatus !== 'ready') throw classroomError('classroom/roster-unavailable');
    const version = epoch, revision = detailRevision;
    const valid = () => {
      guard(current.uid);
      if (!alive(version) || revision !== detailRevision || state.selected?.id !== roomId) throw classroomError('classroom/session-changed');
    };
    busy = true; publish({ busy: action });
    try {
      let patch;
      if (action === 'invite') {
        const email = cleanStudentEmail(payload.email);
        if (email === session.user.email?.toLowerCase()) throw classroomError('classroom/invite-self');
        if (state.members.some(member => member.email === email)) return { status: 'already-member' };
        const removed = state.removed.find(record => record.member.email === email);
        if (removed) patch = restoreMemberUpdates(roomId, removed.uid, removed);
        else {
          const id = await invitationKey(roomId, email); valid();
          const previous = state.invitations.find(record => record.id === id);
          const saved = previous ? (({ id, ...record }) => record)(previous) : null;
          patch = { ['invitations/' + id]: saved || { roomId, email, ownerUid: current.uid, joinCode: state.selected.joinCode, createdAt: io.timestamp() } };
        }
      } else if (action === 'cancel-invite') {
        const invite = state.invitations.find(record => record.id === payload.invitationId);
        if (!invite || state.members.some(member => member.invitationId === invite.id)) throw classroomError('classroom/invalid-invitation');
        patch = { ['invitations/' + invite.id]: null };
      } else if (action === 'remove-member') {
        const member = state.members.find(record => record.uid === payload.memberUid);
        if (!member) throw classroomError('classroom/member-unavailable');
        if (state.teachers.some(teacher => teacher.uid === member.uid)) throw classroomError('classroom/remove-teacher-first');
        const { uid, ...record } = member;
        patch = removeMemberUpdates(roomId, uid, record, io.timestamp());
      } else {
        const record = state.removed.find(record => record.uid === payload.memberUid);
        if (!record) throw classroomError('classroom/member-unavailable');
        patch = restoreMemberUpdates(roomId, record.uid, record);
      }
      valid(); await io.update(patch); valid();
      return { status: action };
    } finally {
      if (alive(version)) { busy = false; publish({ busy: '' }); startList(); }
    }
  }
  async function manageTeachers(action, payload, current) {
    const roomId = String(payload.roomId || '');
    if (!current.teacher || state.selected?.membership !== 'owner' || state.selected.id !== roomId) throw classroomError('classroom/owner-required');
    if (state.roomStatus !== 'ready' || state.teacherRosterStatus !== 'ready' || state.teacherRosterError) throw classroomError('classroom/teacher-roster-unavailable');
    const version = epoch, revision = detailRevision;
    const valid = () => { guard(current.uid); if (!alive(version) || revision !== detailRevision || state.selected?.id !== roomId) throw classroomError('classroom/session-changed'); };
    busy = true; publish({ busy: action });
    try {
      let patch;
      if (action === 'invite-teacher') {
        const email = cleanStudentEmail(payload.email);
        if (email === session.user.email?.toLowerCase()) throw classroomError('classroom/invite-self');
        const id = await roomTeacherInvitationKey(roomId, email); valid();
        if (state.teacherInvitations.some(record => record.id === id)) return { status: 'already-invited' };
        patch = { ['teacherInvitations/' + id]: { roomId, email, ownerUid: current.uid, createdAt: io.timestamp(), acceptedUid: '' } };
      } else if (action === 'cancel-teacher-invite') {
        const invite = state.teacherInvitations.find(record => record.id === payload.invitationId && !record.acceptedUid);
        if (!invite) throw classroomError('classroom/invalid-invitation');
        patch = { ['teacherInvitations/' + invite.id]: null };
      } else {
        const teacher = state.teachers.find(record => record.uid === payload.teacherUid);
        if (!teacher) throw classroomError('classroom/member-unavailable');
        patch = revokeRoomTeacherUpdates(roomId, teacher.uid, teacher, state.members.some(member => member.uid === teacher.uid));
      }
      valid(); await io.update(patch); valid(); return { status: action };
    } finally { if (alive(version)) { busy = false; publish({ busy: '' }); startList(); } }
  }
  return { setContext, command, getState: () => structuredClone(state), dispose: () => { signature = ""; ++epoch; unwatchList?.(); stopDetail(); } };
}
