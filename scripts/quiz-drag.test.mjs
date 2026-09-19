import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuestion, hasAnswer, isCorrectAnswer, isStoredAnswer } from "../public/shared/quiz-question-model.js";
import { dragAnswerSummary, placeDragItem, describeDragAnswer } from "../public/shared/quiz-drag-model.js";
import { readQuizContent } from "../public/shared/quiz-content-adapter.js";

const bilingual = text => ({ th: text, en: text });
const record = extra => ({
  id: "passage", type: "drag-drop", prompt: bilingual("Fill the passage"), solution: bilingual("Solution"), body: bilingual("Passage with two slots"),
  items: [{ id: "same", text: bilingual("Same") }, { id: "sum", text: bilingual("Sum") }, { id: "zero", text: bilingual("Zero") }],
  slots: [{ id: "a", answer: "same", label: bilingual("A") }, { id: "b", answer: "sum", label: bilingual("B") }],
  ...extra,
});
const question = normalizeQuestion(record()).question;

test("a multi-slot question earns one correct result only when all slots match", () => {
  assert.deepEqual(normalizeQuestion(record()).errors, []);
  assert.equal(hasAnswer({}), false);
  assert.equal(hasAnswer({ a: "same" }), true);
  assert.equal(isCorrectAnswer(question, {}), false);
  assert.equal(isCorrectAnswer(question, { a: "same" }), false);
  assert.equal(isCorrectAnswer(question, { a: "same", b: "zero" }), false);
  assert.equal(isCorrectAnswer(question, { b: "sum", a: "same" }), true);
  assert.deepEqual(dragAnswerSummary(question, { a: "same" }), { filled: 1, correct: 1, total: 2, complete: false });
});

test("single-use pieces move, occupied targets replace, and removal returns a piece", () => {
  const before = Object.freeze({ a: "same", b: "sum" });
  assert.deepEqual(placeDragItem(question, before, "b", "same"), { b: "same" });
  assert.deepEqual(before, { a: "same", b: "sum" });
  assert.deepEqual(placeDragItem(question, before, "a", "zero"), { a: "zero", b: "sum" });
  assert.deepEqual(placeDragItem(question, before, "b", null), { a: "same" });
  assert.equal(placeDragItem(question, before, "unknown", "same"), null);
  assert.equal(placeDragItem(question, before, "a", "unknown"), null);
});

test("reuse is opt-in and permits the same item in several slots", () => {
  const repeated = record({ reuse: "repeat", slots: [{ id: "a", answer: "same" }, { id: "b", answer: "same" }] });
  const normalized = normalizeQuestion(repeated);
  assert.deepEqual(normalized.errors, []);
  assert.deepEqual(placeDragItem(normalized.question, { a: "same" }, "b", "same"), { a: "same", b: "same" });
  assert.equal(isCorrectAnswer(normalized.question, { a: "same", b: "same" }), true);
  assert.ok(normalizeQuestion({ ...repeated, reuse: "once" }).errors.length);
});

test("restore accepts partial maps, not duplicate, unknown, nested or malformed answers", () => {
  for (const answer of [{}, { a: "same" }, { a: "zero", b: "sum" }]) assert.equal(isStoredAnswer(question, answer), true);
  for (const answer of [null, "same", [], { a: "same", b: "same" }, { a: "bad" }, { unknown: "same" }, { a: {} }, JSON.parse('{"__proto__":"same"}')]) {
    assert.equal(isStoredAnswer(question, answer), false);
    assert.equal(isCorrectAnswer(question, answer), false);
  }
});

test("IDs and limits are validated before rendering a drag question", () => {
  for (const extra of [
    { slots: [] }, { items: [] }, { reuse: "maybe" }, { body: null },
    { slots: [{ id: "a", answer: "missing" }] },
    { slots: [{ id: "a", answer: "same" }, { id: "a", answer: "sum" }] },
    { items: [{ id: "constructor", text: bilingual("bad") }] },
    { items: Array.from({ length: 81 }, (_, i) => ({ id: `item-${i}`, text: bilingual("item") })) },
  ]) assert.ok(normalizeQuestion(record(extra)).errors.length, JSON.stringify(extra));
});

test("rich text, images and formulas are content, never answer identity", () => {
  const rich = normalizeQuestion(record({ items: [
    { id: "same", text: bilingual('<p>Long <strong>paragraph</strong></p>') },
    { id: "sum", text: bilingual('<img src="meter.svg" alt="Meter">') },
  ] })).question;
  assert.equal(isCorrectAnswer(rich, { a: "same", b: "sum" }), true);
  assert.match(describeDragAnswer(question, { a: "same" }, "en"), /A: Same; B: —/);
});

test("normal sets keep mixed choice/number, while drag sets reject mixing", () => {
  const leaf = { dataset: { th: "Text", en: "Text" }, querySelector: () => null };
  const make = type => ({ dataset: { questionId: type, questionType: type, answer: type === "number" ? "1" : "a" },
    querySelector: () => leaf,
    querySelectorAll: selector => selector === "[data-choice-id]" && type === "choice" ? [{ dataset: { choiceId: "a", th: "A", en: "A" }, querySelector: () => null }, { dataset: { choiceId: "b", th: "B", en: "B" }, querySelector: () => null }] : [],
  });
  const root = { dataset: { activityKind: "quiz", activityId: "mixed" }, querySelectorAll: () => [make("choice"), make("number")] };
  assert.deepEqual(readQuizContent(root).errors, []);
  root.dataset.quizMode = "drag-drop";
  assert.match(readQuizContent(root).errors.join(" "), /separate/);
});
