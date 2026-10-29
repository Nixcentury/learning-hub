# Shared YouTube video player — validation

Base: `Nixcentury/learning-hub` main `84276df517ba922c968513ad254afbff51277713`.
The isolated checkout's complete starting tree matches upstream tree `abe866658fca68d339b597917e4fc17cb9f82467`.

## Implemented

- One owned video player in the existing Workspace. Its outer frame and toolbar use the current Hub theme; YouTube owns the playback controls.
- Declarative `data-hub-video` anchors/buttons in owned Hub pages, read-only lessons, learning sheets, native Quiz rich content and authored Simulations.
- `data-tool-kind="video"` entries in chapter/topic menus and optional bankKey menus; canonical share routes and existing content identity/conflict checks.
- Normalized HTTPS YouTube links, optional start times, stable window identity and data-only drafts. Each different clip needs its own content ID.
- User-initiated playback, pause on minimize/return-to-menu/tab hiding, no autoplay on restore, same player across TH/EN changes, cleanup on close, persistent “Open in YouTube” fallback.
- API loads only when the video tool is opened. Player URLs and messages contain no account/answer context. Quiz content/storage logic and all authored Simulations remain unchanged.
- Authoring guide, reusable blank template and tests. No lesson was assigned an unrelated sample video.

## Checks

- Node 24.22.1, pnpm 11.19.0 using the existing frozen dependencies; no new runtime dependency.
- Full unit suite: **436 passed, 0 failed**, including 15 new video contract/player/Workspace tests.
- Workspace integration uses the actual DOM event handlers with an iframe transport substitute: root button, nested lesson/Quiz/Simulation, single-window reuse, pause/restore/menu, close, preserved source DOM, blank drafts, source conflicts, language state and no account-context message to video.
- Player tests run actual player code with a YouTube API substitute: normal load, blocked embed, API script failure/timeout, invalid input, late readiness after minimize and trusted message source checks.
- Route-catalog validation passes: 10 sections, 80 chapters, 19 topics, 41 existing HTML-menu contents, 153 legacy placements. Video routes across menus and multiple source documents are tested in memory.
- Production build, TypeScript check and Pages artifact verification pass. 646 public files match their authored sources. Content gate: 0 errors, 33 draft warnings (32 existing and the deliberately blank video template).
- New video modules/tests pass targeted Oxlint. The broader touched-file lint run also reports three pre-existing diagnostics in the local-path checks/descriptor validation of `route-catalog.mjs` and `validate-activity-content.mjs`; those checks are unchanged.
- `git diff --check` passes.

## Limits

This is automated model/DOM validation, not visual browser QA. A Chromium executable is not installed in this environment. Live YouTube playback, real network failures, Safari/iPad touch/fullscreen behavior, physical printing, Firebase accounts and deployment were not tested or claimed.

After deployment, use a real teacher-selected embeddable clip to check desktop and iPad: open from a lesson and native Quiz; play/pause; minimize and restore; switch TH/EN; resize/fullscreen; close/reopen; and try the YouTube fallback. A clip owner's embed restrictions still apply.

This change is prepared on a review branch. It does not merge itself or publish the website.
