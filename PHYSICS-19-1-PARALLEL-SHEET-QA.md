# Physics 19.1 Sheet 1 — parallel-problem revision QA

3 November 2026. Base commit: `2e068d278fb95ab0700308c3bc662c8068913f9b`. Source revision: `2026-11-03-2`.

## Result and scope

Replace nine source-task groups with newly authored problems targeting the same skills, while reserving the IPST originals for a later complete Quiz. The user explicitly requested the learning sheet first. The current 20-question Quiz, its activity ID, topic menu and all other sheets are unchanged. This PR does not merge or publish itself.

The revised sheet retains nine sections and all original instructional content, both simulated activities, images, credits and authored supplementary problems. Fifty answer areas per language are byte-identical to the base. Sixteen replaced areas receive new `parallel-` slot IDs; one new frequency area is added to Question 13. There are 67 paired TH/EN answer areas, each with one direct complete answer. Outside the nine revised blocks, the source revision and section-7 introductory caption, the HTML is byte-identical to base.

## Source and original-task preservation

The actual scanned IPST student book was visually inspected on printed pp.54–58, 80, 108–109. Its file size and SHA-256, original Thai prompts, authored English translations, data and required outputs are recorded in `docs/learning-sheet/preparation/physics-blackbody-19-1-1/ipst-original-items.json`. All 18 pre-swap bilingual worksheet blocks are preserved exactly in `source-fragments.json`; each was checked against the base HTML. The source PDFs and temporary page renders are not committed.

The selected examples/exercises have no attached problem diagram. The portrait on p.58 is supplementary biography, and the energy-level figure on p.80 belongs to Exercise Q5 outside this first-sheet scope. All existing teaching images remain unchanged.

Original chapter-end Q11 asks for frequency, wavelength and band. The old adapted worksheet omitted a separate frequency area; the revised Q13 now includes all three. This is also recorded for future Quiz authoring. Original chapter-end Q18 is not interpreted as a hard longest-wavelength cutoff for body radiation.

## Scientific verification

- Independently recomputed all 14 new numerical outputs: energy in J/eV, frequency, whole-quantum total energy, wavelength, laser photon count and infrared photon energy.
- Checked three-significant-figure final rounding against unrounded computed values. The stated 520 nm wavelength is explicitly identified as three significant figures. Multi-part calculations do not reuse rounded intermediate answers.
- Confirmed J ↔ eV conversion direction, nm ↔ m conversion, `c = fλ`, `ε = hf`, `E = nε` and the distinction between one-photon energy and total energy.
- Independently calculated 310.59375 nm for Q13, consistent with its rounded 311 nm answer and ultraviolet classification relative to the sheet’s approximate 400–700 nm visible band.
- Checked that the new conceptual question counts four detected quanta at fixed frequency rather than multiplying frequency by four. Zero detection is explained within the existing detector model.
- The revised Think question explicitly labels the temperature readings as hypothetical. Its retained photograph is not presented as the source of those measurements or as a universal colour thermometer.
- The two original model-data activities and their separately stated rounded constant are unchanged; their simulated status is preserved.
- Corresponding problem data, subpart labels, numerical answers and scientific conclusions were reviewed in TH/EN. All 67 semantic keys occur in the same order in both languages.

Detailed machine-readable results: `docs/learning-sheet/preparation/physics-blackbody-19-1-1/content-correctness-audit.json`.

## Validation

- Activity/content validation: 0 errors; 33 pre-existing draft warnings.
- Learning-guide validation: 5 linked guides, 0 errors. The existing guide’s targets, revised laser data, learning actions, revision and source SHA-256 are updated.
- `node --test scripts/learning-sheet.test.mjs scripts/learning-guide.test.mjs`: 14/14 passed.
- Direct MathJax 3.2.2 SVG typesetting of every formula in the final bilingual source: 230 expressions, 0 errors, using the same base/ams/mhchem package set as the Hub renderer.
- `pnpm build`: passed, including TypeScript, content/guide validation and Pages artifact verification; 717 public files matched.
- `git diff --check`: passed. The base Quiz, menu, other sheets, images and shared code are unchanged.

The headless-browser attempt could not establish a working browser session in this environment, so no new browser UI, native iPad/Safari or final printing result is claimed. The 230-formula result is direct MathJax typesetting, not a browser-screen test. This content-focused revision does not change the shared reveal or printing controllers.

## Next pending work

After reviewing the worksheet, replace the old 20-question Quiz with complete editions of at most 50 questions, covering all required IPST originals, the full learning-sheet recall content and both simulated activities. Recall mainly uses drag/tap placement with distractors; calculations use numeric input or suitable choices; conceptual questions use choices. The review button must open this worksheet alongside the Quiz. No Quiz implementation is part of this PR.
