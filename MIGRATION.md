# Learning Hub repository migration

## Baseline

- Source: `Nixcentury/Physic-subject`, folder `LEARNING HUB`.
- Source commit: `f38ff4e33177da3786cc7933bc0c37e01d4e202a` (clean checkout).
- Imported 169 tracked files; byte content checked against Git, allowing Windows line-ending conversion only.
- Initial local import commit: `57bfdb6`.
- Original repository, Firebase data/Rules, accounts, AI Worker, content IDs and question IDs are unchanged.
- Earlier `ROUND-*` documents are historical records; their original URLs describe the old deployment.

## Build decisions

- Keep the active HTML-based `vite.config.js`, relative `base: './'`, and both Hub/admin entry points.
- Remove the unused competing `vite.config.ts` in this new copy only. It is recoverable in the import commit and the untouched source repository.
- Commands explicitly select the canonical JS config.
- Publish only `dist`, rebuilt from scratch; never merge the legacy repository.
- Validate that every public file matches its published copy, and local HTML resources resolve under `/learning-hub/`.
- `deployment.json` identifies the published commit. A failed build must not be confused with browser caching.
- Firebase and AI are not reconfigured as part of migration. Automated smoke tests must not write to live services.

## Remaining release gates

- [x] Snapshot and separate local repository.
- [x] Baseline: 170 unit checks and production build pass.
- [x] New build, 82 matching public files, and `/learning-hub/` browser smoke checks.
- [x] Create the empty Public repository `Nixcentury/learning-hub`.
- [x] Explicit user approval to publish source code, questions and solutions publicly (20 September 2026).
- [ ] Push, enable Pages, and verify deployed commit.
- [ ] Real-device login/notebook/AI/Classroom checks (existing limitations documented separately).
- [ ] Decouple the original repository's publishing workflow only after the new Hub is verified.
- [ ] Test add/update/removal using disposable fixtures, then choose the new repository as the only active Hub source.

## Rollback

The original source and deployment remain untouched until the new site is verified.
Use the original repository if migration tests fail; do not overwrite it from the new copy.
This repository starts with an import commit. Earlier full history remains in `Physic-subject`.

## Local verification

- `pnpm install --frozen-lockfile` succeeded without dependency changes.
- `pnpm test:unit`: 170 passing tests, no live services.
- `pnpm build`: content validation, TypeScript, Vite and published-file checks pass.
- `pnpm test:pages`: built Hub and nine tabs; choice/numeric/drag players; reasoning and real IndexedDB ink across reload; stable draft across old/new path aliases; tablet-size rendering; no local 404s or uncaught browser errors.
- Browser smoke uses fake Firebase SDKs and blocks external services. This does not certify real Google sign-in, production Rules, AI availability or Apple Pencil behavior.
- Existing chemistry chapter links/content remain exactly as supplied. Historical navigation fixtures may describe older content; migration does not restore deleted teaching material.

## Resume checkpoint — 20 September 2026

The GitHub repository was empty and Pages was not enabled at the start of this continuation.
The user explicitly confirmed public upload of source code, questions and solutions on 20 September 2026.
No secrets or student database records are included in the migration.
The old repository and its publishing workflow are untouched.
The local backup archive and per-file manifest are in the task's `learning-hub-migration` folder outside this repository.
