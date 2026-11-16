# Replace Question 7 with counting nodal and antinodal lines

Teacher approved replacing a repeated geometry question rather than adding questions/pages. Question 12 retains the far-field, non-small-angle geometry practice.

Question 7 now gives two in-phase water-wave sources, separation 24 cm and wavelength 10 cm. Start from the physical bound 0 ≤ path difference ≤ source separation. Apply the taught antinode condition to obtain integer orders 0,1,2; count one central line and two lines for each nonzero order: 5 total. Apply the node condition to obtain integer orders 1,2; count both sides and no central node: 4 total. The selected values avoid an order exactly at the limiting path difference.

The question, detailed solution, printed self-check answer and guide are updated in both languages. The formula reference includes the path-difference bound. Stable topic/tool/content routes remain unchanged; the new semantic slot is `count-node-antinode-lines`. The guide's geometry step now references Question 12, and its source-phase step references counting in Question 7. Revision and source fingerprint are updated.

All eleven other question blocks, including prompts, printed final answers, detailed workings and writing areas, are byte-for-byte identical after DOM serialization. A backup is kept in `basic-calculations-before-count-lines.html`.

Checks:

- Seven focused sheet/print tests passed, including independent integer-order enumeration, both languages, all twelve printed final answers, blank-edition answer isolation and unchanged other questions.
- `pnpm build` passed content/guide validation, TypeScript, Vite and Pages verification; `git diff --check` passed.
- Actual Hub print preview in Chromium, default A4 layout: Thai blank **7 pages**, Thai answers **7**, English blank **8**, English answers **8**. These are unchanged from the preceding printed-self-check version. All four copies contain 12 questions and 12 printed final answers, with no MathJax errors.
- Inspected the new English answer copy in the print preview: all allowed orders and the 5/4 total-line result are visible. Counts and readiness messages are recorded in `count-lines-print-checks.json`.
- Native PDF export, physical paper printing and a physical iPad/Safari session were not performed.
