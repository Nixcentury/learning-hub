# Learning Hub — Round 4A Modular Navigation

บันทึกวันที่ 5 กันยายน 2026

## ผลงานรอบนี้

- คง Navigation แบบแท็บด้านบนเพื่อให้พื้นที่เนื้อหากว้าง
- ย้าย Overview, Classroom และรายวิชาออกจาก `index.html`
- สร้างหน้า HTML ลูกแยก 9 หน้าใน `public/pages`
- ใช้ iframe กลางเพื่อให้ Login, Role, Presence และบัญชียังคงทำงานโดยไม่ต้องสร้างซ้ำทุกหน้า
- การเปลี่ยนแท็บบันทึกใน URL hash เช่น `#physics` และ `#classroom`
- ปุ่มย้อนกลับของเบราว์เซอร์กลับไปยังแท็บก่อนหน้าได้
- ภาษาไทย/อังกฤษถูกส่งจาก Hub ไปยังหน้า HTML ลูกทันที
- ส่ง Role ไปยังหน้า Classroom เพื่อเตรียมแยกมุมมองนักเรียนและครู
- หน้า Physics มีภาพรวม Navigation 3 ชั้นและพื้นที่บทเริ่มต้น 4 บท โดยยังไม่มีเนื้อหา Quiz

## โครงไฟล์

```text
public/pages/
├── overview.html
├── classroom.html
├── physics.html
├── chemistry.html
├── biology.html
├── lower-science.html
├── science-ep.html
├── math-ep.html
├── upper-math.html
└── shared/
    ├── page.css
    └── page.js
```

ไฟล์ใน `public/pages` ถูกคัดลอกเข้า GitHub Pages อัตโนมัติจาก Build เดิม ไม่ต้องแก้ deployment workflow

## ผล QA

- Lint ผ่าน
- Production build ผ่าน
- หน้า HTML ลูกทั้ง 9 หน้าถูกสร้างใน `dist/pages`
- Guest เข้า Overview, Classroom และ Physics ได้
- Classroom แสดงมุมมองนักเรียนและข้อความคะแนนล่าสุด
- ภาษาไทย/อังกฤษเปลี่ยนพร้อมกันทั้ง Hub และหน้า HTML ลูก
- URL hash เปลี่ยนตามแท็บ

## สิ่งที่ยังไม่ทำ

- ยังไม่ทำ Navigation ชั้นที่ 2 แบบเลือกงานจริง
- ยังไม่ทำหน้าต่างลอย ปุ่มย่อ ปิด และแถบงานล่าง
- ยังไม่เชื่อม Quiz, Simulation หรือ Notebook
- ยังไม่เชื่อมข้อมูล Classroom จริง
