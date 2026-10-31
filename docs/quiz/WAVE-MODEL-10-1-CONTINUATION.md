# 10.1 Wave model of light — two review sets

Topic: `public/content/bank/physics/b-08c93bb5cd14a7bc7de0a8e0.html`.
Source: `public/content/physics/ipst/wave-optics/10-1-wave-model-learning-sheet.html`, scanned in full; unchanged by this work.

## Current agreement

The user changed the former ~20-question batches to **at most 50 questions per set**, with **10.1 completed in two sets**. They may inspect increments of about ten items, but students should see the two complete sets. Both are review companions at the sheet's level: short passages, direct calculations, adapted situations, no added derivation-heavy course. Questions must state their own task, necessary supplied data and physical assumptions; sheet links are optional help, rather than instructions to find an unspecified earlier figure or question.

PR #82's original 20-question Set 1 was merged. The retained questions keep their stable question IDs and activity ID in the expanded Set 1. The two-set plan supersedes the previous provisional five-set plan. Original Set 1 Q4 (`accelerating-charge`) was removed on 2026-10-31 at the user's request because it is covered in another lesson; current Set 1 has 47 questions. Former Q5–48 now display as Q4–47. The remaining question IDs and answer keys are unchanged. No blackbody/19.1 content is changed here.

| Set | Questions | Formats | Scope |
| --- | --- | --- | --- |
| 1 | 47 | 18 drag passages, 18 choices, 11 numeric | Sheet sections 1–6: stars/EM, spectrum, colours, speed, media/index, light-years, reflection/refraction |
| 2 | 41 | 8 drag passages, 28 choices, 5 numeric | Sections 7–10: superposition, interference, diffraction, experiments and light-model evidence |

Files: `10-1-wave-model-quiz-set-1.html`, `10-1-wave-model-quiz-set-2.html`.
Activity IDs: `physics-ipst-wave-optics-10-1-quiz-set-1` and `physics-ipst-wave-optics-10-1-quiz-set-2`; Set 1 content version 5 and Set 2 content version 4 (unused distractor pieces added, 2026-10-31). Keep the existing IDs stable when editing. Saved practice answers are handled by the existing engine; the normal “Restart · load latest” control is available when starting a fresh attempt.

## Coverage against the complete source

The sheet has ten sections, 83 note/answer slots, five worked examples and two official understanding questions. The map groups closely related slots into adapted activities, rather than copying every blank as a separate question.

| Source content | Review location |
| --- | --- |
| Solar energy source versus radiation; several EM regions; E/B fields, perpendicular directions, transverse waves; curves are field plots and vacuum | Set 1, 1–4 |
| Definition/order of all seven spectral regions; all listed applications; increasing f/decreasing λ; equal vacuum speed | Set 1, 5–10 |
| Visible light ≈400–700 nm, continuous colours, six categories and approximate wavelength ranges; red/violet comparison | Set 1, 11–15 |
| c=fλ and nm conversion; forward/inverse and elementary symbolic problems | Set 1, 16–18 and 24–25 |
| Human perception of visible light; adapted official understanding Q2 | Set 1, 19 |
| Symbols/units, nm, minutes and a 365-day year; all six approximate frequency intervals and reversed endpoints under f=c/λ | Set 1, 20–23 and 35 |
| v=fλ in a medium, n=c/v, dimensionless n, n/v ordering; air/water/glass; stationary interface f fixed and v/λ changed, symbolic comparison | Set 1, 24–32 |
| All five worked-example skill types: vacuum wavelength/frequency, glass speed, Sun–Earth travel time, light-year in m/km, stellar distance/look-back time; added analogous Moon problem | Set 1, 16–17, 27, 33–39 |
| Normal and three rays; reflection angles from normal versus surface, Snell law, normal incidence, index increase/decrease and equal indices | Set 1, 40–47 |
| Signed y=y1+y2; +2A/−2A/0; both crest+crest and trough+trough constructive; unequal cancellation, amplitude versus signed displacement | Set 2, 1–6 |
| Node versus momentary zero; antinode; equal-amplitude assumption; centre line for matching/opposite phases | Set 2, 5–9 |
| Absolute path difference; need to know source phase; all four constructive/destructive path conditions; direct numeric/symbolic applications | Set 2, 10–18 and 20 |
| Circular wavefronts versus node/antinode loci | Set 2, 19 |
| Diffraction at openings/edges/shadows; prominence as angular spread at equal screen distance; width versus wavelength controlled comparisons; crest spacing versus spread | Set 2, 21–25 |
| Angle vertex at slit centre, original axis to first minimum; first minimum bounds central band, not all light; side bands; doorway scale | Set 2, 26–28 |
| Single/double slit setups/patterns, fine fringes plus envelope, interference within one slit, bright/dark alone insufficient | Set 2, 29–33 |
| All three original experimental photographs A/B/C, used unchanged with attribution | Set 2, 34–36 |
| Newton/Huygens/Young and measuring wavelength; official understanding Q1; reflection/refraction alone insufficient evidence; models revised by evidence and particle-model caveat | Set 2, 37–41 |

No 10.2 fringe-position or diffraction-minimum calculation formulas are introduced. Spectral boundaries are approximate; applications alone are not a universal criterion for classifying the radiation. Colour-range tasks are open-book lookups, not a new demand for exact rote memorisation.

## Give-up repair

Before the fix, sample numeric question `age-total` reproduced the reported fault: “Solution and reasoning” appeared, but the explanatory section had `[hidden]`, height 0. `cloneInto` now removes `hidden` only from the presentation clone's root, preserving the hidden source/print tree and any deliberately hidden descendants. Give up scrolls to the solution below the sticky bar. A regression test checks clone visibility, language selection and source preservation.

All unlocked drag questions also show the entire correctly completed passage, followed by the authored explanation. This answer-key rendering does not populate the student's answer, evidence or score. Retry hides the solution and reopens the actual task through the existing mechanism. Normal scoring and AI evidence remain independent.

## QA record

Browser checks and the final related test/build results are recorded in `WAVE-MODEL-10-1-QA.md`. Future edits should recheck altered questions and relevant shared behavior; do not repeat unrelated suites without a reason.

## Drag answer choices — 2026-10-31

All 26 drag passages now have at least two unused choices. Added 28 bilingual pieces to the 17 passages that previously had zero or one, interleaved with the original pieces. Existing distractors are retained. Misconceptions include units, an inverted refractive-index ratio, single versus doubled displacement, and node/antinode conditions; no new questions are added. Set 1 remains 47 questions and Set 2 remains 41.

The diffraction passage now distinguishes a gap from an obstacle rim before asking about spreading. Its former “opening or edge” wording allowed a physically valid swap that the fixed slot keys rejected. The slot IDs and keys remain unchanged. The student instructions explain that some pieces are unused.

Validation: the production adapter accepts both sets with 47/41 questions. Compared with the preceding removal commit, all question IDs, slot keys, existing answer pieces, choice/numeric questions and solutions are unchanged; only the diffraction passage wording is clarified. All correct drag maps grade correctly, and 168 single-slot substitutions with unused pieces are valid saved answers but grade incorrect. The existing `html-math` and `quiz-drag` suites pass (12 tests); `pnpm build` and `git diff --check` pass with 658 public files verified. No new browser/device or PDF QA is claimed for this content-only edit.
