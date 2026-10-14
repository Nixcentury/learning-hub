import { createPdfManifest, createInlinePdfManifest, safePdfLink, selectPdfVariant, pdfDownloadAction } from '../../shared/pdf-content-model.js';

const byId = id => document.getElementById(id);
const controls = byId('pdf-controls'), viewport = byId('pdf-viewport'), stage = byId('pdf-page-stage');
const status = byId('pdf-status'), pageInput = byId('pdf-page'), zoom = byId('pdf-zoom');
const previous = byId('pdf-prev'), next = byId('pdf-next');
const download = byId('pdf-download'), original = byId('pdf-original');
const hub = new URL('../../', location.href);
let pdf, loadingTask, renderTask, currentPage = 1, revision = 0, disposed = false;
let manifest, variant, documentRevision = 0, pdfTimer, downloadAction, downloadBusy = false;
const readingPositions = new Map(), downloadUrls = new Map();
const abort = new AbortController();

function translate() {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'th';
  document.querySelectorAll('[data-th][data-en]').forEach(node => { node.textContent = node.dataset[lang]; });
}
const languageObserver = new MutationObserver(() => {
  translate();
  if (manifest) void selectDocument();
});
languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
function message(th, en, error = false) {
  status.dataset.th = th; status.dataset.en = en;
  status.classList.toggle('is-error', error); status.hidden = !th; translate();
}
function syncControls() {
  pageInput.value = currentPage; previous.disabled = currentPage <= 1; next.disabled = currentPage >= pdf.numPages;
}
async function goToDestination(destination) {
  const documentPdf = pdf, token = documentRevision;
  if (!documentPdf) return;
  try {
    const dest = typeof destination === 'string' ? await documentPdf.getDestination(destination) : destination;
    if (!Array.isArray(dest) || !dest.length) return;
    const index = Number.isInteger(dest[0]) ? dest[0] : await documentPdf.getPageIndex(dest[0]);
    if (token === documentRevision && !disposed) goToPage(index + 1);
  } catch { /* An invalid PDF bookmark must not navigate the Hub. */ }
}
function linkOverlay(annotations, pageViewport, paper) {
  for (const annotation of annotations) {
    if (annotation.subtype !== 'Link' || !Array.isArray(annotation.rect)) continue;
    const href = annotation.url && safePdfLink(annotation.url, variant.source.url);
    if (!href && !annotation.dest) continue;
    const box = pageViewport.convertToViewportRectangle(annotation.rect);
    if (!box.every(Number.isFinite)) continue;
    const link = document.createElement(href ? 'a' : 'button');
    link.className = 'pdf-page-link';
    if (href) { link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.title = href; }
    else { link.type = 'button'; link.title = 'ไปยังหน้าที่อ้างอิง / Go to referenced page'; link.addEventListener('click', () => void goToDestination(annotation.dest)); }
    link.setAttribute('aria-label', link.title);
    Object.assign(link.style, { left: `${Math.min(box[0], box[2])}px`, top: `${Math.min(box[1], box[3])}px`,
      width: `${Math.abs(box[2] - box[0])}px`, height: `${Math.abs(box[3] - box[1])}px` });
    paper.append(link);
  }
}
async function renderPage() {
  if (!pdf || disposed || viewport.clientWidth < 40) return;
  const token = ++revision;
  renderTask?.cancel();
  syncControls();
  message('กำลังแสดงหน้า…', 'Rendering page…');
  try {
    const page = await pdf.getPage(currentPage);
    if (token !== revision || disposed) return;
    const base = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(100, viewport.clientWidth - 32);
    const availableHeight = Math.max(100, viewport.clientHeight - 32);
    const scale = zoom.value === 'width' ? availableWidth / base.width : zoom.value === 'page'
      ? Math.min(availableWidth / base.width, availableHeight / base.height) : Number(zoom.value);
    const view = page.getViewport({ scale: Math.max(.1, Math.min(4, scale)) });
    // Bound canvas memory for tablet browsers; one page is rendered at a time.
    const density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8_000_000 / (view.width * view.height)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(view.width * density); canvas.height = Math.ceil(view.height * density);
    canvas.style.width = `${view.width}px`; canvas.style.height = `${view.height}px`;
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `PDF · ${currentPage} / ${pdf.numPages}`);
    const paper = document.createElement('div'); paper.className = 'pdf-paper'; paper.append(canvas);
    paper.style.width = `${view.width}px`; paper.style.height = `${view.height}px`;
    renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport: view,
      transform: [density, 0, 0, density, 0, 0] });
    await renderTask.promise;
    const annotations = await page.getAnnotations({ intent: 'display' });
    if (token !== revision || disposed) return;
    linkOverlay(annotations, view, paper);
    stage.replaceChildren(paper); stage.dataset.pageNumber = currentPage;
    message('', '');
  } catch (error) {
    if (token !== revision || disposed || error.name === 'RenderingCancelledException') return;
    console.warn('Learning Hub PDF render failed:', error);
    status.dataset.errorDetail = `${error.name}: ${error.message}`.slice(0, 500);
    message('แสดงหน้านี้ไม่สำเร็จ ลองเปลี่ยนหน้า หรือกดเปิดไฟล์ต้นฉบับ', 'This page could not render. Try another page or open the original.', true);
  }
}
function goToPage(value) {
  if (!pdf) return;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1 || page > pdf.numPages) { syncControls(); return; }
  currentPage = page; viewport.scrollTop = 0; viewport.scrollLeft = 0; void renderPage();
}
previous.addEventListener('click', () => goToPage(currentPage - 1));
next.addEventListener('click', () => goToPage(currentPage + 1));
pageInput.addEventListener('change', () => goToPage(pageInput.value));
zoom.addEventListener('change', () => void renderPage());
viewport.addEventListener('keydown', event => {
  if (event.target !== viewport || event.ctrlKey || event.metaKey || event.altKey) return;
  if (['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp'].includes(event.key)) {
    event.preventDefault(); goToPage(currentPage + (['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1));
  }
});
let resizeTimer, lastWidth = 0, lastHeight = 0;
const resizeObserver = new ResizeObserver(() => {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (w < 40 || (w === lastWidth && h === lastHeight)) return;
  lastWidth = w; lastHeight = h;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (['page', 'width'].includes(zoom.value)) void renderPage(); }, 150);
});
resizeObserver.observe(viewport);

function updateDownload() {
  const filename = `${manifest.contentId}${variant.key === 'common' ? '' : '-' + variant.key}.pdf`;
  downloadAction = pdfDownloadAction(variant.source, hub.href, filename);
  original.href = variant.source.originalUrl; original.hidden = false;
  original.dataset.th = variant.source.kind === 'drive' ? 'เปิดใน Google Drive ↗' : 'เปิดไฟล์ต้นฉบับ ↗';
  original.dataset.en = variant.source.kind === 'drive' ? 'Open in Google Drive ↗' : 'Open original ↗';
  download.href = downloadAction.url; download.hidden = false;
  download.removeAttribute('download'); download.removeAttribute('aria-busy');
  if (downloadAction.kind === 'native') download.setAttribute('download', filename);
  const labels = downloadAction.kind === 'provider'
    ? ['ดาวน์โหลดผ่าน Drive ↗', 'Download via Drive ↗']
    : downloadAction.kind === 'blob' && !pdf
      ? ['เปิดไฟล์เพื่อดาวน์โหลด ↗', 'Open file to download ↗']
      : [`ดาวน์โหลด PDF${variant.key === 'common' ? '' : ' · ' + variant.key.toUpperCase()}`,
        `Download PDF${variant.key === 'common' ? '' : ' · ' + variant.key.toUpperCase()}`];
  [download.dataset.th, download.dataset.en] = labels;
  translate();
}

download.addEventListener('click', async event => {
  if (downloadAction?.kind !== 'blob' || !pdf) return;
  event.preventDefault();
  if (downloadBusy) return;
  const documentPdf = pdf, token = documentRevision, filename = downloadAction.filename;
  downloadBusy = true; download.setAttribute('aria-busy', 'true');
  message('กำลังเตรียมไฟล์ดาวน์โหลด…', 'Preparing download…');
  try {
    // Reuse the PDF.js document, including any remaining range requests.
    const bytes = await documentPdf.getData();
    if (token !== documentRevision || disposed) return;
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.target = '_blank'; link.rel = 'noopener noreferrer';
    document.body.append(link); link.click(); link.remove();
    downloadUrls.set(url, setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.delete(url); }, 60000));
    message('', '');
  } catch {
    if (token === documentRevision && !disposed) message(
      'เตรียมไฟล์ดาวน์โหลดไม่สำเร็จ กรุณาเปิดไฟล์ต้นฉบับเพื่อบันทึก',
      'Could not prepare the download. Open the original to save it.', true);
  } finally {
    if (token === documentRevision) { downloadBusy = false; download.removeAttribute('aria-busy'); }
  }
});

