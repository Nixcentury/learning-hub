export function alignedMath(rows) {
  const tex = rows.join(String.raw` \\ `)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return String.raw`<div class="worked-equations">\[\begin{aligned}${tex}\end{aligned}\]</div>`;
}
