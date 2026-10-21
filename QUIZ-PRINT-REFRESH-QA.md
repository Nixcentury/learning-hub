# Quiz worksheet printing and latest-version restart

Validated locally on 21 October 2026 against main `6faebfb`.

The shared Quiz Player now prints an A4 practice sheet with original question
numbers, lettered compact choices, automatic columns for short choices, and blank
working areas. The print selector offers 25, 40 and 65 mm per question. Content
authors can override space and columns per question. Teacher keys remain a
separate mode; their solution sections are unhidden only in the print copy.

The always-available Restart / load latest button confirms before resetting,
commits notebook work, revalidates the player and its owned module graph, fetches
and validates current questions, archives the previous attempt locally, and
navigates to a fresh player URL. It retains the content selection, language,
identity, existing quiz storage keys and question IDs. Revalidation does not clear
site storage. Sheet-bank quizzes retain revision pinning and the existing cloud
replacement precondition. Notes for HTML quizzes remain in the new run; bank
notebooks remain under their original revision.

Validation:

- `pnpm test:unit`: 279 passed, 0 failed.
- `pnpm build`: passed; 0 content errors, 32 pre-existing draft warnings.
- `pnpm test:quiz-print:browser`: passed in real headless Chromium, using fake
  bank/cloud services and real DOM, canvas, localStorage and IndexedDB.
- TH/EN: all 13 current questions, original numbering, 65 lettered choices, 13
  writing areas, SVG preserved, no question/option horizontal overflow, no
  worksheet solutions. Changing the print space affects only the cloned paper.
- Teacher key: 13 correct choices, solution sections unhidden, no blank working
  areas. The original interactive content remains unchanged.
- Restart cancellation, asset failure, content failure and archive quota failure
  preserve the active answers.
- Simulated removal of a question changes the restarted HTML set from 13 to 12.
- A transitive module cached for one year changes from revision 1 to revision 2
  after restart, proving that the button refreshes code as well as questions.
- Typed reasoning and actual pen strokes survive the fresh player navigation.
  The old answers remain in the local archive and an unrelated quiz key survives.
- Signed-in bank: the restarted set changes revision and question count, clears
  current answers, keeps the account, archives the prior run, and updates the
  fake cloud record to the latest revision.
- 390 px phone viewport: no horizontal page overflow.
- Rendered and visually reviewed all pages of the 13-question sample PDFs with
  standard 40 mm writing space: Thai 8 pages, English 10 pages. Kept graphs and
  diagrams readable; shortened the disc diagram caption to prevent SVG clipping.

The PDFs in `qa-output/quiz-print/` are generated review outputs and are not
committed. No book or teacher-guide file is published. Local restart archives
are device-only backups; this change adds no history-list UI or cloud history.
Actual Safari/iPad printing and real account/cloud operation still require
device testing. Pages deployment is tracked by the workflow for this commit.

Usage and author overrides: `PRINTING-START-HERE.txt`.
