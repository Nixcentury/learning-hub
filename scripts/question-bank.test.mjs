import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { bankContentId, bankQuestionId, bankSnapshotBody, validateBankSnapshot, chooseBankRevision } from '../public/shared/question-bank-model.js';
import { createBankClient } from '../public/shared/question-bank-client.js';
import { resolveHubRoute, createHubShareUrl } from '../js/hub-routes.js';
import { activityForRoute, menuForRoute, routeForTool } from '../js/hub-activity-routes.js';
import { routeForSelection } from '../js/hub-navigation.js';
import { BANK_ALL_CHAPTERS, BANK_OTHER_CHAPTER, bankChapterKey, bankChapters, filterBankSets, bankTitlePair } from '../public/shared/question-bank-menu.js';

test('chapter menu preserves Sheet order, scopes search, and keeps empty topics and exact IDs', () => {
  const make = (id, chapter, title) => ({ bankKey: id, legacyId: `ID-${id}`, title,
    path: ['ฟิสิกส์', 'Learning hub', chapter, title], questionCount: 0 });
  const sets = [make('first', 'เสียง(Sound)', 'การได้ยิน(Hearing)'), make('second', 'คลื่น(Waves)', 'การได้ยินซ้ำ'),
    make('third', 'เสียง(Sound)', 'อัตราเร็วเสียง'), { bankKey: 'old', legacyId: 'old-id', title: 'Legacy', path: ['ฟิสิกส์', 'Legacy'], questionCount: 1 }];
  const original = structuredClone(sets);
  assert.deepEqual(bankChapters(sets).map(entry => [entry.title, entry.count]), [['เสียง(Sound)', 2], ['คลื่น(Waves)', 1], ['', 1]]);
  const sound = bankChapterKey(sets[0]);
  assert.deepEqual(filterBankSets(sets, '', 'การได้ยิน'), []);
  assert.deepEqual(filterBankSets(sets, BANK_ALL_CHAPTERS, '  '), []);
  assert.deepEqual(filterBankSets(sets, sound).map(set => set.bankKey), ['first', 'third']);
  assert.deepEqual(filterBankSets(sets, sound, 'การได้ยิน').map(set => set.bankKey), ['first']);
  assert.deepEqual(filterBankSets(sets, BANK_ALL_CHAPTERS, 'การได้ยิน').map(set => set.bankKey), ['first', 'second']);
  assert.deepEqual(filterBankSets(sets, BANK_ALL_CHAPTERS, 'id-THIRD').map(set => set.bankKey), ['third']);
  assert.deepEqual(filterBankSets(sets, BANK_OTHER_CHAPTER).map(set => set.bankKey), ['old']);
  assert.deepEqual(sets, original);
});
test('bilingual menu labels preserve source titles and non-translation parentheses', () => {
  assert.deepEqual(bankTitlePair('เสียง(Sound)'), ['เสียง', 'Sound']);
  assert.deepEqual(bankTitlePair('การเคลื่อนที่ (Straight-Line Motion)'), ['การเคลื่อนที่', 'Straight-Line Motion']);
  for (const title of ['ฟิสิกส์', 'Sound (Part 1)', 'แรง (ข้อ 1)', 'รูปแบบ (A (B))']) assert.deepEqual(bankTitlePair(title), [title, title]);
});

