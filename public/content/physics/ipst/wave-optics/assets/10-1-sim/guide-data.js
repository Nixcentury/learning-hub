// Instructions and learning goals only. Answers and grading stay in missions.js.
const text = (th, en) => ({ th, en });
const sections = [
  { id: 'reflection', title: text('1 · การสะท้อน', '1 · Reflection'), objectives: [
    text('แยกทิศของคลื่นตกกระทบและคลื่นสะท้อนจากภาพผิวน้ำและลูกศรได้', 'Distinguish incident and reflected propagation using the water view and arrows.'),
    text('ระบุเส้นอ้างอิงของมุม และแยกมุมกับผิวออกจากมุมตกกระทบได้', 'Identify the angle reference and distinguish an angle to the surface from an incidence angle.'),
    text('ใช้ข้อมูลที่สังเกตเปรียบเทียบมุมตกกระทบกับมุมสะท้อน และอธิบายความสัมพันธ์ได้', 'Use observations to compare incidence and reflection angles and describe their relationship.'),
  ] },
  { id: 'refraction', title: text('2 · การหักเห', '2 · Refraction'), objectives: [
    text('เปรียบเทียบแนวคลื่นเมื่อเปลี่ยนตัวกลางและมุมตกกระทบได้', 'Compare wave directions when the media or incidence angle change.'),
    text('ตรวจจากข้อมูลว่ามุม อัตราเร็ว ความยาวคลื่น และความถี่ เปลี่ยนหรือคงเดิมอย่างไร', 'Use the data to determine how angle, speed, wavelength and frequency change or remain unchanged.'),
    text('สำรวจเงื่อนไขของมุมวิกฤตและการสะท้อนกลับหมด แล้วใช้ข้อมูลอธิบายกรณีที่เห็นได้', 'Explore the critical angle and total internal reflection, and explain the observed cases using data.'),
  ] },
  { id: 'interference', title: text('3 · การแทรกสอด', '3 · Interference'), objectives: [
    text('เปรียบเทียบผลของเฟสแหล่งกำเนิดจากรอยคลื่น แนวกลาง และกราฟฉากได้', 'Compare the effect of source phase using ripples, the centre line and the screen graph.'),
    text('แยกเส้นหน้าคลื่นออกจากแนวบัพ–ปฏิบัพ และใช้ข้อมูลระบุตำแหน่ง P ได้', 'Distinguish wavefronts from nodal and antinodal loci, and use data to classify P.'),
    text('อ่านระยะทาง r₁, r₂ หาผลต่างทางเดิน และเปรียบเทียบค่าจริงกับสูตรประมาณได้', 'Read r₁ and r₂, find path difference, and compare exact values with approximations.'),
  ] },
  { id: 'diffraction', title: text('4 · การเลี้ยวเบน', '4 · Diffraction'), objectives: [
    text('ออกแบบการเปรียบเทียบโดยเปลี่ยนทีละตัวแปรและระบุค่าที่ตรึงไว้ได้', 'Compare cases by changing one variable and identifying the quantity held fixed.'),
    text('ใช้ภาพและค่ามุมอธิบายผลของความยาวคลื่นและความกว้างช่องต่อการแผ่ได้', 'Use the picture and measured angle to explain how wavelength and aperture width affect spreading.'),
    text('ใช้ความถี่หาความยาวคลื่น และจัดหน่วยให้ตรงกันก่อนหาอัตราส่วน a/λ ได้', 'Find wavelength from frequency and use matching units to calculate a/λ.'),
  ] },
];

