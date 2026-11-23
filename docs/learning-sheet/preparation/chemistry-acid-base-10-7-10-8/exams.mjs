import { buffer, endpoint, equivalence, hydrolysis, titration } from './concepts.mjs';
import { examQuestions } from './exam-questions.mjs';

const folder = 'https://drive.google.com/drive/folders/1Kd9AJ4zOmncK2qTMvFwu7T2K8XqmWr3W';
const copies = {
  2566: ['https://drive.google.com/file/d/1Iq4_OwRN_Icg_DyRF0CgKDfpiY2Q6CMb/view',
    'สำเนารวบรวมใน Drive','Collected copy in Drive'],
  2567: ['https://drive.google.com/file/d/1nqWVYFg-av-SL-Os1ANQp91S5VGD9Q0h/view',
    'ฉบับรวบรวมจากความจำใน Drive','Recalled paper in Drive'],
  2568: ['https://assets.mytcas.com/68/answer/tcas68-chem-a-level.pdf',
    'ข้อสอบและเฉลยทางการ MyTCAS','Official MyTCAS paper and key'],
  2569: ['https://assets.mytcas.com/69/answer/tcas69-chem-a-level.pdf',
    'ข้อสอบทางการ MyTCAS ชุด 1','Official MyTCAS paper, Set 1'],
};
const key69 = 'https://assets.mytcas.com/69/alevel/69_answers_61-89.pdf#page=5';
const shortResponses = new Set(['2566-28', '2567-19', '2568-22', '2569-22']);

