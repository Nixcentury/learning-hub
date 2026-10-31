# 10.1 two-set review and give-up QA — 2026-10-30

Base main: `2468ceda925195234636cb110cb0142110b1249b` (includes merged PR #82 and classroom submission work from #83).

## Authoring and science review

- Compared the full ten-section learning sheet with the two-set coverage map in `WAVE-MODEL-10-1-CONTINUATION.md`.
- Set 1: 48 questions (18 passages, 19 choices, 11 numeric). Set 2: 41 (8 passages, 28 choices, 5 numeric). Neither exceeds 50. Twenty existing question IDs remain stable.
- Replaced instructions to find a previous numbered section with explicit tasks. Calculations give the necessary numerical data, requested units and relevant medium. Reflection/refraction questions distinguish angles from normal versus surface. Interference questions state the initial source phase and equal-amplitude condition where needed.
- Adapted numerical/symbolic situations rather than copied worked examples. All five source worked-example skills and both official understanding-question skills are mapped. No new 10.2 slit-position calculation formulas.
- Independently recalculated all 16 numeric answer keys, including nm conversion, refractive index, travel time, 365-day year, light-years, signed displacement, amplitude and path difference. Colour frequency intervals retain the source's approximate endpoints.
- Reused original source diagrams and three experimental photographs unchanged, with attribution. Figures are supplied in their questions; optional reading links support review.

## Reproduction and repair

The existing numeric demo's `age-total` question reproduced the failure before editing: Give up showed the solution heading and retry note, but the cloned explanation retained `hidden` and had height 0. After the fix the same saved given-up question visibly showed the full 50-year solution, including after reload.

`cloneInto` now removes `hidden` from the root of the presentation clone only. The hidden source/print node and hidden descendants are preserved. A regression test exercises the real production helper and checks visibility, English localisation and source preservation. Give up scrolls to the solution, with clearance for the sticky top bar.

Unlocked drag questions additionally render all correct placements as a completed readable passage. The answer-key map is supplied only to the renderer; it is not put into student answers, evidence or grading.

## Checks actually run

- `node --test scripts/quiz-resume.test.mjs scripts/quiz-drag.test.mjs scripts/quiz-number.test.mjs scripts/quiz-evidence-resume.test.mjs scripts/quiz-variant.test.mjs scripts/topic-review-print.test.mjs`: **141 passed, 0 failed**.
- `pnpm build`: content validators, guide validator, TypeScript and production build pass; **657 public files** match the Pages artifact.
- Browser: opened all 48 + 41 questions, clicked Give up on each, then inspected every solution again in English. **89/89 solutions visible in TH and EN; zero hidden solution descendants**. All 26 drag questions show their full completed passage. Every used image loaded and fitted its context.
- Sample numeric question, choice with a double-slit diagram and drag passage answered through the actual UI. Initially giving up all 41 questions graded **0/41**. After reopening and answering three correctly while keeping one different question given up, result was **3/41**, with no AI service review. The missing-reasoning notice named only Q1 and Q31, excluding the drag passage.
- Specific “Try this question again” control reopens an abandoned drag task, hides/removes its solution rendering, and restores editable answer pieces. No answer was auto-filled from the displayed answer key.
- Reload retained the attempt and given-up state. Existing model tests cover reread confirmation and persistence; source links point to the same real Hub sheet route already verified in PR #82.
- Viewport proof: ignored `qa-output/giveup/completed-passage-after-giveup.jpg` shows the blank abandoned task, full correct passage and retry button together.

## Verification limits

The browser twice showed **Evidence export completed** for a representative result with four included questions (numeric, answered drag, given-up drag and an illustrated choice). The automation's download-event capture timed out, so no exported PDF file was available for offline page rendering/inspection in this run. Do not claim visual PDF QA passed. Related print/evidence unit tests pass, and the source/print tree is unchanged by the on-screen clone repair. No physical printer, real iPad or live student account was used. No AI approval stamp was fabricated; the sample explicitly shows no AI review and its ordinary score remains valid.

## Integration with current main — 2026-10-31

Merged main `036136da5496cd4026438a7615839c534dc4f5f4` into the PR branch, including PR #85's homework resubmissions and PR #80's reflection visuals. Resolved the two conflicting files by updating both quiz-player cache versions and retaining `startRetry`, `restart` and `cloneInto` in the existing test harness. The production engine keeps both the homework resubmission changes and this PR's three give-up presentation changes. Classroom services and Firebase Rules match main exactly.

After integration, **168 related tests passed, 0 failed** across quiz resume, drag, numeric, evidence, variants, review printing, classroom submissions, submission bridge and assignment UI. This includes homework correction/resubmission, reload of a correction draft, closed-assignment locking, hidden-solution rendering and give-up retry/scoring. `pnpm build` passed with **657 public files** verified; the index has no unresolved conflicts or whitespace errors. The earlier browser checks and PDF verification limits above still apply; they were not rerun for this conflict-only update. GitHub workflow results must be checked on the new merge commit.
