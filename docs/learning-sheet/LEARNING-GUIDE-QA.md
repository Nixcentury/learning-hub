# Shared worksheet guide — QA, 29 October 2026

## Delivered behavior

Every Hub learning-sheet window has an **ไกด์ใบนี้ / Sheet guide** button, including Guest. Each guide belongs to one worksheet contentId. Wide windows use a side panel; windows below 900px use a drawer. Closing, switching language, minimizing and jumping to a target keep the source iframe and its answer state intact. Guides remain outside the printed worksheet.

The first authored example is **19.1 Sheet 2 Part 2: Bohr Orbits and Energy**, contentId `physics-ipst-atomic-19-1-2b-sheet`. Its five stops cover radius, energy meanings, energy calculations, ionization and speed. Each has a short bilingual summary, discussion suggestion, minimum work, actual worksheet targets and a self-check with a collapsed answer. Other worksheets show a clear “no guide yet” message; this change does not author guides for the entire bank.

Authoring instructions: [LEARNING-GUIDE.md](LEARNING-GUIDE.md). Guide summaries are authored from the worksheet and checked with it. They are not generated while the student reads. Build validation checks catalog identity, revision, SHA-256 of the authored HTML and targets in both languages. Runtime checks identity/revision/targets and offers retry after loading errors.

## Automated verification

| Check | Actual result |
| --- | --- |
| `pnpm test:unit` | 430 passed, 0 failed, including 9 guide tests |
| `pnpm build` | Passed content validation, guide validation, TypeScript, Vite and Pages artifact checks |
| Content validation | 0 errors; 32 existing draft warnings |
| Guide validation | 1 worksheet, 0 errors |
| Pages artifact | 642 public files match their source; resource paths stay under `/learning-hub/` |
| `git diff --check` | Passed |
| Source preservation | Worksheet HTML matches the base byte for byte after removing only the root guide/revision attributes and the two semantic figure anchors |

Guide tests cover required bilingual summaries, unsafe/malformed links, stale revisions, real targets, lazy fetching, safe text rendering, language/check state, closing, drawer jumps, empty/error/retry behavior, replacement-document isolation, separate windows and detection of source edits even when semantic targets still exist.

## Browser verification

Tested in cloud Chrome against the production build through the Hub, as Guest. Narrow viewport checks used an iframe fixture with real viewport widths of 375px and 768px; this was not physical iPad/Safari testing. An isolated preview-only compatibility shim supplied crypto helpers unavailable on the HTTP preview origin. No shim is included in the repository.

- Thai and English guide text and five summaries display correctly.
- Jumping to Question 8 selects the active language, scrolls to the actual slot and leaves its answer closed.
- Opening a guide answer and switching language keeps the corresponding guide answer open without revealing worksheet answers.
- Close button and Escape close the panel. In the drawer, Shift+Tab from close wraps to the final answer summary, and Tab wraps back to close.
- At 375px and 768px, the worksheet window does not overflow horizontally. All language, guide, share and print actions remain reachable. The narrow toolbar uses two rows.
- The source iframe is inert while the drawer is open. Jumping closes the drawer and restores source interaction.
- A worksheet without guide metadata shows the explicit empty state. Opening/closing another worksheet does not populate it with the sample guide. Minimizing and restoring the sample preserves its guide.
- Unit tests cover failed fetch/retry and mismatched revisions; browser verification used the real local guide, not an intercepted failure response.

## Print regression

Print preview was generated with the guide open, for all four combinations:

| Language / edition | A4 pages | Response slots | Answers present | Images |
| --- | ---: | ---: | ---: | ---: |
| Thai / blank | 12 | 39 | 0 | 4 |
| Thai / answers | 12 | 39 | 39 | 4 |
| English / blank | 12 | 39 | 0 | 4 |
| English / answers | 12 | 39 | 39 | 4 |

Counts match the accepted worksheet. No guide panel or highlight stylesheet entered the print snapshot, and no horizontal page overflow was observed. A source answer opened before printing remained open after the preview closed. These checks inspect Hub print previews; no physical printer test was performed.

Browser screenshots were retained in ignored `qa-output/learning-guides/desktop.jpg` and `mobile.jpg` in the development workspace. They are QA artifacts, not published site assets.

## Follow-up: complete QA of 19.1 Sheet 2 Part 2

Reviewed all five sections (6–10), all 39 paired answers, both K/U/E tables, worked examples, Questions 8–16, Understanding 19.1 Q1, Exercises 19.1 Q3/Q4/Q6(a), and all four figures. Recomputed the constants and each numerical result, retaining the existing three-significant-figure rounding. The physics was also cross-checked against [OpenStax University Physics 3, section 6.4](https://openstax.org/books/university-physics-volume-3/pages/6-4-bohrs-model-of-the-hydrogen-atom). This was not a new reading of the original IPST/teacher-guide PDFs; their existing question allocation is unchanged.

| Reviewed part | Result |
| --- | --- |
| Bohr condition and radius proof | Force equation and angular-momentum substitution yield rₙ = a₀n²; positive-integer n is distinguished from photon count |
| Radius exercises | Q8: factor 4; Q9: n = 5; Exercise 6(a): 4.76 × 10⁻¹⁰ m |
| Energy tables and proof | Table totals −2, −5, −10 eV; ratios U/K = −2, E/K = −1, U/E = 2; K = −E and U = 2E follow for the circular Coulomb orbit with zero potential at infinity |
| Q11 and energy ordering | E₂ = −3.40, K = +3.40, U = −6.80 eV; n = 3 has higher energy while n = 2 is more tightly bound |
| Excitation/ionization | 10.2 eV excites 1 → 2; minimum ionization is 13.6 eV from n = 1, 3.40 eV from n = 2 and 0.850 eV from n = 4 |
| Speed and Q16 | vₙ ≈ 2.19 × 10⁶/n m/s; at n = 4, r = 8.46 × 10⁻¹⁰ m and v = 5.48 × 10⁵ m/s |
| Figures | Force points inward, velocity is tangential, radius labels show 1:4:9, energy-level values/order and opposite transition arrows agree |

Two guide fixes were made: corrected a remaining Thai “table 1 and B” to “tables 1 and 2”; changed the section 9 diagram link to target the actual energy-level figure through paired semantic anchors. Worksheet revision is now `2026-10-29-2`, and the guide source hash was reviewed and updated. No visible worksheet text, question, answer, image, response key or height changed; this was checked byte for byte after removing guide metadata/anchor attributes. No shared engine or other worksheet was edited.

Clicked all **18 guide buttons in Thai and all 18 in English** in the real Hub. All 36 jumps reached the intended active-language target within the viewport and left all source answers closed. The diagram link now shows the figure directly. Rebuilt and repeated all four print-preview combinations: still 12 pages, 39 response slots and four images each; blank has zero answers, answers has 39; zero guide elements, MathJax errors or horizontal page overflow. Targeted guide tests: 9 passed; current production build and guide validation passed. Earlier 430-test full suite and GitHub browser CI passed for the unchanged shared engine.

Additional local evidence: `qa-output/learning-guides/bohr-qa-results.json` (all jump/print metrics) and `bohr-qa-diagram.jpg` (current guide and the actual diagram side by side).
