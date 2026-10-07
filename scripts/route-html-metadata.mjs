// A non-executing metadata reader, not an HTML renderer. Tags inside comments,
// scripts/styles and quoted attributes cannot become catalog entries.
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
export function decodeMetadata(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (raw, key) => {
    if (!key.startsWith('#')) return named[key.toLowerCase()];
    const number = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : raw;
  });
}

export function readMetadata(source, { strict = false } = {}) {
  const root = { tag: 'root', attrs: {}, children: [], text: '' };
  const optionalEnd = new Set('html head body p li dt dd rt rp option optgroup colgroup thead tbody tfoot tr td th'.split(' '));
  const syntax = (message, offset) => { const error = Error(message); error.line = source.slice(0, offset).split('\n').length; throw error; };
  const stack = [root];
  const tokens = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][a-z0-9:-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+|</gi;
  let rawTag = null, rawOffset = 0;
  for (const match of source.matchAll(tokens)) {
    const token = match[0];
    if (rawTag) { if (new RegExp(`^</${rawTag}\\s*>$`, 'i').test(token)) rawTag = null; continue; }
    if (token.startsWith('<!')) continue;
    const end = token.match(/^<\/([\w:-]+)/);
    if (end) {
      const position = stack.findLastIndex(node => node.tag === end[1].toLowerCase());
      if (strict && position < 1 && !voidTags.has(end[1].toLowerCase())) syntax(`แท็กปิด </${end[1]}> ไม่มีแท็กเปิดที่ตรงกัน`, match.index);
      if (strict && position > 0) {
        const unclosed = stack.slice(position + 1).find(node => !optionalEnd.has(node.tag));
        if (unclosed) syntax(`ลืมปิดแท็ก <${unclosed.tag}> ก่อน </${end[1]}>`, unclosed.offset);
      }
      if (position > 0) stack.length = position;
      continue;
    }
    const start = token.match(/^<([\w:-]+)/);
    if (!start) {
      if (strict && token === '<' && /^\/?[a-z!]/i.test(source.slice(match.index + 1))) syntax('แท็ก HTML เขียนไม่ครบ ตรวจเครื่องหมาย > และเครื่องหมายคำพูด', match.index);
      stack.at(-1).text += decodeMetadata(token); continue;
    }
    const tag = start[1].toLowerCase();
    if (['script', 'style', 'textarea', 'title', 'xmp'].includes(tag)) { rawTag = tag; rawOffset = match.index; continue; }
    const attrs = Object.create(null);
    const attrSource = token.slice(start[0].length).replace(/\/?\s*>$/, '');
    for (const attr of attrSource.matchAll(/([^\s="'<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const key = attr[1].toLowerCase();
      if (Object.hasOwn(attrs, key)) syntax(`Duplicate HTML attribute: ${key}`, match.index);
      attrs[key] = decodeMetadata(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const node = { tag, attrs, children: [], text: '', offset: match.index, line: source.slice(0, match.index).split('\n').length };
    stack.at(-1).children.push(node);
    if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(node);
  }
  if (strict && rawTag) syntax(`ลืมปิดแท็ก <${rawTag}>`, rawOffset);
  const unclosed = stack.slice(1).find(node => !optionalEnd.has(node.tag));
  if (strict && unclosed) syntax(`ลืมปิดแท็ก <${unclosed.tag}>`, unclosed.offset);
  return root;
}

export function metadataNodes(root, predicate, includeTemplates = false) {
  const found = [];
  function walk(node) {
    if (predicate(node)) found.push(node);
    if (node.tag === 'template' && !includeTemplates) return;
    node.children.forEach(walk);
  }
  walk(root);
  return found;
}

export const metadataText = node => (node.text + node.children.map(metadataText).join(' ')).trim();
