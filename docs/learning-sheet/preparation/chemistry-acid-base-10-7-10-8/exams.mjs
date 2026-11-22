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

export function examProblems({t, task, card, link}) {
  function exam(year, question, page, prompts, solutions, result, extra = '') {
    const [url, th, en] = copies[year];
    const source = url + (page ? '#page=' + page : '');
    return card('exam-'+year+'-'+question,
      t(`A-Level เคมี ${year} · ข้อ ${question}`, `A-Level Chemistry ${year} · Question ${question}`),
      '<p class="source">'+link(source,t(th,en))+
      (page ? t(` · หน้า ${page}`,` · Page ${page}`) : '')+
      (year === 2569 ? ' · '+link(key69,t('เฉลยทางการ MyTCAS ชุด 1','Official MyTCAS key, Set 1')) : '')+'</p>'+extra+
      task(`a${year}-${question}`,t(...prompts),t(...solutions),{height:26,result,printResult:false}),
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
      ['A⁻ มาจากกรดแก่ จึงแทบไม่รับโปรตอน HZ⁺ เป็นกรดด้วย Kₐ = Kᵥ/Kᵦ(Z) = 1.0 × 10⁻¹⁰ ส่วน X⁻ เป็นเบสด้วย Kᵦ = Kᵥ/Kₐ(HX) = 1.0 × 10⁻⁹ ดังนั้น NaX มีแต่ผลของเบส [HZ]X มีไอออนกรดและเบสแต่ด้านเบสเด่นกว่า และ [HZ]A มีแต่ผลของกรด เรียง NaX > [HZ]X > [HZ]A',
       'A⁻ is the conjugate base of a strong acid and has negligible basicity. HZ⁺ is acidic with Kₐ = Kᵥ/Kᵦ(Z) = 1.0 × 10⁻¹⁰, and X⁻ is basic with Kᵦ = Kᵥ/Kₐ(HX) = 1.0 × 10⁻⁹. NaX supplies only the basic effect, [HZ]X supplies both with basicity stronger, and [HZ]A supplies the acidic effect. Rank NaX > [HZ]X > [HZ]A.'], '5'),
    exam(2566,29,19,
      ['เปิดข้อ 29 แล้วหาปริมาณเกลือที่จุดสมมูลก่อนใช้สมดุลหา pH ตามแบบจำลองที่โจทย์กำหนด',
       'Open question 29. Find the salt concentration at equivalence, then calculate pH using the model specified in the question.'],
      ['ใช้ปฏิกิริยา 1:1 ตามที่โจทย์กำหนด ได้เกลือ 70.0 mmol ใน 100.00 mL จึงได้ความเข้มข้นเริ่มต้น 0.700 mol/L ในแบบจำลองของโจทย์ Kᵦ = (1.0 × 10⁻¹⁴)/(7.00 × 10⁻¹⁰) = 1.43 × 10⁻⁵ ตั้ง ICE ได้ [OH⁻] ≈ √(0.700 × 1.43 × 10⁻⁵) ≈ 3.16 × 10⁻³ mol/L คิดเป็น 0.45% ของค่าเริ่มต้น ได้ pOH 2.50 และ pH 11.50',
       'Use the 1:1 reaction given in the question. It forms 70.0 mmol of salt in 100.00 mL, or 0.700 mol/L initially. In the stated model Kᵦ = (1.0 × 10⁻¹⁴)/(7.00 × 10⁻¹⁰) = 1.43 × 10⁻⁵. ICE gives [OH⁻] ≈ √(0.700 × 1.43 × 10⁻⁵) ≈ 3.16 × 10⁻³ mol/L, 0.45% of the initial value. The pOH is 2.50 and pH 11.50.'],'5 · 11.50'),
    exam(2567,18,10,
      ['เปิดข้อ 18 แล้วหาสารส่วนเกิน อย่าลืมนับจำนวน OH⁻ ต่อหนึ่งหน่วยสูตรของเบส',
       'Open question 18 and find the excess species. Count the hydroxide ions per formula unit of base.'],
      ['Ba(OH)₂ มี 4.00 mmol จึงให้ OH⁻ 8.00 mmol HCl ให้กรด 6.00 mmol แถว F เหลือ OH⁻ 2.00 mmol ใน 100.00 mL ได้ 0.0200 mol/L จึงได้ pOH 1.70 และ pH 12.30',
       'There are 4.00 mmol Ba(OH)₂, giving 8.00 mmol OH⁻. HCl provides 6.00 mmol acid. Row F leaves 2.00 mmol OH⁻ in 100.00 mL, or 0.0200 mol/L. The pOH is 1.70 and pH 12.30.'],'4 · 12.3'),
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
      ['ปริมาตร NaOH 20.00, 19.95 และ 20.05 mL เฉลี่ย 20.00 mL ใช้ 5.000 mmol ต่อกรดตัวอย่าง 50.00 mL อัตราส่วน 1:1 จึงมีกรด 25.00 mmol ในขวด 250 mL หรือ 2.200 g เมื่อมวลต่อโมล 88.0 g/mol ใช้ V = m/ρ ได้ 2.20/d mL',
       'The NaOH volumes are 20.00, 19.95 and 20.05 mL, averaging 20.00 mL. This is 5.000 mmol in a 50.00 mL aliquot. The 1:1 ratio gives 25.00 mmol acid in 250 mL, or 2.200 g at 88.0 g/mol. From V = m/ρ the volume is 2.20/d mL.'],'3 · 2.20/d mL'),
    exam(2568,24,20,
      ['เปิดข้อ 24 แล้วอธิบายครึ่งสมมูล แยกสิ่งที่สรุปจากปริมาณสารออกจากสิ่งที่สรุปได้จากช่วงสี',
       'Open question 24 and explain half-equivalence. Separate conclusions from stoichiometry from those supported by the indicator range.'],
      ['ถ้าใช้จุดยุติประมาณจุดสมมูล ใช้ HCl 12.50 × 0.0400 = 0.500 mmol จึงได้ [A⁻] เดิม 0.500/25.00 = 0.0200 mol/L ที่ 6.25 mL แถว F เหลือ A⁻ และเกิด HA อย่างละ 0.250 mmol เป็นบัฟเฟอร์และ pH ≈ pKₐ = 6.00 ช่วงเปลี่ยนสี 4.2–6.3 บอกว่าอยู่ในช่วงเปลี่ยนสี แต่ตารางช่วงสีอย่างเดียวระบุเฉดที่แน่นอนไม่ได้',
       'Using the endpoint to estimate equivalence gives 12.50 × 0.0400 = 0.500 mmol HCl and original [A⁻] = 0.500/25.00 = 0.0200 mol/L. At 6.25 mL, ICF leaves 0.250 mmol each of A⁻ and HA, making a buffer with pH ≈ pKₐ = 6.00. The 4.2–6.3 interval places it in the transition region. The range alone does not determine an exact shade.'],null,
      '<p class="callout">'+t('ข้ออภิปราย · ทปอ. ให้คะแนนฟรีข้อนี้ในเฉลยชุด 1','Discussion · The official Set 1 key awarded credit for all responses.')+'</p>'),
    exam(2569,22,null,
      ['เปิดข้อ 22 แล้วใช้ช่วงเปลี่ยนสีสองช่วงของไทมอลบลู ตรวจทีละข้อความ',
       'Open question 22 and use the two transition ranges of thymol blue to evaluate the claims.'],
      ['ที่ pH 7 อยู่ระหว่างช่วงเปลี่ยนสี จึงเห็นสีเหลือง สีเขียวสอดคล้องกับช่วงเหลืองไปน้ำเงินซึ่งอยู่ด้านเบส การไทเทรตกรดแก่–เบสแก่มีช่วงชันครอบคลุมช่วงด่างของไทมอลบลู จึงใช้แทนฟีนอล์ฟทาลีนได้ในกรณีที่โจทย์ระบุ',
       'At pH 7 the solution lies between the two transition ranges, so it appears yellow. Green belongs to the yellow-to-blue transition on the basic side. A strong-acid/strong-base titration has a steep region covering the alkaline thymol-blue transition, so it can replace phenolphthalein in the stated case.'], '3'),
    exam(2569,23,null,
      ['เปิดข้อ 23 แล้วใช้ปริมาตรตัวอย่างก่อนเติมน้ำหา Ba(OH)₂ หลังคำนวณจากอัตราส่วนการไทเทรต',
       'Open question 23 and use the aliquot volume before adding water to find the original Ba(OH)₂ concentration after applying the titration ratio.'],
      ['Ba(OH)₂ + 2HCl → BaCl₂ + 2H₂O ใช้ HCl 4.00 mmol จึงได้ Ba(OH)₂ 2.00 mmol น้ำกลั่นที่เติมไม่ได้เปลี่ยนจำนวนโมล เมื่อหารด้วยปริมาตรตัวอย่างเดิม 5.00 mL ได้ 0.400 mol/L',
       'Ba(OH)₂ + 2HCl → BaCl₂ + 2H₂O. The titration uses 4.00 mmol of HCl, so the aliquot contains 2.00 mmol Ba(OH)₂. Added water does not change the amount. Divide by the original 5.00 mL aliquot to obtain 0.400 mol/L.'],'3 · 0.400 mol/L'),
    card('recall',t('Knowledge Recall · ลองตอบจากความจำ','Knowledge Recall · Retrieve from memory'),[
      task('recall-1',t('หลัง ICF เหลืออะไรในกรณีบัฟเฟอร์ และเมื่อพอดีจะดูอะไรต่อ?',
        'What remains after ICF for a buffer, and what do you examine at equivalence?'),
        t('บัฟเฟอร์มีสมาชิกคู่กรด–เบสอ่อนทั้งสองชนิดในปริมาณที่ช่วยรับกรดและเบสได้ เมื่อพอดีให้ดูว่าไอออนของเกลือใดไฮโดรลิซิส',
          'A buffer retains both members of a weak conjugate pair in amounts that can take up acid and base. At equivalence check which salt ion hydrolyses.'),{height:18}),
      task('recall-2',t('หา V ครึ่งสมมูลจากกราฟอย่างไร และเลือกอินดิเคเตอร์จากตรงไหน?',
        'How do you find the half-equivalence volume, and which region guides indicator selection?'),
        t('อ่าน V ที่จุดสมมูลจากแกนนอนแล้วหารสอง สำหรับกรดอ่อนโมโนโพรติกกับเบสแก่ pH ตรงนั้นประมาณ pKₐ เลือกอินดิเคเตอร์ที่ช่วงเปลี่ยนสีอยู่ในส่วนชันรอบจุดสมมูล',
          'Read the equivalence volume on the horizontal axis and halve it. For a weak monoprotic acid titrated by a strong base, pH there is approximately pKₐ. Choose an indicator with a transition in the steep region near equivalence.'),{height:18}),
    ].join('')),
  ].join('\n').replaceAll('Kᵥ','K<sub>w</sub>');
}
