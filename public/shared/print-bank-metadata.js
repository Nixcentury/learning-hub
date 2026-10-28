import { bankClient } from './question-bank-client.js';
import { bankTitlePair } from './question-bank-menu.js';

// Display metadata only. A slow/offline catalog must not prevent printing or
// replace the pinned question snapshot, saved answers, IDs or revision.
export async function loadBankPrintMetadata(context, language = 'th', client = bankClient) {
  if (context?.chapterId !== 'bank' || !['physics', 'chemistry'].includes(context.subjectId) ||
      !/^b-[a-f0-9]{24}$/.test(context.topicId || '')) return {};
  let timer;
  try {
    const catalog = await Promise.race([client.catalog(context.subjectId),
      new Promise(resolve => { timer = setTimeout(() => resolve(null), 3000); })]);
    const set = catalog?.sets.find(item => item.bankKey === context.topicId);
    const chapter = set?.path.length >= 4 ? set.path[2] : '';
    return chapter ? { chapter: bankTitlePair(chapter)[language === 'en' ? 1 : 0] } : {};
  } catch { return {}; }
  finally { clearTimeout(timer); }
}
