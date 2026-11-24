import {parseHTML} from 'linkedom';
import {eq, formulaGroups} from './lessons.mjs';
import {recallPages} from './practice.mjs';

const languageIndex = lang => lang === 'th' ? 0 : 1;

export function numberedEquations(notes) {
  const {document} = parseHTML(notes.filter(n => !n.key.startsWith('formula-summary-')).map(n => n.body).join(''));
  return new Map([...document.querySelectorAll('[data-equation], [data-combined-equation]')].map(box => [
    Number(box.dataset.equation ?? box.dataset.combinedEquation),
    box.querySelector('[data-tex]')?.dataset.tex.replace(/^\\displaystyle\s+/,'') ??
      box.firstElementChild.textContent.slice(2,-2),
  ]));
}

const classroomExampleRefs = {
  'single-examples': [[16,5,17],[17,16,5]],
  'single-width-example': [[16,17]],
  'grating-laser': [[18,19,5,20],[14,5,18,19]],
  'grating-spectrum': [[18,20,19,5,14],[19]],
};
const exitSolutionRefs = {
  'five-fringes': [14,13], 'single-data': [17], 'single-width': [16,17],
  'match-minima': [3,4,16], 'grating-scale': [14,5,18,19],
  'grating-count': [19,20], spectrum: [18,20,19],
  'practice-ipst-10-2-2c': [9], 'a-level-2566-11': [2,7,9], 'a-level-2568-9': [15,11],
  'common-2564-11': [3,4,16], 'alevel-2568-8': [18,19,20],
  'alevel-2569-27': [18,19,5,14], 'common-2556-14': [18,20],
  'alevel-2567-11': [18,20], 'common-2565-13-archive': [14,5,19],
};

function start(numbers, equations, lang) {
  const refs = numbers.map(n => {
    if (!equations.get(n)) throw Error('Unknown Classroom Note equation ' + n);
    return `<span data-equation-ref="${n}">(${n})</span>`;
  }).join(', ');
  const formulas = numbers.map(n =>
    `<span>\\(${equations.get(n).replaceAll('<','&lt;')}\\)</span>`).join('');
  return `<div class="equation-start wave-solution-start"><p class="equation-citation">${lang==='th'?'ใช้สมการ ':'Use equations '}${refs}</p><div class="wave-solution-formulas">${formulas}</div></div>`;
}

export function alignClassroomSolutions(notes, lang, equations) {
  return notes.map(item => {
    const refs = classroomExampleRefs[item.key];
    if (!refs) return item;
    const {document} = parseHTML(item.body);
    for (const [i, solution] of [...document.querySelectorAll('.note-answer')].entries()) {
      solution.insertAdjacentHTML('afterbegin', start(refs[i], equations, lang));
    }
    return {...item, body: document.documentElement.outerHTML};
  });
}

function page(items, group) {
  return {body: items.map(item => item.body).join(''), group};
}

function pack(items, combinations, group) {
  const byKey = new Map(items.map(item => [item.key, item]));
  const pages = combinations.map(keys => page(keys.map(key => {
    const item = byKey.get(key);
    if (!item) throw Error('Missing worksheet section ' + key);
    byKey.delete(key);
    return item;
  }), group));
  if (byKey.size) throw Error('Unplaced worksheet sections: ' + [...byKey.keys()].join(', '));
  return pages;
}

export function compactRevision(notes) {
  const sections = notes.filter(item => !item.key.startsWith('formula-summary-'));
  const joins = new Map([
    ['single-proof', 'single-higher'],
    ['single-examples', 'single-width-example'],
    ['grating-laser', 'grating-spectrum'],
  ]);
  const moved = new Set(joins.values());
  return sections.filter(item => !moved.has(item.key)).map(item => {
    const joined = sections.find(note => note.key === joins.get(item.key));
    return page(joined ? [item, joined] : [item], 'review');
  });
}

const selectedParts = {
  'problem-2': [1,2],
  'problem-7': [1,2],
  'problem-9': [0],
};
const corePractice = ['problem-2','problem-3','problem-4','problem-9','problem-7','single-width','spectrum'];
// Progress from the double-slit experiment to diffraction and then gratings.
const coreExams = ['a-level-2566-11','a-level-2568-9','common-2564-11','alevel-2567-11','alevel-2568-8','alevel-2569-27'];
const supplementPages = [
  ['problem-1','problem-2-extra'],
  ['five-fringes','problem-5'],
  ['problem-6','problem-7-extra'],
  ['practice-ipst-10-2-2c','problem-8'],
  ['problem-9-extra'],
  ['single-data','match-minima'],
  ['grating-scale','grating-count'],
  ['common-2556-14','common-2565-13-archive'],
];

