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

// Each observation is a real control in the authored simulation. Case values and
// correct choices are deliberately absent; learners must inspect and answer.
const observations = {
  reflection: [
    [
      ['angle', 'param-angle', 'ลองเปลี่ยนมุม', 'Change the incidence angle',
        'เลื่อนสไลเดอร์มุมตกกระทบด้วยตัวเองอย่างน้อยหนึ่งครั้ง แล้วดูภาพกับค่ามุมใต้ภาพ ให้รายการ “ปรับมุมตกกระทบ” มีเครื่องหมายครบก่อนตอบ',
        'Move the incidence slider at least once. Compare the diagram and angle readouts. Complete the Change incidence observation requirement before answering.'],
      ['picture', 'play', 'ดูภาพเคลื่อนไหวและเส้นประกอบ', 'Inspect motion and overlays',
        'กดเล่นต่อหรือหยุดภาพเมื่อต้องการอ่านมุม ใช้ช่อง “แสดงบนภาพ” เปิดผิวน้ำ ลูกศรและมุม หรือเส้นหน้าคลื่นเสริม แล้วแยกทิศคลื่นทั้งสองชุด',
        'Use Play or Pause to inspect the angles. In Show on diagram, toggle the water surface, arrows and angles, or wavefront guides to distinguish the two wave directions.'],
    ],
    [
      ['a', 'mission-a', 'ดูกรณี A ของภารกิจที่ 2', 'Inspect case A of mission 2',
        'กด “ดูกรณี A” แล้วสังเกตมุมในภาพและมุมกับผิว จดสิ่งที่เห็นก่อนเปลี่ยนกรณี',
        'Choose Inspect A. Observe the angles and the angle to the surface. Record what you see before switching cases.'],
      ['b', 'mission-b', 'ดูกรณี B แล้วเปรียบเทียบ', 'Inspect B and compare',
        'กด “ดูกรณี B” แล้วเทียบกับ A ตรวจว่ารายการดู A และ B ครบทั้งคู่ คำถามใช้มุมปัจจุบัน จึงควรหยุดปรับค่าก่อนตอบ',
        'Choose Inspect B and compare with A. Check that both observation requirements are complete. The question uses the current angle, so finish adjusting it before answering.'],
    ],
  ],
  refraction: [
    [
      ['a', 'mission-a', 'เริ่มจากกรณี A', 'Start with case A',
        'กด “ดูกรณี A” ตรวจชื่อตัวกลางทั้งสอง ดูแนวคลื่นและลูกศร จดค่าที่ต้องนำไปเปรียบเทียบ',
        'Choose Inspect A. Identify both media and observe wavefronts and arrows. Record the quantities you will compare.'],
      ['b', 'mission-b', 'เปลี่ยนเป็นกรณี B', 'Switch to case B',
        'กด “ดูกรณี B” แล้วเทียบภาพและตัวเลขกับ A ต้องดูทั้งสองกรณี และอยู่ในกรณีที่มีมุมหักเหจริงก่อนตอบภารกิจแรก',
        'Choose Inspect B and compare the diagram and numbers with A. Observe both cases and use one with a real refraction angle before answering mission 1.'],
      ['read', 'readouts', 'อ่านข้อมูลก่อนคำนวณ', 'Read the data before calculating',
        'อ่าน n₁, n₂ และมุมจากแถบควบคุม พร้อมดูตัวเลขใต้ภาพ ถ้าจะลองปรับตัวกลางหรือมุมเพิ่ม ให้ทำก่อนเริ่มตอบ เพราะโจทย์เปลี่ยนตามค่าปัจจุบัน',
        'Read n₁, n₂ and the incidence angle from the controls, and inspect the readouts. Make any further changes before answering because the question follows the current settings.'],
    ],
    [
      ['a', 'mission-a', 'สำรวจกรณี A ของภารกิจที่ 2', 'Explore case A of mission 2',
        'กด “ดูกรณี A” ตรวจทิศผ่านรอยต่อและตัวเลขใต้ภาพ สังเกตว่าข้อมูลส่วนใดต้องใช้เมื่อเปรียบเทียบกับอีกกรณี',
        'Choose Inspect A. Examine propagation at the interface and the readouts. Identify the data needed for comparison.'],
      ['b', 'mission-b', 'ดูกรณี B และข้อความสถานะ', 'Inspect B and its status',
        'กด “ดูกรณี B” อ่านสถานะใต้ภาพ เทียบกับ A แล้วกลับไปอ่านคำถามของภารกิจที่ 2 ให้ครบทั้งสองช่อง',
        'Choose Inspect B. Read its status, compare with A, then read both questions for mission 2.'],
    ],
  ],
  interference: [
    [
      ['a', 'mission-a', 'ดูกรณี A ที่แนวกลาง', 'Inspect A at the centre line',
        'กด “ดูกรณี A” ดูค่าเฟส จุด P บนแนวกลาง และกราฟฉาก จดผลที่เห็นไว้สำหรับเทียบอีกกรณี',
        'Choose Inspect A. Observe the source phase, P on the centre line and the screen graph. Record the result for comparison.'],
      ['b', 'mission-b', 'ดูกรณี B ที่ตำแหน่งเดิม', 'Inspect B at the same position',
        'กด “ดูกรณี B” เปรียบเทียบรอยคลื่น P และกราฟกับ A อย่าตัดสินจากสีหรือการกระจัดที่เป็นศูนย์เพียงชั่วขณะ',
        'Choose Inspect B. Compare the ripples, P and graph with A. Do not classify a point from colour or a momentary zero displacement alone.'],
      ['graph', 'mini-screen', 'เทียบภาพคลื่นกับกราฟฉาก', 'Connect ripples with the screen graph',
        'เลื่อนลงดูกราฟฉาก ถ้าไม่เห็นให้เปิด “กราฟฉาก I(y)” ในแสดงบนภาพ สังเกตตำแหน่งเดียวกันในภาพคลื่นและกราฟก่อนตอบทั้งสองกรณี',
        'Scroll to the screen graph. If hidden, enable Screen I(y) in Show on diagram. Compare the same position in the ripple view and graph before answering for both cases.'],
    ],
    [
      ['a', 'mission-a', 'ดูกรณี A ของภารกิจที่ 2', 'Inspect A of mission 2',
        'กด “ดูกรณี A” เพื่อสังเกตจุดตั้งต้น แล้วตรวจตำแหน่ง P กับระยะทางที่แสดง',
        'Choose Inspect A to inspect the starting point. Locate P and the displayed path distances.'],
      ['b', 'mission-b', 'เลือกตัวอย่าง P ด้านข้าง', 'Select the side example for P',
        'กด “ดูกรณี B” เพื่อเลือกตัวอย่าง P ด้านข้าง ภารกิจนี้ต้องเลือกจุดด้านข้างหรือเลื่อน P เอง ไม่ค้างที่ตัวเลือกแนวกลาง',
        'Choose Inspect B for a side example. This mission requires the side example or a custom P, rather than the centre-line preset.'],
      ['paths', 'layer-paths', 'เปิดเส้นทางที่ภารกิจต้องใช้', 'Show the required paths',
        'เปิด “เส้นทาง r₁/r₂” ให้มีเครื่องหมาย แล้วดูเส้นจากแหล่งกำเนิดถึง P ตรวจรายการเงื่อนไขก่อนเริ่มตอบ',
        'Enable Paths r₁/r₂. Follow each path from its source to P and check the observation requirements before answering.'],
      ['probe', 'mini-probe', 'ลองเลื่อน P แล้วหยุดที่จุดที่จะตอบ', 'Explore P, then choose your answer position',
        'ถ้าต้องการสำรวจเพิ่ม ลากปุ่ม P หรือใช้แถบตำแหน่ง P และระยะฉาก L แล้วหยุดที่จุดที่จะใช้ตอบ อ่าน r₁, r₂ และเฟสปัจจุบันใหม่ เพราะคำถามและผลตรวจจะตาม P ที่เปลี่ยนไป',
        'Optionally drag P or use the probe and screen-distance controls. Stop at the position you will answer for. Re-read r₁, r₂ and source phase; the questions and grading follow the current P.'],
    ],
  ],
  diffraction: [
    [
      ['lock', 'param-compare', 'ตรวจว่ากำลังเปลี่ยนตัวแปรใด', 'Check the variable being changed',
        'ภารกิจแรกเปรียบเทียบความยาวคลื่น โดยตรึงช่องเปิดไว้ ดูตัวเลือกการเปรียบเทียบและสไลเดอร์สีจาง สไลเดอร์ที่ตรึงไว้ปรับไม่ได้จนกว่าจะเปลี่ยนการเปรียบเทียบ',
        'Mission 1 compares wavelength at a fixed opening. Check the comparison selector and dimmed slider. A held slider cannot be moved until the comparison changes.'],
      ['a', 'mission-a', 'สังเกตกรณี A', 'Observe case A',
        'กด “ดูกรณี A” สังเกตรูปแผ่และมุมใต้ภาพ จดค่าที่ตรึงไว้กับค่าที่เปลี่ยน',
        'Choose Inspect A. Observe spreading and the angle readout. Record the fixed and changed quantities.'],
      ['b', 'mission-b', 'สังเกตกรณี B แล้วเปรียบเทียบ', 'Observe B and compare',
        'กด “ดูกรณี B” เทียบภาพและมุมกับ A ก่อนตอบแนวโน้ม ส่วนคำถามคำนวณใช้ความถี่ปัจจุบัน อ่านหน่วยที่โจทย์กำหนดก่อนกรอก',
        'Choose Inspect B. Compare the picture and angle with A before answering the trend question. The calculation uses the current frequency; check the requested units before entering it.'],
    ],
    [
      ['lock', 'param-compare', 'ตรวจการเปรียบเทียบช่องเปิด', 'Check the aperture comparison',
        'ภารกิจที่ 2 เปลี่ยนช่องเปิดและตรึงความยาวคลื่น ดูตัวเลือกกับสไลเดอร์อีกครั้ง อย่าใช้เงื่อนไขของภารกิจแรกปะปนกัน',
        'Mission 2 changes the opening at a fixed wavelength. Check the selector and sliders again. Keep this comparison separate from mission 1.'],
      ['a', 'mission-a', 'ดูช่องเปิดกรณี A', 'Inspect opening A',
        'กด “ดูกรณี A” สังเกตช่องเปิด ภาพแผ่และค่ามุม บันทึกสิ่งที่เห็นก่อนเปลี่ยนกรณี',
        'Choose Inspect A. Observe the opening, spreading and angle. Record what you see before changing cases.'],
      ['b', 'mission-b', 'ดูกรณี B และอ่านหน่วย', 'Inspect B and check units',
        'กด “ดูกรณี B” เปรียบเทียบกับ A แล้วอ่าน a และ λ ของค่าปัจจุบัน ตรวจหน่วยทั้งสองก่อนทำคำถามอัตราส่วน',
        'Choose Inspect B and compare with A. Read the current a and λ and check both units before answering the ratio question.'],
    ],
  ],
};

