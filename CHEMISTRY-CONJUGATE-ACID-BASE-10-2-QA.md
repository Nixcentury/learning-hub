# Chemistry 10.2 — Conjugate Acid–Base Pairs

25 October 2026, Asia/Bangkok. Content work on `codex/chemistry-conjugate-pairs-10-2-20261025`, based on main `d3cb52f7a0a4ea404aa78c651ef1091b66503f35`.

## Placement and scope

- The existing chemistry service catalog was read using the repository's current endpoint and client parameters on 25 October. The exact topic is `คู่กรด-เบส(Conjugate Acid-Base Pairs)`, path `เคมี (CHEMISTRY) / Learning hub / กรด-เบส(Acids and Bases) / คู่กรด-เบส(Conjugate Acid-Base Pairs)`, bankKey `b-5e60aad52e28d90a4d818b29`, with zero bank quiz questions. No hash was computed or borrowed.
- New menu: `public/content/bank/chemistry/b-5e60aad52e28d90a4d818b29.html`.
- New sheet: `public/content/chemistry/ipst/acid-base/10-2-conjugate-acid-base-learning-sheet.html`.
- Stable content ID `chemistry-ipst-acid-base-10-2-sheet`, tool key `learning-sheet`, kind `html`.
- Authored route: `#chemistry/bank/conjugate-acid-base-pairs/learning-sheet`; the bankKey route is also discovered by the existing route builder. This is a route verified in the production preview, not a claim of public deployment.
- The ordinary chapter menu and existing 10.1 are unchanged. No shared engine, CSS, catalog output, account, Sheet, Apps Script, Firebase, dependency or lockfile changes.

## Content and source audit

The supplied student PDF was visually read across printed pp.9–14 / PDF pp.19–24, and checked against the teacher guide printed pp.15–19 / PDF pp.28–32. The neighbouring Exercise 10.1 and section 10.3 are excluded. Full item-level mapping and the original-diagram inventory are in `assets/10-2/SOURCES.md`.

- All four original understanding equations are included, with both pairs and forward acid/base roles.
- The original four-species understanding table has six independently controlled answer cells and retains its two given dashes. The stated scope prevents interpreting a dash as impossibility under every condition.
- The original Think question and its two species, with reasons, are included.
- Original Example 1 (HCO₃⁻ with water) has separate answer areas for its two roles.
- Exercise 10.2 is complete: Q1.1–1.2 (equation and conjugate-pair diagram), Q2.1–2.4, Q3.1–3.4 and Q4 (water and its two roles): 11 subitems.
- Monoprotic/polyprotic vocabulary, all three H₃PO₄ steps and both S²⁻ protonation steps are represented.
- 37 continuously numbered scaffold/parallel questions include formula/charge changes, reacting species versus conjugate partners, reordered products, non-water donor/acceptor pairs, adjacent steps, backward partner identification, diagnosing wrong answers, and changed partners for an amphiprotic species.
- Supplementary designs were checked against OpenStax Chemistry 2e §14.1/exercises and Chemguide's relevant questions/answers. There is no claim of included A-Level questions.
- Seven internal sections, four worked-example groups with five individual answer areas, 12 headed knowledge slots and 76 paired semantic slots per language. There are 58 individual question/example containers plus six table answer cells per language.
- Eight original SVG files; nine image instances per language. Three are given diagrams and six instances occur only inside solutions. The water diagram distinguishes two molecules and matches the displayed product order.
- A separate atom/charge audit checked all 54 complete equation instances across both languages; zero balance errors. A pair-difference audit flagged only the deliberately invalid H₃PO₄/HPO₄²⁻ pair quoted in its corrective explanation (once per language); these were reviewed manually.
- Formula lists, charges, reaction directions, original exercise answers and TH/EN text were reviewed. No pH/Ka/Kb/strength calculation is added. Possible amphiprotic roles are not described as equal equilibrium extents.

## Automated checks

Final checks used Node 24.22.1 and the pinned pnpm 11.19.0 (via npx); the frozen lockfile installation left dependencies and lockfiles unchanged.

| Check | Actual result |
| --- | --- |
| Learning Sheet contract / content validation | 0 errors; 32 existing draft warnings |
| Unit suite | 333/333 pass |
| Route validation | Pass; new topic menu and content discovered |
| Production build | Pass, including content validation, TypeScript, Vite and Pages artifact checks; 485 public files match sources |
| Added-question sequence | TH 1–37 and EN 1–37, in order |
| TH/EN structure | 76 slots each, matching semantic keys and writing-area sizes; 58 question/example containers each |
| Per-question answer areas | Every individual question/example owns one slot; six table cells are separate slots |
| `git diff --check` | Pass |

## Hub and browser checks

Chromium 151 Chrome Headless Shell served the production `dist` under `/learning-hub/`. The Hub used a captured, unmodified response from the real chemistry catalog read for this task. Firebase was stubbed with writes blocked. Thus the bank/menu/workspace were the actual application, while network/account edges were controlled; no student or Cloud data was written.

- Topic page shows the new worksheet card. Its zero-question Quiz is disabled and the worksheet card opens the exact authored bank route.
- Scripts-disabled iframe, current shared controller, individual touch reveal, reveal-all/hide-all, stable reveal geometry and shared TH/EN reveal state pass.
- All 152 slot instances, 18 image instances and math render successfully. No broken images, math errors or page errors.
- At a 390px browser viewport, the maximized Hub worksheet iframe has 386px usable width. Both languages have no horizontal overflow and all 76 slots/58 question containers. This is a responsive Chromium check, not native Safari/iPad.

## Central print and actual PDF export

| Language | Edition | Preview pages | Slots | Answer nodes | Images | PDF pages |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| TH | blank | 25 | 76 | 0 | 3 | 25 |
| TH | answers | 25 | 76 | 76 | 9 | 25 |
| EN | blank | 25 | 76 | 0 | 3 | 25 |
| EN | answers | 25 | 76 | 76 | 9 | 25 |

- All four central previews contain the selected language only, all 58 question/example containers and all six table cells. No page-body overflow, broken images, math errors or question/area separation; minimum measured slot height is 69px in the paper preview.
- Blank copies physically remove answer elements, including solution diagrams. The three given reference diagrams remain. Changing print editions does not change the teaching document's reveal state.
- All four PDFs were actually exported with Chromium, reopened and checked as 25 A4 pages each. No replacement-character glyphs in extracted text.
- Poppler rendered all 100 exported PDF pages. Every page was reviewed in contact sheets; enlarged checks cover the Thai/English formula/diagram pages and complete source exercises. An initial MuPDF rasterization omitted some visible vector elements; a separate Poppler render of the same PDF confirmed the content is present. No authored-file or shared-engine change was made for that viewer difference.
- QA-only Noto Sans Thai was installed in the local renderer for Thai glyph coverage. Fonts are embedded by Chromium in the exported PDFs; no new font dependency is added to the website.
- Local evidence: ignored `qa-output/chemistry-10-2/` (browser reports, print HTML snapshots, PDFs, screenshots, PDF metrics and Poppler renders); supporting atom/charge audit and source catalog snapshot are under ignored `work/chemistry-10-2/`.

## Remaining device and publication checks

- Native iPad/Safari, its print/PDF driver, Apple Pencil and physical printer: not tested.
- Browser PNGs are internal QA evidence, not user screenshot deliverables.
- No public deployment is claimed here. The branch/PR must be merged and the Pages build/deploy plus live deployment marker and worksheet route verified before reporting that it is on the public website.
