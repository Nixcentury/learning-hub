# 10.2 Double-slit interference — learning review Quiz

Prepared 2 November 2026 after merged PR #110; refreshed onto main `7450f71` before submission, retaining the intervening 10.1 and navigation changes. The learning sheet uses independently authored replacements; this Quiz contains the source-IPST tasks reserved for review. It is a **single 50-question mixed set**: 14 drag passages, 18 choices and 18 numeric questions. It can be completed in stages. Questions 45–50 are the challenge block.

## Placement and coverage

- Bank `b-21460452889578f11c3a8bac`; tool `quiz-set-1`; activity ID `physics-ipst-wave-optics-10-2-quiz-set-1`, content revision 1.
- File: `public/content/physics/ipst/wave-optics/10-2-double-slit-quiz-set-1.html`.
- Every question provides its own task/data/necessary figures, a bilingual hint and hidden worked solution. Its optional sheet link names the relevant original section.
- Covers all 14 headed note topics in the revised sheet, controlled-variable experiment comparisons, all four IPST examples (seven subparts), all four understanding checks (five subparts), all three Exercise 10.2 questions (five subparts), chapter-end conceptual Q2, problems 1–8 and challenges 15–20 (teacher-guide challenges 1–6).
- Chapter-end problems 9–14 and challenges 21 onward use single-slit/grating concepts and are excluded from this 10.2 set. No later topic is labelled complete.
- Per the teacher’s clarification, **only this review Quiz** configures its “ทวนเนื้อหา” button to open the existing 10.2 learning sheet, in a paired window. The duplicate short-review draft was removed. Other quizzes retain their normal topic-review destination. The existing sheet keeps its own reveal, guide and print controls.
- No changes to the approved learning sheet, its guide, the lab, original JPEGs, scoring, storage, AI policy or Classroom. A small opt-in Quiz link adapter reuses the existing validated HTML opener; `data-html-pair` pairs an explicitly configured sheet with its owning Quiz. These are required only to implement the requested button destination.

## Source checks and deliberate clarifications

Student book: Drive `1R-jSSONIMji5S-_KRSww1Pl7r_QK3Zpj`, Physics Book 3, printed pp.109–126 and 150–155. Teacher guide: Drive `1CJ9lV_SpjmvXTmZno8Sgg5vx4YotXQzE`, printed pp.129–134, 152–157 and 162–166. The scanned student pages were visually reviewed; the teacher-guide explanations were cross-checked independently. Large source PDFs are not committed.

Questions are paraphrased for the interactive format; choice options are newly authored. Source data and intent are preserved except for the explicitly labelled edition choice below. Existing cropped figures are reused unchanged where needed. Provenance for original images remains in `public/content/physics/ipst/wave-optics/assets/10-2/SOURCES.md`.

- Example 10.1 and understanding Q2 ask for **accumulated phase kπ**, entering k only. Solutions also explain the equivalent phase modulo 2π. This avoids an ambiguous automatic choice between 20000π and 0/2π, or 10π and 0/2π.
- Example 10.3 asks for the **nearest extremum under the source approximation**. The computed ratios are approximately 3.9464 and 4.5032, rather than claiming they are exactly 4 and 4.5.
- Chapter-end problem 8, Quiz Q43, explicitly uses the teacher-guide spacing **10⁻³ m**, giving d = 650 μm. The supplied student PDF visibly prints **10⁻⁷ m**. Both the prompt and visible edition note identify this discrepancy; this is not presented as an unchanged verbatim book question.
- Ruler-reading answers allow ±0.05 cm, reflecting photograph precision. The photograph’s own ruler defines the scale.
- Challenge 20 explicitly uses the book’s small-angle approximation and rounds to the nearest integer, yielding 634 nm. The two-sided 35 cm span must first be halved.
- Initially in-phase sources, a common medium and equal amplitudes for complete darkness are explicit. Dark orders start at 1; arbitrary path ratios are not rounded into exact extrema.

## Shared behavior

