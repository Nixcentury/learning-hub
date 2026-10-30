import { assignmentHash } from './classroom-assignment-model.js';

export function createAssignmentNotice({ getLanguage, navigate }) {
  const notice = document.createElement('aside'); notice.className = 'assignment-notice'; notice.hidden = true;
  const text = document.createElement('span'), button = document.createElement('button');
  button.type = 'button'; notice.append(text, button);
  document.querySelector('#hub-route-notice').before(notice);
  const badge = document.createElement('small'); badge.className = 'assignment-badge'; badge.hidden = true;
  document.querySelector('[data-section="classroom"]').append(badge);
  let snapshot = {};
  function paint() {
    const count = snapshot.unread?.length || 0, en = getLanguage() === 'en';
    notice.hidden = badge.hidden = !count;
    badge.textContent = String(count);
    badge.setAttribute('aria-label', en ? `${count} new assignments` : `การบ้านใหม่ ${count} งาน`);
    text.textContent = en ? `You have ${count} unread assignment(s) in your classrooms.` : `มีการบ้านใหม่ที่ยังไม่ได้อ่าน ${count} งานในห้องเรียนของคุณ`;
    button.textContent = en ? 'View homework' : 'ดูการบ้าน';
  }
  button.addEventListener('click', () => {
    const item = snapshot.unread?.[0]; if (item) navigate(assignmentHash(item.roomId, item.id));
  });
  return { update(value) { snapshot = value || {}; paint(); }, refresh: paint };
}
