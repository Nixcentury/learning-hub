// Answer pieces and slots are identified by stable IDs, never by screen position.
// This module has no browser, storage, or AI dependencies.
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const reserved = new Set(["constructor", "prototype", "__proto__"]);
const validId = id => typeof id === "string" && idPattern.test(id) && !reserved.has(id);
const isMap = value => value !== null && typeof value === "object" && !Array.isArray(value);
export const DRAG_LIMITS = Object.freeze({ slots: 40, items: 80 });

export function validateDragQuestion(input) {
  const errors = [];
  const items = Array.isArray(input.items) ? input.items : [];
  const slots = Array.isArray(input.slots) ? input.slots : [];
  const reuse = input.reuse || "once";
  if (!["once", "repeat"].includes(reuse)) errors.push("Drag reuse must be once or repeat.");
  if (!items.length || items.length > DRAG_LIMITS.items) errors.push(`Drag questions need 1–${DRAG_LIMITS.items} items.`);
  if (!slots.length || slots.length > DRAG_LIMITS.slots) errors.push(`Drag questions need 1–${DRAG_LIMITS.slots} slots.`);
  for (const [name, records] of [["item", items], ["slot", slots]]) {
    if (records.some(record => !validId(record?.id)) || new Set(records.map(record => record?.id)).size !== records.length) {
      errors.push(`Drag ${name} IDs must be distinct, stable lowercase IDs.`);
    }
  }
  const ids = new Set(items.map(item => item?.id));
  if (slots.some(slot => !ids.has(slot?.answer))) errors.push("Every slot answer must match a drag item ID.");
  if (reuse === "once" && new Set(slots.map(slot => slot?.answer)).size !== slots.length) {
    errors.push("Repeated slot answers require data-drag-reuse=repeat.");
  }
  if (items.some(item => !item?.text || ["th", "en"].some(lang => !String(item.text[lang] || "").trim()))) {
    errors.push("Every drag item needs Thai and English content (or shared image/formula content).");
  }
  if (!input.body || ["th", "en"].some(lang => !String(input.body[lang] || "").trim())) errors.push("Drag questions need data-question-body.");
  return { errors, items, slots, reuse };
}

export function isStoredDragAnswer(question, answer) {
  if (!isMap(answer) || Object.keys(answer).length > question.slots.length) return false;
  const slots = new Set(question.slots.map(slot => slot.id));
  const items = new Set(question.items.map(item => item.id));
  const entries = Object.entries(answer);
  if (entries.some(([slot, item]) => !slots.has(slot) || typeof item !== "string" || !items.has(item))) return false;
  return question.reuse === "repeat" || new Set(entries.map(([, item]) => item)).size === entries.length;
}

export function dragAnswerSummary(question, answer) {
  const valid = isStoredDragAnswer(question, answer);
  const filled = valid ? Object.keys(answer).length : 0;
  const correct = valid ? question.slots.filter(slot => answer[slot.id] === slot.answer).length : 0;
  return { filled, correct, total: question.slots.length, complete: valid && filled === question.slots.length };
}

export function placeDragItem(question, answer, slotId, itemId) {
  if (!question.slots.some(slot => slot.id === slotId)) return null;
  if (itemId !== null && !question.items.some(item => item.id === itemId)) return null;
  const next = isStoredDragAnswer(question, answer) ? { ...answer } : {};
  // Moving a single-use piece returns the destination's old piece to the bank.
  if (itemId !== null && question.reuse !== "repeat") {
    for (const [id, item] of Object.entries(next)) if (item === itemId) delete next[id];
  }
  if (itemId === null) delete next[slotId];
  else next[slotId] = itemId;
  return Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
}

export function describeDragAnswer(question, answer, lang = "th", text = value => String(value || "")) {
  return question.slots.map(slot => {
    const item = question.items.find(candidate => candidate.id === answer?.[slot.id]);
    return `${slot.label?.[lang] || slot.id}: ${item ? text(item.text[lang]) : "—"}`;
  }).join("; ");
}
