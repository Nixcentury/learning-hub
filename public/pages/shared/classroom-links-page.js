import { cleanLinkFields, newLinkId } from '../../shared/classroom-links-model.js';

// Presentation only. The parent binds commands to its account and open room.
const panel = document.querySelector('[data-hw-links-panel]');
const content = panel.querySelector('.classroom-links-content');
content.innerHTML = `<p id="homework-links-note" data-hw-links-note></p>
  <button type="button" class="classroom-button" data-hw-add-link></button>
  <p class="room-links-feedback" data-links-feedback role="status" aria-live="polite"></p>
  <label class="room-link-copy-fallback" data-links-copy-fallback hidden><span data-links-copy-label></span><input type="url" readonly data-links-copy-value data-allow-selection></label>
  <button type="button" class="classroom-button" data-links-retry hidden></button>
  <form class="room-links-form" data-links-form hidden>
    <h3 data-links-form-title></h3>
    <label><span data-links-label="title"></span><input name="linkTitle" required maxlength="180" data-allow-selection></label>
    <label><span data-links-label="url"></span><input name="linkUrl" type="url" required maxlength="2048" placeholder="https://" data-allow-selection></label>
    <small data-links-help></small>
    <div class="room-links-actions"><button type="submit" class="classroom-button is-primary" data-links-save></button><button type="button" class="classroom-button" data-links-cancel></button></div>
  </form>
  <ul class="room-links-list" data-links-list></ul>`;
