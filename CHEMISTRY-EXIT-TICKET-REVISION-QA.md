# Chemistry 2.1–2.4: exit ticket revision

Prepared 11 November 2026 on `codex/chemistry-exit-ticket-revision-20261111`.
Base: `17d485f7bbc4f763efcbb8a45e9c38e7e9efc6d2`.
This record describes validation before publication. The Pages workflow and
the deployed `deployment.json` identify the published revision.

## Placement and approved content

Each topic retains its existing review link and appends **exit ticket revision**
as the final authored tool. The generated Open quiz and Notebook remain intact.

| Topic | Existing bank key | Route slug | Approved source | Full / quiz pages per language |
| --- | --- | --- | --- | --- |
| 2.1 Atomic models | b-6622c75196960aae9364b231 | atomic-models | QA v1.2 | 4 / 2 |
| 2.2 Subatomic particles and isotopes | b-c70956de38c1560a16651221 | subatomic-particles-and-isotopes | QA v1.2 | 4 / 2 |
| 2.3 Electron configurations | b-1746fd491b0ecff31033ada1 | electron-configurations | QA v1.2 | 4 / 2 |
| 2.4 Periodic table and main-group properties | b-5e9670f48386783fee660857 | periodic-table-main-group | Expanded QA v1.4 | 10 / 3 |

Direct tool route: `#chemistry/bank/<route-slug>/exit-ticket-revision`.
Content and image provenance: [atomic-properties/README.md](public/content/chemistry/atomic-properties/README.md).

The approved science corrections are retained, including Q13's 657 nm result
from rounded hydrogen energy levels, electron mass in u, allowed subshells and
Fe ionisation, and the EN/EA and supplied-radius distinctions in 2.4.

## Hub integration

- Tools use `data-tool-kind="html"`. The 20 marks printed on each worksheet are
  for manual marking; these documents have no automatic score or submission bridge.
- Imported documents have `data-learning-html` and `data-exit-ticket-revision="1"`.
  Inline scripts and standalone controls were removed. The trusted parent supplies
  language, answer visibility and printing; the HTML sandbox remains
  `allow-same-origin` without script execution.
- Language uses the existing `data-content-lang` mechanism. Answer visibility
  stays local to each open window and survives language changes/minimising.
  Reopening a closed document starts with answers hidden.
- A dedicated print adapter opts in only for these marked documents. It reuses
  the shared snapshot sanitizer, resource validation and filename/title helpers,
  preserving the authored A4 pages instead of repaginating them as flowing prose.
- Print preview offers full/quiz ranges and student/answer editions. Student
  snapshots remove answer nodes, and only the selected language is retained.
  Export choices never change the live teaching document. Footers reflect the
  selected print range's page count.
- Embedded images were extracted and deduplicated within each topic. Image bytes
  and the approved body text remain unchanged; no diagram was regenerated.

## Validation

- `pnpm validate:content`: passed, 0 errors; 33 existing draft warnings.
- `pnpm test:unit`: **748 passed, 0 failed**.
- `pnpm build`: passed, including TypeScript and Pages artifact verification;
  895 public files match and resources remain under `/learning-hub/`.
- `git diff --check`: passed.
- Chromium Guest browser QA through the managed preview:
  - All four topic menus open the correct revision as the final authored tool.
  - 16 reading modes (four topics × TH/EN × answers hidden/shown), 88 page states:
    images loaded, no page or solution-box overflow.
  - 32 print variants (four topics × TH/EN × full/quiz × student/answers),
    124 page states: expected page counts, images loaded, no page overflow.
  - All student print variants have zero answer nodes; answer variants retain
    the worked solutions. The selected language and footer counts are correct.
  - Multiple revision windows coexist. Parent language/answer controls work
    without enabling scripts in their frames; print choices preserve teaching state.

Browser QA verifies the preview and its print DOM, not a physical printer or
native iPad/Safari printing. Classroom accounts and live score services were not
used. No Firebase rules, account data, bank IDs or existing quiz records changed.
