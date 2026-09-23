import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extname, join, relative, sep } from "node:path";
import { parseNumericAnswer } from "../public/shared/quiz-question-model.js";

const contentDirectory = fileURLToPath(new URL("../public/content", import.meta.url));
const allowedQuestionTypes = new Set(["choice", "number", "drag-drop"]);
const allowedActivityKinds = new Set(["practice", "quiz"]);
const errors = [];
const activityIds = new Map();
const stableMenuId = /^[a-z0-9][a-z0-9-]{0,127}$/;

async function readMenuTarget(file, href) {
  try {
    const base = pathToFileURL(contentDirectory + sep);
    const url = new URL(href, pathToFileURL(file));
    if (!href || url.protocol !== "file:" || url.host || !url.pathname.startsWith(base.pathname) ||
        !url.pathname.endsWith(".html") || url.search || url.hash || /%(?:2e|2f|5c|25)/i.test(url.pathname)) throw new Error("Unsafe path");
    const path = fileURLToPath(url);
    return { path, source: (await readFile(path, "utf8")).replace(/<!--[\s\S]*?-->/g, "") };
  } catch {
    addError(file, `Missing or invalid local content link: ${href || "(empty)"}`);
    return null;
  }
}

async function validateMenu(file, source) {
  const roots = [...source.matchAll(/<nav\b[^>]*\bdata-learning-menu(?:\s|=|>)[^>]*>/gi)];
  if (roots.length !== 1) { addError(file, "Menu needs exactly one nav data-learning-menu root."); return; }
  const root = readAttributes(roots[0][0]);
  const kind = root.get("data-menu-kind");
  if (!["topics", "tools"].includes(kind)) addError(file, "Menu kind must be topics or tools.");
  for (const attr of ["data-subject-id", "data-chapter-id", ...(kind === "tools" ? ["data-topic-id"] : [])]) {
    if (!stableMenuId.test(root.get(attr) || "")) addError(file, `Menu needs stable ${attr}.`);
  }
  if (!root.get("data-title-th")?.trim() || !root.get("data-title-en")?.trim()) addError(file, "Menu needs Thai and English titles.");
  if (root.has("data-chapter-overview-src")) {
    if (kind !== "topics") addError(file, "Chapter overview belongs only on a topics menu (layer 2).");
    const overviewSource = root.get("data-chapter-overview-src").trim();
    const overviewId = `${root.get("data-subject-id")}-chapter-${root.get("data-chapter-id")}-overview`;
    if (!stableMenuId.test(overviewId)) addError(file, "Chapter overview ID is too long or invalid.");
    if (overviewSource) {
      const target = await readMenuTarget(file, overviewSource);
      if (target && !/<html\b[^>]*\bdata-learning-html(?:\s|=|>)/i.test(target.source)) {
        addError(file, "Chapter overview must link to an HTML document with <html data-learning-html>.");
      }
    }
  }
  if (/<\s*(script|style|link|iframe|object|embed|form|button|input|textarea|select)\b/i.test(source) || /\s(?:class|style|on[a-z]+)\s*=/i.test(source)) {
    addError(file, "Menu HTML is data only: no scripts, styles, handlers or custom controls.");
  }
  const seen = new Set();
  for (const match of source.matchAll(/<a\b[^>]*>/gi)) {
    const entry = readAttributes(match[0]);
    const isHtml = entry.get("data-tool-kind") === "html";
    const id = entry.get(kind === "topics" && !isHtml ? "data-topic-id" : "data-content-id");
    if (!stableMenuId.test(id || "") || seen.has(id)) addError(file, `Missing, invalid or duplicate menu entry ID: ${id}`);
    seen.add(id);
    if (!hasBilingualText(match[0])) addError(file, `${id} needs data-th and data-en.`);
    // Topic headings may be published before their activity-menu file exists.
    // Explicit non-empty links must still be valid; never hide broken links.
    if (kind === "topics" && !isHtml && !entry.get("href")?.trim()) continue;
    const target = await readMenuTarget(file, entry.get("href"));
    if (!target) continue;
    if (isHtml) {
      if (!/^[a-z][a-z0-9-]{0,127}$/.test(id || "")) addError(file, "HTML content ID must start with a letter.");
      if (!/<html\b[^>]*\bdata-learning-html(?:\s|=|>)/i.test(target.source)) {
        addError(file, `${id} must link to a document with <html data-learning-html>.`);
      }
    } else if (kind === "topics") {
      const destination = readAttributes(findOpeningTag(target.source, "data-learning-menu"));
      if (destination.get("data-menu-kind") !== "tools" || destination.get("data-topic-id") !== id ||
          destination.get("data-subject-id") !== root.get("data-subject-id") || destination.get("data-chapter-id") !== root.get("data-chapter-id")) {
        addError(file, `${id} must link to a tools menu with matching subject, chapter and topic IDs.`);
      }
    } else {
      const type = entry.get("data-tool-kind");
      if (!["quiz", "simulation"].includes(type)) { addError(file, `${id} supports only quiz or simulation.`); continue; }
      const destination = readAttributes(findOpeningTag(target.source, type === "quiz" ? "data-learning-activity-content" : "data-learning-simulation"));
      if (destination.get("data-activity-id") !== id || (type === "quiz" && destination.get("data-activity-kind") !== "quiz")) {
        addError(file, `${id} must match the destination's data-activity-id and tool kind.`);
      }
    }
  }
}

