import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { notes } from './notes.mjs';
import { exercises } from './exercises.mjs';
import { createMathRenderer } from './math.mjs';

const out = new URL('../../../../public/content/chemistry/atomic-properties/', import.meta.url);
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const notesHash = createHash('sha256').update(read('./notes.mjs')).update(read('./math.mjs')).digest('hex');
const css = read('./paired.css');
const ranges = ['all', 'quiz', 'review'];
const renderMath = createMathRenderer(out);

function hideNoteAnswers(body) {
  const { document } = parseHTML(`<html><body>${body}</body></html>`);
  for (const answer of document.querySelectorAll('.note-answer')) {
    const space = document.createElement('div');
    space.className = 'note-write';
    space.style.height = `${answer.dataset.writeMm}mm`;
    answer.replaceWith(space);
  }
  return document.body.innerHTML;
}

function noteBlocks(panel) {
  const { document } = parseHTML('<html><body>' + panel.body + '</body></html>');
  return [...document.body.children];
}

function packRevisionNotes(panels, en) {
  const [isotopes, radiation, equations, halfLife, applications, decay, time, mixed] = panels;
  const continued = en ? ' (continued)' : ' (ต่อ)';
  const fragment = (panel, blocks, suffix = '') => ({
    ...panel,
    title: panel.title + suffix,
    body: blocks.map(block => block.outerHTML).join('\n'),
  });

  const equationBlocks = noteBlocks(equations);
  const afterDecayTable = equationBlocks.findIndex(block => block.matches('table')) + 1;
  const [first, second, decaySource] = noteBlocks(decay);
  const [third, fourth, timeSource] = noteBlocks(time);
  const firstSteps = fourth.querySelector('.note-answer');
  const restOfFourth = fourth.cloneNode(true);
  restOfFourth.setAttribute('data-worked-continuation', '');
  const title = restOfFourth.querySelector('h3');
  title.textContent += continued;
  restOfFourth.querySelector('.note-task > p').remove();
  const remainingSteps = restOfFourth.querySelector('.note-answer');

  // Finish the remaining-fraction calculation before continuing with the time equation.
  const stepBoundary = [...firstSteps.children].findIndex(step => step.textContent.endsWith('(4)'));
  if (afterDecayTable < 1 || stepBoundary < 1) throw Error('Missing a Revision Notes page-break point');
  [...firstSteps.children].slice(stepBoundary).forEach(step => step.remove());
  [...remainingSteps.children].slice(0, stepBoundary).forEach(step => step.remove());

  return [
    [isotopes],
    [radiation, fragment(equations, equationBlocks.slice(0, afterDecayTable))],
    [fragment(equations, equationBlocks.slice(afterDecayTable), continued), halfLife],
    [applications, fragment(decay, [first])],
    [fragment(decay, [second, decaySource], continued), fragment(time, [third, fourth])],
    [fragment(time, [restOfFourth, timeSource], continued), mixed],
  ];
}

function page(panels, index, count, en, docLabel, topic) {
  const [{ key, kind }] = panels;
  const heading = index === 0
    ? `<h1>${docLabel} · 2.7 ${topic}</h1><p class="identity">${en ? 'Name' : 'ชื่อ'} <span class="name"></span> ${en ? 'Class' : 'ห้อง'} <span class="class"></span></p>`
    : '';
  const label = kind === 'review' ? 'Revision Notes' : key === 'recall' ? 'Knowledge Recall' : docLabel;
  const notesDivider = kind === 'review' && key === 'isotopes'
    ? '<p class="section-heading">Revision Notes</p>'
    : '';
  const practice = kind === 'quiz';
  const sections = panels.map(panel => `<section class="${practice ? 'practice' : 'shared-note'}" ${practice ? 'data-practice-key' : 'data-note-key'}="${panel.key}">
      <h2>${panel.title}</h2>
      ${panel.body}
    </section>`).join('\n    ');
  return `<section class="page ${kind}" data-page="${index + 1}">
  <header class="running-head"><span>${en ? 'CHEMISTRY' : 'เคมี'} · 2.7 ${topic}</span><span>${label}</span></header>
  <div class="page-body">
    ${heading}
    ${notesDivider}
    ${sections}
  </div>
  <footer class="page-foot"><span>Learning Hub</span><span data-page-number>${en ? 'Page' : 'หน้า'} ${index + 1} / ${count}</span></footer>
</section>`;
}

