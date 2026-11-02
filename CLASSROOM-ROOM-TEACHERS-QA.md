# Room co-teacher invitation — 2 November 2026

Base main: 6440e96d2ab4be95f05ef52bc6dce82e99d44f3e, rechecked before editing.

## Behavior

- The actual room owner adds a verified-email invitation before or after a recipient’s first Hub sign-in. The recipient automatically sees the room, without global teacher/admin promotion.
- The room’s co-teachers read the student roster, manage private/published/closed assignments, enable submissions, view submitted grades/export CSV and manage all room links. Assignment ownerUid remains the original owner.
- Only the actual globally approved owner manages teacher invitations, co-teacher removal, student roster writes or lesson-monitoring controls. Co-teachers cannot create their own rooms without separate global teacher approval.
- Revocation atomically removes the teacher row, bound invitation and room index. Previous student members recover their student index and keep original membership/work. Other recipients leave the room. Existing scores, answers, history, links and assignments remain intact.
- Shared links open the Classroom list; matching email/UID, rather than possession of a URL, grants access. There is no outbound email, OAuth-scope change or direct Google Classroom integration.
- Teacher/student directories stay scoped to the selected room and detach on back, room/account/role change or revocation. Enrollment uses one indexed query for the signed-in verified email; stale asynchronous results cannot continue after an account switch.
- Old Rules cause only the new co-teacher panel to fail closed; old roster and owner workflows stay usable.

## Validation

- 655/655 unit tests pass with explicit process isolation, covering the new enrollment/models, owner UI commands, live revocation/re-invitation, account switches/late callbacks, student-index preservation, canonical-owner assignment creation, grade subscription downgrade and co-teacher link management.
- 69/69 real local RTDB emulator tests pass: the new complete Rules plus all previous teacher, roster, room, link, monitoring, assignment and submission cases. This checks wrong-email/unverified/second-UID claims, atomic pairing/revocation, cross-room/account denial, staff operations and submitted-score preservation.
- Full Rules are reproducible from the reviewed roster snapshot; unrelated roots and owner-only membership/monitoring Rules are compared structurally. No Rules or database changes have been published to Firebase.
- Activity/guide validation, TypeScript, production build and Pages artifact verification pass.
- CI production-Hub/emulator browser coverage adds: owner email invite → pending first sign-in → room-only teacher controls/CSV/link write → 1024 px layout → confirmed owner revoke → live data cleared, with existing submitted results retained. Current-head CI results are reported in the PR after running.
- No native iPad/Safari or real Google-account test is claimed.

## Handoff

After merging, the Firebase project owner must manually publish firebase/classroom-room-teachers.merged-draft.json as the complete Rules, retaining any additional Rules maintained outside this repository. See integrations/classroom-room-teachers.md. No database migration, score rewrite or paid service is needed.
