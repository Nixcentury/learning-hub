# Bohr 14-question revision · QA · 16 November 2026

## Scope and identity

- Branch: `content/bohr-14-self-check-20261116`
- Sheet revision: `2026-11-16-1`
- Bank: `physics/bank/b-d65860a41c400f77ee276a35`
- Content: `physics-ipst-atomic-19-1-2-basic-calculations`
- Existing route: `#physics/bank/b-d65860a41c400f77ee276a35/basic-calculations`
- Changed: the handout, its bilingual guide, the existing menu description, preparation notes and one focused print-contract regression test. No shared runtime or student data changes.

The teacher approved the existing 10 positions with Questions 6, 7, 9 and 10 changed from repeated substitution to inverse/ratio tasks; add Rydberg forward/inverse, hydrogen emission and ionization as Questions 11–14. The full task/answer mapping is in BASIC-CALCULATIONS-2026-11-13.md. All questions and worked solutions are paired TH/EN. Prompts describe physical quantities and levels in sentences, with variables introduced in the interpretation before equations.

## Numerical verification

Independently evaluated all 14 using the stated constants. Selected unrounded values:

| Question | Calculation result before final rounding |
| --- | --- |
| 1 | 2.116 × 10⁻¹⁰ m |
| 4 | 1.449275… × 10¹⁵ Hz |
| 6 | n = 2 |
| 7 | r₄/r₂ = 4 |
| 8 | 413.333… nm |
| 9 | n = 2 |
| 10 | 310 nm |
| 11 | 656.335460… nm |
| 12 | n = 4.002155… from approximately 486 nm; allowed level 4 |
| 13 | 12.088888… eV; 2.920021… × 10¹⁵ Hz |
| 14 | 3.40 eV |

Checked signs: bound-state electron energy is negative; photon and ionization energies are positive. Hydrogen Rydberg uses lower/upper levels, not initial/final labels; wavelength is in metres when using R_H in m⁻¹. The hypothetical atoms retain the explicitly given Eₙ = E₁/n² model and their original E₁, without applying the hydrogen Rydberg constant to them.

## Automated checks actually completed

- `pnpm test:unit`: **780 passed, 0 failed**.
- `node --test scripts/learning-sheet.test.mjs`: **8 passed, 0 failed** after the final text cleanup.
- `pnpm build`: **passed**, including content validation, guide identity/targets/fingerprint, TypeScript, Vite and Pages artifact validation (**1476 public files identical**). The 33 existing draft warnings concern other unfinished resources/templates. The existing shared CSS build warning remains unchanged.
- MathJax **3.2.2** TeX-to-SVG conversion: **250 formula occurrences, 107 unique expressions, 0 errors**. This verifies TeX compilation, not page layout.
- Retained Questions **1–5 and 8**: parsed HTML blocks compare exactly with pre-edit versions in both languages after removing the added short final-answer paragraph (**12 unchanged blocks**).
- New print-contract regression passes through the actual `buildHtmlPrintSnapshot`, language selection and `prepareLearningSheetPrint` modules for **TH/EN × blank/answers**. Each copy contains **14 question blocks and 14 short final answers**. Blank copies contain **0 detailed answer blocks and 14 writing areas**; answer copies contain **14 detailed answer blocks**. The other language is absent, Name/Class occurs once, and the original teaching DOM retains all 28 detailed answer blocks. Geometry is stubbed in this DOM test and is not evidence of pagination.
- `git diff --check`: passed.

## Print behavior and limits

Following the teacher-approved PR #201 behavior, short final answers are outside detailed answer slots and appear only in print/print-preview. Ordinary reading hides them; detailed solutions still use the existing reveal controls. The scoped print CSS sets Name/Class to 8 pt, body/reference text to 10 pt and headings to 11 pt. Writing-area presets are 28–58 mm, and the existing detailed solutions may expand those heights through the shared print system.

**Not visually verified in this environment:** actual Hub screen/reveal interaction, narrow-screen rendering, central A4 pagination/page count, exported PDF appearance, native iPad/Safari or physical printing. Local Chromium could not start because its Unix socket operation was denied inside the sandbox; the automatic approval policy rejected running outside that sandbox. A safer in-sandbox headless-shell fallback could not be installed because the browser download was invalid/truncated. No claim of browser, page-count or PDF verification is made.

Send as a PR for the teacher to review and merge. Do not merge or deploy automatically. After merge, the existing bank link remains the route above.
