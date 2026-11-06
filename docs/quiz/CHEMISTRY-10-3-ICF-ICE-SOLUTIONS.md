# Chemistry 10.3 — ICF, ICE and dimensional-analysis solutions

Revision: 6 November 2026. The teacher requested a consistent teaching method in both the existing learning sheet and its 60-question review quiz.

## Teaching sequence

1. Identify the species and quantity supplied. Convert the data to one table unit, **mol or mol/L**, using explicit unit factors.
2. Balance the reaction. In **I–C–F**, fill Initial, follow the balanced coefficients in **Change**, then read Final. The entire Change row is bold, including signs and factors of two.
3. A supplied post-ionization ion amount belongs to **F**. When initial solute is unknown, use a mol in I and −a, +a, +2a in C, then use the known ion in F to recover a.
4. When volume changes, complete the dissociation table in **mol** first. Adding only water preserves the strong-electrolyte ion amounts; divide those amounts by the final volume afterwards.
5. For a weak acid/base, use **I–C–E** in mol/L. Read E before substituting into Ka/Kb, selecting an approximation or calculating a percentage. When percentage is given, convert percentage/100 to the change before entering C.

The conversion notes show mL→L, molarity→moles, moles→molarity, mass↔moles and moles→particles→specified atoms as unit factors, with the cancelling and remaining units explained in both languages. Particle identity is explicit: atoms, molecules, ions or formula units; ionic compounds are counted in formula units. The optional atom-conversion method introduces no new quiz questions.

## Equilibria requiring care

- NaX/NaY first dissociate completely in ICF; X⁻/Y⁻ then enter the initial row of a separate weak-base ICE table.
- H₂SO₄ uses ICF for the complete first step and ICE for the second, including the H₃O⁺ already present in I.
- For two weak steps, a combined ICE table includes both extents a and b: the intermediate ion gains a−b and H₃O⁺ gains a+b. E describes the combined equilibrium, rather than labelling a first-step intermediate as the final overall equilibrium. These tables support the existing qualitative questions; solving coupled equilibria is not added.
- Pure-water ICE tracks the two ions and explicitly states that solvent water is omitted from the ion table.
- Questions asking only for Kw, a conjugate constant or a conceptual identity retain the relevant direct reasoning; an ionization table is used where it helps the requested calculation.

## Changed content

- Learning sheet: 42 existing answer areas per language receive the method or unit-factor notes. There are 16 ICF and 29 ICE tables per language.
- Review quiz: 49 existing solutions receive the method. There are 15 ICF and 36 ICE tables per language.
- All 81 learning-sheet slots per language, all 60 quiz questions, prompts, choices, answer keys, tolerances and source cases are preserved.
- The sheet revision and guide source hash are synchronized. The guide's relevant teaching steps now explain ICF/ICE and unit cancellation. The review traceability map records the new sheet hash and changed answer IDs.
- No shared engine, menu, source-image or archived IPST-original file changes are needed.

## Content and answer QA

- Read the edited solutions and confirm that given final ions are placed in F; mol and mol/L stay separate; percentages become dimensionless fractions; and weak equilibria use E.
- The emitted bilingual tables have identical species, values and units. There are **192 tables** across both files and languages. An independent arithmetic check verifies **578 cells** satisfy I + C = F/E, and checks every ICF Change sign and reaction coefficient.
- All 27 numerical quiz keys retain their previous values. Independent Decimal calculations still accept all **73** full-equation, approximate and rounded answer cases.
- Compare both edited HTML files to the baseline after removing solution bodies: all question text, choices, IDs, quantities and answer keys match. Only sheet answers and its revision differ; quiz changes are confined to solution blocks.
- The actual quiz content adapter accepts all 60 questions. Both language blocks retain their answer controls and reading links.
- MathJax conversion using the actual base/ams/mhchem packages passes for **255 distinct expressions**. The sheet has **367** expressions, within its renderer limit of 500; table values use readable HTML rather than adding unnecessary TeX expressions.
- Content/guide validation passes. QA is scoped to content, answers, units and their file contract; no browser, printing, device or unrelated system test is claimed for this change.
