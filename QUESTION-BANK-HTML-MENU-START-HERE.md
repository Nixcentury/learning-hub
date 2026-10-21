# เมนู HTML ราย ID ในคลังข้อสอบ

สถานะ 21 ตุลาคม 2026: ตัวเชื่อมเมนู HTML และใบเรียนรู้ฟิสิกส์ 4.1 เผยแพร่บน main แล้ว
รุ่นเปิดใช้ `31e3fa8f71274193a6ab5b1de310554a120f360b` ผ่าน tests/Build,
[Pages build+deploy](https://github.com/Nixcentury/learning-hub/actions/runs/39537683367),
ตรวจ deployment.json ตรง commit และทดลอง Guest บนเว็บจริงแล้ว
เริ่มงานใหม่จาก main ล่าสุดที่มีตัวเชื่อมนี้; branch `codex/bank-html-menus-20261021` เป็นประวัติงานพัฒนา

## เริ่มสร้างเนื้อหา

คู่มือฉบับเต็มที่ส่งให้แชทอื่นได้:
[bank-id-authoring-guide.txt](public/content/templates/bank-id-authoring-guide.txt)

- แม่แบบ: [bank-tools-menu-template.html](public/content/templates/bank-tools-menu-template.html)
- ข้อความส่งต่องาน: [bank-id-handoff.txt](public/content/templates/bank-id-handoff.txt)
- เมนูตัวอย่างจริง: [การค้นหาความรู้ทางฟิสิกส์](public/content/bank/physics/b-02c6faffabcebd4b78508937.html)
  มีเฉพาะรายการร่าง ยังไม่มีสื่อที่แต่งเพิ่ม
- สถานะตรวจและงานที่ต้องทำต่อ: [QUESTION-BANK-HTML-MENU-QA.md](QUESTION-BANK-HTML-MENU-QA.md)
- ตัวอย่างใบเรียนรู้ที่เปิดใช้แล้ว: [ฟิสิกส์ 4.1 สมดุล](https://nixcentury.github.io/learning-hub/#physics/bank/b-746a471754733ee41d2e7c4d/learning-sheet)
  และ [ผลตรวจเฉพาะใบเรียนรู้](PHYSICS-EQUILIBRIUM-4-1-QA.md)

คู่มือข้อความที่เผยแพร่:
https://nixcentury.github.io/learning-hub/content/templates/bank-id-authoring-guide.txt
เมื่อเพิ่มสื่อใหม่ ยังต้องตรวจ tests/build/deploy และหน้าเว็บของงานนั้นก่อนส่งใช้งาน

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
