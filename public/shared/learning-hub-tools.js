/* ==============================================================
   Interaction Guard กลางสำหรับ Hub / Quiz / Simulation / Notebook
   ปิดเมนูแตะค้าง เลือกข้อความ คัดลอก และลากองค์ประกอบ
================================================================ */

(function initializeLearningHubTools() {
  if (window.LearningHubTools) return;

  const editableSelector =
    'input, textarea, select, [contenteditable="true"], [data-allow-selection]';
  const blockedEvents = [
    "contextmenu",
    "selectstart",
    "dragstart",
    "copy",
    "beforecopy",
  ];

  function isEditableTarget(target) {
    return target instanceof Element && Boolean(target.closest(editableSelector));
  }

  function blockNativeSelection(event) {
    if (!isEditableTarget(event.target)) event.preventDefault();
  }

  function installInteractionGuard() {
    if (document.documentElement.dataset.hubInteractionGuard === "ready") return;

    document.documentElement.dataset.hubInteractionGuard = "ready";
    const style = document.createElement("style");
    style.dataset.hubInteractionGuardStyle = "";
    style.textContent = `
      html,
      body,
      body * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-drag: none;
        -webkit-user-select: none;
        user-select: none;
      }

      input,
      textarea,
      select,
      [contenteditable="true"],
      [contenteditable="true"] *,
      [data-allow-selection],
      [data-allow-selection] * {
        -webkit-touch-callout: default;
        -webkit-user-select: text;
        user-select: text;
      }

    `;
    document.head.append(style);

    blockedEvents.forEach((eventName) => {
      document.addEventListener(eventName, blockNativeSelection, true);
    });
  }

  installInteractionGuard();
  window.LearningHubTools = Object.freeze({
    installInteractionGuard,
  });
})();
