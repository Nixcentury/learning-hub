# Static SVG from the Sheet question bank

Status: prepared for review on 21 October 2026; not deployed by this change.

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
