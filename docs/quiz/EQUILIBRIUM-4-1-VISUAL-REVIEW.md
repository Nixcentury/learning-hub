# 4.1 visual forces and equilibrium review

The `practice-4-1` route previously opened 13 choice questions. It now opens
36 worksheet-aligned questions: 24 drag/tap questions (75 gaps), 6 numeric
questions and 6 reasoning choices. The introductory emphasis is identifying
external forces on a selected body before writing equilibrium equations.

The existing worksheet 4.1 sections 1–7 remain intact. New bilingual sections
8–9 supply uniform-ruler, support/load, changed-surface and component concepts
before they are assessed. New situations are explicitly marked as independently
authored supplements, not original IPST questions.

## Files and integration

- Topic menu: `public/content/bank/physics/b-746a471754733ee41d2e7c4d.html`.
- New content: `public/content/physics/ipst/equilibrium/4-1-forces-and-equilibrium-review.html`.
- New activity ID: `physics-ipst-equilibrium-4-1-visual-review` keeps legacy
  attempt data separate from the substantially different new questions.
- The old `4-1-equilibrium-quiz.html` is retained unchanged as source/history;
  it is no longer the destination of the current topic menu.
- The existing Review button opens worksheet 4.1 using the paired-view
  integration. Each question also names the reading section/table/subcase.
- Component questions link “ศึกษาการแตกแรงเพิ่ม” to existing worksheet 4.3,
  section 4, rather than implying that Review changes its destination per
  question or automatically scrolls to a heading.
- No shared quiz engine or other topic is changed.

## Question and reading map

| Questions | Focus | Worksheet 4.1 location |
| --- | --- | --- |
| 1 | Book on a table; force agent/receiver | 1; 2 Figure 1 |
| 2 | Mass lifted at constant velocity | 2 Figure 2 |
| 3 | Two inclined ropes | 2 Figure 3 |
| 4 | Sliding down a rough incline | 3 Figure 4 |
| 5 | Rocket rising steadily | 3 Figure 5 |
| 6 | Smooth floor/wall with a securing rope | 3 Figure 6 |
| 7–8 | Touching blocks, isolated A then B | 4 Figure 7, separate tables |
| 9–10 | Rope-connected blocks, isolated A then B | 4 Figure 8, separate tables |
| 11–12 | Stacked blocks; zero interblock friction under stated conditions | 4 Figure 9 and its key point |
| 13 | Uniform ruler across two supports | 8.1 |
| 14 | A separate block pressing on the ruler | 8.2 |
| 15 | Rough floor/smooth wall without rope | 8.3 |
| 16 | Downward-pressed book | 8.4 |
| 17 | Box pulled with an inclined rope | 8.4 |
| 18 | Uniformity, midpoint CM and support positions | 8.1 |
| 19–20 | Component formulas for horizontal/vertical reference angles | 9.1; additional 4.3 section 4 |
| 21 | Weight components on incline axes | 9.2; additional 4.3 section 4 |
| 22 | Signed force sums on two axes | 8.4; 9.3; additional 4.3 section 4 |
| 23 | Static/kinetic equilibrium | 5 |
| 24 | Translation/rotation conditions | 6–7 |
| 25 | 80-cm ruler CM: 40 cm | 8.1 |
| 26 | 40-N force, 60° above horizontal: F_x = 20 N | 9.1 |
| 27 | 25-N force, 60° from vertical: F_y = 12.5 N | 9.1 |
| 28 | 60-N weight, 30° incline: downslope component = 30 N | 9.2 |
| 29 | 60-N load, symmetric ropes 30° above horizontal: each T = 60 N | 2 Figure 3; 9.3 |
| 30 | 4-kg book plus 15-N downward press, g = 10: N = 55 N | 1; 8.4 |
| 31 | Normal and weight are not a third-law pair | 1; 8.4 |
| 32 | Why interblock static friction can be zero | 4 Figure 9 key point |
| 33 | Why an unsecured inclined ladder cannot rest on two smooth contacts | 3 Figure 6; 8.3 |
| 34 | Constant speed while turning is not constant velocity | 6–7 |
| 35 | Fixed-CM fan speeding up: translation versus rotation | 7 comparison table |
| 36 | Avoid counting a force again after resolving it | 9.1; 9.3; additional 4.3 section 4 |

## Content conventions

Each force question specifies its chosen body, contact/friction conditions,
rope assumptions and relevant motion. Numbers label arrows; several forces
can share one contact point. Ruler diagrams retain application locations.
Arrow lengths are not a force-magnitude scale. No torque or friction-coefficient
calculation is required. Uniform ruler CM at L/2 assumes uniform mass per unit
length and uniform gravity; it is not generalized to arbitrary rulers or
loaded composite systems.

All questions have TH/EN hints and explanations. Each drag question has at
least two unused distractors. Each reasoning choice has five options. Numeric
units are separate from the input; absolute tolerance is 0.01 in those units.
Calculations and drawing geometry were checked independently.

The set uses 27 SVG diagrams and two real CC0 photographs with visible source
credits. See `public/content/physics/ipst/equilibrium/assets/4-1-review/SOURCES.md`
for primary references, photograph licenses, diagram provenance and modeling
limits.

## Validation

- Production build: content/guide validators, TypeScript, Vite and Pages
  resource verifier passed. Existing draft warnings remain unrelated.
- Existing focused tests: 92 passed across drag, numeric, review-link,
  learning-sheet and bank-menu suites.
- Actual content adapter: all 36 questions loaded; all authored correct keys
  accepted; distractors/wrong numbers rejected; 75 gaps; 29 unique visual
  files exist; five-option cloned text has both languages.
- All six numeric answers independently recomputed using the problem data.
- All original 136 bilingual answer slots retained byte-for-byte as DOM
  fragments; seven new slots per language added in sections 8–9.
- Desktop browser, standalone player: all 36 questions loaded, Thai/English
  switched, photo/diagram images loaded, correct drag matching and reread
  confirmation worked. A typed numeric answer survived reload. Three drag
  answers, one numeric answer and one choice produced the expected 5/36
  demonstration result, with the remaining questions unanswered.
- Paired Review source/ID/Pages URL was checked through the actual configuration
  helper. Full Hub window pairing could not be exercised in this HTTP preview:
  the Hub initialization requires secure-context `crypto.randomUUID`. The
  production HTTPS path and shared engine are unchanged. Browser QA used the
  standalone player; no claim of a full Hub pairing or mobile-browser test.
