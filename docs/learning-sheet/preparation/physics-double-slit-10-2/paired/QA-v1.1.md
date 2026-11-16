# QA — writing space and complete derivations, v1.1

Follow-up to merged PR #198. Teacher requested larger working areas, full quantity names in prompts, restored diagrams/derivations and slightly fuller answers copied identically into Revision.

- Student problem/Recall pages now allocate remaining height to blank working areas. An unpaired last subquestion spans the full row. Measured the 26 problem answer areas: **26.2–66.0 mm** tall, compared with the original small fixed heights. Classroom blank examples similarly use spare page height. No writing rules or dots were added.
- Prompts for all 12 note examples use complete quantity names and units. Exit geometry/phase/coincidence prompts use full words instead of bare variable formulas. Symbols remain in derivations and worked solutions.
- Restored the geometry and adjacent-fringe diagrams from the supplied R03 HTML. Both full derivations are present in student and teacher Notes: distant-screen projection, small-angle geometry, bright/dark positions, subtraction of adjacent coordinates, central width, inverse rearrangements, and wavelength/frequency ratios.
- Added a short method explanation to each of the 12 worked examples. The complete answer Notes, figures and proofs remain identical between Classroom answers and both Exit editions. The print-snapshot regression verifies this and prevents proofs/reasoning from being dropped again.
- Classroom full/concepts editions: 9 pages; guided examples: 6. Exit full: 17 pages; Quiz + Recall: 8; Notes: 9. Same counts in Thai/English and student/answer editions.
- Re-measured all 24 final language/edition/range layouts in Chromium after fonts/images loaded: no vertical/horizontal overflow and no broken images. Updated `layout-report.json`. Visually checked the restored spacing figure/proof and the enlarged working spaces.
- Existing v1 public HTML and published assets are retained. Menu points to new `v1-1.html` files. Source content revision is 1.1. Existing `print-checks.json` belongs to the initial v1 checks, not a new native-print run.
- Focused content/sanitized-print tests: 3 passed; `pnpm build` passed. Physical iPad/Safari, native PDF saving and paper printing were not performed.
