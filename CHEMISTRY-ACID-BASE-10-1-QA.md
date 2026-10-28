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
