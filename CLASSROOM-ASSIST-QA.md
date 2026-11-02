# Classroom emergency student work — 2 November 2026

Base: main `3a9a7c826da8949146adc4d9db9fe47fdc52ad73`. One scoped feature: resume an existing Classroom assignment on a room teacher's device, then return it to the student. The `Student work` entry is beside Preview in Assignment details, in the existing dialog.

## Behavior verified

- Owner and room co-teacher authorization stays room scoped. The Hub authentication remains the actual teacher; the assignment owner/answer owner stays the selected student. The bridge trusts only the registered workspace binding, not target IDs from a child frame.
- A three-minute, renewable lease binds room, assignment, student and teacher to a unique session. Student writes are blocked during help. Ended/expired sessions, revoked roles, removed membership, other rooms/accounts and old handoff epochs cannot write. A student can reclaim immediately.
- Drafts/results/history keep their existing storage paths. A handoff epoch forces a fresh authoritative load instead of uploading stale local answers. Revision checks and exact immutable archival still protect submissions; no practice `quizProgress` data is read or written for this feature.
- Start, submit and return/reclaim events are written atomically with their main operation. Submitted results retain `assistedByUid` and `assistId`; grade display identifies teacher-device submissions. CSV schema/calculation is unchanged.
- Prerequisites use the target student's submitted results/history, not the teacher preview bypass. Closed work remains read-only. Existing work, student identities, scores and prior submission IDs remain intact.
- Existing notebook/evidence PDF code and download button are reused. Local notes are isolated by student, assignment and assist-session key. Only displayed student/work labels change for assisted exports; rendering, scoring and AI review mechanisms are retained.

## Local validation

- 664 unit tests pass, including student/actor separation, the bridge, handoff epochs, stale local drafts, immediate reclaim, prerequisites, concurrent starts, offline refusal, existing resubmission and CSV behavior.
- 77 real local Realtime Database emulator tests pass, including 8 new assistance cases and the 69 existing co-teacher/roster/room/link/monitor/assignment/submission cases against the extended Rules.
- Complete Rules regenerate byte-for-byte. All roots outside `classroomSubmissionsV1` match the reviewed co-teacher baseline structurally.
- Content/guide validation, TypeScript, production Vite build, Pages artifact verification and `git diff --check` pass.
- Full production-Hub/emulator Chromium flow passes: student draft → teacher's real Hub identity → same student answers → correction → final submission attributed to teacher → PDF download → confirmed release → fresh student resume. A second session verifies student reclaim while the teacher frame is still open. Ordinary practice remains empty.
- Existing browser regressions pass for assignment closure, prerequisites, multi-tab monitoring/reconnect, roster removal/restoration, co-teacher scoped tools/revocation, global teacher management and direct Google-course read-only connection.
- Browser runs the production bundle/UI with authenticated emulator Rules; the SDK transport and Google/AI network edges are simulated. Local Chromium 133 checks include 1024×768 layout and named-student controls. This is not native iPad/Safari or real Google-account testing.
- A real PDF was downloaded through the existing button using html2canvas 1.4.1 and jsPDF 2.5.1. The synthetic case produces 4 A4 pages; raster previews show Thai student/work labels, typed notes and an actual drawn notebook stroke. The tested export does not depend on a successful AI response.

## Handoff

No live Rules or database writes were deployed. After merging, publish the complete `firebase/classroom-assist.merged-draft.json` manually, preserving any Rules maintained outside the repository. Reload existing teacher/student tabs. Setup and recovery are documented in `CLASSROOM-ASSIST-START-HERE.md`.
