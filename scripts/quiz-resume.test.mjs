import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { readQuizContent } from "../public/shared/quiz-content-adapter.js";
import { dragAnswerSummary } from "../public/shared/quiz-drag-model.js";
import { hasAnswer, isCorrectAnswer, isStoredAnswer, parseNumericAnswer, MAX_ANSWER_LENGTH } from "../public/shared/quiz-question-model.js";

// Execute the production closure, with only browser edges replaced. No test API
// is added to the shipped engine and no test packages are required.
const source = await readFile(new URL("../public/shared/quiz-core.js", import.meta.url), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const key = (identity, content = "sample-quiz") => `learning-hub-quiz:v1:${identity}:${content}`;
const baseline = (overrides = {}) => ({
  version: 2,
  answers: {},
  giveUps: {},
  hintLevels: {},
  masteredIds: [],
  currentIndex: 0,
  attempt: 1,
  view: "exam",
  elapsedMs: 0,
  savedAt: 100,
  latestScore: null,
  evidence: null,
  ...overrides,
});

function node(dataset = {}, selectors = {}) {
  return {
    dataset,
    hidden: false,
    textContent: "",
    style: {},
    children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    querySelector(selector) { return selectors[selector] || null; },
    querySelectorAll(selector) { return selectors[selector] || []; },
    replaceChildren() {},
    append() {},
    setAttribute() {},
    addEventListener() {},
    removeEventListener() {},
  };
}

function makeHarness() {
  let now = 1_700_000_000_000;
  let serial = 0;
  let storageFails = false;
  const storage = new Map();
  const writes = [];
  const timers = new Map();
  const messages = [];
  const listeners = new Map();
  const documentListeners = new Map();
  const status = node();
  const questionNodes = ["q1", "q2"].map((id, index) => node(
    { questionId: id, answer: index === 0 ? "A" : "B" },
    {
      "[data-question-prompt]": node({ th: "คำถาม", en: "Question" }),
      "[data-question-solution]": node({ th: "เฉลย", en: "Solution" }),
      "[data-choice-id]": [node({ choiceId: "A" }), node({ choiceId: "B" })],
      "[data-question-hint]": [node(), node()],
    },
  ));
  const root = node(
    { activityKind: "quiz", activityId: "sample-quiz" },
    { "[data-question]": questionNodes },
  );
  const elements = new Map([
    ["[data-quiz-shell]", node({ contentSrc: "sample.html" })],
    ["[data-quiz-app]", node()],
    ["[data-quiz-loading]", node()],
    ["[data-quiz-error]", node()],
    ["[data-quiz-print-source]", node()],
    ["[data-quiz-storage-status]", status],
  ]);
  const parent = { postMessage(message, origin) { messages.push({ ...plain(message), origin }); } };
  const window = {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    confirm: () => true,
    alert() {},
  };
  class EvidenceStub {
    constructor(options) { this.identityKey = options.identityKey; this.data = null; this.options = options; }
    configureContextAccessors() {}
    unmount() {}
    destroy() {}
    dispose() {}
    flushCurrent() {}
    async flushAll() { return true; }
    hasUnsavedNotebook() { return false; }
    setIdentity(identity) { this.identityKey = identity; this.reset(); }
    reset() { this.data = null; }
    restore(value) { this.data = value ? plain(value) : null; }
    serializeLocal() { return this.data; }
    serializeCloud() { return this.data; }
    needsExport() { return false; }
    mount() {}
  }
  const document = {
    documentElement: { lang: "en" },
    visibilityState: "visible",
    querySelector: (selector) => elements.get(selector) || null,
    querySelectorAll: () => [],
    createElement: () => node(),
    addEventListener(type, callback) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(callback);
    },
    dispatchEvent(event) {
      for (const callback of documentListeners.get(event.type) || []) callback(event);
    },
  };
  const context = vm.createContext({
    window, document, parent,
    location: { search: "", origin: "https://example.test", href: "https://example.test/quiz-player.html" },
    URL, URLSearchParams, console,
    Date: class extends Date { static now() { return now; } },
    crypto: { randomUUID: () => `request-${++serial}` },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    DOMParser: class { parseFromString() { return { querySelector: () => root }; } },
    fetch: async () => ({ ok: true, text: async () => "<test-content>" }),
    QuizEvidenceManager: EvidenceStub,
    createNotebookBackupUi: () => ({ busy: false, open() {}, invalidate() {} }),
    readQuizContent, hasAnswer, isCorrectAnswer, isStoredAnswer, parseNumericAnswer, MAX_ANSWER_LENGTH, dragAnswerSummary,
    hideMathKeyboard() {}, mountNumericAnswer() {},
    localStorage: {
      getItem(storageKey) { if (storageFails) throw new Error("Storage disabled"); return storage.get(storageKey) ?? null; },
      setItem(storageKey, value) {
        if (storageFails) throw new Error("Quota exceeded");
        storage.set(storageKey, value);
        writes.push({ key: storageKey, value: JSON.parse(value) });
      },
    },
    setInterval: () => ++serial,
    clearInterval() {},
    setTimeout(callback, delay) {
      const id = ++serial;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  const injected = source
    .replace(/^import[^\n]+\n/gm, "")
    .replace(/  void loadContent\(\);\s*\}\)\(\);\s*$/, `
      render = () => {};
      globalThis.__quizTest = {
        state, loadContent, applyHubContext, applySnapshot, snapshot, loadLocal,
        saveLocalNow, loadCloud, saveCloudNow, persist, persistLocalOnly,
        storageKey, pendingStorageRequests, renderStorageStatus,
        persistNavigation, retrySync, resolveCloudConflict,
        evidence: () => evidenceManager,
        setContentReady: (ready) => { contentRoot = ready ? {} : null; },
      };
    })();`);
  assert.ok(injected.includes("globalThis.__quizTest"), "Harness entry marker matches production closure");
  vm.runInContext(injected, context, { filename: "quiz-core.js" });
  const api = context.__quizTest;
  const settle = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
  function dispatch(data, options = {}) {
    const event = { source: parent, origin: "https://example.test", data, ...options };
    for (const callback of listeners.get("message") || []) callback(event);
  }
  const response = (request, result, options) => dispatch({
    type: "learning-hub-quiz-storage-result",
    requestId: request.requestId,
    uid: request.uid,
    contentId: request.contentId,
    ...result,
  }, options);
  return {
    ...api, storage, writes, timers, messages, parent, window, status,
    settle, dispatch, response,
    time: () => now,
    setTime(value) { now = value; },
    setStorageFailure(value = true) { storageFails = value; },
    seed(identity, value) { storage.set(key(identity), JSON.stringify(value)); },
    read(identity) { return JSON.parse(storage.get(key(identity)) || "null"); },
    async load() { await api.loadContent(); await settle(); },
    async advance(milliseconds) {
      now += milliseconds;
      const due = [...timers.entries()].filter(([, entry]) => entry.at <= now);
      for (const [id, entry] of due) {
        if (!timers.has(id)) continue;
        timers.delete(id);
        entry.callback();
      }
      await settle();
    },
    async choose(identity, saved = baseline()) {
      api.applyHubContext({ identity: { uid: identity === "guest" ? null : identity } });
      await settle();
      const load = messages.findLast((message) => message.type === "learning-hub-quiz-load");
      if (identity !== "guest" && load) {
        response(load, { ok: true, value: saved });
        await settle();
        for (const save of messages.filter((message) => message.type === "learning-hub-quiz-save")) {
          response(save, { ok: true });
        }
        await settle();
      }
    },
  };
}

test("context received before HTML load selects the correct local account and starts cloud load", async () => {
  const h = makeHarness();
  h.seed("student-a", baseline({ answers: { q1: "B" }, currentIndex: 1 }));
  h.applyHubContext({ identity: { uid: "student-a" } });
  await h.load();
  assert.equal(h.state.identityKey, "student-a");
  assert.deepEqual(plain(h.state.answers), { q1: "B" });
  assert.equal(h.state.currentIndex, 1);
  const request = h.messages.find((message) => message.type === "learning-hub-quiz-load");
  assert.ok(request, "Authenticated HTML load asks the parent for cloud state");
  assert.equal(request.uid, "student-a");
});

test("switching to an account without a draft resets answers, mastery, position, score and evidence", async () => {
  const h = makeHarness();
  await h.load();
  await h.choose("student-a");
  Object.assign(h.state, {
    answers: { q1: "A" }, giveUps: { q2: true }, hintLevels: { q1: 1 },
    masteredIds: ["q1"], currentIndex: 1, attempt: 3, view: "results",
    latestScore: { score: 1, maxScore: 2, submittedAt: 500, status: "in-progress" },
  });
  h.evidence().restore({ version: 1, items: { q1: { reasoning: "Account A working" } } });
  h.applyHubContext({ identity: { uid: "student-b" } });
  assert.equal(h.state.identityKey, "student-b");
  assert.deepEqual(plain(h.state.answers), {});
  assert.deepEqual(plain(h.state.giveUps), {});
  assert.deepEqual(plain(h.state.hintLevels), {});
  assert.deepEqual(plain(h.state.masteredIds), []);
  assert.equal(h.state.currentIndex, 0);
  assert.equal(h.state.attempt, 1);
  assert.equal(h.state.view, "exam");
  assert.equal(h.state.latestScore, null);
  assert.ok(!JSON.stringify(h.evidence().serializeLocal()).includes("Account A working"));
  assert.deepEqual(h.read("student-a").answers, { q1: "A" });
});

function addDragQuestion(h) {
  Object.assign(h.state.questions[0], { type: "drag-drop", reuse: "once",
    items: [{ id: "same" }, { id: "sum" }], slots: [{ id: "a", answer: "same" }, { id: "b", answer: "sum" }],
  });
}

test("drag partial answers restore atomically and survive local reload", async () => {
  const h = makeHarness(); await h.load(); addDragQuestion(h);
  assert.equal(h.applySnapshot(baseline({ answers: { q1: { a: "same" } } })), true);
  assert.equal(h.saveLocalNow(), true);
  h.state.answers = {};
  assert.equal(h.loadLocal(), true);
  assert.deepEqual(plain(h.state.answers), { q1: { a: "same" } });
  const before = plain(h.snapshot());
  assert.equal(h.applySnapshot(baseline({ answers: { q1: { unknown: "same" } } })), false);
  assert.deepEqual(plain(h.snapshot()), before);
});

test("cloud uses nested drag answers without mixing account drafts", async () => {
  const h = makeHarness(); await h.load(); addDragQuestion(h);
  await h.choose("student-a", baseline({ answers: { q1: { b: "sum", a: "same" } } }));
  assert.deepEqual(plain(h.state.answers.q1), { b: "sum", a: "same" });
  h.state.answers.q1 = { a: "sum" };
  h.persist();
  const saving = h.saveCloudNow();
  await h.settle();
  const save = h.messages.findLast(message => message.type === "learning-hub-quiz-save");
  h.response(save, { ok: true });
  await saving;
  assert.equal(save.uid, "student-a");
  assert.deepEqual(save.value.answers.q1, { a: "sum" });
  h.applyHubContext({ identity: { uid: "student-b" } });
  assert.deepEqual(plain(h.state.answers), {});
  assert.deepEqual(h.read("student-a").answers.q1, { a: "sum" });
});

test("guest work stays in the guest draft and is not transferred to a signed-in account", async () => {
  const h = makeHarness();
  await h.load();
  h.state.answers = { q2: "B" };
  h.persist();
  h.applyHubContext({ identity: { uid: "student-a" } });
  assert.deepEqual(plain(h.state.answers), {});
  assert.deepEqual(h.read("guest").answers, { q2: "B" });
  h.applyHubContext({ identity: { uid: null } });
  assert.deepEqual(plain(h.state.answers), { q2: "B" });
});

test("a late cloud load from the old account cannot restore into the new account", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const old = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  h.applyHubContext({ identity: { uid: "student-b" } });
  h.response(old, { ok: true, value: baseline({ savedAt: h.time() + 1000, answers: { q1: "A" } }) });
  await h.settle();
  assert.equal(h.state.identityKey, "student-b");
  assert.deepEqual(plain(h.state.answers), {});
  assert.notEqual(h.state.storageStatus, "cloud");
});

