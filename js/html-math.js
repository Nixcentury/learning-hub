// Trusted Hub renderer: content frames keep their no-scripts sandbox.
// Only generated SVG/MathML crosses into a reading document, never executable code.
const runtimes = new WeakMap();
const documents = new WeakMap();
const MAX_FORMULAS = 500;
const MAX_TEX_LENGTH = 12000;
const SKIP = 'script, style, noscript, pre, code, textarea, math, mjx-container, [data-no-math], [data-hub-math], [contenteditable="true"]';

export function splitMathText(text) {
  // Delimiters must be in one text node. Single $ stays literal (prices, code).
  const pattern = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
  const parts = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) parts.push({ text: text.slice(offset, match.index) });
    parts.push({ raw: match[0], tex: match[1] ?? match[2] ?? match[3], display: match[1] === undefined });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}

export function mathRuntimeConfig(baseUrl) {
  return {
    loader: { paths: { mathjax: new URL('vendor/mathjax-3.2.2/es5/', baseUrl).href.replace(/\/$/, '') }, load: ['[tex]/mhchem', 'ui/safe'] },
    // No require/autoload/html packages: authored TeX cannot load code or links.
    tex: { packages: ['base', 'ams', 'mhchem'], maxBuffer: MAX_TEX_LENGTH, maxMacros: 1000, tags: 'none' },
    svg: { fontCache: 'local' },
    options: { enableMenu: false, safeOptions: { allow: { URLs: 'none', classes: 'none', cssIDs: 'none', styles: 'none' } } },
    startup: { typeset: false },
  };
}

function getRuntime(host, baseUrl) {
  const win = host.defaultView;
  if (runtimes.has(win)) return runtimes.get(win);
  const state = { queue: Promise.resolve(), ready: null };
  state.ready = new Promise((resolve, reject) => {
    let settled = false;
    const timer = win.setTimeout(() => finish(new Error('Math renderer timed out')), 15000);
    function finish(error) {
      if (settled) return;
      settled = true;
      win.clearTimeout(timer);
      if (error) reject(error); else resolve(win.MathJax);
    }
    win.MathJax = mathRuntimeConfig(baseUrl);
    const script = host.createElement('script');
    script.src = new URL('vendor/mathjax-3.2.2/es5/tex-svg.js', baseUrl).href;
    script.dataset.hubMathRuntime = '';
    script.onerror = () => finish(new Error('Math renderer unavailable'));
    script.onload = () => {
      const math = win.MathJax;
      if (!math?.startup?.promise) return finish(new Error('Math renderer incomplete'));
      math.startup.promise.then(() => finish(math.tex2svgPromise ? null : new Error('Math renderer incomplete')), finish);
    };
    host.head.append(script);
  });
  runtimes.set(win, state);
  return state;
}

const layoutCSS = `
  [data-hub-math] { max-width:100%; }
  [data-hub-math="inline"] { display:inline-block; vertical-align:middle; overflow-x:auto; overflow-y:hidden; }
  [data-hub-math="display"] { display:block; overflow-x:auto; overflow-y:hidden; padding:.55em 0; margin:.4em 0; text-align:center; }
  [data-hub-math] mjx-container { margin:0 !important; }
  [data-hub-math] mjx-container > svg { max-width:none !important; height:initial; }
  [data-hub-math-error] { border-bottom:2px dotted #ae5a12; white-space:pre-wrap; overflow-wrap:anywhere; }
  [data-hub-math-notice] { font:14px/1.6 Tahoma,sans-serif; background:#fff6df; color:#5e4315; padding:10px 16px; margin:0; }
`;

function notice(doc, message) {
  let node = doc.querySelector('[data-hub-math-notice]');
  if (!node) {
    node = doc.createElement('p'); node.dataset.hubMathNotice = '';
    node.setAttribute('role', 'status'); doc.body.prepend(node);
  }
  node.textContent = message;
}

function installStyles(doc, math) {
  let style = doc.querySelector('style[data-hub-math-style]');
  if (!style) { style = doc.createElement('style'); style.dataset.hubMathStyle = ''; doc.head.append(style); }
  const sheet = math?.startup.document.outputJax.styleSheet(math.startup.document);
  style.textContent = (sheet ? math.startup.adaptor.textContent(sheet) : '') + layoutCSS;
}

