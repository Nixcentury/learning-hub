# Physics 19.1 Sheet 1: blackbody radiation and Planck's hypothesis

## Latest revision: 27 October 2026 — teacher review of Sheet 1

Based on main `54d2370bd90fd162c55b0ec60f416eccd34f8013`, after PR47 was merged. Branch: `codex/physics-19-1-sheet1-review-20261027`. The teacher approved four bounded changes and then accepted displaying the complete four-flame photograph during QA. Earlier dated results below are historical.

### Changes within the agreed scope

1. Removed the book-page number from “ชวนคิด / Think”, retaining `ipst-think-55` and its existing scoped question/answer.
2. Added the supplied original Bunsen-burner photograph, with source and CC BY-SA 3.0 attribution. The complete image is displayed at its original aspect ratio; the caption directs learners to **flame 2, blue below and orange above**. It is identified as a Bunsen-flame illustration, not a household-stove photo or a temperature measurement. No numerical temperature is assigned.
3. Removed only the classical-comparison subsection, its displayed graph/caption and former Question 6/answer. A short bilingual bridge leads into Planck’s hypothesis. The temperature-dependent spectra, cavity diagram and all later problems remain. The now-unused comparison asset is retained for provenance.
4. Added a note area reviewing `W = qV` with magnitudes for acceleration and definitions of `W`, `q`, `V`, and `e = 1.60e-19 C`. The existing `joule-ev` note now derives the conversion using an electron accelerated through 1 V and distinguishes eV from V. Two separate response areas practise eV → J and J → eV. Independent arithmetic: **2.00 eV = 3.20e-19 J; 4.80e-19 J = 3.00 eV**.

TH/EN have **66 paired slots, five photographs/diagrams, nine sections and 16 continuously numbered classroom questions**. All surviving slots except the agreed `joule-ev` explanation are byte-for-byte unchanged. The removed comparison is the only deleted key; `electric-work-review`, `ev-to-joule` and `joule-to-ev` are added in matching order. All three worked examples are unchanged; later problem sections are identical after excluding visible classroom-question renumbering. Bank `b-0f490c3358e9212cee2e2a43`, content ID `physics-ipst-atomic-19-1-1-sheet` and tool key `learning-sheet` are retained. Sheets 2–3 and the shared engines are untouched.

### Verification actually completed

- `pnpm build`: passed content validation (0 errors, 32 pre-existing draft warnings; 62 content files), TypeScript, Vite and the Pages artifact comparison (**547 public files**).
- `pnpm validate:routes`: passed; 10 sections, 80 chapters, 19 topics, 30 HTML-menu contents and 153 legacy tool placements.
- `pnpm test:unit`: **345 passed, 0 failed**. Subsequent changes concern only the new photograph’s local presentation/caption and were rebuilt and checked in the browser. `git diff --check` passed.
- Structural comparison: matching bilingual slot order, exactly one direct answer per slot, no nested slots, supplied images present, continuous numbering, unchanged worked examples and retained problems.
- Actual production Hub in Chromium, guest mode: both direct content and bank-tool routes opened the existing worksheet. Individual reveal, reveal-all/hide-all and language switching were checked. Revealing all 66 slots preserved their on-screen heights. All five images loaded; no MathJax errors.
- A 390 px Hub iframe fixture was checked in both languages with all 66 answers revealed. Inner content width/scroll width were both **357 px**; no horizontal document overflow. The four new/revised unit areas fit at 325 px. This is a fixture check, not a native mobile-device claim.
- Final central A4 previews were regenerated after the teacher accepted the full photograph. Every edition retained five loaded images and 66 slots, only its selected language, zero MathJax errors and zero page-body overflows. Blank editions removed answer DOM; answers editions contained 66 answers. The exported preview HTML was checked independently for completeness.

| Central print preview | Pages | Answer elements |
| --- | ---: | ---: |
| Thai blank | 18 | 0 |
| Thai answers | 18 | 66 |
| English blank | 18 | 0 |
| English answers | 18 | 66 |

All **72 preview pages** were visually inspected in twelve contact sheets; the new unit explanations, conversion questions and flame question were also inspected at larger size. The flame image and its caption are visible together. Local evidence: `qa-output/sheet1-review/` (ignored), including `structure.json`, `browser-report.json`, `narrow-report.json`, `print-report.json`, four complete preview HTML files, contact sheets and enlarged screenshots.

Limits: no new PDF export, native iPad/Safari/Apple Pencil test, physical-printer test or account/cloud write was performed. The earlier PDF checks below belong to the 26 October revision. This work is prepared as a PR; it does not establish a live Pages release.

