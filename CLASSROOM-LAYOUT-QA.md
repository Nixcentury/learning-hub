# Classroom workspace layout — phase 1

Agreed scope (2026-10-31): left = work to do next; center = teacher assignment posts; teacher tools at the top right; lesson monitoring below those tools. Existing classroom data, permissions, grading, submission and CSV services remain the source of truth.

## Result

- A single-column assignment feed shows teacher posts with instructions, due date, status, a selection button for teachers and quiz actions.
- Teacher management is grouped in the right column: assign, edit, close, scores, CSV and the existing enable-submissions recovery action. Every contextual action names and targets the selected assignment.
- Editor and assignment/results views open in separate native dialogs, preserving the center feed. Deep links still open their assignment details. Private drafts remain in the teacher's left panel.
- The left learning path keeps every published assignment in publication order, including submitted and teacher-closed work. Numbered steps show only the current student's status and submitted percentage, or actual submission counts for the teacher. Drafts remain separate and teacher-only.
- Each step can open its authored chapter or question-bank lesson menu through the Hub's existing navigation. Shortcuts follow catalog parent relationships and are derived in memory; assignment records are unchanged. Quiz names and filenames do not determine the chapter.
- A separate collapsible Classroom links panel reserves the requested + link area. The button is visibly unavailable with an explicit saving-not-enabled note; room Sheet storage remains a later task.
- The existing monitoring panel moves below the right-hand tools; students can access the existing teacher-message dialog from the panel. Account/room changes and role revocation clear private views.
- Below 1180px the side panels collapse by default and can be opened independently. Teacher tools remain accessible above the feed. Existing Hub colors, typography and controls are reused.
- Room header and join code remain available in a compact desktop row; the ordinary teacher roster is collapsible. Scores open directly at the gradebook.

## Validation

- `pnpm test:unit`: 554 passing, including prerequisite thresholds/history, config validation, locked/loading UI, retained steps, private status, catalog-derived shortcuts, write-free lesson navigation, toolbar IDs, role revocation and monitoring-control isolation.
- `pnpm build`: content, TypeScript, Vite and 658-public-file artifact checks pass.
- Changed JS/test files: targeted oxlint and `git diff --check` pass.
- `scripts/test-classroom-layout-browser.mjs` checks the built Classroom page in Chromium with a same-origin parent supplying explicitly synthetic QA context. It exercises desktop columns, scores/editor dialogs, CSV, student privacy, collapsible panels at 1024/768/390, TH/EN, empty/offline states and account/role changes. Screenshots use the `classroom-monitor-layout-` prefix in the Classroom workflow artifact.
- Existing real-emulator integration selectors follow the relocated controls; the monitoring workflow retains the complete Rules/SDK/browser regression suite.
- See the PR's current GitHub checks for browser outcomes. No school-account authentication or live Firebase/Google data is used in these tests.

## Deferred work

Shared practice/homework saves, student posts/comments, groups and Sheet storage are separate tasks. Prerequisite configuration and the >50% submitted-work gate are described in [CLASSROOM-PREREQUISITES.md](CLASSROOM-PREREQUISITES.md).

Assignments default to no prerequisite. The path distinguishes teacher-closed work from work awaiting a prerequisite; posts remain selectable for instructions and results. A passing submitted result or history (>50%) opens the dependent work. The displayed sequence uses publication time with ID as a tie-breaker; custom reordering remains later work.

## Monitoring browser regression (#91)

Native dialog and click traces reproduced the old red check after #88/#90: messages were closed after acknowledgement, but the next mobile quiz-choice locator click hit the fixed lesson-banner button, reopened messages and left the answer map empty. A pre-click screenshot and hit checks also showed that centering the choice places it under the quiz's sticky action dock in this short iframe. The preservation scenario now waits for cloud readiness, scrolls the choice above that dock and sends a real pointer click at its visible center after checking hit targets in both the Hub and quiz documents. It then verifies the selected choice, a nonempty answer map and closed messages before opening/closing messages and comparing the answers. The complete integration scenario remains; no forced clicks, hidden overlays, production changes or skipped assertions are used.
