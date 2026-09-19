# Learning Hub — เวอร์ชัน HTML พื้นฐาน

หน้าเว็บที่ใช้งานจริงเขียนด้วย HTML, CSS และ JavaScript พื้นฐาน เพื่อให้เปิดดูและช่วยแก้ไขได้ง่าย โดยไม่ต้องแก้ไฟล์ React ส่วน GitHub จะ Build และเผยแพร่ให้อัตโนมัติ

## ไฟล์ที่ต้องรู้จัก

1. `index.html` — โครงหน้า ข้อความภาษาไทย/อังกฤษ และรายชื่อแท็บ
2. `public/pages/*.html` — หน้า Overview, Classroom และแต่ละรายวิชา แก้เนื้อหาที่นี่
3. `public/pages/shared/subject-page.js` — Navigation 3 ชั้นของทุกวิชา ปกติไม่ต้องแก้
4. `public/pages/tools/*.html` — ชิ้นงานที่เปิดในหน้าต่างลอย แยก HTML คนละไฟล์
5. `public/pages/tools/notebook-core.css` — หน้าตาของสมุดเขียนกลาง
6. `public/pages/tools/notebook-core.js` — กลไกเขียน ลบ เลื่อน ซูม และข้อมูลลายเส้น ปกติไม่ต้องแก้
7. `public/pages/shared/page.css` — หน้าตาของหน้า HTML ลูกทั้งหมด
8. `public/pages/shared/page.js` — รับภาษาและ Role จาก Hub กลาง
9. `css/styles.css` — สี กระจกใส ขนาด ระยะห่าง และหน้าจอมือถือของ Hub
10. `js/app.js` — การสลับภาษา เชื่อมหน้าตากับบัญชี และเปลี่ยนแท็บ
11. `js/content-context.js` — รหัสกลางของวิชา บท คอนเทนต์ รายการ และหน้าสมุด ปกติไม่ต้องแก้
12. `js/workspace.js` — หน้าต่างงาน ปุ่มย่อ/กางเต็มเว็บ/ปิด วันที่ เวลา Stopwatch, Timer และแถบงานล่าง ปกติไม่ต้องแก้
13. `js/firebase-config.js` — การเชื่อม Firebase กลาง ปกติไม่ต้องแก้
14. `js/auth.js` — Google Login, Guest และ Logout ปกติไม่ต้องแก้
15. `js/presence.js` — Online, Idle, Offline และคนออนไลน์ ปกติไม่ต้องแก้
16. `js/roles.js` — สิทธิ์นักเรียน ครู แอดมิน และคำขอสิทธิ์ครู ปกติไม่ต้องแก้
17. `admin.html` และ `js/role-admin.js` — หน้าหลังบ้านและการจัดการสิทธิ์ครู
18. `public/shared/learning-hub-tools.js` — ตัวกันหน้าต่าง Copy กลางสำหรับ Hub/Quiz/Simulation/Notebook
19. `public/shared/activity-core.js` และ `.css` — โหลดและจัดหน้าตา HTML เนื้อหาทุกชุด
20. `public/shared/print-core.js` และ `.css` — ปุ่มและฟอร์มปริ้น A4 กลาง
21. `public/content/**/*.html` — ไฟล์เนื้อหาสั้นที่มีเฉพาะสรุปและโจทย์
22. `templates/activity-content-template.html` — แม่พิมพ์สำหรับคัดลอกไปสร้างเนื้อหาใหม่
23. `scripts/validate-activity-content.mjs` — ตรวจไฟล์เนื้อหาก่อน Build

ในหน้า HTML ลูก ข้อความสองภาษาเขียนอยู่ด้วยกันแบบนี้:

```html
<span data-th="ฟิสิกส์" data-en="Physics">ฟิสิกส์</span>
```

แก้ข้อความไทยใน `data-th` แก้ภาษาอังกฤษใน `data-en` และแก้ข้อความระหว่าง `<span>...</span>` ให้ตรงกับภาษาไทย

การเปลี่ยนชื่อบททำใน HTML ของวิชานั้นโดยตรง เช่น `public/pages/chemistry.html`:

