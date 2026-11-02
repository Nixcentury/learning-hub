# Classroom teacher management — 2 November 2026

Base main: 1d3529acf33859430826ef12db140c923da83511.

## Behavior

- Verified Hub administrators can find an exact email, inspect the account, approve teacher access, approve pending requests, list teachers and confirm revocation inside Classroom.
- Teachers can copy a Classroom link for friends. It opens the destination; recipients sign in with their own account before an administrator approves them. No email is sent automatically.
- Existing profiles, teacherApprovals, teacherRequests and admins contracts are reused. Direct approvals without requests do not manufacture invalid partial requests; existing request fields are preserved.
- Directory listeners start on explicit open and stop on close, navigation, role loss or account switch. Late callbacks/writes/clipboard results cannot paint into a reopened or different session. The directory stays in the parent.
- Existing blue styles, TH/EN labels, 44 px touch targets, responsive layout and selectable copy fallback are retained.
- Firebase Rules, production database, room ownership/membership, scores, answers, assignments and Google Classroom scopes are untouched.

## Checks

- Full local unit suite: 642/642 pass.
- Real local RTDB emulator: 61 tests pass across teacher management and existing roster/room/link/monitor/assignment/submission suites, using unchanged full Rules. This includes denied student/ordinary-teacher promotion, admin-marker denial, direct approval, request preservation, revocation, cross-room/account isolation and unchanged scores/answers.
- Content/guide validation, TypeScript, production build and Pages artifact verification pass.
- During component review, the actual Classroom page/service/view/share dialog with synthetic IO was checked at 1024/390 px in TH/EN: approval, recipient controls, hidden ordinary-teacher management button, listener release, missing email and manual-copy fallback. Native iPad/Safari and real Google sign-in are not claimed.
- The existing production-Hub/emulator CI browser flow now includes first Hub login/profile → exact-email preview → admin approval → live recipient teacher controls → confirmed revoke, plus ordinary-teacher link sharing and student message-spoof denial. CI results are reported in the PR after running.
- No post-merge deployment is claimed.

## Setup

The Firebase project owner must configure the first Hub admin once at learningHub/admins/UID = Boolean true. Teacher approval alone cannot approve other teachers. A recipient must sign in to Hub once before email lookup. See integrations/classroom-teachers.md.
