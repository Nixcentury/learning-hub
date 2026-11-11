# 19.1 ใบรวม: ทฤษฎีอะตอมของโบร์และสเปกตรัมอะตอม

> **HTML NOW UPDATED ON DRAFT PR #171 (11 November 2026).** The established worksheet was actually edited into eight short **Learning** stages and an uncapped **Problem** zone. It retains original Questions 1–41 and worked tasks, restores 20 catalogued IPST source groups (25 subparts), adds 32 memory questions and 10 A-Level-style questions per language, and updates the guide. Read [IMPLEMENTATION-QA-2026-11-11.md](IMPLEMENTATION-QA-2026-11-11.md) for counts, the book completeness caveat and remaining browser/build tests. The HTML is **not merged or deployed** until reviewed.

> **CURRENT INSTRUCTIONS (11 NOV 2026)**: Read [REBUILD-Learning-Problem-2026-11-11.md](REBUILD-Learning-Problem-2026-11-11.md) **before** using historical content/counts below. The user approved a phenomenon-first, condensed Bohr **Learning** zone and a fully worked, uncapped **Problem** zone restoring all relevant IPST originals from the old worksheet + 50-question Quiz, plus in-scope A-Level-style practice. Display concise SI origins of Bohr radius and −13.6 eV, formulas visible without copying, and solutions as short setup → Learning formula → rearrange → substitute with units → final answer → short check. The old combined-worksheet structure below is historical. The 20/20 prepared inventory/Quiz linkage has been audited; exhaustive original-book completeness is not yet independently certified. This is a content rebuild specification, **not an already merged HTML revision**.


3 November 2026. This task combines the three worksheets under the existing Bohr bank ID. It does not modify the separate blackbody sheet, Chemistry content, the Quiz Engine, student data or Classroom.

## Entry and compatibility

- bankKey: `b-d65860a41c400f77ee276a35`.
- Main contentId remains `physics-ipst-atomic-19-1-2-sheet`; tool-key remains `learning-sheet-2`.
- Canonical route: `#physics/bank/b-d65860a41c400f77ee276a35/learning-sheet`.
- The same menu has one visible worksheet and its two unchanged video entries. The old `learning-sheet-2`, `learning-sheet-2b` and `learning-sheet-3` routes resolve to the combined sheet using existing route aliases.
- The two old HTML files and their guides are unchanged. Hidden content references register their original content IDs through the existing reading-link mechanism. Old `#content/…` bookmarks and content-ID references can therefore still open the prior documents. No compatibility engine is introduced.

## Content retained and adapted

The unified document has **17 sections, 41 numbered questions, one worked example with two parts, 93 response areas and 21 image placements per language**. The original 20 image placements remain; the added image replaces the hypothetical-atom problem’s inline drawing with a new diagram matching its changed values. Headers, question numbering and cross-document wording now describe one continuous sheet.

All 93 old response areas have a mapped destination. **76 answers per language are unchanged**. This includes the radius derivation, both K/U/E tables and their proof, hydrogen energies, general electron-speed derivation, transition paths, series, Rydberg/Balmer derivation and probability-cloud material. Seventeen response keys use genuinely changed problems and fresh `adapted-` keys. `knowledge-preservation-map.json` lists every destination.

The calculation samples and activity records remain clearly labelled as such. The six grating calculations and their summary are retained. Original IPST question wrappers are replaced by contextual questions; the teaching experiments themselves remain. Adapted numeric problems use n = 5 radius, n = 3 ionization, n = 3/6 speed ratios, a 5 → 2 worked transition, 8 → 2 visibility and a hypothetical atom with energies −10, −4, −1 eV. The last path exercise explicitly specifies only the routes 5 → 1 and 5 → 2 → 1, avoiding a false claim that these are all possible routes from n = 5.

The new figure `assets/19-1-2/adapted-hypothetical-levels.svg` has energy-proportional vertical spacing (the 3 eV and 6 eV gaps have a 1:2 distance ratio), clear n labels and no pre-drawn solution arrow. It is an authored diagram, not experimental data or a book crop. Both language captions explain it.

## Read source and preserve originals for the companion quiz

