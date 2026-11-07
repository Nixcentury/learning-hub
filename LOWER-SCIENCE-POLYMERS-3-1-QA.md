# Polymers 3.1 — R07 content integration

## Source and placement

- User-supplied `M3_Polymers_R07_Final_Content_Pack.zip`, 8 November 2026.
- Subject `lower-science`; live catalog verified the existing topic **พอลิเมอร์ (Polymers)** under **วัสดุในชีวิตประจำวัน (Materials)**, bankKey `b-2d4d862f9bcb87a3a2d60f0d`.
- Added one bank menu with two authored activities, keeping the supplied content IDs: `lower-science-polymers-l01-l08-sheet` and `lower-science-polymers-l01-l08-review`.
- The bank's built-in Open quiz remains unavailable while its Sheet question count is zero. The authored 70-question review is its own activity; no Sheet question rows or Apps Script configuration were changed.
- Source author's content QA and limitations are retained in `docs/learning-sheet/preparation/lower-science-polymers-r07/`. They are content-author claims, not runtime integration evidence.

## Preserved and adapted

- Retained the full learning sheet, 185 paired answer slots per language, eight guide steps, and all 24 supplied SVG files. Clarified toughness in TH/EN as energy absorption before fracture, distinct from strength. Fixed the displayed question-number gap (20 → 24) to run continuously through 27; stable slot IDs and all question/answer content are retained. Guide copy, revision and fingerprint match the updated sheet.
- Review keeps all 70 question IDs, answer keys and ordering (29 drag-fill / 41 choice). Added TH/EN metadata to all solution sections to meet the existing build contract, preserving their localized children and solution text.
- Translated 28 English reference-label occurrences that contained Thai topic descriptions. Added the verified bank topic ID to the existing quiz-to-sheet link.
- Connected orange branch/bridge endpoints to the blue chain curves in six SVG models, keeping the original illustrations, labels and question mappings. A contact-sheet review of all 24 figures identified these small geometry gaps.
- Initial built-browser checks caught narrow-screen English table overflow. Added wrapping for long scientific names inside this sheet's cells; no shared CSS changes.
- The review link's `../../content/...` URL is relative to the existing Quiz player, per `configureQuizReviewLink`; it is intentionally retained. Diagram URLs remain relative to the quiz source and are rebased by the loader.

## Checks

- `pnpm validate:content`: passes, including learning guides; existing draft warnings retained.
- `pnpm build`: passes.
- Related sheet/guide/drag/review-link/print unit tests: 39 passed, 0 failed; recorded in [PR #152](https://github.com/Nixcentury/learning-hub/pull/152).
- `.github/workflows/polymers-content.yml` runs `scripts/test-polymers-browser.mjs` against the production artifact. It exercises the real Hub and authored content with Firebase stubs, local synthetic Guest progress, and no external account writes.
- Browser checks cover TH/EN slots/reveal/hide, every guide semantic link, all images, four actual sheet PDF exports (TH/EN × blank/answers), 390/820 px layouts, all 70 quiz questions through controls, all 29 drag confirmations, reload/resume, English prompts, and paired sheet opening. Evidence is uploaded as `polymers-integration-evidence`.
- A workflow/script being present is not a pass: actual completed results and any fixes are recorded in the PR before handoff.

## Publication retry — 8 November 2026

[PR #152](https://github.com/Nixcentury/learning-hub/pull/152) merged the complete content into `main` at `47acf0e48f2c6ce4977df520b3e20baea660aea8`. The [built-browser integration run](https://github.com/Nixcentury/learning-hub/actions/runs/42399952343) passed. The [Pages publication run](https://github.com/Nixcentury/learning-hub/actions/runs/42400395785) passed its build and unit checks, then its first deploy attempt remained at `syncing_files` until the ten-minute timeout. A deploy-only retry was requested; at the time this follow-up was prepared, the public catalog still lacked the Polymers routes and the two content URLs returned HTTP 404.

This documentation follow-up creates a fresh `main` commit when merged, triggering the existing `Learning Hub Pages` push workflow with the complete merged content. Publication success must be checked separately from the passing content tests.

After that deployment, verify:

1. The public `route-catalog.v1.json` contains ready entries for `lower-science-polymers-l01-l08-sheet` and `lower-science-polymers-l01-l08-review`.
2. Both files under `content/lower-science/materials/` return HTTP 200.
3. A freshly loaded Hub shows the learning-sheet and review-quiz cards under Lower Secondary Science → Materials → Polymers, and both cards open their activity.

Intended published entry points, to verify after deployment:

- [Polymers tools menu](https://nixcentury.github.io/learning-hub/#lower-science/bank/polymers)
- [Learning sheet](https://nixcentury.github.io/learning-hub/#content/lower-science-polymers-l01-l08-sheet)
- [Review quiz](https://nixcentury.github.io/learning-hub/#content/lower-science-polymers-l01-l08-review)

## Content review during integration

Read the eight lesson explanations, the 41 choice prompts/options/keys, and all 29 drag passages with their encoded answers filled in. No blocking conceptual error was found in polymer formation, independent classification criteria, PE branching/density, thermal behaviour, plastic applications, rubber/fibre origins, or environmental distinctions. The two editorial corrections above improve the material without shortening the detailed lesson. This is a manual review, not an independent reproduction of the author's original publisher-source audit.

Reference spot-checks used primary educational/terminology sources:

- [IUPAC: homopolymer](https://goldbook.iupac.org/terms/view/H02854) and [copolymer](https://goldbook.iupac.org/terms/view/C01335).
- [Open University: chain branching](https://www.open.edu/openlearn/mod/oucontent/view.php?id=3484&section=2.3.2) for PE architecture and density.
- [UNSW: polymer types](https://www.unsw.edu.au/science/our-schools/materials/engage-with-us/high-school-students-and-teachers/online-tutorials/polymers/structure-and-form/polymer-types) for the usual thermal distinction and cross-linking.
- [University of Cambridge: toughness](https://www-materials.eng.cam.ac.uk/mpsite/properties/Ie/toughness.html) for distinguishing energy absorption from strength.
- [Cotton Incorporated: rayon](https://cottonworks.com/encyclopedia-item/rayon/) for regenerated cellulose.

## Limits

This review does not certify original-exercise coverage. The source author's report explicitly says Focus Workbook pp. 32–34 and Textbook Test Yourself 3.1 p. 50 were unavailable. Physical iPad/Safari, Apple Pencil, real cloud account sync and paper-printer output are not verified by headless Chromium. The full learning sheet is retained; the guide selects a shorter classroom route.
