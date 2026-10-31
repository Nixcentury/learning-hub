import { gradeHomework, homeworkStorageKey } from '../public/shared/classroom-submission-model.js';
import { requiresReasoning } from "../public/shared/quiz-question-model.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { readQuizContent } from "../public/shared/quiz-content-adapter.js";
import { dragAnswerSummary } from "../public/shared/quiz-drag-model.js";
import { readBankSelection } from "../public/shared/question-bank-player.js";
import { resolveAuthoredPdfLinks } from "../public/shared/pdf-content-model.js";
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
  const handlers = new Map();
  return {
    dataset,
    hidden: false,
    textContent: "",
    style: {},
    children: [],
    classList: { add() {}, remove() {}, toggle() {} },
    querySelector(selector) { return selectors[selector] || null; },
    querySelectorAll(selector) { return selectors[selector] || []; },
    before() {},
    replaceChildren(...children) { this.children = children; },
    append(...children) { this.children.push(...children); },
    setAttribute() {},
    removeAttribute(name) { if (name === "hidden") this.hidden = false; },
    cloneNode() { return { ...node({ ...this.dataset }, selectors), textContent: this.textContent, hidden: this.hidden }; },
    addEventListener(type, callback) { if (!handlers.has(type)) handlers.set(type, []); handlers.get(type).push(callback); },
    removeEventListener(type, callback) { handlers.set(type, (handlers.get(type) || []).filter(fn => fn !== callback)); },
    dispatch(type, event = {}) { for (const callback of handlers.get(type) || []) callback(event); },
    showModal() { this.open = true; },
    close() { this.open = false; this.dispatch("close"); },
  };
}