test("an account change cancels debounced old-account writes and ignores late save acknowledgements", async () => {
  const h = makeHarness();
  await h.load();
  await h.choose("student-a");
  h.state.answers = { q1: "A" };
  h.persist();
  const inFlight = h.saveCloudNow();
  const oldSave = h.messages.findLast((message) => message.type === "learning-hub-quiz-save");
  h.applyHubContext({ identity: { uid: "student-b" } });
  const countAtSwitch = h.messages.filter((message) => message.type === "learning-hub-quiz-save").length;
  await h.advance(1000);
  assert.equal(h.messages.filter((message) => message.type === "learning-hub-quiz-save").length, countAtSwitch);
  h.response(oldSave, { ok: true });
  await h.settle();
  assert.notEqual(h.state.storageStatus, "cloud");
  assert.deepEqual(h.read("student-a").answers, { q1: "A" });
  assert.equal(h.read("student-b"), null, "No delayed old-account timer creates a new-account draft");
  void inFlight;
});

test("cloud restoration is cached locally without inventing a newer modification timestamp", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const load = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  h.response(load, { ok: true, value: baseline({ savedAt: 900, answers: { q2: "B" }, currentIndex: 1 }) });
  await h.settle();
  assert.deepEqual(plain(h.state.answers), { q2: "B" });
  assert.equal(h.state.savedAt, 900);
  assert.equal(h.read("student-a")?.savedAt, 900);
  assert.deepEqual(h.read("student-a")?.answers, { q2: "B" });
});

