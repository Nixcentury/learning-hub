import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {lessonPages} from './lessons.mjs';
import {practicePages} from './practice.mjs';
import {alignClassroomSolutions, numberedEquations, compactRevision, compactQuiz, compactRecall} from './exit-layout.mjs';
import {reviseDoubleSlit} from './lesson-details.mjs';
import {examPages} from './exams.mjs';
import {formulaRecallCSS} from '../numbered-formula-recall.mjs';

const here = new URL('./', import.meta.url);
const out = new URL('../../../../public/content/physics/ipst/wave-optics/', here);
const legacy = Object.fromEntries(['classroom-note', 'exit-ticket-revision'].map(kind => {
  const text = readFileSync(new URL(`10-2-double-slit-${kind}-v1-3.html`, out), 'utf8');
  return [kind, parseHTML(text).document];
}));
const authored = ['lessons.mjs', 'lesson-details.mjs'].map(file => readFileSync(new URL(file, here)));
const hash = createHash('sha256');
for (const source of authored) hash.update(source);
hash.update(legacy['classroom-note'].documentElement.getAttribute('data-shared-notes-sha256'));
const revisionHash = hash.digest('hex');
const styles = [
  readFileSync(new URL('paired.css', new URL('../physics-double-slit-10-2/paired/', here)), 'utf8'),
  formulaRecallCSS,
  readFileSync(new URL('print.css', here), 'utf8'),
].join('\n');

const exitStyles = readFileSync(new URL('exit-print.css', here), 'utf8');

const topic = ['แสงเชิงคลื่น 10.2–10.4', 'Wave optics 10.2–10.4'];
const notesTitle = 'Classroom Note';
const exitTitle = 'Exit Ticket Revision';

function view(kind, lang, edition, range) {
  return legacy[kind].querySelector(`[data-content-lang="${lang}"] > [data-revision-edition="${edition}"] > [data-revision-range="${range}"]`);
}

function authoredPage([key, title, body], group, kind = 'theory') {
  const attr = group === 'lesson' ? `class="shared-note" data-note-kind="${kind}" data-note-key="${key}"` : `class="chapter-unit" data-unit-key="${key}"`;
  const escapedMath = body.replace(/\\\([\s\S]*?\\\)/g, tex => tex.replaceAll('<', '&lt;'));
  return `<section ${attr}><h2>${title}</h2>${escapedMath}</section>`;
}

function borrowedLessons(lang, filled) {
  const l = lang === 'en' ? 1 : 0;
  const t = (thai, english) => l ? english : thai;
  const old = view('classroom-note', lang, filled ? 'answers' : 'blank', 'all');
  const result = [];
  for (const section of old.querySelectorAll('.page-body > .shared-note')) {
    const key = section.dataset.noteKey;
    if (key === 'lab-to-exit') continue;
    const copy = section.cloneNode(true);
    copy.querySelectorAll(':scope > h1,:scope > .identity').forEach(el => el.remove());
    if (key.startsWith('examples-')) {
      const numbers = [...copy.querySelectorAll('.example')].map(e => e.dataset.exampleNumber).join(', ');
      copy.querySelector('h2').textContent = t('ตัวอย่างสลิตคู่ ', 'Double-slit examples ') + numbers;
    }
    reviseDoubleSlit(copy, key, lang, filled);
    if (filled) copy.querySelectorAll('details[data-formula-recall]').forEach(el => el.replaceWith(el.querySelector('[data-equation]')));
    result.push({key, body: copy.outerHTML, group: 'lesson', kind: section.dataset.noteKind});
  }
  return result;
}

const oldExamKeys = ['a-level-2566-11', 'a-level-2568-9'];

function cleanIdentity(copy) {
  copy.querySelectorAll('h1,.identity').forEach(el => el.remove());
  return copy.outerHTML;
}

function oldPractice(lang, filled) {
  const root = view('exit-ticket-revision', lang, filled ? 'answers' : 'blank', 'quiz');
  const sections = [...root.querySelectorAll('.page-body > [data-unit-key]')].map(section =>
    ({key: section.dataset.unitKey, body: cleanIdentity(section.cloneNode(true))}));
  return {
    practice: sections.filter(item => !oldExamKeys.includes(item.key)),
    exam: sections.filter(item => oldExamKeys.includes(item.key)),
  };
}

function groupDoubleSlitExamples(sections, lang) {
  const examples = new Map(sections.flatMap(section => {
    const {document} = parseHTML(section.body);
    return [...document.querySelectorAll('.example')].map(example =>
      [Number(example.dataset.exampleNumber), example.outerHTML]);
  }));
  return [[1,2],[3,4],[5,6],[7,8],[9,10],[11,12]].map((group, i) => {
    const key = `double-examples-${i+1}`;
    const title = `${lang==='th'?'ตัวอย่างสลิตคู่':'Double-slit examples'} ${group.join('–')}`;
    const body = `<section class="shared-note" data-note-kind="examples" data-note-key="${key}"><h2>${title}</h2>${group.map(n => examples.get(n)).join('')}</section>`;
    return {key, body, group:'lesson', kind:'examples'};
  });
}

function lessonSet(lang, filled) {
  const borrowed = borrowedLessons(lang, filled);
  const authored = lessonPages(lang,filled).map(([key, kind,title,body]) =>
    ({key, body: authoredPage([key,title,body], 'lesson', kind), group: 'lesson', kind}));
  const theory = [...borrowed, ...authored].filter(s => s.kind !== 'examples');
  return [...theory, ...groupDoubleSlitExamples(borrowed.filter(s => s.kind === 'examples'), lang),
    ...authored.filter(s => s.kind === 'examples')];
}

