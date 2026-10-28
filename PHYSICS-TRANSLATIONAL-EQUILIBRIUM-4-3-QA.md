# Physics 4.3: translational equilibrium simulation

## Delivered scope

New bilingual simulation with five experiments and a final four-question application stage. Each experiment follows prediction → comparison cases → observations → multiple-choice explanations. There are **19 choice prompts per language: 5 predictions + 14 explanation/application questions**. Incorrect predictions are allowed; observation and correct explanatory answers unlock the next stage. Explanatory answers can be retried, and completed stages can be revisited.

Experiments: monitor supported by a table; moving frictionless cart; concurrent three-force vectors and a head-to-tail triangle; angled supporting ropes; static versus kinetic friction on a slope. Numbers, diagrams and model boundaries are documented in `public/content/physics/ipst/equilibrium/assets/4-3/SOURCES.md`.

## Integration and persistence

- Exact published-catalog topic verified by a fresh read of the repository's configured public catalog endpoint: `b-d52412f9e1c700d9a5223472`, under Mechanical Equilibrium / Translational Equilibrium, zero bank questions.
- Activity ID: `physics-ipst-equilibrium-4-3-sim`; tool key: `simulation`.
- Stable bank route: `#physics/bank/b-d52412f9e1c700d9a5223472/simulation`; readable alias: `#physics/bank/translational-equilibrium/simulation`.
- New menu is isolated to this topic. No changes to 4.2, shared engines/CSS, catalog service, bank questions, account data or dependencies.
- Namespaced local progress, predictions, chosen answers and numerical observation records; TH/EN share progress. Language preference survives reload. Hub context changes switch identity before restoring local state. `LearningHubSimulation` exposes the established get/restore/subscribe contract. This does not claim automatic Cloud score/session saving.
- Print control creates the selected-language learning record: all 6 stages, 19 prompts, recorded values, selected choices and blank reason areas. It does not print all the correct answers or interactive controls.

## Validation performed

- `node --test scripts/equilibrium-4-3-simulation.test.mjs`: **10 tests passed**. Independent model checks cover non-zero-velocity coasting, braking, time-step independence, support force, the 3–4–5 triangle, all combinations of representative rope angles, static-friction bounds and the transition to kinetic friction. App handler tests cover prediction gates, retries, the entire six-stage sequence, printing-record structure, reload, malformed states and identity/origin boundaries.
- Repository unit suite passed. Content validation, route generation, TypeScript, production build and Pages artifact verification passed; only the 32 existing draft warnings remain.
- Chromium production preview: completed the actual interactions through all six stages; tried an incorrect prediction and incorrect explanatory answer, corrected the answer, and verified unlock/revisit behavior. Observed cart speeds 0→2, 2→2 and 2→1 m/s; observed a closed force triangle, asymmetric tensions, a stationary 20° block and a sliding 30° block.
- TH/EN state retained; language preference and full completed progress restored after reload.
- Opened through the real Hub bank route in Guest mode. The route resolved to the readable alias and loaded the simulation iframe. The central language control updates the simulation, and the simulation language control requests the matching Hub language.
- All 6 stages × both languages checked in a 390 px iframe fixture (375 px content width after its scrollbar): document width equals scroll width in all 12 cases, with no SVG text outside the view box in the initial case of each stage. This is a responsive-layout check, not native iPad/Safari verification.
- Both real print-button outputs checked in the browser DOM: 6 stage sections and 19 prompts, recorded values and selected choices retained; English output has no Thai text. No browser PDF or physical-print claim is made.

Ignored evidence is under `qa-output/physics-4-3/`: the current public catalog snapshot, responsive-layout report, exported TH/EN print records and browser proof images. Source PDF/page renders are under the task's scratch `tmp/physics-4-3`, not committed.

## Limits

No native iPad/Safari/Apple Pencil, browser PDF export, physical printer, signed-in account or Cloud-write test. The source is prepared as a separate review branch; no merge or deployment is implied by a local build. The simulation introduces the concepts but does not replace all IPST end-of-section problems.

## 28 October 2026 — configurable cart trials

Teacher-requested update to experiment 2, preserving the existing activity ID, bank route and progress structure:

- The visible model note explicitly says friction and air resistance are neglected, in both languages.
- The cart accepts a simulation interval of 1–60 whole seconds and a signed initial velocity from −20 to 20 m/s. Changing initial velocity or restarting applies that initial condition; changing the force sliders does not reset velocity. The inputs are disabled during a run and invalid/empty values cannot start it.
- Both guided observations and “Run this setup” honor the chosen interval. A trial ends exactly at its configured duration. The view pauses while the velocity reading remains the computed physical velocity. Long braking trials can reach rest or reverse, as described in the existing explanation. The default 2-second braking observation now gives 2→0 m/s, replacing the original automatic 1-second brake cutoff.
- The final comparison shows elapsed interval, before/after velocities and the resultant for a constant-force trial. Zero-resultant trials distinguish remaining at rest from keeping a non-zero velocity. If force is edited during a trial, the summary instead records that forces changed; it does not falsely claim zero resultant throughout.
- Applied force labels `F_L` and `F_R` include values in N and a bilingual symbol key. The separate resultant row shows `ΣF` and its signed value, including zero; velocity retains its blue `v` arrow.
- New control values and the latest completed cart comparison survive local reload and TH/EN switching. Existing snapshots without the new fields receive defaults; malformed new values are rejected. The latest comparison is included in the selected-language print record.
- Targeted simulation tests: **14/14 pass**, including 15-second coasting from +3, 0 and −2 m/s, exact stopping of the simulation clock, acceleration, reversal, preserving velocity while changing force, restart, invalid inputs, old-state migration, latest-comparison reload/translation/print, and force changes during a trial. The complete six-stage exercise flow still passes.
- Existing repository suite: **395/395 pass**. Production build, content validation and Pages artifact checks pass; 32 existing draft warnings remain. Source changes are confined to this simulation, its existing test and these source/QA notes; shared Hub timer/workspace code is unchanged.

Browser evidence and device limits for this update are recorded with the final task evidence under ignored `qa-output/equilibrium-seconds/`.

- Update browser check: the built simulation was exercised through the real prediction/observation/answer gates. A custom run entered through the numeric fields with 15 s, v₀ = 3 m/s and F_L = F_R = 2 N ended at 15.00 s, x = 45.00 m and v = 3.00 m/s. TH/EN switching and actual page reload retained both inputs and the result. The friction note and F_L/F_R/ΣF labels were present. A 390px iframe (375px content width) was checked in both languages with no horizontal overflow; the maximum-force label case had no clipped SVG text. This update was checked as the production simulation document and an iframe fixture; the existing Hub route/ID and central timing controls were retained. Native iPad/Safari and PDF export remain untested.
