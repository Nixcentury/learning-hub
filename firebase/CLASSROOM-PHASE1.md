# Classroom Phase 1

Scope: approved teachers create rooms; authenticated students join by code;
own-room lists persist in RTDB; only the approved owner reads the roster.
No assignment, score, Google Classroom, deletion, renaming or code rotation API.

## Data contract

All new data lives under `classroomV1`. No migration of `learningHub`, `lms*`,
`quizPresence` or `quizProgress` is part of this change.

| Path | Value | Who can read |
| --- | --- | --- |
| `rooms/{roomId}` | `name, ownerUid, joinCode, createdAt` | Approved owner or enrolled member |
| `joinCodes/{code}` | `roomId, ownerUid` | Signed-in user with the exact code; no listing |
| `members/{roomId}/{uid}` | `displayName, joinedAt, joinCode` | That member, or approved room owner |
| `userRooms/{uid}/{roomId}` | `owner` or `student` | That UID only |

`roomId` is `r_` plus a UUID's 32 lowercase hex digits. It stays separate from
the 8-character cryptographically random invitation code (32-symbol alphabet,
40 bits). Invitations are shareable; any signed-in holder can enroll. This is
not school-domain verification or a pending-admission workflow. There is no
invitation brute-force rate limiter or membership removal UI in this phase.
Limit pilot code distribution to intended students.

Teacher authority comes from existing `learningHub/admins/{uid} === true` or
`teacherApprovals/{uid} === true` / `.enabled === true`. An email, teacher
request, URL parameter or iframe message never grants authority.

Room creation atomically writes room + unique-code mapping + owner index.
Enrollment atomically writes own membership + own index. Rules cross-check
the merged proposed state to prohibit partial/fake memberships. Creates cannot
overwrite existing rooms/codes. Existing membership fields are immutable;
rejoining reuses the original record and timestamp. Concurrent-tab joins retry
using the first committed membership. Creating the same room twice after a
complete browser restart is not deduplicated by room name.

## Components

- `js/classroom-model.js`: key formats, normalization, atomic write payloads.
- `js/classroom-service.js`: injected IO, lists, roster, commands, stale-session
  guards, retry state. Watches stop on account/role change or tab navigation.
- `js/classroom-firebase.js`: existing authenticated Firebase SDK adapter.
- `js/app.js`: passes trusted access/rooms context to the current Classroom
  iframe; checks source/origin, current UID and page revision for commands.
- `public/pages/shared/classroom-rooms.js`: DOM-only UI, escaped textContent,
  one pending command, translated errors, no cached roles or database access.

Reads have a 15-second initial timeout with retry feedback. A write is not
reported successful before the SDK's acknowledgement. No write timeout falsely
claims cancellation: a disconnected Firebase SDK can still have a pending write.
An uncertain creation keeps its retry key in memory until context changes;
after a page restart users should check their room list before creating again.

The gradebook is deliberately deferred. The old `quizProgress` Rules layout
must be reconciled separately against current score persistence before adding
assignments/results. This phase does not widen score access to work around it.

## Rules deployment — manual checkpoint

- `classroom-phase1.rules.json` is a fragment, NOT a full production Rules file.
- `classroom-phase1.merged-draft.json` combines it with the Phase 0 baseline
  reconstructed from the conversation, not a fresh live Console export.
- Back up and compare current production Rules before applying. Preserve every
  existing branch. Never publish a permissive root. Do not replace current
  rules with the fragment alone.
- No production Rules or approval writes were performed for this feature.
- Data nodes are created by normal create/join actions, not manual root imports.

Rebuild the fragment: `node scripts/build-classroom-rules.mjs`.
Rebuild a merged draft: pass the path of a reviewed Phase 0 JSON baseline as
the first argument. The generator refuses an existing `classroomV1` branch.
Only generated JSON is written; nothing is deployed.

## Verification

1. `npm run test:classroom` — role/access + service unit tests.
2. `npm run test:classroom:browser` — guest/teacher/student, account switching,
   forged contexts, access failures, mobile/language/standalone.
3. Start the official RTDB emulator at `127.0.0.1:9017`, then
   `npm run test:classroom:rules` and `npm run test:classroom:rooms` sequentially.
   These reset only the fixed `demo-classroom-phase1` emulator namespace.
   `CLASSROOM_EMULATOR_ORIGIN` may change the port; non-loopback URLs are rejected.
4. `npm run test:navigation:browser` and existing quiz/notebook tests.
5. Validate content, TypeScript, Vite build; review desktop/mobile QA images.

Emulator QA used official database emulator 4.11.2 and portable Temurin JRE 21.
Example start: `java -jar firebase-database-emulator-v4.11.2.jar --host 127.0.0.1 --port 9017`.
The tools are kept outside the repository, not added as production dependencies.

Rules tests use unsigned emulator ID tokens in the REST `auth=` parameter.
Only fixture setup uses the emulator's admin token. Negative tests explicitly
prove that guest/student/other-teacher requests are denied. Browser integration
uses real Hub/role/service/UI code and actual emulator Rules, with a test-only
Auth + REST SDK-transport shim. This verifies the workflow but is not a test of
real Google OAuth, SDK WebSocket reconnection, or deployed production Rules.
The final two-account live smoke test remains a manual deployment checkpoint.

Official references:

- [RTDB rules conditions and merged state](https://firebase.google.com/docs/database/security/rules-conditions)
- [Atomic multi-location updates](https://firebase.google.com/docs/database/web/read-and-write)
- [Connect to the Realtime Database emulator](https://firebase.google.com/docs/emulator-suite/connect_rtdb)
- [Firebase REST authentication](https://firebase.google.com/docs/database/rest/auth)
