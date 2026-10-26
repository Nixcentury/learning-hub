# Chemistry A-Level 2568 — content and SVG QA

QA checkpoint: 26 October 2026. This continues the reader work recorded in
`QUESTION-BANK-SVG-QA.md`; it does not replace its historical verification.

## Scope and source

- Existing bank: `chemistry/b-3c7f2eba947faf9c3054eef6`.
- Source: the user's `tcas68-chem-a-level.pdf`, 27 pages, including the answer
  table on page 27. SHA-256:
  `5eadda00286e6caff73dcba1c1cb108ff11c94214576792bd8e9783598a09a5a`.
- Source pages inspected for the corrections: 8 (Q9), 9 (Q10), 10 (Q11),
  15 (Q18), 16 (Q19), 20 (Q24), 25 (Q31), 26 (Q33), and the answer table.
- The Sheet remains the authored question source. The nine existing HTML cells
  changed are CHEMISTRY C41, C45:C47, C54:C55, C60, C67 and C69. No rows were
  inserted, removed or reordered. A/B identifiers and topic mappings are unchanged.
- Before this pass, live revision:
  `a722340d6967477fc2fbeaa814858a477bef71abb3088b67fa88950c2efca70f`.
- Saved/read-back final revision, also returned by the real service:
  `baf2226ddc41cdd55b65909ff1f0ac191f0ecc37b9b4574001641d3cc437bb08`.
- 35 questions remain: 30 choice and 5 numeric. All answer keys, tolerances,
  question wording, numerical data and options are preserved. The only changes
  in the question context are repairs to two image URLs.

## Corrections applied to the existing Sheet

| Question | Correction |
| --- | --- |
| 5 | Rebuilt the solution comparison figure with separate short headings; the earlier group headings overlapped and were clipped. |
| 9 | B is **pentyl ethanoate**, CH3COO(CH2)4CH3: 2 carbons in the acid-derived part and 5 in the alkyl part. Replaced the incorrect propyl propanoate explanation and figure. A remains 3-methylbutanoic acid, C5H10O2. |
| 10 | P is pentan-2-ol. Q is C4H8 (56.0 g/mol), S is trans-pent-2-ene, C5H10 (70.0 g/mol), and R is 2-tert-butoxypentane, C9H20O (144.0 g/mol). Corrected the hint, formulas, masses and figure; Q and S are not isomers. The answer remains Q first and R last. |
| 11 | Rebuilt the hydrolysis figure so the ester's acid-derived chain and sodium propanoate product each contain three carbons. The aromatic product keeps the ortho methyl group and one CH2 between its ring and oxygen. Formulas remain C3H5O2Na and C8H10O. |
| 18 | Repaired `q018-p01.png` to the existing, visually verified `q18-p01.png` in the same source directory. |
| 19, 24 | Retained the previously authorized practice adaptations and their single answer keys. The notes now distinguish the supplied original answer table from changes made for practice, without attributing an unverified official reason for awarding credit to all answers. |
| 31 | Retained the practice answer 333 and the note listing the original accepted answers. Split the two successive beta-decay steps into separate balanced equations. |
| 33 | Added the missing second bonds to both acetyl carbonyls in the solution figure. Repaired the question image URL to the existing `q034-p01.png`, visually verified to contain the exact Z structure despite its filename. |

Five of the existing eight solution SVGs changed (Q5, Q9, Q10, Q11, Q33).
Q4, Q16 and Q21 solution figures were inspected and retained. All eight remain
embedded vector images through the existing bank sanitizer. There are five
separate question images; all five source files were decoded and inspected.

## Shared inline formula fix in this change

Live browser inspection exposed another issue: the diagram rule
`.quiz-solution svg { display:block; ... }` also selected MathJax's generated SVG.
The short inline C=O expression in Q9 acquired a full-line bounding box
(1002 px in the inspected window) and moved away from its surrounding sentence.

The diagram-only selectors in `quiz-core.css`, including the two print-context
rules, now exclude SVG descendants of `mjx-container`. MathJax keeps control of
its own inline/display geometry, baseline and height. The player stylesheet URL
is versioned so an existing browser can obtain the correction without clearing
saved work. This changes presentation only; no engine state or scoring logic
changes.

## Verification completed before merge

- Exact connector readback of all 35 rows matched the intended nine replacements;
  every A/B value, untargeted cell, validation rule, cell format and note matched
  the original read. Only the HTML values in the listed C cells were written.
- The live service returned the final revision above and all 35 rows.
- The real offline bank adapter/validator passed: 35 questions, 8 SVG images,
  and all 9 additional legacy headings retained.
- Existing bank suite: 63 passed. Full unit suite: 338 passed.
- Production build and public-file verification passed (514 files). No dependency
  or lockfile changes. `git diff --check` passed.
- Existing Print Core, run against the final real snapshot, retained all 35
  questions and all 5 question images in both modes. Worksheet: 0 solutions,
  0 solution SVGs. Answer edition: 35 solutions, all 8 solution SVGs. Preparing
  and restoring print copies did not change source HTML.
- Chromium on the actual published Hub, in this session's isolated Guest attempt,
  loaded all 35 questions and all 13 images (8 SVG + 5 question images). Each image
  completed with a nonzero intrinsic size. No MathJax error elements were found.
- Opened and revealed Q5, Q9, Q10, Q11, Q18, Q19, Q24, Q31 and Q33 through the
  actual Quiz UI. The updated answers/figures were present; images decoded and
  no MathJax error elements appeared. No account/student Cloud writes were used.
- Five changed SVGs were separately rendered and visually checked. The Q10
  heading/branch spacing and Q11 methyl-label spacing were corrected after review.

### Limits of this checkpoint

The live browser checks above cover the saved Sheet edits and demonstrate the
inline-math problem before this repository CSS change is deployed. They do not
claim that the new CSS was already published at that time. Merge/deployment and
post-deployment browser verification are separate checks.

This run did not export a new full A4 PDF, inspect every printed page, test a
physical printer, or use native Safari/iPad/Pencil. The print result above is a
structural check with the actual shared Print Core, not a pagination claim.
Old saved attempts remain pinned to their original revision by design; this
work did not migrate or reset any user's progress.
