# Review topic from column B

Each published question row now carries `reviewTopicKey`, resolved by exact match
between column B and a public Sitemap ID in the same subject. Every question in
that row inherits this topic. No new Sheet columns or IDs are required.

## Activate the service change

Update `Code.gs` in the **existing question-bank Apps Script project** that serves
the endpoint in `public/shared/question-bank-config.js`. Do not replace another
legacy Apps Script project. Then use Deploy → Manage deployments → Edit the
existing web app → New version → Deploy. Keep its existing access settings and
URL. No setup function or new archive folder is needed.

The GitHub Pages frontend can deploy before this service update. Older snapshots
remain readable with the original digest. New snapshots sign their row topic
keys as part of the revision; changing a topic therefore creates a new revision.
Existing saved attempts remain pinned to their original question version. On
reopening, legacy attempts can borrow current review metadata only when the row
number and complete question HTML are unchanged. This does not replace the saved
question revision or answers. Changed or moved rows are not guessed. Do not
rewrite archived attempts.

## Check

Open a mixed exam and press Review topic on questions from two different topics.
Each opening should select the current question's column B topic. A published
but unauthored topic displays “Content is being prepared”. Blank, unpublished,
or invalid B IDs are not guessed from the question text. Other topics remain
selectable. Answers, question IDs, and source order are unchanged.
