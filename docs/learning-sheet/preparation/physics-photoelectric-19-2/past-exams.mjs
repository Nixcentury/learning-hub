import { readFileSync } from 'node:fs';
import { figure, heading, math, p, working } from './notes.mjs';

const m = String.raw;
const source67 = 'https://www.scribd.com/document/959715083/physicsALevel67-1';
const source68 = 'https://assets.mytcas.com/68/answer/tcas68-phy-a-level.pdf#page=18';
const key68 = 'https://assets.mytcas.com/68/alevel/alevel-answers.pdf#page=4';
const source65 = 'https://upload.syntax-online.com/handout_TGAT/Physics2565.pdf#page=24';

function graphImage(filename) {
  return 'data:image/png;base64,' + readFileSync(new URL('./assets/' + filename, import.meta.url)).toString('base64');
}

const graph68 = graphImage('alevel-2568-q22-graph.png');
const graph65 = graphImage('physics-2565-q23-graph.png');

export function pastExams(th, answers) {
  const t = (thai, english) => th ? thai : english;
  const link = (url, label) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
  const source = url => p(link(url, t('ต้นฉบับโจทย์', 'Original exam question')));
  const choices = options => `<ol aria-label="${t('ตัวเลือก', 'Answer choices')}" style="columns:2">${options.map(option => `<li>${option}</li>`).join('')}</ol>`;
  const problem = (n, title, prompt, options, sourceUrl, space, solution) =>
    `<section class="block practice" data-problem="${n}">${heading(n + '. ' + title)}${prompt}${choices(options)}${source(sourceUrl)}
      <div class="task" data-part="1">${answers ? `<div class="teacher-key">${solution}</div>` : `<div class="writing" style="--space:${space}mm"></div>`}</div></section>`;

  const q7 = problem(7, t('A-Level 2567 ข้อ 23', 'A-Level 2024 · Question 23 (2567)'),
  p(t('ฉายแสงพลังงาน 4.0 eV ลงบนแผ่นโลหะตัวอย่าง อิเล็กตรอนที่หลุดมีพลังงานจลน์สูงสุด 1.80 eV ถ้าเปลี่ยนเป็นใช้แสงที่มีพลังงาน 2.0 eV อิเล็กตรอนที่หลุดออกมาจะมีพลังงานจลน์สูงสุดเท่าใด',
    'Light of energy 4.0 eV is incident on a sample metal plate. The electrons emitted have a maximum kinetic energy of 1.80 eV. If the light energy is changed to 2.0 eV, what is the maximum kinetic energy of the emitted electrons?')),
    [t('ไม่มีอิเล็กตรอนหลุดจากแผ่นโลหะ', 'No electrons are emitted from the metal plate.'), '0.6', '1.1', '1.8', '2.2'], source67, 40,
      working(th, [2], [
        m`W=E_{\gamma,1}-K_{\max,1}=4.0\,\mathrm{eV}-1.80\,\mathrm{eV}=2.2\,\mathrm{eV}`,
        m`E_{\gamma,2}=2.0\,\mathrm{eV}\lt W=2.2\,\mathrm{eV}`,
      ], t('ตอบตัวเลือก 1 พลังงานต่อโฟตอนไม่พอให้อิเล็กตรอนหลุด สมการพลังงานจลน์ใช้คำนวณเมื่อมีการหลุด ค่า −0.2 eV ที่ได้จากการลบคือพลังงานที่ขาดอยู่',
        'Choice 1. The photon energy is too low for emission. The kinetic-energy equation applies when emission occurs. Subtracting here gives −0.2 eV, which indicates an energy shortfall.')));

  const q8 = problem(8, t('A-Level 2568 ข้อ 22 ชุด 1', 'A-Level 2025 · Set 1, Question 22 (2568)'),
  p(t('ผลการทดลองโฟโตอิเล็กทริกให้กราฟเส้นตรงระหว่างพลังงานจลน์สูงสุดของโฟโตอิเล็กตรอนกับความถี่ของแสง ดังรูป',
    'A photoelectric experiment gives the straight-line graph shown for the maximum kinetic energy of the photoelectrons against the frequency of the light.')) +
    figure(`<img class="diagram" src="${graph68}" alt="${t('กราฟ KE สูงสุดกับ f ตัดแกนที่ (x, 0) และ (0, −y)', 'Graph of maximum kinetic energy against f, with intercepts (x, 0) and (0, −y)')}">`,
      t('กราฟจากข้อสอบ MyTCAS', 'Graph from the MyTCAS exam.')) +
    p(t('จุดตัดแกนนอนคือ (x, 0) และจุดตัดแกนตั้งคือ (0, −y) โดย x และ y เป็นค่าคงที่บวก',
      'The horizontal and vertical intercepts are (x, 0) and (0, −y), where x and y are positive constants.')) +
    p(t('ค่าคงที่ของแพลงค์ และค่าฟังก์ชันงานของโลหะที่ใช้ในการทดลองนี้เป็นเท่าใดตามลำดับ',
      'What are the Planck constant and the work function of the metal used in the experiment, respectively?')),
    [['x','y'], [m`\tfrac{x}{y}`,'x'], [m`\tfrac{x}{y}`,'y'], [m`\tfrac{y}{x}`,'x'], [m`\tfrac{y}{x}`,'y']]
      .map(pair => pair.map(math).join(t(' และ ', ' and '))), source68, 37,
      working(th, [2], [
        m`h=\frac{\Delta K_{\max}}{\Delta f}=\frac{0-(-y)}{x-0}=\frac{y}{x}`,
        m`-W=-y\quad\Rightarrow\quad W=y`,
        m`W=hf_0=\left(\frac{y}{x}\right)x=y`,
      ], t('ตอบตัวเลือก 5 โดยใช้ความชันและจุดตัดแกน ตรวจซ้ำได้จากสมการ (3)',
        'Choice 5 follows from the slope and intercept. Equation (3) provides the check.')) +
        p(link(key68, t('เฉลยทางการ MyTCAS', 'Official MyTCAS answer key'))));

  const q9 = problem(9, t('9 วิชาสามัญ 2565 ข้อ 23', 'Nine Common Subjects 2022 · Question 23 (2565)'),
  p(t('ฉายคลื่นแม่เหล็กไฟฟ้าที่ความถี่ต่าง ๆ ลงบนผิวโลหะชนิดหนึ่ง แล้วพล็อตกราฟความต่างศักย์หยุดยั้งกับความถี่ดังรูป',
    'Electromagnetic waves at different frequencies are incident on the surface of a metal. The stopping potential is plotted against frequency as shown.')) +
    p(t('กำหนดให้ e คือค่าประจุของอิเล็กตรอน และ h คือค่าคงตัวของพลังค์ในหน่วยจูล·วินาที',
      'Let e be the electron charge and h the Planck constant in joule-seconds.')) +
    figure(`<img class="diagram" style="height:55mm" src="${graph65}" alt="${t('กราฟ Vₛ กับ f มีแนวเส้นตัดแกนตั้งที่ −2 V', 'Graph of Vₛ against f with a vertical intercept at −2 V')}">`,
      t('กราฟจากข้อสอบฉบับ Mathbynutty', 'Graph from the Mathbynutty exam copy.')) +
    p(t('ความถี่ f จะทำให้พลังงานจลน์สูงสุดของโฟโตอิเล็กตรอนมีค่าเท่าไรในหน่วยอิเล็กตรอนโวลต์',
      'At frequency f, what is the maximum kinetic energy of the photoelectrons in electronvolts?')),
    [m`\tfrac{hf}{e}-2`, m`\tfrac{hf}{e}+2`, m`\tfrac{hf}{e}+5`, m`hf-2e`, m`hf+2e`].map(math), source65, 63,
      working(th, [2, 4], [
        m`eV_s=hf-W\quad\Rightarrow\quad V_s=\frac{h}{e}f-\frac{W}{e}`,
        m`-\frac{W}{e}=-2\,\mathrm V\quad\Rightarrow\quad W=e(2\,\mathrm V)=2\,\mathrm{eV}`,
        m`\frac{K_{\max}}{1\,\mathrm{eV}}=\frac{hf}{1.602\times10^{-19}\,\mathrm J}-2`,
      ], t('ตอบตัวเลือก 1 ในวิธีทำใช้ e เป็นขนาดประจุอิเล็กตรอน เมื่อใช้ค่าตัวเลขในหน่วย SI การหารด้วยค่าตัวเลขของ e แปลงพลังงานจาก J เป็น eV ได้ hf/e − 2 ตามตัวเลือก',
        'Choice 1. The derivation uses e as the magnitude of the electron charge. With numerical SI values, dividing by the numerical value of e converts joules to electronvolts, giving hf/e − 2.')) +
        p(t('จุดตัด −2 V มาจากการต่อแนวเส้นไปถึง f = 0 ส่วน Vₛ ในสมการ (4) เป็นขนาดศักย์หยุดยั้งในช่วงที่มีการปล่อยอิเล็กตรอน ที่จุดหยุดยั้งบนกราฟ I–V ของ Simulation ค่า V ที่มีเครื่องหมายเท่ากับ −Vₛ',
          'The −2 V intercept comes from extrapolating to f = 0. Vₛ in equation (4) is the stopping-potential magnitude in the emission regime. At cutoff on the simulation’s I–V graph, the signed voltage V equals −Vₛ.')));

  return answers ? [q7, q8, q9] : [q7 + q8, q9];
}