content.dataset.roomLinks = '';
const form = content.querySelector('form'), list = content.querySelector('[data-links-list]');
let context, uid = '', roomId = '', pending = null, editor = null, feedback = '', failed = false, signature = '';
let copyUrl = '', copySequence = 0;
const t = (th, en) => context?.language === 'en' ? en : th;
const node = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; };
const snapshot = () => context?.classroomLinks?.uid === uid && context.classroomLinks.roomId === roomId ? context.classroomLinks : null;
function message(code) {
  if (/permission.?denied/i.test(code)) return t('ยังเปิดลิงก์ของห้องไม่ได้ ให้ครูตรวจสิทธิ์และ Rules แล้วลองใหม่', 'Classroom links access was denied. Ask your teacher to check access and Rules, then retry.');
  const text = {
    'links/invalid-title': ['ใส่ชื่อลิงก์ 1–180 ตัวอักษร', 'Enter a link title of 1–180 characters.'],
    'links/invalid-url': ['ใช้ URL เต็มที่ขึ้นต้นด้วย https:// หรือ http:// และไม่มีชื่อผู้ใช้หรือรหัสผ่านในลิงก์', 'Use a complete https:// or http:// URL without embedded credentials.'],
    'links/offline': ['ออฟไลน์อยู่ เชื่อมต่ออินเทอร์เน็ตก่อนบันทึกลิงก์', 'You are offline. Reconnect before saving links.'],
    'links/conflict': ['รายการนี้เปลี่ยนแล้ว เปิดแก้ไขใหม่เพื่อตรวจข้อมูลล่าสุด', 'This link changed. Reopen the editor to review its latest version.'],
    'links/access-lost': ['สิทธิ์ห้องนี้เปลี่ยนแล้ว ลองเปิดห้องใหม่', 'Your classroom access changed. Reopen the room.'],
    'links/session-changed': ['บัญชีหรือห้องเปลี่ยนแล้ว ลองเปิดห้องใหม่', 'Your account or classroom changed. Reopen the room.'],
    'links/read-timeout': ['โหลดลิงก์นานกว่าปกติ ตรวจอินเทอร์เน็ตแล้วลองเชื่อมต่ออีกครั้ง', 'Loading is taking longer than usual. Check your connection and retry.'],
    saved: ['บันทึกลิงก์แล้ว', 'Link saved.'], deleted: ['ลบลิงก์แล้ว', 'Link deleted.'],
    copied: ['คัดลอกลิงก์แล้ว', 'Link copied.'],
    'links/copy-blocked': ['คัดลอกอัตโนมัติไม่ได้ กดค้างหรือ Ctrl+C เพื่อคัดลอกลิงก์ที่เลือกไว้', 'Automatic copy is unavailable. Long-press or press Ctrl+C to copy the selected link.'],
  };
  return text[code] ? t(...text[code]) : t('ดำเนินการไม่สำเร็จ ระบบยังไม่ยืนยัน กรุณาลองใหม่', 'The request has not been confirmed. Please retry.');
}
function closeEditor() { editor = null; form.reset(); form.hidden = true; }
function paint() {
  const access = context?.classroom, identity = context?.identity;
  const nextUid = parent !== window && identity?.status === 'signed-in' && access?.uid === identity.uid && ['teacher','student'].includes(access.state) ? identity.uid : '';
  const nextRoom = nextUid && context?.classroomRooms?.roomStatus === 'ready' ? context.classroomRooms.selected?.id || '' : '';
  if (uid !== nextUid || roomId !== nextRoom) {
    uid = nextUid; roomId = nextRoom; pending = null; closeEditor(); feedback = ''; failed = false; signature = ''; list.replaceChildren();
    copyUrl = ''; copySequence++;
  }
  panel.querySelector('[data-hw-links-heading]').textContent = t('ลิงก์ของห้อง', 'Classroom links');
  content.querySelector('[data-hw-links-note]').textContent = t('สมุดจดและสื่อที่ใช้ในคาบ', 'Notebooks and lesson resources');
  const data = snapshot(), saving = Boolean(pending || data?.busy);
  const ready = Boolean(uid && roomId && data?.status === 'ready' && data.connected);
  const student = access?.state === 'student';
  if (!student || !data?.items.some(item => item.url === copyUrl)) copyUrl = '';
  content.querySelector('[data-links-copy-fallback]').hidden = !copyUrl;
  content.querySelector('[data-links-copy-label]').textContent = t('ลิงก์สำหรับคัดลอก', 'Link to copy');
  content.querySelector('[data-links-copy-value]').value = copyUrl;
  content.querySelector('[data-hw-add-link]').textContent = t('+ ลิงก์อื่น', '+ Add a link');
  content.querySelector('[data-hw-add-link]').hidden = Boolean(editor);
  content.querySelector('[data-links-form-title]').textContent = editor?.revision ? t('แก้ไขลิงก์', 'Edit link') : t('เพิ่มลิงก์', 'Add link');
  content.querySelector('[data-links-label="title"]').textContent = t('ชื่อลิงก์', 'Link title');
  content.querySelector('[data-links-label="url"]').textContent = t('URL', 'URL');
  content.querySelector('[data-links-help]').textContent = t('ทุกคนในห้องเปิดลิงก์นี้ได้ ไฟล์จริงยังอยู่ที่เว็บไซต์ต้นทาง', 'Everyone in this room can open the link. Files stay on the linked website.');
  content.querySelector('[data-links-save]').textContent = t('บันทึก', 'Save');
  content.querySelector('[data-links-cancel]').textContent = t('ยกเลิก', 'Cancel');
  form.hidden = !editor;
  const failure = data?.error || (failed ? feedback : '');
  const status = content.querySelector('[data-links-feedback]');
  status.textContent = saving ? t('กำลังรอระบบยืนยัน…', 'Waiting for confirmation…') : failure ? message(failure)
    : data && !data.connected && data.status === 'ready' ? message('links/offline')
    : data?.status !== 'ready' ? t('กำลังโหลดลิงก์…', 'Loading links…')
    : feedback ? message(feedback) : data.items.length ? '' : t('ยังไม่มีลิงก์ในห้อง เพิ่มลิงก์แรกได้เลย', 'No links yet. Add the first classroom link.');
  status.classList.toggle('is-error', Boolean(failure));
  const retry = content.querySelector('[data-links-retry]'); retry.hidden = !failure; retry.textContent = t('ลองเชื่อมต่อลิงก์อีกครั้ง', 'Reconnect classroom links');
  const next = JSON.stringify([context?.language, access?.state, data?.items, data?.owner]);
  if (next !== signature) {
    signature = next; list.replaceChildren();
    for (const item of data?.items || []) {
      let safe;
      try { safe = cleanLinkFields(item); } catch { continue; }
      const row = node('li', '', 'room-link');
      const anchor = node('a', safe.title); anchor.href = safe.url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.dataset.external = 'true';
      anchor.title = safe.url;
      const date = new Date(item.createdAt).toLocaleDateString(context?.language === 'en' ? 'en-GB' : 'th-TH', { timeZone: 'Asia/Bangkok' });
      row.append(anchor, node('small', `${item.authorName} · ${date}`), node('small', new URL(safe.url).hostname, 'room-link-host'));
      if (student) {
        const quick = node('div', '', 'room-link-quick-actions');
        const copy = node('button', t('คัดลอกลิงก์', 'Copy link'), 'classroom-button');
        copy.type = 'button'; copy.dataset.linksCopy = ''; copy.dataset.id = item.id;
        copy.setAttribute('aria-label', `${copy.textContent}: ${safe.title}`);
        const open = node('a', t('เปิดในแท็บใหม่', 'Open in new tab'), 'classroom-button');
        open.href = safe.url; open.target = '_blank'; open.rel = 'noopener noreferrer'; open.dataset.external = 'true'; open.dataset.linksOpen = '';
        open.setAttribute('aria-label', `${open.textContent}: ${safe.title}`);
        quick.append(copy, open); row.append(quick);
      }
      if (data.owner || item.authorUid === uid) {
        const actions = node('div', '', 'room-links-actions');
        for (const [action, label] of [['edit', t('แก้ไข','Edit')], ['delete', t('ลบ','Delete')]]) {
          const button = node('button', label, 'classroom-button'); button.type = 'button'; button.dataset.linkAction = action; button.dataset.id = item.id;
          button.setAttribute('aria-label', `${label}: ${item.title}`); actions.append(button);
        }
        row.append(actions);
      }
      list.append(row);
    }
  }
  content.querySelectorAll('button,input').forEach(el => {
    el.disabled = el.matches('[data-links-copy],[data-links-copy-value]')
      ? !uid || !roomId || data?.status !== 'ready' : !ready || saving;
  });
  retry.disabled = saving || !uid || !roomId;
  content.querySelector('[data-links-cancel]').disabled = false;
  content.setAttribute('aria-busy', String(saving));
}
function send(action, payload = {}) {
  if (!uid || !roomId || pending) return;
  const requestId = crypto.randomUUID(); pending = { requestId, action }; feedback = ''; failed = false; paint();
  parent.postMessage({ type: 'learning-hub-links-command', requestId, uid, action, payload: { ...payload, roomId } }, location.origin);
}
content.querySelector('[data-hw-add-link]').addEventListener('click', () => {
  editor = { id: newLinkId(), revision: 0 }; form.reset(); feedback = ''; failed = false; panel.open = true; paint(); form.elements.linkTitle.focus();
});
content.querySelector('[data-links-cancel]').addEventListener('click', () => { closeEditor(); paint(); content.querySelector('[data-hw-add-link]').focus(); });
content.querySelector('[data-links-retry]').addEventListener('click', () => send('retry'));
form.addEventListener('submit', event => {
  event.preventDefault(); if (!editor) return;
  try { const fields = cleanLinkFields({ title: form.elements.linkTitle.value, url: form.elements.linkUrl.value }); send(editor.revision ? 'edit' : 'create', { ...editor, ...fields }); }
  catch (failure) { feedback = failure.code; failed = true; paint(); }
});
async function copyLink(button) {
  const item = snapshot()?.items.find(value => value.id === button.dataset.id);
  if (!item || context?.classroom?.state !== 'student') return;
  let safe;
  try { safe = cleanLinkFields(item); } catch { return; }
  const requestUid = uid, requestRoom = roomId, sequence = ++copySequence;
  const current = () => sequence === copySequence && uid === requestUid && roomId === requestRoom
    && context?.classroom?.state === 'student' && snapshot()?.items.some(value => value.id === item.id && value.url === item.url);
  copyUrl = ''; feedback = ''; failed = false; paint();
  try {
    await navigator.clipboard.writeText(safe.url);
    if (!current()) return;
    feedback = 'copied'; paint();
  } catch {
    if (!current()) return;
    copyUrl = safe.url; feedback = 'links/copy-blocked'; paint();
    const field = content.querySelector('[data-links-copy-value]'); field.focus(); field.select();
  }
}
list.addEventListener('click', event => {
  const copy = event.target.closest('[data-links-copy]');
  if (copy) { if (!copy.disabled) void copyLink(copy); return; }
  const button = event.target.closest('[data-link-action]'); if (!button || button.disabled) return;
  const item = snapshot()?.items.find(value => value.id === button.dataset.id); if (!item) return;
  if (button.dataset.linkAction === 'edit') {
    editor = { id: item.id, revision: item.revision }; form.elements.linkTitle.value = item.title; form.elements.linkUrl.value = item.url;
    feedback = ''; failed = false; paint(); form.elements.linkTitle.focus();
  } else if (window.confirm(t(`ลบลิงก์ “${item.title}” ออกจากห้องนี้?`, `Remove “${item.title}” from this classroom?`))) send('delete', { id: item.id, revision: item.revision });
});
document.addEventListener('hub-page-context', event => { context = event.detail; paint(); });
window.addEventListener('message', event => {
  if (parent === window || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-links-result' || event.data.uid !== uid || event.data.requestId !== pending?.requestId) return;
  const action = pending.action; pending = null; failed = !event.data.ok;
  feedback = failed ? String(event.data.error || '') : action === 'delete' ? 'deleted' : action === 'retry' ? '' : 'saved';
  if (!failed && ['create','edit'].includes(action)) closeEditor();
  paint();
});
if (parent !== window) parent.postMessage({ type: 'learning-hub-page-ready' }, location.origin);
