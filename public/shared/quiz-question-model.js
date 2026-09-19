/* Shared question contract. No DOM, storage, AI, or spreadsheet dependency.
 * HTML uses this now; a future Excel importer must produce the same records.
 * Keep canonical question IDs unchanged when grouping by exam or topic.
 */
import { validateDragQuestion, isStoredDragAnswer, dragAnswerSummary } from "./quiz-drag-model.js";
export const QUESTION_MODEL_VERSION = 1;
export const MAX_ANSWER_LENGTH = 160;
const stableId = /^[a-z][a-z0-9-]*$/;
const decimal = /^[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

// Bounded numeric expression grammar, never eval/Function. MathLive LaTeX is
// only data: reject variables, equations, unknown commands and partial input.
export function parseNumericAnswer(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  if (String(raw).length > MAX_ANSWER_LENGTH) return null;
  const text = String(raw).trim().replace(/[๐-๙]/g, c => String(c.charCodeAt(0) - 0x0e50))
    .replace(/−/g, "-").replace(/[×·]/g, "*").replace(/÷/g, "/")
    .replace(/\\(?:left|right)\s*/g, "").replace(/\\[,!; ]/g, "")
    .replace(/\\(?:cdot|times)/g, "*").replace(/\\div/g, "/");
  if (!text || text.length > MAX_ANSWER_LENGTH) return null;
  const tokens = text.match(/\\[a-zA-Z]+|(?:\d[\d,]*(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[^\s]/g) || [];
  if (tokens.length > 120) return null;
  let at = 0;
  let depth = 0;
  const take = () => tokens[at++];
  const finite = value => { if (!Number.isFinite(value)) throw new Error("Non-finite"); return value; };
  const group = () => {
    const open = take();
    if (!["(", "{"].includes(open) || ++depth > 24) throw new Error("Group");
    const value = expression();
    if (take() !== (open === "(" ? ")" : "}")) throw new Error("Unclosed group");
    depth--;
    return value;
  };
  const texArgument = () => {
    if (["(", "{"].includes(tokens[at])) return group();
    // MathLive canonically emits one-character arguments without braces:
    // \frac56 and \sqrt4 are valid TeX. A bare argument is one digit, not 56.
    const token = tokens[at];
    if (/^\d+$/.test(token || "")) {
      take();
      if (token.length > 1) tokens.splice(at, 0, token.slice(1));
      return Number(token[0]);
    }
    if (token?.startsWith("\\") || token === "π" || token === "√") return primary();
    throw new Error("Incomplete math argument");
  };
  const primary = () => {
    const token = tokens[at];
    if (["(", "{"].includes(token)) return group();
    take();
    if (["\\frac", "\\dfrac", "\\tfrac"].includes(token)) {
      const numerator = texArgument();
      const denominator = texArgument();
      if (denominator === 0) throw new Error("Zero denominator");
      const result = finite(numerator / denominator);
      if (result === 0 && numerator !== 0) throw new Error("Underflow");
      return result;
    }
    if (token === "\\sqrt" || token === "√") return finite(Math.sqrt(texArgument()));
    if (token === "\\pi" || token === "π") return Math.PI;
    if (!token || !decimal.test(token)) throw new Error("Unsupported token");
    const value = finite(Number(token.replaceAll(",", "")));
    if (value === 0 && /[1-9]/.test(token.split(/[eE]/)[0])) throw new Error("Underflow");
    return value;
  };
  const power = () => {
    const left = primary();
    if (tokens[at] !== "^") return left;
    take();
    const result = finite(left ** unary());
    if (result === 0 && left !== 0) throw new Error("Underflow");
    return result;
  };
  const unary = () => {
    if (tokens[at] === "+") { take(); return unary(); }
    if (tokens[at] === "-") { take(); return -unary(); }
    return power();
  };
  const term = () => {
    let value = unary();
    while (["*", "/"].includes(tokens[at])) {
      const op = take();
      const right = unary();
      if (op === "/" && right === 0) throw new Error("Zero denominator");
      const result = finite(op === "*" ? value * right : value / right);
      if (result === 0 && value !== 0 && right !== 0) throw new Error("Underflow");
      value = result;
    }
    return value;
  };
  const expression = () => {
    let value = term();
    while (["+", "-"].includes(tokens[at])) {
      const op = take();
      const right = term();
      value = finite(op === "+" ? value + right : value - right);
    }
    return value;
  };
  try {
    const value = expression();
    return at === tokens.length ? finite(value) : null;
  } catch { return null; }
}

export function hasAnswer(answer) {
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    return Object.values(answer).some(value => typeof value === "string" && value.trim().length > 0);
  }
  return (typeof answer === "number" && Number.isFinite(answer)) ||
    (typeof answer === "string" && answer.trim().length > 0);
}

function readIds(value, name, errors) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some(id => typeof id !== "string" || !stableId.test(id))) {
    errors.push(`${name} must be a list of stable lowercase IDs.`);
    return [];
  }
  return [...new Set(value)];
}

