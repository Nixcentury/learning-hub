import { isotope as nuclide, line, para } from './notes.mjs';

const n = nuclide;
const beta = n(0,'−1','e');
const alpha = n(4,2,'He');
const a = '∑ A<sub>left</sub> = ∑ A<sub>right</sub>';
const z = '∑ Z<sub>left</sub> = ∑ Z<sub>right</sub>';
const f = 'f = m<sub>t</sub>/m<sub>0</sub> = (½)<sup>n</sup>';
const nt = 'n = t/T<sub>½</sub>';
const m = 'm<sub>decay</sub> = m<sub>0</sub> − m<sub>t</sub>';

export function exercises(lang, filled) {
  const en = lang === 'en';
  const t = (th, eng) => en ? eng : th;
  const p = (th, eng) => para(t(th, eng));

  function part(index, prompt, answer, mm) {
    const label = t('กขคง'[index], 'abcd'[index]);
    const response = filled
      ? `<div class="teacher-key">${answer}</div>`
      : `<div class="response-space" style="height:${mm}mm"></div>`;
    return `<div class="task"><p><strong>${label}.</strong> ${prompt}</p>${response}</div>`;
  }

  const group = (title, lead, parts) => `<section class="question"><h3>${title}</h3>${lead ? para(lead) : ''}${parts.map(([prompt,answer,height],i)=>part(i,prompt,answer,height)).join('')}</section>`;
  const use = numbers => p(`<strong>ใช้สมการ ${numbers}</strong>`,`<strong>Use ${numbers.includes('–')?'equations':'equation'} ${numbers}</strong>`);
  const ex = (number, th, eng, lead, parts) => group(`${number}. ${t(th,eng)}`,lead,parts);

  return [
    {key:'cloze',title:t('เติมคำแล้วอธิบายจากความเข้าใจ','Complete the passages and explain'),body:
      p('เติมวลีสำคัญลงในพื้นที่แต่ละข้อ แล้วเขียนเหตุผลสั้น ๆ ในข้อที่กำหนด',
        'Complete each statement in the space below it. Give a short reason where requested.')+
      group(t('บทอ่าน A · สิ่งที่เปลี่ยนในนิวเคลียส','Passage A · What changes in the nucleus'),
        t('ในห้องเรียน เด็กสองคนดูสมการสลายของไอโซโทปชนิดเดียวกันและติดตามเลขบนกับเลขล่างทีละขั้น',
          'Two students read a decay equation and follow its upper and lower numbers step by step.'),[
        [t('เลขที่บอกชนิดของธาตุคือ …','The number that identifies an element is …'),
         p('เลขอะตอม Z ซึ่งเท่ากับจำนวนโปรตอน','Atomic number Z, the number of protons.'),12],
        [t('ในการสลายแบบบีตาลบ นิวเคลียสลูกมีเลขอะตอม … เพราะ …','In beta-minus decay the daughter’s atomic number … because …'),
         p('เพิ่มขึ้น 1 เพราะนิวตรอนหนึ่งตัวเปลี่ยนเป็นโปรตอน','Increases by 1 because a neutron becomes a proton.'),16],
        [t('เมื่อปล่อยแกมมา เลขมวลและเลขอะตอม … สิ่งที่ลดลงคือ …','In gamma emission, mass number and atomic number … What decreases is …'),
         p('คงเดิม พลังงานของนิวเคลียสลดลง','Stay the same. The nuclear energy decreases.'),15],
      ])+
      group(t('บทอ่าน B · ติดตามสารตั้งต้น','Passage B · Track the starting isotope'),
        t('ทั้งคู่กลับมาดูข้อมูลตามเวลา คราวนี้ติดตามเฉพาะไอโซโทปเดิมที่ยังไม่สลาย',
          'They return to the time data and track the original isotope still present.'),[
        [t('หนึ่งครึ่งชีวิตคือช่วงเวลาที่จำนวนนิวเคลียสของไอโซโทปเดิมที่ยังไม่สลาย …','One half-life is the time in which the number of undecayed nuclei of the original isotope …'),
         p('ลดลงเหลือครึ่งหนึ่ง','Decreases to one half.'),12],
        [t('ถ้าเหลือ 25% ส่วนที่สลายไปแล้วเป็น … แสดงวิธีคิดสั้น ๆ','If 25% remains, the fraction already decayed is … Show a short calculation.'),
         p('100% − 25% = 75%','100% − 25% = 75%.'),16],
      ])},
    {key:'identify',title:t('อ่านข้อมูลและจำแนกรังสี','Read data and identify radiation'),body:
      ex(1,'ไอโซโทปและเสถียรภาพ','Isotopes and stability',
        t('พิจารณา C-12 (Z = 6), C-14 (Z = 6) และ Ra-226 (Z = 88) โดย C-12 เสถียร ส่วน C-14 และทุกไอโซโทปของ Ra ไม่เสถียร',
          'Consider C-12 (Z = 6), C-14 (Z = 6) and Ra-226 (Z = 88). C-12 is stable. C-14 and every isotope of Ra are unstable.'),[
        [t('หาโปรตอนและนิวตรอนของ C-12 กับ C-14','Find the proton and neutron numbers of C-12 and C-14.'),
         use('(1)')+line('N = A − Z')+line('C-12: N = 12 − 6 = 6')+line('C-14: N = 14 − 6 = 8')+p('ทั้งคู่มีโปรตอน 6 ตัว','Both have 6 protons.'),23],
        [t('ธาตุใดไม่มีไอโซโทปเสถียร? ใช้ข้อมูลที่ให้มาอธิบาย','Which element has no stable isotopes? Explain using the data.'),
         p('Ra เพราะทุกไอโซโทปของ Ra ไม่เสถียร คาร์บอนมี C-12 ที่เสถียร','Ra, since every isotope of Ra is unstable. Carbon has the stable isotope C-12.'),18],
      ])+
      ex(2,'ชนิดของรังสีจากสนามไฟฟ้า','Radiation in an electric field',
        t('มี α, β⁻ และ γ อย่างละหนึ่งชนิด รังสี P เบนหาแผ่นลบ รังสี Q เบนหาแผ่นบวก และรังสี R ไม่เบน',
          'One beam each of α, β⁻ and γ enters an electric field. P bends towards the negative plate, Q towards the positive plate, and R does not deflect.'),[
        [t('ระบุ P, Q และ R พร้อมเหตุผลจากประจุ','Identify P, Q and R. Use their charges to explain.'),
         p('P คือ α ประจุบวก Q คือ β⁻ ประจุลบ และ R คือ γ ไม่มีประจุ','P is positively charged α. Q is negatively charged β⁻. R is uncharged γ.'),21],
        [t('เขียนสัญลักษณ์นิวเคลียร์ของอนุภาคแอลฟา บีตาลบ และโพซิตรอน','Write the nuclear symbols for alpha, beta-minus and a positron.'),
         line(`α: ${alpha} &emsp; β⁻: ${beta} &emsp; β⁺: ${n(0,'+1','e')}`),19],
      ])},
    {key:'balance',title:t('เขียนสมการสลายและตรวจดุล','Write and check decay equations'),body:
      ex(3,'หา A และ Z ที่ขาด','Find the missing A and Z',
        t('ใช้ข้อมูล Z ของ Mn = 25, C = 6, N = 7, H = 1 และ Al = 13','Use Z = 25 for Mn, 6 for C, 7 for N, 1 for H and 13 for Al.'),[
        [t(`เติมนิวเคลียสลูก ${n(52,26,'Fe')} → X + ${n(0,'+1','e')}`,`Find the daughter in ${n(52,26,'Fe')} → X + ${n(0,'+1','e')}`),
         use('(2)–(3)')+line(a)+line('A<sub>X</sub> = 52 − 0 = 52')+line(z)+line('Z<sub>X</sub> = 26 − 1 = 25')+line(`${n(52,26,'Fe')} → ${n(52,25,'Mn')} + ${n(0,'+1','e')}`),27],
        [t(`เติมอนุภาค X ใน ${n(14,7,'N')} + ${n(1,0,'n')} → ${n(14,6,'C')} + X`,`Identify X in ${n(14,7,'N')} + ${n(1,0,'n')} → ${n(14,6,'C')} + X`),
         use('(2)–(3)')+line(a)+line('A<sub>X</sub> = 14 + 1 − 14 = 1')+line(z)+line('Z<sub>X</sub> = 7 + 0 − 6 = 1')+line(`${n(14,7,'N')} + ${n(1,0,'n')} → ${n(14,6,'C')} + ${n(1,1,'H')}`),28],
      ])+
      ex(4,'นิวเคลียสลูกสองขั้น','Two successive daughters',
        t('Sr-90 (Z = 38) แผ่บีตาลบสองครั้ง ได้ธาตุในกลุ่มนี้ Y (Z = 39), Zr (Z = 40)','Sr-90 (Z = 38) emits beta-minus twice. Use Y (Z = 39) and Zr (Z = 40).'),[
        [t('เขียนสมการทั้งสองขั้นโดยแยกคนละบรรทัด','Write both equations on separate lines.'),
         use('(2)–(3)')+line(a)+line(z)+line(`${n(90,38,'Sr')} → ${n(90,39,'Y')} + ${beta}`)+line(`${n(90,39,'Y')} → ${n(90,40,'Zr')} + ${beta}`),35],
        [t('จงหาผลรวม A + Z ของนิวเคลียสสุดท้าย','Find A + Z for the final nucleus.'),
         line('A + Z = 90 + 40 = 130'),12],
      ])},
    {key:'time',title:t('หาเวลา มวล และครึ่งชีวิต','Find time, mass and half-life'),body:
      ex(5,'เวลาที่ผ่านไปและมวลที่เหลือ','Elapsed time and remaining mass',
        t('P-32 มีครึ่งชีวิตประมาณ 14 วัน เริ่มจาก 32 mg ให้ใช้ครึ่งชีวิต 14 วันตลอดข้อนี้',
          'P-32 has a half-life of approximately 14 days. Start with 32 mg and use 14 days throughout.'),[
        [t('หลัง 42 วันเหลือ P-32 กี่ mg และสลายไปกี่ mg?','After 42 days, how many mg of P-32 remain and how many have decayed?'),
         use('(4)–(6)')+line(nt)+line(t('n = 42 วัน / 14 วัน = 3','n = 42 days / 14 days = 3'))+line(f)+line('m<sub>t</sub> = 32 mg × (½)<sup>3</sup> = 4 mg')+line(m)+line('m<sub>decay</sub> = 32 mg − 4 mg = 28 mg'),42],
        [t('ต้องใช้เวลากี่วันจึงเหลือ 8 mg?','How many days does it take to reach 8 mg?'),
         use('(5)')+line(f)+line('f = 8 mg / 32 mg = 1/4 = (½)<sup>2</sup>')+use('(4)')+line(nt)+line(t('t = 2 × 14 วัน = 28 วัน','t = 2 × 14 days = 28 days')),30],
      ])+
      ex(6,'โจทย์ให้ส่วนที่สลายไป','The problem gives the fraction decayed',
        t('ในแบบจำลอง Rn-222 (Z = 86) สลายแบบแอลฟาไป 15/16 ในเวลา 15.2 วัน ธาตุ Po มี Z = 84',
          'In a model, 15/16 of Rn-222 (Z = 86) decays by alpha emission in 15.2 days. Po has Z = 84.'),[
        [t('เขียนสัดส่วนที่เหลือและหาครึ่งชีวิต','Write the remaining fraction and calculate the half-life.'),
         use('(5)')+line(f)+line('f = 1 − 15/16 = 1/16 = (½)<sup>4</sup>')+use('(4)')+line(nt)+
         line(t('T<sub>½</sub> = 15.2 วัน / 4 = 3.8 วัน','T<sub>½</sub> = 15.2 days / 4 = 3.8 days')),32],
        [t('หานิวเคลียสลูกและเขียนสมการสลาย','Identify the daughter and write the decay equation.'),
         use('(2)–(3)')+line(a)+line('A<sub>X</sub> = 222 − 4 = 218')+line(z)+line('Z<sub>X</sub> = 86 − 2 = 84')+
         line(`${n(222,86,'Rn')} → ${n(218,84,'Po')} + ${alpha}`),29],
      ])},
    {key:'mixed',title:t('รวมทักษะครึ่งชีวิตกับสมการนิวเคลียร์','Combine half-life and nuclear equations'),body:
      ex(7,'จากมวลสารแม่ไปหาสารลูก','From parent mass to daughter mass',
        t('P-32 สลายเป็น S-32 โดยมีครึ่งชีวิตประมาณ 14 วัน เริ่มต้นมี P-32 24.0 mg และไม่มี S-32 ให้ใช้ Z = 15 สำหรับ P และ Z = 16 สำหรับ S และประมาณมวลต่อโมลทั้งคู่เป็น 32 g/mol',
          'P-32 decays into S-32 with a half-life of approximately 14 days. Initially there are 24.0 mg of P-32 and no S-32. Use Z = 15 for P, Z = 16 for S and approximate both molar masses as 32 g/mol.'),[
        [t('เติมอนุภาคและตรวจดุลสมการ','Identify the particle and check the equation.'),
         use('(2)–(3)')+line(a)+line('32 = 32 + 0')+line(z)+line('15 = 16 + (−1)')+line(`${n(32,15,'P')} → ${n(32,16,'S')} + ${beta}`),32],
        [t('หลังผ่านไป 28 วัน P-32 เหลือกี่ mg?','How many mg of P-32 remain after 28 days?'),
         use('(4)–(5)')+line(nt)+line(t('n = 28 วัน / 14 วัน = 2','n = 28 days / 14 days = 2'))+line(f)+line('m<sub>t</sub> = 24.0 mg × (½)<sup>2</sup> = 6.0 mg'),35],
        [t('S-32 เกิดขึ้นประมาณกี่ mg? อธิบายว่าทำไมจึงใช้มวลของ P-32 ที่สลายไปคำนวณได้','Approximately how many mg of S-32 form? Explain why the mass of decayed P-32 is relevant.'),
         use('(6)')+line(m)+line('m<sub>decay</sub> = 24.0 mg − 6.0 mg = 18.0 mg')+p('P-32 หนึ่งนิวเคลียสให้ S-32 หนึ่งนิวเคลียส มวลต่อโมลที่กำหนดเท่ากันโดยประมาณ จึงเกิด S-32 ประมาณ 18.0 mg',
           'One P-32 nucleus yields one S-32 nucleus. The given molar masses are approximately equal, so about 18.0 mg of S-32 forms.'),37],
      ])},
    {key:'recall',title:t('ประยุกต์ใช้และทวนความเข้าใจ','Applications and knowledge recall'),body:
      ex(8,'ฟิชชัน ฟิวชัน และการใช้รังสี','Fission, fusion and radiation use','',[
        [t('วาดแผนภาพเวนน์เปรียบเทียบฟิชชันกับฟิวชัน โดยระบุจุดร่วมและความต่างของแต่ละกระบวนการ','Draw a Venn diagram comparing fission and fusion. Include a shared feature and a distinction for each process.'),
         p('ฟิชชันคือนิวเคลียสหนักแตกเป็นนิวเคลียสที่เบากว่า ฟิวชันคือนิวเคลียสเบารวมเป็นนิวเคลียสที่หนักขึ้น ทั้งสองเกิดการเปลี่ยนแปลงในนิวเคลียสและปล่อยพลังงานในกรณีที่เรียน',
           'Fission splits a heavy nucleus into lighter nuclei. Fusion joins light nuclei into a heavier nucleus. Both change nuclei and release energy in the cases studied.'),31],
        [t('เลือกตัวอย่างการใช้ไอโซโทปจากบทเรียนหนึ่งตัวอย่าง บอกสมบัติที่นำมาใช้และหลักลดการรับรังสีหนึ่งข้อ','Choose one use of an isotope from the lesson. State the property involved and one way to reduce exposure.'),
         p('ตัวอย่าง สารติดตามปล่อยรังสีที่เครื่องตรวจจับได้ ช่วยระบุตำแหน่งสาร ผู้ปฏิบัติงานลดเวลาที่อยู่ใกล้แหล่งรังสีได้',
           'For example, a tracer emits detectable radiation, allowing it to be located. Staff can limit time near the source.'),23],
      ])+
      group(t('Knowledge Recall','Knowledge Recall'),'',[
        [t('ถ้าไอโซโทปหนึ่งแผ่แกมมาเพียงอย่างเดียว อะไรเปลี่ยนและอะไรคงเดิม?','If an isotope emits only gamma radiation, what changes and what stays the same?'),
         p('พลังงานของนิวเคลียสลดลง A กับ Z คงเดิม','The nucleus loses energy. A and Z stay the same.'),14],
        [t('“ผ่านไปสองครึ่งชีวิตแล้วไอโซโทปเดิมหมดพอดี” แก้ข้อความให้ถูกต้อง','Correct this statement: “The original isotope is gone after two half-lives.”'),
         p('ไอโซโทปเดิมเหลือ 1/4 ของปริมาณตั้งต้น เพราะแต่ละช่วงลดครึ่งหนึ่งของที่เหลือ','One quarter remains because each interval halves the amount then present.'),15],
      ])},
    {key:'extension',title:t('โจทย์เสริม · เลือกมวลตั้งต้นให้ถูก','Extension · Choose the correct starting mass'),body:
      ex(9,'แบ่งสารละลายก่อนคิดครึ่งชีวิต','Take an aliquot before applying half-life',
        t('ละลายสารประกอบสมมติที่มี Na-24 หนึ่งอะตอมต่อหนึ่งหน่วยสูตร 6.0 g (มวลต่อโมล 60 g/mol) เป็นสารละลายเนื้อเดียว 40 mL แบ่งมา 10 mL แล้ววางไว้ 30 ชั่วโมง กำหนดมวลต่อโมล Na-24 ประมาณ 24 g/mol และครึ่งชีวิต 15 ชั่วโมง ข้อนี้ใช้ความรู้เรื่องโมล',
          'Dissolve 6.0 g of a hypothetical compound containing one Na-24 atom per formula unit (molar mass 60 g/mol) to make 40 mL of uniform solution. Take 10 mL and wait 30 h. Use an approximate Na-24 molar mass of 24 g/mol and a half-life of 15 h. This problem uses mole calculations.'),[
        [t('ก่อนเริ่มจับเวลา สารละลาย 10 mL มี Na-24 กี่กรัม?','Before timing begins, how many grams of Na-24 are in the 10 mL aliquot?'),
         p('<strong>ใช้ความสัมพันธ์จำนวนโมล = มวล / มวลต่อโมล</strong>','<strong>Use amount in moles = mass / molar mass.</strong>')+
         line('n<sub>Na,total</sub> = 6.0 g / (60 g/mol) = 0.10 mol')+line('n<sub>Na,aliquot</sub> = 0.10 mol × (10 mL / 40 mL) = 0.025 mol')+line('m<sub>0</sub> = 0.025 mol × 24 g/mol = 0.60 g'),51],
        [t('หลังผ่านไป 30 ชั่วโมง Na-24 ในส่วนที่แบ่งมาเหลือกี่กรัม?','How many grams of Na-24 remain in the aliquot after 30 h?'),
         use('(4)–(5)')+line(nt)+line('n = 30 h / 15 h = 2')+line(f)+line('m<sub>t</sub> = 0.60 g × (½)<sup>2</sup> = 0.15 g'),42],
      ])+
      `<p class="source">${t('โจทย์ใหม่อิงทักษะ','New problem modelled on the skills in')} · <a href="https://drive.google.com/file/d/1Iq4_OwRN_Icg_DyRF0CgKDfpiY2Q6CMb/view">A-Level 2566 Q2</a></p>`},
  ];
}