test("independent local edits and cloud work require an explicit choice before overwriting", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const load = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  h.state.answers = { q1: "B" };
  h.persist();
  h.response(load, { ok: true, value: baseline({ savedAt: h.time() - 1000, answers: { q1: "A" } }) });
  await h.settle();
  assert.deepEqual(plain(h.state.answers), { q1: "B" });
  assert.equal(h.state.storageStatus, "conflict");
  assert.equal(h.messages.filter((message) => message.type === "learning-hub-quiz-save").length, 0);
  const resolving = h.resolveCloudConflict("local");
  await h.settle();
  const save = h.messages.findLast((message) => message.type === "learning-hub-quiz-save");
  assert.ok(save, "The more recent local edit is uploaded");
  assert.deepEqual(save.value.answers, { q1: "B" });
  h.response(save, { ok: true });
  await resolving;
});

test("navigation during cloud loading never overwrites answers and keeps the selected question", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const request = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  h.state.currentIndex = 1;
  h.persistNavigation();
  assert.equal(h.state.savedAt, 0, "Navigation is not an answer modification");
  h.response(request, { ok: true, value: baseline({ answers: { q1: "A" }, currentIndex: 0 }) });
  await h.settle();
  assert.deepEqual(plain(h.state.answers), { q1: "A" });
  assert.equal(h.state.currentIndex, 1);
  assert.equal(h.messages.filter((message) => message.type === "learning-hub-quiz-save").length, 0);
  assert.deepEqual(h.read("student-a").answers, { q1: "A" });
});

