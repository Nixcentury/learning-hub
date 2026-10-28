# Chemistry 10.3 learning sheets — QA

28 October 2026. Built from main `7d0abf7` in branch `codex/chemistry-10-3-learning-sheets-20261028`.

## Scope and placement

- Existing Chemistry bank topic: `b-c667274676708616e5923b20`, verified from the live Hub Chapter 10 topic. The new menu contains three worksheets, preserving the existing system-supplied quiz and notebook.
- Slug `acid-base-ionization`; tool keys `learning-sheet`, `learning-sheet-2`, `learning-sheet-3`; content IDs `chemistry-ipst-acid-base-10-3-1-sheet`, `chemistry-ipst-acid-base-10-3-2-sheet`, `chemistry-ipst-acid-base-10-3-3-sheet`.
- Three new HTML files under `public/content/chemistry/ipst/acid-base/`, six local SVG diagrams and their `assets/10-3/SOURCES.md`, one topic menu and this report. No source changes to shared engines, CSS, other lessons, student data, Apps Script, Firebase, dependencies or generated catalogs.

## Coverage and content audit

The student section was visually read on printed pp.14–30 / PDF pp.24–40. The matching teacher guide's extracted text and solutions on printed pp.19–43 were checked. Item-level coverage and all 100 semantic area keys are documented in SOURCES.md.

- All nine Exercise 10.3 main questions, including every requested output and every separated subpart, are included: Q1 in sheet 1, Q2–7 in sheet 2, Q8–9 in sheet 3.
- All seven original understanding items are included, with the HA/HB item scaffolded into three separate areas.
- Original worked examples 2–6 are retained. Example 3 has separate spaces for amounts and final concentrations.
- Activity 10.1 is complete: three bases at 0.50 M, their comparison, four acetic-acid concentrations, the graph, and both end questions. It is identified as a calculation/comparison activity. The original graph task remains, with a prepared graph in the solution for teaching and comparison.
- The source's molar masses and necessary Ka/Kb values are supplied. Selected reference-table values support the tasks; students are not asked to memorize every constant.
- 33 authored scaffold questions: 10 / 15 / 8 across the three sheets. Questions address specific bridges and errors rather than adding unrelated advanced topics.
- 26 headed knowledge areas and 74 individual question/example/activity containers: 100 paired areas in total. Both languages have exactly 27 / 53 / 20 areas and matching keys and writing-space sizes. Every question container contains exactly one answer area.
- Both complete language blocks were checked for matching numbers, formulas, images, source identifiers and order. No Thai remains in visible English worksheet text. Added question numbering runs from 1 without gaps within each file.
- All 48 complete chemical-equation instances across the three bilingual HTML files passed an independent atom/charge balance audit.
- Nineteen independent numerical cases were recalculated: mole/mass conversions, weak equilibria, approximation comparisons, activity concentrations, and reverse Ka calculations. Full-equation roots satisfy the substituted equilibrium expressions.
- Textbook approximations and exact calculations are distinguished. The adopted C/K > 1000 criterion is checked before square-root calculations. Only x in C−x is neglected; the failing example uses the quadratic and selects its positive root.
- The guide's early-rounding differences and typographical errors are documented in SOURCES.md and not propagated: HA quadratic 9.51×10⁻⁵, Exercise Q7 Ka 1.4×10⁻⁵, Q4 Kb 1.0×10⁻⁴, and Q6 second concentration 0.40 M.
- Kw is tied to temperature; KaKb = Kw is restricted to the correct conjugate pair. No pH logarithm, pKb, buffer, titration or broad salt-classification content is introduced.

## Automated checks

- `pnpm test:unit`: 395/395 pass. This includes the existing bank, Learning Sheet, math, print and navigation tests. No new implementation-mirroring unit tests were added for these static content files.
- `pnpm validate:routes`: pass; all three new items are discovered through the topic menu.
- `pnpm build`: pass, including content validation, TypeScript, Vite and Pages artifact verification. Content validation has zero errors and 32 existing draft warnings. The final build log records the actual public-file count.
- `git diff --check`: pass.
- Contract/structure audit: paired keys, one direct answer per slot, one space per question, existing image paths, counts and ordinary question order pass. No hidden control characters remain in authored text.

Local evidence is under ignored `qa-output/chem103/`: build/unit/routes logs, numeric and equation audits, actual catalog snapshot, central-print reports/snapshots, narrow-screen report and the final worksheet screenshot. These are QA artifacts, not deployed student content.

## Actual Hub and responsive browser checks

The production build was served under `/learning-hub/` through the managed preview, and opened with Guest in the actual Hub. The real Chemistry catalog was read; the topic displayed all three new cards and the ordinary quiz/notebook cards. Each worksheet was opened through its authored route.

The managed preview is HTTP and lacks secure-context `crypto.randomUUID` and `crypto.subtle`. To permit the existing navigation to run in this test environment only, the preview copy received a randomUUID compatibility function and exact SHA-256 chapter digests precomputed from the unmodified live catalog. Unknown digest inputs still fail. These compatibility changes are absent from the repository and the submitted tree. No authentication, scores or Cloud writes were exercised.

