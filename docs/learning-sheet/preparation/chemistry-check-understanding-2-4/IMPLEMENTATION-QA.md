# เคมี 2.4 — ตรวจความเข้าใจ / Check Your Understanding

รุ่น 2026-11-15-2 | ตรวจ 15 พฤศจิกายน 2026 (Asia/Bangkok)
รอบนี้ปรับตามโน้ตครู 4 หน้าและคำสั่งให้นำ Sentence Bank ออก
รายละเอียดเทียบเลขข้อเดิมอยู่ใน TEACHER-REVISION-20261115.md

## งานปัจจุบัน

- ปุ่ม “ตรวจความเข้าใจ / Check Your Understanding” ก่อน Exit Ticket เดิม
- bankKey `b-5e9670f48386783fee660857`; contentId `chemistry-periodic-table-main-group-check-understanding`; slug `check-understanding`
- 49 ข้อต่อภาษา; 50 semantic slots (ข้อจัดเรียงอะตอม–ไอออนมี 2 คู่คำตอบ)
- ความรู้พื้นฐานรวม EN 17; เปรียบเทียบ 7; เหตุผล 10; ถูก–ผิด 15
- ไม่มี Sentence Bank; เหตุผลเขียนด้วยตนเอง; ไม่มีข้อคำนวณแสดงวิธีทำ
- รวมการเปิดเฉลยของข้อที่ครูระบุและตัดเลข IE₂ ที่ให้คำตอบตรง ๆ
- มีจัดเรียงชั้นย่อย Na/Na⁺ และ Cl/Cl⁻; เหตุผล P/S; เครื่องหมาย EA ที่กำหนดนิยามชัด
- ถูก–ผิดมีช่องทำเครื่องหมายหน้าข้อความ; ฉบับเฉลยให้ ✓/✗ และอธิบายแก้ความเข้าใจคลาดเคลื่อนสำหรับข้อความที่ผิด
- ใช้ Learning Sheet และระบบพิมพ์เดิม ไม่แก้ engine
- guide ปรับเลขข้อและ target จริงทั้ง 6 ช่วง พร้อม source revision/SHA-256 ใหม่

## ผลตรวจอัตโนมัติ

- `pnpm build`: ผ่าน; validator 0 errors; learning guides 12 sheets, 0 errors; typecheck/build/Pages artifact ผ่าน
- draft warnings เดิม 33 รายการในเนื้อหาอื่น ไม่ใช่ใบนี้
- `node --test --test-isolation=none scripts/learning-sheet.test.mjs scripts/learning-guide.test.mjs scripts/bank-html-menu.test.mjs`: ผ่าน 25/25
- `git diff --check`: ผ่าน

## ผลทดสอบผ่าน UI ของ managed preview ใน Chrome

| ภาษา | ฉบับ | พื้นที่พิมพ์ | หน้า | ข้อ | ช่องตอบ | Bank | ล้น body | Math errors |
|---|---|---|---:|---:|---:|---:|---:|---:|
| EN | ว่าง | standard | 6 | 49 | 50 | 0 | 0 | 0 |
| EN | เฉลย | standard | 6 | 49 | 50 | 0 | 0 | 0 |
| EN | ว่าง | device-margins | 6 | 49 | 50 | 0 | 0 | 0 |
| EN | เฉลย | device-margins | 6 | 49 | 50 | 0 | 0 | 0 |
| TH | ว่าง | standard | 6 | 49 | 50 | 0 | 0 | 0 |
| TH | เฉลย | standard | 6 | 49 | 50 | 0 | 0 | 0 |
| TH | ว่าง | device-margins | 6 | 49 | 50 | 0 | 0 | 0 |
| TH | เฉลย | device-margins | 6 | 49 | 50 | 0 | 0 | 0 |

ฉบับว่างมี answer nodes 0 และ blank areas 50; ฉบับเฉลยมี answer nodes 50
ตรวจภาพหน้าต้น หน้าจัดลำดับ และบรรทัดถูก–ผิดหน้า 6 ผ่าน print preview จริง
ไกด์เปิดได้และข้อความ/เลขข้อเป็นรุ่นใหม่ ไม่มีปุ่มไปยัง Sentence Bank เดิม
เฉลยเป็นลูกโดยตรงของ slot; ทั้งสองภาษาใช้ semantic keys ชุดเดียวกัน

ขอบเขต: device-margins เป็นโปรไฟล์ที่ทดสอบใน Chrome ไม่ใช่ผลทดสอบ Safari/iPad/iPhone หรือเครื่องพิมพ์จริง ไม่มีการส่ง PDF แยกจากปุ่มพิมพ์กลาง
