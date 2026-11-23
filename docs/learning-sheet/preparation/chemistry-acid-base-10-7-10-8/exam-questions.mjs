export function examQuestions({t, eq, table}) {
  const p = (th, en) => '<p>'+t(th,en)+'</p>';
  const choices = (thai, english = thai) =>
    '<ol class="exam-choices">'+t(thai,english).map(choice=>'<li>'+choice+'</li>').join('')+'</ol>';
  const statements = (thai, english) => '<ol class="exam-statements">'+t(thai,english)
    .map((statement,i)=>'<li><strong>'+t(['ก.','ข.','ค.'][i],['A.','B.','C.'][i])+'</strong> '+statement+'</li>').join('')+'</ol>';
  const graph = '<figure class="exam-graph"><img src="assets/alevel/2567-q19-titration-curves.png" width="816" height="542" alt="'+
    t('กราฟ pH กับปริมาตร NaOH เส้นทึบคือ HX เส้นประคือ HY',
      'pH versus added NaOH volume. The solid line is HX and the dashed line is HY.')+'"><figcaption>'+
    t('แกนนอน ปริมาตร NaOH ที่เติม (mL)','Horizontal axis · volume of NaOH added (mL)')+'</figcaption></figure>';

  return {
    '2566-28': p('กำหนดให้ A, X และ Z เป็นสัญลักษณ์สมมติ ปฏิกิริยาในน้ำและค่าคงที่เป็นดังนี้',
      'A, X and Z are hypothetical symbols. Their reactions in water and equilibrium constants are shown below.')+
      eq(String.raw`\mathrm{HA(aq)+H_2O(l)\longrightarrow A^-(aq)+H_3O^+(aq)}`)+
      eq(String.raw`\mathrm{HX(aq)+H_2O(l)\rightleftharpoons X^-(aq)+H_3O^+(aq)}\qquad K_a=1.0\times10^{-5}`)+
      eq(String.raw`\mathrm{Z(aq)+H_2O(l)\rightleftharpoons HZ^+(aq)+OH^-(aq)}\qquad K_b=1.0\times10^{-4}`)+
      p('เตรียมสารละลาย [HZ]A, [HZ]X และ NaX ที่ความเข้มข้นชนิดละ 1.0 mol/L ข้อใดเรียง pH จากมากไปน้อยได้ถูกต้อง?',
        'Solutions of [HZ]A, [HZ]X and NaX are each 1.0 mol/L. Which option ranks their pH from highest to lowest?')+
      choices(['[HZ]X > [HZ]A > NaX','[HZ]A > [HZ]X > NaX','NaX > [HZ]A > [HZ]X',
        '[HZ]X > NaX > [HZ]A','NaX > [HZ]X > [HZ]A']),
    '2566-29': p('กรดบอริก 30.00 mL ทำปฏิกิริยาพอดีกับ NaOH 1.00 mol/L ปริมาตร 70.00 mL ตามแบบจำลองด้านล่าง',
      'A 30.00 mL sample of boric acid reacts completely with 70.00 mL of 1.00 mol/L NaOH according to the model below.')+
      eq(String.raw`\mathrm{H_3BO_3(aq)+NaOH(aq)\rightleftharpoons H_2O(l)+NaH_2BO_3(aq)}`)+
      p('ใช้เฉพาะค่าคงที่การแตกตัวขั้นแรกของกรดบอริก Kₐ₁ = 7.00 × 10⁻¹⁰ จงหา pH ณ จุดสมมูล',
        'Use only the first acid dissociation constant of boric acid, Kₐ₁ = 7.00 × 10⁻¹⁰. What is the pH at equivalence?')+
      choices(['2.50','4.65','9.15','9.35','11.50']),
    '2567-18': p('ผสม Ba(OH)₂ 0.1 mol/L ปริมาตร 40.00 mL กับ HCl 0.1 mol/L ปริมาตร 60.00 mL สารละลายหลังผสมมี pH เท่าใด?',
      'Mix 40.00 mL of 0.1 mol/L Ba(OH)₂ with 60.00 mL of 0.1 mol/L HCl. What is the pH of the resulting solution?')+
      choices(['1.7','2.0','12.0','12.3','12.6']),
    '2567-19': p('ใช้ NaOH 0.1 mol/L ไทเทรตกรดอ่อน HX และ HY แยกกัน กรดทั้งสองมีความเข้มข้นเท่ากันและใช้ตัวอย่างครั้งละ 10.00 mL ผลแสดงในกราฟ ข้อความใดถูกต้อง?',
      'Separate 10.00 mL samples of the weak acids HX and HY, both at the same concentration, are titrated with 0.1 mol/L NaOH. The curves are shown below. Which statements are correct?')+graph+
      statements([
        'X⁻ เป็นเบสที่แรงกว่า Y⁻',
        'เมื่อเติม NaOH 15.00 mL ในการไทเทรตแต่ละครั้ง สารละลายที่ได้ทั้งสองเป็นบัฟเฟอร์',
        'ฟีนอล์ฟทาลีน ซึ่งเปลี่ยนจากไม่มีสีเป็นสีชมพูที่ pH 8.30–10.00 เหมาะกับการไทเทรตทั้งสองกรณี',
      ],[
        'X⁻ is a stronger base than Y⁻.',
        'After 15.00 mL of NaOH has been added in each titration, both solutions are buffers.',
        'Phenolphthalein, which changes from colourless to pink over pH 8.30–10.00, is suitable for both titrations.',
      ])+
      choices(['ก. เท่านั้น','ข. เท่านั้น','ค. เท่านั้น','ก. และ ข.','ก. และ ค.'],
        ['A only','B only','C only','A and B','A and C']),
    '2568-22': p('ไทเทรตกรดแอซีติกด้วยสารละลายมาตรฐาน NaOH โดยใช้อินดิเคเตอร์ X ซึ่งเปลี่ยนจากสีแดงเป็นสีน้ำเงินในช่วง pH 3.0–4.0 ข้อใดเปรียบเทียบ pH ที่จุดสมมูลกับ pH ที่จุดยุติและระบุสีที่จุดสมมูลได้ถูกต้อง?',
      'Acetic acid is titrated with standard NaOH using indicator X, which changes from red to blue over pH 3.0–4.0. Which option correctly compares the equivalence pH with the endpoint pH and gives the colour at equivalence?')+
      table([t('ตัวเลือก','Choice'),t('pH ที่จุดสมมูลเทียบกับจุดยุติ','Equivalence pH compared with endpoint pH'),t('สีที่จุดสมมูล','Colour at equivalence')],
        [['1',t('มากกว่า','Higher'),t('น้ำเงิน','Blue')],['2',t('มากกว่า','Higher'),t('ม่วง','Purple')],
         ['3',t('เท่ากับ','Equal'),t('น้ำเงิน','Blue')],['4',t('น้อยกว่า','Lower'),t('ม่วง','Purple')],
         ['5',t('น้อยกว่า','Lower'),t('น้ำเงิน','Blue')]]),
    '2568-23': p('แบ่งสารละลายกรดโมโนโพรติกตัวอย่างครั้งละ 50.00 mL แล้วไทเทรตด้วย NaOH มาตรฐาน 0.2500 mol/L ได้ผลดังตาราง',
      'Each 50.00 mL aliquot of a monoprotic acid solution is titrated with 0.2500 mol/L standard NaOH. The burette readings are given below.')+
      table([t('รอบ','Trial'),t('บิวเรตเริ่มต้น (mL)','Initial burette reading (mL)'),t('บิวเรตที่จุดยุติ (mL)','Endpoint burette reading (mL)')],
        [['1','20.00','40.00'],['2','20.00','39.95'],['3','20.00','40.05']])+
      p('กรดบริสุทธิ์มีมวลต่อโมล 88.0 g/mol และความหนาแน่น d g/mL ต้องตวงกรดบริสุทธิ์ปริมาตรเท่าใดเพื่อเตรียมสารละลายตัวอย่างในขวดวัดปริมาตร 250 mL?',
        'The pure acid has a molar mass of 88.0 g/mol and a density of d g/mL. What volume of pure acid was used to prepare the sample solution in a 250 mL volumetric flask?')+
      choices([String.raw`\(\frac{0.440}{d}\,\mathrm{mL}\)`,String.raw`\(0.880d\,\mathrm{mL}\)`,String.raw`\(\frac{2.20}{d}\,\mathrm{mL}\)`,
        String.raw`\(4.40d\,\mathrm{mL}\)`,t('ข้อมูลไม่เพียงพอ','Insufficient information')]),
    '2568-24': p('ไทเทรตสารละลายเบสอ่อน A⁻ ปริมาตร 25.00 mL ด้วย HCl 0.0400 mol/L ใช้ HCl 12.50 mL ถึงจุดยุติ กรดคู่เบส HA มี Kₐ = 1.00 × 10⁻⁶ และเมทิลเรดเปลี่ยนจากสีแดงเป็นสีเหลืองที่ pH 4.2–6.3 ข้อความใดถูกต้อง?',
      'A 25.00 mL sample of the weak base A⁻ is titrated with 0.0400 mol/L HCl. The endpoint requires 12.50 mL. Its conjugate acid HA has Kₐ = 1.00 × 10⁻⁶ and methyl red changes from red to yellow over pH 4.2–6.3. Which statements are correct?')+
      statements(['หลังเติม HCl 6.25 mL เมทิลเรดให้สีส้ม','หลังเติม HCl 6.25 mL สารละลายเป็นบัฟเฟอร์',
        'สารละลาย A⁻ ก่อนเริ่มไทเทรตมีความเข้มข้น 0.0200 mol/L'],
        ['After 6.25 mL of HCl is added, methyl red gives an orange colour.','After 6.25 mL of HCl is added, the solution is a buffer.',
        'The original A⁻ concentration is 0.0200 mol/L.'])+
      choices(['ก. เท่านั้น','ข. เท่านั้น','ก. และ ข.','ก. และ ค.','ข. และ ค.'],
        ['A only','B only','A and B','A and C','B and C']),
    '2569-22': p('ไทมอลบลูมีช่วงเปลี่ยนสีสองช่วงตามตาราง ข้อใดอธิบายการใช้หรือสีของอินดิเคเตอร์ได้ถูกต้อง?',
      'Thymol blue has the two transition ranges shown in the table. Which statement about its colour or use is correct?')+
      table([t('ช่วง pH','pH range'),t('สีเมื่อ pH เพิ่มขึ้น','Colour as pH increases')],
        [['1.3–2.8',t('แดง → เหลือง','Red → yellow')],['8.0–9.6',t('เหลือง → น้ำเงิน','Yellow → blue')]])+
      choices([
        'ไทมอลบลูให้สีเขียวในสารละลายไม่มีสีที่เป็นกลาง',
        'ถ้าเติมไทมอลบลูแล้วได้สีเขียว แสดงว่าสารละลายมีฤทธิ์เป็นกรด',
        'ใช้ไทมอลบลูแทนฟีนอล์ฟทาลีนในการหาความเข้มข้นของ HCl โดยไทเทรตด้วย NaOH ได้',
        'ในการไทเทรตเบสอ่อนด้วยกรดแก่ ไทมอลบลูเปลี่ยนจากเหลืองเป็นเขียวที่จุดยุติ',
        'ในการไทเทรตกรดอ่อนด้วยเบสแก่ ไทมอลบลูเปลี่ยนจากเหลืองเป็นส้มหรือชมพูอ่อนที่จุดยุติ',
      ],[
        'Thymol blue appears green in a neutral, colourless solution.',
        'A green colour after adding thymol blue indicates an acidic solution.',
        'Thymol blue can replace phenolphthalein when determining the concentration of HCl by titration with NaOH.',
        'When a weak base is titrated with a strong acid, thymol blue changes from yellow to green at the endpoint.',
        'When a weak acid is titrated with a strong base, thymol blue changes from yellow to orange or pale pink at the endpoint.',
      ]),
    '2569-23': p('ปิเปต Ba(OH)₂ ตัวอย่าง 5.00 mL ลงในขวดรูปกรวยแล้วเติมน้ำกลั่น 15.00 mL ไทเทรตด้วย HCl 0.200 mol/L โดยใช้ HCl 20.00 mL ถึงจุดยุติ จงหาความเข้มข้นของ Ba(OH)₂ ในตัวอย่างก่อนเติมน้ำ',
      'A 5.00 mL aliquot of Ba(OH)₂ is pipetted into a conical flask and diluted with 15.00 mL of distilled water. The titration requires 20.00 mL of 0.200 mol/L HCl to reach the endpoint. What was the Ba(OH)₂ concentration before dilution?')+
      choices(['0.100 mol/L','0.200 mol/L','0.400 mol/L','0.800 mol/L','1.600 mol/L']),
  };
}
