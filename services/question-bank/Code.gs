/* Deploy as a SEPARATE Apps Script project, never replace the old doGet.
 * Reads only the question catalog/tabs; archives published question versions
 * in a private Drive folder. No accounts, scores or saved student work are read.
 * Run setupBankArchive once in the editor before deploying.
 */
const HUB_BANK = Object.freeze({
  spreadsheetId: '1N3kU1DnP7B5OPkUglCU0KOJcSELWtPJokHxx_j7tDkU',
  subjects: { physics: 'PHYSIC', chemistry: 'CHEMISTRY' },
  // Enable reviewed subjects once in Script Properties. No extra authoring
  // step/column is added to the teacher's existing Sheet workflow.
  publicStatuses: ['', 'เปิดปกติ'],
  maxBytes: 2000000,
});

function bankDigest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8)
    .map(function (byte) { return ((byte + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}
function bankKey_(subject, id) { return 'b-' + bankDigest_(subject + '\n' + id).slice(0, 24); }
function bankRows_(ss, name, columns) {
  // The advanced Sheets service accepts spreadsheets.readonly. SpreadsheetApp
  // openById requires the broader read/write scope even for a read operation.
  const range = "'" + name + "'!A2:" + String.fromCharCode(64 + columns);
  const rows = Sheets.Spreadsheets.Values.get(ss, range, { valueRenderOption: 'FORMATTED_VALUE' }).values || [];
  if (rows.length > 19999) throw Error('source-too-large');
  // The API omits trailing empty cells; preserve the legacy column positions.
  return rows.map(function(row) { return Array.from({ length: columns }, function(_, index) { return String(row[index] == null ? '' : row[index]); }); });
}
function bankPublic_(row) {
  const student = String(row[11] || '').trim().toUpperCase();
  return (!student || student === 'ALL') && HUB_BANK.publicStatuses.includes(String(row[12] || '').trim());
}
function bankCatalog_(ss, subject) {
  const tab = HUB_BANK.subjects[subject], entries = new Map();
  // If duplicate menu rows disagree on access, fail closed for that ID.
  const rows = bankRows_(ss, 'Sitemap', 13).filter(function(row) { return row[8].trim() === tab; });
  const blocked = new Set(rows.filter(function(row) { return !bankPublic_(row); }).map(function(row) { return row[7].trim(); }));
  rows.forEach(function(row) {
    const id = row[7].trim();
    if (!id || id.charAt(0) === '#' || blocked.has(id) || !bankPublic_(row)) return;
    if (id.length > 2000) throw Error('invalid-catalog');
    const key = bankKey_(subject, id), path = row.slice(0, 7).map(function(value) { return value.trim(); }).filter(Boolean);
    if (entries.has(key) && entries.get(key).legacyId !== id) throw Error('id-collision');
    entries.set(key, { bankKey: key, legacyId: id, title: path[path.length - 1] || id, path: path, questionCount: 0 });
  });
  const sourceRows = bankRows_(ss, tab, 3);
  const byId = new Map(Array.from(entries.values()).map(function(entry) { return [entry.legacyId, entry]; }));
  sourceRows.forEach(function(row) {
    const count = (row[2].match(/class\s*=\s*["'][^"']*\bquestion-step\b/gi) || []).length;
    // A or B: a single row is counted once for each set even if both IDs match.
    new Set([row[0].trim(), row[1].trim()]).forEach(function(id) { if (byId.has(id)) byId.get(id).questionCount += count; });
  });
  return { sets: Array.from(entries.values()), sourceRows: sourceRows };
}
function bankArchive_() {
  const id = PropertiesService.getScriptProperties().getProperty('HUB_BANK_ARCHIVE_FOLDER');
  if (!id) throw Error('archive-not-configured');
  return DriveApp.getFolderById(id);
}
// Editor-only setup. Never invoked through the web endpoint.
function setupBankArchive() {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const properties = PropertiesService.getScriptProperties();
    if (properties.getProperty('HUB_BANK_ARCHIVE_FOLDER')) return;
    const folder = DriveApp.createFolder('Learning Hub - Question versions');
    properties.setProperty('HUB_BANK_ARCHIVE_FOLDER', folder.getId());
  } finally { lock.releaseLock(); }
}
function bankSnapshot_(subject, set, rows) {
  const body = { schemaVersion: 1, subjectId: subject, bankKey: set.bankKey,
    legacyId: set.legacyId, title: set.title, html: rows.map(function(row) { return row.html; }) };
  const serialized = JSON.stringify(body);
  if (Utilities.newBlob(serialized).getBytes().length > HUB_BANK.maxBytes) throw Error('set-too-large');
  return { schemaVersion: 1, subjectId: subject, bankKey: set.bankKey, legacyId: set.legacyId,
    title: set.title, revision: bankDigest_(serialized), rows: rows };
}
function bankQuestions_(subject, key, revision, catalog) {
  // Re-check current publication/access before looking up ANY archive.
  const set = catalog.sets.find(function(entry) { return entry.bankKey === key; });
  if (!set) throw Error('set-unavailable');
  const folder = bankArchive_();
  if (revision) {
    const files = folder.getFilesByName(subject + '-' + key + '-' + revision + '.json');
    if (!files.hasNext()) throw Error('snapshot-not-found');
    return JSON.parse(files.next().getBlob().getDataAsString('UTF-8'));
  }
  const rows = [];
  catalog.sourceRows.forEach(function(row, index) {
    if (row[0].trim() === set.legacyId || row[1].trim() === set.legacyId) {
      if (!row[2].trim()) throw Error('empty-question-row');
      rows.push({ rowNumber: index + 2, html: row[2] });
    }
  });
  if (!rows.length || rows.length > 1000 || set.questionCount > 1000) throw Error('invalid-set-size');
  const snapshot = bankSnapshot_(subject, set, rows);
  const name = subject + '-' + key + '-' + snapshot.revision + '.json';
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    if (!folder.getFilesByName(name).hasNext()) folder.createFile(name, JSON.stringify(snapshot), MimeType.PLAIN_TEXT);
  } finally { lock.releaseLock(); }
  return snapshot;
}
function doGet(event) {
  let result;
  try {
    const p = event && event.parameter || {};
    if (!Object.prototype.hasOwnProperty.call(HUB_BANK.subjects, p.subject) || !['catalog', 'questions'].includes(p.action)) throw Error('invalid-request');
    const enabled = (PropertiesService.getScriptProperties().getProperty('HUB_BANK_ENABLED_SUBJECTS') || '').split(',').map(function(value) { return value.trim(); });
    if (!enabled.includes(p.subject)) throw Error('set-unavailable');
    if (p.action === 'questions' && (!/^b-[a-f0-9]{24}$/.test(p.key || '') || (p.revision && !/^[a-f0-9]{64}$/.test(p.revision)))) throw Error('invalid-request');
    const ss = HUB_BANK.spreadsheetId;
    const catalog = bankCatalog_(ss, p.subject);
    const data = p.action === 'catalog' ? { schemaVersion: 1, subjectId: p.subject, sets: catalog.sets }
      : bankQuestions_(p.subject, p.key, p.revision || '', catalog);
    result = { ok: true, data: data };
  } catch (error) {
    const known = ['invalid-request', 'set-unavailable', 'snapshot-not-found', 'archive-not-configured', 'source-too-large', 'set-too-large', 'invalid-set-size', 'empty-question-row'];
    if (!known.includes(error.message)) console.error(error.message);
    result = { ok: false, code: known.includes(error.message) ? error.message : 'service-unavailable' };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
