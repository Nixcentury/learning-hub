# 19.1 Sheet 1 — learning guide and QA

29 October 2026. Scope: the blackbody/Planck worksheet, contentId `physics-ipst-atomic-19-1-1-sheet`. The teacher selected this first worksheet and requested a guide with a clear teaching story and QA. No shared engine or other worksheet changed.

## Story and minimum route

| Stop | Story | Minimum worksheet work |
| --- | --- | --- |
| 1 | No visible glow does not mean no radiation: compare the infrared and visible photographs, then the glowing metal | Question 1 and the thermal-radiation definition |
| 2 | Read both axes, compare peaks, then notice that the rest of each continuous spectrum remains | Question 2 together; Question 3(a)–(b) and Question 4 |
| 3 | A cavity illustrates absorption; “blackbody” describes a property, then Planck supplies the discrete-exchange hypothesis | Blackbody properties, Question 5 and Planck’s hypothesis |
| 4 | At one fixed frequency, count whole model energy units before introducing E = nε | Activity 1, Question 6 and the total-energy relation |
| 5 | Change frequency and compare ε/f before writing ε = hf and E = nhf | First and last ratios in Activity 2, then Question 7 |
| 6 | Derive the eV conversion from W = qV and connect wavelength with frequency | Questions 8–9 and the wavelength review |
| 7 | Identify one-photon versus total energy, then follow λ → f → ε → n | Work through Example 1(a)–(b), then try Exercise 19.1 Q2(a)–(c) |

Each stop has a short bilingual summary, wording for discussion, action, real target buttons, a collapsed expected answer, a revisit link and follow-up choices. The exit check compares 400/800 nm light at equal total energy. Remaining questions are selected by need instead of automatically assigning every blank.

The two activities are explicitly simulated teaching data, not historical measurements or independent proof of quantization. The first activity’s 3.3 × 10⁻¹⁹ J unit belongs to that fixed-frequency case, not every frequency. The guide distinguishes ε from total E, fixed-frequency photon counts from energy per photon, the rounded activity constant from the calculation constant, and eV from V. It does not reintroduce the classical-comparison graph previously removed by the teacher. The flame photograph is treated only within its stated scenario, not as a temperature measurement or universal colour rule.

## Content QA

Read all nine sections and all 66 paired answers in the current TH/EN HTML. Recomputed both activity tables, worked Examples 1–3, Exercise 19.1 Q1–Q2 and all additional numerical/comparison questions. All retained calculations agree with the sheet’s constants h = 6.626 × 10⁻³⁴ J·s, c = 3.00 × 10⁸ m/s and 1 eV = 1.60 × 10⁻¹⁹ J, including intermediate-value and rounding conventions. The separate activity tables use rounded h = 6.6 × 10⁻³⁴ J·s as labelled.

Key checks: activity counts 2,1,3,2,4; activity ε/f = 6.6 × 10⁻³⁴ J·s throughout; peaks near 970/480 nm; Example 1 gives 4.31 × 10⁻¹⁹ J and 2.69 eV; Exercise 2 gives 4.62 × 10¹⁴ Hz, 3.06 × 10⁻¹⁹ J and 3.27 × 10¹⁵ photons; Question 13 gives 355 nm (UV); Question 14 gives 2.13 × 10⁻²⁰ J and 0.133 eV; Question 16 gives 6.00 × 10⁻³ J and 1.81 × 10¹⁶ photons.

Concepts were cross-checked with [OpenStax University Physics 3, 6.1](https://openstax.org/books/university-physics-volume-3/pages/6-1-blackbody-radiation). The existing IPST question allocation and sources in [SOURCES.md](../../public/content/physics/ipst/atomic-physics/assets/19-1-1/SOURCES.md) remain unchanged. This round did not reread the original student/teacher PDF files. No new Wien/Stefan equations are added as required student content.

Worksheet content is byte-for-byte identical to the base after removing only the new root guide/revision attributes and paired semantic anchors. No text, problem, answer, image, response key or writing-height preset was changed.

## Functional and print QA

- `pnpm build` passed content/guide validation, TypeScript, Vite and Pages artifact checks. Guide validation reports two worksheets and zero errors. 648 public files match source.
- Integrated full unit suite: 445 passed, 0 failed (including the 9 guide tests); `git diff --check` passed. No dependency or shared-code changes.
- Through the real Hub as Guest, clicked all 27 Thai target buttons and all 27 English target buttons. All 54 reached the intended active-language target within the viewport and left all source answers closed.
- Seven summaries render in both languages. Opening a guide answer and switching language preserves its state. Escape closes the guide.
- At viewport widths 375px and 768px, the drawer and toolbar fit without horizontal overflow. A graph jump closes the drawer and restores iframe interaction. These are viewport-fixture tests in cloud Chrome, not physical iPad/Safari tests.

| Language / print edition | Pages | Response slots | Answers | Images |
| --- | ---: | ---: | ---: | ---: |
| Thai / blank | 18 | 66 | 0 | 5 |
| Thai / answers | 18 | 66 | 66 | 5 |
| English / blank | 18 | 66 | 0 | 5 |
| English / answers | 18 | 66 | 66 | 5 |

All four previews have no guide/highlight stylesheet, MathJax errors or horizontal page overflow. No physical printer test was performed. The unchanged full worksheet remains available for detailed study.

Local ignored evidence: `qa-output/planck-guide/browser-results.json`, `planck-story-final.jpg`, `tests.log` and `build.log`. The HTTP preview’s crypto compatibility shim is isolated from the repository, as in the shared-guide QA.

Integrated with main `8bf1dc56009b5af0985d92afd6f78420ca30938d` after the shared video-player update. The guide still changes only its own three files; shared video code is retained from main. Full tests and production build were rerun for this combined version.

Post-integration browser checks repeated 12 representative jumps (six in each language, including both activities and the electrical-work review) and all four print editions, with the same correct targets and 18/66/5 print counts. Metrics: `qa-output/planck-guide/integrated-browser-results.json`.
