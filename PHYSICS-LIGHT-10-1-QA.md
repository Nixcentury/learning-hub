# Physics 10.1 — Wave model of light

Authored 22 October 2026 for the existing Learning Sheet V1 system.

## Content and entry points

- Content ID: `physics-ipst-wave-optics-10-1-sheet`.
- Bank menu: `b-08c93bb5cd14a7bc7de0a8e0` (the existing Wave Model of Light topic).
- Hub entry: `#physics/bank/b-08c93bb5cd14a7bc7de0a8e0/learning-sheet`.
- Author file: `public/content/physics/ipst/wave-optics/10-1-wave-model-learning-sheet.html`.
- TH and EN are complete separate language blocks sharing 83 semantic answer IDs. Existing language, answer controls, MathJax and printing are reused.
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

## Focused wavelength-figure revision, 22 October 2026

- Only the short/long wavelength comparison in section 8 is revised, in both languages. The separate wavefront and angle panels are replaced with one integrated pair using the same aperture, wavelength ratio and screen geometry. Directions 1 and 2 share the slit-centre origin, and a larger theta arc marks the angle between them.
- The existing diagram slot, student drawing variant and conclusion slot are retained; all 76 paired answer IDs are unchanged. Sections 1–7 and 9–10, and the opening-width and edge comparisons, are byte-equivalent at the parsed section/slot level.
- Outgoing crests reuse the scalar angular-spectrum model. Screen intensities and first-minimum markers use the same far-field single-slit relation and angular coordinate in both cases. The caption explicitly distinguishes the near-field sketch and the distant screen, which is not to scale.
- Build/content validation passes. The shared-components browser harness verifies TH/EN, all images, equations, preserved answer state and 390px layout. All four A4 editions pass; blank copies contain no answer DOM. Updated figure pages were rendered and visually inspected. No engine or other teaching section is changed.


## Completed figures and structured written notes, 22 October 2026

- Integrated the constant-wavelength, variable-opening comparison into one coherent wide/narrow figure pair, using wavelengths 0.5 in both cases and aperture widths 2 and 1 model units. Incident crest spacing, display scale and screen distance are the same.
- Following the teacher’s clarification, both aperture and wavelength pairs are completed visual references in the student and answer editions. Students write observations and explanations rather than draw those wavefronts. The two former diagram answer slots are intentionally removed; written conclusion slots are retained.
- Removed cause-and-effect conclusions from the always-visible comparison captions. The meaning of greater angular spreading is now a note slot. Procedure and figure legends remain visible.
- Moved the refractive-index explanation and superposition principle into their existing answer slots, with more writing space. Converted the experimental pattern/phenomenon table and scientist/idea record into structured note fields. The repeated fixed experimental conclusion now appears in the existing reasoning answer. The electromagnetic overview remains a completed short review, as explicitly requested.
- There are now 82 paired TH/EN note slots: two drawing slots removed, eight written-note slots added. Sections 1–3, 5 and 6, all existing calculation problems, the shared engines and content ID are unchanged.
- Current validation: content/routes/build and unit checks; browser language/reveal state, all images/equations, 390px layout and real Hub deep link; four A4 editions with no answer DOM in blank copies. All four completed diffraction references remain in both print editions. Changed print pages are rendered for visual review.


## Section 1 summary note, 22 October 2026

The teacher requested writing space in the electromagnetic overview. Its completed summary is now the answer to one TH/EN note slot (`em-fields-summary`), with 28 mm minimum writing height. A short prompt asks students to relate E, B and propagation and identify the wave type. The fully labelled field diagram, stellar review and all other sections are retained. There are 83 paired note slots. Content/build, language/reveal controls and all four printed editions are checked; first-page layout is visually reviewed.
