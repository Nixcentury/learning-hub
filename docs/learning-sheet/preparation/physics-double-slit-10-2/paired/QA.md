> ผลตรวจฉบับแรกใน PR #198 เก็บย้อนหลัง; ฉบับปัจจุบันดู [QA-v1.1.md](QA-v1.1.md)

# QA — Double-slit paired handouts v1

16 November 2026, based on main `94b954adf4460a992415610b9f63f16d3d26b39d`.

## Content and contract checks

- New content regression tests: 3 passed. They compare the complete canonical HTML across Classroom answers and both Exit editions, then exercise all 24 language/edition/range selections through the existing sanitized print snapshot and revision printer. Student snapshots remove all exercise keys while retaining every filled note/example; printing does not mutate the live document. Each selected print copy has exactly one name/class line.
- Existing revision/menu regression suite: 45 passed. No print, scoring, storage or navigation engine was changed.
- Reference calculations independently checked: accumulated phase and equivalent cycles; inverse d from phase; λ from three measured intervals; frequency/geometry ratios; coincident bright/dark orders; signed same-side/opposite-side distances; relative deviation; and non-small-angle geometry.
- All figures, equation SVGs and fonts resolve locally. Public content has no scripts, templates, event handlers, external image requests or embedded base64 images. Source-user HTML files and existing textbook crops/Quiz/lab/learning sheet remain unchanged.

## Browser checks

Guest Chromium, through the local Hub and its actual content opener and print dialog:

- Both new routes resolve and expose the shared TH/EN, answer and print controls. The topic menu includes the new buttons along with the previous video, learning sheet, 50-question review and guided lab.
- Measured **all 24 static views** after fonts and images loaded. No page-body vertical/horizontal overflow, broken image or extra identity line. Full data: `layout-report.json`.
- Classroom full editions are 7 pages; guided examples 6; concepts/observations 7. Exit full editions are 15 pages; Quiz + Recall 8; complete Revision Notes 7, in both languages and editions.
- Visually inspected the Thai teacher edition in the actual Hub, including the setup photograph, path/phase equations, order table and worked examples. Source textbook diagrams retain their printed labels; English captions and accompanying English definitions identify the symbols.
- Exercised the actual Hub print dialog for Classroom TH (full answers, guided examples blank, concepts/observations answers) and Exit TH/EN (full student, Quiz/Recall, student Notes). Selected pages were ready to print; student Notes retain 7 note sections and all 12 worked examples with zero exercise keys. Data: `print-checks.json`.
- Actual print-copy font sizes measured as body 13.3333 px (10 pt), headings 14.6667 px (11 pt), and identity 10.6667 px (8 pt). Name/class appears on the first page only, including separately selected ranges.
- During repeated English print selections, one preparation attempt failed transiently. Closing and reopening the same dialog succeeded; subsequent English full/Quiz/Notes selections were ready. No engine workaround was added.

This verifies Chromium layout and the Hub’s prepared print DOM. Native PDF saving, physical printing, and a physical iPad/Safari session were not performed.

## Build

`pnpm build` passes content/guide validation, TypeScript, Vite and Pages verification. Existing unrelated draft warnings remain allowed. `git diff --check` passes. The new test file is registered in `test:unit`.
