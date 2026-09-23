/* ==============================================================
   ระบบหน้าต่างงานกลางของ Learning Hub
   - รายวิชาส่งเพียง toolId ที่อนุญาตไว้ด้านล่าง
   - หน้าต่างยังอยู่เมื่อเปลี่ยนแท็บวิชา
   - รองรับเปิดหลายงาน ย่อ เรียกกลับ ขยาย และปิด
================================================================ */

import {
  createContentContext,
  createHubContextMessage,
} from "./content-context.js";
import { createContentTool } from "./content-tool.js";
import { htmlLinkEntry } from "./html-link.js";

// Only live Quiz windows created by this workspace may use its storage bridge.
const quizStorageFrames = new Set();

export function isWorkspaceQuizSource(source) {
  if (!source) return false;
  return [...quizStorageFrames].some(
    (frame) => frame.isConnected && frame.contentWindow === source,
  );
}

const toolTypes = {
  quiz: {
    icon: "✓",
    page: "pages/tools/quiz-player.html?content=../../content/templates/quiz-template.html",
    titleTh: "Quiz Template",
    titleEn: "Quiz Template",
    accent: "blue",
  },
  activity: {
    icon: "✎",
    page: "pages/tools/activity-preview.html",
    titleTh: "กิจกรรม",
    titleEn: "Activity",
    accent: "blue",
  },
  simulation: {
    icon: "◉",
    page: "pages/tools/simulation-preview.html",
    titleTh: "ห้องทดลองตัวอย่าง",
    titleEn: "Simulation workspace",
    accent: "mint",
  },
  notebook: {
    icon: "▱",
    page: "pages/tools/notebook-preview.html",
    titleTh: "สมุดเขียนกลาง",
    titleEn: "Notebook Core",
    accent: "violet",
  },
};

const subjects = {
  physics: { titleTh: "ฟิสิกส์", titleEn: "Physics", chapterCount: 20 },
  chemistry: { titleTh: "เคมี", titleEn: "Chemistry", chapterCount: 14 },
  biology: { titleTh: "ชีววิทยา", titleEn: "Biology", chapterCount: 25 },
  "lower-science": {
    titleTh: "วิทยาศาสตร์ ม.ต้น",
    titleEn: "Lower Secondary Science",
  },
  "science-ep": { titleTh: "วิทยาศาสตร์ EP", titleEn: "Science EP" },
  "math-ep": { titleTh: "คณิตศาสตร์ EP", titleEn: "Mathematics EP" },
  "upper-math": {
    titleTh: "คณิตศาสตร์ ม.ปลาย",
    titleEn: "Upper Secondary Mathematics",
  },
  test: { titleTh: "ทดสอบ", titleEn: "Test" },
};

function buildToolCatalog() {
  const catalog = {};

  Object.entries(subjects).forEach(([subjectId, subject]) => {
    for (let chapter = 1; chapter <= (subject.chapterCount || 4); chapter += 1) {
      Object.entries(toolTypes).forEach(([typeId, type]) => {
        const id = `${subjectId}-c${chapter}-${typeId}`;
        catalog[id] = {
          ...type,
          id,
          context: createContentContext({
            subjectId,
            chapterId: chapter,
            toolKind: typeId,
            contentId: id,
          }),
          titleTh: `${type.titleTh} · ${subject.titleTh} · บทที่ ${chapter}`,
          titleEn: `${type.titleEn} · ${subject.titleEn} · Chapter ${chapter}`,
        };
      });
    }
  });

  return catalog;
}

const toolCatalog = buildToolCatalog();
// A separate content ID keeps numeric QA work apart from the original MCQ demo.
Object.assign(toolCatalog["test-c2-quiz"], {
  page: "pages/tools/quiz-player.html?content=../../content/samples/numeric-input-demo.html",
  titleTh: "เติมคำตอบและแป้นคณิต", titleEn: "Numeric answers and math keyboard",
});
Object.assign(toolCatalog["test-c3-quiz"], {
  page: "pages/tools/quiz-player.html?content=../../content/samples/drag-drop-demo.html",
  titleTh: "ลากเติมและจับคู่", titleEn: "Drag-fill and matching",
});

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const twoDigits = (value) => String(value).padStart(2, "0");
  return hours > 0
    ? `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`
    : `${twoDigits(minutes)}:${twoDigits(seconds)}`;
}

