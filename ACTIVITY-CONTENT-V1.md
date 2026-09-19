# Activity Content V1 — สัญญา HTML เนื้อหา

ไฟล์ Quiz หรือแบบฝึกหัดแต่ละชุดเก็บเฉพาะสรุป เนื้อหา โจทย์ ตัวเลือก และข้อมูลคำตอบ ส่วนหน้าตา ช่องตอบ ปุ่มปริ้น ภาษา และการเชื่อม Hub เป็นหน้าที่ของ Activity Core

## วิธีเริ่มชุดใหม่

1. คัดลอก `templates/activity-content-template.html`
2. วางไฟล์ใหม่ใต้ `public/content/<subject>/`
3. เปลี่ยน `data-activity-id` ให้เป็นรหัสภาษาอังกฤษตัวเล็กที่ไม่ซ้ำ
4. แก้ข้อความไทยใน `data-th`, อังกฤษใน `data-en` และข้อความที่อยู่ระหว่างแท็ก
5. เพิ่มโจทย์โดยใช้ `data-question-type="choice"` หรือ `data-question-type="number"` และใส่วิธีทำสองภาษาใน `data-question-solution`
6. เปิด Preview ด้วยลิงก์ `pages/tools/activity-preview.html?content=<subject>/<file>.html`
7. รัน `pnpm validate:content` ก่อน Build

ตัวอย่าง: ถ้าไฟล์อยู่ที่ `public/content/physics/ohms-law.html` ให้เปิด

```text
http://localhost:3000/pages/tools/activity-preview.html?content=physics/ohms-law.html
```

บน GitHub Pages ใช้รูปแบบเดียวกัน โดยเปลี่ยนเฉพาะส่วนหน้าโดเมน ระบบ Preview จะตรวจไฟล์และใส่หน้าตา ช่องตอบ สองภาษา และปุ่มปริ้นให้เอง ไม่ต้องแก้ `activity-core.js`, `activity-core.css`, `print-core.js` หรือ `print-core.css`

## สิ่งที่อนุญาตในไฟล์เนื้อหา

- หัวเรื่อง คำอธิบาย และสรุปเนื้อหา
- รายการประเด็นสำคัญ
- โจทย์แบบตัวเลือกและตัวเลข
- รูปภาพหรือลิงก์เนื้อหาที่ปลอดภัย
- ข้อมูลคำตอบและค่าคลาดเคลื่อน
- วิธีทำหรือคำอธิบายเฉลยสองภาษาใน `data-question-solution` (ไม่บังคับ)

## สิ่งที่ห้ามใส่

- `<script>`, `<style>` หรือ class สำหรับออกแบบหน้า
- `<form>`, `<button>`, `<input>`, `<textarea>` และ `<select>`
- Firebase, Login, Save/Load หรือระบบคะแนน
- ปุ่มปริ้นและ `@media print`
- Event handler เช่น `onclick`

Activity Core จะสร้างช่องตอบให้ตาม `data-question-type` และ Print Core จะจัดกระดาษ A4 ให้ทุกชุดเหมือนกัน

Print Core มี 4 ส่วนกลาง: เลือกข้อ, พิมพ์สรุป, ปริ้นโจทย์ และปริ้นเฉลย ปุ่มปริ้นเฉลยมีไว้ในหน้า Preview/งานหลังบ้าน ไม่ควรนำไปแสดงในหน้าสำหรับนักเรียน

## โจทย์ตัวเลือก

```html
<article
  data-question
  data-question-id="q01"
  data-question-type="choice"
  data-answer="b"
>
  <h3 data-question-prompt data-th="คำถาม" data-en="Question">คำถาม</h3>
  <ul data-question-options>
    <li data-choice-id="a" data-th="ตัวเลือก ก" data-en="Choice A">ตัวเลือก ก</li>
    <li data-choice-id="b" data-th="ตัวเลือก ข" data-en="Choice B">ตัวเลือก ข</li>
  </ul>
  <p
    data-question-solution
    data-th="อธิบายเหตุผลภาษาไทย"
    data-en="Explain the reasoning in English"
  >อธิบายเหตุผลภาษาไทย</p>
</article>
```

## โจทย์ตัวเลข

```html
<article
  data-question
  data-question-id="q02"
  data-question-type="number"
  data-answer="12"
  data-tolerance="0.1"
  data-unit-th="โอห์ม"
  data-unit-en="ohms"
>
  <h3 data-question-prompt data-th="คำถาม" data-en="Question">คำถาม</h3>
  <p
    data-question-solution
    data-th="แสดงวิธีคำนวณภาษาไทย"
    data-en="Show the calculation in English"
  >แสดงวิธีคำนวณภาษาไทย</p>
</article>
```

คำตอบอยู่ใน HTML ฝั่งผู้ใช้ จึงเหมาะกับบทเรียนและแบบฝึกหัดทั่วไป หากทำข้อสอบที่ต้องปกปิดเฉลยจริงต้องย้าย Answer Key ไปตรวจฝั่งเซิร์ฟเวอร์ในเฟสภายหลัง

## ขอบเขตรอบ 5B

- โหลด Content HTML แยกไฟล์แล้ว
- ตรวจรูปแบบทั้งตอน Build และตอนเปิดหน้า
- สร้างช่องตอบจากชนิดโจทย์แล้ว
- ปริ้นฟอร์ม A4 กลางได้แล้ว
- ยังไม่ตรวจคำตอบ ไม่คิดคะแนน และไม่บันทึกข้อมูล
