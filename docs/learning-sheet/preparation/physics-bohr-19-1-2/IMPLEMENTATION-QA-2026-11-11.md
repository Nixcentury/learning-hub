# Physics Bohr 19.1 ตอน 2 — Implementation QA and handoff, 11 Nov 2026

> **ACTIVE REVISION R3 / DRAFT PR #174 (11 Nov 2026).** Previous R1 notes and counts below are historical. The current Bohr HTML has **7 Learning stages**; it starts from emission/absorption spectra, then quickly reviews Dalton/Thomson/Rutherford/Bohr. The grating wavelength-measurement explanation is **removed from Learning**, but the IPST grating activity/data is retained in **Problem**. In Learning, show all intermediate algebra from force + angular momentum to **general r_n=n²a₀** and from K+U to **general E_n=−13.6/n² eV**, with numerical constants and unit conversion. The table requested by the teacher is the **K_n/U_n/E_n hydrogen energy table** (n=1,2,3), NOT a radius-proof table. Give explanatory series table including Lyman/Balmer/Paschen/Brackett/Pfund. **Core Memory reduced from 32 to 18** formula/rearrangement/ratio questions, including equation-(1)/(2) ratio style. **Never reduce IPST 20/20 catalogued groups, all source subparts, or 10 A-Level-style questions.** The problem section has **no page cap**. Guide has 11 steps and must be fingerprinted against the HTML. Print performance changes (MathJax per-language limit; reduced DOM style scans; batched layout freeze) are in PR #174, but browser/print regression status must be checked before merging. See this PR's checks.

## R3 static QA, 11 Nov 2026 (PR #174)

- **Current actual HTML:** 7 Learning sections per language, 18 memory items, 20 registered IPST groups, 10 A-Level-style items and original worksheet Questions 1–41. Exactly **131 semantic answer slots per language**, same sequence of IDs in Thai and English; no invalid slot keys.
- **Science corrections:** No radius derivation table. Instead, explicit equation transformations to r_n (from electric/centripetal force and m_ev_nr_n=nℏ) and to E_n (K_n+U_n, substitute r_n, use SI and eV conversion). The K/U/E table contains true Bohr hydrogen values for n=1,2,3; U=-2K, E=-K and U=2E are derived and observed. The series table includes the final n and a plain-language explanation.
- **Problem scope:** Full grating activity/data remains for review; all catalogued IPST items and original A-Level-style problems remain. Memory reduced from 32 to 18, not the official problems. Original book completeness beyond the 20-group inventory remains unverified in this PR.
- **Print fixes:** src/js html-math per-language limit, HTML print snapshot and resource-scan reduced traversal, print-layout freeze batched writes; browser/print checks for 5 combinations are triggered by the revised Playwright test. *Do not say the printing hang is solved until the GitHub workflow has passed and a user confirms on iPad.*
- **Guide:** 11 steps (7 Learning + 4 Problem); HTML SHA256 refreshed after R3 content edit. Update again if HTML changes.


## Scope and user decisions

Actual content edit of the established sheet at `public/content/physics/ipst/atomic-physics/19-1-2-evidence-bohr-learning-sheet.html`; one bilingual file with `data-print-zone="learning"` and `data-print-zone="problem"`, following Chemistry 10.3's central Hub design. **No print page cap**, no requirement to print; user teaches on screen and wants abundant writing-practice problems. Existing scored Bohr 50-question Quiz and its scoring/progress were not edited.

User-approved content policy:
- Start from the **observed emission and absorption spectra** and IPST Activity 19.1, immediately calculate a real/reference photon wavelength's energy, then motivate Bohr. Return to explaining the observed line spectra afterward.
- **Compress** lengthy formal proofs but show the **physical starting equations, constants and numerical substitution** for Bohr radius `a0≈5.29×10⁻¹¹ m` and hydrogen ground energy `−13.6 eV`. All important formulas are **visible** in Learning, not note-taking blanks.
- In Problem, **bring back** previous problems and the prepared IPST source tasks; include varied memory recall and A-Level-style problems **only if every required concept/formula is in Learning**.
- Numerical answer style: **brief approach first; formula from Learning; symbolic rearrangement if needed; substitute with units; answer and short meaning last**. No extended prose interspersed through algebra.
- TH/EN must match in order, problem data, formulas, figures and semantic answer keys. Keep separate guide and old route aliases.

## What changed in the actual HTML

- The prior 17-section narrative was replaced in **Learning** by **eight compact phenomenon-first stages**:
  1. Continuous, emission and absorption spectra;
  2. Activity 19.1, grating measurement and reference 656.3 nm → 1.89 eV calculation;
  3. Rutherford/Thomson evidence and the need for a new theory;
  4. Bohr stationary states and assumptions;
  5. Numerical provenance for Bohr radius; displayed `r_n` and `v_n` formulas;
  6. Numerical provenance for `E_1`; displayed `E_n,K,U` and ionization formulas;
  7. Transition photon energy, Rydberg equation, line count under ensemble assumptions;
  8. Lyman/Balmer/Paschen series and concise limitations.
