import { resolveHubRoute } from './hub-routes.js';
import { activityForRoute } from './hub-activity-routes.js';
import { bankClient } from '../public/shared/question-bank-client.js';
import { adaptLegacyBank } from '../public/shared/question-bank-adapter.js';
import { readQuizContent } from '../public/shared/quiz-content-adapter.js';
import { sanitizeHomeworkRoot } from '../public/shared/classroom-submission-quiz.js';
import { resolveAuthoredPdfLinks } from '../public/shared/pdf-content-model.js';
import { failSubmission } from '../public/shared/classroom-submission-model.js';

export async function freezeHomeworkQuiz(item, catalog, hubUrl, fetcher = fetch) {
  const route = resolveHubRoute(catalog, item.targetHash).route;
  const activity = activityForRoute(catalog, route, hubUrl);
  if (!activity || activity.tool.context.contentId !== item.contentId || activity.tool.context.toolKind !== 'quiz') throw failSubmission('homework/quiz-changed');
  const page = new URL(activity.tool.page, hubUrl);
  let root, source;
  if (activity.bank) {
    root = adaptLegacyBank(await bankClient.snapshot(activity.bank.subjectId, activity.bank.bankKey));
    source = new URL('./', hubUrl).href;
  } else {
    source = new URL(page.searchParams.get('content'), page);
    if (!page.searchParams.has('content') || source.origin !== new URL(hubUrl).origin) throw failSubmission('homework/invalid-quiz');
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetcher(source.href, { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw failSubmission('homework/quiz-unavailable');
      root = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('[data-learning-activity-content]');
    } finally { clearTimeout(timeout); }
  }
  if (!root) throw failSubmission('homework/invalid-quiz');
  resolveAuthoredPdfLinks(root, source);
  root = sanitizeHomeworkRoot(root, source);
  // Legacy demo routes intentionally have distinct storage IDs.
  root.dataset.activityId = item.contentId;
  const parsed = readQuizContent(root);
  const html = root.outerHTML;
  if (parsed.errors.length || parsed.questions.length > 500 || html.length > 400000) throw failSubmission('homework/invalid-quiz');
  const revision = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html)))].map(value => value.toString(16).padStart(2,'0')).join('');
  return { version: 1, contentId: item.contentId, targetHash: item.targetHash, revision, html, questionCount: parsed.questions.length };
}
