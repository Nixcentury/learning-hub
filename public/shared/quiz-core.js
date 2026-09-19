import { QuizEvidenceManager } from "./quiz-evidence.js?v=drag-1";
import { createNotebookBackupUi } from "./notebook-backup-ui.js?v=6c-backup-2";
import { readQuizContent } from "./quiz-content-adapter.js";
import { hasAnswer, isCorrectAnswer, isStoredAnswer, parseNumericAnswer } from "./quiz-question-model.js";
import { mountNumericAnswer, hideMathKeyboard } from "./quiz-math-input.js";
import { mountDragAnswer } from "./quiz-drag-view.js";
import { dragAnswerSummary } from "./quiz-drag-model.js";

/* ==============================================================
   Quiz Engine กลางของ Learning Hub
   ไฟล์เนื้อหามีเฉพาะสรุป โจทย์ Hint และเฉลย ส่วนพฤติกรรมอยู่ที่นี่
================================================================ */

(function initializeLearningHubQuiz() {
  if (window.LearningHubQuiz) return;

  const shell = document.querySelector("[data-quiz-shell]");
  const app = document.querySelector("[data-quiz-app]");
  const loading = document.querySelector("[data-quiz-loading]");
  const errorBox = document.querySelector("[data-quiz-error]");
  const printSource = document.querySelector("[data-quiz-print-source]");
  const summaryDialog = document.querySelector("[data-summary-dialog]");
  const summaryContent = document.querySelector("[data-summary-content]");
  const summaryTitle = document.querySelector("[data-summary-title]");
  const printPanel = document.querySelector("[data-print-selection-panel]");
  const printToggle = document.querySelector("[data-print-selection-toggle]");
  const pendingStorageRequests = new Map();

  if (!shell || !app || !loading || !printSource) return;

  const state = {
    contentId: "",
    questions: [],
    currentIndex: 0,
    answers: {},
    giveUps: {},
    hintLevels: {},
    masteredIds: [],
    attempt: 1,
    view: "exam",
    startedAt: Date.now(),
    elapsedBeforeMs: 0,
    latestScore: null,
    savedAt: 0,
    storageStatus: "local",
    identityKey: "guest",
    evidenceSnapshot: null,
  };

  let contentRoot = null;
  let timerHandle = null;
  let localSaveHandle = null;
  let cloudSaveHandle = null;
  let evidenceManager = null;
  let submissionBusy = false;
  let contentReady = false;
  let latestHubContext = null;
  let identityEpoch = 0;
  let changeRevision = 0;
  let cloudReady = false;
  let cloudLoadPending = false;
  let writeSequence = 0;
  let localSaveFailed = false;
  let syncBase = null;
  let unsyncedChanges = false;
  let pendingRemote = null;
  let navigationRevision = 0;
  let closing = false;
  let dragAnswerUi = null;

  const notebookBackupUi = createNotebookBackupUi({
    getManager: () => evidenceManager,
    language,
    getTitle: () => contentRoot?.querySelector("[data-activity-title]")?.dataset[language()] || state.contentId,
    canOpen: () => contentReady && !submissionBusy && !closing,
    onClose: () => { if (contentReady && !closing) render(); },
  });

  function language() {
    return document.documentElement.lang === "en" ? "en" : "th";
  }

  function label(thai, english) {
    return language() === "en" ? english : thai;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resolveContentSource() {
    const params = new URLSearchParams(location.search);
    return params.get("content") || shell.dataset.contentSrc;
  }

  function currentQuestion() {
    return state.questions[state.currentIndex] || null;
  }

  function elapsedMs() {
    return state.elapsedBeforeMs + Math.max(0, Date.now() - state.startedAt);
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function questionStatus(question) {
    if (state.masteredIds.includes(question.id)) return "mastered";
    if (state.giveUps[question.id]) return "giveup";
    if (question.type === "drag-drop" && hasAnswer(state.answers[question.id]) && !dragAnswerSummary(question, state.answers[question.id]).complete) return "partial";
    if (hasAnswer(state.answers[question.id])) return "answered";
    return "empty";
  }

  function validateContent(root) {
    return readQuizContent(root);
  }

  function preparePrintSource(root) {
    root.classList.add("activity-content", "quiz-print-content");
    root.querySelector("[data-activity-intro]")?.classList.add("activity-intro");
    root.querySelector("[data-activity-summary]")?.classList.add("activity-summary");
    root.querySelector("[data-activity-questions]")?.classList.add("activity-questions");
    root.querySelectorAll("[data-question]").forEach((question, index) => {
      question.classList.add("activity-question");
      question.dataset.printIndex = String(index + 1);
      question.querySelector("[data-question-solution]")?.classList.add("activity-question-solution");
    });
  }

  function storageKey() {
    return `learning-hub-quiz:v1:${state.identityKey}:${state.contentId}`;
  }

  function snapshot({ includeLocalEvidence = false } = {}) {
    return {
      version: 2,
      identityKey: state.identityKey,
      contentId: state.contentId,
      answers: { ...state.answers },
      giveUps: { ...state.giveUps },
      hintLevels: { ...state.hintLevels },
      masteredIds: [...state.masteredIds],
      currentIndex: state.currentIndex,
      currentQuestionId: currentQuestion()?.id || null,
      attempt: state.attempt,
      view: state.view,
      elapsedMs: elapsedMs(),
      savedAt: state.savedAt,
      latestScore: state.latestScore ? { ...state.latestScore } : null,
      evidence: evidenceManager
        ? includeLocalEvidence
          ? evidenceManager.serializeLocal()
          : evidenceManager.serializeCloud()
        : state.evidenceSnapshot,
      ...(includeLocalEvidence ? { localSync: { base: syncBase, dirty: unsyncedChanges } } : {}),
    };
  }

  function validSnapshot(saved) {
    if (!saved || ![1, 2].includes(saved.version)) return false;
    // Reject malformed records before touching the current attempt. Old v1/v2
    // records without these optional identity fields remain readable.
    if (saved.identityKey && saved.identityKey !== state.identityKey) return false;
    if (saved.contentId && saved.contentId !== state.contentId) return false;
    const isMap = (value) => value == null || (typeof value === "object" && !Array.isArray(value));
    if (![saved.answers, saved.giveUps, saved.hintLevels].every(isMap)) return false;
    if (saved.masteredIds != null && !Array.isArray(saved.masteredIds)) return false;
    if (saved.evidence != null && (!isMap(saved.evidence) || !isMap(saved.evidence.entries))) return false;
    if (saved.latestScore != null && (
      !isMap(saved.latestScore) ||
      !Number.isFinite(saved.latestScore.score) ||
      !Number.isFinite(saved.latestScore.maxScore) ||
      saved.latestScore.score < 0 || saved.latestScore.maxScore < saved.latestScore.score
    )) return false;
    for (const field of ["currentIndex", "attempt", "elapsedMs", "savedAt"]) {
      if (saved[field] != null && (!Number.isFinite(Number(saved[field])) || Number(saved[field]) < 0)) return false;
    }
    for (const field of ["currentIndex", "attempt"]) {
      if (saved[field] != null && !Number.isInteger(Number(saved[field]))) return false;
    }
    const questionsById = new Map(state.questions.map((question) => [question.id, question]));
    if (Object.entries(saved.answers || {}).some(([id, answer]) => {
      const question = questionsById.get(id);
      return question && !isStoredAnswer(question, answer);
    })) return false;
    if (Object.values(saved.giveUps || {}).some((value) => typeof value !== "boolean")) return false;
    if (Object.values(saved.hintLevels || {}).some((value) => !Number.isInteger(value) || value < 0)) return false;
    return true;
  }

  function applySnapshot(saved, { localEvidence = false } = {}) {
    if (!validSnapshot(saved)) return false;
    const validIds = new Set(state.questions.map((question) => question.id));
    // Unmount before replacing evidence, so the old canvas cannot flush into
    // the freshly restored metadata when render() mounts the next question.
    evidenceManager?.unmount();
    state.answers = Object.fromEntries(
      Object.entries(saved.answers || {}).filter(([id]) => validIds.has(id)),
    );
    state.giveUps = Object.fromEntries(
      Object.entries(saved.giveUps || {}).filter(([id]) => validIds.has(id)),
    );
    state.hintLevels = Object.fromEntries(
      Object.entries(saved.hintLevels || {}).filter(([id]) => validIds.has(id)),
    );
    state.masteredIds = [...new Set(saved.masteredIds || [])].filter((id) => validIds.has(id));
    const savedQuestionIndex = state.questions.findIndex((question) => question.id === saved.currentQuestionId);
    state.currentIndex = Math.min(
      Math.max(0, savedQuestionIndex >= 0 ? savedQuestionIndex : Math.floor(Number(saved.currentIndex) || 0)),
      Math.max(0, state.questions.length - 1),
    );
    state.attempt = Math.max(1, Math.floor(Number(saved.attempt) || 1));
    state.view = saved.view === "results" ? "results" : "exam";
    state.elapsedBeforeMs = Math.max(0, Number(saved.elapsedMs) || 0);
    state.startedAt = Date.now();
    state.latestScore = saved.latestScore || null;
    state.savedAt = Math.max(0, Number(saved.savedAt) || 0);
    state.evidenceSnapshot = saved.evidence || null;
    if (localEvidence) {
      syncBase = typeof saved.localSync?.base === "string" ? saved.localSync.base : null;
      unsyncedChanges = saved.localSync?.dirty === true;
    }
    if (evidenceManager) {
      evidenceManager.restore(saved.evidence, { merge: !localEvidence });
    }
    return true;
  }

  // Navigation and elapsed time are not answers. Merely opening another
  // question must never make an empty draft overwrite a completed cloud quiz.
  function progressSignature(value) {
    const ordered = (map) => Object.entries(map || {}).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value && typeof value === "object" && !Array.isArray(value) ? ordered(value) : value]);
    return JSON.stringify({
      answers: ordered(value.answers), giveUps: ordered(value.giveUps),
      hintLevels: ordered(value.hintLevels), masteredIds: [...(value.masteredIds || [])].sort(),
      attempt: value.attempt || 1, latestScore: value.latestScore ? ordered(value.latestScore) : null,
    });
  }

  function loadLocal() {
    try {
      return applySnapshot(JSON.parse(localStorage.getItem(storageKey()) || "null"), {
        localEvidence: true,
      });
    } catch {
      return false;
    }
  }

  function saveLocalNow() {
    if (!contentReady) return false;
    try {
      localStorage.setItem(
        storageKey(),
        JSON.stringify(snapshot({ includeLocalEvidence: true })),
      );
      localSaveFailed = false;
      return true;
    } catch {
      localSaveFailed = true;
      state.storageStatus = "memory";
      renderStorageStatus();
      return false;
    }
  }

  function requestCloud(type, value) {
    if (parent === window || state.identityKey === "guest") return Promise.resolve(null);
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const targetOrigin = location.origin === "null" ? "*" : location.origin;
    const uid = state.identityKey;
    const contentId = state.contentId;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pendingStorageRequests.delete(requestId);
        resolve({ ok: false, code: "quiz-progress/timeout" });
      }, 8000);
      pendingStorageRequests.set(requestId, {
        uid, contentId,
        resolve(result) {
          clearTimeout(timeout);
          resolve(result);
        },
      });
      parent.postMessage({ type, requestId, uid, contentId, value }, targetOrigin);
    });
  }

  async function loadCloud() {
    if (!contentReady || state.identityKey === "guest" || parent === window || cloudLoadPending) return;
    const epoch = identityEpoch;
    const navigationAtStart = navigationRevision;
    cloudReady = false;
    cloudLoadPending = true;
    state.storageStatus = "syncing";
    renderStorageStatus();
    const result = await requestCloud("learning-hub-quiz-load");
    if (epoch !== identityEpoch) return;
    cloudLoadPending = false;
    if (!result?.ok) {
      state.storageStatus = localSaveFailed ? "memory" : "cloud-error";
      renderStorageStatus();
      return;
    }
    const remote = result.value;
    if (remote && !validSnapshot(remote)) {
      state.storageStatus = "cloud-error";
      renderStorageStatus();
      return;
    }
    const remoteSignature = remote ? progressSignature(remote) : null;
    const localSignature = progressSignature(snapshot());
    const localChanged = unsyncedChanges || (syncBase === null && state.savedAt > Number(remote?.savedAt || 0));
    // If both copies changed independently, keep both intact until the student
    // explicitly chooses. Timestamps alone are not proof of ownership/newness.
    if (remote && localChanged && remoteSignature !== localSignature && remoteSignature !== syncBase) {
      pendingRemote = remote;
      state.storageStatus = "conflict";
      renderStorageStatus();
      return;
    }
    pendingRemote = null;
    cloudReady = true;
    if (localChanged && remoteSignature !== localSignature) {
      syncBase = remoteSignature;
      await saveCloudNow();
      if (epoch !== identityEpoch) return;
    } else {
      if (remote) {
        const navigation = { currentIndex: state.currentIndex, view: state.view };
        applySnapshot(remote, { localEvidence: false });
        if (navigationRevision !== navigationAtStart) Object.assign(state, navigation);
      }
      syncBase = remoteSignature;
      unsyncedChanges = false;
      saveLocalNow();
      state.storageStatus = localSaveFailed ? "memory" : "cloud";
    }
    render();
  }

  async function resolveCloudConflict(choice) {
    if (!pendingRemote || closing) return;
    const epoch = identityEpoch;
    const remote = pendingRemote;
    if (choice === "cloud") {
      // Keep the local reasoning/ink. Only the attempt/score is selected here.
      if (!applySnapshot(remote, { localEvidence: false })) return;
      unsyncedChanges = false;
      syncBase = progressSignature(remote);
      cloudReady = true;
      pendingRemote = null;
      saveLocalNow();
      state.storageStatus = localSaveFailed ? "memory" : "cloud";
    } else if (choice === "local") {
      syncBase = progressSignature(remote);
      cloudReady = true;
      pendingRemote = null;
      markEdited();
      saveLocalNow();
      await saveCloudNow();
    }
    if (epoch === identityEpoch) render();
  }

  async function saveCloudNow() {
    if (!contentReady || !cloudReady || cloudLoadPending || state.identityKey === "guest") return null;
    const epoch = identityEpoch;
    const revision = changeRevision;
    const sequence = ++writeSequence;
    const value = snapshot();
    state.storageStatus = "syncing";
    renderStorageStatus();
    const result = await requestCloud("learning-hub-quiz-save", value);
    if (epoch !== identityEpoch || sequence !== writeSequence) return result;
    if (result?.ok) {
      syncBase = progressSignature(value);
      unsyncedChanges = revision !== changeRevision;
      saveLocalNow();
    }
    state.storageStatus = localSaveFailed ? "memory" : result?.ok
      ? (revision === changeRevision ? "cloud" : "syncing") : "cloud-error";
    renderStorageStatus();
    return result;
  }

  function markEdited() {
    changeRevision += 1;
    unsyncedChanges = true;
    state.savedAt = Math.max(Date.now(), state.savedAt + 1);
  }

  function persist() {
    markEdited();
    clearTimeout(localSaveHandle);
    clearTimeout(cloudSaveHandle);
    localSaveHandle = setTimeout(saveLocalNow, 120);
    if (state.identityKey !== "guest") {
      state.storageStatus = localSaveFailed ? "memory" : pendingRemote ? "conflict"
        : cloudReady || cloudLoadPending ? "syncing" : "cloud-error";
      renderStorageStatus();
      if (cloudReady) cloudSaveHandle = setTimeout(saveCloudNow, 650);
    }
  }

  function persistLocalOnly() {
    clearTimeout(localSaveHandle);
    localSaveHandle = setTimeout(saveLocalNow, 120);
  }

  function persistNavigation() {
    navigationRevision += 1;
    persistLocalOnly();
    // Once the answer snapshot is known, navigation can accompany it safely.
    if (cloudReady) {
      clearTimeout(cloudSaveHandle);
      cloudSaveHandle = setTimeout(saveCloudNow, 650);
    }
  }

  function retrySync() {
    clearTimeout(cloudSaveHandle);
    flushLocal();
    return loadCloud();
  }

  function renderStorageStatus() {
    const status = document.querySelector("[data-quiz-storage-status]");
    if (!status) return;
    const effectiveStatus = localSaveFailed ? "memory" : evidenceManager?.storageFailed ? "notebook-error" : state.storageStatus;
    const copy = {
      cloud: ["บันทึกบน Cloud แล้ว", "Saved to cloud"],
      syncing: ["กำลังบันทึก…", "Saving…"],
      local: ["บันทึกในเครื่องนี้", "Saved on this device"],
      "cloud-error": ["ยังซิงก์ Cloud ไม่สำเร็จ · เก็บในเครื่องนี้ก่อน", "Cloud sync failed · kept on this device"],
      memory: ["บันทึกในเครื่องไม่ได้ · อย่าเพิ่งปิดหน้านี้", "Device save failed · keep this page open"],
      conflict: ["งานในเครื่องกับ Cloud ต่างกัน · เลือกฉบับที่จะใช้ (แทนคำตอบและคะแนนอีกฉบับ)", "Device and cloud work differ · choose which answers and score to keep"],
      "notebook-error": ["บันทึกหรือโหลดสมุดไม่สำเร็จ · อย่าเพิ่งปิด", "Notebook save/load failed · keep this page open"],
    }[effectiveStatus];
    status.dataset.tone = effectiveStatus;
    status.textContent = label(copy[0], copy[1]);
    const action = (thai, english, handler) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-sync-action";
      button.textContent = label(thai, english);
      button.addEventListener("click", handler);
      status.append(button);
    };
    if (effectiveStatus === "notebook-error") {
      action("ลองเก็บลายมืออีกครั้ง", "Retry writing save", async () => {
        await evidenceManager.flushAll();
        renderStorageStatus();
      });
    } else if (effectiveStatus === "conflict") {
      action("ใช้ฉบับในเครื่อง", "Use device copy", () => void resolveCloudConflict("local"));
      action("ใช้ฉบับ Cloud", "Use cloud copy", () => void resolveCloudConflict("cloud"));
    } else if (effectiveStatus === "cloud-error") {
      action("ลองเชื่อมต่ออีกครั้ง", "Retry cloud sync", () => void retrySync());
    } else if (effectiveStatus === "memory") {
      action("ลองบันทึกในเครื่องอีกครั้ง", "Retry device save", () => {
        if (flushLocal()) {
          state.storageStatus = state.identityKey === "guest" ? "local" : "cloud-error";
          renderStorageStatus();
        }
      });
    }
  }

  function activeLanguageNode(source) {
    if (!source) return null;
    return (
      source.querySelector(`[data-quiz-language="${language()}"]`) ||
      source.querySelector("[data-quiz-language]") ||
      source
    );
  }

  function cloneInto(target, source, useLanguage = false) {
    target.replaceChildren();
    const selected = useLanguage ? activeLanguageNode(source) : source;
    if (selected) {
      const copy = selected.cloneNode(true);
      if (useLanguage && !copy.children.length && selected.dataset?.[language()]) copy.textContent = selected.dataset[language()];
      target.append(copy);
    }
  }

  function typeset(target = app) {
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetClear?.([target]);
      window.MathJax.typesetPromise([target]).catch(() => {});
    }
  }

  function renderNavigation() {
    const navigation = document.querySelector("[data-question-navigation]");
    if (!navigation) return;
    navigation.replaceChildren();
    state.questions.forEach((question, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(index + 1);
      button.dataset.questionJump = String(index);
      button.dataset.status = questionStatus(question);
      if (index === state.currentIndex) button.dataset.current = "true";
      button.setAttribute("aria-label", label(`ไปข้อ ${index + 1}`, `Go to question ${index + 1}`));
      button.addEventListener("click", () => goTo(index));
      navigation.append(button);
    });
  }

  function renderQuestion() {
    hideMathKeyboard();
    dragAnswerUi?.destroy(); dragAnswerUi = null;
    const question = currentQuestion();
    if (!question) return;
    const promptTarget = document.querySelector("[data-current-prompt]");
    const contextTarget = document.querySelector("[data-current-context]");
    const optionTarget = document.querySelector("[data-current-options]");
    const hintTarget = document.querySelector("[data-current-hints]");
    const solutionTarget = document.querySelector("[data-current-solution]");
    const isMastered = state.masteredIds.includes(question.id);
    const isGivenUp = Boolean(state.giveUps[question.id]);

    cloneInto(promptTarget, question.prompt, true);
    cloneInto(contextTarget, question.context);
    contextTarget.hidden = !question.context;
    optionTarget.replaceChildren();

    question.options.forEach((option, index) => {
      const optionId = option.dataset.choiceId;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.dataset.selected = String(state.answers[question.id] === optionId);
      button.disabled = isMastered || isGivenUp;
      button.setAttribute("aria-pressed", String(state.answers[question.id] === optionId));
      button.innerHTML = `<span class="quiz-option-letter">${String.fromCharCode(65 + index)}</span><span class="quiz-option-copy"></span>`;
      const optionCopy = button.querySelector(".quiz-option-copy");
      [...option.childNodes].forEach((node) => optionCopy.append(node.cloneNode(true)));
      button.addEventListener("click", () => selectAnswer(question.id, optionId));
      optionTarget.append(button);
    });

    if (question.type === "number") {
      mountNumericAnswer(optionTarget, {
        value: state.answers[question.id] ?? "", disabled: isMastered || isGivenUp,
        unit: question.unit[language()], language: language(),
        onInput(value) {
          if (state.answers[question.id] !== value) evidenceManager?.markContextChanged(question.id);
          state.answers[question.id] = value;
          persist();
          renderNavigation();
          renderStats();
        },
      });
    }

    if (question.type === "drag-drop") {
      dragAnswerUi = mountDragAnswer(optionTarget, {
        question, value: state.answers[question.id], disabled: isMastered || isGivenUp,
        language: language(), typeset, canEdit: () => !submissionBusy && !closing,
        onChange(value) {
          if (submissionBusy || closing) return;
          evidenceManager?.markContextChanged(question.id);
          state.answers[question.id] = value;
          persist(); renderNavigation(); renderStats();
        },
      });
    }

    hintTarget.replaceChildren();
    const visibleHintCount = Math.min(Number(state.hintLevels[question.id]) || 0, question.hints.length);
    question.hints.slice(0, visibleHintCount).forEach((hint, index) => {
      const item = document.createElement("article");
      item.className = "quiz-hint";
      item.innerHTML = `<strong>${label(`คำใบ้ ${index + 1}`, `Hint ${index + 1}`)}</strong>`;
      const copy = document.createElement("div");
      cloneInto(copy, hint, true);
      item.append(copy);
      hintTarget.append(item);
    });

    solutionTarget.replaceChildren();
    if (isGivenUp || isMastered || state.view === "results") {
      solutionTarget.hidden = false;
      const heading = document.createElement("strong");
      heading.textContent = label("เฉลยและวิธีคิด", "Solution and reasoning");
      const copy = document.createElement("div");
      cloneInto(copy, question.solution, true);
      solutionTarget.append(heading, copy);
    } else {
      solutionTarget.hidden = true;
    }

    document.querySelector("[data-question-position]").textContent = `Q${state.currentIndex + 1}/${state.questions.length}`;
    document.querySelector(".quiz-question-number").textContent = String(state.currentIndex + 1);
    document.querySelector("[data-hint-button]").disabled =
      isMastered || isGivenUp || visibleHintCount >= question.hints.length;
    document.querySelector("[data-hint-count]").textContent = String(visibleHintCount + 1);
    document.querySelector("[data-giveup-button]").disabled = isMastered || isGivenUp;
    document.querySelector("[data-previous-button]").disabled = state.currentIndex === 0;
    document.querySelector("[data-next-button]").disabled = state.currentIndex === state.questions.length - 1;
    document.querySelector("[data-question-lock]").hidden = !isMastered;
    typeset(document.querySelector("[data-question-card]"));
    evidenceManager?.mount(
      document.querySelector("[data-evidence-panel]"),
      question,
    );
  }

  function renderStats() {
    const answered = state.questions.filter(
      (question) => state.masteredIds.includes(question.id) || (question.type === "drag-drop"
        ? dragAnswerSummary(question, state.answers[question.id]).complete : hasAnswer(state.answers[question.id])),
    ).length;
    const hints = Object.values(state.hintLevels).reduce((sum, count) => sum + Number(count || 0), 0);
    const giveUps = Object.values(state.giveUps).filter(Boolean).length;
    document.querySelector("[data-answered-count]").textContent = String(answered);
    document.querySelector("[data-hints-count]").textContent = String(hints);
    document.querySelector("[data-giveups-count]").textContent = String(giveUps);
    const progress = document.querySelector("[data-progress-fill]");
    if (progress) progress.style.width = `${(answered / state.questions.length) * 100}%`;
  }

  function resultFor(question) {
    const answer = state.answers[question.id] ?? "";
    const mastered = state.masteredIds.includes(question.id);
    const correct = mastered || (!state.giveUps[question.id] && isCorrectAnswer(question, answer));
    const status = correct
      ? "correct"
      : state.giveUps[question.id]
        ? "giveup"
        : hasAnswer(answer)
          ? "incorrect"
          : "unanswered";
    return { question, answer, correct, status };
  }

  function renderResults() {
    hideMathKeyboard();
    dragAnswerUi?.destroy(); dragAnswerUi = null;
    evidenceManager?.unmount();
    const results = state.questions.map(resultFor);
    const score = results.filter((result) => result.correct).length;
    const percent = Math.round((score / results.length) * 100);
    const perfect = score === results.length;
    app.innerHTML = `
      <section class="quiz-results">
        <header class="quiz-results-hero ${perfect ? "is-perfect" : ""}">
          <small>${perfect ? "MASTERY COMPLETE" : "MASTERY CHECK"}</small>
          <h1>${perfect ? label("ทำครบทุกข้อแล้ว!", "All questions mastered!") : label(`ผลการทำรอบที่ ${state.attempt}`, `Attempt ${state.attempt} results`)}</h1>
          <p>${label(`ได้ ${score} จาก ${results.length} ข้อ (${percent}%)`, `${score} of ${results.length} correct (${percent}%)`)}</p>
        </header>
        <div class="quiz-result-stats">
          <article><strong>${score}/${results.length}</strong><span>${label("คะแนนล่าสุด", "Latest score")}</span></article>
          <article><strong>${formatDuration(elapsedMs())}</strong><span>${label("เวลารวม", "Total time")}</span></article>
          <article><strong>${Object.values(state.hintLevels).reduce((sum, value) => sum + Number(value || 0), 0)}</strong><span>${label("คำใบ้", "Hints")}</span></article>
          <article><strong>${results.filter((result) => !result.correct).length}</strong><span>${label("ต้องทบทวน", "To review")}</span></article>
        </div>
        <section class="quiz-result-list">
          <header>
            <div><small>${label("ตรวจรายข้อ", "Question review")}</small><h2>${label("ย้อนดูและแก้เฉพาะจุด", "Review and fix specific questions")}</h2></div>
            <span data-quiz-storage-status></span>
          </header>
          <div data-result-items></div>
        </section>
        <section class="quiz-evidence-gate" data-evidence-gate data-complete="${String(!evidenceManager?.needsExport())}">
          <div>
            <h2>${evidenceManager?.needsExport() ? label("ส่งออกหลักฐานเพื่อจบรอบ", "Export evidence to finish this attempt") : label("ส่งออกหลักฐานแล้ว", "Evidence export completed")}</h2>
            <p>${evidenceManager?.needsExport() ? label("PDF จะรวมเหตุผล สมุดทด ผลตรวจคำตอบ และตราประทับ AI ส่วนข้อที่ไม่มีวิธีทำจะถูกระบุไว้ในหน้าสรุป", "The PDF includes typed reasoning, notebook work, answer results, and AI stamps. Questions without reasoning are listed on the cover.") : label("หากกลับไปแก้คำตอบ เหตุผล หรือลายมือ ระบบจะขอให้ตรวจและส่งออกใหม่", "Editing an answer, reasoning, or notebook page will require a new check and export.")}</p>
          </div>
          <button type="button" class="quiz-export-evidence-button" data-export-evidence>${evidenceManager?.needsExport() ? label("ดาวน์โหลดหลักฐาน PDF", "Download evidence PDF") : label("ดาวน์โหลด PDF อีกครั้ง", "Download PDF again")}</button>
        </section>
        <footer class="quiz-results-actions">
          <button type="button" class="quiz-secondary-button" data-edit-results>${label("กลับไปแก้คำตอบ", "Edit answers")}</button>
          ${perfect ? `<button type="button" class="quiz-primary-button" data-restart>${label("เริ่มทำใหม่", "Start over")}</button>` : `<button type="button" class="quiz-primary-button" data-retry>${label("ทำเฉพาะข้อที่ยังไม่ผ่าน", "Retry unmastered questions")}</button>`}
        </footer>
      </section>`;

    const list = document.querySelector("[data-result-items]");
    results.forEach((result, index) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "quiz-result-item";
      item.dataset.status = result.status;
      const statusCopy = {
        correct: label("ถูก", "Correct"),
        incorrect: label("ผิด", "Incorrect"),
        giveup: label("ยอมแพ้", "Gave up"),
        unanswered: label("ยังไม่ตอบ", "Unanswered"),
      }[result.status];
      const aiStamp = evidenceManager?.statusFor(result.question.id, result.status);
      item.innerHTML = `<span class="quiz-result-number">${index + 1}</span><span class="quiz-result-copy"><span data-result-prompt></span><small class="quiz-result-ai-stamp"></small></span><strong>${statusCopy}</strong>`;
      const sourcePrompt = result.question.prompt;
      const prompt = (sourcePrompt?.dataset?.[language()] || activeLanguageNode(sourcePrompt)?.textContent)?.replace(/\s+/g, " ").trim();
      item.querySelector("[data-result-prompt]").textContent = prompt || `Q${index + 1}`;
      if (result.question.type === "drag-drop") {
        const detail = dragAnswerSummary(result.question, result.answer);
        item.querySelector("[data-result-prompt]").textContent += label(` · ถูก ${detail.correct}/${detail.total} ช่อง`, ` · ${detail.correct}/${detail.total} slots correct`);
      }
      item.querySelector(".quiz-result-ai-stamp").textContent = aiStamp
        ? language() === "en"
          ? aiStamp.en
          : aiStamp.th
        : "";
      item.addEventListener("click", () => {
        state.currentIndex = index;
        state.view = "exam";
        persistNavigation();
        render();
      });
      list.append(item);
    });

    document.querySelector("[data-edit-results]")?.addEventListener("click", () => {
      state.view = "exam";
      const firstUnmastered = state.questions.findIndex((question) => !state.masteredIds.includes(question.id));
      state.currentIndex = firstUnmastered < 0 ? 0 : firstUnmastered;
      persistNavigation();
      render();
    });
    document.querySelector("[data-retry]")?.addEventListener("click", startRetry);
    document.querySelector("[data-restart]")?.addEventListener("click", restart);
    document.querySelector("[data-export-evidence]")?.addEventListener("click", () => {
      void exportEvidence(results);
    });
    renderStorageStatus();
    typeset(app);
  }

  function renderExam() {
    dragAnswerUi?.destroy(); dragAnswerUi = null;
    evidenceManager?.unmount();
    const title = contentRoot.querySelector("[data-quiz-title]");
    const titleCopy = title?.dataset[language()] || title?.textContent?.trim() || "Quiz";
    app.innerHTML = `
      <section class="quiz-stage">
        <header class="quiz-identity-card">
          <div class="quiz-title-row">
            <div><small>${label("แบบฝึก Mastery", "Mastery practice")}</small><h1>${escapeHtml(titleCopy)}</h1></div>
            <span class="quiz-question-badge" data-question-position></span>
          </div>
          <div class="quiz-meta-row">
            <span>${state.questions.length} ${label("ข้อ", "questions")}</span>
            <span>${label("ทำทีละข้อ · ตรวจพร้อมกัน", "One at a time · Submit together")}</span>
            <span class="quiz-save-status" data-quiz-storage-status></span>
            <button type="button" class="quiz-print-menu-button" data-open-print>▣ ${label("เครื่องมือพิมพ์", "Print tools")}</button>
          </div>
          <div class="quiz-progress-track"><span data-progress-fill></span></div>
        </header>

        <details class="quiz-navigator" open>
          <summary><span>${label("เลือกหรือย้อนกลับไปยังข้อ", "Jump to any question")}</span><small>${label("สีจะแสดงสถานะของแต่ละข้อ", "Colours show question status")}</small></summary>
          <nav data-question-navigation aria-label="Questions"></nav>
        </details>

        <article class="quiz-question-card" data-question-card>
          <div class="quiz-question-heading">
            <span class="quiz-question-number">${state.currentIndex + 1}</span>
            <div data-current-prompt></div>
          </div>
          <div class="quiz-mastered-note" data-question-lock hidden>✓ ${label("ข้อนี้ผ่านแล้ว คำตอบถูกล็อกไว้", "This question is mastered and locked")}</div>
          <div class="quiz-question-context" data-current-context hidden></div>
          <div class="quiz-options" data-current-options></div>

          <div class="quiz-evidence-panel" data-evidence-panel></div>

          <div class="quiz-hints" data-current-hints></div>
          <section class="quiz-solution" data-current-solution hidden></section>
        </article>

        <footer class="quiz-action-dock">
          <div class="quiz-live-stats">
            <span>${label("ตอบแล้ว", "Answered")} <strong data-answered-count>0</strong>/${state.questions.length}</span>
            <span>${label("ยอมแพ้", "Give up")} <strong data-giveups-count>0</strong></span>
            <span>${label("คำใบ้", "Hints")} <strong data-hints-count>0</strong></span>
            <span class="quiz-stopwatch">● <strong data-elapsed-time>${formatDuration(elapsedMs())}</strong></span>
          </div>
          <div class="quiz-action-grid">
            <button type="button" class="quiz-hint-button" data-hint-button>💡 ${label("คำใบ้", "Hint")} #<span data-hint-count>1</span></button>
            <button type="button" class="quiz-giveup-button" data-giveup-button>⚑ ${label("ยอมแพ้", "Give up")}</button>
            <button type="button" class="quiz-secondary-button" data-previous-button>‹ ${label("ก่อนหน้า", "Previous")}</button>
            <button type="button" class="quiz-next-button" data-next-button>${label("ถัดไป", "Next")} ›</button>
          </div>
          <button type="button" class="quiz-submit-button" data-submit-all>${label("ตรวจคำตอบทั้งหมด", "Submit all answers")}</button>
          <div class="quiz-ai-batch-status" data-ai-batch-status hidden></div>
        </footer>
      </section>`;

    renderNavigation();
    renderQuestion();
    renderStats();
    renderStorageStatus();
    bindExamActions();
  }

  function render() {
    if (!contentRoot) return;
    if (state.view === "results") renderResults();
    else renderExam();
  }

  function selectAnswer(questionId, optionId) {
    if (state.masteredIds.includes(questionId) || state.giveUps[questionId]) return;
    if (state.answers[questionId] !== optionId) {
      evidenceManager?.markContextChanged(questionId);
    }
    state.answers[questionId] = optionId;
    persist();
    renderNavigation();
    renderQuestion();
    renderStats();
  }

  function goTo(index) {
    state.currentIndex = Math.min(Math.max(0, index), state.questions.length - 1);
    persistNavigation();
    renderNavigation();
    renderQuestion();
    app.querySelector("[data-question-card]")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function revealHint() {
    const question = currentQuestion();
    if (!question || state.giveUps[question.id]) return;
    const current = Number(state.hintLevels[question.id]) || 0;
    state.hintLevels[question.id] = Math.min(current + 1, question.hints.length);
    persist();
    renderQuestion();
    renderStats();
  }

  function giveUp() {
    const question = currentQuestion();
    if (!question || state.masteredIds.includes(question.id)) return;
    evidenceManager?.markContextChanged(question.id);
    state.giveUps[question.id] = true;
    delete state.answers[question.id];
    persist();
    renderNavigation();
    renderQuestion();
    renderStats();
  }

  function confirmMissingEvidence(questions) {
    if (!questions.length) return Promise.resolve(true);
    const dialog = document.querySelector("[data-evidence-warning-dialog]");
    if (!dialog?.showModal) {
      return Promise.resolve(
        window.confirm(
          label(
            `ข้อ ${questions.map((question) => question.index + 1).join(", ")} ยังไม่มีเหตุผลหรือกระดาษทด ต้องการตรวจต่อหรือไม่`,
            `Questions ${questions.map((question) => question.index + 1).join(", ")} have no reasoning or notebook work. Continue anyway?`,
          ),
        ),
      );
    }

    const title = dialog.querySelector("[data-evidence-warning-title]");
    const copy = dialog.querySelector("[data-evidence-warning-copy]");
    const list = dialog.querySelector("[data-evidence-warning-list]");
    const back = dialog.querySelector("[data-evidence-warning-back]");
    const proceed = dialog.querySelector("[data-evidence-warning-continue]");
    title.textContent = label(
      "บางข้อยังไม่มีเหตุผลหรือกระดาษทด",
      "Some questions have no reasoning evidence",
    );
    copy.textContent = label(
      "AI จะตรวจวิธีคิดไม่ได้ และ PDF จะประทับว่าไม่มีหลักฐานในข้อเหล่านี้ คุณสามารถกลับไปเพิ่มวิธีทำ หรือดำเนินการตรวจคำตอบสุดท้ายต่อได้",
      "AI cannot verify the method, and the PDF will mark these questions as having no reasoning. You can go back and add evidence or continue grading the final answers.",
    );
    list.textContent = questions.map((question) => `Q${question.index + 1}`).join(" · ");
    back.textContent = label("กลับไปเพิ่มวิธีทำ", "Go back and add reasoning");
    proceed.textContent = label(
      "ตรวจต่อโดยไม่มีวิธีทำ",
      "Continue without reasoning",
    );

    return new Promise((resolve) => {
      const finish = (accepted) => {
        dialog.close();
        back.removeEventListener("click", onBack);
        proceed.removeEventListener("click", onProceed);
        dialog.removeEventListener("cancel", onCancel);
        resolve(accepted);
      };
      const onBack = () => finish(false);
      const onProceed = () => finish(true);
      const onCancel = (event) => {
        event.preventDefault();
        finish(false);
      };
      back.addEventListener("click", onBack);
      proceed.addEventListener("click", onProceed);
      dialog.addEventListener("cancel", onCancel);
      dialog.showModal();
    });
  }

  async function submitAll() {
    if (submissionBusy) return;
    const invalidIndex = state.questions.findIndex(question => question.type === "number" &&
      !state.giveUps[question.id] && !state.masteredIds.includes(question.id) &&
      hasAnswer(state.answers[question.id]) && parseNumericAnswer(state.answers[question.id]) === null);
    if (invalidIndex >= 0) {
      goTo(invalidIndex);
      window.alert(label("มีคำตอบตัวเลขที่ยังไม่สมบูรณ์ กรุณาแก้รูปแบบหรือเว้นว่างก่อนส่งตรวจ", "A numeric answer is incomplete. Fix its format or leave it blank before submitting."));
      return;
    }
    const epoch = identityEpoch;
    submissionBusy = true;
    const results = state.questions.map(resultFor);
    evidenceManager?.flushCurrent();
    const missing = evidenceManager?.missingForAnswered(results) || [];
    const accepted = await confirmMissingEvidence(missing);
    if (epoch !== identityEpoch) return;
    if (!accepted) {
      submissionBusy = false;
      if (missing[0]) goTo(missing[0].index);
      return;
    }

    submissionBusy = true;
    const submitButton = document.querySelector("[data-submit-all]");
    const batchStatus = document.querySelector("[data-ai-batch-status]");
    if (submitButton) submitButton.disabled = true;
    if (batchStatus) batchStatus.hidden = false;
    evidenceManager?.noteSubmission(results);

    try {
      const reviewableQuestions = results
        .filter((result) => result.status !== "unanswered")
        .map((result) => result.question);
      await evidenceManager?.reviewPending(reviewableQuestions, ({ current, total, done }) => {
        if (epoch !== identityEpoch || !batchStatus) return;
        batchStatus.textContent = done
          ? label("ตรวจวิธีทำเสร็จแล้ว", "Reasoning review complete")
          : label(
              `AI กำลังตรวจวิธีทำ ${current}/${total}`,
              `AI is checking reasoning ${current}/${total}`,
            );
      });
    } finally {
      if (epoch === identityEpoch) submissionBusy = false;
    }

    if (epoch !== identityEpoch) return;

    state.masteredIds = [
      ...new Set([...state.masteredIds, ...results.filter((result) => result.correct).map((result) => result.question.id)]),
    ];
    const score = state.masteredIds.length;
    state.latestScore = {
      score,
      maxScore: state.questions.length,
      status: "awaiting-evidence-export",
      scoreStatus: score === state.questions.length ? "mastered" : "in-progress",
      submittedAt: Date.now(),
    };
    state.elapsedBeforeMs = elapsedMs();
    state.startedAt = Date.now();
    state.view = "results";
    markEdited();
    saveLocalNow();
    void saveCloudNow();
    render();
  }

  async function exportEvidence(results = state.questions.map(resultFor)) {
    const button = document.querySelector("[data-export-evidence]");
    if (!evidenceManager || !button) return;
    const epoch = identityEpoch;
    const title =
      contentRoot.querySelector("[data-quiz-title]")?.dataset[language()] ||
      contentRoot.querySelector("[data-activity-title]")?.dataset[language()] ||
      "Quiz";
    const original = button.textContent;
    button.disabled = true;
    try {
      const files = await evidenceManager.exportPdf({
        title,
        results,
        onProgress: ({ current, total }) => {
          if (epoch !== identityEpoch) return;
          button.textContent = label(
            `กำลังสร้าง PDF ${current}/${total}`,
            `Creating PDF ${current}/${total}`,
          );
        },
      });
      if (epoch !== identityEpoch) return;
      if (state.latestScore) {
        state.latestScore.status =
          state.latestScore.scoreStatus ||
          (state.latestScore.score === state.latestScore.maxScore
            ? "mastered"
            : "in-progress");
        state.latestScore.evidenceExportedAt = Date.now();
        state.latestScore.evidenceFileCount = files.length;
      }
      markEdited();
      saveLocalNow();
      await saveCloudNow();
      if (epoch !== identityEpoch) return;
      renderResults();
    } catch (error) {
      if (epoch !== identityEpoch) return;
      window.alert(
        label(
          `สร้าง PDF ไม่สำเร็จ: ${error.message || error}`,
          `PDF export failed: ${error.message || error}`,
        ),
      );
      button.disabled = false;
      button.textContent = original;
    }
  }

  function startRetry() {
    state.questions.forEach((question) => {
      if (state.masteredIds.includes(question.id)) return;
      evidenceManager?.markContextChanged(question.id);
      delete state.answers[question.id];
      delete state.giveUps[question.id];
      delete state.hintLevels[question.id];
    });
    const first = state.questions.findIndex((question) => !state.masteredIds.includes(question.id));
    state.currentIndex = first < 0 ? 0 : first;
    state.attempt += 1;
    state.view = "exam";
    persist();
    render();
  }

  function restart() {
    state.questions.forEach(question => evidenceManager?.markContextChanged(question.id));
    state.answers = {};
    state.giveUps = {};
    state.hintLevels = {};
    state.masteredIds = [];
    state.currentIndex = 0;
    state.attempt = 1;
    state.view = "exam";
    state.startedAt = Date.now();
    state.elapsedBeforeMs = 0;
    state.latestScore = null;
    persist();
    render();
  }

  function bindExamActions() {
    document.querySelector("[data-hint-button]")?.addEventListener("click", revealHint);
    document.querySelector("[data-giveup-button]")?.addEventListener("click", giveUp);
    document.querySelector("[data-previous-button]")?.addEventListener("click", () => goTo(state.currentIndex - 1));
    document.querySelector("[data-next-button]")?.addEventListener("click", () => goTo(state.currentIndex + 1));
    document.querySelector("[data-submit-all]")?.addEventListener("click", () => {
      void submitAll();
    });
    document.querySelector("[data-open-print]")?.addEventListener("click", () => printToggle?.click());
  }

  function openSummary() {
    if (!contentRoot || !summaryDialog) return;
    const source = contentRoot.querySelector("[data-quiz-summary-content]");
    const heading = contentRoot.querySelector("[data-activity-summary-title]");
    summaryTitle.textContent = heading?.dataset[language()] || heading?.textContent?.trim() || label("สรุป", "Review");
    cloneInto(summaryContent, source);
    if (!summaryDialog.open) summaryDialog.showModal();
    typeset(summaryContent);
  }

  function setLanguage(nextLanguage) {
    document.documentElement.lang = nextLanguage === "en" ? "en" : "th";
    document.querySelectorAll("[data-language-button]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.languageButton === language()));
    });
    document.querySelectorAll("[data-th][data-en]:not([data-question-prompt]):not([data-question-solution]):not([data-choice-id])").forEach((element) => {
      if (element.children.length === 0 || element.matches("button, span, small, strong, p")) {
        element.textContent = element.dataset[language()];
      }
    });
    render();
  }

  function initializeEvidenceManager() {
    evidenceManager?.dispose();
    const epoch = identityEpoch;
    evidenceManager = new QuizEvidenceManager({
      contentId: state.contentId,
      identityKey: state.identityKey,
      questions: state.questions,
      language,
      workerUrl: shell.dataset.aiWorkerUrl,
      onChange(detail) {
        if (epoch !== identityEpoch) return;
        if (detail?.type === "notebook-storage") {
          renderStorageStatus();
          return;
        }
        state.evidenceSnapshot = evidenceManager.serializeLocal();
        if (detail?.type === "evidence" || (submissionBusy && detail?.type === "review")) {
          persistLocalOnly();
        }
        else persist();
      },
    });
    evidenceManager.configureContextAccessors({
      getAnswer: (questionId) => state.answers[questionId] || "",
      getHintLevel: (questionId) => state.hintLevels[questionId] || 0,
      getGiveUp: (questionId) => Boolean(state.giveUps[questionId]),
    });
    evidenceManager.restore(state.evidenceSnapshot);
  }

  async function loadContent() {
    try {
      const source = resolveContentSource();
      if (!source) throw new Error("No content file was selected.");
      const response = await fetch(new URL(source, location.href));
      if (!response.ok) throw new Error(`Content request failed (${response.status}).`);
      const documentCopy = new DOMParser().parseFromString(await response.text(), "text/html");
      const root = documentCopy.querySelector("[data-learning-activity-content]");
      // Relative diagrams belong to the content file, not the player route.
      root?.querySelectorAll("img[src]").forEach(image => {
        image.src = new URL(image.getAttribute("src"), response.url || new URL(source, location.href)).href;
      });
      const validation = validateContent(root);
      if (validation.errors.length) throw new Error(validation.errors.join(" "));

      contentRoot = root;
      state.contentId = root.dataset.activityId;
      state.questions = validation.questions;
      preparePrintSource(contentRoot);
      printSource.replaceChildren(contentRoot);
      contentReady = true;
      loadLocal();
      initializeEvidenceManager();
      if (latestHubContext) applyHubContext(latestHubContext);

      window.LearningHubPrint?.configure({
        getTitle: () => contentRoot.querySelector("[data-activity-title]")?.dataset[language()],
        getContent: () => contentRoot,
      });

      loading.hidden = true;
      app.hidden = false;
      render();
      document.dispatchEvent(
        new CustomEvent("learning-hub-quiz-ready", { detail: { contentId: state.contentId, count: state.questions.length } }),
      );
      if (parent !== window) {
        parent.postMessage({ type: "learning-hub-quiz-ready" }, location.origin === "null" ? "*" : location.origin);
      }
    } catch (error) {
      loading.hidden = true;
      errorBox.hidden = false;
      errorBox.textContent = label(`เปิด Quiz ไม่สำเร็จ: ${error.message}`, `Could not open quiz: ${error.message}`);
    }
  }

  function applyHubContext(context) {
    latestHubContext = context;
    const nextIdentity = context?.identity?.uid || "guest";
    if (context?.language && context.language !== language()) setLanguage(context.language);
    if (!contentReady || nextIdentity === state.identityKey) return;
    flushLocal();
    identityEpoch += 1;
    notebookBackupUi.invalidate();
    clearTimeout(cloudSaveHandle);
    pendingStorageRequests.forEach((request) => request.resolve({ ok: false, code: "quiz-progress/session-changed" }));
    pendingStorageRequests.clear();
    cloudReady = false;
    cloudLoadPending = false;
    changeRevision = 0;
    localSaveFailed = false;
    syncBase = null;
    unsyncedChanges = false;
    pendingRemote = null;
    navigationRevision = 0;
    closing = false;
    app.inert = false;
    submissionBusy = false;
    // No automatic guest/account transfer. Every identity loads only its own
    // attempt, including when its browser/cloud record does not exist yet.
    evidenceManager?.dispose();
    evidenceManager = null;
    Object.assign(state, {
      answers: {}, giveUps: {}, hintLevels: {}, masteredIds: [],
      currentIndex: 0, attempt: 1, view: "exam", startedAt: Date.now(),
      elapsedBeforeMs: 0, latestScore: null, savedAt: 0,
      evidenceSnapshot: null, storageStatus: "local",
    });
    state.identityKey = nextIdentity;
    loadLocal();
    initializeEvidenceManager();
    if (nextIdentity !== "guest") void loadCloud();
    render();
  }

  window.addEventListener("message", (event) => {
    const trustedOrigin = location.origin === "null" || event.origin === location.origin;
    if (!trustedOrigin) return;
    if (event.source === parent && event.data?.type === "learning-hub-context") {
      applyHubContext(event.data);
      return;
    }
    if (event.source !== parent || event.data?.type !== "learning-hub-quiz-storage-result") return;
    const request = pendingStorageRequests.get(event.data.requestId);
    if (!request || event.data.uid !== request.uid || event.data.contentId !== request.contentId) return;
    pendingStorageRequests.delete(event.data.requestId);
    request.resolve(event.data);
  });

  document.addEventListener("learning-hub-context-change", (event) => {
    applyHubContext(event.detail);
  });

  document.querySelectorAll("[data-language-button]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.languageButton));
  });
  document.querySelector("[data-summary-open]")?.addEventListener("click", openSummary);
  document.querySelector("[data-notebook-backup-open]")?.addEventListener("click", () => {
    hideMathKeyboard();
    void notebookBackupUi.open();
  });
  document.querySelector("[data-print-dialog-close]")?.addEventListener("click", () => {
    printPanel.hidden = true;
    printToggle?.setAttribute("aria-expanded", "false");
  });
  printToggle?.addEventListener("click", () => {
    if (!printPanel.hidden) printPanel.querySelector("button")?.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !printPanel.hidden) {
      printPanel.hidden = true;
      printToggle?.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && contentReady) {
      flushLocal();
      void saveCloudNow();
    }
  });
  window.addEventListener("online", () => {
    if (state.identityKey !== "guest" && !closing) void retrySync();
  });
  window.addEventListener("beforeunload", (event) => {
    flushLocal();
    if (localSaveFailed || evidenceManager?.hasUnsavedNotebook() || (state.identityKey !== "guest" && unsyncedChanges) || (state.latestScore && evidenceManager?.needsExport())) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  function flushLocal() {
    clearTimeout(localSaveHandle);
    evidenceManager?.flushCurrent();
    return saveLocalNow();
  }

  async function prepareClose() {
    if (closing || notebookBackupUi.busy) return false;
    if (!contentReady) return true;
    closing = true;
    app.inert = true;
    const epoch = identityEpoch;
    try {
      const localOk = flushLocal();
      const notebookOk = evidenceManager ? await evidenceManager.flushAll() : true;
      if (epoch !== identityEpoch) return false;
      if (!localOk || !notebookOk) {
        window.alert(label("ยังบันทึกงานในเครื่องไม่สำเร็จ จึงยังไม่ปิด Quiz กรุณาลองบันทึกอีกครั้งหรือส่งออกหลักฐานก่อน", "Device saving failed. The quiz will stay open. Retry saving or export your work first."));
        return false;
      }
      if (cloudReady && unsyncedChanges) await saveCloudNow();
      if (epoch !== identityEpoch) return false;
      if (state.identityKey !== "guest" && (unsyncedChanges || pendingRemote) && !window.confirm(label(
        "งานเก็บในเครื่องนี้แล้ว แต่ยังไม่ยืนยันการซิงก์ Cloud หากปิด ให้กลับมาทำต่อบนเครื่องนี้ก่อน ต้องการปิดหรือไม่",
        "Work is saved on this device, but cloud sync is not confirmed. Resume on this device first. Close anyway?",
      ))) return false;
      if (state.latestScore && evidenceManager?.needsExport() && !window.confirm(label(
        "ยังไม่ได้ส่งออกหลักฐาน PDF ของงานล่าสุด ต้องการปิดและกลับมาส่งออกบนเครื่องนี้ภายหลังหรือไม่",
        "The latest evidence PDF has not been exported. Close and export it later on this device?",
      ))) return false;
      return true;
    } finally {
      if (epoch === identityEpoch) {
        closing = false;
        app.inert = false;
      }
    }
  }

  timerHandle = setInterval(() => {
    const timer = document.querySelector("[data-elapsed-time]");
    if (timer) timer.textContent = formatDuration(elapsedMs());
  }, 1000);

  window.LearningHubQuiz = Object.freeze({
    getState: () => ({ ...snapshot(), contentId: state.contentId }),
    goToQuestion: goTo,
    openSummary,
    restart,
    flushLocal,
    prepareClose,
    save: async () => {
      flushLocal();
      if (!cloudReady) return retrySync();
      return saveCloudNow();
    },
  });

  void loadContent();
})();
