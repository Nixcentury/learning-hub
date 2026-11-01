# Chemistry A-Level 2569 — question-by-question review

Bank: `b-a61e626472132aaf94ca11b9`; legacy ID: `เคมี (CHEMISTRY) - Learning hub - A-level - A-level 2569`.
Review: `public/content/reviews/chemistry/a-level-2569.html`.
Content ID: `chemistry-a-level-2569-review`. Menu: `public/content/bank/chemistry/b-a61e626472132aaf94ca11b9.html`.

The teacher teaches this 35-question set over several lessons. Add about three exam sections per PR to this same review and bank ID. This is a learning companion: principles, different worked examples, recall practice with hidden answers, related chapter reading and a return to the selected exam question. Do not paste the exam solution, mark the correct exam option or replace the source questions.

## Coverage

| Exam question | Review skills | Status |
| --- | --- | --- |
| 1 | Read subshell notation; distinguish occupancy from capacity; write/check a ground-state configuration; expand a noble-gas core when needed; sum only the requested subshells, including unoccupied ones | Written TH/EN |
| 2 | Group 1/2 names and H; atomic radius across/down the table; EN down a group; ion versus its neutral atom; successive IE and starting charge; sum successive removal steps; electron availability | Written TH/EN |
| 3 | Remaining versus decayed fraction; repeated halving; forward quantities and inverse half-life; consistent time units; constant half-life versus decreasing mass lost per interval | Written TH/EN |
| 4 | Lewis electron accounting; multiple bonds as one region; AXₘEₙ shapes including 5/6 regions; molecular versus bond polarity; terminal-atom symmetry | Written TH/EN |
| 5 | Molecular versus ionic/network substances; London and dipole forces; hydrogen-bond donors/acceptors; self versus water interactions; nonpolar-chain effects on solubility | Written TH/EN |
| 6 | PV=nRT to slope nR/P; Kelvin versus Celsius intercepts; compare n/P; coincident lines; invert slope ratios for n or P | Written TH/EN |
| 7–35 | Not authored yet; read the actual next questions before planning their review | Pending |

First batch: 3 exam sections, 8 recall questions and 19 separately spaced subparts in each language, with 2 reused diagrams per language. Worked examples use S, illustrative M ionization energies and an isotope Y with different quantities. There is no Sn configuration/exam total, Nd calculation, correct choice letter or original exam solution in this review. The existing bank Q2 is already an adapted practice question with the Z >= 2 condition; do not describe its key as the official original exam verdict.

## Source checkpoint

Read the public service's current 35-row snapshot before authoring: revision `08b5f19efdef6747ec0ed0a6d8664ae6bb81af0f40c8437b21d3b63ac5778c6b`. Questions 1–3 are rows 2–4. Read-only live catalog checks matched the bank above and the three related-topic keys. Public primary-source links (IPST Project 14 and OpenStax) are included in the review. The original snapshot is not modified or committed as a new exam copy.

## Integration

The review opts into per-question navigation with `main[data-review-quiz-bank]` and `section[data-review-exam-question]`. Authors supply only passive content; the shared reader generates the selector and return controls. Quiz-modal returns use the current engine and preserve its answers/working/score. Hub review-window returns validate their source, active command, subject and bank before opening/restoring that bank Quiz and requesting its question. A direct legacy review-player page outside Hub supplies an honest link to the exam set, rather than claiming it can restore a particular Hub window.

In Hub, the Quiz review button opens/restores the shared reader and automatically pairs the existing Quiz on the left with the reader on the right using the existing split-view controls. Small screens use the existing top/bottom layout. Acknowledged requests preserve the original Quiz iframe; unsupported/standalone players retain the inline review dialog. The current question context is passed without learner identity.

Quiz opening prefers an authored review for the current bank, then the old row-topic preference when no bank review is available. If a later question has no section yet, the reader says so and offers the prepared sections. Existing topic reviews stay on their old behavior. No Apps Script, Sheet data, Classroom services or Firebase Rules are changed.

Next authoring batch: inspect questions 7–9, extend both languages, keep question keys and numbering stable, then update this checkpoint and the menu's available range. Do not add placeholders that look ready.

## QA

- `pnpm test:unit`: 558 passed, 0 failed. Tests include strict exam markers, current-question selection, exact returns preserving answers/working/score, drag-review navigation protection and PrintCore filtering.
- `pnpm build`: passed; 660 public files verified. `node scripts/validate-topic-review.mjs --all`: all 12 reviews passed. `git diff --check`: clean.
- Browser QA against the production build in a managed preview: Thai and English sections 1–3, rendered equations and both SVGs; no horizontal overflow in iPad-width and phone-width frames (768/1024/390 wrapper widths). This is desktop browser viewport QA, not a physical iPad/Safari test.
- Quiz modal: opens the current question's review, changes sections and returns to the selected question. Tested 1 → 2 → 3 → 1; the synthetic Q1 answer and typed working survived. Question 4 shows an honest unavailable notice; manual selection clears it. Individual/all-answer toggles and independent writing spaces checked.
- Hub review window: returning to question 3 creates and loads a Quiz at Q3/35; returning to question 1 restores the minimized existing Quiz and its saved Q1 working. No student account, AI grading call or final submission used.
- PrintCore's production cloning path is covered by a test: only the selected exam section prints, hidden practice answers stay hidden, writing spaces remain and navigation controls are removed. No physical printer or exported-PDF visual QA claimed.
- Preview-only HTTP compatibility shims supply UUID/SHA-256 APIs absent on the managed non-secure preview origin. These shims are outside the repository and are not production changes.
- Screenshot proof: `qa-output/chem69-review-ipad.jpg` (ignored local QA artifact). Publishing is via PR; verify the live page after the teacher merges.

