// Test-only REST client. Fail closed: NEVER accept a production host/project.
export const emulatorOrigin = process.env.CLASSROOM_EMULATOR_ORIGIN || 'http://127.0.0.1:9017';
export const emulatorProject = 'demo-classroom-phase1';
const url = new URL(emulatorOrigin);
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/') throw Error('Classroom tests require a loopback emulator.');
export function mockToken(uid) {
  const iat = Math.floor(Date.now() / 1000);
  // Same unsigned JWT format as Firebase util createMockUserToken. Emulator only.
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return encode({ alg: 'none', type: 'JWT' }) + '.' + encode({ iss: 'https://securetoken.google.com/' + emulatorProject,
    aud: emulatorProject, sub: uid, user_id: uid, iat, exp: iat + 3600, auth_time: iat,
    email: uid + '@example.test', firebase: { sign_in_provider: 'google.com', identities: {} } }) + '.';
}
export async function request(uid, method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  // REST auth= is an ID token. Bearer is OAuth/admin in RTDB; never use it
  // for simulated students, or emulator tests would bypass Rules entirely.
  if (uid === 'EMULATOR_ADMIN') headers.Authorization = 'Bearer owner';
  const authQuery = uid && uid !== 'EMULATOR_ADMIN' ? '&auth=' + encodeURIComponent(mockToken(uid)) : '';
  const response = await fetch(emulatorOrigin + '/' + path + '.json?ns=' + emulatorProject + authQuery, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  const value = await response.json();
  return { ok: response.ok, status: response.status, value };
}
export async function good(uid, method, path, body) {
  const response = await request(uid, method, path, body);
  if (!response.ok) throw Object.assign(Error(JSON.stringify(response)), { code: 'PERMISSION_DENIED' });
  return response.value;
}
export async function reset(rules) {
  await good('EMULATOR_ADMIN', 'PUT', '.settings/rules', rules);
  await good('EMULATOR_ADMIN', 'PUT', '', { learningHub: { teacherApprovals: { teacher: true, 'teacher-b': { enabled: true } } } });
}
