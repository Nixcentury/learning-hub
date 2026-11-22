const folder = 'https://drive.google.com/drive/folders/1Kd9AJ4zOmncK2qTMvFwu7T2K8XqmWr3W';
const copies = {
  2566: ['https://drive.google.com/file/d/1Iq4_OwRN_Icg_DyRF0CgKDfpiY2Q6CMb/view',
    'สำเนารวบรวมใน Drive','Collected copy in Drive'],
  2567: ['https://drive.google.com/file/d/1nqWVYFg-av-SL-Os1ANQp91S5VGD9Q0h/view',
    'ฉบับรวบรวมจากความจำใน Drive','Recalled paper in Drive'],
  2568: ['https://assets.mytcas.com/68/answer/tcas68-chem-a-level.pdf',
    'ข้อสอบและเฉลยทางการ MyTCAS','Official MyTCAS paper and key'],
  2569: ['https://www.scribd.com/document/1071389672/%E0%B8%82-%E0%B8%AD%E0%B8%AA%E0%B8%AD%E0%B8%9A%E0%B9%80%E0%B8%84%E0%B8%A1%E0%B8%B5-A-level-69',
    'สำเนาข้อสอบออนไลน์','Online exam copy'],
};
const key69 = 'https://assets.mytcas.com/69/alevel/69_answers_61-89.pdf#page=5';
const shortResponses = new Set(['2566-28', '2567-19', '2568-22', '2569-22']);

