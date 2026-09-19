import assert from "node:assert/strict";
import test from "node:test";
import { createContentTool } from "../js/content-tool.js";

const hub = "https://example.test/Physic-subject/index.html#chemistry";
const entry = { toolKind: "quiz", subjectId: "chemistry", chapterId: "9", topicId: "le-chatelier",
  contentId: "chem-le-chatelier-starter-v1", titleTh: "แบบฝึก", titleEn: "Practice",
  source: "content/chemistry/equilibrium/quiz-template.html" };
test("nested HTML content uses the existing player at the GitHub Pages base", () => {
  const tool = createContentTool(entry, hub);
  const url = new URL(tool.page);
  assert.equal(url.pathname, "/Physic-subject/pages/tools/quiz-player.html");
  assert.equal(url.searchParams.get("content"), "https://example.test/Physic-subject/content/chemistry/equilibrium/quiz-template.html");
  assert.equal(tool.context.topicId, "le-chatelier");
  assert.equal(tool.context.contentId, entry.contentId);
});
test("the same quiz across topics keeps one window identity; new quizzes get separate identities", () => {
  assert.equal(createContentTool(entry, hub).id, createContentTool({ ...entry, topicId: "review" }, hub).id);
  assert.notEqual(createContentTool(entry, hub).id, createContentTool({ ...entry, contentId: "second-set" }, hub).id);
});
test("remote, escaped, executable and out-of-content targets are rejected", () => {
  for (const source of ["https://evil.test/quiz.html", "//evil.test/quiz.html", "javascript:alert(1)",
    "data:text/html,x", "../secret.html", "/Physic-subject/admin.html", "content/x.js",
    "content/x.html?user=other", "content/x.html#admin", "content/%252e%252e/admin.html",
    "content/x%2f..%2fadmin.html", "https://name:password@example.test/Physic-subject/content/x.html"]) {
    assert.equal(createContentTool({ ...entry, source }, hub), null, source);
  }
});
test("only registered tool kinds and stable context IDs are accepted", () => {
  assert.equal(createContentTool({ ...entry, toolKind: "admin" }, hub), null);
  assert.equal(createContentTool({ ...entry, contentId: "../other" }, hub), null);
  assert.equal(createContentTool({ ...entry, chapterId: 9 }, hub), null);
  assert.equal(createContentTool(null, hub), null);
});
test("simulation opens its own HTML without being given the quiz storage bridge", () => {
  const tool = createContentTool({ ...entry, toolKind: "simulation" }, hub);
  assert.equal(tool.page, tool.source);
  assert.equal(tool.context.toolKind, "simulation");
});
