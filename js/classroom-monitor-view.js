// Lives in the Hub, so lesson messages survive subject/iframe navigation.
export function createMonitorView({ getLanguage, command, onClassroom }) {
  const host = document.createElement('aside'); host.className = 'monitor-banner'; host.hidden = true;
  host.innerHTML = '<span class="monitor-banner-text" role="status"></span><button type="button" data-monitor-open></button>';
  document.body.append(host);
  const dialog = document.createElement('dialog'); dialog.className = 'monitor-dialog'; dialog.setAttribute('aria-labelledby', 'monitor-dialog-title');
  dialog.innerHTML = `<header><h2 id="monitor-dialog-title"></h2><button type="button" data-monitor-close aria-label="Close">×</button></header>
    <p class="monitor-feedback" role="status"></p><div data-monitor-inbox></div>
    <form data-monitor-compose hidden><label for="monitor-message"></label><textarea id="monitor-message" maxlength="300" required rows="3" data-allow-selection></textarea><button type="submit"></button></form>`;
  document.body.append(dialog);
  const inbox = dialog.querySelector('[data-monitor-inbox]'), composeForm = dialog.querySelector('form'), textarea = dialog.querySelector('textarea');
  const feedback = dialog.querySelector('.monitor-feedback');
  let snapshot = {}, composing = null, rendered = '', feedbackCode = '', localBusy = false, returnFocus = null;
  const deliveryAttempts = new Set(), drafts = new Map();
  const t = (th, en) => getLanguage() === 'en' ? en : th;
  const element = (tag, text, className) => { const node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node; };
  function button(text, action, payload) {
    const node = element('button', text); node.type = 'button'; node.dataset.monitorAction = action;
    node._monitorPayload = payload; return node;
  }
  function errorText(code) {
    if (/permission.?denied/i.test(code)) return t('ยังใช้การติดตามคาบไม่ได้ ต้องตรวจสิทธิ์หรือเปิดใช้กติกาฐานข้อมูลของระบบนี้ก่อน', 'Lesson monitoring is unavailable. Check access and install the monitoring database rules.');
    const messages = {
      'monitor/offline': ['การเชื่อมต่อขาด รอให้กลับมาแล้วลองอีกครั้ง', 'Connection lost. Reconnect and try again.'],
      'monitor/not-locked': ['คาบนี้จบแล้ว กลับไปใช้เว็บได้ตามปกติ', 'This lesson has ended. Continue using the Hub normally.'],
      'monitor/invalid-message': ['ใส่ข้อความ 1–300 ตัวอักษร', 'Enter a message of 1–300 characters.'],
      'monitor/message-limit': ['คาบนี้ส่งข้อความถึงคนนี้ครบ 20 รายการแล้ว', 'This student has reached the 20-message lesson limit.'],
      'monitor/another-lesson': ['ออกจากคาบเดิมก่อนเข้าคาบใหม่', 'Leave your current lesson before joining another.'],
      'monitor/session-changed': ['บัญชีเปลี่ยนแล้ว กรุณาลองอีกครั้ง', 'Your account changed. Please try again.'],
      'monitor/not-participant': ['นักเรียนยังไม่เข้าคาบ หรือออกจากคาบแล้ว', 'The student has not joined this lesson or has left.'],
      'monitor/owner-required': ['ต้องเป็นครูเจ้าของห้อง', 'Only the classroom owner can do this.'],
      sent: ['ส่งข้อความแล้ว', 'Message sent.'], received: ['บันทึกการรับทราบแล้ว', 'Acknowledgement saved.'],
    };
    return messages[code] ? t(...messages[code]) : code ? t('ยังไม่ยืนยันรายการ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง', 'Not confirmed. Check your connection and retry.') : '';
  }
  async function perform(action, payload) {
    if (localBusy) return;
    const user = snapshot.uid; localBusy = true; feedbackCode = ''; render();
    try {
      await command(action, payload, user);
      if (snapshot.uid !== user) return;
      feedbackCode = action === 'nudge' ? 'sent' : ['ack', 'ack-incident'].includes(action) ? 'received' : '';
      if (action === 'nudge') textarea.value = '';
    } catch (failure) { if (snapshot.uid === user) feedbackCode = failure?.code || failure?.message || 'monitor/unavailable'; }
    finally { localBusy = false; rendered = ''; render(); }
  }
  function show() { returnFocus = document.activeElement; if (!dialog.open) dialog.showModal(); rendered = ''; render(); }
  function render() {
    const current = snapshot.lesson?.joined ? snapshot.lesson : null;
    const ownerRoom = snapshot.rooms?.find(room => room.id === snapshot.selectedRoomId && room.ownerUid === snapshot.uid);
    const available = (snapshot.rooms || []).filter(room => room.session && room.ownerUid && room.ownerUid !== snapshot.uid);
    const teacherActive = Boolean(ownerRoom?.session);
    host.hidden = !snapshot.uid || (!current && !teacherActive && !available.length);
    let label = '';
    if (current) {
      const waiting = Boolean(snapshot.selfIncident && !snapshot.selfIncident.ackAt) || (snapshot.selfNotices || []).some(item => !item.ackAt);
      label = waiting ? t(`🔔 คาบ ${current.name} · มีข้อความรอรับทราบ`, `🔔 ${current.name} · acknowledgement requested`) : t(`🔒 คาบ ${current.name} · เปิดติดตาม`, `🔒 ${current.name} · lesson monitoring on`);
    }
    else if (teacherActive) {
      const waiting = (snapshot.rows || []).filter(row => row.incident && !row.incident.ackAt || row.notices?.some(item => !item.ackAt)).length;
      label = t(`🔒 ${ownerRoom.name} · รอรับทราบ ${waiting} คน`, `🔒 ${ownerRoom.name} · ${waiting} awaiting acknowledgement`);
    } else label = t(`มีคาบติดตามเปิดอยู่ ${available.length} ห้อง`, `${available.length} classroom lesson(s) available`);
    if (!snapshot.connected && !host.hidden) label += t(' · การเชื่อมต่อขาด', ' · connection lost');
    host.querySelector('span').textContent = label;
    host.querySelector('button').textContent = teacherActive ? t('ดูคาบ', 'View lesson') : current ? t('ข้อความ / สะกิด', 'Messages') : t('เลือกเข้าคาบ', 'Join lesson');
    dialog.querySelector('h2').textContent = composing ? t(`สะกิด ${composing.name}`, `Nudge ${composing.name}`) : t('คาบเรียนและข้อความ', 'Lesson and messages');
    dialog.querySelector('[data-monitor-close]').setAttribute('aria-label', t('ปิด', 'Close'));
    feedback.textContent = localBusy || snapshot.busy ? t('กำลังรอระบบยืนยัน…', 'Waiting for confirmation…') : errorText(feedbackCode);
    composeForm.hidden = !composing;
    composeForm.querySelector('label').textContent = t('ข้อความสั้นถึงนักเรียน (ไม่เกิน 300 ตัวอักษร)', 'Message to the student (up to 300 characters)');
    composeForm.querySelector('button').textContent = t('ส่งสะกิด', 'Send nudge');
    const conversation = composing ? (snapshot.rows || []).find(row => row.uid === composing.uid)?.notices || [] : [];
    const signature = JSON.stringify([getLanguage(), snapshot.uid, current, available, snapshot.selfIncident, snapshot.selfNotices, composing, conversation, teacherActive, localBusy, snapshot.busy]);
    if (signature !== rendered) {
      rendered = signature;
      inbox.querySelectorAll('[data-monitor-reply]').forEach(form => drafts.set(form.dataset.monitorReply, form.elements.reply.value));
      inbox.replaceChildren();
      if (composing) {
        if (!conversation.length) inbox.append(element('p', t('ยังไม่มีข้อความในคาบนี้', 'No messages in this lesson yet.')));
        for (const item of conversation) {
          const card = element('article', '', 'monitor-message');
          card.append(element('strong', t('คุณส่ง', 'You sent')), element('p', item.text), element('small', item.ackAt ? t('รับทราบแล้ว', 'Acknowledged') : item.deliveredAt ? t('แสดงบนหน้าเด็กแล้ว', 'Displayed to student') : t('ส่งแล้ว', 'Sent')));
          if (item.reply) card.append(element('p', t('นักเรียนตอบ: ', 'Student reply: ') + item.reply));
          inbox.append(card);
        }
      } else {
        if (teacherActive) inbox.append(element('p', t('ดูตำแหน่งนักเรียนและส่งสะกิดได้ที่ห้องเรียน', 'Open your classroom to view locations and nudge students.')), button(t('เปิดห้องเรียน', 'Open classroom'), 'classroom', {}));
        if (!current) for (const room of available) {
          const card = element('article', '', 'monitor-message');
          card.append(element('strong', room.name), element('p', t('เมื่อเข้าคาบ ระบบจะรายงานหน้าที่เปิดและสถานะการแสดงเว็บจนกว่าครูปลดล็อกหรือหมดเวลา', 'Joining reports your Hub location and page visibility until the lesson is unlocked or expires.')),
            button(t('เข้าคาบนี้', 'Join this lesson'), 'join', { roomId: room.id })); inbox.append(card);
        }
        if (current) {
          inbox.append(element('p', t('การติดตามทำงานเฉพาะคาบนี้ ข้อความและคำตอบใน Quiz ยังอยู่ตามเดิม', 'Monitoring applies to this lesson. Your quiz work stays in place.')),
            button(t('ออกจากคาบ', 'Leave lesson'), 'leave', { roomId: current.roomId }));
          const incident = snapshot.selfIncident;
          if (incident && !incident.ackAt) {
            const card = element('article', '', 'monitor-message is-reminder');
            card.append(element('strong', t('สะกิดกลับเข้ากิจกรรม', 'Lesson reminder')),
              element('p', incident.type === 'hidden' ? t('ช่วงหนึ่งหน้า Learning Hub ถูกซ่อน กลับมาทำกิจกรรมต่อได้เลย', 'The Hub page was hidden for a while. Continue your activity when ready.') : t('ช่วงหนึ่งระบบขาดข้อมูลการเชื่อมต่อ หากมีปัญหาบอกครูได้', 'Connection updates were missing for a while. Let your teacher know if you need help.')),
              button(t('รับทราบ กลับมาแล้ว', 'Acknowledge — I am back'), 'ack-incident', { roomId: current.roomId, id: incident.id })); inbox.append(card);
          }
          for (const item of snapshot.selfNotices || []) {
            const card = element('article', '', 'monitor-message');
            card.append(element('strong', t('ข้อความจากครู', 'Teacher message')), element('p', item.text));
            if (!item.ackAt) card.append(button(t('รับทราบ', 'Acknowledge'), 'ack', { roomId: current.roomId, id: item.id }));
            else card.append(element('small', t('รับทราบแล้ว', 'Acknowledged')));
            if (item.reply) card.append(element('p', t(`คุณตอบ: ${item.reply}`, `Your reply: ${item.reply}`)));
            else {
              const form = document.createElement('form'); form.dataset.monitorReply = item.id;
              const input = document.createElement('input'); input.name = 'reply'; input.maxLength = 300; input.required = true; input.dataset.allowSelection = '';
              input.setAttribute('aria-label', t('ตอบครู', 'Reply to teacher')); input.placeholder = t('ตอบครูสั้น ๆ หรือขอความช่วยเหลือ', 'Reply or ask for help');
              input.value = drafts.get(item.id) || '';
              const send = element('button', t('ตอบ', 'Reply')); send.type = 'submit'; form.append(input, send); card.append(form);
            }
            inbox.append(card);
          }
          if (!(snapshot.selfNotices || []).length && !snapshot.selfIncident) inbox.append(element('p', t('ยังไม่มีข้อความจากครู', 'No teacher messages yet.')));
        }
        if (!current && !teacherActive && !available.length) inbox.append(element('p', t('ไม่มีคาบติดตามที่เปิดอยู่ ใช้งานเว็บต่อได้ตามปกติ', 'No monitored lesson is open. Continue using the Hub normally.')));
      }
    }
    dialog.querySelectorAll('button,input,textarea').forEach(node => { node.disabled = (localBusy || Boolean(snapshot.busy) || !snapshot.connected) && !node.hasAttribute('data-monitor-close'); });
    if (dialog.open && document.visibilityState === 'visible' && current && !localBusy && !snapshot.busy) {
      const next = (snapshot.selfNotices || []).find(item => !item.deliveredAt && !deliveryAttempts.has(item.id));
      if (next) {
        deliveryAttempts.add(next.id);
        queueMicrotask(() => { if (dialog.open && snapshot.uid && !localBusy) void perform('delivered', { roomId: current.roomId, id: next.id }); });
      }
    }
  }
  host.querySelector('button').addEventListener('click', show);
  dialog.querySelector('[data-monitor-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { composing = null; textarea.value = ''; returnFocus?.focus?.(); });
  dialog.addEventListener('click', event => {
    const node = event.target.closest('[data-monitor-action]'); if (!node || node.disabled) return;
    if (node.dataset.monitorAction === 'classroom') { dialog.close(); onClassroom(); }
    else void perform(node.dataset.monitorAction, node._monitorPayload);
  });
  composeForm.addEventListener('submit', event => { event.preventDefault(); if (composing) void perform('nudge', { roomId: composing.roomId, targetUid: composing.uid, text: textarea.value }); });
  inbox.addEventListener('submit', event => {
    const form = event.target.closest('[data-monitor-reply]'); if (!form) return;
    event.preventDefault(); void perform('reply', { roomId: snapshot.lesson?.roomId, id: form.dataset.monitorReply, text: form.elements.reply.value });
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
  return { update(value) {
    const previousUid = snapshot.uid, oldLesson = snapshot.lesson?.id;
    snapshot = value || {};
    if (previousUid !== snapshot.uid || (oldLesson && oldLesson !== snapshot.lesson?.id)) {
      composing = null; textarea.value = ''; feedbackCode = ''; rendered = ''; if (dialog.open) dialog.close();
      drafts.clear(); deliveryAttempts.clear();
    }
    if (composing && (!snapshot.session || snapshot.session.id !== composing.sessionId)) { composing = null; textarea.value = ''; if (dialog.open) dialog.close(); }
    render();
    // A persisted reminder appears on return, not over another app. Never steal quiz focus.
    const unread = snapshot.selfIncident && !snapshot.selfIncident.ackAt || (snapshot.selfNotices || []).some(item => !item.ackAt);
    host.classList.toggle('has-unread', Boolean(unread));
  }, compose(targetUid, roomId) {
    const row = (snapshot.rows || []).find(value => value.uid === targetUid);
    if (!row || !snapshot.session || snapshot.selectedRoomId !== roomId) return;
    composing = { uid: targetUid, name: row.displayName, roomId, sessionId: snapshot.session.id }; textarea.value = ''; show(); textarea.focus();
  }, open: show, refresh: render, errorText,
  };
}
