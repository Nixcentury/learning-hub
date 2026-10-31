import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMParser, parseHTML } from 'linkedom';
import { freezeHomeworkQuiz } from '../js/classroom-submission-quiz.js';
import { createClassroomSubmissions } from '../js/classroom-submission-service.js';
import { gradeHomework, gradeSubmission, submissionPayload, homeworkStorageKey } from '../public/shared/classroom-submission-model.js';
import { readHomeworkQuiz, sanitizeHomeworkRoot } from '../public/shared/classroom-submission-quiz.js';
const rid = 'r_' + 'a'.repeat(32), aid = 'a_' + 'b'.repeat(32), other = 'r_' + 'c'.repeat(32), revision = 'd'.repeat(64);
const questions = [
  { id: 'choice', type: 'choice', answer: 'a', choices: [{id:'a'},{id:'b'}] },
  { id: 'number', type: 'number', answer: '5/6', tolerance: 0 },
  { id: 'drag', type: 'drag-drop', items: [{id:'one'},{id:'two'}], slots: [{id:'x',answer:'one'},{id:'y',answer:'two'}], reuse: 'once' },
];
const quiz = { version: 1, contentId: 'waves-quiz', revision, html: '<quiz>', questionCount: 3, targetHash: '#content/waves-quiz', createdAt: 1000 };
const item = { id: aid, contentId: quiz.contentId, targetHash: quiz.targetHash, title: 'Waves', status: 'published', dueAt: 900 };
const progress = (answers = {}) => ({ version: 2, identityKey: 'student', contentId: quiz.contentId, answers, giveUps: {}, masteredIds: ['choice','number','drag'], elapsedMs: 2345 });
const tick = () => new Promise(done => setImmediate(done));
function fixture(t, user = 'student', prepared = true, questionList = questions) {
  const frozen = { ...quiz, questionCount: questionList.length };
  const db = { quizzes: prepared ? {[rid]:{[aid]:frozen}} : {}, results: {}, attempts: {}, '@classroom': { members: { [rid]: { student: {displayName:'นักเรียน ก'}, 'student-b': {displayName:'นักเรียน ข'} } } }, '@assignments': {items:{[rid]:{[aid]:item},[other]:{[aid]:item}}} };
  const watchers = [], writes = [], reads = [], connections = [];
  const get = path => path.split('/').reduce((value,key)=>value?.[key],db) ?? null;
  const put = (path,value) => { const parts=path.split('/'), key=parts.pop();let at=db;for(const part of parts)at=at[part] ||= {};if(value===null)delete at[key];else at[key]=structuredClone(value); };
  function emit() { for (const w of watchers) if (w.active) w.success(structuredClone(get(w.path))); }
  const io = { get: async path => { reads.push(path);return structuredClone(get(path)); }, timestamp:()=>1000,
    connected(fn) { connections.push(fn);queueMicrotask(()=>fn(true));return ()=>{}; },
    watch(path,success,failure) { const w={path,success,failure,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active)success(structuredClone(get(path)));});return()=>{w.active=false;}; },
    async transaction(path,change) { const next=change(structuredClone(get(path)));if(next===undefined)return{committed:false};writes.push({path,next});put(path,next);emit();return{committed:true}; },
    async update(values) { writes.push({values});for(const [path,value] of Object.entries(values))put(path,value);emit(); },
  };
  const service=createClassroomSubmissions({io,freezeQuiz:async()=>frozen,readQuiz:()=>({questions:questionList})});
  function context(uid=user, selected=rid, items=[item]) {
    const teacher=uid==='teacher', role={uid,status:'ready',isTeacher:teacher,systemRole:teacher?'teacher':'student'};
    const assignments={uid,hubUrl:'https://example.test/learning-hub/',rooms:[rid,other].map(id=>({id,status:'ready',membership:teacher?'owner':'student',ownerUid:'teacher',items}))};
    service.setContext({status:'signed-in',user:{uid}},role,assignments,selected);
    return assignments;
  }
  context();t.after(()=>service.dispose());
  return {service,io,db,get,put,emit,writes,reads,watchers,connections,context};
}

