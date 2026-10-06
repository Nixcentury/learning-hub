import { bankContentId, bankSubjects, bankKeyPattern } from '../public/shared/question-bank-model.js';
import { questionBankTools } from '../public/shared/question-bank-config.js';
import { createContentTool } from './content-tool.js';

export function bankToolEntries(subjectId, bankKey) {
  if (!Object.hasOwn(bankSubjects, subjectId) || !bankKeyPattern.test(bankKey || '')) return [];
  return [{ key: 'quiz', toolKind: 'bank-quiz', titleTh: 'แสดงข้อสอบ', titleEn: 'Open quiz' },
    { key: 'notebook', toolKind: 'notebook', titleTh: 'สมุดบันทึก', titleEn: 'Notebook' },
    ...(questionBankTools[`${subjectId}/${bankKey}`] || []).filter(entry =>
      /^[a-z][a-z0-9-]{0,63}$/.test(entry?.key || '') && !['quiz', 'notebook'].includes(entry.key))];
}
export function createBankTool({ subjectId, bankKey, toolKey = 'quiz' }, hubUrl) {
  const entry = bankToolEntries(subjectId, bankKey).find(item => item.key === toolKey);
  if (!entry) return null;
  const contentId = bankContentId(subjectId, bankKey);
  const bankRoute = `#${subjectId}/bank/${bankKey}/${toolKey}`;
  if (['quiz', 'simulation', 'html'].includes(entry.toolKind)) {
    const tool = createContentTool({ ...entry, subjectId, chapterId: 'bank', topicId: bankKey }, hubUrl);
    return tool ? { ...tool, bankRoute } : null;
  }
  if (!['bank-quiz', 'notebook'].includes(entry.toolKind)) return null;
  const quiz = entry.toolKind === 'bank-quiz';
  const page = new URL(quiz ? 'pages/tools/quiz-player.html' : 'pages/tools/notebook-preview.html', hubUrl);
  if (quiz) { page.searchParams.set('bankSubject', subjectId); page.searchParams.set('bankKey', bankKey); }
  return { id: `${contentId}-${toolKey}`, page: page.href, source: page.href, bankRoute,
    titleTh: `${entry.titleTh} · ${bankSubjects[subjectId].th}`, titleEn: `${entry.titleEn} · ${bankSubjects[subjectId].en}`,
    icon: quiz ? '✓' : '▱', accent: quiz ? 'blue' : 'violet',
    context: { subjectId, chapterId: 'bank', topicId: bankKey, contentId: quiz ? contentId : `${contentId}-notebook`,
      toolKind: quiz ? 'quiz' : 'notebook', itemId: 'main', pageId: 'page-001' } };
}
export function resolveBankRoute(segments) {
  const [subjectId, area, bankKey, toolKey] = segments;
  if (area !== 'bank' || !Object.hasOwn(bankSubjects, subjectId) || segments.length < 2 ||
      (bankKey && !bankKeyPattern.test(bankKey)) || (toolKey && !bankToolEntries(subjectId, bankKey).some(entry => entry.key === toolKey))) return null;
  const hash = '#' + segments.join('/');
  return { hash, aliases: [], status: 'ready', kind: toolKey ? 'bank-tool' : 'bank',
    subjectId, sectionId: subjectId, bankKey: bankKey || null, toolKey: toolKey || null,
    parentHash: '#' + segments.slice(0, -1).join('/'),
    titleTh: `คลังข้อสอบ${bankSubjects[subjectId].th}`, titleEn: `${bankSubjects[subjectId].en} question bank` };
}
