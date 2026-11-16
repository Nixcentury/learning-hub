# Bohr calculation practice · current revision 2026-11-16-1

The teacher approved 14 questions: retain Questions 1–5 and 8, diversify the repeated skills in Questions 6, 7, 9 and 10, and add four hydrogen questions. Preserve the existing bank, contentId, route and shared runtime. The agreed scope excludes adding force/angular-momentum derivation drills or a separate K/U/E section to this set; this is a worksheet scope decision, not a claim that those topics are outside the official exam syllabus.

| Question | Current task | Final answer |
| --- | --- | --- |
| 1 | Hydrogen radius at level 2, retained | 2.12 × 10⁻¹⁰ m |
| 2 | Hydrogen total energy at level 4, retained | −0.850 eV |
| 3 | Photon energy from 620 nm, retained | 2.00 eV |
| 4 | Hypothetical X excitation frequency, retained | 1.45 × 10¹⁵ Hz |
| 5 | Hydrogen speed at level 3, retained | 7.30 × 10⁵ m/s |
| 6 | Rearrange energy formula from −3.40 eV | level 2 |
| 7 | Radius ratio: level 4 to level 2 | 4 times |
| 8 | Hypothetical Y excitation wavelength, retained | 413 nm |
| 9 | Rearrange speed formula from 1.095 × 10⁶ m/s | level 2 |
| 10 | Wavelength from a 4.00 eV photon | 310 nm |
| 11 | Hydrogen Rydberg wavelength, 3 → 2 | 656 nm |
| 12 | Rydberg inverse: approximately 486 nm, lower level 2 | initial level 4 |
| 13 | Direct hydrogen emission, 3 → 1: photon energy and frequency | 12.1 eV; 2.92 × 10¹⁵ Hz |
| 14 | Threshold ionization from level 2 | 3.40 eV |

The formula box now includes positive photon energy for emission/absorption, the hydrogen Rydberg equation with lower/upper level definitions, and threshold ionization. Use R_H = 1.097 × 10⁷ m⁻¹ and wavelength in metres. Q12 gives approximately 486 nm: the unrounded calculation produces n ≈ 4.002, consistent with allowed level 4 and rounded givens. Keep the hypothetical-atom energy model explicit and separate from the hydrogen Rydberg constant.

Every printed question has a short final answer between its prompt and writing area, in both blank and answer editions. This is the teacher-authorized exception to the usual no-answers-outside-slots rule, following PR #201. Short answers are hidden in ordinary screen reading. Detailed worked solutions remain the direct children of their semantic slots and are removed from blank print snapshots. All existing slot keys are retained to avoid breaking targets; their labels are updated to describe the new tasks without exposing the answer.

Print styling follows the current 8/10/11 pt rule: one Name/Class line beneath the first-page title, body and reference text 10 pt, headings 11 pt. The menu and bilingual guide are updated to 14 questions. Validation evidence and limitations are in [QA-14-QUESTIONS-2026-11-16.md](QA-14-QUESTIONS-2026-11-16.md).

Sources: the existing Bohr basic-calculation sheet and its main lesson; teacher-approved plan in this session; published interference self-check behavior from PR #201. These are authored practice questions, not transcriptions of official exam questions. No new textbook PDF was supplied or read in this change.

---

# Historical revision 2026-11-14-2

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

All ten questions must be ordinary Thai/English sentences, not variable-assignment stems. Describe energy levels using Arabic numerals: “ชั้นพลังงานที่ 1/2/3/4” and “energy level 1/2/3/4”, name the physical quantities and answer units, and retain the numerical givens. Numeric quantities and units may use inline MathJax. Introduce n, λ and E₁ only in each solution’s opening interpretation before the equations. Reveal labels follow the same prose rule.

For the two hypothetical atoms, state the supplied energy model in words: each level’s energy is the energy in level 1 divided by the square of its level number. This preserves the necessary model assumption without requiring the student to read a symbolic prompt.

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

## Verification of revision 2026-11-14-2

- All ten stems and labels in each language use prose instead of variable assignments. Each solution begins by interpreting the given quantities as variables.
- The energy model for each hypothetical atom remains explicit in words, with the same energies and transition levels.
- Every aligned-equation block and final-answer paragraph compares exactly unchanged against the previous MathJax revision, in both languages.
- Strict HTML, ten paired slots, direct answer children, guide schema/targets/fingerprint and revision pass.
- Chrome confirms all ten prompts in each language are complete prose with Arabic energy-level numbers and no symbolic assignment stems. The example “ชั้นพลังงานที่ 4” was visually inspected with its interpretation and MathJax solution.
- Both languages render all 14 aligned equation blocks with no math errors.
- Six focused print snapshots pass: TH/EN standard blank, and TH/EN device-margin blank/answers. Each retains all ten slots; blanks have zero answers and answer editions have all ten. No math errors or overflowing equations/tables were observed.
- Standard blank: TH 8 pages; EN 7 pages. Device-margin blank/answers: 8 pages in both languages. Standard answer editions were not repeated for this wording-only follow-up.
- The 525 px workspace view was inspected in both languages; the text wraps and the preserved MathJax fits the window.

This is a wording-only follow-up. The existing production runtime is reused for preview; shared runtime, route, menu and numerical tasks are unchanged. The full repository build and unrelated regression suites are not repeated. Native iPad/Safari and physical printing are not tested.
