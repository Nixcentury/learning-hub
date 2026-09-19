/* ==============================================================
   Print Core กลางของ Learning Hub
   - เลือกข้อที่จะพิมพ์จากที่เดียว
   - พิมพ์สรุป, Worksheet และ Answer Key ด้วยรูปแบบ A4 กลาง
   - ไฟล์เนื้อหาไม่ต้องสร้างปุ่มหรือเขียน @media print เอง
================================================================ */

(function initializeLearningHubPrint() {
  if (window.LearningHubPrint) return;

  const supportedModes = new Set(["summary", "worksheet", "answer"]);
  const modeButtons = [...document.querySelectorAll("[data-print-mode]")];
  const selectionToggle = document.querySelector("[data-print-selection-toggle]");
  const selectionLabel = document.querySelector("[data-print-selection-label]");
  const selectionPanel = document.querySelector("[data-print-selection-panel]");
  const questionList = document.querySelector("[data-print-question-list]");
  const selectAllButton = document.querySelector("[data-print-select-all]");
  const selectNoneButton = document.querySelector("[data-print-select-none]");

  const printHost = document.createElement("div");
  printHost.dataset.printHost = "";
  printHost.setAttribute("aria-hidden", "true");
  document.body.append(printHost);

  let originalTitle = document.title;
  let configuredTitle = null;
  let configuredContent = null;
  let selectedQuestionIds = new Set();
  let activeMode = null;

  function language() {
    return document.documentElement.lang === "en" ? "en" : "th";
  }

  function localized(thai, english) {
    return language() === "en" ? english : thai;
  }

  function resolveTitle() {
    if (typeof configuredTitle === "function") {
      return String(configuredTitle() || "").trim();
    }
    return String(configuredTitle || "").trim();
  }

  function resolveContent() {
    return typeof configuredContent === "function" ? configuredContent() : configuredContent;
  }

  function questions() {
    const content = resolveContent();
    return content ? [...content.querySelectorAll("[data-question]")] : [];
  }

  function formatPrintDate(now = new Date()) {
    return new Intl.DateTimeFormat(language() === "en" ? "en-GB" : "th-TH", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(now);
  }

  function createDualText(tagName, thai, english) {
    const element = document.createElement(tagName);
    element.dataset.th = thai;
    element.dataset.en = english;
    element.textContent = localized(thai, english);
    return element;
  }

  function updateSelectionState() {
    const total = questions().length;
    const selected = selectedQuestionIds.size;
    const hasSelection = selected > 0;
    const isReady = total > 0;

    if (selectionLabel) {
      selectionLabel.dataset.th = `เลือกข้อ ${selected}/${total}`;
      selectionLabel.dataset.en = `Questions ${selected}/${total}`;
      selectionLabel.textContent = localized(
        selectionLabel.dataset.th,
        selectionLabel.dataset.en,
      );
    }

    if (selectionToggle) selectionToggle.disabled = !isReady;
    if (selectAllButton) selectAllButton.disabled = !isReady || selected === total;
    if (selectNoneButton) selectNoneButton.disabled = !isReady || selected === 0;

    modeButtons.forEach((button) => {
      button.disabled = !isReady || (button.dataset.printMode !== "summary" && !hasSelection);
    });
  }

  function renderQuestionSelector() {
    const availableQuestions = questions();
    selectedQuestionIds = new Set(
      availableQuestions.map((question) => question.dataset.questionId),
    );
    if (!questionList) {
      updateSelectionState();
      return;
    }

    questionList.replaceChildren();
    availableQuestions.forEach((question, index) => {
      const questionId = question.dataset.questionId;
      const prompt = question.querySelector("[data-question-prompt]");
      const label = document.createElement("label");
      label.className = "activity-print-question-option";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkbox.value = questionId;
      checkbox.dataset.printQuestion = "";
      checkbox.dataset.allowSelection = "";
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selectedQuestionIds.add(questionId);
        else selectedQuestionIds.delete(questionId);
        updateSelectionState();
      });

      const number = document.createElement("span");
      number.className = "activity-print-question-index";
      number.textContent = String(index + 1).padStart(2, "0");

      const copy = createDualText(
        "span",
        prompt?.dataset.th || `ข้อ ${index + 1}`,
        prompt?.dataset.en || `Question ${index + 1}`,
      );
      copy.className = "activity-print-question-copy";
      label.append(checkbox, number, copy);
      questionList.append(label);
    });

    updateSelectionState();
  }

  function setAllQuestions(selected) {
    selectedQuestionIds.clear();
    questionList?.querySelectorAll("[data-print-question]").forEach((checkbox) => {
      checkbox.checked = selected;
      if (selected) selectedQuestionIds.add(checkbox.value);
    });
    updateSelectionState();
  }

  function setSelectionPanel(open) {
    if (!selectionPanel || !selectionToggle) return;
    selectionPanel.hidden = !open;
    selectionToggle.setAttribute("aria-expanded", String(open));
  }

  function syncInputState(source, clone) {
    const sourceInputs = [...source.querySelectorAll("input")];
    const cloneInputs = [...clone.querySelectorAll("input")];
    sourceInputs.forEach((input, index) => {
      const cloneInput = cloneInputs[index];
      if (!cloneInput) return;
      if (["checkbox", "radio"].includes(input.type)) {
        cloneInput.checked = input.checked;
      } else {
        cloneInput.value = input.value;
        cloneInput.setAttribute("value", input.value);
      }
    });
  }

  function cloneContent() {
    const content = resolveContent();
    if (!content) return null;
    const clone = content.cloneNode(true);
    syncInputState(content, clone);
    return clone;
  }

  function createModeBanner(mode, selectedCount) {
    const banner = document.createElement("section");
    banner.className = "activity-print-mode-banner";
    const labels = {
      summary: ["เอกสารสรุป", "Study summary"],
      worksheet: ["แบบฝึกหัดสำหรับพิมพ์", "Printable worksheet"],
      answer: ["เฉลยสำหรับครู", "Teacher answer key"],
    };
    const [thai, english] = labels[mode];
    banner.append(createDualText("strong", thai, english));

    const detail = document.createElement("span");
    if (mode === "summary") {
      detail.dataset.th = "สรุปเนื้อหาสำหรับอ่านทบทวน";
      detail.dataset.en = "Lesson summary for review";
    } else {
      detail.dataset.th = `${selectedCount} ข้อที่เลือก`;
      detail.dataset.en = `${selectedCount} selected question${selectedCount === 1 ? "" : "s"}`;
    }
    detail.textContent = localized(detail.dataset.th, detail.dataset.en);
    banner.append(detail);
    return banner;
  }

  function selectedQuestionsIn(clone) {
    const clonedQuestions = [...clone.querySelectorAll("[data-question]")];
    clonedQuestions.forEach((question) => {
      if (!selectedQuestionIds.has(question.dataset.questionId)) question.remove();
    });
    return [...clone.querySelectorAll("[data-question]")];
  }

  function answerText(question) {
    if (question.dataset.questionType === "drag-drop") {
      return [...question.querySelectorAll("[data-drop-slot]")].map(slot => {
        const item = [...question.querySelectorAll("[data-item-id]")].find(item => item.dataset.itemId === slot.dataset.answer);
        const localizedItem = item?.querySelector(`[data-quiz-language="${language()}"]`) || item;
        return `${slot.dataset[language() === "en" ? "labelEn" : "labelTh"] || slot.dataset.dropSlot}: ${item?.dataset[language()] || localizedItem?.textContent?.trim() || localizedItem?.querySelector("img")?.alt || "—"}`;
      }).join("; ");
    }
    const answer = question.dataset.answer || "-";
    if (question.dataset.questionType === "choice") {
      const option = [...question.querySelectorAll("[data-choice-id]")].find(
        (candidate) => candidate.dataset.choiceId === answer,
      );
      return option?.textContent?.trim() || answer;
    }

    const unit = question.dataset[language() === "en" ? "unitEn" : "unitTh"] || question.querySelector(".activity-number-response span")?.textContent?.trim();
    return unit ? `${answer} ${unit}` : answer;
  }

  function decorateAnswerKey(question) {
    const answer = question.dataset.answer || "";
    const correctAnswer = answerText(question);
    if (question.dataset.questionType === "drag-drop") {
      question.querySelectorAll("[data-drop-slot]").forEach(slot => {
        const item = [...question.querySelectorAll("[data-item-id]")].find(item => item.dataset.itemId === slot.dataset.answer);
        if (item) slot.replaceChildren(...[...item.childNodes].map(node => node.cloneNode(true)));
      });
    }
    question.classList.add("is-print-answer-key");

    if (question.dataset.questionType === "choice") {
      [...question.querySelectorAll("[data-choice-id]")].forEach((option) => {
        option.classList.toggle("is-print-correct", option.dataset.choiceId === answer);
      });
    } else {
      question.querySelector(".activity-number-response")?.remove();
    }

    const result = document.createElement("div");
    result.className = "activity-print-answer";
    result.append(
      createDualText("strong", "คำตอบที่ถูก", "Correct answer"),
      Object.assign(document.createElement("span"), { textContent: correctAnswer }),
    );

    const solution = question.querySelector("[data-question-solution]");
    if (solution) solution.before(result);
    else question.append(result);
  }

  function buildPrintDocument(mode) {
    const clone = cloneContent();
    if (!clone) return null;
    clone.querySelectorAll('[data-question-type="drag-drop"]').forEach(question => {
      question.querySelectorAll("[data-th][data-en]").forEach(node => { if (!node.children.length) node.textContent = node.dataset[language()]; });
      question.querySelectorAll("[data-question-body]").forEach(body => body.classList.add("quiz-drag-body"));
      question.querySelectorAll("[data-drop-slot]").forEach(slot => {
        slot.classList.add("quiz-drag-paper-slot");
        slot.textContent = `${slot.dataset[language() === "en" ? "labelEn" : "labelTh"] || slot.dataset.dropSlot}: ________`;
      });
    });

    clone.classList.add("activity-print-document", `activity-print-mode-${mode}`);
    const summary = clone.querySelector("[data-activity-summary]");
    const questionSection = clone.querySelector("[data-activity-questions]");

    if (mode === "summary") {
      questionSection?.remove();
    } else {
      summary?.remove();
      const selected = selectedQuestionsIn(clone);
      if (selected.length === 0) return null;
      selected.forEach((question) => {
        if (mode === "answer") decorateAnswerKey(question);
        else question.querySelector("[data-question-solution]")?.remove();
      });
    }

    if (mode === "answer") clone.querySelector("[data-activity-print-meta]")?.remove();

    const intro = clone.querySelector("[data-activity-intro]");
    const selectedCount = mode === "summary" ? 0 : clone.querySelectorAll("[data-question]").length;
    intro?.after(createModeBanner(mode, selectedCount));
    return clone;
  }

  function updatePrintTimestamp() {
    printHost.querySelectorAll("[data-print-generated-at]").forEach((element) => {
      element.textContent = formatPrintDate();
    });
  }

  function prepare(mode = activeMode || "worksheet") {
    if (!supportedModes.has(mode)) return false;
    const documentClone = buildPrintDocument(mode);
    if (!documentClone) return false;

    activeMode = mode;
    printHost.replaceChildren(documentClone);
    printHost.setAttribute("aria-hidden", "false");
    document.body.dataset.printMode = mode;
    updatePrintTimestamp();

    const title = resolveTitle();
    if (title) document.title = `${title} · ${mode} · Learning Hub`;
    return true;
  }

  function restore() {
    document.title = originalTitle;
    delete document.body.dataset.printMode;
    printHost.setAttribute("aria-hidden", "true");
    printHost.replaceChildren();
    activeMode = null;
  }

  function print(mode = "worksheet") {
    if (!prepare(mode)) {
      setSelectionPanel(true);
      return;
    }
    window.print();
  }

  function configure({ getTitle, getContent } = {}) {
    if (getTitle) configuredTitle = getTitle;
    if (getContent) configuredContent = getContent;
    originalTitle = document.title;
    renderQuestionSelector();
  }

  selectionToggle?.addEventListener("click", () => {
    setSelectionPanel(selectionPanel?.hidden !== false);
  });
  selectAllButton?.addEventListener("click", () => setAllQuestions(true));
  selectNoneButton?.addEventListener("click", () => setAllQuestions(false));
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => print(button.dataset.printMode));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setSelectionPanel(false);
  });
  window.addEventListener("beforeprint", () => {
    if (!document.body.dataset.printMode) prepare();
    else updatePrintTimestamp();
  });
  window.addEventListener("afterprint", restore);

  updateSelectionState();

  window.LearningHubPrint = Object.freeze({
    configure,
    getSelectedQuestionIds: () => [...selectedQuestionIds],
    prepare,
    print,
    restore,
    selectAll: () => setAllQuestions(true),
    selectNone: () => setAllQuestions(false),
  });
})();