---


## Revision: 26 October 2026 — approved print and practice expansion

The teacher confirmed this revision before file editing. The earlier dated sections below are historical results, not the page counts or slot counts for this revision. Tested against main `08e741b8cd33f40d71793272ad59ec6c84243a2c` in an isolated worktree.

### Content and source checks

- Preserved the original teaching sequence, nine sections, three worked examples and all 44 existing semantic slot keys in both languages. There are now **64 paired slots**, 28 separate response-item groups and five figures per language. Fifteen continuously numbered classroom questions sit alongside the original official IPST headings; official question numbers remain identifiable.
- Split labelled parts/cases in the examples and exercises into individual writing spaces. Calculation areas allow for equations, substitution, units and extra handwriting; compact spacing comes from headings, paragraph margins, tables and figure dimensions. The shared print engine retains its existing body typography.
- Added the Think question on p.55, the Fig.19.3 comparison, a definition of eV, and Understanding 19.1 Q1. **Correction to the earlier coverage proposal: the teacher guide p.52 assigns Q1 to Planck's hypothesis, not Bohr.**
- Added photon energy to frequency (2.00 eV), wavelength and spectrum identification (3.50 eV), body infrared photon energy (9350 nm), an equal-total-energy photon-number comparison (400/800 nm), and the optional optical-power extension (3.00 mW, 600 nm, 2.00 s). The optional item fits and remains included.
- Rechecked source pages, adaptations, attribution and calculation conventions in [SOURCES.md](public/content/physics/ipst/atomic-physics/assets/19-1-1/SOURCES.md). IPST end-of-chapter Problem 18 is an ordinary problem, not a challenge problem. All added answers are complete in TH/EN. Unrounded values are carried between subparts.
- Independently recalculated the new numerical answers: `4.83e14 Hz`, `355 nm` (UV), `2.13e-20 J = 0.133 eV`, photon ratio 2, optical total energy `6.00e-3 J`, energy per photon `3.313e-19 J`, photon count `1.81e16`. The 650 nm laser count remains `3.27e15`.
- The new comparison graph uses Planck and Rayleigh–Jeans wavelength spectra at 5000 K on one shared normalization. Solid/dashed lines and the caption distinguish trends from raw measurements. All image instances now reserve their actual width/height ratio.

### Checks actually completed for this revision

- Frozen dependency install, production build and TypeScript check passed. Content validation: 0 errors, 32 existing draft warnings; 59 content files. Pages build verified 512 public files identical to their sources. The pre-existing shared CSS build warning is unchanged.
- Unit suite: **334 passed, 0 failed**. Route catalog passed: 10 sections, 80 chapters, 19 topics, 28 HTML-menu contents, 153 legacy tool placements. `git diff --check` passed.
- Source structure: unique keys, TH/EN key order, all original keys retained, one direct answer per slot, no nested slots, continuous question labels, supplied image dimensions, and no authored script/form/iframe/button nodes passed.
- Read the configured public physics catalog again at `2026-10-26T05:33:53Z`; the real bank key remains `b-0f490c3358e9212cee2e2a43`, titled Electromagnetic Radiation from a Blackbody, with 0 quiz questions. Neither the bank identity nor the content ID changed.
- Chromium `151.0.7882.0`, production `dist` served under `/learning-hub/`: opened the actual bank deep link as a guest with the freshly captured catalog response. The iframe retained `sandbox="allow-same-origin"`. External account/database operations were stubbed or blocked; no score/account writes were performed.
- Individual touch reveal preserved area height; TH/EN shared reveal state, reveal-all and hide-all passed for all 128 source slots. Both languages passed at a 390 px viewport with no horizontal document overflow.
- All four central print previews retained only the selected language, all 64 slots, all 28 response groups and all five images. Blank editions had 0 answer nodes; answer editions had 64. Broken images, math errors, page overflow, split response areas and orphaned note headings were all 0. A note heading and its answer area are kept together, including the hot-metal explanation. Print preparation preserved the teaching DOM state.

| Exported through the existing central print controller | Preview pages | Actual PDF pages |
| --- | ---: | ---: |
| Thai student / blank | 17 | 17 |
| Thai answers | 17 | 17 |
| English student / blank | 17 | 17 |
| English answers | 17 | 17 |

The four actual PDFs were reopened and checked as A4 with nonempty pages and no replacement characters. All 68 rendered pages were visually inspected using Poppler contact sheets, with enlarged checks of the comparison graph, Thai text, worked formulas and final pages. There is no references-only final page. Thai fonts are embedded. PDF filenames are `physics-19-1-sheet-1-{th,en}-{blank,answers}.pdf`; local evidence is under `qa-output/physics19-print/` (not committed).

