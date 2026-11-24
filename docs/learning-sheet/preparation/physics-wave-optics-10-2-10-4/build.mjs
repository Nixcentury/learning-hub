import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {lessonPages} from './lessons.mjs';
import {practicePages, recallPages} from './practice.mjs';
import {examPages} from './exams.mjs';
import {sampleTrials} from '../physics-double-slit-10-2/paired/lab-sample.mjs';
import {formulaRecallCSS} from '../numbered-formula-recall.mjs';

const here = new URL('./', import.meta.url);
const out = new URL('../../../../public/content/physics/ipst/wave-optics/', here);
const legacy = Object.fromEntries(['classroom-note', 'exit-ticket-revision'].map(kind => {
  const text = readFileSync(new URL(`10-2-double-slit-${kind}-v1-3.html`, out), 'utf8');
  return [kind, parseHTML(text).document];
}));
const authored = ['lessons.mjs', 'practice.mjs', 'exams.mjs'].map(file => readFileSync(new URL(file, here)));
const hash = createHash('sha256');
for (const source of authored) hash.update(source);
hash.update(legacy['classroom-note'].documentElement.getAttribute('data-shared-notes-sha256'));
const revisionHash = hash.digest('hex');
const styles = [
  readFileSync(new URL('paired.css', new URL('../physics-double-slit-10-2/paired/', here)), 'utf8'),
  formulaRecallCSS,
  readFileSync(new URL('print.css', here), 'utf8'),
].join('\n');

const topic = ['แสงเชิงคลื่น 10.2–10.4', 'Wave optics 10.2–10.4'];
const notesTitle = 'Classroom Note';
const exitTitle = 'Exit Ticket Revision';

function view(kind, lang, edition, range) {
  return legacy[kind].querySelector(`[data-content-lang="${lang}"] > [data-revision-edition="${edition}"] > [data-revision-range="${range}"]`);
}

function authoredPage([key, title, body], group) {
  const attr = group === 'lesson' ? `class="shared-note" data-note-key="${key}"` : `class="chapter-unit" data-unit-key="${key}"`;
  const escapedMath = body.replace(/\\\([\s\S]*?\\\)/g, tex => tex.replaceAll('<', '&lt;'));
  return `<section ${attr}><h2>${title}</h2>${escapedMath}</section>`;
}

