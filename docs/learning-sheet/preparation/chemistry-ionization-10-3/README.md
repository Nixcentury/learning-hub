# Chemistry 10.3 — combined learning sheet and reserved Quiz stock

User decisions, 3 November 2026: combine the three old 10.3 sheets, reserve original IPST problems and their images for a later parallel Quiz, use similar newly authored problems in the sheet, and retain useful existing questions. **There is no page limit. The user does not print this sheet and requested content-correctness QA only.** The final sheet retains the full initial combined explanations; it is not the shortened pagination experiment.

## Files and identity

- New sheet: `public/content/chemistry/ipst/acid-base/10-3-ionization-learning-sheet.html`.
- Guide: `public/content/chemistry/ipst/acid-base/guides/10-3-ionization.guide.json`.
- Topic: Chemistry `b-c667274676708616e5923b20`, slug `acid-base-ionization`.
- The established main content ID `chemistry-ipst-acid-base-10-3-1-sheet` and tool key `learning-sheet` remain. The topic now has one combined-sheet entry; authored aliases `learning-sheet-2` and `learning-sheet-3` point to it. The existing video entry is retained.
- All three original HTML files and all six original SVG files under `assets/10-3/` remain unchanged from base commit `debb5fed7db2247d5910c62e271edfd60d9bf4b8`. They preserve full original context, not just isolated question stems. Old per-part content IDs have not been reused for other content.

## Preservation and coverage

| Inventory | Complete semantic items per language | Evidence |
| --- | ---: | --- |
| Original headed knowledge areas | 26 | `knowledge-preservation-map.json`; every original explanation's text retained verbatim, including assumptions, equations and tables |
| Existing authored scaffold questions | 33 | `retained-question-map.json`; old/new key, prompt and current question label |
| Original official problem answer areas | 39 | `ipst-original-items.json`; 78 language-specific records, exact HTML and preceding context |
| Final question answer areas | 46 | Continuous Question 1–46 in each language, including the retained 33 |
| Final worked-example answer areas | 9 | Seven main examples; dilution and weak-base examples each have two separately answered parts |
| Final total answer areas | 81 | 26 knowledge + 46 questions + 9 worked-example areas, paired TH/EN |

The original official stock consists of 5 numbered worked examples (2–6; 6 answer areas), 9 Exercise 10.3 questions (13 areas), 7 understanding items (9 areas), and Activity 10.1 (11 areas). These 39 areas are reserved in both languages. Original book/teacher-guide page provenance is also available in the unchanged `public/content/chemistry/ipst/acid-base/assets/10-3/SOURCES.md`. Shared scenario context for multipart items must be read from the preserved original full sheet as well as the excerpt.

## Parallel problem map

| Original IPST problem | New sheet's corresponding skill / keys |
| --- | --- |
| Example 2, HBr amount | `model-acid-amount`, retained `q-08`: new HCl quantities and mole conversion |
| Example 3, Sr(OH)₂ dilution | `model-dilution-amounts`, `model-dilution-concentrations`, retained `q-09`: new Ba(OH)₂ data, both ion amounts/concentrations |
| Example 4, HF percentage | `model-ionization-percentage`: new monoprotic HA data |
| Example 5, acetic-acid equilibrium | `model-weak-acid`, `weak-q-12`, `practice-quadratic`: changed concentration, checked approximation and a new full-equation case |
| Example 6, NH₃ percentage | `model-weak-base-ions`, `model-weak-base-percent`: new NH₃ concentration and separate ion/percentage areas |
| Exercise 1 | `practice-mass`, retained `q-10`: new preparation volume/OH⁻ concentration and explanation of the factor-of-two error |
| Exercise 2 | `practice-stepwise`: new diprotic H₂A constants and ion ordering |
| Exercise 3 | extended retained `weak-q-08`: compare supplied Kₐ values and H₃O⁺ at equal C |
| Exercise 4 | `practice-anion-base`: new NaY concentration and Kᵦ |
| Exercise 5 | `practice-base-cation`, `practice-base-percent`: new methylamine concentration, separately answered outputs |
| Exercise 6 | `practice-dilution-percent-a`, `practice-dilution-percent-b`, revised `weak-q-15`: new HA data and concentration-versus-percentage comparison |
| Exercise 7 | revised retained `weak-q-07`: new percentage data, then exact C−x in Kₐ |
| Exercise 8 | `practice-conjugate-base`: new HA Kₐ, conjugate identity and Kᵦ |
| Exercise 9 | `practice-conjugate-acid`: new base B Kᵦ, conjugate identity and Kₐ |

Qualitative pH ordering is retained through `practice-relative-ph` with the revised 0.020 mol/L observation diagram. The unequal-concentration HA/HB understanding skill is retained through `practice-unequal-hb` and `practice-unequal-compare`, supported by the existing reverse-Kₐ question. Activity concepts remain in the full knowledge notes, weak-base calculations, new dilution comparisons and revised graph; the original full activity is preserved for Quiz authoring.

Retained questions that referred to removed source problems, figures or activity data have revised context. Their pedagogical purpose is preserved: strength versus concentration, reaction coefficients, counting reacted molecules once, initial versus remaining concentration, choosing an approximation, neutrality, temperature and correct conjugate pairing.

## Images kept for Quiz

- `figure-map.json` records the six unchanged original SVG assets, their SHA-256 hashes, and six actual textbook crops.
- `quiz-source-images/` contains figures/tables cropped from the supplied student PDF, with printed/PDF page and pixel rectangle recorded. These source images belong to the future Quiz stock, not the revised sheet's problem data.
- The supplied originals remain at [student book](https://drive.google.com/file/d/18HV75L5ndjm-Wpk1rcMFAOgd59TCmepY/view) and [teacher guide](https://drive.google.com/file/d/1XweVlowxFWzCLrkM0y0alqSvq0jAZoA-/view).

## Later Quiz scope

The user requested number-entry and multiple-choice as the main formats for this calculation-heavy topic; drag/drop remains available whenever useful. Preserve all requested outputs, reasoning, units and checked rounding. No Quiz, scores or student-data changes are part of this sheet PR.

The original guide has known issues already documented in the original SOURCES: Exercise 4's substitution typo, Exercise 6's 0.45/0.40 typo, and premature rounding in Exercise 7 and the original quadratic understanding item. Do not blindly copy those into numeric answer checks. The original fragments retained here use the already reviewed source-sheet solutions.
