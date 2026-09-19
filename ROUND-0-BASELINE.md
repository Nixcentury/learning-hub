# Learning Hub — Round 0 Baseline

บันทึกวันที่ 5 กันยายน 2026 ก่อนเริ่มเชื่อมระบบ Login กลาง

## ขอบเขตรอบนี้

- ตรวจโครง Learning Hub และระบบเผยแพร่ปัจจุบัน
- ตรวจว่า Hub ยังไม่มี Firebase เชื่อมอยู่จริง
- ตรวจแหล่งระบบ Login/Presence เดิมที่จะนำมาปรับ
- ตรวจ URL สำคัญบน GitHub Pages
- ไม่แก้หน้าตา ไม่เชื่อม Login และไม่ Deploy

## สถานะ Learning Hub ปัจจุบัน

- หน้าใช้งานจริงเขียนด้วย `index.html`, `css/styles.css` และ `js/app.js`
- หน้า Login ปัจจุบันเป็นแบบที่ผ่านแล้ว ต้องรักษาหน้าตาเดิม
- ปุ่ม Google ยังเป็นตัวอย่างและยังไม่ได้เชื่อม Firebase
- ปุ่ม Guest ใช้เปิด Hub ตัวอย่างได้
- รองรับภาษาไทยและอังกฤษและจำภาษาด้วย Local Storage
- Production build ผ่านเรียบร้อย

## เส้นทางเผยแพร่ปัจจุบัน

- หน้า Hub ใช้งานที่ `https://nixcentury.github.io/Physic-subject/`
- `LEARNING HUB/index.html` ถูก Build แล้วย้ายเป็น `index.html` ที่รากของเว็บไซต์
- ดังนั้น `https://nixcentury.github.io/Physic-subject/LEARNING%20HUB/index.html` เป็น 404 ตามโครงปัจจุบัน ไม่ใช่ไฟล์ Hub หาย
- GitHub Pages workflow จะรวมไฟล์บทเรียนเดิมเข้าไปใน artifact เดียวกับ Hub
- มี HTML ที่ Git ติดตามทั้งหมด 268 ไฟล์: Hub 1 ไฟล์และหน้าเดิม 267 ไฟล์
- `LEARNING HUB/dist` เป็นผลจากการ Build และไม่เก็บลง Git

## URL เดิมที่ตรวจบนเว็บจริง

ทุกเส้นทางด้านล่างตอบกลับสถานะ 200 เมื่อวันที่บันทึกนี้

- `BASIC PRORAMING/TEST_python-foundations-operators-conditions-loops - Copy.html`
- `quiz with note and log in/chemistry/equlibrium/Chemical_Equilibrium_Mastery_Quiz_Round5_QA_FINAL.html`
- `quiz with note and log in/PHYSIC/BASIC DC/Resistor%20Networks%20Mastery%20Quiz.html`
- `quiz with note and log in/PHYSIC/BASIC DC/Ohm%27s%20Law%2C%20Power%20%26%20Electrical%20Energy.html`
- `quiz with note and log in/PHYSIC/BASIC DC/Resistance%20%26%20Resistivity.html`
- `PHYSIC V2/2D-motion/PROJECTILE/projectile-motion-simulator-v2-measurement-points.html`
- `PHYSIC V2/LIQUID UNIT/_core-virtual-pressure-buoyancy-lab-v6.html`
- `CHEMISTRY V2/RATE REACTION/SIMULATION QUIZ/virtual-kinetics-lab-PHASE1-v1.4.0-guest-access.html`

## ระบบเดิมที่จะนำมาเป็นต้นแบบ

ไฟล์ `virtual-kinetics-lab-PHASE1-v1.4.0-guest-access.html` มี Firebase SDK 10.12.5 และมีกลไกที่นำมาปรับใช้ได้ ได้แก่

- Google Sign-In และการจำสถานะ Login
- Guest Mode และ Logout
- `onAuthStateChanged`
- Online, Idle และ Offline
- Heartbeat, Idle timeout และ `onDisconnect`
- จำนวนและรายชื่อผู้ใช้ออนไลน์

ไม่ยกระบบบันทึก `quizProgress`, LAB state, checkpoint หรือ station มารวมกับ Hub เพราะเป็นข้อมูลเฉพาะ Simulation เดิม

## สิ่งที่ยังต้องตรวจใน Round 1

- GitHub Pages domain อยู่ใน Authorized Domains ของ Firebase หรือไม่
- Database Security Rules อนุญาตเส้นทาง Presence กลางแบบใด
- บทบาทครูและนักเรียนต้องอ่านจากจุดใด โดยห้ามให้ผู้ใช้ตั้งบทบาทครูเอง
- พฤติกรรม Google popup บนคอมพิวเตอร์และมือถือ

## กติกาสำหรับ Round 1

- รักษาหน้าตา Login ปัจจุบัน
- แยก Firebase, Auth และ Presence เป็นไฟล์กลางสั้น ๆ
- ไม่แก้ GitHub Pages workflow
- ไม่เริ่ม Quiz, Notebook, Classroom Dashboard หรือ Navigation ที่พักไว้
- หลังทุกช่วงต้อง Build ผ่านและตรวจ URL เดิมไม่ให้กลายเป็น 404