Limits: these checks do not establish native Safari/iPad/Apple Pencil behavior, physical-printer output, account/cloud behavior, or a live Pages release. This revision changes topic content, its menu description, assets and documentation; it does not change the shared language/reveal/math/print engines. Publication requires a subsequent reviewed merge and deployment.

---

Prepared 22 October 2026. The location is the Physics question bank topic **Electromagnetic Radiation from a Blackbody**, not the separate outer-curriculum Atomic Models menu.

- Verified live bank key: `b-0f490c3358e9212cee2e2a43`.
- The service still reports 0 existing quiz questions for this topic. This change adds a learning sheet, not quiz-bank questions.
- Menu: `public/content/bank/physics/b-0f490c3358e9212cee2e2a43.html`.
- Sheet: `public/content/physics/ipst/atomic-physics/19-1-1-blackbody-planck-learning-sheet.html`.
- Content ID: `physics-ipst-atomic-19-1-1-sheet`.
- Route: `#physics/bank/b-0f490c3358e9212cee2e2a43/learning-sheet`; direct content route: `#content/physics-ipst-atomic-19-1-1-sheet`.

## Teaching design approved in conversation

Follow the established 12.1/4.1 style: white space, immediate start, supplied images, recurring short observation questions, note areas for definitions/conclusions/equations, and adequate working space. No student name/class cover, drawing assignment, QR, or simulation links. TH/EN blocks use the same semantic note IDs; solutions reveal in the same spaces.

1. Real infrared/visible photographs of one coffee maker, with credit and a qualitative-temperature caption.
2. Newly plotted blackbody spectra showing the relationships in IPST Fig. 19.2. All curves share one intensity scale, use different line styles, and mark approximate visible wavelengths.
3. Definition of a blackbody, a supplied cavity diagram, and Max Planck's contribution.
4. Fixed-frequency ideal-detector model data: infer a common energy unit and write `E = n epsilon`.
5. Varied-frequency model data: compare energy per unit with frequency and write `epsilon = hf`.
6. Combine the two relationships as `E = nhf`; record symbols, units, J/eV conversion, and `f = c/lambda` for wavelength questions.
7. Three adapted IPST worked examples and four independent questions: **7 main problems**, in addition to recurring questions throughout the sheet.
8. A final three-statement summary written by the learner.

Both numerical activities explicitly say they are simulated/model data, not Planck's original experimental records or independent experimental proof. Frequency is fixed whenever `n` counts identical energy units. The average-energy digression is omitted. Detailed ultraviolet-catastrophe derivations and additional blackbody laws are outside this sheet.

## Validation completed locally

- 312 unit tests passed; content validation, route generation, production build, and `git diff --check` passed.
- Real Hub direct content route and Physics bank tool route opened the shared worksheet UI, with the catalog stubbed from the freshly fetched real public service response. No account or score writes were made.
- 43 semantic note areas in each language; 3 supplied figures per language; 9 content sections; 3 examples + 4 practice questions.
- Individual and reveal-all controls, shared TH/EN state, hidden initial state, mathematical rendering, and image loading passed.
- Both language layouts passed a 390 px viewport check without horizontal document overflow.
- Four A4 exports using the shared print controller passed: Thai blank/answers 14 pages each; English blank/answers 15 pages each. Blank editions contain no answer DOM; all images remain; print preparation preserves the teaching state.
- Thai fonts were loaded and embedded in the QA environment; headers, footers and body were checked. Page images were visually reviewed.

Local evidence: `qa-output/planck-*` (not committed). Native Safari/iPad, Apple Pencil and account/cloud behavior are not verified by these Chromium checks. No shared engine, login, notebook, question-bank service, source IDs, scores or database rules were changed.

Public release status must be checked against the actual merged commit and Pages deployment; a local build alone does not establish publication.

## Revision, 23 October 2026 (Bangkok)

Added an original licensed hot-metal photograph alongside the infrared example. Rebalanced the student sheet: eleven definition/principle/formula areas now have content headings above blank note spaces; observation questions remain around the photographs, graph and two data activities. Removed repeated “จด / Record” commands. Existing note IDs and all seven main problems remain; one new temperature/colour note makes 44 paired slots. The hot-metal asset credit and license are recorded in the asset README.

Revision validation: 312 unit tests and production build passed. All 44 paired note areas, four figures, seven main problems, TH/EN controls and narrow layouts passed browser checks. Updated print editions were visually reviewed: Thai blank/answers 15 pages each, English blank/answers 16 pages each.
