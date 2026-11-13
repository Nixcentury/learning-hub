# Translational equilibrium 4.3: corrected self-study revision

Append **exit ticket revision** to the existing 4.3 topic,
`b-d52412f9e1c700d9a5223472`, route `translational-equilibrium`.
Content ID: `physics-ipst-equilibrium-4-3-exit-ticket-revision`.
This is ungraded HTML using the established revision reader and print adapter.

Original v1.2 SHA-256:
`37329a642d10664ff39fec2a2e159756bb82036963e23a3d31f0bb1026551130`.
Corrected standalone v1.4 SHA-256:
`05f5223d1f94f761a0daf731810e2151a77aa5007cb5ca9673877d41fe687b9e`.

## Illustrated worked examples and factual Recall

The four existing numerical examples now show SVG free-body diagrams,
positive axes, signed components, substituted x/y equations, the solved
unknowns and a zero-resultant check. The examples cover an equilibrant,
symmetric ropes, separate bodies with limiting friction, and an angled
push. An additional incline diagram uses rotated axes and explicitly
resolves the weight. Solid force arrows and dashed components are distinct;
the resultant replaces the original forces and is not counted again.
The downward push has Fy = -15 N on its upward-positive axis.

All eight Recall prompts now ask for terms, formulas, directions or stated
rules. They do not ask why. All eight original answering spaces remain in
Quiz; the reading's final checklist is aligned with those factual topics.
The original cloze passage and ten practice questions, including their
answer spaces, are byte-for-byte unchanged in both languages.

Automated geometry checks verify the balance of the symmetric-rope,
separate-body, incline and downward-push FBDs, and the closure of the
resultant/equilibrant pair. Browser checks cover label clipping and formula
width inside the worked-example columns. The added visual teaching content
uses two additional reading pages in each language; Quiz page counts and
handwriting space heights are unchanged.

## Content corrections

- Distinguish a signed direction angle, measured counterclockwise from +x,
  from an acute reference angle used for component magnitudes. Explain why
  the x component at 120 degrees is negative while its magnitude is not.
- Keep the original incline scene but crop away the unrelated smooth-plane
  explanation and answer. Q7 explicitly specifies a rough stationary plane.
  Preserve the original three-force and traffic-light figure bytes.
- Add separate, labelled teacher FBDs for Q5, Q7 and Q10. In Q10, friction
  points down the incline because motion is impending uphill; tension is
  parallel uphill and the normal reaction is perpendicular to the surface.
- State the rope direction in Q10 (parallel to the incline) and worked
  example 3 (horizontal). The latter uses a light rope and an ideal pulley.
- Correct the unit placement under Q1's square root. Include both force
  balance equations before reporting the components.
- Correct the three-force activity reference to IPST Activity 4.2.
- Replace the two incline examples that closely repeated Q7 and Q8 with
  reasoning about actual versus maximum static friction and the sign change
  of kinetic friction. Retain four numerical worked examples covering
  distinct applications. The reading supports all seven cloze slots and
  eight Recall prompts without a numbered cloze answer key.
- Clarify that the downward force on the light knot in the symmetric-sign
  example comes from the vertical supporting rope; the sign's weight acts
  on the sign. Use approximation signs for sin/cos 37 degrees.

Independent recalculation of all ten questions and the source's six
numerical examples found no incorrect final numerical answer under the
intended geometries. Substitution into the force balances gave zero
residual to floating-point precision. Two numerical examples are now
conceptual method checks; the other results are retained.

| Question | Checked results (N unless dimensionless or degrees) |
| --- | --- |
| 1 | (-6,-8), magnitude 10, 53.1 degrees below left horizontal |
| 2 | F3 = (-5,-5 sqrt(3)), magnitude 10, direction 240 degrees |
| 3 | T = 13, angle from vertical 22.6 degrees |
| 4 | Vertical rope 49; T_AB = 29.4; T_BC = 39.2 |
| 5 | T_left = 28.3, T_AB = 20, T_right = 23.1, W = 11.5 |
| 6 | N = 70, f_k = 40, mu_k = 4/7 |
| 7 | N = 43.3, f_s = 25 uphill, mu_s,min = 1/sqrt(3) |
| 8 | N = 86.6, f_k = 17.3; P_up = 67.3, P_down = 32.7, both uphill |
| 9 | Horizontal T = 16, inclined T = 18.5, W_max = 9.24 |
| 10 | T = 20, N = 21.65, f_s = 7.5 downhill, mu_s = 0.346 |

Primary references: [IPST Activity 4.2](https://www.scimath.org/video-physics/item/8229-4-2),
[OpenStax vector components](https://openstax.org/books/university-physics-volume-1/pages/2-2-coordinate-systems-and-components-of-a-vector),
[OpenStax static and kinetic friction](https://openstax.org/books/university-physics-volume-1/pages/6-2-friction).

## Layout and exports

All eight Recall answering exercises remain at the end of **Quiz**. Reading
has no Recall answering boxes. The three print ranges are all, quiz and review.
Retain seven inline writing rules and all thirty separate calculation spaces
plus eight Recall spaces. Original calculation-space heights (34 or 41 mm)
are retained. The last subpart uses both columns; photographs sit beside
their stems. Image boxes reserve fixed geometry during pagination.

Equations are pre-rendered MathJax SVG and need no external script or math
service. The Hub import is inert HTML with separate language, edition and
range snapshots; student snapshots physically remove the answers.

| Language / edition | All | Quiz including Recall | Reading |
| --- | ---: | ---: | ---: |
| Thai student | 15 | 9 | 6 |
| Thai teacher | 15 | 9 | 6 |
| English student | 18 | 11 | 7 |
| English teacher | 16 | 9 | 7 |

Managed-browser inspection of the standalone final source covered all twelve
combinations / 128 page states: no vertical overflow, no missing images,
all student writing spaces retained. The revision regression suite covers
all twelve imported exports, student answer removal, immutable live reading
state, correct topic placement, source corrections and the existing revisions.
All 22 revision tests passed, including the previous chemistry, blackbody
and 4.2 exports. The production build passed and verified 919 identical
public files. Browser QA of the built Hub also passed all twelve print
combinations / 128 page states: no page-body overflow, no missing images,
zero answer nodes in student snapshots and all 38 student response spaces.
The actual topic menu opens the revision, and the trusted reader's Thai
answer toggle exposes all three teacher FBDs.

The original worksheet, two review quizzes and simulation remain available
in the existing 4.3 menu. No scoring or unlock logic is changed.
