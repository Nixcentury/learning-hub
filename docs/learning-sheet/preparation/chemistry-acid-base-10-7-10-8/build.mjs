import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { alignedMath } from '../aligned-math.mjs';
import { classroom } from './classroom.mjs';
import { exitCloze } from './cloze.mjs';
import { exitProblems } from './exit.mjs';
import { examProblems } from './exams.mjs';

const revision = '2026-11-22-4';
const out = new URL('../../../../public/content/chemistry/ipst/acid-base/', import.meta.url);
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const pair = (th, en) => ({th, en});
const css = `
  body { background:#e9edf2; color:#172b3c; font:10pt/1.45 "Noto Sans Thai",Tahoma,Arial,sans-serif; margin:0; }
  main { width:min(210mm, calc(100% - 20px)); box-sizing:border-box; margin:10px auto; padding:10mm 12mm 8mm; background:white; box-shadow:0 2px 8px #263b502b; }
  .lesson, .opening { margin:0 0 4mm; }
  .running-head { display:flex; flex-wrap:wrap; justify-content:space-between; gap:2mm 4mm; color:#445c6c; font-size:8pt; border-bottom:.4pt solid #8296a5; padding-bottom:2mm; margin-bottom:3mm; }
  .identity { display:flex; gap:2mm; align-items:baseline; margin:1mm 0 3mm; font-size:8pt; }
  .name-space, .class-space { display:inline-block; border-bottom:.4pt solid #8996a3; }
  .name-space { width:min(96mm,52%); }
  .class-space { width:min(23mm,18%); }
  h1,h2 { color:#193f55; line-height:1.3; margin:0 0 .5em; }
  h1,h2 { font-size:11pt; }
  p { margin:.35em 0 .55em; }
  .task { margin:.6em 0 .85em; }
  .prompt { font-weight:700; } .source { font-size:.9em; }
  .result-slot { font-size:.9em; }
  .result-print { display:none; }
  .callout { border-inline-start:1.2pt solid #7895a9; background:#edf2f6; padding:.35em .7em; }
  .eq { display:flex; align-items:center; gap:.5em; justify-content:space-between; flex-wrap:wrap; }
  .eq-number { text-align:end; }
  .worked-equations { margin:.45em 0 .65em; overflow-x:auto; }
  .worked-equations [data-hub-math="display"] { text-align:left; margin:0; padding:.15em 0; }
  .formula-row { display:grid; grid-template-columns:minmax(0,1fr) max-content; gap:.55rem; align-items:center; border:.65pt solid #758fa4; margin:2mm 0 3mm; padding:0 2mm; }
  [data-sheet-slot] { margin-block:.36em; }
  .lab-figures { display:grid; grid-template-columns:1fr 2fr; gap:12px; align-items:center; }
  figure { margin:8px 0; } figure img,figure svg { display:block; max-width:100%; height:auto; }
  .lab-figures img { max-height:145px; object-fit:contain; }
  figcaption { font-size:.9em; margin-top:3px; }
  .graph svg { width:min(100%,510px); }
  .graph text { font:15px Tahoma,Arial,sans-serif; fill:#172c28; }
  .graph .caption { font-size:17px; }
  table { border-collapse:collapse; width:100%; margin:.55em 0; }
  td,th { border-bottom:.45pt solid #aebbc5; text-align:left; padding:.65mm 1.5mm; overflow-wrap:anywhere; }
  th { background:#edf2f6; }
  td { height:1.25em; }
  a { color:#204f75; }
  @media(max-width:560px) { main {padding:4mm; width:calc(100% - 8px); margin:4px auto} .lab-figures {grid-template-columns:1fr} td,th {padding:.2em} }
  html[data-hub-print-snapshot] body { background:white; font-size:10pt; line-height:1.4; }
  html[data-hub-print-snapshot] main { width:auto; max-width:none; margin:0; padding:0; box-shadow:none; }
  html[data-hub-print-snapshot] .lesson, html[data-hub-print-snapshot] .opening { border:0; border-radius:0; margin:0 0 4mm; padding:0; }
  html[data-hub-print-snapshot] h2 { font-size:13pt; border-block-end:.4pt solid #8296a5; padding-block-end:1mm; }
  html[data-hub-print-snapshot] .graph svg { width:113mm; }
  html[data-hub-print-snapshot] .result-slot { display:none; }
  html[data-hub-print-snapshot][data-sheet-print-edition="answers"] .result-print,
  html[data-hub-print-snapshot][data-sheet-print-edition="blank"] .result-print[data-self-check] {
    display:block; font-size:.88em; margin:.2em 0;
  }
`;
const clozeCSS = `
  .cloze-banks { display:grid; grid-template-columns: minmax(0,2fr) minmax(0,3fr); gap:3mm; border-block:.4pt solid #8296a5; padding:1.4mm 0; margin:1mm 0 2.5mm; }
  .cloze-bank h3 { margin:0 0 .35em; color:#193f55; font-size:11pt; }
  .cloze-bank dl, .cloze-bank dd { margin:0; }
  .cloze-words dl { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.3em .8em; }
  .cloze-bank dl > div { display:grid; grid-template-columns:max-content minmax(0,1fr); gap:.35em; }
  .cloze-bank dt { color:#445c6c; font-weight:700; }
  .cloze-sentences dl > div + div { margin-top:.35em; }
  .cloze-gap { display:inline-flex; vertical-align:baseline; align-items:baseline; gap:.4em; color:#445c6c; }
  .cloze-gap > span { display:inline-block; width:30mm; border-bottom:.45pt solid #8296a5; }
  .cloze-gap-wide { display:flex; min-height:7mm; align-items:end; }
  .cloze-gap-wide > span { flex:1; }
  .cloze-blank { display:none; }
  html[data-hub-sheet-ready] .cloze-reveal:has([data-hub-sheet-open="false"]) .cloze-blank,
  html[data-sheet-print-edition="blank"] .cloze-blank { display:block; }
  .cloze-reveal [data-hub-sheet-open="false"] > [data-sheet-answer],
  html[data-sheet-print-edition="blank"] .cloze-reveal > [data-sheet-slot] { display:none; }
  @media(max-width:560px) { .cloze-banks { grid-template-columns:minmax(0,1fr); } }
  html[data-hub-print-snapshot] .cloze-banks { grid-template-columns:minmax(0,2fr) minmax(0,3fr); padding:1mm 0; margin:1mm 0 1.5mm; }
  html[data-hub-print-snapshot] .cloze-banks h3,
  html[data-hub-print-snapshot] .opening h1,
  html[data-hub-print-snapshot] [data-print-zone="problem"] h2 { font-size:11pt; }
  html[data-hub-print-snapshot] .opening .running-head { display:none; }
  html[data-hub-print-snapshot] [data-guide-anchor^="cloze-"] { margin-bottom:2.5mm; }
  html[data-hub-print-snapshot] .cloze-reveal p { margin:.25em 0 .4em; }
  html[data-hub-print-snapshot] [data-print-zone="problem"] .task { margin:.4em 0 .6em; }
`;

