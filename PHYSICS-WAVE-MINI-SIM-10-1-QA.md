# Physics 10.1 — four-mode wave mini simulation

## Scope and integration

- Base: `main` at `a4784e6e7caf7297708a081dbf929c1f05ff0b2f`.
- Companion to sections 6–8 of the existing 10.1 learning sheet. The sheet and its images remain unmodified.
- Existing topic menu: `public/content/bank/physics/b-08c93bb5cd14a7bc7de0a8e0.html`.
- Added simulation content/activity ID: `physics-ipst-wave-optics-10-1-mini-sim`.
- Hub deep link: `#content/physics-ipst-wave-optics-10-1-mini-sim`.
- The existing Workspace opens the authored simulation. No engine, account service, Firebase, dependency, CI, or generated catalog is changed.

## Behaviour

1. Reflection: vary incidence from 0–75°, with wavefronts, rays, normal and complementary surface angle. One worked problem converts the surface angle before applying the reflection law.
2. Refraction: air/water/example glass, incidence 0–80° and vacuum wavelength 400–700 nm. Show Snell angle, speed and wavelength; keep frequency constant. Above critical incidence show total internal reflection and a matching critical-angle problem instead of an invalid refracted angle.
3. Interference: two coherent sources, wavelength 1–4 cm, separation 4–12 cm, phase 0°/180°. Choose a centre-line probe or an off-centre probe placed on an attainable `|r2-r1| = lambda/2` hyperbola. Background shows total amplitude, and moving rings show individual crests. Nodes are defined by zero amplitude, not instantaneous displacement.
4. Diffraction: independently compare changing wavelength at fixed opening or changing opening at fixed wavelength. The other slider is disabled. Show the forward axis, first-dark directions, theta, and a/lambda. The formula recap and problem emphasise the two trends already in learning-sheet section 8; no fringe-position problem is introduced.

Each mode has its own independent formula, problem and worked-solution disclosures. All start closed. Parameter changes update the problem and close the previous worked solution. Switching modes or TH/EN preserves settings and disclosure state. Reset clears only the selected mode's settings/disclosures. Play/pause controls the visual clock; reduced-motion preference starts paused.

State is in memory only. The optional `LearningHubSimulation` snapshot API validates all mode parameters and restores paused. Malformed snapshots are rejected atomically. Messages require matching parent source, same origin and the exact context message type. Changing identity clears work. There are no scores, storage writes or cloud uploads.

## Physics and visual scope

- Use `c = 3.0e8 m/s`, matching the learning sheet.
- Reflection/refraction are plane-wavefront and ray diagrams. At a stationary interface, `n1 sin(theta1) = n2 sin(theta2)` preserves tangential wave phase, `v = c/n`, `lambda = lambda0/n`, and frequency is unchanged. Reflected amplitude, reflection phase shifts, dispersion and evanescent fields are not modelled.
- Interference is the coherent sum of two scalar waves with equal received amplitudes everywhere; spreading loss is intentionally omitted. The colour is resultant amplitude 0–2A. Source-front circles use the same spatial scale on both axes. The probe positions guarantee valid node/antinode comparisons in both phase settings.
- Diffraction uses the scalar Fraunhofer angular field `sinc(pi a sin(theta)/lambda)`, with the removable on-axis limit handled explicitly. The first zero is at `sin(theta) = lambda/a`. Both side lobes and field phase reversal are retained; first-dark lines are not drawn as the final reach of light.
- The diffraction image is explicitly a far-field angular schematic, not a near-field propagation solution. Aperture and distances are schematic. Blue/orange show positive/negative slowed scalar fields, normalised to each pattern's peak; they do not compare transmitted intensity across different openings. The wavelength/width slider ranges ensure a forward first-dark direction exists.

Primary reference checks (original UI wording, problems and code):

- Existing repository learning sheet, sections 6–8: `public/content/physics/ipst/wave-optics/10-1-wave-model-learning-sheet.html`.
- OpenStax, [Refraction](https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction).
- OpenStax, [Total Internal Reflection](https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection).
- OpenStax, [Interference of Waves](https://openstax.org/books/university-physics-volume-1/pages/16-5-interference-of-waves).
- OpenStax, [Single Slit Diffraction](https://openstax.org/books/college-physics-2e/pages/27-5-single-slit-diffraction).

## Verification

- `node --test scripts/wave-mini-sim.test.mjs`: 9 physics tests passed. Independent analytical Snell example; normal/equal-index cases; reversibility and tangential phase; grazing vs total reflection; amplitude vs momentary zero; reachable probes over slider extremes; diffraction zeros and nonzero side lobes; both fixed-variable spreading trends; invalid parameter validation.
- `pnpm test:unit`: 365 passed, 0 failed, including the 9 new tests.
- `pnpm build`: 0 content errors and 32 existing draft warnings. The Pages resource-copy verification also passes. No generated artifacts committed.
- `scripts/test-wave-mini-sim-browser.mjs`: real Hub source and built-artifact workflows, with Firebase stubs and external requests blocked. Four modes, paused clock, reduced motion, independent disclosures, calculation updates, TIR, both interference probe positions/phases, both locked diffraction comparisons, parent TH/EN, per-mode state and reset, atomic restore validation, untrusted messages, keyboard tabs/sliders, 820/390 px overflow checks and actual touch actions in Chromium emulation.
- Visual inspection: all four modes in Thai, English diffraction, and phone-size Thai layout. QA screenshots and report stay in ignored `qa-output/wave-mini-sim/`.
- `git diff --check` and route validation pass.

To repeat browser QA:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright QA_BROWSER_EXECUTABLE=/path/to/chromium node scripts/test-wave-mini-sim-browser.mjs
QA_BUILT=1 PLAYWRIGHT_MODULE=/path/to/playwright QA_BROWSER_EXECUTABLE=/path/to/chromium node scripts/test-wave-mini-sim-browser.mjs
```

Not verified: native Safari, a physical iPad, physical optical apparatus or a live signed-in/cloud workflow. Chromium responsive/touch emulation is not a real-device test. Nothing has been merged or deployed as part of this change.
