import { newAssignmentId, assignmentUrl, assignmentStatus, thaiDateInput, parseThaiDateInput } from '../../shared/classroom-assignment-model.js';

// DOM presentation only. All authority, catalog resolution and writes live in
// the signed-in parent Hub and are checked again by Database Rules.
const root = document.querySelector('[data-classroom-assignments]');
root.innerHTML = `<header class="homework-heading"><div><small data-hw-kicker></small><h2 data-hw-heading></h2></div><button type="button" class="classroom-button is-primary" data-hw-new></button></header>
  <p class="homework-feedback" data-hw-feedback role="status" aria-live="polite"></p>
  <button type="button" class="classroom-button" data-hw-retry hidden></button>
  <form class="homework-editor" data-hw-editor hidden>
    <h3 data-hw-editor-title tabindex="-1"></h3>
    <label><span data-hw-label="title"></span><input name="title" required maxlength="180" data-allow-selection></label>
    <label><span data-hw-label="url"></span><input name="url" type="url" required data-allow-selection><small data-hw-url-help></small></label>
    <button type="button" class="classroom-button" data-hw-preview></button><p data-hw-preview-result role="status"></p>
    <label><span data-hw-label="instructions"></span><textarea name="instructions" rows="4" maxlength="4000" data-allow-selection></textarea></label>
    <label><span data-hw-label="due"></span><input name="due" type="datetime-local" min="1970-01-01T07:00" max="2099-12-31T23:59" data-allow-selection><small data-hw-due-help></small></label>
    <div class="homework-actions"><button type="button" class="classroom-button" data-hw-save></button><button type="submit" class="classroom-button is-primary" data-hw-publish></button><button type="button" class="classroom-button" data-hw-cancel></button></div>
  </form>
  <section class="homework-detail" data-hw-detail hidden tabindex="-1"></section>
  <div class="homework-list" data-hw-list></div>
  <p class="classroom-footnote" data-hw-note></p>`;
