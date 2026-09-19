import type { LocalizedText } from '@/lib/i18n';

export type HubIconName =
  | 'dashboard'
  | 'classroom'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'science'
  | 'math';

export type HubSection = {
  id: string;
  label: LocalizedText;
  eyebrow: LocalizedText;
  kind: 'system' | 'subject';
  icon: HubIconName;
};

// แก้ชื่อภาษาไทย ภาษาอังกฤษ และลำดับแท็บได้จากไฟล์นี้ไฟล์เดียว
export const hubSections: HubSection[] = [
  {
    id: 'dashboard',
    label: { th: 'ภาพรวม', en: 'Overview' },
    eyebrow: { th: 'ภาพรวมการเรียน', en: 'Dashboard' },
    kind: 'system',
    icon: 'dashboard',
  },
  {
    id: 'classroom',
    label: { th: 'ห้องเรียน', en: 'Classroom' },
    eyebrow: { th: 'พื้นที่ห้องเรียน', en: 'Classroom' },
    kind: 'system',
    icon: 'classroom',
  },
  {
    id: 'physics',
    label: { th: 'ฟิสิกส์', en: 'Physics' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'physics',
  },
  {
    id: 'chemistry',
    label: { th: 'เคมี', en: 'Chemistry' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'chemistry',
  },
  {
    id: 'biology',
    label: { th: 'ชีววิทยา', en: 'Biology' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'biology',
  },
  {
    id: 'lower-secondary-science',
    label: { th: 'วิทยาศาสตร์ ม.ต้น', en: 'Lower Secondary Science' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'science',
  },
  {
    id: 'science-ep',
    label: { th: 'วิทยาศาสตร์ EP', en: 'Science EP' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'science',
  },
  {
    id: 'math-ep',
    label: { th: 'คณิตศาสตร์ EP', en: 'Mathematics EP' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'math',
  },
  {
    id: 'upper-secondary-math',
    label: { th: 'คณิตศาสตร์ ม.ปลาย', en: 'Upper Secondary Mathematics' },
    eyebrow: { th: 'รายวิชา', en: 'Subject' },
    kind: 'subject',
    icon: 'math',
  },
];
