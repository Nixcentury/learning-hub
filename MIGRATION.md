# Learning Hub repository migration

## Baseline

- Source: `Nixcentury/Physic-subject`, folder `LEARNING HUB`.
- Source commit: `f38ff4e33177da3786cc7933bc0c37e01d4e202a` (clean checkout).
- Imported 169 tracked files; byte content checked against Git, allowing Windows line-ending conversion only.
- Initial local import commit: `57bfdb6`.
- Original teaching files and the `LEARNING HUB` source folder are unchanged. The original repository's Pages workflow and root landing page are updated as described below.
- Firebase data/Rules, accounts, AI Worker, content IDs and question IDs are unchanged.
- Earlier `ROUND-*` documents are historical records; their original URLs describe the old deployment.

## Build decisions

- Keep the active HTML-based `vite.config.js`, relative `base: './'`, and both Hub/admin entry points.
- Remove the unused competing `vite.config.ts` in this new copy only. It is recoverable in the import commit and the untouched source repository.
- Commands explicitly select the canonical JS config.
- Local and CI runtime is Node.js 24; the existing test-isolation flag is not supported by Node.js 22.
- Publish only `dist`, rebuilt from scratch; never merge the legacy repository.
- Validate that every public file matches its published copy, and local HTML resources resolve under `/learning-hub/`.
- `deployment.json` identifies the published commit. A failed build must not be confused with browser caching.
- Firebase and AI are not reconfigured as part of migration. Automated smoke tests must not write to live services.

## Migration release checklist

- [x] Snapshot and separate local repository.
- [x] Baseline: 170 unit checks and production build pass.
- [x] New build, 82 matching public files, and `/learning-hub/` browser smoke checks.
- [x] Create the empty Public repository `Nixcentury/learning-hub`.
- [x] Explicit user approval to publish source code, questions and solutions publicly (20 September 2026).
- [x] Push, enable Pages, and verify deployed commit: initial standalone release `5da6e28`.
- [ ] Real-device login/notebook/AI/Classroom checks (existing limitations documented separately).
- [x] Decouple the original repository's publishing workflow after the new Hub is verified: `Physic-subject` release `3f7d54c`.
- [x] Test add/update/removal using disposable fixtures, then choose the new repository as the only active Hub source.
- [x] Compare representative live legacy resources and new Hub resources against tracked source; all checked URLs return HTTP 200 with matching contents (text line endings normalized).
- [x] Update authoring instructions for the new folder and the actual, partially populated chapter menus.

Deployment and automated migration checks are complete. Real-device/service acceptance is a separate remaining check, not a claim that Apple Pencil, AI or production Classroom has been certified.

## What happens to old links

- Standalone teaching files retain their original `/Physic-subject/` paths. They are packaged directly from tracked files with no Hub build or dependency install.
- The old root page links to `https://nixcentury.github.io/learning-hub/`, retaining the selected subject hash. It is a landing page, not an automatic HTTP redirect.
- 88 frozen public files under `.github/hub-compat/` in the old repository retain old Hub tool pages, content fragments, shared scripts, styles, fonts and hashed assets. They are published at their former paths without the `.github/hub-compat/` prefix.
- Frozen compatibility files do not receive future Hub changes. Author new content only in this repository; do not edit two active copies.
- Packaging uses a fresh artifact folder, checks copy equality and path collisions, and excludes source-only Hub and workflow folders.
- This does not promise to restore links whose source was already absent before the migration.

## Rollback

The original `LEARNING HUB` source remains available in `Physic-subject` and in the local baseline archive. Its original workflow is available at `f38ff4e`.
If a rollback is needed, review and revert the specific deployment change before publishing; do not overwrite teaching files from the new copy, reset unrelated commits, or clear browser storage.
This repository starts with an import commit. Earlier full history remains in `Physic-subject`.

## Local verification

- `pnpm install --frozen-lockfile` succeeded without dependency changes.
- `pnpm test:unit`: 170 passing tests, no live services.
- `pnpm build`: content validation, TypeScript, Vite and published-file checks pass.
- `pnpm test:pages`: built Hub and nine tabs; choice/numeric/drag players; reasoning and real IndexedDB ink across reload; stable draft across old/new path aliases; tablet-size rendering; no local 404s or uncaught browser errors.
- The final smoke run uses `LEGACY_PAGES_ARTIFACT` to serve the actual independently packaged old site alongside the new build. It compares rendered notebook canvas contents after refresh, across old/new paths, and in a newly opened browser tab, in addition to checking saved answers and typed reasoning.
- The legacy packaging regression passes add/edit/delete, frozen URL preservation, and collision/output safety cases in disposable fixtures only.
- Browser smoke uses fake Firebase SDKs and blocks external services. This does not certify real Google sign-in, production Rules, AI availability or Apple Pencil behavior.
- Existing chemistry chapter links/content remain exactly as supplied. Historical navigation fixtures may describe older content; migration does not restore deleted teaching material.

## Live verification — 20 September 2026

- New Pages workflow: [successful initial standalone release](https://github.com/Nixcentury/learning-hub/actions/runs/35460424522), commit `5da6e2889067e86ab616e5dcbbaef4c1d7c518bc`.
- Old Pages workflow: [successful independent publication](https://github.com/Nixcentury/Physic-subject/actions/runs/35461225772), commit `3f7d54c5c39fdaa46ad0ef9abc4b4dfe38b0009e`.
- Both live `deployment.json` files match those commits; the old site's metadata reports `hubBuilt: false` and 88 compatibility files.
- Live text/binary comparisons cover two standalone legacy quizzes (Python and chemical equilibrium), the old Quiz Player, shared tools script, numeric sample, cached Hub JS and a math font, plus the new Quiz Player and numeric sample. Both site root pages also return the expected entry point.
- This is representative live coverage, not a browser interaction test of every historical HTML file.

No secrets or student database records were included. The only pending acceptance work is on real user devices/services; no live Firebase data or Rules were changed by these tests.
The local backup archive and per-file manifest are in the task's `learning-hub-migration` folder outside this repository.

## Remaining user acceptance

Follow the iPad checklist in `START-HERE.txt`. Back up existing notes first; do not clear website data during migration testing. When signed in, reopen the same activity through the Hub in the new tab so it receives the same account identity. A standalone Player link uses a guest context and must not be compared with an account-bound draft as though they were the same identity.

The chemistry topic-menu file `public/content/chemistry/equilibrium.html` is currently absent and chapter 9 does not have `data-chapter-src`. The retained topic/quiz templates do not by themselves make a navigable chapter. The updated public guide explains how to connect them when the author is ready; this migration does not recreate deleted content or start new Classroom features.
