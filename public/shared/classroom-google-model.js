export const classroomReadScope = 'https://www.googleapis.com/auth/classroom.courses.readonly';
export const classroomGoogleScopes = ['openid', 'https://www.googleapis.com/auth/userinfo.email', classroomReadScope];
export const googleClassroomError = code => Object.assign(new Error(code), { code });
export function cleanGoogleClientId(value) {
  const id = String(value || '').trim();
  if (id.length > 300 || !/^\d{6,}-[A-Za-z0-9_-]{8,}\.apps\.googleusercontent\.com$/.test(id)) throw googleClassroomError('google/invalid-client');
  return id;
}
export function cleanGoogleCourse(course) {
  if (!course || typeof course.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(course.id) || typeof course.name !== 'string' || !course.name.trim()) throw googleClassroomError('google/invalid-response');
  let link = '';
  try { const url = new URL(course.alternateLink); if (url.origin === 'https://classroom.google.com' && !url.username && !url.password) link = url.href; } catch { /* A missing link does not prevent listing a course. */ }
  return { id: course.id, name: course.name.trim().slice(0, 500), section: String(course.section || '').slice(0, 500), room: String(course.room || '').slice(0, 500), link };
}
export function googleClassroomMessage(code, language = 'th') {
  const pairs = {
    'google/invalid-client': ['ใส่ OAuth Client ID แบบ Web application จากโปรเจกต์ของคุณ โดยลงท้ายด้วย .apps.googleusercontent.com', 'Enter your Web application OAuth client ID ending in .apps.googleusercontent.com.'],
    'google/teacher-required': ['ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ครูใน Hub ก่อน', 'Sign in with an approved Hub teacher account first.'],
    'google/session-changed': ['บัญชีหรือสิทธิ์ Hub เปลี่ยนแล้ว กรุณาเชื่อมใหม่', 'Your Hub account or access changed. Connect again.'],
    'google/load-failed': ['โหลดหน้าต่าง Google ไม่สำเร็จ ตรวจอินเทอร์เน็ตหรือส่วนขยายที่บล็อก Google แล้วลองเตรียมใหม่', 'Google could not load. Check your connection or Google-blocking extensions, then prepare again.'],
    'google/not-prepared': ['เตรียมการเชื่อมต่อก่อนเลือกบัญชี Google', 'Prepare the connection before choosing a Google account.'],
    'google/popup-blocked': ['เบราว์เซอร์บล็อกหน้าต่าง Google อนุญาตป๊อปอัปสำหรับเว็บนี้แล้วกดเลือกบัญชีอีกครั้ง', 'Allow popups for this site, then choose your Google account again.'],
    'google/popup-closed': ['ปิดหน้าต่าง Google แล้ว ยังไม่ได้เชื่อมต่อ เลือกบัญชีอีกครั้งได้', 'The Google window was closed. You can choose an account again.'],
    'google/access-denied': ['ยังไม่ได้รับอนุญาตจาก Google ตรวจบัญชีที่เลือกและสิทธิ์ที่โรงเรียนอนุญาต แล้วลองใหม่', 'Google authorization was not granted. Check the selected account and school app access, then retry.'],
    'google/missing-scope': ['ยังไม่ได้อนุญาตให้อ่านรายชื่อห้อง กรุณาเลือกบัญชีและอนุญาตสิทธิ์นี้อีกครั้ง', 'Permission to read your courses was not granted. Choose your account and grant this permission.'],
    'google/account-unavailable': ['ยืนยันอีเมลบัญชีที่เชื่อมไม่ได้ กรุณาเลือกบัญชีใหม่และอนุญาตให้อ่านอีเมล', 'The connected email could not be verified. Choose an account again and allow email access.'],
    'google/expired': ['สิทธิ์การเชื่อมต่อครั้งนี้หมดอายุแล้ว กดเชื่อม Google Classroom อีกครั้ง', 'This connection expired. Connect Google Classroom again.'],
    'google/api-disabled': ['ยังไม่ได้เปิด Google Classroom API ในโปรเจกต์ OAuth เปิด API แล้วกดโหลดรายชื่อห้องอีกครั้ง', 'Enable Google Classroom API in the OAuth project, then reload the courses.'],
    'google/permission-denied': ['Google ไม่อนุญาตให้อ่านห้อง ตรวจว่าบัญชีนี้เป็นครูและแอปได้รับอนุญาตจากโรงเรียน', 'Google denied course access. Check that this is a teacher account and the school allows the app.'],
    'google/rate-limited': ['Google จำกัดคำขอชั่วคราว รอสักครู่แล้วกดโหลดอีกครั้ง', 'Google temporarily limited requests. Wait a moment, then reload.'],
    'google/timeout': ['รอการตอบกลับจาก Google นานกว่าปกติ ตรวจอินเทอร์เน็ตแล้วลองใหม่', 'Google is taking longer than usual. Check your connection and retry.'],
    'google/invalid-response': ['รายชื่อห้องที่ Google ส่งกลับมาไม่สมบูรณ์ กรุณาลองโหลดอีกครั้ง', 'Google returned incomplete course data. Reload and try again.'],
    'google/busy': ['กำลังเชื่อมต่อหรือโหลดรายชื่อห้อง กรุณารอสักครู่', 'Connecting or loading courses. Please wait.'],
    'google/unavailable': ['เชื่อมต่อ Google ไม่สำเร็จ กรุณาลองใหม่ หากมีข้อความในหน้าต่าง Google ให้ตรวจตามข้อความนั้น', 'Could not connect to Google. Retry, and check any message shown in the Google window.'],
  };
  return (pairs[code] || pairs['google/unavailable'])[language === 'en' ? 1 : 0];
}