test("editing after a failed cloud read keeps a truthful status and never blindly writes", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const request = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  h.response(request, { ok: false, code: "permission-denied" });
  await h.settle();
  h.state.answers = { q1: "B" };
  h.persist();
  await h.advance(1000);
  assert.equal(h.state.storageStatus, "cloud-error");
  assert.deepEqual(h.read("student-a").answers, { q1: "B" });
  assert.equal(h.messages.filter((message) => message.type === "learning-hub-quiz-save").length, 0);
  const retry = h.retrySync();
  const retried = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  assert.notEqual(retried.requestId, request.requestId);
  h.response(retried, { ok: true, value: null });
  await h.settle();
  const save = h.messages.findLast((message) => message.type === "learning-hub-quiz-save");
  assert.deepEqual(save.value.answers, { q1: "B" });
  h.response(save, { ok: true });
  await retry;
  assert.equal(h.state.storageStatus, "cloud");
});

test("choosing cloud resolves a conflict without uploading the local alternative", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const request = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  h.state.answers = { q1: "B" };
  h.persist();
  h.response(request, { ok: true, value: baseline({ answers: { q1: "A" } }) });
  await h.settle();
  await h.resolveCloudConflict("cloud");
  assert.deepEqual(plain(h.state.answers), { q1: "A" });
  assert.deepEqual(h.read("student-a").answers, { q1: "A" });
  assert.equal(h.messages.filter((message) => message.type === "learning-hub-quiz-save").length, 0);
});

test("local sync metadata survives reload and distinguishes an unchanged cloud baseline", async () => {
  const first = makeHarness();
  await first.load();
  await first.choose("student-a", baseline({ answers: { q1: "A" } }));
  first.state.answers.q2 = "B";
  first.persist();
  first.window.LearningHubQuiz.flushLocal();
  const second = makeHarness();
  second.seed("student-a", first.read("student-a"));
  await second.load();
  second.applyHubContext({ identity: { uid: "student-a" } });
  const request = second.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  second.response(request, { ok: true, value: baseline({ answers: { q1: "A" } }) });
  await second.settle();
  const save = second.messages.findLast((message) => message.type === "learning-hub-quiz-save");
  assert.deepEqual(save.value.answers, { q1: "A", q2: "B" });
  assert.equal(save.value.localSync, undefined, "Local coordination metadata is not sent to Firebase");
  second.response(save, { ok: true });
  await second.settle();
  assert.equal(second.read("student-a").localSync.dirty, false);
});

