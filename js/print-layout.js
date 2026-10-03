import { normalizePrintMetadata } from './print-metadata.js';

// iPadOS can report a desktop Mac user agent. Do not apply this workaround to
// Android tablets or non-touch Macs: their existing full-A4 layout is unchanged.
export function defaultPrintProfile({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  return /iPad|iPhone|iPod/.test(userAgent) || (/Mac/.test(platform) && maxTouchPoints > 1)
    ? 'device-margins' : 'standard';
}

// A conservative *content area*, not a smaller paper size. Native iPad printing
// may reserve its own margins/footer even when a frame asks for @page margin:0.
// Keep the source width (180 mm) and font sizes; repaginate, never clip or scale.
const deviceMarginsCSS = `
  @page { size:A4 portrait; margin:15mm; }
  html, body.hub-print-document { height:auto !important; min-height:0 !important; }
  body.hub-print-document { width:180mm !important; }
  .hub-print-document .hub-print-page { width:180mm !important; height:260mm !important; padding:0 !important; display:block !important; break-inside:avoid !important; page-break-inside:avoid !important; break-after:auto !important; page-break-after:auto !important; }
  .hub-print-document .hub-print-page + .hub-print-page { break-before:page !important; page-break-before:always !important; }
  .hub-print-document .hub-print-page-header { margin-bottom:5mm !important; }
  .hub-print-document .hub-print-page-footer { margin-top:5mm !important; }
`;

// Shared page shell. Content adapters provide a safe, fully rendered snapshot.
// Phase 1 connects reading HTML only; Quiz and simulation adapters remain separate.
// Explicit pages avoid relying on browser support for @page margin-box counters.
export const printPageCSS = `
  @page { size:A4 portrait; margin:0; }
  html { background:white !important; }
  body.hub-print-document { width:210mm !important; max-width:none !important; margin:0 !important; padding:0 !important; }
  .hub-print-document .hub-print-page { box-sizing:border-box !important; width:210mm !important; height:297mm !important; margin:0 !important; padding:12mm 15mm !important; display:grid !important; grid-template-rows:auto minmax(0,1fr) auto !important; gap:5mm !important; background:white !important; color:#172235; border:0 !important; border-radius:0 !important; box-shadow:none !important; break-after:page !important; page-break-after:always !important; }
  .hub-print-document .hub-print-page:last-child { break-after:auto !important; page-break-after:auto !important; }
  .hub-print-document .hub-print-page-body { min-height:0 !important; min-width:0 !important; display:flow-root !important; padding:0 !important; margin:0 !important; border:0 !important; }
  .hub-print-document .hub-print-running { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:4mm !important; min-height:9mm !important; margin:0 !important; padding:0 !important; border:0 !important; background:transparent !important; color:#263242 !important; font:normal 9pt/1.45 Tahoma,Arial,sans-serif !important; letter-spacing:normal !important; text-transform:none !important; }
  .hub-print-document .hub-print-running > span { display:block !important; min-width:0 !important; margin:0 !important; padding:0 !important; font:inherit !important; color:inherit !important; overflow-wrap:anywhere !important; text-align:left !important; }
  .hub-print-document .hub-print-running > span:nth-child(2) { text-align:center !important; }
  .hub-print-document .hub-print-running > span:last-child { text-align:right !important; }
  .hub-print-document .hub-print-page-number { white-space:nowrap !important; font-variant-numeric:tabular-nums; }
  .hub-print-document .hub-print-source { position:absolute !important; left:-100000px !important; top:0 !important; width:180mm !important; visibility:hidden !important; }
  @media screen {
    body.hub-print-document { zoom:var(--hub-print-scale,1); }
    .hub-print-document .hub-print-page { outline:1px solid #ccd2db; }
  }
  @media print { body.hub-print-document { zoom:1 !important; } }
`;

export class PrintLayoutError extends Error {
  constructor(code, node) {
    super(code);
    this.code = code;
    this.detail = (node?.textContent || node?.getAttribute?.('alt') || node?.localName || '').trim().replace(/\s+/g, ' ').slice(0, 100);
  }
}

// Preserve the chosen preview appearance across screen/print media and export.
// These properties must not change after measuring a block for pagination.
function freezeLayout(source) {
  const view = source.ownerDocument.defaultView;
  const properties = ['display', 'box-sizing', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'white-space', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width'];
  const snapshots = [...source.querySelectorAll('*')].filter(node => node.namespaceURI === 'http://www.w3.org/1999/xhtml').map(node => {
    const computed = view.getComputedStyle(node);
    return [node, properties.map(name => [name, computed.getPropertyValue(name)])];
  });
  for (const [node, values] of snapshots) for (const [name, value] of values) node.style.setProperty(name, value, 'important');
}

export function tableRowGroups(rows) {
  const groups = [];
  for (let start = 0; start < rows.length;) {
    let end = start + 1;
    for (let i = start; i < end; i++) {
      for (const cell of rows[i].cells) {
        end = Math.min(rows.length, Math.max(end, cell.rowSpan === 0 ? rows.length : i + cell.rowSpan));
      }
    }
    groups.push(rows.slice(start, end));
    start = end;
  }
  return groups;
}

export function paginatePrintDocument(doc, metadata = {}, language = 'th', { profile = 'standard' } = {}) {
  const deviceMargins = profile === 'device-margins';
  const labels = normalizePrintMetadata(metadata);
  if (doc.body.querySelector('.hub-print-page')) throw new PrintLayoutError('already-paginated');
  const style = doc.createElement('style');
  style.dataset.hubPageStyle = '';
  style.textContent = printPageCSS + (deviceMargins ? deviceMarginsCSS : '');
  doc.head.append(style);
  doc.documentElement.dataset.hubPrintProfile = deviceMargins ? 'device-margins' : 'standard';
  const source = doc.createElement('div');
  source.className = 'hub-print-source';
  source.append(...doc.body.childNodes);
  doc.body.append(source);
  freezeLayout(source);
  const pages = [];
  let page, body, wrappers, items = 0;
  const significant = node => node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim());
  const running = (className, values) => {
    // Divs isolate the shared chrome from authored header/footer element rules.
    const row = doc.createElement('div'); row.className = `hub-print-running ${className}`;
    for (const value of values) { const cell = doc.createElement('span'); cell.textContent = value; row.append(cell); }
    return row;
  };
  function newPage() {
    if (pages.length >= 150) throw new PrintLayoutError('too-many-pages');
    page = doc.createElement('div'); page.className = 'hub-print-page';
    body = doc.createElement('div'); body.className = 'hub-print-page-body';
    const header = running('hub-print-page-header', [labels.subject, labels.chapter, labels.topic]);
    const footer = running('hub-print-page-footer', [labels.work, '999 / 999', 'Nix-century']);
    footer.children[1].className = 'hub-print-page-number';
    page.append(header, body, footer); doc.body.append(page); pages.push(page);
    if (deviceMargins) {
      // A block shell avoids native fragmentation of a full-height CSS grid.
      // Measure both labels (including wraps) before assigning the body budget.
      const gap = parseFloat(doc.defaultView.getComputedStyle(header).marginBottom) + parseFloat(doc.defaultView.getComputedStyle(footer).marginTop);
      const height = page.clientHeight - header.offsetHeight - footer.offsetHeight - gap;
      body.style.setProperty('height', `${Math.floor(height)}px`, 'important');
    }
    wrappers = new Map(); items = 0;
    if (body.clientHeight < 150) throw new PrintLayoutError('metadata-too-long');
  }
  function fits() { return body.scrollHeight <= body.clientHeight + 1 && body.scrollWidth <= body.clientWidth + 1; }
  function target(path) {
    let parent = body;
    for (const ancestor of path) {
      if (!wrappers.has(ancestor)) {
        const copy = ancestor.cloneNode(false);
        parent.append(copy); wrappers.set(ancestor, copy);
      }
      parent = wrappers.get(ancestor);
    }
    return parent;
  }
  function tryAppend(node, path) {
    const copy = node.cloneNode(true);
    target(path).append(copy);
    if (fits()) { items++; return true; }
    copy.remove();
    return false;
  }
  function cleanEmptyWrappers() {
    for (const [original, copy] of [...wrappers].reverse()) {
      if (!copy.childNodes.length) { copy.remove(); wrappers.delete(original); }
    }
  }
  function nextPage() { cleanEmptyWrappers(); newPage(); }
  function placeAtomic(node, path) {
    if (tryAppend(node, path)) return;
    if (items) { nextPage(); if (tryAppend(node, path)) return; }
    throw new PrintLayoutError('block-too-large', node);
  }
  function placeTable(table, path) {
    // Small tables remain whole. Large tables split only between rowspan groups.
    if (tryAppend(table, path)) return;
    const width = table.getBoundingClientRect().width;
    let fragment, section;
    function tablePart() {
      fragment = table.cloneNode(false);
      fragment.style.setProperty('table-layout', 'fixed', 'important');
      for (const child of table.children) if (['caption', 'colgroup', 'thead'].includes(child.localName)) fragment.append(child.cloneNode(true));
      // Fix column widths across continuations, including colspan in the head.
      if (!fragment.querySelector('colgroup') && table.rows.length) {
        const row = [...table.rows].find(row => [...row.cells].every(cell => cell.colSpan === 1));
        if (row && width) {
          const columns = doc.createElement('colgroup');
          for (const cell of row.cells) { const col = doc.createElement('col'); col.style.width = `${cell.getBoundingClientRect().width / width * 100}%`; columns.append(col); }
          fragment.prepend(columns);
        }
      }
      target(path).append(fragment); section = null;
    }
    tablePart();
    for (const originalSection of [...table.children].filter(node => ['tbody', 'tfoot'].includes(node.localName))) {
      for (const group of tableRowGroups([...originalSection.rows])) {
        if (!section || section.localName !== originalSection.localName) { section = originalSection.cloneNode(false); fragment.append(section); }
        let copies = group.map(row => row.cloneNode(true)); section.append(...copies);
        if (!fits()) {
          copies.forEach(row => row.remove());
          if (!section.children.length) section.remove();
          if (![...fragment.querySelectorAll('tbody, tfoot')].some(node => node.children.length)) fragment.remove();
          if (!items) throw new PrintLayoutError('table-row-too-large', group[0]);
          nextPage(); tablePart();
          section = originalSection.cloneNode(false); fragment.append(section);
          copies = group.map(row => row.cloneNode(true)); section.append(...copies);
          if (!fits()) throw new PrintLayoutError('table-row-too-large', group[0]);
        }
        items++;
      }
    }
  }
  // Paragraphs taller than a sheet split by word/grapheme boundaries, preserving
  // inline markup with DOM Range. Never split SVG, equations, images or tables.
  function placeLongText(node, path) {
    const text = node.textContent;
    const walker = doc.createTreeWalker(node, 4);
    const nodes = []; let entry, offset = 0;
    while ((entry = walker.nextNode())) { nodes.push({ node:entry, start:offset, end:offset + entry.length }); offset += entry.length; }
    const segmenter = new Intl.Segmenter(language, { granularity:'grapheme' });
    const stops = [...segmenter.segment(text)].map(part => part.index + part.segment.length);
    function slice(start, end) {
      const range = doc.createRange();
      const a = nodes.find(item => item.end > start), b = nodes.find(item => item.end >= end);
      range.setStart(a.node, start - a.start); range.setEnd(b.node, end - b.start);
      const part = node.cloneNode(false); part.append(range.cloneContents()); return part;
    }
    let start = 0;
    while (start < text.length) {
      const remaining = slice(start, text.length);
      if (tryAppend(remaining, path)) break;
      const choices = stops.filter(stop => stop > start);
      let low = 0, high = choices.length - 1, best = -1;
      while (low <= high) {
        const mid = (low + high) >> 1, probe = slice(start, choices[mid]);
        target(path).append(probe); const ok = fits(); probe.remove();
        if (ok) { best = mid; low = mid + 1; } else high = mid - 1;
      }
      if (best < 0) {
        if (!items) throw new PrintLayoutError('block-too-large', node);
        nextPage(); continue;
      }
      let end = choices[best];
      // Prefer a nearby word boundary without sacrificing most of the page.
      const words = [...new Intl.Segmenter(language, { granularity:'word' }).segment(text.slice(start, end))];
      if (words.length > 1) { const cut = start + words.at(-1).index; if (cut > start + (end - start) * 0.8) end = cut; }
      placeAtomic(slice(start, end), path); start = end;
      if (start < text.length) nextPage();
    }
  }
  function walk(node, path) {
    if (!significant(node)) return;
    if (node.nodeType !== 1) { const p = doc.createElement('p'); p.textContent = node.textContent; placeAtomic(p, path); return; }
    if (doc.defaultView.getComputedStyle(node).display === 'none') return;
    if (node.matches('table')) { placeTable(node, path); return; }
    if (node.matches('[data-print-keep], svg, img, figure, [data-hub-math], mjx-container')) { placeAtomic(node, path); return; }
    const children = [...node.childNodes].filter(significant);
    const blockContainer = node.matches('main, article, section, div, header, footer, ol, ul, blockquote') &&
      children.some(child => child.nodeType === 1 && /^(block|flow-root|list-item)/.test(doc.defaultView.getComputedStyle(child).display));
    if (blockContainer) {
      let number = Number(node.getAttribute('start')) || (node.hasAttribute('reversed') ? node.children.length : 1);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (node.localName === 'ol' && child.localName === 'li') {
          if (child.hasAttribute('value')) number = Number(child.getAttribute('value'));
          child.setAttribute('value', String(number)); number += node.hasAttribute('reversed') ? -1 : 1;
        }
        // Keep a heading with at least the beginning of what follows it.
        if (child.nodeType === 1 && child.matches('h1,h2,h3,h4,h5,h6') && children[i + 1] && items) {
          const probe = child.cloneNode(true), spacer = doc.createElement('div'); spacer.style.height = '18mm';
          target([...path, node]).append(probe, spacer); const ok = fits(); probe.remove(); spacer.remove();
          if (!ok) nextPage();
        }
        walk(child, [...path, node]);
      }
      return;
    }
    if (tryAppend(node, path)) return;
    if (items) { nextPage(); if (tryAppend(node, path)) return; }
    if (node.matches('p,li,blockquote,pre') && node.textContent && !node.querySelector('svg,img,table,mjx-container,[data-hub-math],[data-sheet-slot],br')) placeLongText(node, path);
    else throw new PrintLayoutError('block-too-large', node);
  }
  newPage();
  for (const node of [...source.childNodes]) walk(node, []);
  cleanEmptyWrappers();
  source.remove();
  pages.forEach((sheet, index) => {
    sheet.dataset.printPage = String(index + 1);
    sheet.querySelector('.hub-print-page-number').textContent = `${language === 'en' ? 'Page' : 'หน้า'} ${index + 1} / ${pages.length}`;
  });
  // Never hide overflow: stop and explain unsupported content instead of losing it.
  for (const sheet of pages) {
    const content = sheet.querySelector('.hub-print-page-body');
    if (content.scrollHeight > content.clientHeight + 1 || content.scrollWidth > content.clientWidth + 1) throw new PrintLayoutError('page-overflow', content);
    if (sheet.scrollHeight > sheet.clientHeight + 1 || sheet.scrollWidth > sheet.clientWidth + 1) throw new PrintLayoutError('page-overflow', sheet);
  }
  doc.documentElement.dataset.hubPrintPages = String(pages.length);
  return { pages:pages.length };
}