function classroomPages(notes) {
  const joins = new Map([
    ['formula-summary-1', 'formula-summary-2'],
    ['single-examples', 'single-graph-example'],
    ['grating-laser', 'grating-spectrum'],
  ]);
  const moved = new Set(joins.values());
  return notes.filter(item => !moved.has(item.key)).map(item => {
    const joined = notes.find(note => note.key === joins.get(item.key));
    return joined ? {...item, body: item.body + joined.body} : item;
  });
}

function page(item, i, count, lang, filled, label, classroom) {
  const l = lang === 'en' ? 1 : 0;
  const state = filled ? ['เฉลย','Answers'][l] : ['ลงมือทำ','Practise'][l];
  const stamp = i === 0 ? `<div class="chapter-identity"><h1>${label} · ${topic[l]}</h1><p>${['ชื่อ','Name'][l]} <span></span>${['ห้อง','Class'][l]} <span></span></p></div>` : '';
  return `<section class="page ${item.group}${classroom ? '' : ' exit-page'}" ${classroom ? '' : `data-revision-zone="${item.group === 'recall' ? 'quiz recall' : item.group}" `}data-page="${i+1}"><header class="running-head"><span>${topic[l]}</span><span>${label} · ${state}</span></header><div class="page-body">${stamp}${item.body}</div><footer class="page-foot"><span>Kru Nix Century</span><span data-page-number>${['หน้า','Page'][l]} ${i+1} / ${count}</span></footer></section>`;
}

function document(kind) {
  const classroom = kind === 'classroom';
  const label = classroom ? notesTitle : exitTitle;
  const tags = {
    lang:'th','data-learning-html':'','data-exit-ticket-revision':'1','data-exit-ticket-editions':'1',
    'data-exit-ticket-ranges': classroom?'all quiz review':'all quiz review recall',
    'data-revision-topic':'10.2–10.4','data-content-revision':'1.1','data-shared-notes-sha256':revisionHash,
    ...(classroom?{}:{'data-revision-print-default':'quiz','data-revision-shared-ranges':'quiz review'}),
    'data-revision-student-default':'1','data-revision-label-th':label,'data-revision-label-en':label,
    'data-revision-quiz-th':classroom?'เฉพาะตัวอย่างพาทำ':'ชุดนักเรียน · บทความ โจทย์ และ Knowledge Recall',
    'data-revision-quiz-en':classroom?'Guided examples':'Student handout · Reading, questions and Knowledge Recall',
    'data-revision-review-th':classroom?'ทฤษฎีและการทดลอง':'Revision Notes ฉบับเฉลย',
    'data-revision-review-en':classroom?'Theory and experiment':'Worked Revision Notes',
    'data-print-subject-th':'ฟิสิกส์','data-print-subject-en':'Physics',
    'data-print-chapter-th':'แสงเชิงคลื่น','data-print-chapter-en':'Wave optics',
    'data-print-topic-th':topic[0],'data-print-topic-en':topic[1],
  };
  const wrap = (list, range, lang, filled, use = label) =>
    `<div class="document-shell" data-revision-range="${range}">${list.map((x,i)=>page(x,i,list.length,lang,filled,use,classroom)).join('')}</div>`;
  const all = ['th','en'].map(lang => {
    const teacherNotes = lessonSet(lang,true);
    const equations = numberedEquations(teacherNotes);
    const worked = alignClassroomSolutions(teacherNotes, lang, equations);
    const editions = [false,true].map(filled => {
      const notes = !classroom || filled ? worked : lessonSet(lang,false);
      let ranges;
      if (classroom) {
        ranges = wrap(classroomPages(notes),'all',lang,filled) +
          wrap(classroomPages(notes.filter(n=>n.kind==='examples')),'quiz',lang,filled) +
          wrap(classroomPages(notes.filter(n=>n.kind!=='examples')),'review',lang,filled);
      } else {
        const old = oldPractice(lang, filled);
        const {reading, practice} = practicePages(lang, filled);
        const quiz = compactQuiz({
          old, reading, practice, exams: examPages(lang, filled),
          lang, filled, equations, authoredPage,
        });
        const recall = compactRecall(lang, filled, equations, authoredPage);
        const review = compactRevision(notes);
        ranges = wrap([...quiz, ...review, ...recall], 'all', lang, filled) +
          wrap(recall, 'recall', lang, filled, 'Knowledge Recall');
      }
      return `<div data-revision-edition="${filled?'answers':'blank'}">${ranges}</div>`;
    }).join('');
    return `<section class="language-view" lang="${lang}" data-content-lang="${lang}"${lang==='en'?' hidden':''}>${editions}</section>`;
  }).join('');
  const attributes = Object.entries(tags).map(([k,v])=>`${k}="${v}"`).join(' ');
  const filename = `10-2-10-4-wave-optics-${classroom?'classroom-note':'exit-ticket-revision'}.html`;
  writeFileSync(new URL(filename,out), `<!doctype html>\n<html ${attributes}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${label} · Physics 10.2–10.4</title><style>${styles}${classroom ? '' : exitStyles}</style></head><body><main>${all}</main></body></html>\n`);
}

document('classroom');
document('exit');
