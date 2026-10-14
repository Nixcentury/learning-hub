# PDF กลาง — ผลตรวจและเผยแพร่ 14 ตุลาคม 2026

ฐาน GitHub ล่าสุดที่ตรวจ: d25fb41029d3195dd0307086967f529af27fd890 (ตรงกับฐานงานนี้)
Branch ส่งงาน: feat/pdf-drive-common-th-en-20261014; รวมเข้า main ผ่าน PR #1 แล้ว
รุ่น player: 1.1.2; code commit e3d1fc585e38f318437f0b24865965f240ee8409
GitHub Actions run 38523695866: build และ deploy สำเร็จ ตรวจเว็บจริงใน Chrome โหมด Guest แล้ว
https://github.com/Nixcentury/learning-hub/actions/runs/38523695866
https://nixcentury.github.io/learning-hub/#test/5/pdf-tools/pdf-inline-demo

## ผลตรวจรุ่นไฟล์ร่วม/TH/EN

| รายการ | ผล |
| --- | --- |
| pnpm test:pdf | 24/24 ผ่าน (contract 14 + actual-player/DOM จำลอง 10) |
| pnpm test:unit | 260/260 ผ่าน ไม่มีข้าม/ล้มเหลว |
| pnpm validate:routes | ผ่าน รวม inline PDF, descriptor และ canonical preparing routes |
| pnpm build | ผ่านครบ validator → TypeScript → Vite → Pages verification |
| Content validation | 0 errors, 18 draft warnings; ลิงก์ว่างไม่ขวาง build |
| Pages verification | 323 public files ตรงต้นฉบับและพาธอยู่ใต้ /learning-hub/ |
| git diff --cached --check (ไม่รวม vendor) | ผ่าน; upstream licenses คง bytes เดิม รวม whitespace ของเจ้าของลิขสิทธิ์ |
| PDF.js จริงกับ PDF ตัวอย่าง | ตรวจไว้รอบ 11 ต.ค. render สองหน้าใน Node/canvas พร้อมลิงก์ภายนอกและปลายทางหน้า 1 |
| Chrome บนเว็บที่ deploy จริง | ผ่านเมนู/inline/descriptor วาดสองหน้า internal link เปลี่ยนภาษาและ zoom ของไฟล์ร่วม |
| ดาวน์โหลด PDF จริง | Chrome download event สำเร็จ และไฟล์ที่โหลด bytes ตรงกับ PDF ตัวอย่างใน repo |
| iPad Safari / Drive จริงของผู้ใช้ | ยังต้องลองอุปกรณ์ ไฟล์ และสิทธิ์จริง ไม่อ้างว่าผ่านจาก Chrome/Node |

## ตรวจเว็บจริงหลังเผยแพร่

- Test → บท 5 → เมนู PDF เดิมและ inline เปิดใน Workspace ได้
- PDF สองหน้าแสดงจริง พร้อม overlay ลิงก์ภายนอก และกดลิงก์ภายในกลับหน้า 1 ได้
- ไฟล์ร่วมอ่านหน้า 2 ซูม 150% สลับ EN/TH แล้วยังคงหน้าและค่า zoom ไม่ย้อนหน้า 1
- รายการเมนูลิงก์ว่างเป็น preparing/disabled ไม่ทำให้เมนูหรือ build ล้ม
- ปุ่มดาวน์โหลดในตัวเล่นส่งไฟล์ PDF จริง ไม่ใช่ภาพ canvas และ bytes ตรงต้นฉบับ
- ภาพหลักฐาน: [PDF viewer บนเว็บจริง](docs/pdf-viewer-live-20261014.jpg)

จุดที่พบและแก้จากการตรวจจริง: PDF.js 6 ไม่มี convertToViewportRectangle แล้ว
เปลี่ยน overlay ให้ใช้ convertToViewportPoint สองมุม และเพิ่ม regression test ให้ viewport ไม่มี API เดิม
เพิ่มรุ่นใน URL player/script เพื่อไม่ให้ browser ใช้ JS เก่าหลังอัปเดต
ไม่มีการลด sandbox/เปลี่ยนสิทธิ์ หรือเปลี่ยน engine/ฟอนต์กลางเพื่อแก้ปัญหานี้

