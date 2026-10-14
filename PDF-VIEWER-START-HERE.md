# PDF กลาง — คู่มือผู้สร้างบทเรียนและ AI (14 ตุลาคม 2026)

อ่าน START-HERE.txt ก่อน Hub เป็นจอแสดงผล ผู้เขียนอัปโหลด PDF เองแล้วใส่ลิงก์บนปุ่ม/รายการเมนู
ไม่บังคับ PDF แยกสองภาษา ไม่ต้องสร้าง descriptor เพิ่มสำหรับปุ่มรูปแบบใหม่

## เริ่มง่าย ๆ: สามช่องบนปุ่ม

วางใน HTML บทเรียนที่แสดงจริงใน Hub ใช้แม่แบบ public/content/templates/pdf-button-template.html:

```html
<button type="button" data-hub-pdf
  data-content-id="physics-sound-sheet"
  data-pdf-common=""
  data-pdf-th=""
  data-pdf-en=""
  data-th="เปิดชีทติว" data-en="Open worksheet">เปิดชีทติว</button>
```

| ช่อง | ใส่ลิงก์อะไร |
| --- | --- |
| data-pdf-common | PDF ร่วม ใช้ทั้ง TH/EN เช่นชีทหัวข้อสองภาษาให้เขียนเติม |
| data-pdf-th | ฉบับไทย หากมีไฟล์แยก |
| data-pdf-en | ฉบับอังกฤษ หากมีไฟล์แยก |

ช่องที่ยังไม่มีไฟล์ปล่อย "" หรือไม่เขียน attribute นั้นเลยได้
ไม่มีลิงก์ทั้งหมดก็ build ผ่าน ปุ่มในบทเรียนแจ้ง “กำลังเตรียมเอกสาร” ไม่เปิดหน้าต่างเปล่า
รายการเมนูที่ยังไม่มีลิงก์แสดงเป็นงานกำลังเตรียมและกดไม่ได้
อย่าใส่ TH_LINK/ใส่ลิงก์ตรงนี้/รหัส Drive ปลอมแทนช่องว่างในไฟล์ที่จะ build
ชื่อไฟล์ไม่กำหนดภาษา ระบบเลือกจากช่องที่ระบุ ไม่แปลเนื้อหา PDF เอง
ID เริ่ม a-z ตามด้วย a-z/0-9/- รวมไม่เกิน 128 ตัว บทใหม่ใช้ ID ใหม่
เปลี่ยนไฟล์/เพิ่มภาษาให้คง ID เดิม ไม่ใช้ ID ของ Quiz เป็น ID ของ PDF

## ขั้นตอนใช้ Google Drive

1. Export PDF ตรวจฟอนต์ สมการ และลิงก์ก่อนอัปโหลด
2. อัปโหลด PDF ไป Drive ตั้งสิทธิ์ให้ผู้เรียนที่ต้องการเข้าถึง
3. คัดลอกลิงก์ไฟล์รูปแบบ https://drive.google.com/file/d/FILE_ID/view
4. วางในช่องไฟล์ร่วมหรือ TH/EN บนปุ่ม แล้วบันทึก HTML ลง repo
5. Commit/push HTML รอ GitHub Actions build/deploy สำเร็จ แล้วตรวจเว็บจริง

ไม่ต้องหาลิงก์ดาวน์โหลดแยก ไม่ต้องนำ PDF จริงขึ้น GitHub ถ้าเก็บใน Drive
รองรับ /view หรือ /preview และคง resourcekey เมื่อมี
ไม่รองรับลิงก์โฟลเดอร์ Docs/Slides editor หรือลิงก์ย่อ
Hub ไม่เปลี่ยนสิทธิ์ Drive และไม่ล็อกอิน Google ให้ผู้เรียน
ไฟล์จำกัดผู้ใช้ต้องเปิดด้วยบัญชีที่มีสิทธิ์ ห้ามเผยแพร่ไฟล์ส่วนตัวอัตโนมัติ
ถ้าแก้เนื้อหาโดยคงไฟล์/ลิงก์ Drive เดิม ไม่ต้องแก้ปุ่ม แต่ควรลองเปิดใหม่เพราะอาจมีแคช
อัปโหลดเป็นไฟล์ใหม่ที่ได้ ID ใหม่ต้องเปลี่ยนลิงก์ใน HTML

