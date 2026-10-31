# Give up applies for the rest of the attempt

Previously a student could reveal a solution with Give up, immediately reopen
that question with “Try this question again” or “Edit answers”, and earn credit
in the same attempt. The shared Quiz engine now keeps that question given up
until an explicit next attempt or fresh restart.

- Give up clears the answer, reveals the explanation, disables answer controls,
  and leaves the question worth zero in the current attempt.
- Edit answers and individual result review do not clear give-up status. Other
  unmastered questions that were not given up remain editable.
- The results action “เริ่มรอบถัดไป · ทำข้อที่ยังไม่ผ่าน” / “Start next attempt ·
  retry unmastered questions” increments the attempt and resets answers, hints
  and give-ups only for unmastered questions. Previously mastered questions and
  notebook work are retained. A new attempt alone does not award credit.
- Existing local/cloud `giveUps` records enforce the same lock after reload;
  no progress schema migration or database Rules update is required.
- Choice, numeric and drag-fill callbacks use the same answer eligibility
  check, including closed homework, grading-in-progress and window-close guards.
- The shared behavior also applies to question-bank quizzes, homework and
  temporary AI practice. Closed homework remains read-only.

Regression coverage exercises same-attempt editing and regrading, local/cloud
resume, normal/temporary/homework contexts, and retained mastered work. Browser
CI uses real authored choice, numeric and drag-fill examples to check Give up →
reload/edit/result review still locked and score 0 → next attempt allows a
correct answer and credit. It blocks external requests and uses guest data.

This controls the normal Quiz workflow. Solutions still exist in the learning
materials; this change is not a proctored-exam security boundary.
