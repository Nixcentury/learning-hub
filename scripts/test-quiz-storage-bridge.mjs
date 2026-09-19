import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// These tests run the real modules with in-memory Firebase and DOM substitutes.
// They do not load the Firebase SDK, authenticate, or read/write a live database.
const origin = "https://example.test";
const readModule = (path) => readFileSync(new URL(path, import.meta.url), "utf8")
  .replace(/^import[\s\S]*?from\s+"[^"]+";\s*/gm, "")
  .replace(/^export\s+/gm, "");

function bridgeHarness() {
  let session = { status: "signed-in", user: { uid: "user-a" } };
  let subscriber;
  let receive;
  const replies = [];
  const writes = [];
  const stored = new Map();
  const source = { postMessage: (message) => replies.push(message) };
  const sources = new Set([source]);
  const io = {
    get: async (path) => ({ exists: () => stored.has(path), val: () => stored.get(path) }),
    set: async (path, value) => { writes.push({ path, value }); stored.set(path, value); },
  };
  const context = vm.createContext({
    console: { warn() {} }, location: { origin }, firebaseApp: {},
    getDatabase: () => ({}), ref: (_, path) => path,
    serverTimestamp: () => ({ ".sv": "timestamp" }),
    get: (...args) => io.get(...args), set: (...args) => io.set(...args),
    getAuthSession: () => session,
    subscribeAuth: (fn) => { subscriber = fn; fn(session); },
    isWorkspaceQuizSource: (candidate) => sources.has(candidate),
    window: { addEventListener: (_, fn) => { receive = fn; } },
  });
  vm.runInContext(readModule("../js/quiz-progress.js"), context);
  return {
    replies, writes, stored, sources, source, io,
    session(next) { session = next; subscriber(session); },
    send(data = {}, event = {}) {
      return receive({ origin, source, ...event, data: {
        type: "learning-hub-quiz-save", requestId: "request-1", uid: "user-a",
        contentId: "quiz-one", value: { version: 2, answers: {}, latestScore: null }, ...data,
      } });
    },
  };
}

test("bridge overwrites one latest record and binds server-side uid/contentId", async () => {
  const h = bridgeHarness();
  await h.send({ value: { version: 2, latestScore: { score: 1 }, uid: "forged", contentId: "forged" } });
  await h.send({ value: { version: 2, latestScore: { score: 2 } } });
  assert.equal(h.stored.size, 1);
  assert.equal(h.stored.get("quizProgress/user-a/quiz-one").latestScore.score, 2);
  assert.equal(h.writes[0].value.uid, "user-a");
  assert.equal(h.writes[0].value.contentId, "quiz-one");
  assert.equal(h.replies.at(-1).uid, "user-a");
  assert.equal(h.replies.at(-1).contentId, "quiz-one");
});

test("bridge ignores unregistered and foreign-origin windows", async () => {
  const h = bridgeHarness();
  await h.send({}, { source: { postMessage() { throw Error("Unexpected reply"); } } });
  await h.send({}, { origin: "https://foreign.test" });
  assert.equal(h.writes.length, 0);
  assert.equal(h.replies.length, 0);
});

test("old-account message cannot write into the newly signed-in account", async () => {
  const h = bridgeHarness();
  h.session({ status: "signed-in", user: { uid: "user-b" } });
  await h.send();
  assert.equal(h.writes.length, 0);
  assert.equal(h.replies[0].code, "quiz-progress/session-changed");
  assert.equal(h.replies[0].uid, "user-a");
});

test("guest and requests missing uid cannot access cloud storage", async () => {
  const h = bridgeHarness();
  await h.send({ uid: undefined });
  assert.equal(h.replies.at(-1).code, "quiz-progress/session-changed");
  h.session({ status: "guest", user: null });
  await h.send();
  assert.equal(h.replies.at(-1).code, "quiz-progress/sign-in-required");
  assert.equal(h.writes.length, 0);
});