for (const classroom of [true, false]) {
  const label = classroom ? 'Classroom Note' : 'Exit Ticket Revision';
  const content = ['th','en'].map(lang => {
    const en = lang === 'en';
    const topic = en ? 'Radioactive Elements' : 'ธาตุกัมมันตรังสี';
    const notePanels = notes(lang);
    const editions = ['blank','answers'].map(edition => {
      const filled = edition === 'answers';
      const classPages = classroom
        ? notePanels.map(panel => [panel])
        : packRevisionNotes(notePanels, en);
      const classes = classPages.map(panels => panels.map(panel => ({
        ...panel,
        kind: classroom ? panel.kind : 'review',
        body: renderMath(classroom && !filled ? hideNoteAnswers(panel.body) : panel.body),
      })));
      const practice = classroom ? [] : exercises(lang, filled).map(panel => [{
        ...panel, kind: 'quiz', body: renderMath(panel.body),
      }]);
      const recall = practice.filter(([panel]) => panel.key === 'recall');
      const views = {
        all: classroom ? classes : [...practice.filter(([panel]) => panel.key !== 'recall'), ...classes, ...recall],
        quiz: classroom ? classes.filter(([panel]) => panel.kind === 'examples') : practice,
        review: classroom ? classes.filter(([panel]) => panel.kind === 'lesson') : classes,
      };
      const sections = ranges.map(range => {
        const panels = views[range];
        return `<div class="document-shell" data-revision-range="${range}">\n${panels.map((panel,i) => page(panel,i,panels.length,en,label,topic)).join('\n')}\n</div>`;
      });
      return `<div data-revision-edition="${edition}">\n${sections.join('\n')}\n</div>`;
    });
    return `<section class="language-view" data-content-lang="${lang}" lang="${lang}"${en ? ' hidden' : ''}>\n${editions.join('\n')}\n</section>`;
  });
  const attrs = {
    lang: 'th', 'data-learning-html': '',
    'data-exit-ticket-revision': '1', 'data-exit-ticket-editions': '1',
    'data-exit-ticket-ranges': ranges.join(' '), 'data-revision-student-default': '1',
    'data-revision-topic': '2.7', 'data-content-revision': classroom ? '1.1' : '1.2', 'data-shared-notes-sha256': notesHash,
    'data-revision-label-th': label, 'data-revision-label-en': label,
    'data-revision-quiz-th': classroom ? 'เฉพาะตัวอย่างพาทำ' : 'โจทย์ฝึกและ Recall',
    'data-revision-quiz-en': classroom ? 'Guided examples' : 'Practice and recall',
    'data-revision-review-th': classroom ? 'เฉพาะบทเรียน' : 'เฉพาะ Revision Notes',
    'data-revision-review-en': classroom ? 'Lesson notes' : 'Revision Notes only',
    'data-print-subject-th': 'เคมี', 'data-print-subject-en': 'Chemistry',
    'data-print-chapter-th': 'อะตอมและสมบัติของธาตุ', 'data-print-chapter-en': 'Atoms and Properties of Elements',
    'data-print-topic-th': '2.7 ธาตุกัมมันตรังสี', 'data-print-topic-en': '2.7 Radioactive Elements',
    'data-print-work-th': `2.7 ${label}`, 'data-print-work-en': `2.7 ${label}`,
  };
  const root = Object.entries(attrs).map(([key,value]) => `${key}="${value}"`).join(' ');
  const file = classroom ? '2-7-classroom-note-v1-1.html' : '2-7-exit-ticket-revision-v1-2.html';
  const html = `<!doctype html>
<html ${root}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chemistry 2.7 · ${label}</title>
<style>
${css}${classroom ? '' : read('./revision.css')}</style>
</head>
<body><main>
${content.join('\n')}
</main></body>
</html>\n`;
  writeFileSync(new URL(file,out), html.replace(/[ \t]+$/gm, ''));
}
