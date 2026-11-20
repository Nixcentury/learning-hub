// Generate the two static Hub documents from the same Classroom Note blocks.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { notebook } from './notes.mjs';
import { exitPractice, recall } from './practice.mjs';
import { pastExams } from './past-exams.mjs';
import '../../../../public/content/physics/ipst/atomic-physics/assets/photoelectric/model.js';

const css = readFileSync(new URL('paired.css', import.meta.url), 'utf8');
const output = new URL('../../../../public/content/physics/ipst/atomic-physics/', import.meta.url);
const noteHash = createHash('sha256')
  .update(readFileSync(new URL('notes.mjs', import.meta.url)))
  .update(readFileSync(new URL('figures.mjs', import.meta.url))).digest('hex');

function page(body, th, filled, part, title, first, number, total) {
  const label = th ? 'ปรากฏการณ์โฟโตอิเล็กทริก' : 'Photoelectric Effect';
  const answerLabel = filled ? (th ? 'เฉลย' : 'Answers') : (th ? 'ลงมือทำ' : 'Practise');
  const nameLine = `<p class="identity">${th?'ชื่อ':'Name'} <span class="name-space"></span> ${th?'ห้อง':'Class'} <span class="class-space"></span></p>`;
  return `<section class="page ${part==='Exit Ticket'?'quiz':'review'}"><header class="running-head"><span>PHYSICS · 19.2 · ${label}</span><span>${part} · ${part==='Revision Notes'?(th?'อ่านทบทวน':'Read and revise'):answerLabel}</span></header><div class="page-body">${first?`<h1>${title} · 19.2</h1>${nameLine}`:''}${body}</div><footer class="page-foot"><span>Learning Hub</span><span data-page-number>${th?'หน้า':'Page'} ${number} / ${total}</span></footer></section>\n`;
}
function writeDocument(kind) {
  const classroom = kind === 'classroom';
  const title = classroom ? 'Classroom Note' : 'Exit Ticket Revision';
  const langSets = ['th','en'].map(lang => {
    const th = lang==='th';
    const editions = ['blank','answers'].map(edition=>{
      const filled = edition==='answers';
      const notePage = text => [text, classroom ? 'Classroom Note' : 'Revision Notes'];
      const quizPage = text => [text,'Exit Ticket'];
      const notes = notebook(th, !classroom || filled, globalThis.Photoelectric).map(notePage);
      const practice = classroom ? [] : [...exitPractice(th,filled), ...pastExams(th,filled)].map(quizPage);
      const knowledgeRecall = classroom ? [] : [quizPage(recall(th,filled))];
      const groups = {
        all:[...practice,...notes,...knowledgeRecall],
        quiz:classroom ? notes.slice(6) : [...practice,...knowledgeRecall],
        review:classroom ? notes.slice(0,6) : notes,
      };
      return `<div data-revision-edition="${edition}">`+Object.entries(groups).map(([range,items])=>
        `<div class="document-shell" data-revision-range="${range}">${items.map(([body,part],i)=>page(body,th,filled,part,range==='review'&&!classroom?'Revision Notes':title,i===0,i+1,items.length)).join('')}</div>`).join('')+'</div>';
    }).join('');
    return `<section class="language-view" data-content-lang="${lang}" lang="${lang}"${th?'':' hidden'}>${editions}</section>`;
  }).join('');

  const labels = [
    `data-revision-label-th="${title}" data-revision-label-en="${title}"`,
    classroom
      ? 'data-revision-quiz-th="เฉพาะตัวอย่างพาทำ" data-revision-quiz-en="Guided examples" data-revision-review-th="ทฤษฎีและการทดลอง" data-revision-review-en="Theory and experiment"'
      : 'data-revision-quiz-th="โจทย์ฝึกและ Recall" data-revision-quiz-en="Practice and Recall" data-revision-review-th="Revision Notes ฉบับอ่านครบ" data-revision-review-en="Complete Revision Notes"',
  ].join(' ');
  const html = `<!doctype html>
<html lang="th" data-learning-html data-exit-ticket-revision="1" data-exit-ticket-editions="1"
  data-exit-ticket-ranges="all quiz review" data-revision-student-default="1" data-revision-topic="19.2"
  data-content-revision="${classroom?'1.2':'1.3'}" data-shared-notes-sha256="${noteHash}"
  data-print-subject-th="ฟิสิกส์" data-print-subject-en="Physics"
  data-print-chapter-th="ฟิสิกส์อะตอม" data-print-chapter-en="Atomic physics"
  data-print-topic-th="19.2 ปรากฏการณ์โฟโตอิเล็กทริก" data-print-topic-en="19.2 Photoelectric effect" ${labels}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Physics 19.2 · ${title}</title><style>\n${css}</style></head>
<body><main>${langSets}</main></body>
</html>
`;
  writeFileSync(new URL(`19-2-photoelectric-${classroom?'classroom-note':'exit-ticket-revision'}.html`, output),html.replace(/[ \t]+$/gm, ""));
}
writeDocument('classroom');
writeDocument('exit');
