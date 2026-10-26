# Static SVG from the Sheet question bank

Latest verification: 26 October 2026. The 21 October notes below are historical.

## Chemistry A-Level 2568 — 26 October 2026

- The live set `b-3c7f2eba947faf9c3054eef6` contains 35 questions: 30 choice and
  5 numeric. Its eight SVGs are solution diagrams, not question/worksheet images.
- The original reader rejected root SVG box styles (`width`, `max-width`,
  `height:auto`, background, border, radius and padding), first at row 40/Q4.
  The reader now validates that bounded static subset and transfers it to a
  responsive image box. Existing restrictions on active/external SVG remain.
- Nine questions also have an additional h3 containing the final instruction
  after a table/context. Only the first h3 is now removed from the context when
  constructing the prompt; subsequent headings and their text are retained.
- With the user's authorization, only CHEMISTRY cells C40, C41, C45, C46, C47,
  C52, C57 and C69 were normalized. The same frame/background/padding is drawn
  using rect/g and numeric intrinsic dimensions, without root CSS. The original
  diagram contents and all non-SVG bytes in those cells were retained. Connector
  readback verified A/B IDs, validation and cell formatting were unchanged.
- Original revision: `20e0a58ddd4af4496906856bbfd8a149496902c2e18b1b3a7d5eaa67ff942396`.
  Normalized revision: `a722340d6967477fc2fbeaa814858a477bef71abb3088b67fa88950c2efca70f`.
  The live service returned both, each with 35 rows. Old saved attempts can retain
  their original question revision; no migration/reset of progress was performed.
- All eight normalized SVGs also pass the previous reader. The central fix is
  still required for archived originals and other sets using the same box styles.
- Automated unit suite: 338 passed. Regression tests cover the frame style
  subset, forbidden CSS/resources and the second-heading question structure.
- Chromium checks used the actual production player/adapter/MathJax/MathLive
  with isolated Guest contexts and the real snapshot substituted for the service.
  Both original and normalized snapshots opened all 35 questions; all eight
  solution images decoded/displayed; saved answers and revision survived reload.
- Worksheet and answer PDF checks retained 35 questions. The worksheet excluded
  solutions and their diagrams; the answer edition retained all eight diagrams.
  Printing left source HTML and saved answers unchanged. Phone-width touch and
  diagram bounds passed at 390 px. Physical iPad, Pencil and Cloud were not tested.
- New reusable authoring contract/example: `public/content/templates/sheet-question-ai-rules.txt`
  and `sheet-question-template.txt`. Offline validation uses
  `node scripts/validate-bank-html.mjs draft.html --subject chemistry` or a real
  snapshot JSON. The example and both real revisions pass this check.

## Historical verification — 21 October 2026

The Sheet adapter now reconstructs an allowed static SVG subset and embeds it as
an SVG image. IDs, markers, gradients and clipping remain local to each image,
including repeated diagrams and print clones. Existing HTTPS SVG image links
continue to work. See `QUESTION-BANK-START-HERE.md` for authoring limits.

The browser check also exposed an existing CSS collision: Print Core's
`activity-question-solution` class hid the cloned on-screen solution. A scoped
rule now shows that content only inside the Quiz's unlocked solution panel.

## Verification

- `pnpm test:unit`: 312 passed, including 25 SVG tests.
- `pnpm test:bank`: 55 passed.
- `pnpm build`: passed; 0 content errors, 32 existing draft warnings.
- The saved R01 Chemistry 2569 snapshot still adapts as 35 questions: 30 choice
  and 5 numeric. All answer keys are unchanged. This is a local snapshot check,
  not a new Sheet read or browser test of those 35 questions.
- SVG tests exercise prompt, context, captioned choices, hints, solutions,
  numeric feedback, local markers/gradients/clip paths/symbols, repeated IDs,
  dimensions and rejection of unsupported content with source row/ordinal.
- The actual `print-core.js` runs in a DOM test: the worksheet retains six
  question/choice images and removes both solutions; the answer key retains
  eight question/choice/solution images and marks the correct choices. Both
  retain one additional hidden hint image. Printing/restoring does not mutate
  the source. These assertions do not verify paper layout or image decoding.

## Browser observations

An isolated local preview used the actual Sheet adapter, Quiz Engine, player
styles and Print Core with two synthetic questions. Fetch substitution supplied
only the fixture; external images used their real HTTPS URLs. No production
Sheet, Apps Script, student account or existing attempt was changed.

- Inline SVG images decoded at 340×150 in the prompt, context, both choices and
  hint. The fixture includes arrow markers, gradients, clipping and symbol/use.
- Both existing HTTPS meter SVGs decoded at 300×150.
- Answering A/A scored 2/2 (100%). After the CSS fix, returning to Q1 exposed
  both the solution text and its SVG image in the accessibility tree, with all
  five currently displayed images decoded successfully.
- The initial fixture clipped its own symbol viewport. Giving the symbol an
  explicit viewBox and size corrected the fixture definition; no sanitizer
  change was needed for that issue.

The browser connection then disconnected and repeated calls timed out. No
completed print-preview/PDF, final visual screenshot, iPad Safari or physical
printing result is claimed. Recheck those before declaring those surfaces
verified. This PR does not merge itself or publish a new Pages deployment.