```html
<article data-chapter="1">
  <h2 data-chapter-title data-th="อะตอม" data-en="Atomic structure">อะตอม</h2>
  <p data-chapter-description data-th="โครงสร้างอะตอม" data-en="Structure of the atom">
    โครงสร้างอะตอม
  </p>
</article>
```

ไม่ต้องแก้ `subject-page.js` เมื่อเปลี่ยนชื่อบทหรือคำอธิบาย

## การเพิ่มหน้า HTML แยก

คัดลอกหน้าเดิมใน `public/pages` แล้วเปลี่ยนชื่อ เช่น:

```text
LEARNING HUB/
├── index.html
├── public/
│   └── pages/
│       ├── overview.html
│       ├── classroom.html
│       ├── physics.html
│       └── chemistry.html
├── css/styles.css
└── js/app.js
```

แล้วเพิ่มปุ่มใน `index.html` โดยให้ `data-page-src` ชี้ไปยังไฟล์นั้น:

```html
<button data-section="physics" data-page-src="pages/physics.html">ฟิสิกส์</button>
```

ทุกไฟล์ `.html` ที่วางไว้ใต้โฟลเดอร์ `public/pages` จะถูกนำขึ้น GitHub Pages อัตโนมัติ โดย workflow หลักไม่ต้องแก้ไข

## การเพิ่ม Quiz หรือแบบฝึกหัดใหม่

ไฟล์เนื้อหาใหม่ไม่สร้างหน้าเว็บทั้งระบบ ให้คัดลอก `templates/activity-content-template.html` แล้วแก้เฉพาะสรุป โจทย์ ตัวเลือก คำตอบ และข้อความสองภาษา จากนั้นวางใต้ `public/content/<subject>/`

ไฟล์เนื้อหาห้ามมี CSS, JavaScript, Firebase, ปุ่ม, ช่องกรอก หรือคำสั่งปริ้นของตัวเอง Activity Core จะสร้างช่องตอบและหน้าตา ส่วน Print Core จะจัดกระดาษ A4 ให้เหมือนกันทุกชุด

หน้า Preview หลังบ้านมีตัวเลือกข้อและปุ่มกลาง 3 แบบ: พิมพ์สรุป, ปริ้นโจทย์เปล่า และปริ้นเฉลย โดยไฟล์เนื้อหาใส่วิธีทำสองภาษาไว้ใน `data-question-solution` ได้ ปุ่มเฉลยไม่ใช่เครื่องมือในหน้าสำหรับนักเรียน

พรีวิวไฟล์ใดก็ได้ด้วย `pages/tools/activity-preview.html?content=<โฟลเดอร์>/<ชื่อไฟล์>.html` โดย `<โฟลเดอร์>/<ชื่อไฟล์>.html` คือที่อยู่ต่อจาก `public/content/` จึงไม่ต้องแก้ไฟล์ Activity Core หรือ Print Core

รายละเอียดสัญญาและตัวอย่างอยู่ใน [`ACTIVITY-CONTENT-V1.md`](ACTIVITY-CONTENT-V1.md)

## การเรียกตัวกันหน้าต่าง Copy จาก Quiz

เพิ่มบรรทัดนี้ก่อน `</body>` ใน Quiz หรือ Simulation ที่ต้องการเชื่อมกับ Hub:

```html
<script src="https://nixcentury.github.io/Physic-subject/shared/learning-hub-tools.js" defer></script>
```

บรรทัดเดียวจะปิดหน้าต่างแตะค้าง/คัดลอกให้อัตโนมัติ ช่อง `input`, `textarea`, `select`, `contenteditable` และส่วนที่ใส่ `data-allow-selection` ยังเลือกและคัดลอกข้อความได้ตามปกติ

## ขอบเขตปัจจุบัน

