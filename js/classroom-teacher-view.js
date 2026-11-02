import { teacherMessage, teacherShareTarget } from '../public/shared/classroom-teacher-model.js';

export function createClassroomTeacherDialog({ service, language, baseUrl = location.href, clipboard = text => navigator.clipboard.writeText(text) }) {
  const dialog = document.createElement('dialog'); dialog.className = 'classroom-teacher-dialog'; dialog.dataset.teacherDialog = '';
  dialog.setAttribute('aria-labelledby', 'teacher-dialog-title');
  dialog.innerHTML = [
    '<header><h2 id="teacher-dialog-title" tabindex="-1"></h2><button type="button" data-teacher-close>×</button></header>',
    '<p data-teacher-note></p><form data-teacher-search><label for="teacher-email" data-teacher-email-label></label>',
    '<div class="teacher-search-row"><input id="teacher-email" type="email" required maxlength="254" autocomplete="off" spellcheck="false" data-allow-selection><button type="submit" data-teacher-find></button></div></form>',
    '<p data-teacher-feedback role="status" aria-live="polite"></p><button type="button" data-teacher-reload hidden></button>',
    '<div data-teacher-result></div><section data-teacher-confirm hidden><p></p><button type="button" data-teacher-confirm-revoke></button><button type="button" data-teacher-cancel-revoke></button></section>',
    '<section><h3 data-teacher-pending-title></h3><div data-teacher-pending></div></section>',
    '<section><h3 data-teacher-list-title></h3><div data-teacher-list></div></section>',
    '<section class="teacher-share"><h3 data-teacher-share-title></h3><p data-teacher-share-note></p><label for="teacher-share-url" data-teacher-share-label></label><input id="teacher-share-url" type="url" readonly data-allow-selection><button type="button" data-teacher-copy></button><p data-teacher-copy-status role="status" aria-live="polite"></p></section>',
  ].join('');
  document.body.append(dialog);
  const email = dialog.querySelector('#teacher-email'), feedback = dialog.querySelector('[data-teacher-feedback]');
  const share = dialog.querySelector('#teacher-share-url');
  let state = service.getState(), opener = null, confirmation = '', localError = '', renderKey = '', viewEpoch = 0;
  const t = (th, en) => language() === 'en' ? en : th;
  const isOpen = () => dialog.open || dialog.hasAttribute('open');
  const text = (selector, th, en) => { dialog.querySelector(selector).textContent = t(th, en); };
  const element = (tag, value, className = '') => { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; return node; };
  function identity(row) {
    const result = element('div', '', 'teacher-person');
    result.append(element('strong', row.displayName || row.email || t('บัญชีครู', 'Teacher account')));
    result.append(element('span', row.email || row.uid)); return result;
  }
  function action(label, actionName, uid) {
    const button = element('button', label); button.type = 'button'; button.dataset.teacherAction = actionName; button.dataset.uid = uid;
    button.disabled = state.status !== 'ready' || !state.connected || Boolean(state.busy); return button;
  }
  function hide() {
    ++viewEpoch;
    if (isOpen()) { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }
    email.value = ''; confirmation = ''; localError = ''; renderKey = ''; dialog.querySelector('[data-teacher-copy-status]').textContent = '';
    const previous = opener; opener = null; service.close(); previous?.focus?.();
  }
  function paint() {
    text('h2', 'เพิ่มและจัดการครู', 'Add and manage teachers');
    text('[data-teacher-note]', 'ค้นหาอีเมลของบัญชีที่เคยเข้าสู่ระบบ Hub แล้ว ตรวจชื่อและอีเมลก่อนอนุมัติ บัญชีครูสร้างและจัดการห้องของตนเองได้', 'Find an email that has signed in to Hub. Check the name and email before approving. Teachers can create and manage their own classrooms.');
    text('[data-teacher-email-label]', 'อีเมลครู', 'Teacher email');
    text('[data-teacher-find]', 'ค้นหาบัญชี', 'Find account');
    text('[data-teacher-reload]', 'โหลดรายชื่ออีกครั้ง', 'Reload directory');
    text('[data-teacher-pending-title]', 'คำขอที่รออนุมัติ', 'Pending teacher requests');
    text('[data-teacher-list-title]', 'ครูที่อนุมัติแล้ว', 'Approved teachers');
    text('[data-teacher-share-title]', 'ลิงก์ให้เพื่อนเปิด Hub', 'Link for your friend');
    text('[data-teacher-share-note]', 'ส่งให้เพื่อนเปิดและเข้าสู่ระบบด้วยอีเมลที่จะใช้เป็นครู แล้วกลับมาค้นหาและอนุมัติที่นี่ ลิงก์ใช้เปิดหน้า Classroom เท่านั้น', 'Ask your friend to open this link and sign in with their teacher email, then find and approve the account here. The link opens Classroom.');
    text('[data-teacher-share-label]', 'ลิงก์ Classroom', 'Classroom link');
    text('[data-teacher-copy]', 'คัดลอกลิงก์ให้เพื่อน', 'Copy link for a friend');
    text('[data-teacher-confirm-revoke]', 'ยืนยันถอนสิทธิ์', 'Confirm revocation');
    text('[data-teacher-cancel-revoke]', 'ยกเลิก', 'Cancel');
    dialog.querySelector('[data-teacher-close]').setAttribute('aria-label', t('ปิด', 'Close'));
    share.value = teacherShareTarget(baseUrl).url;
    const unavailable = state.status !== 'ready' || !state.connected || Boolean(state.busy);
    email.disabled = unavailable; dialog.querySelector('[data-teacher-find]').disabled = unavailable;
    const code = localError || state.error;
    feedback.textContent = code ? teacherMessage(code, language()) : state.busy ? t('กำลังบันทึก…', 'Saving…')
      : state.status === 'loading' ? t('กำลังโหลดรายชื่อ…', 'Loading the directory…')
      : !state.connected && state.status === 'ready' ? teacherMessage('teachers/offline', language())
      : state.success === 'approve' ? t('อนุมัติครูแล้ว ให้ครูรีเฟรช Hub เพื่อเริ่มสร้างห้องได้', 'Teacher approved. They can refresh Hub to start creating classrooms.')
      : state.success === 'revoke' ? t('ถอนสิทธิ์ครูแล้ว', 'Teacher access revoked.') : '';
    feedback.classList.toggle('is-error', Boolean(code));
    dialog.querySelector('[data-teacher-reload]').hidden = state.status !== 'error';
    const confirmRow = state.teachers.find(row => row.uid === confirmation);
    if (!confirmRow) confirmation = '';
    const confirmPanel = dialog.querySelector('[data-teacher-confirm]'); confirmPanel.hidden = !confirmation;
    confirmPanel.querySelector('p').textContent = confirmation ? t('ถอนสิทธิ์ครูของ ', 'Revoke teacher access for ') + (confirmRow.email || confirmRow.displayName || confirmRow.uid) + '?' : '';
    dialog.querySelector('[data-teacher-confirm-revoke]').disabled = unavailable;
    const key = JSON.stringify([language(), state.candidate, state.teachers, state.pending, state.status, state.connected, state.busy]);
    if (key === renderKey) return; renderKey = key;
    const result = dialog.querySelector('[data-teacher-result]'); result.replaceChildren();
    if (state.candidate) {
      const row = element('div', '', 'teacher-row'); row.append(identity(state.candidate));
      if (state.teachers.some(person => person.uid === state.candidate.uid)) row.append(element('span', t('มีสิทธิ์ครูแล้ว', 'Already a teacher'), 'teacher-approved'));
      else row.append(action(t('อนุมัติเป็นครู', 'Approve teacher'), 'approve', state.candidate.uid));
      result.append(row);
    }
    for (const [selector, rows, pending] of [['[data-teacher-pending]', state.pending, true], ['[data-teacher-list]', state.teachers, false]]) {
      const container = dialog.querySelector(selector); container.replaceChildren();
      if (!rows.length) { container.append(element('p', state.status === 'loading' ? t('กำลังโหลด…', 'Loading…') : pending ? t('ไม่มีคำขอที่รออนุมัติ', 'No pending requests') : t('ยังไม่มีรายชื่อครู', 'No approved teachers'))); continue; }
      for (const person of rows) {
        const row = element('div', '', 'teacher-row'); row.append(identity(person));
        if (pending && state.teachers.some(item => item.uid === person.uid)) row.append(element('span', t('มีสิทธิ์ครูแล้ว', 'Already a teacher')));
        else if (pending) row.append(action(t('อนุมัติเป็นครู', 'Approve teacher'), 'approve', person.uid));
        else if (person.uid === state.uid) row.append(element('span', t('บัญชีของคุณ', 'Your account')));
        else row.append(action(t('ถอนสิทธิ์ครู', 'Revoke teacher'), 'revoke', person.uid));
        container.append(row);
      }
    }
  }
  async function run(actionName, uid) {
    localError = ''; confirmation = '';
    const version = viewEpoch, actor = state.uid;
    try { await service.command(actionName, uid, actor); }
    catch (failure) { if (isOpen() && version === viewEpoch && actor === state.uid) { localError = failure?.code || failure?.message; paint(); } }
  }
  dialog.querySelector('[data-teacher-search]').addEventListener('submit', event => {
    event.preventDefault(); localError = ''; confirmation = '';
    try { service.search(email.value); } catch (failure) { localError = failure.code; paint(); }
  });
  email.addEventListener('input', () => { localError = ''; confirmation = ''; service.clearSearch(); });
  dialog.addEventListener('click', event => {
    const button = event.target.closest('[data-teacher-action]'); if (!button || button.disabled) return;
    if (button.dataset.teacherAction === 'revoke') { confirmation = button.dataset.uid; paint(); }
    else void run('approve', button.dataset.uid);
  });
  dialog.querySelector('[data-teacher-confirm-revoke]').addEventListener('click', () => { if (confirmation) void run('revoke', confirmation); });
  dialog.querySelector('[data-teacher-cancel-revoke]').addEventListener('click', () => { confirmation = ''; paint(); });
  dialog.querySelector('[data-teacher-close]').addEventListener('click', hide);
  dialog.addEventListener('cancel', event => { event.preventDefault(); hide(); });
  dialog.querySelector('[data-teacher-reload]').addEventListener('click', () => { localError = ''; service.open(); });
  share.addEventListener('click', () => share.select?.());
  dialog.querySelector('[data-teacher-copy]').addEventListener('click', async () => {
    const output = dialog.querySelector('[data-teacher-copy-status]'), version = viewEpoch;
    try { await clipboard(share.value); if (isOpen() && version === viewEpoch) output.textContent = t('คัดลอกแล้ว ส่งให้เพื่อนเปิดได้เลย', 'Copied. Send it to your friend.'); }
    catch { if (isOpen() && version === viewEpoch) { share.focus(); share.select?.(); output.textContent = t('คัดลอกอัตโนมัติไม่ได้ กดค้างหรือ Ctrl+C เพื่อคัดลอกลิงก์ที่เลือกไว้', 'Automatic copy is unavailable. Long-press or press Ctrl+C to copy the selected link.'); } }
  });
  return {
    update(next) {
      const changed = state.uid !== next.uid || (state.canManage && !next.canManage); state = next;
      if (isOpen() && (changed || !state.opened)) { hide(); return; }
      paint();
    },
    open(element = document.activeElement) {
      if (!service.getState().canManage) return;
      ++viewEpoch; opener = element; localError = ''; renderKey = ''; confirmation = ''; email.value = '';
      service.open(); state = service.getState(); paint();
      if (!isOpen()) { if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', ''); }
      dialog.querySelector('h2').focus();
    },
    close: hide,
  };
}
