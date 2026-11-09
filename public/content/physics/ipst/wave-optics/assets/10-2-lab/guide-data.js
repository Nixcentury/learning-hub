const bilingual = (th, en) => ({ th, en });

export const doubleSlitPlayGuide = {
  schemaVersion: 1,
  format: 'reading',
  contentId: 'physics-ipst-wave-optics-10-2-double-slit-lab',
  source: 'content/physics/ipst/wave-optics/10-2-double-slit-lab.html',
  title: bilingual('คู่มือเล่น 10.2 แล็บสลิตคู่', '10.2 Double-slit lab play guide'),
  introduction: bilingual(
    'ทำทีละภารกิจจากภาพคลื่นไปสู่การวัดแถบแสง คู่มือนี้บอกตำแหน่งปุ่ม ขั้นทดลอง และสิ่งที่ต้องสังเกต ให้ตอบ Check-out ด้วยตัวเอง',
    'Work through one mission at a time, from waves to light measurements. The guide shows the controls, steps and observations. Answer each check-out yourself.'
  ),
  gettingStarted: [
    bilingual('เลือกภารกิจจากเมนูบนการ์ด แล้วอ่านจุดประสงค์ของภารกิจนั้น', 'Choose a mission on the mission card and read its objectives.'),
    bilingual('ใช้ปุ่ม “ไปขั้นทดลองถัดไป” เพื่อไปยังเครื่องมือของรายการที่ยังต้องทำ', 'Use “Go to next experiment step” to find the control for the next incomplete step.'),
    bilingual('เมื่อทดลองครบ กด “ไปทำ Check-out” เลือกคำตอบจากรายการ หรือกรอกตัวเลขตามหน่วยที่ระบุ แล้วกดตรวจ', 'After completing the steps, open the check-out. Choose from the list or enter a number in the stated unit, then check your answers.'),
  ],
  sections: [
    {
      id: 'in-phase',
      title: bilingual('1 · ดูแนวกลางเมื่อเฟสตรงกัน', '1 · Observe the in-phase centre line'),
      objectives: [bilingual('ใช้ภาพคลื่นจำแนกจุดบนแนวกลางเมื่อสองแหล่งเริ่มเฟสตรงกัน', 'Use the wave display to classify a point on the centre line for in-phase sources.')],
      parts: [{ id: 'steps', title: bilingual('เล่นคลื่นและสังเกต P', 'Play the waves and watch P'), items: [
        bilingual('เลือก “1 · แนวกลางเมื่อเฟสตรงกัน” ในเมนูภารกิจ ดูที่มุมมอง “คลื่นน้ำ · เข้าใจภาพ”', 'Choose “1 · In-phase centre line” and use the Water waves view.'),
        bilingual('ตรวจว่าเฟสเป็น “ตรงกัน · 0°” แล้วกด “P กลาง” ใต้ภาพ', 'Set the sources to “In phase · 0°” and use “Centre P” below the picture.'),
        bilingual('กด “เล่นคลื่น” แล้วสังเกตการเปลี่ยนของผิวน้ำที่ P ต่อเนื่องหลายจังหวะ', 'Press “Play waves” and watch how the surface at P changes over several cycles.'),
        bilingual('กด “ไปทำ Check-out” แล้วเลือกคำตอบที่สอดคล้องกับสิ่งที่สังเกต', 'Open the check-out and choose the option that matches your observation.'),
      ] }],
    },
    {
      id: 'opposite-phase',
      title: bilingual('2 · เปรียบเทียบเมื่อเปลี่ยนเฟส', '2 · Compare after changing the source phase'),
      objectives: [bilingual('จำแนกแนวกลางเมื่อสลับเป็นเฟสตรงข้าม โดยเปรียบเทียบกับกรณีก่อนหน้า', 'Classify the centre line after reversing the source phase and compare with the first case.')],
      parts: [{ id: 'steps', title: bilingual('เปลี่ยนเฟสแล้วดูจุดเดิม', 'Change phase and observe the same point'), items: [
        bilingual('เลือกภารกิจ 2 ตั้ง “เฟสเริ่มต้นของสองแหล่ง” เป็น “ตรงข้าม · 180°”', 'Choose mission 2 and set the initial source phase to “Opposite · 180°”.'),
        bilingual('กด “P กลาง” แล้วเปิด “แนวบัพ N (เส้นประสีส้ม)” ในส่วนเส้นช่วยอธิบาย', 'Use “Centre P” and enable “Nodal N (orange dashes)” in the display layers.'),
        bilingual('กด “เล่นคลื่น” แล้วเปรียบเทียบพฤติกรรมที่ P กับภารกิจแรก โดยใช้แนวกลางเดิม', 'Press “Play waves” and compare the motion at the same centre-line point with mission 1.'),
        bilingual('ไปทำ Check-out แล้วเลือกชนิดแนวที่ตรงกับกรณีที่เพิ่งทดลอง', 'Open the check-out and identify the locus in the case you just tested.'),
      ] }],
    },
    {
      id: 'point-paths',
      title: bilingual('3 · เลือก P และอ่านทางเดินคลื่น', '3 · Choose P and read the wave paths'),
      objectives: [
        bilingual('คำนวณขนาดผลต่างทางเดินจากระยะของคลื่นทั้งสองเส้น', 'Calculate the magnitude of the path difference from the two path lengths.'),
        bilingual('ใช้ผลต่างทางเดินร่วมกับเฟสเริ่มต้นเพื่อจำแนกตำแหน่ง P', 'Use path difference and initial phase to classify P.'),
      ],
      parts: [{ id: 'steps', title: bilingual('อ่านค่าของจุดเดียวกัน', 'Read the values for the same point'), items: [
        bilingual('เลือกภารกิจ 3 แล้วเปิด “เส้นทาง r₁/r₂” ให้เห็นเส้นจากแหล่งทั้งสองถึง P', 'Choose mission 3 and show “Paths r₁/r₂” from the two sources to P.'),
        bilingual('ลาก P ออกจากแนวกลาง หรือใช้ปุ่ม “P ตัวอย่าง” ใต้ภาพ', 'Move P away from the centre or use the example-point button below the picture.'),
        bilingual('อ่าน r₁ และ r₂ ในหน่วย cm พร้อมสังเกตความยาวคลื่นและเฟสของกรณีนี้', 'Read r₁ and r₂ in cm and note the wavelength and source phase for this case.'),
        bilingual('เปิด Check-out ใช้ข้อมูลของ P ปัจจุบันทำข้อคำนวณ แล้วเลือกชนิดแนวของ P', 'Open the check-out. Use the current point’s data to calculate and classify P.'),
      ] }],
    },
    {
      id: 'approximations',
      title: bilingual('4 · เทียบค่าจริงกับค่าประมาณ', '4 · Compare the exact and approximate paths'),
      objectives: [
        bilingual('อธิบายเงื่อนไขที่ค่าประมาณจาก sin θ ใช้ได้ดีขึ้น', 'Identify when the sine approximation becomes more accurate.'),
        bilingual('ระบุเงื่อนไขที่ต้องเพิ่มเมื่อประมาณจากระยะบนฉาก x', 'Identify the additional condition for using the screen-offset approximation.'),
      ],
      parts: [{ id: 'steps', title: bilingual('เปรียบเทียบสองกรณี', 'Compare the two cases'), items: [
        bilingual('เลือกภารกิจ 4 แล้วกด “ดูกรณีใกล้ / มุมมาก”', 'Choose mission 4 and select the near / large-angle case.'),
        bilingual('สังเกตภาพทางเดิน มุม และค่าที่แสดง จากนั้นกด “ดูกรณีไกล / มุมเล็ก”', 'Observe the paths, angle and values, then select the far / small-angle case.'),
        bilingual('ใน Check-out ใช้ข้อมูลสองกรณีที่วางคู่กัน ดูว่าค่าประมาณแต่ละแบบใกล้ค่าจริงเพียงใด', 'In the check-out, compare the two cases side by side and look at how close each approximation is to the exact value.'),
        bilingual('ตอบเงื่อนไขของแต่ละวิธีจากสิ่งที่เปรียบเทียบ แล้วกดตรวจ', 'Use the comparison to identify the conditions for each approximation, then check your answers.'),
      ] }],
    },
    {
      id: 'light-trials',
      title: bilingual('5 · วัดแถบแสงชุด A/B/C', '5 · Measure light fringes in A/B/C'),
      objectives: [
        bilingual('ใช้ผลวัด A/B เปรียบเทียบผลของระยะห่างสลิตต่อระยะห่างแถบ', 'Use A/B measurements to compare the effect of slit separation on fringe spacing.'),
        bilingual('ใช้ผลวัด B/C เปรียบเทียบผลของความยาวคลื่นต่อระยะห่างแถบ', 'Use B/C measurements to compare the effect of wavelength on fringe spacing.'),
      ],
      parts: [{ id: 'steps', title: bilingual('เลือกชุด → วัด → บันทึก', 'Choose a set, measure, then record'), items: [
        bilingual('เลือกภารกิจ 5 ในมุมมอง “แสง · วัดแถบ” แล้วเลือกชุด A', 'Choose mission 5 in the Light view and select set A.'),
        bilingual('วางเส้น L และ R ที่ตำแหน่งมืดสองข้างที่ติดกับแถบสว่างกลาง หรือกด “วัดพอดี · แบบจำลอง” เพื่อวางเส้นตามแบบจำลอง', 'Place L and R on the two dark positions next to the central bright fringe, or use “Exact measure · model” to position the markers.'),
        bilingual('กด “บันทึกผลการวัด” แล้วทำซ้ำกับชุด B และ C ตรวจว่าทั้งสามชุดขึ้นเครื่องหมาย ✓', 'Press “Record measurement”, then repeat for B and C. Check that all three sets are ticked.'),
        bilingual('ไปทำ Check-out เทียบ A กับ B และ B กับ C จากบันทึกล่าสุดของแต่ละชุดในแผงข้อมูล', 'Open the check-out and compare A with B, then B with C, using the latest record for each set in the data panel.'),
      ] }],
    },
    {
      id: 'infer-wavelength',
      title: bilingual('6 · คำนวณจากบันทึกที่วัด', '6 · Calculate from a measurement record'),
      objectives: [bilingual('คำนวณความยาวคลื่นจากระยะสลิต ระยะฉาก และระยะห่างแถบที่วัดได้', 'Infer wavelength from slit separation, screen distance and the measured fringe spacing.')],
      parts: [{ id: 'steps', title: bilingual('อ่านบันทึกและจัดหน่วย', 'Read the record and align units'), items: [
        bilingual('เลือกภารกิจ 6 แล้วตรวจว่ามีบันทึกผลการวัด ถ้ายังไม่มี ให้เลือกชุด วางเส้นวัด และกดบันทึกก่อน', 'Choose mission 6 and check that a measurement exists. If needed, select a set, position the markers and record it.'),
        bilingual('เปิด Check-out และอ่านหมายเลขบันทึกล่าสุด รวมทั้ง d, L และ Δx ที่โจทย์ยกมา', 'Open the check-out and read the latest trial number and its d, L and Δx values.'),
        bilingual('เลือกสูตรจากข้อมูลในบันทึก จัดหน่วยให้ตรงกันก่อนแทนค่า แล้วแปลงผลเป็น nm', 'Choose an equation using the recorded quantities, use consistent units and express the result in nm.'),
        bilingual('กรอกตัวเลขในช่องที่กำกับหน่วย nm แล้วกดตรวจ หากเปลี่ยนบันทึกให้กลับมาอ่านข้อมูลโจทย์ชุดใหม่', 'Enter the numerical value in the nm field and check it. If you change the record, read the updated problem data.'),
      ] }],
    },
  ],
  troubleshooting: [
    bilingual('ปุ่มตรวจยังไม่พร้อม ให้ดูรายการที่มีวงกลม ○ แล้วกด “ไปขั้นทดลองถัดไป”', 'If checking is unavailable, find the open-circle item and use “Go to next experiment step”.'),
    bilingual('ปุ่มบันทึกผลการวัดพร้อมเมื่อวางเส้นซ้ายและขวาครบ ลองใช้ปุ่มเลื่อนละเอียดใต้ค่าของแต่ละเส้น', 'Recording becomes available after both markers have been positioned. Use the fine controls below the marker readings.'),
    bilingual('กลับไปดูภาพหรือสูตรด้วยปุ่ม “กลับไปทดลอง” แล้วเปิด Check-out อีกครั้งเมื่อพร้อมตอบ', 'Use “Return to experiment” to revisit the display or formulas, then reopen the check-out when ready.'),
  ],
  finish: bilingual('เมื่อทำ Check-out ครบทั้งหกภารกิจ ลองเลือกย้อนดูภารกิจที่อยากทบทวน และอธิบายด้วยตัวเองว่าปรับอะไร สังเกตอะไร และใช้ข้อมูลไหนตอบ', 'After all six check-outs, revisit any mission and explain what you changed, what you observed and which evidence you used.'),
};
