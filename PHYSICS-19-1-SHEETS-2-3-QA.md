# Physics 19.1 — Sheets 2 and 3

> 29 October 2026: Sheet 2 is divided into two print parts of 13 and 12 A4 pages, preserving its approved learning content. The current verification is recorded under “Two print parts” at the end; earlier page counts refer to their stated revisions.

> Follow-up QA for PR47 (26 October 2026): wording, notation explanations and the NIST reference plot were revised after the original author verification below. The latest review is recorded at the end. The original exported PDFs belong to `af51cc67`; no new PDF export is claimed for the revised files.

26 October 2026. Implements the teacher’s confirmed three-sheet plan, completing Sheet 2 before authoring Sheet 3. The page cap is about 32–33 per edition, not a target. Explanations and the radius, energy and series derivations are printed; only the five key formula summaries across these two sheets and question/problem responses are left blank. Response areas have no writing lines or dot grids.

## Files and routing

- Sheet 2: `public/content/physics/ipst/atomic-physics/19-1-2-evidence-bohr-learning-sheet.html`, contentId `physics-ipst-atomic-19-1-2-sheet`, tool key `learning-sheet-2`.
- Sheet 3: `public/content/physics/ipst/atomic-physics/19-1-3-transitions-spectra-learning-sheet.html`, contentId `physics-ipst-atomic-19-1-3-sheet`, tool key `learning-sheet-3`.
- Both use the actual Bohr topic bankKey `b-d65860a41c400f77ee276a35`. The current configured bank client was called read-only and confirmed this key, topic title and zero-question topic. No hash was generated or guessed.
- Added its tools menu at `public/content/bank/physics/b-d65860a41c400f77ee276a35.html`.
- Assets and source notes are under `assets/19-1-2/` and `assets/19-1-3/`. Explanatory SVG originals and the NIST reference CSV are retained where available.
- No changes to the shared language, math, learning-sheet or print engines, student records or catalog service.

## Sources read

Read the teacher-supplied IPST Physics 6 page images: printed pp.59–80, PDF pp.72–93. Read relevant teacher-guide text including the activities, understanding questions and worked answers (printed pp.53–59 and 64–68). The previously prepared 15-image pack was read and reused with its provenance; an additional p.79 figure was cropped for the four n=2 spatial patterns. The original book PDF and teacher-guide PDF were already materialized in this workspace from the earlier work.

Original sources:

- Student book: https://drive.google.com/file/d/1claSYEw2Laz0zWRXjNcI9jhbt7A2sGMd/view
- Teacher guide: https://drive.google.com/file/d/1ODc-IWaYBIw3_nzMGC2RglTYlkrUwQdF/view
- Real hydrogen spectrum photo: Jan Homann (2009), CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Visible_spectrum_of_hydrogen.jpg . Attribution, source and license links are included in the sheet.
- NIST reference-line provenance and the distinction between data and explanatory plots are recorded with the assets.

## Source coverage

| Original item | Destination |
| --- | --- |
| Thomson, alpha scattering, Rutherford, pp.59–62 | Sheet 2 sections 1–3 |
| Magnet activity and its three paths, pp.60–61 | Sheet 2 section 2; separate responses for all three paths, plus analogy limitations |
| Activity 19.1, pp.63–64 | Sheet 2 section 4; setup, measurement procedure, grating geometry, recording area, six separate H/Ne calculations |
| Three questions after Activity 19.1 | Sheet 2 section 4, original question numbering retained |
| Continuous, line, absorption and emission spectra, pp.65–66 | Sheet 2 section 5, then energy interpretation in Sheet 3 section 1 |
| Bohr postulates, angular momentum, pp.66–68 | Sheet 2 section 6 |
| Radius and energy derivations, pp.69–71 | Sheet 2 sections 7–8 |
| Ground/excited states and ionization, p.72 | Sheet 2 section 9 |
| Understanding 19.1 Q1, Q2, Q3 | Sheet 2 sections 6, 2, 5 respectively, all three with separate answers |
| Exercise 19.1 Q3, Q4, Q6(a) | Sheet 2 sections 10, 9, 7 respectively |
| Direct/cascade transitions | Sheet 3 sections 2 and 6 |
| Rydberg, Balmer and five named series, pp.73–75 | Sheet 3 sections 3–5 |
| Example 19.4(a), (b), p.76 | Sheet 3 section 5, separate responses |
| Rounding observation and 7→2 question, p.77 | Sheet 3 section 5 |
| Exercise 19.1 Q5 | Sheet 3 section 6, newly drawn three-level diagram preserving −1, −3, −7 eV and the initial n=2 |
| Exercise 19.1 Q6(b) | Sheet 3 section 6, direct 3→1 and cascade 3→2→1, three separate calculations |
| Bohr limitations, probability and cloud model, pp.77–79 | Sheet 3 section 7, including p.79’s n=2 spatial patterns and a brief wavefunction explanation |

