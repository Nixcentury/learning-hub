// Presentation only: all reads/writes go through the signed-in Hub and Rules.
(() => {
  const area = document.querySelector('[data-rooms-workspace]');
  const createForm = area.querySelector('[data-create-room]');
  const joinForm = area.querySelector('[data-join-room]');
  const list = area.querySelector('[data-room-list]');
  const detail = area.querySelector('[data-room-detail]');
  const status = area.querySelector('[data-room-list-status]');
  const feedback = area.querySelector('[data-room-feedback]');
  let context, uid, pending, sequence = 0, rendered = '', feedbackKey = '', feedbackError = false, emailDraft = '', draftRoom = '', confirming = '';
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
    'classroom/invalid-email': ['กรุณาใส่อีเมลที่นักเรียนใช้เข้า Hub', 'Enter the email the student uses to sign in to Hub.'],
    'classroom/owner-required': ['เฉพาะครูเจ้าของห้องจัดการสมาชิกได้', 'Only the classroom owner can manage members.'],
    'classroom/removed': ['ครูนำคุณออกจากห้องนี้แล้ว กรุณาติดต่อครูเพื่อขอเข้าร่วมอีกครั้ง', 'Your teacher removed you from this room. Contact them to rejoin.'],
    'classroom/roster-unavailable': ['ยังจัดการสมาชิกไม่ได้ กรุณาตรวจ Rules ชุดจัดการสมาชิกกับผู้ดูแลแล้วโหลดใหม่', 'Member management is unavailable. Ask the administrator to apply the roster Rules, then reload.'],
    'classroom/invite-self': ['ไม่ต้องเพิ่มอีเมลตัวเอง คุณเป็นเจ้าของห้องอยู่แล้ว', 'You already own this classroom.'],
    'classroom/member-unavailable': ['รายชื่อเปลี่ยนแล้ว กรุณาโหลดอีกครั้ง', 'The member list changed. Please reload.'],
    'classroom/invalid-invitation': ['รายการรอเปลี่ยนแล้ว กรุณาโหลดอีกครั้ง', 'The pending entry changed. Please reload.'],
    invited: ['บันทึกอีเมลแล้ว เด็กจะเข้าห้องเมื่อเข้า Hub ด้วยบัญชีนี้ หากเคยถูกนำออก ระบบคืนสมาชิกเดิมให้แล้ว', 'Email saved. The student joins when signing in to Hub with this account. Previously removed members are restored.'],
    'removed-member': ['นำออกจากห้องแล้ว เก็บคะแนนและงานเดิมไว้ และใช้รหัสกลับเข้าเองไม่ได้', 'Removed from the room. Previous scores and work are retained; the code cannot be used to rejoin.'],
    'restored-member': ['คืนสมาชิกเข้าห้องแล้ว คะแนนและประวัติเดิมยังอยู่', 'Membership restored. Previous scores and work are retained.'],
    'cancelled-invite': ['ยกเลิกรายการรอแล้ว', 'Pending entry cancelled.'],
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
      document.body.classList.remove('classroom-has-room');
    }
    area.hidden = !uid;
    if (!uid) return;
    createForm.hidden = access.state !== 'teacher';
    const data = snapshot?.uid === uid ? snapshot : null;
    area.classList.toggle('is-in-room', Boolean(data?.selected));
    document.body.classList.toggle('classroom-has-room', Boolean(data?.selected));
    const saving = Boolean(pending || data?.busy);
    area.querySelectorAll('button,input').forEach(node => { node.disabled = saving || (Boolean(node.closest('.classroom-roster-details')) && node.dataset.roomAction !== 'open' && data?.rosterStatus !== 'ready'); });
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
    const detailsOpen = detail.querySelector('.classroom-roster-details')?.open;
    const focusedEmail = document.activeElement?.matches('[data-student-email]');
    rendered = signature;
    list.replaceChildren();
    for (const room of data?.rooms || []) {
      const card = element('article', '', 'classroom-room-card');
      card.append(element('small', room.membership === 'owner' ? t('ห้องที่ฉันสร้าง', 'Created by me') : t('เข้าร่วมแล้ว', 'Joined')),
        element('h3', room.name), button(t('เปิดห้อง', 'Open classroom'), 'open', room.id));
      list.append(card);
    }
    const room = data?.selected;
    if (draftRoom !== room?.id) { draftRoom = room?.id || ''; emailDraft = ''; confirming = ''; }
    detail.hidden = !room; detail.replaceChildren();
    if (room) {
      detail.append(button(t('← กลับรายการห้อง', '← Back to classrooms'), 'back'), element('h2', room.name || t('กำลังเปิดห้อง…', 'Opening classroom…')));
      if (data.roomStatus === 'error') detail.append(element('p', message(data.detailError), 'is-error'), button(t('ลองเปิดห้องอีกครั้ง', 'Retry opening room'), 'open', room.id));
      else if (room.membership === 'owner') {
        const invite = element('div', '', 'classroom-invite');
        const code = element('code', room.joinCode); code.dataset.allowSelection = ''; code.tabIndex = 0;
        invite.append(element('span', t('รหัสเข้าร่วมห้อง', 'Join code')), code, button(t('คัดลอกรหัส', 'Copy code'), 'copy'));
        const members = element('details', '', 'classroom-roster-details');
        members.open = Boolean(detailsOpen);
        members.append(element('summary', t('สมาชิกในห้อง', 'Class members') + ' · ' + data.members.length));
        detail.append(invite, members);
        const form = element('form', '', 'classroom-roster-form'); form.dataset.inviteStudent = '';
        const label = element('label', t('เพิ่มนักเรียนด้วยอีเมลที่ใช้เข้า Hub', 'Add a student by their Hub sign-in email'));
        const input = document.createElement('input'); input.type = 'email'; input.required = true; input.maxLength = 254;
        input.name = 'email'; input.autocomplete = 'off'; input.dataset.studentEmail = ''; input.value = emailDraft;
        label.append(input);
        const add = element('button', t('เพิ่มนักเรียน', 'Add student'), 'classroom-button'); add.type = 'submit';
        form.append(label, add, element('small', t('เพิ่มไว้ก่อนได้ เด็กจะเข้าห้องเมื่อเข้า Hub ด้วยอีเมลตรงกัน ไม่ต้องกรอกรหัสห้อง', 'Students join when they sign in to Hub with this email, even if they have never used Hub. No room code is needed.')));
        members.append(form);
        if (data.rosterError) members.append(element('p', message('classroom/roster-unavailable'), 'is-error'), button(t('โหลดสมาชิกอีกครั้ง', 'Reload members'), 'open', room.id));
        else if (data.rosterStatus !== 'ready') members.append(element('p', t('กำลังโหลดรายการเพิ่มด้วยอีเมล…', 'Loading email entries…')));
        if (data.roomStatus !== 'ready') members.append(element('p', t('กำลังโหลดสมาชิก…', 'Loading members…')));
        else if (!data.members.length) members.append(element('p', t('ยังไม่มีนักเรียนเข้าร่วม ส่งรหัสห้องให้เด็กได้เลย', 'No students yet. Share the room code with your students.')));
        else {
          const roster = element('ul', '', 'classroom-roster');
          for (const member of data.members) {
            const row = element('li', '');
            row.append(element('strong', member.displayName), element('small', member.email || t('เข้าด้วยรหัสห้อง', 'Joined by room code')), element('small', new Date(member.joinedAt).toLocaleDateString(context.language === 'en' ? 'en-GB' : 'th-TH')));
            const remove = button(confirming === member.uid ? t('ยืนยันนำออก', 'Confirm removal') : t('นำออก', 'Remove'), 'remove-member', room.id);
            remove.dataset.memberUid = member.uid; row.append(remove);
            if (confirming === member.uid) row.append(button(t('ยกเลิก', 'Cancel'), 'cancel-confirmation', room.id));
            roster.append(row);
          }
          members.append(roster);
        }
        const pendingInvites = (data.invitations || []).filter(item => !(data.members || []).some(member => member.invitationId === item.id || member.email === item.email) && !(data.removed || []).some(item2 => item2.member.invitationId === item.id || item2.member.email === item.email));
        if (pendingInvites.length) {
          members.append(element('h4', t('รอเข้า Hub', 'Waiting for Hub sign-in')));
          const list = element('ul', '', 'classroom-roster');
          for (const item of pendingInvites) {
            const row = element('li', ''); row.append(element('span', item.email));
            const cancel = button(t('ยกเลิกรายการรอ', 'Cancel pending entry'), 'cancel-invite', room.id); cancel.dataset.invitationId = item.id;
            row.append(cancel); list.append(row);
          }
          members.append(list);
        }
        if (data.removed?.length) {
          members.append(element('h4', t('นำออกจากห้องแล้ว', 'Removed members')));
          const list = element('ul', '', 'classroom-roster');
          for (const item of data.removed) {
            const row = element('li', ''); row.append(element('strong', item.member.displayName), element('small', item.member.email || ''));
            const restore = button(t('คืนสมาชิก', 'Restore member'), 'restore-member', room.id); restore.dataset.memberUid = item.uid;
            row.append(restore); list.append(row);
          }
          members.append(list);
        }
      } else if (room.membership === 'student') detail.append(element('p', t('คุณเข้าร่วมห้องนี้แล้ว ดูโพสต์งานที่ครูมอบหมายได้ด้านล่าง', 'You have joined this classroom. Your assigned homework appears below.')));
    }
    area.querySelectorAll('button,input').forEach(node => { node.disabled = saving || (Boolean(node.closest('.classroom-roster-details')) && node.dataset.roomAction !== 'open' && data?.rosterStatus !== 'ready'); });
    if (!saving && focusedEmail) detail.querySelector('[data-student-email]')?.focus();
  }
  function send(action, payload = {}) {
    if (!uid || pending || context?.classroomRooms?.busy) return;
    const requestId = crypto.randomUUID() + '-' + (++sequence);
    pending = { requestId, action }; showFeedback(''); paint();
    parent.postMessage({ type: 'learning-hub-classroom-command', requestId, uid, action, payload }, location.origin);
  }
  createForm.addEventListener('submit', event => { event.preventDefault(); send('create', { name: createForm.elements.name.value }); });
  joinForm.addEventListener('submit', event => { event.preventDefault(); send('join', { code: joinForm.elements.code.value }); });
  area.addEventListener('input', event => { if (event.target.matches('[data-student-email]')) emailDraft = event.target.value; });
  area.addEventListener('submit', event => {
    if (!event.target.matches('[data-invite-student]')) return;
    event.preventDefault(); send('invite', { roomId: context.classroomRooms.selected.id, email: emailDraft });
  });
  area.addEventListener('click', async event => {
    const target = event.target.closest('[data-room-action]');
    if (!target || target.disabled) return;
    const action = target.dataset.roomAction;
    if (action === 'copy') {
      const requestUid = uid;
      try { await navigator.clipboard.writeText(context.classroomRooms.selected.joinCode); if (uid === requestUid) showFeedback('copied'); }
      catch { if (uid === requestUid) showFeedback('copy-failed', true); }
    } else if (action === 'cancel-confirmation') { confirming = ''; rendered = ''; paint(); }
    else if (action === 'remove-member' && confirming !== target.dataset.memberUid) { confirming = target.dataset.memberUid; rendered = ''; paint(); }
    else send(action, { roomId: target.dataset.roomId, memberUid: target.dataset.memberUid, invitationId: target.dataset.invitationId });
  });
  document.addEventListener('hub-page-context', event => { context = event.detail; paint(); });
  window.addEventListener('message', event => {
    if (parent === window || event.source !== parent || event.origin !== location.origin || event.data?.type !== 'learning-hub-classroom-result' || event.data.uid !== uid || event.data.requestId !== pending?.requestId) return;
    const action = pending.action; pending = null;
    if (event.data.ok) {
      if (action === 'create') { createForm.reset(); showFeedback('created'); }
      else if (action === 'join') { joinForm.reset(); showFeedback('joined'); }
      else if (action === 'invite') { emailDraft = ''; rendered = ''; showFeedback('invited'); }
      else if (action === 'remove-member') { confirming = ''; showFeedback('removed-member'); }
      else if (action === 'restore-member') showFeedback('restored-member');
      else if (action === 'cancel-invite') showFeedback('cancelled-invite');
    } else showFeedback(String(event.data.error || ''), true);
    paint();
    if (event.data.ok && ['open', 'create', 'join'].includes(action)) detail.scrollIntoView({ block: 'nearest' });
    if (event.data.ok && action === 'back') area.scrollIntoView({ block: 'start' });
  });
})();
