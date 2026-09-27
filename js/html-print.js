import { renderHtmlMath } from './html-math.js';

let activePreview = null;
const RESOURCE_TIMEOUT = 15000;

export function safePrintUrl(value, baseUrl) {
  if (!value || value.startsWith('#')) return value;
  try {
    const url = new URL(value, baseUrl);
    return ['http:', 'https:', 'blob:'].includes(url.protocol) || /^data:image\//i.test(url.href) ? url.href : '';
  } catch { return ''; }
}

function resolveCssUrls(css, baseUrl) {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_, quote, value) =>
    `url("${safePrintUrl(value, baseUrl).replaceAll('"', '%22')}")`);
}

// Applied to the snapshot only. Never modifies the author's reading layout.
export const htmlPrintCSS = `
  @page { size:A4; margin:15mm; }
  html { background:white !important; }
  body.hub-print-document { box-sizing:border-box; width:180mm !important; max-width:none !important; min-width:0 !important; margin:0 auto !important; padding:0 !important; background:white !important; color:#172235; font-size:11pt; line-height:1.65; }
  .hub-print-document main { max-width:none !important; min-width:0 !important; margin:0 !important; padding:0 !important; }
  .hub-print-document section, .hub-print-document article { break-inside:auto !important; page-break-inside:auto !important; box-shadow:none !important; }
  .hub-print-document h1 { font-size:22pt; }
  .hub-print-document h2 { font-size:16pt; }
  .hub-print-document h3 { font-size:13pt; }
  .hub-print-document h1, .hub-print-document h2, .hub-print-document h3 { break-after:avoid; page-break-after:avoid; }
  .hub-print-document p, .hub-print-document li { orphans:3; widows:3; break-inside:avoid; page-break-inside:avoid; }
  .hub-print-document p:has(+ [data-hub-math="display"]) { break-after:avoid; page-break-after:avoid; }
  .hub-print-document table { width:100% !important; min-width:0 !important; max-width:100% !important; border-collapse:collapse; }
  .hub-print-document thead { display:table-header-group; }
  .hub-print-document tr, .hub-print-document figure { break-inside:avoid; page-break-inside:avoid; }
  .hub-print-document th, .hub-print-document td { overflow-wrap:anywhere; }
  .hub-print-document img { max-width:100% !important; height:auto; break-inside:avoid; }
  .hub-print-document [data-hub-print-scroll], .hub-print-document [data-hub-math] { overflow:visible !important; max-height:none !important; }
  .hub-print-document [data-hub-math="display"] { break-inside:avoid; page-break-inside:avoid; }
  .hub-print-document [data-hub-math] mjx-container { max-width:100% !important; }
  .hub-print-document [data-hub-math] mjx-container > svg { max-width:100% !important; height:auto !important; }
  .hub-print-document [data-no-print], .hub-print-document .no-print, .hub-print-document [data-hub-math-notice] { display:none !important; }
  @media screen { body.hub-print-document { padding:8mm 0 !important; } }
  @media screen and (max-width:720px) { body.hub-print-document { width:100% !important; padding:4mm 2mm !important; } }
  @media print { body.hub-print-document { width:auto !important; } }
`;