test("storage replies require the parent window, matching uid and matching content id", async () => {
  const h = makeHarness();
  await h.load();
  h.applyHubContext({ identity: { uid: "student-a" } });
  const load = h.messages.findLast((message) => message.type === "learning-hub-quiz-load");
  const result = { ok: true, value: baseline({ savedAt: 999, answers: { q1: "A" } }) };
  h.response(load, result, { source: {} });
  h.response(load, { ...result, uid: "student-b" });
  h.response(load, { ...result, contentId: "another-quiz" });
  await h.settle();
  assert.deepEqual(plain(h.state.answers), {});
  h.response(load, result);
  await h.settle();
  assert.deepEqual(plain(h.state.answers), { q1: "A" });
});

test("malformed snapshots are rejected without partially changing the current draft", async () => {
  const invalid = [
    { masteredIds: {} }, { answers: [] }, { answers: { q1: "not-an-option" } },
    { giveUps: { q1: "true" } }, { hintLevels: { q1: -1 } },
    { currentIndex: 0.5 }, { attempt: Infinity }, { elapsedMs: -10 },
    { latestScore: { score: "broken" } }, { evidence: "broken" },
  ];
  for (const change of invalid) {
    const h = makeHarness();
    await h.load();
    h.state.answers = { q2: "B" };
    const before = plain(h.snapshot());
    let applied;
    assert.doesNotThrow(() => { applied = h.applySnapshot(baseline({ answers: { q1: "A" }, ...change })); });
    assert.equal(applied, false, `Reject ${JSON.stringify(change)}`);
    assert.deepEqual(plain(h.snapshot()), before, `Atomic rejection for ${JSON.stringify(change)}`);
  }
});

test("local storage failures do not claim the draft was saved on this device", async () => {
  const h = makeHarness();
  await h.load();
  h.state.answers = { q1: "B" };
  h.setStorageFailure();
  const saved = h.saveLocalNow();
  h.renderStorageStatus();
  assert.equal(saved, false);
  assert.notEqual(h.state.storageStatus, "local");
  assert.doesNotMatch(h.status.textContent, /^Saved on this device$/);
  assert.deepEqual(plain(h.state.answers), { q1: "B" }, "In-memory work remains usable");
});

test("public flushLocal saves the current draft without waiting for the debounce", async () => {
  const h = makeHarness();
  await h.load();
  h.state.answers = { q1: "A" };
  h.persist();
  assert.equal(typeof h.window.LearningHubQuiz.flushLocal, "function");
  assert.equal(h.window.LearningHubQuiz.flushLocal(), true);
  assert.deepEqual(h.read("guest").answers, { q1: "A" });
});

test("prepareClose refuses to discard work when device storage fails", async () => {
  const h = makeHarness();
  await h.load();
  h.state.answers = { q1: "A" };
  h.setStorageFailure();
  assert.equal(await h.window.LearningHubQuiz.prepareClose(), false);
  assert.deepEqual(plain(h.state.answers), { q1: "A" });
});

test("prepareClose waits for notebook commit and keeps the Quiz on notebook failure", async () => {
  const h = makeHarness();
  await h.load();
  let complete;
  h.evidence().flushAll = () => new Promise((resolve) => { complete = resolve; });
  let result;
  const closing = h.window.LearningHubQuiz.prepareClose().then((value) => { result = value; });
  await h.settle();
  assert.equal(result, undefined);
  complete(false);
  await closing;
  assert.equal(result, false);
});

test("unsynced work requires consent to close and a guest does not require cloud", async () => {
  const h = makeHarness();
  await h.load();
  assert.equal(await h.window.LearningHubQuiz.prepareClose(), true);
  h.applyHubContext({ identity: { uid: "student-a" } });
  h.state.answers = { q1: "A" };
  h.persist();
  h.window.confirm = () => false;
  assert.equal(await h.window.LearningHubQuiz.prepareClose(), false);
  assert.deepEqual(h.read("student-a").answers, { q1: "A" });
});
