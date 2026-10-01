let activeDialog = null;

// Keep a selectable link when the browser denies clipboard access.
export async function openHubShare({ getTarget, getLanguage, opener }) {
  activeDialog?.close();
  const english = getLanguage() === 'en';
  const label = (th, en) => english ? en : th;
  const dialog = document.createElement('dialog');
  activeDialog = dialog;
  dialog.className = 'hub-share-dialog';
  dialog.setAttribute('aria-labelledby', 'hub-share-title');
  dialog.innerHTML = `<h2 id="hub-share-title"></h2><p class="hub-share-description"></p>
    <label for="hub-share-url"></label><input id="hub-share-url" type="url" readonly data-allow-selection>
    <p class="hub-share-status" role="status" aria-live="polite"></p>
    <div class="hub-share-actions"><button type="button" data-share-copy disabled></button>
    <form method="dialog"><button type="submit" data-share-close></button></form></div>`;
  const input = dialog.querySelector('input');
  const copy = dialog.querySelector('[data-share-copy]');
  const status = dialog.querySelector('.hub-share-status');
  dialog.querySelector('h2').textContent = label('แชร์ลิงก์', 'Share link');
  dialog.querySelector('label').textContent = label('ลิงก์ไปยังหน้านี้', 'Link to this location');
  dialog.querySelector('.hub-share-description').textContent = label(
    'เปิดหน้าเดียวกันบนเครื่องผู้รับ โดยใช้บัญชีและงานที่บันทึกของผู้รับ ไม่ส่งคำตอบหรือคะแนนของคุณ',
    'Opens the same location using the recipient’s own account and saved work. Your answers and scores are not shared.');
  copy.textContent = label('คัดลอกลิงก์', 'Copy link');
  dialog.querySelector('[data-share-close]').textContent = label('ปิด', 'Close');
  status.textContent = label('กำลังเตรียมลิงก์…', 'Preparing link…');
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (activeDialog === dialog) activeDialog = null;
    if (!activeDialog && opener?.isConnected) opener.focus();
  });
  copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(input.value);
      status.textContent = label('คัดลอกแล้ว ส่งลิงก์นี้ให้ผู้เรียนได้เลย', 'Copied. You can send this link to learners.');
    } catch {
      input.focus(); input.select();
      status.textContent = label('เบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ กดค้างหรือกด Ctrl+C เพื่อคัดลอกลิงก์ที่เลือกไว้',
        'Automatic copying is unavailable. Long-press or press Ctrl+C to copy the selected link.');
    }
  });
  input.addEventListener('click', () => input.select());
  document.body.append(dialog);
  dialog.showModal();
  let target;
  try { target = await getTarget(); } catch { target = null; }
  if (!dialog.open) return;
  if (!target) {
    input.hidden = true;
    dialog.querySelector('label').hidden = true;
    status.textContent = label('ยังสร้างลิงก์ไม่ได้ ตรวจการเชื่อมต่อและการลงทะเบียนเนื้อหา แล้วลองอีกครั้ง',
      'A share link is not available. Check your connection and the content catalog, then retry.');
    return;
  }
  dialog.querySelector('h2').textContent = label('แชร์ · ', 'Share · ') + (english ? target.titleEn : target.titleTh);
  input.value = target.url;
  copy.disabled = false;
  status.textContent = '';
  copy.focus();
}
