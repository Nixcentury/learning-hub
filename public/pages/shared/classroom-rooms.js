// Presentation only: all reads/writes go through the signed-in Hub and Rules.
(() => {
  const area = document.querySelector('[data-rooms-workspace]');
  const createForm = area.querySelector('[data-create-room]');
  const joinForm = area.querySelector('[data-join-room]');
  const list = area.querySelector('[data-room-list]');
  const detail = area.querySelector('[data-room-detail]');
  const status = area.querySelector('[data-room-list-status]');
  const feedback = area.querySelector('[data-room-feedback]');
  let context, uid, pending, sequence = 0, rendered = '', feedbackKey = '', feedbackError = false;
  const t = (th, en) => context?.language === 'en' ? en : th;
  const messages = {
    'classroom/invalid-name': ['กรุณาใส่ชื่อห้อง 1–100 ตัวอักษร', 'Enter a room name of 1–100 characters.'],
    'classroom/invalid-code': ['กรุณาใส่รหัสห้อง 8 ตัวที่ได้รับจากครู', 'Enter the 8-character code from your teacher.'],
    'classroom/code-not-found': ['ไม่พบรหัสนี้ ตรวจรหัสกับครูแล้วลองใหม่', 'Code not found. Check it with your teacher.'],
    'classroom/teacher-required': ['ต้องยืนยันสิทธิ์ครูก่อนสร้างห้อง', 'Verified teacher access is required to create a room.'],
    'classroom/session-changed': ['บัญชีเปลี่ยนแล้ว กรุณาลองอีกครั้ง', 'Your account changed. Please try again.'],
    'classroom/busy': ['กำลังรอยืนยันรายการเดิม กรุณารอสักครู่', 'Waiting for the previous request to be confirmed.'],
    'classroom/read-timeout': ['โหลดข้อมูลนานกว่าปกติ ตรวจอินเทอร์เน็ตแล้วกดโหลดอีกครั้ง', 'Loading is taking longer than usual. Check your connection and reload.'],
    created: ['สร้างห้องเรียบร้อยแล้ว ส่งรหัสด้านล่างให้นักเรียนได้เลย', 'Room created. Share the code below with your students.'],
    joined: ['เข้าร่วมห้องแล้ว หากเคยเข้าร่วมอยู่แล้ว ระบบจะเปิดห้องเดิมโดยไม่เพิ่มสมาชิกซ้ำ', 'Classroom opened. Rejoining opens the same room without a duplicate membership.'],
    copied: ['คัดลอกรหัสแล้ว', 'Room code copied.'],
    'copy-failed': ['คัดลอกอัตโนมัติไม่ได้ ให้เลือกรหัสแล้วคัดลอกเอง', 'Automatic copy unavailable. Select and copy the code manually.'],
  };
  function message(key) {
    if (/permission.?denied/i.test(key)) return t('ยังอ่านหรือบันทึกห้องไม่ได้ กรุณาตรวจสิทธิ์บัญชีและ Firebase Rules เฟส 1 กับผู้ดูแล แล้วกดโหลดอีกครั้ง', 'Room access was denied. Ask the administrator to check your access and Phase 1 Firebase Rules, then reload.');
    return messages[key] ? t(...messages[key]) : t('ดำเนินการไม่สำเร็จ ตรวจอินเทอร์เน็ตและลองอีกครั้ง ระบบยังไม่ยืนยันการบันทึก', 'Could not complete the request. Check your connection and retry. Saving has not been confirmed.');
  }
  function showFeedback(key, error = false) {
    feedbackKey = key; feedbackError = error;
    feedback.textContent = key ? message(key) : '';
    feedback.hidden = !key; feedback.classList.toggle('is-error', error);
  }
  function element(tag, text, className) {
    const node = document.createElement(tag); node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(text, action, roomId) {
    const node = element('button', text, 'classroom-button');
    node.type = 'button'; node.dataset.roomAction = action;
    if (roomId) node.dataset.roomId = roomId;
    return node;
  }
  function paint() {
    const access = context?.classroom, snapshot = context?.classroomRooms;
    const nextUid = parent !== window && context?.identity?.status === 'signed-in' && access?.uid === context.identity.uid && ['teacher', 'student'].includes(access.state) ? access.uid : null;
    if (uid !== nextUid) {
      uid = nextUid; pending = null; rendered = ''; createForm.reset(); joinForm.reset();
      list.replaceChildren(); detail.replaceChildren(); showFeedback('');
    }
    area.hidden = !uid;
    if (!uid) return;
    createForm.hidden = access.state !== 'teacher';
    const data = snapshot?.uid === uid ? snapshot : null;
    area.classList.toggle('is-in-room', Boolean(data?.selected));
    const saving = Boolean(pending || data?.busy);
    area.querySelectorAll('button,input').forEach(node => { node.disabled = saving; });
    area.setAttribute('aria-busy', String(saving));
    if (saving) {
      feedback.hidden = false; feedback.classList.remove('is-error');
      feedback.textContent = t('กำลังรอการยืนยันจากระบบ กรุณาอย่าปิดหน้านี้…', 'Waiting for server confirmation. Please keep this page open…');
    } else showFeedback(feedbackKey, feedbackError);
    status.classList.toggle('is-error', data?.status === 'error');
    status.textContent = data?.status === 'ready'
      ? (data.rooms.length ? '' : t('ยังไม่มีห้อง เริ่มจากสร้างห้องหรือใส่รหัสที่ครูให้', 'No classrooms yet. Create one or enter your teacher’s code.'))
      : data?.status === 'error' ? message(data.error) : t('กำลังโหลดห้องของคุณ…', 'Loading your classrooms…');
    const signature = JSON.stringify([context.language, data]);
    if (signature === rendered) return;
    rendered = signature;
    list.replaceChildren();
    for (const room of data?.rooms || []) {
      const card = element('article', '', 'classroom-room-card');
      card.append(element('small', room.membership === 'owner' ? t('ห้องที่ฉันสร้าง', 'Created by me') : t('เข้าร่วมแล้ว', 'Joined')),
        element('h3', room.name), button(t('เปิดห้อง', 'Open classroom'), 'open', room.id));
      list.append(card);
    }
    const room = data?.selected;
    detail.hidden = !room; detail.replaceChildren();
    if (room) {
      detail.append(button(t('← กลับรายการห้อง', '← Back to classrooms'), 'back'), element('h2', room.name || t('กำลังเปิดห้อง…', 'Opening classroom…')));
      if (data.roomStatus === 'error') detail.append(element('p', message(data.detailError), 'is-error'), button(t('ลองเปิดห้องอีกครั้ง', 'Retry opening room'), 'open', room.id));
      else if (room.membership === 'owner') {
        const invite = element('div', '', 'classroom-invite');
        const code = element('code', room.joinCode); code.dataset.allowSelection = ''; code.tabIndex = 0;
        invite.append(element('span', t('รหัสเข้าร่วมห้อง', 'Join code')), code, button(t('คัดลอกรหัส', 'Copy code'), 'copy'));
        detail.append(invite, element('h3', t('สมาชิกในห้อง', 'Class members') + ' · ' + data.members.length));
        if (data.roomStatus !== 'ready') detail.append(element('p', t('กำลังโหลดสมาชิก…', 'Loading members…')));
        else if (!data.members.length) detail.append(element('p', t('ยังไม่มีนักเรียนเข้าร่วม ส่งรหัสห้องให้เด็กได้เลย', 'No students yet. Share the room code with your students.')));
        else {
          const roster = element('ul', '', 'classroom-roster');
          for (const member of data.members) {
            const row = element('li', '');
            row.append(element('strong', member.displayName), element('small', new Date(member.joinedAt).toLocaleDateString(context.language === 'en' ? 'en-GB' : 'th-TH')));
            roster.append(row);
          }
          detail.append(roster);
        }
      } else if (room.membership === 'student') detail.append(element('p', t('คุณเข้าร่วมห้องนี้แล้ว เมื่อครูมอบหมายงานในเฟสถัดไป งานของคุณจะแสดงที่นี่', 'You have joined this classroom. Your assignments will appear here in a later phase.')));
    }
    area.querySelectorAll('button,input').forEach(node => { node.disabled = saving; });
  }
  function send(action, payload = {}) {
    if (!uid || pending || context?.classroomRooms?.busy) return;
    const requestId = crypto.randomUUID() + '-' + (++sequence);
    pending = { requestId, action }; showFeedback(''); paint();
    parent.postMessage({ type: 'learning-hub-classroom-command', requestId, uid, action, payload }, location.origin);
  }
  createForm.addEventListener('submit', event => { event.preventDefault(); send('create', { name: createForm.elements.name.value }); });
  joinForm.addEventListener('submit', event => { event.preventDefault(); send('join', { code: joinForm.elements.code.value }); });
  area.addEventListener('click', async event => {
    const target = event.target.closest('[data-room-action]');
    if (!target || target.disabled) return;
    const action = target.dataset.roomAction;
    if (action === 'copy') {
      const requestUid = uid;
      try { await navigator.clipboard.writeText(context.classroomRooms.selected.joinCode); if (uid === requestUid) showFeedback('copied'); }
      catch { if (uid === requestUid) showFeedback('copy-failed', true); }
    } else send(action, { roomId: target.dataset.roomId });
  });
  document.addEventListener('hub-page-context', event => { context = event.detail; paint(); });
  window.addEventListener('message', event => {
    if (parent === window || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-classroom-result' || event.data.uid !== uid || event.data.requestId !== pending?.requestId) return;
    const action = pending.action; pending = null;
    if (event.data.ok) {
      if (action === 'create') { createForm.reset(); showFeedback('created'); }
      else if (action === 'join') { joinForm.reset(); showFeedback('joined'); }
    } else showFeedback(String(event.data.error || ''), true);
    paint();
    if (event.data.ok && ['open', 'create', 'join'].includes(action)) detail.scrollIntoView({ block: 'nearest' });
    if (event.data.ok && action === 'back') area.scrollIntoView({ block: 'start' });
  });
})();
