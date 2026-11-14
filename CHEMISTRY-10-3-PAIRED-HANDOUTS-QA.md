# Chemistry 10.3 — paired Classroom Note and Exit Ticket Revision

14 November 2026. Import of the user's approved paired HTML v1.8 into the existing Learning Hub topic `b-c667274676708616e5923b20` (`acid-base-ionization`). No new teaching content or questions were authored during this import.

## Published entries

- **Classroom Note · 10.3** replaces the prior Classroom Lecture entry. The `basic-calculations` tool key, content ID `chemistry-ipst-acid-base-10-3-basic-calculations`, canonical route and public HTML path remain. `classroom-note` is an additional route alias.
- **Exit Ticket Revision · 10.3** is a new ungraded HTML entry, content ID `chemistry-ipst-acid-base-10-3-exit-ticket-revision`. It follows Classroom Note in the same topic menu.
- The existing combined learning sheet, video and review quiz remain separate entries. Student scores and stored answers are not part of these two documents.
- The superseded Classroom Lecture HTML and guide are preserved in `docs/learning-sheet/preparation/chemistry-ionization-10-3/superseded-classroom-lecture/`. The new Classroom document uses the shared A4 revision engine, so the obsolete learning-sheet guide is archived with its original source.

## Source identity and import

| Approved input | SHA-256 |
| --- | --- |
| `Chem10_3_Classroom_Note_TH_EN_v1_8.html` | `8c6dc8aceec6851e6abc0a22fd7c93927c08865ace52dd15c80222365d5f02b5` |
| `Chem10_3_Exit_Revision_TH_EN_v1_8.html` | `3ce524054a44b0b3a50e05ac0dbfd336df7d8d5acacb1f50533e4ff338c73871` |

The Hub keeps read-only HTML frames without scripts. The standalone template/runtime was therefore converted into independently paginated, static TH/EN × student/answers × full/problems-or-examples/notes editions. Existing trusted Hub controls switch language and answers and build sanitized print snapshots. All approved LaTeX source sequences and MathJax SVGs in each full print edition are preserved. Roboto and Noto Sans Thai fonts are extracted unchanged into local `assets/10-3-paired/` files; there is no CDN dependency.

Classroom keeps its Notation table and native individual answer disclosures. Disclosures expand the reading page when opened; student print snapshots remove them completely. Global answers use the independently paginated answer edition. The new documents default printing to the student edition regardless of the reading answer state. Document-specific print labels distinguish Classroom examples/lessons from Revision problems/Notes, while old revision documents keep their defaults.

## Content and page checks

| Document | TH student | TH answers | EN student | EN answers |
| --- | ---: | ---: | ---: | ---: |
| Classroom Note | 10 | 13 | 10 | 14 |
| Exit Ticket Revision | 15 | 17 | 17 | 19 |

These are WeasyPrint 70.0 page counts, not a claim of identical native browser pagination on every platform.

### LaTeX correction after user review — web revision 1.8.1

The upstream v1.8 inputs contained a literal tab followed by `imes` in the hydroxide concentration `2.0\times10^{-5}\,\mathrm{mol\,L^{-1}}`. MathJax accepts that as ordinary letters, so checking only parser errors or equality with the upstream TeX did not catch the mistake. The web correction restores the command and regenerates the SVG and ARIA label in all eight occurrences per document (TH/EN, student/answers and relevant print ranges). The source hashes above identify the original inputs; this repair is an explicit exception to unchanged upstream TeX preservation.

Regression checks reject control characters and the stray `imes` token in every formula of both current documents, require all 16 corrected copies, and inspect the regenerated SVG for the multiplication glyph. No question data, numerical answer, page grouping or stored content ID changes.

- 24 independently paginated states: unit order and uniqueness preserved, no fragmented units or horizontal/height issues in the measured source flow.
- 24 sanitized print selections exercised through the real Hub snapshot/edition/range functions. Student snapshots contain no teacher keys or individual answer disclosures; answer snapshots contain no writing spaces. The teaching document remains unchanged.
- Classroom: Notation, 30 note points and 10 worked examples retained. Revision: two cloze articles, nine main problems, 28 subparts, 30 reading points, four visible reading examples and 18 Recall prompts retained; no Notation table.
- The Revision Notes section begins on an odd page in the full duplex sets. Page numbers are regenerated for the chosen subset.
- Eight full-set print snapshots rendered again after Hub sanitization: page counts preserved, no measured vertical content overflow. Contact sheets reviewed for TH Classroom student, TH Revision student and EN Revision answers; formulas, multipart frames and the Notes/Recall transition remain legible.
- A streaming newline counter replaces repeated full-prefix scans in the metadata reader. This keeps source-line diagnostics unchanged while allowing long MathJax SVG documents to be validated and cataloged efficiently. Regression coverage includes comments, raw style blocks, multiline attributes and malformed closing tags.

## Verification and limits

Local production build, content/guide validation, route catalog and unit checks are recorded in the accompanying pull request. Production artifact verification confirms every public file is copied unchanged below `/learning-hub/`.

The cloud-browser preview was unavailable due to its access policy. This import does not claim a successful live browser, Safari/iPad, native print-dialog or physical duplex-printer test. Existing GitHub Actions checks and Pages build/deploy must be inspected before describing the change as published.
