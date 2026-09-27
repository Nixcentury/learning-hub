import test from 'node:test';
import assert from 'node:assert/strict';
import { safePrintUrl, htmlPrintCSS } from '../js/html-print.js';

test('print image/style references resolve from the source chapter, not the Hub', () => {
  const base = 'https://example.test/learning-hub/content/chemistry/acid-base/overview.html';
  assert.equal(safePrintUrl('images/ice.svg', base), 'https://example.test/learning-hub/content/chemistry/acid-base/images/ice.svg');
  assert.equal(safePrintUrl('#MJX-1', base), '#MJX-1');
  assert.equal(safePrintUrl('data:image/png;base64,AAAA', base), 'data:image/png;base64,AAAA');
});

test('print snapshots reject executable and local-file URL schemes', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>x</script>', 'file:///private.txt', 'vbscript:x']) {
    assert.equal(safePrintUrl(value, 'https://example.test/'), '');
  }
});

test('print layout separates long sections but keeps equations and table rows together', () => {
  assert.match(htmlPrintCSS, /@page\s*\{ size:A4; margin:15mm/);
  assert.match(htmlPrintCSS, /section[^\n]*break-inside:auto !important/);
  assert.match(htmlPrintCSS, /data-hub-math="display"[^\n]*break-inside:avoid/);
  assert.match(htmlPrintCSS, /thead[^\n]*table-header-group/);
});
