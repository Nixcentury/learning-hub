import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseHTML } from 'linkedom';

export const tex = String.raw;

export function isotope(a, z, symbol) {
  return tex`{}^{${a}}_{${String(z).replace('−', '-')}}\mathrm{${symbol}}`;
}

export const math = source => tex`\(${source}\)`;
export const line = source => `<p class="math-line">${math(tex`\displaystyle ${source}`)}</p>`;

export const formulas = {
  a: tex`\sum A_{\mathrm{left}} = \sum A_{\mathrm{right}}`,
  z: tex`\sum Z_{\mathrm{left}} = \sum Z_{\mathrm{right}}`,
  n: tex`n=\frac{t}{T_{1/2}}`,
  f: tex`f=\frac{m_t}{m_0}=\left(\frac{1}{2}\right)^n`,
  decayed: tex`m_{\mathrm{decay}}=m_0-m_t`,
};

// Use the same build-time MathJax SVG rendering as the paired double-slit notes.
// Each distinct expression is rendered once and shared by every document view.
export function createMathRenderer(out) {
  const require = createRequire(new URL('../../../../tools/pdf-authoring/package.json', import.meta.url));
  const { mathjax } = require('mathjax-full/js/mathjax.js');
  const { TeX } = require('mathjax-full/js/input/tex.js');
  const { SVG } = require('mathjax-full/js/output/svg.js');
  const { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor.js');
  const { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html.js');
  require('mathjax-full/js/input/tex/ams/AmsConfiguration.js');

  const adaptor = liteAdaptor();
  RegisterHTMLHandler(adaptor);
  const engine = mathjax.document('', {
    InputJax: new TeX({ packages: ['base', 'ams'] }),
    OutputJax: new SVG({ fontCache: 'none' }),
  });
  const assetPath = 'assets/2-7-radioactive/math/';
  mkdirSync(new URL(assetPath, out), { recursive: true });
  const cache = new Map();

  function asset(source) {
    const saved = cache.get(source);
    if (saved) return saved;
    const output = adaptor.outerHTML(engine.convert(source, { display: false }));
    if (/merror|data-mjx-error/.test(output)) throw Error('Invalid TeX: ' + source);
    const { document } = parseHTML('<html><body>' + output + '</body></html>');
    const svg = document.querySelector('svg');
    const width = svg.getAttribute('width');
    const style = svg.getAttribute('style') ?? '';
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const bytes = svg.outerHTML;
    const name = createHash('sha256').update(bytes).digest('hex').slice(0, 24) + '.svg';
    const src = assetPath + name;
    writeFileSync(new URL(src, out), bytes + '\n');
    const markup = '<img src="' + src + '" alt="" class="math-svg" style="width:' + width + ';height:auto;' + style + '">';
    cache.set(source, markup);
    return markup;
  }

  return function render(html) {
    const { document } = parseHTML('<html><body>' + html + '</body></html>');
    document.body.normalize();
    const nodes = [];
    const walker = document.createTreeWalker(document.body, 4);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const value = node.textContent;
      const matches = [...value.matchAll(/\\\((.*?)\\\)/gs)];
      if (!matches.length) continue;
      let offset = 0;
      const replacement = [];
      for (const match of matches) {
        replacement.push(document.createTextNode(value.slice(offset, match.index)));
        const equation = document.createElement('span');
        equation.className = 'mj-asset';
        equation.setAttribute('role', 'math');
        equation.setAttribute('aria-label', match[1].replace(/^\s*\\displaystyle\s*/, ''));
        equation.dataset.tex = match[1];
        equation.innerHTML = asset(match[1]);
        replacement.push(equation);
        offset = match.index + match[0].length;
      }
      replacement.push(document.createTextNode(value.slice(offset)));
      node.replaceWith(...replacement);
    }
    if (/\\[()]/.test(document.body.textContent)) throw Error('Unrendered TeX in chemistry 2.7');
    return document.body.innerHTML;
  };
}
