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

const textItems=(items)=>items.map(([th,en])=>text(th,en));
const topics={
 reflection:[
  ['สำรวจทิศคลื่น เส้นอ้างอิง และมุมจากภาพทดลอง แล้วเปิดคำถามภารกิจที่ 1','Explore wave directions, reference lines and angles, then open mission 1 questions.'],
  ['อ่านกรณี A/B และเปรียบเทียบสิ่งที่เห็น ก่อนทำภารกิจที่ 2','Inspect A/B and compare your observations before mission 2.'],
  ['ข้อ 3 ใช้มุมกับผิวที่โจทย์กำหนด คำนวณมุมสองช่องโดยอ่านชื่อมุมให้ชัด','Question 3 uses the stated angle to the surface. Calculate both requested angles, reading each angle name carefully.'],
  ['ข้อ 6 อ่านมุมเริ่มต้นกับการเปลี่ยนมุม แล้วคำนวณมุมใหม่ทั้งสองช่อง','For question 6, read the initial angle and its change, then calculate both new requested angles.']
 ],
 refraction:[
  ['เปรียบเทียบตัวกลางและแนวคลื่นในกรณี A/B ก่อนเปิดคำถามภารกิจที่ 1','Compare the media and wave directions in A/B before opening mission 1.'],
  ['สำรวจกรณีต่าง ๆ ที่รอยต่อ แล้วเตรียมตอบเงื่อนไขและเหตุผลในภารกิจที่ 2','Explore the interface cases, then answer the conditions and reasons in mission 2.'],
  ['ข้อ 3 อ่าน n₁, n₂, มุม และ λ₀ ของโจทย์ คำนวณมุม อัตราเร็ว และความยาวคลื่นตามหน่วยข้างช่อง อัตราเร็วกรอกเฉพาะตัวคูณของ 10⁸','For question 3, read the stated n₁, n₂, angle and λ₀. Calculate angle, speed and wavelength in the displayed units. For speed, enter only the coefficient of 10⁸.'],
  ['ข้อ 6 คำนวณอัตราส่วนที่โจทย์ถามก่อนหามุมวิกฤต ปัดตัวเลขตามคำสั่งของแต่ละช่อง','For question 6, calculate the requested ratio and critical angle. Follow the rounding instruction for each field.']
 ],
 interference:[
  ['สังเกตรอยคลื่น จุด P และกราฟจากกรณี A/B ก่อนตอบภารกิจที่ 1','Observe ripples, P and the graph for A/B before mission 1.'],
  ['สำรวจเฟสและตำแหน่ง P ใช้เส้นประกอบตามต้องการ ก่อนตอบสถานการณ์ของภารกิจที่ 2','Explore source phase and P using any useful overlays before answering the situations in mission 2.'],
  ['ข้อ 3 ใช้ r₁, r₂ และ λ ที่เขียนในโจทย์ กรอกผลต่างทางเดินและอัตราส่วน อย่าแทนด้วยค่าที่กำลังลากอยู่ในภาพ','Question 3 uses its stated r₁, r₂ and λ. Enter the path difference and ratio; do not substitute the currently dragged probe values.'],
  ['ข้อ 6 อ่านเฟส เงื่อนไข และลำดับ m ให้ครบ แล้วกรอกความยาวคลื่นกับผลต่างทางเดินที่ถาม','For question 6, read the phase, condition and order m fully, then enter the requested wavelength and path difference.']
 ],
 diffraction:[
  ['สำรวจการเปรียบเทียบในกรณี A/B แล้วเปิดคำถามภารกิจที่ 1','Explore the A/B comparison, then open mission 1 questions.'],
  ['ลองการเปรียบเทียบอีกแบบและดูภาพแผ่ ก่อนทำภารกิจที่ 2','Try the other comparison and inspect spreading before mission 2.'],
  ['ข้อ 3 ใช้ความถี่และอัตราเร็วที่โจทย์ให้ คำนวณความยาวคลื่นแล้วกรอกให้ครบสองหน่วย','For question 3, use the stated frequency and speed to find wavelength and enter it in both requested units.'],
  ['ข้อ 6 อ่าน a และ λ ในโจทย์ แปลงหน่วยและคำนวณอัตราส่วนตามช่องที่กำหนด','For question 6, read the stated a and λ, then perform the requested unit conversion and ratio calculation.']
 ]
};
function partsFor(id){const topic=topics[id];return [
 {id:'mission-1',title:text('ภารกิจที่ 1 · ข้อ 1–3','Mission 1 · Questions 1–3'),items:textItems([
 topic[0],
 ['ข้อ 1 และ 2 วัดความเข้าใจ ตอบดรอปดาวน์ทุกข้อย่อยจากหลักการที่เรียนและสิ่งที่สังเกต','Questions 1 and 2 assess understanding. Complete every dropdown subpart using what you learned and observed.'],
 topic[2],
 ['กดตรวจคำตอบ อ่านผลแต่ละช่องและคะแนน แล้วแก้ไขได้ตามต้องการ เมื่อตอบและตรวจครบ 3 ข้อ ปุ่มภารกิจถัดไปจะใช้ได้ แม้ยังมีคำตอบที่ต้องกลับมาแก้','Check answers, read each field’s feedback and score, and revise as needed. After all three questions have been answered and checked, Next mission becomes available even if some responses still need revision.']
 ])},
 {id:'mission-2',title:text('ภารกิจที่ 2 · ข้อ 4–6','Mission 2 · Questions 4–6'),items:textItems([
 topic[1],
 ['ข้อ 4 และ 5 วัดความเข้าใจและการคาดการณ์ มีดรอปดาวน์แยกข้อย่อย ให้อ่านทุกส่วนก่อนเลือก','Questions 4 and 5 assess understanding and prediction, with separate dropdown subparts. Read all parts before choosing.'],
 topic[3],
 ['ตรวจครบทั้ง 3 ข้อแล้วดูจำนวนข้อที่ตรวจ คะแนนล่าสุด และคะแนนดีที่สุด แก้เฉพาะช่องที่ต้องการแล้วตรวจซ้ำได้','After checking all three questions, review the checked count, latest score and best score. Revise individual fields and check again.']
 ])}
 ];}
