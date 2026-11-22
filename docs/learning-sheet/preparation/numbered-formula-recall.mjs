// Add native reveal controls to Classroom Notes after the worked notes are built.
export function addFormulaRecall(doc, lang, labels) {
  for (const equation of doc.querySelectorAll('[data-equation]')) {
    const number = Number(equation.dataset.equation);
    const label = labels[number - 1]?.[lang === 'th' ? 0 : 1];
    if (!label) throw new Error(`Missing ${lang} recall cue for equation ${number}`);
    const details = doc.createElement('details');
    details.dataset.formulaRecall = String(number);
    const summary = doc.createElement('summary');
    summary.textContent = `(${number}) ${label}`;
    summary.dataset.showFormula = lang === 'th' ? 'เปิดดูสูตร' : 'Show formula';
    summary.dataset.hideFormula = lang === 'th' ? 'ปิดสูตร' : 'Hide formula';
    equation.replaceWith(details);
    details.append(summary, equation);
  }
}

export const formulaRecallCSS = `
  [data-formula-recall] { margin: 1mm 0 2mm; break-inside: avoid; }
  [data-formula-recall] > summary {
    padding: .9mm 2mm;
    border: 1px solid #738da0;
    border-radius: 1mm;
    color: #193f55;
    background: #f1f5f8;
    cursor: pointer;
    font-size: 10pt;
  }
  [data-formula-recall] > summary::after {
    content: attr(data-show-formula);
    margin-inline-start: 2mm;
    font-weight: 700;
    color: #174f79;
  }
  [data-formula-recall][open] > summary::after { content: attr(data-hide-formula); }
  [data-formula-recall] > summary:focus-visible { outline: 2px solid #255b80; outline-offset: 2px; }
  .formula-recall-space { min-height: 9mm; padding-top: 1mm; border-bottom: 1px solid #8398a7; }
  @media screen {
    .page:has([data-formula-recall][open]) { height: auto; min-height: 297mm; }
    .page:has([data-formula-recall][open]) .page-body { height: auto; min-height: 251mm; }
  }
`;
