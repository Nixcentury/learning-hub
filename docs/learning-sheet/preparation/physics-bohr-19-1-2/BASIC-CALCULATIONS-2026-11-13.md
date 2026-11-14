# Bohr calculation practice · current revision 2026-11-14-1

Teacher scope: the existing Learning Sheet tool before **exit ticket revision**. A formula/variable reference box comes first, followed by easy mixed calculations. Keep the eight direct substitutions (two per original core formula), and add two explicitly defined hypothetical-atom excitation problems. There are now ten questions per language in a fixed mixed order.

- HTML: `public/content/physics/ipst/atomic-physics/19-1-2-basic-calculations-learning-sheet.html`
- contentId: `physics-ipst-atomic-19-1-2-basic-calculations`
- tool-key / route slug: `basic-calculations`
- guide: `guides/19-1-2-basic-calculations.guide.json`
- Menu: `public/content/bank/physics/b-d65860a41c400f77ee276a35.html`
- TH/EN are complete paired editions, with ten matching answer slots each.
- Central Learning Sheet owns reveal and blank/answer printing. Preserve the existing route and button placement.
- These are authored basic/model drills based on the Bohr lesson, not textbook/exam transcriptions. No new assets are needed.

## Question wording and solution typography

Question 1 describes the second energy level in ordinary Thai/English prose. Introduce n = 2 in the worked solution, then select the radius formula. Keep the prompt self-contained and preserve the original numerical task. The other nine question prompts are unchanged.

All ten solutions use MathJax display equations with `aligned`, consistent fractions/powers/upright units, aligned equals signs and boxed final answers. Keep short explanations outside the aligned blocks. Use compact scoped equation margins and allow enough answer height on screen and paper.

## Hypothetical atoms

Ground-state energy alone does not determine an arbitrary atom’s excited-state energies. Therefore each new problem explicitly **defines** its model as Eₙ = E₁/n²; the reference box repeats that this relationship is used only when given. Do not substitute the hydrogen value −13.6 eV for the hypothetical atom’s supplied E₁.

For upward excitation by one absorbed photon, find the initial/final energies, then Eγ = E_f − E_i > 0. To obtain frequency use f = Eγ/h with h = 4.14 × 10⁻¹⁵ eV s and Eγ in eV. To obtain wavelength use λ(nm) = 1240/Eγ(eV). Show the level energies, difference, formula, substitution with units, and rounded answer.

| Question | Type | Given | Result |
| --- | --- | --- | --- |
| 1 | Hydrogen radius | Second energy level (n = 2) | 2.12 × 10⁻¹⁰ m |
| 2 | Hydrogen energy | n = 4 | −0.850 eV |
| 3 | Photon energy | λ = 620 nm | 2.00 eV |
| 4 | Hypothetical X, excitation frequency | E₁ = −8.00 eV; n = 1 → 2 | E₂ = −2.00 eV; Eγ = 6.00 eV; f ≈ 1.45 × 10¹⁵ Hz |
| 5 | Hydrogen speed | n = 3 | 7.30 × 10⁵ m/s |
| 6 | Hydrogen energy | n = 2 | −3.40 eV |
| 7 | Hydrogen radius | n = 3 | 4.76 × 10⁻¹⁰ m |
| 8 | Hypothetical Y, excitation wavelength | E₁ = −16.0 eV; n = 2 → 4 | E₂ = −4.00 eV; E₄ = −1.00 eV; Eγ = 3.00 eV; λ ≈ 413 nm |
| 9 | Hydrogen speed | n = 2 | 1.10 × 10⁶ m/s |
| 10 | Photon energy | λ = 310 nm | 4.00 eV |

Hydrogen constants remain a₀ = 5.29 × 10⁻¹¹ m and v₁ = 2.19 × 10⁶ m/s. The photon shortcut takes nm and returns eV.

## Verification of revision 2026-11-14-1

- Strict HTML, ten paired slots, direct answer children, aligned display math and boxed results pass.
- Q1 uses prose and introduces n = 2 in its solution. The nine other question prompts compare unchanged.
- Guide schema, semantic targets and the final HTML fingerprint pass.
- All final-answer numerical values and scientific-notation exponents compare unchanged in both languages after normalizing unit markup.
- Chrome renders all 14 aligned solution blocks per language without math errors. Q1 prose and the n = 2 interpretation were visually inspected with its reveal open.
- At a 525 px workspace width, TH and EN have no horizontal overflow.
- All checked print snapshots retain 10 slots. Blanks contain zero answers; answer editions contain all ten and all 14 aligned blocks. No math errors or overflowing equations/tables were observed.

| Language | Print profile | Blank pages | Answer pages |
| --- | --- | --- | --- |
| TH | Standard | 6 | 6 |
| TH | Device margins | Not repeated | 8 |
| EN | Standard | 7 | 7 |
| EN | Device margins | 8 | 8 |

The additional vertical space in some print modes comes from the clearer multi-line equations and final-answer boxes. Page counts are actual central-print-preview observations, not physical-device or paper-print claims.

This is a content-only follow-up. The preview reuses the prior validated production runtime with the revised authored HTML/guide. The shared runtime, route identifiers and menu are unchanged. The full repository build and unrelated regression suites are not repeated. Native iPad/Safari and physical printing are not tested.