- หน้า Login โทนเย็นแบบกระจกฝ้า
- สลับภาษาไทย/English และจำภาษาที่เลือก
- Google Sign-In, Guest และ Logout
- แสดงรูป ชื่อ และอีเมลของบัญชีที่เข้าสู่ระบบ
- ระบบ Online, Idle, Offline และ Live Presence
- ระบบ Role นักเรียน ครู แอดมิน และหน้าส่งคำขอสิทธิ์ครู
- หน้า Admin แยกไฟล์สำหรับจัดการสิทธิ์ครู
- แท็บด้านบนเปิดหน้า Overview, Classroom และรายวิชาที่แยกเป็น HTML คนละไฟล์
- รายวิชาทั้ง 7 แท็บมี Navigation 3 ชั้น ช่องบทเริ่มต้น 4 บท และรายการงานตัวอย่าง
- แต่ละวิชาเก็บชื่อและรายการบทใน HTML ของตัวเอง ส่วนพฤติกรรมใช้ไฟล์กลางร่วมกัน
- งานเปิดในหน้าต่างลอยที่ย่อ กางเต็มเว็บไซต์ ปิด ลากย้าย และเปิดพร้อมกันหลายชิ้นได้
- ทุกหน้าต่างมีวันที่ เวลาปัจจุบัน Stopwatch และ Timer นับถอยหลังที่เริ่ม/พัก ปรับทีละ 1 นาที และรีเซ็ตได้
- แถบงานด้านล่างเรียกหน้าต่างที่ย่อกลับมาได้ และหน้าต่างไม่หายเมื่อเปลี่ยนแท็บ
- ทุกหน้าต่างได้รับ Content Context แยกกันในรูป `UID + Content ID + Item ID + Page ID`
- Notebook Core หน้าเดียวเขียนด้วยสีดำ/น้ำเงิน/แดง ลบ เลื่อน ซูม Undo/Redo และสลับโหมดนิ้วได้ในหน้าต่างลอย
- หน้า Hub, Admin, รายวิชา และเครื่องมือปิดหน้าต่างแตะค้าง/คัดลอก โดยยกเว้นช่องกรอกข้อมูล
- เครื่องมือกลางหนึ่งไฟล์พร้อมให้ Quiz/Simulation ชุดใหม่เรียกตัวกันหน้าต่าง Copy ได้
- Activity Core ดึง HTML เนื้อหาแยกไฟล์ ตรวจรูปแบบ และสร้างช่องตอบมาตรฐานได้
- Print Core จัดหน้า A4, ช่องชื่อ/ห้อง/เลขที่ และป้องกันการตัดโจทย์กลางข้อเหมือนกันทุกชุด
- ตัวตรวจ Content V1 ทำงานทุกครั้งก่อน Build และปฏิเสธ Script, CSS, Form หรือรหัสข้อที่ผิด
- หน้าแม่พิมพ์เป็นเครื่องมือหลังบ้าน/QA แบบลิงก์ตรง ไม่แสดงเป็นงานให้นักเรียน
- ยังไม่มีเนื้อหา Quiz จริงและยังไม่ตรวจคำตอบหรือคิดคะแนน
- Notebook ยังไม่มีหลายหน้าหรือระบบ Save/Load
- GitHub Pages เผยแพร่อัตโนมัติเมื่อ Push เข้า `main`

โฟลเดอร์ React เดิมยังเก็บไว้เป็นข้อมูลสำรอง แต่หน้าเว็บจริงไม่เรียกใช้ไฟล์เหล่านั้นแล้ว

## ลำดับงานที่ตกลงล่าสุด

สถานะปัจจุบัน: **Round 5B มี Content HTML Contract, Activity Core และ Print Core กลางแล้ว โดยยังไม่ตรวจคะแนน**

ผลตรวจฐานก่อนเริ่ม Login บันทึกไว้ที่ [`ROUND-0-BASELINE.md`](ROUND-0-BASELINE.md)

ผลการเชื่อม Login กลางบันทึกไว้ที่ [`ROUND-1-AUTH.md`](ROUND-1-AUTH.md)

ผลการเชื่อมระบบคนออนไลน์บันทึกไว้ที่ [`ROUND-2-PRESENCE.md`](ROUND-2-PRESENCE.md)

แบบบัญชีครู นักเรียน และงานหลังบ้านบันทึกไว้ที่ [`ACCOUNT-ROLES.md`](ACCOUNT-ROLES.md)