function makeHarness({ homeworkBinding = null, temporary = false } = {}) {
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
  const navigationNodes = Object.fromEntries(["kicker", "title", "copy", "body", "content", "confirm", "back", "skip", "close"].map(name => [`[data-navigation-${name}]`, node()]));
  navigationNodes["[data-navigation-confirm]"].hidden = true;
  navigationNodes["[data-navigation-back], [data-navigation-close]"] = [navigationNodes["[data-navigation-back]"], navigationNodes["[data-navigation-close]"]];
  const navigationDialog = node({}, navigationNodes);
  const topicReviewDialog = node({}, Object.fromEntries(['[data-topic-review-browser]', '[data-topic-review-content]', '[data-topic-review-print]'].map(key => [key, node()])));
  const reviewOpens = [];
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
    ["[data-navigation-dialog]", navigationDialog],
    ["[data-topic-review-dialog]", topicReviewDialog],
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
    markContextChanged(id) { (this.changed ||= []).push(id); }
    missingForAnswered() { return []; }
    noteSubmission() { this.submissionCalls = (this.submissionCalls || 0) + 1; }
    async reviewPending() { this.reviewCalls = (this.reviewCalls || 0) + 1; }
  }
  const document = {
    documentElement: { lang: "en" },
    body: node(),
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
    location: { search: temporary ? "?temporary=1" : homeworkBinding ? "?homework=1" : "", origin: "https://example.test", href: "https://example.test/quiz-player.html" },
    URL, URLSearchParams, console,
    Date: class extends Date { static now() { return now; } },
    crypto: { randomUUID: () => `request-${++serial}` },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    DOMParser: class { parseFromString() { return { querySelector: () => root }; } },
    fetch: async () => ({ ok: true, text: async () => "<test-content>" }),
    QuizEvidenceManager: EvidenceStub,
    createNotebookBackupUi: () => ({ busy: false, open() {}, invalidate() {} }),
    gradeHomework, homeworkStorageKey, readHomeworkQuiz: () => ({ root }),
    requiresReasoning, readQuizContent, hasAnswer, isCorrectAnswer, isStoredAnswer, parseNumericAnswer, MAX_ANSWER_LENGTH, dragAnswerSummary, readBankSelection, resolveAuthoredPdfLinks,
    warmQuizEngine: async () => 'https://example.test/quiz-player.html?quizRefresh=test',
    receiveTemporaryQuiz: async () => ({ root, language: "en" }),
    hideMathKeyboard() {}, mountNumericAnswer() {},
    createTopicReviewBrowser: () => ({ open: options => reviewOpens.push(plain(options)), close() {}, refreshLanguage() {} }),
    createDragEvidenceBody(question, answer) { return { textContent: `Student passage: ${Object.values(answer || {}).join(" ")}` }; },
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
      renderQuestion = () => {};
      renderNavigation = () => {};
      renderStats = () => {};
      globalThis.__quizTest = {
        state, loadContent, applyHubContext, submitHomework,
        homeworkState: () => ({ result: homeworkResult, grade: homeworkGrade, sending: homeworkSending, storageRevision: homeworkStorageRevision }), applySnapshot, snapshot, loadLocal,
        saveLocalNow, loadCloud, saveCloudNow, persist, persistLocalOnly,
        storageKey, pendingStorageRequests, renderStorageStatus,
        persistNavigation, retrySync, resolveCloudConflict,
        giveUp, canAnswerQuestion, editAnswers, startRetry, restart, selectAnswer, submitAll, resultFor, goTo, cloneInto,
        requestNavigation, returnToQuestion, openTopicReview, skipCurrentQuestion, confirmNavigationReview, closeNavigationDialog, progressSignature,
        navigationState: () => pendingNavigation,
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
    ...api, storage, writes, timers, messages, parent, window, status, root, navigationDialog, navigationNodes, topicReviewDialog, reviewOpens,
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

test("unlocking a hidden solution reveals only its clone and preserves bilingual text", () => {
  const h = makeHarness();
  const nested = { hidden: true };
  const source = {
    hidden: true, children: [], dataset: { th: "คำตอบ 50 ปี", en: "Answer: 50 years" },
    querySelector: () => null,
    cloneNode() {
      return { hidden: this.hidden, children: [], nested: { ...nested }, textContent: "คำตอบ 50 ปี",
        removeAttribute(name) { if (name === "hidden") this.hidden = false; } };
    },
  };
  const target = { replaceChildren() { this.child = null; }, append(child) { this.child = child; } };
  h.cloneInto(target, source, true);
  assert.equal(target.child.hidden, false);
  assert.equal(target.child.textContent, "Answer: 50 years");
  assert.equal(source.hidden, true, "the source/print tree stays hidden");
  assert.equal(target.child.nested.hidden, true, "hidden descendants are not indiscriminately revealed");
});

test("give-up locks the current attempt through editing and resubmission, then next attempt permits answering", async () => {
  const h = makeHarness(); await h.load(); h.state.hintLevels.q1 = 1;
  h.selectAnswer("q1", "B"); h.giveUp();
  assert.equal(h.resultFor(h.state.questions[0]).status, "giveup");
  assert.equal(h.canAnswerQuestion("q1"), false);
  h.selectAnswer("q1", "A"); assert.equal(h.state.answers.q1, undefined);
  await h.submitAll(); assert.equal(h.state.latestScore.score, 0);
  h.editAnswers(); h.selectAnswer("q1", "A");
  assert.equal(h.state.giveUps.q1, true); assert.equal(h.state.answers.q1, undefined);
  assert.equal(h.state.attempt, 1); assert.equal(h.state.hintLevels.q1, 1);
  await h.submitAll(); assert.equal(h.state.latestScore.score, 0);
  h.startRetry();
  assert.equal(h.state.attempt, 2); assert.equal(h.state.giveUps.q1, undefined);
  assert.equal(h.state.hintLevels.q1, undefined); assert.equal(h.canAnswerQuestion("q1"), true);
  assert.equal(h.state.latestScore.score, 0, "Starting a round alone does not award credit");
  h.selectAnswer("q1", "A"); await h.submitAll();
  assert.equal(h.state.latestScore.score, 1); assert.deepEqual(plain(h.state.masteredIds), ["q1"]);
});

test("AI outcome and missing working never change ordinary quiz scoring", async () => {
  for (const outcome of ["verified", "revision", "unavailable", "throw"]) {
    const h = makeHarness(); await h.load();
    h.selectAnswer("q1", "A");
    h.evidence().missingForAnswered = () => [h.state.questions[0]];
    h.evidence().reviewPending = async () => { if (outcome === "throw") throw new Error("AI offline"); };
    await h.submitAll();
    assert.equal(h.state.latestScore.score, 1, outcome);
    assert.deepEqual(plain(h.state.masteredIds), ["q1"]);
    assert.equal(h.state.view, "results");
  }
});

test("Edit answers keeps give-ups locked and retains mastered work, hints and reasoning after reload", async () => {
  const h = makeHarness(); await h.load();
  assert.equal(h.applySnapshot(baseline({
    answers: { q1: "A" }, masteredIds: ["q1"], giveUps: { q2: true },
    hintLevels: { q1: 2, q2: 1 }, view: "results", latestScore: { score: 1, maxScore: 2 },
    evidence: { version: 1, entries: { q2: { reasoning: "Keep my working" } } },
  })), true);
  h.editAnswers(); assert.equal(h.state.currentIndex, 1); assert.equal(h.state.view, "exam");
  assert.deepEqual(plain(h.state.giveUps), { q2: true });
  assert.deepEqual(plain(h.state.answers), { q1: "A" });
  assert.deepEqual(plain(h.state.hintLevels), { q1: 2, q2: 1 }); h.saveLocalNow();
  const restored = makeHarness(); restored.seed("guest", h.read("guest")); await restored.load();
  restored.selectAnswer("q2", "B");
  assert.deepEqual(plain(restored.state.giveUps), { q2: true });
  assert.deepEqual(plain(restored.state.masteredIds), ["q1"]);
  assert.equal(restored.evidence().data.entries.q2.reasoning, "Keep my working");
  await restored.submitAll(); assert.equal(restored.state.latestScore.score, 1);
  restored.startRetry(); assert.equal(restored.state.attempt, 2);
  assert.deepEqual(plain(restored.state.giveUps), {});
  assert.deepEqual(plain(restored.state.masteredIds), ["q1"], "Next attempt retains mastered work");
  assert.equal(restored.evidence().data.entries.q2.reasoning, "Keep my working");
});

test("saved account give-ups stay locked until a next-attempt save in the same cloud context", async () => {
  const h = makeHarness(); await h.load();
  await h.choose("student-a", baseline({ giveUps: { q1: true } }));
  h.editAnswers(); h.selectAnswer("q1", "A"); h.saveLocalNow();
  assert.deepEqual(h.read("student-a").giveUps, { q1: true });
  assert.equal(h.state.answers.q1, undefined); assert.equal(h.state.attempt, 1);
  await h.submitAll(); h.startRetry(); await h.advance(1000);
  const save = h.messages.findLast(message => message.type === "learning-hub-quiz-save");
  assert.equal(save.uid, "student-a"); assert.equal(save.contentId, "sample-quiz");
  assert.deepEqual(save.value.giveUps, {}); assert.equal(save.value.attempt, 2);
  assert.deepEqual(h.read("student-a").giveUps, {});
});

test("all answer types share the give-up lock, while unanswered questions in the same round stay editable", async () => {
  for (const type of ["choice", "number", "drag-drop"]) {
    const h = makeHarness(); await h.load(); h.state.questions[0].type = type;
    h.giveUp(); h.editAnswers();
    assert.equal(h.canAnswerQuestion("q1"), false, type);
    assert.equal(h.canAnswerQuestion("q2"), true, type);
    assert.equal(h.state.currentIndex, 1, "Edit answers selects an editable question first");
    await h.submitAll(); h.startRetry(); assert.equal(h.canAnswerQuestion("q1"), true, type);
  }
});

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

function makeDragQuestion(h, index = 0) {
  const question = { ...h.state.questions[index], type: "drag-drop", reuse: "once",
    items: [{ id: "a", text: { th: "ก", en: "a" } }, { id: "b", text: { th: "ข", en: "b" } }],
    slots: [{ id: "one", answer: "a" }, { id: "two", answer: "b" }],
    body: { th: "บทความ", en: "Passage" } };
  h.state.questions[index] = question; return question;
}

test("every drag question checks forward navigation without exposing slot correctness or changing score", async () => {
  const h = makeHarness(); await h.load(); makeDragQuestion(h);
  h.state.answers.q1 = { one: "b", two: "a" };
  h.requestNavigation(1);
  assert.equal(h.state.currentIndex, 0); assert.equal(h.navigationDialog.open, true);
  assert.equal(h.navigationState().correct, false);
  assert.equal(h.navigationNodes["[data-navigation-title]"].textContent, "Not all correct yet");
  assert.equal(h.navigationNodes["[data-navigation-confirm]"].hidden, true);
  assert.equal(h.navigationNodes["[data-navigation-body]"].children.at(-1).textContent, "Student passage: b a");
  h.confirmNavigationReview(); assert.equal(h.state.currentIndex, 0);
  assert.deepEqual(plain(h.state.answers.q1), { one: "b", two: "a" });
  assert.equal(h.state.latestScore, null); assert.deepEqual(plain(h.state.masteredIds), []);
  assert.equal(h.evidence().reviewCalls || 0, 0);
  h.closeNavigationDialog(); h.state.answers.q1 = { one: "a" }; h.requestNavigation(1);
  assert.equal(h.navigationNodes["[data-navigation-title]"].textContent, "Some answer slots are still empty");
  assert.equal(h.state.currentIndex, 0);
});

test("correct drag answers require confirmation and are rechecked after editing; cancel keeps the question", async () => {
  const h = makeHarness(); await h.load(); makeDragQuestion(h);
  h.state.answers.q1 = { one: "a", two: "b" }; h.requestNavigation(1);
  assert.equal(h.navigationState().correct, true); assert.equal(h.state.currentIndex, 0);
  assert.equal(h.navigationNodes["[data-navigation-confirm]"].hidden, false);
  h.navigationDialog.dispatch("cancel", { preventDefault() {} });
  assert.equal(h.navigationState(), null); assert.equal(h.state.currentIndex, 0);
  h.requestNavigation(1); h.state.answers.q1 = { one: "b", two: "a" }; h.confirmNavigationReview();
  assert.equal(h.state.currentIndex, 0); assert.equal(h.navigationState().correct, false);
  h.closeNavigationDialog(); h.state.answers.q1 = { one: "a", two: "b" }; h.requestNavigation(1); h.confirmNavigationReview();
  assert.equal(h.state.currentIndex, 1); assert.equal(h.navigationDialog.open, false);
  assert.equal(h.state.latestScore, null); assert.deepEqual(plain(h.state.masteredIds), []);
  h.requestNavigation(0); h.requestNavigation(1);
  assert.equal(h.state.currentIndex, 0, "Revisiting still requires a fresh confirmation");
  h.confirmNavigationReview(); assert.equal(h.state.currentIndex, 1);
});

test("skip works for choices, numeric drafts and partial drag answers without changing working or give-up state", async () => {
  for (const type of ["choice", "number", "drag-drop"]) {
    const h = makeHarness(); await h.load();
    if (type === "drag-drop") makeDragQuestion(h);
    if (type === "number") h.state.questions[0] = { ...h.state.questions[0], type, answer: "3" };
    const answer = type === "drag-drop" ? { one: "b" } : type === "number" ? "1e" : "B";
    h.state.answers.q1 = answer; h.evidence().data = { entries: { q1: { text: "My working" } } };
    h.skipCurrentQuestion();
    assert.equal(h.state.currentIndex, 1); assert.deepEqual(plain(h.state.answers.q1), answer);
    assert.deepEqual(plain(h.state.skippedIds), ["q1"]); assert.deepEqual(plain(h.state.giveUps), {});
    assert.equal(h.evidence().data.entries.q1.text, "My working"); assert.equal(h.state.latestScore, null);
    await h.advance(120); assert.deepEqual(h.read("guest").skippedIds, ["q1"]);
    h.state.skippedIds = []; assert.equal(h.loadLocal(), true); assert.deepEqual(plain(h.state.skippedIds), ["q1"]);
  }
});

test("public jumps cannot bypass a drag check, while skip and backward navigation remain available", async () => {
  const h = makeHarness(); await h.load(); makeDragQuestion(h);
  h.window.LearningHubQuiz.goToQuestion(1);
  assert.equal(h.state.currentIndex, 0); assert.equal(h.navigationDialog.open, true);
  h.skipCurrentQuestion(); assert.equal(h.state.currentIndex, 1); assert.equal(h.navigationDialog.open, false);
  h.requestNavigation(0); assert.equal(h.state.currentIndex, 0);
  h.state.answers.q1 = { one: "a", two: "b" }; h.requestNavigation(1); h.confirmNavigationReview();
  assert.deepEqual(plain(h.state.skippedIds), []);
});

test("the final drag check and final skip open an overview without grading or auto-submitting", async () => {
  const h = makeHarness(); await h.load(); makeDragQuestion(h, 1); h.goTo(1);
  h.state.answers.q2 = { one: "a", two: "b" }; h.requestNavigation(2);
  assert.equal(h.state.currentIndex, 1); assert.equal(h.navigationState().kind, "review");
  h.confirmNavigationReview(); assert.equal(h.navigationState().kind, "overview");
  assert.equal(h.state.view, "exam"); assert.equal(h.state.latestScore, null);
  h.closeNavigationDialog(); h.state.answers.q2 = { one: "b" }; h.skipCurrentQuestion();
  assert.equal(h.navigationState().kind, "overview"); assert.deepEqual(plain(h.state.skippedIds), ["q2"]);
  assert.equal(h.evidence().submissionCalls || 0, 0);
});

test("skipped metadata round-trips to cloud, reads old drafts and rejects malformed flags atomically", async () => {
  const h = makeHarness(); await h.load(); await h.choose("student-a");
  const before = h.progressSignature(h.snapshot()); h.skipCurrentQuestion();
  assert.notEqual(h.progressSignature(h.snapshot()), before);
  await h.advance(650);
  const save = h.messages.findLast(message => message.type === "learning-hub-quiz-save");
  assert.deepEqual(save.value.skippedIds, ["q1"]);
  h.response(save, { ok: true }); await h.settle();
  for (const skippedIds of [{ q1: true }, [4], "q1"]) {
    const current = plain(h.snapshot()); assert.equal(h.applySnapshot(baseline({ skippedIds })), false); assert.deepEqual(plain(h.snapshot()), current);
  }
  assert.equal(h.applySnapshot(baseline({ skippedIds: ["q1", "unknown", "q1"] })), true);
  assert.deepEqual(plain(h.state.skippedIds), ["q1"]);
  h.applySnapshot(baseline()); assert.deepEqual(plain(h.state.skippedIds), []);
});

test("account changes and cloud replacement invalidate an open confirmation", async () => {
  const h = makeHarness(); await h.load(); makeDragQuestion(h);
  h.state.answers.q1 = { one: "a", two: "b" }; h.requestNavigation(1);
  h.applyHubContext({ identity: { uid: "student-b" } });
  h.confirmNavigationReview(); assert.equal(h.state.currentIndex, 0); assert.equal(h.navigationState(), null);
  h.state.answers.q1 = { one: "a", two: "b" }; h.requestNavigation(1);
  assert.equal(h.navigationState().correct, true);
  h.applySnapshot(baseline({ answers: { q1: { one: "b", two: "a" } } }));
  h.confirmNavigationReview(); assert.equal(h.state.currentIndex, 0); assert.equal(h.navigationState(), null);
});

test("skipping is a reminder, not a grading rule; explicit submit still scores retained answers", async () => {
  const h = makeHarness(); await h.load(); h.state.answers = { q1: "A", q2: "B" };
  h.skipCurrentQuestion(); h.skipCurrentQuestion();
  const submitting = h.submitAll(); await h.settle();
  assert.equal(h.navigationState().kind, "submit"); assert.equal(h.state.latestScore, null);
  h.confirmNavigationReview(); await submitting;
  assert.equal(h.state.latestScore.score, 2); assert.deepEqual(plain(h.state.skippedIds), []);
});

test("canceling the skipped-question reminder keeps the attempt editable and never starts grading", async () => {
  const h = makeHarness(); await h.load(); h.skipCurrentQuestion();
  const submitting = h.submitAll(); await h.settle();
  assert.equal(h.navigationState().kind, "submit");
  h.closeNavigationDialog(); await submitting;
  assert.equal(h.state.view, "exam"); assert.equal(h.state.latestScore, null);
  assert.equal(h.evidence().submissionCalls || 0, 0);
  h.selectAnswer("q2", "B"); assert.equal(h.state.answers.q2, "B");
});

test("ordinary Next clears a skip after a valid answer, but keeps an incomplete numeric draft marked", async () => {
  const h = makeHarness(); await h.load(); h.skipCurrentQuestion(); h.requestNavigation(0);
  h.selectAnswer("q1", "B"); h.requestNavigation(1);
  assert.deepEqual(plain(h.state.skippedIds), [], "A choice need not be correct just to use ordinary Next");
  h.goTo(0); h.state.questions[0] = { ...h.state.questions[0], type: "number", answer: "3" };
  h.state.answers.q1 = "1e"; h.skipCurrentQuestion(); h.requestNavigation(0); h.requestNavigation(1);
  assert.deepEqual(plain(h.state.skippedIds), ["q1"]);
  h.goTo(0); h.state.answers.q1 = "3"; h.requestNavigation(1);
  assert.deepEqual(plain(h.state.skippedIds), []);
});

test("skip-only edits during cloud loading require conflict resolution rather than overwriting remote answers", async () => {
  const h = makeHarness(); await h.load(); h.applyHubContext({ identity: { uid: "student-a" } }); await h.settle();
  const loading = h.messages.findLast(message => message.type === "learning-hub-quiz-load");
  h.skipCurrentQuestion();
  h.response(loading, { ok: true, value: baseline({ answers: { q1: "A", q2: "B" }, savedAt: h.time() + 1000 }) }); await h.settle();
  assert.equal(h.state.storageStatus, "conflict"); assert.deepEqual(plain(h.state.skippedIds), ["q1"]);
  assert.ok(!h.messages.some(message => message.type === "learning-hub-quiz-save"));
});

test("upgrading an old dirty draft does not invent a conflict with its unchanged cloud baseline", async () => {
  const h = makeHarness(); await h.load();
  const oldBase = JSON.stringify({ answers: [["q1", "A"]], giveUps: [], hintLevels: [], masteredIds: [], attempt: 1, latestScore: null });
  h.seed("student-a", baseline({ answers: { q1: "A", q2: "B" }, localSync: { base: oldBase, dirty: true } }));
  h.applyHubContext({ identity: { uid: "student-a" } }); await h.settle();
  const loading = h.messages.findLast(message => message.type === "learning-hub-quiz-load");
  h.response(loading, { ok: true, value: baseline({ answers: { q1: "A" } }) }); await h.settle();
  assert.notEqual(h.state.storageStatus, "conflict");
  const saving = h.messages.findLast(message => message.type === "learning-hub-quiz-save");
  assert.ok(saving); assert.deepEqual(saving.value.answers, { q1: "A", q2: "B" });
  h.response(saving, { ok: true }); await h.settle(); assert.equal(h.state.storageStatus, "cloud");
});

test("give-up, mastered questions and closed homework remain navigable; closed homework cannot be skipped", async () => {
  const h = makeHarness(); await h.load(); makeDragQuestion(h); h.state.skippedIds = ["q1"];
  h.giveUp(); assert.deepEqual(plain(h.state.skippedIds), []); h.requestNavigation(1);
  assert.equal(h.state.currentIndex, 1); assert.equal(h.navigationState(), null);
  h.goTo(0); delete h.state.giveUps.q1; h.state.masteredIds = ["q1"]; h.requestNavigation(1);
  assert.equal(h.state.currentIndex, 1); assert.equal(h.navigationState(), null);
  const closed = makeHarness({ homeworkBinding });
  await loadHomework(closed, { answersJson: '{"q2":"B"}', giveUpsJson: '{}', submittedAt: closed.time() }, { closed: true });
  makeDragQuestion(closed); closed.goTo(0); closed.skipCurrentQuestion();
  assert.equal(closed.state.currentIndex, 0); assert.deepEqual(plain(closed.state.skippedIds), []);
  closed.requestNavigation(1); assert.equal(closed.state.currentIndex, 1); assert.equal(closed.navigationState(), null);
});

test("temporary practice supports skip without writing a saved attempt or sending cloud traffic", async () => {
  const h = makeHarness({ temporary: true }); await h.load();
  h.state.answers.q1 = "B"; h.skipCurrentQuestion();
  assert.equal(h.state.currentIndex, 1); assert.deepEqual(plain(h.state.skippedIds), ["q1"]);
  await h.advance(1000); assert.equal(h.writes.length, 0);
  assert.deepEqual(h.messages.filter(message => message.type !== "learning-hub-quiz-ready"), [], "A parent readiness handshake is not a cloud read/write");
  h.restart(); assert.deepEqual(plain(h.state.skippedIds), []); assert.deepEqual(plain(h.state.answers), {});
});

const homeworkBinding={uid:'student',roomId:'r_'+'a'.repeat(32),id:'a_'+'b'.repeat(32),quizRevision:'c'.repeat(64),contentId:'sample-quiz',title:'Homework'};
async function loadHomework(h, result = null, extra = {}) {
  h.applyHubContext({identity:{status:'signed-in',uid:'student'},homework:homeworkBinding});
  const loading=h.loadContent();await h.settle();const request=h.messages.findLast(message=>message.type==='learning-hub-homework-load');
  assert.ok(request);h.response(request,{ok:true,action:'load',quiz:{contentId:'sample-quiz'},value:null,storageRevision:0,result:result?{submissionId:'a'.repeat(32),...result}:null,grade:result?{score:1,maxScore:2,submissionRevision:1,rows:[{id:'q1',correct:true},{id:'q2',correct:false}]}:null,closed:false,...extra});
  await loading;await h.settle();
}
test('temporary practice and homework keep a give-up at zero until starting the next attempt',async()=>{
  for (const mode of ['temporary','homework']) {
    const h=makeHarness(mode==='homework'?{homeworkBinding}:{temporary:true});
    if(mode==='homework')await loadHomework(h);else await h.load();
    h.giveUp();await h.submitAll();h.editAnswers();h.selectAnswer('q1','A');
    assert.equal(h.state.giveUps.q1,true,mode);assert.equal(h.state.answers.q1,undefined,mode);
    await h.submitAll();assert.equal(h.state.latestScore.score,0,mode);
    h.startRetry();assert.equal(h.state.attempt,2,mode);assert.equal(h.state.giveUps.q1,undefined,mode);
    h.selectAnswer('q1','A');await h.submitAll();assert.equal(h.state.latestScore.score,1,mode);
  }
});
test('homework starts separately from old practice and autosaves only under its assignment binding',async()=>{
  const h=makeHarness({homeworkBinding});h.seed('student',baseline({answers:{q1:'A',q2:'B'},masteredIds:['q1','q2']}));
  await loadHomework(h);assert.deepEqual(plain(h.state.answers),{});
  assert.equal(h.storageKey(),homeworkStorageKey('student',homeworkBinding));
  h.selectAnswer('q1','A');await h.advance(700);
  const save=h.messages.findLast(message=>message.type==='learning-hub-homework-save');assert.ok(save);assert.equal(save.storageRevision,0);
  assert.ok(!h.messages.some(message=>message.type==='learning-hub-quiz-save'));
  assert.equal(h.read('student').masteredIds.length,2);
});
test('checking answers does not send homework; final submit needs the result view and server confirmation',async()=>{
  const h=makeHarness({homeworkBinding});await loadHomework(h);
  await h.submitHomework();assert.ok(!h.messages.some(message=>message.type==='learning-hub-homework-submit'));
  h.selectAnswer('q1','A');await h.submitAll();assert.equal(h.state.view,'results');assert.ok(!h.messages.some(message=>message.type==='learning-hub-homework-submit'));
  const submitting=h.submitHomework();await h.settle();const request=h.messages.findLast(message=>message.type==='learning-hub-homework-submit');assert.ok(request);
  assert.equal(h.homeworkState().result,null);assert.equal(h.homeworkState().sending,true);
  const result={answersJson:'{"q1":"A"}',giveUpsJson:'{}',submittedAt:h.time()};
  h.response(request,{ok:true,action:'submit',result,grade:{score:1,maxScore:2,rows:[{id:'q1',correct:true},{id:'q2',correct:false}]}});await submitting;
  assert.equal(h.homeworkState().result.submittedAt,result.submittedAt);assert.equal(h.state.latestScore.score,1);
  const before=h.messages.length;h.selectAnswer('q1','B');await h.submitHomework();assert.equal(h.messages.length,before);assert.equal(h.state.answers.q1,'A');
});
test('a failed homework submission keeps a retryable result and never claims success',async()=>{
  const h=makeHarness({homeworkBinding});await loadHomework(h);h.selectAnswer('q1','A');await h.submitAll();
  const submitting=h.submitHomework();await h.settle();const request=h.messages.findLast(message=>message.type==='learning-hub-homework-submit');
  h.response(request,{ok:false,code:'PERMISSION_DENIED'});await submitting;assert.equal(h.homeworkState().result,null);assert.equal(h.homeworkState().sending,false);assert.equal(h.state.answers.q1,'A');
});
test('a submitted homework reload uses the immutable server answers instead of a stale local practice-like result',async()=>{
  const h=makeHarness({homeworkBinding});h.storage.set(homeworkStorageKey('student',homeworkBinding),JSON.stringify(baseline({answers:{q1:'B',q2:'B'},masteredIds:['q1','q2'],localSync:{dirty:true}})));
  await loadHomework(h,{answersJson:'{"q1":"A"}',giveUpsJson:'{}',submittedAt:h.time()});
  assert.deepEqual(plain(h.state.answers),{q1:'A'});assert.equal(h.state.latestScore.score,1);assert.equal(h.state.view,'results');
  assert.ok(!h.messages.some(message=>message.type==='learning-hub-homework-save'));
});

test('submitted homework can retry wrong questions and resubmit a cumulative total without changing the last submitted score while editing',async()=>{
  const h=makeHarness({homeworkBinding});await loadHomework(h,{answersJson:'{"q1":"A","q2":"A"}',giveUpsJson:'{}',submittedAt:h.time()});
  h.startRetry();assert.deepEqual(plain(h.state.answers),{q1:'A'});assert.deepEqual(plain(h.state.masteredIds),['q1']);
  h.selectAnswer('q2','B');assert.equal(h.state.answers.q2,'B');assert.equal(h.homeworkState().grade.score,1);
  await h.submitAll();assert.equal(h.state.latestScore.score,2);assert.equal(h.homeworkState().grade.score,1);
  const submitting=h.submitHomework();await h.settle();const request=h.messages.findLast(message=>message.type==='learning-hub-homework-submit');
  assert.equal(request.previousSubmissionId,'a'.repeat(32));assert.deepEqual(plain(request.value.answers),{q1:'A',q2:'B'});
  h.response(request,{ok:true,action:'submit',result:{answersJson:'{"q1":"A","q2":"B"}',giveUpsJson:'{}',submissionId:request.submissionId,submittedAt:h.time(),submissionRevision:2},grade:{score:2,maxScore:2,submissionRevision:2,rows:[{id:'q1',correct:true},{id:'q2',correct:true}]}});await submitting;
  assert.equal(h.homeworkState().grade.score,2);assert.equal(h.homeworkState().grade.submissionRevision,2);
  h.restart();assert.deepEqual(plain(h.state.answers),{});assert.equal(h.homeworkState().grade.score,2,'Restart keeps the submitted score');
});
test('homework reload resumes a post-submission draft instead of replacing corrections with the old submitted answers',async()=>{
  const h=makeHarness({homeworkBinding});const result={answersJson:'{"q1":"A"}',giveUpsJson:'{}',submittedAt:h.time()};
  await loadHomework(h,result,{value:baseline({identityKey:'student',answers:{q1:'A',q2:'B'},masteredIds:['q1'],view:'exam',homeworkBaseSubmissionId:'a'.repeat(32)}),storageRevision:4});
  assert.deepEqual(plain(h.state.answers),{q1:'A',q2:'B'});assert.equal(h.state.view,'exam');assert.equal(h.homeworkState().grade.score,1);
  assert.equal(h.homeworkState().storageRevision,4);
});
test('a closed assignment restores the last submitted score and refuses edits, retries, restarts and resubmission',async()=>{
  const h=makeHarness({homeworkBinding});await loadHomework(h,{answersJson:'{"q1":"A"}',giveUpsJson:'{}',submittedAt:h.time()},{closed:true});
  const before=h.messages.length;h.startRetry();h.editAnswers();h.restart();h.selectAnswer('q2','B');await h.submitHomework();
  assert.deepEqual(plain(h.state.answers),{q1:'A'});assert.equal(h.state.view,'results');assert.equal(h.messages.length,before);
});

test('returning from review reopens the requested exam question and retains answers, scores and evidence', async () => {
  const h=makeHarness(); await h.load(); h.state.answers={q1:'A',q2:'B'};
  h.state.view='results'; h.state.latestScore={score:2,maxScore:2};
  const manager=h.evidence(),before=plain(h.state.answers),score=plain(h.state.latestScore);
  for(const index of[-1,2,NaN,'1']) assert.equal(h.returnToQuestion(index),false);
  assert.equal(h.state.view,'results');
  assert.equal(h.returnToQuestion(1),true); assert.equal(h.state.view,'exam'); assert.equal(h.state.currentIndex,1);
  assert.deepEqual(plain(h.state.answers),before); assert.deepEqual(plain(h.state.latestScore),score); assert.equal(h.evidence(),manager);
});

test('a review return cannot bypass an editable drag reading check', async () => {
  const h=makeHarness(); await h.load(); makeDragQuestion(h);
  h.state.answers.q1={one:'b',two:'a'};
  assert.equal(h.returnToQuestion(1),true);
  assert.equal(h.state.currentIndex,0); assert.equal(h.navigationState().correct,false);
});

test('reading review and returning to a given-up question preserves its current-attempt lock', async () => {
  const h = makeHarness(); await h.load(); h.giveUp(); await h.submitAll();
  assert.equal(h.state.latestScore.score, 0);
  h.returnToQuestion(0); h.openTopicReview(); h.topicReviewDialog.close();
  h.selectAnswer('q1', 'A');
  assert.equal(h.state.giveUps.q1, true); assert.equal(h.state.answers.q1, undefined);
  assert.equal(h.canAnswerQuestion('q1'), false);
  assert.equal(h.resultFor(h.state.questions[0]).status, 'giveup');
  h.startRetry(); h.selectAnswer('q1', 'A');
  assert.equal(h.state.answers.q1, 'A'); assert.equal(h.canAnswerQuestion('q1'), true);
});

test('Hub review requests a split reader once and accepts only the matching parent acknowledgement', async () => {
  const h = makeHarness(); await h.load();
  h.dispatch({ type: 'learning-hub-quiz-review-result' });
  h.applyHubContext({ identity: { uid: null }, content: { contentId: h.state.contentId, subjectId: 'chemistry' } });
  h.openTopicReview(); h.openTopicReview();
  const requests = h.messages.filter(m => m.type === 'learning-hub-quiz-review-request');
  assert.equal(requests.length, 1); assert.equal(requests[0].questionNumber, 1);
  assert.equal(h.topicReviewDialog.open, undefined);
  const ack = { type: 'learning-hub-quiz-review-result', requestId: requests[0].requestId, contentId: h.state.contentId, opened: true };
  h.dispatch({ ...ack, opened: false }, { origin: 'https://other.test' });
  h.dispatch({ ...ack, opened: false }, { source: {} });
  h.dispatch({ ...ack, requestId: 999, opened: false });
  assert.equal(h.reviewOpens.length, 0);
  h.dispatch(ack); await h.advance(1500);
  assert.equal(h.reviewOpens.length, 0); assert.equal(h.topicReviewDialog.open, undefined);
});

test('unsupported Hub and standalone Quiz retain the original review dialog without losing work', async () => {
  const h = makeHarness(); await h.load(); h.state.answers.q1 = 'A';
  h.openTopicReview(); assert.equal(h.topicReviewDialog.open, true); assert.equal(h.reviewOpens.length, 1);
  h.topicReviewDialog.close();
  h.applyHubContext({ identity: { uid: null }, content: { contentId: h.state.contentId, subjectId: 'physics' } });
  h.openTopicReview(); await h.advance(1200);
  assert.equal(h.topicReviewDialog.open, true); assert.equal(h.reviewOpens.at(-1).subjectId, 'physics');
  assert.equal(h.state.answers.q1, 'A');
  h.topicReviewDialog.close(); h.openTopicReview(); h.state.currentIndex = 1; await h.advance(1200);
  assert.equal(h.topicReviewDialog.open, false, 'A timed-out request from the previous question cannot open stale review');
});
