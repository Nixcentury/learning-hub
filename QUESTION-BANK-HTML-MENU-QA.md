# สถานะตรวจเมนู HTML ราย ID

วันที่: 21 ตุลาคม 2026 (ประเทศไทย)
Branch ต้นทาง: `codex/bank-html-menus-20261021`
Base main ก่อนงาน: `c7a6afb6ce5750802d3d9e8ceb9ab9dbf0ef9998`
Commit เปิดใช้บน main: `31e3fa8f71274193a6ab5b1de310554a120f360b`

## สถานะตามจริง

ตัวเชื่อม แม่แบบ และใบเรียนรู้ฟิสิกส์ 4.1 **merge และเผยแพร่แล้ว** ผ่าน
[PR #2](https://github.com/Nixcentury/learning-hub/pull/2) และ
[Learning Hub Pages run 39537683367](https://github.com/Nixcentury/learning-hub/actions/runs/39537683367)
ทั้ง build และ deploy สำเร็จ ตรวจ public deployment.json ตรง commit ข้างต้น
เวลา build `2026-10-21T03:17:01.469Z` จำนวน 334 ไฟล์ และทดลอง Guest บนเว็บจริงแล้ว
CI/Pages workflow เดิมไม่ได้เปลี่ยน

## ตรวจด้วย runtime และเบราว์เซอร์ก่อนเผยแพร่

- Node.js 24.19.0 / pnpm ในเครื่อง 11.25.0; install แบบ frozen lockfile ไม่เปลี่ยน dependency
  ส่วน Actions ใช้ pnpm 11.19.0 ตาม repository
- `pnpm test:bank`: 22/22 ผ่าน; `pnpm test:unit`: 279/279 ผ่าน
- `pnpm validate:content`: 0 errors / 32 existing draft warnings นอกใบเรียนรู้และเมนูใหม่
- `pnpm validate:routes`, `pnpm build` (รวม typecheck/Pages artifact) และ `git diff --check` ผ่าน
- Browser regression ของคลังบน build ผ่านด้วยบริการ/Firebase จำลอง: ตัวกรองบท/ค้นหา/TH-EN,
  หัวข้อ 0 ข้อ, ปิดแล้วทำต่อ revision เดิมหลังโจทย์เปลี่ยน, เริ่มใหม่แบบยืนยัน,
  Back/Forward, พิมพ์ชุดว่าง/เฉลย, ลิงก์เดิมและหน้าจอแคบ โดยไม่แตะข้อมูลนักเรียนจริง
- ใบเรียนรู้ใช้ toolbar/Workspace/MathJax/ภาษา/การพิมพ์กลาง ตรวจทั้งสองภาษาและ 390px
  พร้อม render สำเนาพิมพ์ดูตาราง/รูป/การตัดหน้า รายละเอียดใน
  [PHYSICS-EQUILIBRIUM-4-1-QA.md](PHYSICS-EQUILIBRIUM-4-1-QA.md)

## ตรวจ Guest บนเว็บจริงหลังเผยแพร่

- [ใบเรียนรู้ฟิสิกส์ 4.1](https://nixcentury.github.io/learning-hub/#physics/bank/b-746a471754733ee41d2e7c4d/learning-sheet)
  เปิดใน Workspace กลาง พร้อม MathJax ready และ stable content alias เปิดได้
- เปิด/ซ่อนเฉลยรายช่องและทั้งหมด, เปลี่ยน TH/EN คงสถานะช่อง, Share ให้ URL ตรงหัวข้อ
- พิมพ์กลาง TH ว่าง/เฉลย 13 หน้า และ EN ว่าง/เฉลย 14 หน้า
  สำเนาว่างไม่มี answer elements; สำเนาเฉลยมีครบ 68 ช่องของภาษาที่เลือก
- เมนูหัวข้อมี Quiz/Notebook จากระบบและใบเรียนรู้หนึ่งรายการ ไม่เพิ่มปุ่มซ้ำ
  Quiz ปิดตามจำนวน 0 ข้อจาก catalog; Notebook เปิดด้วยบริบท bank ที่ถูกต้อง
  พร้อมข้อความ Guest/สมุดชั่วคราวเดิม แล้วกลับเปิดใบเรียนรู้ได้
- รอบนี้ไม่ได้ทำข้อสอบจริงหรืออ่าน/เขียนประวัตินักเรียนบน production

## ประวัติตรวจก่อนมี runtime (รอบก่อนหน้า)

- อ่านโครงสร้างและสัญญาเมนู/เนื้อหา/เส้นทางเดิมจาก GitHub
- ตรวจ syntax ของ JS ที่เปลี่ยน 8 ไฟล์ด้วย async-function parser หลังถอด ESM imports
  และแทน import.meta.url เฉพาะใน harness ไม่ใช่ Node module/typecheck/build
- ตรวจตรรกะ metadata/registry/route แบบ isolated in-memory 20 assertions ผ่าน:
  bankKey และ questionId เดิม, hash alias/slug, Quiz/Notebook, สื่อเสริม,
  การเลือกเครื่องมือ, หน้ากลับ, draft, ไม่ใส่เฉลยใน catalog, การชนรหัสและบริบท
- harness ใช้ path/URL adapter จึง **ไม่ยืนยัน native URL validation,
  filesystem discovery, iframe/browser, การโหลด Sheet จริง หรือ pnpm build**

## ขอบเขตชุดทดสอบที่เพิ่ม (รันด้วย Node แล้วในรอบเผยแพร่)

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

## ขอบเขตที่ยังต้องตรวจแยก

- Safari/iPad จริง, Apple Pencil, พิมพ์กระดาษ และ Cloud/การย้ายเครื่องด้วยบัญชีจริง
- สื่อเสริม PDF/Simulation/Quiz ที่จะเพิ่มในอนาคตต้องตรวจไฟล์และหน้าเว็บของตนเอง
  รอบนี้ไม่ได้เพิ่มสื่อเหล่านั้น; unit coverage ของตัวเชื่อมไม่ใช่หลักฐานการเปิดสื่อทุกชนิดบนเว็บจริง
- งานใหม่เริ่มจาก main ที่มีตัวเชื่อมแล้ว รัน tests/validate/build และตรวจ Pages/deployment.json
  กับ Guest ของงานนั้นก่อนรายงานว่าเผยแพร่สำเร็จ

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
