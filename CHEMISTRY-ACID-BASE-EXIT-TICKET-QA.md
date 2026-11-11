# Chemistry 10.1–10.2: exit ticket revision

Prepared 11 November 2026 against main `d613917026996c598df8eedcbff3a463592e1b3c`.
These imported revisions use the existing sandboxed revision reader and A4 print
adapter introduced for chemistry 2.1–2.4. No runtime or scoring changes are needed.

## Placement

Each menu retains every existing learning sheet and quiz, and appends exactly one
final authored card named **exit ticket revision**, with `data-tool-kind="html"`.
The worksheet marks are for manual marking; no Hub score or submission is created.

| Topic | Bank key | Route slug | Pages per language (full / quiz) |
| --- | --- | --- | --- |
| 10.1 Acid–Base Theories | b-415092278077d3c2c4fb13b9 | acid-base-theories | 6 / 3 |
| 10.2 Conjugate Acid–Base Pairs | b-5e60aad52e28d90a4d818b29 | conjugate-acid-base-pairs | 7 / 3 |

Tool routes are `#chemistry/bank/<route-slug>/exit-ticket-revision`.
HTML resides in `public/content/chemistry/ipst/acid-base/`.

## Sources and content QA

The original uploads remain unchanged. The adapted documents are marked v1.2.

| Original upload | SHA-256 |
| --- | --- |
| Chem_M5_B4_10-1_AcidBase_Theories_Quiz_Review_TH_EN_v1_1.html | 15412d1e84b26b9a45af70d034e545e3ec4d4e357c8ee01fb00eb5ebaa6f659e |
| Chem_M5_B4_10-2_Conjugate_AcidBase_Quiz_Review_TH_EN_v1_1.html | 2c688ad2ac737d62d6db67d63ae74464edab36af2c4130e8c3b758bc3522eec7 |

Both language versions, all 13 questions and the marking guides were reviewed in
each topic. Each worksheet totals 20 manual marks. All 40 word-bank answer codes
across the two topics and languages match their respective options without reuse
within a passage. Reaction stoichiometry, charges, conjugate pairs and electron-pair
donor/acceptor assignments were checked.

Corrections made before integration:

- 10.1: distinguish proton transfer from electron-pair donation when forming a bond.
  Lewis acid/base behaviour does not mean an electron pair transfers as a free ion.
- 10.1: write Ca(OH)₂ dissolution as an equilibrium when solid remains; explain its
  limited solubility separately from the strong-base behaviour of the dissolved portion.
- 10.2: replace “both ions” with “both species”; H₂CO₃ is neutral.
- 10.2: specify the reverse HF reaction correctly: H₃O⁺ donates H⁺ to F⁻. Avoid
  implying that reversing the reaction makes HF itself a base.
- 10.2: identify proton donor/acceptor dual behaviour as amphiprotic in this context.
- 10.2: replace two leftover Thai labels in the English Q12 marking guide.
- 10.2: remove the severely cropped HCO₃⁻ example image in both languages. Its
  complete, balanced equations remain as typed text. Keep the two other diagrams.

Four retained diagrams are extracted and shared between TH/EN without changing
their original image bytes. SHA-256 values in `assets/exit-ticket/`:

| PNG | SHA-256 |
| --- | --- |
| 10-1-figure-1.png | 12dc71e08ae4ec14873ca784d9c7dd5631d29ab77b3cf53a3e6aefd69ce173c8 |
| 10-1-figure-2.png | c76f1f4a97ff65de05d0d5a4d5d255afae4d4ec8d33e9c8bbe3313b30f530ff7 |
| 10-2-figure-1.png | ac619ba412d024587b079223191d8b9d3e016c3b560db41262add0db4a6b18e8 |
| 10-2-figure-2.png | 15564e8d643bac8dc8b0a8926529716a546e19c79c7bc7c97fb81b3782d8aab8 |

Primary references used for QA:

- [OpenStax: Brønsted–Lowry acids and bases](https://openstax.org/books/chemistry-2e/pages/14-1-bronsted-lowry-acids-and-bases)
- [OpenStax: Lewis acids and bases](https://openstax.org/books/chemistry/pages/15-2-lewis-acids-and-bases)
- [OpenStax: precipitation and dissolution](https://openstax.org/books/chemistry-2e/pages/15-1-precipitation-and-dissolution)
- [OpenStax: compounds of oxygen](https://openstax.org/books/chemistry-2e/pages/18-9-occurrence-preparation-and-compounds-of-oxygen)
- [IUPAC: amphoteric](https://goldbook.iupac.org/terms/view/A00306)

## Integration and validation

Standalone scripts and controls are removed. The existing parent window controls
language, answer visibility and printing with no script permission in the HTML
frame. Only the selected language is printed; student snapshots physically remove
answer nodes. Print choices preserve the live reading state.

- Focused revision tests: 15 passed, covering all six integrated topics, menu
  placement, language, range, answer removal, image URLs and acid-base answer keys.
- Full unit suite (`pnpm test:unit`): 753 passed, 0 failed.
- Production build passed, including content validation, TypeScript and Pages
  verification: all 901 public files match; resources remain under `/learning-hub/`.
- Managed-preview Chromium Guest QA: 8 reading modes (TH/EN × student/teacher ×
  two topics), 52 page states; 16 print variants, 76 page states. Expected page
  counts, images loaded, no page or solution-box overflow. Student print variants
  have zero answer nodes; teacher variants retain 14 answer containers.
- Recovered uploads were checked against the same original hashes, and recovered
  10.1 integration was reconfirmed in the browser before completing 10.2 QA.

Browser validation covers the rendered A4 preview, not a physical printer or
native iPad/Safari printing. No classroom accounts, student records, Firebase rules,
bank identities or existing quiz data were modified.
