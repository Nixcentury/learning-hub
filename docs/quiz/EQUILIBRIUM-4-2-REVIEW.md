# 4.2 worksheet-aligned CM and CG review

Add the first review quiz to the existing centre-of-mass/centre-of-gravity
topic. It contains 32 questions: 20 drag/tap questions with 56 gaps, 11
five-option reasoning questions, and one numeric midpoint question. Every
question has bilingual hints, explanations and an explicit reading location
in the current worksheet. All four IPST understanding checks reproduced in
that worksheet appear at questions 27–30.

## Integration

- Topic: `b-c54c2d76bc074671ec10618f`, existing slug
  `centre-of-mass-and-gravity`.
- Menu route: `quiz-set-1`.
- Content/activity ID: `physics-ipst-equilibrium-4-2-review`.
- Source: `public/content/physics/ipst/equilibrium/4-2-centre-of-mass-review-quiz.html`.
- Review uses the existing paired-sheet integration and points to
  `physics-ipst-equilibrium-4-2-sheet`.
- The existing worksheet and CG lab menu entries remain unchanged. The
  existing sheet, lab code and original assets also remain unchanged.
- The optional lab link supports practicing the sheet's evidence-collection
  procedure. Quiz scoring does not depend on a particular simulation result,
  user account or live lab state.

## Scope and teaching choices

Use the same assumptions as the worksheet: an initially nonrotating book
with no other rotational effects; the same rigid lamina and mass distribution
when changing suspension holes; uniform gravity for the CM/CG relationship.
Keep body-relative positions distinct from room coordinates. Geometry alone
does not establish mass symmetry, and uniform mass distribution is different
from a uniform gravitational field.

Recall and procedure questions use drag/tap pieces. Each bank includes at
least two unused distractors, with slot labels that make the intended
placement unambiguous. Reasoning questions use five choices. The numerical
question applies the worksheet's midpoint example, 20/2 = 10 cm, with absolute
tolerance 0.01 cm; the diagram's midpoint answer label is replaced by “?”.
No weighted-coordinate CM formula, integration, moment calculation or extra
stability syllabus is introduced.

The quiz references 17 visual files: eight unchanged original sheet assets
and nine SVG adaptations. Before/after book views are separate panels for
readability. Numbered block candidates distinguish the internal body centre
from the visible-face centre and a corner. Ring candidates distinguish the
empty centre, a material point and a noncentral exterior point. The original
geometry is retained and its candidate positions were checked numerically.
See the asset directory's `SOURCES.md` for provenance and primary references.

## Validation

- `pnpm build` passed: content/guide validators, TypeScript, Vite and the
  Pages resource verifier (772 identical public files). Existing draft
  warnings are unrelated.
- 149 existing tests passed across drag, numeric, review-link, learning-sheet,
  bank-menu and quiz-resume suites.
- The actual quiz adapter loaded all 32 questions without errors. All keys
  grade correctly; wrong choices/numbers and distractor placements are
  rejected; all 56 gaps and all 17 visual paths are accounted for.
- `data-reading-slots` maps quiz questions to the current sheet's original
  answer-slot IDs. Coverage includes all 30 source answer slots. IPST labels
  1–4 each occur once at questions 27–30.
- The entire original worksheet and both pre-existing menu entries were
  compared with the base branch and remain unchanged.
- Independent geometry checks: the projected centre of eight block vertices
  matches candidate 1; candidate 2 is only a face centre. The ring's candidate
  1 is at radius zero, candidate 2 lies between the inner/outer radii, and
  candidate 3 lies outside the outer radius.
- Desktop browser/standalone player: all 32 questions loaded; images loaded
  without missing files; Thai/English switched; the separated book panels and
  numbered block rendered clearly. Drag matching and Next's reread dialog
  worked. A typed numeric answer remained correct after reload. Two drag
  answers, one numeric and one choice produced the expected 4/32 demonstration
  score with all four submitted answers correct.
- Review's source, ID and `/learning-hub/` URL were checked using the actual
  configuration helper. Full Hub window pairing and mobile browser layout
  were not exercised. The known HTTP preview limitation affects Hub startup
  (`crypto.randomUUID` requires a secure context), so browser QA used the
  standalone player. No shared engine change is included.