const nextId='a_'+'e'.repeat(32);
async function gatedFixture(t, questionList=questions) {
  const f=fixture(t,'student',true,questionList), next={...item,id:nextId,title:'Next work',requiresAssignmentId:aid};
  f.put(`@assignments/items/${rid}/${nextId}`,next);f.put(`quizzes/${rid}/${nextId}`,f.get(`quizzes/${rid}/${aid}`));
  f.context('student',rid,[item,next]);await tick();return {...f,next};
}
test('prerequisites require a final submission above 50%; drafts and exactly 50% do not unlock, and other students stay locked',async t=>{
  const f=await gatedFixture(t,questions.slice(0,2)), binding=await f.service.open(aid);
  await assert.rejects(f.service.open(nextId),{code:'homework/prerequisite-locked'});
  await f.service.quizCommand('save',binding,{value:progress({choice:'a',number:'5/6'}),storageRevision:0});
  assert.equal(f.service.getState().gates[nextId].status,'locked');
  const half=await f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'1'.repeat(32)});
  assert.equal(half.grade.percent,50);assert.equal(f.service.getState().gates[nextId].status,'locked');
  const direct={...binding,id:nextId};
  for(const action of ['load','save','submit']) await assert.rejects(f.service.quizCommand(action,direct,{value:progress(),storageRevision:0,submissionId:'3'.repeat(32)}),{code:'homework/prerequisite-locked'});
  const pass=await f.service.quizCommand('submit',binding,{value:progress({choice:'a',number:'5/6'}),submissionId:'2'.repeat(32),previousSubmissionId:half.result.submissionId});
  assert.equal(pass.grade.percent,100);assert.equal(f.service.getState().gates[nextId].status,'open');
  assert.equal((await f.service.open(nextId)).id,nextId);
  f.context('student-b',rid,[item,f.next]);await tick();
  assert.equal(f.service.getState().gates[nextId].status,'locked');await assert.rejects(f.service.open(nextId),{code:'homework/prerequisite-locked'});
});
test('an archived passing submission keeps access after score reduction and a fresh account/context load while grades stay latest',async t=>{
  const f=await gatedFixture(t),binding=await f.service.open(aid);
  const first=await f.service.quizCommand('submit',binding,{value:progress({choice:'a',number:'5/6'}),submissionId:'1'.repeat(32)});
  assert.ok(first.grade.percent>50);
  await f.service.quizCommand('submit',binding,{value:progress({choice:'b'}),submissionId:'2'.repeat(32),previousSubmissionId:first.result.submissionId});
  assert.equal(f.service.getState().grades[aid].rows[0].grade.score,0);assert.equal(f.service.getState().gates[nextId].status,'open');
  f.context('student-b',rid,[item,f.next]);await tick();f.context('student',rid,[item,f.next]);await tick();
  assert.equal(f.service.getState().gates[nextId].status,'open');await f.service.open(nextId);
  f.context('teacher',rid,[item,f.next]);await tick();
  assert.equal(f.service.getState().grades[aid].rows.find(row=>row.uid==='student').grade.score,0);
  assert.equal((await f.service.open(nextId)).preview,true);
});
test('adding a prerequisite while a quiz is open is checked on load, save and submit even with stale UI context',async t=>{
  const f=await gatedFixture(t),unrestricted={...f.next};delete unrestricted.requiresAssignmentId;
  f.put(`@assignments/items/${rid}/${nextId}`,unrestricted);f.context('student',rid,[item,unrestricted]);await tick();
  const binding=await f.service.open(nextId);
  f.put(`@assignments/items/${rid}/${nextId}`,f.next);
  const before=f.writes.length;
  for(const action of ['load','save','submit']) await assert.rejects(f.service.quizCommand(action,binding,{value:progress(),storageRevision:0,submissionId:'3'.repeat(32)}),{code:'homework/prerequisite-locked'});
  assert.equal(f.writes.length,before);
});
test('adding a prerequisite retains old results but requires the prerequisite before reopening for correction',async t=>{
  const f=await gatedFixture(t),unrestricted={...f.next};delete unrestricted.requiresAssignmentId;
  f.put(`@assignments/items/${rid}/${nextId}`,unrestricted);f.context('student',rid,[item,unrestricted]);await tick();
  const binding=await f.service.open(nextId);
  const sent=await f.service.quizCommand('submit',binding,{value:progress({choice:'b'}),submissionId:'3'.repeat(32)});
  f.put(`@assignments/items/${rid}/${nextId}`,f.next);f.context('student',rid,[item,f.next]);await tick();
  assert.equal(f.service.getState().gates[nextId].status,'locked');
  assert.equal(f.service.getState().grades[nextId].rows[0].submitted,true);
  assert.equal(f.get(`results/${rid}/${nextId}/student`).submissionId,sent.result.submissionId);
  await assert.rejects(f.service.open(nextId),{code:'homework/prerequisite-locked'});
  const prior=await f.service.open(aid);
  await f.service.quizCommand('submit',prior,{value:progress({choice:'a',number:'5/6'}),submissionId:'2'.repeat(32)});
  assert.equal(f.service.getState().gates[nextId].status,'open');
  await f.service.quizCommand('save',binding,{value:progress({choice:'a'}),storageRevision:0,previousSubmissionId:sent.result.submissionId});
});
test('a delayed prerequisite history read cannot unlock a different account',async t=>{
  const f=await gatedFixture(t),original=f.io.get;let release;
  const record={...submissionPayload(progress({choice:'a',number:'5/6'}),questions),version:1,contentId:quiz.contentId,quizRevision:revision,submittedAt:1000,submissionId:'1'.repeat(32),dueAt:0};
  f.io.get=async path=>path===`history/${rid}/${aid}/student`?new Promise(done=>{release=done;}):original(path);
  const opening=f.service.open(nextId);await tick();assert.equal(typeof release,'function');
  f.context('student-b',rid,[item,f.next]);await tick();release({old:record});
  await assert.rejects(opening,{code:'homework/session-changed'});
  assert.equal(f.service.getState().gates[nextId].status,'locked');
});

