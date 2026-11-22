const form = document.getElementById("lab-form");
const inputs = Array.from(form.elements).filter(element => element.name);
const fields = new Map(inputs.map(element => [element.name, element]));
const printReport = document.getElementById("print-report");
const feedback = document.getElementById("check-feedback");
const storageStatus = document.getElementById("storage-status");
const languageButton = document.getElementById("language");
const storagePrefix = "learning-hub:chemistry-acid-base-lab-guide:v1:";
let language = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "th";
let hubLanguage = null;
let identity = window === window.parent ? "guest" : null;
let checked = false;

const copy = {
  savedProblem: ["เบราว์เซอร์เก็บใบบันทึกไม่ได้ พิมพ์หรือบันทึก PDF ก่อนปิด", "This browser could not save your worksheet. Print or save a PDF before closing."],
  incomplete: ["กรอกผลที่วัดให้ครบทั้งสองแล็บ และตอบคำถามท้ายแล็บก่อนตรวจ", "Enter the complete measurements and answer the lab questions before checking."],
  range: ["ตรวจค่าที่กรอก ค่า pH ที่ใช้ในแล็บนี้อยู่ระหว่าง 0–14 และค่าบิวเรตอยู่ระหว่าง 0–50 mL", "Check your entries. The pH range for this lab is 0–14 and burette readings run from 0–50 mL."],
  burette: ["ตรวจว่าค่าสุดท้ายมากกว่าค่าเริ่มต้น แล้วลบค่าบิวเรตของแต่ละรอบอีกครั้ง", "Make sure the final reading is larger than the initial reading, then subtract the readings for each trial."],
  repeat: ["ปริมาตรกรดที่ใช้สองรอบต่างกันเกิน 0.20 mL ให้ปรึกษาครูและใช้ผลสองรอบที่ครูยืนยัน", "The acid volumes differ by more than 0.20 mL. Ask your teacher and use two accepted trials."],
  deltas: ["ตรวจ |ΔpH| ของ A และ B อีกครั้ง ใช้ค่าสุดท้ายที่ 0.50 mL ลบค่าเริ่มต้น แล้วหาค่าสัมบูรณ์", "Check both |ΔpH| values. Subtract the initial pH from the final pH at 0.50 mL and take the absolute value."],
  concentration: ["ลองคำนวณใหม่จาก HCl เฉลี่ยและความเข้มข้นตามฉลาก ใช้ ICF อัตราส่วน 1:1 แล้วหาร mmol NaOH ด้วย 10.00 mL", "Recheck the mean HCl volume and the concentration on its label. Use the 1:1 ratio in ICF, then divide the NaOH amount in mmol by 10.00 mL."],
  ready: ["ความเข้มข้นและ |ΔpH| สอดคล้องกับผลที่คุณบันทึกแล้ว พิมพ์หรือบันทึก PDF เพื่อส่งครู", "The concentration and |ΔpH| values agree with your recorded data. Print or save the worksheet as a PDF to hand in."],
};
const feedbackKeys = new Set(Object.keys(copy));
let currentFeedback = null;

function phrase(key) {
  return copy[key][language === "en" ? 1 : 0];
}

function setLanguage(next) {
  language = next;
  document.documentElement.lang = next;
  languageButton.textContent = next === "en" ? "ภาษาไทย" : "English";
  for (const input of inputs) {
    const label = next === "en" ? input.dataset.labelEn : input.dataset.labelTh;
    if (label) input.setAttribute("aria-label", label);
  }
  if (currentFeedback) feedback.textContent = phrase(currentFeedback);
  if (storageStatus.textContent) storageStatus.textContent = phrase("savedProblem");
}

function value(name) {
  return fields.get(name).value.trim();
}

function number(name) {
  const text = value(name).replace(/[๐-๙]/g, digit => String("๐๑๒๓๔๕๖๗๘๙".indexOf(digit))).replace(",", ".");
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) ? Number(text) : NaN;
}

function updatePrintValues() {
  for (const input of inputs) input.nextElementSibling.textContent = input.value;
}

