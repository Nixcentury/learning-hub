import { classroomGoogleScopes, googleClassroomError } from '../public/shared/classroom-google-model.js';
let library;
export function loadGoogleClassroomLibrary() {
  if (window.google?.accounts?.oauth2?.initTokenClient) return Promise.resolve();
  if (library) return library;
  library = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    const finish = failure => {
      clearTimeout(timer); script.onload = script.onerror = null;
      if (failure) { script.remove(); library = null; reject(googleClassroomError('google/load-failed')); } else resolve();
    };
    const timer = setTimeout(() => finish(true), 15000);
    script.onload = () => finish(!window.google?.accounts?.oauth2?.initTokenClient);
    script.onerror = () => finish(true); document.head.append(script);
  });
  return library;
}
async function read(url, token, signal) {
  let response;
  try { response = await fetch(url, { method: 'GET', headers: { Authorization: 'Bearer ' + token }, signal, credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer' }); }
  catch (failure) { if (failure.name === 'AbortError') throw failure; throw googleClassroomError('google/unavailable'); }
  let body; try { body = await response.json(); } catch { throw googleClassroomError('google/invalid-response'); }
  if (response.ok) return body;
  const reasons = (body?.error?.details || []).map(detail => detail.reason).concat((body?.error?.errors || []).map(detail => detail.reason));
  const code = response.status === 401 ? 'expired' : response.status === 429 ? 'rate-limited'
    : reasons.some(reason => ['SERVICE_DISABLED','accessNotConfigured'].includes(reason)) ? 'api-disabled' : response.status === 403 ? 'permission-denied' : 'unavailable';
  throw googleClassroomError('google/' + code);
}
export function createGoogleClassroomProvider() {
  return {
    prepare: loadGoogleClassroomLibrary,
    // Called synchronously from a real top-level button click, after preparation.
    authorize({ clientId, onResponse, onError }) {
      const client = window.google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: classroomGoogleScopes.join(' '), include_granted_scopes: false,
        prompt: 'select_account', callback: onResponse, error_callback: onError });
      client.requestAccessToken({ prompt: 'select_account' });
    },
    account: (token, signal) => read('https://openidconnect.googleapis.com/v1/userinfo', token, signal),
    courses(token, pageToken, signal) {
      const url = new URL('https://classroom.googleapis.com/v1/courses');
      url.searchParams.set('teacherId', 'me'); url.searchParams.set('courseStates', 'ACTIVE'); url.searchParams.set('pageSize', '100');
      url.searchParams.set('fields', 'courses(id,name,section,room,alternateLink,courseState),nextPageToken');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      return read(url.href, token, signal);
    },
  };
}
