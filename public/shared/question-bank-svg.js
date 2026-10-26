// Sheet SVG is static artwork. Rebuild a bounded subset, then use an SVG image
// document so defs/markers/IDs stay local to each image, including print clones.
const ns = 'http://www.w3.org/2000/svg';
const tags = new Map('svg g defs symbol use path rect circle ellipse line polyline polygon text tspan title desc marker clipPath linearGradient radialGradient stop'.split(' ').map(tag => [tag.toLowerCase(), tag]));
const presentation = new Set('fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset stroke-opacity opacity color vector-effect paint-order font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing'.split(' '));
const attributes = new Set(('id viewBox preserveAspectRatio x y x1 y1 x2 y2 cx cy r rx ry width height d points transform dx dy rotate textLength lengthAdjust markerWidth markerHeight refX refY orient markerUnits marker-start marker-mid marker-end clip-path clipPathUnits gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity fx fy fr').split(' '));
const canonical = new Map([...attributes].map(name => [name.toLowerCase(), name]));
const idPattern = /^[a-zA-Z_][a-zA-Z0-9_.:-]{0,100}$/;
const number = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const viewBoxPattern = new RegExp(`^\\s*(${number})[\\s,]+(${number})[\\s,]+(${number})[\\s,]+(${number})\\s*$`);
const boxProperties = new Set('width height max-width background background-color border border-radius padding'.split(' '));
const solidColor = /^(?:#[a-f\d]{3,4}|#[a-f\d]{6}|#[a-f\d]{8}|[a-z]+|(?:rgb|rgba|hsl|hsla)\([\d\s,.%+\/-]+\))$/i;
const boxLength = text => {
  const match = /^(\d+(?:\.\d*)?|\.\d+)(px|%|em|rem|pt)?$/.exec(text);
  return Boolean(match && Number(match[1]) <= 100_000 && (match[2] || Number(match[1]) === 0));
};
const fail = () => { throw Error('SVG ต้องเป็นภาพนิ่ง มีขนาดหรือ viewBox และใช้รูปทรง/ข้อความ/การอ้างอิงภายในภาพเท่านั้น / Unsupported static SVG'); };

export function staticBankSvgImage(source, doc) {
  let nodes = 0, characters = 0;
  const ids = new Set(), references = [];
  const boxStyles = new Map();
  function value(name, raw) {
    const text = raw.trim();
    if (text.length > 50_000 || /[<>\\\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) fail();
    if (name === 'id') {
      if (!idPattern.test(text) || ids.has(text)) fail();
      ids.add(text); return text;
    }
    if (/url\s*\(/i.test(text)) {
      if (!['fill', 'stroke', 'clip-path', 'marker-start', 'marker-mid', 'marker-end'].includes(name)) fail();
      const match = /^url\(\s*(['"]?)#([a-zA-Z_][a-zA-Z0-9_.:-]{0,100})\1\s*\)$/i.exec(text);
      if (!match) fail();
      references.push(match[2]); return `url(#${match[2]})`;
    }
    if (/[a-z][a-z0-9+.-]*\s*:/i.test(text) || /(?:@import|expression\s*\(|var\s*\()/i.test(text)) fail();
    return text;
  }
  function copy(element) {
    if (++nodes > 2000) fail();
    const tag = tags.get(element.localName.toLowerCase());
    if (!tag) fail();
    const target = doc.createElementNS(ns, tag);
    for (const attribute of element.attributes) {
      const lower = attribute.name.toLowerCase();
      if (lower === 'xmlns' || lower === 'xmlns:xlink') {
        if (attribute.value !== (lower === 'xmlns' ? ns : 'http://www.w3.org/1999/xlink')) fail();
        continue;
      }
      if (['role', 'aria-label', 'aria-labelledby', 'aria-describedby'].includes(lower)) continue;
      if (lower === 'style') continue; // Explicit presentation declarations below.
      if (lower === 'href' || lower === 'xlink:href') {
        if (tag !== 'use' || !attribute.value.startsWith('#') || !idPattern.test(attribute.value.slice(1))) fail();
        references.push(attribute.value.slice(1)); target.setAttribute('href', attribute.value); continue;
      }
      const name = presentation.has(lower) ? lower : canonical.get(lower);
      if (!name) fail();
      target.setAttribute(name, value(name, attribute.value));
    }
    if (element.hasAttribute('style')) for (const declaration of element.getAttribute('style').split(';')) {
      if (!declaration.trim()) continue;
      const colon = declaration.indexOf(':');
      const name = declaration.slice(0, colon).trim().toLowerCase();
      if (colon < 0 || /!important/i.test(declaration)) fail();
      const text = value(name, declaration.slice(colon + 1));
      if (presentation.has(name)) target.setAttribute(name, text);
      else if (element === source && boxProperties.has(name)) {
        // These declarations frame the whole diagram, rather than drawing SVG
        // shapes. Move only validated, static box styles onto the generated img.
        let allowed = false;
        if (['width', 'height', 'max-width'].includes(name)) allowed = text === 'auto' || boxLength(text);
        else if (['background', 'background-color'].includes(name)) allowed = solidColor.test(text);
        else if (name === 'border') {
          const parts = /^(\S+)\s+(solid|dashed|dotted|double)\s+(.+)$/.exec(text);
          allowed = text === 'none' || Boolean(parts && boxLength(parts[1]) && solidColor.test(parts[3]));
        } else {
          const parts = text.split(/\s+/);
          allowed = parts.length <= 4 && parts.every(boxLength);
        }
        if (!allowed) fail();
        boxStyles.set(name, text);
      } else fail();
    }
    for (const child of element.childNodes) {
      if (child.nodeType === 1) target.append(copy(child));
      else if (child.nodeType === 3) {
        characters += child.textContent.length;
        if (characters > 20_000) fail();
        target.append(doc.createTextNode(child.textContent));
      }
    }
    return target;
  }
  const svg = copy(source);
  if (references.some(id => !ids.has(id))) fail();
  // Disallow recursive <use>, including cycles routed through a parent group.
  // Static diagrams can use shapes/symbols once without unbounded expansion.
  const byId = new Map([...svg.querySelectorAll('[id]')].map(node => [node.id, node]));
  if (svg.id) byId.set(svg.id, svg);
  const visit = (node, stack) => {
    if (stack.has(node)) fail();
    const next = new Set(stack); next.add(node);
    if (node.localName.toLowerCase() === 'use') visit(byId.get(node.getAttribute('href').slice(1)), next);
    for (const child of node.children) visit(child, next);
  };
  // Each <use> can only reference artwork without more <use> nodes. This also
  // bounds repeated symbol expansion even when a reference graph has no cycle.
  for (const use of svg.querySelectorAll('use')) {
    const target = byId.get(use.getAttribute('href').slice(1));
    if (!target || target.localName.toLowerCase() === 'use' || target.querySelector('use')) fail();
  }
  visit(svg, new Set());
  let box = svg.getAttribute('viewBox')?.match(viewBoxPattern)?.slice(1).map(Number);
  if (svg.hasAttribute('viewBox') && !box) fail();
  const dimension = raw => /^(?:\d+(?:\.\d*)?|\.\d+)(?:px)?$/.test(raw || '') ? Number(raw.replace(/px$/, '')) : NaN;
  if (!box) box = [0, 0, dimension(svg.getAttribute('width')), dimension(svg.getAttribute('height'))];
  if (!box.every(Number.isFinite) || box[2] <= 0 || box[3] <= 0 || box.some(n => Math.abs(n) > 100_000)) fail();
  svg.setAttribute('xmlns', ns);
  svg.setAttribute('viewBox', box.join(' '));
  // A percentage-only width has no independent intrinsic size in <img>.
  const width = dimension(svg.getAttribute('width')), height = dimension(svg.getAttribute('height'));
  if (width > 100_000 || height > 100_000) fail();
  svg.setAttribute('width', String(Number.isFinite(width) && width > 0 ? width : box[2]));
  svg.setAttribute('height', String(Number.isFinite(height) && height > 0 ? height : box[3]));
  const serialized = svg.outerHTML;
  if (serialized.length > 250_000) fail();
  const image = doc.createElement('img');
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(serialized);
  image.dataset.bankSvg = '';
  if (boxStyles.size) {
    for (const [name, text] of boxStyles) image.style.setProperty(name, text);
    // Include the frame/padding in the responsive width on narrow screens.
    image.style.maxWidth = '100%';
    image.style.boxSizing = 'border-box';
  }
  image.alt = source.getAttribute('aria-label') || source.querySelector('title')?.textContent.trim() || 'ภาพประกอบ SVG / SVG diagram';
  image.referrerPolicy = 'no-referrer';
  return image;
}
