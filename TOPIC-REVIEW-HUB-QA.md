# Review library inside Learning Hub

Local validation: 23 October 2026, starting from main `f997587`.

Physics and Chemistry bank headers open the review library in the existing Hub
workspace. One review window follows subject/topic selections. The original
chapter controls, bilingual rendering, answer toggles and printing remain in
the player. Back/Forward and the existing Share buttons use the selected topic.

Routes:

- `#physics/review` and `#chemistry/review` open the library.
- `#<subject>/review/<published-bankKey>` opens a topic in that same window.
- Existing authored `#<subject>/bank/<bankKey>/review` reading routes and old
  standalone player URLs remain available.

The player uses the existing published bank catalog and authored review mapping.
No bank/question/storage IDs, Sheet service, Apps Script or quiz data are changed.
Its Hub bridge accepts only validated subjects/topic IDs and language. It does
not receive the learner identity or access the Quiz storage bridge. Selection
messages require a live registered review frame, same origin and current command.

Validation completed locally:

- `pnpm test:unit`: 333 passed, 0 failed.
- `pnpm build`: passed, including content validation and Pages artifact checks.
- `QA_BUILT=1 pnpm test:review:browser`: passed against the actual built Hub,
  navigation, workspace, bank, Quiz and review engines with isolated fixtures and
  fake public-bank/Firebase edges; no live accounts or database writes.
- Both bank buttons open a workspace without a new browser tab.
- Changing topics updates the canonical URL; Share carries the selected topic
  without identity/session parameters; Back/Forward restores the corresponding
  content in the same frame.
- Switching Chemistry/Physics, language and chapter/topic controls works in the
  same window. Missing topics show an explicit notice.
- Answer toggles and the actual Print Core output retain the displayed answers.
- Returning to a real Quiz preserves its iframe, answer and typed reasoning.
  The Quiz review dialog reads the same authored review as the library.
- A fresh shared-link visit passes the Guest gate and reloads the intended topic.
- Stale/unregistered-frame selection messages cannot change the Hub location.
- Legacy standalone player URLs still render correctly.
- Desktop and 820 px tablet layout inspected. Screenshots are ignored QA outputs.

This checks Chromium and the built Pages site, not native Safari/iPad or real
account/cloud operation. Deployment status is tracked by the workflow for the
commit containing this change; verify `deployment.json` and the live asset bytes.

Usage and handoff: `TOPIC-REVIEW-START-HERE.md`, `docs/topic-review/README.md`.