The set opts into `mixed` and `data-drag-read-confirm`. Every drag passage has at least two unused pieces. Forward navigation checks all slots, asks the student to reread and confirm, and offers Skip for now. Choice/numeric questions use the existing reasoning/working area and AI review, independently of normal scoring. Drag passages do not require AI working. Existing printable AI-evidence stamps and score policy are unchanged; no AI verdict is fabricated by content.

## QA

- Production content adapter accepts all 50; all 50 correct answer maps grade correctly. All 82 single-slot substitutions with unused drag pieces grade incorrect. Numeric keys were independently calculated for all 18 numeric questions; choice keys and angular/order/coincidence comparisons were separately checked.
- Relevant existing drag/number/math/topic-review/menu tests: **104 passed**, zero failures. `pnpm build` passes with **697 public files** verified. Quiz/menu content validation passes. The opt-in sheet-link and existing Quiz/workspace regression suites also pass **66 tests**; their new link tests are registered in test:unit. `git diff --check` passes.
- Guest Chromium through the actual built Hub: all 50 questions were opened. Q3–50 were measured with no question-card horizontal overflow, missing images or MathJax errors; Q1–2 were also exercised by actual drag placement/reveal. Empty drag answers block forward movement without revealing wrong slots; the completed Q1 passage receives the correct reread confirmation. Skip and saved resume work.
- Give up visibly reveals a complete solution for drag Q2, choice Q3 and numeric Q9/Q50. Choice and numeric working/AI panels appear; no live AI request or positive stamp was generated.
- Selected English questions were checked at 390 px (phase Q9, photographs Q5 and geometry Q20) and 768 px (ruler Q34 and ratio Q45); the checked cards render without overflow, broken images or math errors. This is a Chromium width fixture, not a physical iPad/Safari test. The requested final sheet-button destination is checked separately below.
- Print Core was exercised through its actual buttons with **only native window.print intercepted in an ignored QA copy** so the production-generated print DOM could be inspected. TH/EN blank editions each contain 50 questions, 13 images and zero solutions; TH/EN answer editions contain 50 questions, 13 images and all 50 solutions, with every drag slot completed. No broken images/MathJax errors in any of the four copies. Native PDF export, print pagination and physical printing were not tested.
- All 15 protected JPEGs and the separate lab remain SHA-256 identical to the original inventory. The source-fragments archive remains unchanged.

## Question map