- **Problem** retains the old worksheet's 17 topic-group structures and original Question **1–41**, including mixed multipart tables, examples and separate answer slots. It restores question-specific diagrams, grating experiment sample data (`D=100 cm`, 5300 lines/cm, six rows), kinetic/potential/total-energy tables, and original multipart Q17, Q18, Q25 and Q37 context. Sample results are explicitly **not** presented as pupil measurements.
- 20 registered source-IPST groups (25 answer subparts in the prepared source inventory) are reintroduced with original identifiers, printed book page references and relevant local figure crops. Important notes on hypothetical atoms, one atom versus an ensemble, and different rounded values of `hc` are in the worked answers.
- Added **32 formula/concept recall drills** and **10 A-Level-style practice tasks**, including adapted *skills* of official 2568 Physics Q25 and Q30, plus newly authored problems. Do **not** label newly authored content as a verbatim A-Level 2569 problem.
- Retained old source figure files and older content-ID aliases; no changes to Quiz Engine, shared Learning Sheet engine, Classroom, student records or Firebase.
- Updated bilingual `guides/19-1-2-unified.guide.json` to **12 guide steps** (8 Learning, 4 Problem) using current content anchors and answer slots. The `source.sha256` must always be regenerated after the last HTML change.

## Static QA observed on the authored branch

| Test | Actual observation |
| --- | --- |
| Language containers | Exactly one TH and one EN |
| Print zones | One Learning and one Problem **per language** |
| Semantic answer areas | **146 unique keys per language** before final formula-only editorial change; matching TH/EN order |
| Original worksheet question numbers | **1–41 present**, including original Q17, Q18, Q25, Q37 contexts |
| Registered IPST source groups | **20/20** present in both languages |
| Registered source answer subparts | **25 per language** |
| Additional memory drills | **32 per language** |
| Additional A-Level-style items | **10 per language** |
| Image refs | 60 placements across TH/EN, 24 unique referenced local assets; **zero missing paths** in repository tree |
| Math delimiters | 582 `\\(` and 582 `\\)` before final formula-only editorial change; balanced |
| Guide targets | All 12 steps' 24 links resolve to authored anchors or slot keys |
| Guide hash | Recompute/update after any HTML edit; checked against old checksum previously |

These are **static repository inspections**, not claims of `pnpm build`, MathJax typesetting in a browser, print pagination, or iPad Safari. The GitHub status and workflow query for the HTML commit returned no check runs at inspection time.

## Completeness and scientific checks still required before merge

- **Catalog completeness is 20/20 against the earlier prepared IPST inventory, not proven exhaustive coverage of the physical textbook.** The earlier audit read IPST Physics Book 6 printed pp.59–80 and 105–110; the 20-item inventory is saved here. This turn has not independently re-read the PDF scans page-by-page. Verify original wording, every figure, and all textbook chapter-end parts against the PDF if claiming absolute book completeness.
- Review the 22 old *knowledge-note or duplicate summary* slot keys not copied directly: for example summary formula slots, grating summary, six duplicate activity-summary wavelengths, electron speed table and a few narrative slots. Skills are included in the compact Learning and Problem calculations; these are not original scored questions. Keep an inventory diff if exact preservation of every old note slot is required.
- Physics numerical checks: `n=4→2` wavelength **486 nm = 4.86×10⁻⁷ m**, not the source's exponent typo. Reference visible-band convention stated as ~400–700 nm. Atom with `−7,−3,−1 eV` in Exercise 19.1 Q5 is **hypothetical**: do not apply hydrogen `−13.6/n²`. Chapter problems about line counts distinguish an **ensemble** from one atom. The `hc≈1242 eV·nm` rounded-value convention for original source-figure examples may differ from the `hc≈1240 eV·nm` Learning shortcut; each problem explicitly states its constant.
- Run `pnpm validate:content`, `pnpm validate:routes`, relevant Learning/guide tests, `pnpm build`, and `git diff --check` when a repository runtime is available. Inspect Hub Chrome actual page, answer revealing, guide jumps, narrow iPad-like layouts and MathJax. No native Safari or physical printing has been tested.
- Preserve guide's HTML fingerprint and revision as exact matches. **Do not merge automatically**. Teacher reviews PR.

## Primary links

- Draft PR: https://github.com/Nixcentury/learning-hub/pull/171
- Old worksheet: `public/content/physics/ipst/atomic-physics/19-1-2-evidence-bohr-learning-sheet.html`
- Old Quiz left untouched: `public/content/physics/ipst/atomic-physics/19-1-2-bohr-review-quiz.html`
- Source inventory: `ipst-original-items.json`
- Active design contract: `REBUILD-Learning-Problem-2026-11-11.md`
- Actual book file: https://drive.google.com/file/d/1claSYEw2Laz0zWRXjNcI9jhbt7A2sGMd/view
- Actual 2568 official exam PDF: https://assets.mytcas.com/68/answer/tcas68-phy-a-level.pdf

## Next AI instructions

1. Read this QA, active design contract and current HTML (not the old 3 Nov baseline conclusions).
2. Verify guide SHA256 after any edit. Do not create a new engine.
3. Focus on independent scientific/print/browser QA rather than recreating the content from scratch.
