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
    [
      goal('ใช้โลหะ A ที่ 6.40 × 10¹⁴ Hz แล้วบันทึก', 'Record metal A at 6.40 × 10¹⁴ Hz', { frequency: 6.4 }),
      goal('คงความถี่เดิม เปลี่ยนเป็นโลหะ B แล้วบันทึก', 'Keep frequency fixed, switch to metal B and record', { metal: 'B', frequency: 6.4 }),
      goal('ใช้โลหะ B เพิ่มความถี่เป็น 7.10 × 10¹⁴ Hz แล้วบันทึก', 'With metal B, raise frequency to 7.10 × 10¹⁴ Hz and record', { metal: 'B', frequency: 7.1 }),
      goal('คงความถี่เดิม เปลี่ยนเป็นโลหะ C แล้วบันทึก', 'Keep frequency fixed, switch to metal C and record', { metal: 'C', frequency: 7.1 }),
      goal('ใช้โลหะ C เพิ่มความถี่เป็น 7.60 × 10¹⁴ Hz แล้วบันทึก', 'With metal C, raise frequency to 7.60 × 10¹⁴ Hz and record', { metal: 'C', frequency: 7.6 }),
    ],
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
        question('เปิดแสงแล้ว จากภาพเห็นอะไรเคลื่อนไปถึงขั้วรับ?', 'With the light on, what do you see reaching the collector?',
          [choice('สิ่งที่เห็นในหลอด', 'What you see in the tube', [
            ['ลำแสง', 'The light beam.'],
            ['อิเล็กตรอนจากผิวโลหะ', 'Electrons from the metal.'],
            ['ไม่มีอะไรไปถึง', 'Nothing reaches it.'],
          ])], () => ['1'], ['ดูจุดที่เคลื่อนจากผิวโลหะไปยังขั้วฝั่งตรงข้าม', 'Watch the dots moving from the metal surface to the opposite electrode.']),
      ],
    },
    {
      title: pair('ความถี่และความเข้มของแสง', 'Frequency and light intensity'),
      objective: pair('เปลี่ยนทีละตัวแปรเพื่อหาช่วงความถี่ขีดเริ่ม และเปรียบเทียบผลของความเข้มทั้งเหนือและใต้ขีดเริ่ม',
        'Change one variable at a time to bracket the threshold frequency and compare intensity effects both above and below it.'),
      questions: [
        question('ดูสองแถวที่ความเข้ม 80% มิเตอร์อ่านศูนย์ที่ความถี่เท่าไร และเริ่มมีกระแสที่ความถี่เท่าไร?',
          'Find the two 80% rows. At what frequency is the current zero, and at what frequency does current appear?',
          [number('ความถี่ที่อ่านได้ศูนย์ (10¹⁴ Hz)', 'Frequency at zero current (10¹⁴ Hz)'),
            number('ความถี่ที่เริ่มอ่านได้กระแส (10¹⁴ Hz)', 'Frequency where current appears (10¹⁴ Hz)')],
          rows => [rows[1].frequency, rows[2].frequency], ['อ่านความถี่จากแถวที่ 2 และ 3', 'Read the frequencies from rows 2 and 3.'], .005),
        question('เพิ่มความเข้มจาก 50% เป็น 80% กระแสเปลี่ยนอย่างไรที่แต่ละความถี่?',
          'How does the current change at each frequency when you raise intensity from 50% to 80%?',
          [choice('ที่ความถี่ 6.10 × 10¹⁴ Hz', 'At 6.10 × 10¹⁴ Hz', [
            ['กระแสลดลง', 'Current decreases.'],
            ['กระแสเท่าเดิม', 'Current stays the same.'],
            ['กระแสเพิ่มขึ้น', 'Current increases.'],
          ]), choice('ที่ความถี่ 6.00 × 10¹⁴ Hz', 'At 6.00 × 10¹⁴ Hz', [
            ['กระแสยังเป็นศูนย์', 'The current stays at zero.'],
            ['เริ่มมีกระแส', 'Current starts flowing.'],
          ])], () => ['2', '0'], ['เทียบค่ากระแสของแถวที่ความถี่เท่ากันทีละคู่', 'Compare the current in each pair of rows with the same frequency.']),
      ],
    },
    {
      title: pair('วัดศักย์หยุดยั้ง', 'Measuring the stopping potential'),
      objective: pair('คงแสงชุดสอนและโลหะเดิม ปรับแรงดันแล้วดูว่ากระแสลดลงจนเป็นศูนย์เมื่อใด',
        'Keep the teaching light and metal fixed. Vary the voltage and see where the current falls to zero.'),
      questions: [
        question('เปิดแสงไว้ ที่แรงดันค่าลบซึ่งมิเตอร์อ่านศูนย์ อิเล็กตรอนในภาพเป็นอย่างไร?',
          'With the light still on and the meter at zero under a negative voltage, what do you see the electrons do?',
          [choice('สิ่งที่เห็นในหลอด', 'What you see in the tube', [
            ['ไม่มีอิเล็กตรอนออกจากผิวโลหะ', 'No electrons leave the metal.'],
            ['ออกจากผิวโลหะแล้ววกกลับ', 'They leave the metal and return.'],
            ['ไปถึงขั้วรับทั้งหมด', 'They all reach the collector.'],
          ])], () => ['1'], ['ดูทิศที่จุดอิเล็กตรอนเคลื่อนเมื่อมิเตอร์อ่านศูนย์', 'Watch where the electron dots move when the meter reads zero.']),
        question('อ่านตามลำดับที่บันทึก แถวสุดท้ายที่ยังมีกระแสและแถวแรกที่กระแสเป็นศูนย์มีแรงดันเท่าไร?',
          'In your recorded order, what is the voltage at the last row with current and at the first row with zero current?',
          [number('จุดสุดท้ายที่ยังมีกระแส (V)', 'Last point with current (V)'), number('จุดแรกที่อ่านได้ศูนย์ (V)', 'First zero-current point (V)')],
          rows => { const zero = rows.findIndex(row => row.current === 0); return [rows[zero - 1].voltage, rows[zero].voltage]; },
          ['หาแถวแรกที่ I = 0.00 µA แล้วอ่าน V ของแถวนั้นกับแถวก่อนหน้า ใส่เครื่องหมายตามตาราง',
            'Find the first row with I = 0.00 µA. Read the signed V in that row and the row above it.'], .005),
      ],
    },
    {
      title: pair('ชนิดโลหะกับความถี่ขีดเริ่ม', 'Metal and threshold frequency'),
      objective: pair('คงความเข้มและแรงดันเก็บอิเล็กตรอน แล้วสลับโลหะที่ความถี่เดียวกันเพื่อเปรียบเทียบกระแส',
        'Keep intensity and collecting voltage fixed, then switch metals at the same frequency to compare currents.'),
      questions: [
        question('ดูผลที่ 6.40 × 10¹⁴ Hz และ 7.10 × 10¹⁴ Hz ที่แต่ละความถี่ โลหะตัวใดทำให้มิเตอร์อ่านได้มากกว่าศูนย์?',
          'From your readings at 6.40 × 10¹⁴ Hz and 7.10 × 10¹⁴ Hz, which tested metal gives a current at each frequency?',
          [choice('โลหะที่มีกระแสที่ 6.40 × 10¹⁴ Hz', 'Metal giving current at 6.40 × 10¹⁴ Hz', [
            ['โลหะ A', 'Metal A'], ['โลหะ B', 'Metal B'], ['ไม่มีทั้ง A และ B', 'Neither A nor B'],
          ]), choice('โลหะที่มีกระแสที่ 7.10 × 10¹⁴ Hz', 'Metal giving current at 7.10 × 10¹⁴ Hz', [
            ['โลหะ B', 'Metal B'], ['โลหะ C', 'Metal C'], ['ไม่มีทั้ง B และ C', 'Neither B nor C'],
          ])], rows => [rows[0].current > 0 ? '0' : '1', rows[2].current > 0 ? '0' : '1'],
          ['เทียบค่ากระแสในสองแถวที่ความถี่เท่ากันทีละคู่', 'Compare the two rows at each common frequency.']),
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