Examples 19.1–19.3, p.55’s question and Exercises 19.1 Q1–2 remain in Sheet 1. **The old audit incorrectly labelled Understanding Q1 as Planck.** The teacher guide’s full wording identifies the hydrogen quantum number. This work places the actual question in Sheet 2 and relabels the existing Planck question in Sheet 1 as a supplementary question in both languages. Its semantic key, content and answers remain unchanged; Sheet 1 PDFs have not been re-exported in this task. The old audit’s five-sheet allocation and 20-page cap are superseded by the confirmed three-sheet plan.

## Scientific decisions and checks

- Spectral lines motivate the model; they do not by themselves prove L=nℏ. Non-radiation is explicitly a postulate.
- Alpha scattering uses non-contact electric repulsion, and the magnet analogy’s limits are stated.
- The experiment’s sample readings are labelled as adapted teaching data, not newly measured student results. D=100 cm is made explicit to match the geometry; the teacher-guide text and example numerics use inconsistent D labels. Independent calculation gives H approximately 655, 492, 432 nm and Ne 655, 631, 603 nm.
- “Ordinary lamp” means an incandescent lamp in the activity, not all modern lamps.
- Absorption requires an occupied initial level. The Balmer absorption diagram is not described as direct ground-state absorption.
- The p.72 ground-state diagram’s erroneous n=0 label is replaced by n=1 in a newly drawn explanatory figure.
- Recalculation gives a₀≈5.291×10⁻¹¹ m, E₁≈−13.61 eV and v₁≈2.188×10⁶ m/s using the stated rounded constants. Q6(a) gives 4.76×10⁻¹⁰ m from a₀=5.29×10⁻¹¹ m, rather than copying a last-digit error in the printed solution.
- Photon energy is positive; atomic ΔE has the sign of absorption/emission. One-atom photon counts are separated from ensemble line counts.
- Example 19.4 uses the book’s R_H=1.0974×10⁷ m⁻¹: 4→2 gives 485.997 nm = 4.85997×10⁻⁷ m, not a mismatched exponent. Rounded Eₙ gives 2.55 eV, while the stated hc/R route gives about 2.56 eV; the rounding difference is explained.
- 7→2 gives approximately 396.9 nm; not every Balmer line is in the chapter’s approximate visible 400–700 nm range. Lyman and Paschen data are shown as labelled UV/IR plots rather than invented visible colours.
- The radial probability maximum is distinguished from pointwise probability density; cloud dots are not a literal electron fog or trajectory. The four n=2 spatial patterns are stated to exclude spin.

## Verification

| Check | Result |
| --- | --- |
| Production build including content validation | Pass; 0 errors, 32 pre-existing draft warnings, 546 public files verified |
| Route catalog | Pass; 30 HTML-menu contents; existing route structure retained |
| `pnpm test:unit` | 345 passed, 0 failed |
| `git diff --check` | Pass |
| Language/asset structural check | Sheet 2: 39 unique paired slots, 11 images per language. Sheet 3: 22 unique paired slots, 6 images plus Q5 inline SVG per language. Every slot has one direct answer child. |
| Built Hub browser checks | Both new content routes load, both languages, reveal controls, geometry preserved, 390 px iframe has no horizontal overflow, all figures load, no MathJax errors |
| Central A4 print | All eight editions generated from the existing Hub print dialog; no answer DOM in blank editions, opposite language removed, no measured page overflow |

| Sheet | Language | Student | Answers |
| --- | --- | ---: | ---: |
| 2 | TH | 20 | 20 |
| 2 | EN | 21 | 21 |
| 3 | TH | 14 | 14 |
| 3 | EN | 14 | 14 |

PDFs are A4 with embedded Thai font, no Unicode replacement characters and no empty pages. Rendered contact sheets and enlarged inspections cover the exported pages. Evidence is in `qa-output/physics19-sheet2/`, `qa-output/physics19-sheet3/` and `qa-output/sheets23-pdf-report.json` (not committed). Browser checks use Chromium headless with network Firebase stubs; no live student/account writes. Native iPad/Safari and a physical printer have not been tested.

