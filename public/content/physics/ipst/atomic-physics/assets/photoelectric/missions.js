(() => {
  'use strict';
  const { teaching: t, measure, signed } = Photoelectric;
  const pair = (th, en) => ({ th, en });
  const close = (a, b, tolerance = 1e-8) => Math.abs(a - b) <= tolerance;
  const base = { light: true, metal: t.metal, frequency: t.frequency, intensity: t.intensity, voltage: t.collectVoltage };
  const goal = (th, en, overrides) => ({ title: pair(th, en), setup: { ...base, ...overrides } });
  const targets = [
    [
      goal('ปิดแสง แล้วบันทึกกระแส', 'Switch off the light and record the current', { light: false }),
      goal('เปิดแสง แล้วบันทึกกระแส', 'Switch on the light and record the current'),
    ],
    [
      goal('ตั้งความถี่ 6.00 × 10¹⁴ Hz แล้วบันทึก', 'Set the frequency to 6.00 × 10¹⁴ Hz and record', { frequency: t.lowFrequency }),
      goal('คงความถี่ 6.00 × 10¹⁴ Hz เพิ่มความเข้มเป็น 80% แล้วบันทึก', 'Keep the frequency at 6.00 × 10¹⁴ Hz, increase intensity to 80% and record',
        { frequency: t.lowFrequency, intensity: t.strongIntensity }),
      goal('คงความเข้ม 80% เพิ่มความถี่เป็น 6.10 × 10¹⁴ Hz แล้วบันทึก', 'Keep intensity at 80%, increase frequency to 6.10 × 10¹⁴ Hz and record',
        { frequency: t.highFrequency, intensity: t.strongIntensity }),
      goal('คงความถี่ 6.10 × 10¹⁴ Hz ลดความเข้มเป็น 50% แล้วบันทึก', 'Keep the frequency at 6.10 × 10¹⁴ Hz, lower intensity to 50% and record',
        { frequency: t.highFrequency }),
    ],
    t.sweep.map(voltage => goal(
      `ตั้ง V = ${signed(voltage)} V แล้วบันทึกกระแส`,
      `Set V = ${signed(voltage)} V and record the current`, { voltage })),
  ];
  const number = (th, en) => ({ label: pair(th, en) });
  const choice = (th, en, options) => ({ label: pair(th, en), options: options.map(option => pair(...option)) });
  const question = (th, en, fields, expected, feedback, tolerance) => ({
    title: pair(th, en), fields, expected, feedback: pair(...feedback), tolerance,
  });
  const missions = [
    {
      title: pair('หลักฐานว่ามีอิเล็กตรอนหลุด', 'Evidence of electron emission'),
      objective: pair('เทียบค่ากระแสก่อนและหลังเปิดแสง โดยตั้งขั้วรับให้ดึงอิเล็กตรอน',
        'Compare the current with the light off and on while the collector attracts electrons.'),
      questions: [
        question('อ่านค่ากระแสที่บันทึกก่อนและหลังเปิดแสง', 'Read the currents recorded with the light off and on.',
          [number('ปิดแสง (µA)', 'Light off (µA)'), number('เปิดแสง (µA)', 'Light on (µA)')],
          rows => rows.map(row => row.current), ['เทียบตัวเลขในสองแถวแรกของตาราง', 'Compare the numbers in the first two rows of your table.'], .005),
        question('กระแสที่ตรวจพบหลังเปิดแสงเป็นหลักฐานโดยตรงของอะไร?', 'What does the current detected after switching on the light directly show?',
          [choice('เลือกคำอธิบาย', 'Choose an explanation', [
            ['โฟตอนเดินทางผ่านสายไฟ', 'Photons travelled through the wire.'],
            ['อิเล็กตรอนจากผิวโลหะไปถึงขั้วรับ', 'Electrons from the metal reached the collector.'],
            ['อิเล็กตรอนหยุดอยู่กลางหลอดทั้งหมด', 'All the electrons stopped inside the tube.'],
          ])], () => ['1'], ['คิดว่าประจุต้องไปถึงที่ใดจึงเกิดกระแสในวงจร', 'Think about where charge must arrive for current to flow in the circuit.']),
      ],
    },
    {
      title: pair('ความถี่และความเข้มของแสง', 'Frequency and light intensity'),
      objective: pair('เปลี่ยนทีละตัวแปรเพื่อหาช่วงความถี่ขีดเริ่ม และเปรียบเทียบผลของความเข้มทั้งเหนือและใต้ขีดเริ่ม',
        'Change one variable at a time to bracket the threshold frequency and compare intensity effects both above and below it.'),
      questions: [
        question('ค่าความถี่สองค่าใดคร่อมความถี่ขีดเริ่ม?', 'Which two frequencies bracket the threshold?',
          [number('ค่าที่ต่ำกว่า (10¹⁴ Hz)', 'Lower reading (10¹⁴ Hz)'), number('ค่าที่สูงกว่า (10¹⁴ Hz)', 'Upper reading (10¹⁴ Hz)')],
          rows => [rows[1].frequency, rows[2].frequency], ['ใช้คู่ที่ความเข้มเท่ากัน แต่กระแสเริ่มเปลี่ยนจากศูนย์', 'Use the pair with the same intensity where the current goes from zero to positive.'], .005),
        question('เมื่อเพิ่มความถี่ พลังงานของโฟตอนหนึ่งตัวเปลี่ยนอย่างไร?', 'How does increasing frequency change the energy of one photon?',
          [choice('เลือกคำอธิบาย', 'Choose an explanation', [
            ['พลังงานต่อโฟตอนเพิ่มขึ้น', 'The energy per photon increases.'],
            ['พลังงานต่อโฟตอนลดลง', 'The energy per photon decreases.'],
            ['พลังงานต่อโฟตอนคงเดิม', 'The energy per photon stays the same.'],
          ])], () => ['0'], ['ใช้ความสัมพันธ์ Eγ = hf', 'Use the relation Eγ = hf.']),
        question('เมื่อคงความถี่เหนือขีดเริ่มแล้วเพิ่มความเข้ม เครื่องมืออ่านค่าเปลี่ยนอย่างไร?', 'Above threshold, what changes when you increase intensity at fixed frequency?',
          [choice('เลือกคำอธิบาย', 'Choose an explanation', [
            ['กระแสลดลงและพลังงานต่อโฟตอนเพิ่มขึ้น', 'Current decreases and energy per photon increases.'],
            ['กระแสและพลังงานต่อโฟตอนคงเดิม', 'Current and energy per photon stay the same.'],
            ['กระแสเพิ่มขึ้นและพลังงานต่อโฟตอนคงเดิม', 'Current increases and energy per photon stays the same.'],
          ]), choice('ถ้าเพิ่มความเข้มโดยคงความถี่ต่ำกว่าขีดเริ่ม จะวัดอะไรได้?', 'What do you measure if you raise intensity while staying below threshold?', [
            ['กระแสยังเป็นศูนย์', 'The current stays at zero.'],
            ['เริ่มมีกระแส', 'Current starts flowing.'],
          ])], () => ['2', '0'], ['เทียบค่าที่ความถี่เดียวกัน ทั้งเหนือและใต้ขีดเริ่ม แล้วดูว่าตัวแปรใดอยู่ใน Eγ = hf', 'Compare readings at a fixed frequency, both above and below threshold. Check which variable appears in Eγ = hf.']),
      ],
    },
    {
      title: pair('วัดศักย์หยุดยั้ง', 'Measuring the stopping potential'),
      objective: pair('คงแสงชุดสอนและโลหะเดิม ปรับแรงดันต้านและใช้กราฟหาพลังงาน',
        'Keep the teaching light and metal fixed, vary the retarding voltage and use the graph to find energy.'),
      questions: [
        question('เมื่อเปิดแสงชุดสอนและเพิ่มแรงดันต้านจนกระแสเป็นศูนย์ อิเล็กตรอนเป็นอย่างไร?',
          'With the teaching light on, what happens to electrons when the retarding voltage reduces the current to zero?',
          [choice('เลือกคำอธิบาย', 'Choose an explanation', [
            ['หยุดหลุดจากผิวโลหะทันที', 'They immediately stop leaving the metal.'],
            ['ยังหลุดจากผิวโลหะ แต่ไปไม่ถึงขั้วรับ', 'They still leave the metal but do not reach the collector.'],
            ['ไปถึงขั้วรับทั้งหมด', 'They all reach the collector.'],
          ])], () => ['1'], ['ดูการเคลื่อนที่ในหลอดที่แรงดันต้าน และนึกว่าพลังงานต่อโฟตอนยังเท่าเดิม', 'Observe the tube under retarding voltage. The energy per photon is unchanged.']),
        question('เมื่อไล่จาก V บวกไปลบ ค่า V สองค่าที่ติดกันคู่ใดคร่อมการเริ่มอ่านได้ศูนย์?',
          'Sweeping from positive to negative V, which adjacent readings bracket the onset of zero current?',
          [number('จุดสุดท้ายที่ยังมีกระแส (V)', 'Last point with current (V)'), number('จุดแรกที่อ่านได้ศูนย์ (V)', 'First zero-current point (V)')],
          rows => { const zero = rows.findIndex(row => row.current === 0); return [rows[zero - 1].voltage, rows[zero].voltage]; },
          ['อ่านจากจุดกระแสบวกจุดสุดท้ายและจุดศูนย์จุดแรกตามทิศที่กวาด', 'Read the last positive-current point and first zero-current point in your sweep.'], .005),
        question('ใช้จุดศูนย์จุดแรกเป็นค่าประมาณ เขียน V พร้อมเครื่องหมายและขนาดศักย์หยุดยั้ง Vₛ',
          'Use the first zero-current point as the estimate. Enter signed V and the stopping-potential magnitude Vₛ.',
          [number('V พร้อมเครื่องหมาย (V)', 'Signed V (V)'), number('ขนาด Vₛ (V)', 'Magnitude Vₛ (V)')],
          rows => { const value = rows.find(row => row.current === 0).voltage; return [value, -value]; },
          ['ค่าบนแกนแรงดันอาจติดลบ ส่วน Vₛ คือขนาดของค่านั้น', 'The axis reading may be negative. Vₛ is its magnitude.'], .005),
        question('คำนวณพลังงานจลน์สูงสุดของโฟโตอิเล็กตรอนโดยใช้ขนาดศักย์หยุดยั้ง',
          'Calculate the maximum kinetic energy of the photoelectrons from the stopping-potential magnitude.',
          [number('Kₘₐₓ (eV)', 'Kₘₐₓ (eV)')], rows => [-rows.find(row => row.current === 0).voltage],
          ['ใช้ Kₘₐₓ = eVₛ แล้วตอบเป็น eV', 'Use Kₘₐₓ = eVₛ and give the result in eV.'], .005),
        question('จากพลังงานโฟตอนและพลังงานจลน์สูงสุด คำนวณฟังก์ชันงานของโลหะ',
          'Calculate the metal’s work function from the photon energy and maximum kinetic energy.',
          [number('W (eV)', 'W (eV)')], rows => [rows[0].energy + rows.find(row => row.current === 0).voltage],
          ['จัดรูปจาก Kₘₐₓ = Eγ − W', 'Rearrange Kₘₐₓ = Eγ − W.'], .005),
      ],
    },
  ];
  const controls = [
    ['metal', 'metal-control', value => pair(`เลือกโลหะ ${value}`, `Select metal ${value}`)],
    ['light', 'light-control', value => value ? pair('เปิดแสง', 'Switch on the light') : pair('ปิดแสง', 'Switch off the light')],
    ['frequency', 'frequency-control', value => close(value, t.frequency)
      ? pair('กดตั้งแสงชุดสอน 3.00 eV', 'Press Set teaching light · 3.00 eV')
      : pair(`ตั้งความถี่ ${value.toFixed(2)} × 10¹⁴ Hz`, `Set the frequency to ${value.toFixed(2)} × 10¹⁴ Hz`)],
    ['intensity', 'intensity-control', value => pair(`ตั้งความเข้ม ${value}%`, `Set intensity to ${value}%`)],
    ['voltage', 'voltage-control', value => pair(`ตั้งแรงดัน ${signed(value)} V`, `Set voltage to ${signed(value)} V`)],
  ];
  function requirements(index, rows, setup) {
    const target = targets[index][rows.length];
    if (!target) return { complete: true };
    const mismatch = controls.find(([field]) => typeof setup[field] === 'number'
      ? !close(setup[field], target.setup[field])
      : setup[field] !== target.setup[field]);
    if (mismatch) {
      const [field, id, instruction] = mismatch;
      return { id, text: instruction(target.setup[field]), ready: false };
    }
    return { id: 'record', text: pair('อ่านมิเตอร์ แล้วกดบันทึกค่ามิเตอร์', 'Read the meter, then record the reading.'), ready: true };
  }
  function snapshot(setup) {
    const { light, metal, frequency, intensity, voltage } = setup;
    const { current, energy } = measure(setup);
    return { light, metal, frequency, intensity, voltage, current, energy };
  }
  function grade(index, rows, answers) {
    return missions[index].questions.map((item, i) => item.expected(rows).every((expected, j) => {
      const given = answers[i][j];
      return typeof expected === 'number'
        ? given.trim() !== '' && close(Number(given.replace('−', '-')), expected, item.tolerance)
        : given === expected;
    }));
  }
  globalThis.PhotoelectricMissions = { pair, missions, targets, requirements, snapshot, grade };
})();
