# Physics 4.3: adapted worksheet and review quizzes

The current worksheet contains 67 numbered questions and 12 principle slots in both Thai and English. The two review editions contain 44 and 43 questions. Every question links to exact section/question labels in that worksheet. Numeric multi-part tasks are split into scalar entries; formula/vector answers use five options; recall uses drag/tap with at least two unused distractors.

## Originals retained before replacement

- `source-fragments.json`: all 79 original worksheet slots per language, their exact pre-change HTML, original file SHA-256 and base commit. These are worksheet scaffolding/translations, not a claim that every phrase is a verbatim book quotation.
- `ipst-original-items.json`: all 25 source groups selected by the existing worksheet, original source data/results, printed/PDF page locations, skill/subpart inventories and original-figure paths. The original PNG crops and original SVG assets remain unchanged under `public/content/physics/ipst/equilibrium/assets/4-3-sheet/`.
- `parallel-problem-map.json`: all 37 changed question slots map to fresh `parallel-...` keys, with final TH/EN prompts and solutions. Existing saved answers for old numerical data do not fill the new task.
- `quiz-coverage.json`: all 79 current worksheet slots and all selected source groups map to review questions. The quizzes use the adapted worksheet rather than the archived numerical versions.

The source selection is preserved: activity 4.1; examples 4.1–4.3; all four understanding checks 4.3; all five exercises 4.3; chapter conceptual question 1; chapter problems 1–7; challenges 21,25,26; and the rope comparison on p.20. Extra bridge/scaffold problems remain identified as authored teaching steps. This is not a claim to cover every problem in the whole chapter.

## Source verification

- [Student book](https://drive.google.com/file/d/1uuLqtGLGlKg3mS82C_H32HzJZreBFcRb/view): 297-page scanned Physics Book 2; printed p.11–24 / PDF p.24–37 and selected chapter pages 47–58 / PDF 60–71. Numerical source diagrams were inspected directly; source pages 30,31,33,34,36,37,60,62,63,64,69,70,71 were rendered during this revision.
- [Matching teacher book](https://drive.google.com/file/d/1ZnEcfIp4mXi3x0wOhwfzqlnYuiWE-n_S/view): `phy.c2560.2t.pdf`, 412 pages. Exercise and chapter solutions at PDF pp.38–44 and 58–74 were read as a cross-check for those tasks. The final adapted answers were recomputed independently. Source hashes are in the JSON record; full provider PDFs are not copied into this repository.
- [OpenStax: free-body diagrams](https://openstax.org/books/university-physics-volume-1/pages/5-7-drawing-free-body-diagrams), [friction](https://openstax.org/books/university-physics-volume-1/pages/6-2-friction), [static equilibrium](https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium) were consulted for the force-model checks. They add no examinable content beyond the worksheet.

## Diagram and model decisions

Sixteen new code-authored SVGs clarify the adapted numbers and angle references; unchanged observation/geometry drawings are reused. No unlicensed web photos or generated physics diagrams are introduced. The diagrams state data explicitly and are not measurement drawings. The new assets are documented in their `SOURCE.md`.

Key checks include signed components and equilibrants; horizontal versus vertical angle references; each rope’s identity; separation of load/block/knot; normal force with upward/downward oblique forces; actual versus maximum static friction; kinetic friction opposing sliding; limiting-rope checks. The two-part up/down incline problem and both kite tensions are retained.

## Validation

See `content-correctness-audit.json` for mathematical residuals, content-adapter/coverage checks and browser checks. Run the repository build and the shared quiz/sheet/review test suites before merging. The simulation is unchanged.
