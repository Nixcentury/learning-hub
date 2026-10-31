import { createClassroomAccess } from './classroom-access.js';
import { assignmentIdPattern, assignmentRoomPattern } from './classroom-assignment-model.js';
import { failSubmission, submissionPayload, gradeSubmission } from '../public/shared/classroom-submission-model.js';
import { createClassroomSheetCsv } from '../public/shared/classroom-sheet-export.js';

export function createClassroomSubmissions({ io, freezeQuiz, readQuiz, onChange = () => {} }) {
  let session, role, assignments, uid = '', roomId = '', epoch = 0, connected = false, error = '', busy = '', last = '';
  let quizzes = {}, results = {}, roster = {}, own = {}, ready = false;
  const stops = [], itemStops = new Map(), parsed = new Map(), loaded = new Set(), resultLoaded = new Set(), submissionsInFlight = new Map();
  const room = (selected = roomId) => assignments?.rooms.find(value => value.id === selected);
  const isOwner = (selected = roomId) => role === 'teacher' && room(selected)?.membership === 'owner' && room(selected)?.ownerUid === uid;
  const live = (version, user = uid) => version === epoch && user === uid && session?.user?.uid === uid;
  const code = failure => String(failure?.code || failure?.message || 'homework/unavailable');
  function questionSet(quiz) {
    const key = quiz.contentId + ':' + quiz.revision;
    if (!parsed.has(key)) parsed.set(key, readQuiz(quiz).questions);
    return parsed.get(key);
  }
  function state() {
    const grades = {};
    for (const item of room()?.items || []) {
      const quiz = quizzes[item.id];
      const members = isOwner() ? Object.entries(roster) : [[uid, {}]];
      grades[item.id] = { ready: Boolean(quiz), loaded: !error && loaded.has('quizzes') && (isOwner() ? loaded.has('results') && loaded.has('roster') : resultLoaded.has(item.id)), rows: members.map(([user, member]) => {
        const record = isOwner() ? results[item.id]?.[user] : own[item.id];
        let grade = null;
        if (record && quiz) {
          try { grade = gradeSubmission(record, quiz, questionSet(quiz)); }
          catch { grade = { error: 'homework/invalid-result' }; }
        }
        return { uid: user, name: member.displayName || user, submitted: Boolean(record), grade };
      }).sort((a, b) => a.name.localeCompare(b.name, 'th') || a.uid.localeCompare(b.uid)) };
    }
    return { uid, roomId, connected, ready, busy, error, grades };
  }
  function publish() { const next = state(), signature = JSON.stringify(next); if (last !== signature) { last = signature; onChange(structuredClone(next)); } }
  function clear() {
    ++epoch; for (const stop of stops.splice(0)) stop();
    for (const stop of itemStops.values()) stop(); itemStops.clear(); parsed.clear();
    loaded.clear(); resultLoaded.clear(); submissionsInFlight.clear(); quizzes = {}; results = {}; roster = {}; own = {}; ready = false; connected = false; busy = ''; error = ''; last = '';
  }
  function watch(path, callback, version) {
    const timer = setTimeout(() => { if (live(version)) { error = 'homework/read-timeout'; publish(); } }, 15000); timer.unref?.();
    const close = io.watch(path, value => { clearTimeout(timer); if (live(version)) { callback(value || {}); publish(); } }, failure => {
      clearTimeout(timer); if (live(version)) { error = code(failure); ready = false; quizzes = {}; results = {}; roster = {}; own = {}; parsed.clear(); publish(); }
    });
    return () => { clearTimeout(timer); close?.(); };
  }
  function syncItems(version) {
    if (!uid || isOwner()) return;
    const ids = new Set((room()?.items || []).map(item => item.id));
    for (const [id, close] of itemStops) if (!ids.has(id)) { close(); itemStops.delete(id); delete own[id]; resultLoaded.delete(id); }
    for (const id of ids) if (!itemStops.has(id)) itemStops.set(id, watch(`results/${roomId}/${id}/${uid}`, value => { if (itemStops.has(id)) { own[id] = value.version ? value : null; resultLoaded.add(id); } }, version));
  }
  function setContext(identity, access, assignmentState, selectedRoom) {
    const verified = createClassroomAccess(identity, access);
    const nextRoom = assignmentState?.uid === verified.uid && assignmentState.rooms.find(value => value.id === selectedRoom && value.status === 'ready');
    const nextUid = ['student','teacher'].includes(verified.state) && assignmentState?.uid === verified.uid ? verified.uid : '';
    const changed = nextUid !== uid || (nextRoom?.id || '') !== roomId || verified.state !== role;
    session = identity; assignments = assignmentState;
    if (!changed) { syncItems(epoch); publish(); return; }
    clear(); uid = nextUid; roomId = nextRoom?.id || ''; role = verified.state;
    publish(); if (!uid) return;
    const version = epoch;
    stops.push(io.connected(value => { if (live(version)) { connected = value === true; publish(); } }));
    if (!roomId) return;
    stops.push(watch(`quizzes/${roomId}`, value => { quizzes = value; loaded.add('quizzes'); ready = true; }, version));
    if (isOwner()) {
      stops.push(watch(`results/${roomId}`, value => { results = value; loaded.add('results'); }, version));
      stops.push(watch(`@classroom/members/${roomId}`, value => { roster = value; loaded.add('roster'); }, version));
    }
    syncItems(version);
  }
  function guard(user, version = epoch, requireOwner = false, selected = roomId) {
    if (!uid || !live(version, user) || !assignmentRoomPattern.test(selected) || room(selected)?.status !== 'ready') throw failSubmission('homework/session-changed');
    if (requireOwner && !isOwner(selected)) throw failSubmission('homework/owner-required');
    if (!connected) throw failSubmission('homework/offline');
  }
  async function read(path) {
    let timeout;
    try { return await Promise.race([io.get(path), new Promise((_, reject) => { timeout = setTimeout(() => reject(failSubmission('homework/read-timeout')), 15000); })]); }
    finally { clearTimeout(timeout); }
  }
  async function published(id, user, version, selected = roomId) {
    const item = await read(`@assignments/items/${selected}/${id}`); guard(user, version, false, selected);
    if (!item || !['published','closed'].includes(item.status)) throw failSubmission('homework/closed');
    return item;
  }
  async function prepare(id, user = uid) {
    guard(user, epoch, true);
    if (!assignmentIdPattern.test(id) || busy) throw failSubmission('homework/busy');
    const version = epoch, selected = roomId; busy = 'prepare'; error = ''; publish();
    try {
      const item = await published(id, user, version);
      const old = await read(`quizzes/${selected}/${id}`); guard(user, version, true);
      if (old) return old;
      if (item.status !== 'published') throw failSubmission('homework/closed');
      const quiz = await freezeQuiz(item); guard(user, version, true);
      try {
        await io.transaction(`quizzes/${selected}/${id}`, current => live(version, user) && !current ? { ...quiz, createdAt: io.timestamp() } : undefined);
      } catch (failure) {
        const existing = await read(`quizzes/${selected}/${id}`); guard(user, version, true);
        if (!existing) throw failure;
      }
      guard(user, version, true);
      const saved = await read(`quizzes/${selected}/${id}`); guard(user, version, true);
      if (!saved) throw failSubmission('homework/not-ready');
      return saved;
    } catch (failure) { if (live(version)) error = code(failure); throw failure; }
    finally { if (live(version)) { busy = ''; publish(); } }
  }
  async function open(id, user = uid) {
    guard(user);
    if (!assignmentIdPattern.test(id)) throw failSubmission('homework/invalid-request');
    const version = epoch, selected = roomId;
    const item = await published(id, user, version);
    const quiz = await read(`quizzes/${selected}/${id}`); guard(user, version);
    if (!quiz) throw failSubmission('homework/not-ready');
    questionSet(quiz);
    return { uid: user, roomId: selected, id, quizRevision: quiz.revision, contentId: item.contentId, title: item.title, preview: isOwner() };
  }
  async function quizCommand(action, binding, payload = {}) {
    const user = binding?.uid, version = epoch, selected = binding?.roomId, id = binding?.id;
    guard(user, version, false, selected);
    if (!assignmentIdPattern.test(id)) throw failSubmission('homework/invalid-request');
    const preview = isOwner(selected) && binding.preview === true;
    if (isOwner(selected) && !preview) throw failSubmission('homework/student-required');
    const item = await published(id, user, version, selected);
    const quiz = await read(`quizzes/${selected}/${id}`); guard(user, version, false, selected);
    if (!quiz || quiz.revision !== binding.quizRevision || quiz.contentId !== binding.contentId) throw failSubmission('homework/quiz-changed');
    if (preview) {
      if (action !== 'load') throw failSubmission('homework/student-required');
      return { quiz, value: null, storageRevision: 0, result: null, grade: null, closed: true };
    }
    const finalPath = `results/${selected}/${id}/${user}`, draftPath = `attempts/${selected}/${id}/${user}`;
    let result = await read(finalPath); guard(user, version, false, selected);
    if (action === 'load') {
      const draft = await read(draftPath); guard(user, version, false, selected);
      const currentDraft = draft && (draft.baseSubmissionId || '') === (result?.submissionId || '') && !(result && item.status === 'closed');
      return { quiz, value: currentDraft ? JSON.parse(draft.progressJson) : null, storageRevision: draft?.revision || 0,
        result: result || null, grade: result ? gradeSubmission(result, quiz, questionSet(quiz)) : null, closed: item.status === 'closed' };
    }
    if (action === 'submit' && result && result.submissionId === payload.submissionId) return { result, grade: gradeSubmission(result, quiz, questionSet(quiz)) };
    if (item.status !== 'published') throw failSubmission('homework/closed');
    if ((payload.previousSubmissionId || '') !== (result?.submissionId || '')) throw failSubmission('homework/conflict');
    const questions = questionSet(quiz), cleaned = submissionPayload(payload.value, questions, { draft: action === 'save' });
    guard(user, version, false, selected);
    if (action === 'save') {
      if (!Number.isSafeInteger(payload.storageRevision) || payload.storageRevision < 0) throw failSubmission('homework/conflict');
      const progressJson = JSON.stringify({ ...payload.value, homeworkBaseSubmissionId: result?.submissionId || '' });
      if (progressJson.length > 80000 || payload.value.contentId !== quiz.contentId || payload.value.identityKey !== user) throw failSubmission('homework/invalid-answers');
      const previous = await read(draftPath); guard(user, version, false, selected);
      if ((previous?.revision || 0) !== payload.storageRevision) throw failSubmission('homework/conflict');
      const transaction = await io.transaction(draftPath, current => {
        if (!live(version, user) || ((current || previous)?.revision || 0) !== payload.storageRevision) return;
        return { version: 1, contentId: quiz.contentId, quizRevision: quiz.revision, progressJson, baseSubmissionId: result?.submissionId || '',
          createdAt: (current || previous)?.createdAt || io.timestamp(), updatedAt: io.timestamp(), revision: payload.storageRevision + 1 };
      });
      guard(user, version, false, selected);
      if (!transaction.committed) throw failSubmission('homework/conflict');
      return { storageRevision: payload.storageRevision + 1 };
    }
    if (action !== 'submit' || !/^[a-f0-9]{32}$/.test(payload.submissionId || '')) throw failSubmission('homework/invalid-request');
    if (await read(`history/${selected}/${id}/${user}/${payload.submissionId}`)) throw failSubmission('homework/conflict');
    guard(user, version, false, selected);
    const record = { ...cleaned, version: 1, contentId: quiz.contentId, quizRevision: quiz.revision,
      dueAt: item.dueAt || 0, submissionId: payload.submissionId, submittedAt: io.timestamp(), submissionRevision: (result?.submissionRevision || (result ? 1 : 0)) + 1 };
    const updates = { [finalPath]: record };
    if (result) updates[`history/${selected}/${id}/${user}/${result.submissionId}`] = result;
    try {
      // Rules check the next revision and require an exact immutable archive of
      // the previous result in this same atomic write. A stale tab cannot win.
      await io.update(updates);
    } catch (failure) {
      // A committed write may lose its acknowledgement. Only this operation's
      // ID proves success; another tab's result must not masquerade as ours.
      result = await read(finalPath); guard(user, version, false, selected);
      if (result?.submissionId !== payload.submissionId) {
        if ((result?.submissionId || '') !== (payload.previousSubmissionId || '')) throw failSubmission('homework/conflict');
        throw failure;
      }
    }
    guard(user, version, false, selected); result = await read(finalPath); guard(user, version, false, selected);
    if (result?.submissionId !== payload.submissionId) throw failSubmission('homework/conflict');
    return { result, grade: gradeSubmission(result, quiz, questions) };
  }
  async function history(id, studentUid = uid) {
    const user = uid, version = epoch, selected = roomId;
    guard(user, version);
    if (!assignmentIdPattern.test(id) || typeof studentUid !== 'string' || !studentUid || studentUid.length > 128 || Array.from(studentUid).some(char => '/.#$[]'.includes(char)) || (!isOwner() && studentUid !== uid)) throw failSubmission('homework/invalid-request');
    const quiz = await read(`quizzes/${selected}/${id}`);
    guard(user, version, false, selected);
    if (!quiz) throw failSubmission('homework/not-ready');
    const archived = await read(`history/${selected}/${id}/${studentUid}`);
    guard(user, version, false, selected);
    const latest = await read(`results/${selected}/${id}/${studentUid}`);
    guard(user, version, false, selected);
    const records = new Map(Object.values(archived || {}).map(record => [record.submissionId, record]));
    if (latest) records.set(latest.submissionId, latest);
    return { id, studentUid, rows: [...records.values()].map(record => gradeSubmission(record, quiz, questionSet(quiz))).sort((a,b) => (b.submissionRevision || 0) - (a.submissionRevision || 0)) };
  }
  function command(action, binding, payload) {
    if (action !== 'submit') return quizCommand(action, binding, payload);
    // Repeated delivery of one operation waits for the same acknowledgement.
    // Different operations remain distinct and Rules reject a stale revision.
    try { guard(binding?.uid, epoch, false, binding?.roomId); }
    catch (failure) { return Promise.reject(failure); }
    const key = `${binding.uid}/${binding.roomId}/${binding.id}/${payload?.submissionId}`;
    if (submissionsInFlight.has(key)) return submissionsInFlight.get(key);
    const operation = quizCommand(action, binding, payload).finally(() => {
      if (submissionsInFlight.get(key) === operation) submissionsInFlight.delete(key);
    });
    submissionsInFlight.set(key, operation); return operation;
  }
  async function exportSheet(id) {
    const user = uid, version = epoch, selected = roomId;
    guard(user, version, true);
    if (!assignmentIdPattern.test(id)) throw failSubmission('homework/invalid-request');
    const item = await published(id, user, version, selected);
    const [quiz, records, members] = await Promise.all([read(`quizzes/${selected}/${id}`),read(`results/${selected}/${id}`),read(`@classroom/members/${selected}`)]);
    guard(user, version, true, selected);
    if (!quiz) throw failSubmission('homework/not-ready');
    if (quiz.contentId !== item.contentId) throw failSubmission('homework/quiz-changed');
    const questions = questionSet(quiz);
    const rows = Object.entries(members || {}).map(([studentUid, member]) => {
      const record = records?.[studentUid];
      return { uid: studentUid, name: member.displayName || studentUid, submitted: Boolean(record), submissionId: record?.submissionId,
        grade: record ? gradeSubmission(record, quiz, questions) : null };
    }).sort((a,b)=>a.name.localeCompare(b.name,'th') || a.uid.localeCompare(b.uid));
    return { filename: `hub-homework-${id.slice(2)}.csv`, csv: createClassroomSheetCsv({roomId:selected,roomName:room(selected)?.name || '',item:{...item,id},hubUrl:assignments.hubUrl,rows}) };
  }
  return { setContext, prepare, open, history, exportSheet, quizCommand: command, getState: () => structuredClone(state()),
    dispose() { clear(); uid = roomId = ''; } };
}
