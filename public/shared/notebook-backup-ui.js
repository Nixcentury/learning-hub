import { BACKUP_MAX_BYTES, buildNotebookBackup, parseNotebookBackup, jsonBytes } from "./notebook-backup.js";

const messages = {
  "backup-format": ["ไฟล์นี้ไม่ใช่ไฟล์สำรองสมุดรุ่นที่รองรับ", "This is not a supported notebook backup."],
  "backup-content": ["ไฟล์นี้เป็นของ Quiz คนละชุด กรุณาเปิดชุดที่ตรงกัน", "This backup belongs to another quiz. Open its matching quiz first."],
  "backup-pages": ["ไฟล์ไม่มีหน้าสมุด หรือมีจำนวนหน้าเกินที่รองรับ", "The file has no notebook pages or too many pages."],
  "backup-question": ["รหัสข้อไม่ตรงกับชุดนี้ หรือมีข้อซ้ำในไฟล์", "Unknown or duplicate question IDs in this backup."],
  "backup-ink": ["ข้อมูลเส้นปากกาไม่ถูกต้อง ยังไม่นำเข้าหรือแก้งานเดิม", "Invalid handwriting data. Existing work was not changed."],
  "backup-large": ["ไฟล์ใหญ่เกินขีดจำกัดรุ่นทดสอบ (20 MB / 250,000 จุดปากกา)", "This file exceeds the test release limit (20 MB / 250,000 pen points)."],
  "backup-session": ["บัญชีหรืองานเปลี่ยนระหว่างดำเนินการ กรุณาเปิดหน้าสำรองใหม่", "The account or work changed. Reopen notebook backup."],
  "backup-conflict": ["ลายมือเปลี่ยนจากอีกแท็บหลังตรวจไฟล์ จึงยกเลิกการนำเข้า กรุณาเปิดตรวจไฟล์ใหม่", "Writing changed in another tab. Nothing was imported. Reopen and review the file again."],
  "backup-overwrite": ["โปรดยืนยันก่อนแทนที่ลายมือเดิม", "Confirm before replacing existing handwriting."],
  "backup-storage": ["ยังเก็บข้อมูลในเครื่องไม่สำเร็จ กรุณาตรวจพื้นที่และลองใหม่ งานนำเข้ายังไม่ถือว่าสำเร็จ", "Device storage did not finish. Check available space and retry. Import is not confirmed."],
};

