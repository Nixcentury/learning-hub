import {sampleTrials} from '../physics-double-slit-10-2/paired/lab-sample.mjs';
import {eq, diagram} from './lessons.mjs';

const raw = String.raw;
const math = tex => raw`\(${tex}\)`;
const derivation = tex => `<div class="derivation-line">${math(tex)}</div>`;

export function reviseDoubleSlit(section, key, lang, filled) {
  const t = (th, en) => lang === 'th' ? th : en;
  const para = (th, en) => `<p>${t(th, en)}</p>`;
  if (key === 'observe') {
    section.querySelector('h3').textContent = t('อ่านผลที่วัดจากซิม', 'Interpret the simulation results');
    section.querySelector('h3 + p').textContent = t(
      'ใช้ผลที่กลุ่มวัดไว้แล้วในชุด A และ B ที่ระยะฉาก 1 m เติมช่องความกว้างแถบสว่างกลาง แล้วเทียบทีละคู่',
      'Enter your previous measurements for trials A and B with the screen 1 m away, then compare two trials at a time.');
    const table = section.querySelector('.trial-log');
    table.querySelector('caption')?.remove();
    for (const [i, row] of [...table.querySelectorAll('tr')].entries()) {
      row.children[4].remove();
      if (i === 0) row.lastElementChild.textContent = t('กว้างแถบกลาง (mm)', 'Central width (mm)');
      else if (filled || i >= 3) row.lastElementChild.textContent = sampleTrials[i-1].width;
    }
    table.insertAdjacentHTML('afterend', para(
      'ชุด C และ B ที่ 2 m เป็นผลซิมที่เตรียมไว้ ส่วนค่า A และ B ในฉบับเฉลยเป็นผลตัวอย่าง',
      'Trial C and trial B at 2 m are supplied simulation results. The answer edition gives sample results for A and B.'));
    const prompt = [...section.children].find(e => e.tagName === 'P' && /แบบสุ่ม|สุ่มเรียก|randomly|chosen student/i.test(e.textContent));
    if (prompt) prompt.textContent = t(
      'จดว่าคู่ที่เทียบคงอะไรไว้ และความกว้างแถบสว่างกลางเปลี่ยนอย่างไร อ้างค่าจากตาราง',
      'For each pair, record what was held constant and how the central bright width changed. Cite the measurements.');
  }
  if (key === 'notation-phase') {
    section.querySelector('.geometry-map')?.remove();
    const heading = [...section.querySelectorAll('h3')].find(el => /เฟส|phase/i.test(el.textContent));
    heading.insertAdjacentHTML('afterend', diagram('phase-wave', t(
      'ยอด A ถึงยอด B ห่างกันหนึ่งความยาวคลื่น จึงเท่ากับหนึ่งรอบของเฟส',
      'Crests A and B are one wavelength apart, corresponding to one phase cycle.'), 'phase-wave'));
    heading.nextElementSibling.nextElementSibling.innerHTML = t(
      raw`บนคลื่นไซน์ ยอดติดกันห่างกัน \(\lambda\) เฟสสะสมต่างกัน \(2\pi\) เรเดียน จึงมีเฟสตรงกัน เมื่อแสงเดินทางต่างกัน \(\Delta r\) ให้หาความต่างเฟสจากสัดส่วนนี้`,
      raw`Successive crests are separated by \(\lambda\), an accumulated phase difference of \(2\pi\) radians. They are in phase. Apply this proportion to the optical path difference \(\Delta r\).`);
  }
  if (key === 'spacing-proof') {
    section.querySelector('.proof-diagram')?.remove();
    const intro = section.querySelector('h2 + p');
    intro.outerHTML = `<table class="tbl"><thead><tr><th>${t('สัญลักษณ์', 'Symbol')}</th><th>${t('ความหมายและจุดเริ่มวัด', 'Meaning and endpoints')}</th><th>${t('หน่วย', 'Unit')}</th></tr></thead><tbody>
      <tr><th>${math(raw`\Delta x`)}</th><td>${t('ระยะจากกึ่งกลางแถบสว่างหนึ่งถึงกึ่งกลางแถบสว่างถัดไป', 'Spacing between two adjacent bright centres')}</td><td>m, cm, mm</td></tr>
      <tr><th>${math('W_0')}</th><td>${t('ความกว้างแถบสว่างกลาง วัดจากมืดแรกซ้ายถึงมืดแรกขวา เลขห้อย 0 หมายถึงแถบกลาง', 'Central bright width, from the first dark fringe on the left to the first on the right. The subscript 0 denotes the central fringe.')}</td><td>m, cm, mm</td></tr>
      </tbody></table>`;
    const heading = [...section.querySelectorAll('h3')].find(el => /Simulation|central.*width/i.test(el.textContent));
    heading.insertAdjacentHTML('afterend', diagram('fringe-width', t(
      'ช่วงล่างวัดจากมืดแรกซ้ายถึงมืดแรกขวา ช่วงบนวัดระหว่างกึ่งกลางแถบสว่างติดกัน',
      'The lower bracket spans the two first minima. The upper bracket spans adjacent bright centres.'), 'fringe-width'));
    section.querySelectorAll('.derivation-line').item(4)?.remove();
    const last = section.lastElementChild;
    last.insertAdjacentHTML('beforebegin', eq(15, raw`W_0=2x_{\mathrm D,1}\approx\frac{\lambda L}{d}\approx\Delta x`, filled));
    last.innerHTML = t(
      raw`เฉพาะสลิตคู่เมื่อมุมเล็ก สองปริมาณนี้ได้ค่าใกล้กัน ส่วนระยะสว่างถึงมืดที่ติดกันประมาณ \(\Delta x/2\)`,
      raw`For a double slit at small angles the two widths agree approximately. From a bright centre to the adjacent minimum the distance is about \(\Delta x/2\).`);
  }
  if (key === 'changes-proof') {
    const headings = [...section.querySelectorAll('h3')];
    headings[0].textContent = t('เทียบค่าก่อนและหลังจากสมการ (9) และ (15)', 'Compare before and after with equations (9) and (15)');
    const before = section.querySelector('h2 + p');
    before.innerHTML = t(
      raw`เลขห้อย 1 คือก่อนเปลี่ยน เลขห้อย 2 คือหลังเปลี่ยน ใช้ \(W_0\approx\Delta x\) สำหรับผลซิมใกล้แนวกลาง`,
      raw`Subscripts 1 and 2 denote before and after. Use \(W_0\approx\Delta x\) for the near-axis simulation measurements.`);
    const steps = [...section.querySelectorAll('.derivation-line')];
    steps[0].outerHTML = derivation(raw`W_{0,1}\approx\frac{\lambda_1L_1}{d_1},\qquad W_{0,2}\approx\frac{\lambda_2L_2}{d_2}`);
    steps[1].remove();
    steps[2].outerHTML = derivation(raw`\frac{W_{0,2}}{W_{0,1}}\approx\frac{\lambda_2L_2/d_2}{\lambda_1L_1/d_1}=\frac{\lambda_2}{\lambda_1}\frac{L_2}{L_1}\frac{d_1}{d_2}`);
    headings[2].textContent = t('กลับไปเทียบข้อมูลจากซิมหน้าแรก', 'Return to the simulation data on page 1');
    headings[2].insertAdjacentHTML('afterend', para(
      'A กับ B ที่ 1 m ระยะช่องเพิ่มสองเท่า ความกว้างลดจาก 10.64 เป็น 5.32 mm ในชุดตัวอย่าง ส่วน B ที่ 1 กับ 2 m ระยะฉากเพิ่มสองเท่าและความกว้างเพิ่มจาก 5.32 เป็น 10.64 mm',
      'In the sample, A to B at 1 m doubles the slit separation and the width falls from 10.64 to 5.32 mm. For B at 1 and 2 m, doubling the screen distance increases the width from 5.32 to 10.64 mm.'));
  }
  if (key === 'measurement') {
    const headings = [...section.querySelectorAll('h3')];
    section.querySelector('h2').textContent = t('6 · การวัดระยะและการนับช่วง', '6 · Measuring distances and counting intervals');
    for (let node = headings[3]; node;) {
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }
    headings[1].insertAdjacentHTML('afterend', diagram('three-fringes', t(
      'ขีดตรงกลางแถบสว่างทั้งสาม แล้วลองนับช่วงระหว่างขีด',
      'Mark the three bright centres and count the gaps between the marks.'), 'intervals'));
    const distance = headings[2].nextElementSibling;
    distance.innerHTML = t(
      raw`ให้ \(x_1,x_2\) เป็นพิกัดสองตำแหน่งบนฉาก ซ้ายของแนวกลางใช้พิกัดลบ ขวาใช้พิกัดบวก ระยะห่างคือขนาดของผลต่าง`,
      raw`Let \(x_1,x_2\) be two screen coordinates. Use negative coordinates on the left and positive coordinates on the right. The distance is the magnitude of their difference.`);
    const eq14 = section.querySelector('details:has([data-equation="14"])');
    const after = eq14?.nextElementSibling;
    after?.remove();
    if (eq14) eq14.outerHTML = eq(14, raw`D=|x_2-x_1|`, filled);
  }
  if (key.startsWith('examples-')) {
    for (const n of [5, 11]) {
      const example = section.querySelector(`[data-example-number="${n}"]`);
      if (!example) continue;
      const first = example.querySelector('p');
      if (n === 5) first.insertAdjacentHTML('afterend', diagram('ruler-example', t(
        'กึ่งกลางแถบทั้งหกบนไม้บรรทัด ตำแหน่งเริ่ม 12.5 mm และตำแหน่งสุดท้าย 27.5 mm',
        'Six fringe centres on the scale, from 12.5 mm to 27.5 mm.'), 'intervals'));
      if (n === 11) first.insertAdjacentHTML('afterend', para(
        'กำหนดพิกัดกลางฉากเป็นศูนย์ ทำเครื่องหมายซ้าย–ขวา แล้วใช้ระยะระหว่างสองพิกัดตามหน้า 6',
        'Put the origin at the screen centre, assign signs, and use the two-coordinate distance from page 6.'));
    }
  }
}
