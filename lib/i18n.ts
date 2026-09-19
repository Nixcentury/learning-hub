export type Language = 'th' | 'en';

export type LocalizedText = Record<Language, string>;

export const copy = {
  metaDescription: {
    th: 'พื้นที่รวมบทเรียน ห้องเรียน แบบทดสอบ และห้องทดลองจำลองในที่เดียว',
    en: 'One place for lessons, classrooms, quizzes, and simulations.',
  },
  common: {
    languagePicker: {
      th: 'เลือกภาษา',
      en: 'Choose language',
    },
    switchToThai: {
      th: 'เปลี่ยนเป็นภาษาไทย',
      en: 'Switch to Thai',
    },
    switchToEnglish: {
      th: 'เปลี่ยนเป็นภาษาอังกฤษ',
      en: 'Switch to English',
    },
  },
  brand: {
    subtitle: {
      th: 'พื้นที่เรียนรู้ของเรา',
      en: 'Our learning space',
    },
  },
  login: {
    welcome: {
      th: 'ยินดีต้อนรับสู่พื้นที่เรียนรู้ของคุณ',
      en: 'Welcome to your learning space',
    },
    headingLine1: {
      th: 'ทุกอย่างที่เรียน',
      en: 'Everything you learn',
    },
    headingLine2: {
      th: 'อยู่ในที่เดียว',
      en: 'all in one place',
    },
    tagline: {
      th: 'หนังสือ · แบบทดสอบ · ห้องทดลองจำลอง · ห้องเรียน',
      en: 'Books · Quizzes · Simulations · Classrooms',
    },
    cloudTitle: {
      th: 'กลับมาทำต่อได้จากทุกเครื่อง',
      en: 'Continue learning on any device',
    },
    cloudDescription: {
      th: 'เมื่อเชื่อมบัญชีแล้ว ระบบจะจำห้องเรียนและความคืบหน้าของคุณ',
      en: 'Once connected, your classrooms and progress will stay with you.',
    },
    continueWithGoogle: {
      th: 'ดำเนินการต่อด้วย Google',
      en: 'Continue with Google',
    },
    divider: {
      th: 'หรือ',
      en: 'or',
    },
    continueAsGuest: {
      th: 'ทดลองเข้า Hub แบบผู้เยี่ยมชม',
      en: 'Explore the Hub as a guest',
    },
    authNotice: {
      th: 'Google Sign-In จะเชื่อมในรอบระบบสมาชิก ขณะนี้ทดลอง Hub แบบผู้เยี่ยมชมได้ก่อน',
      en: 'Google Sign-In will be connected in the membership phase. For now, you can explore the Hub as a guest.',
    },
    guestCloudWarning: {
      th: 'โหมดผู้เยี่ยมชมยังไม่บันทึกความคืบหน้าบน Cloud',
      en: 'Guest mode does not save progress to the cloud yet.',
    },
    footer: {
      th: 'เริ่มจากโครงที่เรียบง่าย แล้วค่อยเติบโตไปพร้อมบทเรียนใหม่',
      en: 'Start simple, then grow with every new lesson.',
    },
  },
  hub: {
    visitor: {
      th: 'ผู้เยี่ยมชม',
      en: 'Guest',
    },
    signOut: {
      th: 'ออกจาก Hub',
      en: 'Leave the Hub',
    },
    navigationLabel: {
      th: 'ส่วนต่าง ๆ ของ Learning Hub',
      en: 'Learning Hub sections',
    },
    subjects: {
      th: 'รายวิชา',
      en: 'Subjects',
    },
    dashboardBadge: {
      th: 'เริ่มต้นใหม่ทั้งหมด',
      en: 'A completely fresh start',
    },
    dashboardHeadingLine1: {
      th: 'โครง Hub พร้อมแล้ว',
      en: 'The Hub foundation is ready',
    },
    dashboardHeadingLine2: {
      th: 'รอเติมบทเรียนชุดใหม่ของเรา',
      en: 'for our brand-new lessons',
    },
    dashboardDescription: {
      th: 'รอบ V0 นี้มีเฉพาะหน้าเข้าสู่ระบบ โครงนำทาง และแท็บวิชา ยังไม่มีเนื้อหาเก่าหรือลิงก์แบบทดสอบเดิมอยู่ภายใน',
      en: 'V0 includes the login, navigation, and subject tabs only. It contains no previous content or links to older quizzes.',
    },
    statusLogin: {
      th: 'หน้าเข้าสู่ระบบพร้อมทดลอง',
      en: 'Login ready to explore',
    },
    statusTabs: {
      th: 'แก้แท็บวิชาได้จากจุดเดียว',
      en: 'Subject tabs managed in one place',
    },
    statusAuth: {
      th: 'ยังไม่เชื่อมระบบสมาชิก',
      en: 'Membership not connected yet',
    },
    classroomLabel: {
      th: 'ห้องเรียน V0',
      en: 'Classroom V0',
    },
    classroomTitle: {
      th: 'ยังไม่ได้เข้าร่วมห้องเรียน',
      en: 'You have not joined a classroom yet',
    },
    classroomDescription: {
      th: 'พื้นที่นี้เตรียมไว้สำหรับห้องเรียนและรหัสเข้าร่วม ระบบจริงจะเชื่อมในรอบถัดไป',
      en: 'This space is reserved for classrooms and join codes. The live system will be connected in a later phase.',
    },
    newContentOnly: {
      th: 'เนื้อหาใหม่เท่านั้น',
      en: 'New content only',
    },
    subjectDescription: {
      th: 'แท็บวิชาพร้อมแล้ว แต่ยังไม่ใส่บทเรียน แบบทดสอบ หรือห้องทดลองจำลอง เพื่อให้เริ่มออกแบบเนื้อหาใหม่ทั้งหมด',
      en: 'The subject tab is ready, with no lessons, quizzes, or simulations added yet, so every piece of content can be designed from scratch.',
    },
    comingSoon: {
      th: 'พร้อมพัฒนาต่อในรอบถัดไป',
      en: 'Ready for the next phase',
    },
  },
} satisfies Record<string, unknown>;

export function localized(text: LocalizedText, language: Language) {
  return text[language];
}

export function subjectContentTitle(subjectLabel: string, language: Language) {
  return language === 'th'
    ? `กำลังเตรียมเนื้อหาใหม่สำหรับ${subjectLabel}`
    : `New ${subjectLabel} content is on the way`;
}
