import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [, , sourceArgument, outputArgument] = process.argv;

if (!sourceArgument || !outputArgument) {
  console.error("Usage: node scripts/convert-reference-quiz.mjs <source.html> <output.html>");
  process.exit(1);
}

function readJsonObjectAfterMarker(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Could not find ${marker}.`);

  const openingBrace = source.indexOf("{", markerIndex);
  if (openingBrace < 0) throw new Error(`Could not find the ${marker} object.`);

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      return JSON.parse(source.slice(openingBrace, index + 1));
    }
  }

  throw new Error(`Could not find the end of the ${marker} object.`);
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function plainText(value, limit = 220) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function sanitizeFragment(value) {
  return String(value ?? "")
    .replace(
      /<\s*(script|style|link|iframe|object|embed|form|button|input|textarea|select)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(/<\s*(link|input)\b[^>]*\/?\s*>/gi, "")
    .replace(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi, (_, double, single, bare) => {
      const visualTokens = new Map([
        ["graph-card", "graph"],
        ["axis", "axis"],
        ["graph-text", "label"],
        ["axis-label", "axis-label"],
        ["curve", "curve"],
        ["curve-alt", "tangent"],
        ["table-wrap", "table-wrap"],
        ["chem-table", "data-table"],
        ["rounded-xl", "surface"],
        ["bg-gray-50", "surface"],
        ["text-center", "center"],
        ["font-semibold", "strong"],
        ["font-bold", "strong"],
        ["text-emerald-700", "success"],
      ]);
      const markers = [...new Set(String(double ?? single ?? bare ?? "").split(/\s+/).map((token) => visualTokens.get(token)).filter(Boolean))];
      return markers.length ? ` data-quiz-visual="${markers.join(" ")}"` : "";
    })
    .replace(/\s(?:style|on[a-z]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "");
}

function languageBlock(language, html) {
  return `<div data-quiz-language="${language}">${sanitizeFragment(html)}</div>`;
}

function questionMarkup(question, index) {
  const answerIndex = question.options.findIndex((option) => option.isCorrect);
  if (answerIndex < 0) throw new Error(`${question.id} has no correct answer.`);

  const answer = String.fromCharCode(97 + answerIndex);
  const englishPrompt = plainText(question.questionTH);
  const thaiPrompt = plainText(question.questionEN);
  const context = sanitizeFragment(question.contentHTML);
  const hints = (question.hints ?? [])
    .map(
      (hint, hintIndex) => `
        <li data-question-hint data-hint-level="${hintIndex + 1}">
          ${languageBlock("en", hint.th)}
          ${languageBlock("th", hint.en)}
        </li>`,
    )
    .join("");
  const options = question.options
    .map((option, optionIndex) => {
      const optionId = String.fromCharCode(97 + optionIndex);
      const optionText = plainText(option.text, 500);
      return `
        <li
          data-choice-id="${optionId}"
          data-th="${escapeAttribute(optionText)}"
          data-en="${escapeAttribute(optionText)}"
        >${sanitizeFragment(option.text)}</li>`;
    })
    .join("");

  return `
    <article
      data-question
      data-quiz-question
      data-question-id="${escapeAttribute(question.id || `q${index + 1}`)}"
      data-question-type="choice"
      data-answer="${answer}"
    >
      <header
        data-question-prompt
        data-th="${escapeAttribute(thaiPrompt)}"
        data-en="${escapeAttribute(englishPrompt)}"
      >
        ${languageBlock("th", question.questionEN)}
        ${languageBlock("en", question.questionTH)}
      </header>
      ${context ? `<section data-question-context>${context}</section>` : ""}
      <ol data-question-options>${options}
      </ol>
      <ol data-question-hints hidden>${hints}
      </ol>
      <section
        data-question-solution
        data-th="${escapeAttribute(plainText(question.solutionEN))}"
        data-en="${escapeAttribute(plainText(question.solutionTH))}"
        hidden
      >
        ${languageBlock("th", question.solutionEN)}
        ${languageBlock("en", question.solutionTH)}
      </section>
    </article>`;
}

const sourcePath = resolve(sourceArgument);
const outputPath = resolve(outputArgument);
const source = await readFile(sourcePath, "utf8");
const quiz = readJsonObjectAfterMarker(source, "window.QUIZ_TEMPLATE");

const titleTh = quiz.branding?.accessTitleTH || quiz.title;
const titleEn = quiz.branding?.accessTitleEN || quiz.title;
const descriptionTh = quiz.branding?.accessDescriptionTH || quiz.subtitle;
const descriptionEn = quiz.branding?.accessDescriptionEN || quiz.subtitle;
const summaryTitleTh = quiz.reviewCheck?.titleTH || "สรุปก่อนทำ Quiz";
const summaryTitleEn = quiz.reviewCheck?.titleEN || "Quiz review summary";
const activityId = String(quiz.quizId || "imported-reference-quiz")
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "");

const output = `<article
  data-learning-activity-content
  data-activity-version="1"
  data-activity-id="${escapeAttribute(activityId)}"
  data-activity-kind="quiz"
  data-quiz-content-version="1"
>
  <header data-activity-intro data-quiz-intro>
    <small
      data-activity-kicker
      data-th="แบบฝึก Mastery · Chemistry Y12"
      data-en="Mastery practice · Chemistry Y12"
    >แบบฝึก Mastery · Chemistry Y12</small>
    <h1
      data-activity-title
      data-quiz-title
      data-th="${escapeAttribute(titleTh)}"
      data-en="${escapeAttribute(titleEn)}"
    >${escapeAttribute(titleTh)}</h1>
    <p
      data-activity-description
      data-th="${escapeAttribute(descriptionTh)}"
      data-en="${escapeAttribute(descriptionEn)}"
    >${escapeAttribute(descriptionTh)}</p>
  </header>

  <section data-activity-summary data-quiz-summary>
    <small
      data-activity-section-kicker
      data-th="สรุปเนื้อหา"
      data-en="Review summary"
    >สรุปเนื้อหา</small>
    <h2
      data-activity-summary-title
      data-th="${escapeAttribute(summaryTitleTh)}"
      data-en="${escapeAttribute(summaryTitleEn)}"
    >${escapeAttribute(summaryTitleTh)}</h2>
    <div data-quiz-summary-content>${sanitizeFragment(quiz.reviewCheck?.html)}</div>
  </section>

  <section data-activity-questions data-quiz-questions>
    <header data-question-section-heading>
      <small
        data-activity-section-kicker
        data-th="แบบทดสอบ"
        data-en="Quiz"
      >แบบทดสอบ</small>
      <h2
        data-th="ทำทีละข้อ ตรวจพร้อมกันเมื่อพร้อม"
        data-en="Work one question at a time and submit when ready"
      >ทำทีละข้อ ตรวจพร้อมกันเมื่อพร้อม</h2>
    </header>${quiz.questions.map(questionMarkup).join("")}
  </section>
</article>
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output, "utf8");
console.log(`Converted ${quiz.questions.length} questions to ${outputPath}`);
