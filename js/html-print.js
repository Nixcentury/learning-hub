import { renderHtmlMath } from './html-math.js';
import { defaultPrintProfile, paginatePrintDocument, PrintLayoutError } from './print-layout.js';
import { loadPrintCatalog, readPrintMetadata, resolvePrintMetadata } from './print-metadata.js';
import { learningSheetPrintCSS, resetLearningSheetSnapshot, prepareLearningSheetPrint } from './learning-sheet-print.js';

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
  .hub-print-document svg { max-width:100%; }
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
  // Print only the chosen language; do not paginate the hidden translation.
  clone.querySelectorAll('[data-content-lang][hidden]').forEach(node => node.remove());
  resetLearningSheetSnapshot(clone);
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
  // Keep content-local styles alive when pagination replaces the body children.
  clone.querySelectorAll('body style, body link[rel="stylesheet"]').forEach(node => clone.querySelector('head').append(node));
  clone.querySelectorAll('img').forEach(node => { node.loading = 'eager'; });
  const docTitle = clone.querySelector('title') || source.createElement('title');
  docTitle.textContent = title || source.title || 'Learning Hub';
  clone.querySelector('head').append(docTitle);
  const style = source.createElement('style'); style.dataset.hubPrintStyle = '';
  style.textContent = htmlPrintCSS + (clone.hasAttribute('data-learning-sheet') ? learningSheetPrintCSS : '');
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
  const extraImages = new Set();
  for (const node of doc.querySelectorAll('svg image')) {
    const value = node.getAttribute('href') || node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (value && !value.startsWith('#')) extraImages.add(value);
  }
  for (const node of doc.querySelectorAll('svg use')) {
    const value = node.getAttribute('href') || node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (value && !value.startsWith('#')) throw new PrintLayoutError('external-svg-use', node);
  }
  for (const node of doc.querySelectorAll('*')) {
    const background = doc.defaultView.getComputedStyle(node).backgroundImage;
    for (const match of background.matchAll(/url\(["']?(.*?)["']?\)/g)) if (!match[1].startsWith('#')) extraImages.add(match[1]);
  }
  await withTimeout(Promise.all([
    doc.fonts?.ready,
    ...[...extraImages].map(src => new Promise((resolve, reject) => {
      const image = new doc.defaultView.Image();
      image.onload = resolve; image.onerror = () => reject(Error('Referenced image failed to load')); image.src = src;
    })),
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
  if ([...(doc.fonts || [])].some(font => font.status === 'error') || [...doc.querySelectorAll('link[rel="stylesheet"]')].some(link => !link.sheet)) throw Error('Styles or fonts failed to load');
}

export function openHtmlPrint({ frame, title, language = 'th', opener, context = {} }) {
  const en = language === 'en';
  const label = (th, english) => en ? english : th;
  if (activePreview?.isConnected) { activePreview.focus(); return; }
  const dialog = document.createElement('dialog');
  dialog.className = 'html-print-dialog'; dialog.dataset.htmlPrintDialog = ''; dialog.dataset.printState = 'loading';
  dialog.setAttribute('aria-labelledby', 'html-print-title');
  dialog.innerHTML = `<header class="html-print-toolbar"><div><h2 id="html-print-title"></h2><p data-print-status role="status"></p></div><div class="html-print-actions"><button type="button" data-print-confirm disabled></button><button type="button" data-print-close></button></div></header><details class="html-print-metadata"><summary></summary><div data-print-fields></div><button type="button" data-print-rebuild disabled></button></details><p class="html-print-help"></p><iframe data-html-print-frame sandbox="allow-same-origin allow-modals"></iframe>`;
  const status = dialog.querySelector('[data-print-status]');
  const printButton = dialog.querySelector('[data-print-confirm]');
  const preview = dialog.querySelector('iframe');
  const rebuildButton = dialog.querySelector('[data-print-rebuild]');
  const inputs = {};
  let snapshot = '', revision = 0;
  const isSheet = frame.contentDocument?.documentElement.hasAttribute('data-learning-sheet');
  let editionSelect = null;
  if (isSheet) {
    const field = document.createElement('label'); field.className = 'html-print-edition';
    field.textContent = label('ฉบับที่ต้องการพิมพ์', 'Print edition');
    editionSelect = document.createElement('select'); editionSelect.dataset.sheetPrintEdition = ''; editionSelect.disabled = true;
    for (const [value, th, english] of [['blank', 'ฉบับว่าง — สำหรับจด', 'Blank — for notes'], ['answers', 'ฉบับเฉลย — เนื้อหาครบ', 'Answers — complete content']]) {
      const option = document.createElement('option'); option.value = value; option.textContent = label(th, english); editionSelect.append(option);
    }
    field.append(editionSelect); dialog.querySelector('.html-print-metadata').before(field);
    editionSelect.addEventListener('change', () => { if (snapshot) void buildPages(); });
  }
  dialog.querySelector('summary').textContent = label('ตั้งค่าหน้าพิมพ์และชื่อบนหัว–ท้าย (เฉพาะครั้งนี้)', 'Page layout and labels (this print only)');
  rebuildButton.textContent = label('จัดหน้าใหม่', 'Update pages');
  const profileLabel = document.createElement('label');
  profileLabel.textContent = label('พื้นที่พิมพ์', 'Printable area');
  const profileSelect = document.createElement('select');
  profileSelect.dataset.printProfile = ''; profileSelect.disabled = true;
  for (const [value, th, english] of [['standard', 'A4 มาตรฐาน (คอม / Android)', 'Standard A4 (desktop / Android)'], ['device-margins', 'เผื่อขอบอุปกรณ์ (iPad / iPhone)', 'Reserve device margins (iPad / iPhone)']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = label(th, english); profileSelect.append(option);
  }
  profileSelect.value = defaultPrintProfile(navigator);
  profileLabel.append(profileSelect); dialog.querySelector('[data-print-fields]').append(profileLabel);
  const updateHelp = () => {
    dialog.querySelector('.html-print-help').textContent = profileSelect.value === 'device-margins'
      ? label('ใช้รูปแบบเผื่อขอบอุปกรณ์: เลือก A4 แนวตั้ง ระบบจัดหน้าใหม่โดยไม่ย่อข้อความ Safari อาจยังเติม URL/วันที่ และอาจไม่มีปุ่มปิด ตรวจจำนวนหน้าในหน้าต่างพิมพ์ให้ตรงกับตัวอย่างก่อนยืนยัน', 'Device margins reserved: choose A4 portrait. Text is repaginated, not shrunk. Safari may still add URL/date with no switch to disable them. Compare the native page count with this preview before printing.')
      : label('เลือก A4 แนวตั้ง ขนาด 100% / ขนาดจริง และระยะขอบไม่มี หากมีตัวเลือก ให้ปิดหัว–ท้ายอัตโนมัติ (URL/วันที่) ถ้ามีหน้าว่างแทรก ให้เลือกพื้นที่พิมพ์แบบเผื่อขอบอุปกรณ์แล้วจัดหน้าใหม่', 'Choose A4 portrait, 100% / actual size and no margins. Turn off browser headers/footers if available. If blank pages appear, select Reserve device margins and update pages.');
  };
  profileSelect.addEventListener('change', () => {
    printButton.disabled = true; dialog.dataset.printState = 'stale'; updateHelp();
    status.textContent = label('พื้นที่พิมพ์เปลี่ยนแล้ว กดจัดหน้าใหม่ก่อนพิมพ์', 'Printable area changed. Update pages before printing.');
  });
  for (const [key, th, english] of [['subject','วิชา','Subject'], ['chapter','ชื่อบท','Chapter'], ['topic','ชื่อเรื่อง (เว้นว่างได้)','Topic (optional)'], ['work','ชื่องานย่อย','Work title']]) {
    const field = document.createElement('label'); field.textContent = label(th, english);
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = 240; input.dataset.printField = key; input.disabled = true;
    field.append(input); dialog.querySelector('[data-print-fields]').append(field); inputs[key] = input;
    input.addEventListener('input', () => { printButton.disabled = true; dialog.dataset.printState = 'stale'; status.textContent = label('ชื่อเปลี่ยนแล้ว กดจัดหน้าใหม่ก่อนพิมพ์', 'Labels changed. Update pages before printing.'); });
  }
  dialog.querySelector('h2').textContent = label('ตัวอย่างก่อนพิมพ์', 'Print preview');
  status.textContent = label('กำลังเตรียมสมการ รูปภาพ และหน้ากระดาษ…', 'Preparing equations, images and pages…');
  printButton.textContent = label('พิมพ์ / บันทึก PDF', 'Print / Save PDF');
  dialog.querySelector('[data-print-close]').textContent = label('กลับไปอ่าน', 'Back to reading');
  updateHelp();
  preview.title = title;
  document.body.append(dialog); activePreview = dialog; dialog.showModal();
  const alive = () => dialog.isConnected && dialog.open;
  const fitPreview = () => {
    const doc = preview.contentDocument;
    if (!doc?.body) return;
    const width = doc.documentElement.dataset.hubPrintProfile === 'device-margins' ? 180 : 210;
    doc.documentElement.style.setProperty('--hub-print-scale', String(Math.min(1, Math.max(0.2, (preview.clientWidth - 16) / (width * 96 / 25.4)))));
  };
  const observer = new ResizeObserver(fitPreview); observer.observe(preview);
  dialog.addEventListener('close', () => {
    observer.disconnect(); revision++;
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
  function printError(error) {
    dialog.dataset.printState = 'error'; printButton.disabled = true;
    if (error instanceof PrintLayoutError) {
      const prefix = error.code === 'external-svg-use'
        ? label('SVG อ้างชิ้นส่วนจากไฟล์อื่น: กรุณาใช้ SVG ภายในหน้า หรือรูป SVG ผ่าน img ก่อนพิมพ์', 'External SVG sprites cannot be verified. Use inline SVG or an SVG image before printing.')
        : label('จัดหน้าไม่ได้: มีตาราง รูป ข้อความ หรือชื่อบนหัว–ท้ายใหญ่เกินพื้นที่ กรุณาย่อหรือแบ่งส่วนนี้ก่อนพิมพ์', 'Cannot fit this content on A4. Shorten labels or split the oversized table, image or text block.');
      status.textContent = prefix + (error.detail ? ` — ${error.detail}` : '');
    } else status.textContent = label('เตรียมหน้าพิมพ์ไม่สำเร็จ รูปภาพหรือเอกสารอาจโหลดไม่ครบ กรุณากลับไปอ่าน แล้วลองใหม่', 'Print preparation failed. An image or document may be incomplete. Return to reading and try again.');
  }
  async function buildPages() {
    const token = ++revision;
    dialog.dataset.printState = 'loading'; printButton.disabled = true; rebuildButton.disabled = true;
    preview.style.visibility = 'hidden';
    if (editionSelect) editionSelect.disabled = true;
    profileSelect.disabled = true;
    Object.values(inputs).forEach(input => { input.disabled = true; });
    status.textContent = label('กำลังตรวจรูป สมการ และจัดหน้า A4…', 'Checking resources and arranging A4 pages…');
    try {
      const loaded = new Promise(resolve => {
        const onLoad = () => {
          if (!preview.contentDocument?.documentElement.hasAttribute('data-hub-print-snapshot')) return;
          preview.removeEventListener('load', onLoad); resolve();
        };
        preview.addEventListener('load', onLoad);
      });
      preview.srcdoc = snapshot;
      await withTimeout(loaded);
      if (!alive() || token !== revision) return;
      await waitForPrintResources(preview.contentDocument);
      if (!alive() || token !== revision) return;
      if (isSheet) prepareLearningSheetPrint(preview.contentDocument, editionSelect.value);
      const result = paginatePrintDocument(preview.contentDocument, Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value])), language, { profile:profileSelect.value });
      await waitForPrintResources(preview.contentDocument);
      if (!alive() || token !== revision) return;
      preview.contentDocument.addEventListener('click', event => { if (event.target.closest?.('a')) event.preventDefault(); });
      fitPreview();
      preview.style.visibility = 'visible';
      dialog.dataset.printState = 'ready'; printButton.disabled = false;
      const editionName = isSheet ? (editionSelect.value === 'blank' ? label('ฉบับว่าง · ', 'Blank · ') : label('ฉบับเฉลย · ', 'Answers · ')) : '';
      status.textContent = editionName + label(`พร้อมพิมพ์ ${result.pages} หน้า`, `${result.pages} pages ready to print`);
    } catch (error) { if (alive() && token === revision) printError(error); }
    finally {
      if (alive() && token === revision) {
        rebuildButton.disabled = false; profileSelect.disabled = false;
        if (editionSelect) editionSelect.disabled = false;
        Object.values(inputs).forEach(input => { input.disabled = false; });
      }
    }
  }
  rebuildButton.addEventListener('click', () => { if (snapshot) void buildPages(); });
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
      const catalog = await loadPrintCatalog(document.baseURI);
      if (!alive()) return;
      const metadata = resolvePrintMetadata({ catalog, context, title, language, authored:readPrintMetadata(source, language) });
      Object.entries(metadata).forEach(([key, value]) => { inputs[key].value = value; });
      snapshot = buildHtmlPrintSnapshot(source, title);
      await buildPages();
    } catch (error) {
      if (!alive()) return;
      printError(error);
    }
  })();
}
