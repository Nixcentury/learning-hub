import './print-names.js';
import { NotebookCore } from "../pages/tools/notebook-core.js";
import { validateNotebookBackup, restoreNotebookRecords } from "./notebook-backup.js";
import { requiresReasoning } from "./quiz-question-model.js?v=mixed-reasoning-20261030";
import { dragAnswerText, dragQuestionText, createDragEvidenceBody } from "./quiz-drag-view.js";

const EVIDENCE_SCHEMA = "HUB_QUIZ_EVIDENCE_V1";
const NOTEBOOK_DB = "learning-hub-quiz-evidence";
const NOTEBOOK_STORE = "notebookPages";
const AI_WORKER_FALLBACK =
  "https://student-work-ai-checker.micksattawatbutklo.workers.dev/";
const PDF_PAGE_LIMIT = 20;
const REVIEW_POLICY_VERSION = 2;

let notebookDatabasePromise = null;

function clone(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function openNotebookDatabase() {
  if (!window.indexedDB) return Promise.resolve(null);
  if (notebookDatabasePromise) return notebookDatabasePromise;

  notebookDatabasePromise = new Promise((resolve) => {
    const request = indexedDB.open(NOTEBOOK_DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(NOTEBOOK_STORE)) {
        database.createObjectStore(NOTEBOOK_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return notebookDatabasePromise;
}

async function notebookRecord(action, key, value) {
  const database = await openNotebookDatabase();
  if (!database) {
    notebookDatabasePromise = null;
    throw new Error("Notebook storage is unavailable.");
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(NOTEBOOK_STORE, action === "get" ? "readonly" : "readwrite");
      const store = transaction.objectStore(NOTEBOOK_STORE);
      let result = null;
      const request = store.get(key);
      request.onsuccess = () => {
        if (action === "get") { result = request.result || null; return; }
        // A different tab may have restored a backup since this editor loaded.
        // Refuse its stale autosave rather than silently replacing restored ink.
        if (request.result?.backupImportId && request.result.backupImportId !== value?.backupImportId) {
          transaction.abort();
          return;
        }
        const write = action === "delete" ? store.delete(key) : store.put(value, key);
        write.onerror = () => reject(new Error("Notebook storage request failed."));
        result = true;
      };
      // Request success is not transaction commit: an abort can follow it.
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(new Error("Notebook write/read did not finish."));
      request.onerror = () => reject(new Error("Notebook storage request failed."));
    } catch (error) {
      reject(error);
    }
  });
}

function safeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function activeLanguageNode(source, language) {
  if (!source) return null;
  return (
    source.querySelector?.(`[data-quiz-language="${language}"]`) ||
    source.querySelector?.("[data-quiz-language]") ||
    source
  );
}

function selectedOptionText(question, answer, language = "th") {
  if (question.type === "drag-drop") return dragAnswerText(question, answer, language);
  if (question.type === "number" && answer) {
    const scientific = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))[eE]([+-]?\d+)$/.exec(String(answer).replace(/\s/g, ""));
    const expression = scientific ? `${scientific[1]}\\times10^{${Number(scientific[2])}}` : answer;
    return `\\(${expression}\\)${question.unit?.[language] ? ` ${question.unit[language]}` : ""}`;
  }
  const option = (question.options || []).find((item) => item.dataset.choiceId === answer);
  return safeText(option?.textContent || answer || "");
}

function createVerificationId() {
  const random = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  return `AI-${String(random).replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase()}`;
}

function parseWorkerText(data) {
  if (!data) return "";
  if (typeof data === "string") return data.trim();
  const direct = [
    data.reply,
    data.message,
    data.answer,
    data.text,
    data.response,
    data.output_text,
  ].find((value) => typeof value === "string" && value.trim());
  return direct?.trim() || "";
}

function normalizeWorkerReview(data) {
  const feedback =
    data?.feedback && typeof data.feedback === "object"
      ? data.feedback
      : data && typeof data === "object"
        ? data
        : {};
  const statusText = safeText(feedback.status).toLowerCase();
  const correctTh = safeText(feedback.correct_so_far_th);
  const correctEn = safeText(feedback.correct_so_far_en);
  const noIssue = new Set(["", "none", "no issues", "no issues.", "no errors", "no errors.", "no mistakes", "n/a", "-", "ไม่มี", "ไม่มีข้อผิดพลาด", "ไม่พบข้อผิดพลาด", "ไม่มีจุดที่ต้องแก้ไข"]);
  const issue = value => noIssue.has(safeText(value).toLowerCase()) ? "" : safeText(value);
  const issueTh = issue(feedback.issue_th);
  const issueEn = issue(feedback.issue_en);
  const hintTh = safeText(feedback.hint_th);
  const hintEn = safeText(feedback.hint_en);
  const fallback = parseWorkerText(data);
  const negative =
    /incorrect|not[_ -]?correct|wrong|revise|revision|partial|incomplete|needs?[_ -]?work|error|ไม่ถูก|ไม่ผ่าน|ผิด|แก้/.test(
      statusText,
    ) || Boolean(issueTh || issueEn);
  // A compliment about one step is not an explicit verdict on the whole method.
  const positive = ["correct", "verified", "pass", "passed", "valid", "complete", "ok", "ถูกต้อง", "ผ่าน"].includes(statusText);

  return {
    status: negative ? "revision" : positive ? "verified" : "unavailable",
    rawStatus: statusText,
    confidence: Number.isFinite(Number(feedback.confidence))
      ? Number(feedback.confidence)
      : null,
    feedbackTh: [correctTh && `✓ ${correctTh}`, issueTh && `🔎 ${issueTh}`, hintTh && `💡 ${hintTh}`]
      .filter(Boolean)
      .join("\n\n") || fallback,
    feedbackEn: [correctEn && `✓ ${correctEn}`, issueEn && `🔎 ${issueEn}`, hintEn && `💡 ${hintEn}`]
      .filter(Boolean)
      .join("\n\n") || fallback,
  };
}

// Preserve line/image boundaries when the evidence continues onto another A4 page.
function evidencePageSlices(total, height, repeat, protectedRanges = []) {
  const slices = [];
  let offset = 0;
  while (offset < total) {
    const top = offset ? repeat : 0;
    let end = Math.min(total, offset + height - top);
    if (end < total) {
      let moved;
      do {
        moved = false;
        for (const [start, bottom] of protectedRanges) {
          if (start > offset + 1 && start < end && bottom > end) {
            end = Math.floor(start); moved = true;
          }
        }
      } while (moved);
    }
    if (end <= offset) throw new Error("Cannot paginate this evidence page.");
    slices.push({ offset, top, height: end - offset });
    offset = end;
  }
  return slices;
}

function drawNotebookSnapshot(snapshot, targetCanvas = document.createElement("canvas")) {
  const width = Math.max(1, Number(snapshot?.width) || 1400);
  const height = Math.max(1, Number(snapshot?.height) || 900);
  targetCanvas.width = width;
  targetCanvas.height = height;
  const context = targetCanvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#edf2f8";
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  (snapshot?.strokes || []).forEach((stroke) => {
    if (!Array.isArray(stroke.points) || !stroke.points.length) return;
    context.save();
    context.strokeStyle = stroke.color || "#111827";
    context.fillStyle = stroke.color || "#111827";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Number(stroke.width) || 3.2;
    if (stroke.points.length === 1) {
      const point = stroke.points[0];
      context.beginPath();
      context.arc(point.x, point.y, context.lineWidth / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let index = 1; index < stroke.points.length - 1; index += 1) {
        const point = stroke.points[index];
        const next = stroke.points[index + 1];
        context.quadraticCurveTo(
          point.x,
          point.y,
          (point.x + next.x) / 2,
          (point.y + next.y) / 2,
        );
      }
      const last = stroke.points[stroke.points.length - 1];
      context.lineTo(last.x, last.y);
      context.stroke();
    }
    context.restore();
  });
  return targetCanvas;
}

function wrapCanvasText(context, text, maximumWidth) {
  const paragraphs = String(text || "").split(/\r?\n/);
  const lines = [];
  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }
    const tokens = paragraph.match(/\S+\s*|\s+/g) || [paragraph];
    let line = "";
    tokens.forEach((token) => {
      const candidate = `${line}${token}`;
      if (line && context.measureText(candidate).width > maximumWidth) {
        lines.push(line.trimEnd());
        line = token.trimStart();
        while (line && context.measureText(line).width > maximumWidth) {
          let cut = 1;
          while (
            cut < line.length &&
            context.measureText(line.slice(0, cut + 1)).width <= maximumWidth
          ) {
            cut += 1;
          }
          lines.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line.trimEnd());
  });
  return lines;
}

function notebookMarkup(questionId) {
  return `
    <section class="notebook-core quiz-notebook-core" data-notebook-core>
      <div class="notebook-toolbar" role="toolbar" aria-label="Notebook tools">
        <div class="notebook-tool-group">
          <button class="notebook-tool-button is-active" type="button" data-notebook-tool="pen" aria-pressed="true" data-label-th="ปากกา" data-label-en="Pen"><span aria-hidden="true">✎</span><b data-th="ปากกา" data-en="Pen">ปากกา</b></button>
          <button class="notebook-tool-button" type="button" data-notebook-tool="eraser" aria-pressed="false" data-label-th="ยางลบ" data-label-en="Eraser"><span aria-hidden="true">◇</span><b data-th="ยางลบ" data-en="Eraser">ยางลบ</b></button>
          <button class="notebook-tool-button" type="button" data-notebook-tool="hand" aria-pressed="false" data-label-th="เลื่อนกระดาษ" data-label-en="Pan page"><span aria-hidden="true">✋</span><b data-th="เลื่อน" data-en="Pan">เลื่อน</b></button>
        </div>
        <span class="notebook-toolbar-divider" aria-hidden="true"></span>
        <div class="notebook-color-group" role="group" aria-label="Pen color">
          <small data-th="สี" data-en="Color">สี</small>
          <button class="notebook-color-button is-active" type="button" data-notebook-color="#111827" data-color-th="สีดำ" data-color-en="Black" aria-label="สีดำ" aria-pressed="true"><span class="color-black" aria-hidden="true"></span></button>
          <button class="notebook-color-button" type="button" data-notebook-color="#2563eb" data-color-th="สีน้ำเงิน" data-color-en="Blue" aria-label="สีน้ำเงิน" aria-pressed="false"><span class="color-blue" aria-hidden="true"></span></button>
          <button class="notebook-color-button" type="button" data-notebook-color="#dc3545" data-color-th="สีแดง" data-color-en="Red" aria-label="สีแดง" aria-pressed="false"><span class="color-red" aria-hidden="true"></span></button>
        </div>
        <span class="notebook-toolbar-divider" aria-hidden="true"></span>
        <button class="notebook-tool-button notebook-finger-button" type="button" data-notebook-finger aria-pressed="false" data-label-th="สลับโหมดนิ้ว" data-label-en="Toggle finger mode"><span aria-hidden="true">☝</span><b data-notebook-finger-label data-th="นิ้ว: เลื่อน" data-en="Finger: pan">นิ้ว: เลื่อน</b></button>
        <span class="notebook-toolbar-divider" aria-hidden="true"></span>
        <div class="notebook-history-group" role="group" aria-label="Writing history">
          <button class="notebook-tool-button" type="button" data-notebook-undo data-label-th="ย้อนการแก้ไขล่าสุด" data-label-en="Undo last change" aria-label="ย้อนกลับ" disabled><span aria-hidden="true">↶</span><b data-th="ย้อนกลับ" data-en="Undo">ย้อนกลับ</b></button>
          <button class="notebook-tool-button" type="button" data-notebook-redo data-label-th="ทำการแก้ไขซ้ำ" data-label-en="Redo last change" aria-label="ทำซ้ำ" disabled><span aria-hidden="true">↷</span><b data-th="ทำซ้ำ" data-en="Redo">ทำซ้ำ</b></button>
        </div>
        <div class="notebook-toolbar-spacer"></div>
        <div class="notebook-zoom-group" aria-label="Zoom controls">
          <button type="button" data-notebook-zoom-out aria-label="Zoom out">−</button>
          <output data-notebook-zoom aria-live="polite">100%</output>
          <button type="button" data-notebook-zoom-in aria-label="Zoom in">+</button>
          <button class="notebook-fit-button" type="button" data-notebook-fit data-label-th="พอดีหน้าต่าง" data-label-en="Fit to window" aria-label="พอดีหน้าต่าง"><span aria-hidden="true">⌗</span><b data-th="พอดี" data-en="Fit">พอดี</b></button>
        </div>
        <button class="notebook-clear-button" type="button" data-notebook-clear data-label-th="ล้างหน้าปัจจุบัน" data-label-en="Clear current page" aria-label="ล้างหน้า"><span aria-hidden="true">⌫</span><b data-th="ล้างหน้า" data-en="Clear">ล้างหน้า</b></button>
      </div>
      <div class="notebook-viewport" data-notebook-viewport>
        <div class="notebook-page" data-notebook-page>
          <canvas data-notebook-canvas width="1400" height="900" tabindex="0" aria-label="Working notebook for ${questionId}"></canvas>
          <div class="notebook-empty-hint" data-notebook-empty><span aria-hidden="true">✎</span><strong data-th="เขียนวิธีทำตรงนี้" data-en="Write your working here">เขียนวิธีทำตรงนี้</strong><small data-th="Apple Pencil ปากกาเมาส์หรือนิ้ว" data-en="Apple Pencil, stylus, mouse, or finger">Apple Pencil ปากกาเมาส์หรือนิ้ว</small></div>
        </div>
      </div>
      <footer class="notebook-statusbar">
        <span class="notebook-live-status" data-notebook-status><i aria-hidden="true"></i><span>พร้อมเขียน</span></span>
        <code data-notebook-page-key>${questionId} / page-001</code>
      </footer>
    </section>`;
}

export class QuizEvidenceManager {
  constructor(options) {
    this.contentId = options.contentId;
    this.identityKey = options.identityKey || "guest";
    this.questions = options.questions || [];
    this.language = options.language;
    this.onChange = options.onChange || (() => {});
    this.workerUrl = options.workerUrl || AI_WORKER_FALLBACK;
    this.state = this.emptyState();
    this.memory = new Map();
    this.current = null;
    this.loadToken = 0;
    this.saveTimers = new Map();
    this.lifecycle = 0;
    this.requests = new Set();
    this.dirtyNotebooks = new Map();
    this.notebookWrites = new Map();
    this.storageFailed = false;
    this.storageFailures = new Set();
  }

  emptyState() {
    return {
      schema: EVIDENCE_SCHEMA,
      entries: {},
      globalRevision: 0,
      submissionRevision: 0,
      lastSubmittedAt: 0,
      exportMeta: null,
    };
  }

  setIdentity(identityKey) {
    if ((identityKey || "guest") === this.identityKey) return;
    this.dispose();
    this.identityKey = identityKey || "guest";
    this.state = this.emptyState();
    this.memory.clear();
  }

  dispose() {
    this.lifecycle += 1;
    try { this.backupTransaction?.abort(); } catch { /* Already committed. */ }
    this.requests.forEach((controller) => controller.abort());
    this.requests.clear();
    this.unmount();
  }

  reset() {
    this.unmount();
    this.state = this.emptyState();
    this.memory.clear();
  }

  restore(saved, { merge = false } = {}) {
    if (!saved || saved.schema !== EVIDENCE_SCHEMA) {
      if (!merge) this.state = this.emptyState();
      return;
    }
    if (!merge) {
      this.state = {
        ...this.emptyState(),
        ...clone(saved),
        entries: clone(saved.entries || {}),
      };
      return;
    }

    Object.entries(saved.entries || {}).forEach(([questionId, incoming]) => {
      const current = this.entry(questionId);
      if (Number(incoming?.review?.checkedAt || 0) > Number(current.review?.checkedAt || 0)) {
        current.review = clone(incoming.review);
      }
    });
    if (
      Number(saved.exportMeta?.exportedAt || 0) >
      Number(this.state.exportMeta?.exportedAt || 0)
    ) {
      this.state.exportMeta = clone(saved.exportMeta);
    }
  }

  serializeLocal() {
    return clone(this.state);
  }

  serializeCloud() {
    const entries = {};
    Object.entries(this.state.entries).forEach(([questionId, entry]) => {
      if (!entry.review) return;
      entries[questionId] = {
        review: {
          status: entry.review.status,
          checkedAt: entry.review.checkedAt || 0,
          verificationId: entry.review.verificationId || "",
          evidenceRevision: entry.review.evidenceRevision || 0,
          policyVersion: entry.review.policyVersion || 0,
          contextSignature: entry.review.contextSignature || "",
        },
      };
    });
    return {
      schema: EVIDENCE_SCHEMA,
      entries,
      globalRevision: this.state.globalRevision,
      submissionRevision: this.state.submissionRevision,
      lastSubmittedAt: this.state.lastSubmittedAt,
      exportMeta: this.state.exportMeta ? { ...this.state.exportMeta } : null,
    };
  }

  entry(questionId) {
    if (!this.state.entries[questionId]) {
      this.state.entries[questionId] = {
        reasoning: "",
        revision: 0,
        notebook: { strokeCount: 0, revision: 0 },
        review: null,
      };
    }
    return this.state.entries[questionId];
  }

  notebookKey(questionId) {
    return `v1:${this.identityKey}:${this.contentId}:${questionId}`;
  }

  hasEvidence(questionId) {
    const entry = this.entry(questionId);
    return Boolean(entry.reasoning?.trim()) || Number(entry.notebook?.strokeCount || 0) > 0;
  }

  evidenceCount() {
    return this.questions.filter((question) => this.hasEvidence(question.id)).length;
  }

  missingForAnswered(results) {
    return results
      .filter((result) => result.status !== "unanswered" && result.status !== "giveup" && requiresReasoning(result.question) && !this.hasEvidence(result.question.id))
      .map((result) => result.question);
  }

  markChanged(questionId, kind) {
    const entry = this.entry(questionId);
    entry.revision += 1;
    this.state.globalRevision += 1;
    if (entry.review && entry.review.status !== "awaiting") {
      entry.review = {
        ...entry.review,
        previousStatus: entry.review.status,
        status: "recheck",
      };
    }
    this.state.exportMeta = this.state.exportMeta
      ? { ...this.state.exportMeta, stale: true }
      : null;
    this.updateCurrentUi();
    this.onChange({ type: "evidence", questionId, kind });
  }

  markContextChanged(questionId) {
    const entry = this.entry(questionId);
    if (!entry.review) return;
    entry.revision += 1;
    this.state.globalRevision += 1;
    entry.review = {
      ...entry.review,
      previousStatus: entry.review.status,
      status: "recheck",
    };
    if (this.state.exportMeta) this.state.exportMeta.stale = true;
    this.updateCurrentUi();
    this.onChange({ type: "evidence", questionId, kind: "answer-context" });
  }

  async readNotebook(questionId) {
    if (this.memory.has(questionId)) return clone(this.memory.get(questionId));
    const lifecycle = this.lifecycle;
    const saved = await notebookRecord("get", this.notebookKey(questionId));
    if (lifecycle !== this.lifecycle) return null;
    if (saved) this.memory.set(questionId, saved);
    return clone(saved);
  }

  persistNotebookSnapshot(recordKey, snapshot) {
    const strokeCount = Array.isArray(snapshot?.strokes) ? snapshot.strokes.length : 0;
    const previous = this.notebookWrites.get(recordKey) || Promise.resolve();
    const write = previous.then(async () => {
      try {
        await notebookRecord(strokeCount > 0 ? "put" : "delete", recordKey, clone(snapshot));
        if (this.dirtyNotebooks.get(recordKey) === snapshot) this.dirtyNotebooks.delete(recordKey);
        this.storageFailures.delete(recordKey);
        this.storageFailed = this.storageFailures.size > 0;
        return true;
      } catch {
        this.storageFailures.add(recordKey);
        this.storageFailed = true;
        return false;
      }
    }).finally(() => {
      if (this.notebookWrites.get(recordKey) === write) this.notebookWrites.delete(recordKey);
      this.onChange({ type: "notebook-storage" });
    });
    this.notebookWrites.set(recordKey, write);
    return write;
  }

  saveNotebookSnapshot(questionId, snapshot, { changed = false, immediate = false } = {}) {
    if (!snapshot) return;
    const restoredId = this.memory.get(questionId)?.backupImportId;
    if (restoredId) snapshot = { ...snapshot, backupImportId: restoredId };
    this.memory.set(questionId, clone(snapshot));
    const entry = this.entry(questionId);
    const strokeCount = Array.isArray(snapshot.strokes) ? snapshot.strokes.length : 0;
    entry.notebook = {
      strokeCount,
      revision: Math.max(0, Number(snapshot.revision) || 0),
    };
    if (changed) this.markChanged(questionId, "notebook");

    const recordKey = this.notebookKey(questionId);
    const savedSnapshot = clone(snapshot);
    this.dirtyNotebooks.set(recordKey, savedSnapshot);
    clearTimeout(this.saveTimers.get(recordKey));
    this.saveTimers.delete(recordKey);
    if (immediate) {
      void this.persistNotebookSnapshot(recordKey, savedSnapshot);
      return;
    }
    const timer = setTimeout(() => {
      this.saveTimers.delete(recordKey);
      void this.persistNotebookSnapshot(recordKey, savedSnapshot);
    }, changed ? 500 : 0);
    this.saveTimers.set(recordKey, timer);
  }

  flushCurrent() {
    if (!this.current?.notebook || !this.current.questionId || this.current.notebookReady === false) return;
    this.saveNotebookSnapshot(
      this.current.questionId,
      this.current.notebook.exportSnapshot(),
      { immediate: true },
    );
  }

  async flushAll() {
    this.flushCurrent();
    this.saveTimers.forEach((timer) => clearTimeout(timer));
    this.saveTimers.clear();
    await Promise.all([...this.dirtyNotebooks].map(([key, snapshot]) => this.persistNotebookSnapshot(key, snapshot)));
    return this.dirtyNotebooks.size === 0;
  }

  async listNotebookBackups() {
    const lifecycle = this.lifecycle;
    await this.flushAll();
    const pages = [];
    for (const question of this.questions) {
      const snapshot = await this.readNotebook(question.id);
      if (lifecycle !== this.lifecycle) throw new Error("backup-session");
      if (snapshot?.strokes?.length) pages.push({ questionId: question.id, snapshot });
    }
    return pages;
  }

  async prepareNotebookImport(backup) {
    const lifecycle = this.lifecycle;
    const clean = validateNotebookBackup(backup, { contentId: this.contentId, questionIds: this.questions.map((q) => q.id) });
    this.unmount();
    if (!await this.flushAll()) throw new Error("backup-storage");
    const expected = new Map();
    const conflicts = [];
    for (const page of clean.pages) {
      const key = this.notebookKey(page.questionId);
      const current = await notebookRecord("get", key);
      if (lifecycle !== this.lifecycle) throw new Error("backup-session");
      expected.set(key, JSON.stringify(current));
      if (current?.strokes?.length) conflicts.push(page.questionId);
    }
    return { backup: clean, expected, conflicts, lifecycle, revision: this.state.globalRevision };
  }

  async importNotebookBackup(plan, { overwrite = false } = {}) {
    if (plan.lifecycle !== this.lifecycle || plan.revision !== this.state.globalRevision) throw new Error("backup-session");
    if (plan.conflicts.length && !overwrite) throw new Error("backup-overwrite");
    const clean = validateNotebookBackup(plan.backup, { contentId: this.contentId, questionIds: this.questions.map((q) => q.id) });
    const database = await openNotebookDatabase();
    if (!database) throw new Error("backup-storage");
    const restored = clean.pages.map((page) => ({ ...page, snapshot: {
      ...page.snapshot, backupImportId: crypto.randomUUID(),
      revision: (Number(this.entry(page.questionId).notebook?.revision) || 0) + 1,
    } }));
    try {
      await restoreNotebookRecords(database, restored.map((page) => [this.notebookKey(page.questionId), page.snapshot]), plan.expected, {
        isCurrent: () => plan.lifecycle === this.lifecycle && plan.revision === this.state.globalRevision,
        onTransaction: (transaction) => { this.backupTransaction = transaction; },
      });
    } finally { this.backupTransaction = null; }
    if (plan.lifecycle !== this.lifecycle) throw new Error("backup-session");
    for (const page of restored) {
      this.memory.set(page.questionId, clone(page.snapshot));
      const entry = this.entry(page.questionId);
      entry.notebook = { strokeCount: page.snapshot.strokes.length, revision: page.snapshot.revision };
      // Restored handwriting is new evidence; never carry a passed AI stamp.
      entry.review = entry.review ? { ...entry.review, status: "recheck" } : null;
      this.markChanged(page.questionId, "notebook-import");
    }
    this.updateCurrentUi();
    return restored.length;
  }

  hasUnsavedNotebook() {
    return this.dirtyNotebooks.size > 0 || this.notebookWrites.size > 0;
  }

  unmount() {
    this.loadToken += 1;
    this.flushCurrent();
    this.current?.notebook?.destroy?.();
    this.current = null;
  }

  mount(container, question) {
    if (!container || !question) return;
    this.unmount();
    container.hidden = !requiresReasoning(question);
    if (container.hidden) { container.replaceChildren(); return; }
    const entry = this.entry(question.id);
    container.innerHTML = `
      <section class="quiz-reasoning-card">
        <header class="quiz-evidence-heading">
          <div>
            <strong>${this.language() === "en" ? "Your working · AI review" : "พื้นที่วิธีทำ · ให้ AI ตรวจ"}</strong>
            <small>${this.language() === "en" ? "Explain with text or handwriting. You do not need to use every tool." : "ใช้ข้อความหรือสมุดทดอธิบายวิธีคิด ไม่จำเป็นต้องใช้ครบทุกเครื่องมือ"}</small>
          </div>
          <span class="quiz-evidence-badge" data-evidence-badge></span>
        </header>
        <label class="quiz-reasoning-field">
          <span>${this.language() === "en" ? "Explain your reasoning" : "อธิบายเหตุผลหรือวิธีคิด"}</span>
          <textarea data-reasoning-input rows="4" maxlength="6000" placeholder="${this.language() === "en" ? "Write the important steps or explain why you chose this answer…" : "เขียนขั้นสำคัญ หรืออธิบายว่าทำไมจึงเลือกคำตอบนี้…"}"></textarea>
          <small><span data-reasoning-count>0</span>/6000</small>
        </label>
        <details class="quiz-notebook-panel" data-notebook-panel>
          <summary>
            <span><b>✎ ${this.language() === "en" ? "Working notebook" : "สมุดทด"}</b><small>${this.language() === "en" ? "Writing is kept on this device and separated by question." : "ลายมือเก็บในเครื่องนี้และแยกตามข้อ"}</small></span>
            <span data-notebook-evidence-status></span>
          </summary>
          <div data-notebook-mount><p class="quiz-notebook-loading">${this.language() === "en" ? "Open the notebook to start writing." : "เปิดสมุดเพื่อเริ่มเขียน"}</p></div>
        </details>
        <div class="quiz-evidence-milestone" data-evidence-milestone hidden></div>
        <div class="quiz-ai-review-card" data-ai-review-card>
          <div class="quiz-ai-review-main">
            <span class="quiz-ai-status" data-ai-status></span>
            <p data-ai-feedback></p>
          </div>
          <button type="button" class="quiz-ai-check-button" data-ai-check>${this.language() === "en" ? "Check this reasoning" : "ให้ AI ตรวจวิธีทำข้อนี้"}</button>
        </div>
      </section>`;

    const textarea = container.querySelector("[data-reasoning-input]");
    textarea.value = entry.reasoning || "";
    const updateReasoningCount = () => {
      container.querySelector("[data-reasoning-count]").textContent = String(textarea.value.length);
    };
    updateReasoningCount();
    textarea.addEventListener("input", () => {
      if (entry.reasoning === textarea.value) return;
      entry.reasoning = textarea.value;
      updateReasoningCount();
      this.markChanged(question.id, "reasoning");
    });

    const panel = container.querySelector("[data-notebook-panel]");
    panel.addEventListener("toggle", () => {
      if (panel.open) void this.mountNotebook(container, question);
    });
    container.querySelector("[data-ai-check]").addEventListener("click", () => {
      void this.checkQuestion(question, { notifyMissing: true });
    });
    this.current = { container, questionId: question.id, notebook: null };
    this.updateCurrentUi();
  }

  async mountNotebook(container, question) {
    if (this.current?.questionId !== question.id || this.current.notebook) return;
    const token = ++this.loadToken;
    const mount = container.querySelector("[data-notebook-mount]");
    mount.innerHTML = notebookMarkup(question.id);
    const root = mount.querySelector("[data-notebook-core]");
    const context = {
      contentId: this.contentId,
      itemId: question.id,
      pageId: "page-001",
      toolKind: "notebook",
    };
    const notebook = new NotebookCore(root, { context });
    this.current.notebook = notebook;
    this.current.notebookReady = false;
    root.inert = true;
    let saved;
    try {
      saved = await this.readNotebook(question.id);
    } catch {
      if (token !== this.loadToken || this.current?.questionId !== question.id) return;
      notebook.destroy();
      this.current.notebook = null;
      this.storageFailures.add(this.notebookKey(question.id));
      this.storageFailed = true;
      mount.innerHTML = `<p>${this.language() === "en" ? "Could not load saved writing. No blank page was saved over it." : "โหลดลายมือเดิมไม่สำเร็จ ระบบยังไม่บันทึกหน้าว่างทับงานเดิม"}</p><button type="button">${this.language() === "en" ? "Retry notebook" : "ลองเปิดสมุดอีกครั้ง"}</button>`;
      mount.querySelector("button").addEventListener("click", () => void this.mountNotebook(container, question));
      this.onChange({ type: "notebook-storage" });
      return;
    }
    if (token !== this.loadToken || this.current?.questionId !== question.id) {
      notebook.destroy();
      return;
    }
    notebook.loadSnapshot(saved || { context, strokes: [] });
    this.current.notebookReady = true;
    this.storageFailures.delete(this.notebookKey(question.id));
    this.storageFailed = this.storageFailures.size > 0;
    root.inert = false;
    notebook.setContext(context);
    root.addEventListener("notebook-core-change", () => {
      this.saveNotebookSnapshot(question.id, notebook.exportSnapshot(), { changed: true });
    });
    requestAnimationFrame(() => notebook.fitToViewport());
    this.updateCurrentUi();
  }

  updateCurrentUi() {
    const current = this.current;
    if (!current?.container) return;
    const entry = this.entry(current.questionId);
    const hasReasoning = Boolean(entry.reasoning?.trim());
    const hasInk = Number(entry.notebook?.strokeCount || 0) > 0;
    const badge = current.container.querySelector("[data-evidence-badge]");
    const notebookStatus = current.container.querySelector("[data-notebook-evidence-status]");
    const status = current.container.querySelector("[data-ai-status]");
    const feedback = current.container.querySelector("[data-ai-feedback]");
    const checkButton = current.container.querySelector("[data-ai-check]");
    const milestone = current.container.querySelector("[data-evidence-milestone]");

    badge.dataset.tone = hasReasoning || hasInk ? "ready" : "missing";
    badge.textContent =
      hasReasoning || hasInk
        ? this.language() === "en"
          ? "Evidence ready"
          : "มีหลักฐานแล้ว"
        : this.language() === "en"
          ? "No reasoning yet"
          : "ยังไม่มีเหตุผล/กระดาษทด";
    notebookStatus.textContent = hasInk
      ? this.language() === "en"
        ? `${entry.notebook.strokeCount} strokes`
        : `${entry.notebook.strokeCount} เส้น`
      : this.language() === "en"
        ? "No writing"
        : "ยังไม่มีลายมือ";

    const review = this.effectiveReview(current.questionId);
    const statusCopy = {
      awaiting: ["AI กำลังตรวจ…", "AI is checking…"],
      verified: ["AI ยืนยันวิธีคิดแล้ว", "Reasoning verified by AI"],
      revision: ["AI แนะนำให้แก้วิธีคิด", "Reasoning needs revision"],
      unavailable: ["AI ยังตรวจไม่ได้", "AI unavailable"],
      "no-reasoning": ["ไม่มีวิธีคิดให้ตรวจ", "No reasoning to review"],
      recheck: ["แก้ไขแล้ว ต้องตรวจใหม่", "Edited — recheck required"],
    }[review?.status] || ["รอ AI ตรวจ", "Awaiting AI check"];
    status.dataset.status = review?.status || "idle";
    status.textContent = this.language() === "en" ? statusCopy[1] : statusCopy[0];
    feedback.textContent =
      (this.language() === "en" ? review?.feedbackEn : review?.feedbackTh) ||
      review?.error ||
      (this.language() === "en"
        ? "AI checks the method independently; the Quiz Engine still grades the final answer."
        : "AI ตรวจวิธีคิดแยกจากกัน ส่วนคำตอบสุดท้าย Quiz Engine เป็นผู้ตรวจ");
    checkButton.disabled = review?.status === "awaiting";
    checkButton.textContent =
      review?.status === "awaiting"
        ? this.language() === "en"
          ? "Checking…"
          : "กำลังตรวจ…"
        : review
          ? this.language() === "en"
            ? "Check again"
            : "ตรวจอีกครั้ง"
          : this.language() === "en"
            ? "Check this reasoning"
            : "ให้ AI ตรวจวิธีทำข้อนี้";

    const count = this.evidenceCount();
    milestone.hidden = count < 20 || !this.needsExport();
    if (!milestone.hidden) {
      milestone.textContent =
        this.language() === "en"
          ? `You now have working evidence for ${count} questions. Export a PDF checkpoint soon.`
          : `ตอนนี้มีหลักฐานวิธีทำแล้ว ${count} ข้อ ควรส่งออก PDF เก็บเป็นจุดพักงาน`;
    }
  }

  async evidenceSnapshot(questionId) {
    if (this.current?.questionId === questionId && this.current.notebook) {
      this.flushCurrent();
    }
    return this.readNotebook(questionId);
  }

  questionContent(question) {
    const prompt = document.createElement("section");
    prompt.className = "quiz-evidence-export-prompt";
    const promptCopy = activeLanguageNode(question.prompt, this.language())?.cloneNode(true);
    if (promptCopy && !promptCopy.children.length && question.prompt?.dataset?.[this.language()]) promptCopy.textContent = question.prompt.dataset[this.language()];
    if (promptCopy) prompt.append(promptCopy);
    if (question.context) {
      const context = activeLanguageNode(question.context, this.language())?.cloneNode(true);
      if (context) prompt.append(context);
    }
    if (question.type === "choice") {
      const options = document.createElement("ol");
      options.type = "A";
      (question.options || []).forEach(option => {
        const item = document.createElement("li");
        const copy = activeLanguageNode(option, this.language())?.cloneNode(true);
        if (copy) {
          if (!copy.children.length && option.dataset?.[this.language()]) copy.textContent = option.dataset[this.language()];
          item.append(...copy.childNodes);
        }
        options.append(item);
      });
      prompt.append(options);
    }
    prompt.querySelectorAll("[data-th][data-en]").forEach(node => {
      if (!node.children.length) node.textContent = node.dataset[this.language()];
    });
    if (question.type === "drag-drop") {
      prompt.append(createDragEvidenceBody(question, this.getAnswer?.(question.id), this.language()));
    }
    return prompt;
  }

  async questionDiagramImage(question) {
    const sources = [question.prompt, question.context, ...(question.options || [])];
    if (!sources.some(node => node?.querySelector?.("img,svg"))) return null;
    if (!window.html2canvas) throw new Error("Question-image tools are still loading. Please try again.");
    const copy = this.questionContent(question);
    Object.assign(copy.style, { position: "absolute", left: "-100000px", top: "0", width: "1120px", background: "white", color: "#172554", padding: "24px", font: '20px/1.6 Tahoma, Arial, sans-serif' });
    document.body.append(copy);
    try {
      if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise([copy]);
      await Promise.all([...copy.querySelectorAll("img")].map(image => new Promise((resolve, reject) => {
        const fail = () => reject(new Error("A question image could not be loaded; AI review was not sent."));
        if (image.complete) { if (image.naturalWidth) resolve(); else fail(); return; }
        const timer = setTimeout(fail, 15000);
        image.onload = () => { clearTimeout(timer); if (image.naturalWidth) resolve(); else fail(); };
        image.onerror = () => { clearTimeout(timer); fail(); };
      })));
      return await window.html2canvas(copy, { scale: 1, backgroundColor: "#ffffff", useCORS: true, logging: false });
    } finally {
      window.MathJax?.typesetClear?.([copy]); copy.remove();
    }
  }

  async evidenceImage(question) {
    const entry = this.entry(question.id);
    const snapshot = await this.evidenceSnapshot(question.id);
    const diagram = await this.questionDiagramImage(question);
    const reason = entry.reasoning?.trim() || "";
    const canvas = document.createElement("canvas");
    const width = 1400;
    const context = canvas.getContext("2d");
    context.font = '28px "Noto Sans Thai", Tahoma, Arial, sans-serif';
    const reasonLines = wrapCanvasText(context, reason || "(No typed reasoning)", width - 112);
    const reasonHeight = Math.max(180, 130 + reasonLines.length * 42);
    const hasInk = Array.isArray(snapshot?.strokes) && snapshot.strokes.length > 0;
    canvas.width = width;
    canvas.height = reasonHeight + (hasInk ? 900 : 0);
    const draw = canvas.getContext("2d", { alpha: false });
    draw.fillStyle = "#ffffff";
    draw.fillRect(0, 0, canvas.width, canvas.height);
    draw.fillStyle = "#172554";
    draw.font = '700 32px "Noto Sans Thai", Tahoma, Arial, sans-serif';
    draw.fillText(`Q${question.index + 1} · Student reasoning`, 56, 58);
    draw.fillStyle = "#334155";
    draw.font = '26px "Noto Sans Thai", Tahoma, Arial, sans-serif';
    reasonLines.forEach((line, index) => draw.fillText(line, 56, 112 + index * 42));
    if (hasInk) {
      const notebookCanvas = drawNotebookSnapshot(snapshot);
      draw.drawImage(notebookCanvas, 0, reasonHeight, width, 900);
    }
    if (diagram) {
      const questionHeight = Math.ceil(diagram.height * width / diagram.width);
      const combined = document.createElement("canvas");
      combined.width = width; combined.height = questionHeight + canvas.height;
      const output = combined.getContext("2d", { alpha: false });
      output.fillStyle = "#ffffff"; output.fillRect(0, 0, combined.width, combined.height);
      output.drawImage(diagram, 0, 0, width, questionHeight);
      output.drawImage(canvas, 0, questionHeight);
      return combined.toDataURL("image/jpeg", 0.9).replace(/^data:image\/jpeg;base64,/, "");
    }
    return canvas.toDataURL("image/jpeg", 0.9).replace(/^data:image\/jpeg;base64,/, "");
  }

  questionPayload(question) {
    const answer = this.getAnswer?.(question.id) || "";
    const optionLines = (question.options || [])
      .map((option) => `${option.dataset.choiceId}: ${safeText(option.textContent)}`)
      .join("\n");
    const prompt = safeText(question.prompt?.dataset?.[this.language()] || activeLanguageNode(question.prompt, this.language())?.textContent);
    const selected = selectedOptionText(question, answer, this.language());
    const drag = question.type === "drag-drop";
    const referenceSolution = safeText(question.solution?.textContent);
    const policy =
      "Review the submitted reasoning, not only the final answer. For a calculation, check the formula, substitution, algebra/arithmetic and units; accept valid alternative methods. For a conceptual choice, check the stated explanation. A correct option or number alone is not sufficient. Return feedback.status = correct only when the visible method supports the answer; use needs_revision for errors or incomplete work and unavailable if the evidence is unreadable or insufficient to judge. Include specific feedback in correct_so_far_th/en and issue_th/en. Do not change the deterministic answer score. Before Give Up, do not disclose the final correct option or exact answer.";
    return {
      mode: "image_check",
      question: `${prompt}\n${drag ? dragQuestionText(question, this.language()) : question.type === "number" ? "Numeric response" : `Choices:\n${optionLines}`}\nStudent answer: ${drag ? selected : answer}${!drag && selected ? ` — ${selected}` : ""}`,
      expectedAnswer: question.answer,
      questionType: question.type || "choice",
      context: safeText(activeLanguageNode(question.context, this.language())?.textContent),
      referenceSolution: drag ? `${referenceSolution}\n${dragAnswerText(question, Object.fromEntries(question.slots.map(slot => [slot.id, slot.answer])), this.language())}` : referenceSolution,
      selectedAnswer: drag ? selected : answer,
      hintLevel: Number(this.getHintLevel?.(question.id) || 0),
      giveUp: Boolean(this.getGiveUp?.(question.id)),
      studentReasoning: this.entry(question.id).reasoning || "",
      tutorPolicy: policy,
      systemInstruction: policy,
    };
  }

  configureContextAccessors(accessors = {}) {
    this.getAnswer = accessors.getAnswer;
    this.getHintLevel = accessors.getHintLevel;
    this.getGiveUp = accessors.getGiveUp;
  }

  async checkQuestion(question, { notifyMissing = false } = {}) {
    if (!requiresReasoning(question)) return { ok: true, notRequired: true };
    const lifecycle = this.lifecycle;
    this.flushCurrent();
    const entry = this.entry(question.id);
    if (!this.hasEvidence(question.id)) {
      entry.review = {
        status: "no-reasoning",
        checkedAt: Date.now(),
        evidenceRevision: entry.revision,
      };
      this.updateCurrentUi();
      this.onChange({ type: "review", questionId: question.id });
      if (notifyMissing) {
        window.alert(
          this.language() === "en"
            ? "There is no typed reasoning or notebook writing for AI to review."
            : "ข้อนี้ยังไม่มีเหตุผลหรือกระดาษทด จึงยังไม่มีวิธีทำให้ AI ตรวจ",
        );
      }
      return { ok: false, noEvidence: true };
    }

    if (this.state.exportMeta) this.state.exportMeta.stale = true;
    const sentRevision = entry.revision;
    const sentSignature = this.contextSignature(question.id);
    const payload = this.questionPayload(question);
    entry.review = {
      status: "awaiting",
      checkedAt: 0,
      evidenceRevision: sentRevision,
    };
    this.updateCurrentUi();
    this.onChange({ type: "review", questionId: question.id });

    const controller = new AbortController();
    this.requests.add(controller);
    let requestTimer;
    try {
      const imageBase64 = await this.evidenceImage(question);
      if (lifecycle !== this.lifecycle) return { cancelled: true };
      requestTimer = setTimeout(() => controller.abort(), 45000);
      const response = await fetch(this.workerUrl, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          imageBase64,
        }),
      });
      const data = await response.json().catch(() => null);
      if (lifecycle !== this.lifecycle) return { cancelled: true };
      if (!response.ok) {
        const requestError = new Error(
          data?.error || data?.detail || `HTTP ${response.status}`,
        );
        requestError.status = response.status;
        throw requestError;
      }
      const normalized = normalizeWorkerReview(data);
      entry.review =
        entry.revision === sentRevision
          ? {
              ...normalized,
              policyVersion: REVIEW_POLICY_VERSION,
              contextSignature: sentSignature,
              checkedAt: Date.now(),
              evidenceRevision: sentRevision,
              verificationId: createVerificationId(),
            }
          : {
              ...normalized,
              policyVersion: REVIEW_POLICY_VERSION,
              contextSignature: sentSignature,
              previousStatus: normalized.status,
              status: "recheck",
              checkedAt: Date.now(),
              evidenceRevision: sentRevision,
              verificationId: createVerificationId(),
            };
      this.updateCurrentUi();
      this.onChange({ type: "review", questionId: question.id });
      return { ok: true, review: entry.review };
    } catch (error) {
      if (lifecycle !== this.lifecycle) return { cancelled: true };
      const message = safeText(error?.message || error || "AI review failed");
      entry.review = {
        status: "unavailable",
        checkedAt: Date.now(),
        evidenceRevision: sentRevision,
        verificationId: createVerificationId(),
        error:
          this.language() === "en"
            ? `AI could not verify this reasoning: ${message}`
            : `AI ยังยืนยันวิธีคิดนี้ไม่ได้: ${message}`,
      };
      this.updateCurrentUi();
      this.onChange({ type: "review", questionId: question.id });
      return {
        ok: false,
        unavailable: true,
        rateLimited:
          Number(error?.status) === 429 || /limit|quota|too many/i.test(message),
      };
    } finally {
      clearTimeout(requestTimer);
      this.requests.delete(controller);
    }
  }

  needsReview(questionId) {
    const question = this.questions.find(question => question.id === questionId);
    if (!requiresReasoning(question) || !this.hasEvidence(questionId)) return false;
    const entry = this.entry(questionId);
    return (
      !entry.review ||
      (entry.review.status === "verified" && (entry.review.policyVersion !== REVIEW_POLICY_VERSION || entry.review.contextSignature !== this.contextSignature(questionId))) ||
      entry.review.status === "awaiting" ||
      entry.review.status === "recheck" ||
      entry.review.status === "unavailable" ||
      Number(entry.review.evidenceRevision ?? -1) !== Number(entry.revision)
    );
  }

  async reviewPending(questions, onProgress = () => {}) {
    const lifecycle = this.lifecycle;
    const pending = questions.filter((question) => requiresReasoning(question) && this.needsReview(question.id));
    for (let index = 0; index < pending.length; index += 1) {
      const question = pending[index];
      onProgress({ current: index + 1, total: pending.length, question });
      const result = await this.checkQuestion(question);
      if (result.cancelled || lifecycle !== this.lifecycle) return;
      if (result.rateLimited) {
        pending.slice(index + 1).forEach((remaining) => {
          const entry = this.entry(remaining.id);
          entry.review = {
            status: "unavailable",
            checkedAt: Date.now(),
            evidenceRevision: entry.revision,
            verificationId: createVerificationId(),
            error:
              this.language() === "en"
                ? "AI limit reached. The final answer can still be graded, but the reasoning is not verified."
                : "AI ถึงขีดจำกัดแล้ว ระบบยังตรวจคำตอบสุดท้ายได้ แต่วิธีคิดยังไม่ได้รับการยืนยัน",
          };
        });
        this.onChange({ type: "review-batch-limited" });
        break;
      }
    }
    onProgress({ current: pending.length, total: pending.length, done: true });
  }

  reviewFailed(questions, error) {
    for (const question of questions) {
      if (!requiresReasoning(question) || !this.hasEvidence(question.id) || !this.needsReview(question.id)) continue;
      const entry = this.entry(question.id);
      entry.review = { status: "unavailable", checkedAt: Date.now(), evidenceRevision: entry.revision,
        error: this.language() === "en" ? "AI review could not finish; answer scoring is unchanged." : "AI ตรวจไม่สำเร็จ คะแนนคำตอบยังตรวจตามปกติ" };
    }
    this.onChange({ type: "review-failed" });
  }

  noteSubmission(results) {
    this.flushCurrent();
    this.state.submissionRevision += 1;
    this.state.lastSubmittedAt = Date.now();
    this.missingForAnswered(results).forEach((question) => {
      const entry = this.entry(question.id);
      entry.review = {
        status: "no-reasoning",
        checkedAt: Date.now(),
        evidenceRevision: entry.revision,
      };
    });
    if (this.state.exportMeta) this.state.exportMeta.stale = true;
    this.onChange({ type: "submission" });
  }

  needsExport() {
    if (!this.state.submissionRevision) return false;
    const exported = this.state.exportMeta;
    return (
      !exported ||
      exported.stale === true ||
      Number(exported.submissionRevision) !== Number(this.state.submissionRevision) ||
      Number(exported.evidenceRevision) !== Number(this.state.globalRevision)
    );
  }

  contextSignature(questionId) {
    const question = this.questions.find(question => question.id === questionId) || {};
    const entry = this.entry(questionId);
    const content = node => {
      if (!node?.cloneNode) return JSON.stringify(node?.dataset || {});
      const copy = node.cloneNode(true);
      for (const leaf of [copy, ...copy.querySelectorAll("*")]) {
        leaf.removeAttribute("hidden"); leaf.removeAttribute("aria-hidden");
        if (!leaf.children.length && leaf.dataset?.th != null && leaf.dataset?.en != null) {
          leaf.textContent = JSON.stringify([leaf.dataset.th, leaf.dataset.en]);
        }
      }
      return copy.outerHTML;
    };
    const text = JSON.stringify([question.type || "choice", question.answer, content(question.prompt),
      content(question.context), (question.options || []).map(option => [option.dataset?.choiceId, content(option)]),
      content(question.solution), this.getAnswer?.(questionId) || "", Boolean(this.getGiveUp?.(questionId)),
      Number(this.getHintLevel?.(questionId) || 0), entry.reasoning, entry.notebook]);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(16);
  }

  effectiveReview(questionId) {
    const entry = this.entry(questionId);
    const review = entry.review;
    if (review && review.status !== "awaiting" &&
        (Number(review.evidenceRevision) !== entry.revision ||
         (review.status === "verified" && (review.policyVersion !== REVIEW_POLICY_VERSION || review.contextSignature !== this.contextSignature(questionId))))) {
      return { ...review, status: "recheck" };
    }
    return review;
  }

  statusFor(questionId, objectiveStatus) {
    const question = this.questions.find(question => question.id === questionId);
    if (!requiresReasoning(question)) return { kind: "answer-only", symbol: "—", th: "ตรวจคำตอบอัตโนมัติ · ไม่ต้องตรวจวิธีทำด้วย AI", en: "AUTOMATIC ANSWER CHECK · AI REVIEW NOT REQUIRED" };
    const entry = this.entry(questionId);
    const reviewStatus = this.hasEvidence(questionId)
      ? this.effectiveReview(questionId)?.status || "awaiting"
      : "no-reasoning";
    const correct = objectiveStatus === "correct";
    const configs = {
      "no-reasoning": {
        kind: "no-reasoning",
        symbol: "—",
        th: "AI ยังไม่ได้ตรวจ · ไม่มีเหตุผลหรือวิธีทำ",
        en: "AI NOT CHECKED · NO WORKING PROVIDED",
      },
      awaiting: {
        kind: "awaiting",
        symbol: "…",
        th: "AI ยังไม่ได้ตรวจ · รอการตรวจ",
        en: "AWAITING AI CHECK",
      },
      recheck: {
        kind: "recheck",
        symbol: "↻",
        th: "แก้ไขแล้ว · ต้องให้ AI ตรวจใหม่",
        en: "RECHECK REQUIRED",
      },
      unavailable: {
        kind: "unavailable",
        symbol: "!",
        th: correct ? "คำตอบถูก · AI ยังไม่ยืนยันวิธีคิด" : "AI ยังตรวจวิธีคิดไม่ได้",
        en: correct ? "ANSWER CORRECT · AI NOT VERIFIED" : "AI UNAVAILABLE",
      },
      revision: {
        kind: "revision",
        symbol: "△",
        th: correct ? "AI ตรวจแล้ว · วิธีคิดควรแก้ (คำตอบถูก)" : "AI ตรวจแล้ว · คำตอบผิด มีคำแนะนำ",
        en: correct
          ? "ANSWER CORRECT · REASONING NEEDS REVISION"
          : "ANSWER WRONG · AI FEEDBACK",
      },
      verified: {
        kind: correct ? "verified" : "revision",
        symbol: correct ? "✓" : "△",
        th: correct ? "AI ตรวจแล้ว · คำตอบถูกและวิธีทำผ่าน" : "AI ตรวจแล้ว · คำตอบผิด มีคำแนะนำ",
        en: correct ? "ANSWER CORRECT · AI VERIFIED" : "ANSWER WRONG · AI FEEDBACK",
      },
    };
    return configs[reviewStatus] || configs.awaiting;
  }

  async snapshotImageUrl(questionId) {
    const snapshot = await this.evidenceSnapshot(questionId);
    if (!snapshot?.strokes?.length) return "";
    return drawNotebookSnapshot(snapshot).toDataURL("image/jpeg", 0.88);
  }

  async buildCoverPage({ title, results, part, partCount }) {
    const page = document.createElement("section");
    page.className = "quiz-evidence-export-page is-cover";
    const answered = results.filter((result) => result.status !== "unanswered");
    const missing = this.missingForAnswered(results);
    const verified = results.filter(
      (result) => requiresReasoning(result.question) && result.status === "correct" && this.effectiveReview(result.question.id)?.status === "verified",
    );
    const heading = document.createElement("div");
    heading.className = "quiz-evidence-export-cover-heading";
    heading.innerHTML = `<small>LEARNING HUB · REASONING EVIDENCE</small><h1></h1><p></p>`;
    heading.querySelector("h1").textContent = title;
    heading.querySelector("p").textContent =
      partCount > 1
        ? `${this.language() === "en" ? "PDF part" : "ไฟล์ส่วนที่"} ${part}/${partCount}`
        : this.language() === "en"
          ? "Quiz evidence report"
          : "รายงานหลักฐานการทำ Quiz";
    const score = document.createElement("p");
    const correctAnswers = results.filter(result => result.status === "correct").length;
    score.textContent = this.language() === "en" ? `Answer score: ${correctAnswers}/${results.length} · independent of AI review` : `คะแนนคำตอบ ${correctAnswers}/${results.length} · แยกจากผลตรวจ AI`;
    heading.append(score);
    const stats = document.createElement("div");
    stats.className = "quiz-evidence-export-stats";
    [
      [answered.length, this.language() === "en" ? "Answered" : "ตอบแล้ว"],
      [this.evidenceCount(), this.language() === "en" ? "With evidence" : "มีวิธีทำ"],
      [verified.length, this.language() === "en" ? "AI verified" : "AI ยืนยันแล้ว"],
      [missing.length, this.language() === "en" ? "No reasoning" : "ไม่มีเหตุผล/กระดาษทด"],
    ].forEach(([value, copy]) => {
      const card = document.createElement("article");
      card.innerHTML = `<strong>${value}</strong><span></span>`;
      card.querySelector("span").textContent = copy;
      stats.append(card);
    });
    const note = document.createElement("div");
    note.className = `quiz-evidence-export-cover-note ${missing.length ? "has-warning" : "is-complete"}`;
    const missingNumbers = missing.map((question) => `Q${question.index + 1}`);
    note.innerHTML = `<strong></strong><p></p>`;
    note.querySelector("strong").textContent = missing.length
      ? this.language() === "en"
        ? "NO REASONING PROVIDED"
        : "พบข้อที่ไม่มีเหตุผลหรือกระดาษทด"
      : this.language() === "en"
        ? "EVIDENCE READY"
        : "มีหลักฐานพร้อมส่งออก";
    note.querySelector("p").textContent = missing.length
      ? `${missingNumbers.slice(0, 60).join(", ")}${missingNumbers.length > 60 ? ` +${missingNumbers.length - 60}` : ""}`
      : this.language() === "en"
        ? "Answered choice/numeric questions include working. Drag-fill questions do not require AI review."
        : "ข้อกาและตัวเลขที่ตอบมีเหตุผลหรือวิธีทำ ส่วนลากวางไม่ต้องตรวจด้วย AI";
    const meta = document.createElement("footer");
    meta.textContent = `${new Date().toLocaleString(this.language() === "en" ? "en-GB" : "th-TH")} · ${this.contentId}`;
    page.append(heading, stats, note, meta);
    return page;
  }

  async buildQuestionPage({ title, result }) {
    const question = result.question;
    const entry = this.entry(question.id);
    const stamp = this.statusFor(question.id, result.status);
    const page = document.createElement("section");
    page.className = "quiz-evidence-export-page";
    if (question.type === "drag-drop") page.classList.add("is-drag-evidence");
    const header = document.createElement("header");
    header.innerHTML = `<div><small>LEARNING HUB · ${this.contentId}</small><h1></h1></div><span>Q${question.index + 1}</span>`;
    header.querySelector("h1").textContent = title;
    const stampBox = document.createElement("section");
    stampBox.className = `quiz-evidence-export-stamp is-${stamp.kind}`;
    stampBox.innerHTML = `<b>${stamp.symbol}</b><div><strong></strong><span></span></div>`;
    stampBox.querySelector("strong").textContent =
      this.language() === "en" ? stamp.en : stamp.th;
    stampBox.querySelector("span").textContent = [
      requiresReasoning(question) ? entry.review?.verificationId : "",
      requiresReasoning(question) && entry.review?.checkedAt
        ? new Date(entry.review.checkedAt).toLocaleString(
            this.language() === "en" ? "en-GB" : "th-TH",
          )
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const prompt = document.createElement("section");
    prompt.className = "quiz-evidence-export-prompt";
    prompt.innerHTML = `<small>${this.language() === "en" ? "QUESTION" : "โจทย์"}</small>`;
    prompt.append(...this.questionContent(question).childNodes);
    const answer = document.createElement("p");
    answer.className = "quiz-evidence-export-answer";
    answer.textContent = `${this.language() === "en" ? "Selected answer" : "คำตอบที่เลือก"}: ${selectedOptionText(question, this.getAnswer?.(question.id), this.language()) || "—"}`;
    const objective = document.createElement("p");
    const resultText = { correct: ["ถูก", "Correct"], incorrect: ["ผิด", "Incorrect"], giveup: ["ยอมแพ้", "Gave up"], unanswered: ["ยังไม่ตอบ", "Unanswered"] }[result.status] || ["ยังไม่ตอบ", "Unanswered"];
    objective.textContent = this.language() === "en" ? `Answer result: ${resultText[1]}` : `ผลตรวจคำตอบ: ${resultText[0]}`;
    const reason = document.createElement("section");
    reason.className = "quiz-evidence-export-reason";
    reason.innerHTML = `<small>${this.language() === "en" ? "TYPED REASONING" : "เหตุผลที่พิมพ์"}</small><p></p>`;
    reason.querySelector("p").textContent =
      entry.reasoning?.trim() ||
      (this.language() === "en" ? "No typed reasoning provided." : "ไม่ได้พิมพ์เหตุผล");
    const notebookUrl = Number(entry.notebook?.strokeCount || 0) > 0 ? await this.snapshotImageUrl(question.id) : "";
    const notebook = document.createElement("section");
    notebook.className = "quiz-evidence-export-notebook";
    notebook.innerHTML = `<small>${this.language() === "en" ? "WORKING NOTEBOOK" : "สมุดทด"}</small>`;
    if (notebookUrl) {
      notebook.classList.add("has-ink");
      const image = document.createElement("img");
      image.src = notebookUrl;
      image.alt = `Notebook Q${question.index + 1}`;
      notebook.append(image);
    } else {
      const empty = document.createElement("p");
      empty.textContent = this.language() === "en" ? "No notebook writing." : "ไม่มีลายมือในสมุดทด";
      notebook.append(empty);
    }
    const feedback = document.createElement("section");
    feedback.className = "quiz-evidence-export-feedback";
    feedback.innerHTML = `<small>${this.language() === "en" ? "AI FEEDBACK" : "คำแนะนำจาก AI"}</small><p></p>`;
    feedback.querySelector("p").textContent =
      (this.language() === "en" ? entry.review?.feedbackEn : entry.review?.feedbackTh) ||
      entry.review?.error ||
      (this.language() === "en" ? "Reasoning was not verified." : "วิธีคิดยังไม่ได้รับการยืนยัน");
    page.append(header, stampBox, prompt, answer, objective);
    if (requiresReasoning(question) || this.hasEvidence(question.id)) page.append(reason, notebook);
    if (requiresReasoning(question)) page.append(feedback);
    return page;
  }

  async renderPdfPage(page, pdf, addPage) {
    const host = document.querySelector("[data-evidence-export-host]") || document.body;
    host.replaceChildren(page);
    try {
      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise([page]).catch(() => {});
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const pageRect = page.getBoundingClientRect();
      const headerTitle = page.querySelector(":scope > header > div");
      const headerRect = headerTitle?.getBoundingClientRect();
      const headerShot = headerTitle
        ? await window.html2canvas(headerTitle, {
            scale: 1.1,
            backgroundColor: null,
            useCORS: true,
            logging: false,
          })
        : null;
      const shot = await window.html2canvas(page, {
        scale: 1.1,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      if (headerShot && headerRect) {
        const scale = shot.width / pageRect.width;
        const x = (headerRect.left - pageRect.left) * scale;
        const y = (headerRect.top - pageRect.top) * scale;
        const context = shot.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(x, y, headerShot.width, headerShot.height);
        context.drawImage(headerShot, x, y);
      }
      if (!page.classList.contains("is-cover")) {
        // Every question type can continue; preserve the entire working and question.
        // Continue at the same scale and repeat the question header + AI stamp.
        const height = Math.round(shot.width * 297 / 210);
        const stampRect = page.querySelector(".quiz-evidence-export-stamp")?.getBoundingClientRect();
        const repeat = Math.min(Math.round(height / 3), Math.round(((stampRect?.bottom || pageRect.top) - pageRect.top + 12) * shot.width / pageRect.width));
        const scale = shot.width / pageRect.width;
        const protectedRanges = [];
        const protect = rect => protectedRanges.push([(rect.top - pageRect.top) * scale, (rect.bottom - pageRect.top) * scale]);
        page.querySelectorAll("img,svg").forEach(node => protect(node.getBoundingClientRect()));
        const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
        for (let node; (node = walker.nextNode());) {
          if (!node.textContent.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          [...range.getClientRects()].forEach(protect);
        }
        const slices = evidencePageSlices(shot.height, height, repeat, protectedRanges);
        for (const { offset, top, height: slice } of slices) {
          const continued = offset > 0;
          const sheet = document.createElement("canvas");
          sheet.width = shot.width; sheet.height = height;
          const context = sheet.getContext("2d");
          context.fillStyle = "#ffffff"; context.fillRect(0, 0, sheet.width, height);
          if (continued && repeat) context.drawImage(shot, 0, 0, shot.width, repeat, 0, 0, shot.width, repeat);
          context.drawImage(shot, 0, offset, shot.width, slice, 0, top, shot.width, slice);
          if (addPage || continued) pdf.addPage("a4", "portrait");
          pdf.addImage(sheet.toDataURL("image/jpeg", 0.86), "JPEG", 0, 0, 210, 297, undefined, "FAST");
        }
        return;
      }
      const data = shot.toDataURL("image/jpeg", 0.86);
      if (addPage) pdf.addPage("a4", "portrait");
      pdf.addImage(data, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    } finally {
      host.replaceChildren();
    }
  }

  async exportPdf({ title, filename, results, onProgress = () => {} }) {
    const lifecycle = this.lifecycle;
    const checkSession = () => {
      if (lifecycle !== this.lifecycle) throw new Error("Quiz session changed.");
    };
    this.flushCurrent();
    if (!window.html2canvas || !window.jspdf?.jsPDF) {
      throw new Error(
        this.language() === "en"
          ? "PDF tools are still loading. Please try again."
          : "เครื่องมือ PDF ยังโหลดไม่เสร็จ กรุณาลองอีกครั้ง",
      );
    }
    const evidenceResults = results.filter((result) => result.status !== "unanswered" || this.hasEvidence(result.question.id));
    const groups = [];
    if (!evidenceResults.length) groups.push([]);
    for (let index = 0; index < evidenceResults.length; index += PDF_PAGE_LIMIT) {
      groups.push(evidenceResults.slice(index, index + PDF_PAGE_LIMIT));
    }
    const fileNames = [];
    let completedPages = 0;
    const totalPages = groups.reduce((sum, group) => sum + group.length + 1, 0);
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      const pdf = new window.jspdf.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const cover = await this.buildCoverPage({
        title,
        results,
        part: groupIndex + 1,
        partCount: groups.length,
      });
      checkSession();
      await this.renderPdfPage(cover, pdf, false);
      checkSession();
      completedPages += 1;
      onProgress({ current: completedPages, total: totalPages });
      for (const result of group) {
        const page = await this.buildQuestionPage({ title, result });
        checkSession();
        await this.renderPdfPage(page, pdf, true);
        checkSession();
        completedPages += 1;
        onProgress({ current: completedPages, total: totalPages });
      }
      const suffix = groups.length > 1 ? `-part-${groupIndex + 1}-of-${groups.length}` : '';
      const stem = filename || globalThis.LearningHubPrintNames.buildPrintFilename({ work: title, mode: 'evidence', language: this.language() });
      const fileName = `${stem}${suffix}.pdf`;
      pdf.save(fileName);
      fileNames.push(fileName);
    }
    this.state.exportMeta = {
      exportedAt: Date.now(),
      evidenceRevision: this.state.globalRevision,
      submissionRevision: this.state.submissionRevision,
      exportedQuestionCount: evidenceResults.length,
      fileCount: fileNames.length,
      stale: false,
    };
    this.updateCurrentUi();
    this.onChange({ type: "export", fileNames });
    return fileNames;
  }
}
