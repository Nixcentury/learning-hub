import { questionBankConfig } from './question-bank-config.js';
import { bankContentId, bankRevisionPattern, normalizeBankCatalog, validateBankSnapshot, BANK_MAX_BYTES } from './question-bank-model.js';

export function createBankClient({ config = questionBankConfig, fetcher = (...args) => fetch(...args) } = {}) {
  const cache = new Map(), pending = new Map();
  async function read(params) {
    if (!config.endpoint) throw Error('ยังไม่ได้เชื่อมบริการคลังข้อสอบ / Question bank is not connected yet');
    const url = new URL(config.endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) throw Error('Invalid configured bank endpoint');
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const controller = new AbortController();
    // Apps Script can start slowly; allow its first request time to warm up.
    const timer = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetcher(url.href, { signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'follow' });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error('บริการคลังยังไม่พร้อม / Bank service unavailable');
      // Bound streamed responses too; Content-Length is not always present after redirects.
      const reader = response.body?.getReader();
      let text;
      if (reader) {
        const decoder = new TextDecoder(); let size = 0; text = '';
        try { while (true) { const { done, value } = await reader.read(); if (done) break;
          size += value.byteLength; if (size > BANK_MAX_BYTES * 2) { await reader.cancel(); throw Error('Bank response too large'); }
          text += decoder.decode(value, { stream: true });
        } text += decoder.decode(); } finally { reader.releaseLock(); }
      } else { text = await response.text(); if (text.length > BANK_MAX_BYTES * 2) throw Error('Bank response too large'); }
      const value = JSON.parse(text);
      if (value?.ok !== true) throw Error(value?.code === 'snapshot-not-found'
        ? 'ไม่พบโจทย์รุ่นที่บันทึกไว้ จึงยังไม่โหลดคำตอบลงโจทย์รุ่นใหม่ / Saved question version is unavailable'
        : 'เปิดข้อมูลคลังไม่ได้ กรุณาตรวจการเผยแพร่ชุดนี้ / This set is unavailable');
      return value.data;
    } catch (error) {
      if (controller.signal.aborted) throw Error('บริการตอบช้า กรุณาลองโหลดอีกครั้ง / The service is taking longer than expected. Please retry.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  return {
    async catalog(subjectId, { force = false } = {}) {
      bankContentId(subjectId, 'b-' + '0'.repeat(24));
      if (pending.has(subjectId)) return pending.get(subjectId);
      const previous = cache.get(subjectId);
      // A manual refresh is allowed every 3s. It never mutates an open quiz.
      if (previous && Date.now() - previous.fetchedAt < (force ? 3000 : config.cacheMs)) return previous;
      const request = read({ action: 'catalog', subject: subjectId }).then(value => {
        const catalog = normalizeBankCatalog(value, subjectId); cache.set(subjectId, catalog); return catalog;
      }).finally(() => pending.delete(subjectId));
      pending.set(subjectId, request); return request;
    },
    async snapshot(subjectId, bankKey, revision = '') {
      bankContentId(subjectId, bankKey);
      if (revision && !bankRevisionPattern.test(revision)) throw Error('Invalid bank revision');
      const value = await read({ action: 'questions', subject: subjectId, key: bankKey, ...(revision ? { revision } : {}) });
      return validateBankSnapshot(value, subjectId, bankKey, revision);
    },
  };
}
export const bankClient = createBankClient();
