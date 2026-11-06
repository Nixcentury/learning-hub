import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyPwaStartRoute } from '../js/pwa-startup.js';
import { resolveNavigation } from '../js/hub-navigation.js';

function fixture({ href = 'https://nixcentury.github.io/learning-hub/?lang=th', displayMode = false, ios = false } = {}) {
  let url = new URL(href);
  const writes = [], state = { existing: 'navigation-state' };
  const window = {
    location: { get href() { return url.href; }, get hash() { return url.hash; } },
    navigator: { standalone: ios },
    matchMedia(query) { assert.equal(query, '(display-mode: standalone)'); return { matches: displayMode }; },
    history: { state, replaceState(value, title, href) { writes.push({ state: value, title, href }); url = new URL(href); } },
  };
  return { window, writes, state, get url() { return url; }, navigate(hash) { url.hash = hash; } };
}

test('manifest launches Classroom under the installed Hub path', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  const start = new URL(manifest.start_url, 'https://nixcentury.github.io/learning-hub/manifest.webmanifest');
  assert.equal(start.pathname, '/learning-hub/');
  assert.equal(start.hash, '#classroom');
  assert.equal(manifest.id, './');
  assert.equal(manifest.scope, './');
});

for (const entry of ['', 'index.html']) test(`existing standalone entry ${entry || '/'} opens Classroom and preserves URL/state`, () => {
  const f = fixture({ href: `https://nixcentury.github.io/learning-hub/${entry}?lang=th`, displayMode: true });
  assert.equal(applyPwaStartRoute(f.window), true);
  assert.equal(f.url.pathname, `/learning-hub/${entry}`);
  assert.equal(f.url.hash, '#classroom');
  assert.equal(f.url.search, '?lang=th');
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].state, f.state);
});

test('iOS home-screen standalone flag supports existing root shortcuts', () => {
  const f = fixture({ ios: true });
  assert.equal(applyPwaStartRoute(f.window), true);
  assert.equal(f.url.hash, '#classroom');
});

test('normal browser root keeps its Overview start', () => {
  const f = fixture();
  assert.equal(applyPwaStartRoute(f.window), false);
  assert.equal(f.url.hash, '');
  assert.equal(f.writes.length, 0);
});

const homeworkHash = `#classroom/r_${'a'.repeat(32)}/a_${'b'.repeat(32)}`;
for (const hash of ['#classroom', '#overview', '#chemistry/bank/acid-base-ionization/quiz-set-1', homeworkHash, '#unknown-route']) {
  test(`standalone launch preserves explicit link ${hash}`, () => {
    const f = fixture({ href: `https://nixcentury.github.io/learning-hub/${hash}`, displayMode: true });
    assert.equal(applyPwaStartRoute(f.window), false);
    assert.equal(f.url.hash, hash);
    assert.equal(f.writes.length, 0);
  });
}

test('the default resolves to the existing Classroom section without a session or catalog fetch', () => {
  const f = fixture({ displayMode: true });
  applyPwaStartRoute(f.window);
  const catalog = { schemaVersion: 1, contents: [], routes: [
    { hash: '#overview', kind: 'section', sectionId: 'overview' },
    { hash: '#classroom', kind: 'section', sectionId: 'classroom' },
  ] };
  assert.equal(resolveNavigation(catalog, f.url.hash).route.sectionId, 'classroom');
});

test('app startup is idempotent and later navigation to Overview stays there', () => {
  const f = fixture({ displayMode: true });
  assert.equal(applyPwaStartRoute(f.window), true);
  assert.equal(applyPwaStartRoute(f.window), false);
  f.navigate('#overview');
  assert.equal(applyPwaStartRoute(f.window), false);
  assert.equal(f.url.hash, '#overview');
  assert.equal(f.writes.length, 1);
});

test('unavailable display-mode or history APIs never block startup', () => {
  const media = fixture();
  media.window.matchMedia = () => { throw Error('unavailable'); };
  assert.equal(applyPwaStartRoute(media.window), false);
  const history = fixture({ displayMode: true });
  history.window.history.replaceState = () => { throw Error('blocked'); };
  assert.equal(applyPwaStartRoute(history.window), false);
  assert.equal(history.url.hash, '');
  assert.equal(applyPwaStartRoute(undefined), false);
});
