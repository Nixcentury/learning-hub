# Review beside a Classroom Quiz

Classroom assignments use the shared Quiz Engine. They keep their own room,
assignment, student and frozen-quiz storage binding while opening the same
review reader used by ordinary question-bank practice.

- Resolve the pinned `targetHash` through the owned route catalog and require
  the same Quiz `contentId`. The subject and bank are reading metadata only.
- Retain the Classroom route while its reader has focus, including topic and
  language changes. This keeps the selected room and submission service live.
- Review opens beside the existing Quiz at its current question. Returning to
  the source bank restores that exact assignment, not independent bank practice.
- A reader receives selection, question context and a boolean return mode. It
  never receives the homework UID, room, assignment binding, answers or grades.
- Return navigation still uses the engine's existing drag-review gate and
  requires the same current account. Reopening a closed Quiz goes through the
  existing authorized homework load bridge.
- Existing snapshots need no migration or re-freezing. If a route lookup fails,
  homework can still launch; the engine retains its inline review fallback.

Both window-tool folding and Quiz action folding already work in Classroom.
This fix reuses those shared controls and updates the homework player version;
it adds no second set of folding controls or grading rules.

Validation: source-route, exact-assignment return, account isolation, reading
message privacy, reader reuse, language, folding and fallback unit tests; a
production-Hub emulator browser regression also opens the reader, returns with
working retained, then continues the existing submit/reload/resubmit checks.
The manual preview uses production Workspace/Quiz/review code and synthetic
homework transport, without changing live classroom answers or submissions.
