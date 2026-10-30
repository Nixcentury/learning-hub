# Classroom homework QA

ตรวจวันที่ 30 ตุลาคม 2026 จาก main `e6a86238bbdb2aad718e7de647f0dd8b16b65276`

## ผ่านในเครื่อง

- ชุด unit ทั้งระบบ 469 tests ผ่าน: เพิ่ม 8 tests ของ model/service และ 4 tests ของ UI/notice
- Model/service: ลิงก์ Quiz ปกติ/คลัง, ปฏิเสธ external/player/menu/temporary links,
  เวลาไทยและวันที่ผิด, บันทึกร่าง/เผยแพร่ atomic, read receipt, ปิดงาน, revision,
  account switch, listener เก่า, รอ server acknowledgement และคำสั่งซ้ำ
- UI ใช้ DOM implementation จริงผ่าน Linkedom: ข้อความครูแสดงด้วย textContent,
  ปลายทางงานเผยแพร่เป็น read-only, นักเรียนไม่มีปุ่มครู, เปลี่ยนบัญชีล้างฟอร์ม,
  ป้ายงานใหม่/ภาษา/ออกจากระบบ
- Official RTDB emulator 4.11.2 + Java 17: assignment Rules ผ่าน 6 scenarios
  (7 tests รวม parent); กฎห้องเดิมผ่าน 10 scenarios (11 tests รวม parent)
- Rules ตรวจงานร่างส่วนตัว, room membership, atomic publish, ไม่มี global listing,
  takeover/forged fields/timestamps, immutable target, stale revision,
  own read receipt, close/reopen denial และ revoked teacher
- Content validators, TypeScript, Vite build และ Pages artifact verification ผ่าน
  (652 public files ในรอบนี้)
- targeted lint และ git diff whitespace check ผ่าน

## Browser integration ใน CI

เพิ่ม flow ใน `scripts/test-classroom-monitor-browser.mjs`:
ครูตรวจลิงก์ → บันทึกร่างส่วนตัว → เผยแพร่ → นักเรียนเห็นป้ายงานใหม่ → เปิดลิงก์ตรง
→ จำสถานะอ่านหลังรีเฟรช → เปิด Quiz เดิม → ไม่เขียนคะแนนเพียงเพราะเปิด
→ กลับหน้าการบ้าน → ครูปิดงาน → นักเรียนยังอ่านได้แต่เปิดทำจากงานนั้นไม่ได้
จากนั้นรันทดสอบคาบติดตาม/ข้อความเดิมต่อ

สถานะ browser integration: รอผล GitHub Actions; ไม่ถือว่าโค้ดทดสอบที่เขียนไว้เป็นผลผ่าน
เบราว์เซอร์ที่เชื่อมในรอบนี้เข้าถึง local preview ไม่ได้ จึงไม่มีคำยืนยันการคลิกครบ flow
หรือภาพตรวจหน้าจอจริงจากเครื่องนี้ ผล DOM ไม่ยืนยัน layout/touch บน iPad Safari

## ต้องตรวจเมื่อเผยแพร่และติดตั้ง Rules แล้ว

ใช้บัญชีทดสอบและห้องทดลอง ไม่ใช้คะแนนจริงในการลอง:

1. ครูได้รับอนุมัติสร้างงานร่าง นักเรียนสองคนและคนนอกห้องอ่านงานร่างไม่ได้
2. เผยแพร่แล้วสมาชิกทั้งสองเห็นงานใหม่ อีกห้องไม่เห็น
3. เปิดลิงก์การบ้านจากสถานะออกจากระบบ Login แล้วกลับมาที่งานเดิม
4. ดูรายละเอียดแล้วป้ายใหม่หาย รีเฟรชและเปิดเว็บใหม่ยังจำได้
5. เปิด Quiz แล้วคำตอบ/โน้ตเดิมใช้ต่อได้ กด Back กลับการบ้านถูกชิ้น
6. แก้คำชี้แจงและกำหนดส่ง, ปิดงาน, จบคาบติดตาม, สลับบัญชี, เน็ตหลุด/กลับมา
7. ตรวจภาษาไทย/อังกฤษและ iPad Safari จริง ทั้งแนวตั้ง/แนวนอน

ยังไม่ได้อ่าน/แก้ production Firebase Rules, ไม่ได้ส่ง Google Classroom,
และไม่ได้เข้าบัญชีครูหรือนักเรียนจริงในรอบพัฒนานี้
