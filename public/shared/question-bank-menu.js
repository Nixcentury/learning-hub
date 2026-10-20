// Learning hub's published path is A (subject), B (Hub), C (chapter), D (topic).
// Keep source order and exact titles; never derive an identity from the display label.
export const BANK_ALL_CHAPTERS = 'all';
export const BANK_OTHER_CHAPTER = 'other';

export function bankChapterKey(set) {
  return set.path.length >= 4 && set.path[2].trim()
    ? `chapter:${set.path[2].trim()}` : BANK_OTHER_CHAPTER;
}

export function bankChapters(sets) {
  const chapters = new Map();
  for (const set of sets) {
    const key = bankChapterKey(set);
    if (!chapters.has(key)) chapters.set(key, {
      key, title: key === BANK_OTHER_CHAPTER ? '' : set.path[2].trim(), count: 0,
    });
    chapters.get(key).count++;
  }
  return [...chapters.values()];
}

export function filterBankSets(sets, chapter, query = '') {
  const term = query.trim().toLocaleLowerCase();
  if (!chapter || (chapter === BANK_ALL_CHAPTERS && !term)) return [];
  return sets.filter(set => (chapter === BANK_ALL_CHAPTERS || bankChapterKey(set) === chapter) &&
    (!term || `${set.title} ${set.legacyId} ${set.path.join(' ')}`.toLocaleLowerCase().includes(term)));
}

// Existing bilingual Sheet labels use Thai followed by an English translation.
// Leave other parentheses and source IDs intact.
export function bankTitlePair(title) {
  const match = /^(.+?)\s*\(([^()]+)\)\s*$/u.exec(title);
  return match && /[\u0e00-\u0e7f]/u.test(match[1]) && /[a-z]/i.test(match[2])
    ? [match[1].trim(), match[2].trim()] : [title, title];
}