ผลการทำระบบสิทธิ์รอบ 3 บันทึกไว้ที่ [`ROUND-3-ROLES.md`](ROUND-3-ROLES.md) และกฎที่ต้องให้ผู้ดูแล Firebase ติดตั้งอยู่ใน [`FIREBASE-RULES-ROUND3.md`](FIREBASE-RULES-ROUND3.md)

ผลการแยกหน้า Navigation รอบ 4A บันทึกไว้ที่ [`ROUND-4A-NAVIGATION.md`](ROUND-4A-NAVIGATION.md)

ผลการทำชั้นเลือกงานและหน้าต่างลอยรอบ 4B บันทึกไว้ที่ [`ROUND-4B-WORKSPACE.md`](ROUND-4B-WORKSPACE.md)

ผลการขยายโครงรายวิชารอบ 4C บันทึกไว้ที่ [`ROUND-4C-SUBJECTS.md`](ROUND-4C-SUBJECTS.md)

ผลการวาง Content ID และ Context Bridge รอบ 4D บันทึกไว้ที่ [`ROUND-4D-CONTENT-CONTEXT.md`](ROUND-4D-CONTENT-CONTEXT.md)

ผลการทำ Notebook Core รอบ 5A บันทึกไว้ที่ [`ROUND-5A-NOTEBOOK-CORE.md`](ROUND-5A-NOTEBOOK-CORE.md)

ผลการแยกเนื้อหาและระบบปริ้นกลางรอบ 5B บันทึกไว้ที่ [`ROUND-5B-CENTRAL-TOOLS.md`](ROUND-5B-CENTRAL-TOOLS.md)

แบบคะแนน V1 ที่เก็บเฉพาะคะแนนล่าสุดบันทึกไว้ที่ [`SCORE-DATA-V1.md`](SCORE-DATA-V1.md)

Round 1 เชื่อม Google Sign-In, Guest และ Logout แล้ว Round 2 เพิ่ม Online/Idle/Offline และ Round 3 เตรียมระบบสิทธิ์กับหน้าหลังบ้านแล้ว Round 5A เริ่ม Notebook Core และ Round 5B เริ่มเครื่องมือกลางสำหรับเนื้อหากับการปริ้น โดยยังไม่เริ่ม Quiz จริงหรือระบบ Classroom

## แบบ Navigation และสิ่งที่จะทำต่อ

- ใช้แถบแท็บด้านบนเพื่อเหลือพื้นที่แสดงเนื้อหามากขึ้น
- แต่ละแท็บและแต่ละหน้าหลักแยกเป็นไฟล์ HTML สั้น ๆ เพื่อให้แก้ไขและเพิ่มหน้าได้ง่าย
- Navigation ของรายวิชามีอย่างน้อย 3 ชั้น: เลือกบท/เรื่อง → เลือกงานหรือเครื่องมือ → เปิดงานในหน้าต่างลอย
- หน้าต่างลอยต้องย่อ กางเต็มเว็บไซต์ และปิดได้ มีวันที่/เวลา Stopwatch/Timer และมีแถบงานด้านล่างเพื่อเปิดหลายเนื้อหาพร้อมกัน
- ฝั่งนักเรียนมี Dashboard ห้องเรียน งานค้าง กำหนดส่ง รายละเอียดห้อง และรายการงาน
- ฝั่งครูมี Dashboard รายห้อง สร้างห้อง สั่งงานจากเนื้อหา ให้คะแนน กำหนดส่ง และหมายเหตุ
- Classroom ทำหน้าที่นำเนื้อหาจากแท็บรายวิชามาจัดระเบียบ ไม่สร้างเนื้อหาซ้ำ
- ทุกหน้ารองรับภาษาไทยและอังกฤษอย่างสมบูรณ์
- ต้องรักษา URL ของ Quiz และ Simulation เดิมทั้งหมดให้เปิดได้เสมอ

Round ถัดไปคือ Round 5C เพิ่ม Quiz Checker พื้นฐานสำหรับตัวเลือกและคำตอบตัวเลข โดยยังไม่บันทึกคะแนน ส่วน Notebook หลายหน้าและ Save/Load จะทำหลังวางสัญญาบันทึกกลางที่ใช้ร่วมกับเครื่องมือชนิดอื่น