This is a reviewable branch/PR and exported file delivery, not a claim of merge or live deployment.


## PR47 follow-up review — 26 October 2026

Reviewed the PR from `af51cc67e996d02c7568e99dc34b023e2aa716ad` in an isolated worktree. Rechecked the two complete TH/EN sheets, the supplied student-book page images (printed 59–80 / PDF 72–93), relevant teacher-guide answers, figure captions, exercise coverage and numerical results. The three-sheet allocation and printed derivations are preserved.

### Findings addressed

- Explain K (kinetic energy), U (electric potential energy), the quantum number n, h-bar, UV and IR before students need them. Use simpler Thai for allowed orbits, bound electrons, emission and the short-wavelength series limit.
- Replace the vague “Continuation” headings with Question 15(a), (b), (c), retaining separate writing areas and original semantic keys. Remove repeated subpart prefixes in Example 19.4 and a production-oriented paragraph about which formulas were left blank.
- Explain the electron cloud and the radial-probability graph in short paragraphs. Preserve the distinction between probability in equally thick spherical shells and probability density at a point; remove the unexplained `dr` from the student explanation.
- Correct the NIST source URL. The former link resolves to **Atomic Lifetimes**, not the quoted wavelength table. The replacement is [Strong Lines of Hydrogen](https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm). All 13 CSV entries were checked against that table, with the stated vacuum/air conventions. Where NIST lists components, one listed value is selected, rather than claiming an average. The SVG and PNG were regenerated from the same CSV values. Increase chart text and its displayed width to 175 mm, with separated labels for the close Balmer lines; equal line heights still do not represent intensity.

### Independent content and structural checks

- Recalculated the six activity wavelengths: about 655, 492, 432 nm (H) and 655, 631, 603 nm (Ne).
- Recalculated the radius/energy/speed constants from the stated physical constants, K/U/E at n = 2, radius at n = 3, and radius/energy/ionization/speed at n = 4. Rechecked Example 19.4, direct/cascade energy conservation and wavelengths, the 7→2 question, Balmer limit, Exercise 5 and the inverse transition question. The existing main results are correct within the stated rounding.
- Every original TeX expression is unchanged. Question order, semantic keys and writing-area heights are unchanged. Sheet 2 has 39 paired slots / 36 question containers per language; Sheet 3 has 22 paired slots / 20 question containers. Every question retains its own slot and every slot one direct answer child. Images remain 11 and 6 per language respectively, plus Sheet 3’s inline Exercise 5 diagram.
- Production build/content validation: **pass**, 0 errors, 32 existing draft warnings; **546** public files verified. `pnpm test:unit`: **345 passed**, 0 failed. `git diff --check`: **pass**. Built route catalog retains the actual Bohr bank placement and both content IDs.

### Revised browser and print verification

Used the built Hub in Chromium through the managed preview, in Guest mode. Both content routes load; TH/EN, individual reveal/hide and reveal/hide all work. Measured slot heights stay unchanged on reveal in both languages. All pictures load, with no MathJax errors. Print return preserves the open answers.

Also tested both full Hub instances in 390 px iframe fixtures (content viewport 371 px), in both languages with answers open. No document or table horizontal overflow. Sheet 2 has 11 long expressions per language in the shared, horizontally scrollable math wrappers; these remain readable by scrolling. This is a narrow iframe check, not native-device certification.

All eight central A4 previews were regenerated from the revised build:

| Sheet | Language | Edition | Pages | Slots | Answer elements | Images |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2 | TH | Student | 20 | 39 | 0 | 11 |
| 2 | TH | Answers | 20 | 39 | 39 | 11 |
| 2 | EN | Student | 21 | 39 | 0 | 11 |
| 2 | EN | Answers | 21 | 39 | 39 | 11 |
| 3 | TH | Student | 14 | 22 | 0 | 6 |
| 3 | TH | Answers | 14 | 22 | 22 | 6 |
| 3 | EN | Student | 14 | 22 | 0 | 6 |
| 3 | EN | Answers | 14 | 22 | 22 | 6 |

No opposite-language content, broken images, math errors, missing slots or measured page-body overflow. Checked full-page contact views of all 138 preview pages across the eight editions, then enlarged selected radius/energy derivations, Example 19.4, the new NIST chart and probability figures. The question and its writing area stay together. The final NIST image reserves its actual 2242 × 1710 dimensions before loading.