function extractParts(item, lang, supplement) {
  const {document} = parseHTML(item.body);
  const section = document.documentElement;
  const keep = selectedParts[item.key];
  const letters = lang === 'th' ? ['ก.','ข.','ค.'] : ['A.','B.','C.'];
  for (const selector of ['.task-grid > .task','[data-solution-key]']) {
    let position = 0;
    for (const [index, task] of [...section.querySelectorAll(selector)].entries()) {
      if (keep.includes(index) === supplement) {
        task.remove();
        continue;
      }
      task.querySelector('p > b').textContent = letters[position++];
    }
  }
  if (supplement) section.dataset.unitKey += '-extra';
  return {key:section.dataset.unitKey, body:section.outerHTML};
}

function labelQuestion(item, index, prefix) {
  const {document} = parseHTML(item.body);
  const heading = document.querySelector('h2');
  heading.textContent = prefix + (index+1) + ' · ' +
    heading.textContent.replace(/^(?:ข้อ|Problem) \d+ · /, '');
  return {...item, body:document.documentElement.outerHTML};
}

export function compactQuiz({old, reading, practice, exams, lang, filled, equations, authoredPage}) {
  const authored = rows => rows.map(row => ({key:row[0], body:authoredPage(row,'quiz')}));
  const legacy = old.practice;
  const added = [...authored(reading),...authored(practice),...authored(exams),...old.exam];
  const prepared = [...legacy,...added].map(item => {
    const refs = exitSolutionRefs[item.key];
    if (!filled || !refs) return item;
    const {document} = parseHTML(item.body);
    const solution = document.querySelector('.chapter-solution,.teacher-key');
    if (item.key === 'a-level-2568-9') {
      const first = solution.querySelector('p');
      first.innerHTML = first.innerHTML.replace('สมการ (9)', 'สมการ (15)').replace('equation (9)', 'equation (15)');
    }
    solution.insertAdjacentHTML('afterbegin', start(refs,equations,lang));
    return {...item, body:document.documentElement.outerHTML};
  });
  const coreKeys = [...corePractice,...coreExams];
  const readingKeys = ['quiz-intro','cloze-A','cloze-B','single-cloze','grating-cloze'];
  const core = prepared.filter(item => [...readingKeys,...coreKeys].includes(item.key)).map(item => {
    const extracted = selectedParts[item.key] ? extractParts(item,lang,false) : item;
    const index = corePractice.indexOf(item.key);
    if (index >= 0) return labelQuestion(extracted,index,lang === 'th' ? 'ข้อ ' : 'Problem ');
    const examIndex = coreExams.indexOf(item.key);
    return examIndex < 0 ? extracted : labelQuestion(extracted,examIndex,lang === 'th' ? 'ข้อสอบจริง ' : 'Past question ');
  });
  const supplementOrder = supplementPages.flat();
  const supplement = prepared.flatMap(item => {
    if ([...readingKeys,...coreKeys].includes(item.key) && !selectedParts[item.key]) return [];
    const extracted = selectedParts[item.key] ? extractParts(item,lang,true) : item;
    return [labelQuestion(extracted,supplementOrder.indexOf(extracted.key),lang === 'th' ? 'ข้อเสริม ' : 'Supplementary question ')];
  });
  return {
    quiz: pack(core, [
      ['quiz-intro','cloze-A','cloze-B'],
      ['single-cloze','grating-cloze'],
      ...(!filled ? [['problem-2','problem-3']] : [['problem-2'],['problem-3']]),
      ['problem-4'],
      ...(!filled ? [
        ['problem-9','problem-7'],
      ] : [
        ['problem-9'],['problem-7'],
      ]),
      ['single-width','spectrum'],
      ['a-level-2566-11'],
      ['a-level-2568-9','common-2564-11'],
      ['alevel-2567-11','alevel-2568-8'],
      ['alevel-2569-27'],
    ], 'quiz'),
    bank: pack(supplement, filled
      ? [...supplementPages.slice(0,-1),...supplementPages.at(-1).map(key => [key])]
      : supplementPages, 'bank'),
  };
}

export function compactRecall(lang, filled, equations, authoredPage) {
  const l = languageIndex(lang);
  const authored = row => ({body:authoredPage(row, 'quiz')});
  const prompts = recallPages(lang,filled);
  const formula = ([number, th, en]) => `<div class="recall-equation"><p>${l?en:th}</p>${eq(number,equations.get(number).replaceAll('<','&lt;'),filled)}</div>`;
  const groups = [
    [formulaGroups[0], prompts[0], ['Knowledge Recall · สลิตคู่', 'Knowledge Recall · Double slit']],
    [formulaGroups[1], prompts[1], ['Knowledge Recall · สลิตเดี่ยวและเกรตติง', 'Knowledge Recall · Single slit and grating']],
  ];
  return groups.map(([entries, questions, title], i) => page([
    authored([`write-equations-${i+1}`, title[l],
      `<p>${l?'Write each equation from memory. Add its condition when one is required.':'เขียนสมการจากความจำ และระบุเงื่อนไขที่ใช้เมื่อจำเป็น'}</p><div class="summary-grid">${entries.map(formula).join('')}</div>`]),
    authored([questions[0], questions[1], '<div class="recall-reasoning-grid">' + questions[2] + '</div>']),
  ], 'recall'));
}
