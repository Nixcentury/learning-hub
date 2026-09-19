// Portable handwriting only. Never import identity, scores, AI stamps, or HTML.
export const BACKUP_SCHEMA = "HUB_NOTEBOOK_BACKUP_V1";
export const BACKUP_MAX_BYTES = 20 * 1024 * 1024;
const STORE = "notebookPages";
const fail = (code) => { throw new Error(code); };
const object = (value) => value && typeof value === "object" && !Array.isArray(value);
const number = (value, min, max) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const safeId = (value) => typeof value === "string" && value.length > 0 && value.length <= 200 && !["__proto__", "constructor", "prototype"].includes(value);
export const jsonBytes = (value) => new TextEncoder().encode(JSON.stringify(value)).byteLength;

export function validateNotebookBackup(value, { contentId, questionIds }) {
  if (!object(value) || value.schema !== BACKUP_SCHEMA) fail("backup-format");
  if (!safeId(value.contentId) || value.contentId !== contentId) fail("backup-content");
  if (!Array.isArray(value.pages) || !value.pages.length || value.pages.length > 500) fail("backup-pages");
  const allowed = new Set(questionIds);
  const seen = new Set();
  let points = 0;
  let strokes = 0;
  const pages = value.pages.map((page) => {
    if (!object(page) || !safeId(page.questionId) || !allowed.has(page.questionId) || seen.has(page.questionId)) fail("backup-question");
    seen.add(page.questionId);
    const source = page.snapshot;
    if (!object(source) || source.schema !== "HUB_NOTEBOOK_CORE_V1" || source.width !== 1400 || source.height !== 900 || !Array.isArray(source.strokes) || !source.strokes.length) fail("backup-ink");
    const cleanStrokes = source.strokes.map((stroke) => {
      if (++strokes > 10000) fail("backup-large");
      if (!object(stroke) || typeof stroke.color !== "string" || !/^#[0-9a-f]{6}$/i.test(stroke.color) || !number(stroke.width, 0.1, 40) || !Array.isArray(stroke.points) || !stroke.points.length) fail("backup-ink");
      return {
        color: stroke.color, width: stroke.width,
        points: stroke.points.map((point) => {
          if (++points > 250000) fail("backup-large");
          if (!object(point) || !number(point.x, 0, 1400) || !number(point.y, 0, 900)) fail("backup-ink");
          if (point.pressure !== undefined && !number(point.pressure, 0, 1)) fail("backup-ink");
          return { x: point.x, y: point.y, pressure: point.pressure ?? 0.5 };
        }),
      };
    });
    return { questionId: page.questionId, snapshot: {
      schema: "HUB_NOTEBOOK_CORE_V1", width: 1400, height: 900, revision: 0,
      context: { contentId, itemId: page.questionId, pageId: "page-001", toolKind: "notebook" },
      strokes: cleanStrokes,
    } };
  });
  return { schema: BACKUP_SCHEMA, contentId, pages };
}

export function parseNotebookBackup(text, context) {
  if (typeof text !== "string" || new TextEncoder().encode(text).byteLength > BACKUP_MAX_BYTES) fail("backup-large");
  let value;
  try { value = JSON.parse(text); } catch { fail("backup-format"); }
  return validateNotebookBackup(value, context);
}

export function buildNotebookBackup(contentId, pages, title = "") {
  const result = validateNotebookBackup({ schema: BACKUP_SCHEMA, contentId, pages }, {
    contentId, questionIds: pages.map((page) => page.questionId),
  });
  const backup = { ...result, title: String(title).slice(0, 250), createdAt: new Date().toISOString() };
  if (jsonBytes(backup) > BACKUP_MAX_BYTES) fail("backup-large");
  return backup;
}

// Compare-and-replace in one transaction: a changed page aborts the whole import.
// No delete is used. Questions not included in the file are untouched.
export function restoreNotebookRecords(database, records, expected, { isCurrent = () => true, onTransaction = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    let transaction;
    let reason = "backup-storage";
    try {
      transaction = database.transaction(STORE, "readwrite");
      onTransaction(transaction);
      const store = transaction.objectStore(STORE);
      transaction.oncomplete = () => resolve(true);
      transaction.onabort = transaction.onerror = () => reject(new Error(reason));
      const abort = (code) => { reason = code; transaction.abort(); };
      if (!isCurrent()) { abort("backup-session"); return; }
      for (const [key, snapshot] of records) {
        const request = store.get(key);
        request.onsuccess = () => {
          if (!isCurrent()) { abort("backup-session"); return; }
          if (!expected.has(key) || JSON.stringify(request.result || null) !== expected.get(key)) { abort("backup-conflict"); return; }
          store.put(snapshot, key);
        };
      }
    } catch {
      try { transaction?.abort(); } catch { /* Already completed/aborted. */ }
      reject(new Error(reason));
    }
  });
}
