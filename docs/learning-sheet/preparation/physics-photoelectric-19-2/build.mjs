// Generate the two static Hub documents from the same Classroom Note blocks.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';
import { addFormulaRecall, formulaRecallCSS } from '../numbered-formula-recall.mjs';
import { notebook, evidenceFiles } from './notes.mjs';
import { exitPractice, recall } from './practice.mjs';
import { pastExams } from './past-exams.mjs';
import '../../../../public/content/physics/ipst/atomic-physics/assets/photoelectric/model.js';

const css = readFileSync(new URL('paired.css', import.meta.url), 'utf8');
const worksheetPrintCSS = `
  html[data-hub-print-snapshot] .page { padding-block:11mm; }
  html[data-hub-print-snapshot] .running-head { border-bottom:1px solid #466279; line-height:1.35; }
  html[data-hub-print-snapshot] .page-foot { border-top:.6px solid #96a8b5; padding-top:2mm; line-height:1.4; }
`.trimEnd();
const exitWritingPrintCSS = `
  /* Questions 3–4 share a page in the blank edition. Reserve the full space for 4c. */
  html[data-hub-print-snapshot] [data-problem="3"] .writing,
  html[data-hub-print-snapshot] [data-problem="4"] .task:not(:last-child) .writing { height:20mm; }
`;
const output = new URL('../../../../public/content/physics/ipst/atomic-physics/', import.meta.url);
const classroomTheoryPages = 7;
const noteHash = createHash('sha256')
  .update(readFileSync(new URL('notes.mjs', import.meta.url)))
  .update(readFileSync(new URL('figures.mjs', import.meta.url)));
for (const file of evidenceFiles) noteHash.update(readFileSync(new URL('assets/' + file, import.meta.url)));
const notesDigest = noteHash.digest('hex');

function page(body, th, filled, part, title, first, number, total) {
  const label = th ? 'ปรากฏการณ์โฟโตอิเล็กทริก' : 'Photoelectric Effect';
  const answerLabel = filled ? (th ? 'เฉลย' : 'Answers') : (th ? 'เรียนรู้ / ลงมือทำ' : 'Learn / practise');
  const nameLine = `<p class="identity">${th?'ชื่อ':'Name'} <span class="name-space"></span> ${th?'ห้อง':'Class'} <span class="class-space"></span></p>`;
  return `<section class="page ${part==='Exit Ticket'||part==='Knowledge Recall'?'quiz':'review'}"><header class="running-head"><span>PHYSICS · 19.2 · ${label}</span><span>${part} · ${part==='Revision Notes'?(th?'อ่านทบทวน':'Read and revise'):answerLabel}</span></header><div class="page-body">${first?`<h1>${title} · 19.2</h1>${nameLine}`:''}${body}</div><footer class="page-foot"><span>Nix-century</span><span data-page-number>${th?'หน้า':'Page'} ${number} / ${total}</span></footer></section>\n`;
}
const formulaCues = [
  ['พลังงานต่อโฟตอน','Energy per photon'],
  ['พลังงานจลน์สูงสุดจากพลังงานโฟตอนและฟังก์ชันงาน','Maximum kinetic energy from photon energy and work function'],
  ['ฟังก์ชันงานจากความถี่ขีดเริ่ม','Work function from threshold frequency'],
  ['พลังงานจลน์สูงสุดจากศักย์หยุดยั้ง','Maximum kinetic energy from stopping potential'],
  ['กราฟศักย์หยุดยั้งเทียบกับความถี่','Stopping potential versus frequency'],
  ['พลังงานจลน์สูงสุดกับอัตราเร็วสูงสุด','Maximum kinetic energy and maximum speed'],
  ['พลังงานแสงรวมจากความเข้ม พื้นที่ และเวลา','Total light energy from irradiance, area and time'],
  ['จำนวนโฟตอนจากพลังงานรวม','Photon count from total energy'],
];
function classroomRecall(markup, lang) {
  if (!markup.includes('data-equation=')) return markup;
  const { document } = parseHTML('<html><body>' + markup + '</body></html>');
  addFormulaRecall(document, lang, formulaCues);
  return document.body.innerHTML;
}

