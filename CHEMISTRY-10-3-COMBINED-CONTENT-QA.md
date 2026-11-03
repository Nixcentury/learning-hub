# Chemistry 10.3 — content correctness QA

3 November 2026. Base: main `debb5fed7db2247d5910c62e271edfd60d9bf4b8`. Scope: one combined learning sheet, reserved original IPST problems/images, revised parallel-skill problems and its bilingual guide.

## User's final acceptance criteria

No page cap; the user does not print this sheet. Restore the initial full combined content and audit scientific correctness. Pagination, print-layout optimization and device/browser QA are not acceptance criteria for this revision. No final-version printing or native-device result is claimed here.

## Content preserved

- All 26 original knowledge explanations survive with their full text, equations, assumptions and tables in both languages. A source-to-new-key map is stored with the preparation files; text equality was checked for all 52 language-specific explanations.
- All 33 authored scaffold questions survive in both languages. Context/data were revised where they referenced moved source tasks. The 66 records identify original/current prompts and current question labels.
- Original worked examples 2–6, Exercise 10.3 Q1–9, all seven understanding items and the complete Activity 10.1 remain reserved. All 78 language-specific archived fragments were compared against the preserved original three HTML files.
- The three original sheets and their six SVG assets are unchanged. Six textbook figure/table crops and a page/coordinate/hash map are also reserved for later Quiz construction.
- The combined sheet has 11 content sections, 26 headed knowledge areas, 46 consecutively numbered question areas and 9 worked-example areas per language: 81 paired answer areas. The seven main examples include two multipart examples with separate answer areas.

## Scientific checks

- Read the supplied student section on printed pp.14–30 / PDF pp.24–40, including all five numbered examples and nine Exercise questions; compared the matching teacher-guide explanations and solutions. Original printed/PDF page distinctions and known source corrections remain documented in the original `assets/10-3/SOURCES.md`.
- Recalculated 34 numerical results/checks independently: mole/volume/mass and ion ratios, dilution, percentages, weak-equilibrium approximations/full roots, reverse Kₐ, conjugate constants, graph points and verification of qualitative pH order. Calculation evidence is in `docs/learning-sheet/preparation/chemistry-ionization-10-3/content-correctness-audit.json`.
- Checked atom and charge conservation for all 16 distinct authored reaction forms present in the sheet, including state/spacing variants. Generic placeholders A/B/Y are treated consistently with the given equilibria.
- Rechecked C/K > 1000 before using the adopted square-root approximation. Fixed a draft graph point with C/K = 1000 exactly: the final first point is C = 0.020 mol/L, so all plotted ratios are 2000 or greater.
- Explicitly distinguish approximate from full-equation results, C from C−x, mol from mol/L, ion amount from compound amount, ion concentration from percentage, strength from initial concentration, and the first/second sulfuric-acid steps.
- K𝓌 = 1.0×10⁻¹⁴ is tied to 25 °C. Neutrality is equality of ion concentrations; KₐKᵦ = K𝓌 uses the same conjugate pair at the same temperature.
- Reviewed all 15 number-token differences between corresponding language answers. They come from chemical names versus formulas, written-out step numbers and equivalent explanatory wording; problem data and answers are scientifically consistent. New comparison/reverse-constant items are also paired in TH/EN.
- Confirmed particle counts against SVG circle/charge markers, including excluding legend markers; checked bar/graph data against the problems and solutions. New diagrams use revised data, while original diagrams are reserved intact.

## File checks

Paired semantic keys, one direct answer per area, matching writing heights, consecutive question numbers, existing local images, guide identity/fingerprint/targets and content/route validation were checked. The guide has 11 authored summary/check steps. These checks support the content package; they are not a claim of native iPad/Safari or final printing QA.

Validation commands and final publication state are recorded in the PR. No shared engine, Firebase Rules, student data, scores, dependencies or Quiz was changed. The PR must be reviewed/merged before the live site uses this new sheet.