ตัวอย่างโครงสร้าง แทน FILE_ID ด้วยรหัสจริงก่อนใช้ มิฉะนั้นปล่อยช่องว่าง:

```html
<!-- ชีทสองภาษาไฟล์เดียว -->
data-pdf-common="https://drive.google.com/file/d/FILE_ID/view"
data-pdf-th=""
data-pdf-en=""
```

```html
<!-- เนื้อหาแยกฉบับ -->
data-pdf-common=""
data-pdf-th="https://drive.google.com/file/d/TH_FILE_ID/view"
data-pdf-en="https://drive.google.com/file/d/EN_FILE_ID/view"
```

ใน HTML ใช้ &amp; แทน & ระหว่าง query parameters และ escape เครื่องหมายคำพูดตามปกติ
ห้ามใส่ token/password/credential ลง repo สาธารณะ

## กติกาเลือกไฟล์และดาวน์โหลด

ใช้ปุ่ม TH/EN เดิมบนหัวหน้าต่าง Workspace ไม่สร้างระบบภาษาซ้อน:
เลือกฉบับภาษานั้นก่อน → ถ้าไม่มี ไฟล์ร่วม → ถ้ายังไม่มี อีกภาษาพร้อมแจ้ง → กำลังเตรียม

| ไฟล์ที่มี | TH | EN |
| --- | --- | --- |
| ไฟล์ร่วม | ไฟล์ร่วม | ไฟล์ร่วมเดิม |
| TH และ EN | ฉบับไทย | ฉบับอังกฤษ |
| ไฟล์ร่วมและ EN | ไฟล์ร่วม | ฉบับอังกฤษ |
| TH อย่างเดียว | ฉบับไทย | ฉบับไทย พร้อมแจ้งว่า EN ยังไม่มี |
| ไม่มีไฟล์ | กำลังเตรียม | กำลังเตรียม |

- สลับภาษาแต่ URL เดิม ไม่โหลดเอกสารใหม่และไม่ย้อนหน้า
- PDF.js จำหน้าและ zoom แยกตาม URL ขณะหน้าต่างยังเปิดอยู่ ไม่บังคับจำนวนหน้าตรงกัน
- Drive preview เปลี่ยนไฟล์แล้วเปิดใหม่ Hub อ่าน/คืนหน้าและ zoom ของ iframe ข้ามเว็บไซต์ไม่ได้
- ย่อ/เรียกกลับใช้หน้าต่างเดิม ปิด/รีเฟรชไม่เก็บประวัติการอ่านลง Firebase/localStorage
- Drive มี “เปิดใน Google Drive ↗” และ “ดาวน์โหลดผ่าน Drive ↗” ตามไฟล์ที่แสดง
  ดาวน์โหลดพาไปหน้าต้นฉบับ ใช้เครื่องมือ Drive ตามสิทธิ์ ไม่รับประกันกดครั้งเดียวแล้วโหลด
- PDF ใน repo ใช้ native download ไฟล์ภายนอกที่ PDF.js โหลดได้ใช้ bytes สร้าง Blob เมื่อกด
  Browser/iPad อาจเปิดไฟล์หรือแสดงเมนูบันทึกตามการตั้งค่า มีปุ่มเปิดต้นฉบับเป็นทางสำรอง
- ไม่มีปากกา แก้ PDF ค้นข้อความ text-selection หรือเล่นวิดีโอฝังใน PDF ในรุ่นนี้

## เรียกจากทุกชั้น

### เมนูบท topics / เมนูเรื่องย่อย tools

เมนูเป็นข้อมูลล้วน ใช้ anchor ไม่ใช้ button/script/style ตัวอ่านเมนูสร้างการ์ดเดิมให้:

