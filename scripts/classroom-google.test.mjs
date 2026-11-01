import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleClassroomConnection } from '../js/classroom-google-service.js';
import { createGoogleClassroomProvider } from '../js/classroom-google-provider.js';
import { classroomReadScope, cleanGoogleClientId } from '../public/shared/classroom-google-model.js';
const clientId = '123456789012-ownedwebclient123.apps.googleusercontent.com';
const response = (token = 'private-test-access-token') => ({ access_token: token, expires_in: 3600, scope: 'openid https://www.googleapis.com/auth/userinfo.email ' + classroomReadScope });
const course = (id = '123') => ({ id, name: '<img src=x> ฟิสิกส์', section: 'ม.5/1', courseState: 'ACTIVE', alternateLink: 'https://classroom.google.com/c/owned' });
function fixture() {
  let time = 1000, serial = 0, authorization, prepare = async () => {}, profile = async () => ({ sub: 'school-user', email: 'teacher@school.test', email_verified: true });
  let pages = async () => ({ courses: [course()] }); const calls = [], snapshots = [], timers = new Map();
  const service = createGoogleClassroomConnection({ now: () => time, schedule(fn, delay) { const id = ++serial; timers.set(id, { fn, at: time + delay }); return id; }, cancel: id => timers.delete(id), onChange: value => snapshots.push(value), provider: {
    prepare: () => { calls.push('prepare'); return prepare(); },
    authorize: options => { calls.push('authorize'); authorization = options; },
    account: (...args) => { calls.push(['account', ...args]); return profile(...args); },
    courses: (...args) => { calls.push(['courses', ...args]); return pages(...args); },
  } });
  const context = (uid = 'hub-teacher', teacher = true, active = true) => service.setContext({ status: 'signed-in', user: { uid } }, { uid, status: 'ready', isTeacher: teacher, systemRole: teacher ? 'teacher' : 'student' }, active);
  const settle = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
  return { service, calls, snapshots, context, settle, authorization: () => authorization,
    setPrepare: fn => { prepare = fn; }, setProfile: fn => { profile = fn; }, setPages: fn => { pages = fn; },
    async connect() { context(); await service.prepare(clientId); service.connect(); authorization.onResponse(response()); await settle(); },
    expire() { time += 3600_000; for (const [id, timer] of [...timers]) if (timer.at <= time) { timers.delete(id); timer.fn(); } },
  };
}
test('read-only authorization is teacher-only; loading the feature does not load Google or prompt anyone', async () => {
  const f = fixture(); assert.deepEqual(f.calls, []);
  f.context('student', false); await assert.rejects(f.service.prepare(clientId), /teacher-required/); assert.throws(() => f.service.connect(), /teacher-required/);
  assert.deepEqual(f.calls, []); assert.equal(f.service.getState().uid, '');
  for (const value of ['', 'not-a-client', '{"client_secret":"x"}', 'https://example.com']) assert.throws(() => cleanGoogleClientId(value), /invalid-client/);
});
test('school account is independent of Hub identity, all active course pages load, and tokens never enter snapshots', async () => {
  const f = fixture(); f.setPages(async (_, page) => page ? { courses: [course('456'), { ...course('old'), courseState: 'ARCHIVED' }] } : { courses: [course()], nextPageToken: 'page2' });
  await f.connect(); const state = f.service.getState();
  assert.equal(state.status, 'connected'); assert.equal(state.uid, 'hub-teacher'); assert.equal(state.account.email, 'teacher@school.test');
  assert.deepEqual(state.courses.map(c => c.id), ['123', '456']);
  assert.equal(f.calls.filter(row => Array.isArray(row) && row[0] === 'courses').length, 2);
  assert.ok(!JSON.stringify(f.snapshots).includes('private-test-access-token'));
  assert.ok(!JSON.stringify(state).includes('school-user'));
  f.service.disconnect(); assert.deepEqual(f.service.getState().courses, []); assert.equal(f.service.getState().account, null);
});
test('role/account/navigation changes discard grants and stale API responses; students never inherit course data', async () => {
  for (const change of [f => f.context('other-teacher'), f => f.context('hub-teacher', false), f => f.context('hub-teacher', true, false)]) {
    const f = fixture(); f.context(); await f.service.prepare(clientId); f.service.connect(); const old = f.authorization();
    change(f); old.onResponse(response()); await f.settle(); assert.deepEqual(f.service.getState().courses, []);
    assert.equal(f.calls.some(row => Array.isArray(row)), false);
  }
  const f = fixture(); let resolve; f.setPages(() => new Promise(done => { resolve = done; }));
  await f.connect(); f.context('other-teacher'); resolve({ courses: [course()] }); await f.settle();
  assert.equal(f.service.getState().uid, 'other-teacher'); assert.deepEqual(f.service.getState().courses, []);
});
test('popup failure, denial and missing read scope are recoverable and do not request data', async () => {
  for (const [run, code] of [
    [auth => auth.onError({ type: 'popup_failed_to_open' }), 'google/popup-blocked'],
    [auth => auth.onError({ type: 'popup_closed' }), 'google/popup-closed'],
    [auth => auth.onResponse({ error: 'access_denied' }), 'google/access-denied'],
    [auth => auth.onResponse({ ...response(), scope: 'openid email' }), 'google/missing-scope'],
  ]) {
    const f = fixture(); f.context(); await f.service.prepare(clientId); f.service.connect(); run(f.authorization());
    f.authorization().onResponse(response()); await f.settle();
    assert.equal(f.service.getState().error, code); assert.equal(f.service.getState().canConnect, true);
    assert.equal(f.calls.some(row => Array.isArray(row)), false, 'A late success after popup close/denial must be ignored');
  }
});
test('expiry clears credentials, account and course data without automatically requesting another grant', async () => {
  const f = fixture(); await f.connect(); const prompts = f.calls.filter(c => c === 'authorize').length;
  f.expire(); await f.settle(); assert.equal(f.service.getState().status, 'expired');
  assert.equal(f.service.getState().account, null); assert.deepEqual(f.service.getState().courses, []);
  await f.service.reload(); assert.equal(f.calls.filter(c => c === 'authorize').length, prompts);
});
test('API denial, incomplete identity and pagination loops never publish a partial or misleading course list', async () => {
  const denied = fixture(); denied.setPages(async () => { throw Object.assign(Error('do not expose upstream content'), { code: 'google/permission-denied' }); });
  await denied.connect(); assert.equal(denied.service.getState().error, 'google/permission-denied'); assert.deepEqual(denied.service.getState().courses, []);
  const identity = fixture(); identity.setProfile(async () => ({ sub: 'x', email: 'teacher@school.test', email_verified: false }));
  await identity.connect(); assert.equal(identity.service.getState().error, 'google/account-unavailable');
  const loop = fixture(); loop.setPages(async () => ({ courses: [course()], nextPageToken: 'same' }));
  await loop.connect(); assert.equal(loop.service.getState().error, 'google/invalid-response'); assert.deepEqual(loop.service.getState().courses, []);
});
test('provider uses only fixed Google GET endpoints and bearer headers, paginates teacher courses, and never puts tokens in URLs', async t => {
  const original = globalThis.fetch, calls = []; t.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options }); return { ok: true, json: async () => ({}) }; };
  const provider = createGoogleClassroomProvider(), signal = new AbortController().signal;
  await provider.account('test-bearer', signal); await provider.courses('test-bearer', 'next-page', signal);
  assert.ok(calls.every(c => c.options.method === 'GET' && c.options.headers.Authorization === 'Bearer test-bearer' && !c.url.includes('test-bearer')));
  const url = new URL(calls[1].url); assert.equal(url.origin, 'https://classroom.googleapis.com');
  assert.equal(url.searchParams.get('teacherId'), 'me'); assert.equal(url.searchParams.get('courseStates'), 'ACTIVE'); assert.equal(url.searchParams.get('pageToken'), 'next-page');
});
