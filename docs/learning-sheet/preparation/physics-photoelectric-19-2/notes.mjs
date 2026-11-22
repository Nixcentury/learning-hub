import { readFileSync } from 'node:fs';
import { alignedMath } from '../aligned-math.mjs';
import { tube, thresholds, teachingIV, stoppingGrid } from './figures.mjs';

export const labUrl = 'https://nixcentury.github.io/learning-hub/#physics/bank/b-6011652496e13a2c7b17fe1c/photoelectric-lab';
export const equations = [
  String.raw`E_\gamma=hf=\frac{hc}{\lambda}`,
  String.raw`K_{\max}=hf-W`,
  String.raw`W=hf_0`,
  String.raw`K_{\max}=eV_s`,
  String.raw`V_s=\frac{h}{e}f-\frac{W}{e}`,
  String.raw`K_{\max}=\frac{1}{2}m_ev_{\max}^2`,
  String.raw`E_{\mathrm{total}}=I_{\mathrm{light}}A\Delta t`,
  String.raw`N=\frac{E_{\mathrm{total}}}{E_\gamma}`,
];
export const math = tex => String.raw`\(${tex}\)`;
export const heading = text => `<h2>${text}</h2>`;
export const p = text => `<p>${text}</p>`;
export const table = (headers, rows) => `<table><thead><tr>${headers.map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(s=>`<td>${s}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export const figure = (image, caption) => `<figure>${image}<figcaption>${caption}</figcaption></figure>`;
export const list = lines => `<ol>${lines.map(s=>`<li>${s}</li>`).join('')}</ol>`;
export const intensityScale = th => th
  ? 'ความเข้มแสง (%) เทียบกับระดับสูงสุดที่ตั้งได้ในแบบจำลอง โดยระดับนั้นคือ 100% และ 50% คือครึ่งหนึ่งของระดับนั้น'
  : 'Light intensity (%) is relative to the highest setting in the model. The highest setting is 100%, and 50% is half that level.';
const fUnit = '10¹⁴ Hz';
export const evidenceFiles = ['th','en'].flatMap(lang =>
  ['tube','results'].map(kind => `lab-${kind}-${lang}.jpg`));
const evidenceImages = Object.fromEntries(evidenceFiles.map(file => [
  file, 'data:image/jpeg;base64,' + readFileSync(new URL('assets/' + file, import.meta.url)).toString('base64'),
]));
const evidence = (kind, th, description, height) =>
  `<img class="diagram" style="height:${height}mm" src="${evidenceImages[`lab-${kind}-${th?'th':'en'}.jpg`]}" alt="${description}">`;
const box = n => `<div class="equation" data-equation="${n}"><span>${math(equations[n-1])}</span><span>(${n})</span></div>`;
export function working(th, refs, lines, conclusion) {
  const citations = refs.map(n=>`<span data-equation-ref="${n}">(${n})</span>`).join(', ');
  const rows = lines.map(tex=>tex.includes('&') ? tex : tex.replace(/=|\\approx|\\leq|\\lt/, '&$&'));
  return `<div class="working"><p>${th?'ใช้สมการ':'Use equation'} ${citations}</p>${alignedMath(rows)}${p(conclusion)}</div>`;
}

function link(th) {
  return `<a href="${labUrl}" data-hub-simulation data-content-id="physics-photoelectric-lab" data-html-src="photoelectric-lab.html">${th?'แบบจำลองโฟโตอิเล็กทริก':'Photoelectric Effect Lab'}</a>`;
}

function activity(th, question, answer, filled) {
  return `<div class="activity">${p(question)}${filled?`<div class="note-answer">${p(answer)}</div>`:'<div class="writing" style="--space:18mm"></div>'}</div>`;
}

