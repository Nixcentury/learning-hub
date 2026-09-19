/* ==============================================================
   Activity Core กลางของ Learning Hub
   - โหลด HTML ที่มีเฉพาะเนื้อหา
   - ตรวจ Content Contract V1 ก่อนแสดง
   - สร้างช่องตอบและส่งเนื้อหาให้ระบบปริ้นกลาง
   - รอบ 5B ยังไม่ตรวจคำตอบ ไม่คิดคะแนน และไม่บันทึกข้อมูล
================================================================ */

(function initializeLearningHubActivity() {
  if (window.LearningHubActivity) return;

  const shell = document.querySelector("[data-activity-shell]");
  const mount = document.querySelector("[data-activity-mount]");
  const loading = document.querySelector("[data-activity-loading]");
  const status = document.querySelector("[data-activity-contract-status]");
  const printControls = [
    ...document.querySelectorAll(
      "[data-print-mode], [data-print-selection-toggle], [data-print-select-all], [data-print-select-none]",
    ),
  ];
  const allowedQuestionTypes = new Set(["choice", "number"]);
  const forbiddenSelector = "script, style, link, iframe, object, embed, form, button, input, textarea, select";

  let contentRoot = null;
  let validationErrors = [];

  function language() {
    return document.documentElement.lang === "en" ? "en" : "th";
  }

  function localized(thai, english) {
    return language() === "en" ? english : thai;
  }

  function resolveContentSource() {
    const requestedFile = new URLSearchParams(location.search).get("content")?.trim();
    if (!requestedFile) return shell?.dataset.contentSrc?.trim();

    const isSafeContentPath =
      /^[a-z0-9][a-z0-9/_-]*\.html$/i.test(requestedFile) &&
      !requestedFile.includes("..") &&
      !requestedFile.includes("//");
    if (!isSafeContentPath) {
      throw new Error("Content preview path must be a safe HTML path below public/content.");
    }
    return `../../content/${requestedFile}`;
  }

  function applyLanguage(root = document) {
    const activeLanguage = language();
    root.querySelectorAll("[data-th][data-en]").forEach((element) => {
      element.textContent = element.dataset[activeLanguage];
    });
    root
      .querySelectorAll("[data-placeholder-th][data-placeholder-en]")
      .forEach((element) => {
        element.setAttribute(
          "placeholder",
          element.dataset[`placeholder${activeLanguage === "en" ? "En" : "Th"}`],
        );
      });
    root.querySelectorAll("[data-aria-th][data-aria-en]").forEach((element) => {
      element.setAttribute(
        "aria-label",
        element.dataset[`aria${activeLanguage === "en" ? "En" : "Th"}`],
      );
    });
  }

  function hasBilingualText(element) {
    return Boolean(element?.dataset.th?.trim() && element?.dataset.en?.trim());
  }

  function inspectForbiddenMarkup(root) {
    const errors = [];
    if (root.querySelector(forbiddenSelector)) {
      errors.push("Content contains controls or executable markup owned by Activity Core.");
    }

    [root, ...root.querySelectorAll("*")].forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        if (
          /^on/i.test(attribute.name) ||
          attribute.name === "style" ||
          attribute.name === "class"
        ) {
          errors.push(`Forbidden attribute: ${attribute.name}`);
        }
        if (
          ["href", "src"].includes(attribute.name) &&
          /^\s*javascript:/i.test(attribute.value)
        ) {
          errors.push(`Unsafe URL in ${attribute.name}.`);
        }
      });
    });
    return errors;
  }

  function validateContent(root) {
    const errors = [...inspectForbiddenMarkup(root)];
    const activityId = root.dataset.activityId?.trim();
    const version = root.dataset.activityVersion;
    const title = root.querySelector("[data-activity-title]");
    const summary = root.querySelector("[data-activity-summary]");
    const summaryTitle = root.querySelector("[data-activity-summary-title]");
    const questionSection = root.querySelector("[data-activity-questions]");
    const questions = [...root.querySelectorAll("[data-question]")];

    if (!root.matches("[data-learning-activity-content]")) {
      errors.push("Missing data-learning-activity-content root.");
    }
    if (!activityId) errors.push("Missing data-activity-id.");
    if (version !== "1") errors.push("data-activity-version must be 1.");
    if (!hasBilingualText(title)) errors.push("Activity title must have Thai and English text.");
    if (!summary) errors.push("Missing activity summary.");
    if (!hasBilingualText(summaryTitle)) {
      errors.push("Summary title must have Thai and English text.");
    }
    if (!questionSection || questions.length === 0) {
      errors.push("At least one question is required.");
    }

    const questionIds = new Set();
    questions.forEach((question, index) => {
      const questionId = question.dataset.questionId?.trim();
      const questionType = question.dataset.questionType?.trim();
      const prompt = question.querySelector("[data-question-prompt]");
      const solutions = [...question.querySelectorAll("[data-question-solution]")];
      const answer = question.dataset.answer?.trim();

      if (!questionId) {
        errors.push(`Question ${index + 1} is missing data-question-id.`);
      } else if (questionIds.has(questionId)) {
        errors.push(`Duplicate question id: ${questionId}.`);
      } else {
        questionIds.add(questionId);
      }

      if (!allowedQuestionTypes.has(questionType)) {
        errors.push(`Question ${questionId || index + 1} has an unsupported type.`);
      }
      if (!hasBilingualText(prompt)) {
        errors.push(`Question ${questionId || index + 1} needs Thai and English prompts.`);
      }
      if (!answer) errors.push(`Question ${questionId || index + 1} has no answer data.`);
      if (solutions.length > 1) {
        errors.push(`Question ${questionId || index + 1} has more than one solution.`);
      }
      if (solutions[0] && !hasBilingualText(solutions[0])) {
        errors.push(`Question ${questionId || index + 1} solution needs Thai and English text.`);
      }

      if (questionType === "choice") {
        const options = [...question.querySelectorAll("[data-choice-id]")];
        const optionIds = new Set();
        if (options.length < 2) {
          errors.push(`Choice question ${questionId || index + 1} needs at least two options.`);
        }
        options.forEach((option) => {
          const optionId = option.dataset.choiceId?.trim();
          if (!optionId || optionIds.has(optionId)) {
            errors.push(`Choice question ${questionId || index + 1} has an invalid option id.`);
          }
          optionIds.add(optionId);
          if (!hasBilingualText(option)) {
            errors.push(`Choice ${optionId || "?"} needs Thai and English text.`);
          }
        });
        if (answer && !optionIds.has(answer)) {
          errors.push(`Answer for ${questionId || index + 1} does not match an option.`);
        }
      }

      if (questionType === "number") {
        const tolerance = Number(question.dataset.tolerance);
        if (!Number.isFinite(Number(answer))) {
          errors.push(`Numeric question ${questionId || index + 1} needs a numeric answer.`);
        }
        if (!Number.isFinite(tolerance) || tolerance < 0) {
          errors.push(`Numeric question ${questionId || index + 1} needs a non-negative tolerance.`);
        }
      }
    });

    return [...new Set(errors)];
  }

  function resolveContentLinks(root, contentUrl) {
    root.querySelectorAll("[src], [href]").forEach((element) => {
      ["src", "href"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value || value.startsWith("#") || /^(data:|mailto:|tel:)/i.test(value)) return;
        element.setAttribute(attribute, new URL(value, contentUrl).href);
      });
    });
  }

  function createDualText(tagName, thai, english) {
    const element = document.createElement(tagName);
    element.dataset.th = thai;
    element.dataset.en = english;
    element.textContent = localized(thai, english);
    return element;
  }

  function createPrintField(labelTh, labelEn, placeholderTh, placeholderEn) {
    const label = document.createElement("label");
    label.className = "activity-print-field";
    label.append(createDualText("span", labelTh, labelEn));

    const input = document.createElement("input");
    input.type = "text";
    input.dataset.allowSelection = "";
    input.dataset.placeholderTh = placeholderTh;
    input.dataset.placeholderEn = placeholderEn;
    input.placeholder = localized(placeholderTh, placeholderEn);
    label.append(input);
    return label;
  }

  function insertPrintMeta(root) {
    const intro = root.querySelector("[data-activity-intro]");
    if (!intro) return;

    const meta = document.createElement("section");
    meta.className = "activity-print-meta";
    meta.dataset.activityPrintMeta = "";
    meta.append(
      createPrintField("ชื่อ–นามสกุล", "Student name", "กรอกชื่อ", "Enter name"),
      createPrintField("ชั้น/ห้อง", "Class", "เช่น ม.4/1", "e.g. Grade 10/1"),
      createPrintField("เลขที่", "Number", "เลขที่", "No."),
    );

    const stamp = document.createElement("p");
    stamp.className = "activity-print-stamp";
    const stampLabel = createDualText("span", "จัดพิมพ์เมื่อ ", "Printed ");
    const stampValue = document.createElement("span");
    stampValue.dataset.printGeneratedAt = "";
    stamp.append(stampLabel, stampValue);
    intro.after(meta, stamp);
  }

  function decorateChoiceQuestion(question, questionId) {
    const list = question.querySelector("[data-question-options]");
    if (!list) return;
    list.classList.add("activity-options");

    [...list.children]
      .filter((option) => option.matches("[data-choice-id]"))
      .forEach((option) => {
        const thai = option.dataset.th;
        const english = option.dataset.en;
        const choiceId = option.dataset.choiceId;
        const label = document.createElement("label");
        label.className = "activity-choice";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = questionId;
        input.value = choiceId;
        input.dataset.questionResponse = "";
        input.dataset.ariaTh = thai;
        input.dataset.ariaEn = english;
        input.setAttribute("aria-label", localized(thai, english));

        const copy = createDualText("span", thai, english);
        label.append(input, copy);
        delete option.dataset.th;
        delete option.dataset.en;
        option.replaceChildren(label);
      });
  }

  function decorateNumberQuestion(question, questionId) {
    const response = document.createElement("label");
    response.className = "activity-number-response";

    const input = document.createElement("input");
    input.type = "text";
    input.name = questionId;
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.dataset.allowSelection = "";
    input.dataset.questionResponse = "";
    input.dataset.placeholderTh = "กรอกคำตอบตัวเลข";
    input.dataset.placeholderEn = "Enter a number";
    const prompt = question.querySelector("[data-question-prompt]");
    input.dataset.ariaTh = prompt?.dataset.th || "คำตอบตัวเลข";
    input.dataset.ariaEn = prompt?.dataset.en || "Numeric response";
    input.setAttribute("aria-label", localized(input.dataset.ariaTh, input.dataset.ariaEn));
    input.placeholder = localized("กรอกคำตอบตัวเลข", "Enter a number");

    const unit = createDualText(
      "span",
      question.dataset.unitTh || "",
      question.dataset.unitEn || "",
    );
    response.append(input, unit);
    question.append(response);
  }

  function decorateContent(root) {
    root.classList.add("activity-content");
    root.querySelector("[data-activity-intro]")?.classList.add("activity-intro");
    root.querySelector("[data-activity-kicker]")?.classList.add("activity-kicker");
    root.querySelector("[data-activity-summary]")?.classList.add("activity-summary");
    root.querySelector("[data-activity-key-points]")?.classList.add("activity-key-points");
    root.querySelector("[data-activity-questions]")?.classList.add("activity-questions");
    root
      .querySelectorAll("[data-activity-section-kicker]")
      .forEach((element) => element.classList.add("activity-section-kicker"));

    insertPrintMeta(root);

    [...root.querySelectorAll("[data-question]")].forEach((question, index) => {
      const questionId = question.dataset.questionId;
      const prompt = question.querySelector("[data-question-prompt]");
      question.classList.add("activity-question");
      question
        .querySelector("[data-question-solution]")
        ?.classList.add("activity-question-solution");

      const heading = document.createElement("div");
      heading.className = "activity-question-heading";
      const number = document.createElement("span");
      number.className = "activity-question-number";
      number.textContent = String(index + 1).padStart(2, "0");
      prompt.before(heading);
      heading.append(number, prompt);

      if (question.dataset.questionType === "choice") {
        decorateChoiceQuestion(question, questionId);
      } else if (question.dataset.questionType === "number") {
        decorateNumberQuestion(question, questionId);
      }
    });

    applyLanguage(root);
  }

  function setStatus(tone, symbol, thai, english) {
    status.className = `activity-contract-status is-${tone}`;
    status.firstElementChild.textContent = symbol;
    const copy = status.lastElementChild;
    copy.dataset.th = thai;
    copy.dataset.en = english;
    copy.textContent = localized(thai, english);
  }

  function showError(errors) {
    validationErrors = errors;
    if (loading) {
      loading.hidden = false;
      loading.classList.add("is-error");
      const message = loading.querySelector("p");
      if (message) {
        message.textContent = localized(
          `ไฟล์เนื้อหาไม่ผ่านการตรวจ: ${errors.join(" · ")}`,
          `Content validation failed: ${errors.join(" · ")}`,
        );
      }
    }
    if (status) {
      setStatus("error", "!", "ไฟล์เนื้อหาต้องแก้ไข", "Content needs attention");
    }
    printControls.forEach((control) => {
      control.disabled = true;
    });
  }

  function getResponses() {
    if (!contentRoot) return {};
    return Object.fromEntries(
      [...contentRoot.querySelectorAll("[data-question]")].map((question) => {
        const type = question.dataset.questionType;
        const response =
          type === "choice"
            ? question.querySelector("[data-question-response]:checked")?.value || ""
            : question.querySelector("[data-question-response]")?.value?.trim() || "";
        return [question.dataset.questionId, response];
      }),
    );
  }

  async function loadContent() {
    if (!shell || !mount || !loading || !status || printControls.length === 0) {
      showError(["Activity shell is incomplete."]);
      return;
    }

    if (location.protocol === "file:") {
      showError([
        localized(
          "ต้องเปิดผ่าน localhost หรือ GitHub Pages เพื่อดึงไฟล์เนื้อหา",
          "Open through localhost or GitHub Pages to load content",
        ),
      ]);
      return;
    }

    try {
      const source = resolveContentSource();
      if (!source) throw new Error("Activity shell has no content source.");
      const contentUrl = new URL(source, location.href);
      const response = await fetch(contentUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const sourceText = await response.text();
      const parsed = new DOMParser().parseFromString(sourceText, "text/html");
      const roots = parsed.querySelectorAll("[data-learning-activity-content]");
      if (roots.length !== 1) {
        showError(["Content HTML must contain exactly one activity root."]);
        return;
      }

      const imported = document.importNode(roots[0], true);
      resolveContentLinks(imported, contentUrl);
      const errors = validateContent(imported);
      if (errors.length) {
        showError(errors);
        return;
      }

      validationErrors = [];
      contentRoot = imported;
      decorateContent(contentRoot);
      mount.replaceChildren(contentRoot);
      loading.hidden = true;
      setStatus("valid", "✓", "โครงเนื้อหาผ่าน", "Content contract passed");
      const title = contentRoot.querySelector("[data-activity-title]");
      window.LearningHubPrint?.configure({
        getTitle: () => title?.textContent?.trim() || "Learning Hub Activity",
        getContent: () => contentRoot,
      });
      document.dispatchEvent(
        new CustomEvent("learning-hub-activity-ready", {
          detail: {
            activityId: contentRoot.dataset.activityId,
            questionCount: contentRoot.querySelectorAll("[data-question]").length,
          },
        }),
      );
    } catch (error) {
      showError([
        localized(
          `โหลดไฟล์เนื้อหาไม่สำเร็จ (${error.message})`,
          `Could not load content HTML (${error.message})`,
        ),
      ]);
    }
  }

  window.LearningHubActivity = Object.freeze({
    getContent: () => contentRoot,
    getResponses,
    getValidationErrors: () => [...validationErrors],
    reload: loadContent,
    validate: validateContent,
  });

  void loadContent();
})();
