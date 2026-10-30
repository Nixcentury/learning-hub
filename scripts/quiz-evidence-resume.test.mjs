import { parseHTML } from "linkedom";
import { requiresReasoning } from "../public/shared/quiz-question-model.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { validateNotebookBackup, restoreNotebookRecords } from "../public/shared/notebook-backup.js";

const source = readFileSync(new URL("../public/shared/quiz-evidence.js", import.meta.url), "utf8")
  .replace(/^import[^\n]+\n/gm, "").replace("export class QuizEvidenceManager", "class QuizEvidenceManager");
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function harness() {
  const { document } = parseHTML("<html><body><div data-evidence-export-host></div></body></html>");
  const timers = new Map();
  let timerId = 0;
  const context = vm.createContext({
    window: {}, document, console, requiresReasoning, structuredClone, AbortController, validateNotebookBackup, restoreNotebookRecords,
    dragAnswerText: (_question, answers) => Object.entries(answers || {}).map(([slot, item]) => `${slot}: ${item}`).join("; "),
    createDragEvidenceBody: () => { const node = document.createElement("div"); node.textContent = "Drag slots and selected items"; return node; },
    dragQuestionText: () => "Passage and image descriptions; Slots A and B; item choices",
    setTimeout: (callback) => { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout: (id) => timers.delete(id),
    crypto: { randomUUID: () => "test-verification" },
  });
  vm.runInContext(`${source}\n globalThis.api = {
    QuizEvidenceManager, notebookRecord, normalizeWorkerReview, evidencePageSlices, REVIEW_POLICY_VERSION, selectedOptionText,
    setDatabase(value) { window.indexedDB = {}; notebookDatabasePromise = Promise.resolve(value); },
    setRecord(fn) { notebookRecord = fn; },
  };`, context);
  const manager = new context.api.QuizEvidenceManager({
    identityKey: "a", contentId: "quiz-one", questions: [{ id: "q1" }],
    language: () => "en", onChange() {},
  });
  return { ...context.api, context, manager, timers };
}

test("choice and number require evidence, while drag-fill, unanswered and give-up do not", () => {
  const h = harness();
  const results = [
    { question: { id: "choice", type: "choice" }, status: "correct" },
    { question: { id: "number", type: "number" }, status: "incorrect" },
    { question: { id: "drag", type: "drag-drop" }, status: "correct" },
    { question: { id: "empty", type: "choice" }, status: "unanswered" },
    { question: { id: "giveup", type: "choice" }, status: "giveup" },
  ];
  h.manager.questions = results.map(result => result.question);
  assert.deepEqual(Array.from(h.manager.missingForAnswered(results), q => q.id), ["choice", "number"]);
  h.manager.entry("choice").reasoning = "Because the energy gap is larger.";
  assert.deepEqual(Array.from(h.manager.missingForAnswered(results), q => q.id), ["number"]);
  assert.equal(h.manager.statusFor("drag", "correct").kind, "answer-only");
});

test("only an explicit whole-method positive verdict can receive an AI-verified stamp", () => {
  const h = harness();
  for (const feedback of [
    { status: "uncertain", correct_so_far_th: "The first step is correct." },
    { correct_so_far_en: "Your formula is right." },
    { status: "not_correct" }, { status: "not_verified" },
    { status: "partial", correct_so_far_en: "Some steps are correct." },
    { status: "correct", issue_en: "The substitution is wrong." },
  ]) assert.notEqual(h.normalizeWorkerReview({ feedback }).status, "verified");
  assert.equal(h.normalizeWorkerReview({ feedback: { status: "correct", correct_so_far_en: "All shown steps are valid." } }).status, "verified");
  assert.equal(h.normalizeWorkerReview({ feedback: { status: "correct", issue_th: "ไม่มีข้อผิดพลาด", issue_en: "No issues." } }).status, "verified");
  assert.equal(h.normalizeWorkerReview({ feedback: { status: "correct", issue_th: "ไม่มีข้อผิดพลาดในสูตร แต่แทนค่าผิด" } }).status, "revision");
});

test("old-policy and edited-work verdicts cannot retain a positive printed stamp", () => {
  const h = harness(), entry = h.manager.entry("q1");
  entry.reasoning = "E = hf";
  entry.review = { status: "verified", evidenceRevision: 0, policyVersion: 1 };
  assert.equal(h.manager.statusFor("q1", "correct").kind, "recheck");
  assert.equal(h.manager.needsReview("q1"), true);
  entry.review.policyVersion = h.REVIEW_POLICY_VERSION;
  entry.review.contextSignature = h.manager.contextSignature("q1");
  assert.equal(h.manager.statusFor("q1", "correct").kind, "verified");
  assert.equal(h.manager.needsReview("q1"), false);
  h.manager.markContextChanged("q1");
  assert.equal(h.manager.statusFor("q1", "correct").kind, "recheck");
  assert.equal(entry.reasoning, "E = hf");
});

test("language switching preserves review validity; changing the authored question requires recheck", () => {
  const h = harness(), prompt = h.context.document.createElement("div");
  prompt.dataset.th = "คำถามเดิม"; prompt.dataset.en = "Original question"; prompt.textContent = prompt.dataset.th;
  h.manager.questions[0].prompt = prompt;
  const entry = h.manager.entry("q1"); entry.reasoning = "My working";
  entry.review = { status: "verified", evidenceRevision: entry.revision, policyVersion: h.REVIEW_POLICY_VERSION, contextSignature: h.manager.contextSignature("q1") };
  prompt.textContent = prompt.dataset.en;
  assert.equal(h.manager.statusFor("q1", "correct").kind, "verified");
  prompt.dataset.en = "A different authored question";
  assert.equal(h.manager.statusFor("q1", "correct").kind, "recheck");
});

test("drag-fill never sends work to AI, including during batch review", async () => {
  const h = harness(), drag = { id: "drag", type: "drag-drop" };
  h.manager.questions = [drag]; h.manager.entry("drag").reasoning = "An old optional note";
  h.manager.evidenceImage = () => { throw new Error("No AI image should be created"); };
  assert.equal((await h.manager.checkQuestion(drag)).notRequired, true);
  await h.manager.reviewPending([drag]);
  assert.equal(h.manager.entry("drag").review, null);
});

test("a response to a previous working revision is marked for recheck", async () => {
  const h = harness(); let respond;
  const question = { id: "q1", type: "number", answer: "2", options: [], prompt: { dataset: { en: "1 + 1?" } } };
  h.manager.questions = [question]; h.manager.entry("q1").reasoning = "1 + 1 = 2";
  h.manager.evidenceImage = async () => "image";
  h.context.fetch = () => new Promise(resolve => { respond = resolve; });
  const checking = h.manager.checkQuestion(question);
  await settle();
  h.manager.entry("q1").reasoning = "Changed after sending"; h.manager.markChanged("q1", "reasoning");
  respond({ ok: true, json: async () => ({ feedback: { status: "correct" } }) });
  await checking;
  assert.equal(h.manager.statusFor("q1", "correct").kind, "recheck");
});

test("printed MCQ evidence retains the diagram context, every choice, working and review status", async () => {
  const h = harness(), d = h.context.document;
  const make = html => { const node = d.createElement("div"); node.innerHTML = html; return node; };
  const question = { id: "q1", index: 0, type: "choice", prompt: make("Which force?"),
    context: make('<svg viewBox="0 0 100 100"><text x="0" y="20">Diagram label</text></svg>'),
    options: [make("First choice"), make("Second choice")] };
  question.options[0].dataset.choiceId = "a"; question.options[1].dataset.choiceId = "b";
  h.manager.questions = [question]; h.manager.getAnswer = () => "b";
  h.manager.entry("q1").reasoning = "My full reasoning";
  h.manager.snapshotImageUrl = async () => "";
  const page = await h.manager.buildQuestionPage({ title: "Mixed set", result: { question, status: "correct" } });
  assert.equal(page.querySelectorAll(".quiz-evidence-export-prompt li").length, 2);
  assert.ok(page.querySelector("svg"));
  for (const text of ["Diagram label", "First choice", "Second choice", "My full reasoning", "AWAITING AI CHECK"]) assert.ok(page.textContent.includes(text), text);
});

test("drag report pages have ordinary results without claiming AI checked them", async () => {
  const h = harness(), prompt = h.context.document.createElement("div"); prompt.textContent = "Match the symbols";
  const question = { id: "drag", index: 0, type: "drag-drop", prompt, options: [] };
  h.manager.questions = [question]; h.manager.getAnswer = () => ({ a: "one" });
  const page = await h.manager.buildQuestionPage({ title: "Mixed set", result: { question, status: "correct" } });
  assert.ok(page.textContent.includes("AUTOMATIC ANSWER CHECK"));
  assert.ok(page.textContent.includes("Answer result: Correct"));
  assert.equal(page.querySelector(".quiz-evidence-export-feedback"), null);
  assert.equal(page.querySelector(".quiz-evidence-export-notebook"), null);
});

test("scientific numeric responses print as powers of ten with their units", () => {
  const h = harness();
  assert.equal(h.selectedOptionText({ type: "number", unit: { en: "J" } }, "3.3e-19", "en"), "\\(3.3\\times10^{-19}\\) J");
  assert.equal(h.selectedOptionText({ type: "number", unit: { en: "m" } }, "5/6", "en"), "\\(5/6\\) m");
});

test("evidence page cuts preserve lines/images, repeat the stamp and cover every source pixel", () => {
  const h = harness();
  const slices = h.evidencePageSlices(2800, 1000, 100, [[950, 1050], [1700, 1800]]);
  assert.equal(slices[0].height, 950);
  let covered = 0;
  for (const slice of slices) {
    assert.equal(slice.offset, covered);
    assert.ok(slice.height + slice.top <= 1000);
    if (slice.offset) assert.equal(slice.top, 100);
    covered += slice.height;
  }
  assert.equal(covered, 2800);
});

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
