# Chemistry 10.1 — Acid–Base Theories learning sheet

23 October 2026, Asia/Bangkok. Content-only addition to the question-bank topic, using the existing HTML learning-sheet, language and print controllers.

## Target and content

- Live-service catalog read on 23 October: Chemistry → Acids and Bases → Acid-Base Theories; `bankKey=b-415092278077d3c2c4fb13b9`. The existing bank has one question. Neither its questions nor its identifiers are edited.
- Added menu: `public/content/bank/chemistry/b-415092278077d3c2c4fb13b9.html`; route slug `acid-base-theories`; tool key `learning-sheet`; content ID `chemistry-ipst-acid-base-10-1-sheet`.
- Source: `public/content/chemistry/ipst/acid-base/10-1-acid-base-theories-learning-sheet.html`.
- Eleven sections: properties/evidence; reaction patterns; types; 17 everyday examples; 50 common ions; naming; Arrhenius; Brønsted–Lowry; Lewis; comparison; independent practice.
- Theory appears under headings with writing space. Recall questions follow small content groups. Examples and independent questions progressively remove support. TH and EN have the same 158 answer-slot IDs.
- Three teaching-example groups. All three IPST understanding-check groups (8 subitems) and Exercise 10.1 (8 subitems) are retained/adapted; 8 final parallel subitems and 6 independent theory exercises are added. Recall prompts are interspersed throughout. Numbered questions run 1–9.
- Three new SVG diagrams track the reacting lone pair and new bond. They are original vector schematics, not copied textbook images or generated raster structures. Only the reacting lone pair is shown; adduct notation is used for the products.
- Full student and teacher PDFs were read locally: student printed pp. 4–9, teacher printed pp. 10–14. Original textbook PDFs and local browser artifacts are not distributed in the repository. Additional factual references are recorded in the asset README.

## Academic checks

- Distinguishes ion dissociation from ion formation by reaction with water. Conductivity and the presence of H or OH in a formula are not used as sufficient acid/base criteria.
- pH thresholds of 7 explicitly refer to 25 °C. Metal/acid reaction patterns are qualified; neutralization does not imply a final pH of 7 in all mixtures.
- HCl(g) + NH3(g) motivates the aqueous-model limitation; NH3 + BF3 motivates the electron-pair model. Water's changing proton role is explained from the actual forward reaction.
- Carbonate, hydrogen carbonate and hypochlorite examples are identified as salts with basic behaviour. Baking soda, baking powder, washing soda, limewater, limestone and soap-production reagents are distinguished.
- Ion formulas and charges, balanced equations, proton transfers and the eight original final answers were checked against the source guide and additional references. Household examples describe substances/uses and allow formulation differences; no fixed household pH values are invented.
- Simple ion-table formulas use native subscript/superscript markup. Reaction equations use the existing MathJax/mhchem renderer. Total delimited formulas stay below its 500-formula document limit; no engine changes are needed.

## Validation

- `pnpm test:unit`: 325/325 pass.
- `pnpm build`: content validation, TypeScript and production build pass; 404 public files match their sources.
- Browser harness with the existing learning-sheet, language, math and print controllers: all 158 paired slots initially hidden; individual reveal, reveal-all and shared TH/EN state pass. All images load and all formulas finish without math errors. Both languages pass at 390 px with no document overflow.
- Real Hub bank route opens the new worksheet in Guest mode with the freshly retrieved public chemistry catalog. Firebase is stubbed; no live account, student or score writes are made.
- Four centrally generated print variants pass: Thai blank/answers, 43 pages each; English blank/answers, 44 pages each. Each contains only its selected language, all 158 writing areas and all three diagrams. Blank copies contain no answer DOM; printing preserves the on-screen reveal state.
- Sarabun is embedded for Thai text and print metadata. Visually inspected every page of all four variants after grouping headings with their first content block. No clipping, table overlap or detached section/example headings remain.
- Local evidence lives in ignored `qa-output/chemistry-10-1-*` files. Actual iPad Safari, Apple Pencil and physical printer testing are outside this local Chromium verification.

