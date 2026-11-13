# Bohr calculation practice · current revision 2026-11-13-2

Teacher scope: the existing Learning Sheet tool before **exit ticket revision**. A formula/variable reference box comes first, followed by easy mixed calculations. Keep the eight direct substitutions (two per original core formula), and add two explicitly defined hypothetical-atom excitation problems. There are now ten questions per language in a fixed mixed order.

- HTML: `public/content/physics/ipst/atomic-physics/19-1-2-basic-calculations-learning-sheet.html`
- contentId: `physics-ipst-atomic-19-1-2-basic-calculations`
- tool-key / route slug: `basic-calculations`
- guide: `guides/19-1-2-basic-calculations.guide.json`
- Menu: `public/content/bank/physics/b-d65860a41c400f77ee276a35.html`
- TH/EN are complete paired editions, with ten matching answer slots each.
- Central Learning Sheet owns reveal and blank/answer printing. Preserve the existing route and button placement.
- These are authored basic/model drills based on the Bohr lesson, not textbook/exam transcriptions. No new assets are needed.

## Hypothetical atoms

Ground-state energy alone does not determine an arbitrary atom’s excited-state energies. Therefore each new problem explicitly **defines** its model as Eₙ = E₁/n²; the reference box repeats that this relationship is used only when given. Do not substitute the hydrogen value −13.6 eV for the hypothetical atom’s supplied E₁.

For upward excitation by one absorbed photon, find the initial/final energies, then Eγ = E_f − E_i > 0. To obtain frequency use f = Eγ/h with h = 4.14 × 10⁻¹⁵ eV s and Eγ in eV. To obtain wavelength use λ(nm) = 1240/Eγ(eV). Show the level energies, difference, formula, substitution with units, and rounded answer.

| Question | Type | Given | Result |
| --- | --- | --- | --- |
| 1 | Hydrogen radius | n = 2 | 2.12 × 10⁻¹⁰ m |
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

## Verification of revision 2

- Independently recalculated both new problems with Decimal arithmetic, including signs, energy differences, units and rounding.
- Confirmed the eight pre-existing answer blocks are unchanged in both languages.
- Focused checks pass: strict HTML metadata parsing, sequential 1–10 numbering, ten paired slot keys, one direct answer child per slot, explicit model in both new prompts, guide schema/targets/fingerprint, and menu order immediately before Exit Ticket.
- Chrome Hub opens revision 2026-11-13-2. Both new answers reveal correctly; the guide loads all three authored stages with the new question numbers and formulas.
- Central print preview is **6 pages** in every checked combination: TH/EN × blank/answers × standard/device margins. All ten slots remain; blank editions contain zero answers and answer editions contain all ten. There are no MathJax errors or overflowing formulas/tables.
- The new reference formulas and worked solutions fit a 525 px workspace window in both languages without horizontal overflow.

This is a content-only follow-up. The preview reuses the prior validated production runtime with the three revised authored content files copied in. The shared runtime and route identifiers are unchanged. The full repository build and unrelated regression suites are not repeated for these two questions. Native iPad/Safari and physical printing are not tested.