export function createNotebookBackupUi({ getManager, language, getTitle, canOpen, onClose }) {
  const dialog = document.createElement("dialog");
  dialog.className = "notebook-backup-dialog";
  dialog.setAttribute("aria-labelledby", "notebook-backup-title");
  document.body.append(dialog);
  let session = 0;
  let busy = false;
  let changed = false;
  let downloadUrl = null;
  function releaseDownload() {
    if (downloadUrl) {
      const oldUrl = downloadUrl;
      setTimeout(() => URL.revokeObjectURL(oldUrl), 60000);
      downloadUrl = null;
    }
  }
  const label = (th, en) => language() === "en" ? en : th;
  const size = (bytes) => bytes === 0 ? "0 KB" : bytes < 1024 * 1024 ? `${Math.max(0.1, bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  const node = (selector) => dialog.querySelector(selector);
  function notice(text, error = false) {
    const target = node("[data-backup-status]");
    if (!target) return;
    target.textContent = text;
    target.dataset.error = String(error);
  }
  function showError(error) {
    const message = messages[error?.message] || messages["backup-storage"];
    notice(label(...message), true);
  }
  function close() { if (!busy) dialog.close(); }
  dialog.addEventListener("cancel", (event) => { if (busy) event.preventDefault(); });
  dialog.addEventListener("close", () => { session++; busy = false; releaseDownload(); onClose?.(changed); });

  async function open() {
    if (!canOpen() || dialog.open) return;
    const manager = getManager();
    if (!manager) return;
    const token = ++session;
    const lifecycle = manager.lifecycle;
    const valid = () => token === session && manager === getManager() && lifecycle === manager.lifecycle;
    changed = false;
    dialog.innerHTML = `
      <header><div><h2 id="notebook-backup-title">${label("สมุดในเครื่อง · ชุดนี้", "Device notebooks · this quiz")}</h2><p data-backup-title></p></div><button type="button" data-backup-close aria-label="${label("ปิด", "Close")}">×</button></header>
      <div class="notebook-backup-body">
        <p>${label("สำรองเฉพาะข้อที่มีลายมือ เป็นไฟล์ .hubnote ที่นำกลับมาเขียนต่อได้ ไม่รวมคำตอบ คะแนน ข้อความเหตุผล หรือผลตรวจ AI", "Back up questions with handwriting as an editable .hubnote file. Answers, scores, typed reasoning and AI reviews are not included.")}</p>
        <p data-backup-total></p><ul class="notebook-backup-list" data-backup-pages></ul>
        <div class="notebook-backup-actions"><a class="is-primary" data-backup-download aria-disabled="true">${label("สำรองสมุดเป็นไฟล์", "Download notebook backup")}</a><button type="button" data-backup-choose disabled>${label("นำเข้าสมุดจากไฟล์", "Import notebook file")}</button></div>
        <input type="file" accept=".hubnote,.json,application/json" data-backup-file hidden>
        <p class="notebook-backup-notice" data-backup-status role="status" aria-live="polite">${label("กำลังอ่านสมุดของชุดนี้…", "Reading this quiz’s notebooks…")}</p>
        <section class="notebook-backup-import" data-backup-preview hidden><h3>${label("ตรวจไฟล์ก่อนนำเข้า", "Review before importing")}</h3><p data-backup-preview-copy></p><ul class="notebook-backup-list" data-backup-conflicts></ul><label data-backup-overwrite-label hidden><input type="checkbox" data-backup-overwrite><span>${label("ยืนยันแทนที่ลายมือเดิมเฉพาะข้อที่ระบุ (ควรสำรองงานเดิมก่อน)", "Replace handwriting for the listed questions (back up existing work first).")}</span></label><p>${label("นำเข้าในผู้ใช้ปัจจุบันเท่านั้น ข้ออื่นไม่เปลี่ยน และวิธีทำที่นำเข้าจะต้องตรวจ AI ใหม่", "Import into the current user only. Other questions stay unchanged; imported working needs a fresh AI review.")}</p><div class="notebook-backup-actions"><button class="is-primary" type="button" data-backup-confirm disabled>${label("ยืนยันนำเข้าสมุด", "Confirm notebook import")}</button><button type="button" data-backup-cancel>${label("ยกเลิก", "Cancel")}</button></div></section>
        <p>${label("ระบบไม่ลบสมุดหลังสำรอง ปิดหน้าต่างนี้แล้วเขียนต่อได้ · หากเปิดชุดเดียวกันหลายแท็บ ควรปิดแท็บอื่นก่อนนำเข้า", "Backing up does not delete notebooks. Close this window to continue writing. Close other tabs of this quiz before importing.")}</p>
      </div>`;
    node("[data-backup-title]").textContent = getTitle() || manager.contentId;
    node("[data-backup-close]").onclick = close;
    dialog.showModal();
    let exportFile = null;
    let importPlan = null;
    const addItem = (list, title, info) => {
      const row = document.createElement("li");
      const name = document.createElement("span");
      const detail = document.createElement("span");
      name.textContent = title; detail.textContent = info;
      row.append(name, detail); list.append(row);
    };
    const questionName = (id) => `${label("ข้อ", "Q")} ${manager.questions.findIndex((q) => q.id === id) + 1}`;
    async function refresh() {
      const pages = await manager.listNotebookBackups();
      if (!valid()) return;
      const list = node("[data-backup-pages]");
      list.replaceChildren();
      let bytes = 0;
      pages.forEach((page) => {
        const used = jsonBytes(page.snapshot); bytes += used;
        addItem(list, questionName(page.questionId), `${page.snapshot.strokes.length} ${label("เส้น", "strokes")} · ${size(used)}`);
      });
      node("[data-backup-total]").textContent = label(`มีลายมือ ${pages.length} ข้อ · ขนาดข้อมูลประมาณ ${size(bytes)} (ไม่ใช่พื้นที่ดิสก์ทั้งหมด)`, `${pages.length} handwritten questions · about ${size(bytes)} of data (not total disk usage)`);
      exportFile = pages.length ? buildNotebookBackup(manager.contentId, pages, getTitle()) : null;
      releaseDownload();
      const download = node("[data-backup-download]");
      download.setAttribute("aria-disabled", String(!exportFile));
      download.removeAttribute("href");
      if (exportFile) {
        downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(exportFile)], { type: "application/json" }));
        download.href = downloadUrl;
        download.download = `${manager.contentId.replace(/[^a-z0-9_-]/gi, "-")}-${new Date().toISOString().replace(/[:.]/g, "-")}.hubnote`;
      }
      node("[data-backup-choose]").disabled = false;
    }
    function clearPreview() {
      importPlan = null;
      node("[data-backup-preview]").hidden = true;
      node("[data-backup-overwrite]").checked = false;
      node("[data-backup-file]").value = "";
    }
    node("[data-backup-download]").onclick = (event) => {
      if (!valid() || !exportFile || busy) { event.preventDefault(); return; }
      notice(label("ส่งไฟล์ให้เบราว์เซอร์แล้ว กรุณาเลือกเก็บใน Files / Downloads สมุดเดิมยังอยู่ครบ", "The file was handed to your browser. Save it in Files / Downloads. Original notebooks are unchanged."));
    };
    node("[data-backup-choose]").onclick = () => { if (!busy) node("[data-backup-file]").click(); };
    node("[data-backup-file]").onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file || busy) return;
      clearPreview(); busy = true;
      try {
        if (file.size > BACKUP_MAX_BYTES) throw new Error("backup-large");
        const backup = parseNotebookBackup(await file.text(), { contentId: manager.contentId, questionIds: manager.questions.map((q) => q.id) });
        if (!valid()) return;
        importPlan = await manager.prepareNotebookImport(backup);
        if (!valid()) return;
        node("[data-backup-preview-copy]").textContent = label(`นำเข้า ${backup.pages.length} ข้อ · มีลายมือเดิม ${importPlan.conflicts.length} ข้อ`, `Import ${backup.pages.length} questions · ${importPlan.conflicts.length} already have handwriting`);
        const list = node("[data-backup-conflicts]"); list.replaceChildren();
        backup.pages.forEach((page) => addItem(list, questionName(page.questionId), importPlan.conflicts.includes(page.questionId) ? label("จะแทนที่ลายมือเดิม", "Will replace existing ink") : label("เพิ่มลายมือ", "Add handwriting")));
        node("[data-backup-overwrite-label]").hidden = !importPlan.conflicts.length;
        node("[data-backup-confirm]").disabled = Boolean(importPlan.conflicts.length);
        node("[data-backup-preview]").hidden = false;
        notice(label("ตรวจไฟล์แล้ว ยังไม่ได้เขียนทับงานใด", "File validated. No existing work has been replaced."));
      } catch (error) { if (valid()) showError(error); }
      finally { if (valid()) busy = false; }
    };
    node("[data-backup-overwrite]").onchange = () => { node("[data-backup-confirm]").disabled = !node("[data-backup-overwrite]").checked; };
    node("[data-backup-cancel]").onclick = () => { if (!busy) { clearPreview(); notice(label("ยกเลิกแล้ว งานเดิมไม่เปลี่ยน", "Cancelled. Existing work is unchanged.")); } };
    node("[data-backup-confirm]").onclick = async () => {
      if (!valid() || !importPlan || busy) return;
      busy = true; node("[data-backup-confirm]").disabled = true;
      try {
        const count = await manager.importNotebookBackup(importPlan, { overwrite: node("[data-backup-overwrite]").checked });
        if (!valid()) return;
        changed = true;
        clearPreview();
        await refresh();
        if (valid()) notice(label(`นำเข้าและเก็บลายมือ ${count} ข้อในเครื่องแล้ว ปิดหน้าต่างนี้เพื่อเขียนต่อ คะแนนเดิมไม่เปลี่ยน`, `${count} questions imported and saved on this device. Close to continue writing. Quiz scores are unchanged.`));
      } catch (error) { if (valid()) { clearPreview(); showError(error); } }
      finally { if (valid()) busy = false; }
    };
    busy = true;
    try {
      await refresh();
      if (valid()) notice(label("พร้อมสำรองหรือนำเข้า · ทดสอบได้โดยไม่ต้องใช้ Firebase", "Ready to back up or import. Firebase is not required."));
    } catch (error) { if (valid()) showError(error); }
    finally { if (valid()) busy = false; }
  }
  return {
    open,
    get busy() { return busy; },
    invalidate() { session++; busy = false; if (dialog.open) dialog.close(); },
  };
}