Review evidence is under ignored `qa-output/pr47-review/`: build/unit logs, `structure.json`, `numerical.json`, browser/individual/narrow reports, `print-report.json`, complete print HTML copies, 20 contact screenshots and five enlarged page views. Long screenshot capture was unavailable; compact contact views and individual page views were used instead. The brief preview connection interruption did not lose the source changes or recorded results.

**Verification boundary:** this follow-up checked the revised central previews and rendered browser page copies. It did not re-export PDFs, test native iPad/Safari or use a physical printer. The original author’s PDF checks above apply to the pre-review files. No merge or live publication is part of this review.

## Teacher-led revision of Sheet 2 — 27 October 2026

This revision implements the teacher’s ten review points and subsequently approved four-step radius derivation. It is based on main `21c2fec2a0edd9778e7f55066494d2c4c180af7e` (PR48 merged), on `codex/physics-19-1-sheet2-review-20261027`. Only Sheet 2, its four new explanatory SVGs, this review note and its asset-source README change. Sheets 1 and 3, routing, shared engines and student data are untouched.

### Teaching changes and source mapping

| Review item | Implemented behavior |
| --- | --- |
| 1. Thomson | A short introduction and a separate `thomson-summary` writing area covering the study, electron finding and atomic model. |
| 2. Classical-collapse digression | Removed the long collapse explanation and `classical-acceleration` question. A short bridge leads into spectra; the retained spectrum-purpose answer now focuses on photon energies. |
| 3. Before Activity 19.1 | Short diffraction/interference notes, a new grating diagram and an angle-reading question. Theta is measured from the normal. |
| 4. Evidence before Activity Q1 | A new lamp/gas-tube comparison and the retained original book spectra/explanation appear before the comparison questions. The complete original spectra image remains. |
| 5. Activity Q3 | Six wavelength-summary cells collect the already-calculated H/Ne results before the hydrogen question. The question follows the source’s wavelength request, with the unrequested reference-value digression removed. |
| 6. Emission/absorption | Simpler observing-arrangement diagram, separate writing areas and a same-energy-gap diagram beside the existing question. Absorption requires suitable initial states; no ground-state Balmer absorption claim is made. |
| 7. Former Question 8 | Removed only `postulate-not-proof`; the Bohr postulate itself remains explicit. The angular-momentum condition uses h/(2π), with positive-integer examples, before any derivation. |
| 8. K/U/E | Definitions and the zero-potential convention precede two illustrative tables: add K+U, then compare ratios. Three separate inference responses lead into the side-by-side K/U comparison and the U = −2K → E = −K → K = −E, U = 2E derivation. An actual n=1 hydrogen example precedes the n=2 E/K/U/sum problem, now split into four writing areas on one print page. The hydrogen level table stays complete on one page. |
| 9. Higher levels | A writing area explains increasing n, increasing energy/less-negative E, and the distinction between an excited bound state and ionization. |
| 10. Speed | General derivation from mvr = nh/(2π) and r_n = a0 n² appears before the numerical example. The n/n² cancellation and constant substitution are shown, followed by a speed table and comparison question. Existing official exercises remain. |
| Approved radius proof | Four numbered steps: centripetal-force equation; solve Bohr’s condition for v; substitute and multiply by r²; solve for r_n and identify a0. All steps use h/(2π) directly and match in TH/EN. |

The source apparatus/procedure and end-of-activity questions were checked in the supplied student book printed pp.63–64 (PDF pp.76–77), and teacher-guide pp.56–59 were read for sample data, answers and the derivation sequence. Teacher-guide Understanding 19.1 Q1 explicitly concerns the hydrogen quantum number; that existing Sheet 2 question remains. Original source figures and later exercises are retained. Asset provenance and the illustrative nature of all new diagrams/tables are recorded in `assets/19-1-2/README.md`.

Both languages now contain **71 paired semantic slots, 14 images, ten sections and 16 ordinary numbered question groups**, with the final group retaining three labelled parts. All official activity/understanding/exercise labels remain identifiable. The only removed keys are `classical-acceleration` and `postulate-not-proof`. Thirty-four paired keys are added. Five retained slots have revised answers/labels: `spectrum-purpose`, `activity-question-3`, `formula-angular`, `energy-sign` (now n=2 part (a), total E) and `ipst-exercise-3`. Other retained slot contents remain unchanged. The ordinary-question mapping is recorded in local QA evidence.

### Verification completed for this revision

