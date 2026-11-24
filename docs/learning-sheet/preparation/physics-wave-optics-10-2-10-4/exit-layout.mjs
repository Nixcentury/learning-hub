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
  'single-graph-example': [[17]],
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
  return combinations.map(keys => page(keys.map(key => {
    const item = byKey.get(key);
    if (!item) throw Error('Missing worksheet section ' + key);
    byKey.delete(key);
    return item;
  }), group)).concat([...byKey.values()].map(item => page([item], group)));
}

export function compactRevision(notes) {
  const sections = notes.filter(item => !item.key.startsWith('formula-summary-'));
  const joins = new Map([
    ['single-proof', 'single-higher'],
    ['single-examples', 'single-graph-example'],
    ['grating-laser', 'grating-spectrum'],
  ]);
  const moved = new Set(joins.values());
  return sections.filter(item => !moved.has(item.key)).map(item => {
    const joined = sections.find(note => note.key === joins.get(item.key));
    return page(joined ? [item, joined] : [item], 'review');
  });
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
  const laidOut = filled ? prepared.flatMap(item => {
    if (item.key !== 'problem-9') return [item];
    return [true,false].map(first => {
      const {document} = parseHTML(item.body);
      const section = document.documentElement;
      section.querySelector('.task-grid').remove();
      const parts = [...section.querySelectorAll('[data-solution-key]')];
      for (const [i, part] of parts.entries()) if ((i === 0) !== first) part.remove();
      if (!first) {
        section.dataset.unitKey = 'problem-9-cont';
        section.querySelector('h2').textContent += lang === 'th' ? ' (ต่อ)' : ' (continued)';
        section.querySelector('.exam-source')?.remove();
      }
      return {key:section.dataset.unitKey, body:section.outerHTML};
    });
  }) : prepared;
  return pack(laidOut, [
    ['quiz-intro','cloze-A'],
    ['cloze-B','single-cloze'],
    ['grating-cloze','problem-1'],
    ...(!filled ? [
      ['problem-2','problem-3'],
      ['problem-4','problem-5'],
      ['problem-6','problem-7'],
      ['problem-8','problem-9','practice-ipst-10-2-2c'],
      ['five-fringes','single-data','single-width'],
      ['match-minima','grating-scale','grating-count','spectrum'],
    ] : [
      ['problem-2'],['problem-3'],['problem-4'],['problem-5'],['problem-6'],['problem-7'],
      ['problem-8','problem-9'],
      ['problem-9-cont','practice-ipst-10-2-2c'],
      ['five-fringes','single-data'],
      ['single-width','match-minima','grating-scale'],['grating-count','spectrum'],
    ]),
    ['a-level-2566-11'],
    ['a-level-2568-9','common-2564-11'],
    ['alevel-2568-8','alevel-2569-27'],
    ['common-2556-14','alevel-2567-11'],
    ['common-2565-13-archive'],
  ], 'quiz');
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
