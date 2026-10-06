# คลังข้อสอบจาก Sheet เดิม

รุ่นแรก 6 ตุลาคม 2026 — บริการฟิสิกส์เผยแพร่และตั้งค่า endpoint ในเครื่องแล้ว ทดสอบอ่านจริงผ่าน Guest สำเร็จ ยังไม่ Push การเชื่อมนี้ขึ้น GitHub Pages

## ใช้งานและเพิ่มเนื้อหา

เส้นทาง: หน้าวิชา → คลังข้อสอบ → เลือกชื่อ/ID → เลือกเครื่องมือ → หน้าต่างกลาง

คง CSS เดิมของ Learning Hub: ใช้ page.css, subject-orbit.css, activity-card, back-button และหน้าต่าง Workspace เดิม ส่วน CSS ใหม่จำกัดเฉพาะการจัดหน้าคลังและอ้างสี/ฟอนต์จากตัวแปรธีมรายวิชาเดิม

ครูทำเหมือนเดิม: เพิ่มหมวดใน Sitemap → เลือก ID จาก “กรอง id” ลง QuizID(1) หรือ QuizID(2) → ใส่ HTML_Content → รีเฟรชคลัง ไม่ต้อง Push โจทย์ใหม่ขึ้น GitHub

เริ่มรองรับ PHYSIC และ CHEMISTRY; วิชาอื่นยังไม่จับคู่โดยเดา หนึ่งเซลล์มีหลายข้อได้ ค้น ID เต็มหลังตัดช่องว่างหัวท้ายแบบ A OR B และคืนแต่ละแถวครั้งเดียว

## รหัสและการเซฟ

- ใช้แนวคิด `IDชุดเดิม-001`, `IDชุดเดิม-002` เรียงตามแถวและข้อในเซลล์ ไม่สุ่มหรือสลับ
- ในฐานข้อมูลแปลง ID ชุดยาวเป็น `bank-physics-b-<รหัสย่อ>-001` เพื่อให้ใช้กับ Firebase/URL ได้ โดยยังเก็บ legacyId ต้นฉบับ
- รหัสรายข้อนี้อยู่ภายในชุดเดียว ข้อเดียวที่ถูกจัดสองหมวดมีความคืบหน้าแยกตามชุด ยังไม่ใช่ทะเบียนข้อกลางสำหรับสถิติข้ามชุด
- เด็กเริ่มทำแล้วเก็บ revision ของโจทย์ไว้ คำตอบอยู่ใน `quizProgress/{uid}/{contentId}` เดิม; ฉบับโจทย์เก็บใน Drive ของบริการ ไม่มีคำตอบนักเรียนในโฟลเดอร์นี้
- เปิดใหม่จะอ่าน revision ที่เซฟแล้วโหลดโจทย์ฉบับเดิม แม้ครูแก้หรือต่อท้าย Sheet หากฉบับเก่าหายหรือชุดถูกปิด จะไม่เอาคำตอบไปลงโจทย์ใหม่
- ปุ่ม “เริ่มชุดล่าสุด” ต้องยืนยันก่อนล้างคำตอบรอบนี้และโหลดโจทย์ล่าสุด การเริ่มรอบใหม่แทนร่างเดิมตามระบบ Quiz เดิม
- การเขียน Cloud ตรวจ revision ใน transaction ป้องกันหน้าต่างที่ยังเปิดรุ่นเก่าทับรอบใหม่; แยก Guest และแต่ละบัญชี
- Guest เซฟเฉพาะเครื่อง บัญชีที่ซิงก์สำเร็จจึงย้ายเครื่องได้ การทดสอบจำลองยังไม่ยืนยัน Firebase Rules ของระบบจริง
- สมุดประกอบ Quiz แยกตามบัญชี ชุด และ revision; สมุดในหน้าเครื่องมือเป็นสมุดประจำชุด
- หลีกเลี่ยงเปลี่ยนชื่อหมวดที่สูตร TEXTJOIN ใช้สร้าง ID เพราะจะกลายเป็นอีกชุด การย้ายชื่อพร้อมประวัติยังต้องทำ mapping โดยตั้งใจ

## บริการ Apps Script

ใช้โครงการใหม่แยกจากเว็บเก่า เพราะทั้งสองมี `doGet` ของตัวเอง

