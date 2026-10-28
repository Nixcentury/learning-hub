import { createClassroomAccess } from './classroom-access.js';
import { monitorTiming, roomPattern, liveLesson, monitorId, monitorLocation, monitorError, participantState, incidentNeeded, cleanNudge } from './classroom-monitor-model.js';

// IO is injected for emulator tests. All authority is additionally checked by RTDB Rules.
export function createClassroomMonitor({ io, onChange = () => {}, now = Date.now, makeId = monitorId }) {
  let identity = null, access = '', uid = '', epoch = 0, connected = false, disposed = false;
  let rooms = {}, selected = '', lesson = null, participants = {}, connections = {}, incidents = {}, notices = {}, roster = {};
  let location = monitorLocation(), visible = true, changedAt = 0, sequence = 0, connectionId = makeId('c');
  let error = '', busy = '', published = '', lastHeartbeat = 0, selfParticipant = null;
  const mainStops = [], roomStops = new Map(), detailStops = [], selfStops = [], incidentTasks = new Set();
  let disconnect = null, connectionPath = '', connectionReady = false;
  let lessonKey = '', detailKey = '', writingToken = null, writeAgain = false, participantUid = '';
  let clock = null, selfIncident = null, selfNotices = {};
  const codes = failure => String(failure?.code || failure?.message || 'monitor/unavailable');
  const at = path => path;
  const safe = version => !disposed && version === epoch && Boolean(uid);
  const isOwner = room => access === 'teacher' && room?.ownerUid === uid;
  function state() {
    const room = rooms[selected], session = liveLesson(room?.session, now()) ? room.session : null;
    const rows = isOwner(room) && session ? Object.entries(roster).map(([id, value]) => ({
      uid: id, displayName: value.displayName || 'Student', ...participantState(participants[id], connections[id], now()), incident: incidents[id] || null,
      notices: Object.values(notices[id] || {}).sort((a, b) => b.createdAt - a.createdAt),
    })) : [];
    return { uid: uid || null, access, connected, error, busy, selectedRoomId: selected,
      rooms: Object.values(rooms).map(value => ({ ...value, session: liveLesson(value.session, now()) ? value.session : null })),
      session, rows, lesson: lesson ? { ...lesson, joined: selfParticipant?.joined === true } : null,
      selfIncident: participantUid ? selfIncident : null,
      selfNotices: participantUid ? Object.entries(selfNotices).map(([id, value]) => ({ id, ...value })).sort((a, b) => a.createdAt - b.createdAt) : [],
    };
  }
  function publish() {
    if (disposed) return;
    const value = state(), next = JSON.stringify(value);
    if (next === published) return;
    published = next; onChange(structuredClone(value));
  }
  function fail(failure, version = epoch) { if (safe(version)) { error = codes(failure); publish(); } }
  function watch(path, callback, target, version = epoch, relevant = () => true) {
    const timer = setTimeout(() => { if (relevant()) fail(monitorError('monitor/read-timeout'), version); }, 15000);
    timer.unref?.();
    const unsubscribe = io.watch(at(path), value => { clearTimeout(timer); if (safe(version) && relevant()) callback(value); }, failure => { clearTimeout(timer); if (relevant()) fail(failure, version); });
    const close = () => { clearTimeout(timer); unsubscribe?.(); };
    target.push(close); return close;
  }
  function stop(list) { for (const fn of list.splice(0)) fn?.(); }
  function guard(expected = uid) {
    if (!uid || expected !== uid || identity?.user?.uid !== uid || !['teacher', 'student'].includes(access)) throw monitorError('monitor/session-changed');
    if (!connected) throw monitorError('monitor/offline');
  }
  function lessonRoom(roomId) {
    const room = rooms[roomId];
    if (!room || !liveLesson(room.session, now())) throw monitorError('monitor/not-locked');
    return room;
  }
  function ownerRoom(roomId) {
    const room = rooms[roomId];
    if (!room || !isOwner(room)) throw monitorError('monitor/owner-required');
    return room;
  }
  function sessionPath(kind, room = rooms[selected]) { return `${kind}/${room.id}/${room.session.id}`; }
  async function releaseConnection() {
    const previous = connectionPath, registration = disconnect;
    connectionPath = ''; disconnect = null; connectionReady = false;
    if (previous) {
      // Deleting our own old connection is permitted even after its lesson ends.
      await io.remove(previous).catch(() => {});
      await registration?.cancel?.().catch(() => {});
    }
  }
  function stopSelf() {
    stop(selfStops); lesson = null; selfParticipant = null; participantUid = ''; lessonKey = ''; selfIncident = null; selfNotices = {};
    void releaseConnection();
  }
  async function sendConnection() {
    if (!uid || !connected || !lesson || !selfParticipant?.joined || !liveLesson(rooms[lesson.roomId]?.session, now())) return;
    if (writingToken?.epoch === epoch && writingToken?.key === lessonKey) { writeAgain = true; return; }
    const version = epoch, key = lessonKey, user = uid, room = rooms[lesson.roomId];
    const ticket = { epoch: version, key }; writingToken = ticket; lastHeartbeat = now();
    const path = `${sessionPath('connections', room)}/${user}/${connectionId}`;
    try {
      if (connectionPath !== path) {
        await releaseConnection();
        if (!safe(version) || lessonKey !== key || !connected) return;
        connectionPath = path; changedAt = now();
      }
      if (!safe(version) || lessonKey !== key || !connected) return;
      if (!connectionReady) {
        const old = await io.get(`${sessionPath('connections', room)}/${user}`);
        if (!safe(version) || lessonKey !== key || !connected) return;
        if (!old?.[connectionId] && Object.values(old || {}).filter(record => record.connected && now() - Number(record.updatedAt || 0) <= monitorTiming.fresh).length >= 8) throw monitorError('monitor/window-limit');
        for (const [id, record] of Object.entries(old || {})) {
          if (id !== connectionId && record.connected === false) await io.remove(`${sessionPath('connections', room)}/${user}/${id}`);
        }
        if (!safe(version) || lessonKey !== key || !connected) return;
        const registration = await io.disconnect(path, { connected: false, updatedAt: io.timestamp() });
        if (!safe(version) || lessonKey !== key || connectionPath !== path) { await registration.cancel?.(); return; }
        disconnect = registration; connectionReady = true;
      }
      await io.set(path, { connected: true, visible, changedAt, updatedAt: io.timestamp(), sequence: ++sequence, location });
      if (safe(version) && lessonKey === key) lastHeartbeat = now();
    } catch (failure) { if (lessonKey === key) fail(failure, version); }
    finally { if (writingToken === ticket) { writingToken = null; if (writeAgain) { writeAgain = false; void sendConnection(); } } }
  }
  function selectStudentLesson() {
    const options = Object.values(rooms).filter(room => !isOwner(room) && liveLesson(room.session, now()));
    // Keep the chosen lesson; do not silently join another room when it closes.
    const current = options.find(value => `${value.id}/${value.session.id}` === lessonKey);
    const room = (selfParticipant?.joined ? current : options.find(value => value.id === selected)) || current || (options.length === 1 ? options[0] : null);
    const next = room ? `${room.id}/${room.session.id}` : '';
    if (next === lessonKey) return;
    stopSelf();
    if (!room) return;
    lessonKey = next; participantUid = uid;
    lesson = { roomId: room.id, id: room.session.id, name: room.name, endsAt: room.session.endsAt };
    const version = epoch, user = uid, relevant = () => lessonKey === next;
    watch(`${sessionPath('participants', room)}/${user}`, value => {
      selfParticipant = value;
      if (value?.joined === true) void sendConnection(); else void releaseConnection();
      publish();
    }, selfStops, version, relevant);
    watch(`${sessionPath('incidents', room)}/${user}`, value => { selfIncident = value; publish(); }, selfStops, version, relevant);
    watch(`${sessionPath('notices', room)}/${user}`, value => { selfNotices = value || {}; publish(); }, selfStops, version, relevant);
  }
  function selectTeacherDetail() {
    const room = rooms[selected];
    const next = isOwner(room) && liveLesson(room.session, now()) ? `${room.id}/${room.session.id}` : '';
    if (next === detailKey) return;
    stop(detailStops); participants = {}; connections = {}; incidents = {}; notices = {}; roster = {}; detailKey = next;
    if (!next) return;
    const relevant = () => detailKey === next && liveLesson(room.session, now());
    watch(`@classroom/members/${room.id}`, value => { roster = value || {}; publish(); }, detailStops, epoch, relevant);
    for (const [kind, apply] of [
      ['participants', value => { participants = value || {}; }], ['connections', value => { connections = value || {}; }],
      ['incidents', value => { incidents = value || {}; }], ['notices', value => { notices = value || {}; }],
    ]) watch(sessionPath(kind, room), value => { apply(value); publish(); }, detailStops, epoch, relevant);
  }
  function refreshLessons() {
    if ((detailKey && !liveLesson(rooms[selected]?.session, now())) || (lesson && !liveLesson(rooms[lesson.roomId]?.session, now()))) error = '';
    selectTeacherDetail(); selectStudentLesson(); publish();
  }
  function addRoom(roomId, membership, version) {
    if (!roomPattern.test(roomId) || !['owner', 'student'].includes(membership)) return;
    const stops = []; roomStops.set(roomId, stops);
    const relevant = () => roomStops.get(roomId) === stops;
    watch(`@classroom/rooms/${roomId}`, value => {
      if (!value || !value.ownerUid) { delete rooms[roomId]; refreshLessons(); return; }
      rooms[roomId] = { ...rooms[roomId], id: roomId, name: value.name, ownerUid: value.ownerUid, membership };
      refreshLessons();
    }, stops, version, relevant);
    watch(`sessions/${roomId}`, value => {
      rooms[roomId] = { ...rooms[roomId], id: roomId, membership, session: value };
      refreshLessons();
    }, stops, version, relevant);
  }
  function clear() {
    ++epoch; stop(mainStops); stop(detailStops); stopSelf();
    for (const stops of roomStops.values()) stop(stops);
    roomStops.clear(); clearInterval(clock); clock = null;
    rooms = {}; selected = ''; participants = {}; connections = {}; incidents = {}; notices = {}; roster = {};
    detailKey = ''; error = ''; busy = ''; connected = false; published = ''; incidentTasks.clear();
    writingToken = null; writeAgain = false;
    connectionId = makeId('c'); changedAt = 0; sequence = 0; lastHeartbeat = 0;
  }
  function setIdentity(session, role) {
    const verified = createClassroomAccess(session, role);
    const nextUid = ['teacher', 'student'].includes(verified.state) ? verified.uid : '';
    const nextAccess = nextUid ? verified.state : '';
    identity = session;
    if (nextUid === uid && nextAccess === access) return;
    clear(); uid = nextUid; access = nextAccess; publish();
    if (!uid) return;
    const version = epoch;
    mainStops.push(io.connected(value => {
      if (!safe(version)) return;
      connected = value === true;
      if (!connected) connectionReady = false;
      else { error = ''; void sendConnection(); }
      publish();
    }));
    watch(`@classroom/userRooms/${uid}`, value => {
      const index = value || {};
      for (const [roomId, stops] of roomStops) if (!index[roomId]) { stop(stops); roomStops.delete(roomId); delete rooms[roomId]; }
      for (const [roomId, membership] of Object.entries(index)) if (!roomStops.has(roomId)) addRoom(roomId, membership, version);
      refreshLessons();
    }, mainStops, version);
    clock = setInterval(tick, 1000); clock.unref?.();
  }
  function reconcileIncidents() {
    if (!connected || access !== 'teacher' || !detailKey) return;
    const room = rooms[selected];
    for (const row of state().rows) {
      const type = incidentNeeded(row, now()), resolve = row.status === 'visible' || row.status === 'left';
      if (type && row.incident && !row.incident.resolvedAt) continue;
      if ((!type && !resolve) || (!type && (!row.incident || row.incident.resolvedAt))) continue;
      const path = `${sessionPath('incidents', room)}/${row.uid}`;
      if (incidentTasks.has(path)) continue;
      const version = epoch, key = detailKey;
      incidentTasks.add(path);
      const fresh = { id: makeId('i'), type, createdAt: io.timestamp(), resolvedAt: 0, ackAt: 0 };
      void io.transaction(path, previous => {
        if (!safe(version) || detailKey !== key || !liveLesson(room.session, now())) return;
        if (resolve) return previous && !previous.resolvedAt ? { ...previous, resolvedAt: io.timestamp() } : undefined;
        if (previous && !previous.resolvedAt) return;
        return fresh;
      }).catch(failure => { if (detailKey === key) fail(failure, version); }).finally(() => incidentTasks.delete(path));
    }
  }
  function tick() {
    refreshLessons();
    if (connected && lesson && selfParticipant?.joined && now() - lastHeartbeat >= monitorTiming.heartbeat) void sendConnection();
    reconcileIncidents();
  }
  async function command(action, payload = {}, expectedUid = uid) {
    guard(expectedUid);
    if (busy) throw monitorError('monitor/busy');
    const version = epoch, user = uid;
    busy = action; error = ''; publish();
    try {
      const roomId = String(payload.roomId || selected || lesson?.roomId || '');
      if (!roomPattern.test(roomId)) throw monitorError('monitor/invalid-room');
      const room = rooms[roomId];
      if (!room) throw monitorError('monitor/invalid-room');
      if (action === 'lock') {
        ownerRoom(roomId);
        if (liveLesson(room.session, now())) throw monitorError('monitor/already-locked');
        const id = makeId('s'), previousId = room.session?.id, duration = Math.min(180, Math.max(5, Number(payload.minutes) || 60)) * 60_000;
        const result = await io.transaction(`sessions/${roomId}`, previous => liveLesson(previous, now()) ? undefined : { id, ownerUid: user, active: true, startedAt: io.timestamp(), endsAt: now() + duration });
        if (!result.committed) throw monitorError('monitor/already-locked');
        if (!safe(version)) throw monitorError('monitor/session-changed');
        if (previousId && previousId !== id) await io.update(Object.fromEntries(['participants', 'connections', 'incidents', 'notices'].map(kind => [`${kind}/${roomId}/${previousId}`, null])));
        if (safe(version)) selected = roomId;
      } else if (action === 'unlock') {
        ownerRoom(roomId); lessonRoom(roomId);
        const id = room.session.id;
        const result = await io.transaction(`sessions/${roomId}`, previous => previous?.id === id && previous.active ? { ...previous, active: false } : undefined);
        if (!result.committed) throw monitorError('monitor/not-locked');
        if (!safe(version)) throw monitorError('monitor/session-changed');
        // Independent lesson IDs make late student writes harmless; cleanup is owner-only.
        await io.update(Object.fromEntries(['participants', 'connections', 'incidents', 'notices'].map(kind => [`${kind}/${roomId}/${id}`, null])));
      } else if (action === 'join' || action === 'leave') {
        lessonRoom(roomId);
        if (isOwner(room)) throw monitorError('monitor/student-required');
        const next = `${roomId}/${room.session.id}`;
        if (action === 'join' && lesson && selfParticipant?.joined && lessonKey !== next) throw monitorError('monitor/another-lesson');
        if (safe(version)) { selected = roomId; selectStudentLesson(); }
        const path = `${sessionPath('participants', room)}/${user}`;
        await io.transaction(path, previous => ({ joined: action === 'join', joinedAt: previous?.joinedAt || io.timestamp(), updatedAt: io.timestamp() }));
      } else if (action === 'nudge') {
        ownerRoom(roomId); lessonRoom(roomId);
        const target = String(payload.targetUid || '');
        if (!target || !participants[target]?.joined) throw monitorError('monitor/not-participant');
        const entries = notices[target] || {};
        if (Object.keys(entries).length >= 20) throw monitorError('monitor/message-limit');
        await io.set(`${sessionPath('notices', room)}/${target}/${makeId('n')}`, { text: cleanNudge(payload.text), senderUid: user,
          createdAt: io.timestamp(), deliveredAt: 0, ackAt: 0, reply: '', repliedAt: 0 });
      } else if (['delivered', 'ack', 'reply', 'ack-incident'].includes(action)) {
        lessonRoom(roomId);
        if (lesson?.roomId !== roomId || !selfParticipant?.joined) throw monitorError('monitor/not-participant');
        if (action === 'ack-incident') {
          const incident = selfIncident;
          if (!incident || incident.id !== payload.id) throw monitorError('monitor/message-changed');
          if (!incident.ackAt) await io.update({ [`${sessionPath('incidents', room)}/${user}/ackAt`]: io.timestamp() });
        } else {
          const item = selfNotices[payload.id];
          if (!item) throw monitorError('monitor/message-changed');
          const base = `${sessionPath('notices', room)}/${user}/${payload.id}`, patch = {};
          if (!item.deliveredAt) patch[base + '/deliveredAt'] = io.timestamp();
          if (action === 'ack' && !item.ackAt) patch[base + '/ackAt'] = io.timestamp();
          if (action === 'reply') { patch[base + '/reply'] = cleanNudge(payload.text); patch[base + '/repliedAt'] = io.timestamp(); }
          if (Object.keys(patch).length) await io.update(patch);
        }
      } else throw monitorError('monitor/invalid-action');
      if (!safe(version)) throw monitorError('monitor/session-changed');
      return { ok: true };
    } catch (failure) { fail(failure, version); throw failure; }
    finally { if (safe(version)) { busy = ''; refreshLessons(); } }
  }
  return { setIdentity, command, getState: () => structuredClone(state()),
    selectRoom(roomId) { if (roomId && !rooms[roomId]) return; selected = roomId || ''; refreshLessons(); },
    setLocation(value) { const next = monitorLocation(value); if (JSON.stringify(next) === JSON.stringify(location)) return; location = next; void sendConnection(); },
    setVisible(value) { if (visible === Boolean(value)) return; visible = Boolean(value); changedAt = now(); void sendConnection(); },
    tick, dispose() { clear(); disposed = true; uid = ''; access = ''; },
  };
}