async function selectDocument() {
  const selected = selectPdfVariant(manifest, document.documentElement.lang);
  const note = byId('pdf-language-note');
  note.hidden = !selected.fallback;
  note.dataset.th = selected.key === 'en' ? 'ยังไม่มีฉบับไทย กำลังแสดงฉบับอังกฤษ' : 'ยังไม่มีฉบับอังกฤษ กำลังแสดงฉบับไทย';
  note.dataset.en = selected.key === 'en' ? 'Thai is not available. Showing the English edition.' : 'English is not available. Showing the Thai edition.';
  translate();
  if (!selected.source) {
    original.hidden = true; download.hidden = true; controls.hidden = true;
    message('กำลังเตรียมเอกสาร ยังไม่มีลิงก์ PDF', 'Document in preparation. No PDF link yet.');
    return;
  }
  if (variant?.source.url === selected.source.url) { variant = selected; updateDownload(); return; }
  if (pdf && variant) readingPositions.set(variant.source.url, { page: currentPage, zoom: zoom.value });
  const token = ++documentRevision;
  ++revision; renderTask?.cancel(); clearTimeout(pdfTimer);
  const oldTask = loadingTask;
  pdf = undefined; loadingTask = undefined; renderTask = undefined;
  variant = selected; downloadBusy = false;
  const position = readingPositions.get(variant.source.url) || { page: 1, zoom: 'page' };
  currentPage = position.page; zoom.value = position.zoom;
  controls.hidden = true; stage.replaceChildren(); delete stage.dataset.pageNumber;
  viewport.scrollTop = 0; viewport.scrollLeft = 0;
  const drive = variant.source.kind === 'drive', frame = byId('pdf-drive-frame');
  frame.hidden = true; frame.removeAttribute('src');
  viewport.hidden = drive; byId('pdf-drive-note').hidden = !drive;
  updateDownload(); message('กำลังเปิด PDF…', 'Opening PDF…');
  try {
    await oldTask?.destroy().catch(() => {});
    if (token !== documentRevision || disposed) return;
    if (drive) {
      frame.src = selected.source.url; frame.hidden = false;
      // A cross-origin load event cannot prove access or a successful preview.
      message('', ''); return;
    }
    const vendor = new URL('../../vendor/pdfjs-6.4.299/', location.href);
    const pdfjs = await import(new URL('legacy/build/pdf.min.mjs', vendor).href);
    if (token !== documentRevision || disposed) return;
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('legacy/build/pdf.worker.min.mjs', vendor).href;
    const task = pdfjs.getDocument({ url: selected.source.url, withCredentials: false, isEvalSupported: false,
      cMapUrl: new URL('cmaps/', vendor).href, cMapPacked: true,
      standardFontDataUrl: new URL('standard_fonts/', vendor).href,
      wasmUrl: new URL('wasm/', vendor).href, iccUrl: new URL('iccs/', vendor).href });
    loadingTask = task;
    task.onPassword = () => {
      if (token !== documentRevision || disposed) return;
      message('ไฟล์นี้มีรหัสผ่าน กรุณากดเปิดไฟล์ต้นฉบับ', 'This PDF is password protected. Open the original.', true);
      void task.destroy().catch(() => {});
    };
    const timeout = setTimeout(() => {
      if (token !== documentRevision || disposed) return;
      message('โหลด PDF นานเกินไป ลองเปิดไฟล์ต้นฉบับหรือลองใหม่', 'PDF loading timed out. Open the original or retry.', true);
      void task.destroy().catch(() => {});
    }, 30000);
    pdfTimer = timeout;
    let loaded;
    try { loaded = await task.promise; }
    finally { clearTimeout(timeout); }
    if (token !== documentRevision || disposed) return;
    pdf = loaded;
    currentPage = Math.max(1, Math.min(currentPage, pdf.numPages));
    pageInput.max = pdf.numPages; byId('pdf-total').textContent = pdf.numPages; controls.hidden = false;
    updateDownload(); await renderPage();
  } catch {
    if (token === documentRevision && !disposed) showOpenError();
  }
}

