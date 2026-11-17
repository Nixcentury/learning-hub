# Double-slit Smart Lab Guide V1.0

Base: `6cc166b59a0a5db3dbb97a111a5d9ac835cee8d4`.
Activity ID and route remain `physics-ipst-wave-optics-10-2-double-slit-lab` and
`#physics/bank/double-slit-interference/double-slit-lab`.

## Completed rounds

- R01: reviewed the original six-mission flow, removed the modulo-six return,
  made the primary action follow experiment/check-out/pass/report state, and
  limited forward selection to the first unfinished mission. Completed missions
  remain available for review. A partially migrated final mission returns to
  unfinished missions rather than claiming the whole lab is complete.
- R02: added the bilingual floating guide, live checklist, minimise/hide/reopen,
  transient noninteractive arrow/highlight and numeric partners for the existing
  sliders. Locating a control never clicks, changes a value, plays the waves or
  resets the experiment. The guide stays left of the Hub companion and is tested
  not to cover its target control on a 390px layout. Both N/A layers start on;
  learner layer choices remain editable and are restored as saved.
- R03: retained the original nine questions and added one number-entry experiment
  in each of missions 3, 4 and 6: counts `[1,1,3,3,2,2]`, total 12. Experiment
  readiness uses the existing `InterferenceMissions.requirements()` model with
  added evidence, rather than a second completion detector in the guide.
  Captured P and measurement records remain fixed while answering. Explicit
  "Use new experiment data" clears current responses, not first-attempt scores.
- R04: added local IndexedDB persistence with a synchronous localStorage mirror,
  version-3 snapshots, a report with student name/class/Bangkok start date,
  per-mission scores, records, checked responses and A4 print styles. All six
  missions end at the report; review is a separate action.
- R05: verified the complete flow through the real Hub in source and built Pages
  output, original optical regressions, wrong/retry scores, data freeze, reload,
  migration, account isolation, storage fallback, responsive and touch behaviour.

## Retained physics and additional experiments

Physical geometry, intensity, wavelength inference, locus classification,
measurement mapping and optical presets are unchanged. `model.js` only accepts
the new snapshot version; `water-model.js` only changes initial layer visibility.
No Hub engine, route identity, account service, Firebase Rules, dependency or
deployment configuration is changed. The existing reading guide is updated to
match the floating guide and 12-question workflow.

1. Mission 3: set lambda=2cm, d=8cm, L=12cm, phase=0 degrees, show paths and choose
   the half-wavelength example. The added response is path difference in cm.
2. Mission 4: set d=8cm, L=60cm, x=6cm and show the formulas; calculate d|x|/L.
3. Mission 6: choose C, set L=2.0m, position both markers and record. Infer lambda
   from this measurement, not from the configured laser wavelength. The original
   question keeps the latest record available on entry. Its extra question uses
   a separate captured C/2m record. Width is rounded to the displayed 0.01mm for
   both question generation and grading, as in the retained original workflow.

## Scores and report

- Progress = passed missions / 6. Experiment step ticks are not passed missions.
- First attempt = correct first-checked questions / 12. A check only counts when
  experiment requirements and all responses for that mission are present.
  Unchecked questions remain pending. First checks also retain the original
  response and question text for the report.
- Mastery = questions ever answered correctly / 12. Hints, guide jumps, retries,
  language changes and review carry no penalty. Restarting a mission can clear
  that mission's working responses/evidence without erasing these score records.
- The report includes the first and latest checked responses, full measured
  records with model/manual provenance, and the exact data used in wavelength
  questions even if their source row is later deleted.
- Printing the report document hides controls, floating widgets and name input
  fields; the entered identity is printed as text. The tested fixture exports
  as A4 portrait with Thai text and all mission titles and responses.

## Local state and migration

Storage is scoped to this activity and the current Hub uid or Guest. A genuine
same-origin parent context handoff flushes the old identity before loading the
new one; late asynchronous replies cannot restore another identity. The existing
`LearningHubSimulation` API is retained and adds `flushLocal()` for the existing
Workspace close hook. Reload/close mirrors current work synchronously. IndexedDB
writes are queued; lack of IndexedDB falls back to the local mirror. If neither
store works, the save status explicitly says work remains in this window.

The newest valid saved copy is restored atomically. Malformed snapshots fail
without partially changing current work. Version 1 retains optical records;
version 2 retains answers, observations, measurements and historical completion.
Previously passed original questions retain mastery. Newly added questions must
be completed, and no historical first-attempt score is invented. Learner-chosen
layer visibility from old work is preserved rather than replaced by the new
defaults. Animation is paused on restore.

## Verification

- Full repository unit suite: 790 passed, 0 failed. The final targeted physics,
  score/migration and reading-guide suites: 34 passed, 0 failed.
- `pnpm build`: content validation and TypeScript passed; 1549 public files
  verified identical in the Pages artifact. Existing draft warnings remain.
- Oxlint for changed JavaScript/tests and `git diff --check` passed.
- `scripts/test-guided-interference-browser.mjs`: source and built Pages output,
  actual Hub UI, all six missions / 12 questions, deliberate first error then
  retry (11/12 first score, 12/12 mastery), immutable P data, C/2m evidence,
  report/print, TH/EN state preservation, reload, atomic rejection, v2 migration,
  IndexedDB failure/local fallback, account switch and return, repeated guide
  jumps, minimise/hide/reopen, 390/820px layouts, nonoverlapping guide target and
  Chromium touch P movement. No page errors and no live account writes.
- `scripts/test-double-slit-lab-browser.mjs`: original manual mouse/touch optical
  measurement, A/B/C, crossing/ordering checks, zoom, exact minima, historical
  records, unit inference, language and snapshot regressions passed.

Run browser checks with `PLAYWRIGHT_MODULE=/path/to/playwright` and
`QA_BROWSER_EXECUTABLE=/path/to/chromium`; use `QA_BUILT=1` after `pnpm build` for
the built artifact. QA screenshots, PDF fixture and JSON reports remain in
ignored `qa-output/smart-lab-guide/`.

Not tested: physical iPad, native Safari, Apple Pencil or live signed-in accounts.
Chromium touch emulation is not physical iPad testing. On a real iPad, verify
portrait/landscape and the numeric keyboard, P/L/R finger dragging, guide
highlight/reopen, Safari print preview, then reload and close/reopen under the
same identity. No merge or deployment is performed in this PR.
