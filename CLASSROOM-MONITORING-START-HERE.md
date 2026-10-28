# ติดตามคาบเรียนและสะกิดนักเรียน

ฟีเจอร์ในแท็บห้องเรียนของ Learning Hub ใช้บัญชีครู ห้อง และสมาชิกเดิม
ปุ่มล็อกหมายถึงเปิดการรายงานภายในเว็บเฉพาะคาบ

## ใช้งาน

1. ครูเปิดห้องที่ตนสร้าง เลือกเวลาคาบ แล้วกด **ล็อก · เริ่มติดตาม**
2. นักเรียนที่เป็นสมาชิกเห็นคาบเปิดอยู่ กดเข้าคาบ ระบบแสดงป้ายติดตามตลอดคาบ
3. ครูเห็นรายชื่อ ตำแหน่งระดับหน้า/ใบงาน และเวลาที่อัปเดต แม้เด็กเปลี่ยนไปแท็บวิชาอื่นของ Hub
4. กด **สะกิด / ข้อความ** เพื่อส่งข้อความสั้น ดูการแสดงข้อความ การกดรับทราบ และคำตอบของเด็ก
5. นักเรียนเปิดข้อความจากป้ายคาบ รับทราบหรือตอบกลับได้โดยไม่รีโหลดงานที่กำลังทำ
6. กด **ปลดล็อก · จบคาบ** หรือรอหมดเวลาเพื่อหยุดรายงานและล้างคำเตือนที่ค้าง

นอกคาบ ตัวติดตามนี้ไม่ส่งตำแหน่งละเอียดหรือเหตุออกจากหน้า
สถานะออนไลน์พื้นฐานเดิมของ Hub เป็นคนละระบบ
ช่วงอ่านนิ่ง ๆ ไม่แตะจอไม่ถือว่าออกจากหน้า

## ความหมายของสถานะ

- หน้าเว็บแสดงอยู่: พบอย่างน้อยหนึ่งแท็บที่ข้อมูลยังสดและรายงานว่า visible
- หน้าเว็บถูกซ่อน: แท็บที่ยืนยันสถานะได้ทั้งหมดรายงานว่า hidden
- ข้อมูลไม่อัปเดต: มีข้อมูล connection ที่เก่าจนยังยืนยันสถานะหน้าไม่ได้
- ขาดการติดต่อ: ไม่พบ connection ที่ยังติดต่อได้ ไม่ฟันธงว่าเด็กปิดแท็บ
- ยังไม่เข้าคาบ / ออกจากคาบแล้ว: แยกจากเหตุออกจากหน้า

เริ่มเตือนเมื่อ hidden ต่อเนื่อง 15 วินาที ใช้ heartbeat 30 วินาทีและอายุข้อมูล 90 วินาที
มีหลายแท็บแล้วเหลือแท็บที่แสดงอยู่จะไม่เตือนว่าออกทั้งหมด
การเปิดสองจออาจยังรายงานว่า visible; สัญญาณเหล่านี้ไม่ใช่หลักฐานเรื่องความตั้งใจเรียน
การตรวจและส่งเตือนอาจล่าช้าเมื่อเบราว์เซอร์พักงานหรือเครือข่ายขาด

ข้อความของคาบเป็นข้อความในเว็บ รอให้เปิดกลับมาอ่าน ไม่มี push notification นอกเว็บในรุ่นนี้
“แสดงบนหน้าเด็กแล้ว” แยกจาก “รับทราบแล้ว” และการกลับมา visible ไม่ใช่การรับทราบ
ครูดูประวัติข้อความสั้นของคนเดิมในคาบผ่านหน้าสะกิดได้

## เปิดใช้ฐานข้อมูลก่อนใช้งานจริง

โค้ดนี้ไม่ได้เปลี่ยน Rules หรือข้อมูลของ Firebase จริง
ต้องมี Classroom เฟส 1 พร้อมใช้งาน และเพิ่ม namespace `classroomMonitorV1` ก่อน

ไฟล์ `firebase/classroom-monitor.rules.json` เป็น **ส่วนเพิ่ม** ไม่ใช่ Rules ฉบับเต็ม
สำรองและเทียบ Rules ปัจจุบันจาก Firebase Console แล้วเพิ่มเฉพาะกิ่งนี้ใต้ `rules`
คงกิ่งเดิมทั้งหมด โดยเฉพาะ `learningHub`, `classroomV1`, `quizPresence`, `quizProgress` และ LMS
ห้ามนำ fragment ไปแทน Rules ทั้งชุด

สร้างร่างรวมจากไฟล์ Rules ปัจจุบันที่ตรวจแล้วได้ด้วย:

```sh
node scripts/build-classroom-monitor-rules.mjs /absolute/path/to/reviewed-current-rules.json
```

