# คลังเนื้อหาทบทวน

Quiz และหน้าคลังข้อสอบใช้ตัวเลือกวิชา/บท/หัวข้อและเนื้อหาเดียวกันผ่าน `public/shared/topic-review.js`.
ปุ่มบนหน้าคลังเปิด `pages/tools/topic-review-player.html?subject=chemistry&lang=th` ในแท็บใหม่ เพื่อคงงานใน Hub ไว้.
เปลี่ยนหัวข้อในบททวนไม่เปลี่ยนข้อสอบ คำตอบ สมุด หรือรุ่นโจทย์ที่เซฟไว้.

รายชื่อใช้ `bankClient.catalog()` จากบริการเดิม รวมหัวข้อที่ยังไม่มีข้อสอบ.
ไม่สร้าง/เปลี่ยน bankKey หรือ legacyId และไม่มีการเขียน Sheet/Apps Script.
ใน Quiz เลือก ID อื่นด้วยตนเองได้; ยังไม่ได้อนุมานว่าข้อสอบ A-Level แต่ละข้อเกี่ยวกับหัวข้อใดจากคอลัมน์ B.
ข้อสอบ native ที่ประกาศ `data-topic-ids` เป็น bankKey จริง เลือกหัวข้อแรกที่พบในรายการได้.

## เพิ่มสรุป

เก็บ HTML ที่ `public/content/reviews/chemistry/` หรือ `public/content/reviews/physics/` ใช้ชื่อไฟล์ตามเรื่อง.
ไฟล์ใช้ `<html data-learning-html>` ตามเครื่องมือ HTML เดิม และใส่เนื้อหาอ่านใน `<main data-topic-review-document>`.
ใช้ MathJax, ตาราง, รูป, SVG แบบ static และลิงก์ HTTPS ได้.
ใช้ `<div data-review-writing-space></div>` เพื่อเว้นพื้นที่เขียนตอบทั้งบนจอและตอนพิมพ์.
แยกภาษาเต็มส่วนด้วย `data-content-lang="th"` / `data-content-lang="en"` หรือข้อความสั้น `data-th` / `data-en`.

ในเมนู `public/content/bank/<subject>/<bankKey จริง>.html` เพิ่มรายการเดียว:

    <a data-tool-key="review" data-tool-kind="html"
      data-content-id="รหัสเนื้อหาที่ไม่ซ้ำ" href="../../reviews/chemistry/ชื่อเรื่อง.html"
      data-th="ทบทวนเนื้อหา" data-en="Topic review">ทบทวนเนื้อหา</a>

ใช้รหัสจริงจากคลัง ห้ามนำตัวอย่างข้างบนไปตั้ง bankKey เอง.
หลาย ID ลิงก์สรุปไฟล์เดียวกันได้ โดยใช้ contentId เดียวกันตามกติกาเมนูเดิม.
Build จะรวมรายการใน route catalog ให้ทั้งสองจอเห็น.
หัวข้อที่ยังไม่มี review หรือยังเป็น draft แสดงกำลังเตรียม; ถ้ารายการโหลดผิดพลาดจะแสดงข้อผิดพลาดพร้อมลองใหม่.
ตัวอ่านคัดเฉพาะข้อความ/ตาราง/สื่อปลอดภัย ไม่รัน script, iframe, event handler หรือ CSS ของไฟล์สรุปใน Quiz.

พิมพ์เฉพาะหัวข้อปัจจุบันเป็น A4 ด้วย Print Core เดิม; dropdown และปุ่มไม่ติดในกระดาษ.
ก่อนแจกตรวจ unit tests, build, Pages deployment.json และหน้าจริง รวมทั้ง iPad/เครื่องพิมพ์จริงแยกจากการตรวจเบราว์เซอร์จำลอง.