function status(key, moveFocus = false) {
  currentFeedback = feedbackKeys.has(key) ? key : null;
  checked = currentFeedback === "ready";
  feedback.hidden = !currentFeedback;
  feedback.dataset.ok = String(checked);
  feedback.textContent = currentFeedback ? phrase(currentFeedback) : "";
  printReport.hidden = !checked;
  if (moveFocus) feedback.focus();
}

function snapshot() {
  return {
    answers: Object.fromEntries(inputs.map(input => [input.name, input.value])),
    checked,
  };
}

function save() {
  if (identity === null) return;
  try {
    localStorage.setItem(storagePrefix + identity, JSON.stringify(snapshot()));
    storageStatus.textContent = "";
  } catch {
    storageStatus.textContent = phrase("savedProblem");
  }
}

function restore() {
  let prior;
  try {
    prior = JSON.parse(localStorage.getItem(storagePrefix + identity) || "null");
    storageStatus.textContent = "";
  } catch {
    storageStatus.textContent = phrase("savedProblem");
  }
  for (const input of inputs) {
    const entry = prior?.answers?.[input.name];
    input.value = typeof entry === "string" ? entry.slice(0, input.maxLength > 0 ? input.maxLength : 120) : "";
  }
  updatePrintValues();
  status(prior?.checked === true && validate() === "ready" ? "ready" : null);
}

function validate() {
  const buretteFields = [1, 2].flatMap(trial => ["start", "end", "used"].map(field => field + "-" + trial));
  const readings = ["naoh-ph", "endpoint-1", "endpoint-2", "a-0", "a-1", "a-2", "b-0", "b-1", "b-2"];
  const evidence = ["color-1", "color-2", "prediction", "endpoint-evidence", "endpoint-difference", "buffer-evidence"];
  if ([...buretteFields, ...readings, ...evidence, "hcl", "delta-a", "delta-b", "answer"].some(name => !value(name))) return "incomplete";
  const concentration = number("hcl");
  if (!Number.isFinite(concentration) || concentration <= 0 ||
      buretteFields.some(name => !(number(name) >= 0 && number(name) <= 50)) ||
      readings.some(name => !(number(name) >= 0 && number(name) <= 14))) return "range";

  const volumes = [1, 2].map(trial => number("end-" + trial) - number("start-" + trial));
  if (volumes.some((volume, index) => volume <= 0 || Math.abs(volume - number("used-" + (index + 1))) > 0.0051)) return "burette";
  if (Math.abs(volumes[0] - volumes[1]) > 0.200001) return "repeat";

  if (["a", "b"].some(beaker => {
    const delta = number("delta-" + beaker);
    const measured = Math.abs(number(beaker + "-2") - number(beaker + "-0"));
    return !(delta >= 0 && Math.abs(delta - measured) <= 0.011);
  })) return "deltas";

  const expected = concentration * (volumes[0] + volumes[1]) / 2 / 10;
  const answer = number("answer");
  return answer > 0 && Math.abs(answer - expected) <= Math.max(0.0005, expected * 0.005) ? "ready" : "concentration";
}

languageButton.addEventListener("click", () => setLanguage(language === "th" ? "en" : "th"));
for (const id of ["print", "print-report"]) {
  document.getElementById(id).addEventListener("click", () => {
    updatePrintValues();
    window.print();
  });
}
form.addEventListener("input", () => {
  updatePrintValues();
  status(null);
  save();
});
form.addEventListener("submit", event => {
  event.preventDefault();
  status(validate(), true);
  save();
});

addEventListener("message", event => {
  if (event.source !== parent || event.origin !== location.origin ||
      event.data?.type !== "learning-hub-context" ||
      event.data.content?.contentId !== "chemistry-acid-base-lab-guide") return;
  const uid = event.data.identity?.uid;
  const next = typeof uid === "string" && uid ? uid : "guest";
  if (identity !== next) {
    save();
    identity = next;
    restore();
  }
  if (["en", "th"].includes(event.data.language) && event.data.language !== hubLanguage) {
    hubLanguage = event.data.language;
    setLanguage(hubLanguage);
  }
});

window.LearningHubSimulation = { flushLocal: save };
addEventListener("pagehide", save);
addEventListener("beforeprint", updatePrintValues);
setLanguage(language);
if (identity !== null) restore();
