# Physics 10.2 — guided interference upgrade

> Historical implementation report. See [the wave visuals and missions upgrade](PHYSICS-WAVE-VISUAL-MISSIONS-QA.md) for current field/front rendering, guided 10.1 tasks, linked profiles and exact measurement.

## Integration

Base: `ef8c128135dd597221559d5d415d2e80cda37f77` (main). The existing activity ID `physics-ipst-wave-optics-10-2-double-slit-lab`, topic bank key `b-21460452889578f11c3a8bac`, menu tool key, deep links and measurement module are retained. The existing 10.1 simulation is unchanged. New water and mission modules belong to the authored 10.2 simulation; no Hub engines, account services, dependencies, Firebase or CI are changed.

## Six guided missions

1. Play in-phase waves and identify the centre as an antinode. A wrong answer gives explanation and permits retry.
2. Select 180° source phase, show nodal loci and play; identify the central node.
3. Show both paths, move P or select an exact half-wavelength example, calculate the current path difference and classify the selected point.
4. Inspect both near/large-angle and far/small-angle cases; distinguish the assumptions of the angular and screen-offset approximations.
5. Measure and record A/B/C at 0°, then answer the two spacing-comparison questions. Historical records retain their own settings and source phase.
6. Infer wavelength from the latest record's displayed measurement, rather than from the configured laser value. A mathematically correct result can differ from the laser when a student chooses incorrect boundaries; feedback asks them to recheck their measurement.

Each mission has explicit experiment requirements, answer inputs, optional hints, check/retry feedback and a next button. Checking is disabled only while required actions are missing, with those actions listed. Users can revisit missions or switch to free exploration. Answers, completed missions, observation evidence, parameters, layers and recordings stay in memory across language/view changes; nothing is uploaded or graded into an account.

## Water view and geometry

- Two ideal coherent equal-frequency sources have equal received amplitudes everywhere. Spreading loss is omitted so exact nodal loci exist. Units are cm; the optical view remains in nm/μm/m/mm and is explicitly a different scale.
- Sources are `(0, -d/2)` and `(0, +d/2)`, with P at `(L, x)`. P can be tapped/dragged vertically on the screen; L moves the screen. Keyboard Up/Down and a position slider are supported.
- Compute `r1 = hypot(L,x+d/2)`, `r2 = hypot(L,x-d/2)`. The exact absolute path difference is evaluated by the equivalent stable expression `abs(2xd/(r1+r2))`.
- Compare exact `Delta r`, far-screen `d abs(sin(theta))` and small-angle `d abs(x)/L`, with `theta = atan2(x,L)`. Show absolute errors, avoiding division by zero at the centre. The UI distinguishes position x from fringe spacing Delta x.
- Nodal and antinodal curves are the exact constant-path-difference hyperbolas, not straight far-field rays. Their phase conditions exchange at 180°. Labels N/A count outward from the centre; the mathematical conditions use path/wavelength ratios.
- The water field is the sum of two sinusoidal scalar waves. Colour shows instantaneous displacement; moving solid/dashed rings show the individual sources' crests/troughs, with the quarter-cycle crest offset accounted for. A fixed time scale preserves propagation speed as wavelength changes. A momentary zero displacement is not called a node.
- Fronts, nodal loci, antinodal loci, paths, variable geometry and formula readouts can be toggled independently. Default layers are deliberately sparse.
- Exact mathematical classification remains available in the model. Mission 3 labels answers as **on/near** a locus and allows ±0.04 in Delta r/lambda for plotting tolerance. This does not snap or alter P or turn its exact amplitude into zero. An analytic example gives an exact half-wavelength point when it fits in the supported x range.

## Light view and compatibility

The original measured A/B/C experiment is retained. Presets explicitly reset phase to 0°. An optional 180° setting represents an added π phase shifter at one opening; the apparatus marks it and the centre becomes dark. Guidance then asks for one adjacent bright fringe, rather than a nonexistent central bright fringe. Recorded trials include phase. Small-angle fringe spacing remains lambda L/d.

Snapshot API version 2 validates water state, mission state, progress, answers, optical phase and the existing record data atomically. Version-1 snapshots migrate to the light view with 0° phase, preserving historical measurements. Restores pause animation. Wrong-source/origin/type messages are ignored; a genuine parent identity change clears work. The transient animation clock is not a saved learning result.

Primary references: the existing 10.2 learning sheet and its source notes; OpenStax [Young’s Double-Slit Interference](https://openstax.org/books/university-physics-volume-3/pages/3-1-youngs-double-slit-interference) and [Mathematics of Interference](https://openstax.org/books/university-physics-volume-3/pages/3-2-mathematics-of-interference). Wording, drawings, missions and code are newly authored.

## Verification

- `scripts/guided-interference.test.mjs`: 13 tests, covering geometry, phase exchange, exact example points, every drawn locus, approximation limits, mappings/state bounds, optical π phase, action requirements, dynamic grading, plotting tolerance and measured-data wavelength inference.
- Full unit suite: 387 passed, 0 failed. Bank suite: 66 passed, 0 failed.
- Build: 0 content errors, 32 existing draft warnings; 605 public files verified identical in the Pages artifact. Route validation and diff checks pass.
- `scripts/test-guided-interference-browser.mjs`: all six missions completed through the actual Hub UI; wrong answers/retry, free and exact P, between-locus cases, both approximations, A/B/C measurements, measurement-derived grading, TH/EN state, optical phase/reset, snapshot rejection/legacy migration, untrusted messages and genuine parent identity reset.
- `scripts/test-double-slit-lab-browser.mjs`: retained optical measurement workflow passes after entering the light/free view. It continues to cover mouse and emulated touch markers, zoom, records, calculations and keyboard/fine controls.
- Source workflows and the final built artifact were exercised in Chromium. Responsive 820/390 px layouts have no page overflow. Native emulated touch drags P, with a 44 px handle; keyboard adjustment also passes.
- Visual inspection includes both source phases, nodal curves, path/variable geometry, far-screen geometry and phone water view. Additional mission/formula fixtures inspect Thai and English text. QA assets stay under ignored `qa-output/guided-interference/`.

Use `PLAYWRIGHT_MODULE=/path/to/playwright QA_BROWSER_EXECUTABLE=/path/to/chromium node scripts/test-guided-interference-browser.mjs`, with `QA_BUILT=1` for the built artifact. The optical regression script uses the same environment variables.

Not tested: native Safari, a physical iPad, real ripple/optical equipment or live account/cloud writes. Chromium touch emulation is not real-device testing. No merge or deployment is performed by this change.
