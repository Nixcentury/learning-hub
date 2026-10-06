export const bankSubjects = Object.freeze({
  physics: { tab: 'PHYSIC', th: 'ฟิสิกส์', en: 'Physics' },
  chemistry: { tab: 'CHEMISTRY', th: 'เคมี', en: 'Chemistry' },
});
export const bankKeyPattern = /^b-[a-f0-9]{24}$/;
export const bankRevisionPattern = /^[a-f0-9]{64}$/;
export const BANK_MAX_BYTES = 2_000_000;
export function bankContentId(subjectId, bankKey) {
  if (!Object.hasOwn(bankSubjects, subjectId) || !bankKeyPattern.test(bankKey || '')) throw Error('Invalid bank identity');
  return `bank-${subjectId}-${bankKey}`;
}
export function bankQuestionId(subjectId, bankKey, ordinal) {
  if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 1000) throw Error('Invalid question number');
  return `${bankContentId(subjectId, bankKey)}-${String(ordinal).padStart(3, '0')}`;
}
export function normalizeBankCatalog(value, subjectId) {
  if (value?.schemaVersion !== 1 || value.subjectId !== subjectId || !Array.isArray(value.sets) || value.sets.length > 5000) throw Error('Invalid bank catalog');
  const seen = new Set();
  const sets = value.sets.map(set => {
    bankContentId(subjectId, set?.bankKey);
    if (seen.has(set.bankKey) || typeof set.legacyId !== 'string' || !set.legacyId.trim() || set.legacyId.length > 2000 ||
        typeof set.title !== 'string' || !set.title.trim() || !Array.isArray(set.path) || set.path.some(part => typeof part !== 'string') ||
        !Number.isInteger(set.questionCount) || set.questionCount < 0 || set.questionCount > 1000) throw Error('Invalid bank entry');
    seen.add(set.bankKey);
    return { bankKey: set.bankKey, legacyId: set.legacyId, title: set.title, path: set.path, questionCount: set.questionCount };
  });
  return { subjectId, sets, fetchedAt: Date.now() };
}
// This canonical object is also used by the Apps Script archive. Location/row
// metadata is diagnostic only; it is excluded from the content fingerprint.
export function bankSnapshotBody(value) {
  return { schemaVersion: 1, subjectId: value.subjectId, bankKey: value.bankKey,
    legacyId: value.legacyId, title: value.title, html: value.rows.map(row => row.html) };
}
export async function sha256(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
}
export async function validateBankSnapshot(value, subjectId, bankKey, revision = '') {
  bankContentId(subjectId, bankKey);
  if (value?.schemaVersion !== 1 || value.subjectId !== subjectId || value.bankKey !== bankKey ||
      !bankRevisionPattern.test(value.revision || '') || (revision && value.revision !== revision) ||
      typeof value.legacyId !== 'string' || !value.legacyId || value.legacyId.length > 2000 ||
      typeof value.title !== 'string' || !value.title || !Array.isArray(value.rows) || !value.rows.length || value.rows.length > 1000 ||
      value.rows.some(row => !Number.isInteger(row.rowNumber) || row.rowNumber < 2 || typeof row.html !== 'string' || !row.html.trim())) throw Error('Invalid bank snapshot');
  const body = JSON.stringify(bankSnapshotBody(value));
  if (new TextEncoder().encode(body).length > BANK_MAX_BYTES || await sha256(body) !== value.revision) throw Error('Bank snapshot integrity check failed');
  return value;
}

// A suffix is assigned in the original, fixed source order. It is scoped to
// this set, not a global identity shared across different topic/exam views.
// Revision pinning keeps even unexpected insertions/deletions from shifting a draft.
export function chooseBankRevision(local, remote) {
  const revision = record => record == null ? '' : bankRevisionPattern.test(record.bankRevision || '')
    ? record.bankRevision : (() => { throw Error('Saved bank work has no valid revision'); })();
  const localRevision = revision(local), remoteRevision = revision(remote);
  if (localRevision && (!remoteRevision || local?.localSync?.dirty)) return localRevision;
  return remoteRevision || localRevision;
}