test('homework grading uses the submitted answers, never cumulative mastery or client score fields',()=>{
  const answer={choice:'a',number:'\\frac56',drag:{x:'one',y:'two'}};
  assert.equal(gradeHomework(questions,answer).score,3);
  const value=submissionPayload({...progress({choice:'b'}),latestScore:{score:999,maxScore:999}},questions);
  assert.ok(!('score' in value));assert.equal(gradeHomework(questions,JSON.parse(value.answersJson)).score,0);
  assert.equal(gradeHomework(questions,answer,{number:true}).score,2);
  assert.equal(gradeHomework(questions,{drag:{x:'one'}}).score,0);
});
test('numeric partial drafts survive autosave; invalid final answers and unknown question IDs are rejected',()=>{
  assert.doesNotThrow(()=>submissionPayload(progress({number:'-'}),questions,{draft:true}));
  assert.throws(()=>submissionPayload(progress({number:'-'}),questions),{code:'homework/invalid-answers'});
  for(const answers of [{unknown:'a'},{choice:'x'},{drag:{x:'one',y:'one'}},[]])assert.throws(()=>gradeHomework(questions,answers));
  assert.throws(()=>submissionPayload({...progress(),elapsedMs:NaN},questions));
});
test('results use the frozen revision and original deadline; malformed records never become zero scores',()=>{
  const record={...submissionPayload(progress({choice:'a'}),questions),version:1,contentId:quiz.contentId,quizRevision:revision,submittedAt:1000,dueAt:900};
  assert.equal(gradeSubmission(record,quiz,questions).score,1);assert.equal(gradeSubmission(record,quiz,questions).late,true);
  for(const change of [{quizRevision:'x'},{answersJson:'broken'},{answersJson:'[]'},{contentId:'other'}])assert.equal(gradeSubmission({...record,...change},quiz,questions).error,'homework/invalid-result');
  assert.notEqual(homeworkStorageKey('student',{roomId:rid,id:aid,quizRevision:revision}),homeworkStorageKey('student',{roomId:other,id:aid,quizRevision:revision}));
});
test('only the teacher prepares a frozen question set; re-enabling keeps its original revision',async t=>{
  const f=fixture(t,'teacher',false);await tick();await f.service.prepare(aid);assert.equal(f.writes.length,1);
  await f.service.prepare(aid);assert.equal(f.writes.length,1);assert.equal(f.service.getState().grades[aid].ready,true);
  f.context('student');await tick();await assert.rejects(f.service.prepare(aid),{code:'homework/owner-required'});
});
test('teacher preview reads the frozen quiz without creating practice, drafts or submissions',async t=>{
  const f=fixture(t,'teacher');await tick();const binding=await f.service.open(aid);assert.equal(binding.preview,true);
  assert.equal((await f.service.quizCommand('load',binding)).quiz.revision,revision);
  await assert.rejects(f.service.quizCommand('submit',binding,{value:progress(),submissionId:'e'.repeat(32)}),{code:'homework/student-required'});
  assert.equal(f.writes.length,0);
});
test('opening and autosaving homework never create a submission or touch ordinary quiz progress',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);
  assert.equal((await f.service.quizCommand('load',binding)).result,null);
  const saved=await f.service.quizCommand('save',binding,{value:progress({number:'-'}),storageRevision:0});assert.equal(saved.storageRevision,1);
  assert.equal(f.get(`results/${rid}/${aid}/student`),null);assert.equal(f.get('quizProgress'),null);
  await assert.rejects(f.service.quizCommand('save',binding,{value:progress(),storageRevision:0}),{code:'homework/conflict'});
  const loaded=await f.service.quizCommand('load',binding);assert.equal(loaded.value.answers.number,'-');assert.equal(loaded.storageRevision,1);
});
test('resubmission retains previous scores while editing and archives each prior result; teacher sees the latest total',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);
  const first=await f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'e'.repeat(32)});
  assert.equal(first.grade.score,1);const writes=f.writes.length;
  const duplicate=await f.service.quizCommand('submit',binding,{value:progress({choice:'a',number:'5/6'}),submissionId:'e'.repeat(32)});
  assert.equal(duplicate.grade.score,1);assert.equal(f.writes.length,writes);
  await f.service.quizCommand('save',binding,{value:progress({choice:'a',number:'5/6'}),storageRevision:0,previousSubmissionId:first.result.submissionId});
  assert.equal((await f.service.quizCommand('load',binding)).value.answers.number,'5/6');
  assert.equal(f.get(`results/${rid}/${aid}/student`).answersJson,first.result.answersJson);
  const second=await f.service.quizCommand('submit',binding,{value:progress({choice:'a',number:'5/6'}),submissionId:'f'.repeat(32),previousSubmissionId:first.result.submissionId});
  assert.equal(second.grade.score,2);assert.equal(second.grade.submissionRevision,2);
  assert.deepEqual(f.get(`history/${rid}/${aid}/student/${first.result.submissionId}`),first.result);
  assert.equal((await f.service.quizCommand('load',binding)).value,null,'An older draft must not replace the newly submitted total');
  await assert.rejects(f.service.quizCommand('submit',binding,{value:progress(),submissionId:'a'.repeat(32),previousSubmissionId:first.result.submissionId}),{code:'homework/conflict'});
  f.context('teacher');await tick();const rows=f.service.getState().grades[aid].rows;
  assert.equal(rows.length,2);assert.equal(rows.find(row=>row.uid==='student').grade.score,2);assert.equal(rows.find(row=>row.uid==='student-b').submitted,false);
  assert.deepEqual((await f.service.history(aid,'student')).rows.map(row=>row.score),[2,1]);
  f.context('student-b');await tick();await assert.rejects(f.service.history(aid,'student'),{code:'homework/invalid-request'});
});
test('a lost acknowledgement recovers the existing server result rather than creating another submission',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid); const originalIO={...f.io};
  f.io.update=async(...args)=>{await originalIO.update(...args);throw Error('connection lost after commit');};
  const saved=await f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'e'.repeat(32)});
  assert.equal(saved.grade.score,1);assert.equal(f.writes.length,1);
});
test('closing blocks new submissions but retains submitted results and does not discard the saved draft',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);
  await f.service.quizCommand('save',binding,{value:progress({choice:'b'}),storageRevision:0});
  f.put(`@assignments/items/${rid}/${aid}`,{...item,status:'closed'});
  await assert.rejects(f.service.quizCommand('submit',binding,{value:progress(),submissionId:'e'.repeat(32)}),{code:'homework/closed'});
  const loaded=await f.service.quizCommand('load',binding);assert.equal(loaded.closed,true);assert.equal(loaded.value.answers.choice,'b');
});
test('account changes cancel pending preparation and old watchers cannot restore private results',async t=>{
  const f=fixture(t,'teacher',false);await tick();let finish;f.io.get=async path=>{if(path.startsWith('@assignments/'))await new Promise(done=>{finish=done;});return f.get(path);};
  const preparing=f.service.prepare(aid);await tick();const old=f.watchers.find(w=>w.path===`results/${rid}`);
  f.context('student-b');finish();await assert.rejects(preparing,{code:'homework/session-changed'});
  old.success({[aid]:{student:{answersJson:'private'}}});assert.equal(f.writes.length,0);assert.equal(f.service.getState().uid,'student-b');
  assert.ok(!f.service.getState().grades[aid].rows.some(row=>row.uid==='student'));
});
test('an open homework window stays bound to its original room when another room is selected',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);f.context('student',other);await tick();
  await f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'e'.repeat(32)});
  assert.ok(f.get(`results/${rid}/${aid}/student`));assert.equal(f.get(`results/${other}/${aid}/student`),null);
});
test('offline, missing snapshots and mismatched revisions fail without claiming a submission',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);
  await assert.rejects(f.service.quizCommand('submit',{...binding,quizRevision:'f'.repeat(64)},{value:progress()}),{code:'homework/quiz-changed'});
  f.connections.at(-1)(false);await assert.rejects(f.service.quizCommand('load',binding),{code:'homework/offline'});
  f.connections.at(-1)(true);f.put(`quizzes/${rid}/${aid}`,null);
  await assert.rejects(f.service.open(aid),{code:'homework/not-ready'});assert.equal(f.writes.length,0);
});
test('frozen quiz reader strips executable markup while retaining bilingual content, diagrams and safe images',()=>{
  const html='<article data-learning-activity-content data-activity-id="waves-quiz" data-activity-kind="quiz"><article data-question data-question-id="one" data-answer="a"><p data-question-prompt data-th="หนึ่ง" data-en="One">หนึ่ง</p><div data-choice-id="a">A</div><div data-choice-id="b">B</div><div data-question-solution>Solution</div><svg><path d="M0 0L1 1" onload="alert(1)"/></svg><img src="images/a.png" onerror="alert(1)"><script>alert(1)</script><iframe src="/"></iframe><a href="javascript:alert(1)">bad</a></article></article>';
  const document=parseHTML('<html><body></body></html>').document;
  const doc={implementation:{createHTMLDocument:()=>parseHTML('<html><body></body></html>').document}};
  const frozen={...quiz,html,questionCount:1};const parsed=readHomeworkQuiz(frozen,doc,'https://example.test/learning-hub/');
  assert.equal(parsed.questions.length,1);assert.equal(parsed.root.querySelectorAll('script,iframe,[onload],[onerror]').length,0);
  assert.ok(parsed.root.querySelector('svg path'));assert.equal(parsed.root.querySelector('img').getAttribute('src'),'https://example.test/learning-hub/images/a.png');
  assert.equal(parsed.root.querySelector('a').hasAttribute('href'),false);
  assert.throws(()=>readHomeworkQuiz({...frozen,contentId:'wrong'},doc,'https://example.test/'));
  document.body.innerHTML='<article><img src="https://example.org/a.png"><img src="data:text/html,bad"></article>';
  const sanitized=sanitizeHomeworkRoot(document.querySelector('article'),'https://example.test/');assert.equal(sanitized.querySelectorAll('img[src]').length,1);
});

