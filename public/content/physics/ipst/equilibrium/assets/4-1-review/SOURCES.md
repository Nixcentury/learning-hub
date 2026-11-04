# 4.1 visual force-identification review

Checked 2026-11-04. Diagrams and questions are independently authored teaching
material. The new situations are supplements, not claimed as original IPST
examples or a complete replacement for the textbook exercise inventory.

## Physics checks

- Existing Hub learning sheet `../../4-1-equilibrium-learning-sheet.html`,
  sections 1–7: named external forces; nine original force situations;
  static/kinetic equilibrium; separate translational and rotational equilibrium.
- Existing Hub `../../4-3-translational-equilibrium-learning-sheet.html`,
  section 4 “แตกแรงให้ตรงกับมุม แล้วรวมทีละแกน”: resolving forces and axis signs.
- [OpenStax University Physics Vol. 1, 5.7 Drawing Free-Body Diagrams](https://openstax.org/books/university-physics-volume-1/pages/5-7-drawing-free-body-diagrams):
  select a body; include external forces only; separate diagrams for separate
  bodies; replace a force with components without double counting.
- [OpenStax 5.6 Common Forces](https://openstax.org/books/university-physics-volume-1/pages/5-6-common-forces):
  normal perpendicular to contact; tension along a taut connector; incline
  weight components, with the angle measured from horizontal.
- [OpenStax 12.2 Examples of Static Equilibrium](https://openstax.org/books/university-physics-volume-1/pages/12-2-examples-of-static-equilibrium),
  Examples 12.3 and 12.5: uniform ruler CM at midpoint; support/contact
  locations; smooth-wall/rough-floor ladder force inventory. Numerical torque
  and friction-coefficient calculations from those examples are not used here.

## Photographs

| Local file | Creator and source | License | Local treatment |
| --- | --- | --- | --- |
| `book-photo.jpg` | Trey Jones; lightened Commons version by Till.niermann. [Blank book on a table](https://commons.wikimedia.org/wiki/File:Blank_book_on_a_table.jpg) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Commons 960 px thumbnail downloaded; no local pixel edits. Original uploader already removed cover text. |
| `ladder-full-photo.jpg` | Eli Pousson / Baltimore Heritage, 2018-01-06. [Peabody Institute ladder](https://commons.wikimedia.org/wiki/File:Ladder_leaning_against_the_wall,_Peabody_Institute,_1_E._Mount_Vernon_Place,_Baltimore,_MD_21202_(39542915101).jpg) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Commons 960 px thumbnail downloaded; no local pixel edits. |

Photos provide real-world context. Friction, uniformity, forces, lengths and
angles are explicitly specified model assumptions, not measurements inferred
from the photographs. Precision force arrows and labels appear in separate
SVG diagrams beside/below the photos.

## SVG provenance and conventions

- `book`, `single-rope`, `two-ropes`, `incline`, `rocket`, `ladder`,
  `touch-*`, `rope-pair-*`, `stack-*`: extracted from the existing, newly drawn
  SVGs in Hub sheet 4.1; numbers restart at 1 per quiz diagram. The question
  reference identifies the original sheet table and its different numbers.
- `beam`, `beam-load`, `ruler-cm`, `rough-ladder`, `smooth-unsecured-ladder`,
  `pressed-book`, `angled-pull`, `components-horizontal`,
  `components-vertical`, `incline-components`, `components-horizontal-60`,
  `two-ropes-30`: new code-native SVGs for this
  review. They are illustrative, not measured photographs or scale drawings.
- Extended rulers keep the actual application positions of weight, supports
  and added load. The two forces at a rough-floor foot remain distinct.
- `smooth-unsecured-ladder` deliberately has no rope or friction arrow. The
  question asks why this configuration cannot maintain static equilibrium.
- Components use dashed arrows for an original inclined force; the incline
  component picture greys the original W to show geometry without counting it
  again. Numerical values always come from the question, not arrow lengths.
- Numeric diagrams use the stated reference angles: the 40-N force is drawn
  60° above horizontal, and the symmetric support ropes 30° above horizontal.
- Large new diagrams use the existing `img[data-bank-svg]` display convention
  outside the small photo `figure` layout, so they remain legible without
  adding quiz-specific CSS or embedding repeated SVG markup in the quiz.
