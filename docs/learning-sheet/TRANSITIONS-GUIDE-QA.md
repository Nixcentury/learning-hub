# 19.1 Sheet 3 — print layout, learning guide and QA

29 October 2026. Scope: `physics-ipst-atomic-19-1-3-sheet`, Transitions and Spectra. The teacher requested the remaining 19.1 worksheet's print-layout update together with its learning guide, then clarified that completeness and working space take priority over further compression. No other worksheet, shared engine, dependency or response schema changed.

## Layout and completeness

The original Hub preview measures 14 A4 pages in both languages and both editions. The updated sheet uses the central A4 margins during the measuring pass, groups the three repeated Exercise 19.1 Q6(b) prompts into a shared table, and moves the original source/approximation note unchanged from the footer to the opening. The table retains three individually labelled transitions and separate working areas. The obsolete page-number suffix in the “Think about it” heading is removed; its stable response key remains unchanged.

Compared with base `528a560f3c166c5f150e0aaebf2da83707ddc04f`, all 22 paired response slots retain their order, complete attributes, TH/EN labels, writing-height presets and exact answer HTML. All six image tags, the hypothetical-atom inline SVG and every derivation are identical. No problem, subpart, answer, equation or illustration was removed. Font sizes were not reduced. The table inherits the original body type rather than the smaller default table type. Further compaction stopped after the teacher's clarification; there is no artificial padding to force a minimum page count.

## Story and minimum route

| Stop | Main connection | Worksheet work |
| --- | --- | --- |
| 1 | Signed atomic energy change versus positive photon energy; reverse the same level pair | Level diagram, Questions 1–3, photon-energy relation |
| 2 | One atom's path and photons versus many atoms' distinct spectral lines | Direct/cascade figure, Questions 4–6, energy-sum comparison |
| 3 | Shared lower level identifies a series; the gap produces the Rydberg equation | Spectral-line figure, Question 7, section 4 derivation and Question 8 |
| 4 | Move from one line to the longest wavelength and short-wavelength limit | Example 19.4(a)–(b), Question 9; revisit the 7 → 2 question if needed |
| 5 | Identify the atom and initial state before selecting a formula or path | Exercise 19.1 Q5, every Q6(b) table row, Question 10; reverse the calculation in Question 11 |
| 6 | Retain discrete energy levels while replacing definite orbits with probability | Section 7 figures and Questions 12–13; optional 2s/2p detail in the full sheet |

Each stop has a bilingual short summary, discussion wording, action, real worksheet target buttons, a collapsed expected answer, revisit targets and follow-up choices. The final check contrasts three possible lines across many atoms initially at n = 3 with two photons from one atom along 3 → 2 → 1. The guide is a route through the complete sheet, not a replacement worksheet.

## Content QA

Reviewed the current worksheet's explanations, problems and solutions against the guide. Recomputed the retained level gaps, wavelengths, Rydberg/Balmer expressions and inverse-level calculation:

- E₃ − E₂ ≈ 1.889 eV, E₃ − E₁ ≈ 12.089 eV, E₂ − E₁ = 10.200 eV; using the stated 1240 eV·nm shortcut gives approximately 656, 102.6 and 121.6 nm.
- Example 19.4 uses R_H = 1.0974 × 10⁷ m⁻¹: 4 → 2 gives 485.997 nm, 4.09 × 10⁻¹⁹ J and approximately 2.56 eV with the stated h/c/e constants. The sheet already explains why rounded level energies give 2.55 eV.
- The 7 → 2 line is approximately 396.9 nm. The guide explicitly ties its visibility comparison to the sheet's approximate 400–700 nm convention. The Balmer short-wavelength limit is approximately 364.5 nm.
- The hypothetical atom's −3 to −7 eV transition emits 4 eV; a hydrogen emission of about 2.55 eV ending at n = 2 starts at n = 4.
- The Rydberg coefficient A/(hc) = 2π²mk²e⁴/(h³c) and Balmer rearrangement λ = (4/R_H)n²/(n² − 4) are consistent with the preceding Bohr derivation. The guide keeps lower/upper labels separate from initial/final labels for absorption.

The existing source allocation is recorded in `PHYSICS-19-1-SHEETS-2-3-QA.md` and the worksheet's asset notes. This round did not reread the original student/teacher PDFs; no new claim of full textbook coverage is made. Probability is not presented as a literal fog, a trajectory, or certainty at the radial-probability peak. Optional wavefunction/2s/2p detail stays in the full worksheet.

## Functional and print QA

- Full existing unit suite: 445 passed, 0 failed. Production build passed guide/content validation, TypeScript, Vite and Pages artifact verification: three guides, zero guide errors, 649 identical public files. The existing 32 draft-content warnings remain. No new test or shared-code changes were needed.
- Compared the final raw worksheet SHA-256 with the guide's source hash and revision. Verified all paired response/answer/height/image/SVG/derivation invariants programmatically.
- In the real Hub as Guest, clicked all 23 English and all 23 Thai guide targets. All 46 targets were present and visible in the active language. Source answers remained closed after the jump checks. Six summaries rendered in both languages.
- At 375px, the guide is a drawer and the Q6(b) table stacks into three rows; its 314px content width equals its scroll width, including revealed solutions. At 768px, the guide is a drawer without horizontal overflow and the 637px table retains table rows without overflow. A jump closes the drawer and allows worksheet interaction. These are viewport-fixture checks in cloud Chrome, not physical tablet/Safari tests.

| Language / edition | Before | After | Slots | Answers | Images |
| --- | ---: | ---: | ---: | ---: | ---: |
| Thai / blank | 14 | 11 | 22 | 0 | 6 |
| Thai / answers | 14 | 11 | 22 | 22 | 6 |
| English / blank | 14 | 12 | 22 | 0 | 6 |
| English / answers | 14 | 12 | 22 | 22 | 6 |

All four real Hub print snapshots have zero MathJax errors and zero horizontal page overflow. Visually inspected every page of all four editions using contact views of the exact exported page HTML, plus the Thai Q6(b) answer table at full size. The English table continues across pages with repeated column headers and intact transition rows. The final pages contain the cloud-model work rather than a reference-only page. No physical printer test was performed.

Ignored local evidence: `qa-output/sheet3-print-guide/browser-checks.json`, `th-print-pages.json`, `en-print-pages.json`, `sheet3-guide-final.jpg`, `tests.log` and `build.log`. The managed HTTP preview's crypto compatibility shim and proof-view files are isolated from repository source.
