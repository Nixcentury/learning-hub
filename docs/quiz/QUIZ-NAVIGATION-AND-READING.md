# Shared Quiz navigation and drag rereading

Implemented against main `687978a` on 2026-10-31. This is shared player behavior for authored sets, mixed sets, bank questions, homework and temporary practice. Authors do not copy navigation scripts into content fragments.

## Student behavior

- **Skip for now / ข้ามไว้ก่อน** retains the current answer and working, marks the question with ↷, and moves to the next question. It does not reveal a solution, set Give up, grade an answer or change an AI stamp. A skipped correct answer can still earn its normal point when submitted.
- On an editable **drag-drop** question, **Next**, a forward numbered jump and the public `goToQuestion` action first check the current placement. Blank and partial placements receive an incomplete message; a complete wrong placement receives only “Not all correct yet.” Neither case has a Continue action. No incorrect slot, correct-slot count or answer key is shown.
- The modal displays the student's own completed passage, the question/context and relevant figures, using the existing renderer and MathJax. It does not populate blanks from the key. If all placements are correct, **Reviewed · Continue** becomes available; the student must confirm before advancing. Returning to a question and going forward checks it again.
- Closing the modal or pressing Escape stays on the current question. **Skip for now** remains an explicit alternative inside the review modal. Backward navigation does not require a check.
- A skipped marker is cleared when the student advances with a valid choice/numeric answer or confirms a correct drag passage. A partial numeric draft remains marked. The actual answer need not be correct for ordinary choice/numeric Next; immediate gating applies to drag questions only.
- On the final editable drag question, Next becomes **Check and reread**. Confirming it opens the skipped-question overview without grading or sending homework. Skipping the final question also opens this overview. The skipped counter opens it at any time.
- Explicit **Submit all answers** reminds the student about marked questions. They may return to a question, cancel or choose to grade existing answers. The existing missing-reasoning check and scoring run afterward.
- Mastered, given-up and closed-homework questions remain navigable. Closed homework cannot create skip edits. Passing a reread check does not set mastery or lock an answer; only the existing submission process does so.

All drag questions use this behavior. The old `data-drag-read-confirm` content attribute may remain for compatibility but no longer enables or disables the gate. This supersedes the former opt-in native OK/Cancel confirmation.

## Progress and integration

- `skippedIds` is an optional array in the existing v2 snapshot. Old v1/v2 drafts default to an empty array. Unknown IDs are filtered and malformed arrays are rejected before restoring any state.
- Skip edits participate in the progress signature and use the normal local/cloud draft save. Empty skipped lists preserve older baseline signatures, so upgrading an old dirty draft does not invent a cloud conflict. Merely moving between questions still uses navigation persistence. Account, content or cloud-snapshot replacement invalidates a pending review; confirmation also rechecks the answer signature and identity.
- Temporary practice keeps skip state only for that temporary session. Retries and fresh restarts reset the markers. Give up clears a skip marker. Normal grading clears markers for correct/given-up questions.
- `requestNavigation` is the student/public entry point. The internal `goTo` remains available to production validation paths that must focus an invalid numeric answer or missing working without triggering an unrelated drag review.
- `createDragEvidenceBody(question, studentAnswer, language, { labels: false })` supplies the modal passage. Never pass the answer-key map used for unlocked solutions here.
- Answer grading, reasoning checks, AI verdict policy, print/evidence rendering, Firebase paths, Rules and Classroom services are unchanged. Skip metadata travels in the existing draft record; it is not a new grading field.

## QA actually run

- `pnpm test:unit`: **536 passed, 0 failed**, including the real production-closure tests for wrong/partial/correct drag checks, confirmation/cancel, stale answers, forward-jump protection, last-question behavior, skipped-state resume/cloud conflicts, old dirty-draft upgrades, temporary practice, closed homework and independent scoring.
- `pnpm build`: passed; **658 public files** verified against the Pages artifact. `git diff --check`: passed.
- Chromium UI: used the production player with a preview-only four-question fixture (drag, number, choice, rich final drag). The fixture reuses the existing mixed authoring template and 10.1 path-condition passage/diagram; no extra quiz is published.
- Verified an empty and a completely wrong drag placement stay on the same question. The wrong modal showed the student's reversed choices, had no Continue action and contained **zero `data-answer` attributes**. Escape returned to the same question.
- Skipped all three question types and the final question, restored **four skipped markers** after the preview reloaded, and used the overview and pre-submit reminder. Explicit grading produced **2/4** from the retained numeric/choice answers; skipping did not zero them. The missing-reasoning dialog still named only the number and choice questions, and results honestly showed no AI review.
- Corrected the drag questions, confirmed rereading, navigated past already-mastered questions, and confirmed the final drag without auto-submission. Explicitly grading again produced **4/4**.
- Typed a synthetic working note, skipped to the next question, returned and reloaded the player. The note remained intact. No AI review was requested for it.
- Rich review showed a loaded SVG figure and six MathJax expressions, with no math errors and no per-slot correctness markers. Checked TH at **768 px** portrait and **1024 px** landscape, and EN at **390 px**. The modal and footer stayed within each viewport and the content scrolled vertically without horizontal overflow.
- Ignored proof image: `qa-output/drag-review-ipad.jpg`, captured from the actual review modal.

No production account, real iPad/Safari session or newly exported PDF was inspected. Existing print/evidence tests pass. No AI verdict or positive stamp was fabricated. Check GitHub workflows on the published PR head before merging; the previously observed Classroom monitoring CI failure is outside this navigation change.
