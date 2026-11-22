// Plots use the same coordinates and units as the accompanying questions.
const ink = '#213c51';
function svg(label, body, height = 216) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 ${height}" role="img" aria-label="${label}" class="diagram"><title>${label}</title><g fill="${ink}" font-family="Arial,Noto Sans Thai,sans-serif" font-size="16">${body}</g></svg>`;
}

export function tube(th) {
  return svg(th ? 'หลอดสุญญากาศของแล็บ' : 'The lab vacuum tube', `
    <path d="M118 94V143H257M323 143H462V94" fill="none" stroke="${ink}" stroke-width="2"/>
    <rect x="91" y="43" width="398" height="65" rx="30" fill="#eaf3f8" stroke="${ink}" stroke-width="2"/>
    <path d="M118 56v37m344-37v37" stroke="${ink}" stroke-width="7"/>
    <path d="M196 19L127 65M165 16L126 43" stroke="#59419b" stroke-width="4"/>
    <text x="207" y="25">${th ? 'แสงตกกระทบ' : 'Incident light'}</text>
    <text x="129" y="126">${th ? 'ขั้วปล่อย' : 'Emitter'}</text>
    <text x="451" y="126" text-anchor="end">${th ? 'ขั้วรับ' : 'Collector'}</text>
    <circle cx="290" cy="143" r="27" fill="white" stroke="${ink}" stroke-width="2"/>
    <text x="290" y="149" text-anchor="middle">µA</text>`, 174);
}

function plot(label, { xDomain, yDomain, xs, ys, xlabel, ylabel, lines, points = [], labels = [] }) {
  const x = n => 65 + 470 * (n - xDomain[0]) / (xDomain[1] - xDomain[0]);
  const y = n => 173 - 140 * (n - yDomain[0]) / (yDomain[1] - yDomain[0]);
  const place = (a, b) => `${x(a).toFixed(2)},${y(b).toFixed(2)}`;
  const path = ({ coords, color = ink, dashed = false }) => `<polyline points="${coords.map(([a,b]) => place(a,b)).join(' ')}" fill="none" stroke="${color}" stroke-width="2.4"${dashed ? ' stroke-dasharray="5 4"' : ''}/>`;
  return svg(label, `
    ${ys.map(n => `<path d="M65 ${y(n)}H535" stroke="#d5e0e9"/><text x="57" y="${y(n) + 5}" text-anchor="end">${n}</text>`).join('')}
    ${xs.map(n => `<path d="M${x(n)} 33V173" stroke="#e2eaf0"/><text x="${x(n)}" y="194" text-anchor="middle">${n}</text>`).join('')}
    <path d="M65 33V173H535" fill="none" stroke="${ink}" stroke-width="1.8"/>
    <text x="61" y="24">${ylabel}</text><text x="535" y="212" text-anchor="end">${xlabel}</text>
    ${lines.map(path).join('')}
    ${points.map(([a,b]) => `<circle cx="${x(a)}" cy="${y(b)}" r="3.8" fill="${ink}"/>`).join('')}
    ${labels.map(([a,b,name]) => `<text x="${x(a)}" y="${y(b)}">${name}</text>`).join('')}`, 216);
}

const thresholdTitles = {
  th: 'กราฟพลังงานจลน์สูงสุดกับความถี่ของโลหะในแล็บ',
  en: 'Maximum kinetic energy versus frequency for the lab metals',
};
export function thresholds(th, lab) {
  const colors = ['#1c547a','#7c3b79','#985721'];
  const metals = Object.keys(lab.metals);
  return plot(thresholdTitles[th ? 'th' : 'en'], {
    xDomain: [5.5, 10], yDomain: [0, 1.75], xs: [6,7,8,9,10], ys: [0,.5,1,1.5],
    xlabel: 'f (10¹⁴ Hz)', ylabel: 'Kₘₐₓ (eV)',
    lines: metals.map((metal, index) => ({ color: colors[index], coords: [[lab.thresholdFrequency(metal),0],[10,10*lab.hScaled-lab.metals[metal]]] })),
    labels: metals.map(metal => [9.6,9.6*lab.hScaled-lab.metals[metal]+.13,metal]),
  });
}

export function teachingIV(th, rows) {
  return plot(th ? 'กราฟกระแสกับความต่างศักย์ ชุดสอน' : 'Current versus voltage for the teaching setup', {
    xDomain: [-.75,1.1], yDomain: [0,2.35], xs: [-.5,-.25,0,.5,1], ys: [0,.5,1,1.5,2],
    xlabel: 'V (V)', ylabel: 'I (µA)', lines: [{coords:[[-.75,0],[-.5,0],[0,2],[1.1,2]]}], points:rows,
  });
}

export function practiceIV(th) {
  const points = [[-.8,0],[-.7,0],[-.6,.3],[-.4,.9],[-.2,1.5],[0,2.1],[.2,2.1]];
  return plot(th ? 'กราฟกระแสกับความต่างศักย์สำหรับข้อ 5' : 'Current versus voltage for question 5', {
    xDomain: [-.8,.2], yDomain: [0,2.5], xs: [-.8,-.6,-.4,-.2,0,.2], ys: [0,.5,1,1.5,2,2.5],
    xlabel: 'V (V)', ylabel: 'I (µA)', lines: [{coords:points}], points,
  });
}

export function practiceEnergy(th) {
  return plot(th ? 'กราฟพลังงานจลน์สูงสุดกับความถี่สำหรับข้อ 6' : 'Maximum kinetic energy versus frequency for question 6', {
    xDomain: [0,12], yDomain: [-3,3], xs: [0,2,4,6,8,10,12], ys: [-3,-2,-1,0,1,2,3],
    xlabel: 'f (10¹⁴ Hz)', ylabel: 'Kₘₐₓ (10⁻¹⁹ J)',
    lines: [
      {coords:[[0,0],[12,0]],color:'#71879b'},
      {coords:[[0,-2.64],[4,0]],dashed:true},
      {coords:[[4,0],[8,2.64]]},
    ], points: [[4,0],[6,1.32],[8,2.64]],
    labels: [[6.2,1.22,'(6.00, 1.32)'],[8.2,2.55,'(8.00, 2.64)']],
  });
}

export function stoppingGrid(th, { classroom, filled, points, crossing, intercept }) {
  const end = points.at(-1);
  return plot(th ? 'กราฟศักย์หยุดยั้งกับความถี่' : 'Stopping potential versus frequency', {
    xDomain: [0, classroom ? 9 : 8],
    yDomain: [classroom ? -2.7 : -1.8, 1.4],
    xs: classroom ? [0,1,2,3,4,5,6,7,8,9] : [0,1,2,3,4,5,6,7,8],
    ys: classroom ? [-2.5,-2,-1.5,-1,-.5,0,.5,1] : [-1.5,-1,-.5,0,.5,1],
    xlabel: 'f (10¹⁴ Hz)', ylabel: 'Vₛ (V)',
    lines: [
      {coords:[[0,0],[classroom ? 9 : 8,0]],color:'#71879b'},
      ...(filled ? [{coords:[[0,intercept],[crossing,0]],dashed:true},{coords:[[crossing,0],end]}] : []),
    ],
    points: filled ? points : [],
  });
}
