(() => {
  'use strict';
  const W=globalThis.InterferenceWater,M=globalThis.DoubleSlitLabModel;
  const counts = [1, 1, 3, 3, 2, 2];
  const emptyRows = value => counts.map(n => Array(n).fill(value));
  const initial=()=>({enabled:true,answerOpen:false,current:0,completed:[],answers:Array.from({length:6},()=>({})),attempted:[false,false,false,false,false,false],played:[false,false,false,false,false,false],near:false,far:false,first:emptyRows(null),mastered:emptyRows(false),firstChecks:Array(6).fill(null),lastChecks:Array(6).fill(null),frozen:Array(6).fill(null),evidence:{path:null,approx:null,wavelength:null},legacyCompleted:[]});
  const titles=[['1 · แนวกลางเมื่อเฟสตรงกัน','1 · In-phase centre line'],['2 · เปลี่ยนเฟสเป็นตรงข้าม','2 · Reverse the source phase'],['3 · เลือก P และหาผลต่างทางเดิน','3 · Choose P and find path difference'],['4 · สูตรสามแบบเหมือนกันแค่ไหน?','4 · Compare three path estimates'],['5 · วัดและเปรียบเทียบ A/B/C','5 · Measure and compare A/B/C'],['6 · หาความยาวคลื่นจากค่าที่วัด','6 · Infer wavelength from your data']];
  const instructions=[
    ['เล่นคลื่นเฟส 0° วาง P บนแนวกลาง แล้วทำนายว่าคลื่นจากสองแหล่งเสริมหรือหักล้างกัน','Play 0° waves with P on the centre line, then decide whether the sources reinforce or cancel there.'],
    ['เปลี่ยนเฟสเป็น 180° เปิดแนวบัพ แล้วเล่นคลื่น เปรียบเทียบแนวกลางกับภารกิจแรก','Set phase to 180°, show nodal lines and play the waves. Compare the centre line with mission 1.'],
    ['เปิดเส้นทาง r₁/r₂ แล้วลาก P บนฉาก หรือกด P ตัวอย่าง คำนวณ Δr และระบุว่าจุดอยู่บนแนวใด','Show r₁/r₂ paths. Drag P along the screen or choose the example point. Calculate Δr and identify its locus.'],
    ['กดดูกรณีใกล้/มุมมาก และไกล/มุมเล็ก เปิดสูตรเพื่อเทียบค่าจริง d|sin θ| และ d|x|/L','Inspect both near/large-angle and far/small-angle cases. Compare exact Δr, d|sin θ| and d|x|/L.'],
    ['เลือก A/B/C ทีละชุด วัดแถบสว่างกลางและบันทึกทั้งสามชุดที่เฟส 0° และ L = 1 m แล้วตอบจากการเปรียบเทียบ','At 0° and L = 1 m, select A/B/C, measure the central fringe and record each set. Then compare.'],
    ['ใช้บันทึกล่าสุด อ่านระยะสลิต ระยะฉาก และระยะห่างแถบ แล้วจัดหน่วยก่อนคำนวณความยาวคลื่น','Use your latest record. Read slit separation, screen distance and measured spacing, then align the units before calculating wavelength.'],
  ];
  function validRecord(r) {
    return !!r && Number.isInteger(r.id) && r.id > 0 && M.validConfig(r.config) && M.validCursors(r.cursors) && M.measurement(r.cursors) > 0 && [0,180].includes(r.phase ?? 0);
  }
  function validFrozen(f) {
    return f === null || (!!f && (!f.water || W.valid(f.water)) && (!f.record || validRecord(f.record)) && (!f.extraRecord || validRecord(f.extraRecord)));
  }
  function valid(s) {
    if (!s || typeof s.enabled !== 'boolean' || typeof s.answerOpen !== 'boolean' || !Number.isInteger(s.current) || s.current < 0 || s.current > 5) return false;
    const indices = v => Array.isArray(v) && new Set(v).size === v.length && v.every(i => Number.isInteger(i) && i >= 0 && i < 6);
    const rows = (v, predicate) => Array.isArray(v) && v.length === 6 && v.every((row,i) => Array.isArray(row) && row.length === counts[i] && row.every(predicate));
    if (!indices(s.completed) || !indices(s.legacyCompleted)) return false;
    if (!Array.isArray(s.answers) || s.answers.length !== 6 || !s.answers.every((a,i) => a && typeof a === 'object' && !Array.isArray(a) && Object.keys(a).every(k => /^q[0-2]$/.test(k) && Number(k.slice(1)) < counts[i]) && Object.values(a).every(v => typeof v === 'string' && v.length <= 80))) return false;
    if (!['attempted','played'].every(k => Array.isArray(s[k]) && s[k].length === 6 && s[k].every(v => typeof v === 'boolean')) || !['near','far'].every(k => typeof s[k] === 'boolean')) return false;
    if (!rows(s.first, v => v === null || typeof v === 'boolean') || !rows(s.mastered, v => typeof v === 'boolean')) return false;
    if (!Array.isArray(s.frozen) || s.frozen.length !== 6 || !s.frozen.every(validFrozen)) return false;
    if (!s.evidence || !(s.evidence.path === null || W.valid(s.evidence.path)) || !(s.evidence.approx === null || W.valid(s.evidence.approx)) || !(s.evidence.wavelength === null || validRecord(s.evidence.wavelength))) return false;
    return ['firstChecks','lastChecks'].every(k => Array.isArray(s[k]) && s[k].length === 6 && s[k].every((v,i) => v === null || (v && Array.isArray(v.results) && v.results.length === counts[i] && v.results.every(b => typeof b === 'boolean') && Array.isArray(v.items) && v.items.length === counts[i] && v.items.every(q => q && Array.isArray(q.text) && q.text.length === 2 && q.text.every(t => typeof t === 'string' && t.length <= 1000) && typeof q.answer === 'string' && q.answer.length <= 80))));
  }
  function migrate(old) {
    if (!old || !Array.isArray(old.completed) || !Array.isArray(old.answers) || !Array.isArray(old.attempted)) return null;
    const m = initial();
    for (const key of ['enabled','answerOpen','current','completed','answers','attempted','played','near','far']) if (old?.[key] !== undefined) m[key] = structuredClone(old[key]);
    // Preserve old evidence/answers without inventing first-attempt scores for the new 12-question edition.
    m.legacyCompleted = [...(m.completed || [])];
    const originalCounts=[1,1,2,2,2,1];
    for(const id of m.legacyCompleted)if(Number.isInteger(id)&&id>=0&&id<6)for(let i=0;i<originalCounts[id];i++)m.mastered[id][i]=true;
    m.completed = m.completed.filter(i => counts[i] === 1 || i === 4);
    m.attempted = m.attempted.map(() => false);
    return m;
  }
  function observe(s) {
    const w = s.water, m = s.missions, e = m.evidence;
    if (m.current === 2 && w.layers.paths && w.wavelength === 2 && w.separation === 8 && w.L === 12 && w.phase === 0 && Math.abs(W.geometry(w).delta - 1) < 1e-6) e.path = structuredClone(w);
    if (m.current === 3 && w.layers.formulas && w.separation === 8 && w.L === 60 && w.x === 6) e.approx = structuredClone(w);
    if (m.current === 5) {
      const r = s.records.findLast(r => r.config.color === 'red' && r.config.slit === 100 && r.config.distance === 2 && (r.phase ?? 0) === 0);
      if (r) {e.wavelength = structuredClone(r);if(m.frozen[5]&&!m.frozen[5].extraRecord)m.frozen[5].extraRecord=structuredClone(r);}
    }
  }
  function capture(s) {
    const id = s.missions.current;
    if (s.missions.frozen[id]) return;
    const e = s.missions.evidence;
    s.missions.frozen[id] = {water:structuredClone(s.water)};
    if (id === 5) {
      const record = s.records.at(-1);
      if (record) s.missions.frozen[id].record = structuredClone(record);
      if (e.wavelength) s.missions.frozen[id].extraRecord = structuredClone(e.wavelength);
    }
  }
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
      const point = state.missions.frozen[id]?.water || state.water;
      const geometry = W.geometry(point);
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
          `ใช้ P เดิมกับ λ = ${point.wavelength} cm และเฟส ${point.phase}° จุด P อยู่บนหรือใกล้แนวชนิดใด?`,
          `Use the same P with λ = ${point.wavelength} cm and ${point.phase}° source phase. Which locus is P on or near?`,
          [['node', 'บนหรือใกล้แนวบัพ', 'On or near a nodal locus'], ['antinode', 'บนหรือใกล้แนวปฏิบัพ', 'On or near an antinodal locus'], kinds[2]],
          W.nearKind(point),
          ['ใช้ผลต่างทางเดินที่เพิ่งคำนวณร่วมกับความยาวคลื่นและเฟสของกรณีนี้', 'Use your path difference together with this case’s wavelength and phase.'],
        ),
        {type:'number',unit:'cm', text:[
          'ตั้ง λ = 2 cm, d = 8 cm, L = 12 cm, เฟส 0° แล้วกด P ตัวอย่าง Δr = λ/2 ผลต่างทางเดินที่ได้เท่าใด?',
          'Set λ = 2 cm, d = 8 cm, L = 12 cm and phase 0°, then choose the Δr = λ/2 example point. What is the path difference?'
        ], answer:1, tolerance:.01, hint:['ใช้ค่าความยาวคลื่นที่กำหนด แล้วเทียบกับเส้นทางทั้งสองในซิม','Use the specified wavelength and compare the two paths in the simulation.']},
      ];
    }
    if (id === 3) return [
      choice('จากข้อมูลสองกรณี d|sin θ| ใกล้ค่าจริงขึ้นเมื่อใด?', 'From the two cases, when is d|sin θ| closer to the exact value?',
        [['far', 'ฉากไกลมากเมื่อเทียบกับระยะห่างแหล่ง d', 'The screen is far compared with source separation d'], ['near', 'ฉากอยู่ใกล้แหล่งกำเนิด', 'The screen is near the sources'], ['always', 'เท่ากับค่าจริงทุกกรณี', 'It matches the exact value in every case']], 'far',
        ['เทียบ L/d กับความต่างระหว่างค่าจริงและค่าประมาณในแต่ละกรณี', 'Compare L/d and the difference between the exact and approximate values in each case.']),
      choice('การประมาณผลต่างทางเดินด้วย d|x|/L ต้องมีเงื่อนไขเพิ่มอะไร?', 'What additional condition does the d|x|/L approximation need?',
        [['small', 'มุม θ เล็ก หรือ |x| น้อยกว่า L มาก', 'Small θ, or |x| much smaller than L'], ['large', 'มุม θ มีขนาดใหญ่', 'A large angle θ'], ['phase', 'สองแหล่งเริ่มเฟสตรงข้าม', 'The sources start in opposite phase']], 'small',
        ['ดูมุมของสองกรณี แล้วเทียบค่าประมาณแบบใช้ x กับค่าจริง', 'Compare the angles and the screen-offset estimates with the exact values.']),
      {type:'number',unit:'cm',text:[
        'ตั้ง d = 8 cm, L = 60 cm, x = 6 cm เปิดสูตรทั้งสามวิธี แล้วคำนวณ d|x|/L ได้เท่าใด?',
        'Set d = 8 cm, L = 60 cm and x = 6 cm, show the three formulas, then calculate d|x|/L.'
      ],answer:.8,tolerance:.005,hint:['แทนค่าระยะในหน่วยเดียวกัน แล้วเปรียบเทียบค่าที่ซิมแสดง','Use matching length units, then compare with the simulation reading.']},
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
    const latest = state.missions.frozen[id]?.record || state.records.at(-1);
    const width = latest ? Number(M.measurement(latest.cursors).toFixed(2)) : 0;
    const wavelength = latest ? M.inferLambda(latest.config, width) : 0;
    const extra = state.missions.frozen[id]?.extraRecord || state.missions.evidence.wavelength;
    const extraWidth = extra ? Number(M.measurement(extra.cursors).toFixed(2)) : 0;
    return [{
      type: 'number', unit: 'nm',
      text: latest ? [
        `บันทึก ${latest.id}: ระยะสลิต ${latest.config.slit} μm ระยะฉาก ${latest.config.distance.toFixed(1)} m และระยะห่างแถบที่วัดได้ ${width.toFixed(2)} mm คำนวณความยาวคลื่นจากผลวัดนี้`,
        `Trial ${latest.id}: slit separation ${latest.config.slit} μm, screen distance ${latest.config.distance.toFixed(1)} m, measured spacing ${width.toFixed(2)} mm. Infer wavelength from this record.`,
      ] : ['บันทึกผลการวัดก่อนเพื่อสร้างโจทย์ข้อนี้', 'Record a measurement to generate this question.'],
      answer: wavelength, tolerance: Math.max(1, Math.abs(wavelength) * .005),
      hint: ['อ่านข้อมูลจากบันทึกเดียวกัน จัดหน่วยความยาวให้ตรงกันก่อนแทนค่า แล้วแปลงผลเป็น nm', 'Use values from one record, convert the lengths to matching units and express the result in nm.'],
    }, {
      type:'number',unit:'nm',text:extra ? [
        `ทดลองเพิ่ม: เลือกชุด C ปรับ L = 2.0 m แล้ววัดและบันทึก ใช้บันทึก ${extra.id}: d = ${extra.config.slit} μm, L = ${extra.config.distance.toFixed(1)} m, Δx = ${extraWidth.toFixed(2)} mm คำนวณ λ จากผลวัดนี้`,
        `Extra trial: choose C, set L = 2.0 m, measure and record. Use trial ${extra.id}: d = ${extra.config.slit} μm, L = ${extra.config.distance.toFixed(1)} m, Δx = ${extraWidth.toFixed(2)} mm. Infer λ from these measurements.`
      ] : ['เลือกชุด C ปรับ L = 2.0 m แล้ววัดและบันทึก เพื่อสร้างโจทย์เพิ่มเติม','Choose C, set L = 2.0 m, measure and record to generate the extra question.'],
      answer:extra ? M.inferLambda(extra.config,extraWidth) : 0,tolerance:extra ? Math.max(1,Math.abs(M.inferLambda(extra.config,extraWidth))*.005) : 1,
      hint:['ใช้ λ ≈ dΔx/L จัดหน่วยเป็นเมตรก่อน แล้วแปลงคำตอบเป็น nm','Use λ ≈ dΔx/L with lengths in metres, then convert the answer to nm.']
    }];
  }
  function requirements(s){
    const id=s.missions.current,w=s.water,m=s.missions;
    if(id===0)return [[m.played[id],['กดเล่นคลื่น','Play the waves']],[w.phase===0&&Math.abs(w.x)<.001,['เฟส 0° และ P บนแนวกลาง','0° phase and P on centre line']]];
    if(id===1)return [[w.phase===180,['เปลี่ยนเป็น 180°','Set phase to 180°']],[w.layers.nodes,['เปิดแนวบัพ','Show nodal lines']],[Math.abs(w.x)<.001,['P บนแนวกลาง','P on centre line']],[m.played[id],['กดเล่นคลื่น','Play the waves']]];
    if(id===2)return [[w.layers.paths,['เปิดเส้นทาง r₁/r₂','Show r₁/r₂ paths']],[Math.abs(w.x)>.1,['ลาก P ออกจากกลาง หรือเลือก P ตัวอย่าง','Move P off centre or choose the example point']],
      [!!m.evidence.path||w.wavelength===2,['ตั้ง λ = 2 cm','Set λ = 2 cm']],
      [!!m.evidence.path||w.separation===8,['ตั้ง d = 8 cm','Set d = 8 cm']],
      [!!m.evidence.path||w.L===12,['ตั้ง L = 12 cm','Set L = 12 cm']],
      [!!m.evidence.path||w.phase===0,['ตั้งเฟส 0°','Set phase to 0°']],
      [!!m.evidence.path,['เลือก P ตัวอย่างหลังตั้งค่าครบ','Choose the example P after setting all values']]];
    if(id===3)return [[m.near,['ดูกรณีใกล้/มุมมาก','Inspect near/large-angle case']],[m.far,['ดูกรณีไกล/มุมเล็ก','Inspect far/small-angle case']],[!!m.evidence.approx,['ตั้ง d = 8, L = 60, x = 6 cm และเปิดสูตร','Set d = 8, L = 60, x = 6 cm and show formulas']]];
    if(id===4)return ['A','B','C'].map(key=>[Boolean(trialForPreset(s.records,key)),[`บันทึกชุด ${key} ที่เฟส 0°`,`Record set ${key} at 0°`]]);
    return [[s.records.length>0,['มีบันทึกผลการวัด','Have a measurement record']],[!!m.evidence.wavelength,['เลือก C ปรับ L = 2.0 m แล้ววัดและบันทึก','Choose C, set L = 2.0 m, measure and record']]];
  }
  function grade(s){const qs=questions(s.missions.current,s),answers=s.missions.answers[s.missions.current];return qs.map((q,i)=>{const a=answers['q'+i]??'';return q.type==='number'?a.trim()!==''&&Number.isFinite(Number(a))&&Math.abs(Number(a)-q.answer)<=q.tolerance:a===q.answer;});}
  function check(s) {
    const m=s.missions,id=m.current;
    if (!requirements(s).every(([done])=>done)) return false;
    capture(s);
    const qs=questions(id,s);
    if(qs.some((_,i)=>!(m.answers[id]['q'+i]||'').trim())) return false;
    const results=grade(s), items=qs.map((q,i)=>({text:q.text,answer:m.answers[id]['q'+i],unit:q.unit||''}));
    const checked={results:[...results],items};
    if (!m.firstChecks[id]) m.firstChecks[id]=structuredClone(checked);
    m.lastChecks[id]=structuredClone(checked);
    results.forEach((correct,i)=>{if(m.first[id][i]===null)m.first[id][i]=correct;m.mastered[id][i] ||= correct;});
    m.attempted[id]=true;
    if(results.every(Boolean)&&!m.completed.includes(id))m.completed.push(id);
    return true;
  }
  function scores(m) {
    const total=counts.reduce((a,b)=>a+b,0), first=m.first.flat(), mastered=m.mastered.flat();
    return {total,completed:m.completed.length,progress:m.completed.length/6*100,firstCorrect:first.filter(v=>v===true).length,firstChecked:first.filter(v=>v!==null).length,firstPercent:first.filter(v=>v===true).length/total*100,mastered:mastered.filter(Boolean).length,mastery:mastered.filter(Boolean).length/total*100};
  }
  globalThis.InterferenceMissions=Object.freeze({initial,valid,migrate,counts,titles,instructions,questions,requirements,grade,trialForPreset,observe,capture,check,scores});
})();
