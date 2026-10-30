// Real pinned Firebase SDK + actual emulator Rules, without Google OAuth or a real project.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { reset, good, emulatorOrigin, emulatorProject, mockToken } from './fixtures/classroom-emulator.mjs';
import { buildSubmissionRules } from './build-classroom-submission-rules.mjs';
import { buildAssignmentRules } from './build-classroom-assignment-rules.mjs';
import { createClassroomSubmissions } from '../js/classroom-submission-service.js';
import { buildMonitorRules } from './build-classroom-monitor-rules.mjs';
import { createRoomUpdates, joinRoomUpdates } from '../js/classroom-model.js';
import { createClassroomMonitor } from '../js/classroom-monitor-service.js';
// The pinned Node SDK ignores NO_PROXY. This test's guarded emulator endpoint
// is loopback-only, so its local WebSocket must not use an outbound proxy.
for (const key of ['HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy']) delete process.env[key];
const require = createRequire(import.meta.url), moduleRoot = process.env.FIREBASE_MODULE || '../work/qa-tools/node_modules/firebase';
const { initializeApp, deleteApp } = require(moduleRoot + '/app');
const sdk = require(moduleRoot + '/database');
const rules = JSON.parse(await readFile(new URL('../firebase/classroom-phase1.merged-draft.json', import.meta.url), 'utf8'));
rules.rules.classroomMonitorV1 = buildMonitorRules();
rules.rules.classroomAssignmentsV1 = buildAssignmentRules(); rules.rules.classroomSubmissionsV1 = buildSubmissionRules(); await reset(rules);
const roomId = 'r_' + 'a'.repeat(32), stamp = { '.sv': 'timestamp' };
await good('teacher','PATCH','classroomV1',createRoomUpdates('teacher','SDK lesson',{roomId,code:'ABCD2345'},stamp));
await good('student','PATCH','classroomV1',joinRoomUpdates('student',roomId,'ABCD2345','SDK Student',stamp));
const clients = [], errors = [];
function client(uid, teacher) {
  const app = initializeApp({ projectId: emulatorProject, databaseURL: `https://${emulatorProject}.firebaseio.com` }, 'monitor-sdk-' + uid);
  const db = sdk.getDatabase(app), endpoint = new URL(emulatorOrigin);
  sdk.connectDatabaseEmulator(db, endpoint.hostname, Number(endpoint.port), { mockUserToken: mockToken(uid) });
  const at = path => sdk.ref(db, path.startsWith('@classroom/') ? 'classroomV1/' + path.slice(11) : 'classroomMonitorV1/' + path);
  let snapshot;
  const order = [];
  const service = createClassroomMonitor({ onChange: value => { snapshot = value; }, io: {
    watch: (path, fn, error) => sdk.onValue(at(path), value => fn(value.val()), failure => { errors.push(failure.code); error(failure); }),
    connected: fn => sdk.onValue(sdk.ref(db,'.info/connected'), value => fn(value.val() === true)),
    timestamp: sdk.serverTimestamp, get: async path => (await sdk.get(at(path))).val(),
    set: async(path,value) => { order.push(value.connected === false ? 'prepare-offline' : 'online'); await sdk.set(at(path),value); },
    update: value => sdk.update(sdk.ref(db,'classroomMonitorV1'),value), remove: path => sdk.remove(at(path)),
    transaction: async(path,transform) => { const result = await sdk.runTransaction(at(path),transform,{applyLocally:false}); return {committed:result.committed,value:result.snapshot.val()}; },
    disconnect: async(path,value) => { order.push('register-disconnect'); const registration = sdk.onDisconnect(at(path)); await registration.update(value); return {cancel:()=>registration.cancel()}; },
  } });
  service.setIdentity({ status:'signed-in',user:{uid} },{ uid,status:'ready',isTeacher:teacher,systemRole:teacher?'teacher':'student' });
  const result = { app, db, service, order, get state() { return snapshot; } }; clients.push(result); return result;
}
async function until(predicate, label) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) { if (predicate()) return; await new Promise(done => setTimeout(done,30)); }
  throw Error('SDK timeout: ' + label + '; states=' + JSON.stringify(clients.map(value => value.state)));
}
try {
  const teacher = client('teacher',true), student = client('student',false);
  await until(()=>teacher.state.connected && student.state.connected && teacher.state.rooms[0]?.ownerUid && student.state.rooms[0]?.ownerUid,'room discovery');
  const assignmentId='a_'+'b'.repeat(32), revision='c'.repeat(64);
  const item={version:1,ownerUid:'teacher',title:'SDK homework',instructions:'',dueAt:0,targetHash:'#content/sdk-quiz',contentId:'sdk-quiz',quizTitleTh:'ทดสอบ',quizTitleEn:'Test',status:'published',createdAt:stamp,updatedAt:stamp,publishedAt:stamp,revision:1};
  await good('teacher','PUT',`classroomAssignmentsV1/items/${roomId}/${assignmentId}`,item);
  const homeworkServices=[];
  function homeworkClient(client,uid,isTeacher) {
    const target=path=>sdk.ref(client.db,path.startsWith('@classroom/')?'classroomV1/'+path.slice(11):path.startsWith('@assignments/')?'classroomAssignmentsV1/'+path.slice(13):'classroomSubmissionsV1/'+path);
    const service=createClassroomSubmissions({readQuiz:()=>({questions:[{id:'one',type:'choice',answer:'a',choices:[{id:'a'},{id:'b'}]}]}),freezeQuiz:async()=>({version:1,contentId:'sdk-quiz',targetHash:'#content/sdk-quiz',revision,html:'<quiz>',questionCount:1}),io:{
      watch:(path,fn,fail)=>sdk.onValue(target(path),snapshot=>fn(snapshot.val()),fail),connected:fn=>sdk.onValue(sdk.ref(client.db,'.info/connected'),snapshot=>fn(snapshot.val()===true)),get:async path=>(await sdk.get(target(path))).val(),timestamp:sdk.serverTimestamp,
      transaction:async(path,change)=>{const result=await sdk.runTransaction(target(path),change,{applyLocally:false});return{committed:result.committed};},
    }});
    service.setContext({status:'signed-in',user:{uid}},{uid,status:'ready',isTeacher,systemRole:isTeacher?'teacher':'student'}, {uid,rooms:[{id:roomId,status:'ready',ownerUid:'teacher',membership:isTeacher?'owner':'student',items:[{id:assignmentId,...item}]}]},roomId);
    homeworkServices.push(service);return service;
  }
  try {
    const teacherWork=homeworkClient(teacher,'teacher',true),studentWork=homeworkClient(student,'student',false);
    await until(()=>teacherWork.getState().connected&&studentWork.getState().connected,'homework connection');
    await teacherWork.prepare(assignmentId);const binding=await studentWork.open(assignmentId);
    const progress={version:2,identityKey:'student',contentId:'sdk-quiz',answers:{one:'a'},giveUps:{},masteredIds:[],elapsedMs:1234};
    await studentWork.quizCommand('save',binding,{value:progress,storageRevision:0});
    await studentWork.quizCommand('save',binding,{value:progress,storageRevision:1});
    const outcomes=await Promise.all([studentWork.quizCommand('submit',binding,{value:progress,submissionId:'d'.repeat(32)}),studentWork.quizCommand('submit',binding,{value:progress,submissionId:'e'.repeat(32)})]);
    assert.equal(outcomes[0].grade.score,1);assert.equal(outcomes[0].result.submittedAt,outcomes[1].result.submittedAt);
    await until(()=>teacherWork.getState().grades[assignmentId]?.rows[0]?.grade?.score===1,'teacher homework score');
    assert.equal(await good('EMULATOR_ADMIN','GET','quizProgress'),null);
    console.log('PASS real SDK homework snapshot, revisioned autosave and concurrent final-submit retries retain one immutable result');
  } finally {for(const service of homeworkServices)service.dispose();}
  teacher.service.selectRoom(roomId); await teacher.service.command('lock',{roomId});
  await until(()=>student.state.lesson,'lesson available'); await student.service.command('join',{roomId});
  await until(()=>teacher.state.rows[0]?.status === 'visible','first online connection');
  assert.deepEqual(student.order.slice(0,3),['prepare-offline','register-disconnect','online']);
  console.log('PASS real SDK prepares full offline record before registering onDisconnect, then reports online');
  await teacher.service.command('nudge',{roomId,targetUid:'student',text:'SDK nudge'});
  await until(()=>student.state.selfNotices.length === 1,'message delivery');
  const id = student.state.selfNotices[0].id;
  await student.service.command('ack',{roomId,id});
  await until(()=>teacher.state.rows[0]?.notices[0]?.ackAt,'receipt update');
  console.log('PASS real SDK transactions and receipt updates obey production Rules');
  sdk.goOffline(student.db);
  await until(()=>teacher.state.rows[0]?.status === 'disconnected','server onDisconnect update');
  sdk.goOnline(student.db);
  await until(()=>teacher.state.rows[0]?.status === 'visible','SDK reconnection');
  assert.deepEqual(errors,[]);
  console.log('PASS server executes onDisconnect after socket closure; reconnect reports online again');
  await teacher.service.command('unlock',{roomId});
  await until(()=>student.state.lesson === null,'unlock stops lesson');
  // Permission cancellation is expected when an active-only read closes. No
  // first-connection/receipt write error may have been reported before unlock.
  assert.equal(student.state.selfNotices.length,0);
  console.log('PASS real SDK unlock clears student lesson and messages');
} finally {
  for (const value of clients) value.service.dispose();
  for (const value of clients) { sdk.goOffline(value.db); await deleteApp(value.app); }
}
