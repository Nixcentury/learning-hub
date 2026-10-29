# วิดีโอกลาง / Shared video player

ใช้จอวิดีโอใน Workspace เดิม กรอบ ภาษา ปุ่มย่อ/ขยาย/ปิด และแถบงานเป็นระบบเดิม
ตัวเล่นด้านในเป็น YouTube มาตรฐาน ไม่ต้องสร้าง iframe หรือเขียน JavaScript ในแต่ละบทเรียน
ผู้สร้างเลือกคลิปและใส่ลิงก์เอง ระบบไม่ได้ค้นหาคลิปหรือสร้าง Simulation ให้

## ปุ่มในบทเรียน ใบเรียนรู้ หรือ Simulation

คัดลอก `public/content/templates/video-button-template.html` แล้วใส่ลิงก์จริงใน `data-video-src`:

```html
<button type="button" data-hub-video data-content-id="physics-sound-video"
  data-video-src=""
  data-th="ดูวิดีโอเรื่องเสียง" data-en="Watch the sound video">ดูวิดีโอเรื่องเสียง</button>
```

ช่องว่างเป็นงานกำลังเตรียม ไม่เปิดหน้าต่างเปล่า รหัสเริ่ม a-z ตามด้วย a-z/0-9/- รวมไม่เกิน 128 ตัว
ถ้าอยู่นอกหน้าต่างบทเรียน ให้เพิ่ม `data-subject-id`, `data-chapter-id`, `data-topic-id`
วางปุ่มใน DOM ที่แสดงจริง หน้าเนื้อหาจะได้รับตัวเปิดจาก Hub ไม่ต้องเพิ่ม script
HTML อ่านเนื้อหาและใบเรียนรู้ยังใช้ sandbox เดิม

ใช้ `<a data-hub-video data-content-id="..." href="ลิงก์ YouTube จริง" target="_blank" rel="noopener noreferrer">...</a>` ได้เช่นกัน
anchor ที่มี href จริงจะเปิด YouTube โดยตรงเมื่ออยู่นอก Hub
ใช้ marker เครื่องมือเดียวต่อปุ่ม ไม่ใส่ data-hub-pdf หรือ data-hub-html ซ้ำ

## Quiz

ใช้ anchor ข้างต้นในสรุปหรือ `data-question-context` ตามแม่แบบ Quiz เดิม
ไม่ใช้ button, iframe หรือ script ในไฟล์โจทย์ และไม่วางในตัวเลือก/ช่องลากวาง
ข้อความสองภาษาใช้รูปแบบ rich HTML ตามคู่มือ Quiz ไม่เก็บโค้ดลิงก์ใน string data-th/en
การเปิดวิดีโอไม่ส่งคำตอบหรือให้สิทธิ์ Quiz storage แก่ตัวเล่น
โจทย์จาก Sheet เดิมยังผ่านตัวกรองสื่อเดิม ให้เพิ่มคลิปในเมนูรายหัวข้อแทนการแทรกในเซลล์โจทย์

## รายการเมนูบท เรื่องย่อย และเมนูราย bankKey

ใช้ anchor ใน nav เดิม โดยใส่ลิงก์จริงใน href เมื่อพร้อม:

```html
<a data-tool-kind="video" data-content-id="physics-sound-video"
  href="" data-th="ดูวิดีโอเรื่องเสียง" data-en="Watch the sound video">ดูวิดีโอเรื่องเสียง</a>
```

เมนูราย bankKey เพิ่ม `data-tool-key="video-01"` และใช้ subjectId/bankKey จริงตามคู่มือเมนูเดิม
รองรับหลายคลิปด้วยคนละ content ID และ tool key
เมนูที่ href ว่างหรือ data-status="draft" แสดงกำลังเตรียมเนื้อหา
ใช้รหัสและคลิปเดียวกันจากหลายหน้าเพื่อเรียกกลับหน้าต่างเดียว
รหัสเดียวชี้คนละคลิปหรือคนละเวลาเริ่มคือ conflict ให้แก้ข้อมูล ไม่ปิดการตรวจ

## ลิงก์และพฤติกรรม

- รองรับ YouTube HTTPS แบบ watch, youtu.be, shorts, live และ embed สำหรับวิดีโอหนึ่งคลิป
- รองรับเวลาเริ่มจาก t หรือ start เช่น `t=90` หรือ `t=1m30s` ไม่รองรับ playlist ในรุ่นนี้
- กดปุ่มเปิดหน้าต่าง แล้วกดเล่นในตัวเล่น ไม่รับประกัน autoplay บนอุปกรณ์ทุกชนิด
- ย่อหน้าต่างหรือกลับเมนู: พักวิดีโอ เปิดกลับไม่เริ่มเล่นเอง
- สลับ TH/EN: เปลี่ยนข้อความของ Hub ไม่รีโหลดคลิป ไม่แปลเสียงวิดีโอ
- ปิด: ยกเลิกตัวเล่น ปิดแล้วเปิดใหม่เริ่มจากเวลาบนลิงก์ ไม่มีประวัติรับชมใน Firebase
- “เปิดใน YouTube” อยู่เสมอเมื่อมีลิงก์ถูกต้อง เผื่อคลิปส่วนตัว ถูกลบ ห้ามฝัง หรือเครือข่ายบล็อก
- จอใช้ IFrame Player API เพื่อสั่งพักและรับข้อผิดพลาด ไม่ใช้ YouTube Data API หรือ API key
- การโหลดคลิปและ API เกิดเมื่อเปิดจอวิดีโอ ไม่โหลดคลิปทุกปุ่มตั้งแต่เข้า Hub
- หน้าภายนอกข้ามเว็บไซต์และไฟล์ PDF เองไม่ได้รับตัวจับปุ่มของ Hub

## ไฟล์กลางและการตรวจ

- `public/shared/video-content-model.js`: ตรวจและแปลงลิงก์
- `js/video-link.js`, `js/content-tool.js`, `js/workspace.js`: เปิดผ่าน Workspace
- `public/pages/tools/video-player.*`: จอวิดีโอ
- เมนู, route catalog และ content validator รองรับชนิด video
- `scripts/video.test.mjs`, `scripts/video-player.test.mjs`, `scripts/video-workspace.test.mjs`: ทดสอบสัญญาและตัวเล่น

รัน `pnpm test:unit` และ `pnpm build` ก่อนส่งงาน
การทดสอบด้วยตัวแทน YouTube ไม่ยืนยันการเล่นคลิปจากบริการจริงหรือ Safari/iPad จริง
ตรวจผลและข้อจำกัดรอบนี้ใน `VIDEO-PLAYER-QA.md`
