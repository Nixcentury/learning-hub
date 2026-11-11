import { exitTicketPages, prepareExitTicketPrint } from './exit-ticket-revision.js';
import { readPrintMetadata, buildPrintFilename, createPrintTitleSession } from './print-metadata.js';

let active = null;

// Uses the existing sanitizer/resource checks, preserving the authored A4 pages
// rather than passing an already paginated worksheet through the prose paginator.
export function openExitTicketPrint({ frame, title, language, opener, context,
  buildSnapshot, waitForResources }) {
  if (active?.isConnected) { active.focus(); return; }
  const en = language === 'en', text = (th, english) => en ? english : th;
  const source = frame.contentDocument;
  const allCount = exitTicketPages(source).length, quizCount = exitTicketPages(source, 'quiz').length;
  const dialog = document.createElement('dialog');
  dialog.className = 'html-print-dialog'; dialog.dataset.htmlPrintDialog = '';
  dialog.dataset.exitTicketPrintDialog = ''; dialog.dataset.printState = 'loading';
  dialog.setAttribute('aria-labelledby', 'revision-print-title');
  dialog.innerHTML = `<header class="html-print-toolbar"><div><h2 id="revision-print-title"></h2><p data-print-status role="status"></p></div><div class="html-print-actions"><button type="button" data-print-confirm disabled></button><button type="button" data-print-close></button></div></header><div data-revision-print-options></div><p class="html-print-help"></p><p data-print-filename></p><iframe data-html-print-frame sandbox="allow-same-origin allow-modals"></iframe>`;
  const status = dialog.querySelector('[data-print-status]'), preview = dialog.querySelector('iframe');
  const confirm = dialog.querySelector('[data-print-confirm]');
  const options = dialog.querySelector('[data-revision-print-options]');
  function select(marker, label, choices) {
    const field = document.createElement('label'); field.className = 'html-print-edition';
    field.append(document.createTextNode(label));
    const control = document.createElement('select'); control.setAttribute(marker, '');
    for (const [value, name] of choices) {
      const option = document.createElement('option'); option.value = value; option.textContent = name; control.append(option);
    }
    field.append(control); options.append(field); return control;
  }
  const range = select('data-revision-print-range', text('ช่วงที่พิมพ์', 'Print range'), [
    ['all',text(`ทั้งชุด (${allCount} หน้า)`,`Full set (${allCount} pages)`)],
    ['quiz',text(`เฉพาะควิซ (${quizCount} หน้า)`,`Quiz only (${quizCount} pages)`)],
  ]);
  const edition = select('data-revision-print-edition',text('ฉบับที่พิมพ์','Print edition'),[
    ['blank',text('ฉบับผู้เรียน — ไม่แสดงเฉลย','Student — answers hidden')],
    ['answers',text('ฉบับเฉลย','Teacher answers')],
  ]);
  edition.value = source.body.classList.contains('answers-on') ? 'answers' : 'blank';
  dialog.querySelector('h2').textContent = text('ตัวอย่างก่อนพิมพ์ · exit ticket revision','Print preview · exit ticket revision');
  dialog.querySelector('[data-print-close]').textContent = text('กลับไปอ่าน','Back to reading');
  confirm.textContent = text('พิมพ์ / บันทึก PDF','Print / Save PDF');
  dialog.querySelector('.html-print-help').textContent = text(
    'เลือก A4 แนวตั้ง ขนาดจริง 100% ระยะขอบไม่มี และปิดหัว–ท้ายเบราว์เซอร์หากมีตัวเลือก',
    'Choose A4 portrait, 100% actual size, no margins; disable browser headers/footers if available.');
  preview.title = title;
  const titles = createPrintTitleSession(window);
  let revision = 0, filename = '';
  const snapshot = buildSnapshot(source, title);
  const fit = () => preview.contentDocument?.documentElement.style.setProperty('--revision-print-scale',
    String(Math.min(1, Math.max(.2, (preview.clientWidth - 16) / (210 * 96 / 25.4)))));
  const observer = new ResizeObserver(fit);
  const alive = () => dialog.isConnected && dialog.open;
  async function rebuild() {
    const token = ++revision;
    confirm.disabled = true; range.disabled = true; edition.disabled = true;
    dialog.dataset.printState = 'loading'; preview.style.visibility = 'hidden';
    status.textContent = text('กำลังตรวจรูปและหน้ากระดาษ…','Checking images and pages…');
    let timer, onLoad;
    try {
      const doc = new DOMParser().parseFromString(snapshot, 'text/html');
      const count = prepareExitTicketPrint(doc, { range:range.value, answers:edition.value === 'answers' });
      const labels = readPrintMetadata(source, language);
      filename = buildPrintFilename({ ...labels, subjectId:context.subjectId, language,
        work:labels.work || title, mode:edition.value, zone:range.value === 'quiz' ? 'problem' : '' });
      doc.title = filename;
      const loaded = new Promise((resolve, reject) => {
        onLoad = () => {
          if (preview.contentDocument?.documentElement.hasAttribute('data-hub-print-snapshot')) resolve();
        };
        preview.addEventListener('load', onLoad);
        timer = setTimeout(() => reject(Error('Print preview timed out')), 15000);
      });
      preview.srcdoc = '<!doctype html>\n' + doc.documentElement.outerHTML;
      await loaded;
      if (!alive() || token !== revision) return;
      await waitForResources(preview.contentDocument);
      if (!alive() || token !== revision) return;
      for (const page of exitTicketPages(preview.contentDocument)) {
        if (page.scrollHeight > page.clientHeight + 2 || page.scrollWidth > page.clientWidth + 2)
          throw Error('A4 page overflow');
      }
      fit(); preview.style.visibility = 'visible';
      dialog.querySelector('[data-print-filename]').textContent = text('ชื่อไฟล์: ','Filename: ') + filename + '.pdf';
      status.textContent = text(`พร้อมพิมพ์ ${count} หน้า`,`${count} pages ready to print`);
      dialog.dataset.printState = 'ready'; confirm.disabled = false;
    } catch {
      if (alive() && token === revision) {
        dialog.dataset.printState = 'error';
        status.textContent = text('เตรียมหน้าพิมพ์ไม่สำเร็จ กรุณากลับไปอ่านแล้วลองใหม่','Print preparation failed. Return to reading and try again.');
      }
    } finally {
      clearTimeout(timer); if (onLoad) preview.removeEventListener('load',onLoad);
      if (alive() && token === revision) { range.disabled = false; edition.disabled = false; }
    }
  }
  dialog.addEventListener('close', () => {
    revision++; observer.disconnect(); titles.restore(); dialog.remove(); active = null;
    if (opener?.isConnected) opener.focus({preventScroll:true});
  }, { once:true });
  dialog.querySelector('[data-print-close]').addEventListener('click', () => dialog.close());
  range.addEventListener('change', rebuild); edition.addEventListener('change', rebuild);
  confirm.addEventListener('click', () => {
    if (dialog.dataset.printState !== 'ready') return;
    try {
      titles.set(filename);
      preview.contentWindow.addEventListener('afterprint', () => titles.restore(), {once:true});
      preview.contentWindow.focus(); preview.contentWindow.print();
    } catch {
      titles.restore(); status.textContent = text('เปิดการพิมพ์ไม่ได้ กรุณาลองในเบราว์เซอร์หลัก','Unable to print. Try your device’s main browser.');
    }
  });
  document.body.append(dialog); active = dialog; dialog.showModal(); observer.observe(preview);
  void rebuild();
}