Publication must also pass the repository Pages build/deploy and live `deployment.json` plus asset-byte verification. The chapter menu outside the bank, shared CSS, engines, Apps Script, Sheet and Firebase configuration are unchanged.

## Per-question writing spaces — 23 October 2026 revision

- A mobile review showed several recall questions followed by one shared answer area. Split all 19 recall groups into 78 individually spaced subitems in both languages, including naming, ion formulas, familiar-substance examples, theory definitions and final recall. Each question now has its own answer immediately below it.
- Retain each original recall ID on its first subitem and append stable suffixes for the remaining subitems. The worksheet has 158 paired slots after the revision. Existing theory notes, numbered IPST exercises, diagrams and bank/content IDs are unchanged.
- Each subitem and its writing area form a small print-keep group; long recall groups can flow across pages. Short formulas/names use 9–12 mm spaces; reasoning and equations use 16–25 mm minimum spaces and can expand for answers.
- New browser assertions check all 78 prompt/answer pairs at mobile width, independent answer DOM, all 158 slots in each print edition and unchanged on-screen reveal state after printing. Unit tests remain 325/325; build and the actual Guest bank route pass. The four PDFs are TH 43/43 and EN 44/44 pages. Every page was visually reviewed, with larger checks of the reported area.

## ปรับเฉพาะตัวอย่างนำเข้าสู่เบรินสเตด–ลาวรี — 28 ตุลาคม 2026

- ตามคำขอครู ใช้แอมโมเนียในน้ำแทนข้อความขอบเขตอาร์เรเนียสที่ยกแก๊ส HCl กับ NH3 เฉพาะ block `arrhenius-limitation` ใน TH/EN เปลี่ยนชื่อหัวข้อ/ป้ายช่องเป็นแอมโมเนียในน้ำ และเพิ่มพื้นที่พิมพ์ขั้นต่ำจาก 24 เป็น 44 mm
- แสดง `NH3(aq) + H2O(l) ⇌ NH4+(aq) + OH−(aq)` แล้วอธิบายว่า NH3 รับ H+ จากน้ำ ทำให้เกิด OH− เพื่อเชื่อมกับหัวข้อถัดไป นิยามอาร์เรเนียสในใบนี้ใช้การเพิ่มความเข้มข้น OH− จึงไม่อ้างว่า NH3 อยู่นอกทฤษฎีเพียงเพราะไม่มี OH ในสูตร
- ตรวจอะตอม N/H/O และประจุสมดุลทั้งสองข้าง เทียบ OpenStax Chemistry 2e §14.1 และ Chemistry §11.3: https://openstax.org/books/chemistry-2e/pages/14-1-bronsted-lowry-acids-and-bases และ https://openstax.org/books/chemistry/pages/11-3-solubility
- เปรียบเทียบไฟล์ก่อน/หลังโดยปิดบังเฉพาะสอง block ที่แก้: bytes ส่วนอื่นเหมือนเดิมทั้งหมด; 158 slot keys ต่อภาษาตรงกันและ answer ลูกตรงช่องละหนึ่งตัว
- `pnpm test:unit`: 374 ผ่าน 0 ไม่ผ่าน; `pnpm build`: content validation / TypeScript / Vite / Pages artifact 601 public files ผ่าน; `git diff --check` ผ่าน
- Chromium Hub: เปิด/ปิดเฉพาะช่องนี้ได้ทั้ง TH/EN ความสูงคงเดิม 149.03125 px ไม่มี math error; กรอบ Hub 390 px มีพื้นที่ช่อง 327 px สมการกว้าง 326.953125 px และไม่ล้น
- Central A4: ทั้ง TH/EN × ว่าง/เฉลย มี 43 หน้า 158 ช่อง; เป้าหมายอยู่หน้า 27 และกรอบสูง 167 px ทั้งสี่ฉบับ ฉบับว่างไม่มี answer DOM (0 ทั้งใบ) ฉบับเฉลยมี 158 (1 ใน block เป้าหมาย) ไม่มี math error หรือ page-body overflow
- ตรวจภาพหน้าเป้าหมายทั้งสี่ฉบับแล้ว หัวข้อ–คำอธิบาย–สมการอยู่ด้วยกัน ไม่ได้ทำ visual QA ใหม่ทุกหน้าของทั้งใบ และไม่ได้ทดสอบ native PDF driver/iPad/Safari เพิ่ม
- หลักฐานในเครื่อง: `qa-output/ammonia-bridge/` (logs, byte comparison source, browser checks, reading/target print screenshots) ไม่รวมใน PR

