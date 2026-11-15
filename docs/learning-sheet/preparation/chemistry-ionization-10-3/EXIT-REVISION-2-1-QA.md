# Chemistry 10.3 · Exit Ticket Revision 2.1

Replaces the existing menu target with the teacher's attached `Chem10_3_Exit_Revision_TH_EN_v2_0.html`, with expanded TH/EN calculation solutions following Classroom Note. Delivery is a pull request for the teacher to merge; no production branch update or deployment is part of this change.

## Source and scope

- Attached source SHA-256: `76636c6170e475f00fbea82cb57118ea914957302d02c8b65872371161ee7edd`.
- Method reference: [Classroom Note](../../../../public/content/chemistry/ipst/acid-base/10-3-basic-calculations-learning-sheet.html) and [lecture preparation](CLASSROOM-LECTURE-2026-11-13.md).
- Stable content ID: `chemistry-ipst-acid-base-10-3-exit-ticket-revision`; tool key and user route remain unchanged. The menu uses a versioned HTML filename so the replacement is not hidden by an old content cache.
- Preserve the source's three cloze articles, nine multipart problems (28 subparts), 22 supplied calculation answers, question Bank with distractors, Revision Notes and 18 Knowledge Recall prompts. The Bank removal requested for Chemistry 2.4 does not apply to this attached 10.3 document.
- 94 original student content units per language are verified unchanged by text/TeX signatures in [import manifest](exit-v2-1-import.json). The introduction adds the solution method; four reading examples and teacher calculation keys are expanded. No student questions or supplied numerical answers were rewritten.
- Original v1.9 file, Classroom Note, quiz, learning sheet, storage identities and scoring engine are unchanged.

## วิธีเขียนเฉลย / Solution authoring

ใช้สมการที่ดุลแล้ว → ICF สำหรับการแตกตัวที่ถือว่าสมบูรณ์ หรือ ICE สำหรับสมดุล → ความสัมพันธ์จากนิยาม → แทนค่าและตัดหน่วย → คำตอบพร้อมหน่วยและตรวจความเหมาะสมของค่าประมาณ ใช้หน่วยเดียวกันทุกช่องในตาราง

Start from a balanced equation, use ICF for essentially complete dissociation or ICE for equilibrium, write defining relations, substitute with explicit factor-label unit cancellation, and report units and an approximation check. Keep the same concentration unit throughout each table.

- Emphasize g→mol, mL→L, mmol→mol, volume factors in n=CV, balanced-equation species ratios, and cancellation of equal concentration units in percentage calculations.
- Derive weak-acid/base results from the ICE expression and substitute before taking a numerical square root. Do not begin a calculation by quoting a memorized square-root shortcut.
- Water-ion and conjugate-pair calculations use their defining relations; do not add an unnecessary ICE table. Show how the conjugate-pair expressions combine before substituting Ka/Kb/Kw values.
- Common concentration factors cancelled in a KaKb derivation are distinct from unit cancellation. Constants follow the school-level numerical concentration convention; do not invent or incorrectly cancel units of K.
- Preserve analytical acid amount during dilution; this does not imply that the number of undissociated weak-acid molecules is constant.
- Keep calculation workings out of the question Bank. The four reading examples remain available to students, as in the supplied file. Detailed problem keys are shown only in the answer edition.

The editable [solution model](exit-v2-1-solutions.json) contains 27 bilingual solution records, 122 steps, 20 ICF/ICE tables and 41 equations with cancellation per language.

## Independent numerical review

Recomputed from the question data using mole balances, equilibrium expressions and defining relations; values below are the intended rounded/approximate results, rather than an assertion that approximations are exact.

