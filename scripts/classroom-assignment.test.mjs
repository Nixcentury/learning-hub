import test from 'node:test';
import assert from 'node:assert/strict';
import { createClassroomAssignments } from '../js/classroom-assignment-service.js';
import { assignmentHash, assignmentUrl, parseAssignmentRoute, parseThaiDateInput, thaiDateInput, resolveAssignmentQuiz, resolveAssignmentLesson, assignmentStatus } from '../js/classroom-assignment-model.js';
import { resolveHubRoute } from '../js/hub-routes.js';
import { resolveNavigation } from '../js/hub-navigation.js';
const rid = 'r_' + 'a'.repeat(32), aid = 'a_' + 'b'.repeat(32), other = 'r_' + 'c'.repeat(32);
const hub = 'https://example.test/learning-hub/';
const quizRoute = { kind: 'content', status: 'ready', hash: '#physics/1/waves/quiz', aliases: [], subjectId: 'physics', chapterId: '1', topicId: 'waves', contentId: 'wave-quiz', parentHash:'#physics/1' };
const chapter={hash:'#physics/1',kind:'chapter',status:'legacy',subjectId:'physics',chapterId:'1',titleTh:'บทเรียนคลื่น',titleEn:'Waves lesson',parentHash:'#physics'};
const catalog = { schemaVersion: 1, routes: [quizRoute, chapter, { hash: '#overview', aliases: [], kind: 'section', sectionId: 'overview', status: 'ready' }],
  contents: [{ id: 'wave-quiz', source: 'content/test/waves.html', toolKind: 'quiz', titleTh: 'คลื่น', titleEn: 'Waves' }] };