function writeDocument(kind) {
  const classroom = kind === 'classroom';
  const title = classroom ? 'Classroom Note' : 'Exit Ticket Revision';
  const langSets = ['th','en'].map(lang => {
    const th = lang==='th';
    const editions = ['blank','answers'].map(edition=>{
      const filled = edition==='answers';
      const notePage = text => [classroom ? classroomRecall(text, lang) : text, classroom ? 'Classroom Note' : 'Revision Notes'];
      const quizPage = text => [text,'Exit Ticket'];
      const notes = notebook(th, !classroom || filled, globalThis.Photoelectric).map(notePage);
      const practice = classroom ? [] : exitPractice(th,filled);
      // Keep previously published problem numbers and present the past exams as 7–9.
      const quiz = classroom ? [] : [...practice.slice(0,-1), ...pastExams(th,filled), practice.at(-1)].map(quizPage);
      const knowledgeRecall = classroom ? [] : [[recall(th,filled),'Knowledge Recall']];
      const groups = {
        all:[...quiz,...notes,...knowledgeRecall],
        quiz:classroom ? notes.slice(classroomTheoryPages) : quiz,
        review:classroom ? notes.slice(0,classroomTheoryPages) : notes,
        ...(!classroom ? {recall:knowledgeRecall} : {}),
      };
      return `<div data-revision-edition="${edition}">`+Object.entries(groups).map(([range,items])=>
        `<div class="document-shell" data-revision-range="${range}">${items.map(([body,part],i)=>page(body,th,filled,part,range==='recall'?'Knowledge Recall':range==='review'&&!classroom?'Revision Notes':title,i===0,i+1,items.length)).join('')}</div>`).join('')+'</div>';
    }).join('');
    return `<section class="language-view" data-content-lang="${lang}" lang="${lang}"${th?'':' hidden'}>${editions}</section>`;
  }).join('');

  const labels = [
    `data-revision-label-th="${title}" data-revision-label-en="${title}"`,
    classroom
      ? 'data-revision-quiz-th="เฉพาะตัวอย่างพาทำ" data-revision-quiz-en="Guided examples" data-revision-review-th="ทฤษฎีและการทดลอง" data-revision-review-en="Theory and experiment"'
      : 'data-revision-quiz-th="บทความและโจทย์" data-revision-quiz-en="Reading and questions" data-revision-review-th="Classroom Note ฉบับเฉลย" data-revision-review-en="Classroom Note with answers"',
  ].join(' ');
  const html = `<!doctype html>
<html lang="th" data-learning-html data-exit-ticket-revision="1" data-exit-ticket-editions="1"
  data-exit-ticket-ranges="all quiz review${classroom ? '' : ' recall'}" data-revision-student-default="1" data-revision-topic="19.2"
  data-content-revision="1.9" data-shared-notes-sha256="${notesDigest}"
  data-print-subject-th="ฟิสิกส์" data-print-subject-en="Physics"
  data-print-chapter-th="ฟิสิกส์อะตอม" data-print-chapter-en="Atomic physics"
  data-print-topic-th="19.2 ปรากฏการณ์โฟโตอิเล็กทริก" data-print-topic-en="19.2 Photoelectric effect" ${labels}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Physics 19.2 · ${title}</title><style>\n${css}${worksheetPrintCSS}${classroom ? formulaRecallCSS : exitWritingPrintCSS}</style></head>
<body><main>${langSets}</main></body>
</html>
`;
  writeFileSync(new URL(`19-2-photoelectric-${classroom?'classroom-note':'exit-ticket-revision'}.html`, output),html.replace(/[ \t]+$/gm, ""));
}
writeDocument('classroom');
writeDocument('exit');
