# เมนู HTML ราย ID ในคลังข้อสอบ

สถานะ 21 ตุลาคม 2026: โค้ดตัวเชื่อมอยู่ใน branch
`codex/bank-html-menus-20261021` — ยังต้องรันชุดทดสอบ/Build
และตรวจเว็บจริงก่อน merge/ประกาศพร้อมใช้ ไม่ได้ยืนยันว่าเว็บ main เปิดฟีเจอร์แล้ว

## เริ่มสร้างเนื้อหา

คู่มือฉบับเต็มที่ส่งให้แชทอื่นได้:
[bank-id-authoring-guide.txt](public/content/templates/bank-id-authoring-guide.txt)

- แม่แบบ: [bank-tools-menu-template.html](public/content/templates/bank-tools-menu-template.html)
- ข้อความส่งต่องาน: [bank-id-handoff.txt](public/content/templates/bank-id-handoff.txt)
- เมนูตัวอย่างจริง: [การค้นหาความรู้ทางฟิสิกส์](public/content/bank/physics/b-02c6faffabcebd4b78508937.html)
  มีเฉพาะรายการร่าง ยังไม่มีสื่อที่แต่งเพิ่ม
- สถานะตรวจและงานที่ต้องทำต่อ: [QUESTION-BANK-HTML-MENU-QA.md](QUESTION-BANK-HTML-MENU-QA.md)

หลังเผยแพร่ main สำเร็จ คู่มือข้อความจะเปิดได้ที่
https://nixcentury.github.io/learning-hub/content/templates/bank-id-authoring-guide.txt
ห้ามถือว่าลิงก์นี้พร้อมเพียงเพราะมีไฟล์อยู่ใน branch

## สิ่งที่เพิ่ม

หนึ่ง ID ใช้เมนู `public/content/bank/<subject>/<bankKey>.html`
เมื่อมีสื่อเสริม ใช้รูปแบบ nav/a เดียวกับบทเรียนด้านนอก
build ค้นเมนูเองและสร้าง route catalog เดียวให้หน้าการ์ดและลิงก์ตรง
รองรับ HTML, learning sheet, inline PDF/Drive, simulation และ native Quiz เสริม
ช่องร่างที่ยังไม่มีลิงก์ไม่ขวาง build; รหัส/ลิงก์ที่ผิดหรือชนยังเป็น error

`data-route-slug` ให้ URL อ่านง่าย และคง URL bankKey เดิมเป็น alias
ไม่เปลี่ยนรหัสที่ใช้เซฟ งานเก่าและ endpoint เดิมไม่ถูกย้าย

## ขอบเขตที่รักษา

Sheet/Apps Script ยังเป็นแหล่งรายการบท/หัวข้อ/จำนวนข้อและ Quiz เดิม
Open quiz และ Notebook ถูกใส่โดยระบบ ไม่ขึ้นกับรายการใน HTML
เมนูไม่เปิดเผยชุดที่บริการไม่อนุญาต และไม่อ่าน/แก้ Users หรือคะแนน
PDF/Quiz/MathJax/ภาษา/Workspace/การพิมพ์ใช้เครื่องมือเดิม
การตั้งค่า questionBankTools แบบ JS ยังใช้ได้ แต่ห้ามสร้างรายการชนกัน
ไม่เปลี่ยน Firebase Rules, bankKey, legacyId, questionId, revision หรือ archive

แผนออกแบบเดิมเก็บเป็นประวัติใน
[QUESTION-BANK-HTML-MENU-PLAN.md](QUESTION-BANK-HTML-MENU-PLAN.md)
