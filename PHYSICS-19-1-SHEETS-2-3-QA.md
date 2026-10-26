# Physics 19.1 — Sheets 2 and 3

26 October 2026. Implements the teacher’s confirmed three-sheet plan, completing Sheet 2 before authoring Sheet 3. The page cap is about 32–33 per edition, not a target. Explanations and the radius, energy and series derivations are printed; only the five key formula summaries across these two sheets and question/problem responses are left blank. Response areas have no writing lines or dot grids.

## Files and routing

- Sheet 2: `public/content/physics/ipst/atomic-physics/19-1-2-evidence-bohr-learning-sheet.html`, contentId `physics-ipst-atomic-19-1-2-sheet`, tool key `learning-sheet-2`.
- Sheet 3: `public/content/physics/ipst/atomic-physics/19-1-3-transitions-spectra-learning-sheet.html`, contentId `physics-ipst-atomic-19-1-3-sheet`, tool key `learning-sheet-3`.
- Both use the actual Bohr topic bankKey `b-d65860a41c400f77ee276a35`. The current configured bank client was called read-only and confirmed this key, topic title and zero-question topic. No hash was generated or guessed.
- Added its tools menu at `public/content/bank/physics/b-d65860a41c400f77ee276a35.html`.
- Assets and source notes are under `assets/19-1-2/` and `assets/19-1-3/`. Explanatory SVG originals and the NIST reference CSV are retained where available.
- No changes to the shared language, math, learning-sheet or print engines, student records or catalog service.

## Sources read

Read the teacher-supplied IPST Physics 6 page images: printed pp.59–80, PDF pp.72–93. Read relevant teacher-guide text including the activities, understanding questions and worked answers (printed pp.53–59 and 64–68). The previously prepared 15-image pack was read and reused with its provenance; an additional p.79 figure was cropped for the four n=2 spatial patterns. The original book PDF and teacher-guide PDF were already materialized in this workspace from the earlier work.

Original sources:

- Student book: https://drive.google.com/file/d/1claSYEw2Laz0zWRXjNcI9jhbt7A2sGMd/view
- Teacher guide: https://drive.google.com/file/d/1ODc-IWaYBIw3_nzMGC2RglTYlkrUwQdF/view
- Real hydrogen spectrum photo: Jan Homann (2009), CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Visible_spectrum_of_hydrogen.jpg . Attribution, source and license links are included in the sheet.
- NIST reference-line provenance and the distinction between data and explanatory plots are recorded with the assets.

## Source coverage

| Original item | Destination |
| --- | --- |
| Thomson, alpha scattering, Rutherford, pp.59–62 | Sheet 2 sections 1–3 |
| Magnet activity and its three paths, pp.60–61 | Sheet 2 section 2; separate responses for all three paths, plus analogy limitations |
| Activity 19.1, pp.63–64 | Sheet 2 section 4; setup, measurement procedure, grating geometry, recording area, six separate H/Ne calculations |
| Three questions after Activity 19.1 | Sheet 2 section 4, original question numbering retained |
| Continuous, line, absorption and emission spectra, pp.65–66 | Sheet 2 section 5, then energy interpretation in Sheet 3 section 1 |
| Bohr postulates, angular momentum, pp.66–68 | Sheet 2 section 6 |
| Radius and energy derivations, pp.69–71 | Sheet 2 sections 7–8 |
| Ground/excited states and ionization, p.72 | Sheet 2 section 9 |
| Understanding 19.1 Q1, Q2, Q3 | Sheet 2 sections 6, 2, 5 respectively, all three with separate answers |
| Exercise 19.1 Q3, Q4, Q6(a) | Sheet 2 sections 10, 9, 7 respectively |
| Direct/cascade transitions | Sheet 3 sections 2 and 6 |
| Rydberg, Balmer and five named series, pp.73–75 | Sheet 3 sections 3–5 |
| Example 19.4(a), (b), p.76 | Sheet 3 section 5, separate responses |
| Rounding observation and 7→2 question, p.77 | Sheet 3 section 5 |
| Exercise 19.1 Q5 | Sheet 3 section 6, newly drawn three-level diagram preserving −1, −3, −7 eV and the initial n=2 |
| Exercise 19.1 Q6(b) | Sheet 3 section 6, direct 3→1 and cascade 3→2→1, three separate calculations |
| Bohr limitations, probability and cloud model, pp.77–79 | Sheet 3 section 7, including p.79’s n=2 spatial patterns and a brief wavefunction explanation |

