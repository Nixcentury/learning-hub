import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extname, join, relative, sep } from "node:path";
import vm from "node:vm";
import { htmlLinkEntry } from "../js/html-link.js";
import { createContentTool } from "../js/content-tool.js";

// Exercise the real validator with a read-only in-memory filesystem, not live content.
const moduleUrl = new URL("./validate-activity-content.mjs", import.meta.url);
const source = readFileSync(moduleUrl, "utf8").split("const files = await listHtmlFiles(contentDirectory);")[0]
  .replace(/^import .*;\r?\n/gm, "").replaceAll("import.meta.url", JSON.stringify(moduleUrl.href));
const contentRoot = fileURLToPath(new URL("../public/content/", import.meta.url));
const file = join(contentRoot, "test", "chapter.html");
const html = '<!doctype html><html data-learning-html><head><title>Summary</title></head><body><h1>Outcomes</h1></body></html>';
const menu = (attribute = 'data-chapter-overview-src="summary.html"', kind = "topics") =>
  `<nav data-learning-menu data-menu-kind="${kind}" data-subject-id="chemistry" data-chapter-id="10" data-topic-id="topic" data-title-th="บท" data-title-en="Chapter" ${attribute}><a data-topic-id="future" data-th="เตรียม" data-en="Preparing"></a></nav>`;
async function check(menuSource, destination = html) {
  const records = new Map([[file, menuSource], [join(contentRoot, "test", "summary.html"), destination]]);
  const context = vm.createContext({ fileURLToPath, pathToFileURL, URL, extname, join, relative, sep,
    readFile: async path => { if (!records.has(path) || records.get(path) === null) throw Error("Missing"); return records.get(path); },
    parseNumericAnswer() { throw Error("Unexpected quiz in summary fixture"); } });
  vm.runInContext(source, context);
  context.fixtureFile = file;
  await vm.runInContext("validateFile(fixtureFile)", context);
  return Array.from(vm.runInContext("errors", context));
}
test("overview link is optional; empty link is an explicit preparing state", async () => {
  assert.deepEqual(await check(menu("")), []);
  assert.deepEqual(await check(menu('data-chapter-overview-src=""')), []);
  assert.deepEqual(await check(menu()), []);
});
test("overview rejects missing, remote and out-of-content files", async () => {
  assert.match((await check(menu(), null)).join(), /Missing or invalid/);
  for (const link of ["https://example.test/x.html", "../../../admin.html", "summary.html?x=1", "summary.html#x", "%252e%252e/x.html"]) {
    assert.match((await check(menu(`data-chapter-overview-src="${link}"`))).join(), /Missing or invalid/, link);
  }
});
test("overview requires the HTML marker and only belongs to layer 2", async () => {
  assert.match((await check(menu(), '<html><body>Unmarked</body></html>')).join(), /data-learning-html/);
  assert.match((await check(menu(undefined, "tools"))).join(), /only on a topics menu/);
});
test("read-only HTML validates without fake questions; mixed or executable content fails", async () => {
  assert.deepEqual(await check(html), []);
  assert.deepEqual(await check(html.replace('</head>', '<style>h1{color:navy}</style></head>')), []);
  for (const insertion of ['<script>alert(1)</script>', '<img onerror="alert(1)">', '<iframe src="x"></iframe>', '<form></form>', '<nav data-learning-menu></nav>', '<article data-learning-activity-content></article>']) {
    assert.ok((await check(html.replace('</body>', `${insertion}</body>`))).length, insertion);
  }
});

test("HTML cards may be added to topics or tools menus without changing existing topics", async () => {
  const card = '<a data-tool-kind="html" data-content-id="chem-overview" data-th="สรุป" data-en="Summary" href="summary.html">สรุป</a>';
  assert.deepEqual(await check(menu().replace("</nav>", card + "</nav>")), []);
  const tools = menu("", "tools").replace(/<a[\s\S]*?<\/a>/, card);
  assert.deepEqual(await check(tools), []);
});
test("generic HTML links in rendered documents validate destinations and IDs", async () => {
  const linked = html.replace("</body>", '<a data-hub-html data-content-id="reading" href="summary.html">อ่านต่อ</a></body>');
  assert.deepEqual(await check(linked), []);
  assert.ok((await check(linked.replace('data-content-id="reading"', 'data-content-id=""'))).length);
  assert.ok((await check(linked.replace('href="summary.html"', 'href="../../../admin.html"'))).length);
});
test("shared opener resolves links relative to the calling document at any layer", () => {
  const node = { dataset: { contentId: "summary", th: "สรุป", en: "Summary" }, textContent: "สรุป",
    getAttribute: name => name === "href" ? "../acid-base/chapter-overview.html" : null };
  const entry = htmlLinkEntry(node, "https://example.test/learning-hub/content/chemistry/other/lesson.html", { subjectId: "chemistry", chapterId: "10" });
  assert.equal(entry.source, "https://example.test/learning-hub/content/chemistry/acid-base/chapter-overview.html");
  assert.equal(entry.chapterId, "10");
  assert.equal(entry.toolKind, "html");
  assert.ok(createContentTool(entry, "https://example.test/learning-hub/"));
  const unsafe = htmlLinkEntry({ ...node, getAttribute: name => name === "href" ? "https://evil.test/x.html" : null }, "https://example.test/learning-hub/");
  assert.equal(createContentTool(unsafe, "https://example.test/learning-hub/"), null);
});
