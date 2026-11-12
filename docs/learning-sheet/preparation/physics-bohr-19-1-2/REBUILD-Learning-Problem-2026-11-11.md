# Bohr 19.1 ตอน 2: Learning / Problem rebuild contract (11 November 2026)


ผู้สอนปรับขอบเขตล่าสุดวันที่ 12 พฤศจิกายน 2026 ให้ Problem เริ่มจากตัวอย่าง สสวท. 19.4 แล้วทำคำถามและแบบฝึกหัดท้ายหัวข้อ–ท้ายบท รวม สสวท. 16 รายการ 19 ช่องตอบ ตามด้วยแนว A-Level / 9 วิชาสามัญ 10 ข้อ ย้ายทวนสูตร 18 ข้อไปท้ายชุดสำหรับเลือกฝึก รวม 47 ช่องตอบต่อภาษา ตรวจหน้าพิมพ์ Problem ให้ไม่เกิน 30 หน้าในทั้งสองภาษาและทั้งรูปแบบ A4 มาตรฐาน/เผื่อขอบอุปกรณ์ ตัดกิจกรรม ตารางทดลอง และชุดโจทย์ดัดแปลงเดิมออก
> **HISTORICAL REVISION R3 / PR #174 (11 Nov 2026).** Previous R1 notes and counts below are historical. The current Bohr HTML has **7 Learning stages**; it starts from emission/absorption spectra, then quickly reviews Dalton/Thomson/Rutherford/Bohr. The grating wavelength-measurement explanation is **removed from Learning**, but the IPST grating activity/data is retained in **Problem**. In Learning, show all intermediate algebra from force + angular momentum to **general r_n=n²a₀** and from K+U to **general E_n=−13.6/n² eV**, with numerical constants and unit conversion. The table requested by the teacher is the **K_n/U_n/E_n hydrogen energy table** (n=1,2,3), NOT a radius-proof table. Give explanatory series table including Lyman/Balmer/Paschen/Brackett/Pfund. **Core Memory reduced from 32 to 18** formula/rearrangement/ratio questions, including equation-(1)/(2) ratio style. **Never reduce IPST 20/20 catalogued groups, all source subparts, or 10 A-Level-style questions.** The problem section has **no page cap**. Guide has 11 steps and must be fingerprinted against the HTML. Print performance changes (MathJax per-language limit; reduced DOM style scans; batched layout freeze) are in PR #174, but browser/print regression status must be checked before merging. See this PR's checks.


> **Approved design now implemented on draft PR #171.** This contract supersedes the old 3 November lesson narrative. The actual HTML has been rebuilt into eight short Learning stages plus a full Problem zone; see [IMPLEMENTATION-QA-2026-11-11.md](IMPLEMENTATION-QA-2026-11-11.md) for the source coverage, actual static checks, remaining full-book verification, and build/browser tests still outstanding. The PR has not been merged.

## User-approved decisions (do not reopen without reason)

