# Physics 10.2: double-slit interference

Date: 24 October 2026.

## Content and placement

- One continuous bilingual learning sheet, divided into eight internal stages (0–7), based on the supplied IPST Physics Book 3, printed pp.109–126, and teacher guide. Section 10.3 is excluded.
- Stage 0 introduces actual single/double-slit plates, opening width a versus centre-to-centre separation d, and diffraction followed by overlap/interference. Two original schematic SVGs accompany the supplied photographs.
- The experiment compares green light at d = 50/100 µm with wavelength and screen distance fixed, then green/red at the same d and screen distance. Students interpret observations and complete a headed conclusion.
- Subsequent notes cover coherence and initial phase, path difference, phase cycles, fringe type/order, far-field angle geometry, the small-angle approximation, screen positions and adjacent-fringe spacing, and variable changes.
- 61 paired semantic answer slots per language: 14 headed knowledge/conclusion notes and 47 individual question/answer areas. The questions comprise 20 scaffold checks, seven subparts across the four original examples, five subparts across all four understanding-check questions, five subparts across all three Exercise 10.2 questions, and ten additional practice questions.
- Understanding questions are inserted next to the relevant concept. Original Exercise 10.2 remains together at the end of the teaching sequence. Every subpart has its own answer area directly below it.
- Further practice 1–5 adapts selected chapter-end problems; 6–10 supplies parallel fluency in angular positions, distances across opposite sides, multiple intervals, and inverse calculations. Source figures and provenance are documented in `assets/10-2/SOURCES.md`.
- Exact existing catalog BankKey: `b-21460452889578f11c3a8bac`, under Physics / Learning hub / Wave Optics. Content ID: `physics-ipst-wave-optics-10-2-sheet`. Readable route: `#physics/bank/double-slit-interference/learning-sheet`.
- Uses existing language, reveal, math and print engines. No engine, shared CSS, account, database, dependency or lockfile changes. Existing 10.1 and 4.2 materials are unchanged.

## Accuracy and source checks

- All examples and numerical exercises were checked against the supplied teacher guide and independent calculations. Seventeen independent numerical calculations are retained in ignored QA output.
- Phase answers distinguish the accumulated phase difference from its equivalent phase modulo 2π. In-phase starting sources are explicit throughout.
- Bright order starts at zero; dark order starts at one with the n−1/2 convention. A non-integer, non-half-integer path ratio is not indiscriminately rounded to an extremum.
- Example 3 retains the source values λ = 556 nm and d = 18 µm. Its ratios near 3.95/4.50 are explicitly approximate, rather than claiming that arbitrary ratios define exact extrema.
- θ is measured from the central axis to the selected point. The far-field sine relation is separated from the small-angle x/L approximation.
- The central bright-fringe width in Exercise 10.2 Q3 is approximately 1.85−1.20 = 0.65 cm, between its adjacent bounding minima, as in the guide. It is not the width of the whole diffraction envelope.
- Every image has explicit native width/height attributes to reserve its aspect ratio before decoding. No ruler is independently stretched. No numeric laser-power line is copied from the source.

## Automated checks

- `pnpm test:unit`: 333/333 passed.
- `pnpm validate:routes`: passed; the new bank menu is discovered automatically.
- `pnpm build`: passed, including content validation (zero errors, 32 existing draft warnings), TypeScript, Vite and Pages artifact verification (465 public files).
- `git diff --check`: passed.
- 219 authored math delimiters across both language blocks and labels remain below the renderer's 500-expression limit; browser rendering reports no math errors.

## Browser and print preview

Production build served through managed preview, read-only Guest use in Chromium. No real student accounts or Cloud writes.

- Actual Hub bank deep link opens the sheet. All 122 slot instances and 34 image instances load. Individual reveal preserves geometry; reveal state carries across TH/EN; reveal-all and hide-all work.
- Separate 390px iframe fixtures use the same language, learning-sheet and math controllers. Both languages have 375px usable width after native scrollbars, no horizontal overflow, 61 answer slots, 47 question rows, no broken images/math errors and an answer area under every question. This checks worksheet responsive layout, not the full mobile Hub shell or native iPad Safari.
- Final central A4 previews pass all four editions: TH blank/answers both **25 pages**, EN blank/answers both **26 pages**. All have 61 slots, 47 questions and 17 images. Blank editions contain zero answer elements; answer editions contain all 61. The opposite language is removed, every question keeps its answer area, and page bodies do not overflow.
- A first pre-fix TH answer preview overflowed after changing edition. Native image dimensions were added, then all four editions were regenerated from a refreshed build and passed. No shared-engine change was required.
- Formula/geometry and mobile screenshots were visually inspected. Full central-print HTML snapshots, page-by-page measurements and narrow-frame reports are retained in ignored `qa-output/slit-*`.
- Page counts refer to the central A4 preview; native browser PDF export and native Safari remain device checks.

Publication is verified separately against the GitHub Pages deployment marker and exact authored public-file bytes.