test("invalid content IDs, invalid records and oversized payloads are rejected", async () => {
  const h = bridgeHarness();
  await h.send({ contentId: "../another-account" });
  assert.equal(h.replies.at(-1).code, "quiz-progress/invalid-request");
  for (const value of [null, [], "text"]) {
    await h.send({ value });
    assert.equal(h.replies.at(-1).code, "quiz-progress/invalid-record");
  }
  await h.send({ value: { text: "x".repeat(80_001) } });
  assert.equal(h.replies.at(-1).code, "quiz-progress/payload-too-large");
  assert.equal(h.writes.length, 0);
});

test("load returns only the requested user's quiz, including null for a new quiz", async () => {
  const h = bridgeHarness();
  h.stored.set("quizProgress/user-a/quiz-one", { version: 2, answers: { q1: "b" } });
  h.stored.set("quizProgress/user-b/quiz-one", { private: true });
  await h.send({ type: "learning-hub-quiz-load" });
  assert.equal(h.replies.at(-1).value.answers.q1, "b");
  await h.send({ type: "learning-hub-quiz-load", contentId: "new-quiz" });
  assert.equal(h.replies.at(-1).value, null);
});

test("an old load cannot expose data after an account switch or sign-out/sign-in cycle", async () => {
  for (const nextUid of ["user-b", "user-a"]) {
    const h = bridgeHarness();
    let finish;
    h.io.get = () => new Promise((resolve) => { finish = resolve; });
    const pending = h.send({ type: "learning-hub-quiz-load" });
    h.session({ status: "signed-out", user: null });
    h.session({ status: "signed-in", user: { uid: nextUid } });
    finish({ exists: () => true, val: () => ({ private: true }) });
    await pending;
    assert.equal(h.replies.at(-1).code, "quiz-progress/session-changed");
    assert.equal(h.replies.at(-1).value, undefined);
  }
});

test("pending writes retain original path and never acknowledge a new account as saved", async () => {
  const h = bridgeHarness();
  let finish;
  h.io.set = (path) => new Promise((resolve) => { h.writes.push({ path }); finish = resolve; });
  const pending = h.send();
  h.session({ status: "signed-in", user: { uid: "user-b" } });
  finish();
  await pending;
  assert.equal(h.writes[0].path, "quizProgress/user-a/quiz-one");
  assert.equal(h.replies.at(-1).code, "quiz-progress/session-changed");
});

test("removed frames receive no late database reply; permission errors remain failures", async () => {
  const h = bridgeHarness();
  let finish;
  h.io.get = () => new Promise((resolve) => { finish = resolve; });
  const pending = h.send({ type: "learning-hub-quiz-load" });
  h.sources.delete(h.source);
  finish({ exists: () => true, val: () => ({}) });
  await pending;
  assert.equal(h.replies.length, 0);
  h.sources.add(h.source);
  h.io.set = async () => { throw { code: "PERMISSION_DENIED" }; };
  await h.send();
  assert.equal(h.replies.at(-1).ok, false);
  assert.equal(h.replies.at(-1).code, "PERMISSION_DENIED");
});

class FakeElement {
  constructor() {
    this.dataset = {}; this.style = {}; this.children = []; this.queries = new Map();
    this.listeners = {}; this.isConnected = false; this.textContent = "";
    const classes = new Set();
    this.classList = {
      add: (...items) => items.forEach((item) => classes.add(item)),
      remove: (...items) => items.forEach((item) => classes.delete(item)),
      contains: (item) => classes.has(item),
      toggle: (item, enabled = !classes.has(item)) => enabled ? classes.add(item) : classes.delete(item),
    };
  }
  querySelector(selector) {
    if (!this.queries.has(selector)) {
      const child = new FakeElement();
      if (selector === ".workspace-tool-frame") child.contentWindow = { messages: [], postMessage(value) { this.messages.push(value); } };
      this.queries.set(selector, child);
    }
    return this.queries.get(selector);
  }
  connect(value) { this.isConnected = value; for (const child of [...this.children, ...this.queries.values()]) child.connect(value); }
  append(child) { this.children.push(child); child.connect(true); }
  remove() { this.connect(false); }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  setAttribute() {}
  getBoundingClientRect() { return { width: 1200, height: 800, left: 0, top: 0 }; }
  focus() {}
  blur() {}
}

