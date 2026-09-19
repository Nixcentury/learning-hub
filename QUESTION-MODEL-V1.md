# รูปแบบเนื้อหา Quiz กลาง V1

ไฟล์ HTML ยังคงใส่เฉพาะเนื้อหา ไม่มีปุ่ม/JavaScript ของระบบ ต้องโหลดผ่าน quiz-player

```html
<article data-question data-quiz-question
  data-question-id="fraction-sum" data-question-type="number"
  data-answer="5/6" data-tolerance="0"
  data-topic-ids="fractions arithmetic" data-exam-ids="exam-demo">
  <header data-question-prompt data-th="หาค่า 1/2 + 1/3" data-en="Find 1/2 + 1/3">หาค่า 1/2 + 1/3</header>
  <section data-question-solution data-th="ส่วนร่วมคือ 6 ได้ 5/6" data-en="Use denominator 6 to obtain 5/6." hidden>ส่วนร่วมคือ 6 ได้ 5/6</section>
</article>
```

- `data-activity-id` ที่ article ครอบทั้งชุดต้องไม่ซ้ำและคงเดิม เพื่ออ้างอิงร่างและคะแนนล่าสุดของชุด
- `data-question-id` ต้องไม่ซ้ำภายในชุดและคงเดิมเมื่อเปลี่ยนชื่อ/จัดหมวดใหม่
- `data-question-type`: `choice` (ไม่ระบุถือเป็น choice เพื่อรองรับไฟล์เก่า) หรือ `number`
- choice: อย่างน้อย 2 ตัวเลือก พร้อม `data-choice-id` และ `data-answer` ที่ตรงกัน
- number: ไม่มีตัวเลือก; `data-answer` เป็นค่าตัวเลขหรือเศษส่วน ไม่ใส่หน่วย
- `data-tolerance`: คลาดเคลื่อนสัมบูรณ์ ไม่ติดลบ ไม่ใช่เปอร์เซ็นต์; ไม่ระบุเท่ากับ 0 มีส่วนผ่อนปรนเฉพาะความคลาดเคลื่อนระดับ floating-point
- `data-unit-th/en`: หน่วยแสดงข้างช่อง เช่น m/s หรือ % นักเรียนไม่ต้องพิมพ์หน่วย
- `data-topic-ids` / `data-exam-ids`: รหัสคั่นด้วยช่องว่างหลายค่า เป็น metadata ไม่ใช่การทำสำเนาข้อสอบ/ประวัติ
- prompt/solution ต้องมีสองภาษา; context, hints เป็นส่วนเสริม
- คำตอบ number เก็บเป็นข้อความดิบ (รวม LaTeX) สูงสุด 160 อักขระ เพื่อแก้ต่อแม้ยังพิมพ์ไม่จบ
- ตัวตรวจค่าใช้ grammar จำกัด ไม่มี eval/Function; ปฏิเสธหารศูนย์ ค่าไม่จำกัด และรูปแบบที่ไม่รองรับ

HTML adapter แปลงเป็น model เดียวเพื่อเตรียม importer ในอนาคต การติดหลายหมวดไม่เปลี่ยนรหัสข้อ
ยังไม่ได้แชร์ progress ข้ามชุดด้วย questionId: Cloud ยังคงแยกตาม contentId ของแต่ละชุด
กติกาตั้งชื่อรหัสจริง/Excel จะตกลงภายหลังได้ แต่ไม่ควรเปลี่ยน ID ของชุดที่เด็กเริ่มทำแล้วโดยไม่มี migration