function pH(volume, sample, constant, weakBase) {
  const total = sample + volume;
  const analyte = 0.100 * sample / total;
  const titrant = 0.100 * volume / total;
  const acidKa = weakBase ? 1e-14 / constant : constant;
  let minimum = 0, maximum = 14;
  // Charge balance includes water and the salt ion throughout the curve.
  for (let step = 0; step < 48; step++) {
    const position = (minimum + maximum) / 2;
    const h = 10 ** -position;
    const difference = weakBase
      ? h + analyte * h / (h + acidKa) - 1e-14 / h - titrant
      : h + titrant - 1e-14 / h - analyte * acidKa / (h + acidKa);
    if (difference > 0) minimum = position;
    else maximum = position;
  }
  return (minimum + maximum) / 2;
}

function toolkit(lang) {
  const t = (th, en) => lang === 'th' ? th : en;
  const card = (key, title, content, { keepTogether = false, keepTogetherBlank = false } = {}) =>
    `<section class="lesson" data-guide-anchor="${key}"${keepTogether ? ' data-print-keep' : ''}${keepTogetherBlank ? ' data-print-keep-blank' : ''}><h2>${title}</h2>${content}</section>`;
  const slot = (id, label, content, height, revisionNote = false, placeholder = '') => revisionNote
    ? `<div class="fully-worked">${content}</div>`
    : `<div data-sheet-slot="${id}" data-sheet-size="small" data-sheet-layout="block" data-sheet-label-th="${escape(label?.th ?? 'เปิดวิธีทำ')}" data-sheet-label-en="${escape(label?.en ?? 'Reveal worked solution')}" style="--sheet-print-height:${height}mm"><div data-sheet-answer>${content}</div>${placeholder ? '<div data-sheet-placeholder>'+placeholder+'</div>' : ''}</div>`;
  const eq = tex => `<p class="eq">\\(${tex}\\)</p>`;
  const work = (intro, rows, conclusion) => `<p>${intro}</p>${alignedMath(rows)}${conclusion ? '<p>'+conclusion+'</p>' : ''}`;
  const task = (id, prompt, answer, {height = 18, result, revision: revisionNote, printResult = true} = {}) => {
    const check = t('ตรวจคำตอบ','Check Answer');
    const resultControl = result && !revisionNote
      ? `<div class="result-slot"><span>${check}</span>${slot(id+'-check',pair('ตรวจคำตอบสุดท้าย','Check the final answer'),result,7)}</div><p class="result-print"${printResult ? ' data-self-check' : ''}>${check} · ${result}</p>`
      : '';
    return `<div class="task" data-print-keep><p class="prompt">${prompt}</p>${resultControl}${slot(id,null,answer.startsWith('<p>') ? answer : '<p>'+answer+'</p>',height,revisionNote)}</div>`;
  };
  const labImage = (name, caption) => `<figure><img src="assets/lab-guide/${name}.png" alt="${escape(caption)}"><figcaption>${caption}</figcaption></figure>`;
  const table = (headers, rows) => `<table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([name,...values])=>`<tr><th scope="row">${name}</th>${values.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const link = (url, title) => `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`;
  const graph = type => {
    const weakBase = type === 'base';
    const comparison = type === 'comparison';
    const sample = type === 'acid20' ? 20 : (comparison ? 10 : 25);
    const max = comparison ? 15 : 35;
    const x = v => 59 + v/max*474;
    const y = p => 242 - p/14*205;
    const format = value => value.toFixed(2);
    const volumes = Array.from({length:max*8+1},(_,i)=>i/8);
    volumes.push(sample-.10,sample-.01,sample+.01,sample+.10);
    volumes.sort((a,b)=>a-b);
    const line = (constant, stroke, dash='') => `<polyline fill="none" stroke="${stroke}" stroke-width="2.7" ${dash ? 'stroke-dasharray="'+dash+'"' : ''} points="${volumes.map(v=>format(x(v))+','+format(y(pH(v,sample,constant,weakBase)))).join(' ')}"/>`;
    const caption = weakBase ? t('แบบจำลอง NH₃–HCl','NH₃–HCl model') : comparison
      ? t('ตัวอย่างเปรียบเทียบ HX (เส้นทึบ) และ HY (เส้นประ)','Comparison model: HX (solid) and HY (dashed)')
      : t('แบบจำลอง CH₃COOH–NaOH','CH₃COOH–NaOH model');
    const constant = comparison ? 1.8e-6 : 1.8e-5;
    const label = t(`ปริมาตร ${weakBase?'HCl':'NaOH'} ที่เติม (mL)`, `Added ${weakBase?'HCl':'NaOH'} (mL)`);
    const grids = Array.from({length:8},(_,i)=>`<path d="M59 ${y(i*2)}H533" stroke="#cfdfd9"/><text x="50" y="${y(i*2)+5}" text-anchor="end">${i*2}</text>`).join('');
    const ticks = Array.from({length:max/5+1},(_,i)=>`<text y="263" x="${x(i*5)}" text-anchor="middle">${i*5}</text>`).join('');
    return `<figure class="graph"><svg viewBox="0 0 558 300" role="img" aria-label="${escape(caption)}">
      <text x="21" y="25" class="caption">pH</text>${grids}${ticks}
      <path d="M59 35V242H533" fill="none" stroke="#203c36"/>
      ${line(constant,'#00665a')}${comparison ? line(1.8e-4,'#864508','7 5') : ''}
      <text x="296" y="288" class="caption" text-anchor="middle">${label}</text>
      </svg><figcaption>${caption}</figcaption></figure>`;
  };
  return {t, eq, work, slot, task, card, table, labImage, graph, link};
}

const data = {
  classroom: {name:pair('Classroom Note · ไทเทรตและบัฟเฟอร์','Classroom Note · Titration and buffers'), contentId:'chemistry-ipst-acid-base-10-7-10-8-classroom-note'},
  exit: {name:pair('Exit Ticket Revision · ไทเทรตและบัฟเฟอร์','Exit Ticket Revision · Titration and buffers'), contentId:'chemistry-ipst-acid-base-10-7-10-8-exit-ticket-revision'},
};
const stem = '10-7-10-8-acid-base';
function render(kind) {
  const isExit = kind === 'exit';
  const contentRevision = isExit ? '2026-11-22-5' : revision;
  const {name} = data[kind];
  const suffix = isExit ? 'exit-ticket-revision' : 'classroom-note';
  const hub = '../../../../#chemistry/bank/buffer-solutions/';
  const body = ['th','en'].map(lang=>{
    const kit = toolkit(lang);
    const {t, link} = kit;
    const kindLabel = isExit ? 'Exit Ticket Revision' : 'Classroom Note';
    const runningHead = `<div class="running-head"${isExit ? '' : ' data-no-print'}><span>CHEMISTRY · 10.7–10.8 · ${t('ไทเทรตและบัฟเฟอร์','Titration and buffers')}</span><span>${kindLabel} · ${t('ลงมือทำ','Practice')}</span></div>`;
    const identity = `<p class="identity">${t('ชื่อ','Name')} <span class="name-space" aria-hidden="true"></span> ${t('ห้อง','Class')} <span class="class-space" aria-hidden="true"></span></p>`;
    const notesLink = isExit ? ` · <a href="#${lang}-revision">${t('ไปสรุปทบทวน','Jump to Revision Notes')}</a>` : '';
    const heading = `<header class="opening">${runningHead}<h1>${kindLabel} · 10.7–10.8</h1>${identity}<nav class="no-print">${link(hub+'lab-guide',t('คู่มือแล็บ','Lab Guide'))} · ${link(hub+(isExit?'classroom-note':'exit-ticket-revision'),isExit?'Classroom Note':'Exit Ticket Revision')}${notesLink}</nav></header>`;
    const sections = isExit
      ? `<div id="${lang}-practice" data-print-zone="problem">${exitCloze(kit)}${exitProblems(kit)}${examProblems(kit)}</div>
<section id="${lang}-revision" data-print-zone="learning"><h2>${t('สรุปทบทวน','Revision Notes')}</h2><p class="no-print"><a href="#${lang}-practice">${t('กลับไปส่วนโจทย์','Back to practice')}</a></p>${classroom(kit,true)}</section>`
      : classroom(kit,false);
    return `<div data-content-lang="${lang}" lang="${lang}">${heading}${sections}</div>`;
  }).join('\n');
  const html = `<!doctype html>
<html lang="th" data-learning-html data-learning-sheet="1" data-sheet-answer-toolbar="window" data-print-blank-sizing="preset"
  data-print-page-style="paired-worksheet" data-print-section="10.7–10.8"
  data-sheet-guide="guides/${stem}-${suffix}.guide.json" data-sheet-revision="${contentRevision}"
  data-print-subject-th="เคมี ม.5" data-print-subject-en="Grade 11 Chemistry" data-print-chapter-th="กรด–เบส" data-print-chapter-en="Acids and bases"
  data-print-topic-th="ไทเทรต ไฮโดรลิซิส และบัฟเฟอร์" data-print-topic-en="Titration, hydrolysis and buffers"
  data-print-work-th="${isExit?'Exit Ticket Revision':'Classroom Note'}" data-print-work-en="${isExit?'Exit Ticket Revision':'Classroom Note'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name.th} | ${name.en}</title><link rel="stylesheet" href="../../../../shared/learning-sheet.css"><style>${css}${isExit ? clozeCSS : ''}</style></head>
<body><main>${body}</main></body>
</html>
`;
  writeFileSync(new URL(stem+'-'+suffix+'.html',out),html);
  writeFileSync(new URL('guides/'+stem+'-'+suffix+'.guide.json',out), JSON.stringify(makeGuide(kind,html,contentRevision),null,2)+'\n');
}

function step(id,key,th,en,summary,story,action,question,answer,after) {
  return {id,title:pair(th,en),summary,story,action,
    links:[{label:pair(th,en),target:{kind:'anchor',key}}],
    check:{question,answer},after};
}
const classSteps = [
  step('lab','lab-results','เก็บค่าจากแล็บจริง','Use your lab data',
    pair('ไทเทรตจดบิวเรตเริ่มและสุดท้าย\nบัฟเฟอร์จด pH ที่ 0.00, 0.25 และ 0.50 mL','Record initial and final burette readings.\nRecord buffer readings at 0.00, 0.25 and 0.50 mL.'),
    pair('ชี้สารในบิวเรตและขวดจากรูป','Use the image to locate the burette and flask solutions.'),
    pair('เติมตารางผลจริงของกลุ่ม','Complete both tables using your group data.'),
    pair('สองแล็บวัดค่าใดต่างกัน?','What differs between the measurements in the two labs?'),
    pair('ไทเทรตใช้ปริมาตร ส่วนแล็บบัฟเฟอร์ใช้ pH','Titration uses a volume and the buffer lab uses pH.'),
    pair('นำค่าบิวเรตไปทำตัวอย่าง 1','Use the burette readings in Example 1.')),
  step('titration','example-1','คำนวณจากบิวเรต','Calculate from burette readings',
    pair('ปริมาตรที่ใช้เท่ากับค่าสุดท้ายลบค่าเริ่มต้น\nใช้ mmol และสัมประสิทธิ์จากสมการดุล','Delivered volume is final minus initial.\nUse mmol and the balanced coefficients.'),
    pair('เทียบสีที่เห็นกับการสะเทินพอดี','Relate the observed colour to stoichiometric equivalence.'),
    pair('หาความเข้มข้นและทวนโจทย์ 1:2','Find the concentration and work through a 1:2 example.'),
    pair('เติมน้ำหลังปิเปต โมลในขวดเปลี่ยนไหม?','Does adding water after pipetting change the amount in the flask?'),
    pair('โมลคงเดิม แต่ความเข้มข้นเปลี่ยน','The amount is unchanged but concentration changes.'),
    pair('ต่อไปดูสารที่เหลือหลัง ICF','Next identify what remains after ICF.')),
  step('cases','example-2','แยกกรณีจากแถว F','Decide the case from row F',
    pair('กรด–เบสแก่เหลือให้ใช้โมลส่วนเกิน\nที่สมมูลของกรดอ่อนหรือเบสอ่อนให้ตรวจสมดุลเกลือ','Use excess mmol for residual strong acid or base.\nAt equivalence with a weak reagent, check salt equilibrium.'),
    pair('ใช้ขวดหลายใบที่เปลี่ยนเฉพาะปริมาตร','Compare flasks differing only in the volume added.'),
    pair('ทำตัวอย่าง 2–5 และบอกสารที่คุม pH','Solve Examples 2–5 and name the species controlling pH.'),
    pair('เมื่อ CH₃COOH กับ NaOH พอดี ไอออนใดไฮโดรลิซิส?','At equivalence for CH₃COOH and NaOH, which ion hydrolyses?'),
    pair('CH₃COO⁻ รับโปรตอนจากน้ำและเกิด OH⁻','CH₃COO⁻ accepts a proton from water and produces OH⁻.'),
    pair('กลับไปอธิบายบัฟเฟอร์ที่วัด','Return to the buffer data.')),
  step('buffer','example-6','เทียบผลวัดกับแบบจำลอง','Compare experimental and model pH',
    pair('คำนวณ |ΔpH| จากสองแถวที่วัด\nใช้ ICF แล้ว ICE กับ B เพื่อหา pH ก่อนและหลังเติม','Calculate |ΔpH| from two measured rows.\nUse ICF and ICE to predict B before and after addition.'),
    pair('สังเกตว่าเมื่อเติม HCl เท่ากัน B เปลี่ยนเพียงเล็กน้อยในข้อมูลตัวอย่าง','Notice how B changes little under equal HCl addition in the example.'),
    pair('ใช้ผลกลุ่มและยกตัวเลขสองค่าเป็นหลักฐาน','Cite both values from your group.'),
    pair('ใน B ไอออนใดรับกรด?','Which ion in B takes up added acid?'),
    pair('HPO₄²⁻ เปลี่ยนเป็น H₂PO₄⁻','HPO₄²⁻ becomes H₂PO₄⁻.'),
    pair('ต่อไปใช้แถว F อธิบายกราฟ','Use row F to explain the curves next.')),
  step('curves','example-7','อ่านกราฟและอินดิเคเตอร์','Curves and indicators',
    pair('อ่าน V ที่สมมูลจากแกนนอน แล้วหารสอง\nใช้ช่วงชันรอบสมมูลเลือกอินดิเคเตอร์','Read equivalence volume on the x-axis, then halve it.\nUse the steep region near equivalence to select an indicator.'),
    pair('เทียบกราฟขึ้น กราฟลง และกราฟกรดสองเส้น','Compare a rising curve, a falling curve, and two acid curves.'),
    pair('ตอบจากแกนและช่วงสีที่โจทย์ให้','Use the axes and stated colour interval.'),
    pair('ที่ครึ่งสมมูลของกรดอ่อนโมโนโพรติก เหตุใด pH ≈ pKₐ?','Why is pH ≈ pKₐ at half-equivalence for a weak monoprotic acid?'),
    pair('ความเข้มข้นกรดอ่อนและเบสคู่กรดใกล้กัน','The acid and conjugate base concentrations are nearly equal.'),
    pair('พร้อมลอง Exit Ticket Revision','Continue to Exit Ticket Revision.')),
];
const exitSteps = [
  step('review','lab-results','ทวนจาก Classroom Note','Review the Classroom Note',
    pair('อ่านเฉลย Classroom Note ฉบับเต็ม\nทวน ICF, ICE และการเลือกวิธีจากสารที่เหลือ','Read the complete Classroom Note solutions.\nReview ICF, ICE and method selection.'),
    pair('ใช้เลขสมการเดิมตามกลับไปที่ตัวอย่าง','Use the original equation numbering to revisit examples.'),
    pair('ทวนเฉพาะส่วนที่ยังติด','Review the steps you are unsure about.'),
    pair('ต้องใช้หน่วยใดใน ICF และ ICE?','Which units are used for ICF and ICE?'),
    pair('ICF ใช้ mmol และ ICE ใช้ mol/L ในใบนี้','Use mmol for ICF and mol/L for ICE in this worksheet.'),
    pair('เริ่มบทความเติมคำ A และ B','Start cloze passages A and B.')),
  step('cloze','cloze-a','เติมคำจากแล็บไทเทรตและบัฟเฟอร์','Complete the titration and buffer passages',
    pair('เลือกคำและประโยคจากคลังของแต่ละบท\nใช้ความหมายและผลแล็บช่วยตัดตัวลวง','Choose words and sentences from each passage’s banks.\nUse lab observations and chemical meaning to rule out distractors.'),
    pair('อ่านจากสิ่งที่เห็นในแล็บไปถึงกราฟและการคำนวณ pH','Read from the lab observations through to the curve and pH calculation.'),
    pair('เติมบทความ A และ B ก่อนเปิดเฉลย','Complete passages A and B before revealing their answers.'),
    pair('จุดที่เห็นอินดิเคเตอร์เปลี่ยนสีเรียกว่าอะไร?','What is the point at which you observe the indicator change colour?'),
    pair('จุดยุติ','The endpoint.'),
    pair('ลองทำข้อ 1–7','Attempt questions 1–7.')),
  step('practice','exit-start','ลงมือทำโจทย์ใหม่','Solve the new problems',
    pair('เลือกวิธีจากแถว F\nใช้ Check Answer หลังลองทำ','Choose from row F.\nUse Check Answer after attempting each problem.'),
    pair('แยกจุดที่เลือกวิธีพลาดจากจุดที่คำนวณพลาด','Distinguish method-selection errors from calculation errors.'),
    pair('ใช้ผลตรวจแล้วกลับไปแก้ทีละข้อ','Use the check and revise one problem at a time.'),
    pair('เมื่อบัฟเฟอร์หมดให้ดูอะไร?','What do you examine when the buffer is depleted?'),
    pair('เริ่มที่สารเหลือในแถว F','Start with the species remaining in row F.'),
    pair('ต่อด้วยโจทย์แนวท้ายบท สสวท.','Move to IPST-style practice.')),
  step('exam','exam-start','ลองข้อสอบย้อนหลัง','Attempt past exam questions',
    pair('เปิดฉบับอ้างอิงก่อนตอบ\nตรวจตัวเลือก ตัวเลข และกราฟจากแหล่งที่ลิงก์ไว้','Open the cited paper before answering.\nCheck its choices, numbers and figures there.'),
    pair('จับคู่ข้อสอบกับตัวอย่างที่ใช้หลักเดียวกัน','Match each exam question to an example using the same principle.'),
    pair('ลองตอบแล้วเปิดวิธีทำทีละข้อ','Attempt the question, then reveal its solution.'),
    pair('ถ้าอัตราส่วนไม่ใช่ 1:1 ให้ดูจากไหน?','Where do you find the ratio if it is not 1:1?'),
    pair('ใช้สัมประสิทธิ์ในสมการดุล','Use coefficients from the balanced equation.'),
    pair('ทวน Knowledge Recall ท้ายใบ','Finish with Knowledge Recall.')),
];

function makeGuide(kind, html, contentRevision) {
  const exit = kind === 'exit';
  return {
    schemaVersion:1,
    source:{contentId:data[kind].contentId,revision:contentRevision,sha256:createHash('sha256').update(html).digest('hex')},
    title:data[kind].name,
    prerequisites:pair('ทวน mol/L, pH และคู่กรด–เบส','Review mol/L, pH and conjugate acid–base pairs.'),
    goal:pair('ใช้ผลแล็บและสารที่เหลือเลือกรูปแบบการคำนวณ pH','Use lab data and remaining species to choose a pH calculation.'),
    steps:exit ? exitSteps : classSteps,
    finish:pair('บอกด้วยข้อมูลว่าอะไรควบคุม pH ในกรณีนั้น','Use the evidence to identify what controls pH in each case.'),
    exitCheck:{
      question:pair('เมื่อผสมกรดกับเบส ขั้นใดมาก่อนสมดุล?','When mixing acid and base, what comes before equilibrium?'),
      answer:pair('ดุลสมการและใช้ ICF หาสารที่เหลือ สำหรับคู่ที่ทำปฏิกิริยาเกือบสมบูรณ์','Balance the equation and use ICF for reactions that go essentially to completion.'),
    },
  };
}

render('classroom');
render('exit');
