import { canTeachRoom } from '../public/shared/classroom-room-role.js';
import { assistLifetime, assistHeartbeat, assistLive, assistPath, homeworkActor } from '../public/shared/classroom-assist-model.js';
import { summarizeClassroomProgress } from '../public/shared/classroom-progress-model.js';
import { createClassroomAccess } from './classroom-access.js';
import { assignmentIdPattern, assignmentRoomPattern } from './classroom-assignment-model.js';
import { failSubmission, submissionPayload, gradeSubmission } from '../public/shared/classroom-submission-model.js';
import { createClassroomSheetCsv } from '../public/shared/classroom-sheet-export.js';

export function createClassroomSubmissions({ io, freezeQuiz, readQuiz, onChange = () => {}, now = Date.now }) {
  let session, role, assignments, uid = '', roomId = '', epoch = 0, connected = false, error = '', busy = '', last = '', membership = '';
  let quizzes = {}, results = {}, roster = {}, own = {}, histories = {}, ready = false;
  const stops = [], itemStops = new Map(), parsed = new Map(), loaded = new Set(), resultLoaded = new Set(), submissionsInFlight = new Map();
  const historyStops = new Map(), historyLoaded = new Set(), passed = new Set();
  const leaseStops = new Map(); let locks = {}, assistance = null, assistStop, assistTimer, assistStarting = false;
  const clock = () => now() + (io.serverOffset?.() || 0);
  const room = (selected = roomId) => assignments?.rooms.find(value => value.id === selected);
  const isOwner = (selected = roomId) => canTeachRoom(room(selected), uid, role === 'teacher');
  const live = (version, user = uid) => version === epoch && user === uid && session?.user?.uid === uid;
  const code = failure => String(failure?.code || failure?.message || 'homework/unavailable');
  function questionSet(quiz) {
    const key = quiz.contentId + ':' + quiz.revision;
    if (!parsed.has(key)) parsed.set(key, readQuiz(quiz).questions);
    return parsed.get(key);
  }
  function passedRecord(record, quiz) {
    if (!record || !quiz) return false;
    try {
      const grade = gradeSubmission(record, quiz, questionSet(quiz));
      return !grade.error && grade.maxScore > 0 && grade.score * 2 > grade.maxScore;
    } catch { return false; }
  }
  const passKey = (id, quiz) => `${id}:${quiz?.revision || ''}`;
  function gateState(item) {
    const requiredId = item.requiresAssignmentId || '';
    const prior = room()?.items.find(value => value.id === requiredId);
    const info = { requiredId, requiredTitle: prior?.title || '' };
    if (isOwner() || !requiredId) return { ...info, status: 'open' };
    if (error) return { ...info, status: 'error' };
    if (!prior) return { ...info, status: 'locked' };
    const quiz = quizzes[requiredId], key = passKey(requiredId, quiz);
    if (passed.has(key)) return { ...info, status: 'open' };
    if (!loaded.has('quizzes') || !resultLoaded.has(requiredId)) return { ...info, status: 'loading' };
    if (!quiz) return { ...info, status: 'locked' };
    if (passedRecord(own[requiredId], quiz) || Object.values(histories[requiredId] || {}).some(record => passedRecord(record, quiz))) {
      passed.add(key); return { ...info, status: 'open' };
    }
    return { ...info, status: historyLoaded.has(requiredId) ? 'locked' : 'loading' };
  }
  function state() {
    const grades = {};
    for (const item of room()?.items || []) {
      const quiz = quizzes[item.id];
      const members = isOwner() ? Object.entries(roster) : [[uid, {}]];
      grades[item.id] = { maxScore: quiz?.questionCount || null, ready: Boolean(quiz), loaded: !error && loaded.has('quizzes') && (isOwner() ? loaded.has('results') && loaded.has('roster') : resultLoaded.has(item.id)), rows: members.map(([user, member]) => {
        const record = isOwner() ? results[item.id]?.[user] : own[item.id];
        let grade = null;
        if (record && quiz) {
          try { grade = gradeSubmission(record, quiz, questionSet(quiz)); }
          catch { grade = { error: 'homework/invalid-result' }; }
        }
        return { uid: user, name: member.displayName || user, email:member.email || '', assistedByUid:record?.assistedByUid || '', submitted: Boolean(record), grade };
      }).sort((a, b) => a.name.localeCompare(b.name, 'th') || a.uid.localeCompare(b.uid)) };
    }
    const gates = Object.fromEntries((room()?.items || []).map(item => [item.id, gateState(item)]));
    const progress = !isOwner() ? summarizeClassroomProgress({ uid, roomId, items: room()?.items || [], grades, connected, error }) : null;
    return { uid, roomId, connected, ready, busy, error, grades, gates, progress, locks, assistance };
  }
  function publish() { const next = state(), signature = JSON.stringify(next); if (last !== signature) { last = signature; onChange(structuredClone(next)); } }
  function clear() {
    clearInterval(assistTimer); assistTimer = null; assistStop?.(); assistStop = null; assistance = null; locks = {};
    for (const close of leaseStops.values()) close(); leaseStops.clear();
    ++epoch; for (const stop of stops.splice(0)) stop();
    for (const stop of itemStops.values()) stop(); itemStops.clear(); parsed.clear();
    for (const stop of historyStops.values()) stop(); historyStops.clear(); historyLoaded.clear(); passed.clear();
    loaded.clear(); resultLoaded.clear(); submissionsInFlight.clear(); quizzes = {}; results = {}; roster = {}; own = {}; histories = {}; ready = false; connected = false; busy = ''; error = ''; last = '';
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
    if (io.assistEnabled) {
      for (const [id, close] of leaseStops) if (!ids.has(id)) { close(); leaseStops.delete(id); delete locks[id]; }
      for (const id of ids) if (!leaseStops.has(id)) leaseStops.set(id, io.watch(assistPath(roomId,id,uid), value => {
        if (live(version) && leaseStops.has(id)) { locks[id] = value || null; publish(); }
      }, () => {})); // Older Rules leave ordinary homework available.
    }
    for (const [id, close] of itemStops) if (!ids.has(id)) { close(); itemStops.delete(id); delete own[id]; resultLoaded.delete(id); }
    for (const id of ids) if (!itemStops.has(id)) itemStops.set(id, watch(`results/${roomId}/${id}/${uid}`, value => { if (itemStops.has(id)) { own[id] = value.version ? value : null; resultLoaded.add(id); } }, version));
    const required = new Set((room()?.items || []).map(item => item.requiresAssignmentId).filter(id => assignmentIdPattern.test(id || '') && ids.has(id)));
    for (const [id, close] of historyStops) if (!required.has(id)) { close(); historyStops.delete(id); delete histories[id]; historyLoaded.delete(id); }
    for (const id of required) if (!historyStops.has(id)) historyStops.set(id, watch(`history/${roomId}/${id}/${uid}`, value => {
      if (historyStops.has(id)) { histories[id] = value; historyLoaded.add(id); }
    }, version));
  }
  function setContext(identity, access, assignmentState, selectedRoom) {
    const verified = createClassroomAccess(identity, access);
    const nextRoom = assignmentState?.uid === verified.uid && assignmentState.rooms.find(value => value.id === selectedRoom && value.status === 'ready');
    const nextUid = ['student','teacher'].includes(verified.state) && assignmentState?.uid === verified.uid ? verified.uid : '';
    const changed = nextUid !== uid || (nextRoom?.id || '') !== roomId || verified.state !== role || (nextRoom?.membership || '') !== membership;
    session = identity; assignments = assignmentState;
    if (!changed) { syncItems(epoch); publish(); return; }
    clear(); uid = nextUid; roomId = nextRoom?.id || ''; role = verified.state; membership = nextRoom?.membership || "";
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
  async function studentUnlocked(item, student, user, version, selected) {
    if (!item.requiresAssignmentId) return;
    const required = item.requiresAssignmentId;
    if (!assignmentIdPattern.test(required)) throw failSubmission('homework/prerequisite-locked');
    const prior = await read(`@assignments/items/${selected}/${required}`); guard(user,version,true,selected);
    const quiz = await read(`quizzes/${selected}/${required}`); guard(user,version,true,selected);
    if (!prior || !['published','closed'].includes(prior.status) || !quiz) throw failSubmission('homework/prerequisite-locked');
    const latest = await read(`results/${selected}/${required}/${student}`); guard(user,version,true,selected);
    const archive = passedRecord(latest,quiz) ? {} : await read(`history/${selected}/${required}/${student}`); guard(user,version,true,selected);
    if (!passedRecord(latest,quiz) && !Object.values(archive || {}).some(record=>passedRecord(record,quiz))) throw failSubmission('homework/prerequisite-locked');
  }
  async function startAssist(id,student) {
    if(assistStarting || busy)throw failSubmission('homework/assist-busy');
    assistStarting=true;const version=epoch;busy='assist-start';publish();
    try{return await startAssistOperation(id,student);}finally{if(live(version)){assistStarting=false;busy='';publish();}}
  }
  async function startAssistOperation(id, student) {
    const actor = uid, version = epoch, selected = roomId;
    guard(actor,version,true);
    if (!io.assistEnabled || assistance || !assignmentIdPattern.test(id) || typeof student !== 'string' || !student || /[/.#$\[\]]/.test(student) || student === actor) throw failSubmission('homework/assist-unavailable');
    const item = await published(id,actor,version); guard(actor,version,true);
    if (item.status !== 'published') throw failSubmission('homework/closed');
    const [member,quiz] = await Promise.all([read(`@classroom/members/${selected}/${student}`),read(`quizzes/${selected}/${id}`)]);
    guard(actor,version,true);
    // The index is private to the student in existing Rules; membership is
    // independently checked by the assist Rules, not supplied by the iframe.
    if (!member || !quiz) throw failSubmission('homework/not-ready');
    await studentUnlocked(item,student,actor,version,selected);
    const key = 'e_' + crypto.randomUUID().replaceAll('-','');
    const path = assistPath(selected,id,student);
    const previous=await read(path);guard(actor,version,true);
    if(assistLive(previous,clock()))throw failSubmission('homework/assist-busy');
    const event='v_'+crypto.randomUUID().replaceAll('-','');
    await io.update({[path]:{version:1,id:key,actorUid:actor,status:'active',startedAt:io.timestamp(),updatedAt:io.timestamp(),expiresAt:clock()+assistLifetime-5000},[`assistEvents/${selected}/${id}/${student}/${event}`]:{actorUid:actor,assistId:key,action:'started',createdAt:io.timestamp()}});
    guard(actor,version,true);
    const binding = { uid:student,actorUid:actor,roomId:selected,id,quizRevision:quiz.revision,contentId:item.contentId,targetHash:quiz.targetHash || item.targetHash,title:item.title,preview:false,assistId:key,studentName:member.displayName || student,studentEmail:member.email || '',actorName:session.user.displayName || session.user.email || actor };
    assistance = { ...binding, active:true }; publish();
    assistStop = io.watch(path, lease => {
      if (!live(version,actor) || assistance?.assistId !== key) return;
      assistance = { ...assistance, active:lease?.id === key && lease.actorUid === actor && assistLive(lease,clock()) };
      publish();
    }, () => { if (assistance?.assistId === key) { assistance = {...assistance,active:false}; publish(); } });
    assistTimer = setInterval(()=>void renewAssist(binding).catch(()=>{if(assistance?.assistId===key){assistance={...assistance,active:false};publish();}}),assistHeartbeat); assistTimer.unref?.();
    return binding;
  }
  async function renewAssist(binding) {
    guard(homeworkActor(binding),epoch,true,binding.roomId);
    const version=epoch;
    const result=await io.transaction(assistPath(binding.roomId,binding.id,binding.uid), current=>{
      if (!live(version) || current?.id!==binding.assistId || current.actorUid!==uid || !assistLive(current,clock())) return;
      return {...current,updatedAt:io.timestamp(),expiresAt:clock()+assistLifetime-5000};
    });
    if (!result.committed) throw failSubmission('homework/assist-ended');
  }
  async function finishAssist(binding) {
    const actor=uid,version=epoch;guard(actor,version,false,binding.roomId);
    const path=assistPath(binding.roomId,binding.id,binding.uid),current=await read(path);
    guard(actor,version,false,binding.roomId);
    if(current?.id===binding.assistId && current.status==='active') {
      if(current.actorUid!==actor && binding.uid!==actor && !isOwner(binding.roomId))throw failSubmission('homework/owner-required');
      const event='v_'+crypto.randomUUID().replaceAll('-','');
      await io.update({[path]:{...current,status:'ended',updatedAt:io.timestamp(),expiresAt:0},[`assistEvents/${binding.roomId}/${binding.id}/${binding.uid}/${event}`]:{actorUid:actor,assistId:binding.assistId,action:actor===binding.uid?'reclaimed':'ended',createdAt:io.timestamp()}});
      guard(actor,version,false,binding.roomId);
    }
    if(assistance?.assistId===binding.assistId){clearInterval(assistTimer);assistTimer=null;assistStop?.();assistStop=null;assistance=null;publish();}
    return {};
  }
  async function reclaim(id) {
    guard(uid);
    if (!assignmentIdPattern.test(id)) throw failSubmission('homework/invalid-request');
    const lease=await read(assistPath(roomId,id,uid));
    if (lease?.status==='active') await finishAssist({uid,actorUid:lease.actorUid,roomId,id,assistId:lease.id});
    return {};
  }
  async function assertUnlocked(item, user, version, selected) {
    const requiredId = item.requiresAssignmentId;
    if (isOwner(selected) || !requiredId) return;
    if (!assignmentIdPattern.test(requiredId)) throw failSubmission('homework/prerequisite-locked');
    const prior = await read(`@assignments/items/${selected}/${requiredId}`); guard(user, version, false, selected);
    if (!prior || !['published','closed'].includes(prior.status)) throw failSubmission('homework/prerequisite-locked');
    const quiz = await read(`quizzes/${selected}/${requiredId}`); guard(user, version, false, selected);
    if (!quiz) throw failSubmission('homework/prerequisite-locked');
    const key = passKey(requiredId, quiz);
    if (passed.has(key)) return;
    const latest = await read(`results/${selected}/${requiredId}/${user}`); guard(user, version, false, selected);
    if (passedRecord(latest, quiz)) { passed.add(key); publish(); return; }
    const archived = await read(`history/${selected}/${requiredId}/${user}`); guard(user, version, false, selected);
    if (Object.values(archived || {}).some(record => passedRecord(record, quiz))) { passed.add(key); publish(); return; }
    throw failSubmission('homework/prerequisite-locked');
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
    await assertUnlocked({ ...item, id }, user, version, selected);
    guard(user, version, false, selected);
    return { uid: user, roomId: selected, id, quizRevision: quiz.revision, contentId: item.contentId,
      targetHash: quiz.targetHash || item.targetHash, title: item.title, preview: isOwner() };
  }
  async function quizCommand(action, binding, payload = {}) {
    const user = binding?.uid, actor = homeworkActor(binding), version = epoch, selected = binding?.roomId, id = binding?.id;
    const assisted = Boolean(binding?.assistId);
    if(assisted && assistance?.assistId!==binding.assistId)throw failSubmission('homework/assist-ended');
    guard(actor, version, assisted, selected);
    if (!assignmentIdPattern.test(id)) throw failSubmission('homework/invalid-request');
    const preview = isOwner(selected) && binding.preview === true;
    if (isOwner(selected) && !preview && !assisted) throw failSubmission('homework/student-required');
    const item = await published(id, actor, version, selected);
    const quiz = await read(`quizzes/${selected}/${id}`); guard(actor, version, assisted, selected);
    if (!quiz || quiz.revision !== binding.quizRevision || quiz.contentId !== binding.contentId) throw failSubmission('homework/quiz-changed');
    if (preview) {
      if (action !== 'load') throw failSubmission('homework/student-required');
      return { quiz, value: null, storageRevision: 0, result: null, grade: null, closed: true };
    }
    let lease = null;
    if (io.assistEnabled) lease = await read(assistPath(selected,id,user)).catch(failure=>{
      if (!assisted && /permission.?denied/i.test(code(failure))) return null;
      throw failure;
    });
    guard(actor,version,assisted,selected);
    const assistEpoch=lease?.id || '';
    if (assisted && (lease?.id!==binding.assistId || lease.actorUid!==actor || !assistLive(lease,clock()))) throw failSubmission('homework/assist-ended');
    if (!assisted && assistLive(lease,clock()) && action!=='load') throw failSubmission('homework/assist-busy');
    if (action!=='load' && (payload.assistEpoch || '')!==assistEpoch) throw failSubmission('homework/handoff-changed');
    const finalPath = `results/${selected}/${id}/${user}`, draftPath = `attempts/${selected}/${id}/${user}`;
    let result = await read(finalPath); guard(actor, version, assisted, selected);
    if (assisted) await studentUnlocked(item,user,actor,version,selected);
    else await assertUnlocked({ ...item, id }, actor, version, selected);
    if (action === 'load') {
      const draft = await read(draftPath); guard(actor, version, assisted, selected);
      const currentDraft = draft && (draft.baseSubmissionId || '') === (result?.submissionId || '') && !(result && item.status === 'closed');
      return { quiz, value: currentDraft ? {...JSON.parse(draft.progressJson),homeworkAssistEpoch:assistEpoch} : null, storageRevision: draft?.revision || 0, lastSavedAt:draft?.updatedAt || result?.submittedAt || 0, assistEpoch, assistLock: !assisted && assistLive(lease,clock()) ? lease : null,
        result: result || null, grade: result ? gradeSubmission(result, quiz, questionSet(quiz)) : null, closed: item.status === 'closed' };
    }
    if (action === 'submit' && result && result.submissionId === payload.submissionId) return { result, grade: gradeSubmission(result, quiz, questionSet(quiz)) };
    if (item.status !== 'published') throw failSubmission('homework/closed');
    if ((payload.previousSubmissionId || '') !== (result?.submissionId || '')) throw failSubmission('homework/conflict');
    const questions = questionSet(quiz), cleaned = submissionPayload(payload.value, questions, { draft: action === 'save' });
    guard(actor, version, assisted, selected);
    if (action === 'save') {
      if (!Number.isSafeInteger(payload.storageRevision) || payload.storageRevision < 0) throw failSubmission('homework/conflict');
      const progressJson = JSON.stringify({ ...payload.value, homeworkBaseSubmissionId: result?.submissionId || '' });
      if (progressJson.length > 80000 || payload.value.contentId !== quiz.contentId || payload.value.identityKey !== user) throw failSubmission('homework/invalid-answers');
      const previous = await read(draftPath); guard(actor, version, assisted, selected);
      if ((previous?.revision || 0) !== payload.storageRevision) throw failSubmission('homework/conflict');
      const transaction = await io.transaction(draftPath, current => {
        if (!live(version, actor) || ((current || previous)?.revision || 0) !== payload.storageRevision) return;
        return { version: 1, contentId: quiz.contentId, quizRevision: quiz.revision, progressJson, ...(assistEpoch ? {handoffId:assistEpoch} : {}), ...(assisted ? {assistedByUid:actor,assistId:binding.assistId} : {}), baseSubmissionId: result?.submissionId || '',
          createdAt: (current || previous)?.createdAt || io.timestamp(), updatedAt: io.timestamp(), revision: payload.storageRevision + 1 };
      });
      guard(actor, version, assisted, selected);
      if (!transaction.committed) throw failSubmission('homework/conflict');
      return { storageRevision: payload.storageRevision + 1 };
    }
    if (action !== 'submit' || !/^[a-f0-9]{32}$/.test(payload.submissionId || '')) throw failSubmission('homework/invalid-request');
    if (await read(`history/${selected}/${id}/${user}/${payload.submissionId}`)) throw failSubmission('homework/conflict');
    guard(actor, version, assisted, selected);
    const record = { ...cleaned, ...(assistEpoch ? {handoffId:assistEpoch} : {}), ...(assisted ? {assistedByUid:actor,assistId:binding.assistId} : {}), version: 1, contentId: quiz.contentId, quizRevision: quiz.revision,
      dueAt: item.dueAt || 0, submissionId: payload.submissionId, submittedAt: io.timestamp(), submissionRevision: (result?.submissionRevision || (result ? 1 : 0)) + 1 };
    const updates = { [finalPath]: record };
    if(assisted)updates[`assistEvents/${selected}/${id}/${user}/v_${crypto.randomUUID().replaceAll('-','')}`]={actorUid:actor,assistId:binding.assistId,action:'submitted',createdAt:io.timestamp()};
    if (result) updates[`history/${selected}/${id}/${user}/${result.submissionId}`] = result;
    try {
      // Rules check the next revision and require an exact immutable archive of
      // the previous result in this same atomic write. A stale tab cannot win.
      await io.update(updates);
    } catch (failure) {
      // A committed write may lose its acknowledgement. Only this operation's
      // ID proves success; another tab's result must not masquerade as ours.
      result = await read(finalPath); guard(actor, version, assisted, selected);
      if (result?.submissionId !== payload.submissionId) {
        if ((result?.submissionId || '') !== (payload.previousSubmissionId || '')) throw failSubmission('homework/conflict');
        throw failure;
      }
    }
    guard(actor, version, assisted, selected); result = await read(finalPath); guard(actor, version, assisted, selected);
    if (result?.submissionId !== payload.submissionId) throw failSubmission('homework/conflict');
    if (!assisted) { own[id] = result; resultLoaded.add(id); publish(); }
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
    try { guard(homeworkActor(binding), epoch, Boolean(binding?.assistId), binding?.roomId); }
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
  return { setContext, prepare, open, history, exportSheet, startAssist, finishAssist, reclaim, quizCommand: command, getState: () => structuredClone(state()),
    dispose() { clear(); uid = roomId = ''; } };
}
