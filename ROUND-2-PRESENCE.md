# Learning Hub — Round 2 Live Presence

บันทึกวันที่ 5 กันยายน 2026

## ผลงานรอบนี้

- เพิ่มระบบ Online, Idle และ Offline กลางใน `js/presence.js`
- เปลี่ยนเป็น Idle หลังไม่มีการใช้งาน 5 นาที
- ส่ง heartbeat ทุก 60 วินาทีขณะ Online
- ใช้ Firebase `onDisconnect` ลบ connection ของแท็บเมื่อปิดหน้า เน็ตหลุด หรือเครื่องขาดการเชื่อมต่อ จึงไม่ทิ้งรายการค้างสะสม
- แยก connection ของแต่ละแท็บและรวมผลตาม `uid` จึงไม่นับคนเดิมซ้ำ
- ส่งตำแหน่งแท็บหลักที่กำลังเปิด เช่น Overview, Classroom หรือ Physics
- เพิ่มปุ่มจำนวนคนออนไลน์และแผง Live Presence ในแถบบนของ Hub
- แสดงจำนวน Online, Idle และ Visible
- นักเรียนเห็นเฉพาะจำนวน ส่วนรายชื่อรอการตรวจสิทธิ์ครูใน Round 3
- Guest ไม่ถูกส่งขึ้น Presence และไม่เห็นปุ่มรายชื่อออนไลน์

## โครงข้อมูล

ระบบใช้ namespace เดิมที่ระบบ Quiz มีโอกาสได้รับอนุญาตอยู่แล้ว:

```text
quizPresence/
└── learning-hub/
    └── {uid}/
        └── {connectionId}/
            ├── status
            ├── sectionId
            ├── connectedAt
            └── lastActiveAt
```

ไม่เก็บชื่อ อีเมล หรือรูปโปรไฟล์ใน Presence รายชื่อสำหรับครูจะโหลดจากข้อมูลบัญชีแยกต่างหากหลังตรวจ Role แล้ว

## การรองรับหลายแท็บ

แต่ละแท็บสร้าง `connectionId` คนละค่า ถ้าคนเดียวเปิดหลายแท็บ ระบบจะรวมสถานะตาม `uid` ดังนี้:

1. ถ้ามีแท็บใด Online ให้แสดง Online
2. ถ้าไม่มี Online แต่มี Idle ให้แสดง Idle
3. ถ้าทุกแท็บ Offline ให้แสดง Offline
4. จำนวนคนใช้งานนับตาม `uid` ไม่ใช่จำนวนแท็บ

## ผล QA ในเครื่อง

- Production build ผ่าน
- Lint ผ่าน
- Login และ Guest เดิมยังทำงาน
- Guest เข้า Hub ได้โดยไม่เปิดการเชื่อม Presence
- ปุ่ม Presence และแผงรายชื่อถูกซ่อนใน Guest
- พรีวิวไม่มี Console error
- GitHub Pages workflow ไม่ถูกแก้ไข

## การทดสอบที่ต้องให้เจ้าของบัญชีทำ

เข้าสู่ระบบ Google ในพรีวิวเพื่ออนุญาตให้ส่ง `uid`, สถานะ และส่วนที่กำลังเปิดไปยัง Firebase จากนั้นตรวจว่าปุ่ม Online ปรากฏและเปิด Live Monitor ได้

ถ้า Login สำเร็จแต่แผงแจ้งว่าอ่านรายชื่อไม่ได้ แสดงว่า Database Rules เดิมยังไม่อนุญาตเส้นทาง `quizPresence/learning-hub/{uid}/{connectionId}` ต้องให้ผู้ดูแล Firebase เพิ่มสิทธิ์ก่อน ระบบ Login จะยังใช้ได้ตามปกติ

## สิ่งที่ยังไม่ทำ

- ยังไม่เชื่อมสิทธิ์ครูและนักเรียน รายละเอียดวางไว้ใน `ACCOUNT-ROLES.md`
- ยังไม่ทำ Classroom Dashboard
- ยังไม่เชื่อมหน้า HTML ลูก
- ยังไม่ทำ Quiz, Notebook หรือ Save/Load
