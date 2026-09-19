import { hasAnswer, parseNumericAnswer, MAX_ANSWER_LENGTH } from "./quiz-question-model.js";
import { mathLayouts } from "./quiz-math-layouts.js";

let library;
function loadMathLive() {
  library ||= import("../vendor/mathlive-0.110.0/mathlive.min.mjs").then(module => {
    module.MathfieldElement.fontsDirectory = new URL("../vendor/mathlive-0.110.0/fonts", import.meta.url).href;
    module.MathfieldElement.soundsDirectory = null;
    return module;
  }).catch(error => { library = null; throw error; });
  return library;
}

export function hideMathKeyboard() {
  window.mathVirtualKeyboard?.hide();
}

export function mountNumericAnswer(target, { value = "", disabled = false, unit = "", language = "th", onInput }) {
  const label = (th, en) => language === "en" ? en : th;
  const prefix = "quiz-numeric";
  const limit = MAX_ANSWER_LENGTH;
  const field = document.createElement("div");
  field.className = "quiz-number-response";
  const heading = document.createElement("label");
  heading.id = `${prefix}-label`;
  heading.htmlFor = `${prefix}-answer`;
  heading.textContent = label("คำตอบสุดท้าย", "Final answer");
  const input = document.createElement("input");
  input.id = `${prefix}-answer`;
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.maxLength = limit;
  input.dataset.numericAnswer = "";
  input.dataset.allowSelection = "";
  input.value = String(value);
  input.disabled = disabled;
  const unitLabel = document.createElement("span");
  unitLabel.id = `${prefix}-unit`;
  unitLabel.textContent = unit;
  const feedback = document.createElement("p");
  feedback.id = `${prefix}-format`;
  feedback.setAttribute("aria-live", "polite");
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "quiz-sync-action quiz-math-keyboard-toggle";
  toggle.textContent = label("⌨ แป้นคณิต–วิทย์ · แสดง/ซ่อน", "⌨ Math & science keyboard · show/hide");
  toggle.disabled = true;
  let active = input;
  let lastValue = input.value;
  const status = () => {
    const invalid = hasAnswer(active.value) && parseNumericAnswer(active.value) === null;
    active.setAttribute("aria-invalid", String(invalid));
    feedback.textContent = invalid
      ? label("ข้อนี้ต้องการค่าตัวเลข เช่น 1/4 · ยังไม่ตรวจสูตรที่มีตัวแปร log ตรีโกณมิติ ดิฟ อินทิกรัล หรือหน่วยอัตโนมัติ", "This question needs a numeric value, e.g. 1/4. Variables, log, trig, calculus and units are not automatically graded yet.")
      : label("ใส่จำนวนลบ ทศนิยม เศษส่วน ราก หรือเลขยกกำลังได้ · ตรวจเมื่อกดตรวจทั้งหมด", "Accepts negative numbers, decimals, fractions, roots and powers. Graded on Submit all.");
  };
  const describe = element => {
    element.setAttribute("aria-labelledby", heading.id);
    element.setAttribute("aria-describedby", `${prefix}-format ${prefix}-unit`);
  };
  const changed = () => {
    if (active.value.length > limit) {
      active.value = lastValue;
      return;
    }
    lastValue = active.value;
    onInput(lastValue);
    status();
  };
  describe(input);
  input.addEventListener("input", changed);
  field.append(heading, input, unitLabel, toggle, feedback);
  target.append(field);
  status();

  void loadMathLive().then(({ MathfieldElement }) => {
    if (!field.isConnected) return; // Question/account may have changed while loading.
    const math = new MathfieldElement();
    math.id = input.id;
    math.dataset.numericAnswer = "";
    math.dataset.allowSelection = "";
    math.readOnly = disabled;
    math.mathVirtualKeyboardPolicy = "sandboxed";
    math.value = input.value;
    describe(math);
    input.replaceWith(math);
    math.menuItems = [];
    active = math;
    status();
    math.addEventListener("input", changed);
    const show = () => {
      if (disabled) return;
      // Keep the keyboard inside this Quiz iframe, not another open task.
      const keyboard = window.mathVirtualKeyboard;
      keyboard.container = document.body;
      keyboard.layouts = mathLayouts(language, true);
      keyboard.show();
    };
    math.addEventListener("focusin", show);
    toggle.disabled = disabled;
    toggle.addEventListener("click", () => {
      if (window.mathVirtualKeyboard.visible) hideMathKeyboard();
      else { math.focus(); show(); }
    });
  }).catch(error => {
    console.warn("Math keyboard unavailable:", error);
    if (!field.isConnected) return;
    toggle.textContent = label("โหลดแป้นไม่สำเร็จ · พิมพ์เศษส่วน เช่น 1/4 ได้ตามปกติ", "Keyboard unavailable · type fractions such as 1/4 normally");
  });
}
