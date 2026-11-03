# Open-book quiz work across topics

The user works on several topics in parallel. Use at most 50 questions per set; the user may review authoring/QA increments of about ten items and may switch topics. Report the PR and remaining coverage clearly. Preserve complete content/concept/problem coverage across sets without simply copying the source questions. Use the existing bilingual mixed quiz engine and per-question sheet links. The shared player now provides Skip for now for all types and checks editable drag placements before a forward rereading confirmation; see `QUIZ-NAVIGATION-AND-READING.md`. Scores remain independent of AI stamps.

Format rule clarified 3 November 2026: both recall passages and most practice problems use drag/tap word or formula placement, with at least two unused distractors in every drag question. Computational exercises use typed answers or multiple choice. Use multiple choice when an answer is impractical to type, or when testing reasoning and consolidation; do not turn numerical calculations into drag-the-number tasks. Keep content complete and let the question purpose determine the minority of non-drag items.

| Topic | Completed / current work | Next pending | Detailed handoff |
| --- | --- | --- | --- |
| 19.1 Sheet 1: blackbody / Planck, ID `b-0f490c3358e9212cee2e2a43` | Existing Set 1 (20 questions), PR #81. Worksheet revision `2026-11-03-2` swaps nine source tasks to parallel problems and reserves the originals; check its PR/merge status | User requested worksheet first. Afterwards replace the old Quiz with complete editions, each ≤50 questions, including all IPST originals, activities and remaining skills; the old four-set plan is superseded | `BLACKBODY-19-1-CONTINUATION.md` |
| 10.1 Wave model of light, ID `b-08c93bb5cd14a7bc7de0a8e0` | Two complete review sets authored: Set 1 = 46; Set 2 = 41 (the user removed two Set 1 items). Expands merged PR #82’s original twenty items and adds the remaining sheet coverage | No further 10.1 set planned; inspect the coverage map and QA record before adding work | `WAVE-MODEL-10-1-CONTINUATION.md` |
| 10.2 Double-slit interference, ID `b-21460452889578f11c3a8bac` | Single 50-question mixed review: all 14 headed sheet topics, IPST examples/understanding/Exercise 10.2 and double-slit chapter-end tasks | Quiz authored; submit PR and recheck merge/deployment before calling it live. Single-slit/grating tasks remain separate | `DOUBLE-SLIT-10-2-REVIEW.md` |
| Chemistry 10.2 Conjugate acid–base pairs, ID `b-5e60aad52e28d90a4d818b29` | One 50-question open-book set: 40 drag/tap passages and 10 reasoning choices; original IPST cases retained in the quiz, adapted worksheet tasks, paired-sheet review button | Check PR/merge/deployment before calling it live; no extra set planned for the scanned section | `CHEMISTRY-CONJUGATE-10-2-REVIEW.md` |

Recheck GitHub/main and the linked sheet before resuming; an open PR may contain the latest authored set. Never infer that an entire topic is finished from a completed Set 1.

For 10.1, the user explicitly confirmed a light review at the source sheet's level. Keep the approved direction: readable passages, short questions and direct calculations; no added depth or derivation-heavy expansion.

The 50-question cap supersedes older approximately-20-question planning counts when a topic is resumed. Consolidate future sets after reviewing that topic; no blackbody content is modified by the 10.1 work.

QA preference updated 2 November 2026: prioritize factual content, supplied data, solutions and readable wording for new sets. Recheck shared systems when a change touches them or a concrete issue is reported, rather than repeating broad system QA for each content batch.