The actual scanned [teacher-supplied IPST Physics Book 6](https://drive.google.com/file/d/1claSYEw2Laz0zWRXjNcI9jhbt7A2sGMd/view) was downloaded and visually read: printed pp.59–80 and pp.105–110, with PDF page = printed page + 13. The full 32 MB book and temporary page renders are not committed.

`ipst-original-items.json` reserves **20 source tasks**: the magnet activity, the three spectrum activity questions, Example 19.4(a–b), the p.77 Think question, Understanding 19.1 Q1–3, Exercises 19.1 Q3–6 and the relevant chapter-end questions/problems. It records the book’s original data, subparts, required figures and accuracy notes. Thai prompts are transcribed or closely normalized from the scan; English prompts are authored translations. This is not a claim that a new Quiz has been built in this PR.

`source-fragments.json` preserves the exact pre-edit bilingual HTML question blocks and their full section context, including old answers, givens and the old inline hypothetical-level diagram. These worksheet fragments are an additional continuity record and must not be mistaken for exact textbook transcriptions.

Four original problem figures are cropped into `quiz-source-images/`, with page numbers, normalized crop rectangles, dimensions and SHA-256 recorded in the inventory:

| File | Book page | Use |
| --- | --- | --- |
| exercise-19-1-q5.png | 80 | Original −7, −3, −1 eV atom; initially n = 2 |
| chapter-question-3.png | 105 | Original four-level line-count diagram |
| chapter-problem-2.png | 106 | Original −5, −4, −2 eV levels |
| chapter-problem-4.png | 107 | Original levels and 414/621/1242 nm spectrum |

These are unchanged-value source crops from the teacher-provided book for the future review questions; they are not displayed in the adapted worksheet. General explanatory book figures already used in the teaching sheet remain with their prior credits. In particular, the corrected n = 1 ground-state diagram remains in use; the book’s p.72 n = 0 typo is not reintroduced. The p.76 metre-exponent typo is recorded so future quiz explanations use 486 nm = 4.86 × 10⁻⁷ m correctly.

Exercises 19.1 Q1–2 and the separate Planck/blackbody tasks stay with their original bank ID. Photoelectric and de Broglie questions are outside this work. Chapter-end material is reserved here for a later quiz; it is not silently appended as extra student writing.

## Unified guide

`guides/19-1-2-unified.guide.json` has 17 authored bilingual steps. It adds the evidence/experiment lead-in, preserves the existing orbit/energy and transition teaching routes with updated question references, and rewrites the affected example/initial-state summaries for the adapted data. Each step has a short content summary, story, minimum action, real target links and a check with an answer. Its source identity, revision and final HTML fingerprint match. Legacy guides are unchanged.

## Checks actually performed

- Content audit: both languages have matching sections, question numbers, slot keys, image sequence and adapted givens. All 93 source slots are accounted for; all 76 retained answers per language compare equal to the baseline DOM.
- Recomputed 19 numerical cases independently from givens, including all six grating readings, new radii/speeds/ionization, photon energies and wavelengths. Also checked K + U = E at five hydrogen levels.
- New SVG rendered and visually inspected; four original problem crops visually inspected for level labels, units and complete required figures.
- All 198 MathJax expressions are below the current 500-expression document limit. Every image path exists. This check does not claim browser rendering of each equation.
- Existing route builder resolves all four worksheet URL forms to the main content ID and retains both legacy content IDs. Both video descriptors compare unchanged.
- `pnpm validate:content` passes: 0 errors, 33 existing draft warnings; six linked guides validate. `pnpm build` passes and verifies the Pages public artifact.
- `git diff --check` passes. No full engine/Classroom regression suite is run, following the teacher’s content-focused QA instruction.

This task does **not** claim native iPad/Safari verification, actual A4 pagination/printing, a new companion Quiz, or deployment to GitHub Pages. PR publication is separate from merge/deployment.

## Next quiz task

Use the original-item inventory, source fragments and source figures together. Keep every requested subpart, distinguish one atom from an ensemble, state visible-band and rounding conventions, and retain the activity sample-data provenance. Follow the latest mostly-drag rule for theory with unused distractors, typed/choice answers for calculation, and the shared paired worksheet review link. The current PR only prepares this source material while completing the unified worksheet.
