# Chemistry 10.3 · Classroom Lecture

Replace the basic-calculation handout with a guided classroom lecture at the same content ID, file path and `basic-calculations` route. Rename its menu button to **Classroom Lecture · 10.3**, retaining its position between the main sheet and the review quiz.

## Teaching design

- 30 paired TH/EN note headings, three teacher-led calculation examples and the existing 12 mixed independent exercises: 45 semantic answer slots per language.
- Eight sections cover electrolytes; strong/weak acids and bases; equations, amounts and ICF/ICE; weak equilibria and constants; percentages and dilution; polyprotic acids; water; and conjugate constants.
- Students fill direct lecture starters such as “กรดแก่ คือ” and “กรดแก่ที่ใช้ในบทเรียนนี้ ได้แก่”. These same headings provide the intended Knowledge Recall basis for later Exit Tickets. There is no duplicate Recall worksheet block and no new Exit Ticket tool.
- Each student calculation area is unruled and contains no supplied table, including no empty grid. Students draw ICF or ICE themselves. Q4 and Q11 now provide the initial concentration and measured equilibrium ion concentration in prose.
- Solutions proceed from balanced equation to ICF/ICE, then equilibrium expression, substitution, rearrangement and units. Strong complete dissociation uses F; weak equilibria use E. Water-ion and conjugate-constant questions use their defining relations without unnecessary tables.
- The weak-ion square-root result follows ICE and a justified denominator approximation, rather than appearing as the starting shortcut. Both approximation exercises also check the ionized fraction.
- The complete derivation of KₐKᵦ = K𝓌 is preprinted outside answer slots, including both reactions, both constant expressions, multiplication, cancellation explanation and the resulting water reaction. Students write only the final relation. The same-conjugate-pair and same-temperature conditions are preprinted.
- The compact reference retains defining expressions, rather than a list of rearranged shortcuts. Blank and answer editions preserve adequate writing geometry using the existing shared print engine.

## Content QA

Aligned with the existing combined 10.3 lesson. Independently checked general principles against [OpenStax Chemistry 2e, section 14.3](https://openstax.org/books/chemistry-2e/pages/14-3-relative-strengths-of-acids-and-bases) and the H₂SO₄ caveat against [IPST SciMath acid–base equilibrium](https://www.scimath.org/lesson-chemistry/item/7153-2017-06-04-13-31-42).

Important qualifications remain explicit: strong acid lists are scoped to this lesson; H₂SO₄ is complete only in its first step; dissolved strong-base dissociation is distinct from solubility; NaCl is a strong electrolyte without being a strong acid; strength differs from concentration; conductivity comparisons require controlled conditions; neutral means equal hydronium and hydroxide concentrations, not a temperature-independent numerical concentration.

The calculation assumptions remain aqueous solutions at 25 °C, concentrations in mol/L, negligible water contribution to the stated solute calculations, and no added product ions initially. Hypothetical weak solutes transfer one proton. C₀/K > 1000 is explicitly the approximation criterion adopted by the existing lesson, not an unconditional universal rule.

All 12 independent numerical answers retain the values in the original [basic-calculation QA record](BASIC-CALCULATIONS-2026-11-13.md), recomputed with Decimal arithmetic. Teacher examples give:

| Example | Result |
| --- | --- |
| 0.40 g NaOH in 250 mL; M = 40 g/mol | [OH⁻] = 0.040 mol/L |
| Hypothetical HA: C₀ = 0.20 mol/L; Kₐ = 2.0×10⁻⁵ | [H₃O⁺] ≈ 0.0020 mol/L; ionization ≈ 1.0% |
| Hypothetical B: C₀ = 0.10 mol/L; equilibrium [OH⁻] = 0.0020 mol/L | Kᵦ ≈ 4.1×10⁻⁵ |

## Focused verification

- Learning Sheet model and guide schema/targets pass for all 45 matching TH/EN semantic slots. Guide revision and SHA-256 are updated with the source.
- Shared Learning Sheet unit checks: 5 passed.
- Browser preview used the existing unmodified Learning Sheet, MathJax and print modules in a scripts-disabled content iframe. Both languages render without math errors; reveal/hide works.
- All four standard A4 combinations (TH/EN × blank/answers) contain **12 pages** and all 45 slots. Each blank copy has 45 writing areas, zero answer elements and zero solution tables, while retaining the full printed proof. Each answer copy has 45 answers and 11 ICF/ICE tables.
- Both answer-language previews have zero formula overflow and zero page-body overflow. Blank previews also have zero page-body overflow. The first page and writing layout were visually inspected.
- Existing main sheet, review quiz, shared engines, scoring, data and dependencies are unchanged. Build/publication results are recorded in the PR. Physical printing and native iPad/Safari were not retested.