| Problem | Reviewed result |
| --- | --- |
| 2(a–d) | KOH 0.0200 mol, 0.0500 mol L⁻¹; Ba²⁺ 0.0125 and OH⁻ 0.0250 mol L⁻¹, 0.00375 mol OH⁻; diluted HNO₃ 0.0400 mol L⁻¹; mixed HCl 0.160 mol L⁻¹ |
| 3 | Equilibrium HA 0.0980 mol L⁻¹; Ka = 4.08163265×10⁻⁵, 2.00%; conjugate Kb = 2.45×10⁻¹⁰ |
| 4 | OH⁻ ≈ 9.0×10⁻⁴ mol L⁻¹, 1.0%; H₃O⁺ ≈ 1.1×10⁻¹¹ mol L⁻¹; conjugate Ka ≈ 1.1×10⁻⁹ |
| 5 | Failed trial: 0.00200 mol L⁻¹ and 10.0%; full equation positive root 0.001902498 mol L⁻¹; dilution pair ≈ 8.0×10⁻⁴/4.0×10⁻⁴ mol L⁻¹, 0.50%/1.0% |
| 6 | First-step approximation ≈ 9.4868×10⁻⁴ mol L⁻¹, 0.95%; second-step additional concentration ≈ 1.0×10⁻¹⁰ mol L⁻¹, negligible relative to the first |
| 7 | H₃O⁺ = 5.0×10⁻¹⁰ mol L⁻¹; neutral concentrations at given Kw each 2.0×10⁻⁷ mol L⁻¹; conjugate Kb values 1.0×10⁻¹⁰ and 1.0×10⁻⁸ |
| 8 | Product 0.00500 mol; HCl used 0.0100 mol; original HCl 0.200 mol L⁻¹ |
| 9 | Analytical acid 0.0450 mol L⁻¹; approximate H₃O⁺ 9.00×10⁻⁴ mol L⁻¹, 2.00%; HCl stock 2.25 mL from 0.00450 mol → 0.16425 g → 7.30 g per 100 mL |
| Reading guides | NaOH 0.0150 mol and 0.0500 mol L⁻¹; measured Ka ≈ 8.16×10⁻⁵; failed trial gives positive root ≈ 9.51×10⁻⁴ mol L⁻¹; acetate Kb ≈ 5.6×10⁻¹⁰ |

Supporting primary references: [OpenStax 1.6: dimensional analysis](https://openstax.org/books/chemistry-2e/pages/1-6-mathematical-treatment-of-measurement-results), [3.3: molarity](https://openstax.org/books/chemistry-2e/pages/3-3-molarity), [14.3: acid/base equilibria](https://openstax.org/books/chemistry-2e/pages/14-3-relative-strengths-of-acids-and-bases).

## Browser and print verification

Checked in Chromium through the actual Hub on the local preview, 16 November 2026 (Asia/Bangkok). Entered from the topic route as a guest, checked the menu, opened the replacement, switched languages and answer state, and exercised all 16 print combinations. Printing defaults to the student edition even when reading teacher answers.

| Language | Edition | Full set | Cloze/problems + Bank | Notes/Recall | Bank only |
| --- | --- | ---: | ---: | ---: | ---: |
| TH | Student | 25 | 15 | 11 | 2 |
| TH | Answers | 40 | 30 | 11 | 2 |
| EN | Student | 26 | 16 | 11 | 2 |
| EN | Answers | 41 | 31 | 11 | 2 |

All 16 previews loaded every equation image and had zero vertical or horizontal page-body overflow. Student copies contained no problem answer keys or teacher-only continuations; answer copies contained no writing spaces. Visual review confirmed the barium-hydroxide ICF table and crossed-out units remain readable. Expanded teacher workings account for the additional answer pages.

Equation SVGs are self-contained vectors with accessible TeX labels on their parent math elements. They are shared as 346 local image assets, reducing the HTML from roughly 30 MB with repeated inline equations to about 2.18 MB. All four fonts reuse the existing Classroom Note asset bytes. Runtime scripts and the attachment's standalone toolbar are removed; the Hub supplies language, answer and print controls.

Automated regression checks cover all print selections, preserved question/Bank signatures, supplied calculation answers, complete detailed solutions, valid equation/font assets, multiplication and cancellation glyphs, and control-character corruption. Existing v1.9 compatibility checks are retained. Validation commands: `node --test scripts/exit-ticket-revision.test.mjs scripts/bank-html-menu.test.mjs` and `pnpm build`.

Verification is limited to Chromium and the HTML print preview. No physical printer output, operating-system PDF export, Safari/iPad testing or production deployment is claimed.

## Continuation verification · 16 November 2026

- Recovered the staged work and matched the current Library source bytes to the attached-source SHA-256 above. The supplied Classroom Note v1.8.1 has SHA-256 `718c12b075b2a748d78fdfae51f21518c9791a7d690aa6ae7153d38b6e121fb5`.
- Independently recalculated 21 numerical checkpoints, including the failed-approximation positive root, measured Ka/Kb, diprotic first-step estimate and both A-Level problems; they agree with the documented rounded results.
- Reran the three focused route/import/vector-equation checks and all 11 bank-menu tests: all passed. Production build passed with zero content errors and verified all 1,298 public artifact files. The 33 draft warnings belong to existing unfinished content.
- Reopened the local Hub as a guest through Chemistry → Acids and bases → Ionization → Exit Ticket Revision. Confirmed revision 2.1, Thai/English switching, answer toggling, and no missing visible equation images. Visually inspected the barium-hydroxide ICF table and the crossed-out species/volume units.
- Rechecked the English full-set print preview: it defaults to Student edition (26 pages) while reading answers; selecting Teacher answers gives 41 pages with no missing equation images. The full 16-selection regression and earlier print matrix remain recorded above; native printer/PDF export and Safari/iPad were not tested.
- Delivery remains a PR only. The main branch and production deployment are not changed by this continuation.
