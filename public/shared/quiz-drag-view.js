import { placeDragItem, dragAnswerSummary, describeDragAnswer } from "./quiz-drag-model.js";

function fragment(html, lang) {
  const template = document.createElement("template");
  template.innerHTML = html || "";
  template.content.querySelectorAll("script,style,iframe,object,embed,form,input,button,textarea,select").forEach(node => node.remove());
  template.content.querySelectorAll("*").forEach(node => {
    for (const attribute of [...node.attributes]) {
      if (/^on/i.test(attribute.name) || (["href", "src", "xlink:href"].includes(attribute.name) && /^\s*javascript:/i.test(attribute.value))) node.removeAttribute(attribute.name);
    }
    if (node.dataset.quizLanguage && node.dataset.quizLanguage !== lang) node.remove();
    else if (node.dataset[lang] && !node.matches("[data-drop-slot]")) node.textContent = node.dataset[lang];
  });
  return template.content;
}

function textOf(html, lang) {
  const content = fragment(html, lang);
  content.querySelectorAll("img").forEach(image => image.replaceWith(document.createTextNode(image.alt || "[image]")));
  return content.textContent.replace(/\s+/g, " ").trim();
}

export function dragAnswerText(question, answer, lang) {
  return describeDragAnswer(question, answer, lang, html => textOf(html, lang));
}

export function dragQuestionText(question, lang) {
  const body = fragment(question.body[lang], lang);
  body.querySelectorAll("[data-drop-slot]").forEach(slot => {
    const model = question.slots.find(item => item.id === slot.dataset.dropSlot);
    slot.textContent = `[${model?.label[lang] || slot.dataset.dropSlot}]`;
  });
  body.querySelectorAll("img").forEach(image => image.replaceWith(document.createTextNode(image.alt || "[image]")));
  return `${body.textContent.replace(/\s+/g, " ").trim()}\nItems:\n${question.items.map(item => `${item.id}: ${textOf(item.text[lang], lang)}`).join("\n")}`;
}

// Also used for PDF evidence: render the whole task without interactive controls.
export function createDragEvidenceBody(question, answer, lang) {
  const body = document.createElement("div");
  body.className = "quiz-drag-body";
  body.append(fragment(question.body[lang], lang));
  body.querySelectorAll("[data-drop-slot]").forEach(slot => {
    const model = question.slots.find(item => item.id === slot.dataset.dropSlot);
    const item = question.items.find(candidate => candidate.id === answer?.[model?.id]);
    slot.removeAttribute("data-answer");
    slot.classList.add("quiz-drag-paper-slot");
    slot.replaceChildren(document.createTextNode(`${model?.label[lang] || model?.id}: `));
    if (item) slot.append(fragment(item.text[lang], lang));
    else slot.append(document.createTextNode("________"));
  });
  return body;
}

