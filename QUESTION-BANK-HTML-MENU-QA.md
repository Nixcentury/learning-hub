# สถานะตรวจเมนู HTML ราย ID

วันที่: 21 ตุลาคม 2026 (ประเทศไทย)
Branch: `codex/bank-html-menus-20261021`
Base main ที่อ่าน: `c7a6afb6ce5750802d3d9e8ceb9ab9dbf0ef9998`

## สถานะตามจริง

เพิ่มตัวเชื่อม แม่แบบ และชุดทดสอบไว้ใน branch งาน **ยังไม่ merge หรือเผยแพร่**
สภาพแวดล้อมรอบนี้ไม่มี shell/Node runtime จึงยังรัน pnpm หรือเปิด browser QA ไม่ได้
GitHub workflow เดิมทำงานเมื่อ push main เท่านั้น งานนี้ไม่เปลี่ยน workflow
เพื่อให้โค้ดที่ยังไม่ผ่าน build ไม่ถูกส่งขึ้นเว็บจริง

## ตรวจแล้วในรอบนี้

- อ่านโครงสร้างและสัญญาเมนู/เนื้อหา/เส้นทางเดิมจาก GitHub
- ตรวจ syntax ของ JS ที่เปลี่ยน 8 ไฟล์ด้วย async-function parser หลังถอด ESM imports
  และแทน import.meta.url เฉพาะใน harness ไม่ใช่ Node module/typecheck/build
- ตรวจตรรกะ metadata/registry/route แบบ isolated in-memory 20 assertions ผ่าน:
  bankKey และ questionId เดิม, hash alias/slug, Quiz/Notebook, สื่อเสริม,
  การเลือกเครื่องมือ, หน้ากลับ, draft, ไม่ใส่เฉลยใน catalog, การชนรหัสและบริบท
- harness ใช้ path/URL adapter จึง **ไม่ยืนยัน native URL validation,
  filesystem discovery, iframe/browser, การโหลด Sheet จริง หรือ pnpm build**

## ชุดทดสอบที่เพิ่ม (ยังไม่ได้รันด้วย Node)

`scripts/bank-html-menu.test.mjs` รวมใน `pnpm test:bank` และ `pnpm test:unit`:
- ไม่มีเมนูยังเปิดคลังเดิมและใช้รหัสเดิม
- ลิงก์ชื่ออ่านง่าย, alias เก่า, Quiz/Notebook และ Share
- HTML, Simulation, Quiz เสริม, inline PDF ผ่านตัวเปิดกลาง
- tool slug/aliases และลำดับ HTML
- href ว่าง/ไฟล์ขาด/explicit draft/PDF ว่าง โดย Quiz เดิมยังอยู่
- สื่อเดียวใช้ร่วมกับบทเรียนด้านนอก
- reserved key/duplicate/manual registry collision
- ป้องกัน alias ขโมย bankKey อื่น และ slug ชนในวิชาเดียวกัน
- path/context/content ID ที่ผิดไม่ถูกกลบเป็นงานร่าง
- discovery deterministic; ปฏิเสธ directory ผิดรูปแบบและ symlink
  (ทดสอบสร้าง symlink เฉพาะระบบที่ไม่ใช่ Windows)

## ก่อน merge/เผยแพร่ ต้องทำต่อ

1. Fetch branch นี้ใน checkout ที่สะอาดและมี Node.js 24 / pnpm 11.19.0
   อย่า overwrite งานที่ค้างในเครื่อง; commit งานเดิมหรือเลือก checkout แยกก่อน
2. `pnpm install --frozen-lockfile` เมื่อ dependencies ยังไม่พร้อม
3. `pnpm test:bank`, `pnpm test:unit`
4. `pnpm validate:content`, `pnpm validate:routes`, `pnpm build`
5. `git diff --check`
6. ตรวจ preview ทั้งบทเรียนภายนอกและคลัง:
   Quiz/Notebook บังคับ, 0 ข้อ, dropdown/search, ภาษา, draft, ทะเบียน JS เดิม
7. ทดลองเมนูที่มีไฟล์จริงด้วย fixture/ข้อมูลทดสอบ ไม่เพิ่มข้อมูลจำลองใน Sheet จริง
   ตรวจ HTML/ใบเรียนรู้/PDF/Simulation/Quiz เสริม, deep link, Back/Forward/Share
8. เปิดงาน Quiz เดิมด้วยบัญชี/Guest เดิม ตรวจ revision/คำตอบ/สมุดไม่เปลี่ยน
9. เมื่อผ่านแล้วจึง merge main และดู Learning Hub Pages ผ่าน build+deploy
10. ตรวจ deployment.json ว่า commit ตรง พร้อม Guest บนเว็บจริงและ iPad/Safari
11. อัปเดตสถานะคู่มือและ QA ให้ตรงผลตรวจจริงก่อนส่งผู้สร้างเนื้อหาใช้งาน

## ส่วนที่ไม่ได้แก้

- services/question-bank/ และ Apps Script deployment
- public/shared/question-bank-config.js (endpoint และทะเบียน JS เดิม)
- question-bank-model.js, question-bank-client.js, bank HTML adapter
- Quiz player/core/storage/คะแนน/Give up/Retry และ snapshot/revision
- Firebase Rules, บัญชี, คำตอบ, archive และข้อมูลใน Google Sheets
- CSS กลางและเครื่องมือ PDF/MathJax/ใบเรียนรู้/ภาษา/การพิมพ์
- CI/Pages workflow และการตั้งค่า hosting

การเปลี่ยน cache-version ใน app/หน้าวิชา/เมนูใช้โหลด source รุ่นใหม่
ไม่ล้าง localStorage, IndexedDB, cache ของคำตอบ หรือ site data

ข้อจำกัดเดิมของการแชร์ PDF, ไฟล์สาธารณะ และ Notebook ยังเป็นไปตามคู่มือเดิม
งานนี้ไม่ได้เพิ่มการจำกัดสิทธิ์ครูหรือทำให้ Notebook แบบชั่วคราวเซฟถาวร
