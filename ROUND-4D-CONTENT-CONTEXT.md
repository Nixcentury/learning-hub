# Learning Hub — Round 4D Content Context

บันทึกวันที่ 6 กันยายน 2026

## เป้าหมายรอบนี้

- กำหนดรหัสกลางก่อนเริ่ม Quiz, Simulation และ Notebook จริง
- ส่งบริบทจาก Hub ไปยังหน้าต่างงานทุกชิ้น
- รักษาระบบหน้าต่าง ภาษา Login Role และ Presence เดิม
- ยังไม่บันทึกข้อมูล ไม่เชื่อม Drive และไม่ใส่เนื้อหา Quiz

## โครงบริบทมาตรฐาน

```text
identity.uid
content.subjectId
content.chapterId
content.contentId
content.itemId
content.pageId
```

หน้าตัวอย่างปัจจุบันใช้ `itemId` เป็น `main` และ `pageId` เป็น `page-001` ก่อน เมื่อเริ่มทำ Quiz จริง `contentId` จะเป็นรหัส Quiz และ `itemId` จะเป็นรหัสข้อ

## ไฟล์สำคัญ

- `js/content-context.js` สร้างและตรวจรูปแบบบริบทกลาง
- `js/workspace.js` ผูกบริบทกับหน้าต่างและส่งเข้า iframe
- `js/app.js` เติมภาษา Role และสถานะบัญชีจาก Hub
- `public/pages/tools/tool.js` รับบริบทและเปิด API `window.HubContext` ให้เครื่องมือในอนาคตใช้

## ข้อจำกัดด้านความปลอดภัย

UID ที่ส่งเข้าหน้าต่างใช้ระบุตำแหน่งงานภายในหน้าเว็บเท่านั้น ยังไม่ถือเป็นหลักฐานยืนยันตัวตนสำหรับการเขียน Cloud เมื่อทำ Apps Script Bridge ต้องตรวจ Firebase ID token ฝั่งเซิร์ฟเวอร์อีกครั้ง

## สิ่งที่ยังไม่ทำ

- ยังไม่เปิด Notebook Engine
- ยังไม่มี Save/Load ในเครื่องหรือ Google Drive
- ยังไม่เพิ่มคำถามหรือคะแนน
- ยังไม่เปลี่ยน GitHub Pages workflow
- ยังไม่แก้ Quiz และ Simulation เดิม

## ผล QA

- Lint ผ่าน
- Type check ผ่าน
- Production build ผ่าน
- Guest เปิดงานฟิสิกส์สองชนิดพร้อมกันและได้รับรหัสคนละชุด
- เปลี่ยนไปเคมีบทที่ 2 แล้วได้ `chemistry-c2-simulation / main / page-001`
- หน้าต่างเดิมยังอยู่ครบเมื่อเปลี่ยนวิชา
- ภาษาไทยและอังกฤษเปลี่ยนถึงข้อความสถานะ Context
- GitHub Pages workflow และ Legacy Quiz/Simulation paths ไม่ถูกแก้ไข
