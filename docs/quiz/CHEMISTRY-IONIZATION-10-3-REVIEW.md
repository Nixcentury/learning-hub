# Chemistry 10.3 — one open-book review quiz

The topic now offers one 60-question review set. Its **ทวนเนื้อหา / Review topic** button uses the same authored-sheet mechanism as Chemistry 10.1 and 10.2: it opens the existing combined 10.3 learning sheet alongside the quiz. Every question names an actual sheet section and a subsection, example or practice question. No separate reading-review document is introduced.

## Content and sequencing

| Questions | Purpose | Formats |
| --- | --- | --- |
| 1–15 | Mobile ions, strength versus concentration, strong electrolytes, ion ratios, moles, dilution and preparation mass | Short drag-fill passages, calculations, choices |
| 16–27 | Partial ionization, percentage, ICE, Ka, approximation versus the full quadratic, stepwise acids | Short drag-fill passages, calculations, choices |
| 28–33 | Weak bases, Kb and the original NH₃/NaX/methylamine cases | Passages and calculations |
| 34–43 | Activity 10.1, dilution trends, benzoic acid and reverse Ka, unequal-concentration comparison | Passages, calculations, one graph choice and explanatory choices |
| 44–49 | Water, neutrality, Kw and original conjugate-pair exercises | Passages and calculations |
| 50–60 | Newly authored applications using only methods already in the sheet | Calculations and five-option choices |

There are **20 drag-fill passages, 27 numerical questions and 13 five-option questions**. Passages have 3–4 shared bilingual gaps and at least two unused distractors. Identical answers use the engine’s established `repeat` setting with explicit bilingual reuse instructions; visually identical pieces never carry different answer IDs. `data-drag-read-confirm="true"` retains the existing check-and-reread step.

Numerical tolerances accept the relevant rounded book answers and, where approximation is permitted, full-equation answers. Students can enter scientific notation such as `1.4e-5`. All questions, hints, solutions, image captions and reading pointers have Thai and English content.

## IPST preservation

The source is the previously reviewed archive in `docs/learning-sheet/preparation/chemistry-ionization-10-3/`, checked against the supplied student book. `chemistry-10-3-review-map.json` maps all 39 archived source answer areas to the corresponding quiz questions and records each question’s existing sheet section and semantic answer-area key.

| Original source | Quiz questions | Treatment |
| --- | --- | --- |
| Example 2 | 8 | Original HBr data and output |
| Example 3(a–b) | 10–11 | Both original ion amounts and final concentrations; common scenario repeated for independent reading |
| Examples 4, 5, 6 | 18, 22, 30 | Original HF, CH₃COOH and NH₃ data and requested outputs |
| Exercise 10.3 Q1 | 14 | Original preparation mass |
| Exercise Q2–3 | 27, 21 | Original stepwise constants and equal-concentration/volume acid comparison |
| Exercise Q4 | 31 | Original NaX and Kb; corrected substitution from the earlier audit |
| Exercise Q5(a–b) | 32–33 | Both methylammonium concentration and percentage |
| Exercise Q6(a–c) | 39–41 | Both original benzoic concentrations, 0.25 and 0.40 mol/L, and comparison |
| Exercise Q7 | 42 | Original 0.80 mol/L, 0.42%; no premature rounding |
| Exercise Q8(a–b), Q9 | 47–49 | Conjugate identity and both original constant calculations |
| Seven understanding tasks / nine source areas | 4, 6, 9, 13, 24, 26, 43 | All original reasoning and outputs retained; HA/HB parts share one combined choice |
| Activity 10.1 part 1 | 34, 38 | All three original base concentrations/constants/results in a comparison table; repetitive calculations condensed |
| Activity 10.1 part 2 | 35–38 | Two representative calculations plus all four source concentrations/results, a numerical graph choice and both concluding relationships |

All five numbered examples (six answer parts) and all nine exercise questions (13 answer parts) are present. Activity condensation does **not** remove or condense any of those example/exercise outputs. Six preserved book crops are copied byte for byte into the public content assets; five graph choices are newly drawn with identical numerical axes and scales. The asset `SOURCES.md` records provenance.

## Scope and A-Level relevance

The user requested A-Level-informed applications without exceeding this learning sheet. Official [TCAS answer materials](https://www.mytcas.com/answers/) and the [2569 materials](https://www.mytcas.com/answers-t69/) informed the scope review. The applications here practise ion stoichiometry, dilution, weak-equilibrium calculation, reverse percentage/Ka, comparing concentration with percentage, neutrality with a supplied Kw and inverse conjugate strength. They are newly authored practice, not claimed reproductions of a named A-Level paper.

Numerical pH, pKa/logarithms, titration, buffers, common-ion effects and mixed-acid equilibria are excluded. The original qualitative pH-ordering task remains; no logarithms are required. A temperature task supplies its Kw explicitly. The original NaX weak-anion calculation uses the same equilibrium method already taught in section 8.

## Validation

- Real content adapter: 60 questions, no schema errors; bilingual prompts/hints/contexts/solutions; correct answers accepted and blank/wrong answers rejected for all formats.
- Independent 45-digit Decimal calculation: all 27 numerical items checked, including 73 full, approximate and rounded answer cases.
- Reading references: all 60 point to existing paired TH/EN answer-area keys in the stated sheet section. The production review-link configurator sets the established sheet ID and `data-html-pair=true`.
- MathJax 3 TeX/mhchem conversion: 109 distinct expressions, no conversion errors.
- All 11 local image targets exist; six source PNG copies match their archived bytes.
- Focused existing tests: 92 passed across drag, numerical input, authored-sheet review links, bank menus and learning sheets.
- `pnpm build`: content/guide validation, TypeScript, Vite build and Pages artifact verification pass. The existing 33 draft warnings concern other unfinished resources.
- The 10.3 learning-sheet SHA-256 remains `85ff339fda2c3258c68dd9db714067420d8cb213fbee9e007cfb01dcdf0e5452`.

The live 10.1 reference flow was inspected in a guest browser and its Review button opened the existing sheet in a second workspace pane. The new local Vite server could not be reached from the separate cloud browser, so this change does not claim a new end-to-end browser or physical-iPad check. No student records, authentication, classroom code or shared engine files are changed.