Examples 19.1–19.3, p.55’s question and Exercises 19.1 Q1–2 remain in Sheet 1. **The old audit incorrectly labelled Understanding Q1 as Planck.** The teacher guide’s full wording identifies the hydrogen quantum number. This work places the actual question in Sheet 2 and relabels the existing Planck question in Sheet 1 as a supplementary question in both languages. Its semantic key, content and answers remain unchanged; Sheet 1 PDFs have not been re-exported in this task. The old audit’s five-sheet allocation and 20-page cap are superseded by the confirmed three-sheet plan.

## Scientific decisions and checks

- Spectral lines motivate the model; they do not by themselves prove L=nℏ. Non-radiation is explicitly a postulate.
- Alpha scattering uses non-contact electric repulsion, and the magnet analogy’s limits are stated.
- The experiment’s sample readings are labelled as adapted teaching data, not newly measured student results. D=100 cm is made explicit to match the geometry; the teacher-guide text and example numerics use inconsistent D labels. Independent calculation gives H approximately 655, 492, 432 nm and Ne 655, 631, 603 nm.
- “Ordinary lamp” means an incandescent lamp in the activity, not all modern lamps.
- Absorption requires an occupied initial level. The Balmer absorption diagram is not described as direct ground-state absorption.
- The p.72 ground-state diagram’s erroneous n=0 label is replaced by n=1 in a newly drawn explanatory figure.
- Recalculation gives a₀≈5.291×10⁻¹¹ m, E₁≈−13.61 eV and v₁≈2.188×10⁶ m/s using the stated rounded constants. Q6(a) gives 4.76×10⁻¹⁰ m from a₀=5.29×10⁻¹¹ m, rather than copying a last-digit error in the printed solution.
- Photon energy is positive; atomic ΔE has the sign of absorption/emission. One-atom photon counts are separated from ensemble line counts.
- Example 19.4 uses the book’s R_H=1.0974×10⁷ m⁻¹: 4→2 gives 485.997 nm = 4.85997×10⁻⁷ m, not a mismatched exponent. Rounded Eₙ gives 2.55 eV, while the stated hc/R route gives about 2.56 eV; the rounding difference is explained.
- 7→2 gives approximately 396.9 nm; not every Balmer line is in the chapter’s approximate visible 400–700 nm range. Lyman and Paschen data are shown as labelled UV/IR plots rather than invented visible colours.
- The radial probability maximum is distinguished from pointwise probability density; cloud dots are not a literal electron fog or trajectory. The four n=2 spatial patterns are stated to exclude spin.

## Verification

| Check | Result |
| --- | --- |
| Production build including content validation | Pass; 0 errors, 32 pre-existing draft warnings, 546 public files verified |
| Route catalog | Pass; 30 HTML-menu contents; existing route structure retained |
| `pnpm test:unit` | 345 passed, 0 failed |
| `git diff --check` | Pass |
| Language/asset structural check | Sheet 2: 39 unique paired slots, 11 images per language. Sheet 3: 22 unique paired slots, 6 images plus Q5 inline SVG per language. Every slot has one direct answer child. |
| Built Hub browser checks | Both new content routes load, both languages, reveal controls, geometry preserved, 390 px iframe has no horizontal overflow, all figures load, no MathJax errors |
| Central A4 print | All eight editions generated from the existing Hub print dialog; no answer DOM in blank editions, opposite language removed, no measured page overflow |

| Sheet | Language | Student | Answers |
| --- | --- | ---: | ---: |
| 2 | TH | 20 | 20 |
| 2 | EN | 21 | 21 |
| 3 | TH | 14 | 14 |
| 3 | EN | 14 | 14 |

PDFs are A4 with embedded Thai font, no Unicode replacement characters and no empty pages. Rendered contact sheets and enlarged inspections cover the exported pages. Evidence is in `qa-output/physics19-sheet2/`, `qa-output/physics19-sheet3/` and `qa-output/sheets23-pdf-report.json` (not committed). Browser checks use Chromium headless with network Firebase stubs; no live student/account writes. Native iPad/Safari and a physical printer have not been tested.

This is a reviewable branch/PR and exported file delivery, not a claim of merge or live deployment.
