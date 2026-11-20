import { tube, thresholds, teachingIV } from './figures.mjs';

export const labUrl = 'https://nixcentury.github.io/learning-hub/#physics/bank/b-6011652496e13a2c7b17fe1c/photoelectric-lab';
export const equations = [
  String.raw`E_\gamma=hf=\frac{hc}{\lambda}`,
  String.raw`K_{\max}=hf-W`,
  String.raw`W=hf_0`,
  String.raw`K_{\max}=eV_s`,
];
export const math = tex => String.raw`\(${tex}\)`;
export const heading = text => `<h2>${text}</h2>`;
export const p = text => `<p>${text}</p>`;
export const table = (headers, rows) => `<table><thead><tr>${headers.map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(s=>`<td>${s}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export const figure = (image, caption) => `<figure>${image}<figcaption>${caption}</figcaption></figure>`;
export const list = lines => `<ol>${lines.map(s=>`<li>${s}</li>`).join('')}</ol>`;
const fUnit = '10¹⁴ Hz';
const box = n => `<div class="equation" data-equation="${n}"><span>${math(equations[n-1])}</span><span>(${n})</span></div>`;
export function working(th, refs, lines, conclusion) {
  return `<div class="working"><p>${th?'ใช้สมการ':'Use equation'} ${refs.map(n=>`<span data-equation-ref="${n}">(${n})</span> ${math(equations[n-1])}`).join(' · ')}</p>${lines.map(tex=>p(math(tex))).join('')}${p(conclusion)}</div>`;
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
  const tableReading = (f, intensity, voltage, metal = 'A') =>
    lab.measure({light:true,metal,frequency:f,intensity,voltage}).current.toFixed(2);
  const measureRows = [6,6,6.1,6.1].map((f,i)=>{
    const intensity = [50,80,80,50][i];
    const current = tableReading(f,intensity,1);
    return [f.toFixed(2),intensity,current];
  });
  const metalRows = [6.40, 7.10, 7.60].map(f => [f.toFixed(2),
    ...['A', 'B', 'C'].map(metal => tableReading(f, 50, 1, metal))]);
  const photonConstants = p(t('ค่าที่ใช้คำนวณ','Calculation data')+' · '+
    [m`h=6.626\times10^{-34}\,\mathrm{J\,s}`,m`c=3.00\times10^8\,\mathrm{m/s}`,
      m`1\,\mathrm{eV}=1.602\times10^{-19}\,\mathrm J`,m`1\,\mathrm{nm}=10^{-9}\,\mathrm m`].map(math).join(' · '));
  const sweep = lab.teaching.sweep.map(v=>[v,Number(tableReading(lab.teaching.frequency,50,v))]);
  const ex = (n, title, prompt, answer) => `<div class="block example" data-example-number="${n}"><h3>${t('ตัวอย่าง','Example')} ${n} · ${title}</h3>${p(prompt)}${filled?`<div class="note-answer">${answer}</div>`:'<div class="writing" style="--space:46mm"></div>'}</div>`;
  const pages = [
    [
      'หลักฐานว่าอิเล็กตรอนหลุดจากผิวโลหะ','Evidence that electrons leave the metal',
      c('การแทรกสอดของแสงทำให้เราเห็นริ้วสว่างและมืด คราวนี้ฉายแสงลงบนผิวโลหะ ถ้าเรามองไม่เห็นอิเล็กตรอน เราจะรู้ได้อย่างไรว่ามันหลุดออกมา?',
        'Light interference produces bright and dark fringes. Now shine light onto a metal surface. If we cannot see individual electrons, how can we tell whether they leave the surface?') +
      figure(tube(th),t('วงจรของแล็บ · แสงตกกระทบขั้วปล่อย ขั้วรับอยู่ฝั่งตรงข้าม มิเตอร์วัดกระแสในวงจร','Lab circuit · light hits the emitter, the collector faces it, and the meter measures circuit current.')) +
      `<h3>${t('เปรียบเทียบก่อนและหลังเปิดแสง','Compare light off and on')}</h3>` +
      c('ใช้โลหะ A และศักย์ขั้วรับ +1.00 V เมื่อปิดแสง มิเตอร์อ่านได้ 0.00 µA เมื่อฉายโฟตอนพลังงาน 3.00 eV ที่ความเข้ม 50% มิเตอร์อ่านได้ 2.00 µA',
        'Use metal A and a collector voltage of +1.00 V. With the light off the meter reads 0.00 µA. With 3.00 eV photons at 50% intensity, it reads 2.00 µA.') +
      activity(th,t('ค่ากระแสก่อนและหลังเปิดแสงบอกอะไร?', 'What do the readings before and after switching on the light show?'),
        t('0.00 → 2.00 µA กระแสที่ตรวจพบแสดงว่ามีอิเล็กตรอนเคลื่อนจากผิวโลหะไปถึงขั้วรับ','0.00 → 2.00 µA. The measured current shows that electrons travelled from the metal to the collector.'),filled) +
      `<h3>${t('ผลของความถี่และความเข้ม','Effects of frequency and intensity')}</h3>` +
      c('ตารางให้ค่ากระแสเมื่อเปิดแสง โดยคงโลหะ A และศักย์ขั้วรับ +1.00 V แถว 1–2 และ 3–4 ใช้เทียบความเข้ม แถว 2–3 ใช้เทียบความถี่',
        'The table gives the current with the light on, metal A and the collector at +1.00 V. Compare intensity using rows 1–2 and 3–4, then compare frequency using rows 2–3.') +
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
      c('ตารางแสดงกระแสของโลหะสามชนิดเมื่อใช้ความเข้ม 50% และศักย์ขั้วรับ +1.00 V เท่ากัน',
        'The table gives the currents for three metals at the same 50% intensity and +1.00 V collector voltage.') +
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
      activity(th,t('ถ้ายังเปิดแสงความถี่เดิมที่สูงกว่าขีดเริ่ม แล้วปรับจนมิเตอร์อ่านศูนย์ อิเล็กตรอนยังหลุดไหม?',
        'If the light stays on above threshold, do electrons still leave the surface when you tune the voltage to a zero meter reading?'),
        t('ยังหลุด เพราะพลังงานต่อโฟตอนยังสูงกว่า W เมื่อแรงดันต้านมากพอ อิเล็กตรอนไปไม่ถึงขั้วรับ กระแสที่วงจรจึงเป็นศูนย์',
          'Yes. Photon energy still exceeds W. The retarding voltage prevents electrons from reaching the collector, so the circuit current falls to zero.'),filled)
    ],
    [
      'อ่านศักย์หยุดยั้งจากกราฟกระแส','Read the stopping potential from the current graph',
      c('ฉายโฟตอนพลังงาน 3.00 eV ลงบนโลหะ A ที่ความเข้ม 50% กราฟและตารางแสดงผลเมื่อเปลี่ยนศักย์ขั้วรับเทียบกับขั้วปล่อย',
        'Light with photons of 3.00 eV illuminates metal A at 50% intensity. The graph and table show how the current changes with collector voltage relative to the emitter.') +
      figure(teachingIV(th,sweep),t('จุดคือค่าบันทึกจากแบบจำลองของแล็บ เส้นคือแนวโน้มของแบบจำลองที่ใช้ในชุดสอน','Dots show readings from the lab model. The line shows the teaching model’s trend.')) +
      table([t('ศักย์ขั้วรับเทียบขั้วปล่อย V (V)','Collector voltage relative to emitter V (V)'), 'I (µA)'],sweep.map(([v,i])=>[lab.signed(v),i.toFixed(2)])) +
      activity(th,t('จุดสุดท้ายที่ยังมีกระแสและจุดแรกที่อ่านได้ศูนย์บอกช่วงใด? แยกค่า V ที่มีเครื่องหมายออกจากขนาด Vₛ',
        'Which interval is marked by the last nonzero reading and the first zero? Distinguish signed V from the magnitude Vₛ.'),
        t('ที่ −0.45 V ยังอ่านได้ 0.20 µA ที่ −0.50 V อ่านได้ศูนย์ ข้อมูลสองจุดจึงให้ 0.45 &lt; Vₛ ≤ 0.50 V ค่าประมาณจากจุดแรกที่เป็นศูนย์คือ V = −0.50 V หรือ Vₛ ≈ 0.50 V ชุดสอนตั้งให้จุดหยุดจริงในแบบจำลองอยู่ตรงค่านี้',
          'At −0.45 V the current is 0.20 µA. At −0.50 V it is zero. The two samples bracket 0.45 &lt; Vₛ ≤ 0.50 V. The first zero gives V ≈ −0.50 V or Vₛ ≈ 0.50 V, which equals the exact model cutoff for this preset.'),filled) +
      c('เมื่อกระแสเป็นศูนย์ ให้พิจารณาทั้งพลังงานของแสงและศักย์ขั้วรับ กระแสจะเกิดเมื่อมีอิเล็กตรอนหลุดและไปถึงขั้วรับ',
        'A zero current calls for checking both the photon energy and collector voltage. Current requires electrons to leave the surface and reach the collector.')
    ],
    [
      'ตัวอย่าง 1–2 · คำนวณจากพลังงานโฟตอน','Examples 1–2 · Calculations from photon energy',
      photonConstants +
      ex(1,t('พลังงานของโฟตอน','Photon energy'),
        t('แสงในสุญญากาศมีความยาวคลื่น 413.3 nm จงคำนวณพลังงานของโฟตอนหนึ่งตัวในหน่วยจูลและอิเล็กตรอนโวลต์',
          'Light in vacuum has a wavelength of 413.3 nm. Calculate the energy of one photon in joules and electronvolts.'),
        working(th,[1],[m`\lambda=413.3\times10^{-9}\,\mathrm m`,m`E_\gamma=\frac{(6.626\times10^{-34})(3.00\times10^8)}{413.3\times10^{-9}}=4.81\times10^{-19}\,\mathrm J`,m`E_\gamma=\frac{4.81\times10^{-19}}{1.602\times10^{-19}}\,\mathrm{eV}\approx3.00\,\mathrm{eV}`],t('โฟตอนหนึ่งตัวมีพลังงานประมาณ 3.00 eV','Each photon carries about 3.00 eV.'))) +
      ex(2,t('หาฟังก์ชันงานจากความถี่ขีดเริ่ม','Work function from threshold frequency'),
        t('โลหะ A มีความถี่ขีดเริ่มประมาณ 6.04 × 10¹⁴ Hz จงคำนวณฟังก์ชันงานใน eV และพลังงานจลน์สูงสุดเมื่อฉายโฟตอน 3.00 eV',
          'Metal A has a threshold frequency of about 6.04 × 10¹⁴ Hz. Find the work function in eV and the maximum kinetic energy under 3.00 eV photons.'),
        working(th,[3,2],[m`W=(6.626\times10^{-34})(6.04\times10^{14})=4.00\times10^{-19}\,\mathrm J\approx2.50\,\mathrm{eV}`,m`K_{\max}=3.00-2.50=0.50\,\mathrm{eV}`],t('โฟตอนมีพลังงานมากกว่า W จึงเกิดการหลุด','Photon energy exceeds W, so emission occurs.')))
    ],
    [
      'ตัวอย่าง 3–4 · ตรวจการหลุดและเทียบโลหะ','Examples 3–4 · Check emission and compare metals',
      photonConstants +
      ex(3,t('ความยาวคลื่นที่ยาวเกินขีดเริ่ม','A wavelength beyond threshold'),
        t('ฉายแสงความยาวคลื่น 600 nm ลงบนโลหะ A ที่มีฟังก์ชันงาน 2.50 eV จงคำนวณพลังงานต่อโฟตอนแล้วตัดสินว่าอิเล็กตรอนหลุดหรือไม่',
          'Shine 600 nm light on metal A, whose work function is 2.50 eV. Calculate the energy per photon and decide whether electrons are emitted.'),
        working(th,[1],[m`E_\gamma=\frac{(6.626\times10^{-34})(3.00\times10^8)}{600\times10^{-9}}=3.31\times10^{-19}\,\mathrm J\approx2.07\,\mathrm{eV}`],t('2.07 eV ต่ำกว่า 2.50 eV จึงไม่มีโฟโตอิเล็กตรอนให้หาพลังงานจลน์','2.07 eV is below 2.50 eV, so no photoelectrons are available for a kinetic-energy calculation.'))) +
      ex(4,t('ฉายแสงชุดเดียวกันลงบนโลหะสามชนิด','One light setting, three metals'),
        t('ฉายโฟตอนพลังงาน 3.00 eV ลงบนโลหะ A, B และ C ซึ่งมีฟังก์ชันงาน 2.50, 2.80 และ 3.10 eV ตามลำดับ โลหะใดปล่อยอิเล็กตรอน และอิเล็กตรอนจากแต่ละโลหะที่ปล่อยได้มีพลังงานจลน์สูงสุดกี่ eV?',
          'Shine 3.00 eV photons on metals A, B and C, whose work functions are 2.50, 2.80 and 3.10 eV, respectively. Which metals emit electrons, and what is the maximum kinetic energy in eV for each emitting metal?'),
        working(th,[2],[m`K_{\max,\mathrm A}=3.00-2.50=0.50\,\mathrm{eV}`,m`K_{\max,\mathrm B}=3.00-2.80=0.20\,\mathrm{eV}`],t('A และ B ปล่อยโฟโตอิเล็กตรอน ส่วน C มี W สูงกว่า 3.00 eV จึงไม่เกิดการหลุด',
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
        working(th,[4,2],[m`V\approx-0.50\,\mathrm V,\qquad V_s\approx0.50\,\mathrm V`,m`K_{\max}\approx(1.602\times10^{-19}\,\mathrm C)(0.50\,\mathrm V)=8.01\times10^{-20}\,\mathrm J=0.50\,\mathrm{eV}`,m`W=E_\gamma-K_{\max}\approx3.00-0.50=2.50\,\mathrm{eV}`],t('ข้อมูลที่วัดคร่อม 0.45 &lt; Vₛ ≤ 0.50 V การคำนวณใช้จุดศูนย์แรกเป็นค่าประมาณ',
          'The measurements bracket 0.45 &lt; Vₛ ≤ 0.50 V. The calculation uses the first zero as an estimate.')))
    ],
  ];
  const references = p(t('อ่านเสริม','Further reading')+' · '+link(th)+' · '+
    `<a href="https://pubhtml5.com/yffk/rmif/basic/51-100">${t('คู่มือครูฟิสิกส์ สสวท. เล่ม 6','IPST Physics Book 6 teacher guide')}</a>`);
  return pages.map(([thai,english,body],i)=>`<section class="shared-note" data-note-key="${i+1}">${heading(t(thai,english))}${body}${i === pages.length - 1 ? references : ''}</section>`);
}
