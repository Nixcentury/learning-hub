# 19.1 Sheet 1 — open-book quiz continuation

Topic menu: `public/content/bank/physics/b-0f490c3358e9212cee2e2a43.html`.
Source: `public/content/physics/ipst/atomic-physics/19-1-1-blackbody-planck-learning-sheet.html`, revision `2026-10-29-1`.

## Agreed approach

Keep the detailed learning sheet. Students may read it and use its + answers while doing these quizzes. Cover **content, conceptual questions and problem-solving skills** completely across sets of about 20 questions. Re-author passages, questions and situations rather than copying the source wording. Add sets rather than cutting coverage. Use drag passages for content, helpful images, adapted choices for concepts/symbolic answers and numeric input for calculations. Scores are independent of AI method stamps; drag recall does not need AI.

Source inventory: 9 sections, 16 numbered questions, 2 model-data activities, 3 worked examples, 2 IPST exercise problems, one Think question and a separate quantum-number question. Recheck the source revision before extending.

## Current work

**Set 1 authored:** `19-1-1-blackbody-quiz-set-1.html`; stable activity ID `physics-ipst-atomic-19-1-1-quiz-set-1`. 20 questions: 7 drag passages, 11 choices (one symbolic comparison), 2 numeric graph readings. Each question links to its reading section. The five existing images are reused with attribution; the sheet is unmodified.

| Source coverage | Set 1 questions |
| --- | --- |
| Section 1: IR evidence, invisible EM radiation, estimated surface temperature | 1–3 |
| Section 1: radiation above 0 K without visible glow | 2, 4 |
| Section 1: heated iron, colour sequence, multiple wavelengths | 5–6 |
| Section 2 / Q2–3: axes, nm, common scale, 3000/6000 K peaks | 7–9 |
| Section 2 / Q4: continuous spectra, orange glow, peak versus spectral extent | 10, 13–14 |
| Section 2: temperature, peak wavelength, area / total emission per area per time | 11–12, 20 |
| Section 2 Think: stated gas-burner case versus artistic colour labels | 15 |
| Section 3 / Q5: blackbody absorption, emission, appearance and cavity | 16–19 |

The Planck-hypothesis paragraph at the end of section 3 belongs to Set 2. Quantization, unit conversions and later calculations remain pending.

## Next sets — not yet created

| Set | Scope / source |
| --- | --- |
| 2, about 20 | Planck hypothesis; both model-data activities (sections 4–5); full quanta at fixed frequency, E = nε, ε/f = h, ε = hf; formula/symbol/unit distinctions and the quantum-number question in section 6. Label simulated data as simulated. |
| 3, about 20 | Section 6 W = qV, J/eV, c = fλ, nm/m; section 7 examples 1–2 and matching section 8 skills: find ε, f or λ in either direction, convert units, identify the spectral band. |
| 4, about 20 | Section 7 example 3; IPST exercises 1–2 and section 8 comparison, whole-quantum, laser, IR, power-time and photon-count skills (questions 10–16); section 9 summary. Map each source question to a quiz question to avoid gaps or unnecessary duplication with Set 3. |

Work one set at a time; the user may switch topics between sets. End deliveries with the completed set and next pending set. Add only completed sets to the menu. Send a separate PR and do not merge concurrent work.

## Reading confirmation

Root opt-in: `data-drag-read-confirm="true"`. Before moving forward from a drag question with placed answers, the engine confirms the student's filled passage without revealing correctness. Cancel stays on the question; accept continues. Revisit without editing does not repeat the prompt within the session; changed answers do. Blank questions remain skippable. Grading is unchanged and other sets do not opt in automatically. Native OK/Cancel controls are explained in the message. This acknowledgement is not proof of understanding or an AI stamp.

## QA

Base for this set: `f91993a587d467ead741944799e56f793e894f50`.

- `pnpm test:unit`: 470 passed, including the new opt-in reading test (cancel, accept, revisit, edit, blank and legacy-set behavior), existing score/AI independence and printing tests.
- Final `pnpm build` passed content validation, TypeScript and the Pages check: **653** public files matched. `git diff --check` passed.
- The actual authored file loads through `readQuizContent`: 20 valid questions, all 20 authored answer keys grade correctly. Source-to-question coverage is recorded above.
- Chrome preview visited every question in English; Thai passages, choices and graph inputs were also checked. All five original figure assets loaded and fit their context width without cropping. The shared image sizing was corrected after visual QA exposed full-resolution assets overflowing their container.
- Filled the first passage by tapping pieces/slots; reload retained it. Inspected the rereading prompt in TH and EN. Cancel stayed on Q1; accept advanced to Q2. The prompt contains the student's whole sentence without slot-label clutter or correctness disclosure.
- Confirmed that the mastered question's explanation is visible in both languages. Solutions use translated child blocks so their authored hidden wrapper does not hide the displayed explanation.
- The reading link opened the actual public Hub learning-sheet route. Guest entry displayed the original sheet with its + buttons. The raw content file is deliberately not used as the reading link because it lacks the Hub's sheet controls.
- Ordinary grading check: one completed drag, one correct choice, one deliberately wrong choice, and graph entries 1000 nm / 500 nm produced **4/20**, including both approximate graph readings as correct. No working was submitted; no AI review was claimed and the missing-working warning allowed grading normally.
- Shared blank/key/evidence export paths remain in place; the unit suite checks printing logic. This change did not re-run a native print/PDF export on a physical device. Physical iPad/Safari and the new quiz on the deployed origin remain untested before merge.

Final build/copy checks and PR are reported with the delivery. Next pending work is **Set 2**; Sets 2–4 are not yet authored.