export function buildHtmlPrintSnapshot(source, title) {
  if (!source?.documentElement.hasAttribute('data-learning-html')) throw Error('Not a reading document');
  const clone = source.documentElement.cloneNode(true);
  const originals = source.querySelectorAll('*');
  const copies = clone.querySelectorAll('*');
  // querySelectorAll on Document includes html, while on the cloned html does not.
  for (let i = 0; i < copies.length; i += 1) {
    const node = originals[i + 1];
    if (!node) continue;
    // Keep the selected picture/srcset image when moving to a separate document.
    if (node.localName === 'img' && node.currentSrc) copies[i].setAttribute('src', safePrintUrl(node.currentSrc, source.URL));
    const css = source.defaultView?.getComputedStyle(node);
    if (css && /auto|scroll|hidden|clip/.test(`${css.overflowX} ${css.overflowY}`)) copies[i].setAttribute('data-hub-print-scroll', '');
  }
  clone.querySelectorAll('script, iframe, object, embed, form, button, input, textarea, select, base, template, [data-no-print], .no-print, [data-hub-html], [data-hub-math-notice], meta[http-equiv]').forEach(node => node.remove());
  clone.querySelectorAll('link:not([rel="stylesheet"])').forEach(node => node.remove());
  for (const node of [clone, ...clone.querySelectorAll('*')]) {
    for (const attr of [...node.attributes]) {
      if (/^on/i.test(attr.name) || ['srcdoc', 'autofocus', 'formaction', 'srcset', 'ping'].includes(attr.name)) node.removeAttributeNode(attr);
      else if (['href', 'src', 'poster'].includes(attr.localName)) {
        const value = safePrintUrl(attr.value, source.URL);
        if (value) node.setAttributeNS(attr.namespaceURI, attr.name, value); else node.removeAttributeNode(attr);
      }
    }
    if (node.hasAttribute('style')) node.setAttribute('style', resolveCssUrls(node.getAttribute('style'), source.URL));
  }
  clone.querySelectorAll('style').forEach(node => { node.textContent = resolveCssUrls(node.textContent, source.URL); });
  clone.querySelectorAll('img').forEach(node => { node.loading = 'eager'; });
  const docTitle = clone.querySelector('title') || source.createElement('title');
  docTitle.textContent = title || source.title || 'Learning Hub';
  clone.querySelector('head').append(docTitle);
  const style = source.createElement('style'); style.dataset.hubPrintStyle = ''; style.textContent = htmlPrintCSS;
  clone.querySelector('head').append(style);
  clone.querySelector('body').classList.add('hub-print-document');
  clone.dataset.hubPrintSnapshot = '';
  return '<!doctype html>\n' + clone.outerHTML;
}

