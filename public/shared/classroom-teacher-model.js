// Account-level approvals; room ownership and membership stay separate.
export function teacherError(code) { return Object.assign(new Error(code), { code }); }
export function teacherUid(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[.#$\[\]\/\u0000-\u001f\u007f]/.test(value);
}
export function teacherEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw teacherError('teachers/invalid-email');
  return email;
}
const entries = value => value && typeof value === 'object' ? Object.entries(value).filter(([uid]) => teacherUid(uid)) : [];
const enabled = value => value === true || (value !== null && typeof value === 'object' && value.enabled === true);
const person = (uid, profile = {}) => ({ uid, displayName: String(profile?.displayName || '').slice(0, 120), email: String(profile?.email || '').slice(0, 254) });
export function teacherDirectory(profiles = {}, approvals = {}, requests = {}) {
  const people = entries(profiles).map(([uid, value]) => person(uid, value));
  const teachers = entries(approvals).filter(([, value]) => enabled(value)).map(([uid, value]) => ({
    ...person(uid, profiles?.[uid]), approvedAt: Number(value?.approvedAt) || 0,
  })).sort((a, b) => (a.displayName || a.email || a.uid).localeCompare(b.displayName || b.email || b.uid));
  const pending = entries(requests).filter(([, value]) => value?.status === 'pending').map(([uid, value]) => ({
    ...person(uid, value), requestedAt: Number(value.requestedAt) || 0,
  })).sort((a, b) => b.requestedAt - a.requestedAt);
  return { people, teachers, pending };
}
export function findTeacherAccount(people, email) {
  const query = teacherEmail(email);
  const matches = people.filter(item => String(item.email || '').trim().toLowerCase() === query);
  if (matches.length > 1) throw teacherError('teachers/ambiguous-email');
  return { query, person: matches[0] || null };
}
export function teacherApprovalPatch(action, uid, actor, stamp, hasRequest) {
  if (!teacherUid(uid) || !teacherUid(actor)) throw teacherError('teachers/invalid-account');
  if (!['approve', 'revoke'].includes(action)) throw teacherError('teachers/invalid-action');
  const patch = { ['teacherApprovals/' + uid]: action === 'approve' ? { enabled: true, approvedAt: stamp, approvedBy: actor } : null };
  // Existing Rules require the complete original request; do not invent one.
  if (hasRequest) {
    patch['teacherRequests/' + uid + '/status'] = action === 'approve' ? 'approved' : 'revoked';
    patch['teacherRequests/' + uid + '/reviewedAt'] = stamp;
    patch['teacherRequests/' + uid + '/reviewedBy'] = actor;
  }
  return patch;
}
export function teacherShareTarget(base) {
  const url = new URL(base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw teacherError('teachers/invalid-link');
  url.search = ''; url.hash = 'classroom';
  return { url: url.href, titleTh: 'Classroom สำหรับครู', titleEn: 'Classroom for teachers' };
}
export function teacherMessage(code, language = 'th') {
  const messages = {
    'teachers/admin-required': ['บัญชีนี้ไม่มีสิทธิ์จัดการครู ต้องใช้แอดมิน Hub', 'A Hub administrator is required to manage teachers.'],
    'teachers/session-changed': ['บัญชีหรือสิทธิ์เปลี่ยนแล้ว กรุณาเปิดจัดการครูใหม่', 'Your account or access changed. Reopen teacher management.'],
    'teachers/invalid-email': ['กรอกอีเมลให้ครบและถูกต้อง', 'Enter a valid complete email address.'],
    'teachers/ambiguous-email': ['พบหลายบัญชีที่ใช้อีเมลนี้ กรุณาตรวจบัญชีใน Firebase ก่อนอนุมัติ', 'Multiple accounts use this email. Check them in Firebase before approving.'],
    'teachers/account-missing': ['ยังไม่พบบัญชีนี้ ให้เพื่อนเปิดลิงก์และเข้าสู่ระบบ Hub ด้วยอีเมลนี้ก่อน แล้วค้นหาอีกครั้ง', 'Account not found. Ask your friend to open the link and sign in to Hub with this email, then search again.'],
    'teachers/offline': ['ยังไม่เชื่อมต่อฐานข้อมูล กรุณารอให้เชื่อมต่อก่อนบันทึก', 'Wait for the database connection before saving.'],
    'teachers/not-ready': ['ข้อมูลสิทธิ์ยังไม่ครบ กรุณาโหลดอีกครั้งก่อนบันทึก', 'Access data is incomplete. Reload before saving.'],
    'teachers/read-timeout': ['โหลดรายชื่อครูไม่สำเร็จ ลองโหลดอีกครั้ง', 'Teacher data timed out. Try reloading.'],
    'teachers/already-approved': ['บัญชีนี้มีสิทธิ์ครูแล้ว', 'This account already has teacher access.'],
    'teachers/self-revoke': ['ไม่สามารถถอนสิทธิ์ของบัญชีที่กำลังใช้งานจากหน้านี้ได้', 'You cannot revoke the current account from this screen.'],
    'teachers/busy': ['กำลังบันทึก กรุณารอสักครู่', 'A change is being saved. Please wait.'],
  };
  const pair = messages[code] || ['ดำเนินการไม่สำเร็จ ตรวจสิทธิ์แอดมินและการเชื่อมต่อ แล้วลองใหม่', 'The action failed. Check administrator access and your connection, then retry.'];
  return pair[language === 'en' ? 1 : 0];
}
