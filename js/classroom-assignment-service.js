import { createClassroomAccess } from './classroom-access.js';
import { assignmentIdPattern, assignmentRoomPattern, assignmentError, cleanAssignmentFields, resolveAssignmentQuiz } from './classroom-assignment-model.js';

// Reads/writes use authenticated IO. Firebase Rules independently enforce the
// same room ownership and membership. No student score/answer access is added.
export function createClassroomAssignments({ io, onChange = () => {}, loadCatalog, hubUrl }) {
  let uid = '', access = '', identity, epoch = 0, connected = false, busy = '', error = '', published = '';
  const rooms = new Map(), stops = [], roomStops = new Map();
  const code = failure => String(failure?.code || failure?.message || 'assignment/unavailable');
  const live = version => version === epoch && Boolean(uid);
  function state() {
    const values = [...rooms.values()].map(room => ({ ...room,
      items: Object.entries(room.items || {}).map(([id, item]) => ({ id, ...item })).sort((a, b) => b.publishedAt - a.publishedAt),
      drafts: Object.entries(room.drafts || {}).map(([id, item]) => ({ id, ...item })).sort((a, b) => b.updatedAt - a.updatedAt),
    }));
    const unread = values.flatMap(room => room.membership === 'student' && room.status === 'ready'
      ? room.items.filter(item => item.status === 'published' && !room.seen?.[item.id]).map(item => ({ roomId: room.id, id: item.id, title: item.title, publishedAt: item.publishedAt })) : []);
    unread.sort((a, b) => b.publishedAt - a.publishedAt);
    return { uid: uid || null, access, connected, busy, error, rooms: values, unread, hubUrl: new URL('./', hubUrl).href };
  }
  function publish() {
    const next = state(), signature = JSON.stringify(next);
    if (signature !== published) { published = signature; onChange(structuredClone(next)); }
  }
  function stop(list) { for (const fn of list.splice(0)) fn?.(); }
  function watch(path, fn, list, version, relevant = () => true, failed = () => {}) {
    const timer = setTimeout(() => { if (live(version) && relevant()) { failed('assignment/read-timeout'); publish(); } }, 15000);
    timer.unref?.();
    const close = io.watch(path, value => { clearTimeout(timer); if (live(version) && relevant()) fn(value); }, failure => {
      clearTimeout(timer); if (live(version) && relevant()) { failed(code(failure)); publish(); }
    });
    list.push(() => { clearTimeout(timer); close?.(); });
  }
  async function read(path) {
    let timer;
    try { return await Promise.race([io.get(path), new Promise((_, reject) => { timer = setTimeout(() => reject(assignmentError('assignment/read-timeout')), 15000); })]); }
    finally { clearTimeout(timer); }
  }
  function guard(user = uid, version = epoch) {
    if (!live(version) || user !== uid || identity?.user?.uid !== uid) throw assignmentError('assignment/session-changed');
    if (!connected) throw assignmentError('assignment/offline');
  }
  function roomFor(id, owner = false) {
    const room = rooms.get(id);
    if (!assignmentRoomPattern.test(id) || !room || room.status !== 'ready') throw assignmentError('assignment/room-unavailable');
    if (owner && (access !== 'teacher' || room.ownerUid !== uid || room.membership !== 'owner')) throw assignmentError('assignment/owner-required');
    return room;
  }
  function addRoom(id, membership, version) {
    const list = []; roomStops.set(id, list);
    const relevant = () => roomStops.get(id) === list;
    const loaded = new Set();
    rooms.set(id, { id, membership, status: 'loading', name: '', ownerUid: '', items: {}, drafts: {}, seen: {}, error: '' });
    const failed = failure => { const room = rooms.get(id); if (room) { room.status = 'error'; room.error = failure; room.items = {}; room.drafts = {}; room.seen = {}; } };
    const apply = (kind, value) => {
      const room = rooms.get(id); if (!room) return;
      if (kind === 'meta') {
        if (!value?.ownerUid) { failed('assignment/room-unavailable'); publish(); return; }
        room.name = value.name; room.ownerUid = value.ownerUid;
      } else room[kind] = value || {};
      loaded.add(kind);
      const needed = membership === 'owner' ? ['meta', 'items', 'drafts'] : ['meta', 'items', 'seen'];
      if (needed.every(key => loaded.has(key)) && !room.error) room.status = 'ready';
      publish();
    };
    watch('@classroom/rooms/' + id, value => apply('meta', value), list, version, relevant, failed);
    watch('items/' + id, value => apply('items', value), list, version, relevant, failed);
    if (membership === 'owner' && access === 'teacher') watch('drafts/' + id, value => apply('drafts', value), list, version, relevant, failed);
    else watch('seen/' + id + '/' + uid, value => apply('seen', value), list, version, relevant, failed);
  }
  function clear() {
    ++epoch; stop(stops); for (const list of roomStops.values()) stop(list);
    roomStops.clear(); rooms.clear(); connected = false; busy = ''; error = ''; published = '';
  }
  function setIdentity(session, role) {
    const verified = createClassroomAccess(session, role);
    const nextUid = ['student', 'teacher'].includes(verified.state) ? verified.uid : '';
    identity = session;
    if (uid === nextUid && access === (nextUid ? verified.state : '')) return;
    clear(); uid = nextUid; access = uid ? verified.state : ''; publish();
    if (!uid) return;
    const version = epoch;
    stops.push(io.connected(value => { if (live(version)) { connected = value === true; publish(); } }));
    watch('@classroom/userRooms/' + uid, value => {
      const index = value || {};
      for (const [id, list] of roomStops) if (!index[id] || index[id] !== rooms.get(id)?.membership) { stop(list); roomStops.delete(id); rooms.delete(id); }
      for (const [id, membership] of Object.entries(index)) {
        if (assignmentRoomPattern.test(id) && ['owner', 'student'].includes(membership) && !roomStops.has(id)) addRoom(id, membership, version);
      }
      publish();
    }, stops, version, () => true, failure => {
      error = failure; for (const list of roomStops.values()) stop(list); roomStops.clear(); rooms.clear();
    });
  }
  async function command(action, payload = {}, expectedUid = uid) {
    guard(expectedUid);
    if (busy) throw assignmentError('assignment/busy');
    const version = epoch, user = uid, id = String(payload.id || ''), roomId = String(payload.roomId || '');
    const room = roomFor(roomId, ['preview', 'save', 'publish', 'close'].includes(action));
    if (action !== 'preview' && !assignmentIdPattern.test(id)) throw assignmentError('assignment/invalid-id');
    busy = action; error = ''; publish();
    try {
      if (action === 'preview') {
        const catalog = await loadCatalog(); guard(user, version);
        return { preview: resolveAssignmentQuiz(payload.url, catalog, hubUrl) };
      }
      if (action === 'view') {
        if (!room.items[id] && !room.drafts[id]) throw assignmentError('assignment/room-unavailable');
        return { id, roomId };
      } else if (action === 'seen') {
        const item = room.items[id];
        if (!item || room.membership !== 'student') return {};
        await io.transaction(`seen/${roomId}/${user}/${id}`, previous => live(version) ? previous || io.timestamp() : undefined);
      } else if (action === 'launch') {
        // Re-read before launch: a cached card must not reopen a closed work item.
        const item = await read(`items/${roomId}/${id}`); guard(user, version);
        if (!item || item.status !== 'published') throw assignmentError('assignment/closed');
        const catalog = await loadCatalog(); guard(user, version);
        roomFor(roomId);
        const target = resolveAssignmentQuiz(item.targetHash, catalog, hubUrl);
        if (target.contentId !== item.contentId) throw assignmentError('assignment/quiz-changed');
        return { targetHash: target.targetHash };
      } else if (['save', 'publish', 'close'].includes(action)) {
        if (!Number.isSafeInteger(payload.revision) || payload.revision < 0) throw assignmentError('assignment/conflict');
        const [oldItem, oldDraft] = await Promise.all([read(`items/${roomId}/${id}`), read(`drafts/${roomId}/${id}`)]);
        guard(user, version); roomFor(roomId, true);
        const previous = oldItem || oldDraft;
        if ((previous?.revision || 0) !== payload.revision) throw assignmentError('assignment/conflict');
        if (action === 'close' && !oldItem) throw assignmentError('assignment/closed');
        const fields = action === 'close' ? cleanAssignmentFields(oldItem) : cleanAssignmentFields(payload);
        const target = oldItem ? Object.fromEntries(['targetHash','contentId','quizTitleTh','quizTitleEn'].map(key => [key, oldItem[key]]))
          : resolveAssignmentQuiz(payload.url, await loadCatalog(), hubUrl);
        guard(user, version); roomFor(roomId, true);
        const status = action === 'close' ? 'closed' : oldItem ? oldItem.status : action === 'publish' ? 'published' : 'draft';
        const record = { ...fields, ...target, version: 1, ownerUid: user, status,
          createdAt: previous?.createdAt || io.timestamp(), updatedAt: io.timestamp(),
          publishedAt: oldItem?.publishedAt || (status === 'draft' ? 0 : io.timestamp()), revision: payload.revision + 1 };
        if (status === 'draft') {
          const result = await io.transaction(`drafts/${roomId}/${id}`, current => {
            if (!live(version) || (current?.revision || 0) !== payload.revision) return;
            return record;
          });
          if (!result.committed) throw assignmentError('assignment/conflict');
        } else {
          // Revision checks in Rules make this an atomic publish/move and reject
          // simultaneous edits from another teacher tab rather than losing them.
          await io.update({ [`items/${roomId}/${id}`]: record, [`drafts/${roomId}/${id}`]: null });
        }
        guard(user, version);
        return { id, roomId, status };
      } else throw assignmentError('assignment/invalid-action');
      guard(user, version);
      return {};
    } catch (failure) { if (live(version)) { error = code(failure); publish(); } throw failure; }
    finally { if (live(version)) { busy = ''; publish(); } }
  }
  return { setIdentity, command, getState: () => structuredClone(state()), dispose() { clear(); uid = ''; access = ''; } };
}
