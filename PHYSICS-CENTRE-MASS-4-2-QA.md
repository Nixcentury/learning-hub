# Physics 4.2: centre of mass and centre of gravity

Date: 23 October 2026 (Asia/Bangkok).

## Content and placement

- Based on the supplied IPST Physics Book 2, section 4.2, printed pp. 5–10, and teacher guide, printed pp. 10–15. Source PDFs are unchanged and not included in the repository.
- Each experiment follows apparatus/start → illustrated outcomes → observations → conclusion → headed knowledge notes → consolidation questions. Students interpret supplied diagrams rather than redraw them.
- Experiment 1: pushing an initially stationary book along different lines; translation versus translation plus rotation; intersection of successful non-rotating push directions; CM and its meaning.
- Experiment 2: freely suspending the same irregular lamina from three material holes; marked verticals; intersection at CG; why one trial gives only a line and a third trial checks the intersection.
- Connects CM/CG in a uniform gravitational field, mass distribution, uniform ruler/block/ring, and all four original IPST understanding-check questions.
- Added questions distinguish force contact from line of action, symmetric shape from uniform mass, position relative to the body from position in the room, and absence of rotation from mechanical equilibrium.
- 30 paired semantic answer slots and 20 question items in each language: 5 observation questions, 11 consolidation questions, 4 IPST questions. Headed conclusion/knowledge notes account for the other 10 slots. Every question has its own answer space directly below the prompt.
- Thai and English are separate complete blocks; central reveal/language/print controls are used. Blank and full-answer editions use the same geometry. No score collection or new controls.
- Authored content ID: `physics-ipst-equilibrium-4-2-sheet`.
- The public physics catalog read on this date identifies `ศูนย์กลางมวลและศูนย์ถ่วง(Centre of Mass and Centre of Gravity)` as `b-c54c2d76bc074671ec10618f`, under `Learning hub / สมดุลกล(Mechanical Equilibrium)`, with zero bank questions. The new menu preserves that exact ID.
- Bank route: `#physics/bank/b-c54c2d76bc074671ec10618f/learning-sheet`; readable route: `#physics/bank/centre-of-mass-and-gravity/learning-sheet`.
- Does not change the existing 4.1 content/menu, bank service, question identities, account data, shared CSS, engines, Firebase or CI.

## Illustration checks

- Two apparatus images are cropped from the supplied student book. Nine original SVG illustrations provide linked before/after views, repeated force lines, suspension sequence, symmetry examples and the cylinder question. See `assets/4-2/SOURCES.md` for attribution and geometry.
- Book cases preserve initial dimensions/orientation, force-arrow length and viewing position. The off-centre push above CM gives clockwise rotation, consistently shown in the result. Motion drawings are explicitly qualitative.
- Lamina trials share one uniform polygon and fixed material-hole coordinates. Its area centroid and rigid rotations were calculated independently of the explanatory text. Each selected support transforms to x = 0 and y < 0 relative to CM. Thus the intersection is vertically below every support. Marks are clipped to the sheet and rotate with it; hole labels remain upright for readability.
- CM is fixed relative to an unchanged rigid body, rather than fixed in the room. CM/CG coincidence requires a uniform gravitational field, not uniform mass. The cylinder answer specifies the supporting line through CG and, for the illustrated uniform cylinder, support at mid-length.

## Automated validation

- `pnpm test:unit`: 330/330 passed.
- `pnpm validate:content`: zero errors, 32 existing draft warnings.
- `pnpm validate:routes`: passed; menu discovered automatically.
- `pnpm build`: passed, including TypeScript and Pages artifact verification (424 public files).
- `git diff --check`: passed.
- No dependencies or lockfiles changed.

## Browser and print preview

The production build was served through the managed preview and checked in Chromium through the cloud browser. Read-only Guest use; no student records, real accounts or Cloud writes were used.

- Actual Hub bank deep link resolved to the new readable route and opened the worksheet in the shared Workspace.
- All 60 paired slot instances and all 22 image instances loaded. Individual reveal, reveal-all/hide-all, and retained reveal state across TH/EN worked.
- Both languages were also loaded in 390px-wide iframe fixtures with the existing sheet controller. Each had 375px usable width after its native scrollbar, no horizontal document overflow, 20 question rows, and an answer space below every prompt. This verifies worksheet media-query layout, not the native iPad or the complete mobile Hub shell.
- Central print preview passed all four cases: TH blank/answers and EN blank/answers, **12 A4 pages in each case**. Each included all 30 selected-language slots, all 20 questions and all 11 images. The opposite language was absent.
- Blank previews had **zero answer elements**; full-answer previews had all 30 answers. No question was separated from its answer area and no page body overflowed. Returning from print preserved the teaching document's reveal state.
- Preview HTML snapshots and the per-page browser report were exported to ignored `qa-output/centre-mass-*` as QA evidence. This check did not export native browser PDFs; page counts refer to the central A4 preview. Native Safari/iPad/PDF-driver behavior remains a device check.
- The HTTP-only preview exposed an existing unrelated subject-menu `crypto.randomUUID` secure-context dependency. The authored bank deep link, shared worksheet controls and central print preview all worked. No production code was changed to accommodate that preview limitation.

Publication is verified separately against the actual GitHub Pages deployment marker and exact authored asset bytes; a local build alone is not a deployment claim.
