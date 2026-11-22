// Add native reveal controls to Classroom Notes after the worked notes are built.
export function addFormulaRecall(doc, lang, labels) {
  for (const equation of doc.querySelectorAll('[data-equation]')) {
    const number = Number(equation.dataset.equation);
    const label = labels[number - 1]?.[lang === 'th' ? 0 : 1];
    if (!label) throw new Error(`Missing ${lang} recall cue for equation ${number}`);
    const details = doc.createElement('details');
    details.dataset.formulaRecall = String(number);
    const summary = doc.createElement('summary');
    summary.textContent = `(${number})`;
    const action = lang === 'th' ? 'เปิดหรือปิดเฉลยสูตร' : 'Toggle formula answer';
    summary.setAttribute('aria-label', `${action} (${number}) ${label}`);
    equation.replaceWith(details);
    details.append(summary, equation);
  }
}

export const formulaRecallCSS = `
  [data-formula-recall] {
    position: relative;
    min-height: 46px;
    margin: 1mm 0 2mm;
    border: 1px solid #8398a7;
    border-radius: 1mm;
    background: #fff;
    break-inside: avoid;
  }
  [data-formula-recall] > summary {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: .25rem;
    min-height: 44px;
    padding-inline-end: .45rem;
    list-style: none;
    cursor: pointer;
    font-size: 10pt;
  }
  [data-formula-recall] > summary::-webkit-details-marker { display: none; }
  [data-formula-recall] > summary::before {
    content: '+';
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid #738da0;
    border-radius: 4px;
    color: #174f79;
    background: #f1f5f8;
    font-size: 16pt;
    line-height: 1;
  }
  [data-formula-recall][open] > summary::before { content: '−'; }
  [data-formula-recall] > summary:focus-visible { outline: 2px solid #255b80; outline-offset: -2px; }
  .shared-note [data-formula-recall] > [data-equation] {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    min-height: 44px;
    margin: 0;
    padding: 0 4.6rem 0 3mm;
    border: 0;
  }
  .shared-note [data-formula-recall] > [data-equation] > :last-child { display: none; }
  .shared-note [data-formula-recall] .equation-box { border: 0; padding: 0; }
  .formula-recall-space {
    min-height: 9mm;
    padding: 1mm 2mm 0;
    border-bottom: 1px solid #8398a7;
    text-align: end;
  }
`;
