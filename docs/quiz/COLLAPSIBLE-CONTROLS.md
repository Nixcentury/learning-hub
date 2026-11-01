# Foldable window and Quiz controls

The shared Workspace has a chevron beside each window title. It hides/shows the language, split-view, share, print and guide toolbar, along with the clock/timer area when folded. Close, minimize, maximize, title and the chevron remain available. Each window keeps its own fold state while open, including minimizing/restoring and language changes. Folding resizes the existing reading frame; it never recreates the activity.

The shared Quiz action dock uses a native details/summary control. Students can fold the full statistics/action area into “แสดงปุ่มทำข้อสอบ / Show quiz controls”, then expand it by tap, Enter or Space. Existing hint, give-up, review, navigation, skip and submission controls stay inside the panel. Fold state survives question/language rendering during the current player session. New windows/players start expanded so their actions are discoverable.

These are presentation choices only: no saved-attempt schema, scoring, AI evidence, progress or question data changes. PrintCore continues to print the authored content rather than the on-screen action dock. No Classroom service or database Rules changes.

## Validation — 2026-11-01

- `pnpm test:unit`: 579 passed, 0 failed. The new Workspace regression checks independent folding, original frame/draft retention, language updates and restore.
- `pnpm build`: passed; 662 public files verified. `git diff --check`: clean.
- Production-build browser preview, synthetic guest data: at 1024px split width, window headers shrank from 108px to 50px; the Quiz dock shrank from 278px to 48px. Both headers can fold independently. Expanding restored all original actions. Typed working survived folding and TH/EN rerendering; keyboard Enter restored the dock.
- At 390px, both stacked window headers measured 50px and the folded dock 48px; no horizontal Quiz overflow or window buttons outside their pane were observed.
- The production Workspace browser regression now checks actual header/frame height gains without reloading activities. The Hub review browser regression checks action-dock folding, language rerender retention, restored actions and retained Quiz working.
- Desktop viewport checks only; physical iPad/Safari and physical printer not tested. The managed HTTP preview uses compatibility shims outside the repository.
- Screenshot: ignored local QA artifact `qa-output/collapsed-controls-ipad.jpg`.
