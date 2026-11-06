# PDF master v1.0 QA - 6 November 2026

Scope: one A4 portrait authoring master and its ionization layout example. These examples do not replace the Chemistry 10.3 learning sheet or quiz on the live Hub.

| Output | Pages | Visual inspection |
| --- | --- | --- |
| th-student | 2 | Both pages inspected |
| th-teacher | 3 | All three pages inspected |
| en-student | 2 | Both pages inspected |
| en-teacher | 3 | All three pages inspected |

All 10 final pages were rasterized with Poppler at a maximum dimension of 1300 px and inspected. Checked Thai glyphs, SVG equations and chemical charges/arrows, caption/table continuity, ICF/ICE row C emphasis, writing spaces, margins, running labels and page counters. The student editions contain no practice-answer blocks; worked teaching examples remain visible intentionally.

Programmatic verification passed for all four PDFs: A4 MediaBox, page count matching the report, subject/chapter/topic and Nix-century on every page, correct localized page/total counters, embedded approved text fonts (Thai/Latin only; no system fallback), no remaining TeX delimiters and report SHA-256 matching the PDF.

Content checks: 250 mL of 0.20 mol/L gives 0.050 mol; complete NaOH dissociation follows 1:1:1; 0.0100 mol/L Ba(OH)2 in 250 mL gives 0.00250 mol Ba2+ and 0.00500 mol OH-; HA with c0=0.100 and Ka=1.00e-5 satisfies the stated approximation criterion and gives approximately 1.00e-3 mol/L H3O+ and 1.00% ionization; 0.0200 mol Na with the supplied constant gives 1.204e22 atoms, rounded to 1.20e22. TH/EN question IDs and order match.

Checks run:

- `pnpm test:pdf:authoring`: 6 passed. Design/metadata constraints, immutable master hashes, language/question matching, student/teacher answer visibility, forbidden markup, space limits, local figure embedding and path traversal rejection.
- Actual renderer negative cases: an overlong header, invalid TeX and a question too tall for one page were rejected with errors. No font shrinking or clipping was used.
- `pnpm test:pdf`: 24 passed, including Drive preview URL selection and permissions-preserving link behavior.
- `pnpm build`: passed, including content validation, TypeScript and Pages artifact verification. Existing 33 draft warnings remain.
- `git diff --check`: passed.

Engine: MathJax 3.2.2, WeasyPrint 66.0, pypdf 6.10.0. Final template lock SHA-256: `25287ea49c256ca05b46598b0cfddc2a5a0cd4c08aa2b5aa0cbdadef42965507`.

Not tested: native iPad opening/printing, Windows/macOS rendering or uploading/accessing these generated examples through Google Drive. The existing live PDF demo was inspected; this change does not alter the viewer or upload example files to Drive. A PR is a source proposal, not a deployment.
