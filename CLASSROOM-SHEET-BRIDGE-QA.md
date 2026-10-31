# Classroom CSV / new Apps Script bridge QA

Updated 2026-10-31. The teacher-operated CSV bridge is implemented; production deployment and actual school Google authorization/grade writes remain teacher tests.

## Scope

- Owner-teacher CSV download, fresh roster and result reads, frozen-question regrading. Existing practice and submission storage/Rules are unchanged.
- NEW private spreadsheet / bound Apps Script; existing school spreadsheet and project remain untouched.
- Versioned metadata + result CSV, explicit Hub UID → school email mapping, coursework created by this new script, exact room/assignment IDs and developer association checks.
- Preview and explicit teacher-confirmed draftGrade only; bounded 25-person batches, live maxPoints scaling, per-student logs, duplicate-email/user protection, stale-file/revision protection and safe text handling.
- A new latest total may replace a higher previous total. Unsubmitted/error results are skipped; genuine submitted zero is sent.
- Manual export/import only. No background sync, student turnIn, assignedGrade publication, Web App deployment or Google credentials stored in Hub.

## Local verification

- `pnpm test:unit`: 523 passing, including 20 Apps Script/CSV contract tests with fake Spreadsheet/Classroom services, teacher export permissions/races and UI download-response binding.
- `pnpm build`: content validation, TypeScript, Vite and public-file artifact verification pass (658 public files).
- Targeted oxlint on changed JS/test files: clean. `git diff --check`: clean.
- Real Firebase RTDB emulator Rules: all 38 existing classroom / monitoring / assignment / submission checks pass. No real Firebase project contacted.
- Local production-browser run could not launch because no browser binary was installed. The browser installer returned a truncated archive. GitHub CI on `51d7b388d75e6c4e58dcc347110df5ebf2cefaca` passed the actual teacher CSV download, missing-score and student-control checks, all homework resubmission checks, the real Firebase SDK check and the separate practice-browser workflow. A later pre-existing monitoring reply test hit the polling fake’s stale delivery receipt; the fixture now waits for the student’s own onValue callback before replying. Full regression is being rerun; see PR #87 checks for the final outcome.

## Important limits

- Fake Classroom services verify logic and request shape, not current school OAuth policy, quotas or Google writes. The teacher must test one new assignment with school accounts before adopting the bridge.
- The spreadsheet and CSV are teacher-editable. This is a manually reviewed transfer, not authoritative server-side grading for unattended sync.
- A CSV is a snapshot. Student submissions after its download require another export/import.
- A lost acknowledgement can cause a retry of the same draft value; no exactly-once external transaction is claimed.
- No production Rules, original spreadsheet, old Apps Script project, or live Google Classroom assignment was modified by this change.

Installation and teacher acceptance steps: [integrations/google-classroom/README.md](./integrations/google-classroom/README.md).