// Rich text is bilingual HTML in content-only fields. The HTML adapter keeps
// the existing display nodes; the model carries no application event handlers.
export function normalizeQuestion(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return { errors: ["Question must be an object."], question: null };
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const type = input.type || "choice"; // Backward compatibility for old MCQs.
  if (!stableId.test(id) || ["constructor", "prototype"].includes(id)) errors.push("Question needs a stable lowercase ID.");
  if (!["choice", "number", "drag-drop"].includes(type)) errors.push(`Unsupported question type: ${type}.`);
  const answer = typeof input.answer === "string" || typeof input.answer === "number" ? String(input.answer).trim() : "";
  const choices = Array.isArray(input.choices) ? input.choices : [];
  const choiceIds = choices.map(choice => choice?.id);
  let tolerance = 0;
  const drag = type === "drag-drop" ? validateDragQuestion(input) : null;
  if (drag) errors.push(...drag.errors);
  if (type === "choice") {
    if (choices.length < 2 || choiceIds.some(choiceId => typeof choiceId !== "string" || !choiceId.trim()) || new Set(choiceIds).size !== choiceIds.length) {
      errors.push("Choice questions need at least two choices with distinct IDs.");
    }
    if (!answer || !choiceIds.includes(answer)) errors.push("Answer does not match a choice ID.");
  } else if (type === "number") {
    if (parseNumericAnswer(answer) === null) errors.push("Numeric question needs a finite numeric answer.");
    if (input.tolerance != null) {
      tolerance = parseNumericAnswer(input.tolerance);
      if (tolerance === null || tolerance < 0) errors.push("Tolerance must be a finite, non-negative number.");
    }
    if (choices.length) errors.push("Numeric questions must not have choices.");
  }
  for (const name of ["prompt", "solution"]) {
    if (!input[name] || ["th", "en"].some(lang => typeof input[name][lang] !== "string" || !input[name][lang].trim())) {
      errors.push(`${name} needs Thai and English content.`);
    }
  }
  const topicIds = readIds(input.topicIds, "topicIds", errors);
  const examIds = readIds(input.examIds, "examIds", errors);
  return { errors, question: {
    version: QUESTION_MODEL_VERSION, id, type, answer, tolerance,
    prompt: input.prompt, context: input.context || null, choices,
    hints: Array.isArray(input.hints) ? input.hints : [], solution: input.solution,
    unit: { th: String(input.unit?.th || ""), en: String(input.unit?.en || "") },
    topicIds, examIds,
    ...(drag ? { items: drag.items, slots: drag.slots, reuse: drag.reuse, body: input.body } : {}),
  } };
}

export function isCorrectAnswer(question, answer) {
  if (!hasAnswer(answer)) return false;
  if (question.type === "drag-drop") {
    const result = dragAnswerSummary(question, answer);
    return result.complete && result.correct === result.total;
  }
  if (question.type !== "number") return answer === question.answer;
  const value = parseNumericAnswer(answer);
  const expected = parseNumericAnswer(question.answer);
  const tolerance = question.tolerance ?? 0;
  if (value === null || expected === null || !Number.isFinite(tolerance) || tolerance < 0) return false;
  // Only machine roundoff beyond the author-defined absolute tolerance.
  const roundoff = 4 * Number.EPSILON * Math.max(Math.abs(value), Math.abs(expected), tolerance, Number.MIN_VALUE);
  return Math.abs(value - expected) <= tolerance + roundoff;
}

export function isStoredAnswer(question, answer) {
  if (question.type === "drag-drop") return isStoredDragAnswer(question, answer);
  // Preserve even an incomplete/invalid numeric draft (e.g. "-") for editing.
  // Validation feedback and grading must not discard the student's input.
  if (question.type === "number") return typeof answer === "string" && answer.length <= MAX_ANSWER_LENGTH;
  return (question.choices || question.options?.map(option => ({ id: option.dataset.choiceId })) || []).some(choice => choice.id === answer);
}
