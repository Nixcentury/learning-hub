import test from "node:test";
import assert from "node:assert/strict";
import { buildNotebookBackup, parseNotebookBackup, validateNotebookBackup, restoreNotebookRecords, BACKUP_MAX_BYTES } from "../public/shared/notebook-backup.js";

const context = { contentId: "numeric-input-demo-v1", questionIds: ["fraction-sum", "age-total", "snail-time", "discount"] };
const ink = () => ({ schema: "HUB_NOTEBOOK_CORE_V1", width: 1400, height: 900, revision: 8,
  context: { uid: "must-not-export" },
  strokes: [{ color: "#2563eb", width: 3.2, points: [{ x: 10, y: 20, pressure: .5 }, { x: 50, y: 90, pressure: .8 }] }],
});
const backup = () => buildNotebookBackup(context.contentId, [{ questionId: "fraction-sum", snapshot: ink() }, { questionId: "age-total", snapshot: ink() }], "QA notebook");

test("round trip retains editable pen geometry, color and pressure; excludes identity", () => {
  const file = backup();
  const restored = parseNotebookBackup(JSON.stringify(file), context);
  assert.deepEqual(restored.pages[0].snapshot.strokes, ink().strokes);
  assert.equal(JSON.stringify(file).includes("must-not-export"), false);
  assert.equal(restored.pages.length, 2);
});

test("untrusted scores, AI stamps, identity and extra fields are never imported", () => {
  const file = backup();
  file.uid = "other-user"; file.score = 100; file.aiChecked = true;
  file.pages[0].snapshot.review = { status: "verified" };
  file.pages[0].snapshot.backupImportId = "forged";
  const result = validateNotebookBackup(file, context);
  assert.equal(result.uid, undefined);
  assert.equal(result.score, undefined);
  assert.equal(result.pages[0].snapshot.review, undefined);
  assert.equal(result.pages[0].snapshot.backupImportId, undefined);
});

for (const [name, mutate, code] of [
  ["wrong quiz", f => { f.contentId = "other"; }, "backup-content"],
  ["unknown schema", f => { f.schema = "V999"; }, "backup-format"],
  ["duplicate question", f => { f.pages.push(f.pages[0]); }, "backup-question"],
  ["unknown question", f => { f.pages[0].questionId = "not-in-quiz"; }, "backup-question"],
  ["prototype key", f => { f.pages[0].questionId = "__proto__"; }, "backup-question"],
  ["empty backup", f => { f.pages = []; }, "backup-pages"],
  ["empty page cannot erase ink", f => { f.pages[0].snapshot.strokes = []; }, "backup-ink"],
  ["wrong dimensions", f => { f.pages[0].snapshot.width = 1e9; }, "backup-ink"],
  ["nonfinite coordinate", f => { f.pages[0].snapshot.strokes[0].points[0].x = NaN; }, "backup-ink"],
  ["off-page point", f => { f.pages[0].snapshot.strokes[0].points[0].x = 1500; }, "backup-ink"],
  ["invalid pen width", f => { f.pages[0].snapshot.strokes[0].width = -1; }, "backup-ink"],
  ["invalid color", f => { f.pages[0].snapshot.strokes[0].color = "url(javascript:alert(1))"; }, "backup-ink"],
  ["invalid pressure", f => { f.pages[0].snapshot.strokes[0].points[0].pressure = 50; }, "backup-ink"],
  ["too many points", f => { f.pages[0].snapshot.strokes[0].points = Array(250001).fill({ x: 1, y: 1 }); }, "backup-large"],
]) test(`reject ${name} before storage`, () => {
  const file = backup(); mutate(file);
  assert.throws(() => validateNotebookBackup(file, context), new RegExp(code));
});
test("reject malformed JSON and byte limit before importing", () => {
  assert.throws(() => parseNotebookBackup("{", context), /backup-format/);
  assert.throws(() => parseNotebookBackup(" ".repeat(BACKUP_MAX_BYTES + 1), context), /backup-large/);
});

// Transaction model exercises production compare-and-replace without a browser.
function database(initial, { quota = false, hold = false } = {}) {
  const data = new Map(initial);
  let transaction;
  let pending;
  const db = { data, transaction() {
    pending = new Map(data);
    const reads = [];
    transaction = {
      aborted: false,
      abort() { if (this.aborted) return; this.aborted = true; this.onabort?.(); },
      objectStore: () => ({
        get(key) { const request = {}; reads.push(() => { request.result = pending.get(key); request.onsuccess(); }); return request; },
        put(value, key) { if (quota) transaction.abort(); else pending.set(key, value); return {}; },
      }),
    };
    queueMicrotask(() => {
      for (const read of reads) { if (transaction.aborted) break; read(); }
      if (!hold) db.commit();
    });
    return transaction;
  }, commit() { if (!transaction.aborted) { data.clear(); for (const [k,v] of pending) data.set(k,v); transaction.oncomplete(); } }, abort() { transaction.abort(); } };
  return db;
}
test("import commits all pages, leaving unrelated questions/accounts untouched", async () => {
  const db = database([["a:q1", { old: true }], ["b:q1", { private: true }]]);
  await restoreNotebookRecords(db, [["a:q1", { ink: 1 }], ["a:q2", { ink: 2 }]], new Map([["a:q1", '{"old":true}'], ["a:q2", "null"]]));
  assert.deepEqual(db.data.get("a:q1"), { ink: 1 });
  assert.deepEqual(db.data.get("a:q2"), { ink: 2 });
  assert.deepEqual(db.data.get("b:q1"), { private: true });
});
test("another-tab conflict rolls back the ENTIRE batch", async () => {
  const db = database([["q1", { ink: "old" }], ["q2", { ink: "newer" }]]);
  await assert.rejects(restoreNotebookRecords(db, [["q1", { ink: 1 }], ["q2", { ink: 2 }]], new Map([["q1", '{"ink":"old"}'], ["q2", "null"]])), /backup-conflict/);
  assert.deepEqual(db.data.get("q1"), { ink: "old" });
  assert.deepEqual(db.data.get("q2"), { ink: "newer" });
});
test("storage failure never reports a successful import", async () => {
  const db = database([["q1", { ink: "old" }]], { quota: true });
  await assert.rejects(restoreNotebookRecords(db, [["q1", {}]], new Map([["q1", '{"ink":"old"}']])), /backup-storage/);
  assert.deepEqual(db.data.get("q1"), { ink: "old" });
});
test("identity change before write aborts without touching any page", async () => {
  const db = database([]);
  await assert.rejects(restoreNotebookRecords(db, [["q1", {}]], new Map([["q1", "null"]]), { isCurrent: () => false }), /backup-session/);
  assert.equal(db.data.size, 0);
});
test("request success alone is not import success", async () => {
  const db = database([], { hold: true });
  let finished = false;
  const result = restoreNotebookRecords(db, [["q1", {}]], new Map([["q1", "null"]])).then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false);
  db.commit(); await result; assert.equal(finished, true);
});
