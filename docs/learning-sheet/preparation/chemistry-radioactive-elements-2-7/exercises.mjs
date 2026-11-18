import { para } from './notes.mjs';
import { formulas, isotope as n, line, math, tex } from './math.mjs';

const beta = n(0,'−1','e');
const alpha = n(4,2,'He');
const { a, z, f, n: nt, decayed: m } = formulas;

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

  const group = (title, lead, parts, grid = false) => `<section class="question"><h3>${title}</h3>${lead ? para(lead) : ''}<div class="${grid ? 'task-grid' : 'task-list'}">${parts.map(([prompt,answer,height],i)=>part(i,prompt,answer,height)).join('')}</div></section>`;
  const use = numbers => p(`<strong>ใช้สมการ ${numbers}</strong>`,`<strong>Use ${numbers.includes('–')?'equations':'equation'} ${numbers}</strong>`);
  const ex = (number, th, eng, lead, parts, grid) => group(`${t('ข้อ','Problem')} ${number} · ${t(th,eng)}`,lead,parts,grid);
  const gap = (id, width, answer) => filled
    ? `<span class="answer-inline"><span class="blank-num">${id}</span> ${answer}</span>`
    : `<span class="cloze-blank" style="--blank-width:${width}mm" aria-label="${t('ช่องเติมคำ','Fill-in space')} ${id}"><span class="blank-num">${id}</span></span>`;
  const passage = (title, text) => `<section class="cloze-article"><h3>${title}</h3><p class="passage">${text}</p></section>`;

  const timeTitle = t('หาเวลา มวล และครึ่งชีวิต','Find time, mass and half-life');
  const elapsed = ex(5,'เวลาที่ผ่านไปและมวลที่เหลือ','Elapsed time and remaining mass',
    t('P-32 มีครึ่งชีวิตประมาณ 14 วัน เริ่มจาก 32 mg ให้ใช้ครึ่งชีวิต 14 วันตลอดข้อนี้',
      'P-32 has a half-life of approximately 14 days. Start with 32 mg and use 14 days throughout.'),[
    [t('หลัง 42 วันเหลือ P-32 กี่ mg และสลายไปกี่ mg?','After 42 days, how many mg of P-32 remain and how many have decayed?'),
     use('(4)–(6)')+line(nt)+line(tex`n=\frac{42\,\mathrm{d}}{14\,\mathrm{d}}=3`)+line(f)+line(tex`m_{t} = 32\,\mathrm{mg} \times \left(\frac{1}{2}\right)^{3} = 4\,\mathrm{mg}`)+line(m)+line(tex`m_{\mathrm{decay}} = 32\,\mathrm{mg} - 4\,\mathrm{mg} = 28\,\mathrm{mg}`),42],
    [t('ต้องใช้เวลากี่วันจึงเหลือ 8 mg?','How many days does it take to reach 8 mg?'),
     use('(5)')+line(f)+line(tex`f=\frac{8\,\mathrm{mg}}{32\,\mathrm{mg}}=\frac{1}{4}=\left(\frac{1}{2}\right)^2`)+use('(4)')+line(nt)+line(tex`t=2\times 14\,\mathrm{d}=28\,\mathrm{d}`),30],
  ]);
  const fractionDecayed = ex(6,'โจทย์ให้ส่วนที่สลายไป','The problem gives the fraction decayed',
    t('ในแบบจำลอง Rn-222 (Z = 86) สลายแบบแอลฟาไป 15/16 ในเวลา 15.2 วัน ธาตุ Po มี Z = 84',
      'In a model, 15/16 of Rn-222 (Z = 86) decays by alpha emission in 15.2 days. Po has Z = 84.'),[
    [t('เขียนสัดส่วนที่เหลือและหาครึ่งชีวิต','Write the remaining fraction and calculate the half-life.'),
     use('(5)')+line(f)+line(tex`f = 1 - \frac{15}{16} = \frac{1}{16} = \left(\frac{1}{2}\right)^{4}`)+use('(4)')+line(nt)+
     line(tex`T_{1/2}=\frac{15.2\,\mathrm{d}}{4}=3.8\,\mathrm{d}`),32],
    [t('หานิวเคลียสลูกและเขียนสมการสลาย','Identify the daughter and write the decay equation.'),
     use('(2)–(3)')+line(a)+line(tex`A_{X} = 222 - 4 = 218`)+line(z)+line(tex`Z_{X} = 86 - 2 = 84`)+
     line(tex`${n(222,86,'Rn')} \rightarrow ${n(218,84,'Po')} + ${alpha}`),29],
  ]);

  return [
    {key:'cloze',title:t('บทอ่านเติมคำ','Cloze passages'),body:
      `<p class="instructions">${t('เติมคำหรือวลีให้บทอ่านสมบูรณ์ แล้วแสดงวิธีคิดสั้น ๆ ในช่อง B2',
        'Complete each passage with a word or phrase. Show a short calculation in B2.')}</p>`+
      passage(t('บทอ่าน A · สิ่งที่เปลี่ยนในนิวเคลียส','Passage A · What changes in the nucleus'),
        t('ในห้องเรียน เด็กสองคนดูสมการสลายของไอโซโทปชนิดเดียวกันและติดตามเลขบนกับเลขล่างทีละขั้น เลขที่บอกชนิดของธาตุคือ',
          'Two students read a decay equation and follow its upper and lower numbers step by step. The number that identifies an element is')+
        ' '+gap('A1',65,t('เลขอะตอม Z ซึ่งเท่ากับจำนวนโปรตอน','atomic number Z, the number of protons'))+
        t(' ในการสลายแบบบีตาลบ นิวเคลียสลูกมีเลขอะตอม','. In beta-minus decay, the daughter’s atomic number')+
        ' '+gap('A2',36,t('เพิ่มขึ้น 1','increases by 1'))+' '+t('เพราะ','because')+
        ' '+gap('A3',69,t('นิวตรอนหนึ่งตัวเปลี่ยนเป็นโปรตอน','a neutron becomes a proton'))+
        t(' เมื่อปล่อยแกมมา เลขมวลและเลขอะตอม','. In gamma emission, mass number and atomic number')+
        ' '+gap('A4',36,t('คงเดิม','stay the same'))+' '+t('สิ่งที่ลดลงคือ','and what decreases is')+
        ' '+gap('A5',62,t('พลังงานของนิวเคลียส','the nuclear energy'))+t('','.'))+
      passage(t('บทอ่าน B · ติดตามสารตั้งต้น','Passage B · Track the starting isotope'),
        t('ทั้งคู่กลับมาดูข้อมูลตามเวลา คราวนี้ติดตามเฉพาะไอโซโทปเดิมที่ยังไม่สลาย หนึ่งครึ่งชีวิตคือช่วงเวลาที่จำนวนนิวเคลียสของไอโซโทปเดิมที่ยังไม่สลาย',
          'They return to the time data and track the original isotope still present. One half-life is the time in which the number of undecayed nuclei of the original isotope')+
        ' '+gap('B1',60,t('ลดลงเหลือครึ่งหนึ่ง','decreases to one half'))+
        t(' ถ้าเหลือ 25% ส่วนที่สลายไปแล้วเป็น','. If 25% remains, the fraction already decayed is')+
        ' '+gap('B2',65,math(tex`100\% - 25\% = 75\%`))+t('','.'))},
    {key:'identify',title:t('อ่านข้อมูลและจำแนกรังสี','Read data and identify radiation'),body:
      ex(1,'ไอโซโทปและเสถียรภาพ','Isotopes and stability',
        t('พิจารณา C-12 (Z = 6), C-14 (Z = 6) และ Ra-226 (Z = 88) โดย C-12 เสถียร ส่วน C-14 และทุกไอโซโทปของ Ra ไม่เสถียร',
          'Consider C-12 (Z = 6), C-14 (Z = 6) and Ra-226 (Z = 88). C-12 is stable. C-14 and every isotope of Ra are unstable.'),[
        [t('หาโปรตอนและนิวตรอนของ C-12 กับ C-14','Find the proton and neutron numbers of C-12 and C-14.'),
         use('(1)')+line(tex`N = A - Z`)+line(tex`\mathrm{C}\!-\!12:\quad N = 12 - 6 = 6`)+line(tex`\mathrm{C}\!-\!14:\quad N = 14 - 6 = 8`)+p('ทั้งคู่มีโปรตอน 6 ตัว','Both have 6 protons.'),23],
        [t('ธาตุใดไม่มีไอโซโทปเสถียร? ใช้ข้อมูลที่ให้มาอธิบาย','Which element has no stable isotopes? Explain using the data.'),
         p('Ra เพราะทุกไอโซโทปของ Ra ไม่เสถียร คาร์บอนมี C-12 ที่เสถียร','Ra, since every isotope of Ra is unstable. Carbon has the stable isotope C-12.'),18],
      ],true)+
      ex(2,'ชนิดของรังสีจากสนามไฟฟ้า','Radiation in an electric field',
        t('มี α, β⁻ และ γ อย่างละหนึ่งชนิด รังสี P เบนหาแผ่นลบ รังสี Q เบนหาแผ่นบวก และรังสี R ไม่เบน',
          'One beam each of α, β⁻ and γ enters an electric field. P bends towards the negative plate, Q towards the positive plate, and R does not deflect.'),[
        [t('ระบุ P, Q และ R พร้อมเหตุผลจากประจุ','Identify P, Q and R. Use their charges to explain.'),
         p('P คือ α ประจุบวก Q คือ β⁻ ประจุลบ และ R คือ γ ไม่มีประจุ','P is positively charged α. Q is negatively charged β⁻. R is uncharged γ.'),21],
        [t('เขียนสัญลักษณ์นิวเคลียร์ของอนุภาคแอลฟา บีตาลบ และโพซิตรอน','Write the nuclear symbols for alpha, beta-minus and a positron.'),
         line(tex`\alpha: ${alpha} \qquad \beta^-: ${beta} \qquad \beta^+: ${n(0,'+1','e')}`),19],
      ],true)},
    {key:'balance',title:t('เขียนสมการสลายและตรวจดุล','Write and check decay equations'),body:
      ex(3,'หา A และ Z ที่ขาด','Find the missing A and Z',
        t('ใช้ข้อมูล Z ของ Mn = 25, C = 6, N = 7, H = 1 และ Al = 13','Use Z = 25 for Mn, 6 for C, 7 for N, 1 for H and 13 for Al.'),[
        [t(`เติมนิวเคลียสลูก ${math(tex`${n(52,26,'Fe')} \rightarrow X + ${n(0,'+1','e')}`)}`,`Find the daughter in ${math(tex`${n(52,26,'Fe')} \rightarrow X + ${n(0,'+1','e')}`)}`),
         use('(2)–(3)')+line(a)+line(tex`A_{X} = 52 - 0 = 52`)+line(z)+line(tex`Z_{X} = 26 - 1 = 25`)+line(tex`${n(52,26,'Fe')} \rightarrow ${n(52,25,'Mn')} + ${n(0,'+1','e')}`),27],
        [t(`เติมอนุภาค X ใน ${math(tex`${n(14,7,'N')}+${n(1,0,'n')} \rightarrow ${n(14,6,'C')}+X`)}`,`Identify X in ${math(tex`${n(14,7,'N')}+${n(1,0,'n')} \rightarrow ${n(14,6,'C')}+X`)}`),
         use('(2)–(3)')+line(a)+line(tex`A_{X} = 14 + 1 - 14 = 1`)+line(z)+line(tex`Z_{X} = 7 + 0 - 6 = 1`)+line(tex`${n(14,7,'N')} + ${n(1,0,'n')} \rightarrow ${n(14,6,'C')} + ${n(1,1,'H')}`),28],
      ])+
      ex(4,'นิวเคลียสลูกสองขั้น','Two successive daughters',
        t('Sr-90 (Z = 38) แผ่บีตาลบสองครั้ง ได้ธาตุในกลุ่มนี้ Y (Z = 39), Zr (Z = 40)','Sr-90 (Z = 38) emits beta-minus twice. Use Y (Z = 39) and Zr (Z = 40).'),[
        [t('เขียนสมการทั้งสองขั้นโดยแยกคนละบรรทัด','Write both equations on separate lines.'),
         use('(2)–(3)')+line(a)+line(z)+line(tex`${n(90,38,'Sr')} \rightarrow ${n(90,39,'Y')} + ${beta}`)+line(tex`${n(90,39,'Y')} \rightarrow ${n(90,40,'Zr')} + ${beta}`),35],
        [t('จงหาผลรวม A + Z ของนิวเคลียสสุดท้าย','Find A + Z for the final nucleus.'),
         line(tex`A + Z = 90 + 40 = 130`),12],
      ])},
    ...(filled ? [
      {key:'time', title:timeTitle, body:elapsed},
      {key:'half-life-calculation', title:t('ย้อนหาครึ่งชีวิตจากส่วนที่สลาย','Find half-life from the decayed fraction'), body:fractionDecayed},
    ] : [{key:'time', title:timeTitle, body:elapsed + fractionDecayed}]),
    {key:'mixed',title:t('รวมทักษะครึ่งชีวิตกับสมการนิวเคลียร์','Combine half-life and nuclear equations'),body:
      ex(7,'จากมวลสารแม่ไปหาสารลูก','From parent mass to daughter mass',
        t('P-32 สลายเป็น S-32 โดยมีครึ่งชีวิตประมาณ 14 วัน เริ่มต้นมี P-32 24.0 mg และไม่มี S-32 ให้ใช้ Z = 15 สำหรับ P และ Z = 16 สำหรับ S และประมาณมวลต่อโมลทั้งคู่เป็น 32 g/mol',
          'P-32 decays into S-32 with a half-life of approximately 14 days. Initially there are 24.0 mg of P-32 and no S-32. Use Z = 15 for P, Z = 16 for S and approximate both molar masses as 32 g/mol.'),[
        [t('เติมอนุภาคและตรวจดุลสมการ','Identify the particle and check the equation.'),
         use('(2)–(3)')+line(a)+line(tex`32 = 32 + 0`)+line(z)+line(tex`15 = 16 + (-1)`)+line(tex`${n(32,15,'P')} \rightarrow ${n(32,16,'S')} + ${beta}`),32],
        [t('หลังผ่านไป 28 วัน P-32 เหลือกี่ mg?','How many mg of P-32 remain after 28 days?'),
         use('(4)–(5)')+line(nt)+line(tex`n=\frac{28\,\mathrm{d}}{14\,\mathrm{d}}=2`)+line(f)+line(tex`m_{t} = 24.0\,\mathrm{mg} \times \left(\frac{1}{2}\right)^{2} = 6.0\,\mathrm{mg}`),35],
        [t('S-32 เกิดขึ้นประมาณกี่ mg? อธิบายว่าทำไมจึงใช้มวลของ P-32 ที่สลายไปคำนวณได้','Approximately how many mg of S-32 form? Explain why the mass of decayed P-32 is relevant.'),
         use('(6)')+line(m)+line(tex`m_{\mathrm{decay}} = 24.0\,\mathrm{mg} - 6.0\,\mathrm{mg} = 18.0\,\mathrm{mg}`)+p('P-32 หนึ่งนิวเคลียสให้ S-32 หนึ่งนิวเคลียส มวลต่อโมลที่กำหนดเท่ากันโดยประมาณ จึงเกิด S-32 ประมาณ 18.0 mg',
           'One P-32 nucleus yields one S-32 nucleus. The given molar masses are approximately equal, so about 18.0 mg of S-32 forms.'),37],
      ])},
    {key:'applications',title:t('ประยุกต์ใช้และโจทย์เสริม','Applications and extension'),body:
      ex(8,'ฟิชชัน ฟิวชัน และการใช้รังสี','Fission, fusion and radiation use','',[
        [t('วาดแผนภาพเวนน์เปรียบเทียบฟิชชันกับฟิวชัน โดยระบุจุดร่วมและความต่างของแต่ละกระบวนการ','Draw a Venn diagram comparing fission and fusion. Include a shared feature and a distinction for each process.'),
         p('ฟิชชันคือนิวเคลียสหนักแตกเป็นนิวเคลียสที่เบากว่า ฟิวชันคือนิวเคลียสเบารวมเป็นนิวเคลียสที่หนักขึ้น ทั้งสองเกิดการเปลี่ยนแปลงในนิวเคลียสและปล่อยพลังงานในกรณีที่เรียน',
           'Fission splits a heavy nucleus into lighter nuclei. Fusion joins light nuclei into a heavier nucleus. Both change nuclei and release energy in the cases studied.'),31],
        [t('เลือกตัวอย่างการใช้ไอโซโทปจากบทเรียนหนึ่งตัวอย่าง บอกสมบัติที่นำมาใช้และหลักลดการรับรังสีหนึ่งข้อ','Choose one use of an isotope from the lesson. State the property involved and one way to reduce exposure.'),
         p('ตัวอย่าง สารติดตามปล่อยรังสีที่เครื่องตรวจจับได้ ช่วยระบุตำแหน่งสาร ผู้ปฏิบัติงานลดเวลาที่อยู่ใกล้แหล่งรังสีได้',
           'For example, a tracer emits detectable radiation, allowing it to be located. Staff can limit time near the source.'),23],
      ])+
      ex(9,'โจทย์เสริม · แบ่งสารละลายก่อนคิดครึ่งชีวิต','Extension · Take an aliquot before applying half-life',
        t('ละลายสารประกอบสมมติที่มี Na-24 หนึ่งอะตอมต่อหนึ่งหน่วยสูตร 6.0 g (มวลต่อโมล 60 g/mol) เป็นสารละลายเนื้อเดียว 40 mL แบ่งมา 10 mL แล้ววางไว้ 30 ชั่วโมง กำหนดมวลต่อโมล Na-24 ประมาณ 24 g/mol และครึ่งชีวิต 15 ชั่วโมง ข้อนี้ใช้ความรู้เรื่องโมล',
          'Dissolve 6.0 g of a hypothetical compound containing one Na-24 atom per formula unit (molar mass 60 g/mol) to make 40 mL of uniform solution. Take 10 mL and wait 30 h. Use an approximate Na-24 molar mass of 24 g/mol and a half-life of 15 h. This problem uses mole calculations.'),[
        [t('ก่อนเริ่มจับเวลา สารละลาย 10 mL มี Na-24 กี่กรัม?','Before timing begins, how many grams of Na-24 are in the 10 mL aliquot?'),
         p('<strong>ใช้ความสัมพันธ์จำนวนโมล = มวล / มวลต่อโมล</strong>','<strong>Use amount in moles = mass / molar mass.</strong>')+
         line(tex`n_{\mathrm{Na,total}}=\frac{6.0\,\mathrm{g}}{60\,\mathrm{g/mol}}=0.10\,\mathrm{mol}`)+line(tex`n_{\mathrm{Na,aliquot}}=0.10\,\mathrm{mol}\times\frac{10\,\mathrm{mL}}{40\,\mathrm{mL}}=0.025\,\mathrm{mol}`)+line(tex`m_{0} = 0.025\,\mathrm{mol} \times 24\,\mathrm{g/mol} = 0.60\,\mathrm{g}`),51],
        [t('หลังผ่านไป 30 ชั่วโมง Na-24 ในส่วนที่แบ่งมาเหลือกี่กรัม?','How many grams of Na-24 remain in the aliquot after 30 h?'),
         use('(4)–(5)')+line(nt)+line(tex`n=\frac{30\,\mathrm{h}}{15\,\mathrm{h}}=2`)+line(f)+line(tex`m_{t} = 0.60\,\mathrm{g} \times \left(\frac{1}{2}\right)^{2} = 0.15\,\mathrm{g}`),42],
      ])+
      `<p class="source">${t('โจทย์ใหม่อิงทักษะ','New problem modelled on the skills in')} · <a href="https://drive.google.com/file/d/1Iq4_OwRN_Icg_DyRF0CgKDfpiY2Q6CMb/view">A-Level 2566 Q2</a></p>`},
    {key:'recall',title:'Knowledge Recall',body:
      group(t('ทวนแนวคิดเรื่องรังสีและครึ่งชีวิต','Recall radiation and half-life'),'',[
        [t('ถ้าไอโซโทปหนึ่งแผ่แกมมาเพียงอย่างเดียว อะไรเปลี่ยนและอะไรคงเดิม?','If an isotope emits only gamma radiation, what changes and what stays the same?'),
         p('พลังงานของนิวเคลียสลดลง A กับ Z คงเดิม','The nucleus loses energy. A and Z stay the same.'),20],
        [t('“ผ่านไปสองครึ่งชีวิตแล้วไอโซโทปเดิมหมดพอดี” แก้ข้อความให้ถูกต้อง','Correct this statement: “The original isotope is gone after two half-lives.”'),
         p('ไอโซโทปเดิมเหลือ 1/4 ของปริมาณตั้งต้น เพราะแต่ละช่วงลดครึ่งหนึ่งของที่เหลือ','One quarter remains because each interval halves the amount then present.'),22],
      ])},
  ];
}
