# 19.1 Sheet 1 — fifty-question core review QA

3 November 2026. Base: `68b3aceca83c223a7d2bf2449982ee6695c06f9e` (merged worksheet PR #123).

## Final user scope

Replace the old twenty-question set with one **exactly 50-question** review selecting important concepts for A-Level preparation. Every concept, equation and required method must be available in the existing learning sheet, revision `2026-11-03-2`. Memorization uses drag/tap words/formulas, with images when helpful; numeric calculations use typed answers; reasoning or impractical typed answers use choices. Keep the original IPST examples/exercises and their required outputs. The user explicitly superseded the intermediate 81-question/two-edition draft.

The result is 21 drag-fill questions with 61 answer slots, 21 numeric questions and 8 five-option choices. Every drag question has at least two genuinely unused distractors. Five existing teaching images are reused with their credits, alt text and original dimensions.

## Content and source correctness

- All 9 verified IPST source-task groups from the worksheet preparation files remain. Their original prompt contexts are preserved in TH/EN, with supplied data and printed page references. Worked Example 19.3 retains both 2- and 3-quantum outputs; chapter-end Q11 retains frequency, wavelength and band; Exercise Q2 retains quantum count and its two scaffolded calculation steps. Extra conversion steps are labelled as extensions where appropriate.
- The source task selection is limited to this first sheet: Think p.55, Understanding 19.1 Q1, Examples 19.1–19.3, Exercise Q1–2 and chapter-end Q11/Q18. Later Bohr and transition questions remain outside this scope.
- Reduced repeated activity rows to one representative count and one representative ratio question, with the full original simulated data supplied in each context. The data are explicitly simulated, not historical Planck measurements. The ratio question uses the rounded table data rather than silently substituting the calculation constant.
- All theory and calculation methods map to actual sheet sections. The 67-area coverage map distinguishes 57 direct skill checks and 10 representative/equivalent-skill treatments. It does not claim that all original activity table cells are separately graded. The duplicated eV-conversion and inverse-frequency practice are represented by corresponding IPST calculation skills.
- No Wien displacement law, Stefan–Boltzmann law, photoelectric-effect equation, Bohr calculation or spectrum-law derivation is added. Per-photon energy, total energy, full quantum counts, electrical-work/eV conversion, vacuum wave relations and optical power/time use only the equations already in the sheet.
- Checked conceptual distractors for absorption versus emission, continuous spectrum versus peak, artistic colour labels versus the specified gas-flame situation, quantum count versus frequency, and energy per photon versus total energy. The infrared task concerns photons at 9350 nm, not a universal longest-wavelength cutoff.
- Independent Python Decimal calculations at 50-digit precision agree with all 21 numeric answer keys. Checked SI conversions, stated constants, unrounded intermediate values and authored absolute tolerances. Numeric prompts identify the required precision; counted quanta have zero tolerance, and all numeric questions reject zero, negative values and answers an order of magnitude wrong.

Machine-readable evidence: `docs/quiz/preparation/physics-blackbody-19-1-1/content-qa.json`, `coverage-map.json` and `quiz-items.json`. The complete item table and selection rationale are in `docs/quiz/BLACKBODY-19-1-CORE-REVIEW.md`.

## Actual content through the shared system

- Loaded the final HTML through `readQuizContent`: 50 questions, 0 model errors. All 50 authored keys grade correctly. Blank answers, partial drag answers, unused distractors and incorrect numeric values were rejected.
- Verified unique bilingual drag pieces, at least two unused pieces per drag question, five distinct options per choice and exactly one keyed option. Choice text includes the nested bilingual spans required when the existing player clones options into buttons.
- Every question has a TH/EN prompt, hint and visible-solution language block, all data needed for its calculation, and a reading link naming the actual worksheet section, heading and question/subpart, table row or figure. All named targets were verified against both language editions of the worksheet. All referenced local images exist with alt text and dimensions.
- Compared the deployed Chemistry 10.1 set-1 pattern with its repository file (exact bytes matched); retained its shared paired-review configuration. The new per-question labels additionally identify the actual question/subpart or figure, without claiming automatic scrolling to a target.
- Passed the actual authored `data-quiz-review-link` through the shared `configureQuizReviewLink`: correct worksheet content ID, resolved HTML path, paired-view flag, topic and standalone fallback URL. This is an integration check of the shared opener configuration, not a claim of a new browser session.
- The public menu exposes one fifty-question set at the existing `quiz-set-1` route, using a fresh activity/content ID. The old runtime twenty-question file is removed; an exact unchanged archive is preserved under `docs/quiz/preparation/physics-blackbody-19-1-1/legacy-20-question-set.html`. Existing old score records are not migrated or overwritten.
- The merged learning sheet and guide are byte-identical to the base commit. Shared Quiz code, scoring, AI stamps, Firebase and other topics are unchanged.

## Validation and limits

Final `pnpm build` passes content/guide validation, TypeScript, production build and Pages artifact verification: 717 public files match. Content validation reports zero errors and the same 33 pre-existing draft warnings; the five linked guides also validate. Targeted shared numeric/drag/review-link unit tests pass 77/77. All four embedded TeX expressions in the new quiz’s bilingual reading labels typeset with MathJax 3.2.2; its other formulas use readable Unicode notation. `git diff --check` passes.

No native iPad/Safari, physical printing or newly launched browser UI result is claimed. The earlier environment could not establish a working headless-browser session, so this revision uses actual content through the shared adapter/opener plus independent numerical and file/route validation; it does not claim that static checks are screen tests.

The [official MyTCAS A-Level Physics blueprint](https://www.mytcas.com/blueprint/a-level-64-phy/) was checked on 3 November 2026. It includes atomic physics under modern physics and both five-option choices and numeric answers. The fifty-question selection and emphasis are this project’s pedagogical judgment within the worksheet, not an official subtopic weighting or a full Physics mock exam.

This PR does not merge or publish itself. Recheck merge/deployment before describing the new set as live. No additional first-sheet Quiz edition is planned under the final fifty-question scope; Chemistry 10.3 remains paused.