test('simultaneous submit commands share the same pending server acknowledgement',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);let finish;
  const originalIO={...f.io};f.io.update=async(...args)=>{await new Promise(done=>{finish=done;});return originalIO.update(...args);};
  const first=f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'e'.repeat(32)});
  const second=f.service.quizCommand('submit',binding,{value:progress({number:'5/6'}),submissionId:'e'.repeat(32)});
  await tick();assert.equal(f.writes.length,0);finish();const results=await Promise.all([first,second]);
  assert.equal(f.writes.length,1);assert.equal(results[0].result.submissionId,results[1].result.submissionId);assert.equal(results[1].grade.score,1);
});

test('teacher pins authored and legacy quiz IDs with stable revisions and source-relative PDF/image links',async()=>{
  const previous=globalThis.DOMParser;globalThis.DOMParser=DOMParser;
  try {
    const root='<article data-learning-activity-content data-activity-kind="quiz" data-activity-id="source-quiz"><p data-activity-title data-th="คลื่น" data-en="Waves">Waves</p><a data-hub-pdf="reading" data-pdf-th="assets/read.pdf">Read</a><img src="assets/diagram.png"><article data-question data-question-id="one" data-answer="a"><p data-question-prompt data-th="หนึ่ง" data-en="One">One</p><div data-choice-id="a">A</div><div data-choice-id="b">B</div><p data-question-solution>Solution</p></article></article>';
    const route={kind:'content',status:'ready',hash:'#physics/1/waves/quiz',aliases:[],subjectId:'physics',chapterId:'1',topicId:'waves',contentId:'waves-quiz'};
    const catalog={schemaVersion:1,routes:[route],contents:[{id:'waves-quiz',source:'content/test/waves.html',toolKind:'quiz',titleTh:'คลื่น',titleEn:'Waves'}]};
    const item={contentId:'waves-quiz',targetHash:route.hash};const fetcher=async()=>({ok:true,text:async()=>root});
    const pinned=await freezeHomeworkQuiz(item,catalog,'https://example.test/learning-hub/',fetcher);
    assert.equal(pinned.contentId,'waves-quiz');assert.equal(pinned.questionCount,1);assert.match(pinned.revision,/^[a-f0-9]{64}$/);
    assert.ok(pinned.html.includes('https://example.test/learning-hub/content/test/assets/read.pdf'));
    assert.ok(pinned.html.includes('https://example.test/learning-hub/content/test/assets/diagram.png'));
    assert.equal((await freezeHomeworkQuiz(item,catalog,'https://example.test/learning-hub/',fetcher)).revision,pinned.revision);
    const changed=await freezeHomeworkQuiz(item,catalog,'https://example.test/learning-hub/',async()=>({ok:true,text:async()=>root.replace('>One<','>Changed<')}));
    assert.notEqual(changed.revision,pinned.revision);
    const legacy={kind:'legacy-tool',status:'ready',hash:'#physics/1/quiz',aliases:[],toolId:'physics-c1-quiz',storageContentId:'physics-c1-quiz'};
    const legacyPinned=await freezeHomeworkQuiz({targetHash:legacy.hash,contentId:legacy.storageContentId},{...catalog,routes:[...catalog.routes,legacy]},'https://example.test/learning-hub/',fetcher);
    assert.equal(legacyPinned.contentId,'physics-c1-quiz');assert.ok(legacyPinned.html.includes('data-activity-id="physics-c1-quiz"'));
    await assert.rejects(freezeHomeworkQuiz({...item,contentId:'wrong'},catalog,'https://example.test/learning-hub/',fetcher),{code:'homework/quiz-changed'});
  } finally {globalThis.DOMParser=previous;}
});


