# Learning Hub — Account and Role Architecture

บันทึกวันที่ 5 กันยายน 2026

## ข้อตกลงหลัก

Learning Hub ใช้หน้า Google Login เดียว ไม่แยกหน้าเข้าสู่ระบบครูและนักเรียน หลัง Login ระบบอ่านสิทธิ์จาก Firebase แล้วแสดงพื้นที่ที่เหมาะกับผู้ใช้คนนั้น

ผู้ใช้ห้ามเลือกหรือแก้บทบาทครูเองจากหน้าเว็บ, URL, Local Storage หรือ JavaScript ฝั่งผู้ใช้

## ระดับสิทธิ์

### สิทธิ์ระดับระบบ

- `student` — ค่าเริ่มต้นของบัญชีใหม่ทุกบัญชี
- `teacherApproved` — บัญชีที่ได้รับอนุมัติให้สร้างและจัดการห้องเรียน
- `admin` — อนุมัติหรือยกเลิกสิทธิ์ครู

### สิทธิ์ภายในแต่ละห้อง

- `owner` — เจ้าของห้อง
- `teacher` — ครูร่วม
- `student` — นักเรียนในห้อง

สิทธิ์สองระดับต้องแยกกัน เพราะคนหนึ่งอาจเป็นครูในห้องของตน แต่เป็นผู้เรียนในห้องอบรมอีกห้องหนึ่งได้

## โครงข้อมูลเบื้องต้น

```text
learningHub/profiles/{uid}
learningHub/admins/{uid}
learningHub/teacherRequests/{uid}
learningHub/teacherApprovals/{uid}
learningHub/classrooms/{roomId}
learningHub/classMembers/{roomId}/{uid}/role
learningHub/userClassrooms/{uid}/{roomId}
```

- `profiles` เก็บข้อมูลแสดงผลของบัญชีเท่าที่จำเป็น
- `admins` และ `teacherApprovals` เป็นข้อมูลหลังบ้าน ผู้ใช้ทั่วไปเขียนไม่ได้
- `teacherRequests` เก็บคำขอที่ผู้ใช้ส่งให้แอดมินตรวจ
- `classMembers` เป็นบทบาทเฉพาะห้อง
- `userClassrooms` เป็นดัชนีสำหรับโหลด Dashboard ของแต่ละคน

## ขั้นตอนหลัง Login

```text
Google Login
    ↓ uid
ตรวจ admin / teacher approval
    ↓
โหลดห้องและบทบาทของ uid
    ↓
แสดง Student Dashboard หรือ Teacher tools
```

ไม่ต้องถามว่า “เป็นครูหรือนักเรียน” ในหน้า Login

## งานหลังบ้าน

ระยะแรกให้ผู้ดูแล Firebase เพิ่มบัญชี admin เริ่มต้นจาก Firebase Console จากนั้นใช้หน้า `admin.html` ตรวจคำขอ อนุมัติ ปฏิเสธ หรือถอนสิทธิ์ครู โดย Database Rules ต้องตรวจว่าเฉพาะ `admin` เท่านั้นที่เขียน `teacherApprovals` ได้

การทำหน้า Admin อย่างเดียวโดยไม่มีกฎ Firebase ไม่ปลอดภัย เพราะผู้ใช้สามารถข้ามหน้าจอและเรียกฐานข้อมูลโดยตรงได้

## กติกา Presence

- นักเรียนเห็นจำนวน Online/Idle เท่านั้น
- Presence ไม่เก็บชื่อ อีเมล หรือรูป
- รายชื่อบุคคลสำหรับครูจะโหลดจาก `users` แยกต่างหากหลังตรวจสิทธิ์ครูแล้ว
- ก่อนเปิดรายชื่อจริงต้องเพิ่ม Database Rules ให้ครูและแอดมินเท่านั้นที่อ่านข้อมูลนั้นได้

## ลำดับพัฒนาที่ปรับใหม่

1. Round 2 — Presence แบบไม่เปิดเผยรายชื่อ
2. Round 3 — ฐาน Role คำขอสิทธิ์ครู และหน้าหลังบ้าน (เตรียมแล้ว รอเปิด Firebase Rules)
3. Round 4 — ส่งบัญชีและ Role ไปหน้า Classroom HTML
4. Round 5 — QA และนำขึ้น GitHub Pages
