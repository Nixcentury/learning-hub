import test from 'node:test';
import assert from 'node:assert/strict';
import { splitMathText, mathRuntimeConfig } from '../js/html-math.js';

test('inline, display and multiline TeX preserve surrounding Thai text', () => {
  const parts = splitMathText(String.raw`ค่าคงที่ \(K_a\) และ \[\frac{x^2}{C-x}\] จบ`);
  assert.deepEqual(parts, [
    { text: 'ค่าคงที่ ' }, { raw: String.raw`\(K_a\)`, tex: 'K_a', display: false },
    { text: ' และ ' }, { raw: String.raw`\[\frac{x^2}{C-x}\]`, tex: String.raw`\frac{x^2}{C-x}`, display: true }, { text: ' จบ' },
  ]);
  assert.equal(splitMathText('\\[a\n+b\\]')[0].tex, 'a\n+b');
});

test('chemistry and adjacent equations remain distinct', () => {
  const parts = splitMathText(String.raw`\(\ce{SO4^2-}\)\(x\)$$y$$`);
  assert.equal(parts.length, 3);
  assert.equal(parts[0].tex, String.raw`\ce{SO4^2-}`);
  assert.equal(parts[2].display, true);
});

test('prices, incomplete delimiters and ordinary HTML text remain literal', () => {
  for (const value of ['$5 and $10', String.raw`\(unfinished`, 'pH = 7', String.raw`\[missing`]) {
    assert.deepEqual(splitMathText(value), [{ text: value }]);
  }
  assert.deepEqual(splitMathText(''), []);
});

test('runtime is local, pinned, package-limited and never typesets the Hub shell', () => {
  const config = mathRuntimeConfig('https://nixcentury.github.io/learning-hub/?v=123#chemistry');
  assert.equal(config.loader.paths.mathjax, 'https://nixcentury.github.io/learning-hub/vendor/mathjax-3.2.2/es5');
  assert.deepEqual(config.tex.packages, ['base', 'ams', 'mhchem']);
  assert.equal(config.startup.typeset, false);
  assert.equal(config.svg.fontCache, 'local');
  assert.equal(config.options.safeOptions.allow.URLs, 'none');
});