```html
<a data-tool-kind="pdf" data-content-id="physics-sound-sheet"
  data-pdf-common="" data-pdf-th="" data-pdf-en=""
  data-th="ชีทติวเรื่องเสียง" data-en="Sound worksheet">ชีทติวเรื่องเสียง</a>
```

ใส่ลิงก์จริงในสามช่อง ไม่จำเป็นต้องมี href สำหรับ inline นี้
รักษา subjectId/chapterId/topicId บน nav ไม่ใส่ data-hub-pdf ซ้ำบนรายการเมนู
data-status="draft" ทำให้รายการไม่เปิดแม้มีลิงก์ เอาออกเมื่อพร้อม

### HTML บทเรียน / หน้าสรุป / ใบเรียนรู้

ใช้ปุ่มต้นคู่มือใน DOM จริง ไม่เพิ่ม script ให้ HTML read-only ไม่ลด sandbox
พาธ relative อ้างจากไฟล์สร้างปุ่ม เช่น data-pdf-common="sheet.pdf"
PDF ใน repo อยู่ใต้ public/content/ URL บนเว็บไม่มีคำว่า public/
ไฟล์ตรงภายนอกเป็น HTTPS ลงท้าย .pdf เจ้าของเว็บต้องอนุญาต CORS
Drive ไม่ต้องเปิด CORS เพราะใช้ preview ของผู้ให้บริการ

### หน้า Hub / หน้าวิชา / Simulation

ใช้ปุ่มเดียวกันใน DOM จริง หากอยู่นอกบริบทหน้าต่างบทเรียนให้เพิ่ม:

```html
data-subject-id="physics" data-chapter-id="12" data-topic-id="nature"
```

ปุ่มลอยใน template subject-chapters ไม่ถูกวาดเอง ชั้นบทใช้เมนู topics
เอกสารภายนอกข้าม origin ไม่ได้รับ event delegation ของ Hub

### ภายใน Quiz

ใช้ <a data-hub-pdf data-content-id="..." data-pdf-common="..." ...> แทน button
ใส่ href เป็นลิงก์ต้นฉบับที่มีได้เพื่อเปิดเมื่ออยู่นอก Hub
วาง anchor จริงในสรุปหรือ data-question-context ไม่วางในตัวเลือก/ช่องลากวาง
ไม่ซ่อนโค้ดลิงก์ใน string data-th/en ของ parent
engine แปลงพาธจากไฟล์ Quiz ก่อนคัดลอกลง player ไม่เปลี่ยน IDs คำตอบ คะแนน storage หรือ notebook

### เรียกชุดเดียวจากหลายที่

ใช้ ID เดียวและลิงก์จริงชุดเดียวกัน ระบบเปิด/เรียกกลับหน้าต่างเดียว
ถ้าคัดลอกปุ่มไปอีกไฟล์ relative path ต้องอ้างถึง PDF จริงชุดเดิม
ID เดียวชี้คนละไฟล์คือ conflict ไม่ปิดการตรวจนี้
ถ้าต้องการแก้ลิงก์ศูนย์กลางจุดเดียวหลายบท ใช้ descriptor แบบเดิมได้

## รูปแบบเดิมยังใช้ได้: descriptor

public/content/templates/pdf-template.html เป็น HTML ตั้งค่าแยกหนึ่งไฟล์
marker data-learning-pdf="1" และ data-activity-id ตรงกับปุ่ม อ่านเป็นข้อมูล ไม่รัน body/script

```html
<html lang="th" data-learning-pdf="1" data-activity-id="physics-sound-sheet"
  data-pdf-common="" data-pdf-th="" data-pdf-en="">
<head><meta charset="utf-8"><title>Sound worksheet</title></head>
<body></body>
</html>
```

