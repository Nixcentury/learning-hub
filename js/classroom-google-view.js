import { googleClassroomMessage } from '../public/shared/classroom-google-model.js';

export function createGoogleClassroomDialog({ service, language, configuredClientId = '', origin = location.origin }) {
  const dialog = document.createElement('dialog'); dialog.className = 'classroom-google-dialog'; dialog.dataset.googleClassroomDialog = '';
  dialog.setAttribute('aria-labelledby', 'classroom-google-dialog-title');
  dialog.innerHTML = `<header><h2 id="classroom-google-dialog-title" tabindex="-1" data-google-dialog-title></h2><button type="button" data-google-dialog-close aria-label="Close">×</button></header>
    <p data-google-dialog-note></p>
    <details data-google-setup><summary data-google-setup-title></summary>
      <label><span data-google-client-label></span><input data-google-client-id type="text" maxlength="300" autocomplete="off" spellcheck="false" data-allow-selection></label>
      <p data-google-client-note></p><label><span data-google-origin-label></span><input data-google-origin readonly data-allow-selection></label>
      <a data-google-guide href="https://github.com/Nixcentury/learning-hub/blob/main/integrations/google-classroom/DIRECT-PHASE1.md" target="_blank" rel="noopener noreferrer"></a>
      <button type="button" data-google-prepare></button>
    </details>
    <p class="classroom-google-feedback" data-google-dialog-feedback role="status" aria-live="polite"></p>
    <button type="button" class="is-primary" data-google-authorize></button>
    <button type="button" data-google-dialog-done></button>`;
  document.body.append(dialog);
  const input = dialog.querySelector('[data-google-client-id]'), setup = dialog.querySelector('details');
  const feedback = dialog.querySelector('[data-google-dialog-feedback]');
  let state = service.getState(), opener = null, localError = '';
  const t = (th, en) => language() === 'en' ? en : th;
  const opened = () => dialog.open || dialog.hasAttribute('open');
  function hide() {
    if (!opened()) return;
    if (dialog.close) dialog.close(); else dialog.removeAttribute('open');
    if (state.busy) service.disconnect();
    opener?.focus?.(); opener = null;
  }
  function paint() {
    dialog.querySelector('[data-google-dialog-title]').textContent = t('เชื่อม Google Classroom', 'Connect Google Classroom');
    dialog.querySelector('[data-google-dialog-note]').textContent = t('เลือกบัญชีครูโรงเรียนเพื่ออ่านรายชื่อห้อง การเชื่อมนี้ใช้เฉพาะครั้งนี้ และไม่เปลี่ยนบัญชีที่เข้า Hub', 'Choose your school teacher account to read your courses. This session-only connection keeps your Hub sign-in.');
    dialog.querySelector('[data-google-setup-title]').textContent = t('ตั้งค่าการเชื่อมต่อครั้งแรก', 'First connection setup');
    dialog.querySelector('[data-google-client-label]').textContent = 'OAuth Client ID';
    dialog.querySelector('[data-google-client-note]').textContent = t('ใช้ Client ID ของ Web application ในโปรเจกต์ Google Cloud ที่คุณดูแล ค่าที่กรอกใช้เฉพาะแท็บนี้', 'Use the Web application client ID from your Google Cloud project. An entered value is used only in this tab.');
    dialog.querySelector('[data-google-origin-label]').textContent = t('Authorized JavaScript origin สำหรับเว็บนี้', 'Authorized JavaScript origin for this site');
    dialog.querySelector('[data-google-origin]').value = origin;
    dialog.querySelector('[data-google-guide]').textContent = t('เปิดคู่มือตั้งค่า Google Cloud', 'Open Google Cloud setup guide');
    dialog.querySelector('[data-google-prepare]').textContent = t('เตรียมการเชื่อมต่อ', 'Prepare connection');
    dialog.querySelector('[data-google-authorize]').textContent = t('เลือกบัญชีครูโรงเรียน', 'Choose school teacher account');
    dialog.querySelector('[data-google-dialog-done]').textContent = state.status === 'connected' ? t('กลับไปดูรายชื่อห้อง', 'View course list') : t('ปิด', 'Close');
    dialog.querySelector('[data-google-dialog-close]').setAttribute('aria-label', t('ปิด', 'Close'));
    const error = localError || state.error;
    const texts = { preparing: t('กำลังเตรียมหน้าต่าง Google…', 'Preparing the Google window…'), authorizing: t('รอเลือกบัญชีและอนุญาตในหน้าต่าง Google…', 'Choose your account and grant access in the Google window…'), loading: t('กำลังยืนยันบัญชีและอ่านรายชื่อห้อง…', 'Verifying your account and reading courses…'), prepared: t('พร้อมแล้ว กดเลือกบัญชีครูโรงเรียน', 'Ready. Choose your school teacher account.') };
    feedback.textContent = error ? googleClassroomMessage(error, language()) : state.status === 'connected' ? t(`เชื่อมกับ ${state.account.email} แล้ว พบ ${state.courses.length} ห้อง`, `Connected to ${state.account.email}. Found ${state.courses.length} courses.`) : texts[state.status] || '';
    feedback.classList.toggle('is-error', Boolean(error));
    input.disabled = state.busy;
    dialog.querySelector('[data-google-prepare]').disabled = !state.uid || state.busy;
    dialog.querySelector('[data-google-authorize]').disabled = !state.canConnect || input.value.trim() !== service.getClientId();
  }
  input.addEventListener('input', () => { localError = ''; paint(); });
  dialog.querySelector('[data-google-prepare]').addEventListener('click', () => { localError = ''; void service.prepare(input.value).catch(() => {}); });
  // Do not await library loading here: keep the OAuth popup inside this gesture.
  dialog.querySelector('[data-google-authorize]').addEventListener('click', () => {
    localError = ''; try { service.connect(); } catch (failure) { localError = failure.code; paint(); }
  });
  for (const selector of ['[data-google-dialog-close]','[data-google-dialog-done]']) dialog.querySelector(selector).addEventListener('click', hide);
  dialog.addEventListener('cancel', event => { event.preventDefault(); hide(); });
  return {
    update(value) { const changed = state.uid !== value.uid; state = value; if (changed) { localError = ''; input.value = ''; hide(); } paint(); },
    open(element = document.activeElement) {
      state = service.getState(); if (!state.uid) return;
      opener = element; localError = ''; input.value = service.getClientId() || configuredClientId;
      setup.open = !input.value; paint();
      if (!opened()) { if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', ''); }
      dialog.querySelector('h2').focus();
      if (input.value && !state.canConnect && !state.busy) void service.prepare(input.value).catch(() => {});
    },
    close: hide,
  };
}
