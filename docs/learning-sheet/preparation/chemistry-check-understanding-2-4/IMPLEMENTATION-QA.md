# เคมี 2.4 — ตรวจความเข้าใจ / Check Your Understanding

ตรวจเมื่อ 15 พฤศจิกายน 2026; ผลด้านล่างเป็น local managed preview ใน Chrome ก่อนเผยแพร่

## งานที่ส่ง

- ปุ่มชื่อ “ตรวจความเข้าใจ / Check Your Understanding” ก่อน Exit Ticket ใน bankKey `b-5e9670f48386783fee660857`
- contentId `chemistry-periodic-table-main-group-check-understanding`; slug `check-understanding`
- ใบใหม่ TH/EN ใช้ Learning Sheet และระบบพิมพ์เดิม ไม่มีการแก้ engine
- 60 ข้อต่อภาษา: เติมความรู้ 20; เรียง/เปรียบเทียบ/ข้อมูล 10; เติมเหตุผล 10; ถูก–ผิด 20
- 69 semantic answer slots ต่อภาษา แยกข้อย่อย; เฉลยไทยและอังกฤษครบ
- Sentence Bank 20 ประโยคต่อภาษา ไม่มีเลข/รหัสกำกับ มีตัวลวงและคำเตือนว่าบางข้อความไม่ถูกต้อง
- ไม่มีข้อคำนวณแสดงวิธีทำในชุดนี้ กติกาสำหรับงานคำนวณครั้งต่อไปเก็บใน CHECK-UNDERSTANDING-AUTHORING.md
- แบบอนุมัติเดิมเก็บไว้ใน approved-design-and-ai-rules.md; ข้อมูลผลิตจริงและเฉลยอังกฤษอยู่ใน question-model.json

## ผลตรวจอัตโนมัติ

- `pnpm build`: ผ่าน; content validation 0 errors; learning guides 12 sheets, 0 errors; typecheck/build/Pages artifact ผ่าน
- validator มี draft warnings เดิม 33 รายการในเนื้อหาอื่น ไม่ใช่ใบใหม่นี้
- `node --test --test-isolation=none scripts/learning-sheet.test.mjs scripts/learning-guide.test.mjs scripts/bank-html-menu.test.mjs`: ผ่าน 25/25
- `git diff --check`: ผ่าน

## ผลเปิดเว็บและพิมพ์จริงผ่าน UI

| ภาษา | ฉบับ | พื้นที่พิมพ์ | หน้า | ข้อ | ช่องตอบ | Sentence Bank | ล้น body |
|---|---|---|---:|---:|---:|---:|---:|
| EN | ว่าง | standard | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| EN | เฉลย | standard | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| EN | ว่าง | device-margins | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| EN | เฉลย | device-margins | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| TH | ว่าง | standard | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| TH | เฉลย | standard | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| TH | ว่าง | device-margins | 10 | 60 | 69 | 20, หน้า 10 | 0 |
| TH | เฉลย | device-margins | 10 | 60 | 69 | 20, หน้า 10 | 0 |

ฉบับว่างลบ answer nodes ทั้งหมดและมี blank areas 69 ช่อง; ฉบับเฉลยมี answer nodes 69 ช่อง
ตรวจไม่มี MathJax errors; ดูภาพหน้าต้นและคลังประโยคใน preview; หน้าคลังอยู่หน้าเลขคู่สำหรับพิมพ์สองหน้า
เปิด/ปิดเฉลยทั้งหมดทำงาน และสถานะ 69 semantic slots ร่วมกันระหว่าง TH/EN
Sheet guide เปิดได้ และปุ่ม Sentence Bank ไปยังส่วนจริงได้
เมนูจริงเปิดใบผ่าน route ใหม่และวางก่อน Exit Ticket

ขอบเขต: ทดสอบโปรไฟล์ device-margins ใน Chrome ไม่ได้ทดสอบ Safari/iPad/iPhone หรือเครื่องพิมพ์จริง ไม่ได้สร้าง PDF แนบแยกจากระบบพิมพ์ของ Hub
