// After deploying services/question-bank, paste its /exec URL here.
// Keep this empty until the published catalog and Guest access have been checked.
export const questionBankConfig = Object.freeze({ endpoint: '', cacheMs: 60_000 });

// Map `${subjectId}/${bankKey}` to authored tools. One contentId may be reused
// under several sets. Local files still pass createContentTool's existing checks.
// Example: [{ key: 'worksheet', toolKind: 'html', contentId: 'my-worksheet',
//   source: 'content/physics/my-worksheet.html', titleTh: 'ใบงาน', titleEn: 'Worksheet' }]
// Notebook is built in; no empty placeholder files are generated.
export const questionBankTools = Object.freeze({});