actual-player tests รัน pdf-player.js จริงด้วย DOM/PDF.js จำลอง ตรวจ:
- ไฟล์ร่วมสลับ TH/EN ไม่โหลดใหม่ หน้า/zoom เดิม
- คนละไฟล์จำหน้า/zoom แยก และ download/original ตรงภาษา
- ภาษาเดียว fallback พร้อมข้อความ ช่องว่างทั้งหมดไม่เรียกไฟล์
- Drive preview/original/download ตรงไฟล์ เก็บ resourcekey ไม่มีการแก้ sharing
- load/download เก่าที่เสร็จหลังเปลี่ยนภาษาไม่ทับหรือดาวน์โหลดผิดฉบับ
- Blob download คืนหน่วยความจำ และ descriptor เดิมยังใช้ได้

## สิ่งที่คงเดิม

ใช้ Workspace ภาษาและ CSS กลางเดิม เพิ่มเฉพาะส่วน PDF
PDF/Drive ไม่ได้รับ identity หรือ Quiz storage bridge ไม่แก้ Firebase/Apps Script/permissions/notebook
ID เดิมของ Quiz และชิ้นงานอื่นไม่เปลี่ยน
เพิ่มลิงก์บนปุ่มโดยตรงได้ และยังรองรับ descriptor เดิม
เพิ่ม PDF.js 6.4.299 แบบ local พร้อม worker/assets/licenses ไม่โหลด CDN และไม่เพิ่ม npm dependency

## ข้อผิดพลาดเดิมที่ลบตามคำสั่งผู้ใช้

ผู้ใช้อนุมัติ 11 ต.ค. เวลา 19:01 ให้ลบ Quiz ที่ไม่มีคำถาม:
public/content/physics/sound/12-1/12-1-1-concept-quiz.html
ลบเฉพาะไฟล์นี้และรายการเมนู ID phys-sound-12-1-1-concept-quiz ใน 12-1-nature-of-sound.html
กู้จากฐาน commit ด้านบนได้ ไม่ลดกติกา Quiz หรือสร้างคำถามเติมเพื่อหลบ validator

## ส่งต่อ Gemini

1. อ่าน START-HERE.txt และ PDF-VIEWER-START-HERE.md
2. ใช้ public/content/templates/pdf-button-template.html
3. ส่ง public/content/templates/pdf-ai-prompt.txt ให้ AI อ่านก่อนสร้างบท
4. ใส่ Drive จริงใน data-pdf-common / data-pdf-th / data-pdf-en ช่องอื่นปล่อยว่าง
5. ไม่สร้าง viewer รายบท ไม่เปลี่ยน ID/CSS/storage เดิม ไม่แต่ง URL

ตัวอย่างเว็บหลัง deploy: Test → บท 5 สไลด์ PDF
canonical #content/pdf-inline-demo (ไฟล์ร่วม), #content/pdf-viewer-demo (descriptor), #content/pdf-draft-demo (ยังไม่มีไฟล์)

## ขอบเขตที่ยังต้องตรวจ

- ผู้ใช้ยังไม่ได้ให้ลิงก์ PDF บทเรียนจริง รุ่นนี้มีเฉพาะไฟล์ตัวอย่าง ไม่ใช่ชีทแปลจริง
- Drive iframe ข้ามเว็บไซต์ อ่าน/คืนหน้าและ zoom ไม่ได้ ไม่ถือ iframe load เป็นหลักฐานว่ามีสิทธิ์อ่าน
- Drive ดาวน์โหลดผ่านหน้าต้นฉบับตามสิทธิ์ ไม่รับประกัน one-click download
- PDF.js/Blob download บน iPad Safari และ PDF ภาษาไทยจริงต้องลองบนอุปกรณ์จริง
- ไม่ทดสอบ Firebase/live AI/Apps Script เพราะไม่ใช่ส่วนที่เปลี่ยน
