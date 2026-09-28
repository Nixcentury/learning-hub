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

export function readMetadata(source) {
  const root = { tag: 'root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const tokens = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][a-z0-9:-]*(?:[^"'<>]|"[^"]*"|'[^']*')*>|[^<]+|</gi;
  let rawTag = null;
  for (const match of source.matchAll(tokens)) {
    const token = match[0];
    if (rawTag) { if (new RegExp(`^</${rawTag}\\s*>$`, 'i').test(token)) rawTag = null; continue; }
    if (token.startsWith('<!')) continue;
    const end = token.match(/^<\/([\w:-]+)/);
    if (end) {
      const position = stack.findLastIndex(node => node.tag === end[1].toLowerCase());
      if (position > 0) stack.length = position;
      continue;
    }
    const start = token.match(/^<([\w:-]+)/);
    if (!start) { stack.at(-1).text += decodeMetadata(token); continue; }
    const tag = start[1].toLowerCase();
    if (['script', 'style', 'textarea', 'title', 'xmp'].includes(tag)) { rawTag = tag; continue; }
    const attrs = Object.create(null);
    const attrSource = token.slice(start[0].length).replace(/\/?\s*>$/, '');
    for (const attr of attrSource.matchAll(/([^\s="'<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const key = attr[1].toLowerCase();
      if (Object.hasOwn(attrs, key)) throw Error(`Duplicate HTML attribute: ${key}`);
      attrs[key] = decodeMetadata(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    const node = { tag, attrs, children: [], text: '' };
    stack.at(-1).children.push(node);
    if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(node);
  }
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
