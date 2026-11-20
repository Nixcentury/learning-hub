import { figure, heading, math, p, table, working } from './notes.mjs';
import { practiceIV, practiceEnergy } from './figures.mjs';

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
        working(th,[1],[m`\lambda=500\times10^{-9}\,\mathrm m`,m`E_\gamma=\frac{(6.626\times10^{-34})(3.00\times10^8)}{500\times10^{-9}}=3.98\times10^{-19}\,\mathrm J`],t('พลังงานต่อโฟตอนประมาณ 3.98 × 10⁻¹⁹ J','The photon energy is about 3.98 × 10⁻¹⁹ J.'))],
      [t('จงแปลงพลังงานเป็น eV','Convert the energy to electronvolts.'),
        working(th,[1],[m`E_\gamma=\frac{3.9756\times10^{-19}\,\mathrm J}{1.602\times10^{-19}\,\mathrm{J/eV}}=2.48\,\mathrm{eV}`],t('ใช้ค่าก่อนปัดจากข้อ ก.','Use the unrounded value from part a.'))],
    ]);
  const q2 = problem(2,t('แสงสองความถี่บนโลหะเดียวกัน','Two frequencies on the same metal'),
    p(t('โลหะ B ในแล็บมีฟังก์ชันงาน 2.80 eV นักเรียนฉายแสงลงบนโลหะครั้งแรกที่ความถี่ 6.50 × 10¹⁴ Hz แล้วทดลองซ้ำที่ 7.80 × 10¹⁴ Hz ใช้ค่าคงที่ของพลังค์',
      'Metal B in the lab has a work function of 2.80 eV. A student illuminates it at 6.50 × 10¹⁴ Hz, then repeats at 7.80 × 10¹⁴ Hz. Use the Planck constant')+' '+planck+'.'),[
      [t('ตัดสินว่าแต่ละครั้งอิเล็กตรอนหลุดได้หรือไม่ พร้อมแสดงหลักฐานจากพลังงาน','Decide whether each beam produces emission and support the decision using energy.'),
        working(th,[1],[m`E_{\gamma,1}=(4.136\times10^{-15})(6.50\times10^{14})=2.69\,\mathrm{eV}`,m`E_{\gamma,2}=(4.136\times10^{-15})(7.80\times10^{14})=3.23\,\mathrm{eV}`],t('ครั้งแรกต่ำกว่า 2.80 eV จึงไม่หลุด ครั้งที่สองสูงกว่า 2.80 eV จึงหลุดได้','The first beam is below 2.80 eV, so it produces no emission. The second beam is above 2.80 eV, so emission occurs.'))],
      [t('คำนวณพลังงานจลน์สูงสุดในกรณีที่หลุด','Find maximum kinetic energy for the emitting case.'),
        working(th,[2],[m`K_{\max}=3.22608-2.80\approx0.43\,\mathrm{eV}`],t('ใช้พลังงานต่อโฟตอนของแสงความถี่สูง','Use the photon energy of the higher-frequency beam.'))],
    ]);
  const q3 = problem(3,t('ความถี่กับความเข้มให้ผลอย่างไร','Effects of frequency and intensity'),
    p(t('นักเรียนตั้งขั้วรับที่ +1.00 V ใช้โลหะ A เดิมและเปิดแสงทุกครั้ง ได้ผลจำลองดังตาราง',
      'With the collector at +1.00 V relative to the emitter, students use the same metal A and keep the light on. The model readings are:')) +
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
        working(th,[2],[m`K_{\max}=3.00\,\mathrm{eV}-2.50\,\mathrm{eV}=0.50\,\mathrm{eV}`],
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
  const q6 = problem(6,t('อ่านกราฟพลังงานจลน์สูงสุดกับความถี่','Interpret a maximum-kinetic-energy graph'),
    p(t('โจทย์แต่งแนว A-Level จุดที่ระบุบนกราฟมีพิกัดในหน่วยตามแกน เส้นประเป็นส่วนต่อของเส้นตรง',
      'A-Level-style practice. The labelled point coordinates use the scaled axis units. The dashed line is an extrapolation.')) +
    figure(practiceEnergy(th),t('กราฟพลังงานจลน์สูงสุดกับความถี่ชุดฝึก','Practice graph of maximum kinetic energy versus frequency.'))+
    p(t('เมื่อฉายแสงความถี่ 6.00 × 10¹⁴ Hz วัดพลังงานจลน์สูงสุดได้ 1.32 × 10⁻¹⁹ J เมื่อเพิ่มความถี่เป็น 8.00 × 10¹⁴ Hz วัดได้ 2.64 × 10⁻¹⁹ J',
      'At a light frequency of 6.00 × 10¹⁴ Hz, the maximum kinetic energy is 1.32 × 10⁻¹⁹ J. At 8.00 × 10¹⁴ Hz, it is 2.64 × 10⁻¹⁹ J.')),[
      [t('จงหาค่าคงที่ของพลังค์จากความชัน','Find the Planck constant from the slope.'),
       working(th,[2],[m`h=\frac{\Delta K_{\max}}{\Delta f}=\frac{(2.64-1.32)\times10^{-19}}{(8.00-6.00)\times10^{14}}=6.60\times10^{-34}\,\mathrm{J\,s}`],t('ตัวคูณกำลังสิบมาจากหน่วยบนแกนทั้งสอง','The powers of ten come from the axis scales.'))],
      [t('จงอ่านจุดตัดแกนนอน แล้วหาฟังก์ชันงานของโลหะในหน่วย J','Read the horizontal intercept and find the work function in joules.'),
       working(th,[3],[m`f_0=4.00\times10^{14}\,\mathrm{Hz}`,m`W=(6.60\times10^{-34})(4.00\times10^{14})=2.64\times10^{-19}\,\mathrm J`],t('จุดตัดแกนตั้งของเส้นต่อเท่ากับ −W','The extrapolated vertical intercept is −W.'))],
    ]);

  const problems = [q1,q2,q3,q4,q5,q6];
  return [articleA,articleB,...(answers?problems:[q1+q2,q3+q4,q5+q6])];
}

export function recall(th, answers) {
  const t = (thai, english) => th ? thai : english;
  const prompts = [
    t(['มิเตอร์วัดอะไร และกระแสที่ตรวจพบบอกอะไรเกี่ยวกับอิเล็กตรอน?','กระแสในวงจร อิเล็กตรอนจากโลหะไปถึงขั้วรับ'],
      ['What does the meter measure, and what does a nonzero reading tell you about electrons?','It measures circuit current. Electrons emitted from the metal have reached the collector.']),
    t(['เขียนเงื่อนไขต่ำกว่า พอดี และสูงกว่าความถี่ขีดเริ่ม แล้วบอกผลของการเพิ่มความเข้มเมื่อคงความถี่','ต่ำกว่าไม่หลุด ที่ขีดเริ่ม Kₘₐₓ = 0 ในอุดมคติ สูงกว่าได้ Kₘₐₓ เป็นบวก เมื่อ f คงที่ การเพิ่มความเข้มเพิ่มจำนวนโฟตอนต่อวินาที และเพิ่มกระแสเมื่ออยู่เหนือขีดเริ่มในเงื่อนไขเก็บอิเล็กตรอนเดิม'],
      ['State the below, at and above threshold cases. What does increasing intensity do at fixed frequency?','Below threshold there is no emission. At threshold Kₘₐₓ = 0 in the ideal limit. Above threshold Kₘₐₓ is positive. At fixed f, higher intensity raises photon rate and, above threshold with the same collecting setup, raises current.']),
    t(['เมื่อกระแสเป็นศูนย์ ให้ตรวจการตั้งค่าใดบ้างก่อนสรุปว่าอิเล็กตรอนหลุดหรือไม่?','ตรวจว่าเปิดแสงไหม ความถี่สูงพอหรือไม่ และแรงดันต้านขัดขวางการถึงขั้วรับไหม'],
      ['Which settings should you check before deciding whether electrons were emitted when current is zero?','Check whether the light is on, whether f is above threshold, and whether retarding voltage stops electrons from reaching the collector.']),
    t(['เมื่อกระแสลดลงถึงศูนย์ ค่าศักย์ขั้วรับที่อ่านจากกราฟมีเครื่องหมายอะไร และจะใช้ขนาดศักย์หยุดยั้งหาพลังงานจลน์สูงสุดอย่างไร?','ที่จุดหยุดยั้ง V = −Vₛ และ Kₘₐₓ = eVₛ'],
      ['When the current drops to zero, what sign does the collector voltage have? How can you use the stopping-potential magnitude to find the maximum kinetic energy?','At cutoff, V = −Vₛ and Kₘₐₓ = eVₛ.']),
    t(['เมื่อเขียนกราฟพลังงานจลน์สูงสุดเทียบกับความถี่ของแสง ความชันและจุดตัดแกนทั้งสองบอกอะไร?','ความชันคือ h เมื่อใช้หน่วยสอดคล้องกัน จุดตัดแกนนอนคือ f₀ จุดตัดแกนตั้งจากเส้นต่อคือ −W'],
      ['On a graph of maximum kinetic energy against light frequency, what do the slope and the two intercepts represent?','The slope is h in consistent units. The horizontal intercept is f₀, and the extrapolated vertical intercept is −W.']),
  ];
  return heading('Knowledge Recall')+p(t('พับหรือปิดส่วน Notes แล้วตอบจากความจำ','Cover or close the Notes and answer from memory.'))+
    prompts.map(([q,a],i)=>`<section class="block">${p((i+1)+'. '+q)}${answers?`<div class="teacher-key">${p(a)}</div>`:'<div class="writing" style="--space:24mm"></div>'}</section>`).join('');
}