function trackActivityId(file, id) {
  if (activityIds.has(id)) addError(file, `Duplicate activity ID ${id}; already used by ${relative(contentDirectory, activityIds.get(id))}.`);
  else activityIds.set(id, file);
}

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listHtmlFiles(path) : [path];
    }),
  );
  return files.flat().filter((path) => extname(path).toLowerCase() === ".html");
}

function readAttributes(openingTag) {
  const attributes = new Map();
  const pattern = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of openingTag.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function findOpeningTag(source, attribute) {
  const pattern = new RegExp(`<[^>]*\\b${attribute}(?:\\s|=|>)[^>]*>`, "i");
  return source.match(pattern)?.[0] ?? "";
}

function hasBilingualText(openingTag) {
  const attributes = readAttributes(openingTag);
  return Boolean(attributes.get("data-th")?.trim() && attributes.get("data-en")?.trim());
}

function addError(file, message) {
  errors.push(`${relative(contentDirectory, file)}: ${message}`);
}

async function validateHtmlLinks(file, source) {
  for (const match of source.matchAll(/<(?:a|button)\b[^>]*\bdata-hub-html(?:\s|=|>)[^>]*>/gi)) {
    const attributes = readAttributes(match[0]);
    if (!/^[a-z][a-z0-9-]{0,127}$/.test(attributes.get("data-content-id") || "")) addError(file, "HTML link needs a stable data-content-id starting with a letter.");
    const target = await readMenuTarget(file, attributes.get("data-html-src") || attributes.get("href"));
    if (target && !/<html\b[^>]*\bdata-learning-html(?:\s|=|>)/i.test(target.source)) addError(file, "HTML link must point to <html data-learning-html>.");
  }
}

function validateQuestion(file, openingTag, body, index, seenIds) {
  const attributes = readAttributes(openingTag);
  const questionId = attributes.get("data-question-id")?.trim();
  const type = attributes.get("data-question-type")?.trim();
  const answer = attributes.get("data-answer")?.trim();
  const label = questionId || `question ${index + 1}`;

  if (!questionId) {
    addError(file, `Question ${index + 1} is missing data-question-id.`);
  } else if (!/^[a-z][a-z0-9-]*$/.test(questionId)) {
    addError(file, `${label} must use a lowercase stable id.`);
  } else if (seenIds.has(questionId)) {
    addError(file, `Duplicate question id: ${questionId}.`);
  }
  seenIds.add(questionId);

  if (!allowedQuestionTypes.has(type)) {
    addError(file, `${label} has unsupported type "${type || "missing"}".`);
  }
  if (!answer && type !== "drag-drop") addError(file, `${label} is missing data-answer.`);

  const prompt = findOpeningTag(body, "data-question-prompt");
  if (!prompt || !hasBilingualText(prompt)) {
    addError(file, `${label} needs a prompt with data-th and data-en.`);
  }

  const solutionTags = [
    ...body.matchAll(/<[^>]*\bdata-question-solution(?:\s|=|>)[^>]*>/gi),
  ].map((match) => match[0]);
  if (solutionTags.length > 1) {
    addError(file, `${label} can contain only one data-question-solution.`);
  }
  if (solutionTags[0] && !hasBilingualText(solutionTags[0])) {
    addError(file, `${label} solution needs data-th and data-en.`);
  }

  if (type === "choice") {
    const optionTags = [...body.matchAll(/<li\b[^>]*\bdata-choice-id(?:\s|=|>)[^>]*>/gi)].map(
      (match) => match[0],
    );
    const optionIds = new Set();
    if (optionTags.length < 2) addError(file, `${label} needs at least two choices.`);

    optionTags.forEach((optionTag) => {
      const optionAttributes = readAttributes(optionTag);
      const optionId = optionAttributes.get("data-choice-id")?.trim();
      if (!optionId || optionIds.has(optionId)) {
        addError(file, `${label} has an empty or duplicate choice id.`);
      }
      optionIds.add(optionId);
      if (!hasBilingualText(optionTag)) {
        addError(file, `${label} choice ${optionId || "?"} needs data-th and data-en.`);
      }
    });
    if (answer && !optionIds.has(answer)) {
      addError(file, `${label} answer "${answer}" does not match a choice id.`);
    }
  }

  if (type === "number") {
    const tolerance = attributes.has("data-tolerance") ? parseNumericAnswer(attributes.get("data-tolerance")) : 0;
    if (parseNumericAnswer(answer) === null) addError(file, `${label} needs a numeric answer.`);
    if (tolerance === null || tolerance < 0) {
      addError(file, `${label} needs a non-negative data-tolerance.`);
    }
  }
  if (type === "drag-drop") {
    const tags = attribute => [...body.matchAll(new RegExp(`<[^>]*\\b${attribute}(?:\\s|=|>)[^>]*>`, "gi"))].map(match => readAttributes(match[0]));
    const items = tags("data-item-id");
    const slots = tags("data-drop-slot");
    const reuse = attributes.get("data-drag-reuse") || "once";
    const ids = items.map(item => item.get("data-item-id"));
    const slotIds = slots.map(slot => slot.get("data-drop-slot"));
    const stable = id => /^[a-z][a-z0-9-]{0,63}$/.test(id || "") && !["constructor", "prototype"].includes(id);
    if (!findOpeningTag(body, "data-question-body")) addError(file, `${label} needs data-question-body.`);
    if (!items.length || items.length > 80 || ids.some(id => !stable(id)) || new Set(ids).size !== ids.length) addError(file, `${label} needs 1–80 uniquely identified drag items.`);
    if (!slots.length || slots.length > 40 || slotIds.some(id => !stable(id)) || new Set(slotIds).size !== slotIds.length) addError(file, `${label} needs 1–40 uniquely identified slots.`);
    if (slots.some(slot => !ids.includes(slot.get("data-answer")))) addError(file, `${label} slot answer must match an item ID.`);
    if (!["once", "repeat"].includes(reuse)) addError(file, `${label} reuse must be once or repeat.`);
    if (reuse === "once" && new Set(slots.map(slot => slot.get("data-answer"))).size !== slots.length) addError(file, `${label} repeated answers require data-drag-reuse=repeat.`);
  }
  for (const name of ["data-topic-ids", "data-exam-ids"]) {
    if ((attributes.get(name) || "").trim().split(/\s+/).filter(Boolean).some(id => !/^[a-z][a-z0-9-]*$/.test(id))) {
      addError(file, `${label} ${name} must contain space-separated lowercase IDs.`);
    }
  }
}

async function validateFile(file) {
  const source = (await readFile(file, "utf8")).replace(/<!--[\s\S]*?-->/g, "");
  await validateHtmlLinks(file, source);
  if (findOpeningTag(source, "data-learning-html")) {
    const roots = [...source.matchAll(/<html\b[^>]*\bdata-learning-html(?:\s|=|>)[^>]*>/gi)];
    if (roots.length !== 1) addError(file, "Read-only HTML needs exactly one <html data-learning-html> root.");
    if (["data-learning-menu", "data-learning-activity-content", "data-learning-simulation"].some(attr => findOpeningTag(source, attr))) {
      addError(file, "Read-only HTML must not also be a menu, quiz or simulation.");
    }
    if (/<\s*(script|iframe|object|embed|form)\b/i.test(source) || /\son[a-z]+\s*=/i.test(source) || /\b(?:href|src)\s*=\s*["']\s*javascript:/i.test(source)) {
      addError(file, "Read-only HTML cannot contain scripts, event handlers, embedded frames or forms.");
    }
    return;
  }
  if (findOpeningTag(source, "data-learning-menu")) {
    if (findOpeningTag(source, "data-learning-activity-content") || findOpeningTag(source, "data-learning-simulation")) addError(file, "A menu must not also be a quiz or simulation.");
    await validateMenu(file, source);
    return;
  }
  if (findOpeningTag(source, "data-learning-simulation")) {
    const root = readAttributes(findOpeningTag(source, "data-learning-simulation"));
    const id = root.get("data-activity-id");
    if (!/^[a-z][a-z0-9-]{0,127}$/.test(id || "")) addError(file, "Simulation needs a stable data-activity-id.");
    else trackActivityId(file, id);
    return;
  }
  const rootTags = [
    ...source.matchAll(/<article\b[^>]*\bdata-learning-activity-content(?:\s|=|>)[^>]*>/gi),
  ].map((match) => match[0]);

  if (rootTags.length !== 1) {
    addError(file, "File must contain exactly one data-learning-activity-content root.");
    return;
  }

  if (/<\s*(script|style|link|iframe|object|embed|form|button|input|textarea|select)\b/i.test(source)) {
    addError(file, "Content files cannot contain scripts, styles, forms, buttons, or inputs.");
  }
  if (/\s(?:class|style|on[a-z]+)\s*=/i.test(source)) {
    addError(file, "Content files cannot define classes, inline styles, or event handlers.");
  }
  if (/\b(?:href|src)\s*=\s*["']\s*javascript:/i.test(source)) {
    addError(file, "Content files cannot use javascript: URLs.");
  }

  const rootAttributes = readAttributes(rootTags[0]);
  const activityId = rootAttributes.get("data-activity-id")?.trim();
  const activityKind = rootAttributes.get("data-activity-kind")?.trim();
  if (!activityId || !/^[a-z][a-z0-9-]*$/.test(activityId)) {
    addError(file, "data-activity-id must be a stable lowercase id.");
  }
  else trackActivityId(file, activityId);
  if (rootAttributes.get("data-activity-version") !== "1") {
    addError(file, "data-activity-version must be 1.");
  }
  if (!allowedActivityKinds.has(activityKind)) {
    addError(file, `Unsupported data-activity-kind "${activityKind || "missing"}".`);
  }

  const title = findOpeningTag(source, "data-activity-title");
  const summaryTitle = findOpeningTag(source, "data-activity-summary-title");
  if (!title || !hasBilingualText(title)) {
    addError(file, "Activity title needs data-th and data-en.");
  }
  if (!findOpeningTag(source, "data-activity-summary")) {
    addError(file, "Activity summary is missing.");
  }
  if (!summaryTitle || !hasBilingualText(summaryTitle)) {
    addError(file, "Summary title needs data-th and data-en.");
  }
  if (!findOpeningTag(source, "data-activity-questions")) {
    addError(file, "Question section is missing.");
  }

  const questionBlocks = [
    ...source.matchAll(
      /<article\b([^>]*\bdata-question(?:\s|=|>)[^>]*)>([\s\S]*?)<\/article>/gi,
    ),
  ];
  if (questionBlocks.length === 0) addError(file, "At least one question is required.");

  const seenIds = new Set();
  const mode = rootAttributes.get("data-quiz-mode") || "standard";
  if (!["standard", "drag-drop"].includes(mode)) addError(file, "Quiz mode must be standard or drag-drop.");
  questionBlocks.forEach((match, index) => {
    const isDrag = readAttributes(`<article ${match[1]}>`).get("data-question-type") === "drag-drop";
    if (isDrag !== (mode === "drag-drop")) addError(file, "Drag-drop must be a separate data-quiz-mode=drag-drop set, without choice/number questions.");
    validateQuestion(file, `<article ${match[1]}>`, match[2], index, seenIds);
  });
}

const files = await listHtmlFiles(contentDirectory);
await Promise.all(files.map(validateFile));

// Copying a chapter should need only HTML edits, but every chapter link must be real.
const pagesDirectory = fileURLToPath(new URL("../public/pages", import.meta.url));
for (const name of await readdir(pagesDirectory)) {
  if (!name.endsWith(".html")) continue;
  const file = join(pagesDirectory, name);
  const source = (await readFile(file, "utf8")).replace(/<!--[\s\S]*?-->/g, "");
  await validateHtmlLinks(file, source);
  const subject = readAttributes(findOpeningTag(source, "data-subject-id")).get("data-subject-id");
  for (const match of source.matchAll(/<article\b[^>]*\bdata-chapter-src\s*=[^>]*>/gi)) {
    const entry = readAttributes(match[0]);
    const target = await readMenuTarget(file, entry.get("data-chapter-src"));
    if (!target) continue;
    const menu = readAttributes(findOpeningTag(target.source, "data-learning-menu"));
    if (menu.get("data-menu-kind") !== "topics" || menu.get("data-subject-id") !== subject || menu.get("data-chapter-id") !== entry.get("data-chapter")) {
      addError(file, "Chapter link must point to a topics menu with matching subject and chapter IDs.");
    }
  }
}

if (errors.length) {
  console.error("Activity Content V1 validation failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Activity Content V1 passed (${files.length} file${files.length === 1 ? "" : "s"}).`);
}