function borrowedLessons(lang, filled) {
  const l = lang === 'en' ? 1 : 0;
  const t = (thai, english) => l ? english : thai;
  const old = view('classroom-note', lang, filled ? 'answers' : 'blank', 'all');
  const result = [];
  const chosenExamples = new Set(['1', '3', '4', '5', '6', '9', '11']);
  for (const section of old.querySelectorAll('.page-body > .shared-note')) {
    const key = section.dataset.noteKey;
    if (key === 'lab-to-exit') continue;
    const copy = section.cloneNode(true);
    copy.querySelectorAll(':scope > h1,:scope > .identity').forEach(el => el.remove());
    if (key.startsWith('examples-')) {
      copy.querySelectorAll('.example').forEach(el => {
        if (!chosenExamples.has(el.dataset.exampleNumber)) el.remove();
      });
      if (!copy.querySelector('.example')) continue;
      const numbers = [...copy.querySelectorAll('.example')].map(e => e.dataset.exampleNumber).join(', ');
      copy.querySelector('h2').textContent = t('ตัวอย่างสลิตคู่ ', 'Double-slit examples ') + numbers;
    }
    if (key === 'observe') {
      const intro = copy.querySelector('h3 + p');
      const labLink = intro.querySelector('a');
      intro.replaceChildren(labLink, t(' ครั้งเดียว ใช้สีเขียว 532 nm และระยะฉาก 1 m คงเดิม วัดความกว้างกลางจากมืดแรกสองฝั่งสำหรับชุด A และ B แล้วบันทึกผล', ' once. Keep the green 532 nm light and the 1 m screen distance fixed. Record the central width between the two first minima for A and B.'));
      const rows = [...copy.querySelectorAll('.trial-log tbody tr')];
      rows.forEach((row, i) => {
        if (i < 2 && !filled) return;
        row.children[4].textContent = i < 2 ? t('ตัวอย่าง', 'Sample') : t('ข้อมูลให้', 'Given');
        row.children[5].textContent = sampleTrials[i].width;
      });
      copy.querySelector('.trial-log caption')?.remove();
      const table = copy.querySelector('.trial-log');
      table.insertAdjacentHTML('afterend', `<p class="small">${t('ชุด C และ B ที่ 2 m เป็นค่าจากแบบจำลองที่เตรียมไว้ ใช้เปรียบเทียบผลของความยาวคลื่นและระยะฉากต่อได้ทันที', 'Trial C and trial B at 2 m are precomputed model values. Use them to compare the effects of wavelength and screen distance.')}</p>`);
      const paragraphs = [...copy.children].filter(el => el.tagName === 'P');
      const notes = paragraphs.find(e => /แบบสุ่ม|สุ่มเรียก|randomly|chosen student/i.test(e.textContent));
      if (notes) notes.textContent = t('จดแนวโน้มของระยะระหว่างแถบเมื่อเปลี่ยนทีละตัวแปร พร้อมชี้คู่ข้อมูลที่สนับสนุน', 'Record how spacing changes when each variable is changed in isolation. Identify the two trials that support each claim.');
    }
    if (key === 'changes-proof') {
      copy.querySelectorAll('.derivation-line').forEach(el => el.remove());
    }
    if (key === 'measurement') {
      const finalHeading = [...copy.querySelectorAll('h3')].find(el => /ร้อยละ|เทียบค่าที่วัด|theor/i.test(el.textContent));
      for (let node = finalHeading; node;) {
        const next = node.nextElementSibling;
        node.remove();
        node = next;
      }
    }
    if (filled) copy.querySelectorAll('details[data-formula-recall]').forEach(el => el.replaceWith(el.querySelector('[data-equation]')));
    result.push({body: copy.outerHTML, group: 'lesson', kind: section.dataset.noteKind});
  }
  return result;
}

const oldExamKeys = ['a-level-2566-11', 'a-level-2568-9'];
const oldClozeKeys = new Set(['quiz-intro','cloze-A','cloze-B']);

function cleanIdentity(copy) {
  copy.querySelectorAll('h1,.identity').forEach(el => el.remove());
  return copy.outerHTML;
}

function oldPractice(lang, filled) {
  const root = view('exit-ticket-revision', lang, filled ? 'answers' : 'blank', 'quiz');
  const exam = oldExamKeys.map(key => {
    const original = root.querySelector(`[data-unit-key="${key}"]`).cloneNode(true);
    return {body: cleanIdentity(original), group:'quiz'};
  });
  const practice = [...root.querySelectorAll('.page-body')].flatMap(body => {
    const parts = [...body.children].filter(el => el.hasAttribute('data-unit-key') && !oldExamKeys.includes(el.dataset.unitKey));
    if (!parts.length) return [];
    const reading = parts.filter(el => oldClozeKeys.has(el.dataset.unitKey));
    const exercises = parts.filter(el => !oldClozeKeys.has(el.dataset.unitKey));
    const needsMoreSpace = exercises.some(el => ['problem-4','problem-6'].includes(el.dataset.unitKey));
    const exercisePages = needsMoreSpace ? exercises.map(el => [el]) : [exercises];
    return [reading, ...exercisePages].filter(items => items.length).map(items => ({
      body: items.map(el => cleanIdentity(el.cloneNode(true))).join(''), group:'quiz',
      reading: oldClozeKeys.has(items[0].dataset.unitKey),
    }));
  });
  return {practice, exam};
}

function lessonSet(lang, filled) {
  return [...borrowedLessons(lang, filled), ...lessonPages(lang, filled).map(([key, kind,title,body]) =>
    ({body: authoredPage([key,title,body], 'lesson'), group: 'lesson', kind}))];
}