const context = (uid, teacher = false) => [{ status: 'signed-in', user: { uid } }, { uid, status: 'ready', isTeacher: teacher, systemRole: teacher ? 'teacher' : 'student' }];
const tick = () => new Promise(done => setImmediate(done));
function fixture(t, user = 'teacher', teacher = true) {
  const db = { '@classroom': { userRooms: { teacher: { [rid]: 'owner' }, student: { [rid]: 'student' } }, rooms: { [rid]: { name: 'Physics', ownerUid: 'teacher' } } }, items: {}, drafts: {}, seen: {} };
  const watchers = [], writes = [], reads = [];
  const get = path => path.split('/').reduce((value, key) => value?.[key], db) ?? null;
  function put(path, value) { const parts = path.split('/'), key = parts.pop(); let at = db; for (const part of parts) at = at[part] ||= {}; if (value === null) delete at[key]; else at[key] = structuredClone(value); }
  function emit() { for (const w of watchers) if (w.active) w.ok(structuredClone(get(w.path))); }
  const io = {
    get: async path => { reads.push(path); return structuredClone(get(path)); },
    watch(path, ok, fail) { const w = { path, ok, fail, active: true }; watchers.push(w); queueMicrotask(() => { if (w.active) ok(structuredClone(get(path))); }); return () => { w.active = false; }; },
    connected(fn) { queueMicrotask(() => fn(true)); return () => {}; }, timestamp: () => 1000,
    async transaction(path, change) { const next = change(structuredClone(get(path))); if (next === undefined) return { committed: false }; writes.push({ [path]: next }); put(path, next); emit(); return { committed: true }; },
    async update(patch) { writes.push(patch); for (const [path, value] of Object.entries(patch)) put(path, value); emit(); },
  };
  const service = createClassroomAssignments({ io, hubUrl: hub, loadCatalog: async () => catalog });
  t.after(() => service.dispose()); service.setIdentity(...context(user, teacher));
  return { service, db, io, get, put, emit, writes, reads, watchers };
}
const input = { roomId: rid, id: aid, title: 'ทวนคลื่น', instructions: 'ทำให้ครบ', url: hub + quizRoute.hash, dueAt: 0, revision: 0 };
test('assignment prerequisites are optional and must refer to earlier published work in the same room',async t=>{
  const f=fixture(t);await tick();
  const prior='a_'+'c'.repeat(32);f.put(`items/${rid}/${prior}`,{...input,status:'published',publishedAt:500,targetHash:quizRoute.hash,contentId:'wave-quiz',revision:1});f.emit();
  await f.service.command('save',{...input,requiresAssignmentId:prior});
  assert.equal(f.get(`drafts/${rid}/${aid}`).requiresAssignmentId,prior);
  await f.service.command('publish',{...input,revision:1,requiresAssignmentId:prior});
  assert.equal(f.get(`items/${rid}/${aid}`).requiresAssignmentId,prior);
  for(const requiresAssignmentId of [aid,'not-an-id','a_'+'e'.repeat(32)])await assert.rejects(f.service.command('save',{...input,revision:2,requiresAssignmentId}),{code:'assignment/invalid-prerequisite'});
  f.put(`items/${rid}/${prior}`,{...f.get(`items/${rid}/${prior}`),publishedAt:2000});f.emit();
  await assert.rejects(f.service.command('save',{...input,revision:2,requiresAssignmentId:prior}),{code:'assignment/invalid-prerequisite'});
});
test('lesson shortcuts follow canonical content, chapter and bank parents without guessing titles',()=>{
  const canonical={...quizRoute,hash:'#content/wave-quiz',aliases:['#content/wave-alias']};
  const c={...catalog,routes:[...catalog.routes,canonical]};
  assert.deepEqual(resolveAssignmentLesson({targetHash:'#content/wave-alias',contentId:'wave-quiz'},c),{hash:chapter.hash,titleTh:chapter.titleTh,titleEn:chapter.titleEn});
  assert.equal(resolveAssignmentLesson({targetHash:canonical.hash,contentId:'different'},c),null);
  assert.equal(resolveAssignmentLesson({targetHash:'#content/missing',title:'Physics chapter 4'},c),null);
  const bank='#physics/bank/b-'+'a'.repeat(24);
  const bankParent={hash:bank,kind:'bank',status:'ready',bankKey:'b-'+'a'.repeat(24),titleTh:'สมดุลกล',titleEn:'Equilibrium'};
  const bankContent={...canonical,parentHash:bank};
  assert.equal(resolveAssignmentLesson({targetHash:canonical.hash},{...c,routes:[bankContent,bankParent]}).hash,bank);
  assert.equal(resolveAssignmentLesson({targetHash:canonical.hash},{...c,routes:[{...canonical,parentHash:canonical.hash}]}),null);
});
test('lesson navigation is resolved for the current room and performs no database writes',async t=>{
  const f=fixture(t,'student',false);await tick();
  f.put(`items/${rid}/${aid}`,{...input,status:'closed',publishedAt:1000,targetHash:quizRoute.hash,contentId:'wave-quiz'});f.emit();await tick();
  assert.equal(f.service.getState().rooms[0].lessonShortcuts[aid].hash,chapter.hash);
  const result=await f.service.command('lesson',{roomId:rid,id:aid,hash:'#chemistry'},'student');
  assert.equal(result.lesson.hash,chapter.hash);assert.equal(f.writes.length,0);
  await assert.rejects(f.service.command('lesson',{roomId:rid,id:'a_'+'d'.repeat(32)},'student'),{code:'assignment/room-unavailable'});
});
test('private assignment links preserve IDs without accepting malformed routes or weakening public routing', () => {
  const hash = assignmentHash(rid, aid);
  assert.deepEqual(parseAssignmentRoute(hash), { roomId: rid, assignmentId: aid });
  assert.equal(assignmentUrl(rid, aid, hub + 'index.html?x=1'), hub + hash);
  assert.equal(resolveHubRoute(null, hash).route.roomId, rid);
  assert.equal(resolveNavigation(catalog, hash).route.assignmentId, aid);
  for (const bad of [hash + '/extra', '#classroom/r_x/' + aid, hash.replace('r_', 'r%5f'), '#physics/r_bad']) assert.equal(parseAssignmentRoute(bad), null);
  assert.equal(resolveHubRoute(catalog, '#physics/r_bad').status, 'invalid');
});
test('quiz assignment resolver accepts catalog quizzes and bank quizzes; rejects arbitrary pages, redirects, external players and temporary work', () => {
  assert.equal(resolveAssignmentQuiz(input.url, catalog, hub).contentId, 'wave-quiz');
  assert.ok(resolveAssignmentQuiz(hub + '#physics/bank/b-' + 'a'.repeat(24) + '/quiz', catalog, hub).contentId.startsWith('bank-'));
  for (const url of ['https://evil.test/' + quizRoute.hash, hub + 'pages/tools/quiz-player.html', hub + '?x=1' + quizRoute.hash,
    hub + '#overview', hub + '#physics/bank/b-' + 'a'.repeat(24) + '/notebook', hub + '#content/temporary']) assert.throws(() => resolveAssignmentQuiz(url, catalog, hub), { code: 'assignment/invalid-quiz' });
});
test('due dates consistently use Thailand time regardless of the browser timezone and reject impossible dates', () => {
  const value = parseThaiDateInput('2026-11-01T23:59');
  assert.equal(new Date(value).toISOString(), '2026-11-01T16:59:00.000Z');
  assert.equal(thaiDateInput(value), '2026-11-01T23:59');
  assert.equal(parseThaiDateInput(''), 0);
  for (const bad of ['2026-02-30T12:00', '2026-11-01', '2026-11-01T25:01']) assert.throws(() => parseThaiDateInput(bad));
  assert.equal(assignmentStatus({ status: 'published', dueAt: 10 }, 11), 'overdue');
  assert.equal(assignmentStatus({ status: 'closed', dueAt: 10 }, 11), 'closed');
});
test('teacher previews, saves a private draft, and atomically publishes the same assignment ID', async t => {
  const f = fixture(t); await tick();
  assert.equal((await f.service.command('preview', input, 'teacher')).preview.contentId, 'wave-quiz');
  assert.equal(f.writes.length, 0);
  await f.service.command('save', input, 'teacher');
  assert.equal(f.get(`drafts/${rid}/${aid}`).status, 'draft');
  assert.equal(f.get(`items/${rid}/${aid}`), null);
  await f.service.command('publish', { ...input, revision: 1 }, 'teacher');
  assert.equal(f.get(`drafts/${rid}/${aid}`), null);
  assert.equal(f.get(`items/${rid}/${aid}`).revision, 2);
  assert.equal(Object.keys(f.writes.at(-1)).length, 2);
});
test('students subscribe to published work and only their own read receipts; opening is not submission', async t => {
  const f = fixture(t, 'student', false); await tick();
  f.put(`items/${rid}/${aid}`, { ...input, status: 'published', publishedAt: 1000, targetHash: quizRoute.hash, contentId: 'wave-quiz' }); f.emit();
  assert.equal(f.service.getState().unread.length, 1);
  assert.ok(!f.watchers.some(w => w.path.startsWith('drafts/')));
  assert.ok(f.watchers.some(w => w.path === `seen/${rid}/student`));
  await assert.rejects(f.service.command('publish', input), { code: 'assignment/owner-required' });
  await f.service.command('seen', { roomId: rid, id: aid });
  assert.equal(f.service.getState().unread.length, 0);
  const before = f.writes.length;
  assert.equal((await f.service.command('launch', { roomId: rid, id: aid })).targetHash, quizRoute.hash);
  assert.equal(f.writes.length, before);
  assert.equal(f.get('quizProgress'), null);
});
test('closed homework cannot launch; existing published targets stay stable; stale revisions fail', async t => {
  const f = fixture(t); await tick(); await f.service.command('publish', input);
  await assert.rejects(f.service.command('save', input), { code: 'assignment/conflict' });
  await f.service.command('save', { ...input, revision: 1, url: 'https://evil.test/', title: 'Updated' });
  assert.equal(f.get(`items/${rid}/${aid}`).targetHash, quizRoute.hash);
  await f.service.command('close', { roomId: rid, id: aid, revision: 2 });
  await assert.rejects(f.service.command('launch', { roomId: rid, id: aid }), { code: 'assignment/closed' });
});
test('account and room changes stop old listeners and clear private drafts and unread data', async t => {
  const f = fixture(t); await tick(); await f.service.command('save', input);
  const old = f.watchers.find(w => w.path === `drafts/${rid}`);
  f.service.setIdentity(...context('student', false)); await tick();
  old.ok({ [aid]: { title: 'Private old account' } });
  assert.deepEqual(f.service.getState().rooms[0].drafts, []);
  assert.equal(f.service.getState().uid, 'student');
  f.put('@classroom/userRooms/student', {}); f.emit();
  assert.deepEqual(f.service.getState().rooms, []);
  await assert.rejects(f.service.command('view', { roomId: other, id: aid }), { code: 'assignment/room-unavailable' });
});
test('pending save is not successful before acknowledgement; old-account asynchronous catalog resolution cannot write', async t => {
  const f = fixture(t); await tick(); let finish;
  f.io.update = () => new Promise(done => { finish = done; });
  let saved = false;
  const operation = f.service.command('publish', input).then(() => { saved = true; }); await tick();
  assert.equal(saved, false); assert.equal(f.service.getState().busy, 'publish');
  await assert.rejects(f.service.command('publish', input), { code: 'assignment/busy' });
  f.service.setIdentity(...context('student', false)); finish();
  await assert.rejects(operation, { code: 'assignment/session-changed' });
  assert.equal(f.service.getState().busy, '');
});