- All three source documents reached `data-hub-math-state="ready"`. Zero math errors and zero broken images. A two-position TeX escape defect found during QA was corrected and the source rebuilt before the successful checks.
- All six scientific SVGs were viewed in-browser: identical conductivity apparatus, exact 20-molecule models, conserved acid units/charge, common bar-chart scales and the four-point dilution curve were inspected.
- Individual native summary reveal, reveal-all/hide-all and shared TH/EN reveal state were exercised. All 27 paired sheet-1 slots reveal together and return to zero; sheet 2 revealed all 53 in the narrow view.
- All three sheets were checked in both languages inside a 390px-wide full-Hub iframe fixture. The actual worksheet viewport was 357px wide. Each document's scroll width matched its client width; all 27 / 53 / 20 areas remained present, with no image or equation errors. This is a responsive Chromium check, not native iPad/Safari.

## Central A4 print preview

| Sheet | Language | Blank pages | Answer pages | Areas | Blank / answer image count |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | TH | 9 | 9 | 27 | 1 / 2 |
| 1 | EN | 9 | 9 | 27 | 1 / 2 |
| 2 | TH | 22 | 22 | 53 | 3 / 4 |
| 2 | EN | 23 | 23 | 53 | 3 / 4 |
| 3 | TH | 7 | 7 | 20 | 0 / 0 |
| 3 | EN | 7 | 7 | 20 | 0 / 0 |

All 12 central previews were generated and checked. Each contains the selected language only, the expected notes, all individual question containers and every answer area. Blank editions contain zero answer elements; answer editions contain 27 / 53 / 20. Solution diagrams disappear in blank editions and given diagrams remain. Every measured page body has no horizontal/vertical overflow. Each question remains with its own area. The longest worked-example layout was also viewed in the paper preview.

These checks concern the actual central print DOM and visible browser preview. Native PDF export, native iPad/Safari, Apple Pencil and physical printer output were not tested.

## Delivery state

The submitted branch/PR is ready for teacher review. No merge or public deployment is claimed. Merge and successful Pages deployment are still required for the new menu to appear on the public website.

## Teacher review follow-up — 28 October 2026

Scope: the three annotations in the teacher's uploaded Chemistry 10.3 review. Based on main `ec25f7c`; only sheets 1 and 2 and this QA record are edited.

- Sheet 1, `prepare-solution`: replace the compressed variable/arrow chain with three numbered explanations: required moles of ions, moles of the compound from the balanced-equation ratio, then mass from that compound's molar mass. Each step identifies the quantity and units; the KOH and Ba(OH)2 comparison explains why the latter requires dividing hydroxide moles by two. Paired writing space increases from 27 to 65 mm.
- Sheet 2, `acid-constant`: place an ICE table directly beside the derivation, retaining the earlier introductory ICE area. Define C and x, state the initial-ion/water assumptions, show the reaction, and substitute the equilibrium row to obtain (x)(x)/(C−x). The text explains both the squared numerator and the remaining-acid denominator. Paired writing space increases from 38 to 115 mm. The repeated reaction omits phase labels to fit the narrow view.
- Sheet 2, authored Question 7: repeat the complete initial concentration (0.100 mol/L) and ionized concentration (0.002 mol/L), specify a monoprotic acid, and state the water approximation. The prompt is self-contained. Recalculation gives Ka = 4.08163265×10⁻⁵, consistent with its existing 4.1×10⁻⁵ answer.
- Both language versions are updated. All original semantic area keys, question counts and source questions are retained: 27 areas / 18 question containers per language in sheet 1, and 53 areas / 43 question containers in sheet 2. Every slot retains one direct answer; every question retains its own space. Sheet 3, bank menus, shared engines and dependencies are unchanged.

Verification for this follow-up:

- The existing Learning Sheet, math, print and bank-menu unit tests pass: 33/33. The content build, TypeScript, Vite and Pages verification pass. `git diff --check` passes.
- Browser QA uses the updated worksheet HTML in a preview-only parent fixture with the repository's unmodified Learning Sheet, MathJax and central-print modules. The content iframe keeps the scripts-disabled sandbox. This follow-up does not claim a fresh actual-Hub/catalog test.
- In both languages and both sheets, a 390 px iframe (375 px content viewport after the scrollbar) has no document overflow. The new ICE formulas also have no internal horizontal overflow. All formulas render without errors. The updated mass steps and ICE derivation were visually inspected, including all four language/sheet answer previews.
- Eight A4 central previews were checked: blank and answers in both languages for each changed sheet. Sheet 1 has 10 pages in either language/edition; sheet 2 has 23 Thai or 24 English pages in either edition. No page body overflows. Blank editions contain zero answer elements; answer editions contain exactly 27 or 53. Only the chosen language is present. The ICE table and derivation remain together on one page.
- Local evidence includes the preview report and the screenshot of the complete ICE derivation and revised Question 7. Native PDF export, native iPad/Safari and physical printing were not tested. This update is prepared as a draft PR for review; no merge or public deployment is claimed.
