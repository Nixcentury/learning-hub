// An authored review quiz may opt its own Review button into an existing sheet.
// The normal topic-review handler remains the default for every other quiz.
export function configureQuizReviewLink(button, root, { documentUrl, standalone = false, openExternal = () => {} } = {}) {
  const link = root?.querySelector('a[data-quiz-review-link]');
  if (!button || !link) return false;
  try {
    const base = new URL('../../content/', documentUrl);
    const source = new URL(link.getAttribute('data-html-src') || '', documentUrl);
    const fallback = new URL(link.getAttribute('href') || '', documentUrl);
    const contentId = link.getAttribute('data-content-id') || '';
    if (!/^[a-z][a-z0-9-]{0,127}$/.test(contentId) || source.origin !== base.origin ||
        !source.pathname.startsWith(base.pathname) || !source.pathname.endsWith('.html') || source.search || source.hash ||
        source.username || source.password || /%(?:2e|2f|5c|25|00)/i.test(source.pathname) ||
        !['http:', 'https:'].includes(source.protocol) || !['http:', 'https:'].includes(fallback.protocol) || fallback.username || fallback.password) return false;
    button.setAttribute('data-hub-html', '');
    button.setAttribute('data-html-src', source.href);
    button.setAttribute('data-content-id', contentId);
    button.setAttribute('data-html-pair', 'true');
    for (const name of ['subject-id', 'chapter-id', 'topic-id', 'title-th', 'title-en']) {
      const value = link.getAttribute(`data-${name}`);
      if (value) button.setAttribute(`data-${name}`, value);
    }
    button.removeAttribute('aria-haspopup');
    button.removeAttribute('aria-controls');
    if (standalone) button.addEventListener('click', () => openExternal(fallback.href));
    return true;
  } catch { return false; }
}
