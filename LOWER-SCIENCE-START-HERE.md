# วิทยาศาสตร์ ม.ต้น / Lower Secondary Science

แท็บเดิม `lower-science` เปิดคลังบทเรียนแบบเดียวกับฟิสิกส์และเคมี ใช้สีฟ้าอมเขียวประจำวิทยาศาสตร์ของ Hub พร้อม TH/EN, เลือกบท, ค้นหัวข้อ/ID, ลิงก์แชร์, Quiz, Notebook และคลังเนื้อหาทบทวนเดิม

## แหล่งข้อมูล

- [Google Sheet ของระบบ](https://docs.google.com/spreadsheets/d/1N3kU1DnP7B5OPkUglCU0KOJcSELWtPJokHxx_j7tDkU/edit)
- `Sitemap`: คัดแถว I = `SCI_JHC`; H เป็น legacy ID เต็มตามเดิม ส่วน A–G เป็นลำดับวิชา/บท/หัวข้อ
- `SCI_JHC`: A/B เป็น QuizID ที่จับคู่เต็มข้อความแบบ OR; C เป็น HTML โจทย์
- อ่านจริง 7 พ.ย. 2026: Sitemap แถว 309–407 มี 24 บท 99 หัวข้อ; A/B ของ `SCI_JHC` ยังว่าง จึงมีหัวข้อพร้อมสำหรับเพิ่มสื่อ แต่ยังไม่มีข้อสอบ ปุ่ม Quiz จะปิดจนมีโจทย์
- ไม่คัดลอกสารบัญจาก Sheet มาเก็บเป็นรายการตายตัวในเว็บ; เพิ่ม/ปรับหัวข้อใน Sitemap แล้วรีเฟรชคลังได้ตามเดิม

## เปิดบริการจริง (ต้องทำแยกจากการ merge เว็บ)

ตรวจ Guest `/exec?action=catalog&subject=lower-science` ก่อนเปลี่ยนแปลง: รุ่นใช้งานจริงตอบ `invalid-request` ขณะที่ฟิสิกส์ยังอ่านได้ แปลว่ายังไม่มี mapping วิชานี้ใน deployment เดิม **การเพิ่ม Script Property อย่างเดียวจึงยังไม่พอ**

1. เปิด [โครงการบริการคลังข้อสอบ](https://script.google.com/home/projects/1bL3blB5YJoVUPSJev6Yoh5qshDgq3Vg5WURzHqAe7ydfwre5u_GAFef1/edit) ซึ่งเป็นบริการแยกจากเว็บข้อสอบเก่า
2. เทียบและอัปเดต `HUB_BANK.subjects` ตาม `services/question-bank/Code.gs` ให้มี `'lower-science': 'SCI_JHC'` เพิ่มจากฟิสิกส์และเคมี หาก editor มีการแก้เพิ่มเติม ให้คงการแก้เหล่านั้นไว้
3. คง `HUB_BANK_ARCHIVE_FOLDER` เดิม และเพิ่ม `lower-science` ต่อท้ายค่า `HUB_BANK_ENABLED_SUBJECTS` เดิม เช่น `physics,chemistry,lower-science`; อย่าตัดวิชาอื่นที่เปิดใช้อยู่
4. Deploy → Manage deployments → แก้ deployment `/exec` เดิม → New version → Deploy โดยคง URL และสิทธิ์การเข้าถึงเดิม ไม่สร้าง archive ใหม่ และไม่รัน setup ซ้ำ
5. ตรวจ Guest โดยไม่ส่งบัญชี Google: `?action=catalog&subject=lower-science` ต้องตอบ `ok:true`, `subjectId:lower-science` และรายการจาก SCI_JHC; ตรวจ physics และ chemistry อีกครั้งว่ายังอ่านได้
6. หลังเว็บ PR นี้ merge/deploy ให้เปิด `#lower-science` ต้องไป `#lower-science/bank` เลือกบทและหัวข้อจริงได้ รวมทั้งเปลี่ยน TH/EN และแชร์ลิงก์ได้

งาน PR นี้เตรียมโค้ดและขั้นตอนข้างต้น ยังไม่ได้แก้ editor, Script Properties หรือ deployment จริง ห้ามรายงานว่าเปิดใช้งานจริงแล้วโดยอาศัยผล browser fixture

## เพิ่มใบเรียนรู้/สื่อภายหลัง

รอบนี้ยังไม่สร้างเพจใบเรียนรู้ ไม่แต่งโจทย์ และไม่แก้ Sheet

1. เปิดหัวข้อในคลังและคัดลอก `bankKey` จากรายละเอียด ID หรือ URL; ไม่แก้ชื่อ/legacy ID เพื่อทำลิงก์ใหม่
2. สร้างเมนู `public/content/bank/lower-science/<bankKey>.html` ตาม `public/content/templates/bank-tools-menu-template.html`
3. กำหนด `data-subject-id="lower-science"`, `data-chapter-id="bank"`, `data-topic-id="<bankKey>"` และเพิ่มลิงก์ใบเรียนรู้/สรุป/Simulation/PDF ตามคู่มือเดิม [เมนูราย ID](QUESTION-BANK-HTML-MENU-START-HERE.md)
4. ไฟล์เนื้อหาใช้ contentId คงที่; Quiz และ Notebook มีปุ่มระบบอยู่แล้ว ไม่ลงทะเบียนชื่อซ้ำ
5. หากเพิ่มโจทย์ใน Sheet ใช้ QuizID A/B และ HTML_Content C ตามเดิม; การเพิ่ม HTML เพจบน GitHub อย่างเดียวไม่เพิ่มโจทย์ใน Sheet

รหัสคำตอบใช้ `bank-lower-science-<bankKey>` และ archive แยกตาม subject จึงไม่ปะปนกับฟิสิกส์/เคมี แม้ใช้ legacy ID ข้อความเดียวกัน

## ตรวจงาน

- Unit: `pnpm test:bank` และ tests navigation/routes/print ที่เกี่ยวข้อง
- Build: `pnpm build`
- Browser: `QA_BUILT=1 pnpm test:bank:browser` (ต้องมี Playwright/Chromium) รวมหน้าคลังทั้งสามวิชา, TH/EN, ลิงก์บท, สัมผัสจำลองที่ 390/820px, หัวข้อไม่มีโจทย์, ซ่อนหน้ารอเนื้อหา และกลับจากหัวข้อ
- การทดสอบ browser ใช้บริการจำลองและไม่แก้บัญชีนักเรียน; ไม่ยืนยัน Safari บน iPad จริง หรือการเปิดบริการจริงตามขั้นตอนด้านบน
