# Classroom sheet bridge: checkpoint

Paused at the user's request on 2026-10-31 (Asia/Bangkok). This branch is unfinished and untested; do not merge or deploy it yet.

## Agreed scope

- Build a NEW Google Sheet and a NEW bound Apps Script project specifically for Learning Hub. The user explicitly requested new intermediaries; the old school spreadsheet and its scripts are references only.
- Start with a teacher-operated CSV bridge: Hub exports one assignment's latest submitted scores; the teacher imports that CSV into the new sheet, creates the corresponding Google Classroom assignment, checks the student mapping, and pushes draft grades manually.
- Students continue submitting and correcting answers in Hub. They do not select Google coursework or push grades themselves.
- Full OAuth integration, unattended sync, public Web App endpoints, shared notebooks and Drive integration are deferred.

## Existing completed work

- PR #83 added homework submissions and the teacher roster. PR #85 added corrections and repeated submissions until the teacher closes work. Both are merged.
- Base main commit for this branch: `3422cb07f662e0f07cc367e962a87713462a2263`.
- Existing Firebase Rules and submission storage do not need widening for a read-only teacher export.

## Changes started here

- `public/shared/classroom-sheet-export.js`: versioned UTF-8 CSV with an assignment metadata row and per-student rows, room/assignment/student identifiers, latest submission ID/revision, blank scores for missing/invalid submissions, and spreadsheet formula escaping.
- `js/classroom-submission-service.js`: teacher-owner-only `exportSheet(id)` re-reads the pinned questions, submissions and roster, recomputes grades, and returns CSV without writing Firebase data.
- `js/app.js`: assignment export command routing.
- Classroom UI: teacher CSV download button, localized feedback and cache version update.
- No Apps Script implementation or export tests have been written yet. Verify the service receives `assignments.hubUrl`; test fixtures will need a hub URL. Recheck all validation and CSV column counts before proceeding.

## Next implementation steps

1. Add tests for teacher-only export, identity/room changes during reads, fresh server data, correct pinned-quiz grading, unsubmitted/invalid results, multiple homework instances of the same quiz, Unicode/quotes/newlines, and formula-safe CSV text.
2. Write a standalone Apps Script for a NEW blank school-account sheet. A new script may define its own `onOpen()` menu. Enable the Advanced Classroom service in that new project; no Web App deployment is required for manual CSV upload through a spreadsheet dialog.
3. Suggested new tabs: HubAssignments (fixed room/assignment to course/work mapping), HubResults (latest submitted revision per student), HubUsers (teacher-entered Hub UID to Classroom email mapping), HubCourses, HubReview, and HubSyncLog. Never assume a Hub Firebase UID equals the legacy StudentID.
4. Create coursework through this SAME new Apps Script project, record the returned IDs, and use an exact Hub room/assignment marker for duplicate detection and retry recovery. Check `associatedWithDeveloper` and target binding before grading; do not match by quiz title alone.
5. CSV re-import must be idempotent, preserve newer results and mapping fields, and reject conflicting equal revisions. Blank/unsubmitted/error scores must never be pushed as zero. Validate raw score/maxScore/percent and scale using the live Google coursework maxPoints.
6. Add a dry-run review before teacher-confirmed draftGrade pushes, per-student errors, duplicate-email checks, operation logs and repeated-import/send protection. Do not automatically publish assigned grades or turn in student work.
7. Test Apps Script logic with isolated fakes and the actual CSV format. Extend the existing CI browser test to check the teacher's download and absence of the student export button. Run appropriate unit/build/lint checks and existing classroom regressions, then open a reviewable PR.
8. Supply a short Thai guide for creating the NEW sheet/script, enabling the Classroom service, importing CSV, mapping emails and courses, creating a test assignment, reviewing and pushing grades. Actual school authorization and Google API writes must be tested by the teacher; do not claim they have already passed.

## Relevant findings and limits

- The school-account Apps Script screenshot offers Execute as Me and Who has access Anyone. That is only configuration availability, not proof of end-to-end Hub access.
- Another screenshot explicitly says the selected Google Workspace for Education account is marked under 18 by its administrator. It does not establish when the setting changed. Personal Gmail owns Firebase; the school account supplies teacher Classroom authority.
- The legacy scripts already create coursework and patch grades. A provided spreadsheet snapshot contains creation records and successful grade-push log entries, but neither proves current authorization of a copied/new script project.
- Do not change the legacy Apps Script's Default Cloud project or touch legacy spreadsheet data. New-project coursework ownership is distinct from old API-created work.
- This CSV bridge intentionally avoids Cloud Console and browser-to-Apps-Script cross-origin authentication work for now. It still requires the new script's Classroom service to authorize successfully under school policy.