function withTimeout(promise, milliseconds = RESOURCE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Resources timed out')), milliseconds);
    Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

export async function waitForPrintResources(doc) {
  await withTimeout(Promise.all([
    doc.fonts?.ready,
    ...[...doc.images].map(image => {
      const loaded = image.complete ? Promise.resolve() : new Promise(resolve => {
        image.addEventListener('load', resolve, { once:true }); image.addEventListener('error', resolve, { once:true });
      });
      return loaded.then(async () => {
        if (!image.naturalWidth) throw Error('Image failed to load');
        if (image.decode) await image.decode();
      });
    }),
  ]));
}

export function openHtmlPrint({ frame, title, language = 'th', opener }) {
  const en = language === 'en';
  const label = (th, english) => en ? english : th;
  if (activePreview?.isConnected) { activePreview.focus(); return; }
  const dialog = document.createElement('dialog');
  dialog.className = 'html-print-dialog'; dialog.dataset.htmlPrintDialog = ''; dialog.dataset.printState = 'loading';
  dialog.setAttribute('aria-labelledby', 'html-print-title');
  dialog.innerHTML = `<header class="html-print-toolbar"><div><h2 id="html-print-title"></h2><p data-print-status role="status"></p></div><div class="html-print-actions"><button type="button" data-print-confirm disabled></button><button type="button" data-print-close></button></div></header><p class="html-print-help"></p><iframe data-html-print-frame sandbox="allow-same-origin allow-modals"></iframe>`;
  const status = dialog.querySelector('[data-print-status]');
  const printButton = dialog.querySelector('[data-print-confirm]');
  const preview = dialog.querySelector('iframe');
  dialog.querySelector('h2').textContent = label('ตัวอย่างก่อนพิมพ์', 'Print preview');
  status.textContent = label('กำลังเตรียมสมการ รูปภาพ และหน้ากระดาษ…', 'Preparing equations, images and pages…');
  printButton.textContent = label('พิมพ์ / บันทึก PDF', 'Print / Save PDF');
  dialog.querySelector('[data-print-close]').textContent = label('กลับไปอ่าน', 'Back to reading');
  dialog.querySelector('.html-print-help').textContent = label('เลือก A4 และบันทึกเป็น PDF ในหน้าต่างพิมพ์ของอุปกรณ์ หากไม่ต้องการ URL/วันที่ ให้ปิดหัวกระดาษและท้ายกระดาษ หน้าตัวอย่างนี้ยังไม่แบ่งหน้า; ตรวจจำนวนหน้าในหน้าต่างพิมพ์อีกครั้ง', 'Choose A4 and Save as PDF in your device’s print dialog. Turn off headers/footers to omit the URL/date. This is a continuous preview; check page breaks in the print dialog.');
  preview.title = title;
  document.body.append(dialog); activePreview = dialog; dialog.showModal();
  const alive = () => dialog.isConnected && dialog.open;
  dialog.addEventListener('close', () => {
    dialog.remove(); if (activePreview === dialog) activePreview = null;
    if (opener?.isConnected) opener.focus({ preventScroll:true });
  }, { once:true });
  dialog.querySelector('[data-print-close]').addEventListener('click', () => dialog.close());
  printButton.addEventListener('click', () => {
    if (dialog.dataset.printState !== 'ready') return;
    try {
      // Deliberately synchronous with the user's click, including on touch devices.
      preview.contentWindow.focus(); preview.contentWindow.print();
    } catch {
      status.textContent = label('เปิดหน้าต่างพิมพ์ไม่ได้ กรุณาลองในเบราว์เซอร์หลักของอุปกรณ์', 'Unable to open printing. Try your device’s main browser.');
    }
  });
  void (async () => {
    try {
      const source = frame.contentDocument;
      if (!frame.isConnected || source?.readyState !== 'complete') throw Error('Reading document not ready');
      await renderHtmlMath(source, { isCurrent: () => alive() && frame.isConnected && frame.contentDocument === source });
      if (!alive()) return;
      if (!frame.isConnected || frame.contentDocument !== source) throw Error('Reading document changed');
      if (['error', 'partial', 'loading'].includes(source.documentElement.dataset.hubMathState)) {
        status.textContent = label('ยังพิมพ์ไม่ได้: สมการบางจุดยังไม่พร้อม กรุณากลับไปตรวจข้อความแจ้งเตือนในหน้าอ่าน', 'Cannot print yet: some equations are not ready. Check the message in the reading window.');
        dialog.dataset.printState = 'error'; return;
      }
      const loaded = new Promise(resolve => {
        const onLoad = () => {
          if (!preview.contentDocument?.documentElement.hasAttribute('data-hub-print-snapshot')) return;
          preview.removeEventListener('load', onLoad); resolve();
        };
        preview.addEventListener('load', onLoad);
      });
      preview.srcdoc = buildHtmlPrintSnapshot(source, title);
      await withTimeout(loaded);
      if (!alive()) return;
      await waitForPrintResources(preview.contentDocument);
      if (!alive()) return;
      // Prevent reference links from replacing the print snapshot.
      preview.contentDocument.addEventListener('click', event => {
        if (event.target.closest?.('a')) event.preventDefault();
      });
      dialog.dataset.printState = 'ready'; printButton.disabled = false;
      status.textContent = label('พร้อมพิมพ์เฉพาะเนื้อหาแล้ว', 'Content is ready to print');
    } catch {
      if (!alive()) return;
      dialog.dataset.printState = 'error';
      status.textContent = label('เตรียมหน้าพิมพ์ไม่สำเร็จ รูปภาพหรือเอกสารอาจโหลดไม่ครบ กรุณากลับไปอ่าน แล้วลองใหม่', 'Print preparation failed. An image or document may be incomplete. Return to reading and try again.');
    }
  })();
}
