import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extname, join, relative, sep, resolve } from "node:path";
import { parseNumericAnswer } from "../public/shared/quiz-question-model.js";
import { createPdfManifest, createInlinePdfManifest, inlinePdfSources } from "../public/shared/pdf-content-model.js";
import { readMetadata, metadataNodes } from "./route-html-metadata.mjs";
import { validateLearningSheet } from "../js/learning-sheet-model.js";
import { createVideoManifest } from "../public/shared/video-content-model.js";
import { lineAt, withoutComments, reportContentDiagnostics } from './content-diagnostics.mjs';

export function createContentValidator({ root = fileURLToPath(new URL('../', import.meta.url)), read = readFile } = {}) {
const contentDirectory = join(root, 'public', 'content');
const allowedQuestionTypes = new Set(["choice", "number", "drag-drop"]);
const allowedActivityKinds = new Set(["practice", "quiz"]);
const errors = [];
const diagnostics = [], sources = new Map(), offsets = new Map();
const activityIds = new Map();
const stableMenuId = /^[a-z0-9][a-z0-9-]{0,127}$/;

async function readMenuTarget(file, href, { draft = false, allowDraft = false } = {}) {
  href = href?.trim() || '';
  if (!href) {
    (allowDraft ? addWarning : addError)(file, 'ยังไม่มี href/ไฟล์ปลายทาง: ใส่ลิงก์เมื่อพร้อม ขณะนี้แสดง “กำลังเตรียมเนื้อหา”');
    return null;
  }
  let path;
  try {
    const base = pathToFileURL(contentDirectory + sep);
    const url = new URL(href, pathToFileURL(file));
    if (/[\\\u0000-\u0020]/.test(href) || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(href) || url.protocol !== "file:" || url.host || !url.pathname.startsWith(base.pathname) ||
        !url.pathname.endsWith(".html") || url.search || url.hash || /%(?:2e|2f|5c|25|00)/i.test(url.pathname)) throw new Error("Unsafe path");
    path = fileURLToPath(url);
  } catch {
    addError(file, `Invalid local content link: ${href}. ใช้ลิงก์ไฟล์ .html ภายใน public/content ไม่มี query หรือ #`);
    return null;
  }
  if (draft && allowDraft) { addWarning(file, `data-status="draft": ${href} ยังไม่เปิดให้ใช้งาน เอา data-status ออกเมื่อพร้อม`); return null; }
  try { return { path, source: withoutComments(await read(path, 'utf8')) }; }
  catch (error) {
    if (allowDraft && ['ENOENT', 'ENOTDIR'].includes(error.code)) addWarning(file, `ยังไม่มีไฟล์ปลายทาง ${href}: สร้างไฟล์นี้หรือแก้ href ขณะนี้แสดง “กำลังเตรียมเนื้อหา”`);
    else addError(file, `อ่านไฟล์ปลายทาง ${href} ไม่ได้: ${error.message}`);
    return null;
  }
}

async function validateMenu(file, source) {
  const roots = [...source.matchAll(/<nav\b[^>]*\bdata-learning-menu(?:\s|=|>)[^>]*>/gi)];
  if (roots.length !== 1) { addError(file, "Menu needs exactly one nav data-learning-menu root."); return; }
  const root = readAttributes(roots[0][0]);
  offsets.set(file, roots[0].index);
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
    {
      const target = await readMenuTarget(file, overviewSource, { allowDraft: true });
      if (target && !/<html\b[^>]*\bdata-learning-html(?:\s|=|>)/i.test(target.source)) {
        addError(file, "Chapter overview must link to an HTML document with <html data-learning-html>.");
      }
    }
  }
  if (/<\s*(script|style|link|iframe|object|embed|form|button|input|textarea|select)\b/i.test(source) || /\s(?:class|style|on[a-z]+)\s*=/i.test(source)) {
    offsets.set(file, source.search(/<\s*(script|style|link|iframe|object|embed|form|button|input|textarea|select)\b|\s(?:class|style|on[a-z]+)\s*=/i));
    addError(file, "Menu HTML is data only: no scripts, styles, handlers or custom controls.");
  }
  const seen = new Set();
  for (const match of source.matchAll(/<a\b[^>]*>/gi)) {
    offsets.set(file, match.index);
    const entry = readAttributes(match[0]);
    const isPdf = entry.get("data-tool-kind") === "pdf";
    const isHtml = ["html", "pdf", "video"].includes(entry.get("data-tool-kind"));
    const id = entry.get(kind === "topics" && !isHtml ? "data-topic-id" : "data-content-id");
    if (!stableMenuId.test(id || "") || seen.has(id)) addError(file, `Missing, invalid or duplicate menu entry ID: ${id}`);
    seen.add(id);
    if (!hasBilingualText(match[0])) addError(file, `${id} needs data-th and data-en.`);
    if (entry.get('data-status') && !['draft', 'ready'].includes(entry.get('data-status'))) addError(file, `${id}: data-status ใช้ draft หรือ ready เท่านั้น`);
    if (kind === 'tools' && !['quiz', 'simulation', 'html', 'pdf', 'video'].includes(entry.get('data-tool-kind'))) addError(file, `${id}: data-tool-kind ต้องเป็น quiz, simulation, html, pdf หรือ video`);
    if ((kind === 'tools' || isHtml) && !/^[a-z]/.test(id || '')) addError(file, `${id}: data-content-id ต้องขึ้นต้นด้วยตัวอักษร`);
    if (entry.get('data-tool-kind') === 'video') {
      validateVideo(file, entry.get('data-video-src') ?? entry.get('href') ?? '', id);
      continue;
    }
    if (isPdf) {
      try {
        const pdfSources = inlinePdfSources(Object.fromEntries(entry)) ?? (!entry.get('href')?.trim() ? {} : undefined);
        if (pdfSources !== undefined) { await validateInlinePdf(file, pdfSources, id); continue; }
      } catch (error) { addError(file, error.message); continue; }
    }
    const target = await readMenuTarget(file, entry.get("href"), { allowDraft: true, draft: entry.get('data-status') === 'draft' });
    if (!target) continue;
    if (isPdf) {
      const destination = readAttributes(findOpeningTag(target.source, "data-learning-pdf"));
      if (destination.get("data-learning-pdf") !== "1" || destination.get("data-activity-id") !== id) addError(file, `${id} must match the PDF descriptor data-activity-id.`);
    } else if (isHtml) {
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

function addDiagnostic(level, file, message, line) {
  const item = { level, file: relative(root, file).replaceAll('\\', '/'), line: line || lineAt(sources.get(file) || '', offsets.get(file) || 0), message };
  diagnostics.push(item);
  if (level === 'error') errors.push(`${item.file}:${item.line}: ${message}`);
}
function addError(file, message, line) { addDiagnostic('error', file, message, line); }
function addWarning(file, message) { addDiagnostic('warning', file, message); }

function validateVideo(file, value, id, line) {
  try {
    if (!createVideoManifest(value, id).ready) addWarning(file, 'วิดีโอยังไม่มีลิงก์: กำลังเตรียมวิดีโอ', line);
  } catch (error) { addError(file, error.message, line); }
}

async function validateHtmlLinks(file, source) {
  const tree = readMetadata(source);
  for (const node of metadataNodes(tree, node => ['a', 'button'].includes(node.tag) &&
      (Object.hasOwn(node.attrs, 'data-hub-html') || Object.hasOwn(node.attrs, 'data-hub-pdf') || Object.hasOwn(node.attrs, 'data-hub-video')))) {
    const attributes = node.attrs, isPdf = Object.hasOwn(attributes, 'data-hub-pdf');
    const id = attributes['data-content-id'];
    if (['data-hub-html', 'data-hub-pdf', 'data-hub-video'].filter(key => Object.hasOwn(attributes, key)).length > 1) addError(file, 'A link must have exactly one Hub tool marker.', node.line);
    if (!/^[a-z][a-z0-9-]{0,127}$/.test(id || '')) addError(file, 'Content link needs a stable data-content-id starting with a letter.', node.line);
    if (Object.hasOwn(attributes, 'data-hub-video')) {
      validateVideo(file, attributes['data-video-src'] ?? attributes.href ?? '', id, node.line);
      continue;
    }
    if (isPdf) {
      try {
        const pdfSources = inlinePdfSources(attributes) ?? (!(attributes['data-pdf-src'] || attributes.href)?.trim() ? {} : undefined);
        if (pdfSources !== undefined) { await validateInlinePdf(file, pdfSources, id); continue; }
      } catch (error) { addError(file, error.message, node.line); continue; }
    }
    const target = await readMenuTarget(file, attributes[isPdf ? 'data-pdf-src' : 'data-html-src'] || attributes.href, { allowDraft: isPdf });
    if (!target) continue;
    const marker = isPdf ? 'data-learning-pdf' : 'data-learning-html';
    const destination = readAttributes(findOpeningTag(target.source, marker));
    if (!destination.has(marker)) addError(file, `Content link must point to <html ${marker}>.`, node.line);
    if (isPdf && destination.get('data-activity-id') !== id) addError(file, 'PDF link content ID must match its descriptor.', node.line);
  }
}

const pdfHubUrl = 'https://validation.invalid/learning-hub/';
function pdfWebUrl(file) {
  const webPath = relative(join(root, 'public'), file).split(sep).join('/');
  return new URL(webPath === '../index.html' ? 'index.html' : webPath, pdfHubUrl).href;
}
async function validatePdfSources(file, manifest) {
  if (!manifest.ready) addWarning(file, 'PDF ยังไม่มีลิงก์: กำลังเตรียมเอกสาร ใส่ไฟล์ร่วม/TH/EN เมื่อพร้อม');
  for (const [language, source] of Object.entries(manifest.sources)) {
    const url = new URL(source.url), hub = new URL(pdfHubUrl);
    if (source.kind !== 'pdf' || url.origin !== hub.origin) continue;
    const path = join(root, 'public', decodeURIComponent(url.pathname.slice(hub.pathname.length)));
    let bytes;
    try { bytes = await read(path); }
    catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
      addWarning(file, `PDF (${language}) ยังไม่มีไฟล์ ${url.pathname}: build ต่อได้ ตรวจไฟล์ก่อนใช้งานจริง`);
      continue;
    }
    if (!Buffer.from(bytes).subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw Error(`Local PDF (${language}) has no PDF header.`);
  }
}
async function validateInlinePdf(file, sources, id) {
  const manifest = createInlinePdfManifest(sources, id, pdfWebUrl(file), pdfHubUrl);
  await validatePdfSources(file, manifest);
}

async function validatePdf(file, source) {
  const tree = readMetadata(source);
  const roots = metadataNodes(tree, node => Object.hasOwn(node.attrs, 'data-learning-pdf'));
  if (roots.length !== 1 || roots[0].tag !== 'html') { addError(file, 'PDF descriptor needs exactly one html data-learning-pdf root.'); return; }
  // The metadata reader deliberately skips raw script/style bodies; check the
  // authored source too so data-only descriptors cannot hide executable tags.
  if (/<\s*(script|style|link|iframe|object|embed|form|input|button|base|template)\b/i.test(source) || /\son[a-z]+\s*=/i.test(source))
    addError(file, 'PDF descriptor cannot contain scripts, styles, handlers or embedded controls.');
  if (metadataNodes(tree, node => ['script', 'style', 'link', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'base'].includes(node.tag) ||
      Object.keys(node.attrs).some(key => /^on/.test(key) || ['data-learning-html', 'data-learning-menu', 'data-learning-activity-content', 'data-learning-simulation'].includes(key))).length)
    addError(file, 'PDF descriptor is data only: no scripts, handlers, embedded frames, forms, styles or other content kinds.');
  try {
    const hubUrl = 'https://validation.invalid/learning-hub/';
    const webPath = relative(join(root, 'public'), file).split(sep).join('/');
    const descriptorUrl = new URL(webPath, hubUrl).href;
    const links = metadataNodes(tree, node => Object.hasOwn(node.attrs, 'data-pdf-link'));
    if (links.some(node => node.tag !== 'a')) throw Error('data-pdf-link belongs on an anchor.');
    const manifest = createPdfManifest(roots[0].attrs, links.map(node => node.attrs), descriptorUrl, hubUrl);
    trackActivityId(file, manifest.contentId);
    await validatePdfSources(file, manifest);
  } catch (error) { addError(file, error.message); }
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
  const source = withoutComments(await read(file, 'utf8'));
  sources.set(file, source); offsets.set(file, 0);
  try { readMetadata(source, { strict: true }); }
  catch (error) { addError(file, error.message, error.line); return; }
  await validateHtmlLinks(file, source);
  offsets.set(file, 0);
  if (findOpeningTag(source, "data-learning-pdf")) { await validatePdf(file, source); return; }
  if (findOpeningTag(source, "data-learning-html")) {
    const roots = [...source.matchAll(/<html\b[^>]*\bdata-learning-html(?:\s|=|>)[^>]*>/gi)];
    if (roots.length !== 1) addError(file, "Read-only HTML needs exactly one <html data-learning-html> root.");
    if (["data-learning-menu", "data-learning-activity-content", "data-learning-simulation"].some(attr => findOpeningTag(source, attr))) {
      addError(file, "Read-only HTML must not also be a menu, quiz or simulation.");
    }
    if (/<\s*(script|iframe|object|embed|form)\b/i.test(source) || /\son[a-z]+\s*=/i.test(source) || /\b(?:href|src)\s*=\s*["']\s*javascript:/i.test(source)) {
      offsets.set(file, source.search(/<\s*(script|iframe|object|embed|form)\b|\son[a-z]+\s*=|\b(?:href|src)\s*=\s*["']\s*javascript:/i));
      addError(file, "Read-only HTML cannot contain scripts, event handlers, embedded frames or forms.");
    }
    if (findOpeningTag(source, "data-learning-sheet") || /\bdata-sheet-(?:slot|answer|placeholder)\b/i.test(source)) {
      try {
        const tree = readMetadata(source).children.find(node => node.tag === 'html');
        if (!tree) addError(file, 'Learning sheet needs an html root.');
        else validateLearningSheet(tree).forEach(error => addError(file, error));
      } catch (error) { addError(file, error.message); }
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
    offsets.set(file, source.search(/<\s*(script|style|link|iframe|object|embed|form|button|input|textarea|select)\b/i));
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
  if (!["standard", "drag-drop", "mixed"].includes(mode)) addError(file, "Quiz mode must be standard, drag-drop or mixed.");
  questionBlocks.forEach((match, index) => {
    offsets.set(file, match.index);
    const isDrag = readAttributes(`<article ${match[1]}>`).get("data-question-type") === "drag-drop";
    if (mode !== "mixed" && isDrag !== (mode === "drag-drop")) addError(file, "Drag-drop must be a separate data-quiz-mode=drag-drop set, without choice/number questions.");
    validateQuestion(file, `<article ${match[1]}>`, match[2], index, seenIds);
  });
}

async function run() {
const files = await listHtmlFiles(contentDirectory);
await Promise.all(files.map(validateFile));

// Declared chapter menus can be drafts; malformed destinations remain errors.
const pagesDirectory = join(root, 'public', 'pages');
for (const name of await readdir(pagesDirectory)) {
  if (!name.endsWith(".html")) continue;
  const file = join(pagesDirectory, name);
  const source = withoutComments(await read(file, 'utf8'));
  sources.set(file, source); offsets.set(file, 0);
  await validateHtmlLinks(file, source);
  const subject = readAttributes(findOpeningTag(source, "data-subject-id")).get("data-subject-id");
  for (const match of source.matchAll(/<article\b[^>]*\bdata-chapter\s*=[^>]*>/gi)) {
    const entry = readAttributes(match[0]);
    offsets.set(file, match.index);
    if (entry.get('data-status') && !['draft', 'ready'].includes(entry.get('data-status'))) addError(file, 'data-status ใช้ draft หรือ ready เท่านั้น');
    if (!entry.has('data-chapter-src') && entry.get('data-status') !== 'draft') continue;
    const target = await readMenuTarget(file, entry.get("data-chapter-src"), { allowDraft: true, draft: entry.get('data-status') === 'draft' });
    if (!target) continue;
    const menu = readAttributes(findOpeningTag(target.source, "data-learning-menu"));
    if (menu.get("data-menu-kind") !== "topics" || menu.get("data-subject-id") !== subject || menu.get("data-chapter-id") !== entry.get("data-chapter")) {
      addError(file, "Chapter link must point to a topics menu with matching subject and chapter IDs.");
    }
  }
}

diagnostics.sort((a,b) => a.file.localeCompare(b.file) || a.line - b.line || a.message.localeCompare(b.message));
return { diagnostics, errors, fileCount: files.length };
}
return { run, validateFile, diagnostics, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await createContentValidator().run();
  if (process.env.CONTENT_VALIDATION_REPORT) await writeFile(process.env.CONTENT_VALIDATION_REPORT, JSON.stringify(result, null, 2) + '\n');
  await reportContentDiagnostics(result.diagnostics);
  if (result.errors.length) process.exitCode = 1;
  else console.log(`Activity Content V1 passed (${result.fileCount} files; drafts allowed).`);
}
