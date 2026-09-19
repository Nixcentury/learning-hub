import { createClassroomAccess } from "./classroom-access.js";
import { classroomError, cleanRoomName, cleanJoinCode, newRoomKey, roomIdPattern, createRoomUpdates, joinRoomUpdates } from "./classroom-model.js";

// IO is injected. Production uses the authenticated Firebase SDK; tests can use
// the real database emulator. The page never supplies an authoritative UID/role.
export function createClassroomService({ io, onChange, makeKey = newRoomKey }) {
  let session = null, role = null, signature = "", epoch = 0, listRevision = 0, detailRevision = 0;
  let unwatchList, unwatchMembers, index = {}, busy = false, pendingCreate = null;
  let state = empty();
  function empty() { return { uid: null, status: "inactive", rooms: [], selected: null, members: [], roomStatus: "idle", error: "", detailError: "", busy: "" }; }
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
        if (!roomIdPattern.test(roomId) || !["owner", "student"].includes(membership)) throw classroomError("classroom/invalid-record");
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
      index = value || {};
      void loadList(version);
    }, error => {
      if (alive(version)) { ++listRevision; publish({ status: "error", rooms: [], error: codeOf(error) }); }
    });
  }
  function setContext(nextSession, nextRole, active) {
    session = nextSession; role = nextRole;
    const access = createClassroomAccess(session, role);
    const next = active && ["teacher", "student"].includes(access.state) ? access.uid + ":" + access.state : "";
    if (next === signature) return;
    signature = next; ++epoch; ++detailRevision; ++listRevision;
    unwatchList?.(); unwatchMembers?.(); unwatchList = unwatchMembers = null;
    index = {}; busy = false; pendingCreate = null;
    state = { ...empty(), uid: next ? access.uid : null };
    publish();
    if (next) startList();
  }
  async function openRoom(roomId) {
    const { uid, teacher } = guard();
    if (!roomIdPattern.test(roomId)) throw classroomError("classroom/invalid-room");
    const version = epoch, revision = ++detailRevision;
    unwatchMembers?.(); unwatchMembers = null;
    publish({ selected: { id: roomId }, members: [], roomStatus: "loading", detailError: "" });
    try {
      const room = await read("rooms/" + roomId);
      if (!alive(version) || revision !== detailRevision) return;
      if (!room) throw classroomError("classroom/room-unavailable");
      const owner = teacher && room.ownerUid === uid;
      if (!owner) {
        const member = await read("members/" + roomId + "/" + uid);
        if (!member) throw classroomError("classroom/room-unavailable");
      }
      if (!alive(version) || revision !== detailRevision) return;
      publish({ selected: { ...room, id: roomId, membership: owner ? "owner" : "student" }, roomStatus: owner ? "loading" : "ready" });
      if (owner) {
        unwatchMembers = watch("members/" + roomId, value => {
          if (!alive(version) || revision !== detailRevision) return;
          const members = Object.entries(value || {}).map(([memberUid, record]) => ({ uid: memberUid, displayName: record.displayName, joinedAt: record.joinedAt }));
          publish({ members, roomStatus: "ready", detailError: "" });
        }, error => {
          if (alive(version) && revision === detailRevision) publish({ members: [], roomStatus: "error", detailError: codeOf(error) });
        });
      }
    } catch (error) {
      if (alive(version) && revision === detailRevision) publish({ members: [], roomStatus: "error", detailError: codeOf(error) });
    }
  }
  async function command(action, payload = {}, uid) {
    const current = guard(uid);
    if (busy) throw classroomError("classroom/busy");
    if (action === "open") return openRoom(String(payload.roomId || ""));
    if (action === "back") { ++detailRevision; unwatchMembers?.(); unwatchMembers = null; publish({ selected: null, members: [], roomStatus: "idle", detailError: "" }); return; }
    if (action === "reload") { startList(); if (state.selected) await openRoom(state.selected.id); return; }
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
        if (match.ownerUid === current.uid) { openedId = match.roomId; }
        else {
          const previous = await read("members/" + match.roomId + "/" + current.uid);
          if (!alive(version)) throw classroomError("classroom/session-changed");
          guard(current.uid);
          try {
            await io.update(joinRoomUpdates(current.uid, match.roomId, code, session.user.displayName || session.user.email, io.timestamp(), previous));
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
  return { setContext, command, getState: () => structuredClone(state), dispose: () => { signature = ""; ++epoch; unwatchList?.(); unwatchMembers?.(); } };
}
