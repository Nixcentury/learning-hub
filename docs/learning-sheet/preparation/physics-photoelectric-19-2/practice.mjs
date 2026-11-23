import { figure, heading, intensityScale, math, p, table, working } from './notes.mjs';
import { practiceIV, stoppingGrid } from './figures.mjs';

const m = String.raw;
const blanks = '<div class="writing" style="--space:23mm"></div>';

export function exitPractice(th, answers) {
  const t = (thai, english) => th ? thai : english;
  function cloze(title, words, sentences, story, choices) {
    const token = (i, wide) => answers
      ? `<strong class="answer-inline">${choices[i]}</strong>`
      : `<span class="gap${wide?' sentence-gap':''}">${i+1}</span>`;
    return heading(title) +
      p(t('เลือกคำหรือประโยคจากคลังของบทนี้ แล้วเขียนลงในช่อง มีตัวลวงให้พิจารณา',
        'Choose words or sentences from the banks below and write them in the blanks. Some choices are distractors.')) +
      `<div class="banks"><section><h3>Word Bank</h3><ul>${words.map(w=>`<li>${w}</li>`).join('')}</ul></section><section><h3>Sentence Bank</h3><ol>${sentences.map(s=>`<li>${s}</li>`).join('')}</ol></section></div>` +
      `<div class="passage">${story(token)}</div>`;
  }

  const articleA = cloze(t('บทความ A · แสงแบบไหนทำให้อิเล็กตรอนหลุด','Passage A · Which light can release electrons?'),
    t(['ฟังก์ชันงาน','ความเข้ม','โฟตอน','ความถี่ขีดเริ่ม','กระแสไฟฟ้า','ความต้านทาน','ความถี่'],
      ['work function','intensity','photons','threshold frequency','electric current','resistance','frequency']),
    t(['พลังงานต่อโฟตอนเท่าเดิม แต่มีโฟตอนตกกระทบต่อวินาทีมากขึ้น',
       'เมื่อเพิ่มความเข้ม พลังงานต่อโฟตอนเพิ่มขึ้นเสมอ',
       'แสงที่ความถี่ต่ำกว่าขีดเริ่มยังให้กระแสเป็นศูนย์แม้เพิ่มความเข้ม'],
      ['Energy per photon stays the same, while more photons arrive each second.',
       'Increasing intensity always increases energy per photon.',
       'Below threshold, the current remains zero even when intensity increases.']),
    b => p(t(`ในหลอดทดลอง เมื่อเปิดแสงแล้วไมโครแอมมิเตอร์ตรวจพบ ${b(0)} เราอนุมานได้ว่าอิเล็กตรอนจากโลหะเคลื่อนถึงขั้วรับ แสงส่งพลังงานมาเป็นหน่วยที่เรียกว่า ${b(1)} พลังงานต่ำสุดที่อิเล็กตรอนต้องใช้เพื่อหลุดจากผิวโลหะคือ ${b(2)} และความถี่ที่พลังงานต่อโฟตอนเท่ากับค่านั้นเรียกว่า ${b(3)}`,
      `When the microammeter detects ${b(0)} with the light on, electrons from the metal have reached the collector. Light delivers energy in packets called ${b(1)}. The minimum energy needed for an electron to leave the surface is the ${b(2)}, and the frequency where photon energy equals that amount is the ${b(3)}.`)) +
      p(t(`เมื่อใช้แสงเหนือขีดเริ่มและเพิ่มความเข้มโดยคงความถี่ จงอธิบายในระดับโฟตอน`, 'Consider light above threshold. Explain what happens to the photons when intensity increases at fixed frequency.')) + p(b(4,true)) +
      p(t('ถ้าทดลองซ้ำโดยใช้แสงต่ำกว่าขีดเริ่ม ผลที่มิเตอร์อ่านเป็นอย่างไรเมื่อเพิ่มความเข้ม?', 'Repeat below threshold. What happens to the meter reading when intensity increases?'))+p(b(5,true)),
    t(['กระแสไฟฟ้า','โฟตอน','ฟังก์ชันงาน','ความถี่ขีดเริ่ม','พลังงานต่อโฟตอนเท่าเดิม แต่มีโฟตอนตกกระทบต่อวินาทีมากขึ้น','แสงที่ความถี่ต่ำกว่าขีดเริ่มยังให้กระแสเป็นศูนย์แม้เพิ่มความเข้ม'],
      ['electric current','photons','work function','threshold frequency','Energy per photon stays the same, while more photons arrive each second.','Below threshold, the current remains zero even when intensity increases.']));

  const articleB = cloze(t('บทความ B · เราวัดพลังงานจลน์สูงสุดได้อย่างไร','Passage B · How do we measure maximum kinetic energy?'),
    t(['ขั้วปล่อย','ขั้วรับ','สนามไฟฟ้า','ศักย์หยุดยั้ง','กระแสอิ่มตัว','ความยาวคลื่น','ลดลง'],
      ['emitter','collector','electric field','stopping potential','saturation current','wavelength','decreases']),
    t(['อิเล็กตรอนยังออกจากผิวโลหะ แต่ไม่มีอิเล็กตรอนเดินทางถึงขั้วรับ',
       'โฟตอนมีพลังงานลดลงตามความต่างศักย์ต้าน',
       'นำขนาดความต่างศักย์หยุดยั้งคูณด้วยขนาดประจุอิเล็กตรอน'],
      ['Electrons still leave the metal, but none reaches the collector.',
       'Photon energy decreases as retarding voltage increases.',
       'Multiply the stopping-potential magnitude by the magnitude of the electron charge.']),
    b => p(t(`เมื่อเปิดแสงความถี่สูงกว่าขีดเริ่ม อิเล็กตรอนออกจาก ${b(0)} และเคลื่อนไปทาง ${b(1)} การทำให้ขั้วรับมีศักย์ต่ำลงทำให้ ${b(2)} ต้านการเคลื่อนที่ของอิเล็กตรอน เมื่อเพิ่มแรงดันต้าน กระแสที่วัดได้ ${b(3)} ขนาดความต่างศักย์ต้านต่ำสุดที่ทำให้กระแสเป็นศูนย์เรียกว่า ${b(4)}`,
      `Above threshold, electrons leave the ${b(0)} and travel toward the ${b(1)}. Lowering the collector voltage makes the ${b(2)} oppose their motion. As the retarding voltage increases, the measured current ${b(3)}. The smallest retarding voltage magnitude that brings current to zero is the ${b(4)}.`)) +
      p(t('เมื่อมิเตอร์อ่านศูนย์ที่จุดนี้ เกิดอะไรขึ้นในหลอด?', 'What happens in the tube when the meter first reads zero at this setting?'))+p(b(5,true))+
      p(t('จะใช้ค่าที่อ่านได้หาพลังงานจลน์สูงสุดอย่างไร?', 'How do you use the voltage reading to find the maximum kinetic energy?'))+p(b(6,true)),
    t(['ขั้วปล่อย','ขั้วรับ','สนามไฟฟ้า','ลดลง','ศักย์หยุดยั้ง','อิเล็กตรอนยังออกจากผิวโลหะ แต่ไม่มีอิเล็กตรอนเดินทางถึงขั้วรับ','นำขนาดความต่างศักย์หยุดยั้งคูณด้วยขนาดประจุอิเล็กตรอน'],
      ['emitter','collector','electric field','decreases','stopping potential','Electrons still leave the metal, but none reaches the collector.','Multiply the stopping-potential magnitude by the magnitude of the electron charge.']));

  const speed = math(m`c=3.00\times10^8\,\mathrm{m/s}`);
  const planck = math(m`h=6.626\times10^{-34}\,\mathrm{J\,s}=4.136\times10^{-15}\,\mathrm{eV\,s}`);
  const conversion = math(m`1\,\mathrm{eV}=1.602\times10^{-19}\,\mathrm J`);
  function problem(n, title, context, parts) {
    const letters = th ? ['ก','ข','ค','ง'] : ['a','b','c','d'];
    return `<section class="block practice" data-problem="${n}">${heading(n+'. '+title)}${context}${parts.map(([question,solution],i)=>
      `<div class="task" data-part="${i+1}">${p(letters[i]+'. '+question)}${answers?`<div class="teacher-key">${solution}</div>`:blanks}</div>`).join('')}</section>`;
  }
  const q1 = problem(1,t('พลังงานต่อโฟตอนและการแปลงหน่วย','Photon energy and unit conversion'),
    p(t('ลำแสงเดินทางในสุญญากาศและมีความยาวคลื่น 500 nm ใช้ค่าคงที่และค่าการแปลงหน่วยต่อไปนี้',
      'A beam of light travels through a vacuum and has a wavelength of 500 nm. Use the following constants and conversion factor.')+' '+[speed,planck,conversion].join(' · ')),[
      [t('จงหาพลังงานต่อโฟตอนในหน่วย J','Find the photon energy in joules.'),
        working(th,[1],[m`\lambda=500\times10^{-9}\,\mathrm m`,m`E_\gamma=\frac{hc}{\lambda}=\frac{(6.626\times10^{-34})(3.00\times10^8)}{500\times10^{-9}}=3.98\times10^{-19}\,\mathrm J`],t('พลังงานต่อโฟตอนประมาณ 3.98 × 10⁻¹⁹ J','The photon energy is about 3.98 × 10⁻¹⁹ J.'))],
      [t('จงแปลงพลังงานเป็น eV','Convert the energy to electronvolts.'),
        working(th,[1],[m`E_\gamma=\frac{3.9756\times10^{-19}\,\mathrm J}{1.602\times10^{-19}\,\mathrm{J/eV}}=2.48\,\mathrm{eV}`],t('ใช้ค่าก่อนปัดจากข้อ ก.','Use the unrounded value from part a.'))],
    ]);
  const q2 = problem(2,t('แสงสองความถี่บนโลหะเดียวกัน','Two frequencies on the same metal'),
    p(t('โลหะ B ในแล็บมีฟังก์ชันงาน 2.80 eV นักเรียนฉายแสงลงบนโลหะครั้งแรกที่ความถี่ 6.50 × 10¹⁴ Hz แล้วทดลองซ้ำที่ 7.80 × 10¹⁴ Hz ใช้ค่าคงที่ของพลังค์',
      'Metal B in the lab has a work function of 2.80 eV. A student illuminates it at 6.50 × 10¹⁴ Hz, then repeats at 7.80 × 10¹⁴ Hz. Use the Planck constant')+' '+planck+'.'),[
      [t('ตัดสินว่าแต่ละครั้งอิเล็กตรอนหลุดได้หรือไม่ พร้อมแสดงหลักฐานจากพลังงาน','Decide whether each beam produces emission and support the decision using energy.'),
        working(th,[1],[m`E_{\gamma,1}=hf_1=(4.136\times10^{-15})(6.50\times10^{14})=2.69\,\mathrm{eV}`,m`E_{\gamma,2}=hf_2=(4.136\times10^{-15})(7.80\times10^{14})=3.23\,\mathrm{eV}`],t('ครั้งแรกต่ำกว่า 2.80 eV จึงไม่หลุด ครั้งที่สองสูงกว่า 2.80 eV จึงหลุดได้','The first beam is below 2.80 eV, so it produces no emission. The second beam is above 2.80 eV, so emission occurs.'))],
      [t('คำนวณพลังงานจลน์สูงสุดในกรณีที่หลุด','Find maximum kinetic energy for the emitting case.'),
        working(th,[2],[m`K_{\max}=E_\gamma-W=(3.22608-2.80)\,\mathrm{eV}\approx0.43\,\mathrm{eV}`],t('ใช้พลังงานต่อโฟตอนของแสงความถี่สูง','Use the photon energy of the higher-frequency beam.'))],
    ]);
  const q3 = problem(3,t('ความถี่กับความเข้มให้ผลอย่างไร','Effects of frequency and intensity'),
    p(t('นักเรียนตั้งขั้วรับที่ +1.00 V ใช้โลหะ A เดิมและเปิดแสงทุกครั้ง ได้ผลจำลองดังตาราง',
      'With the collector at +1.00 V relative to the emitter, students use the same metal A and keep the light on. The model readings are:')) +
    p(intensityScale(th)) +
    table([t('ครั้ง','Run'),'f (10¹⁴ Hz)',t('ความเข้ม (%)','Intensity (%)'),'I (µA)'],[[1,'5.90',40,'0.00'],[2,'5.90',70,'0.00'],[3,'6.30',70,'2.80'],[4,'6.30',40,'1.60']]),[
      [t('คู่ใดใช้คร่อมความถี่ขีดเริ่ม? ระบุสิ่งที่ควบคุมและช่วงที่สรุปได้',
        'Which pair brackets the threshold? State what was controlled and the inferred interval.'),
       p(t('ครั้ง 2 และ 3 คงโลหะ ความเข้ม 70% และความต่างศักย์ +1.00 V เมื่อเพิ่ม f จาก 5.90 เป็น 6.30 × 10¹⁴ Hz กระแสเริ่มปรากฏ ขีดเริ่มจึงอยู่ระหว่างสองค่านี้',
         'Runs 2 and 3 keep the metal, 70% intensity and +1.00 V fixed. Current appears when f increases from 5.90 to 6.30 × 10¹⁴ Hz, bracketing the threshold.'))],
      [t('เทียบผลของการเพิ่มความเข้มในช่วงต่ำและสูงกว่าขีดเริ่ม แล้วอธิบายจากพลังงานต่อโฟตอน',
        'Compare raising intensity below and above threshold, and explain using energy per photon.'),
       p(t('ครั้ง 1 → 2 กระแสยังเป็นศูนย์ ครั้ง 4 → 3 กระแสเพิ่มจาก 1.60 เป็น 2.80 µA ตามสมการ (1) พลังงานต่อโฟตอนคงเดิมเมื่อ f คงที่ ความเข้มสูงขึ้นทำให้มีโฟตอนตกกระทบมากขึ้น เมื่อพลังงานต่อโฟตอนเพียงพอจึงมีอิเล็กตรอนถึงขั้วรับมากขึ้นต่อวินาที',
         'Runs 1 → 2 remain at zero. Runs 4 → 3 increase from 1.60 to 2.80 µA. Equation (1) keeps energy per photon fixed when f is fixed. Higher intensity supplies more photons. With sufficient energy per photon, more electrons reach the collector each second.'))],
    ]);
  const q4 = problem(4,t('หน้าปัดเป็นศูนย์สามครั้ง','Three readings of zero'),
    p(t('นักเรียนใช้โลหะ A ที่มีฟังก์ชันงาน 2.50 eV แล้วเปลี่ยนการตั้งค่าแสงและศักย์ของขั้วรับตามตาราง มิเตอร์อ่านได้ 0.00 µA ทั้งสามครั้ง',
      'Students use metal A, which has a work function of 2.50 eV. They change the light and collector voltage as shown. The meter reads 0.00 µA in all three cases.')) +
    table([t('กรณี','Case'),t('แสง','Light'),'V (V)'],[
      ['A',t('ปิด','Off'),'+1.00'],['B',t('เปิด · 2.40 eV','On · 2.40 eV'),'+1.00'],['C',t('เปิด · 3.00 eV','On · 3.00 eV'),'−0.60'],
    ]),[
      ...[
        [t('กรณี A','Case A'),t('ปิดแหล่งกำเนิดแสง จึงไม่มีโฟตอนมากระตุ้นการหลุด','The source is off. No incident photons trigger emission.')],
        [t('กรณี B','Case B'),t('โฟตอน 2.40 eV มีพลังงานต่ำกว่า 2.50 eV จึงไม่ทำให้อิเล็กตรอนหลุด','Each 2.40 eV photon is below 2.50 eV, so no electron is emitted.')],
      ].map(([prefix,answer])=>[prefix+' '+t('อิเล็กตรอนหลุดจากผิวหรือไม่ เพราะอะไร?','Are electrons emitted? Explain the zero reading.'),p(answer)]),
      [t('กรณี C อิเล็กตรอนหลุดจากผิวหรือไม่? ถ้าคงแสงเดิมแล้วปรับศักย์ขั้วรับจาก −0.60 V เป็น +1.00 V จะวัดกระแสได้ไหม เพราะอะไร?',
        'In case C, are electrons emitted? If the light is kept fixed and the collector voltage is changed from −0.60 V to +1.00 V, will the meter detect current? Explain.'),
        working(th,[2],[m`K_{\max}=E_\gamma-W=(3.00-2.50)\,\mathrm{eV}=0.50\,\mathrm{eV}`,m`e|V|=e(0.60\,\mathrm V)=0.60\,\mathrm{eV}\gt K_{\max}`],
          t('โฟตอนทำให้อิเล็กตรอนหลุดได้ แรงดันต้านที่ −0.60 V ต้องการพลังงาน 0.60 eV จึงยังวัดกระแสไม่ได้ เมื่อเปลี่ยนเป็น +1.00 V ขั้วรับดึงอิเล็กตรอนที่หลุดให้เคลื่อนถึงขั้วรับ จึงวัดกระแสได้',
            'Photons cause emission. The −0.60 V setting requires 0.60 eV to reach the collector, so the current is initially zero. At +1.00 V the collector attracts the emitted electrons, and a current is measured.'))],
    ]);
  const q5 = problem(5,t('อ่านกราฟกระแสแล้วหาฟังก์ชันงาน','Use an I–V graph to find the work function'),
    p(t('นักเรียนฉายโฟตอนพลังงาน 3.50 eV ลงบนโลหะ แล้วค่อย ๆ ลดศักย์ขั้วรับเทียบกับขั้วปล่อยและบันทึกกระแสดังกราฟ',
      'A student shines 3.50 eV photons on a metal, then gradually lowers the collector voltage relative to the emitter and records the current shown.')) +
    figure(practiceIV(th),t('กราฟ I–V ชุดฝึก','Practice I–V graph.')),[
      [t('กราฟเริ่มอ่านกระแสได้ 0.00 µA ที่ศักย์ขั้วรับกี่โวลต์? ตอบทั้งค่าพร้อมเครื่องหมายและขนาดศักย์หยุดยั้ง',
        'At what collector voltage does the graph first show 0.00 µA? Give both the signed voltage and the stopping-potential magnitude.'),
       p(t('เมื่อกวาดไปทาง V ติดลบ จุดที่กระแสเริ่มเป็นศูนย์อยู่ที่ V ≈ −0.70 V จึงได้ Vₛ ≈ 0.70 V','Sweeping toward negative V, current first reaches zero at V ≈ −0.70 V, so Vₛ ≈ 0.70 V.'))],
      [t('จงหาพลังงานจลน์สูงสุดและฟังก์ชันงานใน eV','Find maximum kinetic energy and work function in eV.'),
       working(th,[4,2],[m`K_{\max}\approx e(0.70\,\mathrm V)=0.70\,\mathrm{eV}`,m`W=E_\gamma-K_{\max}\approx3.50-0.70=2.80\,\mathrm{eV}`],t('คำนวณจากขนาด Vₛ ที่เป็นบวก','Use the positive magnitude Vₛ.'))],
    ]);
  const points = [[4.50,.33],[5.50,.74],[6.50,1.15]];
  const q6 = problem(6,t('สร้างกราฟศักย์หยุดยั้งจากตาราง','Plot a stopping-potential graph from data'),
    p(t('ฉายแสงต่างความถี่ลงบนโลหะตัวอย่างชนิดเดียว ได้ค่าศักย์หยุดยั้งในตาราง ใช้ขนาดประจุอิเล็กตรอน 1.602 × 10⁻¹⁹ C',
      'Shine light at different frequencies on the same sample metal to obtain the stopping potentials shown. Use an electron charge magnitude of 1.602 × 10⁻¹⁹ C.')) +
    table(['f (10¹⁴ Hz)','Vₛ (V)'],points.map(pair=>pair.map(value=>value.toFixed(2)))) +
    figure(stoppingGrid(th,{ filled:answers, points, crossing:3.70, intercept:-1.515 }),
      t('พล็อตข้อมูลแล้วต่อเส้นแนวโน้มด้วยเส้นประไปถึงแกนตั้ง','Plot the data and extend the trend line to the vertical axis using a dashed line.')),[
      [t('จงใช้ความชันหาค่าคงที่ของพลังค์','Use the slope to find the Planck constant.'),
        working(th,[5],[m`\frac{h}{e}=\frac{1.15-0.33}{(6.50-4.50)\times10^{14}}=4.10\times10^{-15}\,\mathrm{V\,s}`,
          m`h=e\frac{h}{e}=(1.602\times10^{-19}\,\mathrm C)(4.10\times10^{-15}\,\mathrm{V\,s})\approx6.57\times10^{-34}\,\mathrm{J\,s}`],
          t('แปลงสเกลแกนความถี่ก่อนคำนวณ','Convert the frequency axis scale before calculating.'))],
      [t('อ่านความถี่ขีดเริ่มและใช้จุดตัดแกนตั้งหาฟังก์ชันงานใน eV','Read the threshold frequency and use the vertical intercept to find the work function in eV.'),
        working(th,[5],[m`f_0\approx3.70\times10^{14}\,\mathrm{Hz}`,m`-W/e\approx-1.52\,\mathrm V\quad\Rightarrow\quad W\approx1.52\,\mathrm{eV}`],
          t('จุดตัดแกนตั้งมาจากแนวเส้นต่อ','Read the vertical intercept from the extrapolated line.'))],
    ]);
  const q10 = problem(10,t('ความเข้มแสงและจำนวนอนุภาค','Light intensity and particle counts'),
    p(t('ฉายแสงตั้งฉาก ความเข้ม 0.30 W/m² ลงบนพื้นที่ 4.0 cm² เป็นเวลา 2.0 s โฟตอนแต่ละตัวมีพลังงาน 6.0 × 10⁻¹⁹ J สมมติว่าทุกโฟตอนถูกดูดกลืนและทำให้อิเล็กตรอนหลุดหนึ่งตัว',
      'Light of intensity 0.30 W/m² is incident normally on 4.0 cm² for 2.0 s. Each photon carries 6.0 × 10⁻¹⁹ J. Assume every photon is absorbed and releases one electron.')),[
      [t('จงหาพลังงานแสงรวมที่ตกกระทบและจำนวนอิเล็กตรอนที่หลุด','Find the total incident light energy and the number of electrons emitted.'),
        working(th,[7,8],[m`E_{\mathrm{total}}=I_{\mathrm{light}}A\Delta t=(0.30\,\mathrm{W/m^2})(4.0\times10^{-4}\,\mathrm{m^2})(2.0\,\mathrm s)=2.4\times10^{-4}\,\mathrm J`,
          m`N=\frac{E_{\mathrm{total}}}{E_\gamma}=\frac{2.4\times10^{-4}\,\mathrm J}{6.0\times10^{-19}\,\mathrm J}=4.0\times10^{14}`],
          t('ใช้พื้นที่ในหน่วยตารางเมตร','Use the area in square metres.'))],
    ]);
  const q11 = problem(11,t('แสงเดียวกันกับโลหะสองชนิด','One light source, two metals'),
    p(t('แสงที่ความถี่ขีดเริ่มของโลหะ X ซึ่งมีฟังก์ชันงาน 4.00 eV เมื่อนำไปฉายลงบนโลหะ Y พบว่ามีศักย์หยุดยั้ง 1.60 V',
      'Light at the threshold frequency of metal X, whose work function is 4.00 eV, gives a stopping potential of 1.60 V when it shines on metal Y.')),[
      [t('จงหาพลังงานต่อโฟตอนและฟังก์ชันงานของโลหะ Y','Find the photon energy and the work function of metal Y.'),
        working(th,[3,4,2],[m`E_\gamma=W_X=4.00\,\mathrm{eV}`,m`K_{\max,Y}=eV_s=1.60\,\mathrm{eV}`,m`W_Y=E_\gamma-K_{\max,Y}=(4.00-1.60)\,\mathrm{eV}=2.40\,\mathrm{eV}`],
          t('แสงชุดเดิมให้พลังงานต่อโฟตอนเท่าเดิมเมื่อเปลี่ยนโลหะ','The same light delivers the same energy per photon to either metal.'))],
    ]);
  const problems = [q1,q2,q3,q4,q5,q6];
  return [articleA,articleB,...(answers?problems:[q1+q2,q3+q4,q5,q6]),q10+q11];
}

