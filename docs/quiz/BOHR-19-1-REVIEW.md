# 19.1 Bohr model and spectra review

One 50-question TH/EN set in six stages: 26 drag/tap fill, 13 five-option choices, and 11 numeric questions. Each question names the real sheet section and a specific reference. The shared Review button opens the original unified sheet alongside the quiz. The existing standalone link remains a fallback.

## Coverage

23 scored questions cover all 20 IPST entries in the [prepared inventory](../learning-sheet/preparation/physics-bohr-19-1-2/ipst-original-items.json). Example 19.4, Exercise 19.1 Q6 and chapter problem 5 each become two questions. The magnet activity has three blanks in one question. Its image shows only the initial paths. Activity 19.1 Q3 supplies labeled sample readings; the separate grating question checks calculation. Multi-value calculations use five-option choices when the answer field accepts only one number.

Four original problem figures are byte-identical to the [prepared crops](../learning-sheet/preparation/physics-bohr-19-1-2/quiz-source-images/). The final question uses a new proportional level diagram. Example 19.4 uses 486 nm = 4.86 × 10⁻⁷ m, correcting the book’s exponent. With the quiz constants the resulting photon energy is 4.09 × 10⁻¹⁹ J ≈ 2.55 eV. Q44 uses the 400–700 nm convention stated in its prompt.