const code = await readFile(new URL('../services/question-bank/Code.gs', import.meta.url), 'utf8');
function service() {
  const id = 'ฟิสิกส์ - การเคลื่อนที่', second = 'ฟิสิกส์ - A-Level 2568';
  const menu = (name, access = '', status = 'เปิดปกติ', tab = 'PHYSIC') => ['ฟิสิกส์', name, '', '', '', '', '', name, tab, '', '', access, status];
  const q = text => `<div class="question-step" data-ans="A"><h3>${text}</h3><div class="options"><label><input type="radio" name="q1" value="A">1</label><label><input type="radio" name="q1" value="B">2</label></div><div class="feedback-box">Explanation</div></div>`;
  const tables = { Sitemap: [menu(id), menu(second), menu('private', 'STUDENT'), menu('closed', 'ALL', 'ปิด'), menu('duplicate'), menu('duplicate', 'STUDENT')],
    PHYSIC: [[id, second, q('one') + q('two')], [id, id, q('three')], [id + '-extra', '', q('no substring')]], CHEMISTRY: [] };
  const archive = new Map(), reads = [], properties = new Map([['HUB_BANK_ARCHIVE_FOLDER', 'folder'], ['HUB_BANK_ENABLED_SUBJECTS', 'physics,chemistry']]);
  const folder = { getFilesByName(name) { return { hasNext: () => archive.has(name), next: () => ({ getBlob: () => ({ getDataAsString: () => archive.get(name) }) }) }; },
    createFile(name, value) { archive.set(name, value); } };
  const context = vm.createContext({ console, Map, Set, PropertiesService: { getScriptProperties: () => ({ getProperty: k => properties.get(k), setProperty: (k, v) => properties.set(k, v) }) },
    Sheets: { Spreadsheets: { Values: { get(ss, range, options) {
      assert.equal(ss, '1N3kU1DnP7B5OPkUglCU0KOJcSELWtPJokHxx_j7tDkU');
      assert.equal(options.valueRenderOption, 'FORMATTED_VALUE');
      const match = /^'(Sitemap|PHYSIC|CHEMISTRY)'!A2:([CM])$/.exec(range);
      assert.ok(match); const name = match[1]; reads.push(name);
      return { values: tables[name] };
    } } } },
    DriveApp: { getFolderById: () => folder }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }, MimeType: { PLAIN_TEXT: 'text/plain' },
    Utilities: { DigestAlgorithm: { SHA_256: '' }, Charset: { UTF_8: '' }, computeDigest: (_, text) => [...createHash('sha256').update(text).digest()], newBlob: text => ({ getBytes: () => Buffer.from(text) }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) } });
  vm.runInContext(code, context);
  return { tables, archive, reads, properties, id, second, q, menu,
    get: params => context.doGet({ parameter: { subject: 'physics', action: 'catalog', ...params } }) };
}
test('chemistry uses its own tab and publication rules, including empty sets and explicit subject activation', () => {
  const h = service();
  h.tables.Sitemap.push(h.menu(h.id, 'ALL', '', 'CHEMISTRY'), h.menu('chem-empty', '', '', 'CHEMISTRY'),
    h.menu('chem-private', 'STUDENT', '', 'CHEMISTRY'), h.menu('chem-closed', '', 'ปิด', 'CHEMISTRY'),
    h.menu('chem-duplicate', '', '', 'CHEMISTRY'), h.menu('chem-duplicate', 'STUDENT', '', 'CHEMISTRY'));
  h.tables.CHEMISTRY.push([h.id, h.id, h.q('H<sub>2</sub>O') + h.q('Fe<sup>3+</sup>')],
    ['chem-private', 'chem-closed', h.q('private')], [h.id + '-extra', '', h.q('different full ID')]);
  h.properties.set('HUB_BANK_ENABLED_SUBJECTS', 'physics');
  assert.equal(h.get({ subject: 'chemistry' }).code, 'set-unavailable');
  assert.deepEqual(h.reads, []);
  h.properties.set('HUB_BANK_ENABLED_SUBJECTS', 'physics,chemistry');
  const catalog = h.get({ subject: 'chemistry' }).data;
  assert.equal(catalog.subjectId, 'chemistry');
  assert.deepEqual(catalog.sets.map(set => set.legacyId), [h.id, 'chem-empty']);
  assert.deepEqual(catalog.sets.map(set => set.questionCount), [2, 0]);
  assert.deepEqual(h.reads, ['Sitemap', 'CHEMISTRY']);
  assert.equal(h.get({ subject: 'chemistry', action: 'questions', key: catalog.sets[1].bankKey }).code, 'invalid-set-size');
});
test('identical legacy IDs in physics and chemistry keep distinct questions, revisions and archives', async () => {
  const h = service();
  h.tables.Sitemap.push(h.menu(h.id, '', '', 'CHEMISTRY'));
  const chemicalHtml = h.q('H<sub>2</sub>O and Fe<sup>3+</sup>').replace('</h3>',
    '</h3><table><tr><td>pH</td><td>7</td></tr></table><img src="https://example.org/structure.png" alt="Molecular structure">');
  h.tables.CHEMISTRY.push([h.id, h.id, chemicalHtml]);
  const physicsKey = h.get().data.sets[0].bankKey;
  const chemistryKey = h.get({ subject: 'chemistry' }).data.sets[0].bankKey;
  assert.notEqual(chemistryKey, physicsKey);
  const physics = h.get({ action: 'questions', key: physicsKey }).data;
  const chemistry = h.get({ subject: 'chemistry', action: 'questions', key: chemistryKey }).data;
  await validateBankSnapshot(physics, 'physics', physicsKey);
  await validateBankSnapshot(chemistry, 'chemistry', chemistryKey);
  assert.equal(chemistry.rows.length, 1);
  assert.equal(chemistry.rows[0].html, chemicalHtml);
  assert.notEqual(chemistry.revision, physics.revision);
  assert.equal(h.get({ subject: 'chemistry', action: 'questions', key: physicsKey }).code, 'set-unavailable');
  assert.equal(h.get({ action: 'questions', key: chemistryKey }).code, 'set-unavailable');
  assert.equal(h.get({ subject: 'chemistry', action: 'questions', key: chemistryKey, revision: physics.revision }).code, 'snapshot-not-found');
  h.tables.CHEMISTRY[0][2] = h.q('Changed chemistry');
  const latest = h.get({ subject: 'chemistry', action: 'questions', key: chemistryKey }).data;
  assert.notEqual(latest.revision, chemistry.revision);
  assert.equal(h.get({ subject: 'chemistry', action: 'questions', key: chemistryKey, revision: chemistry.revision }).data.rows[0].html, chemicalHtml);
  assert.equal(h.get({ action: 'questions', key: physicsKey, revision: physics.revision }).data.rows[0].html, physics.rows[0].html);
  assert.deepEqual([...h.archive.keys()].map(name => name.split('-')[0]).sort(), ['chemistry', 'chemistry', 'physics']);
});
test('prepared chemistry IDs with blank HTML do not block ready questions or change archived versions', async () => {
  const h = service();
  h.tables.Sitemap.push(h.menu(h.id, '', '', 'CHEMISTRY'), h.menu('chem-draft', '', '', 'CHEMISTRY'));
  h.tables.CHEMISTRY.push(...Array.from({ length: 35 }, (_, index) =>
    [h.id, h.id, index < 5 ? h.q(`Question ${index + 1}`) : index % 2 ? ' \n ' : '']));
  h.tables.CHEMISTRY.push(['chem-draft', 'chem-draft', '']);
  const catalog = h.get({ subject: 'chemistry' }).data;
  assert.deepEqual(catalog.sets.map(set => set.questionCount), [5, 0]);
  const key = catalog.sets[0].bankKey;
  const published = h.get({ subject: 'chemistry', action: 'questions', key });
  assert.equal(published.ok, true);
  assert.deepEqual(published.data.rows.map(row => row.rowNumber), [2, 3, 4, 5, 6]);
  await validateBankSnapshot(published.data, 'chemistry', key);
  assert.equal(h.get({ subject: 'chemistry', action: 'questions', key: catalog.sets[1].bankKey }).code, 'invalid-set-size');
  // Fill a later prepared row: original row numbers and saved versions survive.
  h.tables.CHEMISTRY[7][2] = h.q('Question 8');
  const latest = h.get({ subject: 'chemistry', action: 'questions', key }).data;
  assert.deepEqual(latest.rows.map(row => row.rowNumber), [2, 3, 4, 5, 6, 9]);
  assert.notEqual(latest.revision, published.data.revision);
  const saved = h.get({ subject: 'chemistry', action: 'questions', key, revision: published.data.revision }).data;
  assert.deepEqual(saved.rows.map(row => row.rowNumber), [2, 3, 4, 5, 6]);
});
test('service publishes only allowed public menus, rejects private/closed/duplicate access and arbitrary tabs', () => {
  const h = service(), catalog = h.get().data;
  assert.deepEqual(catalog.sets.map(set => set.legacyId), [h.id, h.second]);
  assert.equal(catalog.sets[0].questionCount, 3); assert.equal(catalog.sets[1].questionCount, 2);
  for (const subject of ['Users', 'Scores', '__proto__', 'constructor', 'PHYSIC']) assert.equal(h.get({ subject }).ok, false);
  assert.deepEqual(h.reads, ['Sitemap', 'PHYSIC']);
  h.properties.set('HUB_BANK_ENABLED_SUBJECTS', ''); assert.equal(h.get().ok, false);
});
test('A OR B matches full trimmed IDs exactly, returns a row once and archives immutable versions', async () => {
  const h = service(), set = h.get().data.sets[0];
  const result = h.get({ action: 'questions', key: set.bankKey }); assert.equal(result.ok, true);
  assert.equal(result.data.rows.length, 2); assert.equal(result.data.rows[0].rowNumber, 2);
  await validateBankSnapshot(result.data, 'physics', set.bankKey);
  const revision = result.data.revision;
  h.tables.PHYSIC[0][2] = h.q('changed');
  const latest = h.get({ action: 'questions', key: set.bankKey }).data; assert.notEqual(latest.revision, revision);
  assert.equal(h.get({ action: 'questions', key: set.bankKey, revision }).data.rows[0].html, result.data.rows[0].html);
  assert.equal(h.archive.size, 2);
  h.get({ action: 'questions', key: set.bankKey }); assert.equal(h.archive.size, 2);
  h.tables.Sitemap[0][11] = 'PRIVATE';
  assert.equal(h.get({ action: 'questions', key: set.bankKey, revision }).ok, false);
});
test('missing archived revisions and malformed requests never fall back to latest content', () => {
  const h = service(), key = h.get().data.sets[0].bankKey;
  assert.equal(h.get({ action: 'questions', key, revision: 'f'.repeat(64) }).code, 'snapshot-not-found');
  assert.equal(h.get({ action: 'questions', key, revision: '../../file' }).code, 'invalid-request');
  assert.equal(h.get({ action: 'questions', key: 'b-' + '0'.repeat(24) }).code, 'set-unavailable');
});
test('suffix IDs are set-scoped, deterministic and independent of revisions', async () => {
  const h = service(), key = h.get().data.sets[0].bankKey;
  assert.equal(bankQuestionId('physics', key, 1), `${bankContentId('physics', key)}-001`);
  assert.notEqual(bankQuestionId('chemistry', key, 1), bankQuestionId('physics', key, 1));
  assert.throws(() => bankQuestionId('physics', key, 0)); assert.throws(() => bankContentId('Users', key));
  const snap = h.get({ action: 'questions', key }).data;
  assert.equal(Object.keys(bankSnapshotBody(snap)).includes('rowNumber'), false);
  await assert.rejects(validateBankSnapshot({ ...snap, rows: [{ rowNumber: 2, html: 'tampered' }] }, 'physics', key));
});
test('resume selects the saved version, keeps unsynced local work, rejects records without version identity', () => {
  const a = 'a'.repeat(64), b = 'b'.repeat(64);
  assert.equal(chooseBankRevision(null, null), '');
  assert.equal(chooseBankRevision({ bankRevision: a }, { bankRevision: b }), b);
  assert.equal(chooseBankRevision({ bankRevision: a, localSync: { dirty: true } }, { bankRevision: b }), a);
  assert.throws(() => chooseBankRevision({}, null));
});
test('bank routes work dynamically without authored catalog entries and never accept a remote tool URL', () => {
  const key = 'b-' + 'a'.repeat(24), url = 'https://nixcentury.github.io/learning-hub/';
  const catalog = { schemaVersion: 1, routes: [], contents: [] };
  const route = resolveHubRoute(catalog, `#physics/bank/${key}/quiz`).route;
  const activity = activityForRoute(catalog, route, url);
  assert.ok(activity.tool.page.startsWith(url + 'pages/tools/quiz-player.html?bankSubject=physics'));
  assert.equal(menuForRoute(catalog, route).hash, `#physics/bank/${key}`);
  assert.equal(routeForTool(catalog, activity.tool, route, url).hash, route.hash);
  assert.equal(createHubShareUrl(catalog, route.hash, url), url + route.hash);
  assert.equal(routeForSelection(catalog, { subjectId: 'physics', bank: true, bankKey: key }).hash, `#physics/bank/${key}`);
  assert.equal(resolveHubRoute(catalog, `#physics/bank/${key}/evil`).status, 'not-found');
  assert.equal(resolveHubRoute(catalog, `#biology/bank/${key}`).status, 'not-found');
});
test('client coalesces requests, validates response type and never sends credentials', async () => {
  const h = service(); let calls = 0;
  const client = createBankClient({ config: { endpoint: 'https://bank.example/exec', cacheMs: 60000 }, fetcher: async (url, options) => {
    calls++; assert.equal(options.credentials, 'omit');
    return new Response(JSON.stringify(h.get(Object.fromEntries(new URL(url).searchParams))), { headers: { 'content-type': 'application/json' } });
  } });
  const [a, b] = await Promise.all([client.catalog('physics'), client.catalog('physics')]);
  assert.equal(a, b); assert.equal(calls, 1);
  await client.catalog('physics', { force: true }); assert.equal(calls, 1);
  await client.snapshot('physics', a.sets[0].bankKey); assert.equal(calls, 2);
  const wrong = createBankClient({ config: { endpoint: 'https://bank.example/exec' }, fetcher: async () => new Response('<html>login</html>') });
  await assert.rejects(wrong.catalog('physics'));
});