test('teacher CSV export fetches fresh roster/results and recomputes frozen answers instead of trusting a stored score',async t=>{
  const f=fixture(t,'teacher');await tick();
  f.put(`results/${rid}/${aid}/student`,{...submissionPayload(progress({choice:'a'}),questions),version:1,contentId:quiz.contentId,quizRevision:revision,submittedAt:1000,dueAt:900,submissionId:'e'.repeat(32),submissionRevision:2,score:999});
  // Do not emit watchers: export must use fresh reads, not the displayed roster.
  f.put(`@classroom/members/${rid}/new-student`,{displayName:'นักเรียนใหม่'});
  const {filename,csv}=await f.service.exportSheet(aid);
  assert.equal(filename,`hub-homework-${aid.slice(2)}.csv`);assert.ok(csv.includes('นักเรียนใหม่'));
  assert.ok(csv.includes('"submitted","1","3","33.33"'));assert.ok(csv.includes('"not_submitted","","",""'));
  assert.ok(!csv.includes('999'));assert.equal(f.writes.length,0);
  assert.ok(f.reads.includes(`results/${rid}/${aid}`));assert.ok(f.reads.includes(`@classroom/members/${rid}`));
});
test('student export is denied; teacher export rechecks ownership/session after pending reads',async t=>{
  const f=fixture(t);await tick();await assert.rejects(f.service.exportSheet(aid),{code:'homework/owner-required'});
  f.context('teacher');await tick();const get=f.io.get;
  f.io.get=async path=>{const result=await get(path);if(path===`results/${rid}/${aid}`)f.context('student');return result;};
  await assert.rejects(f.service.exportSheet(aid),{code:'homework/session-changed'});assert.equal(f.writes.length,0);
});
test('export preserves invalid submissions as blank grading errors and requires a matching frozen quiz',async t=>{
  const f=fixture(t,'teacher');await tick();f.put(`results/${rid}/${aid}/student`,{version:1,answersJson:'broken'});
  assert.ok((await f.service.exportSheet(aid)).csv.includes('"grading_error","","",""'));
  f.put(`quizzes/${rid}/${aid}`,{...quiz,contentId:'another-quiz'});
  await assert.rejects(f.service.exportSheet(aid),{code:'homework/quiz-changed'});
});
