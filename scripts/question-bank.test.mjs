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
    SpreadsheetApp: { openById: () => ({ getSheetByName(name) { reads.push(name); return tables[name] && { getLastRow: () => tables[name].length + 1,
      getRange: () => ({ getDisplayValues: () => tables[name] }) }; } }) },
    DriveApp: { getFolderById: () => folder }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) }, MimeType: { PLAIN_TEXT: 'text/plain' },
    Utilities: { DigestAlgorithm: { SHA_256: '' }, Charset: { UTF_8: '' }, computeDigest: (_, text) => [...createHash('sha256').update(text).digest()], newBlob: text => ({ getBytes: () => Buffer.from(text) }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) } });
  vm.runInContext(code, context);
  return { tables, archive, reads, properties, id, second, q,
    get: params => context.doGet({ parameter: { subject: 'physics', action: 'catalog', ...params } }) };
}
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