const part = (id, th, en, items) => ({ id, title: text(th, en), items: items.map(([a, b]) => text(a, b)) });
const readingParts = {
  reflection: [
    part('mission-1', 'ภารกิจที่ 1 · สำรวจมุม', 'Mission 1 · Explore the angles', [
      ['แตะแท็บ “1 สะท้อน” เปิดโหมดภารกิจ แล้วเริ่มภารกิจที่ 1 ถ้าอยู่ภารกิจนี้อยู่แล้วให้ทำต่อได้เลย', 'Select 1 Reflection, enable Guided mode and start mission 1. Continue if already on that mission.'],
      ['เลื่อนมุมตกกระทบด้วยตัวเองอย่างน้อยหนึ่งครั้ง ดูภาพและค่ามุมใต้ภาพ ให้รายการ “ปรับมุมตกกระทบ” มีเครื่องหมายครบ', 'Move the incidence slider at least once. Compare the picture and angle readouts, and complete the Change incidence observation requirement.'],
      ['ใช้เล่นต่อ/หยุดภาพเมื่อต้องการสังเกต เปิดผิวน้ำ ลูกศรและมุม หรือเส้นหน้าคลื่นเสริมจาก “แสดงบนภาพ” ได้', 'Use Play or Pause to inspect the picture. Show on diagram lets you toggle the water surface, arrows and angles, or wavefront guides.'],
      ['เปิด “ตอบภารกิจ” อ่านโจทย์ทั้งสองช่อง แล้วกรอกหรือเลือกคำตอบจากการสังเกตของตัวเอง หากเห็นช่องตอบแล้วไม่ต้องกดเปิดซ้ำ', 'Open Answer mission, read both questions and enter your own responses. If the fields are already visible, do not toggle them again.'],
      ['กด “ตรวจคำตอบ” และอ่านผล หากยังไม่ผ่าน ให้ดูเงื่อนไขหรือแก้คำตอบแล้วตรวจใหม่ เมื่อผ่านจึงกด “ภารกิจถัดไป” ในหน้าทดลอง', 'Choose Check answers and read the feedback. Complete missing observations or revise responses if needed. Once passed, use Next mission in the experiment.'],
    ]),
    part('mission-2', 'ภารกิจที่ 2 · เปรียบเทียบสองกรณี', 'Mission 2 · Compare the two cases', [
      ['กด “ดูกรณี A” สังเกตมุมในภาพและมุมกับผิว จากนั้นกด “ดูกรณี B” แล้วเทียบกับ A ให้รายการดูทั้งสองกรณีครบ', 'Choose Inspect A and observe the angles and the angle to the surface. Then choose Inspect B and compare. Complete both observation requirements.'],
      ['หยุดปรับมุมก่อนตอบ เพราะโจทย์ใช้มุมปัจจุบัน อ่านให้ชัดว่าถามมุมใดและใช้เส้นใดอ้างอิง', 'Finish adjusting the angle before answering because the question uses the current value. Identify which angle and reference line the question asks about.'],
      ['เปิดช่องตอบถ้ายังไม่เห็น ตอบเองทั้งสองช่อง แล้วกด “ตรวจคำตอบ” หากติดให้อ่านผลตรวจหรือเปิดคำใบ้ในเครื่องมือ', 'Open the answer panel if needed, answer both questions yourself and check. Use the feedback or the activity’s hint if stuck.'],
      ['ดูหัวข้อภารกิจว่าเป็น 2/2 และผลตรวจภารกิจที่ 2 แจ้งว่าผ่าน จึงถือว่าจบส่วนสะท้อน', 'Confirm that the mission heading shows 2/2 and mission 2 feedback reports a pass. This completes the reflection section.'],
    ]),
  ],
  refraction: [
    part('mission-1', 'ภารกิจที่ 1 · เปลี่ยนตัวกลาง', 'Mission 1 · Change the medium', [
      ['แตะแท็บ “2 หักเห” เปิดโหมดภารกิจ แล้วเริ่มภารกิจที่ 1', 'Select 2 Refraction, enable Guided mode and start mission 1.'],
      ['กด “ดูกรณี A” ดูชื่อตัวกลางทั้งสอง แนวคลื่นและลูกศร แล้วกด “ดูกรณี B” เปรียบเทียบภาพและค่าที่แสดง', 'Choose Inspect A and identify both media, wavefronts and arrows. Choose Inspect B and compare the diagram and readouts.'],
      ['ต้องดูทั้ง A/B และอยู่ในกรณีที่มีมุมหักเหจริงก่อนตรวจภารกิจแรก ถ้าปรับค่าเองจนไม่เห็นมุมหักเห ให้กลับกรณี B ก่อนอ่านโจทย์', 'Observe both cases and use one with a real refraction angle before checking mission 1. If your own changes remove the angle, return to B before reading the question.'],
      ['อ่าน n₁, n₂ และมุมจากแถบควบคุม เปิดช่องตอบแล้วคำนวณและเลือกคำตอบเอง ถ้าจะเปลี่ยนค่าทดลองเพิ่ม ให้ทำก่อนเริ่มตอบ เพราะโจทย์เปลี่ยนตามค่าปัจจุบัน', 'Read n₁, n₂ and the incidence angle. Open the answer panel and work out your own responses. Make further experiment changes before answering because the question follows the current settings.'],
      ['ตรวจคำตอบ อ่านผลและแก้ไขจนผ่าน แล้วกด “ภารกิจถัดไป” ในหน้าทดลอง', 'Check, read the feedback and revise until passed. Then use Next mission in the experiment.'],
    ]),
    part('mission-2', 'ภารกิจที่ 2 · สำรวจมุมวิกฤต', 'Mission 2 · Explore the critical angle', [
      ['กด “ดูกรณี A” สังเกตทิศที่รอยต่อกับตัวเลขใต้ภาพ แล้วกด “ดูกรณี B” เปรียบเทียบและอ่านข้อความสถานะ', 'Choose Inspect A and examine the interface and readouts. Then inspect B, compare and read its status.'],
      ['อ่านคำถามทั้งสองข้อให้ครบ ทั้งมุมวิกฤตและกรณีที่โจทย์ถาม ใช้ข้อมูลและคำใบ้ในเครื่องมือประกอบการคิดเอง', 'Read both questions fully, including the critical angle and the specified case. Use the activity’s data and hints to work out your own responses.'],
      ['กรอกหรือเลือกคำตอบ แล้วกดตรวจ หากยังไม่ผ่านให้ดูว่าเงื่อนไขสังเกตครบหรือคำตอบข้อใดต้องแก้', 'Enter your responses and check. If incomplete, inspect the observation requirements and feedback for the response that needs revision.'],
      ['ยืนยันหัวข้อภารกิจเป็น 2/2 และภารกิจที่ 2 ผ่าน ก่อนเปลี่ยนไปส่วนถัดไป', 'Confirm the heading is 2/2 and mission 2 has passed before continuing to the next section.'],
    ]),
  ],
  interference: [
    part('mission-1', 'ภารกิจที่ 1 · เปรียบเทียบเฟสแหล่งกำเนิด', 'Mission 1 · Compare source phase', [
      ['แตะแท็บ “3 แทรกสอด” เปิดโหมดภารกิจ แล้วเริ่มภารกิจที่ 1', 'Select 3 Interference, enable Guided mode and start mission 1.'],
      ['กด “ดูกรณี A” สังเกตเฟส P บนแนวกลาง และรอยคลื่น จากนั้นกด “ดูกรณี B” เพื่อเทียบที่ตำแหน่งเดิม', 'Choose Inspect A and observe phase, P on the centre line and the ripples. Then choose Inspect B to compare at the same position.'],
      ['เลื่อนลงดูกราฟฉาก หากไม่เห็นให้เปิด “กราฟฉาก I(y)” อย่าตัดสินชนิดของจุดจากสีหรือการกระจัดเป็นศูนย์เพียงชั่วขณะ', 'Scroll to the screen graph. Enable Screen I(y) if hidden. Do not classify a point from colour or a momentary zero displacement alone.'],
      ['เปิดช่องตอบ อ่านคำถามของทั้งสองกรณี แล้วเลือกคำตอบเอง ตรวจและอ่านผลจนผ่าน จากนั้นกด “ภารกิจถัดไป”', 'Open the answer panel, read the questions about both cases and make your own choices. Check and revise until passed, then choose Next mission.'],
    ]),
    part('mission-2', 'ภารกิจที่ 2 · สำรวจจุด P และระยะทาง', 'Mission 2 · Explore P and path distances', [
      ['ดูกรณี A แล้วกด “ดูกรณี B” เพื่อใช้ตัวอย่าง P ด้านข้าง ภารกิจนี้ต้องใช้จุดด้านข้างหรือจุดที่เลื่อนเอง ไม่ค้างที่ตัวเลือกแนวกลาง', 'Inspect A, then choose Inspect B for the side example. This mission requires the side example or a custom point rather than the centre-line preset.'],
      ['เปิด “เส้นทาง r₁/r₂” ให้มีเครื่องหมาย ดูเส้นจากแหล่งกำเนิดทั้งสองถึง P และตรวจรายการเงื่อนไข', 'Enable Paths r₁/r₂. Follow the paths from both sources to P and check the observation requirements.'],
      ['หากอยากสำรวจเพิ่ม ลาก P หรือใช้แถบตำแหน่งและระยะฉาก L แล้วหยุดที่จุดที่จะตอบ อ่าน r₁, r₂ และเฟสปัจจุบันใหม่ เพราะโจทย์และผลตรวจตาม P ที่เปลี่ยน', 'Optionally drag P or use the position and screen-distance controls. Stop at the point you will answer for. Re-read r₁, r₂ and phase because the questions and grading follow the current P.'],
      ['เปิดช่องตอบ หาผลต่างทางเดินและเลือกชนิดของจุดเอง ตรวจหน่วยก่อนกรอก แล้วกดตรวจและอ่านผล', 'Open the answer panel, work out path difference and classify the point yourself. Check units before entering a number, then check and read the feedback.'],
      ['เมื่อหัวข้อภารกิจเป็น 2/2 และภารกิจที่ 2 ผ่านแล้ว จึงจบส่วนแทรกสอด', 'The interference section is complete when the heading shows 2/2 and mission 2 has passed.'],
    ]),
  ],
  diffraction: [
    part('mission-1', 'ภารกิจที่ 1 · เปลี่ยนความยาวคลื่น', 'Mission 1 · Change wavelength', [
      ['แตะแท็บ “4 เลี้ยวเบน” เปิดโหมดภารกิจ แล้วเริ่มภารกิจที่ 1 ดูว่าตัวเลือกการเปรียบเทียบกำลังเปลี่ยน λ และตรึงช่องเปิดไว้', 'Select 4 Diffraction, enable Guided mode and start mission 1. Check that the comparison changes λ while holding the opening fixed.'],
      ['กด “ดูกรณี A” แล้ว “ดูกรณี B” เปรียบเทียบภาพแผ่และค่ามุม จดค่าที่เปลี่ยนกับค่าที่ตรึงไว้', 'Inspect A and then B. Compare the spreading picture and angle, and record the changed and fixed quantities.'],
      ['เปิดช่องตอบ ตอบแนวโน้มจากสิ่งที่สังเกตเอง ส่วนคำนวณให้อ่านความถี่ปัจจุบันและหน่วยที่โจทย์ต้องการ', 'Open the answer panel and answer the trend question from your observations. For the calculation, read the current frequency and requested units.'],
      ['ตรวจคำตอบและแก้ไขตามผลจนผ่าน แล้วกด “ภารกิจถัดไป” ในหน้าทดลอง', 'Check and revise using the feedback until passed. Then use Next mission in the experiment.'],
    ]),
    part('mission-2', 'ภารกิจที่ 2 · เปลี่ยนช่องเปิด', 'Mission 2 · Change the opening', [
      ['ตรวจตัวเลือกการเปรียบเทียบอีกครั้ง ภารกิจนี้เปลี่ยนช่องเปิดและตรึง λ สไลเดอร์สีจางคือค่าที่ตรึงไว้', 'Check the comparison again. This mission changes the opening at fixed λ. The dimmed slider is the quantity held fixed.'],
      ['ดูกรณี A แล้ว B เทียบช่องเปิด ภาพแผ่ และค่ามุม โดยแยกจากการเปรียบเทียบในภารกิจแรก', 'Inspect A and B. Compare the opening, spreading and angle separately from the comparison in mission 1.'],
      ['อ่าน a และ λ ของค่าปัจจุบัน ตรวจหน่วยทั้งสองก่อนคิดอัตราส่วน แล้วตอบทั้งสองช่องด้วยตัวเอง', 'Read the current a and λ and check both units before calculating their ratio. Answer both questions yourself.'],
      ['กดตรวจและอ่านผลจนผ่าน ยืนยันหัวข้อภารกิจเป็น 2/2 จึงจบส่วนเลี้ยวเบน', 'Check and read the feedback until passed. Confirm the heading is 2/2 to finish the diffraction section.'],
    ]),
  ],
};

