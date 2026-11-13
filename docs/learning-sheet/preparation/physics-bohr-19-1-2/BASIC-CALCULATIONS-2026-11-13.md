# Bohr direct-substitution practice · 13 November 2026

Teacher scope: a separate Learning Sheet tool before **exit ticket revision**. A formula/variable reference box comes first, followed by easy mixed calculations. Two questions per formula, eight questions total. Each question uses one direct substitution. Keep the fixed mixed order rather than sorting by topic.

- HTML: `public/content/physics/ipst/atomic-physics/19-1-2-basic-calculations-learning-sheet.html`
- contentId: `physics-ipst-atomic-19-1-2-basic-calculations`
- tool-key / route slug: `basic-calculations`
- guide: `guides/19-1-2-basic-calculations.guide.json`
- Menu: `public/content/bank/physics/b-d65860a41c400f77ee276a35.html`
- TH/EN are complete paired editions, with eight matching answer slots each.
- Answers use formula → substitute → answer with units. Central Learning Sheet owns reveal and blank/answer printing.
- These are newly authored basic drills using the existing Bohr lesson formulas, not textbook/exam transcriptions. There are no extra assets.

| Question | Formula | Given | Result |
| --- | --- | --- | --- |
| 1 | rₙ = n²a₀ | n = 2 | 2.12 × 10⁻¹⁰ m |
| 2 | Eₙ = −13.6/n² eV | n = 4 | −0.850 eV |
| 3 | Eγ = 1240/λ eV | λ = 620 nm | 2.00 eV |
| 4 | vₙ = v₁/n | n = 3 | 7.30 × 10⁵ m/s |
| 5 | Eₙ = −13.6/n² eV | n = 2 | −3.40 eV |
| 6 | rₙ = n²a₀ | n = 3 | 4.76 × 10⁻¹⁰ m |
| 7 | vₙ = v₁/n | n = 2 | 1.10 × 10⁶ m/s |
| 8 | Eγ = 1240/λ eV | λ = 310 nm | 4.00 eV |

Use a₀ = 5.29 × 10⁻¹¹ m and v₁ = 2.19 × 10⁶ m/s. The three orbital formulas apply to hydrogen. The photon shortcut takes nm and returns eV. Keep electron bound-state energies negative.

## Verification

- Independently recomputed all eight numerical answers with Decimal arithmetic, including the rounding of v₂.
- Full route-catalog audit locates the new content ID; existing menu links are retained and the new link is immediately before `exit-ticket-revision`.
- Focused DOM checks verify 8 matching TH/EN answer slots, 4 formula rows, 2 questions per formula, mixed order, and one direct answer child per slot.
- Activity-content validation passes (111 files, 0 errors, 33 existing draft warnings). After correcting the new guide metadata, `pnpm validate:guides` passes (9 sheets, 0 errors).
- `pnpm exec tsc --noEmit`, `pnpm exec vite build --config vite.config.js`, and `node scripts/verify-pages-build.mjs` pass. All 928 public files match the production output.
- Chrome Hub QA confirms the new menu button opens this exact sheet; answer reveal and the authored guide load correctly.
- Print preview is **4 pages in every checked combination**: TH/EN × blank/answers × standard/device margins. Each preview retains all 8 slots and the formula box; blanks contain no answers and answer editions contain all 8. No math errors or overflowing formulas/tables were observed.
- A 525 px workspace window stacks the formula rows and has no horizontal overflow in either language.
- No physical iPad/Safari or printer test was performed. Device-margin results refer to Chrome's central print preview.

Checks stayed focused on the new worksheet, its menu placement, and the existing authoring/build pipeline. No shared runtime, main Bohr worksheet, Quiz or Exit Ticket source was edited.
