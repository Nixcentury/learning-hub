// DOM-only classroom panel; authenticated commands are handled by the parent Hub.
(() => {
  let context, root, pending = '', uid = '', feedback = '', feedbackError = false;
  const rows = new Map();
  const t = (th, en) => context?.language === 'en' ? en : th;
  const labels = {
    'not-joined': ['ยังไม่เข้าคาบ', 'Not joined'], visible: ['หน้าเว็บแสดงอยู่', 'Page visible'], hidden: ['หน้าเว็บถูกซ่อน', 'Page hidden'],
    stale: ['ข้อมูลไม่อัปเดต', 'Updates missing'], disconnected: ['ขาดการติดต่อ', 'Disconnected'], left: ['ออกจากคาบแล้ว', 'Left lesson'],
  };
  const el = (tag, text, cls) => { const node = document.createElement(tag); node.textContent = text; if (cls) node.className = cls; return node; };
  function send(action, payload = {}) {
    if (pending || !uid) return;
    pending = crypto.randomUUID(); feedback = ''; feedbackError = false;
    parent.postMessage({ type: 'learning-hub-monitor-command', requestId: pending, uid, action, payload }, location.origin);
    paint();
  }
  function paint() {
    const room = context?.classroomRooms?.selected, data = context?.classroomMonitor;
    const signed = parent !== window && context?.identity?.status === 'signed-in' && context.classroom?.uid === context.identity.uid;
    const nextUid = signed ? context.identity.uid : '';
    if (uid !== nextUid) { uid = nextUid; pending = ''; feedback = ''; rows.clear(); root?.remove(); root = null; }
    const detail = document.querySelector('[data-room-detail]');
    if (!uid || !room || !detail || context.classroomRooms.roomStatus !== 'ready') { root?.remove(); root = null; rows.clear(); return; }
    const target = document.querySelector('[data-room-monitor-slot]') || detail;
    if (!root?.isConnected) {
      rows.clear(); root = el('section', '', 'classroom-monitor'); root.dataset.classroomMonitor = '';
      root.innerHTML = `<div class="classroom-monitor-heading"><h3></h3><span data-monitor-badge></span></div>
        <p data-monitor-description></p><div class="classroom-monitor-controls"><label><span data-monitor-duration-label></span><select data-monitor-duration><option value="30">30</option><option value="45">45</option><option value="60" selected>60</option><option value="90">90</option><option value="120">120</option><option value="180">180</option></select></label><button type="button" class="classroom-button is-primary" data-monitor-lock></button><button type="button" class="classroom-button" data-monitor-student></button></div>
        <button type="button" class="classroom-button" data-monitor-inbox-open hidden></button><p data-monitor-feedback role="status" aria-live="polite"></p><button type="button" class="classroom-button" data-monitor-retry hidden></button>
        <div class="classroom-monitor-filters"><input type="search" data-monitor-search data-allow-selection><select data-monitor-filter><option value="all"></option><option value="attention"></option><option value="visible"></option><option value="not-joined"></option></select></div>
        <div class="classroom-monitor-people" data-monitor-people></div>`;
      target.append(root);
      root.querySelector('[data-monitor-lock]').addEventListener('click', () => send(root.dataset.locked === 'true' ? 'unlock' : 'lock', { roomId: context.classroomRooms.selected.id, minutes: Number(root.querySelector('[data-monitor-duration]').value) }));
      root.querySelector('[data-monitor-student]').addEventListener('click', () => send(context.classroomMonitor?.lesson?.joined && context.classroomMonitor.lesson.roomId === context.classroomRooms.selected.id ? 'leave' : 'join', { roomId: context.classroomRooms.selected.id }));
      root.querySelector('[data-monitor-inbox-open]').addEventListener('click', () => send('inbox', {roomId:context.classroomRooms.selected.id}));
      root.querySelector('[data-monitor-retry]').addEventListener('click', () => send('retry', { roomId: context.classroomRooms.selected.id }));
      root.querySelector('[data-monitor-search]').addEventListener('input', paint);
      root.querySelector('[data-monitor-filter]').addEventListener('change', paint);
      root.addEventListener('click', event => {
        const node = event.target.closest('[data-monitor-row-action]'); if (!node || node.disabled) return;
        send(node.dataset.monitorRowAction, { roomId: context.classroomRooms.selected.id, targetUid: node.dataset.uid, hash: node.dataset.hash });
      });
    }
    if (root.parentElement !== target) target.append(root);
    const owner = room.membership === 'owner' && context.classroom?.state === 'teacher';
    const liveRoom = data?.rooms?.find(value => value.id === room.id), session = liveRoom?.session;
    const ready = data?.uid === uid, locked = Boolean(session), busy = Boolean(pending || data?.busy);
    detail.classList.toggle('has-monitoring-session', owner && locked);
    root.dataset.locked = String(locked);
    root.querySelector('h3').textContent = t('ติดตามคาบเรียน', 'Lesson monitoring') + (owner && locked ? t(` · ${data?.rows?.length || 0} คน`, ` · ${data?.rows?.length || 0} students`) : '');
    root.querySelector('[data-monitor-badge]').textContent = locked ? t('🔒 เปิดติดตาม', '🔒 Monitoring on') : t('🔓 ปลดล็อก · เว็บปกติ', '🔓 Unlocked · ordinary browsing');
    root.querySelector('[data-monitor-description]').textContent = locked
      ? t('ติดตามเฉพาะคาบนี้ · หน้าเว็บถูกซ่อนเกิน 15 วินาทีจึงเตือน · หมดเวลา ', 'This lesson only · hidden for 15 seconds before a reminder · ends ') + new Date(session.endsAt).toLocaleTimeString(context.language === 'en' ? 'en-GB' : 'th-TH', { hour: '2-digit', minute: '2-digit' })
      : t('เมื่อครูกดล็อก จะเปิดการติดตามเฉพาะคาบ ปลดล็อกแล้วกลับเป็นเว็บปกติ', 'Lock starts a monitored lesson. Unlock returns everyone to ordinary browsing.');
    root.querySelector('[data-monitor-duration-label]').textContent = t('เวลาคาบ (นาที)', 'Lesson length (minutes)');
    root.querySelector('[data-monitor-duration]').parentElement.hidden = !owner || locked;
    const lock = root.querySelector('[data-monitor-lock]'); lock.hidden = !owner; lock.textContent = locked ? t('ปลดล็อก · จบคาบ', 'Unlock · end lesson') : t('ล็อก · เริ่มติดตาม', 'Lock · start monitoring');
    lock.disabled = !ready || !data.connected || busy;
    const student = root.querySelector('[data-monitor-student]'); student.hidden = owner || !locked;
    student.textContent = data?.lesson?.joined && data.lesson.roomId === room.id ? t('ออกจากคาบ', 'Leave lesson') : t('เข้าคาบติดตามนี้', 'Join this lesson');
    student.disabled = !ready || !data.connected || busy;
    const inbox = root.querySelector('[data-monitor-inbox-open]');
    inbox.hidden = owner || !locked || !data?.lesson?.joined || data.lesson.roomId !== room.id;
    inbox.textContent = t('ข้อความจากครู', 'Teacher messages'); inbox.disabled = !ready || busy;
    let message = feedback;
    if (busy) message = t('กำลังรอระบบยืนยัน…', 'Waiting for confirmation…');
    else if (data?.error) message = /permission.?denied/i.test(data.error)
      ? t('ยังใช้การติดตามไม่ได้ ต้องตรวจสิทธิ์หรือเปิดใช้ระบบในฐานข้อมูลก่อน', 'Monitoring is unavailable. Check access or install the monitoring database rules.')
      : t('ข้อมูลติดตามยังไม่พร้อม ตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'Monitoring updates are unavailable. Check your connection and retry.');
    else if (ready && !data.connected) message = t('การเชื่อมต่อขาด สถานะยังไม่อัปเดต', 'Connection lost. Status updates are paused.');
    root.querySelector('[data-monitor-feedback]').textContent = message;
    root.querySelector('[data-monitor-feedback]').classList.toggle('is-error', Boolean(data?.error || feedbackError));
    const retry = root.querySelector('[data-monitor-retry]'); retry.hidden = !data?.error; retry.disabled = busy;
    retry.textContent = t('ลองเชื่อมต่อการติดตามอีกครั้ง', 'Reconnect lesson monitoring');
    const filters = root.querySelector('.classroom-monitor-filters'); filters.hidden = !owner || !locked;
    const search = root.querySelector('[data-monitor-search]'); search.placeholder = t('ค้นหานักเรียน', 'Find a student'); search.setAttribute('aria-label', search.placeholder);
    const filter = root.querySelector('[data-monitor-filter]'); filter.setAttribute('aria-label', t('กรองสถานะ', 'Filter by status'));
    for (const [value, th, en] of [['all','ทุกคน','Everyone'],['attention','มีเหตุเตือน / ข้อมูลขาด','Reminders / missing updates'],['visible','หน้าเว็บแสดงอยู่','Page visible'],['not-joined','ยังไม่เข้าคาบ','Not joined']]) filter.querySelector(`[value="${value}"]`).textContent = t(th, en);
    const list = root.querySelector('[data-monitor-people]'); list.hidden = !owner || !locked;
    const values = owner && locked && data?.selectedRoomId === room.id ? data.rows || [] : [];
    const keep = new Set();
    for (const value of values) {
      keep.add(value.uid); let row = rows.get(value.uid);
      if (!row) {
        row = el('article', '', 'classroom-monitor-person'); row.dataset.monitorUid = value.uid;
        row.innerHTML = '<div><strong class="monitor-person-name"></strong><span class="monitor-person-status"></span></div><button type="button" class="monitor-person-location" data-monitor-row-action="open-location"></button><small class="monitor-person-time"></small><p class="monitor-person-message"></p><button type="button" class="classroom-button" data-monitor-row-action="compose"></button>';
        for (const node of row.querySelectorAll('button')) node.dataset.uid = value.uid;
        rows.set(value.uid, row); list.append(row);
      }
      row.dataset.status = value.status;
      row.querySelector('.monitor-person-name').textContent = value.displayName;
      row.querySelector('.monitor-person-status').textContent = t(...(labels[value.status] || labels.stale));
      const place = row.querySelector('.monitor-person-location'); place.textContent = value.location ? (context.language === 'en' ? value.location.titleEn : value.location.titleTh) : t('ยังไม่มีตำแหน่งของคาบนี้', 'No lesson location yet');
      place.dataset.hash = value.location?.hash || ''; place.disabled = !value.location;
      row.querySelector('.monitor-person-time').textContent = value.lastSeenAt ? t('อัปเดตล่าสุด ', 'Last update ') + new Date(value.lastSeenAt).toLocaleTimeString(context.language === 'en' ? 'en-GB' : 'th-TH') + (value.windows > 1 ? t(` · ${value.windows} หน้าต่าง`, ` · ${value.windows} windows`) : '') : '';
      const notice = value.notices?.[0], incident = value.incident;
      const pieces = [];
      if (incident) pieces.push(incident.ackAt ? t('รับทราบเหตุเตือนแล้ว', 'Reminder acknowledged') : incident.resolvedAt ? t('กลับมาแล้ว · รอรับทราบ', 'Returned · awaiting acknowledgement') : t('มีเหตุเตือน · รอรับทราบ', 'Reminder · awaiting acknowledgement'));
      if (notice) pieces.push(notice.ackAt ? t('ข้อความ: รับทราบแล้ว', 'Message: acknowledged') : notice.deliveredAt ? t('ข้อความ: แสดงบนหน้าเด็กแล้ว', 'Message: displayed to student') : t('ข้อความ: ส่งแล้ว', 'Message: sent'));
      if (notice?.reply) pieces.push(t('ตอบ: ', 'Reply: ') + notice.reply);
      row.querySelector('.monitor-person-message').textContent = pieces.join(' · ');
      const nudge = row.querySelector('[data-monitor-row-action="compose"]'); nudge.textContent = t('สะกิด / ข้อความ', 'Nudge / message');
      nudge.disabled = busy || !data.connected || ['not-joined','left'].includes(value.status);
      const attention = Boolean(incident && !incident.ackAt) || ['hidden','stale','disconnected'].includes(value.status);
      row.hidden = !value.displayName.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()) || (filter.value === 'attention' ? !attention : filter.value !== 'all' && filter.value !== value.status);
    }
    for (const [id, row] of rows) if (!keep.has(id)) { row.remove(); rows.delete(id); }
  }
  document.addEventListener('hub-page-context', event => { context = event.detail; paint(); });
  window.addEventListener('message', event => {
    if (parent === window || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-monitor-result' || event.data.uid !== uid || event.data.requestId !== pending) return;
    pending = ''; feedbackError = !event.data.ok;
    feedback = event.data.ok ? '' : t('ยังไม่ยืนยันรายการ กรุณาตรวจการเชื่อมต่อหรือสิทธิ์แล้วลองอีกครั้ง', 'Not confirmed. Check your connection or access and retry.'); paint();
  });
})();
