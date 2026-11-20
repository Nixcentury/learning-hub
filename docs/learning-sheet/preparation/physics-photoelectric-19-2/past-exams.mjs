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
  const problem = (n, title, intro, parts) => `<section class="block practice" data-problem="${n}">${heading(n + '. ' + title)}${intro}${parts.map(([prompt, space, solution], i) =>
    `<div class="task" data-part="${i+1}">${p(t(['ก.', 'ข.'], ['a.', 'b.'])[i] + ' ' + prompt)}${answers ? `<div class="teacher-key">${solution}</div>` : `<div class="writing" style="--space:${space}mm"></div>`}</div>`).join('')}</section>`;

  const q7 = problem(7, t('A-Level 2567 ข้อ 23 · พลังงานพอให้อิเล็กตรอนหลุดไหม',
    'A-Level 2024 Question 23 · Is there enough energy for emission?'),
  p(t('เมื่อฉายแสงที่มีพลังงานต่อโฟตอน 4.0 eV บนโลหะ อิเล็กตรอนที่หลุดมีพลังงานจลน์สูงสุด 1.80 eV จากนั้นเปลี่ยนไปใช้โฟตอนพลังงาน 2.0 eV บนโลหะเดิม',
    'Light with 4.0 eV per photon illuminates a metal. The maximum kinetic energy of the emitted electrons is 1.80 eV. The same metal is then illuminated with 2.0 eV photons.')) +
    choices([t('ไม่มีอิเล็กตรอนหลุด', 'No electrons are emitted.'), '0.6 eV', '1.1 eV', '1.8 eV', '2.2 eV']) + source(source67), [
    [
      t('เมื่อใช้โฟตอน 2.0 eV ผลตรงกับตัวเลือกใด? แสดงวิธีหาฟังก์ชันงานและใช้ค่านั้นตัดสิน',
        'Which choice describes what happens with 2.0 eV photons? Find the work function and use it to justify your answer.'),
      23,
      working(th, [2], [
        m`W=E_{\gamma,1}-K_{\max,1}=4.0\,\mathrm{eV}-1.80\,\mathrm{eV}=2.2\,\mathrm{eV}`,
        m`E_{\gamma,2}=2.0\,\mathrm{eV}&lt;W=2.2\,\mathrm{eV}`,
      ], t('ตอบตัวเลือก 1 พลังงานต่อโฟตอนไม่พอให้อิเล็กตรอนหลุด สมการพลังงานจลน์ใช้คำนวณเมื่อมีการหลุด ค่า −0.2 eV ที่ได้จากการลบคือพลังงานที่ขาดอยู่',
        'Choice 1. The photon energy is too low for emission. The kinetic-energy equation applies when emission occurs. Subtracting here gives −0.2 eV, which indicates an energy shortfall.')),
    ],
    [
      t('คำถามต่อยอดจาก Simulation เมื่อมิเตอร์อ่านศูนย์ ให้คงแสงเดิมและเพิ่มศักย์ขั้วรับจนช่วยดึงอิเล็กตรอน เทียบผลระหว่างแสง 2.0 eV กับแสง 4.0 eV ที่เริ่มต้นด้วยแรงดันต้านจนกระแสเป็นศูนย์',
        'Simulation follow-up. A meter reads zero. Keep the light fixed and raise the collector potential to attract electrons. Compare the result with 2.0 eV light and with 4.0 eV light initially stopped by a retarding voltage.'),
      22,
      p(t('เมื่อใช้โฟตอน 2.0 eV มิเตอร์ยังอ่านศูนย์ เพราะพลังงานต่อโฟตอนต่ำกว่า W เมื่อใช้โฟตอน 4.0 eV อิเล็กตรอนหลุดได้อยู่แล้ว พอขั้วรับช่วยดึง อิเล็กตรอนจึงไปถึงขั้วรับและวัดกระแสได้',
        'With 2.0 eV photons, the reading stays zero because each photon has less energy than W. With 4.0 eV photons, electrons are already being emitted. Switching to a collecting voltage lets them reach the collector, so the meter detects current.')),
    ],
  ]);

  const q8 = problem(8, t('A-Level 2568 ข้อ 22 ชุด 1 · กราฟพลังงานจลน์สูงสุด',
    'A-Level 2025 Set 1 Question 22 · Maximum kinetic energy graph'),
  p(t('กราฟแสดงความสัมพันธ์ระหว่างพลังงานจลน์สูงสุดของโฟโตอิเล็กตรอนกับความถี่แสง จุดตัดแกนคือ (x, 0) และ (0, −y) โดย x และ y เป็นค่าบวก',
    'The graph plots the maximum kinetic energy of photoelectrons against light frequency. The intercepts are (x, 0) and (0, −y), where x and y are positive.')) +
    figure(`<img class="diagram" src="${graph68}" alt="${t('กราฟ KE สูงสุดกับ f ตัดแกนที่ (x, 0) และ (0, −y)', 'Graph of maximum kinetic energy against f, with intercepts (x, 0) and (0, −y)')}">`,
      t('กราฟจากข้อสอบ MyTCAS', 'Graph from the MyTCAS exam.')) +
    choices([m`(x,\,y)`, m`(\tfrac{x}{y},\,x)`, m`(\tfrac{x}{y},\,y)`, m`(\tfrac{y}{x},\,x)`, m`(\tfrac{y}{x},\,y)`].map(math)) + source(source68), [
    [
      t('จงหาค่าคงที่ของพลังค์และฟังก์ชันงานของโลหะตามลำดับ พร้อมแสดงวิธีอ่านจากกราฟ',
        'Find the Planck constant and the metal’s work function, in that order. Show how you obtain them from the graph.'),
      30,
      working(th, [2], [
        m`h=\frac{\Delta K_{\max}}{\Delta f}=\frac{0-(-y)}{x-0}=\frac{y}{x}`,
        m`-W=-y\quad\Rightarrow\quad W=y`,
      ], t('ตอบตัวเลือก 5 ความชันคือ h จุดตัดแกนตั้งจากการต่อแนวเส้นคือ −W ตรวจซ้ำด้วยสมการ (3) ที่ความถี่ขีดเริ่ม f₀ = x จึงได้ W = hx = y',
        'Choice 5. The slope gives h and the extrapolated vertical intercept gives −W. Check with equation (3): the threshold frequency is f₀ = x, so W = hx = y.')) +
        p(link(key68, t('เฉลยทางการ MyTCAS', 'Official MyTCAS answer key'))),
    ],
  ]);

  const q9 = problem(9, t('9 วิชาสามัญ 2565 ข้อ 23 · จากศักย์หยุดยั้งสู่พลังงานใน eV',
    'Nine Common Subjects 2022 Question 23 · From stopping potential to energy in eV'),
  p(t('ฉายแสงความถี่ต่าง ๆ บนผิวโลหะชนิดหนึ่ง ได้กราฟศักย์หยุดยั้งกับความถี่ดังรูป ให้ e เป็นขนาดประจุของอิเล็กตรอน และใช้ h ในหน่วย J·s',
    'A metal surface is illuminated at different frequencies to obtain the stopping-potential graph shown. Let e be the magnitude of the electron charge, with h expressed in J·s.')) +
    figure(`<img class="diagram" style="height:55mm" src="${graph65}" alt="${t('กราฟ Vₛ กับ f มีแนวเส้นตัดแกนตั้งที่ −2 V', 'Graph of Vₛ against f with a vertical intercept at −2 V')}">`,
      t('กราฟจากข้อสอบฉบับ Mathbynutty', 'Graph from the Mathbynutty exam copy.')) +
    choices([m`\tfrac{hf}{e}-2`, m`\tfrac{hf}{e}+2`, m`\tfrac{hf}{e}+5`, m`hf-2e`, m`hf+2e`].map(math)) + source(source65), [
    [
      t('ที่ความถี่ f ในช่วงที่มีโฟโตอิเล็กตรอน ค่า Kₘₐₓ ในหน่วย eV ตรงกับตัวเลือกใด? แสดงการใช้กราฟและการแปลงหน่วย',
        'At a frequency f where photoelectrons are emitted, which choice gives Kₘₐₓ in eV? Show how you use the graph and convert units.'),
      63,
      working(th, [2, 4], [
        m`eV_s=hf-W\quad\Rightarrow\quad V_s=\frac{h}{e}f-\frac{W}{e}`,
        m`-\frac{W}{e}=-2\,\mathrm V\quad\Rightarrow\quad W=e(2\,\mathrm V)=2\,\mathrm{eV}`,
        m`\frac{K_{\max}}{1\,\mathrm{eV}}=\frac{hf}{1.602\times10^{-19}\,\mathrm J}-2`,
      ], t('ตอบตัวเลือก 1 เมื่อใช้ค่าตัวเลขของ h, f และ e ในหน่วย SI การหารด้วยค่าตัวเลขของ e แปลงค่าพลังงานจาก J เป็น eV จึงเขียนได้เป็น hf/e − 2 ตามตัวเลือก',
        'Choice 1. With numerical SI values for h, f and e, dividing by the numerical value of e converts joules to electronvolts. This gives hf/e − 2 as written in the choice.')) +
        p(t('จุดตัด −2 V มาจากการต่อแนวเส้นไปถึง f = 0 ส่วน Vₛ ในสมการ (4) เป็นขนาดศักย์หยุดยั้งในช่วงที่มีการปล่อยอิเล็กตรอน ที่จุดหยุดยั้งบนกราฟ I–V ของ Simulation ค่า V ที่มีเครื่องหมายเท่ากับ −Vₛ',
          'The −2 V intercept comes from extrapolating to f = 0. Vₛ in equation (4) is the stopping-potential magnitude in the emission regime. At cutoff on the simulation’s I–V graph, the signed voltage V equals −Vₛ.')),
    ],
  ]);

  return answers ? [q7, q8, q9] : [q7 + q8, q9];
}
