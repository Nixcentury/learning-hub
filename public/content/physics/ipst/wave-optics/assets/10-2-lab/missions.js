(() => {
  'use strict';
  const W=globalThis.InterferenceWater,M=globalThis.DoubleSlitLabModel;
  const initial=()=>({enabled:true,answerOpen:false,current:0,completed:[],answers:Array.from({length:6},()=>({})),attempted:[false,false,false,false,false,false],played:[false,false,false,false,false,false],near:false,far:false});
  const titles=[['1 · แนวกลางเมื่อเฟสตรงกัน','1 · In-phase centre line'],['2 · เปลี่ยนเฟสเป็นตรงข้าม','2 · Reverse the source phase'],['3 · เลือก P และหาผลต่างทางเดิน','3 · Choose P and find path difference'],['4 · สูตรสามแบบเหมือนกันแค่ไหน?','4 · Compare three path estimates'],['5 · วัดและเปรียบเทียบ A/B/C','5 · Measure and compare A/B/C'],['6 · หาความยาวคลื่นจากค่าที่วัด','6 · Infer wavelength from your data']];
  const instructions=[
    ['เล่นคลื่นเฟส 0° วาง P บนแนวกลาง แล้วทำนายว่าคลื่นจากสองแหล่งเสริมหรือหักล้างกัน','Play 0° waves with P on the centre line, then decide whether the sources reinforce or cancel there.'],
    ['เปลี่ยนเฟสเป็น 180° เปิดแนวบัพ แล้วเล่นคลื่น เปรียบเทียบแนวกลางกับภารกิจแรก','Set phase to 180°, show nodal lines and play the waves. Compare the centre line with mission 1.'],
    ['เปิดเส้นทาง r₁/r₂ แล้วลาก P บนฉาก หรือกด P ตัวอย่าง คำนวณ Δr และระบุว่าจุดอยู่บนแนวใด','Show r₁/r₂ paths. Drag P along the screen or choose the example point. Calculate Δr and identify its locus.'],
    ['กดดูกรณีใกล้/มุมมาก และไกล/มุมเล็ก เปิดสูตรเพื่อเทียบค่าจริง d|sin θ| และ d|x|/L','Inspect both near/large-angle and far/small-angle cases. Compare exact Δr, d|sin θ| and d|x|/L.'],
    ['เลือก A/B/C ทีละชุด วัดแถบสว่างกลางและบันทึกทั้งสามชุดที่เฟส 0° และ L = 1 m แล้วตอบจากการเปรียบเทียบ','At 0° and L = 1 m, select A/B/C, measure the central fringe and record each set. Then compare.'],
    ['ใช้บันทึกล่าสุด อ่านระยะสลิต ระยะฉาก และระยะห่างแถบ แล้วจัดหน่วยก่อนคำนวณความยาวคลื่น','Use your latest record. Read slit separation, screen distance and measured spacing, then align the units before calculating wavelength.'],
  ];
  function valid(s){return !!s&&typeof s.enabled==='boolean'&&typeof s.answerOpen==='boolean'&&Number.isInteger(s.current)&&s.current>=0&&s.current<6&&Array.isArray(s.completed)&&new Set(s.completed).size===s.completed.length&&s.completed.every(i=>Number.isInteger(i)&&i>=0&&i<6)&&Array.isArray(s.answers)&&s.answers.length===6&&s.answers.every(a=>a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).every(k=>['q0','q1'].includes(k))&&Object.values(a).every(v=>typeof v==='string'&&v.length<=80))&&['attempted','played'].every(k=>Array.isArray(s[k])&&s[k].length===6&&s[k].every(v=>typeof v==='boolean'))&&typeof s.near==='boolean'&&typeof s.far==='boolean';}
  const choice = (th, en, options, answer, hint) => ({
    type: 'choice', text: [th, en], options, answer, hint,
  });
  const kinds = [
    ['node', 'บัพ', 'Node'],
    ['antinode', 'ปฏิบัพ', 'Antinode'],
    ['between', 'อยู่ระหว่างแนว', 'Between loci'],
  ];

  function trialForPreset(records, key) {
    return records.findLast(record => M.preset(record.config) === key && (record.phase ?? 0) === 0);
  }

  function questions(id, state) {
    if (id === 0) return [choice(
      'เมื่อแหล่งเริ่มเฟสตรงกัน P ที่แนวกลางเป็นจุดชนิดใด?',
      'For initially in-phase sources, what kind of point is P on the centre line?',
      kinds, 'antinode',
      ['สังเกตการสั่นที่ P หลายจังหวะ แล้วเทียบกับความหมายของบัพและปฏิบัพ', 'Watch P over several cycles and compare with the meanings of node and antinode.'],
    )];
    if (id === 1) return [choice(
      'หลังเปลี่ยนเฟสเริ่มต้นเป็น 180° จุด P เดิมบนแนวกลางเป็นจุดชนิดใด?',
      'After setting the initial phase difference to 180°, what kind of point is the same centre-line P?',
      kinds, 'node',
      ['เปรียบเทียบการสั่นที่ P ตำแหน่งเดิมก่อนและหลังเปลี่ยนเฟส', 'Compare the motion at the same P before and after changing phase.'],
    )];
    if (id === 2) {
      const geometry = W.geometry(state.water);
      const r1 = geometry.r1.toFixed(4), r2 = geometry.r2.toFixed(4);
      return [
        {
          type: 'number', unit: 'cm',
          text: [
            `ที่ P ปัจจุบัน คลื่นเดินทางจากแหล่งแรก ${r1} cm และจากแหล่งที่สอง ${r2} cm ผลต่างทางเดินมีขนาดเท่าใด?`,
            `At the current P, the paths from the two sources are ${r1} cm and ${r2} cm. Find the magnitude of the path difference.`,
          ],
          answer: geometry.delta, tolerance: .01,
          hint: ['อ่านความยาวทั้งสองเส้นของ P เดียวกัน แล้วตรวจว่าหน่วยตรงกัน', 'Use both path lengths for the same P and check that the units match.'],
        },
        choice(
          `ใช้ P เดิมกับ λ = ${state.water.wavelength} cm และเฟส ${state.water.phase}° จุด P อยู่บนหรือใกล้แนวชนิดใด?`,
          `Use the same P with λ = ${state.water.wavelength} cm and ${state.water.phase}° source phase. Which locus is P on or near?`,
          [['node', 'บนหรือใกล้แนวบัพ', 'On or near a nodal locus'], ['antinode', 'บนหรือใกล้แนวปฏิบัพ', 'On or near an antinodal locus'], kinds[2]],
          W.nearKind(state.water),
          ['ใช้ผลต่างทางเดินที่เพิ่งคำนวณร่วมกับความยาวคลื่นและเฟสของกรณีนี้', 'Use your path difference together with this case’s wavelength and phase.'],
        ),
      ];
    }
    if (id === 3) return [
      choice('จากข้อมูลสองกรณี d|sin θ| ใกล้ค่าจริงขึ้นเมื่อใด?', 'From the two cases, when is d|sin θ| closer to the exact value?',
        [['far', 'ฉากไกลมากเมื่อเทียบกับระยะห่างแหล่ง d', 'The screen is far compared with source separation d'], ['near', 'ฉากอยู่ใกล้แหล่งกำเนิด', 'The screen is near the sources'], ['always', 'เท่ากับค่าจริงทุกกรณี', 'It matches the exact value in every case']], 'far',
        ['เทียบ L/d กับความต่างระหว่างค่าจริงและค่าประมาณในแต่ละกรณี', 'Compare L/d and the difference between the exact and approximate values in each case.']),
      choice('การประมาณผลต่างทางเดินด้วย d|x|/L ต้องมีเงื่อนไขเพิ่มอะไร?', 'What additional condition does the d|x|/L approximation need?',
        [['small', 'มุม θ เล็ก หรือ |x| น้อยกว่า L มาก', 'Small θ, or |x| much smaller than L'], ['large', 'มุม θ มีขนาดใหญ่', 'A large angle θ'], ['phase', 'สองแหล่งเริ่มเฟสตรงข้าม', 'The sources start in opposite phase']], 'small',
        ['ดูมุมของสองกรณี แล้วเทียบค่าประมาณแบบใช้ x กับค่าจริง', 'Compare the angles and the screen-offset estimates with the exact values.']),
    ];
    if (id === 4) return [
      choice('เมื่อเปลี่ยนจาก A เป็น B ระยะสลิต d เพิ่มเป็นสองเท่า โดยความยาวคลื่นและระยะฉากคงเดิม ระยะห่างแถบควรเปลี่ยนอย่างไร?',
        'From A to B the slit separation d doubles at fixed wavelength and screen distance. How should fringe spacing change?',
        [['half', 'เหลือประมาณครึ่งหนึ่ง', 'Approximately halves'], ['double', 'เพิ่มเป็นสองเท่า', 'Doubles'], ['same', 'เท่าเดิม', 'Unchanged']], 'half',
        ['เทียบแถว A กับ B แล้วดูว่าระยะสลิตกับระยะห่างแถบเปลี่ยนไปอย่างไร', 'Compare rows A and B and note how slit separation and fringe spacing change.']),
      choice('เมื่อ B กับ C ใช้ระยะสลิตและระยะฉากเท่ากัน ชุดใดควรมีระยะห่างแถบมากกว่า?',
        'At equal slit separation and screen distance, which set should have wider fringes, B or C?',
        [['C', 'ชุด C สีแดง', 'Set C, red'], ['B', 'ชุด B สีเขียว', 'Set B, green'], ['same', 'เท่ากัน', 'Equal']], 'C',
        ['เทียบแถว B กับ C แล้วระบุว่าตัวแปรใดเปลี่ยนในคู่ที่กำลังดู', 'Compare rows B and C and identify which variable changes in this pair.']),
    ];
    const latest = state.records.at(-1);
    const width = latest ? Number(M.measurement(latest.cursors).toFixed(2)) : 0;
    const wavelength = latest ? M.inferLambda(latest.config, width) : 0;
    return [{
      type: 'number', unit: 'nm',
      text: latest ? [
        `บันทึก ${latest.id}: ระยะสลิต ${latest.config.slit} μm ระยะฉาก ${latest.config.distance.toFixed(1)} m และระยะห่างแถบที่วัดได้ ${width.toFixed(2)} mm คำนวณความยาวคลื่นจากผลวัดนี้`,
        `Trial ${latest.id}: slit separation ${latest.config.slit} μm, screen distance ${latest.config.distance.toFixed(1)} m, measured spacing ${width.toFixed(2)} mm. Infer wavelength from this record.`,
      ] : ['บันทึกผลการวัดก่อนเพื่อสร้างโจทย์ข้อนี้', 'Record a measurement to generate this question.'],
      answer: wavelength, tolerance: Math.max(1, Math.abs(wavelength) * .005),
      hint: ['อ่านข้อมูลจากบันทึกเดียวกัน จัดหน่วยความยาวให้ตรงกันก่อนแทนค่า แล้วแปลงผลเป็น nm', 'Use values from one record, convert the lengths to matching units and express the result in nm.'],
    }];
  }
  function requirements(s){
    const id=s.missions.current,w=s.water,m=s.missions;
    if(id===0)return [[m.played[id],['กดเล่นคลื่น','Play the waves']],[w.phase===0&&Math.abs(w.x)<.001,['เฟส 0° และ P บนแนวกลาง','0° phase and P on centre line']]];
    if(id===1)return [[w.phase===180,['เปลี่ยนเป็น 180°','Set phase to 180°']],[w.layers.nodes,['เปิดแนวบัพ','Show nodal lines']],[Math.abs(w.x)<.001,['P บนแนวกลาง','P on centre line']],[m.played[id],['กดเล่นคลื่น','Play the waves']]];
    if(id===2)return [[w.layers.paths,['เปิดเส้นทาง r₁/r₂','Show r₁/r₂ paths']],[Math.abs(w.x)>.1,['ลาก P ออกจากกลาง หรือเลือก P ตัวอย่าง','Move P off centre or choose the example point']]];
    if(id===3)return [[m.near,['ดูกรณีใกล้/มุมมาก','Inspect near/large-angle case']],[m.far,['ดูกรณีไกล/มุมเล็ก','Inspect far/small-angle case']]];
    if(id===4)return ['A','B','C'].map(key=>[Boolean(trialForPreset(s.records,key)),[`บันทึกชุด ${key} ที่เฟส 0°`,`Record set ${key} at 0°`]]);
    return [[s.records.length>0,['มีบันทึกผลการวัด','Have a measurement record']]];
  }
  function grade(s){const qs=questions(s.missions.current,s),answers=s.missions.answers[s.missions.current];return qs.map((q,i)=>{const a=answers['q'+i]??'';return q.type==='number'?a.trim()!==''&&Number.isFinite(Number(a))&&Math.abs(Number(a)-q.answer)<=q.tolerance:a===q.answer;});}
  globalThis.InterferenceMissions=Object.freeze({initial,valid,titles,instructions,questions,requirements,grade,trialForPreset});
})();
