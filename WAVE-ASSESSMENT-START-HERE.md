# Wave 10.1 practice assessment

The four-mode mini lab now has six main questions per mode: four understanding
questions with native dropdowns and two numeric calculations. Each of the two
missions contains two understanding questions and one calculation.

## Rubric and learner flow

- Understanding: 1 point per main question, split across its subparts.
- Calculation: 3 points per main question, with partial credit per subpart.
- Total: 10 per mode, 40 overall. Latest checked score, best practice score and
  the number of fully answered/checked main questions are displayed separately.
- Every question identifies its learning objective; per-objective latest scores
  use the same three objectives as the simulation and guide.
- Next mission requires every subpart to be filled and checked, including wrong
  responses. It does not require perfection or A/B clicks for points.
- Calculations use the fixed data stated in the question, independent of sliders.
- Checking reports correctness without filling answers or displaying solutions.
  Approach hints are procedural. The former worked-problem panels are removed;
  formula recap remains available during exploration.
- Answering hides calculated readouts, screen graphs, observation summaries,
  formula panels and model-scope text. Learners can return to exploration.
- The reading guide covers all four modes with native contents links. It gives
  actions and prerequisites, without selected answers or worked calculations.

## Persistence and account boundaries

Revision: `wave-10-1-assessment-20261107`. Old two-question mission snapshots are
not imported into this new rubric. Simulation state API is version 3.

Drafts, checked responses and best responses are retained across A/B, mode,
mission, language and exploration reset. Clear this attempt clears the current
draft; previous checked and best scores remain. Native inputs keep focus while
typing and while account responses arrive.

Guest progress is local to the browser/device. Signed-in progress also uses the
existing owner-only `quizProgress` rules at
`quizProgress/simulation-wave-10-1-assessment-20261107/<uid>`. No Firebase rules
or Classroom submission/grade totals are changed. These are practice scores.
Guest and account drafts have separate local keys; account switches reset the
live assessment before restoring the correct owner.

The host validates same-origin messages against a live, registered simulation
frame and the current auth uid/epoch. Closed frames and late account responses
are ignored. Stored envelopes carry a JSON string payload so RTDB does not prune
empty maps or alter arrays. Transactions merge per-mission draft/check times
and regrade best response sets instead of trusting submitted numeric scores.
Offline edits are saved locally and retried after reconnecting. The status line
distinguishes local saving, pending sync and confirmed account saving.

## Main files

- `missions.js`: fixed bilingual question bank, validation, grading and merging.
- `guided.js`: multipart questions, feedback, latest/best/objective summaries.
- `storage.js`: iframe local persistence, account bridge and sync races.
- `js/simulation-progress-bridge.js`: pure host boundary and session guards.
- `js/simulation-progress.js`: Firebase transaction/auth adapter.
- `public/shared/wave-assessment-progress.js`: shared revision and payload reader.
- `guide-data.js`: shared objectives and reading-only procedural guide.

The simulation asset files above live under
`public/content/physics/ipst/wave-optics/assets/10-1-sim/`.

## Validation

`pnpm test:assessment` covers rubric counts, independently calculated numeric
expectations, partial credit, fixed question data, physics regressions, guide
structure, corrupt records, account separation, host message guards and in-flight
cloud responses retaining the active input. `pnpm test:unit` also checks shared
Workspace/quiz behavior. `pnpm build` verifies the production Pages artifact.

`pnpm test:assessment:browser` is included in the Workspace workflow against the
built Hub with Firebase stubs, without live writes. It checks all 24 questions,
40 points, partial credit, retained best scores, A/B and reset, reload, TH/EN,
numeric keypad hints, 44px controls, responsive widths and the reading guide.
Account cloud behavior is covered by controlled tests; a real authenticated
Firebase round trip and Safari/PWA on a physical iPad remain device checks.

Observed local QA, 7 November 2026: all 722 unit tests and the Pages build passed.
The real Hub in guest mode was exercised through all 24 questions and all eight
missions. Full-credit, partial-credit, retained best score, A/B, exploration reset,
language change and reload/resume behaved as expected. Editing a checked answer
disabled Next until it was checked again. Layouts at 1024, 768 and 674 CSS pixels
had no horizontal overflow in any mode; dropdowns were at least 44px high and
numeric inputs 48px with a decimal keypad hint. All four native guide contents
links scrolled to their sections; the reader contains no buttons or solutions.