export const waveMiniPlayGuide=Object.freeze({schemaVersion:1,format:'reading',
 contentId:'physics-ipst-wave-optics-10-1-mini-sim',source:'content/physics/ipst/wave-optics/10-1-wave-properties-mini-sim.html',
 title:text('10.1 · คู่มือทำกิจกรรมและคำถาม 4 โหมด','10.1 · Reading guide to four modes and their questions'),
 introduction:text('เลื่อนอ่านหรือใช้สารบัญ แล้วทำตามในหน้าทดลอง คู่มือนี้บอกเฉพาะสิ่งที่ต้องทำ ไม่บอกตัวเลือกที่ถูกหรือค่าคำตอบ แต่ละโหมดมีความเข้าใจ 4 ข้อแบบดรอปดาวน์ และคำนวณ 2 ข้อแบบตัวเลข ทั้งสองแบบมีข้อย่อย','Scroll or use the contents, then follow along in the experiment. This guide describes what to do without giving correct choices or numerical answers. Each mode has four understanding questions with dropdowns and two numerical calculations, both with subparts.'),
 gettingStarted:textItems([
 ['อ่านจุดประสงค์และเลือกแท็บโหมดที่จะทำ เปิดโหมดภารกิจเมื่อต้องการเริ่มตอบ','Read the objectives, select a mode and enable Guided mode when ready to answer.'],
 ['แต่ละโหมดแบ่งเป็น 2 ภารกิจ ภารกิจละ 3 ข้อหลัก มีความเข้าใจ 2 ข้อและคำนวณ 1 ข้อ','Each mode has two missions, each with three main questions: two understanding questions and one calculation.'],
 ['สำรวจภาพและ A/B ได้ก่อนตอบ เปิดคำถามแล้วใช้ข้อมูลที่เขียนในแต่ละข้อ โจทย์คำนวณแยกจากค่าที่กำลังลากทดลอง','Explore the picture and A/B first. Once questions are open, use their stated data. Calculation problems are independent of the exploration sliders.'],
 ['การสลับภารกิจ ภาษา หรือกรณีทดลองไม่ล้างช่องตอบ การเริ่มภาพทดลองใหม่ยังเก็บคำตอบและคะแนนฝึกไว้','Switching missions, language or exploration cases retains responses. Reset exploration also retains responses and practice scores.'],
 ['ความเข้าใจข้อละ 1 คะแนน คำนวณข้อละ 3 คะแนน แบ่งตามข้อย่อย รวมโหมดละ 10 และทั้งหมด 40 คะแนน','Each understanding question is worth 1 point and each calculation 3, divided among its subparts: 10 points per mode, 40 overall.'],
 ['ดูสถานะการบันทึกด้านบน ผู้เยี่ยมชมเก็บในเครื่อง ส่วนผู้ลงชื่อเข้าใช้ซิงก์คะแนนฝึกกับบัญชีเมื่อเชื่อมต่อได้ คะแนนฝึกนี้แยกจากการส่งงาน Classroom','Read the storage status above. Guests retain work on this device; signed-in learners sync practice work to their account when connected. Practice scores are separate from Classroom submissions.']
 ]),
 sections:sections.map(s=>({...s,parts:partsFor(s.id)})),
 troubleshooting:textItems([
 ['ยังมีช่องไม่ถูก: อ่านข้อมูล หน่วย และแนวทางของข้อนั้น แล้วแก้เฉพาะช่องที่ต้องการ ผลตรวจจะไม่กรอกหรือแสดงเฉลยให้','Some fields are not correct: review the data, units and approach, then edit the relevant fields. Feedback does not fill or display correct answers.'],
 ['ปุ่มภารกิจถัดไปยังไม่พร้อม: ตอบทุกข้อย่อยของ 3 ข้อในภารกิจแรก แล้วกดตรวจ ไม่จำเป็นต้องได้เต็มก่อนทำส่วนถัดไป','Next mission is unavailable: complete every subpart of the first mission’s three questions and check. Full marks are not required to continue.'],
 ['กรอกตัวเลข: ใช้จุดทศนิยมและไม่ต้องพิมพ์หน่วย ดูตัวคูณและจำนวนตำแหน่งที่โจทย์กำหนด','Numeric entry: use a decimal point without typing units. Check any coefficient and requested precision.'],
 ['ยังไม่ซิงก์บัญชี: งานยังมีสำรองในเครื่องตามสถานะที่แจ้ง เมื่อกลับมาเชื่อมต่อระบบจะลองซิงก์อีกครั้ง ถ้าบันทึกในเครื่องไม่ได้อย่าเพิ่งปิดหน้า','Account sync pending: work remains backed up locally as indicated. Sync is retried when connectivity returns. If local saving fails, keep the page open.']
 ]),
 finish:text('ตรวจให้ครบ 6 ข้อต่อโหมด รวม 24 ข้อหลัก ดูคะแนนล่าสุดและคะแนนฝึกดีที่สุดควบคู่กัน จำนวนข้อที่ตรวจไม่ใช่จำนวนข้อที่ถูก แก้ตอบและตรวจซ้ำได้ คะแนนดีที่สุดยังเก็บอยู่','Check all six main questions in each mode, 24 overall. Review latest and best practice scores together. A checked question is not necessarily correct. You can revise and recheck while retaining your best score.')
});