## ย้ายต้นฉบับไปเตรียมชุดทบทวนและใช้โจทย์ดัดแปลง — 1 พฤศจิกายน 2026

- ขอบเขตที่ครูอนุมัติ: คงเนื้อหาอธิบายเดิม เปลี่ยนตัวอย่าง/โจทย์ สสวท. เป็นฉบับดัดแปลงเล็กน้อย เก็บต้นฉบับพร้อมรูป ตาราง เฉลย และเลขหน้าไว้ทำชุดทบทวนภายหลัง และลดช่องไฟที่เกินจำเป็น
- ฐานงาน `main` คือ `9fb045d672d3ddcff450baca53aa277dc0aa877a`; bankKey, contentId, tool-key และ route เดิมคงอยู่
- อ่านภาพหนังสือจริงหน้า 4–9 (PDF 14–19) และคู่มือครูหน้า 10–14 (PDF 23–27) เทียบกับใบก่อนแก้
- เก็บ 24 รายการ: ตัวอย่าง 8 กรณี คำถามตรวจความเข้าใจ 8 ข้อย่อย และแบบฝึกหัด 10.1 อีก 8 ข้อย่อย ส่งแพ็กต้นฉบับ `chemistry-10-1-originals-for-review.zip` ให้ครูแยกต่างหาก มี HTML ก่อน/หลัง TH/EN ภาพ crop จากหนังสือและคู่มือครู 12 ภาพ SVG เดิม 3 รูป และ manifest หน้า/พิกัด/SHA-256 ไม่รวม PDF ทั้งเล่ม ส่วน `docs/quiz/preparation/chemistry-acid-base-10-1/README.md` ใน repository มีเฉพาะบันทึกจับคู่ ไม่เผยแพร่ภาพสแกนหรือลิงก์ส่วนตัว
- ปรับสมการและคำตอบทั้งสองภาษา เพิ่ม SVG ให้ตรงกับ NH₃/BCl₃, NH₃/AlCl₃ และ Cl⁻/BCl₃ ตรวจบทบาทกรด–เบสด้วยตนเอง และตรวจดุลอะตอม/ประจุของสมการแสดงผลกับสมการเฉลยที่เปลี่ยน 24 สมการผ่าน
- ตรวจด้วย DOM เปรียบเทียบกับฐาน: ช่วงพื้นฐาน 1–6 เหมือนเดิมทุกส่วน จำนวนและ semantic keys ครบ 158 ช่องต่อภาษา ทุกช่องมี answer ลูกตรงหนึ่งตัว ความสูงพื้นที่เขียนของทุกช่องเหมือนเดิม เฉพาะ 24 ช่องเป้าหมายและชื่อสารในคำอธิบาย `water-role`/บทนำลิวอิสที่อ้างภาพถัดไปเปลี่ยน โจทย์แต่งเพิ่ม นิยาม และ block แอมโมเนียในน้ำที่ครูเลือกไว้คงเดิม
- ตรวจคู่สมการ TH/EN ตรงกัน ภาพใหม่มี width/height และไฟล์จริงครบ ตรวจภาพ crop และ SVG ในเครื่องแล้ว ปรับขอบ crop ให้ครบสมการ/ตาราง/คำตอบที่ต้องใช้ต่อ
- ลด margins ระหว่างหัวข้อ ตัวอย่าง ข้อย่อย และภาพ โดยไม่ลดขนาดตัวอักษรหรือความสูงพื้นที่ตอบ ไม่มีเส้นหรือจุดเขียนเพิ่ม
- `pnpm test:unit`: 616 ผ่าน 0 ไม่ผ่าน; `pnpm build`: ผ่านทั้ง content validation, guide validation, TypeScript, Vite และ Pages artifact; `git diff --check`: ผ่าน
- Browser QA ผ่าน preview ที่รองรับแล้ว ใช้ iframe ที่ปิด scripts พร้อม `attachLearningSheet`, `applyContentLanguage`, `renderHtmlMath` และ `openHtmlPrint` จาก source กลางจริง ไม่สร้างตัวควบคุมหรือระบบพิมพ์ทดแทน ตรวจการเริ่ม controller สำเร็จ สูตร `ready` ภาพครบทั้งสองภาษา และไม่มี math error
- QA พบ attribute บน style ในร่างแรกไม่อยู่ในสัญญา runtime จึงนำ attribute นั้นออกก่อนตรวจซ้ำ ตัวควบคุมเริ่มทำงานตามปกติ ไม่ได้เปลี่ยน engine เพื่อยอมรับร่าง
- เปิดเฉลยรายช่องแล้วความสูงคงเดิม 60.6875 px; เปิดทั้งหมดครบ 158 semantic slots (316 DOM slots รวม TH/EN) ปิดทั้งหมดและสลับภาษาใช้สถานะร่วมกันได้ ตรวจ iframe 390 px ทั้ง TH/EN ไม่มีแนวนอนล้น (clientWidth/scrollWidth 373/373 px)
- Central A4 preview: TH ว่าง/เฉลย และ EN ว่าง/เฉลย **39 หน้าทั้งสี่ฉบับ** แต่ละฉบับมี 158 ช่อง 3 ภาพ และหัวข้อเนื้อหาครบ 11 ช่วง ฉบับว่างมี answer DOM 0 ส่วนฉบับเฉลยมี 158 ไม่มีอีกภาษาปะปน ไม่มี math error หรือ page-body overflow ตรวจภาพหน้าที่มีโจทย์และรูปปรับใหม่ด้วยสายตาแล้ว ไม่ได้อ้างว่าเปิดตรวจภาพทีละหน้าครบทั้ง 156 หน้า
- เปิดฉบับก่อนแก้ใน fixture/renderer เดียวกันเพื่อตรวจฐานจริง: TH ว่าง 43 หน้า และ EN ว่าง 43 หน้า ดังนั้นฉบับปรับลด 4 หน้าต่อภาษาโดยคงความสูงพื้นที่ตอบทุกช่อง ผลพิมพ์ไม่เปลี่ยนข้อความหรือสถานะเฉลยของต้นฉบับที่เปิดอ่าน
- ข้อจำกัด: ตรวจ controller/print ผ่าน fixture บน Chromium; Hub shell เต็มไม่เริ่มบน preview HTTP เพราะ `crypto.randomUUID` ต้องใช้ secure context ซึ่งไม่ใช่ขอบเขตของงานนี้ ไม่มีการแก้ auth/monitor เพื่อทดสอบใบ ยังไม่ได้ทดสอบ native PDF driver, iPad/Safari หรือเครื่องพิมพ์จริง และยังไม่อ้างว่าเผยแพร่เว็บจริงแล้ว
- ไม่สร้าง Quiz ใหม่ ไม่แก้ engine, Apps Script, Firebase Rules, คะแนน หรือคำตอบนักเรียน ไฟล์เตรียมชุดทบทวนอยู่ใต้ `docs/` และไม่เป็นเครื่องมือในเมนูนักเรียน
