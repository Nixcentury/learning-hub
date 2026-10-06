// Physics service: public catalog checked without Google credentials, 2026-10-06.
export const questionBankConfig = Object.freeze({
  endpoint: 'https://script.google.com/macros/s/AKfycbyPhqDvvjAliUnRGpa7qgw2Bh_AilLrDYe0VsqnMZy_WBIFPBLajpLSd6VWrk_wR8HO3Q/exec',
  cacheMs: 60_000,
});

// Map `${subjectId}/${bankKey}` to authored tools. One contentId may be reused
// under several sets. Local files still pass createContentTool's existing checks.
// Example: [{ key: 'worksheet', toolKind: 'html', contentId: 'my-worksheet',
//   source: 'content/physics/my-worksheet.html', titleTh: 'ใบงาน', titleEn: 'Worksheet' }]
// Notebook is built in; no empty placeholder files are generated.
export const questionBankTools = Object.freeze({});