data-pdf-src="sheet.pdf" บน descriptor เดิมยังหมายถึงไฟล์ร่วม ไม่ต้องย้ายงานเก่า
บนปุ่มเดิม data-pdf-src="sheet.html" / anchor href / menu href หมายถึง descriptor ใน content/
ไม่ใส่ data-pdf-src แบบ descriptor และสามช่อง inline พร้อมกันบนปุ่มเดียว
ไม่มีลิงก์ใน descriptor ก็ build ผ่าน ไฟล์ PDF จริงที่ยังไม่มีเป็น warning

ลิงก์ประกอบใน descriptor ไม่เกิน 20 รายการ:

```html
<a data-pdf-link href="https://www.youtube.com/watch?v=ACTUAL_ID"
  data-th="ดูวิดีโอ ↗" data-en="Watch video ↗">ดูวิดีโอ</a>
```

ปุ่ม inline วางลิงก์ YouTube/เอกสารประกอบใน HTML บทเรียนเองได้
PDF links ใช้ได้เมื่อ export เก็บ annotations ไว้ ไม่กู้ลิงก์จากภาพ ไม่เล่นวิดีโอฝัง

## งานร่าง build ผ่าน แต่ยังตรวจความปลอดภัย

- ช่องหาย/ว่างทั้งหมด: warning หรือ preparing ไม่ใช่ error
- PDF local ยังไม่มีไฟล์: warning มีจริงแต่ไม่ใช่ PDF: error
- Drive หาย/ไม่มีสิทธิ์: ปัญหาขณะใช้งาน ไม่ติดต่อ Drive เพื่อ gate build
- ID ผิด/ซ้ำขัดแย้ง javascript:/data:/file: HTTP ต่างเว็บ credentials traversal และลิงก์ผิดชนิด: error แม้ draft
- ไม่ผ่อนกติกา Quiz พร้อมใช้ยังต้องมีคำถามตามสัญญาเดิม

## จุดเชื่อมสำหรับ AI

| ส่วน | ไฟล์ |
| --- | --- |
| manifest/fallback/download | public/shared/pdf-content-model.js |
| ปุ่ม → entry | js/pdf-link.js |
| entry → fixed player/window | js/content-tool.js |
| หน้าต่าง ภาษา event delegation | js/workspace.js |
| เมนูชั้น 2/3 | public/pages/shared/subject-content-nav.js |
| สารบัญ/แชร์ | scripts/route-catalog.mjs, js/hub-activity-routes.js |
| player | public/pages/tools/pdf-player.html, .js, .css |
| PDF.js และ licenses | public/vendor/pdfjs-6.4.299/ |
| validator | scripts/validate-activity-content.mjs |
| tests | scripts/pdf-viewer.test.mjs, scripts/pdf-player.test.mjs |

ไม่สร้าง viewer/modal/iframe/controller ใหม่รายบท ไม่แก้ dist/generated catalog ด้วยมือ
ไม่ส่ง UID/identity หรือ Quiz storage bridge ให้ PDF/Drive
ไม่แก้ Firebase Apps Script permissions คลังข้อสอบ notebook schema หรือ CSS กลางเพื่อใส่ลิงก์

## ตรวจและส่งงาน

```sh
pnpm test:pdf
pnpm test:unit
pnpm validate:routes
pnpm build
git diff --check
```

ตัวอย่าง: Test → บท 5 สไลด์ PDF → เมนู/HTML พร้อมปุ่มไฟล์ร่วมและงานร่าง
แชร์หลังเผยแพร่ด้วย #content/pdf-inline-demo หรือ #content/pdf-viewer-demo
ตรวจ TH/EN ไฟล์ร่วมไม่โหลดใหม่ เลขหน้า zoom เปิดซ้ำ/ย่อ/ปิด ลิงก์ Drive และดาวน์โหลด
ลอง PDF จริงภาษาไทยและ iPad Safari ก่อนอ้างว่าผ่านบนอุปกรณ์นั้น
build/commit/push/deploy เป็นคนละขั้น รายงานจริง ดู PDF-VIEWER-QA.md สำหรับขอบเขตการตรวจ
พรอมป์ส่ง Gemini: public/content/templates/pdf-ai-prompt.txt
