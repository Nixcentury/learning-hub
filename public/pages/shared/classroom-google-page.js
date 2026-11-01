import { googleClassroomMessage } from '../../shared/classroom-google-model.js';
const root = document.querySelector('[data-google-classroom-panel]');
let context, uid = '', signature = '';
const t = (th, en) => context?.language === 'en' ? en : th;
const el = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
function paint() {
  const identity = context?.identity, access = context?.classroom;
  uid = parent !== window && identity?.status === 'signed-in' && identity.uid && access?.uid === identity.uid && access.state === 'teacher' ? identity.uid : '';
  const data = uid && context?.classroomGoogle?.uid === uid ? context.classroomGoogle : null;
  root.hidden = !uid;
  root.querySelector('[data-google-heading]').textContent = t('Google Classroom', 'Google Classroom');
  root.querySelector('[data-google-note]').textContent = t('เชื่อมบัญชีครูโรงเรียนเพื่อดูห้องที่กำลังเปิดใช้งาน รอบนี้อ่านรายชื่อห้องอย่างเดียว', 'Connect your school teacher account to view active courses. This step reads courses only.');
  const failure = data?.error;
  const status = root.querySelector('[data-google-feedback]');
  const texts = { preparing: t('กำลังเตรียมการเชื่อมต่อ…', 'Preparing connection…'), authorizing: t('รออนุญาตจากบัญชี Google…', 'Waiting for Google authorization…'), loading: t('กำลังอ่านรายชื่อห้อง…', 'Loading courses…') };
  status.textContent = failure ? googleClassroomMessage(failure, context.language) : texts[data?.status] || (data?.status === 'connected' && !data.courses.length ? t('ไม่พบห้องที่บัญชีนี้เป็นครูและกำลังเปิดใช้งาน ตรวจบัญชีที่เลือกได้ด้านล่าง', 'No active courses found for this teacher account. Check the connected account below.') : '');
  status.classList.toggle('is-error', Boolean(failure));
  const account = root.querySelector('[data-google-account]');
  account.textContent = data?.account ? t('บัญชีที่เชื่อม: ', 'Connected account: ') + data.account.email : '';
  root.querySelector('[data-google-connect]').textContent = data?.account ? t('เปลี่ยนบัญชี Google', 'Change Google account') : t('เชื่อม Google Classroom', 'Connect Google Classroom');
  root.querySelector('[data-google-reload]').textContent = t('โหลดรายชื่อห้องอีกครั้ง', 'Reload courses');
  root.querySelector('[data-google-disconnect]').textContent = t('ยกเลิกการเชื่อมต่อครั้งนี้', 'Disconnect this session');
  root.querySelector('[data-google-session-note]').textContent = t('สิทธิ์ใช้เฉพาะแท็บนี้จนหมดอายุ เปิดใหม่ให้เชื่อมอีกครั้ง', 'Access is kept only in this tab until it expires. Reconnect after reopening.');
  root.querySelector('[data-google-reload]').hidden = !data?.account;
  root.querySelector('[data-google-disconnect]').hidden = !data?.account && !data?.busy;
  root.querySelectorAll('button').forEach(button => { button.disabled = Boolean(data?.busy); });
  root.querySelector('[data-google-disconnect]').disabled = false;
  const next = JSON.stringify([uid, context?.language, data?.courses]);
  if (next !== signature) {
    signature = next; const list = root.querySelector('[data-google-courses]'); list.replaceChildren();
    for (const course of data?.courses || []) {
      const row = el('li', ''); row.dataset.googleCourseId = course.id;
      row.append(el('strong', course.name));
      const meta = [course.section, course.room].filter(Boolean).join(' · '); if (meta) row.append(el('small', meta));
      if (course.link) {
        try { const url = new URL(course.link); if (url.origin === 'https://classroom.google.com' && !url.username && !url.password) { const link = el('a', t('เปิดใน Google Classroom', 'Open in Google Classroom')); link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; row.append(link); } } catch { /* Never create an unsafe link. */ }
      }
      list.append(row);
    }
  }
}
root.addEventListener('click', event => {
  const button = event.target.closest('[data-google-action]'); if (!button || button.disabled || !uid) return;
  parent.postMessage({ type: 'learning-hub-google-classroom-action', uid, action: button.dataset.googleAction }, location.origin);
});
document.addEventListener('hub-page-context', event => { context = event.detail; paint(); });
if (parent !== window) parent.postMessage({ type: 'learning-hub-page-ready' }, location.origin);