export function examProblems(kit) {
  const {t, work, task, card, link} = kit;
  const questions = examQuestions(kit);
  function exam(year, question, page, solutions, result, extra = '') {
    const [url, th, en] = copies[year];
    const source = url + (page ? '#page=' + page : '');
    return card('exam-'+year+'-'+question,
      t(`A-Level เคมี ${year} · ข้อ ${question}`, `A-Level Chemistry ${year} · Question ${question}`),
      '<p class="source">'+link(source,t(th,en))+
      t(` · หน้า PDF ${page}`,` · PDF page ${page}`)+
      (year === 2569 ? ' · '+link(key69,t('เฉลยทางการ MyTCAS ชุด 1','Official MyTCAS key, Set 1')) : '')+'</p>'+extra+
      '<div class="exam-question">'+questions[`${year}-${question}`]+'</div>'+
      task(`a${year}-${question}`,t('คำตอบและวิธีทำ','Answer and working'),Array.isArray(solutions) ? t(...solutions) : solutions,
        {height:shortResponses.has(`${year}-${question}`) ? 16 : 26,result,printResult:false}),
      {keepTogether:true});
  }
  return [
    card('exam-start',t('ข้อสอบ A-Level ย้อนหลัง','Past A-Level questions'),
      '<p>'+t('โจทย์เรียบเรียงจากข้อสอบตามปีและเลขข้อ โดยคงข้อมูล ตัวเลือก ตาราง และกราฟที่ใช้ตอบ',
        'The questions are adapted from the cited papers. The data, options, tables and graphs needed to answer them are included.')+
      ' '+link(folder,t('โฟลเดอร์ข้อสอบของครู','Teacher’s exam folder'))+'</p>'),
    exam(2566,28,19,
      work(t('เทียบไอออนที่ไฮโดรลิซิส A⁻ เป็นคู่เบสของกรดแก่', 'Compare the hydrolysing ions. A⁻ is the conjugate base of a strong acid.'), [
          String.raw`K_a(\mathrm{HZ^+}) &= \frac{K_w}{K_b(\mathrm Z)}=1.0\times10^{-10}`,
          String.raw`K_b(\mathrm{X^-}) &= \frac{K_w}{K_a(\mathrm{HX})}=1.0\times10^{-9}`,
          String.raw`\mathrm{pH}(\mathrm{NaX}) &> \mathrm{pH}(\mathrm{[HZ]X})>\mathrm{pH}(\mathrm{[HZ]A})`,
        ],
          t('ตัวเลือก 5 ใน [HZ]X ไอออน X⁻ มีผลด้านเบสมากกว่า HZ⁺ ด้านกรด', 'Choice 5. In [HZ]X the basic effect of X⁻ exceeds the acidic effect of HZ⁺.')), '5'),
    exam(2566,29,19,
      work(t('ใช้สัดส่วน 1:1 ที่สมมูล แล้วตั้ง ICE ตามแบบจำลองของโจทย์', 'Use the 1:1 ratio at equivalence and set up ICE for the stated model.'), [
          String.raw`C_0 &= \frac{70.0\,\mathrm{mmol}}{100.00\,\mathrm{mL}}=0.700\,\mathrm{mol/L}`,
          String.raw`K_b &= \frac{1.0\times10^{-14}}{7.00\times10^{-10}}\approx1.43\times10^{-5}`,
          String.raw`K_b &= \frac{x^2}{0.700-x}\approx\frac{x^2}{0.700}`,
          String.raw`x &= [\mathrm{OH^-}]\approx \sqrt{(0.700)(1.43\times10^{-5})}`,
          String.raw`&\approx3.16\times10^{-3}\,\mathrm{mol/L}`,
          String.raw`\frac{x}{0.700}\times100\% &\approx0.45\%`,
          String.raw`\mathrm{pOH} &= -\log(3.16\times10^{-3})\approx2.50`,
          String.raw`\mathrm{pH} &= 14.00-2.50=11.50`,
        ],
          t('ตัวเลือก 5', 'Choice 5.')),'5 · 11.50'),
    exam(2567,18,10,
      work(t('Ba(OH)₂ ให้ OH⁻ สองโมลต่อหนึ่งโมล ใช้สารส่วนเกินในแถว F', 'Each mole of Ba(OH)₂ supplies two moles of OH⁻. Use the excess in row F.'), [
          String.raw`n(\mathrm{OH^-}) &=2(4.00\,\mathrm{mmol})=8.00\,\mathrm{mmol}`,
          String.raw`n_{\mathrm F}(\mathrm{OH^-}) &= (8.00-6.00)\,\mathrm{mmol}=2.00\,\mathrm{mmol}`,
          String.raw`[\mathrm{OH^-}] &= \frac{2.00\,\mathrm{mmol}}{100.00\,\mathrm{mL}}=0.0200\,\mathrm{mol/L}`,
          String.raw`\mathrm{pOH} &= -\log(0.0200)\approx1.70`,
          String.raw`\mathrm{pH} &=14.00-1.70=12.30`,
        ],
          t('ตัวเลือก 4', 'Choice 4.')),'4 · 12.3'),
    exam(2567,19,10,
      ['ที่ครึ่งสมมูล HX มี pH สูงกว่า HY จึงมี pKₐ สูงกว่าและ X⁻ เป็นเบสคู่กรดที่แรงกว่า Y⁻ ที่ 15.00 mL เลยจุดสมมูลของทั้งสองและมี OH⁻ เหลือจึงไม่เป็นบัฟเฟอร์ สำหรับ HX กราฟผ่าน pH 8.30 ตั้งแต่ก่อนช่วงชันใกล้ 10.00 mL ฟีนอล์ฟทาลีนจึงเริ่มเปลี่ยนสีเร็วเกินไปสำหรับ HX ตามกราฟในฉบับอ้างอิง สรุปว่าถูกเฉพาะ ก',
       'At half-equivalence HX has the higher pH and pKₐ, so X⁻ is a stronger conjugate base than Y⁻. At 15.00 mL both titrations are past equivalence and excess OH⁻ remains, so neither is a buffer. The HX curve crosses pH 8.30 before the steep region near 10.00 mL. Phenolphthalein therefore starts changing too early for HX in this graph. Only statement A is correct.'],'1'),
    exam(2568,22,18,
      ['อินดิเคเตอร์ X เปลี่ยนสีช่วง 3.0–4.0 ระหว่างเพิ่ม NaOH จุดสมมูลของกรดอ่อน–เบสแก่อยู่ฝั่งเบสเพราะ CH₃COO⁻ ไฮโดรลิซิส จึงมี pH สูงกว่าจุดยุติที่สังเกตด้วย X และเป็นสีน้ำเงินที่สมมูล',
       'Indicator X changes over pH 3.0–4.0 as NaOH is added. Weak-acid/strong-base equivalence is basic because acetate hydrolyses. Its pH is therefore higher than the observed endpoint with X, and the indicator is blue at equivalence.'],'1'),
    exam(2568,23,19,
      work(t('เฉลี่ยปริมาตรจากสามรอบ แล้วใช้สัดส่วน 1:1 ย้อนหามวลกรดทั้งขวด', 'Average the three trials and use the 1:1 ratio to recover the acid mass in the full flask.'), [
          String.raw`\overline V &= \frac{20.00+19.95+20.05}{3}\,\mathrm{mL}=20.00\,\mathrm{mL}`,
          String.raw`n_{50} &= (20.00\,\mathrm{mL})(0.2500\,\mathrm{mmol/mL})=5.000\,\mathrm{mmol}`,
          String.raw`n_{250} &= (5.000\,\mathrm{mmol})\frac{250}{50.00}=25.00\,\mathrm{mmol}`,
          String.raw`m &= (25.00\,\mathrm{mmol})(0.0880\,\mathrm{g/mmol})=2.200\,\mathrm g`,
          String.raw`V &= \frac{m}{\rho}=\frac{2.20\,\mathrm g}{d\,\mathrm{g/mL}} =\frac{2.20}{d}\,\mathrm{mL}`,
        ],
          t('ตัวเลือก 3', 'Choice 3.')),'3 · 2.20/d mL'),
    exam(2568,24,20,
      work(t('ใช้จุดยุติประมาณจุดสมมูล แล้วคำนวณที่ครึ่งสมมูล', 'Use the endpoint to estimate equivalence, then calculate at half-equivalence.'), [
          String.raw`n_{\mathrm{eq}}(\mathrm{HCl}) &= (12.50\,\mathrm{mL})(0.0400\,\mathrm{mmol/mL}) =0.500\,\mathrm{mmol}`,
          String.raw`C_0(\mathrm{A^-}) &= \frac{0.500\,\mathrm{mmol}}{25.00\,\mathrm{mL}}=0.0200\,\mathrm{mol/L}`,
          String.raw`V_{1/2} &= \frac{12.50}{2}\,\mathrm{mL}=6.25\,\mathrm{mL}`,
          String.raw`n_{\mathrm F}(\mathrm{HA}) &= n_{\mathrm F}(\mathrm{A^-})=0.250\,\mathrm{mmol}`,
          String.raw`\mathrm{pH} &\approx \mathrm{p}K_a=6.00`,
        ],
          t('pH 6.00 อยู่ในช่วงเปลี่ยนสี 4.2–6.3 ตารางช่วงสีระบุเฉดที่แน่นอนไม่ได้', 'The pH of 6.00 lies in the 4.2–6.3 transition range. The interval alone cannot determine the exact shade.')),null,
      '<p class="callout">'+t('ข้ออภิปราย · ทปอ. ให้คะแนนฟรีข้อนี้ในเฉลยชุด 1','Discussion · The official Set 1 key awarded credit for all responses.')+'</p>'),
    exam(2569,22,16,
      ['ที่ pH 7 ไทมอลบลูมีสีเหลือง ส่วนสีเขียวอยู่ในช่วง pH 8.0–9.6 การไทเทรต HCl ด้วย NaOH มีช่วงชันครอบคลุมช่วงนี้ จึงเลือกข้อ 3 จุดสมมูลของเบสอ่อนกับกรดแก่อยู่ฝั่งกรด ส่วนเมื่อ pH เพิ่มผ่านช่วง 8.0–9.6 สีเปลี่ยนจากเหลืองไปน้ำเงิน',
       'Thymol blue is yellow at pH 7, and green occurs within pH 8.0–9.6. This range falls within the steep region for HCl titrated with NaOH, so option 3 is correct. Weak-base/strong-acid equivalence is acidic. As pH rises through 8.0–9.6, the colour changes from yellow to blue.'], '3'),
    exam(2569,23,17,
      work(t('ใช้ปริมาตรที่ปิเปตก่อนเติมน้ำในการหาความเข้มข้นเดิม', 'Use the volume pipetted before adding water to find the original concentration.'), [
          String.raw`&\mathrm{Ba(OH)_2+2HCl\longrightarrow BaCl_2+2H_2O}`,
          String.raw`n(\mathrm{HCl}) &=4.00\,\mathrm{mmol}`,
          String.raw`n(\mathrm{Ba(OH)_2}) &= \frac{4.00}{2}\,\mathrm{mmol}=2.00\,\mathrm{mmol}`,
          String.raw`C(\mathrm{Ba(OH)_2}) &= \frac{2.00\,\mathrm{mmol}}{5.00\,\mathrm{mL}}=0.400\,\mathrm{mol/L}`,
        ],
          t('ตัวเลือก 3 น้ำกลั่นที่เติมเปลี่ยนปริมาตร แต่จำนวนโมลในตัวอย่างคงเดิม', 'Choice 3. Adding distilled water changes the volume while the amount in the aliquot stays the same.')),'3 · 0.400 mol/L'),
  ].join('\n').replaceAll('Kᵥ','K<sub>w</sub>');
}