export function mountDragAnswer(target, { question, value, disabled, language: lang, onChange, canEdit = () => true, typeset = () => {} }) {
  const abort = new AbortController();
  const listen = (node, type, handler, options = {}) => node.addEventListener(type, handler, { ...options, signal: abort.signal });
  const label = (th, en) => lang === "en" ? en : th;
  let answer = value || {};
  let selected = null;
  let gesture = null;
  let suppressClick = false;
  let ghost = null;
  let hovered = null;
  const root = document.createElement("section");
  root.className = "quiz-drag-answer";
  root.innerHTML = `<p class="quiz-drag-instructions"></p><div class="quiz-drag-body"></div><section class="quiz-drag-bank"><h3></h3><div class="quiz-drag-pieces"></div></section><p class="quiz-drag-status" role="status" aria-live="polite"></p>`;
  root.querySelector(".quiz-drag-instructions").textContent = label("ลากชิ้นคำตอบลงช่อง หรือแตะชิ้นคำตอบแล้วแตะช่อง · ตรวจทุกช่องพร้อมกันเมื่อส่งตรวจ", "Drag a piece to a slot, or tap a piece then a slot. All slots are graded together on submission.");
  root.querySelector("h3").textContent = label("ชิ้นคำตอบ", "Answer pieces");
  const body = root.querySelector(".quiz-drag-body");
  body.append(fragment(question.body[lang], lang));
  const bank = root.querySelector(".quiz-drag-pieces");
  const status = root.querySelector(".quiz-drag-status");
  const slots = new Map();
  const pieces = new Map();

  function report(message = "") {
    const { filled, total } = dragAnswerSummary(question, answer);
    status.textContent = `${label(`วางแล้ว ${filled}/${total} ช่อง`, `${filled}/${total} slots filled`)}${message ? ` · ${message}` : ""}`;
  }

  function refresh() {
    for (const [id, { button, remove, copy }] of slots) {
      const item = question.items.find(item => item.id === answer[id]);
      const slot = question.slots.find(slot => slot.id === id);
      copy.replaceChildren(item ? fragment(item.text[lang], lang) : document.createTextNode(label("วางคำตอบ", "Place answer")));
      button.dataset.filled = String(Boolean(item));
      button.setAttribute("aria-label", `${slot.label[lang]}: ${item ? textOf(item.text[lang], lang) : label("ว่าง", "empty")}`);
      remove.hidden = !item;
      remove.disabled = disabled;
    }
    for (const [id, button] of pieces) {
      const used = Object.values(answer).includes(id);
      button.dataset.used = String(used && question.reuse !== "repeat");
      button.setAttribute("aria-pressed", String(id === selected));
      button.querySelector(".quiz-drag-piece-state").textContent = used && question.reuse !== "repeat" ? label("วางแล้ว · เลือกเพื่อย้าย", "Placed · select to move") : "";
    }
    report(selected ? label("เลือกแล้ว แตะช่องที่ต้องการ", "Selected. Choose a slot.") : "");
    typeset(body);
  }

  function place(slotId, itemId) {
    if (disabled || !canEdit()) return;
    const next = placeDragItem(question, answer, slotId, itemId);
    if (!next) return;
    if (JSON.stringify(next) !== JSON.stringify(answer)) {
      answer = next;
      onChange(next);
    }
    selected = null;
    refresh();
  }

  body.querySelectorAll("[data-drop-slot]").forEach(placeholder => {
    const id = placeholder.dataset.dropSlot;
    const slot = question.slots.find(slot => slot.id === id);
    const group = document.createElement("span");
    group.className = "quiz-drag-slot-group";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-drag-slot";
    button.dataset.slotId = id;
    button.disabled = disabled;
    const heading = document.createElement("span");
    heading.className = "quiz-drag-slot-label";
    heading.textContent = slot.label[lang];
    const copy = document.createElement("span");
    copy.className = "quiz-drag-slot-copy";
    button.append(heading, copy);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "quiz-drag-remove";
    remove.textContent = "×";
    remove.setAttribute("aria-label", label(`นำคำตอบออกจาก ${slot.label[lang]}`, `Clear ${slot.label[lang]}`));
    listen(remove, "click", () => place(id, null));
    listen(button, "click", () => {
      if (selected) place(id, selected);
      else report(label("เลือกชิ้นคำตอบก่อน แล้วแตะช่องนี้", "Select an answer piece, then this slot."));
    });
    group.append(button, remove);
    placeholder.replaceWith(group);
    slots.set(id, { button, remove, copy });
  });

  function cleanGesture() {
    if (gesture?.button.hasPointerCapture?.(gesture.id)) gesture.button.releasePointerCapture(gesture.id);
    gesture = null;
    ghost?.remove(); ghost = null;
    hovered?.removeAttribute("data-drag-over"); hovered = null;
  }

  for (const item of question.items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-drag-piece";
    button.dataset.itemId = item.id;
    button.disabled = disabled;
    const copy = document.createElement("span");
    copy.className = "quiz-drag-piece-copy";
    copy.append(fragment(item.text[lang], lang));
    const badge = document.createElement("small");
    badge.className = "quiz-drag-piece-state";
    button.append(copy, badge);
    listen(button, "click", () => {
      if (!canEdit()) return;
      if (suppressClick) { suppressClick = false; return; }
      selected = selected === item.id ? null : item.id;
      refresh();
    });
    listen(button, "pointerdown", event => {
      if (disabled || !canEdit() || !event.isPrimary || event.button !== 0) return;
      cleanGesture(); suppressClick = false;
      gesture = { id: event.pointerId, itemId: item.id, button, x: event.clientX, y: event.clientY, moved: false };
      button.setPointerCapture(event.pointerId);
    });
    listen(button, "pointermove", event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (!gesture.moved && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 7) return;
      gesture.moved = true;
      if (!ghost) {
        ghost = document.createElement("div");
        ghost.className = "quiz-drag-ghost";
        ghost.textContent = textOf(item.text[lang], lang).slice(0, 100);
        ghost.setAttribute("aria-hidden", "true");
        document.body.append(ghost);
      }
      ghost.style.left = `${event.clientX + 12}px`;
      ghost.style.top = `${event.clientY + 12}px`;
      hovered?.removeAttribute("data-drag-over");
      hovered = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot-id]");
      if (!root.contains(hovered)) hovered = null;
      hovered?.setAttribute("data-drag-over", "true");
      // Let long questions scroll while dragging close to the viewport edge.
      if (event.clientY < 75) window.scrollBy(0, -14);
      else if (event.clientY > window.innerHeight - 75) window.scrollBy(0, 14);
    });
    listen(button, "pointerup", event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const moved = gesture.moved;
      const slotId = hovered?.dataset.slotId;
      cleanGesture();
      if (moved) {
        suppressClick = true;
        if (slotId) place(slotId, item.id);
        else report(label("ยังไม่วางคำตอบ เลือกชิ้นแล้วแตะช่องได้", "No placement. You can select the piece and tap a slot."));
      }
    });
    listen(button, "pointercancel", () => { cleanGesture(); suppressClick = true; });
    listen(button, "lostpointercapture", cleanGesture);
    listen(button, "dragstart", event => event.preventDefault());
    listen(button, "contextmenu", event => event.preventDefault());
    pieces.set(item.id, button);
    bank.append(button);
  }
  listen(root, "keydown", event => {
    if (event.key === "Escape") { cleanGesture(); selected = null; refresh(); }
  });
  target.replaceChildren(root);
  refresh(); typeset(bank);
  return { destroy() { cleanGesture(); abort.abort(); } };
}