const form = root.querySelector('form'), list = root.querySelector('[data-hw-list]'), detail = root.querySelector('[data-hw-detail]');
let context, uid = '', roomId = '', pending = null, editor = null, preview = null, feedback = '', feedbackError = false, listSignature = '', detailSignature = '';
const seenAttempts = new Set();
const t = (th, en) => context?.language === 'en' ? en : th;
const el = (tag, text, cls) => { const node = document.createElement(tag); node.textContent = text; if (cls) node.className = cls; return node; };
const snapshot = () => context?.classroomAssignments?.uid === uid ? context.classroomAssignments : null;
const currentRoom = () => snapshot()?.rooms.find(room => room.id === roomId);
const owner = () => currentRoom()?.membership === 'owner' && context?.classroom?.state === 'teacher';
const busy = () => Boolean(pending || snapshot()?.busy);
function button(text, action, id) {
  const node = el('button', text, 'classroom-button'); node.type = 'button'; node.dataset.homeworkAction = action;
  if (id) node.dataset.id = id;
  return node;
}
function errorText(code) {
  if (/permission.?denied/i.test(code)) return t('ยังอ่านหรือบันทึกการบ้านไม่ได้ ให้ผู้ดูแลตรวจสิทธิ์และกติกาฐานข้อมูลการบ้าน แล้วลองเชื่อมต่ออีกครั้ง', 'Homework access was denied. Ask the administrator to check access and assignment database rules, then reconnect.');
  const pairs = {
    'assignment/invalid-quiz': ['ลิงก์นี้ยังไม่ใช่ Quiz ที่เปิดใช้งานใน Learning Hub ใช้ปุ่มแชร์จากหน้าต่าง Quiz แล้ววางลิงก์นั้น', 'Use the share link from an available Learning Hub quiz. Menu pages, external links and temporary previews cannot be assigned.'],
    'assignment/invalid-title': ['ใส่ชื่องาน 1–180 ตัวอักษร', 'Enter a title of 1–180 characters.'],
    'assignment/invalid-instructions': ['คำชี้แจงยาวได้ไม่เกิน 4,000 ตัวอักษร', 'Instructions can contain up to 4,000 characters.'],
    'assignment/invalid-due': ['ตรวจวันและเวลากำหนดส่งอีกครั้ง ใช้เวลาไทย', 'Check the due date and time. Use Thailand time.'],
    'assignment/offline': ['การเชื่อมต่อขาด รอให้กลับมาแล้วลองอีกครั้ง', 'Connection lost. Reconnect and try again.'],
    'assignment/conflict': ['งานนี้มีการแก้ไขจากอีกหน้าต่าง เปิดแก้ไขใหม่เพื่อใช้ข้อมูลล่าสุด', 'This assignment changed in another window. Reopen the editor to use the latest version.'],
    'assignment/closed': ['งานนี้ปิดแล้ว ดูคำชี้แจงได้ แต่เปิดทำจากการบ้านนี้ไม่ได้', 'This assignment is closed. Its instructions are still available.'],
    'assignment/quiz-changed': ['ปลายทาง Quiz เปลี่ยนแล้ว ให้ครูตรวจลิงก์และมอบหมายงานใหม่', 'The quiz destination changed. Ask your teacher to review the link and assign it again.'],
    'assignment/room-unavailable': ['ยังเปิดการบ้านไม่ได้ ตรวจว่าคุณเป็นสมาชิกห้องนี้และลองอีกครั้ง', 'Homework is unavailable. Check your classroom membership and retry.'],
    'assignment/read-timeout': ['โหลดการบ้านนานกว่าปกติ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'Homework is taking longer than usual. Check your connection and retry.'],
    saved: ['บันทึกงานร่างแล้ว นักเรียนยังไม่เห็นงานนี้', 'Draft saved. Students cannot see it yet.'],
    published: ['เผยแพร่การบ้านให้สมาชิกในห้องแล้ว', 'Homework published to your classroom members.'],
    updated: ['บันทึกการแก้ไขแล้ว', 'Changes saved.'], closed: ['ปิดงานแล้ว ข้อมูลการบ้านยังอยู่', 'Assignment closed. Its details are retained.'],
    copied: ['คัดลอกลิงก์การบ้านแล้ว', 'Assignment link copied.'],
    'copy-failed': ['คัดลอกอัตโนมัติไม่ได้ เลือกลิงก์ด้านล่างแล้วคัดลอกเองได้', 'Automatic copy is unavailable. Select and copy the link below.'],
  };
  return pairs[code] ? t(...pairs[code]) : t('ยังไม่ยืนยันรายการ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'Not confirmed. Check your connection and try again.');
}
function send(action, payload = {}) {
  if (!uid || busy()) return;
  const requestId = crypto.randomUUID(); pending = { requestId, action }; feedback = ''; feedbackError = false;
  parent.postMessage({ type: 'learning-hub-assignment-command', requestId, uid, action, payload: { roomId, ...payload } }, location.origin);
  paint();
}
function statusLabel(item) {
  return ({ draft: t('งานร่าง', 'Draft'), published: t('เปิดให้ทำ', 'Open'), overdue: t('เลยกำหนดส่ง', 'Past due'), closed: t('ปิดงาน', 'Closed') })[assignmentStatus(item)];
}
function dueText(item) {
  if (!item.dueAt) return t('ไม่กำหนดวันส่ง', 'No due date');
  return t('กำหนดส่ง ', 'Due ') + new Date(item.dueAt).toLocaleString(context.language === 'en' ? 'en-GB' : 'th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) + t(' น. (เวลาไทย)', ' (Thailand time)');
}
function closeEditor() { editor = null; preview = null; form.reset(); form.hidden = true; }
function edit(item) {
  editor = item ? { id: item.id, revision: item.revision, status: item.status } : { id: newAssignmentId(), revision: 0, status: 'draft' };
  form.reset();
  form.elements.title.value = item?.title || '';
  form.elements.instructions.value = item?.instructions || '';
  form.elements.due.value = thaiDateInput(item?.dueAt);
  form.elements.url.value = item ? new URL(item.targetHash, snapshot().hubUrl).href : '';
  form.elements.url.readOnly = Boolean(item && item.status !== 'draft');
  preview = item ? { url: form.elements.url.value, quizTitleTh: item.quizTitleTh, quizTitleEn: item.quizTitleEn } : null;
  form.hidden = false; paint(); form.querySelector('h3').focus();
}
function save(publish) {
  if (!editor || !form.reportValidity() || preview?.url !== form.elements.url.value) return;
  let dueAt;
  try { dueAt = parseThaiDateInput(form.elements.due.value); }
  catch (failure) { feedback = failure.code; feedbackError = true; paint(); return; }
  send(publish ? 'publish' : 'save', { id: editor.id, revision: editor.revision, title: form.elements.title.value,
    instructions: form.elements.instructions.value, url: form.elements.url.value, dueAt });
}
function paint() {
  const access = context?.classroom, identity = context?.identity;
  const nextUid = parent !== window && identity?.status === 'signed-in' && access?.uid === identity.uid && ['teacher', 'student'].includes(access.state) ? identity.uid : '';
  const selected = context?.classroomRooms?.selected;
  const nextRoom = nextUid && context.classroomRooms?.roomStatus === 'ready' ? selected?.id || '' : '';
  if (uid !== nextUid || roomId !== nextRoom) {
    uid = nextUid; roomId = nextRoom; pending = null; closeEditor(); feedback = ''; feedbackError = false;
    seenAttempts.clear(); listSignature = detailSignature = ''; list.replaceChildren(); detail.replaceChildren();
  }
  root.hidden = !uid || !roomId;
  if (root.hidden) return;
  const data = snapshot(), room = currentRoom(), isOwner = owner();
  root.querySelector('[data-hw-kicker]').textContent = t('งานของสมาชิกในห้อง', 'Classroom assignments');
  root.querySelector('[data-hw-heading]').textContent = t('การบ้าน', 'Homework');
  const newButton = root.querySelector('[data-hw-new]'); newButton.hidden = !isOwner || Boolean(editor); newButton.textContent = t('+ มอบหมายงาน', '+ Assign homework');
  root.querySelector('[data-hw-note]').textContent = t('การบ้านเปิดทำต่อที่บ้านได้ การอ่านหรือเปิด Quiz ยังไม่นับเป็นการส่งงาน คะแนนและการส่งงานจะเชื่อมในเฟสถัดไป', 'Homework remains available after class. Reading or opening a quiz does not submit homework. Assignment results and submission will follow later.');
  const failure = room?.error || data?.error || (feedbackError ? feedback : '');
  const feedbackNode = root.querySelector('[data-hw-feedback]');
  feedbackNode.textContent = busy() ? t('กำลังรอระบบยืนยัน…', 'Waiting for confirmation…') : failure ? errorText(failure)
    : !data?.connected ? errorText('assignment/offline') : !room || room.status === 'loading' ? t('กำลังโหลดการบ้าน…', 'Loading homework…') : feedback ? errorText(feedback) : '';
  feedbackNode.classList.toggle('is-error', Boolean(failure));
  const retry = root.querySelector('[data-hw-retry]'); retry.hidden = !failure; retry.textContent = t('ลองเชื่อมต่อการบ้านอีกครั้ง', 'Reconnect homework');
  if (editor) {
    form.querySelector('h3').textContent = editor.revision ? t('แก้ไขการบ้าน', 'Edit homework') : t('มอบหมาย Quiz ให้ห้องนี้', 'Assign a quiz to this classroom');
    const labels = { title: t('ชื่องาน', 'Assignment title'), url: t('ลิงก์ Quiz จาก Learning Hub', 'Learning Hub quiz link'), instructions: t('คำชี้แจง', 'Instructions'), due: t('กำหนดส่ง (ไม่บังคับ)', 'Due date (optional)') };
    for (const node of form.querySelectorAll('[data-hw-label]')) node.textContent = labels[node.dataset.hwLabel];
    form.querySelector('[data-hw-url-help]').textContent = form.elements.url.readOnly ? t('เผยแพร่แล้ว หากต้องเปลี่ยน Quiz ให้มอบหมายเป็นงานใหม่', 'This work is published. Assign a new work item to use a different quiz.') : t('คัดลอกจากปุ่มแชร์ของ Quiz ปกติหรือคลังข้อสอบ', 'Copy the share link from a regular or question-bank quiz.');
    form.querySelector('[data-hw-due-help]').textContent = t('ใช้เวลาไทย (UTC+7) เว้นว่างได้ เลยกำหนดแล้วยังเปิดทำได้จนกว่าครูปิดงาน', 'Use Thailand time (UTC+7). Leave blank for no due date. Past-due work can be opened until your teacher closes it.');
    form.querySelector('[data-hw-preview]').textContent = t('ตรวจลิงก์ / ดูตัวอย่าง', 'Check link / preview');
    form.querySelector('[data-hw-preview]').hidden = form.elements.url.readOnly;
    form.querySelector('[data-hw-preview-result]').textContent = preview ? t('Quiz ที่เลือก: ', 'Selected quiz: ') + (context.language === 'en' ? preview.quizTitleEn : preview.quizTitleTh) : '';
    form.querySelector('[data-hw-save]').textContent = editor.status === 'draft' ? t('บันทึกร่าง', 'Save draft') : t('บันทึกการแก้ไข', 'Save changes');
    form.querySelector('[data-hw-publish]').hidden = editor.status !== 'draft';
    form.querySelector('[data-hw-publish]').textContent = t('เผยแพร่ให้ทั้งห้อง', 'Publish to classroom');
    form.querySelector('[data-hw-cancel]').textContent = t('ยกเลิก', 'Cancel');
  }
  const values = [...(room?.drafts || []), ...(room?.items || [])];
  const signature = JSON.stringify([context.language, room?.status, values, values.map(value => assignmentStatus(value)), room?.seen, busy(), data?.connected]);
  if (signature !== listSignature) {
    listSignature = signature; list.replaceChildren();
    if (room?.status === 'ready' && !values.length) list.append(el('p', isOwner ? t('ยังไม่มีการบ้าน เริ่มจากมอบหมาย Quiz ให้ห้องนี้', 'No homework yet. Assign a quiz to this classroom.') : t('ยังไม่มีการบ้านที่ครูเผยแพร่', 'No published homework yet.')));
    for (const item of values) {
      const card = el('article', '', 'homework-card'); card.dataset.assignmentId = item.id;
      const tags = el('div', '', 'homework-tags'); tags.append(el('span', statusLabel(item), 'homework-tag'));
      if (!isOwner && item.status === 'published') tags.append(el('span', room.seen?.[item.id] ? t('อ่านแล้ว', 'Read') : t('ใหม่', 'New'), 'homework-tag'));
      card.append(tags, el('h3', item.title), el('p', dueText(item)), button(t('ดูการบ้าน', 'View homework'), 'view', item.id));
      if (isOwner) card.append(button(t('แก้ไข', 'Edit'), 'edit', item.id));
      list.append(card);
    }
  }
  const requested = context.classroomAssignmentRoute;
  const id = requested?.roomId === roomId ? requested.assignmentId : '';
  const item = id ? values.find(value => value.id === id) : null;
  detail.hidden = !id;
  const nextDetail = JSON.stringify([context.language, id, item, item && assignmentStatus(item), room?.status, busy(), data?.connected]);
  if (nextDetail !== detailSignature) {
    detailSignature = nextDetail; detail.replaceChildren();
    if (id && !item && room?.status === 'ready') detail.append(el('p', t('ไม่พบการบ้านนี้ หรือคุณไม่มีสิทธิ์เปิดงานร่าง ตรวจลิงก์กับครูอีกครั้ง', 'This assignment was not found or its draft is private. Check the link with your teacher.')));
    if (item) {
      detail.append(el('span', statusLabel(item), 'homework-tag'), el('h3', item.title), el('p', dueText(item)), el('p', item.instructions || t('ไม่มีคำชี้แจงเพิ่มเติม', 'No additional instructions.'), 'homework-instructions'),
        el('p', t('Quiz: ', 'Quiz: ') + (context.language === 'en' ? item.quizTitleEn : item.quizTitleTh)));
      if (item.status === 'published') detail.append(button(t('เปิดทำ Quiz', 'Open quiz'), 'launch', item.id));
      if (isOwner) {
        detail.append(button(t('แก้ไขงาน', 'Edit assignment'), 'edit', item.id));
        if (item.status === 'published') detail.append(button(t('ปิดงาน', 'Close assignment'), 'close', item.id));
      }
      if (item.status !== 'draft') {
        const linkLabel = el('label', t('ลิงก์ประจำการบ้าน', 'Assignment link'), 'homework-share');
        const input = document.createElement('input'); input.readOnly = true; input.dataset.allowSelection = '';
        input.value = assignmentUrl(roomId, item.id, data.hubUrl); input.setAttribute('aria-label', linkLabel.textContent);
        linkLabel.append(input); detail.append(linkLabel, button(t('คัดลอกลิงก์', 'Copy link'), 'copy', item.id));
      }
    }
  }
  root.querySelectorAll('button,input,textarea').forEach(node => { node.disabled = busy() || !data?.connected || room?.status !== 'ready'; });
  if (editor) for (const selector of ['[data-hw-save]','[data-hw-publish]']) form.querySelector(selector).disabled ||= preview?.url !== form.elements.url.value;
  // Recovery must remain available even when a room read is denied or offline.
  retry.disabled = busy();
  if (item && item.status !== 'draft' && !isOwner && !room.seen?.[id] && document.visibilityState === 'visible' && !busy() && data?.connected && !seenAttempts.has(id)) {
    seenAttempts.add(id); queueMicrotask(() => send('seen', { id }));
  }
}
root.querySelector('[data-hw-new]').addEventListener('click', () => edit(null));
root.querySelector('[data-hw-cancel]').addEventListener('click', () => { closeEditor(); paint(); });
root.querySelector('[data-hw-preview]').addEventListener('click', () => { if (form.elements.url.reportValidity()) send('preview', { url: form.elements.url.value }); });
root.querySelector('[data-hw-save]').addEventListener('click', () => save(false));
root.querySelector('[data-hw-retry]').addEventListener('click', () => { seenAttempts.clear(); send('retry'); });
form.addEventListener('submit', event => { event.preventDefault(); save(true); });
form.elements.url.addEventListener('input', () => { preview = null; paint(); });
root.addEventListener('click', async event => {
  const node = event.target.closest('[data-homework-action]'); if (!node || node.disabled) return;
  const item = [...(currentRoom()?.items || []), ...(currentRoom()?.drafts || [])].find(value => value.id === node.dataset.id);
  if (!item) return;
  const action = node.dataset.homeworkAction;
  if (action === 'edit') edit(item);
  else if (action === 'close') {
    if (window.confirm(t('ปิดการบ้านนี้? นักเรียนจะยังอ่านคำชี้แจงได้ แต่เปิดทำจากการบ้านนี้ไม่ได้', 'Close this assignment? Students can still read its instructions, but cannot launch it as homework.'))) send('close', { id: item.id, revision: item.revision });
  } else if (action === 'copy') {
    const user = uid;
    try { await navigator.clipboard.writeText(assignmentUrl(roomId, item.id, snapshot().hubUrl)); if (uid === user) { feedback = 'copied'; feedbackError = false; paint(); } }
    catch { if (uid === user) { feedback = 'copy-failed'; feedbackError = true; paint(); detail.querySelector('input')?.select(); } }
  } else send(action, { id: item.id });
});
document.addEventListener('hub-page-context', event => { context = event.detail; paint(); });
window.addEventListener('message', event => {
  if (parent === window || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-assignment-result' || event.data.uid !== uid || event.data.requestId !== pending?.requestId) return;
  const action = pending.action; pending = null;
  if (!event.data.ok) { feedback = String(event.data.error || ''); feedbackError = true; }
  else if (action === 'preview') preview = { ...event.data.result.preview, url: form.elements.url.value };
  else if (['save','publish'].includes(action)) { feedback = event.data.result.status === 'draft' ? 'saved' : editor?.status === 'draft' ? 'published' : 'updated'; feedbackError = false; closeEditor(); }
  else if (action === 'close') { feedback = 'closed'; feedbackError = false; }
  paint();
  if (event.data.ok && action === 'view') detail.focus();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') paint(); });
setInterval(() => { if (!root.hidden) paint(); }, 30000);
// This module may finish loading after the first context message.
if (parent !== window) parent.postMessage({ type: 'learning-hub-page-ready' }, location.origin);
