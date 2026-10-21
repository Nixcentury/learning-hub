# Physics 4.1 Equilibrium learning sheet

Date: 21 October 2026 (Asia/Bangkok)
Base: `codex/bank-html-menus-20261021` at `ff346cd2fcbaafb8c450865999c31d313858e5b9`
Work branch: `codex/physics-4-1-equilibrium-sheet-20261021`

## Content and placement

- Independently written bilingual guided notes based on the three supplied photographs of IPST Physics Book 2, Chapter 4, section 4.1, printed pages 3–5. Publication year was not visible in the supplied pages.
- Source photographs are not copied into the repository. All SVG diagrams are newly authored.
- Adds the agreed prerequisite review of forces: book, suspended mass, two ropes, rough incline, rocket, secured ladder, touching blocks, rope-linked blocks and stacked blocks.
- The moving force examples specify constant velocity. Incline friction is explicitly kinetic on a rough slope. The ladder has a horizontal securing rope and smooth floor/wall. Stacked blocks have zero inter-block friction under the stated constant-velocity/no-other-horizontal-force conditions.
- Covers mechanical, static/kinetic, translational and fixed-axis rotational equilibrium. Separates whole-object translation from acceleration of individual points on a rotating object.
- Notes contain 68 semantic answer slots in each language. No standalone quiz questions or supplemental quiz are added in this round.
- Authored file: `public/content/physics/ipst/equilibrium/4-1-equilibrium-learning-sheet.html`.
- Stable new content ID: `physics-ipst-equilibrium-4-1-sheet`.
- Public catalog read on this date identified the physics topic `สมดุลกล(Mechanical Equilibrium)` as `b-746a471754733ee41d2e7c4d`, with path `ฟิสิกส์ (PHYSIC) / Learning hub / สมดุลกล(Mechanical Equilibrium) / สมดุลกล(Mechanical Equilibrium)`.
- Its bank menu contains one authored `learning-sheet` item, with no route slug. Quiz and Notebook remain system-provided. The catalog reported zero questions in this topic at the time of lookup.
- Published route: `https://nixcentury.github.io/learning-hub/#physics/bank/b-746a471754733ee41d2e7c4d/learning-sheet`.

## Automated checks

Runtime: Node.js 24.19.0; environment pnpm 11.25.0 (repository packageManager declares 11.19.0); dependencies installed using the frozen lockfile, with no dependency/lockfile changes.

- `pnpm test:bank`: 22/22 passed.
- `pnpm test:unit`: 279/279 passed.
- `pnpm validate:content`: passed, zero errors; 32 existing draft warnings outside the new lesson/menu.
- `pnpm validate:routes`: passed.
- `pnpm build`: passed, including TypeScript, catalog and Pages artifact verification.
- `git diff --check`: passed before commit.

## Rendered checks

The production build was served locally under `/learning-hub/` and opened in Chromium. The authored menu used a captured read-only response from the live public physics catalog. Firebase was stubbed to Guest with live writes forbidden.

- Bank topic menu opened the authored sheet in the existing Workspace.
- Both language blocks and all 136 slot instances loaded; no browser page errors.
- Per-slot reveal, reveal/hide controls and shared state when changing TH/EN worked.
- Neither language overflowed horizontally at a 390px viewport.
- The central print controls generated TH/EN × student/answers. Each student snapshot contained zero answer elements; each answer snapshot contained all 68 selected-language answer elements.
- Central print snapshots were exported as PDFs and rendered for visual inspection, including diagrams, headers/footers and continuation tables.
- Existing bank browser regression suite passed: chapter filters/search/TH-EN/empty topics, close-and-resume with the saved question revision, explicit reset, Back/Forward, blank/answer printing and narrow layout.

Environment adapters for browser checks were kept only in ignored `qa-output/`: a locally available Chromium executable, software rendering flags and a 100ms interaction delay for the existing regression suite's immediate navigation assertions. Product scripts and assertions were not changed.

## Publication and remaining device checks

Merged in [PR #2](https://github.com/Nixcentury/learning-hub/pull/2), publication commit `31e3fa8f71274193a6ab5b1de310554a120f360b`. [Pages run 39537683367](https://github.com/Nixcentury/learning-hub/actions/runs/39537683367) passed both build and deploy using the repository's pinned pnpm 11.19.0. Public `deployment.json` returned this exact commit, build time `2026-10-21T03:17:01.469Z`, and 334 public files.

The actual public GitHub Pages site was then checked in Chromium using Guest, with no service/Firebase stubs:

- The bank deep link and stable `#content/physics-ipst-equilibrium-4-1-sheet` alias opened the authored HTML in the shared Workspace; MathJax reported ready.
- Individual reveal, reveal all, hide all, and TH/EN shared reveal state worked. The Share dialog returned the bank learning-sheet URL above.
- Central print preview generated TH blank/answers (13 pages each) and EN blank/answers (14 pages each). Blank previews contained zero answer elements; answers contained all 68 selected-language answers.
- The actual topic menu kept system Quiz and Notebook. Quiz was disabled for the catalog's zero-question topic. Notebook opened with the correct bank context and its existing Guest/temporary-page notice, then the learning sheet reopened from the menu.
- Saved-revision resume, reset and legacy quiz regression checks used isolated fixtures in the built Hub; they were not performed against production student records or reported as a live quiz attempt.

Native iPad/Safari printing, Apple Pencil and real-account Cloud behavior require device/account checks. No production student records were read or written by the browser checks. No Apps Script, Sheet contents, endpoints, Firebase, Quiz engine, CI or outside-course content was changed.