ไฟล์ผลลัพธ์ `firebase/classroom-monitor.merged-draft.json` ยังเป็นร่าง ต้องตรวจเทียบก่อนเผยแพร่
generator จะไม่ทับ namespace ที่มีอยู่แล้ว ต้อง review การอัปเกรดกติกาแยกต่างหาก
หากสิทธิ์ยังไม่พร้อม UI แสดงข้อผิดพลาด ไม่แสดงว่าล็อกหรือส่งข้อความสำเร็จ

## โครงข้อมูลและสิทธิ์

อยู่ภายใต้ `classroomMonitorV1` ทั้งหมด:

| กิ่ง | หน้าที่ |
| --- | --- |
| `sessions/{roomId}` | คาบปัจจุบันของห้อง พร้อม ID และเวลาสิ้นสุด |
| `participants/{roomId}/{sessionId}/{uid}` | การเข้าหรือออกคาบ |
| `connections/{roomId}/{sessionId}/{uid}/{connectionId}` | สถานะและตำแหน่งแต่ละแท็บ |
| `incidents/{roomId}/{sessionId}/{uid}` | เหตุเตือนล่าสุดกับการกลับมา/รับทราบ |
| `notices/{roomId}/{sessionId}/{uid}/{noticeId}` | ข้อความครู คำตอบและ receipts |

ครูต้องได้รับอนุมัติและเป็นเจ้าของห้อง นักเรียนอ่าน/แก้เฉพาะสถานะและ receipts ของตน
ส่งข้อความแทนครู แก้ข้อความครู หรืออ่านรายการของเพื่อนไม่ได้
Rules ตรวจเวลาคาบและ session ID เพื่อปฏิเสธข้อมูลเก่าหรือข้อมูลหลังหมดเวลา

UI จำกัดข้อความคนละ 20 รายการต่อคาบ ข้อความไม่เกิน 300 ตัวอักษร
ตัว client จำกัด connection สดไม่เกิน 8 และล้าง connection ที่ตัดการเชื่อมต่อก่อนเปิดใหม่
จำนวนรายการเป็นขีดจำกัดใน client; Rules บังคับสิทธิ์ ชนิดข้อมูลและขนาดข้อความ
ไม่ได้เพิ่มระบบ quota/rate limiting ฝั่ง server

จบคาบด้วยปุ่มจะล้างข้อมูลสดของคาบ หมดเวลาคาบจะหยุดเขียนด้วย Rules
ข้อมูลคาบที่หมดเวลาล้างเมื่อครูเริ่มคาบถัดไป การล้างอัตโนมัติโดยไม่มีใครเปิดเว็บต้องมีงาน server เพิ่ม
รุ่นแรกไม่เพิ่มประวัติการติดตามตลอดวันหรือเก็บภาพหน้าจอ

## ทดสอบ

```sh
pnpm test:monitor
pnpm test:unit
pnpm build
```

Rules และ browser ใช้ emulator ที่รันเป็น subprocess เดียวกับชุดทดสอบ:

```sh
mkdir -p work/monitor-qa
curl --fail --location --output work/monitor-qa/firebase-database-emulator.jar https://storage.googleapis.com/firebase-preview-drop/emulator/firebase-database-emulator-v4.11.2.jar
pnpm test:monitor:rules
FIREBASE_MODULE=/absolute/path/to/firebase pnpm test:monitor:sdk
QA_BUILT=1 PLAYWRIGHT_MODULE=/absolute/path/to/playwright pnpm test:monitor:browser
```

workflow `classroom-monitor.yml` ใช้ Chromium ทดสอบ production build พร้อม Rules จริงใน emulator
ชุด browser แทน OAuth และ SDK transport ด้วย test adapter และ transaction แบบ REST ETag
มีอีกชุดใช้ Firebase SDK รุ่นเดียวกับเว็บจริง ตรวจการเชื่อมต่อครั้งแรก การรับทราบ
server onDisconnect และ reconnect กับ Rules ใน emulator โดยตรง
ยังต้อง smoke test Google OAuth ของบัญชีจริงและ iPad Safari จริงก่อนใช้ทั้งห้อง
การทดสอบ visibility บน desktop จำลองสถานะเพื่อทดสอบตรรกะ ไม่ยืนยันพฤติกรรมของ multiwindow บน iPad

จุดเริ่มแก้โค้ด: `js/classroom-monitor-model.js`, `js/classroom-monitor-service.js`,
`js/classroom-monitor-firebase.js`, `js/classroom-monitor-view.js` และ
`public/pages/shared/classroom-monitor-page.js`

การเริ่มรายงานแต่ละ connection เตรียม record ครบชุดในสถานะ offline ก่อน
จึงลงทะเบียน onDisconnect แล้วเปลี่ยนเป็น online เพื่อให้การตรวจ Rules ตอนลงทะเบียนผ่าน
และไม่แสดงว่า online ก่อนมีทางจัดการเมื่อ socket หลุด
