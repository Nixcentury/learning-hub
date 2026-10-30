// Phase 1 contract only: no navigation, history, authentication or storage effects.
import { resolveBankRoute } from './question-bank-tools.js';
import { resolveReviewRoute } from './topic-review-tools.js';
import { classroomAssignmentRoute } from './classroom-assignment-routes.js';
export const routeCatalogVersion = 1;
export const routeCatalogFile = 'route-catalog.v1.json';
export const routeSegmentPattern = /^[a-z0-9][a-z0-9-]{0,127}$/;

export function parseHubRoute(hash) {
  const classroom = classroomAssignmentRoute(hash);
  if (classroom) return { hash, segments: hash.slice(1).split('/') };
  if (hash === '' || hash === '#') hash = '#overview';
  if (typeof hash !== 'string' || !hash.startsWith('#') || hash.length > 520) return null;
  const path = hash.slice(1).replace(/\/$/, '');
  const segments = path.split('/');
  if (segments.length > 4 || segments.some(part => !routeSegmentPattern.test(part))) return null;
  if (['content', 'tool'].includes(segments[0]) && segments.length !== 2) return null;
  return { hash: '#' + segments.join('/'), segments };
}

export function resolveHubRoute(catalog, hash) {
  const classroom = classroomAssignmentRoute(hash);
  if (classroom) return { status: 'ready', canonicalHash: hash, route: classroom, content: null };
  const parsed = parseHubRoute(hash);
  if (!parsed || catalog?.schemaVersion !== routeCatalogVersion || !Array.isArray(catalog.routes) || !Array.isArray(catalog.contents)) return { status: 'invalid' };
  const route = catalog.routes.find(entry => entry?.hash === parsed.hash || entry?.aliases?.includes(parsed.hash)) || resolveBankRoute(parsed.segments) || resolveReviewRoute(parsed.segments);
  if (!route) return { status: 'not-found', hash: parsed.hash };
  const content = route.contentId ? catalog.contents.find(entry => entry.id === route.contentId) : null;
  return { status: route.status, canonicalHash: route.hash, route, content };
}

export function createHubShareUrl(catalog, hash, hubUrl) {
  const result = resolveHubRoute(catalog, hash);
  if (!result.route) return null;
  try {
    const base = new URL(hubUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) return null;
    const url = new URL('./', base); // Caller supplies the Hub root or index.html, never a child page.
    url.hash = result.canonicalHash;
    return url.href; // No identity, answers, cache versions, or session parameters.
  } catch { return null; }
}