export const waveMiniPlayGuide = Object.freeze({ schemaVersion: 1, format: 'reading',
  contentId: 'physics-ipst-wave-optics-10-1-mini-sim',
  source: 'content/physics/ipst/wave-optics/10-1-wave-properties-mini-sim.html',
  title: text('10.1 · คู่มือฉบับอ่านครบ 4 โหมด', '10.1 · Reading guide to all four modes'),
  introduction: text('เลื่อนอ่านได้ทั้งฉบับ หรือใช้สารบัญข้ามหัวข้อ แล้วทำตามในหน้าทดลองที่เปิดคู่กัน คู่มือนี้บอกลำดับและจุดที่ควรสังเกต โดยให้คุณคิดและตอบคำถามเอง', 'Scroll through the whole guide or use the contents to jump to a section. Follow along in the experiment beside it. The guide describes the sequence and observations; you work out and enter your own answers.'),
  gettingStarted: [
    text('อ่านจุดประสงค์ของส่วนที่จะทำ แล้วเลือกแท็บโหมดนั้นในหน้าทดลอง', 'Read the section’s learning objectives, then select that mode’s tab in the experiment.'),
    text('เปิด “โหมดภารกิจ” เพื่อเห็นรายการ เงื่อนไข และช่องตอบ แต่ละโหมดมี 2 ภารกิจ', 'Enable Guided mode to see the selector, requirements and answer panel. Each mode has two missions.'),
    text('การเลือกภารกิจใหม่จะตั้งค่าทดลองและล้างช่องตอบของข้อนั้น ถ้าอยู่ภารกิจที่ต้องการแล้วให้ทำต่อได้เลย', 'Selecting a mission resets its experiment settings and answer fields. If already on the intended mission, continue without reselecting it.'),
    text('กด “ตอบภารกิจ” เฉพาะเมื่อยังไม่เห็นช่องตอบ ปุ่มเดียวกันใช้ซ่อนช่องตอบได้ด้วย', 'Use Answer mission only when its fields are hidden; the same toggle also hides them.'),
    text('ปุ่ม “ภารกิจถัดไป” ที่ต้องใช้ อยู่ในหน้าทดลอง หลังตรวจภารกิจแรกผ่านแล้ว', 'The Next mission button you need is in the experiment, after mission 1 has passed.'),
  ],
  sections: sections.map(section => ({ ...section, parts: readingParts[section.id] })),
  troubleshooting: [
    text('ตรวจแล้วยังไม่ผ่าน: อ่านผลใต้ช่องตอบและเช็กรายการสังเกต ถ้าต้องดู A/B ให้ดูครบ ถ้าต้องเปิดเส้นประกอบให้เปิดก่อน แล้วแก้คำตอบและตรวจอีกครั้ง', 'Not passing: read feedback and the observation checklist. Complete A/B or required overlays when requested, revise responses and check again.'),
    text('สไลเดอร์ปรับไม่ได้: ดูตัวเลือกการเปรียบเทียบ สไลเดอร์สีจางเป็นค่าที่ตรึงไว้ ไม่ต้องพยายามลากซ้ำ', 'A slider will not move: check the comparison selector. A dimmed slider is held fixed; repeatedly dragging it will not change it.'),
    text('ไม่เห็นภารกิจหรือช่องตอบ: เปิดโหมดภารกิจ แล้วเปิดตอบภารกิจ หากเลื่อนจอไปไกลให้เลื่อนกลับไปที่กรอบภารกิจ', 'Missing missions or answer fields: enable Guided mode and open Answer mission. Scroll back to the mission panel if needed.'),
    text('ปุ่มภารกิจถัดไปยังจาง: ตรวจภารกิจแรกให้ผ่านก่อน ถ้าอยู่ภารกิจที่ 2 แล้วให้ทำข้อนั้นต่อได้ ไม่ต้องกดถัดไป', 'Next mission is dimmed: pass mission 1 first. If already in mission 2, continue with it; no further Next mission press is needed.'),
  ],
  finish: text('ตรวจแต่ละโหมดให้หัวข้อภารกิจเป็น 2/2 และผลตรวจข้อสุดท้ายแจ้งว่าผ่าน ครบทั้ง 4 โหมดจึงครบ 8 ภารกิจ การอ่านคู่มืออย่างเดียวไม่ใช่การทำภารกิจ', 'Confirm each mode shows 2/2 and its final feedback reports a pass. All four modes total eight missions. Reading the guide alone does not complete them.'),
});