- Target: **19.1 ตอน 2 ทฤษฎีอะตอมของโบร์และสเปกตรัมอะตอม**, not Physics 10.2; use current bank key `b-d65860a41c400f77ee276a35`, established content ID `physics-ipst-atomic-19-1-2-sheet`, and existing Quiz ID/route. Do not silently change established IDs or scores.
- The **Chemistry 10.3 live sheet** (after merged PRs #166, #167, #168) is the preferred layout and printing model: one HTML, **Learning** and **Problem** zones. Learners generally use it digitally; no artificial page or problem-count cap. Central Hub owns language, answer reveal, A4 and selective-zone printing. No new engine/toolbar/scripts.
- **Learning is concentrated, not a proof transcript.** Begin with **observed emission and absorption spectra** (real IPST experiment/image), the question why only certain wavelengths appear, and one introductory photon-energy calculation from a measured spectral wavelength. Give just enough earlier-model context to motivate Bohr. Explain Bohr, radius, energy, transitions, series and limitations in a cause-and-effect story.
- Physics still needs numerical provenance. Show the **physical starting relationships and actual SI substitution** for `a₀≈5.29×10⁻¹¹ m` and `E₁≈−13.6 eV`; skip multi-line symbolic algebra proofs. Print final formulas **openly, ready to use**: do not force students to copy long formulas or full derivations. Reserve writing areas for observations, critical definitions, why/meaning and short important conclusions.
- **Problem can be long.** Use the latest teacher scope above. Keep IPST think-about-it questions, understanding checks, Exercise 19.1 and relevant chapter-end questions/problems with all subparts, original numbering and required figures. Keep Example 19.4 as the opening worked example. Exclude activities, experiment tables and the former adapted-question blocks. Put IPST and exam-style practice first, with formula recall at the end as optional follow-up. Keep Problem within 30 pages in both languages and print profiles. Exclude exercises that require a concept **not taught in Learning**. Add only A-Level official/parallel tasks that the Learning has taught (not photoelectric/de Broglie/advanced multielectron quantum mechanics).
- **Solution formatting (locked):** short conceptual setup **before** algebra → **exact formula used in Learning** → rearrange symbolically when needed → substitute values with explicit units/cancellation → numeric answer → one short check/meaning **after** algebra. No long explanatory paragraphs **between equations**. For conceptual questions: a clear answer and short reasoning, no artificial formula.
- TH/EN complete and semantically identical (data, formulas, figures, subparts, answer areas). Open/close answer by Hub `data-sheet-slot` with matching keys and direct `data-sheet-answer`. No independent MathJax, print code, quiz code, cloud or changes to shared engine.
- On last pass **update this .md and the existing README again** with actual file path/revision/coverage counts, validation commands and any unresolved issues, so the next AI never restarts the analysis.

## Teaching map (Learning, proposed order)

| Stage | Observable evidence and story | Knowledge in Learning; needed by Problem |
|---|---|---|
| L01 | Image(s): continuous incandescent spectrum; gas emission lines; absorption dark lines. Ask why different. | Bright/dark lines; emission and absorption; wavelength and source identity |
| L02 | IPST Activity 19.1: gas discharge, spectroscope/grating, measurements. Compute one H line `λ≈656 nm` to `Eγ=hc/λ≈1.89 eV` (sample clearly labelled; not fabricated pupil measurements). | `d sinθ=mλ` and near-normal `sinθ≈x/√(L²+x²)`, if grating measurement tasks retained. SI/nm/eV |
| L03 | Problem for Rutherford: classical charged electron ought to radiate; continuous orbital energy cannot explain discrete spectral lines. Magnet activity is analogy, not atom's force. | Essential experimental evidence and why Bohr was proposed, not extended history |
| L04 | Postulates: stationary allowed states `n=1,2,...`, no radiation in stable state; transitions involve photons. | `m_ev_nr_n=nℏ`, `ke²/r_n²=m_ev_n²/r_n` shown for physical basis, not long algebra |
| L05 | Show numeric provenance for radius; define a₀; ratios and first/second excited labels. | **Printed** `r_n=n²a₀`, `a₀≈5.29×10⁻¹¹ m`, `v_n≈(2.19×10⁶/n) m/s` if IPST speed Q is kept |
| L06 | Show numeric provenance for `E₁=-13.6 eV`, sign of bound energy, energy levels and ionization. | **Printed** `E_n=-13.6/n² eV`, `K=-E`, `U=2E`, `E_∞=0`, ionization energy |
| L07 | Return to spectrum with direct/cascade transitions and `n=3→2` red H line to explain observation. | **Printed** `Eγ=|E_i-E_f|=hf=hc/λ`; absorption vs emission; one atom vs population; possible line count `N=n(n−1)/2` only under stated ensemble/accessible-path assumptions |
| L08 | Balmer/Lyman/Paschen, Rydberg and relative wavelength; brief modern limitation. | **Printed** `1/λ=R_H(1/n_l²−1/n_u²)`; label series by final `n_l`; wavelength/energy inverse; probability cloud conceptual only |

**Important:** A student's Problem solution must refer to an explicitly taught L-stage. Formula bank is printed on Learning; some Problem prompts demand *recalling* the formula without looking. Do not use unintroduced equations such as photoelectric work-function law or de Broglie formula.

### Numerical provenance to show without student copying

For H, `a₀=ℏ²/(km_ee²)`; display `ℏ≈1.055×10⁻³⁴ J s`, `k≈8.99×10⁹ N m²/C²`, `m_e≈9.11×10⁻³¹ kg`, `e≈1.602×10⁻¹⁹ C`, and substitution giving `a₀≈5.29×10⁻¹¹ m`. Then `E₁=−ke²/(2a₀)≈−2.18×10⁻¹⁸ J≈−13.6 eV` using `1 eV=1.602×10⁻¹⁹ J`. Keep only this compact origin, not the full elimination of `v` and `r`.

## Problem map

| Stage | Content | Memory and skill repetition |
|---|---|---|
| P01 | Experimental spectra | observation and classification; lamp vs gas, emission vs absorption; spectrum measurement with grating |
| P02 | Evidence and Bohr's postulates | Thomson/Rutherford only essential evidence; quantum number and stationary states |
| P03 | Allowed radius and speed | r_n=a_0 n², v_n=v_1/n; levels, inverse questions, ratios |
| P04 | Energy and ionization | E_n=-13.6/n² eV, K=-E, U=2E, ionize to E_infty=0 |
| P05 | Photon absorption and emission | E_gamma=|E_i-E_f|=hf=hc/lambda; units, initial/final direction |
| P06 | Level diagrams and paths | one atom versus ensemble; direct/cascade, number of possible lines |
| P07 | Series and spectral limits | Lyman/Balmer/Paschen, Rydberg, visible-band convention |
| P08 | A-Level and mixed review | read excited-state labels, inverse radii, energy and wavelength ratios; no unrelated atomic physics |

Suggested ordering **inside each P-stage**: 2–6 targeted recall items → inversion/ratio practice → returned IPST items appropriate to the stage → A-Level style (if grounded and not beyond Learning). Keep IDs of the separate scored Quiz unchanged; this is a writable answer sheet, not a scoring activity.

## Old-book original 20-item inventory mapped to existing Quiz

This is **20/20 of the prepared source inventory linked in the Quiz documentation**, now restored in the actual Problem zone; not proof of exhaustive book-page coverage. The current unified Learning sheet has 41 authored questions and one two-part example, not verbatim copies of all 20 book tasks; Quiz is the place with all 20 referenced groups. Recover full givens/figures from the `ipst-original-items.json` and `quiz-source-images` plus the teacher-supplied **IPST Physics Book 6**, printed pp.59–80 and 105–110 (PDF pp.72–93, 118–123). Do not trust a Quiz question's simplified prompt to represent all textbook subparts.

| Source ID | Type | Book page | Quiz Q mapping | Inventory subparts | Handling |
|---|---|---|---|---:|---|
| `magnet-end` | activity-question | p.61 | 4 | 3 | ผู้สอนตัดออกจากใบเรียนรู้วันที่ 12 พฤศจิกายน 2026 |
| `activity-19-1-q1` | activity-question | p.64 | 5 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `activity-19-1-q2` | activity-question | p.64 | 6 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `activity-19-1-q3` | activity-question | p.64 | 8 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `example-19-4` | example | p.76 | 31, 32 | 2 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `think-77` | think | p.77 | 44 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `understanding-19-1-q1` | understanding | p.80 | 11 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `understanding-19-1-q2` | understanding | p.80 | 1 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `understanding-19-1-q3` | understanding | p.80 | 7 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `exercise-19-1-q3` | exercise | p.80 | 24 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `exercise-19-1-q4` | exercise | p.80 | 25 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `exercise-19-1-q5` | exercise | p.80 | 33 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `exercise-19-1-q6` | exercise | p.80 | 17, 43 | 2 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-question-2` | chapter-question | p.105 | 3 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-question-3` | chapter-question | p.105 | 41 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-problem-2` | chapter-problem | p.106 | 42 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-problem-3` | chapter-problem | p.107 | 16 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-problem-4` | chapter-problem | p.107 | 34 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-problem-5` | chapter-problem | p.107 | 35, 36 | 2 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |
| `chapter-problem-19` | chapter-problem | p.109 | 23 | 1 | ต้นฉบับจากบัญชีเก่า; ต้องตรวจรูป/บริบท/เฉลยก่อนใช้ใน Problem |

- Activity 19.1 question 3 needs real observational data or clearly labelled *model values*. Keep gas type, measurement setup and required quantities. It must not be presented as students' real results.
- Example 19.4: `n=4→2`; **486 nm is 4.86×10⁻⁷ m**, not the erroneous 10⁻⁹ m exponent printed in source. Show Rydberg formula → substitute → wavelength; `Eγ=hc/λ` separately.
- Exercise 19.1 Q5's diagram is a **hypothetical atom** with `−7,−3,−1 eV`, initially `n=2`; do not silently apply H `−13.6/n²`.
- Exercise 19.1 Q6(a,b): include `n=3` radius and **all direct and cascade paths relevant to the question**, distinguishing one atom from many initial atoms.
- Chapter Q3: 4 levels → 6 **possible distinct spectral lines across an ensemble**, not six photons in one drop.
- Chapter problem 2: energies `−5,−4,−2 eV`; choose and state whether `hc≈1240` or `1242 eV·nm` to avoid last-digit ambiguity.
- `chapter-problem-19`: `K=+13.6` eV, `U=−27.2` eV, total `−13.6` eV.
- Exercises 19.1 Q1–Q2 belong to separate Planck/blackbody sheet unless book-read confirms an explicit shared dependency; photoelectric and de Broglie remain out of scope. Review all actual chapter-end questions for any relevant uncatalogued subparts before claiming book completeness.

## Past papers and authorized A-Level scope

- Official: [MyTCAS answer papers](https://www.mytcas.com/answers/); [A-Level Physics blueprint](https://mytcas.com/blueprint/a-level-64-phy/).
- Verified 2568 official paper [PDF](https://assets.mytcas.com/68/answer/tcas68-phy-a-level.pdf): Q25 second excited state means `n=3`, radius inverse `r_1=a/9`; Q30 photon `10.2 eV` emitted to `n=1` requires inverse level, `n=2`. These are excellent *patterns* for new problems.
- Official 2569 [announced answers](https://www.mytcas.com/news/94/); the 2569 Q30 wavelength-ratio characterization appears in the older review brief, but verify the exact public paper/figure before calling a new copy “A-Level 2569 Q30.” Never guess a year's question number.
- Earlier 2566–2567 and predecessor entrance exams can provide **skill patterns**, only once original year/wording is verified. Distinguish *verbatim official* from *adapted* / *A-Level-style newly authored*. Avoid reproducing entire copyrighted exam papers.
- Every new A-Level style problem must have a **Learning coverage key**; a problem requiring a skill not yet in Learning must be removed/reworked or Learning explicitly amended first.

## Precise solution-writing rule

**Conceptual item:** question → concise answer → one reason; any interpretive warning at end.

**Numerical item:**
1. Start: one short line classifying the task (initial/final level, atom type, given geometry, units).
2. Formula exactly matching visible Learning (no alternate unexplained model).
3. Rearrangement **symbolically before numbers** when variable is not already isolated.
4. Substitute values **with SI or eV units and explicit unit conversion** (including cancellation where useful), then compute.
5. **Bold final answer** with unit and sign; one short validation/interpretation sentence at end.
6. **Never insert long prose between algebra lines**; a whole calculation should be readable as one board-style solution.

When referencing an old worksheet solution, retain any scientifically material assumptions, remove repeated expository paragraphs *inside* the algebra, and verify each result independently. Do not change Quiz scoring answers or IDs.

## QA and handoff checklist

- Verify **book source** item by item: exact printed/PDF page, each subpart, associated figure, needed givens, solution and independently recomputed value; mark unresolved source discrepancies openly.
- Match each of the existing 20 reserved IPST groups to a new **Problem slot**, as well as all old 41 question skills / two-part example when retained; publish a source-to-new map. Do not claim “all book questions” on a 20-row inventory alone.
- Record **Learning stage → Problem item → prerequisite formula** for every Problem item; inspect no extras.
- TH/EN exact parity of item count, order, numbers, figures, formulas, answers. Every `data-sheet-slot` key paired and answer is exactly one direct child.
- Live HTML **one file** with `data-print-zone="learning"` and `data-print-zone="problem"` per language, using Chemistry 10.3's implementation; do not add print UI. Keep current route aliases, guide links and all separate video descriptors.
- Update `guides/19-1-2-unified.guide.json` with correct content ID, revision, HTML SHA256 and real semantic targets. Update review links only when target names actually change.
- QA math in proper units, language content, images, Chrome narrow width, reveal, guide jumps, A4 four editions only as applicable; user has **no target page limit**. Never claim Safari/physical-print tests from Chrome preview.
- When ready, create a branch/PR; **do not merge** without user review. Put actual QA results (pass/fail), source coverage and limitations in PR. No unrelated edits to shared engine.

## References

- Main worksheet: `public/content/physics/ipst/atomic-physics/19-1-2-evidence-bohr-learning-sheet.html`
- Main quiz: `public/content/physics/ipst/atomic-physics/19-1-2-bohr-review-quiz.html`
- Existing guide: `public/content/physics/ipst/atomic-physics/guides/19-1-2-unified.guide.json`
- Existing source register: `docs/learning-sheet/preparation/physics-bohr-19-1-2/ipst-original-items.json`
- User-provided book: https://drive.google.com/file/d/1claSYEw2Laz0zWRXjNcI9jhbt7A2sGMd/view
- Official curricular baseline (science additional physics strands): https://www.ipst.ac.th/wp-content/uploads/2022/05/SciCurriculum_2560.pdf
- Chemistry 10.3 style change PRs: [#166](https://github.com/Nixcentury/learning-hub/pull/166), [#167](https://github.com/Nixcentury/learning-hub/pull/167), [#168](https://github.com/Nixcentury/learning-hub/pull/168).

### Print figure size follow-up · 12 November 2026

Keep the four simple energy-level diagrams in Problem at no more than 95 mm wide in the print snapshot. Preserve their aspect ratio and readable labels. Check the final page layout in both languages, blank/answer editions, and standard/device-margin profiles. The Problem page budget remains 30 pages.
