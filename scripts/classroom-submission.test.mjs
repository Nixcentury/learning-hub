import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
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
function fixture(t, user = 'student', prepared = true) {
  const db = { quizzes: prepared ? {[rid]:{[aid]:quiz}} : {}, results: {}, attempts: {}, '@classroom': { members: { [rid]: { student: {displayName:'นักเรียน ก'}, 'student-b': {displayName:'นักเรียน ข'} } } }, '@assignments': {items:{[rid]:{[aid]:item},[other]:{[aid]:item}}} };
  const watchers = [], writes = [], reads = [], connections = [];
  const get = path => path.split('/').reduce((value,key)=>value?.[key],db) ?? null;
  const put = (path,value) => { const parts=path.split('/'), key=parts.pop();let at=db;for(const part of parts)at=at[part] ||= {};if(value===null)delete at[key];else at[key]=structuredClone(value); };
  function emit() { for (const w of watchers) if (w.active) w.success(structuredClone(get(w.path))); }
  const io = { get: async path => { reads.push(path);return structuredClone(get(path)); }, timestamp:()=>1000,
    connected(fn) { connections.push(fn);queueMicrotask(()=>fn(true));return ()=>{}; },
    watch(path,success,failure) { const w={path,success,failure,active:true};watchers.push(w);queueMicrotask(()=>{if(w.active)success(structuredClone(get(path)));});return()=>{w.active=false;}; },
    async transaction(path,change) { const next=change(structuredClone(get(path)));if(next===undefined)return{committed:false};writes.push({path,next});put(path,next);emit();return{committed:true}; },
  };
  const service=createClassroomSubmissions({io,freezeQuiz:async()=>quiz,readQuiz:()=>({questions})});
  function context(uid=user, selected=rid) {
    const teacher=uid==='teacher', role={uid,status:'ready',isTeacher:teacher,systemRole:teacher?'teacher':'student'};
    const assignments={uid,rooms:[rid,other].map(id=>({id,status:'ready',membership:teacher?'owner':'student',ownerUid:'teacher',items:[item]}))};
    service.setContext({status:'signed-in',user:{uid}},role,assignments,selected);
    return assignments;
  }
  context();t.after(()=>service.dispose());
  return {service,io,db,get,put,emit,writes,reads,watchers,connections,context};
}

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
test('submission is immutable and retryable; teacher sees each member including those who have not submitted',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);
  const first=await f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'e'.repeat(32)});
  assert.equal(first.grade.score,1);const writes=f.writes.length;
  const duplicate=await f.service.quizCommand('submit',binding,{value:progress({choice:'a',number:'5/6'}),submissionId:'f'.repeat(32)});
  assert.equal(duplicate.grade.score,1);assert.equal(f.writes.length,writes);
  await assert.rejects(f.service.quizCommand('save',binding,{value:progress(),storageRevision:0}),{code:'homework/already-submitted'});
  f.context('teacher');await tick();const rows=f.service.getState().grades[aid].rows;
  assert.equal(rows.length,2);assert.equal(rows.find(row=>row.uid==='student').grade.score,1);assert.equal(rows.find(row=>row.uid==='student-b').submitted,false);
});
test('a lost acknowledgement recovers the existing server result rather than creating another submission',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid); const originalIO={...f.io};const transact=(...args)=>originalIO.transaction(...args);
  f.io.transaction=async(...args)=>{await transact(...args);throw Error('connection lost after commit');};
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

test('simultaneous final-submit commands share the same pending server acknowledgement',async t=>{
  const f=fixture(t);await tick();const binding=await f.service.open(aid);let finish;
  const originalIO={...f.io};f.io.transaction=async(...args)=>{await new Promise(done=>{finish=done;});return originalIO.transaction(...args);};
  const first=f.service.quizCommand('submit',binding,{value:progress({choice:'a'}),submissionId:'e'.repeat(32)});
  const second=f.service.quizCommand('submit',binding,{value:progress({number:'5/6'}),submissionId:'f'.repeat(32)});
  await tick();assert.equal(f.writes.length,0);finish();const results=await Promise.all([first,second]);
  assert.equal(f.writes.length,1);assert.equal(results[0].result.submissionId,results[1].result.submissionId);assert.equal(results[1].grade.score,1);
});
