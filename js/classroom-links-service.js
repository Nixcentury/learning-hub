import { createClassroomAccess } from './classroom-access.js';
import { cleanLinkFields, linkIdPattern, linkRoomPattern, linkError } from '../public/shared/classroom-links-model.js';

// Only the selected room is observed. Epochs reject late callbacks/transaction
// retries after a room, account, role or membership change.
export function createClassroomLinks({ io, onChange }) {
  let uid = '', roomId = '', signature = '', epoch = 0, owner = false, name = '';
  let connected = false, busy = '', status = 'inactive', error = '', items = [], stops = [];
  const code = failure => String(failure?.code || failure?.message || 'links/unavailable');
  const state = () => ({ uid, roomId, owner, connected, busy, status, error, items });
  const publish = () => onChange(structuredClone(state()));
  function clear() { ++epoch; for (const stop of stops.splice(0)) stop?.(); items = []; busy = ''; connected = false; }
  function fail(failure) { clear(); status = 'error'; error = code(failure); publish(); }
  function guard(expectedUid, version = epoch) {
    if (!uid || expectedUid !== uid || version !== epoch || status !== 'ready') throw linkError('links/session-changed');
    if (!connected) throw linkError('links/offline');
  }
  function setContext(session, role, rooms, active) {
    const access = createClassroomAccess(session, role), selected = rooms?.selected;
    const ready = active && rooms?.uid === access.uid && rooms?.roomStatus === 'ready' && linkRoomPattern.test(selected?.id || '') && ['teacher','student'].includes(access.state);
    const next = ready ? `${access.uid}/${access.state}/${selected.id}/${selected.ownerUid}/${selected.membership}` : '';
    if (next === signature) return;
    signature = next; clear(); uid = ready ? access.uid : ''; roomId = ready ? selected.id : '';
    owner = ready && access.state === 'teacher' && selected.ownerUid === uid;
    name = String(session?.user?.displayName || session?.user?.email || 'Teacher').slice(0, 120);
    error = ''; status = ready ? 'loading' : 'inactive'; publish();
    if (!ready) return;
    const version = epoch;
    const live = () => version === epoch;
    const timer = setTimeout(() => { if (live() && status === 'loading') fail(linkError('links/read-timeout')); }, 15000);
    timer.unref?.();
    stops.push(() => clearTimeout(timer));
    function watch(path, value) {
      const stop = io.watch(path, record => { if (live()) value(record); }, failure => { if (live()) fail(failure); });
      if (live()) stops.push(stop); else stop?.();
    }
    stops.push(io.connected(value => { if (live()) { connected = value === true; publish(); } }));
    watch(`@classroom/rooms/${roomId}`, room => {
      if (!room || room.ownerUid !== selected.ownerUid) fail(linkError('links/access-lost'));
    });
    if (!owner) watch(`@classroom/members/${roomId}/${uid}`, member => {
      if (!member) fail(linkError('links/access-lost'));
      else name = String(member.displayName || 'Student').slice(0, 120);
    });
    watch(`items/${roomId}`, value => {
      clearTimeout(timer);
      items = Object.entries(value || {}).map(([id, record]) => ({ ...record, id }))
        .sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
      status = 'ready'; error = ''; publish();
    });
  }
  async function command(action, payload = {}, expectedUid = uid) {
    guard(expectedUid);
    if (busy) throw linkError('links/busy');
    if (payload.roomId !== roomId || !linkIdPattern.test(payload.id || '')) throw linkError('links/invalid-id');
    if (!['create','edit','delete'].includes(action)) throw linkError('links/invalid-action');
    const previous = items.find(item => item.id === payload.id);
    if (action !== 'create' && (!previous || (!owner && previous.authorUid !== uid))) throw linkError('links/access-lost');
    if (action !== 'create' && payload.revision !== previous.revision) throw linkError('links/conflict');
    const fields = action === 'delete' ? null : cleanLinkFields(payload);
    const version = epoch, user = uid, path = `items/${roomId}/${payload.id}`;
    busy = action; error = ''; publish();
    try {
      const result = await io.transaction(path, current => {
        if (version !== epoch || !connected) return;
        if (action === 'create') {
          if (current) return;
          return { ...fields, version: 1, authorUid: user, authorName: name, createdAt: io.timestamp(), updatedAt: io.timestamp(), revision: 1 };
        }
        if (!current || current.revision !== payload.revision || (!owner && current.authorUid !== user)) return;
        if (action === 'delete') return null;
        return { ...current, ...fields, updatedAt: io.timestamp(), revision: current.revision + 1 };
      });
      guard(user, version);
      if (!result.committed) throw linkError('links/conflict');
      return { id: payload.id };
    } catch (failure) { if (version === epoch) { error = code(failure); publish(); } throw failure; }
    finally { if (version === epoch) { busy = ''; publish(); } }
  }
  return { setContext, command, getState: () => structuredClone(state()), dispose() { signature = ''; clear(); uid = roomId = ''; } };
}
