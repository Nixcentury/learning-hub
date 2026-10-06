import { bankClient } from './question-bank-client.js';
import { bankContentId, chooseBankRevision } from './question-bank-model.js';
import { adaptLegacyBank } from './question-bank-adapter.js';

export function readBankSelection(search) {
  const params = new URLSearchParams(search);
  if (!params.has('bankSubject') && !params.has('bankKey')) return null;
  const subjectId = params.get('bankSubject'), bankKey = params.get('bankKey');
  return { subjectId, bankKey, contentId: bankContentId(subjectId, bankKey) };
}
export async function loadBankQuiz({ selection, identityKey, loadCloud, fresh = false, client = bankClient }) {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(`learning-hub-quiz:v1:${identityKey}:${selection.contentId}`) || 'null'); }
  catch { throw Error('อ่านงานที่เซฟในเครื่องไม่ได้ กรุณาสำรองงานก่อนเริ่มใหม่ / Cannot read the saved attempt'); }
  if (local && (local.identityKey !== identityKey || local.contentId !== selection.contentId)) throw Error('Saved bank context mismatch');
  const result = identityKey === 'guest' ? { ok: true, value: null } : await loadCloud();
  if (!result?.ok && (!local || fresh)) throw Error('ยังตรวจงานที่เซฟบนบัญชีไม่ได้ กรุณาเชื่อมต่อแล้วลองใหม่ / Cannot check account progress');
  const remote = result?.ok ? result.value : null;
  if (remote && (remote.identityKey !== identityKey || remote.contentId !== selection.contentId)) throw Error('Cloud bank context mismatch');
  const revision = fresh ? '' : chooseBankRevision(local, remote);
  const snapshot = await client.snapshot(selection.subjectId, selection.bankKey, revision);
  return { root: adaptLegacyBank(snapshot), revision: snapshot.revision,
    // This is a compare-and-set precondition, not part of the public URL.
    replacementBase: fresh ? remote?.bankRevision || '' : local?.localSync?.bankReplacementBase,
    pinned: Boolean(revision) };
}
