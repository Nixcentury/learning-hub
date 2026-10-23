import { bankSubjects, bankKeyPattern } from '../public/shared/question-bank-model.js';

export function reviewSelection(value) {
  if (!value || !Object.hasOwn(bankSubjects, value.subjectId)) return null;
  const bankKey = value.bankKey ?? null;
  if (bankKey !== null && !bankKeyPattern.test(bankKey)) return null;
  return { subjectId: value.subjectId, bankKey };
}

export function resolveReviewRoute(segments) {
  if (segments[1] !== 'review' || ![2, 3].includes(segments.length)) return null;
  const selection = reviewSelection({ subjectId: segments[0], bankKey: segments[2] });
  if (!selection) return null;
  const { subjectId, bankKey } = selection;
  return { hash: '#' + segments.join('/'), aliases: [], kind: 'topic-review', status: 'ready',
    subjectId, sectionId: subjectId, bankKey,
    parentHash: `#${subjectId}/bank${bankKey ? '/' + bankKey : ''}`,
    titleTh: `คลังเนื้อหาทบทวน · ${bankSubjects[subjectId].th}`,
    titleEn: `Topic review library · ${bankSubjects[subjectId].en}` };
}

// One owned player, with validated topic IDs. A hash can never supply an iframe URL.
export function createTopicReviewTool(value, hubUrl) {
  const selection = reviewSelection(value);
  if (!selection) return null;
  try {
    const hub = new URL(hubUrl);
    if (!['http:', 'https:'].includes(hub.protocol) || hub.username || hub.password) return null;
    const route = resolveReviewRoute([selection.subjectId, 'review', ...(selection.bankKey ? [selection.bankKey] : [])]);
    const player = new URL('pages/tools/topic-review-player.html', hub);
    const source = player.href;
    player.searchParams.set('embedded', '1');
    player.searchParams.set('subject', selection.subjectId);
    if (selection.bankKey) player.searchParams.set('topic', selection.bankKey);
    return { id: 'topic-review-library', page: player.href, source, reviewRoute: route.hash,
      reviewSelection: selection, titleTh: route.titleTh, titleEn: route.titleEn, icon: '▤', accent: 'violet',
      context: { subjectId: selection.subjectId, chapterId: 'bank', topicId: selection.bankKey || 'review',
        contentId: 'topic-review-library', toolKind: 'review', itemId: 'main', pageId: 'page-001' } };
  } catch { return null; }
}