const clockFormatters = {
  th: {
    date: new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    time: new Intl.DateTimeFormat("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  },
  en: {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }),
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  },
};

function updateText(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

export function createWorkspace({
  windowLayer,
  taskbar,
  taskbarItems,
  countElement,
  getLanguage,
  getIdentity,
  getRole,
  onToolClosed = () => {},
}) {
  const records = new Map();
  let highestZIndex = 30;
  let cascadeIndex = 0;

  function language() {
    return getLanguage() === "en" ? "en" : "th";
  }

  function label(thai, english) {
    return language() === "th" ? thai : english;
  }

  function renderWindowTime(record, now = Date.now()) {
    const activeLanguage = language();
    const clockTick = Math.floor(now / 1000);
    if (
      record.clockTick !== clockTick ||
      record.clockLanguage !== activeLanguage
    ) {
      const formatters = clockFormatters[activeLanguage];
      updateText(record.clockDate, formatters.date.format(now));
      updateText(record.clockTime, formatters.time.format(now));
      record.clockTick = clockTick;
      record.clockLanguage = activeLanguage;
    }

    const elapsed = record.stopwatch.running
      ? record.stopwatch.elapsed + now - record.stopwatch.startedAt
      : record.stopwatch.elapsed;
    updateText(record.stopwatchOutput, formatElapsedTime(elapsed));
    record.stopwatchButton.classList.toggle(
      "is-running",
      record.stopwatch.running,
    );
    updateText(record.stopwatchIcon, record.stopwatch.running ? "Ⅱ" : "▶");

    let timerRemaining = record.timer.running
      ? record.timer.remaining - (now - record.timer.startedAt)
      : record.timer.remaining;
    if (record.timer.running && timerRemaining <= 0) {
      timerRemaining = 0;
      record.timer.remaining = 0;
      record.timer.startedAt = null;
      record.timer.running = false;
      record.timer.finished = true;
      updateRecordText(record);
    }
    updateText(record.timerOutput, formatElapsedTime(timerRemaining));
    record.timerButton.classList.toggle("is-running", record.timer.running);
    record.timerButton.classList.toggle("is-finished", record.timer.finished);
    updateText(
      record.timerIcon,
      record.timer.running ? "Ⅱ" : record.timer.finished ? "↺" : "▶",
    );
  }

  function toggleStopwatch(record) {
    const now = Date.now();
    if (record.stopwatch.running) {
      record.stopwatch.elapsed += now - record.stopwatch.startedAt;
      record.stopwatch.startedAt = null;
      record.stopwatch.running = false;
    } else {
      record.stopwatch.startedAt = now;
      record.stopwatch.running = true;
    }
    updateRecordText(record);
    renderWindowTime(record, now);
  }

  function resetStopwatch(record) {
    record.stopwatch.elapsed = 0;
    record.stopwatch.startedAt = null;
    record.stopwatch.running = false;
    updateRecordText(record);
    renderWindowTime(record);
  }

  function toggleTimer(record) {
    const now = Date.now();
    if (record.timer.running) {
      record.timer.remaining = Math.max(
        0,
        record.timer.remaining - (now - record.timer.startedAt),
      );
      record.timer.startedAt = null;
      record.timer.running = false;
    } else {
      if (record.timer.remaining <= 0) {
        record.timer.remaining = record.timer.duration;
      }
      record.timer.startedAt = now;
      record.timer.running = true;
      record.timer.finished = false;
    }
    updateRecordText(record);
    renderWindowTime(record, now);
  }

  function adjustTimer(record, minuteDelta) {
    if (record.timer.running) return;
    const nextDuration = clamp(
      record.timer.remaining + minuteDelta * 60_000,
      60_000,
      60 * 60_000,
    );
    record.timer.duration = nextDuration;
    record.timer.remaining = nextDuration;
    record.timer.finished = false;
    updateRecordText(record);
    renderWindowTime(record);
  }

  function resetTimer(record) {
    record.timer.remaining = record.timer.duration;
    record.timer.startedAt = null;
    record.timer.running = false;
    record.timer.finished = false;
    updateRecordText(record);
    renderWindowTime(record);
  }

  function setTaskbarVisibility() {
    countElement.textContent = String(records.size);
    taskbar.hidden = records.size === 0;
  }

  function syncMaximizedState() {
    const hasMaximizedWindow = [...records.values()].some(
      (record) =>
        !record.minimized && record.element.classList.contains("is-maximized"),
    );
    document.body.classList.toggle(
      "has-maximized-workspace",
      hasMaximizedWindow,
    );
  }

  function updateRecordText(record) {
    const title = language() === "th" ? record.tool.titleTh : record.tool.titleEn;
    const isMaximized = record.element.classList.contains("is-maximized");

    record.title.textContent = title;
    record.frame.title = title;
    record.taskTitle.textContent = title;
    record.closeButton.setAttribute("aria-label", label("ปิดงาน", "Close tool"));
    record.closeButton.title = label("ปิด", "Close");
    record.minimizeButton.setAttribute("aria-label", label("ย่อเก็บในแถบล่าง", "Minimize to taskbar"));
    record.minimizeButton.title = label("ย่อ", "Minimize");
    record.maximizeButton.setAttribute(
      "aria-label",
      isMaximized ? label("คืนขนาดหน้าต่าง", "Restore window size") : label("ขยายหน้าต่าง", "Maximize window"),
    );
    record.maximizeButton.title = isMaximized
      ? label("คืนขนาด", "Restore")
      : label("ขยาย", "Maximize");
    record.maximizeButton.querySelector("span").textContent = isMaximized
      ? "↙"
      : "↗";
    record.clock.setAttribute(
      "aria-label",
      label("วันที่และเวลาปัจจุบัน", "Current date and time"),
    );
    record.stopwatchButton.setAttribute(
      "aria-label",
      record.stopwatch.running
        ? label("พักนาฬิกาจับเวลา", "Pause stopwatch")
        : label("เริ่มนาฬิกาจับเวลา", "Start stopwatch"),
    );
    record.stopwatchButton.title = record.stopwatch.running
      ? label("พักจับเวลา", "Pause stopwatch")
      : label("เริ่มจับเวลา", "Start stopwatch");
    record.stopwatchReset.setAttribute(
      "aria-label",
      label("รีเซ็ตนาฬิกาจับเวลา", "Reset stopwatch"),
    );
    record.stopwatchReset.title = label("รีเซ็ตจับเวลา", "Reset stopwatch");
    record.timerButton.setAttribute(
      "aria-label",
      record.timer.running
        ? label("พักตัวจับเวลา", "Pause timer")
        : record.timer.finished
          ? label("เริ่มตัวจับเวลาใหม่", "Restart timer")
          : label("เริ่มตัวจับเวลา", "Start timer"),
    );
    record.timerButton.title = record.timer.running
      ? label("พักนับถอยหลัง", "Pause timer")
      : label("เริ่มนับถอยหลัง", "Start timer");
    record.timerDecrease.setAttribute(
      "aria-label",
      label("ลดตัวจับเวลาหนึ่งนาที", "Decrease timer by one minute"),
    );
    record.timerDecrease.title = label("ลด 1 นาที", "Decrease 1 minute");
    record.timerIncrease.setAttribute(
      "aria-label",
      label("เพิ่มตัวจับเวลาหนึ่งนาที", "Increase timer by one minute"),
    );
    record.timerIncrease.title = label("เพิ่ม 1 นาที", "Increase 1 minute");
    record.timerReset.setAttribute(
      "aria-label",
      label("รีเซ็ตตัวจับเวลา", "Reset timer"),
    );
    record.timerReset.title = label("รีเซ็ตตัวจับเวลา", "Reset timer");
    record.timerDecrease.disabled = record.timer.running;
    record.timerIncrease.disabled = record.timer.running;
    record.taskButton.setAttribute(
      "aria-label",
      record.minimized
        ? label(`เรียก ${title} กลับ`, `Restore ${title}`)
        : label(`ย่อหรือเรียก ${title}`, `Minimize or focus ${title}`),
    );
  }

  function postContext(record) {
    // Read-only HTML does not need the learner's identity or privileged bridges.
    if (record.tool.context.toolKind === "html") return;
    const targetOrigin = location.origin === "null" ? "*" : location.origin;
    record.frame.contentWindow?.postMessage(
      createHubContextMessage({
        language: language(),
        role: getRole(),
        identity: getIdentity(),
        content: record.tool.context,
      }),
      targetOrigin,
    );
  }

  function focus(record) {
    if (!record || record.minimized) return;
    highestZIndex += 1;
    record.element.style.zIndex = String(highestZIndex);
    records.forEach((candidate) => {
      const isActive = candidate === record;
      candidate.element.classList.toggle("is-active", isActive);
      candidate.taskButton.classList.toggle("is-active", isActive);
      candidate.taskButton.setAttribute("aria-pressed", String(isActive));
    });
  }

  function positionNewWindow(record) {
    const layerBounds = windowLayer.getBoundingClientRect();
    const windowBounds = record.element.getBoundingClientRect();
    const offset = (cascadeIndex % 5) * 24;
    cascadeIndex += 1;

    record.element.style.left = `${clamp(
      (layerBounds.width - windowBounds.width) / 2 + offset - 48,
      8,
      layerBounds.width - windowBounds.width - 8,
    )}px`;
    record.element.style.top = `${clamp(
      20 + offset,
      8,
      layerBounds.height - windowBounds.height - 8,
    )}px`;
  }

  function restore(record) {
    if (!record) return;
    record.minimized = false;
    record.element.hidden = false;
    record.taskButton.classList.remove("is-minimized");
    updateRecordText(record);
    syncMaximizedState();
    focus(record);
    requestAnimationFrame(() => record.element.focus());
  }

  function minimize(record) {
    if (!record) return;
    record.minimized = true;
    record.element.hidden = true;
    record.element.classList.remove("is-active");
    record.taskButton.classList.remove("is-active");
    record.taskButton.classList.add("is-minimized");
    record.taskButton.setAttribute("aria-pressed", "false");
    updateRecordText(record);
    syncMaximizedState();

    const nextRecord = [...records.values()]
      .filter((candidate) => !candidate.minimized)
      .sort((first, second) => Number(second.element.style.zIndex) - Number(first.element.style.zIndex))[0];
    if (nextRecord) focus(nextRecord);
    record.taskButton.focus();
  }

  function toggleMaximize(record) {
    if (!record) return;
    record.element.classList.toggle("is-maximized");
    syncMaximizedState();
    updateRecordText(record);
    focus(record);
  }

  function close(record) {
    if (!record) return;
    const quiz = getQuiz(record);
    if (quiz?.prepareClose) {
      if (record.closing) return;
      record.closing = true;
      record.closeButton.disabled = true;
      return quiz.prepareClose().then((ready) => {
        if (ready && records.get(record.tool.id) === record) removeRecord(record);
      }).catch((error) => {
        console.warn("Learning Hub kept the quiz open because saving failed.", error);
      }).finally(() => {
        record.closing = false;
        record.closeButton.disabled = false;
      });
    }
    if (flushLocalBeforeRemoval(record) === false) return;
    removeRecord(record);
  }

  function removeRecord(record) {
    quizStorageFrames.delete(record.frame);
    const taskButton = record.taskButton;
    record.element.remove();
    record.taskButton.remove();
    records.delete(record.tool.id);
    onToolClosed(record.tool.id);
    setTaskbarVisibility();
    syncMaximizedState();

    const nextRecord = [...records.values()]
      .filter((candidate) => !candidate.minimized)
      .sort((first, second) => Number(second.element.style.zIndex) - Number(first.element.style.zIndex))[0];
    if (nextRecord) {
      focus(nextRecord);
      nextRecord.element.focus();
    } else if (records.size) {
      [...records.values()][0].taskButton.focus();
    } else {
      taskButton.blur();
    }
    const opener = record.htmlOpener;
    if (opener?.node.isConnected) {
      if (opener.record && records.has(opener.record.tool.id)) {
        if (!opener.record.minimized) focus(opener.record);
      }
      opener.node.focus({ preventScroll: true });
    }
  }

  function getQuiz(record) {
    if (record.tool.context.toolKind !== "quiz") return null;
    try { return record.frame.contentWindow?.LearningHubQuiz; }
    catch { return null; }
  }

  function flushLocalBeforeRemoval(record) {
    if (record.tool.context.toolKind === "html") return;
    try {
      // Synchronous: removing an iframe cancels its pending debounce timers.
      return record.frame.contentWindow?.LearningHubQuiz?.flushLocal?.();
    } catch (error) {
      // A separately hosted tool cannot be inspected by the Hub.
      console.warn("Learning Hub could not flush the quiz before closing.", error);
    }
  }

  function enableDragging(record) {
    let drag = null;

    record.bar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      if (record.element.classList.contains("is-maximized")) return;

      const layerBounds = windowLayer.getBoundingClientRect();
      const windowBounds = record.element.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: windowBounds.left - layerBounds.left,
        startTop: windowBounds.top - layerBounds.top,
      };
      record.bar.setPointerCapture(event.pointerId);
      record.element.classList.add("is-dragging");
      focus(record);
      event.preventDefault();
    });

    record.bar.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const layerBounds = windowLayer.getBoundingClientRect();
      const windowBounds = record.element.getBoundingClientRect();
      record.element.style.left = `${clamp(
        drag.startLeft + event.clientX - drag.startX,
        8,
        layerBounds.width - windowBounds.width - 8,
      )}px`;
      record.element.style.top = `${clamp(
        drag.startTop + event.clientY - drag.startY,
        8,
        layerBounds.height - windowBounds.height - 8,
      )}px`;
    });

    const stopDragging = (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      record.element.classList.remove("is-dragging");
      if (record.bar.hasPointerCapture(event.pointerId)) {
        record.bar.releasePointerCapture(event.pointerId);
      }
      drag = null;
    };

    record.bar.addEventListener("pointerup", stopDragging);
    record.bar.addEventListener("pointercancel", stopDragging);
  }

  function createRecord(tool) {
    const element = document.createElement("article");
    element.className = `workspace-window accent-${tool.accent}`;
    element.dataset.toolId = tool.id;
    element.tabIndex = -1;
    element.innerHTML = `
      <header class="workspace-window-bar">
        <div class="window-leading-tools">
          <div class="window-controls">
            <button class="window-control is-close" type="button"><span aria-hidden="true">×</span></button>
            <button class="window-control is-minimize" type="button"><span aria-hidden="true">−</span></button>
            <button class="window-control is-maximize" type="button"><span aria-hidden="true">↗</span></button>
          </div>
          <div class="window-clock">
            <span class="window-clock-date"></span>
            <time class="window-clock-time"></time>
          </div>
          <div class="window-stopwatch-controls">
            <button class="window-stopwatch-toggle" type="button">
              <span class="window-stopwatch-icon" aria-hidden="true">▶</span>
              <output>00:00</output>
            </button>
            <button class="window-stopwatch-reset" type="button"><span aria-hidden="true">↺</span></button>
          </div>
          <div class="window-timer-controls">
            <button class="window-timer-adjust is-decrease" type="button"><span aria-hidden="true">−</span></button>
            <button class="window-timer-toggle" type="button">
              <span class="window-timer-icon" aria-hidden="true">▶</span>
              <output>05:00</output>
            </button>
            <button class="window-timer-adjust is-increase" type="button"><span aria-hidden="true">＋</span></button>
            <button class="window-timer-reset" type="button"><span aria-hidden="true">↺</span></button>
          </div>
        </div>
        <div class="window-identity">
          <span class="window-icon" aria-hidden="true">${tool.icon}</span>
          <strong class="window-title"></strong>
        </div>
        <span class="window-drag-hint" aria-hidden="true">•••</span>
      </header>
      <iframe class="workspace-tool-frame" src="${tool.page}" loading="eager"></iframe>
    `;

    const taskButton = document.createElement("button");
    taskButton.className = `taskbar-item accent-${tool.accent}`;
    taskButton.type = "button";
    taskButton.innerHTML = `
      <span class="taskbar-item-icon" aria-hidden="true">${tool.icon}</span>
      <span class="taskbar-item-title"></span>
      <span class="taskbar-state" aria-hidden="true">●</span>
    `;

    // Static chapter overviews cannot run scripts or access the parent/account.
    if (tool.context.toolKind === "html") element.querySelector("iframe").setAttribute("sandbox", "allow-same-origin");

    const record = {
      tool,
      element,
      bar: element.querySelector(".workspace-window-bar"),
      title: element.querySelector(".window-title"),
      frame: element.querySelector(".workspace-tool-frame"),
      closeButton: element.querySelector(".is-close"),
      minimizeButton: element.querySelector(".is-minimize"),
      maximizeButton: element.querySelector(".is-maximize"),
      clock: element.querySelector(".window-clock"),
      clockDate: element.querySelector(".window-clock-date"),
      clockTime: element.querySelector(".window-clock-time"),
      clockTick: -1,
      clockLanguage: "",
      stopwatchButton: element.querySelector(".window-stopwatch-toggle"),
      stopwatchIcon: element.querySelector(".window-stopwatch-icon"),
      stopwatchOutput: element.querySelector(".window-stopwatch-toggle output"),
      stopwatchReset: element.querySelector(".window-stopwatch-reset"),
      stopwatch: {
        elapsed: 0,
        startedAt: null,
        running: false,
      },
      timerButton: element.querySelector(".window-timer-toggle"),
      timerIcon: element.querySelector(".window-timer-icon"),
      timerOutput: element.querySelector(".window-timer-toggle output"),
      timerDecrease: element.querySelector(".window-timer-adjust.is-decrease"),
      timerIncrease: element.querySelector(".window-timer-adjust.is-increase"),
      timerReset: element.querySelector(".window-timer-reset"),
      timer: {
        duration: 5 * 60_000,
        remaining: 5 * 60_000,
        startedAt: null,
        running: false,
        finished: false,
      },
      taskButton,
      taskTitle: taskButton.querySelector(".taskbar-item-title"),
      minimized: false,
    };

    record.closeButton.addEventListener("click", () => close(record));
    record.minimizeButton.addEventListener("click", () => minimize(record));
    record.maximizeButton.addEventListener("click", () => toggleMaximize(record));
    record.stopwatchButton.addEventListener("click", () =>
      toggleStopwatch(record),
    );
    record.stopwatchReset.addEventListener("click", () =>
      resetStopwatch(record),
    );
    record.timerButton.addEventListener("click", () => toggleTimer(record));
    record.timerDecrease.addEventListener("click", () =>
      adjustTimer(record, -1),
    );
    record.timerIncrease.addEventListener("click", () =>
      adjustTimer(record, 1),
    );
    record.timerReset.addEventListener("click", () => resetTimer(record));
    record.element.addEventListener("pointerdown", () => focus(record));
    record.frame.addEventListener("load", () => {
      postContext(record);
      // Scripts remain disabled in read-only HTML; only the parent installs this handler.
      try { bindHtmlLinks(record.frame.contentDocument, record); } catch { /* Cross-origin content stays isolated. */ }
    });
    record.taskButton.addEventListener("click", () => {
      const isFrontmost = record.element.classList.contains("is-active");
      if (record.minimized) restore(record);
      else if (isFrontmost) minimize(record);
      else focus(record);
    });

    enableDragging(record);
    updateRecordText(record);
    renderWindowTime(record);
    return record;
  }

  function open(toolId) {
    const tool = toolCatalog[toolId];
    if (!tool) return false;

    const existingRecord = records.get(toolId);
    if (existingRecord) {
      restore(existingRecord);
      return true;
    }

    const record = createRecord(tool);
    records.set(toolId, record);
    windowLayer.append(record.element);
    if (tool.context.toolKind === "quiz") quizStorageFrames.add(record.frame);
    taskbarItems.append(record.taskButton);
    positionNewWindow(record);
    setTaskbarVisibility();
    focus(record);
    requestAnimationFrame(() => record.element.focus());
    return true;
  }

  function openContent(entry) {
    const tool = createContentTool(entry, location.href);
    if (!tool) return false;
    // A copied quiz must receive a new ID; do not silently reuse another file's window.
    const previous = toolCatalog[tool.id];
    if (previous && previous.source !== tool.source) return false;
    toolCatalog[tool.id] = tool;
    return open(tool.id);
  }

  const htmlLinkDocuments = new WeakSet();
  function bindHtmlLinks(doc, ownerRecord = null) {
    if (!doc || htmlLinkDocuments.has(doc)) return;
    htmlLinkDocuments.add(doc);
    doc.addEventListener("click", event => {
      const node = event.target?.closest?.("a[data-hub-html], button[data-hub-html]");
      if (!node || node.disabled || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const subject = doc.querySelector("[data-subject-id]")?.dataset.subjectId;
      const entry = htmlLinkEntry(node, doc.URL, ownerRecord?.tool.context || { subjectId: subject });
      const tool = createContentTool(entry, location.href);
      if (!tool || !openContent(entry)) {
        let notice = doc.querySelector("[data-html-link-error]");
        if (!notice) {
          notice = doc.createElement("p"); notice.dataset.htmlLinkError = "";
          notice.setAttribute("role", "alert"); node.after(notice);
        }
        notice.textContent = language() === "en"
          ? "Cannot open HTML. Check the content ID and local HTML file path."
          : "เปิด HTML ไม่ได้ กรุณาตรวจรหัสเนื้อหาและลิงก์ไฟล์ HTML ภายในเว็บ";
        return;
      }
      doc.querySelector("[data-html-link-error]")?.remove();
      const opened = records.get(tool.id);
      if (opened && opened !== ownerRecord) opened.htmlOpener = { node, record: ownerRecord };
    });
  }

  function setLanguage() {
    records.forEach((record) => {
      updateRecordText(record);
      renderWindowTime(record);
      postContext(record);
    });
  }

  function setContext() {
    records.forEach((record) => postContext(record));
  }

  function clear() {
    records.forEach((record) => {
      flushLocalBeforeRemoval(record);
      quizStorageFrames.delete(record.frame);
      record.element.remove();
      record.taskButton.remove();
    });
    records.clear();
    setTaskbarVisibility();
    syncMaximizedState();
  }

  async function prepareAllForClose() {
    for (const record of records.values()) {
      const quiz = getQuiz(record);
      if (quiz?.prepareClose) {
        if (!await quiz.prepareClose()) return false;
      } else if (flushLocalBeforeRemoval(record) === false) return false;
    }
    return true;
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type !== "learning-hub-quiz-ready") return;
    const trustedOrigin = location.origin === "null" || event.origin === location.origin;
    if (!trustedOrigin || !isWorkspaceQuizSource(event.source)) return;
    const record = [...records.values()].find(
      (candidate) => candidate.frame.contentWindow === event.source,
    );
    if (record) postContext(record);
  });

  window.setInterval(() => {
    const now = Date.now();
    records.forEach((record) => renderWindowTime(record, now));
  }, 250);

  window.addEventListener("resize", () => {
    records.forEach((record) => {
      if (record.minimized || record.element.classList.contains("is-maximized")) return;
      const layerBounds = windowLayer.getBoundingClientRect();
      const windowBounds = record.element.getBoundingClientRect();
      record.element.style.left = `${clamp(
        windowBounds.left - layerBounds.left,
        8,
        layerBounds.width - windowBounds.width - 8,
      )}px`;
      record.element.style.top = `${clamp(
        windowBounds.top - layerBounds.top,
        8,
        layerBounds.height - windowBounds.height - 8,
      )}px`;
    });
  });

  return { open, openContent, bindHtmlLinks, setLanguage, setContext, clear, prepareAllForClose };
}
