import { PrintLayoutError } from './print-layout.js';

export const learningSheetPrintCSS = `
  html[data-learning-sheet][data-hub-sheet-measuring] body.hub-print-document { width:180mm !important; padding:0 !important; }
  html[data-learning-sheet][data-hub-print-snapshot] [data-sheet-slot] {
    grid-template-columns:minmax(0,1fr) !important; grid-template-areas:"answer" !important;
    min-inline-size:min(100%,var(--sheet-print-width,var(--sheet-width,6ch))) !important;
    min-block-size:var(--sheet-print-height,var(--sheet-height,1.8em));
    break-inside:avoid; page-break-inside:avoid;
  }
  html[data-learning-sheet][data-hub-print-snapshot] [data-sheet-answer],
  html[data-learning-sheet][data-hub-print-snapshot] [data-sheet-answer] * { visibility:visible !important; }
  html[data-sheet-print-edition="blank"] [data-sheet-placeholder] { visibility:visible !important; }
  html[data-learning-sheet][data-hub-print-snapshot] [data-sheet-blank-area] { grid-area:answer; }
`;

export function resetLearningSheetSnapshot(clone) {
  if (!clone.hasAttribute('data-learning-sheet')) return;
  delete clone.dataset.hubSheetReady;
  clone.dataset.hubSheetMeasuring = '';
  clone.querySelectorAll('[data-hub-sheet-open]').forEach(node => node.removeAttribute('data-hub-sheet-open'));
  clone.querySelectorAll('[data-sheet-answer]').forEach(node => {
    node.removeAttribute('aria-hidden'); node.removeAttribute('inert');
  });
  clone.querySelectorAll('[data-sheet-standalone-note], [data-sheet-error]').forEach(node => node.remove());
}

// Called in the separate preview, after images/fonts/math have loaded at paper width.
// Never hides answers in the teaching document or measures from its mobile width.
export function prepareLearningSheetPrint(doc, edition) {
  if (!doc.documentElement.hasAttribute('data-learning-sheet')) return;
  if (!['blank', 'answers'].includes(edition)) throw new Error('Choose blank or answers for a learning sheet.');
  const slots = [...doc.querySelectorAll('[data-sheet-slot]')];
  const sizes = slots.map(slot => {
    const answer = [...slot.children].find(node => node.hasAttribute('data-sheet-answer'));
    if (!answer) throw new PrintLayoutError('sheet-answer-missing', slot);
    return { slot, answer, box: slot.getBoundingClientRect(), answerBox: answer.getBoundingClientRect() };
  });
  for (const { slot, answer, box, answerBox } of sizes) {
    slot.setAttribute('data-print-keep', '');
    // Equal geometry in both editions. Real answer layout can expand author presets.
    slot.style.setProperty('min-block-size', `${Math.ceil(box.height)}px`, 'important');
    slot.style.setProperty('inline-size', `${Math.ceil(box.width)}px`, 'important');
    if (edition === 'blank') {
      const space = doc.createElement('span'); space.dataset.sheetBlankArea = '';
      space.setAttribute('aria-hidden', 'true');
      space.style.minBlockSize = `${Math.ceil(answerBox.height)}px`;
      answer.replaceWith(space); // Removes text, image alt/title, MathJax/TeX and descendants.
    }
  }
  doc.documentElement.dataset.sheetPrintEdition = edition;
  delete doc.documentElement.dataset.hubSheetMeasuring;
}