export function notebook(th, filled, lab) {
  const t = (thai, english) => th ? thai : english;
  const c = (thai, english) => p(t(thai, english));
  const m = String.raw;
  const recorded = value => filled ? value : '_____';
  const tableReading = (f, intensity, voltage, metal = 'A') =>
    lab.measure({light:true,metal,frequency:f,intensity,voltage}).current.toFixed(2);
  const measureRows = [6,6,6.1,6.1].map((f,i)=>{
    const intensity = [50,80,80,50][i];
    const current = tableReading(f,intensity,1);
    return [f.toFixed(2),intensity,recorded(current)];
  });
  const metalRows = [6.40, 7.10, 7.60].map(f => [f.toFixed(2),
    ...['A', 'B', 'C'].map(metal => tableReading(f, 50, 1, metal))]);
  const photonConstants = p(t('ค่าที่ใช้คำนวณ','Calculation data')+' · '+
    [m`h=6.626\times10^{-34}\,\mathrm{J\,s}`,m`c=3.00\times10^8\,\mathrm{m/s}`,
      m`1\,\mathrm{eV}=1.602\times10^{-19}\,\mathrm J`,m`1\,\mathrm{nm}=10^{-9}\,\mathrm m`].map(math).join(' · '));
  const sweep = lab.teaching.sweep.map(v=>[v,Number(tableReading(lab.teaching.frequency,50,v))]);
  const graphRows = lab.stoppingBrackets(lab.stoppingFrequencies.flatMap(frequency => {
    const firstZero = -Math.ceil((lab.hScaled * frequency - lab.metals.A) * 100);
    return [firstZero + 1, firstZero].map(tick => {
      const setup = { light:true, metal:'A', frequency, intensity:50, voltage:tick / 100 };
      return { ...setup, ...lab.measure(setup) };
    });
  }));
  const graphPoints = graphRows.map(({ frequency, stopping }) => [frequency, stopping]);
  const ex = (n, title, prompt, answer) => `<div class="block example" data-example-number="${n}"><h3>${t('ตัวอย่าง','Example')} ${n} · ${title}</h3>${p(prompt)}${filled?`<div class="note-answer">${answer}</div>`:'<div class="writing" style="--space:46mm"></div>'}</div>`;
  const pages = [
    [
      'Quick Start Note · จากแสงถึงค่าที่มิเตอร์อ่าน','Quick Start Note · From light to the meter reading',
      c('เปิด '+link(th)+' แล้วทำตามภารกิจทีละขั้น เปลี่ยนค่าตามที่กำหนด ดูจุดอิเล็กตรอนในหลอด อ่านค่า I (µA) แล้วกด «บันทึกค่ามิเตอร์» นำค่าที่บันทึกมาใส่หน้านี้',
        'Open the '+link(th)+' and follow the mission steps. Change the specified setting, watch the electron dots in the tube, read I (µA), and press “Record meter reading”. Transfer your readings to this page.') +
      figure(evidence('tube',th,t('ภาพหลอดสุญญากาศจากซิม','Vacuum tube captured from the simulation'),44),
        t('ภาพจากแล็บ · แสงตกที่ขั้วปล่อยและอิเล็กตรอนเคลื่อนไปทางขั้วรับ','Lab capture. Light strikes the emitter and electrons travel toward the collector.')) +
      `<h3>${t('เปรียบเทียบก่อนและหลังเปิดแสง','Compare light off and on')}</h3>` +
      p(intensityScale(th)) +
      c('ภารกิจ 1 · ใช้โลหะ A และศักย์ขั้วรับ +1.00 V ปิดแสง: '+recorded('0.00')+' µA เปิดแสงชุดสอน 3.00 eV ที่ความเข้ม 50%: '+recorded('2.00')+' µA',
        'Mission 1 · Use metal A and a collector voltage of +1.00 V. Light off: '+recorded('0.00')+' µA. Teaching light at 3.00 eV and 50% intensity: '+recorded('2.00')+' µA.') +
      activity(th,t('ค่ากระแสก่อนและหลังเปิดแสงบอกอะไร?', 'What do the readings before and after switching on the light show?'),
        t('0.00 → 2.00 µA กระแสที่ตรวจพบแสดงว่ามีอิเล็กตรอนเคลื่อนจากผิวโลหะไปถึงขั้วรับ','0.00 → 2.00 µA. The measured current shows that electrons travelled from the metal to the collector.'),filled) +
      `<h3>${t('ผลของความถี่และความเข้ม','Effects of frequency and intensity')}</h3>` +
      c('ภารกิจ 2 · คงโลหะ A และศักย์ขั้วรับ +1.00 V เทียบแถว 1–2 และ 3–4 เพื่อดูผลของความเข้ม เทียบแถว 2–3 เพื่อดูผลของความถี่',
        'Mission 2 · Keep metal A and the collector at +1.00 V. Compare rows 1–2 and 3–4 for the effect of intensity, then rows 2–3 for the effect of frequency.') +
      table([t('ความถี่','Frequency')+` (${fUnit})`,t('ความเข้ม (%)','Intensity (%)'),'I (µA)'],measureRows) +
      activity(th,t('กระแสเริ่มปรากฏระหว่างความถี่คู่ใด? การเพิ่มความเข้มให้ผลต่างกันอย่างไรในสองช่วง?', 'Which pair brackets the onset of current? How does raising intensity affect the two regimes?'),
        t('อยู่ระหว่าง 6.00 กับ 6.10 × 10¹⁴ Hz ที่ 6.00 เพิ่มความเข้มแล้วยังอ่านได้ศูนย์ ที่ 6.10 กระแสเพิ่มเมื่อเพิ่มความเข้ม คำถามต่อไปคือความถี่เปลี่ยนพลังงานที่แสงส่งให้อิเล็กตรอนอย่างไร',
          'The onset is bracketed by 6.00 and 6.10 × 10¹⁴ Hz. At 6.00 the reading remains zero. At 6.10 the current grows as intensity rises. How does frequency change the energy delivered by light?'),filled)
    ],
    [
      'โฟตอนหนึ่งตัวให้พลังงานเท่าไร','Energy of a single photon',
      c('เมื่อแสงตกกระทบผิวโลหะ แบบจำลองโฟตอนอธิบายว่าอิเล็กตรอนหนึ่งตัวดูดกลืนพลังงานทั้งหมดจากโฟตอนหนึ่งตัว พลังงานที่ส่งต่อขึ้นกับความถี่ของแสง',
        'In the photon model, an electron at the metal can absorb all the energy of one photon. The delivered energy depends on the light frequency.') +
      figure(tube(th),t('ลำแสงตกที่ขั้วปล่อย ในภาพหลอดจำลอง โฟตอนถ่ายโอนพลังงานที่ผิวโลหะ','Incident light reaches the emitter. In the model, photons transfer energy at the metal surface.')) +
      table([t('สัญลักษณ์','Symbol'),t('ความหมาย','Meaning')],[
        [math(m`E_\gamma`),t('พลังงานต่อโฟตอน ใช้ J หรือ eV','Energy per photon, in J or eV')],
        [math('f'),t('ความถี่ของแสง หน่วย Hz','Light frequency, in Hz')],
        [math(m`\lambda`),t('ความยาวคลื่นในสุญญากาศ หน่วย m','Wavelength in vacuum, in m')],
        [math('h'),t('ค่าคงที่ของพลังค์','Planck constant')+' · '+math(m`6.626\times10^{-34}\,\mathrm{J\,s}`)],
        [math('c'),t('อัตราเร็วแสงในสุญญากาศ','Speed of light in vacuum')+' · '+math(m`3.00\times10^8\,\mathrm{m/s}`)],
      ]) +
      c('จากแนวคิดควอนตัม พลังงานต่อโฟตอนแปรผันตรงกับความถี่ สำหรับแสงในสุญญากาศใช้ความสัมพันธ์ '+math(m`c=f\lambda`)+ ' แทนความถี่ด้วยอัตราเร็วหารความยาวคลื่น',
        'Quantum theory gives energy proportional to frequency. In vacuum, '+math(m`c=f\lambda`)+', so frequency is light speed divided by wavelength.') +
      box(1) +
      p(math(m`1\,\mathrm{eV}=1.602\times10^{-19}\,\mathrm J\qquad 1\,\mathrm{nm}=10^{-9}\,\mathrm m`)) +
      activity(th,t('ถ้าเพิ่มความเข้มโดยใช้ความถี่เดิม พลังงานต่อโฟตอนและจำนวนโฟตอนที่ตกกระทบต่อวินาทีเปลี่ยนอย่างไร?',
        'At fixed frequency, how does raising intensity change the energy per photon and the number of photons incident per second?'),
        t('พลังงานต่อโฟตอนเท่าเดิมตามสมการ (1) จำนวนโฟตอนที่ตกกระทบต่อวินาทีเพิ่มขึ้นเมื่อใช้พื้นที่รับแสงเท่าเดิม',
          'Energy per photon is unchanged by equation (1). More photons arrive each second over the same illuminated area.'),filled)
    ],
    [
      'ฟังก์ชันงานและเงื่อนไขที่อิเล็กตรอนหลุด','Work function and the emission threshold',
      c('ฟังก์ชันงาน '+math('W')+' คือพลังงานต่ำสุดที่ต้องใช้ให้อิเล็กตรอนหลุดจากผิวโลหะ ขึ้นกับชนิดและสภาพผิวโลหะ พลังงานที่เหลือเป็นพลังงานจลน์ อิเล็กตรอนที่ใช้พลังงานออกจากผิวน้อยที่สุดมีพลังงานจลน์สูงสุด '+math(m`K_{\max}`)+' เมื่อใช้พลังงานทุกพจน์ในหน่วยเดียวกัน การอนุรักษ์พลังงานให้ '+math(m`hf=W+K_{\max}`),
        'The work function '+math('W')+' is the minimum energy required for an electron to escape the metal surface. It depends on the metal and surface condition. The remaining energy is kinetic. Electrons requiring the least escape energy have the maximum kinetic energy '+math(m`K_{\max}`)+'. With consistent units, energy conservation gives '+math(m`hf=W+K_{\max}`)+'.') +
      box(2) +
      c('ให้ '+math('f_0')+' เป็นความถี่ขีดเริ่ม เมื่อพลังงานโฟตอนพอดีกับฟังก์ชันงาน สมการ (2) ให้พลังงานจลน์สูงสุดเป็นศูนย์ที่ขีดเริ่มในแบบจำลองอุดมคติ',
        'Let '+math('f_0')+' be the threshold frequency. At the threshold, the photon energy just matches the work function, and equation (2) gives zero maximum kinetic energy in the ideal limit.') +
      box(3) +
      table([t('ความถี่แสง','Light frequency'),t('การหลุดจากผิวโลหะ','Emission from the metal')],[
        [math(String.raw`f\lt f_0`),t('พลังงานโฟตอนไม่พอ จึงไม่มีโฟโตอิเล็กตรอน','The photon energy is insufficient. No photoelectrons are emitted.')],
        [math('f=f_0'),t('ขีดเริ่มในอุดมคติ พลังงานพอดีและพลังงานจลน์สูงสุดเป็นศูนย์ ตัวจำลองเริ่มแสดงกระแสเมื่อสูงกว่าขีดเริ่ม','Ideal threshold: the energy just suffices and maximum kinetic energy is zero. The lab displays a current once frequency exceeds the threshold.')],
        [math('f>f_0'),t('อิเล็กตรอนหลุดได้และมีพลังงานจลน์สูงสุดเป็นบวก','Emission is possible and maximum kinetic energy is positive.')],
      ]) +
      activity(th,t('จากตารางหน้าแรก ที่ 6.00 × 10¹⁴ Hz ทำไมมิเตอร์ยังอ่าน 0.00 µA เมื่อเพิ่มความเข้มจาก 50% เป็น 80%?',
        'In the table on the first page, why does the meter still read 0.00 µA at 6.00 × 10¹⁴ Hz when intensity rises from 50% to 80%?'),
        t('เพิ่มจำนวนโฟตอน แต่ตามสมการ (1) พลังงานของแต่ละโฟตอนยังเท่าเดิมและต่ำกว่าฟังก์ชันงานในสมการ (3)',
          'More photons arrive, but by equation (1) each still carries the same energy, below the work function in equation (3).'),filled)
    ],
    [
      'ความถี่ขีดเริ่มของโลหะและกราฟพลังงาน','Metal thresholds and the energy graph',
      c('ภารกิจ 4 · เทียบผลที่ห้องบันทึกกับตารางตัวอย่างของโลหะสามชนิดที่ความเข้ม 50% และศักย์ขั้วรับ +1.00 V',
        'Mission 4 · Compare your class readings with the model table for three metals at 50% intensity and +1.00 V collector voltage.') +
      table([t('ความถี่','Frequency')+` (${fUnit})`,'A (µA)','B (µA)','C (µA)'],metalRows) +
      activity(th,t('ที่ความถี่เดียวกัน เหตุใดการเปลี่ยนโลหะจึงทำให้บางครั้งกระแสเป็นศูนย์?', 'Why can changing the metal at the same frequency reduce the current to zero?'),
        t('ที่ 6.40 ตรวจพบกระแสใน A ที่ 7.10 ตรวจพบใน B เมื่อเทียบกับ C และที่ 7.60 ตรวจพบใน C โลหะที่มี W สูงกว่าต้องใช้ f₀ สูงกว่าตามสมการ (3)',
          'At 6.40, A gives a current. At 7.10, B gives a current when compared with C. At 7.60, C gives a current. By equation (3), larger W requires larger f₀.'),filled) +
      figure(thresholds(th,lab),t('กราฟจากสมการ (2) สำหรับโลหะ A, B และ C ในแล็บ','Graphs from equation (2) for lab metals A, B and C.')) +
      c('เทียบสมการ (2) กับสมการเส้นตรง แกนนอนคือความถี่ แกนตั้งคือพลังงานจลน์สูงสุด ความชันของทั้งสามเส้นคือ h ในหน่วยที่สอดคล้องกับแกน จุดตัดแกนนอนคือ f₀ เส้นตรงเมื่อต่อไปถึง f = 0 จะตัดแกนตั้งที่ −W ซึ่งเป็นค่าจากการต่อเส้น',
        'Compare equation (2) with a straight-line equation. Frequency is on the horizontal axis and maximum kinetic energy is on the vertical axis. All slopes equal h in consistent units. Each horizontal intercept is f₀. Extending a line to f = 0 gives a vertical intercept of −W.') +
      p(`<a href="https://assets.mytcas.com/68/answer/tcas68-phy-a-level.pdf#page=18">${t('อ้างอิงทักษะการอ่านกราฟ · A-Level ฟิสิกส์ 2568 ข้อ 22','Graph-reading reference · 2025 A-Level Physics, question 22')}</a>`)
    ],
    [
      'จากอิเล็กตรอนที่หลุดถึงค่าที่มิเตอร์อ่าน','From emission to the meter reading',
      figure(tube(th),t('ดูตำแหน่งขั้วปล่อยและขั้วรับก่อนอ่านเครื่องหมายความต่างศักย์','Locate the emitter and collector before interpreting the voltage sign.')) +
      c('ในแล็บให้ '+math(m`V=V_{\mathrm{collector}}-V_{\mathrm{emitter}}`)+' เป็นศักย์ขั้วรับเทียบขั้วปล่อย ถ้า V เป็นบวก ขั้วรับดึงอิเล็กตรอน ถ้า V เป็นลบ สนามไฟฟ้าทำให้อิเล็กตรอนที่กำลังเคลื่อนไปยังขั้วรับช้าลง',
        'The lab defines '+math(m`V=V_{\mathrm{collector}}-V_{\mathrm{emitter}}`)+'. Positive V makes the collector attract electrons. With negative V, the electric field slows electrons moving toward the collector.') +
      c('ถ้าอิเล็กตรอนมีประจุ −e โดย e คือขนาดประจุมูลฐาน การเปลี่ยนพลังงานศักย์ไฟฟ้าเป็น '+math(m`\Delta U=(-e)V`)+'. เมื่อเพิ่มแรงดันต้านจนกระแสเพิ่งเป็นศูนย์ ให้ '+math('V_s')+' เป็นขนาดความต่างศักย์หยุดยั้ง จุดอ่านบนแกนความต่างศักย์คือ '+math('V=-V_s')+' อิเล็กตรอนที่มีพลังงานจลน์สูงสุดต้องใช้พลังงาน '+math('eV_s')+' พอดีในการต้านสนามเพื่อไปถึงขีดรับ',
        'The electron has charge −e, where e is the elementary charge magnitude. Its electric potential energy changes by '+math(m`\Delta U=(-e)V`)+'. When retarding voltage just brings the current to zero, let '+math('V_s')+' be the stopping-potential magnitude. The signed axis reading is '+math('V=-V_s')+'. The fastest electrons need '+math('eV_s')+' of energy to overcome the retarding field and reach the collection threshold.') +
      box(4) +
      c('ใช้ e = 1.602 × 10⁻¹⁹ C เมื่อต้องตอบเป็น J ถ้าตอบเป็น eV ค่าตัวเลขของพลังงานจะเท่ากับค่าตัวเลขของศักย์หยุดยั้งใน V สำหรับอิเล็กตรอนหนึ่งตัว',
        'Use e = 1.602 × 10⁻¹⁹ C to answer in joules. For one electron, the numerical value of the energy in eV equals the numerical stopping-potential magnitude in volts.') +
      activity(th,t('มิเตอร์อ่านศูนย์ทั้งที่ 6.00 × 10¹⁴ Hz ในภารกิจ 2 และเมื่อใช้แสงชุดสอนที่ V = −0.50 V ในภารกิจ 3 ภาพในหลอดต่างกันอย่างไร?',
        'The meter reads zero at 6.00 × 10¹⁴ Hz in Mission 2 and under teaching light at V = −0.50 V in Mission 3. What is different in the tube?'),
        t('ภารกิจ 2 แสงความถี่ต่ำจนไม่มีอิเล็กตรอนหลุด ภารกิจ 3 แสงยังทำให้อิเล็กตรอนหลุด แต่แรงดันต้านทำให้ไปไม่ถึงขั้วรับ',
          'In Mission 2, the frequency is too low to emit electrons. In Mission 3, the light still causes emission, but the retarding voltage prevents electrons from reaching the collector.'),filled)
    ],
    [
      'อ่านศักย์หยุดยั้งจากกราฟกระแส','Read the stopping potential from the current graph',
      c('ภารกิจ 3 · ใช้แสงชุดสอน 3.00 eV กับโลหะ A ที่ความเข้ม 50% ดูจากผลที่ห้องบันทึกว่าแถวใดยังมีกระแสและแถวใดกระแสเพิ่งเป็นศูนย์ แล้วเทียบกับกราฟตัวอย่าง',
        'Mission 3 · Use 3.00 eV teaching light on metal A at 50% intensity. Find the last row with current and the first zero-current row in your class data, then compare them with the model graph.') +
      figure(teachingIV(th,sweep),t('จุดคือค่าบันทึกจากแบบจำลองของแล็บ เส้นคือแนวโน้มของแบบจำลองที่ใช้ในชุดสอน','Dots show readings from the lab model. The line shows the teaching model’s trend.')) +
      table([t('ศักย์ขั้วรับเทียบขั้วปล่อย V (V)','Collector voltage relative to emitter V (V)'), 'I (µA)'],sweep.map(([v,i])=>[lab.signed(v),i.toFixed(2)])) +
      activity(th,t('จุดสุดท้ายที่ยังมีกระแสและจุดแรกที่อ่านได้ศูนย์บอกช่วงใด? แยกค่า V ที่มีเครื่องหมายออกจากขนาด Vₛ',
        'Which interval is marked by the last nonzero reading and the first zero? Distinguish signed V from the magnitude Vₛ.'),
        t('ที่ −0.45 V ยังอ่านได้ 0.20 µA ที่ −0.50 V อ่านได้ศูนย์ ข้อมูลสองจุดจึงให้ 0.45 &lt; Vₛ ≤ 0.50 V ค่าประมาณจากจุดแรกที่เป็นศูนย์คือ V = −0.50 V หรือ Vₛ ≈ 0.50 V ชุดสอนตั้งให้จุดหยุดจริงในแบบจำลองอยู่ตรงค่านี้',
          'At −0.45 V the current is 0.20 µA. At −0.50 V it is zero. The two samples bracket 0.45 &lt; Vₛ ≤ 0.50 V. The first zero gives V ≈ −0.50 V or Vₛ ≈ 0.50 V, which equals the exact model cutoff for this preset.'),filled) +
      c('ทำนายแล้วลอง · ในโหมด «สำรวจหลอดเอง» ใช้โลหะ A แสงชุดสอน ความเข้ม 50% และ V = −0.55 V ถ้าเพิ่มความถี่เป็น 8.00 × 10¹⁴ Hz จะเริ่มมีกระแสไหม? บันทึกค่าก่อนและหลังเพื่อเช็ก',
        'Predict and test · In “Explore the tube”, use metal A, teaching light, 50% intensity and V = −0.55 V. Will current flow if you increase the frequency to 8.00 × 10¹⁴ Hz? Record both readings to check.')
    ],
    [
      'จากผลวัดสู่กราฟ อัตราเร็ว และจำนวนโฟตอน','From readings to a graph, speed and photon count',
      c('ให้ Vₛ เป็นขนาดศักย์หยุดยั้งและ V เป็นศักย์ขั้วรับเทียบขั้วปล่อย เมื่อกวาดแรงดันไปทางลบ ใช้ Vₛ ≈ −V ที่จุดแรกที่อ่านกระแสเป็นศูนย์',
        'Vₛ is the stopping-potential magnitude and V is the collector voltage relative to the emitter. When sweeping toward negative voltage, estimate Vₛ as −V at the first zero-current reading.') +
      c('แทนพลังงานจลน์จากสมการ (2) ในสมการ (4) แล้วหารทั้งสมการด้วยขนาดประจุอิเล็กตรอน e','Substitute the kinetic energy from equation (2) into (4), then divide by the electron charge magnitude e.') +
      p(math(m`eV_s=hf-W`)) + box(5) +
      c('บนกราฟ Vₛ กับ f ความชันคือ h/e จุดตัดแกนนอนคือ f₀ และจุดตัดแกนตั้งจากแนวเส้นต่อคือ −W/e',
        'On the Vₛ versus f graph, the slope is h/e, the horizontal intercept is f₀, and the extrapolated vertical intercept is −W/e.') +
      c('ให้ mₑ เป็นมวลอิเล็กตรอนหน่วย kg และ vₘₐₓ เป็นอัตราเร็วสูงสุดหน่วย m/s ใช้นิยามพลังงานจลน์แบบไม่สัมพัทธภาพ โดยคิดพลังงานหน่วย J',
        'Let mₑ be the electron mass in kg and vₘₐₓ the maximum speed in m/s. Use the nonrelativistic kinetic energy in joules.') + box(6) +
      c('ให้ I ของแสงเป็นความเข้มแสงหน่วย W/m², A เป็นพื้นที่รับแสงหน่วย m² และ Δt เป็นช่วงเวลาหน่วย s สำหรับแสงตกตั้งฉาก ความเข้มคงที่คือพลังงานรวมต่อพื้นที่ต่อเวลา',
        'Let I_light be irradiance in W/m², A the illuminated area in m², and Δt the time interval in seconds. For normally incident light with constant irradiance, intensity is total energy per area per time.') +
      p(math(m`I_{\mathrm{light}}=\frac{E_{\mathrm{total}}}{A\Delta t}`)) + box(7) +
      c('ถ้าโฟตอนทุกตัวมีพลังงาน Eγ เท่ากัน ให้ N เป็นจำนวนโฟตอนที่ตกกระทบ พลังงานรวมคือผลรวมของโฟตอนทั้ง N ตัว',
        'If every photon carries the same energy Eγ, let N be the incident photon count. The total energy is the sum of the energies of all N photons.') +
      p(math(m`E_{\mathrm{total}}=NE_\gamma`)) + box(8)
    ],
    [
      'ตัวอย่าง 1–2 · คำนวณจากพลังงานโฟตอน','Examples 1–2 · Calculations from photon energy',
      photonConstants +
      ex(1,t('พลังงานของโฟตอน','Photon energy'),
        t('แสงในสุญญากาศมีความยาวคลื่น 413.3 nm จงคำนวณพลังงานของโฟตอนหนึ่งตัวในหน่วยจูลและอิเล็กตรอนโวลต์',
          'Light in vacuum has a wavelength of 413.3 nm. Calculate the energy of one photon in joules and electronvolts.'),
        working(th,[1],[m`\lambda=413.3\times10^{-9}\,\mathrm m`,m`E_\gamma=\frac{hc}{\lambda}=\frac{(6.626\times10^{-34})(3.00\times10^8)}{413.3\times10^{-9}}=4.81\times10^{-19}\,\mathrm J`,m`E_\gamma=\frac{4.81\times10^{-19}\,\mathrm J}{1.602\times10^{-19}\,\mathrm{J/eV}}\approx3.00\,\mathrm{eV}`],t('โฟตอนหนึ่งตัวมีพลังงานประมาณ 3.00 eV','Each photon carries about 3.00 eV.'))) +
      ex(2,t('หาฟังก์ชันงานจากความถี่ขีดเริ่ม','Work function from threshold frequency'),
        t('โลหะ A มีความถี่ขีดเริ่มประมาณ 6.04 × 10¹⁴ Hz จงคำนวณฟังก์ชันงานใน eV และพลังงานจลน์สูงสุดเมื่อฉายโฟตอน 3.00 eV',
          'Metal A has a threshold frequency of about 6.04 × 10¹⁴ Hz. Find the work function in eV and the maximum kinetic energy under 3.00 eV photons.'),
        working(th,[3,2],[m`W=hf_0=(6.626\times10^{-34})(6.04\times10^{14})=4.00\times10^{-19}\,\mathrm J\approx2.50\,\mathrm{eV}`,m`K_{\max}=E_\gamma-W=(3.00-2.50)\,\mathrm{eV}=0.50\,\mathrm{eV}`],t('โฟตอนมีพลังงานมากกว่า W จึงเกิดการหลุด','Photon energy exceeds W, so emission occurs.')))
    ],
    [
      'ตัวอย่าง 3–4 · ตรวจการหลุดและเทียบโลหะ','Examples 3–4 · Check emission and compare metals',
      photonConstants +
      ex(3,t('ความยาวคลื่นที่ยาวเกินขีดเริ่ม','A wavelength beyond threshold'),
        t('ฉายแสงความยาวคลื่น 600 nm ลงบนโลหะ A ที่มีฟังก์ชันงาน 2.50 eV จงตัดสินว่าอิเล็กตรอนหลุดหรือไม่ ถ้าไม่หลุด พลังงานต่อโฟตอนขาดอีกเท่าไรจึงถึงขีดเริ่ม?',
          'Shine 600 nm light on metal A, whose work function is 2.50 eV. Decide whether electrons are emitted. If there is no emission, how much more energy per photon is needed to reach the threshold?'),
        working(th,[1],[m`E_\gamma=\frac{hc}{\lambda}=\frac{(6.626\times10^{-34})(3.00\times10^8)}{600\times10^{-9}}=3.31\times10^{-19}\,\mathrm J\approx2.07\,\mathrm{eV}`,m`W-E_\gamma\approx2.50-2.07=0.43\,\mathrm{eV}`],t('ไม่มีการปล่อยอิเล็กตรอน ต้องเพิ่มพลังงานต่อโฟตอนประมาณ 0.43 eV จึงถึงขีดเริ่ม','There is no emission. Each photon needs about 0.43 eV more to reach the threshold.'))) +
      ex(4,t('ฉายแสงชุดเดียวกันลงบนโลหะสามชนิด','One light setting, three metals'),
        t('ฉายโฟตอนพลังงาน 3.00 eV ลงบนโลหะ A, B และ C ซึ่งมีฟังก์ชันงาน 2.50, 2.80 และ 3.10 eV ตามลำดับ โลหะใดปล่อยอิเล็กตรอน และอิเล็กตรอนจากแต่ละโลหะที่ปล่อยได้มีพลังงานจลน์สูงสุดกี่ eV?',
          'Shine 3.00 eV photons on metals A, B and C, whose work functions are 2.50, 2.80 and 3.10 eV, respectively. Which metals emit electrons, and what is the maximum kinetic energy in eV for each emitting metal?'),
        working(th,[2],[m`K_{\max,\mathrm A}=E_\gamma-W_{\mathrm A}=(3.00-2.50)\,\mathrm{eV}=0.50\,\mathrm{eV}`,m`K_{\max,\mathrm B}=E_\gamma-W_{\mathrm B}=(3.00-2.80)\,\mathrm{eV}=0.20\,\mathrm{eV}`],t('A และ B ปล่อยโฟโตอิเล็กตรอน ส่วน C มี W สูงกว่า 3.00 eV จึงไม่เกิดการหลุด',
          'A and B emit. Metal C has W greater than 3.00 eV, so it does not emit.')))
    ],
    [
      'ตัวอย่าง 5–6 · ใช้กราฟหาค่าที่ต้องการ','Examples 5–6 · Extract quantities from graphs',
      ex(5,t('หาค่าคงที่ของพลังค์จากจุดบนกราฟ','Planck constant from two graph points'),
        t('ฉายแสงลงบนโลหะ A ที่ 7.00 × 10¹⁴ Hz วัดพลังงานจลน์สูงสุดได้ 0.395 eV และที่ 9.00 × 10¹⁴ Hz วัดได้ 1.222 eV จงคำนวณความชันของกราฟพลังงานจลน์สูงสุดกับความถี่ใน eV·s และใช้ข้อมูลจุดแรกหาฟังก์ชันงานใน eV',
          'For metal A, a frequency of 7.00 × 10¹⁴ Hz gives a maximum kinetic energy of 0.395 eV, and 9.00 × 10¹⁴ Hz gives 1.222 eV. Find the slope of the maximum kinetic energy versus frequency graph in eV·s, then use the first point to find the work function in eV.'),
        working(th,[2],[m`h=\frac{\Delta K_{\max}}{\Delta f}=\frac{1.222-0.395}{(9.00-7.00)\times10^{14}}=4.14\times10^{-15}\,\mathrm{eV\,s}`,m`W=hf-K_{\max}=(4.135\times10^{-15})(7.00\times10^{14})-0.395\approx2.50\,\mathrm{eV}`],t('เก็บความชันก่อนปัดไว้ใช้คำนวณ W','Retain the unrounded slope when calculating W.'))) +
      ex(6,t('อ่านกราฟชุดสอนแล้วย้อนหาฟังก์ชันงาน','Use the teaching I–V graph to find the work function'),
        t('ใช้โฟตอนพลังงาน 3.00 eV กราฟกระแสของชุดสอนอ่านได้ 0.20 µA ที่ศักย์ขั้วรับ −0.45 V และเริ่มอ่านได้ 0.00 µA ที่ −0.50 V จงประมาณขนาดศักย์หยุดยั้งใน V แล้วหาพลังงานจลน์สูงสุดและฟังก์ชันงานใน eV',
          'With 3.00 eV photons, the teaching graph shows 0.20 µA at a collector voltage of −0.45 V, and a first zero reading of 0.00 µA at −0.50 V. Estimate the stopping-potential magnitude in V, then find the maximum kinetic energy and work function in eV.'),
        working(th,[4,2],[m`V\approx-0.50\,\mathrm V,\qquad V_s\approx0.50\,\mathrm V`,m`K_{\max}=eV_s\approx(1.602\times10^{-19}\,\mathrm C)(0.50\,\mathrm V)=8.01\times10^{-20}\,\mathrm J=0.50\,\mathrm{eV}`,m`W=E_\gamma-K_{\max}\approx3.00-0.50=2.50\,\mathrm{eV}`],t('ข้อมูลที่วัดคร่อม 0.45 &lt; Vₛ ≤ 0.50 V การคำนวณใช้จุดศูนย์แรกเป็นค่าประมาณ',
          'The measurements bracket 0.45 &lt; Vₛ ≤ 0.50 V. The calculation uses the first zero as an estimate.')))
    ],
    [
      'ตัวอย่าง 7 · จากผลวัดสู่กราฟศักย์หยุดยั้ง','Example 7 · From your readings to a stopping-potential graph',
      c('กลับไปที่ซิม เลือก «สำรวจหลอดเอง» แล้วใช้ชุดวัด 3 ความถี่ของโลหะ A ที่ความเข้ม 50% จดค่าแรงดันสุดท้ายที่ยังมีกระแสและแรงดันแรกที่เป็นศูนย์ ซึ่งห่างกัน 0.01 V',
        'Return to the lab, choose “Explore the tube”, and use the three frequency presets for metal A at 50% intensity. Record the last voltage with current and the first zero-current voltage, 0.01 V apart.') +
      (filled ? figure(evidence('results',th,t('ตารางผลวัดจริงจากซิมทั้งสามความถี่','Actual simulation readings at all three frequencies'),29),
        t('ภาพจากซิมหลังบันทึกครบทั้งสามความถี่','Simulation capture after recording all three pairs.')) : '') +
      table(['f (10¹⁴ Hz)', t('V สุดท้ายที่ I > 0 (V)','Last V with I > 0 (V)'), t('V แรกที่ I = 0 (V)','First V with I = 0 (V)'), 'Vₛ (V)'],
        graphRows.map(({ frequency, last, zero, stopping }) => [frequency.toFixed(2), recorded(lab.signed(last.voltage)), recorded(lab.signed(zero.voltage)), recorded(stopping.toFixed(2))])) +
      c('ใช้สมการ (5) กับค่า Vₛ จากตาราง','Apply equation (5) to the Vₛ values in the table.') +
      c('พล็อตจุดบนกราฟ หาแนวเส้นตรงจากค่าที่วัด แล้วต่อเส้นประเพื่ออ่านจุดตัดแกน ค่าที่วัดจริงอยู่เหนือขีดเริ่ม',
        'Plot the measured points, draw a trend line and extend it with dashes to read the intercepts. The measured points are above threshold.') +
      figure(stoppingGrid(th,{ classroom:true, filled, points:graphPoints, crossing:6.04, intercept:-2.497 }),
        t('กราฟ Vₛ กับ f ใช้ขนาดศักย์หยุดยั้งเป็นบวก','Vₛ against f, using the positive stopping-potential magnitude.')) +
      (filled ? working(th,[5],[
        m`\frac{h}{e}\approx\frac{0.81-0.19}{(8.00-6.50)\times10^{14}}=4.13\times10^{-15}\,\mathrm{V\,s}`,
        m`h=e\frac{h}{e}\approx(1.602\times10^{-19}\,\mathrm C)(4.13\times10^{-15}\,\mathrm{V\,s})\approx6.62\times10^{-34}\,\mathrm{J\,s}`,
        m`f_0\approx6.04\times10^{14}\,\mathrm{Hz}`,
        m`-\frac{W}{e}\approx-2.50\,\mathrm V\quad\Rightarrow\quad W\approx2.50\,\mathrm{eV}`,
      ],t('ถ้าเปลี่ยนโลหะ ความชันยังเท่าเดิม แต่ตำแหน่งจุดตัดเปลี่ยนตาม W','Changing the metal keeps the slope the same and shifts the intercepts according to W.')) : '<div class="writing" style="--space:46mm"></div>')
    ],
    [
      'ตัวอย่าง 8–9 · อัตราเร็วและจำนวนอนุภาค','Examples 8–9 · Speed and particle counts',
      ex(8,t('จากศักย์หยุดยั้งสู่อัตราเร็ว','From stopping potential to speed'),
        t('จากแล็บโลหะ A มีศักย์หยุดยั้งประมาณ 0.50 V จงหาอัตราเร็วสูงสุดของอิเล็กตรอน กำหนดมวลอิเล็กตรอน 9.11 × 10⁻³¹ kg',
          'The lab gives a stopping potential of about 0.50 V for metal A. Find the maximum electron speed. The electron mass is 9.11 × 10⁻³¹ kg.'),
        working(th,[4,6],[m`K_{\max}=eV_s=(1.602\times10^{-19}\,\mathrm C)(0.50\,\mathrm V)=8.01\times10^{-20}\,\mathrm J`,
          m`v_{\max}=\sqrt{\frac{2K_{\max}}{m_e}}\approx\sqrt{\frac{2(8.01\times10^{-20}\,\mathrm J)}{9.11\times10^{-31}\,\mathrm{kg}}}\approx4.19\times10^5\,\mathrm{m/s}`],t('ใช้พลังงานจลน์หน่วย J เพื่อหาอัตราเร็วใน m/s','Use kinetic energy in joules to obtain speed in m/s.'))) +
      ex(9,t('จากความเข้มแสงสู่จำนวนโฟตอน','From light intensity to photon count'),
        t('แสงความเข้ม 0.20 W/m² ตกตั้งฉากกับพื้นที่ 2.0 cm² เป็นเวลา 5.0 s โฟตอนแต่ละตัวมีพลังงาน 4.0 × 10⁻¹⁹ J จงหาจำนวนโฟตอนที่ตกกระทบ สมมติว่าทุกโฟตอนถูกดูดกลืนและทำให้อิเล็กตรอนหลุดหนึ่งตัว จะมีอิเล็กตรอนหลุดกี่ตัว?',
          'Light of intensity 0.20 W/m² is incident normally on 2.0 cm² for 5.0 s. Each photon carries 4.0 × 10⁻¹⁹ J. Find the incident photon count. If every photon is absorbed and releases one electron, how many electrons are emitted?'),
        working(th,[7,8],[m`E_{\mathrm{total}}=I_{\mathrm{light}} A\Delta t=(0.20\,\mathrm{W/m^2})(2.0\times10^{-4}\,\mathrm{m^2})(5.0\,\mathrm s)=2.0\times10^{-4}\,\mathrm J`,
          m`N=\frac{E_{\mathrm{total}}}{E_\gamma}=\frac{2.0\times10^{-4}\,\mathrm J}{4.0\times10^{-19}\,\mathrm J}=5.0\times10^{14}`],
          t('ได้โฟตอนและอิเล็กตรอนจำนวนเท่ากันตามสมมติฐานที่กำหนด','The photon and electron counts are equal under the stated assumption.')))
    ],
    [
      'ตัวอย่าง 10 · แสงเดียวกันกับโลหะสองชนิด','Example 10 · One light source, two metals',
      ex(10,t('ใช้ขีดเริ่มของโลหะแรกหาฟังก์ชันงานของโลหะที่สอง','Use the first metal’s threshold to find the second metal’s work function'),
        t('ใช้แสงที่ความถี่ขีดเริ่มของโลหะตัวอย่าง X ซึ่งมีฟังก์ชันงาน 3.60 eV ไปฉายลงบนโลหะ Y วัดศักย์หยุดยั้งได้ 0.90 V จงหาฟังก์ชันงานของ Y',
          'Shine light at the threshold frequency of sample metal X, whose work function is 3.60 eV, onto metal Y. The measured stopping potential is 0.90 V. Find the work function of Y.'),
        working(th,[3,4,2],[m`E_\gamma=hf_{0,X}=W_X=3.60\,\mathrm{eV}`,
          m`K_{\max,Y}=eV_s=0.90\,\mathrm{eV}`,m`W_Y=E_\gamma-K_{\max,Y}=(3.60-0.90)\,\mathrm{eV}=2.70\,\mathrm{eV}`],
          t('ความถี่ของแสงชุดเดิมเท่าเดิมเมื่อเปลี่ยนโลหะ','The light frequency stays the same when the metal changes.')))
    ],
  ];
  const references = p(t('อ่านเสริม','Further reading')+' · '+link(th)+' · '+
    `<a href="https://pubhtml5.com/yffk/rmif/basic/51-100">${t('คู่มือครูฟิสิกส์ สสวท. เล่ม 6','IPST Physics Book 6 teacher guide')}</a>`);
  return pages.map(([thai,english,body],i)=>`<section class="shared-note" data-note-key="${i+1}">${heading(t(thai,english))}${body}${i === pages.length - 1 ? references : ''}</section>`);
}
