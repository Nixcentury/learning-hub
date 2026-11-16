# QA v1.2 — choose a taught condition, rearrange, then check integer order

Follow-up to merged PR #199, keeping the existing writing space, figures, derivations and shared answer Notes.

- Removed the auxiliary q from the current Notes. Both bright/antinode and dark/node conditions now use order m, with explicit ranges: bright m = 0,1,2,…; dark m = 1,2,3,…. Diagram labels and Recall/solution formulas use the same notation.
- Example 1 starts with the selected condition, rearranges for m, substitutes the given values, checks the allowed integer range, then identifies the fringe. The 1250 nm case also explains why m = 2.5 from the bright formula is rejected rather than called bright order 2.5.
- Example 4 does the same from a screen position or angle. Exit Problem 2 starts from the conditions too; its neither-extremum subpart rejects both noninteger candidates, 2.25 and 2.75.
- “Two waves” now guides comparison at the same point/time and connects the arriving phase to the bright/dark condition. The short observation uses the spacing equation, states controlled variables, rearranges to a constant product, and explains direct/inverse changes.
- Classroom answers and both Exit editions still share exactly the same complete Notes. New public v1-2 files preserve v1/v1-1 and their assets. Nine note pages, 17 full Exit pages, eight Quiz/Recall pages; fonts and writing spaces unchanged.
- Four focused content/print-contract tests passed. The added test checks that no q is introduced, both original conditions precede their rearranged order expressions, and noninteger orders are rejected.
- All 24 Thai/English, blank/answer, print-range layouts measured in Chromium: no page-body overflow or broken images. Evidence: `layout-report-v1.2.json`. Visually inspected the revised Example 1 and opened that same filled note in the student Exit edition. Native PDF saving and physical iPad/Safari/paper printing were not tested in this round.
- `pnpm build` passed content/guide validation, TypeScript, Vite and Pages checks. Existing draft warnings remain unrelated. `git diff --check` passed.