function showOpenError() {
  if (!status.classList.contains('is-error')) message(
    'เปิด PDF ไม่สำเร็จ ตรวจลิงก์และสิทธิ์ไฟล์ หรือกดเปิดไฟล์ต้นฉบับ (บางเว็บไม่อนุญาตให้แสดงไฟล์ข้ามเว็บไซต์)',
    'Could not open the PDF. Check its link and access, or open the original. Some hosts block cross-site file loading.', true);
}

async function start() {
  const params = new URLSearchParams(location.search);
  if (params.get('inline') === '1') {
    if (params.has('content')) throw Error('Inline PDF cannot also use a descriptor.');
    const sources = Object.fromEntries(['common', 'th', 'en'].filter(key => params.has(`pdf-${key}`))
      .map(key => [key, params.get(`pdf-${key}`)]));
    manifest = createInlinePdfManifest(sources, params.get('id'), hub.href, hub.href);
    document.title = (params.get(document.documentElement.lang === 'en' ? 'title-en' : 'title-th') || 'PDF · Learning Hub').slice(0, 180);
    if (!disposed) await selectDocument();
    return;
  }
  const source = new URL(params.get('content') || '', hub);
  if (source.origin !== hub.origin || !source.pathname.startsWith(new URL('content/', hub).pathname) ||
      !source.pathname.endsWith('.html') || source.search || source.hash || source.username || source.password ||
      /%(?:2e|2f|5c|25|00)/i.test(source.pathname)) throw Error('Invalid descriptor');
  const timeout = setTimeout(() => abort.abort(), 20000);
  let response, text;
  try {
    response = await fetch(source, { signal: abort.signal, credentials: 'omit' });
    if (!response.ok || response.redirected) throw Error('Descriptor unavailable');
    text = await response.text();
  } finally { clearTimeout(timeout); }
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const attributes = node => Object.fromEntries([...node.attributes].map(a => [a.name, a.value]));
  if (!doc.documentElement.hasAttribute('data-learning-pdf')) throw Error('Missing PDF marker');
  const parsed = createPdfManifest(attributes(doc.documentElement), [...doc.querySelectorAll('a[data-pdf-link]')].map(attributes), source.href, hub.href);
  if (params.has('id') && params.get('id') !== parsed.contentId) throw Error('PDF ID mismatch');
  manifest = parsed;
  if (disposed) return;
  document.title = doc.title || 'PDF · Learning Hub';
  const resources = byId('pdf-resources');
  for (const resource of manifest.resources) {
    const a = document.createElement('a'); a.href = resource.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.dataset.th = resource.titleTh; a.dataset.en = resource.titleEn; resources.append(a);
  }
  resources.hidden = !manifest.resources.length; translate();
  await selectDocument();
}
window.addEventListener('pagehide', () => {
  disposed = true; ++revision; ++documentRevision; abort.abort(); clearTimeout(resizeTimer); clearTimeout(pdfTimer);
  resizeObserver.disconnect(); languageObserver.disconnect(); renderTask?.cancel(); void loadingTask?.destroy().catch(() => {});
  for (const [url, timer] of downloadUrls) { clearTimeout(timer); URL.revokeObjectURL(url); }
  downloadUrls.clear();
});
void start().catch(() => {
  if (!disposed) showOpenError();
});
