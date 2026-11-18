const tex = String.raw;

// Math labels use SVG coordinates and a font size in viewBox units.
function label(x, y, formula, size = 15, anchor = 'middle') {
  return `<text data-tex="${formula}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}"/>`;
}

function fringeStrip(x, y, width, centres, colour = '#8ce0af') {
  return `<rect x="${x}" y="${y}" width="${width}" height="22" rx="4" fill="#192521"/>
    <g fill="${colour}">${centres.map(centre => `<rect x="${centre - 4}" y="${y + 3}" width="8" height="16" rx="3"/>`).join('')}</g>`;
}

function dimension(x1, x2, y, colour = '#444') {
  return `<path d="M${x1} ${y}H${x2}m-5 -3 5 3-5 3M${x1 + 5} ${y - 3}l-5 3 5 3" stroke="${colour}" fill="none" stroke-width="1.4"/>`;
}

function diagram(width, height, caption, drawing) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${caption}">
    <rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" fill="#fff" stroke="#d8ddda"/>
    ${drawing.trim().replace(/^[ \t]+$/gm, "")}
  </svg>`;
}

export function measurementVisual(lang) {
  const caption = lang === 'th'
    ? tex`ห้าแถบมีสี่ช่วง · ระยะระหว่างสองพิกัด · ค่าวัด \(5.2\,\mathrm{mm}\) เทียบกับค่าทฤษฎี \(5.0\,\mathrm{mm}\)`
    : tex`Five centres span four intervals. Middle: distance between signed positions. Right: measurement \(5.2\,\mathrm{mm}\) versus theory \(5.0\,\mathrm{mm}\).`;
  const drawing = `
    <path d="M286 8V96 M573 8V96" stroke="#d8ddda"/>
    ${label(143, 21, tex`(13)\quad N=5`)}
    ${fringeStrip(22, 30, 242, [42, 92, 142, 192, 242])}
    <g fill="none" stroke="#777" stroke-dasharray="2 3"><path d="M42 54v19 M92 54v19 M142 54v19 M192 54v19 M242 54v19"/></g>
    ${[42, 92, 142, 192].map(x => dimension(x + 2, x + 48, 67, '#245b5b')).join('')}
    ${label(42, 90, tex`x_{\mathrm{first}}`)}${label(142, 90, 'N-1=4')}${label(242, 90, tex`x_{\mathrm{last}}`)}
    ${label(430, 21, tex`(14)\quad |x_2-x_1|`)}
    <path d="M302 64H559 M411 49V75" stroke="#555" fill="none"/>
    <path d="M331 48V64 M531 48V64" stroke="#777" stroke-dasharray="2 3"/>
    ${dimension(331, 531, 48, '#245b5b')}${label(431, 41, tex`5\,\mathrm{mm}`)}
    <g fill="#245b5b"><circle cx="331" cy="64" r="3.5"/><circle cx="531" cy="64" r="3.5"/></g>
    ${label(331, 85, 'x_1=-2')}${label(411, 85, '0')}${label(531, 85, 'x_2=+3')}
    ${label(700, 21, '(15)')}
    <path d="M591 66H693" stroke="#555"/><rect x="609" y="37" width="22" height="29" fill="#dce4df" stroke="#4e665c"/>
    <rect x="649" y="35.8" width="22" height="30.2" fill="#689382" stroke="#4e665c"/>
    ${label(620, 85, '5.0')}${label(660, 85, '5.2')}
    ${label(777, 64, tex`\dfrac{0.2}{5.0}\times100\%=4\%`, 16)}`;
  return `<figure class="note-figure compact-visual measurement-visual">${diagram(860, 103, lang === 'th' ? 'แผนภาพการนับช่วง ระยะระหว่างสองพิกัด และการเทียบผลการวัด' : 'Interval count, signed-coordinate separation, and comparison with theory', drawing)}<figcaption>${caption}</figcaption></figure>`;
}

const coincidence = `
  ${fringeStrip(69, 23, 545, [95, 248, 401, 554])}
  ${fringeStrip(69, 65, 545, [95, 286.25, 477.5], '#f0c483')}
  <path d="M95 16V89 M477.5 5V95" stroke="#777" stroke-dasharray="3 3"/>
  <rect x="474" y="25" width="7" height="18" rx="2" fill="none" stroke="#fff" stroke-width="1.5"/>
  <rect x="473.5" y="68" width="8" height="16" rx="3" fill="#f0c483"/>
  ${label(34, 39, tex`\lambda_1`, 18)}${label(34, 81, tex`\lambda_2`, 18)}
  ${[95, 248, 401, 554].map((x, n) => label(x, 17, String(n))).join('')}
  ${label(477.5, 17, tex`\mathrm{D}_3`)}${label(477.5, 60, tex`\mathrm{B}_2`)}
  ${label(733, 55, tex`2.5\lambda_1=2\lambda_2`, 19)}`;

const separation = `
  <path d="M434 14V104" stroke="#777" stroke-dasharray="3 3"/>
  ${label(434, 14, '0')}
  ${[
    {row: 1, y: 34, x1: 518, x2: 560, first: tex`\mathrm{B}_1`, last: tex`\mathrm{D}_2`, distance: 2},
    {row: 2, y: 64, x1: 350, x2: 560, first: tex`\mathrm{B}_1`, last: tex`\mathrm{D}_2`, distance: 10},
    {row: 3, y: 94, x1: 182, x2: 686, first: tex`\mathrm{B}_3`, last: tex`\mathrm{B}_3`, distance: 24},
  ].map(({row, y, x1, x2, first, last, distance}) => `
    <path d="M77 ${y}H761" stroke="#777"/>
    <circle cx="34" cy="${y}" r="9" fill="none" stroke="#777"/>${label(34, y + 4, String(row), 12)}
    <path d="M${x1} ${y - 9}v9 M${x2} ${y - 9}v9" stroke="#777" stroke-dasharray="2 3"/>
    ${dimension(x1, x2, y - 9, '#245b5b')}
    <circle cx="${x1}" cy="${y}" r="3.5" fill="#245b5b"/>
    ${row === 3 ? `<circle cx="${x2}" cy="${y}" r="3.5" fill="#245b5b"/>` : `<rect x="${x2 - 3.5}" y="${y - 3.5}" width="7" height="7" fill="#fff" stroke="#444" stroke-width="1.4"/>`}
    ${label(x1 - 9, y + 11, first)}${label(x2 + 9, y + 11, last)}
    ${label(809, y + 4, tex`${distance}\,\mathrm{mm}`, 16)}
  `).join('')}`;

const angle = `
  <path d="M54 76H519" stroke="#888" stroke-dasharray="6 5"/>
  <path d="M54 76 519 6" stroke="#326dba" stroke-width="2"/>
  <path d="M519 4V89" stroke="#404040" stroke-width="4"/>
  <path d="M120 76a66 66 0 0 0-.7-9.9 M536 8V76m-3-5 3 5 3-5m-6-58 3-5 3 5" stroke="#555" fill="none"/>
  <g fill="#404040"><circle cx="54" cy="76" r="3"/><circle cx="519" cy="76" r="3"/><circle cx="519" cy="6" r="3"/></g>
  ${label(41, 79, 'O')}${label(531, 97, 'C')}${label(547, 17, tex`P\; (\mathrm{B}_2)`, 16, 'start')}
  ${label(131, 72, tex`\theta`)}${label(290, 95, tex`L=0.50\,\mathrm{m}`, 17)}
  ${label(549, 48, tex`x=75.9\,\mathrm{mm}`, 17, 'start')}
  ${label(711, 28, tex`\sin\theta=0.150`, 17, 'start')}
  ${label(711, 56, tex`\theta\approx8.63^\circ`, 17, 'start')}
  ${label(711, 84, tex`x=L\tan\theta`, 17, 'start')}`;

const examples = {
  10: {
    drawing: coincidence, height: 101,
    th: 'แถบมืดอันดับ 3 ของแสงสีแรกซ้อนกับแถบสว่างอันดับ 2 ของแสงสีที่สอง',
    en: 'Dark fringe 3 of the first colour coincides with bright fringe 2 of the second colour.',
  },
  11: {
    drawing: separation, height: 110,
    th: '① ด้านเดียวกัน ② คนละด้าน ③ แถบสว่างอันดับ 3 ซ้ายและขวา',
    en: '① Same side ② Opposite sides ③ Third bright fringes on the left and right',
  },
  12: {
    drawing: angle, height: 103,
    alt: {th: 'มุมเบนของแสงและระยะจากกลางฉากถึงแถบสว่างอันดับสอง', en: 'Angle of the ray and screen distance to the second bright fringe'},
    th: tex`หา \(\theta\) จากเงื่อนไขแทรกสอด แล้วใช้ \(\tan\theta\) หาตำแหน่งบนฉาก`,
    en: tex`Find \(\theta\) from the interference condition, then use \(\tan\theta\) to locate the fringe.`,
  },
};

export function workedVisual(number, lang) {
  const example = examples[number];
  if (!example) return '';
  const caption = example[lang];
  return `<figure class="note-figure compact-visual worked-visual" data-visual-example="${number}">${diagram(860, example.height, example.alt?.[lang] ?? caption, example.drawing)}<figcaption>${caption}</figcaption></figure>`;
}
