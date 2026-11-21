const bilingual = (th, en) => ({ th, en });

export const doubleSlitPlayGuide = {
  schemaVersion: 1,
  format: 'reading',
  contentId: 'physics-ipst-wave-optics-10-2-double-slit-lab',
  source: 'content/physics/ipst/wave-optics/10-2-double-slit-lab.html',
  title: bilingual('คู่มือเล่น 10.2 แล็บสลิตคู่', '10.2 Double-slit lab play guide'),
  introduction: bilingual('วัดแถบสว่างจากแสงผ่านสลิตคู่ แล้วใช้ผลใน Classroom Note', 'Measure bright fringes from light passing through two slits, then use the results in the Classroom Note.'),
  gettingStarted: [
    bilingual('ซิมเปิดที่โต๊ะแสง ชุด A/B/C ใช้แสงที่สองช่องเริ่มเฟสตรงกัน', 'The lab opens on the optical bench. A/B/C use initially in-phase light at both slits.'),
    bilingual('กดผู้ช่วยทำแล็บที่มุมล่างซ้ายเพื่อดูขั้นต่อไปและชี้เครื่องมือ กดย่อได้ระหว่างทดลอง', 'Open the lab helper at the bottom left to see the next step and locate its control. Collapse it while experimenting.'),
  ],
  troubleshooting: [
    bilingual('ถ้ายังตอบไม่ได้ ให้ตรวจว่าบันทึกครบทั้งสองชุดของคู่นั้นและวางเส้นคนละด้านของแถบกลาง', 'If a question is unavailable, check for both trial records and place the markers on opposite sides of the central fringe.'),
    bilingual('หากต้องการทำซ้ำ ให้กดรีเซ็ตภารกิจและยืนยันเพื่อล้างผลวัดและคำตอบที่เก็บไว้ของแล็บนี้', 'To repeat the activity, choose Reset activity and confirm to clear this lab’s stored measurements and answers.'),
  ],
  finish: bilingual('นำบันทึกของกลุ่มไปใช้ในการคำนวณและอธิบายบน Classroom Note', 'Use your group’s readings for calculations and explanations in the Classroom Note.'),
  sections: [
    {
      id: 'measure',
      title: bilingual('วัดและบันทึก', 'Measure and record'),
      objectives: [bilingual('วัดแถบกลางซ้ำเมื่อเปลี่ยนเพียงปัจจัยเดียว', 'Repeat the central-fringe measurement with one variable changed at a time.')],
      parts: [{id:'steps', title:bilingual('สี่บันทึกก่อนเรียน', 'Four trials before the lesson'), items:[
        bilingual('ใช้ L และ R จับตำแหน่งมืดที่อยู่ติดกับแถบสว่างตรงกลางคนละด้าน แล้วบันทึกความกว้างเป็น mm ใช้สเกลฉากเท่าเดิมเมื่อเปรียบเทียบ', 'Use L and R to mark the dark positions immediately either side of the central bright fringe. Record the width in mm. Keep the screen zoom fixed when comparing.'),
        bilingual('วัดชุด A, B, C ที่ระยะฉาก 1 m แล้วเลือก B อีกครั้ง เลื่อนฉากไปที่ 2 m และวัดใหม่', 'Measure A, B and C at 1 m. Select B again, move the screen to 2 m and record another measurement.'),
      ]}],
    },
    {
      id: 'compare',
      title: bilingual('เปรียบเทียบบันทึก', 'Compare your readings'),
      objectives: [bilingual('อ่านค่าก่อนและหลังเปลี่ยนระยะสลิต สี หรือระยะฉาก', 'Read the before-and-after widths when slit separation, colour or screen distance changes.')],
      parts: [{id:'checkout', title:bilingual('Check-out', 'Check-out'), items:[
        bilingual('เปิด Check-out ดูทีละคู่ ได้แก่ A กับ B, B กับ C และ B ที่ 1 m กับ B ที่ 2 m ตอบจากความกว้างที่แสดง', 'Open the check-out. For each pair (A and B, B and C, and B at 1 m and 2 m), answer from the two recorded widths.'),
        bilingual('คัดเลขบันทึกและความกว้างสี่ชุดลงในตารางหน้าแรกของ Classroom Note', 'Copy the four trial numbers and widths into the table on page one of the Classroom Note.'),
      ]}],
    },
    {
      id: 'retest',
      title: bilingual('กลับมาวัดหลังเรียน', 'Return to measure after the lesson'),
      objectives: [bilingual('นำผลวัดใหม่ไปเปรียบเทียบกับค่าที่ทำนาย', 'Compare a new measurement with your prediction.')],
      parts: [{id:'predict-and-test', title:bilingual('แสงแดงชุด C', 'Red light, set C'), items:[
        bilingual('ใช้ค่าชุด C ที่ 1 m ทำนายใน Classroom Note ก่อน จากนั้นเลือก C เลื่อนฉากไปที่ 2 m แล้ววัดและบันทึก', 'Make a prediction in the Classroom Note using your C reading at 1 m. Then select C, move the screen to 2 m, measure and record.'),
        bilingual('นำผลวัดกลับไปเทียบกับที่ทำนาย และใช้ประมาณความยาวคลื่นใน Classroom Note', 'Take the new reading back to compare with your prediction and estimate the wavelength in the Classroom Note.'),
      ]}],
    },
  ],
};
