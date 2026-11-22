// Each entry pairs the Thai and English wording. Both share the same blank IDs
// and the same answer indices, so the solution can be rendered from the banks.
const passages = [
  {
    id: 'A',
    title: ['จากบิวเรตสู่กราฟไทเทรต', 'From burette readings to the titration curve'],
    words: [
      ['จุดสมมูล', 'equivalence point'],
      ['การแตกตัวสมบูรณ์', 'complete dissociation'],
      ['จุดครึ่งสมมูล', 'half-equivalence point'],
      ['pKᵦ', 'pKᵦ'],
      ['ไฮโดรลิซิส', 'hydrolysis'],
      ['จุดยุติ', 'endpoint'],
      ['pKₐ', 'pKₐ'],
      ['ความจุบัฟเฟอร์', 'buffer capacity'],
      ['สารส่วนเกิน', 'excess reactant'],
      ['การเจือจาง', 'dilution'],
    ],
    sentences: [
      ['เลือกตัวที่มีช่วงเปลี่ยนสีอยู่ในส่วนชันใกล้จุดสมมูล',
        'Choose an indicator whose transition range lies in the steep region near equivalence.'],
      ['เลือกตัวที่เริ่มเปลี่ยนสีที่ pH 7 สำหรับทุกกราฟ',
        'Choose an indicator that starts to change colour at pH 7 for every curve.'],
      ['เลือกตัวที่เปลี่ยนสีตรง pH เริ่มต้นของสารในขวด',
        'Choose an indicator that changes colour at the initial pH in the flask.'],
      ['เลือกตัวที่มีช่วงเปลี่ยนสีกว้างที่สุด',
        'Choose the indicator with the widest transition range.'],
    ],
    answers: ['W06', 'W01', 'W05', 'W03', 'W07', 'S01'],
    text: [
      ['ในแล็บ นักเรียนเติม HCl จากบิวเรตลงในขวดที่มี NaOH แล้วหาปริมาตรที่ใช้จากผลต่างระหว่างค่าที่อ่านครั้งสุดท้ายกับค่าเริ่มต้น เมื่อ BTB เปลี่ยนเป็นสีเขียวคงตัว จุดที่สังเกตได้เรียกว่า {1} ส่วนจุดที่กรดกับเบสทำปฏิกิริยาพอดีตามเลขดุลเรียกว่า {2}',
        'In the lab, students deliver HCl from a burette into a flask containing NaOH. They subtract the initial burette reading from the final reading to find the volume delivered. The observed point at which BTB stays green is the {1}. The point at which the acid and base have reacted in their exact stoichiometric proportions is the {2}.'],
      ['เมื่อไทเทรตกรดแอซีติกด้วย NaOH ที่จุดสมมูล ไอออนแอซีเตตรับโปรตอนจากน้ำและเกิด OH⁻ กระบวนการนี้เรียกว่า {3} ที่ปริมาตร NaOH ครึ่งหนึ่งของปริมาตรที่จุดสมมูล เราอยู่ที่ {4} กรดแอซีติกและแอซีเตตมีความเข้มข้นใกล้กัน จึงอ่าน pH จากแกนตั้งเพื่อประมาณ {5} หากต้องเลือกอินดิเคเตอร์จากกราฟ ควรใช้หลักใด?',
        'When acetic acid is titrated with NaOH, at equivalence acetate ions accept protons from water and produce OH⁻. This process is called {3}. At half the equivalence volume of NaOH, we are at the {4}. The acetic acid and acetate concentrations are nearly equal, so the pH read from the vertical axis approximates {5}. Which rule should you use when choosing an indicator from the curve?'],
      ['{6}', '{6}'],
    ],
  },
  {
    id: 'B',
    title: ['จากผลวัด pH สู่การอธิบายบัฟเฟอร์', 'From pH measurements to explaining a buffer'],
    words: [
      ['H₂PO₄⁻', 'H₂PO₄⁻'],
      ['ความเข้มข้น (mol/L)', 'concentration (mol/L)'],
      ['คู่กรด–เบส', 'conjugate acid–base pair'],
      ['PO₄³⁻', 'PO₄³⁻'],
      ['ปริมาตร (mL)', 'volume (mL)'],
      ['HPO₄²⁻', 'HPO₄²⁻'],
      ['ปริมาณสาร (mmol)', 'amount of substance (mmol)'],
      ['กรดแก่', 'strong acid'],
      ['Cl⁻', 'Cl⁻'],
      ['อินดิเคเตอร์', 'indicator'],
    ],
    sentences: [
      ['นำปริมาณสารที่เหลือไปหารด้วยปริมาตรรวม แล้วใช้ความเข้มข้นตั้งตาราง ICE',
        'Divide the remaining amounts by the total volume, then use the concentrations in an ICE table.'],
      ['ในการทดลองนี้ B ต้านการเปลี่ยน pH ได้ดีกว่า A',
        'In this experiment, B resists changes in pH better than A.'],
      ['ใช้ปริมาณ HCl ที่เติมทั้งหมดเป็นปริมาณ H₃O⁺ ที่เหลือใน B',
        'Use the entire amount of HCl added as the amount of H₃O⁺ remaining in B.'],
      ['ในการทดลองนี้ B มี pH คงที่แม้เติมกรดต่อไปเท่าใดก็ตาม',
        'In this experiment, B keeps a constant pH regardless of how much more acid is added.'],
    ],
    answers: ['W03', 'W06', 'W01', 'W07', 'S02', 'S01'],
    text: [
      ['ในแล็บ ใบ A มี NaCl เจือจาง ส่วนใบ B มี H₂PO₄⁻ และ HPO₄²⁻ ไอออนสองชนิดในใบ B ต่างกันหนึ่งโปรตอน จึงเป็น {1} เมื่อเติม HCl ไอออนที่รับโปรตอนคือ {2} หากเริ่มใหม่จากบัฟเฟอร์เดิมแล้วเติม NaOH ไอออนที่ให้โปรตอนแก่ OH⁻ คือ {3}',
        'In the lab, beaker A contains dilute NaCl, while beaker B contains H₂PO₄⁻ and HPO₄²⁻. The two ions in B differ by one proton, so they form a {1}. When HCl is added, the ion that accepts a proton is {2}. If we start again with the original buffer and add NaOH, the ion that donates a proton to OH⁻ is {3}.'],
      ['เมื่อต้องคำนวณ pH ของใบ B หลังเติมกรด ให้เริ่มด้วยตาราง ICF โดยใช้ {4} เพื่อหาว่าสารแต่ละชนิดเหลือเท่าใด',
        'To calculate the pH of beaker B after adding acid, start with an ICF table using {4} to find how much of each species remains.'],
      ['เมื่อเติม HCl เท่ากันในสองใบ ถ้าขนาดการเปลี่ยน pH ของ B น้อยกว่าของ A ผลวัดนี้บอกอะไร? {5}',
        'When equal amounts of HCl are added to both beakers, what does it tell you if the magnitude of the pH change in B is smaller than in A? {5}'],
      ['ถ้าตาราง ICF แสดงว่ายังเหลือสมาชิกทั้งสองของคู่บัฟเฟอร์ จะคำนวณ pH ต่ออย่างไร? {6}',
        'If the ICF table shows that both members of the buffer pair remain, how do you continue to calculate the pH? {6}'],
    ],
  },
];