function page(item, i, count, lang, filled, label) {
  const l = lang === 'en' ? 1 : 0;
  const state = filled ? ['เฉลย','Answers'][l] : ['ลงมือทำ','Practise'][l];
  const stamp = i === 0 ? `<div class="chapter-identity"><h1>${label} · ${topic[l]}</h1><p>${['ชื่อ','Name'][l]} <span></span>${['ห้อง','Class'][l]} <span></span></p></div>` : '';
  return `<section class="page ${item.group}" data-page="${i+1}"><header class="running-head"><span>${topic[l]}</span><span>${label} · ${state}</span></header><div class="page-body">${stamp}${item.body}</div><footer class="page-foot"><span>Learning Hub</span><span data-page-number>${['หน้า','Page'][l]} ${i+1} / ${count}</span></footer></section>`;
}

function document(kind) {
  const classroom = kind === 'classroom';
  const label = classroom ? notesTitle : exitTitle;
  const tags = {
    lang:'th','data-learning-html':'','data-exit-ticket-revision':'1','data-exit-ticket-editions':'1',
    'data-exit-ticket-ranges': classroom?'all quiz review':'all quiz review recall',
    'data-revision-topic':'10.2–10.4','data-content-revision':'1.0','data-shared-notes-sha256':revisionHash,
    'data-revision-student-default':'1','data-revision-label-th':label,'data-revision-label-en':label,
    'data-revision-quiz-th':classroom?'เฉพาะตัวอย่างพาทำ':'บทความและโจทย์',
    'data-revision-quiz-en':classroom?'Guided examples':'Reading and questions',
    'data-revision-review-th':classroom?'ทฤษฎีและการทดลอง':'Revision Notes ฉบับเฉลย',
    'data-revision-review-en':classroom?'Theory and experiment':'Worked Revision Notes',
    'data-print-subject-th':'ฟิสิกส์','data-print-subject-en':'Physics',
    'data-print-chapter-th':'แสงเชิงคลื่น','data-print-chapter-en':'Wave optics',
    'data-print-topic-th':topic[0],'data-print-topic-en':topic[1],
  };
  const wrap = (list, range, lang, filled, use = label) =>
    `<div class="document-shell" data-revision-range="${range}">${list.map((x,i)=>page(x,i,list.length,lang,filled,use)).join('')}</div>`;
  const all = ['th','en'].map(lang => {
    const editions = [false,true].map(filled => {
      const notes = lessonSet(lang, !classroom || filled).map(el => classroom ? el : {...el, group:'review'});
      let ranges;
      if (classroom) {
        ranges = wrap(notes,'all',lang,filled) +
          wrap(notes.filter(n=>n.kind==='examples'),'quiz',lang,filled) +
          wrap(notes.filter(n=>n.kind!=='examples'),'review',lang,filled);
      } else {
        const old = oldPractice(lang,filled);
        const {reading,practice} = practicePages(lang,filled);
        const authoredQuiz = entries => entries.map(row => ({body:authoredPage(row,'quiz'),group:'quiz'}));
        const quiz = [
          ...old.practice.filter(el=>el.reading), ...authoredQuiz(reading),
          ...old.practice.filter(el=>!el.reading), ...authoredQuiz(practice),
          ...old.exam, ...authoredQuiz(examPages(lang,filled)),
        ];
        const recall = authoredQuiz(recallPages(lang,filled));
        ranges = wrap([...quiz,...notes,...recall],'all',lang,filled) +
          wrap(quiz,'quiz',lang,filled) + wrap(notes,'review',lang,true,'Revision Notes') +
          wrap(recall,'recall',lang,filled,'Knowledge Recall');
      }
      return `<div data-revision-edition="${filled?'answers':'blank'}">${ranges}</div>`;
    }).join('');
    return `<section class="language-view" lang="${lang}" data-content-lang="${lang}"${lang==='en'?' hidden':''}>${editions}</section>`;
  }).join('');
  const attributes = Object.entries(tags).map(([k,v])=>`${k}="${v}"`).join(' ');
  const filename = `10-2-10-4-wave-optics-${classroom?'classroom-note':'exit-ticket-revision'}.html`;
  writeFileSync(new URL(filename,out), `<!doctype html>\n<html ${attributes}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${label} · Physics 10.2–10.4</title><style>${styles}</style></head><body><main>${all}</main></body></html>\n`);
}

document('classroom');
document('exit');
