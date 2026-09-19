import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { validateNotebookBackup, restoreNotebookRecords } from "../public/shared/notebook-backup.js";

const source = readFileSync(new URL("../public/shared/quiz-evidence.js", import.meta.url), "utf8")
  .replace(/^import[^\n]+\n/gm, "").replace("export class QuizEvidenceManager", "class QuizEvidenceManager");
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function harness() {
  const timers = new Map();
  let timerId = 0;
  const context = vm.createContext({
    window: {}, console, structuredClone, AbortController, validateNotebookBackup, restoreNotebookRecords,
    dragAnswerText: (_question, answers) => Object.entries(answers || {}).map(([slot, item]) => `${slot}: ${item}`).join("; "),
    dragQuestionText: () => "Passage and image descriptions; Slots A and B; item choices",
    setTimeout: (callback) => { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout: (id) => timers.delete(id),
    crypto: { randomUUID: () => "test-verification" },
  });
  vm.runInContext(`${source}\n globalThis.api = {
    QuizEvidenceManager, notebookRecord,
    setDatabase(value) { window.indexedDB = {}; notebookDatabasePromise = Promise.resolve(value); },
    setRecord(fn) { notebookRecord = fn; },
  };`, context);
  const manager = new context.api.QuizEvidenceManager({
    identityKey: "a", contentId: "quiz-one", questions: [{ id: "q1" }],
    language: () => "en", onChange() {},
  });
  return { ...context.api, context, manager, timers };
}

test("notebook storage is successful only after transaction commit", async () => {
  const h = harness();
  const request = {};
  const transaction = { objectStore: () => ({ get: () => request, put: () => ({}) }) };
  h.setDatabase({ transaction: () => transaction });
  let finished = false;
  const saving = h.notebookRecord("put", "key", { strokes: [1] }).then(() => { finished = true; });
  await settle();
  request.onsuccess();
  await settle();
  assert.equal(finished, false);
  transaction.oncomplete();
  await saving;
  assert.equal(finished, true);
});

test("a stale editor cannot autosave over imported ink", async () => {
  const h = harness();
  const request = { result: { backupImportId: "new-import" } };
  let writes = 0;
  const transaction = {
    objectStore: () => ({ get: () => request, put: () => { writes++; return {}; } }),
    abort() { this.onabort(); },
  };
  h.setDatabase({ transaction: () => transaction });
  const saving = h.notebookRecord("put", "key", { strokes: [1] });
  const rejected = assert.rejects(saving, /did not finish/);
  await settle(); request.onsuccess(); await rejected;
  assert.equal(writes, 0);
});

test("writing after import keeps the imported page's concurrency token", async () => {
  const h = harness();
  let saved;
  h.setRecord(async (_, key, value) => { saved = value; return true; });
  h.manager.memory.set("q1", { backupImportId: "import-token", strokes: [1] });
  h.manager.saveNotebookSnapshot("q1", { strokes: [1, 2], revision: 2 }, { changed: true });
  await h.manager.flushAll();
  assert.equal(saved.backupImportId, "import-token");
  assert.equal(saved.strokes.length, 2);
});

test("import requires overwrite consent and a current identity/work revision", async () => {
  const h = harness();
  const plan = { lifecycle: h.manager.lifecycle, revision: h.manager.state.globalRevision, conflicts: ["q1"] };
  await assert.rejects(h.manager.importNotebookBackup(plan), /backup-overwrite/);
  h.manager.lifecycle++;
  await assert.rejects(h.manager.importNotebookBackup(plan, { overwrite: true }), /backup-session/);
  assert.equal(h.manager.memory.size, 0);
});

test("an abort after request success still rejects the notebook write", async () => {
  const h = harness();
  const request = {};
  const transaction = { objectStore: () => ({ get: () => request, put: () => ({}) }) };
  h.setDatabase({ transaction: () => transaction });
  const saving = h.notebookRecord("put", "key", {});
  const rejected = assert.rejects(saving, /did not finish/);
  await settle();
  request.onsuccess();
  transaction.onabort();
  await rejected;
});

test("flushAll writes every dirty question before close, not only the current one", async () => {
  const h = harness();
  const stored = new Map();
  h.setRecord(async (_, key, value) => { stored.set(key, value); return true; });
  h.manager.saveNotebookSnapshot("q1", { strokes: [1], revision: 1 }, { changed: true });
  h.manager.saveNotebookSnapshot("q2", { strokes: [2], revision: 1 }, { changed: true });
  assert.equal(await h.manager.flushAll(), true);
  assert.equal(h.timers.size, 0);
  assert.deepEqual(stored.get("v1:a:quiz-one:q1").strokes, [1]);
  assert.deepEqual(stored.get("v1:a:quiz-one:q2").strokes, [2]);
  assert.equal(h.manager.hasUnsavedNotebook(), false);
});

test("failed handwriting save stays dirty and can be retried", async () => {
  const h = harness();
  h.setRecord(async () => { throw new Error("quota"); });
  h.manager.saveNotebookSnapshot("q1", { strokes: [1], revision: 1 });
  assert.equal(await h.manager.flushAll(), false);
  assert.equal(h.manager.storageFailed, true);
  assert.equal(h.manager.hasUnsavedNotebook(), true);
  h.setRecord(async () => true);
  assert.equal(await h.manager.flushAll(), true);
  assert.equal(h.manager.storageFailed, false);
});

test("an unloaded notebook never flushes a blank snapshot over saved ink", () => {
  const h = harness();
  let called = false;
  h.manager.current = { questionId: "q1", notebookReady: false, notebook: {
    exportSnapshot() { called = true; return { strokes: [] }; }, destroy() {},
  } };
  h.manager.unmount();
  assert.equal(called, false);
  assert.equal(h.manager.dirtyNotebooks.size, 0);
});

test("a late notebook load does not populate the new identity memory", async () => {
  const h = harness();
  let respond;
  h.setRecord(() => new Promise((resolve) => { respond = resolve; }));
  const loading = h.manager.readNotebook("q1");
  await settle();
  h.manager.setIdentity("b");
  respond({ strokes: ["old-user"] });
  assert.equal(await loading, null);
  assert.equal(h.manager.memory.size, 0);
  assert.equal(h.manager.identityKey, "b");
});

test("AI work stops before calling the Worker when identity changes during image preparation", async () => {
  const h = harness();
  h.manager.entry("q1").reasoning = "my reasoning";
  let respond;
  h.manager.evidenceImage = () => new Promise((resolve) => { respond = resolve; });
  let workerCalls = 0;
  h.context.fetch = async () => { workerCalls++; throw new Error("unexpected"); };
  const checking = h.manager.checkQuestion({ id: "q1" });
  await settle();
  h.manager.setIdentity("b");
  respond(null);
  assert.equal((await checking).cancelled, true);
  assert.equal(workerCalls, 0);
  assert.equal(Object.keys(h.manager.state.entries).length, 0);
});

test("drag AI context describes slots and selections, never object-to-string answers", () => {
  const h = harness();
  h.manager.getAnswer = () => ({ a: "same", b: "sum" });
  const payload = h.manager.questionPayload({ id: "q1", type: "drag-drop", options: [],
    prompt: { textContent: "Fill passage" }, solution: { textContent: "Explanation" },
    slots: [{ id: "a", answer: "same" }, { id: "b", answer: "sum" }],
  });
  assert.match(payload.question, /Passage and image descriptions/);
  assert.equal(payload.selectedAnswer, "a: same; b: sum");
  assert.doesNotMatch(payload.question, /\[object Object\]/);
  assert.match(payload.referenceSolution, /a: same; b: sum/);
});