export function exitCloze({t, card, slot}) {
  const instruction = '<p>'+t('เลือกคำหรือประโยคเต็มจากคลัง แล้วเขียนลงในช่อง มีตัวลวง',
    'Choose a word or a complete sentence from the banks and write it in each blank. Some choices are distractors.')+'</p>';
  const code = (prefix, index) => prefix + String(index + 1).padStart(2, '0');
  const bank = (title, prefix, label, entries) =>
    `<div class="cloze-bank ${label}"><h3>${title}</h3><dl>${entries.map(([th,en], i)=>
      `<div><dt>${code(prefix, i)}</dt><dd>${t(th,en)}</dd></div>`).join('')}</dl></div>`;
  return passages.map(({id, title, words, sentences, answers, text}) => {
    const paragraph = filled => text.map(([th,en]) =>
      '<p>'+t(th,en).replace(/\{(\d)\}/g, (_, number)=>{
        const key = answers[number-1];
        if (!filled) {
          return `<span class="cloze-gap${key.startsWith('S') ? ' cloze-gap-wide' : ''}">${id}${number} <span aria-hidden="true"></span></span>`;
        }
        const [thai, english] = (key.startsWith('W') ? words : sentences)[Number(key.slice(1))-1];
        return '<strong>'+t(thai,english)+'</strong>';
      })+'</p>').join('');
    return card('cloze-'+id.toLowerCase(),
      t('บทความเติมคำ '+id+' · ', 'Cloze passage '+id+' · ')+t(...title),
      (id === 'A' ? instruction : '')+
      '<div class="cloze-banks">'+bank('Word Bank','W','cloze-words',words)+bank('Sentence Bank','S','cloze-sentences',sentences)+'</div>'+
      '<div class="cloze-reveal"><div class="cloze-blank">'+paragraph(false)+'</div>'+
      slot('cloze-'+id.toLowerCase(), {th:'เปิดเฉลยบทความ '+id,en:'Reveal passage '+id},
        paragraph(true), 8)+'</div>', {keepTogether:true});
  }).join('');
}