function workspaceHarness() {
  const listeners = {};
  const context = vm.createContext({
    console, URL, location: { origin, href: origin + "/index.html" },
    document: { body: new FakeElement(), createElement: () => new FakeElement() },
    window: { addEventListener: (type, fn) => { listeners[type] = fn; }, setInterval() {} },
    requestAnimationFrame: (fn) => fn(),
  });
  vm.runInContext(readModule("../js/content-context.js"), context);
  vm.runInContext(readModule("../js/content-tool.js"), context);
  vm.runInContext(readModule("../js/workspace.js"), context);
  const windowLayer = new FakeElement();
  const workspace = context.createWorkspace({
    windowLayer, taskbar: new FakeElement(), taskbarItems: new FakeElement(), countElement: new FakeElement(),
    getLanguage: () => "th", getRole: () => "student",
    getIdentity: () => ({ status: "signed-in", uid: "user-a", isGuest: false }),
  });
  return { context, workspace, windowLayer, listeners };
}

test("workspace registers only live Quiz frames and resends context when the player is ready", () => {
  const h = workspaceHarness();
  h.workspace.open("physics-c1-quiz");
  h.workspace.open("physics-c1-simulation");
  const frame = h.windowLayer.children[0].querySelector(".workspace-tool-frame");
  const simFrame = h.windowLayer.children[1].querySelector(".workspace-tool-frame");
  assert.equal(h.context.isWorkspaceQuizSource(frame.contentWindow), true);
  assert.equal(h.context.isWorkspaceQuizSource(simFrame.contentWindow), false);
  const ready = { origin, source: frame.contentWindow, data: { type: "learning-hub-quiz-ready" } };
  h.listeners.message({ ...ready, origin: "https://foreign.test" });
  h.listeners.message({ ...ready, source: simFrame.contentWindow });
  assert.equal(frame.contentWindow.messages.length, 0);
  h.listeners.message(ready);
  assert.equal(frame.contentWindow.messages[0].identity.uid, "user-a");
  assert.equal(frame.contentWindow.messages[0].content.contentId, "physics-c1-quiz");
});

test("close and clear synchronously flush local state before removing and unregistering frames", () => {
  const h = workspaceHarness();
  for (const id of ["physics-c1-quiz", "chemistry-c1-quiz"]) h.workspace.open(id);
  let flushed = 0;
  const frames = h.windowLayer.children.map((element) => element.querySelector(".workspace-tool-frame"));
  for (const frame of frames) frame.contentWindow.LearningHubQuiz = { flushLocal() {
    assert.equal(frame.isConnected, true);
    flushed += 1;
  } };
  h.windowLayer.children[0].querySelector(".is-close").listeners.click();
  assert.equal(flushed, 1);
  assert.equal(h.context.isWorkspaceQuizSource(frames[0].contentWindow), false);
  h.workspace.clear();
  assert.equal(flushed, 2);
  assert.equal(h.context.isWorkspaceQuizSource(frames[1].contentWindow), false);
});

test("legacy tools without the new local-flush hook still close normally", () => {
  const h = workspaceHarness();
  h.workspace.open("physics-c1-simulation");
  assert.doesNotThrow(() => h.workspace.clear());
});

test("closing a Quiz waits for committed handwriting and keeps the frame on failure", async () => {
  const h = workspaceHarness();
  h.workspace.open("physics-c1-quiz");
  const record = h.windowLayer.children[0];
  const frame = record.querySelector(".workspace-tool-frame");
  let finish;
  frame.contentWindow.LearningHubQuiz = { prepareClose: () => new Promise((resolve) => { finish = resolve; }) };
  const closing = record.querySelector(".is-close").listeners.click();
  assert.equal(frame.isConnected, true);
  finish(false);
  await closing;
  assert.equal(frame.isConnected, true);
  const next = record.querySelector(".is-close").listeners.click();
  finish(true);
  await next;
  assert.equal(frame.isConnected, false);
});

test("a failed prepare-close blocks voluntary sign-out preparation", async () => {
  const h = workspaceHarness();
  h.workspace.open("physics-c1-quiz");
  const frame = h.windowLayer.children[0].querySelector(".workspace-tool-frame");
  frame.contentWindow.LearningHubQuiz = { prepareClose: async () => false };
  assert.equal(await h.workspace.prepareAllForClose(), false);
  assert.equal(frame.isConnected, true);
});
