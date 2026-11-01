import { createClassroomAccess } from './classroom-access.js';
import { classroomReadScope, cleanGoogleClientId, cleanGoogleCourse, googleClassroomError } from '../public/shared/classroom-google-model.js';

// OAuth credentials never enter snapshots, storage, Firebase or child frames.
export function createGoogleClassroomConnection({ provider, onChange, now = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
  let uid = '', signature = '', generation = 0, status = 'inactive', error = '', account = null, courses = [];
  let clientId = '', prepared = false, token = '', expiresAt = 0, expiryTimer, requestTimer, authTimer, controller;
  const busy = () => ['preparing','authorizing','loading'].includes(status);
  const state = () => ({ uid, status, error, account, courses, expiresAt, canConnect: Boolean(uid && prepared && !busy()), busy: busy() });
  const publish = () => onChange(structuredClone(state()));
  function invalidate() { ++generation; controller?.abort(); controller = null; for (const timer of [expiryTimer, requestTimer, authTimer]) cancel(timer); expiryTimer = requestTimer = authTimer = null; }
  function forget() { token = ''; expiresAt = 0; account = null; courses = []; }
  function guard() { if (!uid) throw googleClassroomError('google/teacher-required'); }
  function fail(failure) {
    error = /^google\/[a-z-]+$/.test(failure?.code || '') ? failure.code : 'google/unavailable';
    if (error === 'google/expired') { invalidate(); forget(); status = 'expired'; }
    else status = 'error';
    publish();
  }
  function setContext(session, role, active) {
    const access = createClassroomAccess(session, role), next = active && access.state === 'teacher' ? access.uid : '';
    if (next === signature) return;
    signature = next; invalidate(); forget(); uid = next; prepared = false; clientId = ''; error = ''; status = uid ? 'disconnected' : 'inactive'; publish();
  }
  async function prepare(value) {
    guard(); if (busy()) throw googleClassroomError('google/busy');
    invalidate(); forget(); prepared = false; clientId = '';
    let id; try { id = cleanGoogleClientId(value); } catch (failure) { fail(failure); throw failure; }
    clientId = id; status = 'preparing'; error = ''; publish();
    const version = generation;
    try { await provider.prepare(); if (version !== generation || !uid) return; prepared = true; status = 'prepared'; publish(); }
    catch (failure) { if (version === generation) fail(failure); }
  }
  async function load() {
    guard(); if (busy()) throw googleClassroomError('google/busy');
    if (!token || now() >= expiresAt) { fail(googleClassroomError('google/expired')); return; }
    const version = generation, bearer = token;
    controller?.abort(); const request = new AbortController(); controller = request;
    requestTimer = schedule(() => request.abort(), 20000); requestTimer?.unref?.();
    status = 'loading'; error = ''; courses = []; publish();
    try {
      const identity = await provider.account(bearer, request.signal);
      if (version !== generation) return;
      if (request.signal.aborted) throw googleClassroomError('google/timeout');
      if (typeof identity?.sub !== 'string' || !identity.sub || typeof identity.email !== 'string' || identity.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email) || identity.email_verified !== true)
        throw googleClassroomError('google/account-unavailable');
      account = { email: identity.email }; publish();
      const rows = new Map(), seenPages = new Set(); let pageToken = '';
      do {
        const page = await provider.courses(bearer, pageToken, request.signal);
        if (version !== generation) return;
        if (request.signal.aborted) throw googleClassroomError('google/timeout');
        if (!page || (page.courses !== undefined && !Array.isArray(page.courses))) throw googleClassroomError('google/invalid-response');
        for (const course of page.courses || []) {
          if (course.courseState !== 'ACTIVE') continue;
          const record = cleanGoogleCourse(course); rows.set(record.id, record);
        }
        pageToken = page.nextPageToken || '';
        if (typeof pageToken !== 'string' || seenPages.has(pageToken) || seenPages.size >= 50) throw googleClassroomError('google/invalid-response');
        if (pageToken) seenPages.add(pageToken);
      } while (pageToken);
      if (now() >= expiresAt) throw googleClassroomError('google/expired');
      account = { email: identity.email }; courses = [...rows.values()]; status = 'connected'; error = ''; publish();
    } catch (failure) {
      if (version === generation) { courses = []; fail(failure.name === 'AbortError' ? googleClassroomError('google/timeout') : failure); }
    } finally { if (version === generation) { cancel(requestTimer); requestTimer = null; controller = null; } }
  }
  function connect() {
    guard(); if (busy()) throw googleClassroomError('google/busy');
    if (!prepared || !clientId) throw googleClassroomError('google/not-prepared');
    invalidate(); forget(); const version = generation; status = 'authorizing'; error = ''; publish();
    let finished = false;
    const current = () => version === generation && Boolean(uid);
    authTimer = schedule(() => { if (current()) { invalidate(); forget(); fail(googleClassroomError('google/timeout')); } }, 180000); authTimer?.unref?.();
    const denied = code => { if (!current() || finished) return; finished = true; cancel(authTimer); authTimer = null; status = 'error'; fail(googleClassroomError(code)); };
    try {
      provider.authorize({ clientId,
        onError: failure => denied(failure?.type === 'popup_failed_to_open' ? 'google/popup-blocked' : failure?.type === 'popup_closed' ? 'google/popup-closed' : 'google/unavailable'),
        onResponse(response) {
          if (!current() || finished) return;
          cancel(authTimer); authTimer = null;
          if (response?.error) { denied(response.error === 'access_denied' ? 'google/access-denied' : 'google/unavailable'); return; }
          if (!String(response?.scope || '').split(/\s+/).includes(classroomReadScope)) { denied('google/missing-scope'); return; }
          const seconds = Number(response?.expires_in);
          if (typeof response?.access_token !== 'string' || !response.access_token || response.access_token.length > 8192 || !Number.isFinite(seconds) || seconds <= 0) { denied('google/expired'); return; }
          finished = true;
          token = response.access_token; expiresAt = now() + Math.min(seconds, 86400) * 1000; status = 'prepared';
          expiryTimer = schedule(() => { if (current()) { invalidate(); forget(); status = 'expired'; error = 'google/expired'; publish(); } }, expiresAt - now()); expiryTimer?.unref?.();
          void load();
        },
      });
    } catch { denied('google/unavailable'); }
  }
  function disconnect() { invalidate(); forget(); status = uid ? 'disconnected' : 'inactive'; error = ''; publish(); }
  return { setContext, prepare, connect, reload: load, disconnect, getState: () => structuredClone(state()), getClientId: () => clientId,
    dispose() { signature = ''; invalidate(); forget(); uid = ''; prepared = false; clientId = ''; } };
}
