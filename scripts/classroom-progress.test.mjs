import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeClassroomProgress as summarize } from '../public/shared/classroom-progress-model.js';
const uid = 'student', roomId = 'room';
const work = (id, status = 'published') => ({ id, status });
const book = (maxScore, score = null, user = uid) => ({ ready: true, loaded: true, maxScore,
  rows: [{ uid: user, submitted: score !== null, grade: score === null ? null : { score, maxScore } }] });
const base = { uid, roomId, connected: true };
test('all published work contributes points, including missing, closed and locked work; drafts do not', () => {
  const result = summarize({ ...base, items: [work('a'), work('b', 'closed'), { ...work('c'), requiresAssignmentId: 'a' }, work('draft', 'draft')],
    grades: { a: book(10, 8), b: book(10, 10), c: book(10), draft: book(100, 100) } });
  assert.equal(result.percent, 60); assert.equal(result.score, 18); assert.equal(result.maxScore, 30);
  assert.equal(result.assignmentCount, 3); assert.equal(result.submittedCount, 2); assert.equal(result.completionPercent, 66.67);
});
test('uses total earned/possible points rather than averaging rounded assignment percentages', () => {
  const result = summarize({ ...base, items: [work('a'), work('b')], grades: { a: book(10, 9), b: book(20, 10) } });
  assert.equal(result.percent, 63.33); assert.equal(result.maxScore, 30); assert.equal(result.score, 19);
});
test('latest lower score replaces older credit; a submitted zero still counts as submitted', () => {
  const value = { ...base, items: [work('a')], grades: { a: book(10, 10) } };
  assert.equal(summarize(value).percent, 100); value.grades.a = book(10, 0);
  const result = summarize(value); assert.equal(result.percent, 0); assert.equal(result.submittedCount, 1); assert.equal(result.completionPercent, 100);
});
test('unknown question set cannot produce a partial denominator or a false 100%; completion stays independent', () => {
  const value = { ...base, items: [work('a'), work('b')], grades: { a: book(10, 10), b: { ready: false, loaded: true, rows: [{ uid, submitted: false }] } } };
  const result = summarize(value); assert.equal(result.status, 'waiting'); assert.equal(result.unpreparedCount, 1); assert.equal(result.submittedCount, 1);
  assert.equal(result.percent, null); assert.equal(result.maxScore, null);
  value.grades.b.loaded = false; const loading = summarize(value); assert.equal(loading.status, 'loading'); assert.equal(loading.submittedCount, null);
});
test('invalid grades, missing own row and read failures never become zero or silently disappear', () => {
  for (const invalid of [book(10, NaN), book(10, 11), book(10, -1), book(0, 0), book(10, 10, 'someone-else'), { ...book(10, 4), rows: [{ uid, submitted: true, grade: { error: 'invalid' } }] }]) {
    const result = summarize({ ...base, items: [work('a')], grades: { a: invalid } });
    assert.equal(result.status, 'error'); assert.equal(result.percent, null); assert.equal(result.score, null);
  }
  assert.equal(summarize({ ...base, items: [work('a')], grades: { a: book(10, 10) }, error: 'PERMISSION_DENIED' }).status, 'error');
});
test('a peer row is ignored; an empty room has no percentage; offline cached results stay labelled', () => {
  const own = book(10, 3); own.rows.unshift({ uid: 'peer', submitted: true, grade: { score: 10, maxScore: 10 } });
  const result = summarize({ ...base, connected: false, items: [work('a')], grades: { a: own } });
  assert.equal(result.percent, 30); assert.equal(result.connected, false);
  const empty = summarize({ ...base, items: [work('draft', 'draft')] }); assert.equal(empty.status, 'empty'); assert.equal(empty.percent, null); assert.equal(empty.submittedCount, 0);
  assert.equal(summarize({ ...base, uid: '' }), null); assert.equal(summarize({ ...base, roomId: '' }), null);
});

test('ungraded activities count completion but never change score totals, even with forged grade fields',()=>{
  const activity={...work('sim'),activityKind:'simulation'};
  const grades={quiz:book(10,8),sim:{loaded:true,ready:true,maxScore:100,rows:[{uid,completed:false,submitted:true,grade:{score:100,maxScore:100}}]}};
  let result=summarize({...base,items:[work('quiz'),activity],grades});
  assert.equal(result.percent,80);assert.equal(result.maxScore,10);assert.equal(result.submittedCount,1);
  grades.sim.rows[0].completed=true;result=summarize({...base,items:[work('quiz'),activity],grades});
  assert.equal(result.percent,80);assert.equal(result.submittedCount,2);
  result=summarize({...base,items:[activity],grades});assert.equal(result.status,'ungraded');assert.equal(result.percent,null);assert.equal(result.completionPercent,100);
});
