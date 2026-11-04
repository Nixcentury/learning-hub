# 4.2 review visual sources

Prepared 2026-11-04. The quiz is bounded to the existing Hub learning sheet
`../../4-2-centre-of-mass-learning-sheet.html`: two experiments, CM/CG
definitions and relationship, symmetry examples, consolidation questions and
the four IPST understanding-check questions reproduced there.

## Existing assets reused without modification

The quiz references the original assets in `../4-2/`; it does not duplicate
or replace them. See that directory's `SOURCES.md` for source provenance:

- `book-apparatus.png`: apparatus illustration cropped for the existing sheet
  from IPST student book printed p. 6 / PDF p. 19.
- `lamina-apparatus.png`: apparatus photograph cropped for the existing sheet
  from IPST student book printed p. 9 / PDF p. 22.
- `book-lines.svg`, `lamina-hang-a.svg`, `lamina-hang-b.svg`,
  `lamina-hang-c.svg`, `lamina-result.svg`, `cylinder-question.svg`: the original
  explanatory geometry already used in worksheet 4.2, not measured data.

The original worksheet cites IPST Physics Book 2, section 4.2, printed pp. 5–10,
and the teacher guide, printed pp. 10–15. This review was authored against the
current worksheet; the four original checks retain their identity and scope.

## Nine quiz-specific SVG variants

These are vector adaptations of existing sheet diagrams. Geometry and book
motion are retained; no generative image or replacement photograph is used.
Language-specific descriptions live in bilingual HTML captions/context.

| Variant | Existing source | Treatment |
| --- | --- | --- |
| `book-a-1.svg`, `book-a-2.svg` | `book-case-a.svg` | Separate start/later panels using SVG viewBox crops; neutral A1/A2 labels; original book positions, force line and motion preserved. |
| `book-b-1.svg`, `book-b-2.svg` | `book-case-b.svg` | Same panel treatment for B1/B2; the original clockwise later rotation is preserved. |
| `uniform-ruler.svg` | `symmetric-objects.svg` | Crop object 1; retain 0 and 20 cm endpoints; replace the midpoint answer label with “?”. |
| `uniform-block.svg` | `symmetric-objects.svg` | Crop object 2; retain the original body diagonals. |
| `uniform-ring.svg` | `symmetric-objects.svg` | Crop object 3; retain the concentric-ring geometry. |
| `block-numbered.svg` | `symmetric-objects.svg` | Add leaders to 1: internal body centre, 2: visible-face centre, 3: front-face corner. The body-centre projection is the midpoint of opposite vertices. |
| `ring-numbered.svg` | `symmetric-objects.svg` | Add 1: circle centre in the void, 2: a material point between the inner/outer radii, 3: an exterior noncentral point. |

Separate book panels use the shared responsive two-column/one-column layout;
large diagrams use the existing static-image display convention. Original
sheet images and simulation code remain unchanged.

## Independent conceptual checks

- [Harvard Natural Sciences Lecture Demonstrations — Irregular Lamina](https://sciencedemonstrations.fas.harvard.edu/presentations/irregular-lamina):
  freely suspended lamina and plumb bob from the same support; repeated lines
  locating a fixed centre, including centres outside the material. No Harvard
  image or passage is copied.
- [OpenStax University Physics Vol. 1, 9.6 Center of Mass](https://openstax.org/books/university-physics-volume-1/pages/9-6-center-of-mass):
  meaning of a representative centre of mass and examples with no material
  at the centre. Its weighted-coordinate formulas and advanced calculations
  are outside this quiz's worksheet scope and are not assessed.

All hanging questions use the same body/mass distribution and the sheet's
uniform-gravity model. The ordinary settled hanging configuration has CG
below a distinct near-edge support. Single-line evidence is not presented
as locating a unique point; the third line is a check rather than an extra CG.
