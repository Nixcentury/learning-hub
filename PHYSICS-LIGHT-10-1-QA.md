# Physics 10.1 — Wave model of light

Authored 22 October 2026 for the existing Learning Sheet V1 system.

## Content and entry points

- Content ID: `physics-ipst-wave-optics-10-1-sheet`.
- Bank menu: `b-08c93bb5cd14a7bc7de0a8e0` (the existing Wave Model of Light topic).
- Hub entry: `#physics/bank/b-08c93bb5cd14a7bc7de0a8e0/learning-sheet`.
- Author file: `public/content/physics/ipst/wave-optics/10-1-wave-model-learning-sheet.html`.
- TH and EN are complete separate language blocks sharing 76 semantic answer IDs. Existing language, answer controls, MathJax and printing are reused.
- Ten teaching sections cover electromagnetic-wave review, spectrum and uses, visible colours, relations and units, five worked examples through light-years, reflection/refraction, superposition and source phase, diffraction review, experimental light evidence, and the two IPST 10.1 understanding questions.
- Fourteen original SVG designs each have student and answer versions. Student versions physically omit solution paths, labels and answer metadata.
- Three local original experimental images: two from UNSW and one from the University of Colorado Boulder. Credits and source links accompany each image and are recorded in the assets directory.
- The experimental-light section stays qualitative. Slit fringe-position formulas are deferred to the later topics; path-difference conditions in the earlier section are explicitly a review of general waves.

## Validation

- Content validation, route catalog and production build pass.
- Full existing unit suite: 312 passed, 0 failed. Focused learning-sheet and bank-menu tests also pass (15/15).
- Browser verification uses the real shared sheet, MathJax, language and print components in a local same-origin, scripts-disabled iframe. It verifies all 76 paired answer slots, shared reveal state between languages, loaded images, rendered equations, and no horizontal overflow at a 390px viewport.
- All four print editions were generated with the shared paginator: TH/EN × blank/answers. Blank copies contain zero answer elements, retain the student diagrams, and contain only the selected language.
- PDFs were rendered for visual review. Thai fonts were supplied in the QA environment; these temporary fonts and the harness are not production changes.
- Native Safari/iPad behaviour and classroom device printing require device verification; the Chromium checks are not a native Safari claim.

No shared engine, authentication, Firebase configuration, saved-work IDs, question bank service or existing quiz content is changed.

## Concept revision confirmed 22 October 2026

- Replaced the first section's three answer slots with a compact star/radiation review, a fully labelled field diagram and a transverse-wave summary. No filling or answer toggles are required in that section.
- Added refractive index and light speed in vacuum/air/water/example glass; n is dimensionless, v = c/n, and stationary-interface frequency is retained while speed and wavelength can change. Added one glass-speed worked example; existing example IDs are preserved and visible numbering is now 1–5.
- Added six labelled reference SVGs: two controlled angular-spreading comparisons and a double/single slit apparatus/pattern comparison. The angle is explicitly measured to the first minimum; the central bright band is distinguished from the full field.
- Added a comparison table and reasoning prompt: bright–dark bands alone do not distinguish the experiments, and finite-width double slits exhibit both interference and diffraction.
- Shared engines, content ID, bank menu and all retained slot IDs are unchanged.

Revision checks: full suite 312/312 passes; content/routes/build pass; 76 paired slots and five examples verified in the shared-components harness and the real local Hub guest deep link. All four print editions pass with answer DOM physically absent from blanks. All six new SVGs have been checked for label clipping. The printed opening review and transverse-wave summary stay together on the first page.