## Question and reading map

The following table records the authored reading location for every question.

| # | Type | Focus | Worksheet 4.2 reading location |
| --- | --- | --- | --- |
| 1 | Drag/tap | CM หมายถึงอะไร? เติมให้ครบทั้งความหมายและข้อควรระวัง | หัวข้อ 1 → ศูนย์กลางมวล (CM) |
| 2 | Drag/tap | ทดลองดันหนังสือ: วางเงื่อนไขทดลองให้ถูก | หัวข้อ 1 → เริ่มต้นทดลอง |
| 3 | Drag/tap | กรณี A: เติมสิ่งที่สังเกตจาก A1 → A2 | หัวข้อ 1 → ผลการทดลอง → กรณี A และคำถามใต้ภาพ |
| 4 | Drag/tap | กรณี B: เติมสิ่งที่สังเกตจาก B1 → B2 | หัวข้อ 1 → ผลการทดลอง → กรณี B และคำถามใต้ภาพ |
| 5 | Drag/tap | ทดลองซ้ำหลายด้าน: เส้น 1–3 และจุด P บอกอะไร? | หัวข้อ 1 → ทดลองซ้ำจากหลายด้าน → คำถามเส้น 1–3 และจุด P |
| 6 | Drag/tap | แนวแรงผ่าน CM ต่างจากจุดสัมผัสอย่างไร? | หัวข้อ 1 → แนวแรงผ่าน CM กับจุดที่สัมผัสวัตถุ → ใช้ความเข้าใจ ข้อ 1 และ 5 |
| 7 | Choice | นักเรียนบอกว่า “ดันที่ขอบ ต้องหมุนเสมอ” ข้อใดอธิบายได้ถูก? | หัวข้อ 1 → แนวแรงผ่าน CM กับจุดที่สัมผัสวัตถุ → ใช้ความเข้าใจ ข้อ 5 |
| 8 | Choice | ติดดินน้ำมันด้านขวา: CM ของระบบเปลี่ยนอย่างไร? | หัวข้อ 1 → ใช้ความเข้าใจจากการทดลอง ข้อ 4; หัวข้อ 3 → ตำแหน่ง CM กับการกระจายมวล |
| 9 | Choice | หนังสือเลื่อนโดยไม่หมุน สรุปว่าสมดุลกลได้เลยหรือไม่? | หัวข้อ 1 → ใช้ความเข้าใจจากการทดลอง ข้อ 6 |
| 10 | Drag/tap | ทดลองแขวนแผ่นวัตถุ: จัดอุปกรณ์และสิ่งที่คงเดิม | หัวข้อ 2 → เริ่มต้นทดลอง |
| 11 | Drag/tap | ก่อนบันทึกหนึ่งแนวลูกดิ่ง: วางขั้นตอนให้ถูก | หัวข้อ 2 → เริ่มต้นทดลอง → รอให้หยุดนิ่งแล้วลากเส้น |
| 12 | Drag/tap | เปลี่ยนจากรู A เป็น B: สิ่งใดเปลี่ยน สิ่งใดคงเดิม? | หัวข้อ 2 → ผลการทดลอง ภาพ A–B; ใช้ความเข้าใจ ข้อ 5 |
| 13 | Drag/tap | แขวนครั้งเดียว: รู้ CG เป็นจุดแล้วหรือยัง? | หัวข้อ 2 → ใช้ความเข้าใจจากการทดลอง ข้อ 2 |
| 14 | Drag/tap | จุด P ในภาพ D และแนวที่สามมีหน้าที่อะไร? | หัวข้อ 2 → ภาพ D; สรุปผล; ใช้ความเข้าใจ ข้อ 3 |
| 15 | Drag/tap | ติดตาม P ในท่าแขวน: วางความสัมพันธ์ให้ถูก | หัวข้อ 2 → คำถามติดตาม P จาก D ไป A–C; ใช้ความเข้าใจ ข้อ 1 |
| 16 | Drag/tap | CG แทนอะไร และน้ำหนักชี้ทางใด? | หัวข้อ 2 → ศูนย์ถ่วง (CG) |
| 17 | Choice | แนวที่สามพลาดจุดตัดมาก ควรทำอย่างไร? | หัวข้อ 2 → ใช้ความเข้าใจจากการทดลอง ข้อ 3 |
| 18 | Choice | เปลี่ยนรูแขวนแล้วแผ่นหมุน: CG ย้ายจริงหรือไม่? | หัวข้อ 2 → ใช้ความเข้าใจจากการทดลอง ข้อ 5; หัวข้อ 3 → ตำแหน่ง CM |
| 19 | Choice | ทดลองจริงได้บริเวณจุดตัดเล็ก ๆ ควรตีความอย่างไร? | หัวข้อ 2 → คำถามเส้นตัดกันอย่างไร; เทียบหัวข้อ 1 → เส้น 1–3 |
| 20 | Drag/tap | CM กับ CG ตรงกันเมื่อใด? | หัวข้อ 3 → CM และ CG อยู่ตำแหน่งเดียวกันเมื่อใด? |
| 21 | Drag/tap | ตำแหน่ง CM เทียบกับตัววัตถุขึ้นกับอะไร? | หัวข้อ 3 → ตำแหน่ง CM กับการกระจายมวล |
| 22 | Drag/tap | ภาพ 1–3: จับคู่ตำแหน่ง CM และ CG ของวัตถุสม่ำเสมอ | หัวข้อ 3 → หาตำแหน่งจากสมมาตร → ตัวอย่างทั้งสาม |
| 23 | Number | ไม้บรรทัดสม่ำเสมอยาว 20 cm: CM อยู่ที่ขีดกี่ cm? | หัวข้อ 3 → ไม้บรรทัดสม่ำเสมอ ยาว 20 cm |
| 24 | Drag/tap | จุดใดคือ CM ของแท่ง ไม่ใช่เพียงกึ่งกลางหน้าด้าน? | หัวข้อ 3 → แท่งทรงสี่เหลี่ยมมุมฉากเนื้อสม่ำเสมอ |
| 25 | Drag/tap | วงแหวน: CG อยู่ตรงกลางที่ไม่มีเนื้อวัสดุได้หรือไม่? | หัวข้อ 2 → ใช้ความเข้าใจ ข้อ 4; หัวข้อ 3 → วงแหวนสม่ำเสมอ |
| 26 | Choice | รูปร่างสมมาตร แต่กระจายมวลไม่เท่ากัน: สรุป CM ตรงกลางรูปได้หรือไม่? | หัวข้อ 1 → ใช้ความเข้าใจ ข้อ 3; หัวข้อ 3 → หาตำแหน่งจากสมมาตร |
| 27 | Choice | สสวท. ข้อ 1: บนพื้นโลก CM กับ CG อยู่ที่เดียวกันหรือไม่? | หัวข้อ 4 → คำถามตรวจสอบความเข้าใจ 4.2 ข้อ 1; หัวข้อ 3 → CM และ CG |
| 28 | Choice | สสวท. ข้อ 2: แขวนทรงกระบอกอย่างไรให้แกนวางแนวระดับ? | หัวข้อ 4 → คำถามตรวจสอบความเข้าใจ 4.2 ข้อ 2 และภาพประกอบ |
| 29 | Choice | สสวท. ข้อ 3: ย้ายจากพื้นโลกไปดวงจันทร์ CM และ CG เปลี่ยนหรือไม่? | หัวข้อ 4 → คำถามตรวจสอบความเข้าใจ 4.2 ข้อ 3 |
| 30 | Drag/tap | สสวท. ข้อ 4: เติมสองตัวอย่างที่ CG อยู่นอกเนื้อวัตถุ | หัวข้อ 4 → คำถามตรวจสอบความเข้าใจ 4.2 ข้อ 4; หัวข้อ 3 → วงแหวน |
| 31 | Drag/tap | เตรียมใช้แล็บ 4.2: เก็บหลักฐานแต่ละช่วงอย่างไร? | หัวข้อ 2 → เริ่มต้นทดลอง → สรุปผลและใช้ความเข้าใจ ข้อ 2–3 |
| 32 | Choice | เชื่อมสองการทดลอง: จุดที่ได้เหมือนกันเพราะเหตุใด? | หัวข้อ 1 → สรุปผล CM; หัวข้อ 2 → สรุปผล CG; หัวข้อ 3 → ความสัมพันธ์ |
