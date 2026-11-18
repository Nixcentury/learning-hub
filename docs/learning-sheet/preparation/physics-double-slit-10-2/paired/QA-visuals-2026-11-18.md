# Focused diagrams QA | Double-slit 10.2 | 2026-11-18

## User-requested scope

- Add a single three-panel visual to theory formulas (13)–(15): N centres versus N−1 gaps, signed-coordinate separation and measurement-versus-theory percentage.
- Illustrate Examples 10–12 respectively: coincident fringes of two colours, separations on the same/opposite sides, and the angle-to-screen geometry.
- Preserve every other example, existing equations, Quiz/Recall, solutions, bilingual editions, local images and route identities.

## Math and reading check

- Formula (13): five bright centres contain four intervals (not five).
- Formula (14): positions −2 mm and +3 mm are 5 mm apart; Example 11 with Δx=4 mm has B1=±4 mm, D2=±6 mm, B3=±12 mm, giving 2, 10 and 24 mm as requested.
- Formula (15): measured 5.2 mm versus theoretical 5.0 mm gives |5.2−5.0|/5.0×100%=4%. The denominator must be nonzero.
- Example 10: D3 at (3−1/2)λ1 L/d and B2 at 2λ2 L/d give λ1/λ2=4/5 at the same location.
- Example 12: mλ/d=0.150; θ≈8.63°; x=Ltanθ≈75.9 mm. The far-field fringe relation is approximate; the tangent step avoids the extra small-angle approximation.

## Static source and published-file checks completed

- Added four self-contained, local SVG assets. No remote images, scripts or interactive controls.
- Modified the canonical Notes source and both published HTML handouts, so the Exit Ticket and Classroom Note use the same figures.
- In each HTML output, the four image paths appear 8 times each across language/edition/range copies; example numbers and equation (13)–(15) counts remain unchanged (8 each). The captions appear in both Thai and English.
- Updated the canonical-source digest in both HTML files and in build-record-v1.3.json.
- Added a focused test to scripts/double-slit-paired.test.mjs checking the figures in both languages and answer editions.
- Kept A4 diagram heights compact (20–22 mm maximum). Tightened only the page-local margins around the measurement section and final examples, with no font-size reduction to body text.

## Browser/print checks still required before merge

1. Open the Learning Hub HTML Center in Thai and English, Classroom Note and Exit Ticket.
2. Inspect Exit Ticket Revision Notes pages 12, 17 and 18 and corresponding Classroom Note pages 6, 11 and 12 at A4 (100%). Confirm no clipping at the header/footer or page boundary.
3. Print the **Notes** selection and compare both languages; verify diagram labels stay legible in monochrome as well as colour.
4. Toggle student/teacher solutions and verify only answers hide; diagrams should remain.
5. Open on an iPad in Safari and check scrolling and print preview.

**Verification limit:** Static source/output checks were performed with the connected repository. This session did not run the repository's Node unit-test suite, the original offline layout renderer or live iPad/browser printing. Page-fit assumptions are not a certified A4 print result.