- Independent numerical checks verify the circular-force equation at n=1–4, the radius expression, and K+U=E, K=−E and U=2E. The stated constants give a0 ≈ 5.291×10⁻¹¹ m and v1 ≈ 2.188×10⁶ m/s, supporting the classroom constants 5.29×10⁻¹¹ m and 2.19×10⁶ m/s. Speed-table solutions consistently use the displayed rounded speed constant. The activity wavelengths recalculate to 654.806, 491.876, 431.685, 654.806, 631.286 and 603.422 nm, supporting the worksheet’s whole-nm results.
- Structure checks pass: unique keys, identical bilingual key order, one direct answer per slot, no nested slots, matching displayed derivation TeX, continuous ordinary numbering, all image files present and no authored scripts/forms/iframes/buttons.
- Final `pnpm build` passes: **0 content errors, 32 pre-existing draft warnings**, TypeScript/Vite and **551 public files** verified against the build output. `pnpm validate:routes` and `git diff --check` pass.
- `pnpm test:unit`: **345 passed, 0 failed**. Later edits concern local wording/print grouping and were rebuilt and checked in the browser; no shared engine or dependency inputs changed.
- Actual production Hub guest-mode checks pass for the direct content route and the existing bank tool route. All 14 images load, MathJax has no errors, individual reveal works, all 71 answers reveal/hide, and reveal state follows TH/EN. Revealing answers preserves all measured slot heights.
- Both languages pass the 390 px Hub iframe fixture with all 71 answers revealed: inner document width and scroll width both **357 px**, images loaded, no MathJax errors. This is a content-in-Hub fixture check, not a native iPad/Safari claim.
- Final central A4 preview results:

| Edition | Pages | Slots | Answer DOM | Images | Page-body overflow / MathJax errors |
| --- | ---: | ---: | ---: | ---: | --- |
| TH blank | 28 | 71 | 0 | 14 | 0 / 0 |
| TH answers | 28 | 71 | 71 | 14 | 0 / 0 |
| EN blank | 28 | 71 | 0 | 14 | 0 / 0 |
| EN answers | 28 | 71 | 71 | 14 | 0 / 0 |

All 112 preview pages were visually reviewed using sixteen contact sheets, with enlarged checks of new diagrams, radius steps, both energy tables, K/U/E comparison proof and speed derivation in both languages. Local grouping was refined and the affected pages rechecked: the complete five-level hydrogen table is on p.22 and all four n=2 energy subparts are on p.23 in every edition. Blank copies remove answer DOM and retain only the selected language. Four complete preview HTML exports were independently parsed to verify counts and grouping.

Local evidence: `qa-output/sheet2-review/` (ignored), including `structure.json`, `numerical.json`, `question-mapping.json`, `browser-report.json`, `narrow-report.json`, `print-report.json`, four preview HTML exports, contact sheets and enlarged screenshots. The source PDFs remain outside the repository.

Limits: no new native PDF export, physical-printer output, native Safari/iPad/Apple Pencil test or account/cloud write was performed. Previous PDF claims in this document concern the earlier commits stated there. This revision is prepared for PR review, not a claim of a merged or deployed Pages release.


## Two print parts — 29 October 2026

Based on main `b4d24f924b0bf0b9f65a744ca004a400fdf10b40`, after the teacher explicitly requested merging PR #49. That merge completed and its Learning Hub Pages run `40830040894` succeeded. The print-parts update below is a separate reviewable change.

### Scope and preservation

- The existing Sheet 2 file/content ID/tool key now opens Part 1, “Atomic evidence and spectra”, covering sections 1–5. A new `19-1-2b-bohr-radius-energy-learning-sheet.html`, content ID `physics-ipst-atomic-19-1-2b-sheet`, tool key `learning-sheet-2b`, opens Part 2, “Orbits and energy in Bohr’s model”, covering sections 6–10.
- The tools menu belongs to the teacher-supplied bank key `b-d65860a41c400f77ee276a35`. A fresh read-only call through the repository’s configured bank client confirmed this Bohr topic among 221 Physics sets. Both new part cards were opened from the actual built Hub menu; the existing Sheet 3 card remained visible.
- All 71 paired response keys, their order across the two parts, and every writing-height preset are retained. Part 1 has 32 areas, 22 question containers and 10 figures per language; Part 2 has 39 areas, 15 question containers and four figures. General question numbers continue between parts.
- An independent comparison with the merged PR #49 source verifies every answer, every numerical substitution, all 14 images in order and all 34 explanatory paragraphs outside question/answer/header/footer containers. The six long wavelength substitutions are wrapped as two math expressions without changing their content. Formula derivations, both K/U/E tables, worked examples and all original IPST question coverage are retained.
- The three magnet-path responses and six wavelength calculations use comparison/work tables. Four n=2 energy subparts form a two-by-two table, each with its original writing area. Three n=4 subparts share an initial-state statement and a three-row table. Tables stack for narrow-screen reading while retaining their paper columns during print measurement.
- Only authored layout changes: remove this worksheet wrapper’s duplicated inset during central print measurement, remove extra margins inside exercise tables, and move the original learning roadmap plus a short bibliography to Part 2’s opening. This avoids a nearly empty final page. Body font size, figures, original writing heights, shared engines and global print margins are unchanged.
- Sheet 1, Sheet 3, other lessons, student data, dependencies and shared engines are unchanged. The existing Sheet 3 menu anchor is identical to main. Full source/figure credits and original question allocation remain in the asset README; this update does not claim a new reading of the textbook PDFs.

