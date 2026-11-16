# QA v1.3 — experiment first, numbered equations, equation-led worked answers

The introduction now uses known interference to motivate three controlled measurements in the existing **Light · measure fringes** lab. It states conclusions in words before asking how theory explains them. Definitions and diagrams precede derivations; all fifteen numbered equations precede the first worked example. Important equations are boxed where derived. Δx consistently denotes adjacent-fringe spacing; screen position remains a separate quantity.

## Scope and preservation

- Updated `docs/learning-sheet/README.md`, `STARTER-PROMPT-TH.txt` and `QA-CHECKLIST.md` before implementation. The first remote commit, `6daa01efb36b757c0bb50d56b102302c83b9af22`, contains only these manual changes, including the requirement to start worked answers with a referenced symbolic equation.
- Kept all 12 original example prompts and their numerical calculations/results in each language. `examples-v1.2.json` snapshots the original examples for preservation checks. Transformation changes the spacing symbol, clarifies position subscripts, adds equation references/definitions, and displays mathematical steps separately.
- Kept `exit-exercises.json` byte-for-byte: SHA-256 `a0e80e4503a0605f182bcee4e786796c1341df0ed97e430b41138125628e61a8`. Its two cloze articles, nine multipart problems and four Recall groups remain. Equation starts are added by the generator; original numerical work and formulas are checked for preservation.
- Calculation solutions begin with **Use equation(s) (…)**, the actual referenced symbolic formula, then rearrangement/substitution and calculation. The formulas are read directly from the canonical numbered theory. Relevant calculation Recall answers follow the same pattern.
- Classroom answers and **both Exit editions** share exactly the same complete 12-page canonical Notes, including the experimental conclusions and worked examples. Turning Exit answers off hides exercise answers, not Revision Notes.
- Kept the existing 8 pt identity / 10 pt body / 11 pt heading hierarchy and the student worksheet writing-space rules. Full-width answer solutions need more pages. Authored counts in both languages: Classroom all 12 / theory 6 / examples 6; Exit student all 20 / Quiz 8 / Notes 12; Exit answers all 25 / Quiz 13 / Notes 12.
- New public `*-v1-3.html` files; older published files/assets retained. Existing menu IDs, tool keys, routes, original worksheet, review-50 and lab entries retained. New unreferenced generated SVGs removed.
- The introductory simulation link reuses the lab's stable content ID and simulation execution context. A small extension of the existing declarative link handler supports `data-hub-simulation`; it does not create a new simulation, print or scoring engine. A unit test checks matching lab window identity, ordinary read-only HTML behavior and rejection of remote sources.

## Automated validation

- `pnpm test:unit`: **785 passed, 0 failed**, including all 14 tests across `double-slit-paired.test.mjs` and `content-tool.test.mjs`.
- Shared content and print-selection contracts checked for all **24** language/edition/range combinations. Tests check all numbered equations appear before examples, all references resolve, the introduction contains no formula, β is absent, and the original questions/calculations are retained.
- Added a renderer guard against remaining TeX delimiters. The renderer normalizes adjacent text nodes before processing `aligned` equations so ampersands cannot silently split and drop numeric calculations; preservation tests cover this failure.
- `pnpm build`: passed content validation (0 errors, 33 existing draft warnings), learning guides (12 sheets, 0 errors), TypeScript, Vite and Pages artifact validation (1544 public files identical; resource paths under `/learning-hub/`).
- `git diff --check`: passed.

## Offline layout evidence and limits

Used the existing Hub `buildHtmlPrintSnapshot`, `applyContentLanguage` and `prepareExitTicketPrint` functions to prepare all 24 static selections. Rendered the complete Classroom answer Notes and Exit answer Quiz in both languages with **WeasyPrint 66.0**, only local fonts/images, with external resource fetching blocked. All four rendered selections matched authored counts (12, 12, 13, 13) with no page-body vertical or horizontal overflow. Detailed results are in `layout-report-v1.3-offline.json`. Visually inspected representative introduction, boxed spacing derivation, worked position/angle examples, experimental data-table solutions and Recall pages.

**This is offline evidence, not a Chromium/Hub/iPad print certification.** The connected browser could not reach the local server; the environment also prevented local Chromium from opening sockets. No workaround to browser protocol restrictions was used. The offline renderer does not reproduce the existing nested flex/grid blank-writing-space behavior reliably, so it is not used to certify student worksheet pagination. Student selections have automated content/page contracts and unchanged writing-space logic; actual central Hub controls, clicking the lab link, native PDF saving, iPad/Safari and physical paper printing remain unverified in this round. Offline PDFs and scratch screenshots are not published as final handouts.
