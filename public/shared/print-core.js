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

  const names = window.LearningHubPrintNames;
  const hubBase = new URL('../', document.currentScript.src);
  const titles = names.createPrintTitleSession(window);
  let catalog = null, catalogRequest = null, hubContext = {}, bankMetadata = {}, bankMetadataKey = '';
  let configuredTitle = null;
  let configuredContent = null;
  let selectedQuestionIds = new Set();
  let activeMode = null;
  let preparingPrint = false;

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

  function printContext() {
    const params = new URLSearchParams(location.search);
    const bankSubject = params.get('bankSubject');
    const context = bankSubject ? { subjectId: bankSubject, chapterId: 'bank', topicId: params.get('bankKey') } : {};
    const source = params.get('content') || document.body.dataset.contentSrc;
    return names.resolvePrintContext({ catalog, context: { ...context, ...hubContext },
      source: source ? new URL(source, location.href).href : '', baseUrl: hubBase.href });
  }
  function getFilename({ mode = 'worksheet', metadata = {} } = {}) {
    const context = printContext();
    const root = resolveContent() || document.documentElement;
    const authored = names.readPrintMetadata({ documentElement: root }, language());
    const labels = names.resolvePrintMetadata({ catalog, context, title: resolveTitle(), language: language(),
      authored: { ...bankMetadata, ...authored } });
    return names.buildPrintFilename({ ...labels, subjectId: context.subjectId, ...metadata, mode, language: language() });
  }
  async function prepareMetadata() {
    catalogRequest ||= names.loadPrintCatalog(hubBase).then(value => { catalog = value; });
    await catalogRequest;
    const context = printContext();
    const key = JSON.stringify([context.subjectId, context.chapterId, context.topicId, language()]);
    if (bankMetadataKey === key) return;
    bankMetadataKey = key; bankMetadata = {};
    if (context.chapterId === 'bank') {
      try {
        const { loadBankPrintMetadata } = await import(new URL('shared/print-bank-metadata.js', hubBase).href);
        const value = await loadBankPrintMetadata(context, language());
        if (bankMetadataKey === key) bankMetadata = value;
      } catch { /* Labels are optional; never block a printable document. */ }
    }
  }
  function receiveContext(context) {
    const next = context?.content || {};
    if (JSON.stringify(next) !== JSON.stringify(hubContext)) { bankMetadata = {}; bankMetadataKey = ''; }
    hubContext = next;
  }
  window.addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin && event.data?.type === 'learning-hub-context') receiveContext(event.data);
  });
  document.addEventListener('learning-hub-context-change', event => receiveContext(event.detail));

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
      const active = option?.querySelector(`[data-quiz-language="${language()}"]`) || option;
      return active?.textContent?.trim() || answer;
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
    if (solution) { solution.hidden = false; solution.before(result); }
    else question.append(result);
  }

  function decorateQuizPaper(question, mode) {
    const prompt = question.querySelector('[data-question-prompt]');
    if (prompt) {
      const number = document.createElement('span');
      number.className = 'quiz-paper-number';
      number.textContent = `${question.dataset.printIndex}.`;
      prompt.prepend(number);
    }
    const options = [...question.querySelectorAll('[data-choice-id]')];
    let longest = 0;
    options.forEach((option, index) => {
      const active = option.querySelector(`[data-quiz-language="${language()}"]`) || option;
      longest = Math.max(longest, active.textContent.trim().length);
      if (active.querySelector('img, svg, table')) longest = Infinity;
      const letter = document.createElement('span');
      letter.className = 'quiz-paper-letter';
      letter.textContent = `${String.fromCharCode(65 + index)}.`;
      option.prepend(letter);
    });
    const authored = Number(question.dataset.printColumns);
    const columns = authored >= 1 && authored <= 5 && Number.isInteger(authored) ? authored : longest <= 24 ? 5 : longest <= 65 ? 2 : 1;
    question.style.setProperty('--quiz-paper-columns', String(columns));
    if (mode !== 'worksheet') return;
    const choice = Number(document.querySelector('[data-print-workspace]')?.value) || 40;
    const custom = Number(question.dataset.printWorkspaceMm);
    const height = custom >= 20 && custom <= 120 ? custom : choice;
    const workspace = document.createElement('section');
    workspace.className = 'quiz-paper-workspace';
    workspace.style.setProperty('--quiz-paper-space', `${height}mm`);
    const caption = document.createElement('div');
    caption.className = 'quiz-paper-workspace-caption';
    caption.append(createDualText('span', 'เหตุผล / วิธีทำ / แผนภาพ', 'Reasoning / working / diagram'));
    const answer = document.createElement('span');
    answer.textContent = localized('ตอบ __________', 'Answer __________');
    caption.append(answer);
    workspace.append(caption);
    question.append(workspace);
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
    // Localize leaves before adding paper labels. Rich text and SVG stay intact.
    clone.querySelectorAll('[data-th][data-en]').forEach(node => {
      if (!node.children.length) node.textContent = node.dataset[language()];
    });
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
        if (clone.classList.contains('quiz-print-content')) decorateQuizPaper(question, mode);
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

    titles.set(getFilename({ mode }));
    return true;
  }

  function restore() {
    window.MathJax?.typesetClear?.([printHost]);
    titles.restore();
    delete document.body.dataset.printMode;
    printHost.setAttribute("aria-hidden", "true");
    printHost.replaceChildren();
    activeMode = null;
  }

  async function typesetPrint() {
    if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
    if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([printHost]);
    await document.fonts?.ready;
  }

  async function print(mode = "worksheet") {
    if (preparingPrint) return;
    preparingPrint = true;
    try {
      await prepareMetadata();
      if (!prepare(mode)) { setSelectionPanel(true); return; }
      await typesetPrint();
      window.print();
    } catch {
      restore();
      window.alert(localized('จัดสูตรสำหรับพิมพ์ไม่สำเร็จ กรุณาลองอีกครั้ง', 'Could not prepare equations for printing. Please retry.'));
    } finally { preparingPrint = false; }
  }

  // Print the review panel without reconfiguring the quiz or its selected questions.
  async function printReview({ content, title, metadata = {} } = {}) {
    if (preparingPrint || !content?.isConnected) return false;
    const dialog = content.closest('dialog');
    const isCurrent = () => content.isConnected && (!dialog || dialog.open);
    preparingPrint = true;
    try {
      const clone = content.cloneNode(true);
      clone.querySelectorAll('script, style, iframe, object, embed, form, button, input, textarea, select, [hidden], [data-no-print], .no-print, .quiz-topic-review-icon').forEach(node => node.remove());
      clone.querySelectorAll('[data-th][data-en]').forEach(node => {
        if (!node.children.length) node.textContent = node.dataset[language()];
      });
      clone.querySelectorAll('[data-content-lang], [data-quiz-language]').forEach(node => {
        if ((node.dataset.contentLang || node.dataset.quizLanguage) !== language()) node.remove();
      });
      const page = document.createElement('article');
      page.className = 'activity-print-document activity-topic-review-print';
      const heading = document.createElement('h1');
      heading.textContent = title?.trim() || localized('ทวนเนื้อหา', 'Topic review');
      page.append(heading, ...clone.childNodes);
      printHost.replaceChildren(page);
      printHost.setAttribute('aria-hidden', 'false');
      activeMode = 'topic-review';
      document.body.dataset.printMode = activeMode;
      await prepareMetadata();
      if (!isCurrent()) { restore(); return false; }
      titles.set(getFilename({ mode: 'topic-review', metadata: { ...metadata, work: metadata.work || heading.textContent } }));
      await typesetPrint();
      await Promise.all([...printHost.querySelectorAll('img')].map(image => {
        image.loading = 'eager';
        return image.decode ? image.decode() : Promise.resolve();
      }));
      if (!isCurrent()) { restore(); return false; }
      window.print();
      return true;
    } catch {
      restore();
      window.alert(localized('เตรียมบททวนสำหรับพิมพ์ไม่สำเร็จ กรุณาตรวจรูปภาพหรือสมการแล้วลองใหม่', 'Could not prepare the topic review. Check its images or equations and retry.'));
      return false;
    } finally { preparingPrint = false; }
  }

  function configure({ getTitle, getContent } = {}) {
    bankMetadata = {}; bankMetadataKey = '';
    if (getTitle) configuredTitle = getTitle;
    if (getContent) configuredContent = getContent;

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
    getFilename, prepareMetadata,
    getSelectedQuestionIds: () => [...selectedQuestionIds],
    prepare,
    typesetPrint,
    print,
    printReview,
    restore,
    selectAll: () => setAllQuestions(true),
    selectNone: () => setAllQuestions(false),
  });
})();