### Checks

- `pnpm test:unit`: 421 passed, 0 failed. No tests mirroring static layout implementation were added.
- `pnpm validate:routes`: pass; 40 HTML-menu contents, including both Sheet 2 parts. Original Sheet 2 identity is retained.
- `pnpm build`: pass, including content validation, TypeScript, Vite and Pages verification; 636 public files match their sources. The final two HTML files were also compared byte-for-byte with the built copies.
- `git diff --check`: pass. Contract audit finds one direct answer per slot, no nested response areas, no scripts/handlers and exactly matching TH/EN keys.
- Independently recalculated the six activity wavelengths (655, 492, 432, 655, 631, 603 nm), the n=2 K/U/E values (+3.40/−6.80/−3.40 eV), and n=4 radius, energy, minimum ionization energy and speed. These agree with the retained solutions.

### Browser and print verification

Used Chromium through the managed preview, with the current built Hub in Guest mode, the actual Bohr topic menu, and a separate fixture using the unmodified shared Learning Sheet, math and print modules.

The HTTP-only preview lacks secure-context randomUUID/SubtleCrypto. Its local copies of the main/Physics pages received UUID compatibility and 22 exact SHA-256 chapter digests precomputed from the unmodified live catalog; unknown digest inputs still throw. These preview-only changes are absent from the submitted repository tree. No Google sign-in, scores or Cloud/student writes were exercised.

- Both parts open from the actual topic menu. TH/EN, individual reveal, reveal-all/hide-all and mirrored language state work; all formulas and images load. A same-language reveal retained the measured 134.578125 px area height. Returning from print retained all 39 revealed Part 2 areas (78 mirrored language elements).
- Both parts and both languages were checked in a 390 px iframe, with an actual 375 px content viewport. Scroll width equals client width, images are complete, all 32/39 areas remain, all answers reveal, and there are no math errors. The four energy subparts stack on the narrow screen. This is an iframe/Chromium check, not native iPad/Safari.
- The current original Sheet 2 was also printed through the same central engine for comparison: 28 A4 pages in each language. The new pair totals 25 pages, a reduction of three pages, while each independently printable part meets the requested 12–20 page range.

| Part | Language | Blank pages | Answer pages | Areas | Images |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | TH | 13 | 13 | 32 | 10 |
| 1 | EN | 13 | 13 | 32 | 10 |
| 2 | TH | 12 | 12 | 39 | 4 |
| 2 | EN | 12 | 12 | 39 | 4 |

All eight final central previews have no measured page-body overflow or math errors. Blank editions contain zero answer elements; answer editions contain exactly 32/39, and only the chosen language is present. All 100 preview pages were inspected in 16 contact views, with enlarged inspection of the changed layouts. The four n=2 subparts remain on one page. Table continuations retain their headers and split between rows. The final Part 2 preview from the actual Hub also reports 12 pages/39 areas/zero blank-edition answer elements. The device-margins profile was rebuilt for Part 2 Thai in the actual Hub: 13 pages, no overflow.

Evidence is under ignored `qa-output/physics19-packs/`: build/unit/routes logs, independent content/numerical audit, live catalog snapshot, full per-page preview HTML, final print/responsive/Hub reports, 16 contact screenshots and `print-proof.jpg`. Per-page serialization was length-checked to avoid silently truncated HTML captures.

**Boundary:** central previews and the device-margins profile were tested; native PDF export, native iPad/Safari and a physical printer were not. PR #49 is merged; the separate print-parts change is submitted for review and is not claimed as publicly deployed.