function copyOutput(doc, output) {
  const copy = doc.importNode(output, true);
  // Defense in depth: the imported renderer output must stay inert.
  copy.querySelectorAll('script, iframe, object, embed, foreignObject, a, image').forEach(node => node.remove());
  for (const node of [copy, ...copy.querySelectorAll('*')]) {
    for (const attr of [...node.attributes]) {
      if (/^on/i.test(attr.name) || ((attr.localName === 'href' || attr.name === 'src') && !attr.value.startsWith('#'))) node.removeAttributeNode(attr);
    }
  }
  return copy;
}

export function renderHtmlMath(doc, { hostDocument = document, baseUrl = location.href, isCurrent = () => true } = {}) {
  if (!doc?.body || !doc.documentElement.hasAttribute('data-learning-html')) return Promise.resolve();
  if (documents.has(doc)) return documents.get(doc);
  const task = renderDocument(doc, hostDocument, baseUrl, isCurrent);
  documents.set(doc, task);
  return task;
}

async function renderDocument(doc, host, baseUrl, isCurrent) {
  const jobs = [];
  const walker = doc.createTreeWalker(doc.body, 4); // SHOW_TEXT, including inline/table text
  let textNode;
  while ((textNode = walker.nextNode())) {
    if (textNode.parentElement?.closest(SKIP)) continue;
    const parts = splitMathText(textNode.data);
    if (parts.some(part => part.tex !== undefined)) jobs.push({ node: textNode, parts });
  }
  if (!jobs.length) { doc.documentElement.dataset.hubMathState = 'none'; return; }
  installStyles(doc);
  doc.documentElement.dataset.hubMathState = 'loading';
  notice(doc, 'กำลังจัดรูปสมการ… / Formatting equations…');
  const runtime = getRuntime(host, baseUrl);
  let math;
  try { math = await runtime.ready; }
  catch {
    if (!isCurrent()) return;
    doc.documentElement.dataset.hubMathState = 'error';
    notice(doc, 'โหลดตัวแสดงสมการไม่สำเร็จ เนื้อหาและสูตรต้นฉบับยังอยู่ กรุณาโหลดหน้า Hub ใหม่ / Equations unavailable; original text preserved. Reload the Hub to retry.');
    return;
  }
  if (!isCurrent()) return;
  installStyles(doc, math);
  let count = 0, errors = 0;
  for (const job of jobs) {
    if (!isCurrent()) return;
    const fragment = doc.createDocumentFragment();
    for (const part of job.parts) {
      if (part.tex === undefined) { fragment.append(doc.createTextNode(part.text)); continue; }
      const wrapper = doc.createElement('span');
      wrapper.dataset.hubMath = part.display ? 'display' : 'inline';
      wrapper.dataset.mathTex = part.tex;
      wrapper.textContent = part.raw;
      try {
        if (++count > MAX_FORMULAS || part.tex.length > MAX_TEX_LENGTH) throw new Error('Formula limit exceeded');
        const size = parseFloat(doc.defaultView.getComputedStyle(job.node.parentElement).fontSize) || 16;
        // MathJax conversions must be serialized across all open reading windows.
        const conversion = runtime.queue.then(async () => {
          if (!isCurrent()) return null;
          math.texReset();
          return math.tex2svgPromise(part.tex, { display: part.display, em: size, ex: size / 2, containerWidth: doc.documentElement.clientWidth || 800 });
        });
        runtime.queue = conversion.catch(() => {});
        const output = await conversion;
        if (!isCurrent()) return;
        if (!output || output.querySelector('[data-mml-node="merror"]')) throw new Error('Invalid TeX');
        wrapper.replaceChildren(copyOutput(doc, output));
      } catch {
        errors += 1;
        wrapper.dataset.hubMathError = '';
        wrapper.title = 'ตรวจรูปแบบ LaTeX ของสูตรนี้ / Check this LaTeX expression';
      }
      fragment.append(wrapper);
    }
    if (!isCurrent()) return;
    job.node.replaceWith(fragment);
  }
  doc.documentElement.dataset.hubMathState = errors ? 'partial' : 'ready';
  if (errors) notice(doc, `มีสูตรที่ยังจัดรูปไม่ได้ ${errors} จุด แสดงสูตรต้นฉบับไว้ให้ตรวจ / ${errors} equation(s) need checking; original notation retained.`);
  else doc.querySelector('[data-hub-math-notice]')?.remove();
}
