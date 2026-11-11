// Printable revision documents remain static HTML. Only the trusted Hub changes
// their display state; they never join the quiz/storage/scoring bridge.
export function isExitTicketRevision(doc) {
  return doc?.documentElement.getAttribute('data-exit-ticket-revision') === '1'
    && doc.documentElement.hasAttribute('data-learning-html');
}

export function exitTicketPages(doc, range = 'all') {
  if (!isExitTicketRevision(doc)) throw Error('Not an exit ticket revision');
  const views = [...doc.querySelectorAll('[data-content-lang]')].filter(view => !view.hasAttribute('hidden'));
  if (views.length !== 1) throw Error('Choose exactly one revision language');
  return [...views[0].querySelectorAll('.page')].filter(page => range !== 'quiz' || !page.classList.contains('review'));
}

// Receives the sanitized, detached snapshot, never the live teaching document.
export function prepareExitTicketPrint(doc, { range = 'all', answers = false } = {}) {
  if (!doc.documentElement.hasAttribute('data-hub-print-snapshot')) throw Error('A detached print snapshot is required');
  if (!['all', 'quiz'].includes(range)) throw Error('Unknown revision print range');
  const selected = new Set(exitTicketPages(doc, range));
  if (!selected.size) throw Error('Revision has no printable pages');
  doc.querySelectorAll('.page').forEach(page => { if (!selected.has(page)) page.remove(); });
  doc.querySelectorAll('[data-hub-print-style]').forEach(node => node.remove());
  doc.body.classList.remove('hub-print-document', 'print-quiz-only');
  doc.body.classList.toggle('answers-on', Boolean(answers));
  if (answers) doc.querySelectorAll('.calc-workarea,.scratch').forEach(node => node.remove());
  else doc.querySelectorAll('.solution-text,.answer-key,.teacher-only,.teacher-work,.teacherkey').forEach(node => node.remove());
  const pages = exitTicketPages(doc);
  pages.forEach((page, index) => {
    const number = page.querySelector('.footer span:last-child');
    if (number) number.textContent = `${doc.documentElement.lang === 'en' ? 'Page' : 'หน้า'} ${index + 1} / ${pages.length}`;
  });
  const style = doc.createElement('style');
  style.dataset.revisionPrintStyle = '';
  style.textContent = `
    @page { size:A4 portrait; margin:0; }
    html,body { margin:0!important; padding:0!important; background:white!important; }
    .language-view { overflow:visible!important; }
    .page { margin:0 auto!important; box-shadow:none!important; }
    @media screen { body { zoom:var(--revision-print-scale,1); } .page { outline:1px solid #ccd2db; } }
    @media print { body { zoom:1!important; } }
  `;
  doc.head.append(style);
  return pages.length;
}
