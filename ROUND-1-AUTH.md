# Learning Hub — Round 1 Central Login

บันทึกวันที่ 5 กันยายน 2026

## ผลงานรอบนี้

- รักษาหน้าตา Login เดิมไว้
- เชื่อมปุ่ม Google Sign-In กับ Firebase เดิม
- เชื่อม Guest Mode และจำ Guest ภายในแท็บปัจจุบันเมื่อรีเฟรช
- จำบัญชี Google ด้วย Firebase Local Persistence
- เชื่อม Logout
- แสดงรูป ชื่อ และอีเมลบนแถบบัญชีของ Hub
- รองรับสถานะกำลังโหลดและข้อความผิดพลาดทั้งภาษาไทยและอังกฤษ
- เปิดระบบกลางชื่อ `window.HubAuth` ไว้สำหรับหน้า HTML ลูกในรอบต่อไป

## ไฟล์ระบบกลาง

- `js/firebase-config.js` — ตั้งค่าและเริ่ม Firebase เพียงจุดเดียว
- `js/auth.js` — Google, Guest, Logout และสถานะบัญชี
- `js/app.js` — นำสถานะบัญชีมาเชื่อมกับหน้าตา Learning Hub

ไม่ได้นำ `quizProgress`, LAB state, checkpoint, station หรือระบบคนออนไลน์จาก Simulation มารวมในรอบนี้

## ผล QA ในเครื่อง

- Production build ผ่าน
- Lint ผ่าน
- หน้า Login โหลดสำเร็จโดยไม่มี Console error
- Guest เข้า Hub ได้
- Guest ยังอยู่หลังรีเฟรชในแท็บเดิม
- Logout จาก Guest กลับสู่หน้า Login ได้
- ภาษาไทยและอังกฤษเปลี่ยนทั้ง Hub และแถบบัญชีได้
- GitHub Pages workflow ไม่มีการแก้ไข
- URL เดิมที่เลือกตรวจยังตอบกลับสถานะ 200

## การทดสอบที่ต้องให้เจ้าของบัญชีทำ

กด Google Sign-In ในพรีวิวแล้วเลือกบัญชีด้วยตนเอง จากนั้นตรวจว่ารูป ชื่อและอีเมลปรากฏบน Hub การเลือกบัญชีเป็นขั้นตอนที่เกี่ยวกับข้อมูลบัญชี จึงไม่ดำเนินการแทนเจ้าของบัญชี

หลังนำขึ้น GitHub Pages ต้องทดสอบซ้ำหนึ่งครั้งเพื่อยืนยันว่า `nixcentury.github.io` อยู่ใน Firebase Authorized Domains

## รอบถัดไป

Round 2 จะแยก `presence.js` เพื่อเพิ่ม Online, Idle, Offline, heartbeat, `onDisconnect` และจำนวนคนออนไลน์ โดยยังไม่เริ่ม Classroom Dashboard

