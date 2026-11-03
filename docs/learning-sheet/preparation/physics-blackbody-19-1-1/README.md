# 19.1 Sheet 1 — parallel problems and reserved IPST originals

User scope, 3 November 2026: finish the learning sheet first. The later replacement Quiz must cover recall, original IPST examples/exercises and all remaining sheet skills, in editions of at most 50 questions. Recall should mainly use drag/tap word or formula placement; calculations use numeric entry or choices when typing is unsuitable; conceptual questions use choices. The review button must open this learning sheet. **No Quiz is created, removed or modified in this worksheet change.**

## Current worksheet

- Topic: `b-0f490c3358e9212cee2e2a43`.
- Content ID: `physics-ipst-atomic-19-1-1-sheet`.
- File: `public/content/physics/ipst/atomic-physics/19-1-1-blackbody-planck-learning-sheet.html`.
- Revision: `2026-11-03-2`; the existing guide is reviewed and fingerprinted against this revision.
- All nine sections, both model-data activities, all original images and the authored supplementary problems remain. Fifty pre-existing answer areas per language are byte-identical. Sixteen changed areas receive new `parallel-` slot IDs; one new frequency area is added to Q13. Total: 67 paired TH/EN answer areas.

## Source verification

The actual scanned [IPST Physics Book 6](https://drive.google.com/file/d/1claSYEw2Laz0zWRXjNcI9jhbt7A2sGMd/view), 32,281,665 bytes, was downloaded from the teacher’s existing source link and visually inspected. Printed pages 54–58, 80, 108–109 correspond to PDF pages 67–71, 93, 121–122. The full copyrighted PDF and temporary page renders are not added to this repository.

`ipst-original-items.json` records nine original tasks with the book’s data, page references, required outputs and checked calculation values. It distinguishes a literal original output from the old sheet’s extra scaffolding. Thai prompts are transcribed from the scans; English prompts are authored translations. `source-fragments.json` separately preserves all 18 pre-swap bilingual worksheet blocks exactly, including old answers and context. The old sheet was adapted, so its fragments must not be mistaken for an exact transcription of every book question.

The selected calculation tasks do not have attached problem diagrams. The Planck portrait on p.58 is supplementary biography; the energy-level diagram on p.80 belongs to Exercise Q5, outside this first-sheet scope. No source diagram is silently omitted from a selected task. Existing instructional images stay in the learning sheet with their original credits and dimensions.

## Problem map

| Original reserved for Quiz | New worksheet task |
| --- | --- |
| Think p.55: household gas-flame colours | Compare supplied hypothetical temperature measurements with a claim based on artistic colour labels; retain the photo as an explicitly non-measured illustration |
| Understanding 19.1 Q1, p.80 | Interpret detection at fixed frequency with E = 4hf; distinguish quantum count, frequency and zero detection |
| Example 19.1, p.57: 6.50×10¹⁴ Hz | Example 1: 5.50×10¹⁴ Hz; energy in J and eV |
| Example 19.2, p.57: 2.5 eV | Example 2: 3.20 eV; find frequency |
| Example 19.3, p.58: 21.76×10⁻¹⁹ J and n = 2, 3 | Example 3: 4.20×10⁻¹⁹ J and n = 4, 6 |
| Exercise 19.1 Q1, p.80: 5.0×10¹⁴ Hz | Practice 1: 4.00×10¹⁴ Hz; energy in J and eV |
| Exercise 19.1 Q2, p.80: 650 nm and 1.0×10⁻³ J | Practice 2: 520 nm, explicitly three significant figures, and 2.00×10⁻³ J; frequency, photon energy and count |
| Chapter-end Q11, p.108: 3.50 eV | Q13: 4.00 eV; separate frequency, wavelength and spectral-band areas |
| Chapter-end Q18, p.109: 9350 nm | Q14: photons at 1.00×10⁴ nm from a warm surface; energy in J and eV |

Exact old/new slot mappings are in `parallel-problem-map.json`. All changed tasks use new slot IDs, so a reveal state tied to an old problem is not mislabelled as the new problem. The worksheet content ID, topic, route and guide identity remain the same.

## Scientific decisions

- Carry unrounded values between parts, then round the revised numerical final answers to three significant figures. The activities retain their separately stated rounded constant and simulated status.
- Book chapter-end Q11 asks for **frequency as well as wavelength and spectral region**. The old sheet had no separate frequency area; both the revised sheet and future Quiz must cover it.
- Book chapter-end Q18 uses wording about a maximum wavelength. Do not teach 9350 nm as a hard longest-wavelength cutoff of body radiation. The new worksheet explicitly asks about photons at one specified wavelength within a broad spectrum.
- The hypothetical flame measurements are not attributed to the retained photograph. No universal colour-only thermometer is asserted.
- Calculations, units, assumptions, language agreement and unchanged-content checks are recorded in `content-correctness-audit.json`.

## Next work — after the worksheet

The existing twenty-question Quiz is still unchanged in this PR. In the next task, replace it with complete editions, each at most fifty questions; assign fresh activity/content identities for genuinely replaced sets rather than silently reusing old scores. Include all nine original source tasks above, the two full simulated activities, formulas/units, useful authored questions and calculation skills. Read the original task inventory and source fragments together. Preserve every requested subpart, including frequency in chapter-end Q11. Use the shared `data-quiz-review-link` opt-in so the review button opens the worksheet alongside the Quiz. Do not resume Chemistry 10.3 as part of this physics task.
