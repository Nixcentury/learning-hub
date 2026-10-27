# Physics 10.2 — double-slit measurement lab

## Integration and scope

- Base: `main` at `b0a9056c3771fddc42749e7537fc7d5888110f62`.
- Existing topic menu: `public/content/bank/physics/b-21460452889578f11c3a8bac.html`.
- Added content/activity ID: `physics-ipst-wave-optics-10-2-double-slit-lab`.
- Deep link: `#content/physics-ipst-wave-optics-10-2-double-slit-lab`.
- Adds an authored simulation through the existing Workspace. The 10.2 learning sheet, book crops, engines, accounts, Firebase, dependencies and CI are unchanged.

The source reviewed is the repository's current 10.2 learning sheet, its `assets/10-2/SOURCES.md`, and the actual apparatus, A/B/C result, fringe-boundary and ruler images. The full source PDFs are not bundled in the repository and were not reread for this lab. The setup image shows a 1 m slit-to-screen distance. The three book cases specify green/50 μm, green/100 μm and red/100 μm. The simulation explicitly chooses 532/650 nm and a fixed individual slit width of 10 μm; these values are not presented as measurements from the photographs.

## Student workflow

1. Choose A/B/C at L = 1 m. All presets retain the chosen ruler zoom. Laser colour, slit separation and screen distance (0.5–2 m) can also be changed; non-preset combinations are labelled Custom.
2. Position L and R independently at the dark minima immediately bounding the central bright fringe. Markers do not snap to the answer. Dragging, ±0.1 mm buttons, arrow keys and Shift+arrow 0.01 mm steps are supported.
3. Zoom 1×/2×/4× changes the visible range, never physical cursor coordinates or saved readings. Offscreen markers get a clear direction indicator and zoom-out message.
4. Record only after moving both markers and putting L left of R. Disabled-button guidance explains the missing action. Saving stores immutable copies of settings and cursor positions. Up to 30 records can be kept; individual rows can be deleted.
5. Open formulas, theory comparison and measurement-derived calculations independently. They start closed. Current-theory comparison uses the current markers; the wavelength exercise uses the latest record's displayed width, rounded to 0.01 mm consistently in its working. Historical comparisons use each record's original settings.

Changing experimental conditions starts a new measurement without deleting past records. Reset markers affects only the current measurement. TH/EN and zoom preserve settings, cursor positions, records and disclosure state. Work is in memory during the window only; no score, storage or account upload is added.

`LearningHubSimulation` exposes snapshot/restore/subscribe. Validation rejects malformed identity, nonfinite values, invalid settings, zooms, duplicate record IDs and nonpositive recorded widths atomically. Parent context messages require the correct source, origin and type; identity changes clear work.

## Physics

- Uniform, monochromatic, normally incident coherent illumination of equal rectangular slits, in phase and with equal amplitudes.
- Far-field horizontal intensity: `I/I0 = cos²(pi d sin(theta)/lambda) * sinc²(pi a sin(theta)/lambda)`, `theta = atan(x/L)`, `sinc(0) = 1`.
- Physical screen coordinates are millimetres. The ruler has a fixed physical mapping at each explicit zoom; presets never auto-fit their pattern to the viewport.
- First central-fringe minima: `x = ±L tan(asin(lambda/(2d)))`. Their full span agrees with the learning-sheet small-angle result `Delta x ≈ lambda L/d` to better than 0.003% over the supported configurations.
- Small-angle values at 1 m: A = 10.64 mm; B = 5.32 mm; C = 6.50 mm. Doubling L doubles the angular pattern's screen coordinates. Inverse wavelength calculation converts all quantities to SI before returning nm.
- Display uses an illustrative vertical Gaussian beam profile and intensity tone mapping to expose faint fringes. It does not calculate slit-height diffraction, camera response, visual brightness, laser power, noise or misalignment. The apparatus schematic is not to scale. These limits are stated in the activity.

Primary formula check: OpenStax, [Double-Slit Diffraction](https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction). UI text, drawings, problems and code are newly authored. Existing book images remain in the learning sheet.

## Verification

- `node --test scripts/double-slit-lab.test.mjs`: 9 tests passed. Analytical preset values and ratios, both central minima, symmetry/bounds/missing orders, screen-distance scaling, inverse units, signed ruler mappings, recording gates and snapshot validation.
- `pnpm test:unit`: 374 passed, 0 failed, including the 9 new tests.
- `pnpm test:bank`: 66 passed, 0 failed.
- `pnpm build`: 0 content errors, 32 existing draft warnings; 568 public files copied identically into the Pages artifact.
- Route validation: 34 HTML-menu contents, with existing chapter/topic counts preserved. `git diff --check` passes.
- `scripts/test-double-slit-lab-browser.mjs` exercises the actual source Hub and built Pages artifact, with Firebase stubs and external requests blocked. Mouse drags measure all A/B/C cases, zoom preserves physical readings, previous trials remain immutable, L changes label/update correctly, calculations use measured data, TH/EN preserves the snapshot, deletion/reset/keyboard/fine buttons work, crossed-marker guidance is explicit, restore rejection is atomic, and untrusted messages are ignored.
- Chromium responsive layouts at 820/390 px have no page overflow. Slider handles are at least 44 × 44 CSS px. Phone-size touch dragging uses native Chromium touch events, followed by touch recording. This remains emulation, not physical-device testing.
- Visually inspected Thai A and C, English overview, phone-size Thai layout and the measurement/ruler alignment. Additional standalone fixtures verify the record table and expanded English calculation panels. Screenshots and reports are ignored in `qa-output/double-slit-lab/`.

Repeat the browser workflow with `PLAYWRIGHT_MODULE=/path/to/playwright QA_BROWSER_EXECUTABLE=/path/to/chromium node scripts/test-double-slit-lab-browser.mjs`; set `QA_BUILT=1` for the built artifact.

Native Safari, a physical iPad, real optical equipment and a live signed-in/cloud workflow have not been tested. No merge or deployment is performed by this change.