export function examProblems({t, work, task, card, link}) {
  function exam(year, question, page, prompts, solutions, result, extra = '') {
    const [url, th, en] = copies[year];
    const source = url + (page ? '#page=' + page : '');
    return card('exam-'+year+'-'+question,
      t(`A-Level เคมี ${year} · ข้อ ${question}`, `A-Level Chemistry ${year} · Question ${question}`),
      '<p class="source">'+link(source,t(th,en))+
      (page ? t(` · หน้า ${page}`,` · Page ${page}`) : '')+
      (year === 2569 ? ' · '+link(key69,t('เฉลยทางการ MyTCAS ชุด 1','Official MyTCAS key, Set 1')) : '')+'</p>'+extra+
      task(`a${year}-${question}`,t(...prompts),Array.isArray(solutions) ? t(...solutions) : solutions,
        {height:shortResponses.has(`${year}-${question}`) ? 16 : 26,result,printResult:false}),
      {keepTogether:true});
  }
  return [
    card('exam-start',t('ข้อสอบย้อนหลัง · เปิดข้อสอบแล้วลองทำ','Past A-Level questions · Open the source and attempt it'),
      '<p>'+t('เปิดข้อสอบตามปีและเลขข้อเพื่อดูข้อความ ตัวเลือก ตาราง และกราฟ แล้วตอบในช่องก่อนเปิดวิธีทำ',
        'Open the paper at the specified year and question for the wording, choices, tables and graphs. Attempt it before revealing the solution.')+
      ' '+link(folder,t('โฟลเดอร์ข้อสอบของครู','Teacher’s exam folder'))+'</p>'),
    exam(2566,28,19,
      ['เปิดข้อ 28 แล้วเรียง pH ของเกลือสามชนิดตามโจทย์ อธิบายว่าไอออนใดมีผลต่อ pH',
       'Open question 28 and rank the three salts by pH. Explain which ions influence pH.'],
      work(t('เทียบไอออนที่ไฮโดรลิซิส A⁻ เป็นคู่เบสของกรดแก่', 'Compare the hydrolysing ions. A⁻ is the conjugate base of a strong acid.'), [
          String.raw`K_a(\mathrm{HZ^+}) &= \frac{K_w}{K_b(\mathrm Z)}=1.0\times10^{-10}`,
          String.raw`K_b(\mathrm{X^-}) &= \frac{K_w}{K_a(\mathrm{HX})}=1.0\times10^{-9}`,
          String.raw`\mathrm{pH}(\mathrm{NaX}) &> \mathrm{pH}(\mathrm{[HZ]X})>\mathrm{pH}(\mathrm{[HZ]A})`,
        ],
          t('ตัวเลือก 5 ใน [HZ]X ไอออน X⁻ มีผลด้านเบสมากกว่า HZ⁺ ด้านกรด', 'Choice 5. In [HZ]X the basic effect of X⁻ exceeds the acidic effect of HZ⁺.')), '5'),
    exam(2566,29,19,
      ['เปิดข้อ 29 แล้วหาปริมาณเกลือที่จุดสมมูลก่อนใช้สมดุลหา pH ตามแบบจำลองที่โจทย์กำหนด',
       'Open question 29. Find the salt concentration at equivalence, then calculate pH using the model specified in the question.'],
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
      ['เปิดข้อ 18 แล้วหาสารส่วนเกิน อย่าลืมนับจำนวน OH⁻ ต่อหนึ่งหน่วยสูตรของเบส',
       'Open question 18 and find the excess species. Count the hydroxide ions per formula unit of base.'],
      work(t('Ba(OH)₂ ให้ OH⁻ สองโมลต่อหนึ่งโมล ใช้สารส่วนเกินในแถว F', 'Each mole of Ba(OH)₂ supplies two moles of OH⁻. Use the excess in row F.'), [
          String.raw`n(\mathrm{OH^-}) &=2(4.00\,\mathrm{mmol})=8.00\,\mathrm{mmol}`,
          String.raw`n_{\mathrm F}(\mathrm{OH^-}) &= (8.00-6.00)\,\mathrm{mmol}=2.00\,\mathrm{mmol}`,
          String.raw`[\mathrm{OH^-}] &= \frac{2.00\,\mathrm{mmol}}{100.00\,\mathrm{mL}}=0.0200\,\mathrm{mol/L}`,
          String.raw`\mathrm{pOH} &= -\log(0.0200)\approx1.70`,
          String.raw`\mathrm{pH} &=14.00-1.70=12.30`,
        ],
          t('ตัวเลือก 4', 'Choice 4.')),'4 · 12.3'),
    exam(2567,19,10,
      ['เปิดกราฟสองเส้นในข้อ 19 แล้วพิจารณาทีละข้อความเกี่ยวกับเบสคู่กรด สารที่เหลือ และอินดิเคเตอร์',
       'Open the two-curve figure in question 19. Evaluate each claim about conjugate bases, the remaining species and the indicator.'],
      ['ที่ครึ่งสมมูล HX มี pH สูงกว่า HY จึงมี pKₐ สูงกว่าและ X⁻ เป็นเบสคู่กรดที่แรงกว่า Y⁻ ที่ 15.00 mL เลยจุดสมมูลของทั้งสองและมี OH⁻ เหลือจึงไม่เป็นบัฟเฟอร์ สำหรับ HX กราฟผ่าน pH 8.30 ตั้งแต่ก่อนช่วงชันใกล้ 10.00 mL ฟีนอล์ฟทาลีนจึงเริ่มเปลี่ยนสีเร็วเกินไปสำหรับ HX ตามกราฟในฉบับอ้างอิง สรุปว่าถูกเฉพาะ ก',
       'At half-equivalence HX has the higher pH and pKₐ, so X⁻ is a stronger conjugate base than Y⁻. At 15.00 mL both titrations are past equivalence and excess OH⁻ remains, so neither is a buffer. The HX curve crosses pH 8.30 before the steep region near 10.00 mL. Phenolphthalein therefore starts changing too early for HX in this graph. Only statement A is correct.'],'1'),
    exam(2568,22,18,
      ['เปิดข้อ 22 แล้วเทียบค่า pH ที่จุดยุติกับที่จุดสมมูล และระบุสีที่จุดสมมูลตามช่วงสีในโจทย์',
       'Open question 22. Compare endpoint and equivalence pH, then give the colour at equivalence using the stated transition range.'],
      ['อินดิเคเตอร์ X เปลี่ยนสีช่วง 3.0–4.0 ระหว่างเพิ่ม NaOH จุดสมมูลของกรดอ่อน–เบสแก่อยู่ฝั่งเบสเพราะ CH₃COO⁻ ไฮโดรลิซิส จึงมี pH สูงกว่าจุดยุติที่สังเกตด้วย X และเป็นสีน้ำเงินที่สมมูล',
       'Indicator X changes over pH 3.0–4.0 as NaOH is added. Weak-acid/strong-base equivalence is basic because acetate hydrolyses. Its pH is therefore higher than the observed endpoint with X, and the indicator is blue at equivalence.'],'1'),
    exam(2568,23,19,
      ['เปิดตารางบิวเรตในข้อ 23 แล้วใช้ทั้งสามรอบ ย้อนจากสารละลายที่ปิเปตไปเป็นปริมาตรกรดที่ใช้เตรียม',
       'Open the burette table in question 23. Use all three trials and work back from the aliquot to the volume of acid used to prepare the solution.'],
      work(t('เฉลี่ยปริมาตรจากสามรอบ แล้วใช้สัดส่วน 1:1 ย้อนหามวลกรดทั้งขวด', 'Average the three trials and use the 1:1 ratio to recover the acid mass in the full flask.'), [
          String.raw`\overline V &= \frac{20.00+19.95+20.05}{3}\,\mathrm{mL}=20.00\,\mathrm{mL}`,
          String.raw`n_{50} &= (20.00\,\mathrm{mL})(0.2500\,\mathrm{mmol/mL})=5.000\,\mathrm{mmol}`,
          String.raw`n_{250} &= (5.000\,\mathrm{mmol})\frac{250}{50.00}=25.00\,\mathrm{mmol}`,
          String.raw`m &= (25.00\,\mathrm{mmol})(0.0880\,\mathrm{g/mmol})=2.200\,\mathrm g`,
          String.raw`V &= \frac{m}{\rho}=\frac{2.20\,\mathrm g}{d\,\mathrm{g/mL}} =\frac{2.20}{d}\,\mathrm{mL}`,
        ],
          t('ตัวเลือก 3', 'Choice 3.')),'3 · 2.20/d mL'),
    exam(2568,24,20,
      ['เปิดข้อ 24 แล้วอธิบายครึ่งสมมูล แยกสิ่งที่สรุปจากปริมาณสารออกจากสิ่งที่สรุปได้จากช่วงสี',
       'Open question 24 and explain half-equivalence. Separate conclusions from stoichiometry from those supported by the indicator range.'],
      work(t('ใช้จุดยุติประมาณจุดสมมูล แล้วคำนวณที่ครึ่งสมมูล', 'Use the endpoint to estimate equivalence, then calculate at half-equivalence.'), [
          String.raw`n_{\mathrm{eq}}(\mathrm{HCl}) &= (12.50\,\mathrm{mL})(0.0400\,\mathrm{mmol/mL}) =0.500\,\mathrm{mmol}`,
          String.raw`C_0(\mathrm{A^-}) &= \frac{0.500\,\mathrm{mmol}}{25.00\,\mathrm{mL}}=0.0200\,\mathrm{mol/L}`,
          String.raw`V_{1/2} &= \frac{12.50}{2}\,\mathrm{mL}=6.25\,\mathrm{mL}`,
          String.raw`n_{\mathrm F}(\mathrm{HA}) &= n_{\mathrm F}(\mathrm{A^-})=0.250\,\mathrm{mmol}`,
          String.raw`\mathrm{pH} &\approx \mathrm{p}K_a=6.00`,
        ],
          t('pH 6.00 อยู่ในช่วงเปลี่ยนสี 4.2–6.3 ตารางช่วงสีระบุเฉดที่แน่นอนไม่ได้', 'The pH of 6.00 lies in the 4.2–6.3 transition range. The interval alone cannot determine the exact shade.')),null,
      '<p class="callout">'+t('ข้ออภิปราย · ทปอ. ให้คะแนนฟรีข้อนี้ในเฉลยชุด 1','Discussion · The official Set 1 key awarded credit for all responses.')+'</p>'),
    exam(2569,22,null,
      ['เปิดข้อ 22 แล้วใช้ช่วงเปลี่ยนสีสองช่วงของไทมอลบลู ตรวจทีละข้อความ',
       'Open question 22 and use the two transition ranges of thymol blue to evaluate the claims.'],
      ['ที่ pH 7 อยู่ระหว่างช่วงเปลี่ยนสี จึงเห็นสีเหลือง สีเขียวสอดคล้องกับช่วงเหลืองไปน้ำเงินซึ่งอยู่ด้านเบส การไทเทรตกรดแก่–เบสแก่มีช่วงชันครอบคลุมช่วงด่างของไทมอลบลู จึงใช้แทนฟีนอล์ฟทาลีนได้ในกรณีที่โจทย์ระบุ',
       'At pH 7 the solution lies between the two transition ranges, so it appears yellow. Green belongs to the yellow-to-blue transition on the basic side. A strong-acid/strong-base titration has a steep region covering the alkaline thymol-blue transition, so it can replace phenolphthalein in the stated case.'], '3'),
    exam(2569,23,null,
      ['เปิดข้อ 23 แล้วใช้ปริมาตรตัวอย่างก่อนเติมน้ำหา Ba(OH)₂ หลังคำนวณจากอัตราส่วนการไทเทรต',
       'Open question 23 and use the aliquot volume before adding water to find the original Ba(OH)₂ concentration after applying the titration ratio.'],
      work(t('ใช้ปริมาตรที่ปิเปตก่อนเติมน้ำในการหาความเข้มข้นเดิม', 'Use the volume pipetted before adding water to find the original concentration.'), [
          String.raw`&\mathrm{Ba(OH)_2+2HCl\longrightarrow BaCl_2+2H_2O}`,
          String.raw`n(\mathrm{HCl}) &=4.00\,\mathrm{mmol}`,
          String.raw`n(\mathrm{Ba(OH)_2}) &= \frac{4.00}{2}\,\mathrm{mmol}=2.00\,\mathrm{mmol}`,
          String.raw`C(\mathrm{Ba(OH)_2}) &= \frac{2.00\,\mathrm{mmol}}{5.00\,\mathrm{mL}}=0.400\,\mathrm{mol/L}`,
        ],
          t('ตัวเลือก 3 น้ำกลั่นที่เติมเปลี่ยนปริมาตร แต่จำนวนโมลในตัวอย่างคงเดิม', 'Choice 3. Adding distilled water changes the volume while the amount in the aliquot stays the same.')),'3 · 0.400 mol/L'),
    card('recall',t('Knowledge Recall · ลองตอบจากความจำ','Knowledge Recall · Retrieve from memory'),[
      task('recall-1',t('หลัง ICF เหลืออะไรในกรณีบัฟเฟอร์ และเมื่อพอดีจะดูอะไรต่อ?',
        'What remains after ICF for a buffer, and what do you examine at equivalence?'),
        t('บัฟเฟอร์มีสมาชิกคู่กรด–เบสอ่อนทั้งสองชนิดในปริมาณที่ช่วยรับกรดและเบสได้ เมื่อพอดีให้ดูว่าไอออนของเกลือใดไฮโดรลิซิส',
          'A buffer retains both members of a weak conjugate pair in amounts that can take up acid and base. At equivalence check which salt ion hydrolyses.'),{height:14}),
      task('recall-2',t('หา V ครึ่งสมมูลจากกราฟอย่างไร และเลือกอินดิเคเตอร์จากตรงไหน?',
        'How do you find the half-equivalence volume, and which region guides indicator selection?'),
        t('อ่าน V ที่จุดสมมูลจากแกนนอนแล้วหารสอง สำหรับกรดอ่อนโมโนโพรติกกับเบสแก่ pH ตรงนั้นประมาณ pKₐ เลือกอินดิเคเตอร์ที่ช่วงเปลี่ยนสีอยู่ในส่วนชันรอบจุดสมมูล',
          'Read the equivalence volume on the horizontal axis and halve it. For a weak monoprotic acid titrated by a strong base, pH there is approximately pKₐ. Choose an indicator with a transition in the steep region near equivalence.'),{height:14}),
    ].join('')),
  ].join('\n').replaceAll('Kᵥ','K<sub>w</sub>');
}
