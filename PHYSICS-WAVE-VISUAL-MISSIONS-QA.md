# Physics 10.1 / 10.2 — wave visuals, missions and exact measurement

Base main: `c45830917c76b002f53edc4fdc894721fcdcd4b5` (PR #58). Existing learning sheets, engine, navigation, accounts and storage are unchanged. Both authored activity IDs and deep links are retained:

- `#content/physics-ipst-wave-optics-10-1-mini-sim`
- `#content/physics-ipst-wave-optics-10-2-double-slit-lab`

## Visible changes

10.1 defaults to a wave field **and** solid crest / dashed trough fronts in all four modes. Reflection and refraction now have signed scalar fields alongside their rays, normal and angle labels. Diffraction pairs its existing Fraunhofer field with planar incoming and circular outgoing front lines, including the phase reversal in side lobes. Layers can be hidden separately. Animation front positions wrap by cycle, so fronts remain present after long playback.

Interference reuses the existing two-source water renderer and exact geometry. Controls include phase 0°/180°, nodal/antinodal hyperbolas, paths, variables, L and a freely movable P. Click the field, drag the 44px P handle, use arrow keys or use the position sliders. The exact half-wavelength side example remains available. Arbitrary P may be between loci; neither the readout nor grading silently rounds it to an exact node.

The shared screen diagram follows the two supplied reference diagrams: source separation d, distance L, rays, θ₁/θ₂, y₁/y₂, signed m=0,±1,±2 at phase 0°, and a red **time-average** intensity profile. At phase 180° the centre is dark and guide labels use half-integer signed path differences. Closely spaced labels are thinned on narrow displays. Numeric first/second order positions and angles remain in the caption at phase 0°. The selected P is linked to the curve by a horizontal segment and dot. Playing waves leaves mean intensity fixed. I₀ is the in-phase axial intensity reference.

The same diagram appears in both 10.2 views. Water P follows its existing probe. Optical P follows marker R, using the same wavelength, separation, L, source phase and finite-slit envelope as the expanded measurement screen. The optical ruler keeps its physical scale across A/B/C. Diagrams have explicitly labelled fixed ranges: 10.1 water ±16 cm, 10.2 water ±32 cm, light ±40 mm. The ray layout is schematic, not to scale.

### Eight answerable 10.1 missions

Each mode has two tasks, case A/B controls where useful, an observation checklist, two answer fields, hints, check/retry feedback and completion progress. Answers to live questions are invalidated when the corresponding experiment changes. Completed task history remains available for review.

| Mode | Task 1 | Task 2 |
| --- | --- | --- |
| Reflection | Change incidence; find reflection angle and its reference | Compare 20°/60°; find the complementary surface angle |
| Refraction | Compare equal media and air-to-glass; calculate angle, identify unchanged frequency | Compare glass-to-air below/above critical angle; calculate θc |
| Interference | Compare the centre at 0°/180° | Choose P; calculate live path difference and classify it |
| Diffraction | Compare 400/700 nm at fixed opening; infer wavelength from frequency | Compare 0.8/4.0 μm at fixed wavelength; calculate a/λ |

Formula/problem/solution disclosures and free exploration remain. Per-mode settings, layers, answer text, progress and open answer panels survive TH/EN and mode changes. Snapshot version 2 validates these states; version 1 migrates with visual/mission defaults. Work stays in memory; reload/close starts fresh, with no account upload. Restore pauses animation. Existing parent/origin/type and identity protections remain.

### Exact measure in 10.2

“วัดพอดี · แบบจำลอง / Exact measure · model” places L/R at full-precision optical interference minima:

- Phase 0°: the two minima bounding the central bright fringe, at `L tan(asin(±λ/(2d)))`.
- Phase 180°: minima at zero and `L tan(asin(λ/d))`, bounding the adjacent positive bright fringe. The centre remains dark.
- Units are converted to mm after evaluation. It zooms out only if needed to keep both markers visible; it does not otherwise reset zoom.
- Both markers count as placed. A record made with this button is labelled **Model**. Editing a marker returns to manual measurement. Historical rows retain their method, phase and settings. Old snapshots/records without method data remain compatible.
- The six existing 10.2 missions, manual dragging, keyboard fine adjustment, record gate, deletion and student-data wavelength calculations remain.

## Physics limits

Reflection/refraction fields illustrate scalar wave geometry with equal transmitted amplitude and a +1 reflected coefficient. They are not a Fresnel amplitude/phase calculation; media are stationary with fixed nondispersive indices. Tangential phase follows Snell’s law and frequency is unchanged. TIR shows no propagating transmitted ray; evanescent fields are omitted.

Water uses two coherent sources with equal received amplitudes and no spreading loss. Exact path difference is `|r₂−r₁|`. `d|sin θ|` requires L ≫ d; `d|x|/L` additionally requires |x| ≪ L. All three values are displayed together. Scope and approximation conditions are visible in both languages.

Diffraction remains a scalar far-field angular schematic, with a denoting opening width rather than source separation d. Optical guide rays mark the two-slit constructive carrier condition; the finite-aperture envelope can slightly shift maxima of the complete intensity curve. Exact measure uses bounding interference zeros, not fitted peak centres. The mean profile and instantaneous displacement are explicitly distinguished.

References: existing learning sheets 10.1 sections 6–8 and 10.2; OpenStax [refraction](https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction), [TIR](https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection), [interference mathematics](https://openstax.org/books/university-physics-volume-3/pages/3-2-mathematics-of-interference) and [double-slit diffraction](https://openstax.org/books/university-physics-volume-3/pages/4-3-double-slit-diffraction).

## Verification

- `pnpm test:unit`: 395 passing tests, including eight new tests for exact minima in both phases across all optical settings, exact/far-field screen orders, profile agreement with existing models, tangential scalar phase, all eight mission answer sets, live P grading and invalid state shapes. The final TIR guard was also checked with the targeted eight-test suite.
- `pnpm test:bank`: 66 pass.
- `pnpm validate:routes`: 35 HTML-menu contents, unchanged activity identities.
- `pnpm build`: content validation, TypeScript, Vite and Pages artifact checks pass. Content validator retains 32 pre-existing draft warnings and no errors. 608 public files verified identical in the Pages artifact.
- Real Hub Chromium browser fixtures, source and built `/learning-hub/` artifact: original four-mode simulation regression, new eight-mission workflow, original optical/manual measurement plus exact-measure additions, and all six guided 10.2 missions. Firebase is stubbed; external requests are blocked; no live login or writes.
- Checks cover TH/EN state preservation, invalid/legacy snapshots, reduced motion, keyboard sliders/tabs/P, 44px handles, 820/390px layouts, emulated touch dragging, exact-measure touch, unchanged average profile during animation and front continuity after 1,000 cycles.
- Thai screenshots inspected for ripples plus fronts, diffraction, linked profiles, optical geometry and mobile layouts. Reports/screenshots are reproducible under ignored `qa-output/` using the browser scripts. The phone reset test centres the target to avoid the Hub companion overlay.

Browser commands (set PLAYWRIGHT_MODULE and QA_BROWSER_EXECUTABLE for the local runtime; add QA_BUILT=1 for the built artifact):

```
node scripts/test-wave-mini-sim-browser.mjs
node scripts/test-wave-visual-missions-browser.mjs
node scripts/test-double-slit-lab-browser.mjs
node scripts/test-guided-interference-browser.mjs
```

Native iPad/Safari and a live post-merge deployment were not tested. This change is prepared as a draft PR; it does not merge or deploy.
