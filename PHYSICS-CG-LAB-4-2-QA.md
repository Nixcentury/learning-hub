# Physics 4.2 — Centre of gravity suspension lab

Created 27 October 2026 from the teacher-approved plan: suspend the same uniform lamina at A–C, mark its plumb lines, return to the original orientation, choose CG, then check the result. This is a new interactive companion to the existing 4.2 sheet; it does not replace that sheet.

## Route and files

- Existing bank topic: `b-c54c2d76bc074671ec10618f` (centre of mass and gravity). Confirmed from its current authored menu and the 4.2 worksheet link; no generated bank hash.
- Menu: `public/content/bank/physics/b-c54c2d76bc074671ec10618f.html`, new tool key `cg-lab`, kind `simulation`.
- Activity/contentId: `physics-ipst-equilibrium-4-2-cg-lab`.
- Entry: `public/content/physics/ipst/equilibrium/4-2-centre-of-gravity-lab.html`.
- Relative assets in `assets/4-2-cg/`: `model.js` (geometry and dynamics), `lab.js` (interaction, language and in-memory state), `lab.css`.
- Hub deep link after deployment: `#content/physics-ipst-equilibrium-4-2-cg-lab`.
- Existing worksheet, routes, account services and shared engines are unchanged. Only the authored menu and test-unit command are extended.

## Source and scope

Read the current 4.2 learning sheet, particularly sections 2–3 and its experiment questions, and its associated `PHYSICS-CENTRE-MASS-4-2-QA.md`. Followed `public/content/AI-AUTHORING-START-HERE.txt`, `public/content/templates/bank-id-authoring-guide.txt`, and the existing sound simulation’s ready/context/state interface. No new book scans or external experimental data were used in this task. All shapes and graphics are newly authored SVG geometry.

Three independently retained experiments: irregular polygon, triangle, L-shaped lamina. Each has three distinct holes. Learners may predict a point before experimenting, change it after seeing the lines, and check after two distinct records. The third line remains available as a check. Saved-trial thumbnails replay the corresponding equilibrium view.

No grades, database writes, accounts, storage keys or new engines. State survives language/shape changes while the window remains open; closing/reloading starts fresh. Restart clears only the selected shape, after a confirmation. A new Hub identity clears the current activity state.

## Physics

- Each plate is a rigid, thin, uniform lamina, roughly 30 cm across, in uniform gravity `g=9.81 m/s²`. Its support holes are ideal points without removed material.
- Centroid, area and polar moment of inertia per unit mass come from signed polygon integrals. No hand-placed answer coordinates or bounding-box centroids.
- About the selected fixed pivot: `theta'' = g*r_x/(I_CM/m + d²) - 2.6*omega`, using screen-oriented coordinates x right/y down. `r_x` is the rotating CG’s horizontal displacement from the pivot. RK4 uses fixed 1/240 s substeps driven by elapsed animation time; a background-tab gap is not replayed as an enormous timestep.
- The damping is phenomenological. Plumb-bob oscillation and equipment collisions are outside scope: the bob is an already-settled vertical reference.
- Settled means angular error <0.003 rad and speed <0.008 rad/s continuously for 0.6 s, followed by rounding to the exact stable angle. Pausing in motion never marks the plate as settled.
- Marks are stored in plate coordinates. The vertical observed at recording is inverse-rotated into those coordinates; old marks rotate with the plate when rehung. Distinct recorded lines intersect at the computed centroid.
- Outside-material parts of recorded lines are dashed extensions. This is essential for the selected L, whose CG `(0.098333..., 0.098333...) m` lies in the empty notch. Selection is therefore allowed in that empty area, not restricted to the material.
- Feedback uses a 6 mm pointer-selection tolerance, without scoring. The exact CG and vertical weight arrow appear only after checking. The arrow is transformed to remain vertically downward when the plate turns.
- The learning text distinguishes one line (a locus), a second distinct line (locates CG), a third (checks), and ideal exact intersections versus real experimental uncertainty. CM=CG is attributed to a uniform gravitational field, not merely uniform density.

## Checks performed

Rebased onto main `0d78f860c28dc482a6776e455e31e7428fa08c45` after the bank chapter/share-link updates, then reran build, the full unit suite and browser verification.

| Check | Result |
| --- | --- |
| Physics tests `scripts/cg-lab.test.mjs` | 8 passed: analytical rectangle/triangle area, centroid and inertia; L via independent rectangle subtraction; winding/translation invariance; all holes and stable poses; energy conservation with zero damping and dissipation with damping; convergence of all 9 shape/hole combinations; timestep convergence; line intersections and coordinate rotation |
| Full `pnpm test:unit` | 356 passed, 0 failed; includes the new physics tests |
| `pnpm build` | Passed, 0 content errors, 32 existing draft warnings; 551 public files verified |
| `pnpm validate:routes` | Passed; 31 HTML-menu contents; authored simulation registered without a new registry |
| `git diff --check` | Passed |
| Source Hub browser run | Passed |
| Final built Hub browser run | Passed in Chromium with local Firebase stubs; no live account/student writes |

`scripts/test-cg-lab-browser.mjs` opens the actual new Hub route and exercises:

- Three shapes; all three irregular trials; triangle suspension; L trials, including phone-size touch input.
- Pause/resume holds the physical angle and cannot record a false equilibrium; recording is enabled only at rest and duplicate holes cannot add evidence.
- Old mark coordinates survive the next suspension; saved trials, all three records, original orientation and check workflow work.
- The revealed weight arrow is vertical in screen coordinates after rotating the plate.
- TH/EN switching preserves the experiment. Shape switching preserves separate work. Reset clears only one plate.
- Click in the L’s empty notch, CG feedback, hidden/visible explanation and marker.
- Snapshot restore rejects another identity and NaN angle; non-parent context messages are ignored.
- No horizontal overflow at 820 and 390 px; keyboard point selection, native touch tap, mobile release/record buttons. On a narrow screen, releasing scrolls the bench into view.

Inspected desktop and narrow screenshots, including the final Thai mobile suspension view, English L result, and the desktop initial setup with Thai fonts. All geometry, plumb reference and controls remain visible. Evidence: ignored `qa-output/cg-lab/` (screenshots and `report.json`); no screenshots are published as deliverables.

## Limits and delivery status

Native Safari/iPad hardware, a physical experiment and physical printing were not tested. This first version intentionally excludes arbitrary user-drawn shapes, density editing, simulated measurement noise and the separate horizontal support/balancing experiment.

Delivered as a reviewable Git branch/PR; local build/browser success is not a claim of live deployment. No merge or production deployment is performed by this task.