export function knowledgeRecall({t, task, card, eq, graph}) {
  const prompts = [
    ['titration', ['การไทเทรตคืออะไร?', 'What is titration?'], titration],
    ['endpoint', ['จุดยุติของการไทเทรตที่ใช้อินดิเคเตอร์คืออะไร?',
      'What is the endpoint of a titration that uses an indicator?'], endpoint],
    ['equivalence', ['จุดสมมูลของการไทเทรตคืออะไร? ให้ทำเครื่องหมายจุดสมมูลบนกราฟ',
      'What is the equivalence point of a titration? Mark it on the curve.'],
      [equivalence[0]+' สำหรับกราฟนี้ อยู่ที่ปริมาตร NaOH 25.00 mL',
        equivalence[1]+' On this curve, it occurs at 25.00 mL of NaOH.']],
    ['buffer', ['สารละลายบัฟเฟอร์คืออะไร?', 'What is a buffer solution?'], buffer],
    ['buffer-pair', ['บัฟเฟอร์ที่เตรียมจากกรดอ่อนประกอบด้วยสารคู่ใด?',
      'Which pair makes up a buffer prepared from a weak acid?'],
      ['กรดอ่อนและเบสคู่กรดของกรดนั้น', 'A weak acid and its conjugate base.']],
    ['excess-acid', ['หลังผสม HCl กับ NaOH แล้วมี HCl เหลือ เราหาความเข้มข้นของไฮโดรเนียมไอออนอย่างไร?',
      'If HCl remains after mixing HCl and NaOH, how do we find the hydronium ion concentration?'],
      ['นำจำนวนโมลของ HCl ที่เหลือหลังปฏิกิริยาหารด้วยปริมาตรรวมของสารละลาย',
        'Divide the amount of HCl remaining after the reaction by the total solution volume.']],
    ['hydrolysis', ['ไฮโดรลิซิสของเกลือคืออะไร?', 'What is salt hydrolysis?'], hydrolysis],
    ['half-volume', ['จากกราฟในข้อ 3 จุดครึ่งสมมูลอยู่ที่ปริมาตร NaOH เท่าใด?',
      'Using the curve in question 3, at what volume of NaOH does half-equivalence occur?'],
      ['12.50 mL เท่ากับครึ่งหนึ่งของปริมาตรที่จุดสมมูล (25.00 mL)',
        '12.50 mL, which is half the equivalence volume of 25.00 mL.']],
    ['half-ph', ['เมื่อไทเทรตกรดอ่อนที่ให้โปรตอนได้หนึ่งตัวด้วยเบสแก่ ที่จุดครึ่งสมมูล pH เท่ากับค่าใดโดยประมาณ?',
      'When a weak monoprotic acid is titrated with a strong base, what is the approximate pH at half-equivalence?'],
      ['<p>ใช้ค่า pKₐ ของกรดอ่อน</p>'+eq(String.raw`\mathrm{pH}\approx\mathrm{p}K_a`),
        '<p>Use the pKₐ of the weak acid.</p>'+eq(String.raw`\mathrm{pH}\approx\mathrm{p}K_a`)]],
    ['indicator-range', ['ช่วงเปลี่ยนสีของอินดิเคเตอร์ควรอยู่ส่วนใดของกราฟไทเทรต?',
      'Where should the indicator’s colour-change range lie on the titration curve?'],
      ['อยู่ในช่วงที่ pH เปลี่ยนเร็วใกล้จุดสมมูล', 'In the steep part of the curve near the equivalence point.']],
  ];
  const questions = prompts.map(([key, question, answer], index) => {
    const solution = key === 'half-volume'
      ? '<p>'+t(...answer)+'</p>'+graph('acid25', {markRecallPoints:true})
      : t(...answer);
    const item = task('recall-'+key, (index+1)+'. '+t(...question), solution, {height:14});
    return key === 'equivalence'
      ? '<section data-print-keep>'+item+graph('acid25')+'</section>'
      : item;
  });
  return card('recall',t('Knowledge Recall · ลองตอบจากความจำ','Knowledge Recall · Retrieve from memory'),questions.join('\n'));
}