export function recall(th, answers) {
  const t = (thai, english) => th ? thai : english;
  const stoppingPotential = math('V_s');
  const maximumEnergy = math(String.raw`K_{\max}=eV_s`);
  const prompts = [
    t(['ปรากฏการณ์โฟโตอิเล็กทริกคืออะไร?', 'การที่อิเล็กตรอนหลุดออกจากผิวโลหะเมื่อแสงที่มีความถี่สูงพอส่องลงบนผิวโลหะ'],
      ['What is the photoelectric effect?', 'Electrons are emitted from a metal surface when light of sufficiently high frequency shines on it.']),
    t(['ความถี่ขีดเริ่มคืออะไร?', 'ความถี่ต่ำสุดของแสงที่ทำให้อิเล็กตรอนหลุดออกจากผิวโลหะชนิดนั้นได้'],
      ['What is the threshold frequency?', 'The minimum frequency of light needed to eject electrons from the surface of that metal.']),
    t(['ฟังก์ชันงานของโลหะคืออะไร?', 'พลังงานต่ำสุดที่ต้องใช้เพื่อให้อิเล็กตรอนหนึ่งตัวหลุดออกจากผิวโลหะ'],
      ['What is the work function of a metal?', 'The minimum energy needed to eject one electron from a metal surface.']),
    t(['ศักย์หยุดยั้งคืออะไร?', 'ขนาดของความต่างศักย์ย้อนกลับที่พอดีทำให้แม้แต่โฟโตอิเล็กตรอนที่มีพลังงานจลน์สูงสุดก็ไปไม่ถึงขั้วรับ'],
      ['What is the stopping potential?', 'The magnitude of the reverse potential difference just sufficient to prevent even the most energetic photoelectrons from reaching the collector.']),
    t(['ในการทดลอง เราหาพลังงานจลน์สูงสุดของโฟโตอิเล็กตรอนได้อย่างไร?', `เริ่มจากสภาวะที่วัดกระแสโฟโตอิเล็กทริกได้ เพิ่มขนาดความต่างศักย์ย้อนกลับจนกระแสลดลงถึงศูนย์ อ่านขนาดศักย์หยุดยั้ง ${stoppingPotential} แล้วคำนวณ ${maximumEnergy} โดย e คือขนาดประจุของอิเล็กตรอน`],
      ['How do we determine the maximum kinetic energy of the photoelectrons in the experiment?', `Start with a measurable photocurrent. Increase the magnitude of the reverse potential difference until the current drops to zero. Read the stopping potential magnitude ${stoppingPotential}, then calculate ${maximumEnergy}, where e is the magnitude of the electron charge.`]),
  ];
  return heading('Knowledge Recall')+p(t('พับหรือปิดส่วน Notes แล้วตอบแต่ละข้อสั้น ๆ ด้วยคำพูดของตนเอง เขียนสมการประกอบได้',
    'Fold or close the Notes section and answer each question briefly in your own words. You may include an equation.'))+
    prompts.map(([q,a],i)=>`<section class="block">${p((i+1)+'. '+q)}${answers?`<div class="teacher-key">${p(a)}</div>`:'<div class="writing" style="--space:24mm"></div>'}</section>`).join('');
}