function makeStep(section, suffix, key, titleTh, titleEn, instructionTh, instructionEn, blocked) {
  return { id: `${section}-${suffix}`, sectionId: section, title: text(titleTh, titleEn),
    instruction: text(instructionTh, instructionEn), target: { scope: 'simulation', key },
    blocked: blocked || text('กลับไปเลือกโหมดและภารกิจตามขั้นก่อนหน้า แล้วเปิดโหมดภารกิจหรือช่องตอบให้มองเห็นก่อน', 'Select the mode and mission described earlier, then enable Guided mode or open the answer panel so this control is visible.') };
}
function stepsFor(section) {
  const id = section.id, step = (...args) => makeStep(id, ...args);
  const answering = number => [
    step(`answer-${number}-open`, 'mission-answer-toggle', 'เปิดช่องตอบภารกิจ', 'Open the mission answers',
      `เมื่อสังเกตครบแล้ว กด “ตอบภารกิจ” เพื่อเปิดช่องของภารกิจที่ ${number} ถ้าเห็นช่องตอบอยู่แล้วไม่ต้องกดซ้ำ เพราะปุ่มนี้ใช้ซ่อนช่องตอบด้วย`,
      `After observing, use Answer mission to open mission ${number}. If its fields are already visible, leave the toggle alone; pressing it again hides them.`),
    step(`answer-${number}-fill`, 'mission-questions', 'ตอบจากการสังเกตด้วยตัวเอง', 'Answer from your observations',
      'อ่านโจทย์และหน่วยในแต่ละช่อง กรอกตัวเลขหรือเลือกคำตอบจากสิ่งที่สังเกตเอง ถ้าติดให้เปิด “คำใบ้” ในเครื่องมือ คู่มือนี้จะไม่กรอกหรือเลือกคำตอบให้',
      'Read each question and its units. Enter your own number or choice from your observations. If stuck, open the activity’s Hint. This guide does not fill or select answers.'),
    step(`answer-${number}-check`, 'mission-check', 'ตรวจคำตอบและอ่านผล', 'Check and read the feedback',
      'กด “ตรวจคำตอบ” แล้วอ่านข้อความใต้ช่องตอบ ถ้ายังไม่ผ่าน ให้เช็กรายการสังเกตด้านบนและแก้คำตอบก่อนตรวจอีกครั้ง การกดถัดไปในคู่มือไม่ได้ทำให้ภารกิจผ่าน',
      'Choose Check answers and read the feedback. If incomplete, check the observation requirements and revise your responses before checking again. Next in this guide does not pass the mission.'),
  ];
  return [
    step('mode', `tab-${id}`, `เลือกโหมด ${section.title.th}`, `Select ${section.title.en}`,
      `แตะแท็บ “${section.title.th.replace(' · การ', ' ')}” ใน simulation คู่มือส่วนนี้ใช้ภารกิจของโหมดนี้ คุณเป็นผู้กดและทดลองเองทุกขั้น`,
      `Select the ${section.title.en.replace(' · ', ' ')} tab in the simulation. This section follows that mode’s missions. You operate the activity yourself.`),
    step('goals', 'learning-objectives', 'เริ่มจากเป้าหมายของโหมดนี้', 'Read this mode’s learning goals',
      'อ่าน “จุดประสงค์การเรียนรู้” เหนือภารกิจ เพื่อรู้ว่าจบส่วนนี้ควรทำอะไรได้ เปิดหรือพับกรอบได้ตามพื้นที่หน้าจอ',
      'Read Learning objectives above the missions to see what you should be able to do. Expand or collapse the panel to suit your screen.'),
    step('guided', 'mission-enabled', 'เปิดโหมดภารกิจ', 'Enable Guided mode',
      'ตรวจว่า “โหมดภารกิจ” มีเครื่องหมาย ถ้าไม่มีให้แตะเปิด เพื่อเห็นรายการภารกิจ เงื่อนไขสังเกต และช่องตอบ',
      'Make sure Guided mode is checked. Enable it if needed to see the mission selector, observation requirements and answer controls.'),
    step('mission-1', 'mission-select', 'เริ่มภารกิจที่ 1', 'Start mission 1',
      'ดูรายการภารกิจแล้วเลือกข้อที่ 1 หากอยู่ข้อนี้อยู่แล้วให้ทำต่อได้ การเลือกภารกิจใหม่จะตั้งค่าทดลองและล้างช่องตอบของข้อนั้น จึงไม่ควรเลือกซ้ำถ้ามีงานค้างที่ต้องการเก็บ',
      'Use the mission selector to choose mission 1, or continue if already there. Selecting a mission resets its experiment settings and answer fields, so avoid reselecting one with work you want to keep.'),
    ...observations[id][0].map(([suffix, ...args]) => step(`first-${suffix}`, ...args)),
    ...answering(1),
    step('mission-2', 'mission-next', 'ไปภารกิจที่ 2 เมื่อพร้อม', 'Continue to mission 2 when ready',
      'เมื่อเครื่องมือแจ้งว่าผ่านภารกิจแรก กด “ภารกิจถัดไป” ใน simulation ถ้าปุ่มยังสีจาง ให้อ่านผลตรวจและทำเงื่อนไขหรือแก้คำตอบให้ครบก่อน ปุ่มถัดไปของคู่มือเป็นคนละปุ่มกัน',
      'When the activity confirms mission 1 is complete, use Next mission in the simulation. If disabled, read the feedback and complete the requirements or revise answers first. It is separate from Next in this guide.',
      text('ปุ่มนี้ใช้หลังผ่านภารกิจที่ 1 เท่านั้น หากอยู่ภารกิจที่ 2 แล้ว ให้ทำขั้นต่อไปของคู่มือได้เลย', 'This button is for completing mission 1. If already in mission 2, continue with the next guide step.')),
    ...observations[id][1].map(([suffix, ...args]) => step(`second-${suffix}`, ...args)),
    ...answering(2),
    step('finish', 'mission-heading', 'ตรวจว่าจบโหมดนี้จริง', 'Confirm this mode is complete',
      'ดูหัวข้อภารกิจใน simulation ว่าแสดงครบ 2/2 และผลตรวจของภารกิจที่ 2 แจ้งว่าผ่าน ถ้ายังไม่ครบ ให้กลับไปอ่านผลตรวจ ไม่ต้องรีเซ็ตโหมด เมื่อจบแล้วค่อยเลือกส่วนถัดไปของคู่มือ',
      'Check that the simulation’s mission heading shows 2/2 and mission 2 feedback confirms completion. Otherwise return to its feedback without resetting the mode. Then choose the next guide section.'),
  ];
}

export const waveMiniPlayGuide = Object.freeze({ schemaVersion: 1,
  contentId: 'physics-ipst-wave-optics-10-1-mini-sim',
  source: 'content/physics/ipst/wave-optics/10-1-wave-properties-mini-sim.html',
  title: text('10.1 · เล่นครบ 4 โหมดและ 8 ภารกิจ', '10.1 · Four modes and eight missions'),
  sections, steps: sections.flatMap(stepsFor),
});