โครงการบริการ: [Learning Hub — บริการคลังข้อสอบ](https://script.google.com/home/projects/1bL3blB5YJoVUPSJev6Yoh5qshDgq3Vg5WURzHqAe7ydfwre5u_GAFef1/edit)

ผู้ใช้อนุมัติการเชื่อมและทดสอบแล้ว: setup สำเร็จ, เปิดเฉพาะ physics, เผยแพร่เวอร์ชัน 2 วันที่ 6 ตุลาคม 2026 เวลา 22:42 (ประเทศไทย) และตั้ง URL `/exec` ใน config แล้ว Apps Script เก่ายังไม่ถูกแก้ไข

บริการใช้ Advanced Sheets Service v4 เพื่อรองรับ `spreadsheets.readonly` โดยคงสิทธิ์อ่านอย่างเดียว คำสั่ง SpreadsheetApp.openById ใช้กับ scope นี้ไม่ได้ ต้องคง dependencies ของ Sheets ใน manifest ไว้ด้วย

ไฟล์ต้นฉบับ: `services/question-bank/Code.gs` และ `appsscript.json`

1. ใส่โค้ดในโครงการใหม่และตั้ง manifest ตามไฟล์ใน repo รวม Advanced Sheets Service v4 (จะเห็น Sheets ในรายการบริการ)
2. เจ้าของตรวจสิทธิ์ Google: อ่าน Spreadsheet และใช้ Drive เพื่อสร้าง/อ่านไฟล์ฉบับโจทย์ในโฟลเดอร์ส่วนตัว การใช้ DriveApp ทำให้หน้าขอสิทธิ์แสดงสิทธิ์ Drive กว้างกว่าโฟลเดอร์เดียว แม้โค้ดใช้เฉพาะโฟลเดอร์ที่สร้าง
3. รัน `setupBankArchive` ครั้งเดียว สร้างโฟลเดอร์ส่วนตัวและ Script Property `HUB_BANK_ARCHIVE_FOLDER` ห้ามแชร์โฟลเดอร์หรือใส่ folder ID ใน frontend
4. หลังตรวจข้อมูลที่จะเผยแพร่ ตั้ง Script Property `HUB_BANK_ENABLED_SUBJECTS` เป็น `physics` สำหรับทดลอง แล้วเพิ่ม `chemistry` ภายหลัง (`physics,chemistry`)
5. เผยแพร่ Web app ในชื่อเจ้าของ ให้ Guest เรียกได้เมื่ออนุมัติการเปิดข้อมูลแล้ว บริการส่งเฉพาะรายการที่ StudentID ว่าง/ALL และ Status ว่าง/เปิดปกติ; ค่าอื่นปิดไว้ และรายการ ID ซ้ำที่สิทธิ์ขัดกันจะปิดทั้ง ID
6. ใส่ URL `/exec` ใน `public/shared/question-bank-config.js` ค่า endpoint ว่างจะแสดงข้อความว่ายังไม่เชื่อม ไม่แสดงข้อมูลจำลองแทนคลังจริง
7. ตรวจ `?action=catalog&subject=physics` และ `?action=questions&subject=physics&key=...` จาก Guest จริง พร้อมทดสอบข้ามโดเมนจาก localhost และ GitHub Pages
8. หากอ่าน JSON ตรงไม่ได้เพราะ CORS/การล็อกอิน ให้เตรียม proxy ที่ upstream ตายตัวและตรวจชุดเดิมซ้ำก่อนเปิดใช้ ห้ามใช้ no-cors หรือ JSONP โค้ดตอนนี้ยังไม่ได้ deploy proxy

บริการไม่ได้อ่าน Users, Scores หรือ SavedStates และไม่ได้เปลี่ยนสูตร/เนื้อหาใน Sheet การอนุมัติ Google และการเผยแพร่เป็นขั้นตอนที่ต้องตรวจบัญชีจริง ไม่ได้เกิดขึ้นจากการบันทึกไฟล์โค้ด

## เพิ่มเครื่องมือในแต่ละ ID

แก้ `questionBankTools` ใน `public/shared/question-bank-config.js` ตัวอย่าง:

```js
export const questionBankTools = Object.freeze({
  'physics/b-รหัสที่เห็นในลิงก์ชุด': [
    { key: 'learning-sheet', toolKind: 'html', contentId: 'physics-my-learning-sheet',
      source: 'content/physics/my-learning-sheet.html',
      titleTh: 'ใบเรียนรู้', titleEn: 'Learning sheet' },
  ],
});
```

ใช้ bankKey จริง 24 ตัวเลขฐานสิบหก; ตัวอย่างด้านบนเป็นช่องอธิบาย ไม่ใช่ key ที่นำไปใช้ตรง ๆ ชนิดที่เพิ่มได้คือ html, quiz และ simulation โดยตรวจไฟล์ภายใน Hub เหมือนเดิม สรุป/Chapter Overview/ใบงาน/ใบเรียนรู้ใช้ html ส่วน Quiz คลังและ Notebook มีปุ่มให้อัตโนมัติ เครื่องมือเดียววางหลายชุดได้โดยใช้ contentId/source เดิม

## รูปแบบโจทย์และการพิมพ์

รองรับ `.question-step[data-ans]`, โจทย์ใน h3, ตัวเลือก radio ภายใน `.options`, `.hint-box` และ `.feedback-box` พร้อมข้อความ/ตารางระหว่างโจทย์กับตัวเลือก รูปต้องเป็น HTTPS แบบเต็ม สูตรรองรับ `$...$`, `$$...$$`, `\\(...\\)` และ `\\[...\\]`

JavaScript/event handlers/styles จาก Sheet ไม่ถูกนำมารัน สื่อฝัง เช่น SVG/canvas/iframe ต้องแปลงก่อนและจะแจ้งแถว/ข้อแทนการข้ามเงียบ ๆ Simulation ให้เปิดผ่านเครื่องมือที่ลงทะเบียน

พิมพ์จากปุ่ม Quiz เดิม เลือกข้อได้ และเลือกระหว่างชุดเปล่ากับเฉลย โดยรอจัดสูตรคณิตก่อนเปิดพิมพ์ ชุดเปล่าตัดส่วนเฉลยออกจากสำเนาที่พิมพ์ การพิมพ์ไม่แก้คำตอบบนจอ

## การตรวจและขอบเขตที่ยังเหลือ

ผลตรวจชุดแรก 6 ตุลาคม 2026: Unit tests ผ่าน 225 ข้อ, Build ผ่าน, ตรวจหน้าคลังในเบราว์เซอร์ทั้งไฟล์ต้นฉบับและไฟล์ Build ภายใต้ `/learning-hub/` ผ่าน ทดสอบการคงโจทย์รุ่นเดิมหลังแก้ Sheet, เปลี่ยนบัญชี/ย้ายเครื่องด้วย Firebase จำลอง และตรวจ PDF ชุดเปล่า/เฉลยพร้อมสูตรคณิตศาสตร์แล้ว

ผลเชื่อมบริการจริง: อ่านแบบไม่ส่งข้อมูลล็อกอินได้ 10 รายการในคลังฟิสิกส์, ชุดหน่วย SI มี 14 ข้อ, สร้างและอ่าน archive ได้ตรงกัน, เคมียังปิดไว้ และหน้า Hub บน localhost แบบ Guest โหลดชุดจริงได้ผ่าน CORS

สถานะ Build ระหว่างผู้ใช้กำลังเพิ่มเนื้อหาบทเสียง (ผู้ใช้ยืนยันแล้ว): ยังไม่ผ่านการตรวจเนื้อหา เนื่องจาก `public/content/physics/sound/12-1-nature-of-sound.html` อ้างถึงไฟล์ใน `12-1/` ที่ยังไม่มี 5 ไฟล์ (ใบเรียนรู้, particle-sim, speed-sim, cloze-quiz และ concept-quiz) รอเนื้อหาครบแล้วจึงตรวจ Build อีกครั้ง ไม่ได้แก้งานบทเสียงในงานคลังนี้ ส่วนการแก้เชื่อมบริการล่าสุดยังไม่ได้ Commit/Push โดยผู้ช่วย

บริการ Apps Script บางครั้งเริ่มตอบช้า: client รอได้ 45 วินาทีและมีปุ่มลองโหลดใหม่เมื่อเปิด Quiz ไม่สำเร็จ โดยไม่สลับไปใช้โจทย์รุ่นใหม่แทนงานที่เซฟไว้

- `pnpm test:bank` — ทดสอบบริการด้วย Spreadsheet/Drive จำลอง, สิทธิ์, ID, snapshot, client และ routes
- `pnpm test:bank:browser` — Hub จริงในเบราว์เซอร์ ใช้บริการอ่านและ Firebase จำลองเพื่อไม่แตะบัญชีเด็ก พร้อม PDF ใน `qa-output/`
- ตั้ง `QA_BUILT=1` เพื่อตรวจไฟล์หลัง Build ภายใต้ `/learning-hub/`
- ตัวอย่างจริง PHYSIC 10 ข้อต่อเซลล์อยู่ในไฟล์ทดสอบ ignored ไม่รวมในเว็บที่เผยแพร่
- ตรวจ Apps Script/Guest/CORS จาก localhost แล้ว ยังต้องตรวจ GitHub Pages หลัง Push, Firebase Rules และ iPad Safari จริงก่อนประกาศพร้อมใช้งานนักเรียน
- ยังไม่ย้ายคะแนน/บัญชีเดิม ไม่สร้างฟอร์มแก้ข้อสอบใน Hub และไม่ทำสถิติรายข้อข้ามหมวด

อ้างอิงพฤติกรรมบริการ: [Apps Script Web apps](https://developers.google.com/apps-script/guides/web), [Content Service และ redirect](https://developers.google.com/apps-script/guides/content), [DriveApp และขอบเขตสิทธิ์](https://developers.google.com/apps-script/reference/drive/drive-app)