The five final items are newly written. Priorities are informed by MyTCAS [2568 Q25](https://assets.mytcas.com/68/answer/tcas68-phy-a-level.pdf) (read excited-state labels and compare radii) and [2569 Q30](https://assets.mytcas.com/69/answer/tcas69-phy-a-level.pdf) (compare wavelengths through energy gaps).

## Validation

- The shared adapter loads 50 bilingual questions. All 64 gaps have unambiguous keys; each drag question has two unused distractors. Blank, partial and incorrect responses were checked against the existing scorer.
- Independently recomputed the 11 numeric and 13 choice keys. The new figure and the five source-derived images were inspected, and the four book crops were compared byte for byte.
- Verified both bank routes and the shared paired worksheet opener, including its standalone fallback. Content and guide validation, TypeScript, and production build passed; the Pages verifier matched 730 public files. The new set has not been exercised on a physical iPad or printed on A4.

| Q | Stable ID | Format | Unified sheet reference | IPST source |
| --: | --- | --- | --- | --- |
| 1 | `thomson-rutherford` | drag-drop | 1 · คำถาม 2–3 | `understanding-19-1-q2` (p. 80) |
| 2 | `scattering-evidence` | drag-drop | 1 · ตารางผลการกระเจิง | — |
| 3 | `alpha-turnback` | drag-drop | 1 · คำถาม 2–3 | `chapter-question-2` (p. 105) |
| 4 | `magnet-paths` | drag-drop | 2 · ตารางแนว 1–3 | `magnet-end` (p. 61) |
| 5 | `lamp-versus-gas` | drag-drop | 4 · คำถาม 8 | `activity-19-1-q1` (p. 64) |
| 6 | `gas-identity` | drag-drop | 4 · คำถาม 9 | `activity-19-1-q2` (p. 64) |
| 7 | `line-vs-continuous` | drag-drop | 5 · ภาพเปล่งออกและดูดกลืน | `understanding-19-1-q3` (p. 80) |
| 8 | `hydrogen-readings` | drag-drop | 4 · ตารางรวบรวมผลคำนวณ | `activity-19-1-q3` (p. 64) |
| 9 | `grating-one-row` | number | 3 · เกรตติงและมุมวัด | — |
| 10 | `allowed-states` | drag-drop | 6 · คำถาม 13 | — |
| 11 | `quantum-number` | drag-drop | 6 · เลขควอนตัมและเงื่อนไขวงโคจร | `understanding-19-1-q1` (p. 80) |
| 12 | `state-labels` | drag-drop | 9 · สถานะพื้นและสถานะกระตุ้น | — |
| 13 | `radius-proof-ingredients` | drag-drop | 7 · ก่อนพิสูจน์รัศมี | — |
| 14 | `radius-scaling` | drag-drop | 7 · สูตรรัศมีและคำถาม 14 | — |
| 15 | `radius-reverse-method` | drag-drop | 7 · คำถาม 14–15 | — |
| 16 | `book-radius-to-level` | choice | 7 · คำถาม 14 | `chapter-problem-3` (p. 107) |
| 17 | `book-radius-n3` | number | 7 · คำถาม 15 | `exercise-19-1-q6:a` (p. 80) |
| 18 | `radius-excited-ratio` | choice | 7 · สูตรรัศมี | — |
| 19 | `k-u-e-meanings` | drag-drop | 8 · ตารางความหมาย K, U, E | — |
| 20 | `energy-relations` | drag-drop | 8 · ตารางเปรียบเทียบ K, U, E และคำถาม 18 | — |
| 21 | `higher-energy-less-bound` | drag-drop | 9 · แผนภาพระดับพลังงานไฮโดรเจน | — |
| 22 | `speed-radius-energy-pattern` | drag-drop | 10 · คำถาม 23–25 | — |
| 23 | `book-ground-k-u` | choice | 8 · ตาราง K, U, E | `chapter-problem-19` (p. 109) |
| 24 | `book-general-speed` | choice | 10 · ที่มาสูตรอัตราเร็ว | `exercise-19-1-q3` (p. 80) |
| 25 | `book-ionize-n2` | number | 9 · คำถาม 21–22 | `exercise-19-1-q4` (p. 80) |
| 26 | `scaled-speed-n5` | number | 10 · สูตรอัตราเร็วและคำถาม 25 | — |
| 27 | `photon-direction` | drag-drop | 11 · คำถาม 26 และ 28 | — |
| 28 | `same-gap-reverse` | drag-drop | 5 · ภาพช่องว่างพลังงานเดียวกัน | — |
| 29 | `frequency-wavelength-rule` | drag-drop | 11 · คำถาม 26–27 | — |
| 30 | `line-energy-match` | drag-drop | 16 · คำถาม 38 | — |
| 31 | `book-example-wavelength` | number | 15 · ตัวอย่าง 1 ก | `example-19-4:a` (p. 76) |
| 32 | `book-example-photon-energy` | choice | 15 · ตัวอย่าง 1 ข | `example-19-4:b` (p. 76) |
| 33 | `book-hypothetical-emission` | number | 16 · คำถาม 36 | `exercise-19-1-q5` (p. 80) |
| 34 | `book-excite-from-spectrum` | number | 16 · คำถาม 38: จับคู่ช่องว่างกับโฟตอน | `chapter-problem-4` (p. 107) |
| 35 | `book-absorption-frequency` | number | 11 · คำถาม 28 | `chapter-problem-5:a` (p. 107) |
| 36 | `book-emission-frequency` | choice | 11 · คำถาม 26–27 | `chapter-problem-5:b` (p. 107) |
| 37 | `wavelength-ratio-method` | choice | 11 · พลังงานโฟตอนและความยาวคลื่น | — |
| 38 | `one-atom-many-atoms` | drag-drop | 12 · คำถาม 29–31 | — |
| 39 | `series-by-final-level` | drag-drop | 13 · คำถาม 32 | — |
| 40 | `rydberg-series-limit` | drag-drop | 14 · สมการริดเบิร์กและคำถาม 33; ดูขอบเขตต่อในหัวข้อ 15 | — |
| 41 | `book-four-level-lines` | number | 12 · คำถาม 31 | `chapter-question-3` (p. 105) |
| 42 | `book-three-lines-wavelengths` | choice | 16 · คำถาม 37–38: อ่านช่องว่างของแต่ละคู่ | `chapter-problem-2` (p. 106) |
| 43 | `book-hydrogen-n3-routes` | choice | 16 · คำถาม 37 | `exercise-19-1-q6:b` (p. 80) |
| 44 | `book-balmer-visibility` | choice | 15 · คำถาม 34–35 | `think-77` (p. 77) |
| 45 | `probability-cloud` | drag-drop | 17 · คำถาม 40–41 | — |
| 46 | `exam-radius-backward` | choice | 7 · สูตรรัศมีและคำถาม 14 | — |
| 47 | `exam-radius-level-change` | choice | 7 · คำถาม 14–16 | — |
| 48 | `exam-frequency-ratio` | choice | 11 · คำถาม 26–28 | — |
| 49 | `exam-wavelength-ratio` | number | 11 · จากพลังงานโฟตอนไปความยาวคลื่น · คำถาม 27 | — |
| 50 | `exam-model-levels` | number | 16 · คำถาม 36 และ 38 | — |