### Automatic split-view follow-up

The Quiz review action now requests its existing Hub reader as a split-view partner. Production Workspace validates the active registered Quiz, same origin, request sequence, content and current question before opening the reader, then acknowledges the request. The original inline dialog remains a fallback after 1.2 seconds if a host does not support this request. No answers, scores, working or learner identity are sent to the reader.

Browser QA: at 1024px the same Quiz and shared reader occupied 508px each, side by side; at 390px they occupied two 390 × 438px rows. Review opened at Q1, selecting Q3 and returning reached Q3/35, reopening selected Q3 and reused exactly two windows, and returning to Q1 retained the typed working. Switching TH/EN preserved a manually chosen review section. No review horizontal overflow or MathJax errors observed. Unit regressions cover rejected stale/unregistered/inactive requests, reader reuse, acknowledgements and fallback. The workspace CI now also runs the existing production Hub review browser regression.

### Conflict resolution — 2026-11-01

Merged main `01ac3e9` into this review branch, preserving the shared Give Up round lock from PR #97 and the split-review/current-question return behavior. Resolved the shared player cache version and combined the production test harness exports (`canAnswerQuestion`, `returnToQuestion`, `openTopicReview`). Added an integration regression proving that reading review and returning to a given-up question does not unlock it within the same attempt; the next explicit attempt can answer it.

Final local verification after resolution: 578 unit tests passed, 0 failed; build passed and verified 662 public files; all 12 review files passed the validator. Classroom/Rules files match main exactly. The branch is updated through a two-parent merge commit; the PR itself remains unmerged.

### Batch 2 — questions 4–6 (2026-11-01)

Read the same current 35-row snapshot above, including the source image for
question 6 (V against Celsius temperature). Live catalog lookups confirmed
the covalent-bonding key `b-a2b6c6d7ec6d0f3f2c9b67b2` and gas-relationships
key `b-930b7a290cb75ae465a21f3a`; both have owned review pages.

Added three exam sections and nine recall questions (9–17), with 20 separately
spaced subparts in each language. Current total: six exam sections, 17 recall
questions and 39 subparts per language. Two new original SVGs explain dipole
vector addition and V–Celsius slopes. Reused the existing donor/acceptor figure.

Different examples use PCl3, SCl2, HCN, SiF4, CF4/CHF3, F2, HBr, ethanol, ether,
KBr and hexan-1-ol. Gas practice uses 0.050/0.100 mol, 1.0/0.50/2.0 atm and
slope ratios 3 and 1/2. Do not add the exam's molecule-pair table, original
graph, correct option letter or original gas-option arithmetic to this review.

Primary checks and reading links: IPST Project 14 shapes/polarity/forces and
V–T/ideal gas lessons, plus OpenStax Chemistry 2e sections 7.6, 10.1 and 9.2.
This batch changes the review, its local image assets, its bank menu range and
this progress checkpoint only; use the existing shared reader/print/return tools.

Batch 2 QA:
- Original exam sections 1–3 match the base bytes after parsing, in both languages.
- The new TH/EN LaTeX expressions agree; independent calculations verify the
  numeric slopes and algebraic n/P examples.
- `pnpm test:unit`: 595 passed. Build: 666 public files. All 12 review validators pass.
- Current-content PrintCore cloning: 18 paths (TH/EN × sections 4/5/6 × hidden/
  first/all answers) retain only the selected exam section, honor answer/blank
  state, omit controls and keep the quiz draft. No exported-PDF or physical-
  printer visual result is claimed.
- Production-build browser preview: opening from Q4 selects its new review;
  switching the reader to Q6 and returning restores Q6/35 in the same Quiz.
  Typed Q4 working survives. Single/all-answer toggles, new figures and TH/EN
  rendering checked. The AX notation MathJax error found visually was corrected.
- At wrapper widths 1024, 768 and 390 the new selected sections have no horizontal
  overflow, no MathJax errors and all images loaded. These are desktop-browser
  viewport checks, not a physical iPad/Safari test.
- Preview HTTP crypto compatibility shims remain outside the repository.
- Q7 still reports that its review is unavailable and offers only the six
  authored sections. Coverage is never presented as all 35 questions.
- Two small visual fixes from browser QA: explicit AX subscripts for MathJax,
  and the net-dipole label moved clear of the bond arrows.