| Quiz | Stable question ID | Format | Source / learning target |
| --- | --- | --- | --- |
| 1 | `openings-a-d` | drag-drop | slit-definition, a-and-d |
| 2 | `two-wave-processes` | drag-drop | wave-properties |
| 3 | `independent-lamps` | choice | coherent-sources |
| 4 | `coherent-starting-phase` | drag-drop | coherent-sources |
| 5 | `experiment-separation` | choice | กิจกรรม 10.1 |
| 6 | `experiment-wavelength` | choice | กิจกรรม 10.1 |
| 7 | `path-difference` | drag-drop | path-difference |
| 8 | `phase-from-cycles` | drag-drop | phase-difference |
| 9 | `ipst-example-10-1-a` | number | ตัวอย่าง 10.1 ก |
| 10 | `ipst-example-10-1-b` | number | ตัวอย่าง 10.1 ข |
| 11 | `bright-dark-conditions` | drag-drop | ท้ายบท คำถาม 2 ก–ข |
| 12 | `ipst-example-10-2-a` | choice | ตัวอย่าง 10.2 ก |
| 13 | `ipst-example-10-2-b` | choice | ตัวอย่าง 10.2 ข |
| 14 | `not-an-extremum` | choice | order-without-rounding |
| 15 | `ipst-understanding-1` | choice | ตรวจความเข้าใจ 10.2 ข้อ 1 |
| 16 | `ipst-understanding-2` | number | ตรวจความเข้าใจ 10.2 ข้อ 2 |
| 17 | `ipst-understanding-3-a` | choice | ตรวจความเข้าใจ 10.2 ข้อ 3 ก |
| 18 | `ipst-understanding-3-b` | choice | ตรวจความเข้าใจ 10.2 ข้อ 3 ข |
| 19 | `ipst-understanding-4` | choice | ตรวจความเข้าใจ 10.2 ข้อ 4 |
| 20 | `geometry-symbols` | drag-drop | geometry-meaning |
| 21 | `angle-approximations` | drag-drop | angle-position-formulas |
| 22 | `fringe-order-table` | drag-drop | bright-dark-conditions |
| 23 | `ipst-example-10-3-a` | choice | ตัวอย่าง 10.3 ก |
| 24 | `ipst-example-10-3-b` | choice | ตัวอย่าง 10.3 ข |
| 25 | `ipst-example-10-4` | choice | ตัวอย่าง 10.4 |
| 26 | `position-formulas` | drag-drop | angle-position-formulas |
| 27 | `derive-fringe-spacing` | drag-drop | spacing-and-reading |
| 28 | `inverse-angle` | choice | inverse-angular-calculation |
| 29 | `ipst-exercise-1` | number | แบบฝึกหัด 10.2 ข้อ 1 |
| 30 | `ipst-exercise-2-a` | number | แบบฝึกหัด 10.2 ข้อ 2 ก |
| 31 | `ipst-exercise-2-b` | choice | แบบฝึกหัด 10.2 ข้อ 2 ข |
| 32 | `ipst-exercise-2-c` | choice | แบบฝึกหัด 10.2 ข้อ 2 ค |
| 33 | `central-bright-width` | drag-drop | fringe-width-definition |
| 34 | `ipst-exercise-3` | number | แบบฝึกหัด 10.2 ข้อ 3 |
| 35 | `variables-summary` | drag-drop | variable-summary |
| 36 | `ipst-end-problem-1` | number | ท้ายบท ปัญหา 1 |
| 37 | `ipst-end-problem-2` | number | ท้ายบท ปัญหา 2 |
| 38 | `ipst-end-problem-3` | number | ท้ายบท ปัญหา 3 |
| 39 | `ipst-end-problem-4` | number | ท้ายบท ปัญหา 4 |
| 40 | `ipst-end-problem-5` | number | ท้ายบท ปัญหา 5 |
| 41 | `ipst-end-problem-6` | number | ท้ายบท ปัญหา 6 |
| 42 | `ipst-end-problem-7` | number | ท้ายบท ปัญหา 7 |
| 43 | `ipst-end-problem-8-teacher` | number | ท้ายบท ปัญหา 8 — ข้อมูลฉบับคู่มือครู |
| 44 | `count-centres-not-gaps` | drag-drop | spacing-and-reading, measurement-errors |
| 45 | `ipst-challenge-15` | choice | ท้ายบท ปัญหาท้าทาย 15 (คู่มือครูข้อ 1) |
| 46 | `ipst-challenge-16` | number | ท้ายบท ปัญหาท้าทาย 16 (คู่มือครูข้อ 2) |
| 47 | `ipst-challenge-17` | number | ท้ายบท ปัญหาท้าทาย 17 (คู่มือครูข้อ 3) |
| 48 | `ipst-challenge-18` | choice | ท้ายบท ปัญหาท้าทาย 18 (คู่มือครูข้อ 4) |
| 49 | `ipst-challenge-19` | number | ท้ายบท ปัญหาท้าทาย 19 (คู่มือครูข้อ 5) |
| 50 | `ipst-challenge-20` | number | ท้ายบท ปัญหาท้าทาย 20 (คู่มือครูข้อ 6) |

## Final per-Quiz sheet button

The summary’s `a[data-quiz-review-link]` configures this Quiz only. Its `data-html-src` is resolved against the shared player URL; its normal href remains the Hub sheet deep link for standalone fallback. The adapter accepts only a stable content ID and a local HTML source under the site content directory. The existing HTML opener validates the final entry again. It opens the actual sheet rather than rendering sheet answers through the topic-review reader. No duplicated summary is shipped.

Final Hub check: clicking this Quiz’s Review button opens `content-html-physics-ipst-wave-optics-10-2-sheet` on the right and retains the Quiz on the left. The target has `data-learning-sheet=1`, revision `2026-11-02-1`, all 64 Thai answer slots initially closed, and its original guide path. No `topic-review-library` is opened. Screenshot: ignored `slit102-quiz-sheet-pair-20261102.jpg`. Future content batches use content-first QA, as requested.
