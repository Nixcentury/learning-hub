import { resolveHubRoute } from './hub-routes.js';
import { activityForRoute } from './hub-activity-routes.js';

export * from '../public/shared/classroom-assignment-model.js';
import { assignmentError } from '../public/shared/classroom-assignment-model.js';

export function resolveAssignmentQuiz(value, catalog, hubUrl) {
  try {
    const base = new URL('./', hubUrl);
    const url = new URL(String(value || '').trim(), base);
    if (!['https:', 'http:'].includes(url.protocol) || url.origin !== base.origin || url.username || url.password || url.search ||
        ![base.pathname, base.pathname + 'index.html'].includes(url.pathname)) throw Error();
    const result = resolveHubRoute(catalog, url.hash);
    const route = result.route;
    if (!route || result.status !== 'ready') throw Error();
    const activity = activityForRoute(catalog, route, base.href);
    if (!activity || activity.tool?.context?.toolKind !== 'quiz' || activity.tool.preparing) throw Error();
    return { targetHash: route.hash, contentId: activity.tool.context.contentId,
      quizTitleTh: activity.tool.titleTh, quizTitleEn: activity.tool.titleEn };
  } catch { throw assignmentError('assignment/invalid-quiz'); }
}
