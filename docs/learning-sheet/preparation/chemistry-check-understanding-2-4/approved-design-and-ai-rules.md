# กติกา AI และแบบออกแบบคำถาม: ตรวจความเข้าใจ เคมี 2.4

รุ่น 1.0 | วันที่ 15 พฤศจิกายน 2569 (Asia/Bangkok)
งานแรกของรูปแบบนี้: เคมี 2.4 ตารางธาตุและสมบัติของธาตุหมู่หลัก

สถานะ: ครู CF ให้ผลิตแล้ว และยืนยันชื่อปุ่ม “ตรวจความเข้าใจ / Check Your Understanding” ก่อน Exit Ticket ในหัวข้อ 2.4
ไฟล์นี้เก็บแบบคำถามที่อนุมัติไว้เป็นหลักฐานการผลิต ใบใช้งานจริง เฉลยคู่ภาษา และผลตรวจให้ดูจาก question-model.json และ IMPLEMENTATION-QA.md ในโฟลเดอร์เดียวกัน

## 1. อ่านกติกาสำคัญนี้ก่อนทำงาน

คำสั่งล่าสุดของครูในบทสนทนามีผลเหนือข้อเสนอเดิมในเอกสารนี้ หากครูเปลี่ยน ให้ปรับแบบรวมก่อนเริ่มทำใบจริง

1. ออกแบบคำถาม 2.4 ให้ครบทั้งชุดก่อน แล้วทำใบจริงครั้งเดียวหลัง CF ไม่ทยอยสร้างใบหลายรุ่นระหว่างออกแบบ
2. ทุกอย่างต้องเปิดอ่านและพิมพ์ได้ด้วยระบบใบเรียนรู้เดิม มี TH/EN ฉบับนักเรียนและฉบับเฉลย
3. มีคำถามเติมคำ/คำตอบสั้น เรียงลำดับ/เปรียบเทียบ เติมเหตุผล และถูก–ผิด
4. ข้อถูก–ผิด: เด็กตอบเพียง ✓ หรือ ✗ ห้ามบังคับเขียนเหตุผลหรือแก้ข้อความ เหตุผลและข้อความแก้ไขอยู่ในเฉลยเท่านั้น
5. ข้อเติมเหตุผล: มี Sentence Bank เต็ม 1 หน้าสำหรับพิมพ์ด้านหลัง เด็กเลือกแล้วเขียนข้อความเหตุผลเอง
6. ห้ามใส่รหัส หมายเลข หรือตัวอักษรนำหน้าประโยคใน Sentence Bank เพราะเด็กเคยตอบเป็นรหัสแทนการเขียน
7. Sentence Bank ต้องมีจำนวนประโยคไม่น้อยกว่า 2 เท่าของจำนวนข้อเติมเหตุผลที่ใช้คลังนั้น (M ≥ 2N) สลับลำดับ ไม่เรียงตามข้อ และใช้ประโยคซ้ำได้เมื่อเหตุผลนั้นใช้ได้จริง สำหรับงานนี้ 10 ข้อต้องมีอย่างน้อย 20 ประโยค โดยจัดประโยคคำตอบเป้าหมาย 10 ประโยคและตัวลวง 10 ประโยค ไม่รวมข้อถูก–ผิดในการนับ N
8. ตัวลวงให้วัดความเข้าใจ มีคำตอบชัด ไม่ใช้ข้อความกำกวม ตัวหนังสืออ่านยาก หรือรายละเอียดที่ไม่ได้ให้เป็นกับดัก
9. ข้อคำนวณ: ให้เด็กคิดและแสดงวิธีทำเอง พร้อมมีคำตอบตัวเลขให้ตรวจตัวเองอยู่ในข้อ
10. รูปแบบข้อคำนวณต้องเป็น โจทย์จบ → บรรทัดถัดไปวงเล็บคำตอบตัวเลขพร้อมหน่วย → พื้นที่ว่างแสดงวิธีทำ
11. ห้ามนำวิธีทำ สูตรที่จัดแทนค่า หรือคำตอบคำนวณไปใส่ Sentence Bank
12. บรรทัดคำตอบตัวเลขของข้อคำนวณต้องเห็นได้ในฉบับนักเรียน แม้ยังไม่เปิดเฉลย และต้องติดไปกับหน้าพิมพ์ฉบับนักเรียน
13. วิธีทำเต็มของข้อคำนวณอยู่ในเฉลย ครูจะดูวิธีทำของเด็กเพิ่มเติมได้
14. เคมี 2.4 เน้นความรู้และการเปรียบเทียบ ไม่ต้องแต่งข้อคำนวณเพิ่มเพียงให้ครบประเภท แบบนี้เสนอข้อคำนวณแสดงวิธีทำ 0 ข้อ
15. ต้องมี IE₁ ตามคาบแบบเรียงครบทั้งคาบ 2 และ 3 พร้อมตรวจข้อยกเว้น
16. ต้องมีการจำและเรียง EN 10 อันดับสูงสุด ไม่เปลี่ยนเป็น “10 ธาตุที่ใช้บ่อย” โดยพลการ ต้องประกาศชุดข้อมูลและวิธีจัดการค่าที่เสมอกัน
17. คำว่า EN 10 อันดับเป็นเป้าหมายที่ครูกำหนดสำหรับชุดนี้ ไม่กล่าวว่า ทปอ. บังคับให้ท่องรายการนี้
18. เว้นพื้นที่ให้เขียน ไม่มีเส้นประ เส้นบรรทัด หรือจุดไข่ปลาในพื้นที่ตอบ
19. ชื่อปุ่มที่ครูยืนยัน: “ตรวจความเข้าใจ / Check Your Understanding” วางก่อน Exit Ticket ในหัวข้อเคมี 2.4
20. ห้ามเดา bankKey, contentId, สถานะ merge, ผลทดสอบ หรือผลตรวจพิมพ์

### ตัวอย่างข้อคำนวณสำหรับใช้กับงานในอนาคต

[ข้อความโจทย์เต็ม ระบุข้อมูลและสิ่งที่ถาม]
(คำตอบ: [ตัวเลขพร้อมหน่วย])

[พื้นที่ว่างให้นักเรียนแสดงวิธีทำเอง]

นี่เป็นตัวอย่างรูปแบบ ไม่ใช่ข้อคำนวณที่ต้องเพิ่มใน 2.4 และไม่ให้เปิดวิธีทำอัตโนมัติพร้อมคำตอบตัวเลข

## มาตรฐานภาษาและการเรียบเรียงแบบหนังสือเรียน / Textbook editorial standards

คำสั่งเพิ่มเติมจากครู: ให้เรียบเรียงด้วยมาตรฐานของผู้เขียนหนังสือเรียนและบรรณาธิการวิชาการ ทั้งภาษาไทยและภาษาอังกฤษ

- ภาษาไทย: ใช้ประโยคสมบูรณ์ เป็นทางการ กระชับ และเหมาะกับนักเรียนมัธยมศึกษาตอนปลาย เช่น “จงเรียง...” “จงระบุ...” และ “เพราะเหตุใด” ใช้คำศัพท์วิทยาศาสตร์อย่างสม่ำเสมอ
- ภาษาอังกฤษ: ใช้ natural textbook English ให้คำสั่งตรงและชัด เช่น “Arrange...” “Identify...” “State...” และ “Explain why...” ไม่แปลตามคำไทยจนผิดธรรมชาติ
- ความเป็นทางการต้องไม่ทำให้ประโยคยาวหรือใช้ศัพท์ยากเกินจำเป็น ไม่ใช้ภาษาพูด มุกสนทนา อีโมจิ หรือคำตำหนินักเรียนในตัวใบ
- คำถามสองภาษาต้องมีเงื่อนไข ชนิดอนุภาค สถานะพื้น สถานะแก๊ส ทิศทางการเรียง หน่วย และระดับความยากเท่ากัน
- คำว่า “ทุก” “เสมอ” “โดยทั่วไป” “ในธาตุเดียวกัน” และ “ในชุดไอออนที่มีการจัดเรียงอิเล็กตรอนเหมือนกัน” เป็นเงื่อนไขสาระสำคัญ ห้ามตกหล่นตอนแปล
- คำถามถูก–ผิดต้องคงค่าความจริงเดิมทั้งสองภาษา แต่ละประโยคมีข้อสรุปที่ตรวจได้ชัด
- คงสัญลักษณ์ธาตุ ตัวเลข ประจุ ลำดับ IE และจำนวนข้อให้ตรงกันทั้งหมด
- ใช้คำว่า first ionization energy, successive ionization energies, electron affinity, electronegativity, effective nuclear charge และ isoelectronic ions ให้ถูกบริบท
- เฉลยวิชาการต้องอธิบายกลไก ไม่ใช้เพียงคำว่า “เต็มจึงเสถียร” หรือ “ครึ่งเต็มจึงเสถียร” แทนเหตุผลเรื่องระดับพลังงานและแรงผลักระหว่างอิเล็กตรอน
- ส่วนคำตอบที่นักเรียนเขียนยังยอมรับถ้อยคำสมมูล ไม่บังคับคัดตรงทุกคำ เพียงต้องเขียนเป็นข้อความ ไม่ตอบเป็นรหัส
- แบบคำถามภาษาอังกฤษในภาคผนวกเป็นต้นฉบับคู่ภาษาให้ตรวจพร้อมกับคำถามภาษาไทย ก่อนผลิตใบจริง

### คำศัพท์ควบคุม / Controlled terminology

| ภาษาไทย | English |
|---|---|
| ธาตุหมู่หลัก / ธาตุเรพรีเซนเททีฟ | main-group element / representative element |
| หมู่; คาบ | group; period |
| เวเลนซ์อิเล็กตรอน | valence electron |
| อะตอมเป็นกลางในสถานะพื้น | neutral atom in its ground state |
| รัศมีอะตอม; รัศมีไอออน | atomic radius; ionic radius |
| พลังงานไอออไนเซชันลำดับที่ 1 | first ionization energy |
| พลังงานไอออไนเซชันต่อเนื่อง | successive ionization energies |
| สัมพรรคภาพอิเล็กตรอน | electron affinity |
| อิเล็กโทรเนกาติวิตี | electronegativity |
| ประจุนิวเคลียสยังผล | effective nuclear charge |
| การกำบัง | shielding |
| แฮโลเจน; แก๊สมีสกุล | halogen; noble gas |
| ถูก–ผิด | true–false |
| คลังประโยคสำหรับเติมเหตุผล | Sentence Bank |


## 2. ต้นแบบและแหล่งตรวจสอบ

### ต้นแบบระบบใบเรียนรู้ที่ครูให้ใช้

[ฝึกคำนวณการแทรกสอดใน Learning Hub](https://nixcentury.github.io/learning-hub/#physics/bank/b-f9be360f5072708150e89e0f/basic-calculations)

ไฟล์ต้นทางที่ได้ตรวจอ่าน:
- public/content/physics/interference-9-4-3-basic-calculations-learning-sheet.html
- public/content/bank/physics/b-f9be360f5072708150e89e0f.html
- docs/learning-sheet/preparation/physics-interference-9-4-3/BASIC-CALCULATIONS-2026-11-14.md

ใช้ระบบกลางเรื่องภาษา เปิด–ปิดเฉลย ไกด์ และการพิมพ์ อย่าสร้าง toolbar หรือระบบพิมพ์อีกชุดในเนื้อหา
บรรทัดคำตอบตัวเลขสำหรับ self-check ต้องอยู่นอกส่วนวิธีทำที่ซ่อนด้วย data-sheet-answer โดยตรวจความเข้ากันได้กับระบบจริงก่อนใช้งาน

### เนื้อหา 2.4 ในระบบที่ได้ตรวจอ่าน

- public/content/reviews/chemistry/periodic-table-main-group.html
- public/content/chemistry/atomic-properties/2-4-exit-ticket-revision.html

ให้ใช้เป็นแหล่งเทียบและเชื่อมตำแหน่งทบทวน ไม่คัดลอกจำนวนข้อหรือรูปแบบข้อสอบเดิมทั้งหมดมาแทนแบบใหม่

### แหล่งภายนอก

- [คู่มือหลักสูตร สสวท. ผลการเรียนรู้เรื่องหมู่ คาบ และแนวโน้มสมบัติ](https://www.scimath.org/e-books/8417/flippingbook/27/)
- [Project 14 เคมี ม.4 เล่ม 1](https://proj14.ipst.ac.th/m4-6-chem/m4-chem-book1/)
- [โครงสร้างและตัวอย่าง A-Level เคมีของ ทปอ.](https://www.mytcas.com/blueprint/a-level-65-chem/)
- [ข้อสอบทางการ A-Level เคมี 2568](https://assets.mytcas.com/68/answer/tcas68-chem-a-level.pdf)
- [OpenStax: Periodic Variations in Element Properties](https://openstax.org/books/chemistry-2e/pages/6-5-periodic-variations-in-element-properties)
- [OpenStax: Covalent Bonding และ EN](https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding)
- [RSC Periodic Table](https://periodic-table.rsc.org/)

หลักฐาน A-Level ที่นำมาใช้เป็นแนว:
- ตัวอย่างข้อสอบทางการข้อแรก ใช้ IE ต่อเนื่องเพื่ออนุมานหมู่แล้วเชื่อมสมบัติอื่น
- ข้อสอบทางการ 2568 ข้อ 1 เชื่อมการจัดเรียงอิเล็กตรอน เวเลนซ์ และไอออน
- ข้อสอบทางการ 2568 ข้อ 3 ตรวจการจำแนกธาตุและข้อความเหมารวม
- คำถามในแบบนี้เรียบเรียงใหม่ ไม่อ้างว่าเป็นสำเนาข้อสอบจริง
- ไฟล์บางปีในโฟลเดอร์ข้อสอบระบุว่ารวบรวมจากความจำ ห้ามใช้เป็นหลักฐานข้อสอบทางการโดยไม่ตรวจที่มา
- ห้ามอ้างว่า PDF ในโฟลเดอร์หนังสือเป็นหนังสือ สสวท. จากชื่อไฟล์อย่างเดียว ต้องตรวจชื่อผู้จัดทำและเนื้อหา

## 3. โครงสร้างที่เสนอ: 60 ข้อหลัก

| ส่วน | ลักษณะ | จำนวนข้อหลัก | การตอบ |
|---|---|---:|---|
| ก | เติมความรู้สั้น ๆ | 20 | เขียนคำ ชื่อธาตุ สัญลักษณ์ หรือรายการตามโจทย์ |
| ข | เรียงลำดับ/เปรียบเทียบ/อ่านข้อมูล | 10 | เขียนลำดับหรือคำตอบสั้น ไม่บังคับเหตุผลทุกข้อ |
| ค | เติมเหตุผลจาก Sentence Bank | 10 | เขียนประโยคเหตุผลเอง ห้ามตอบรหัส |
| ง | ถูก–ผิด | 20 | ✓ หรือ ✗ เท่านั้น |
| รวม |  | 60 |  |
| ข้อคำนวณแสดงวิธีทำ | ไม่บังคับเพิ่มในบทนี้ | 0 | กติกาข้อคำนวณเก็บไว้ใช้กับบทที่มีจริง |

“60 ข้อ” หมายถึงข้อหลัก บางข้อมี 2–3 ช่องสั้น และข้อ EN มี 10 ตำแหน่ง ต้องรายงานจำนวนช่องจริงแยก ไม่โฆษณาว่าเป็น 60 คำตอบสั้นเท่ากันทั้งหมด
คะแนนยังไม่ได้กำหนด ห้ามใช้ 1 คะแนนต่อข้อโดยอัตโนมัติจนทำให้ข้อเติม 1 คำกับการเรียง 10 ธาตุมีน้ำหนักไม่เหมาะสม

### แผนหน้าพิมพ์เบื้องต้น

- เป้าหมายฉบับนักเรียน 8–10 หน้า A4 ต่อภาษา รวม Sentence Bank 1 หน้า
- หน้า Sentence Bank ให้เป็นหน้าคู่สุดท้าย เพื่ออยู่ด้านหลังเมื่อพิมพ์สองหน้า พลิกขอบยาว
- เว้นพื้นที่ตอบตามงานจริง โดยเฉพาะลำดับ IE ทั้งคาบ รายการ EN และประโยคเหตุผล
- ภาษาอังกฤษอาจมีจำนวนหน้าต่างจากภาษาไทย ต้องแจ้งจำนวนหน้าจริงหลัง render
- ตัวอักษร Sentence Bank อ่านได้ชัด ใช้ทั้งหน้าที่เพิ่ม ไม่ย่อเล็กเพื่อทำให้เด็กอ่านพลาด
- ตัวเลขจำนวนหน้านี้เป็นเป้าหมายออกแบบ ยังไม่ใช่ผล QA ที่ยืนยันแล้ว
- ฉบับเฉลยต้องมีคำอธิบายครบทุกข้อ จำนวนหน้าตามการจัดจริง ไม่ยัดคำอธิบายจนอ่านยาก

## 4. ประเด็น EN 10 อันดับ: ข้อเสนอชุดข้อมูลที่ตรวจสอบได้

ต้องมีแหล่งอ้างอิงเดียวตลอดข้อ ไม่ผสมสเกล Pauling กับ Allen หรือเติมค่าจากอีกแหล่งเงียบ ๆ

แบบฉบับนี้เสนอใช้ค่า Pauling ที่ RSC ระบุเป็นตัวเลข รวม Xe; RSC ระบุค่า Kr ว่า Unknown จึงไม่นำ Kr มาจัดอันดับในชุด RSC นี้
นับเป็น 10 ธาตุที่มีค่าสูงสุดในชุดข้อมูลดังกล่าว ยอมรับ C กับ Se สลับตำแหน่งกันเพราะค่าเท่ากัน

| ลำดับรายการ | ธาตุ | EN (Pauling) |
|---:|---|---:|
| 1 | F | 3.98 |
| 2 | O | 3.44 |
| 3 | Cl | 3.16 |
| 4 | N | 3.04 |
| 5 | Br | 2.96 |
| 6 | I | 2.66 |
| 7 | Xe | 2.60 |
| 8 | S | 2.58 |
| 9 ร่วม | C | 2.55 |
| 9 ร่วม | Se | 2.55 |

อ้างอิงรายธาตุ:
[F](https://periodic-table.rsc.org/element/9/fluorine),
[O](https://periodic-table.rsc.org/element/8/oxygen),
[Cl](https://periodic-table.rsc.org/element/17/chlorine),
[N](https://periodic-table.rsc.org/element/7/nitrogen),
[Br](https://periodic-table.rsc.org/element/35/bromine),
[I](https://periodic-table.rsc.org/element/53/iodine),
[Xe](https://periodic-table.rsc.org/element/54/xenon),
[S](https://periodic-table.rsc.org/element/16/sulfur),
[C](https://periodic-table.rsc.org/element/6/carbon),
[Se](https://periodic-table.rsc.org/element/34/selenium),
[Kr: Unknown ใน RSC](https://periodic-table.rsc.org/element/36/krypton)

ข้อเสนอชุดข้อมูลนี้ต้องเห็นชัดในแบบที่ครูตรวจ ไม่กล่าวว่าเป็น 10 อันดับสากลที่ทุกตารางให้เหมือนกัน และไม่เปลี่ยนไปใช้ 10 ธาตุที่พบบ่อย
ตารางนี้เป็นข้อมูลเตรียมเรียน/เฉลย ห้ามวางให้เห็นข้างข้อ 20 จนการทดสอบความจำกลายเป็นคัดลอกตาราง

## 5. แบบคำถามครบชุด: ส่วน ก เติมความรู้ ข้อ 1–20

คำชี้แจง: เขียนคำตอบสั้น ๆ ลงในช่องที่จัดไว้ ไม่มี word bank สำหรับส่วนนี้ ส่วน Sentence Bank ท้ายใบใช้เฉพาะส่วน ค

| ข้อ | ข้อความคำถาม |
|---:|---|
| 1 | ตารางธาตุปัจจุบันจัดเรียงธาตุตามค่าของปริมาณใดจากน้อยไปมาก? |
| 2 | เมนเดเลเอฟใช้มวลอะตอมร่วมกับข้อมูลด้านใดในการจัดธาตุให้อยู่กลุ่มเดียวกัน? |
| 3 | นักวิทยาศาสตร์คนใดทำให้การจัดเรียงตามเลขอะตอมเป็นหลักชัดเจนขึ้น? |
| 4 | แถวแนวนอนในตารางธาตุเรียกว่าอะไร? |
| 5 | แนวตั้งในตารางธาตุเรียกว่าอะไร? |
| 6 | จงระบุหมายเลขหมู่ของธาตุหมู่หลักตามระบบหมู่ 1–18 ให้ครบ |
| 7 | หมู่ IIIA ในระบบเดิม ตรงกับหมู่ใดในระบบ 1–18? |
| 8 | ธาตุหมู่ 17 มีชื่อเรียกรวมว่าอะไร? |
| 9 | ธาตุหมู่ 1 เมื่อยกเว้น H และธาตุหมู่ 2 มีชื่อเรียกรวมว่าอะไรตามลำดับ? |
| 10 | อะตอมเป็นกลาง X ในสถานะพื้นมีการจัดเรียงอิเล็กตรอน [Ne]3s²3p⁵ จงระบุหมู่และคาบของ X |
| 11 | Ga ในสถานะพื้นมีการจัดเรียงอิเล็กตรอน [Ar]3d¹⁰4s²4p¹ มีเวเลนซ์อิเล็กตรอนกี่ตัว และอยู่หมู่ใด? |
| 12 | X²⁺ มี 18 อิเล็กตรอน เลขอะตอมของธาตุ X เท่ากับเท่าใด? |
| 13 | จงจำแนก Na, Si และ Cl ว่าเป็นโลหะ กึ่งโลหะ หรืออโลหะ |
| 14 | พลังงานสำหรับ X(g) → X⁺(g) + e⁻ เรียกว่าอะไร? ระบุลำดับด้วย |
| 15 | พลังงานสำหรับ X⁺(g) → X²⁺(g) + e⁻ ใช้สัญลักษณ์ใด? |
| 16 | สมบัติที่เกี่ยวข้องกับ X(g) + e⁻ → X⁻(g) เรียกว่าอะไร? |
| 17 | ความสามารถของอะตอมในการดึงอิเล็กตรอนที่ใช้ร่วมกันในพันธะเข้าหาตน เรียกว่าอะไร? |
| 18 | ค่า EN บนสเกล Pauling มีหน่วยหรือไม่? |
| 19 | ธาตุหมู่หลัก X มี IE กระโดดมากระหว่าง IE₂ กับ IE₃ จึงคาดว่ามีเวเลนซ์อิเล็กตรอนกี่ตัว? |
| 20 | เขียนสัญลักษณ์ของ 10 ธาตุที่มี EN สูงสุดจากมากไปน้อยตามข้อมูลสเกล Pauling ของ RSC ที่เรียน ระบุเครื่องหมายเท่ากับเมื่อค่าเสมอกัน ข้อนี้ทดสอบความจำ ไม่เปิดตารางอ้างอิง |

ข้อ 12 เป็นการนับอนุภาคพื้นฐาน ไม่ใช่ข้อคำนวณแสดงวิธีทำตามรูปแบบโจทย์ตัวเลขที่มีคำตอบท้ายข้อ

## 6. ส่วน ข เรียงลำดับและอ่านข้อมูล ข้อ 21–30

คำชี้แจง: เขียนคำตอบตามที่ถาม ไม่ต้องเขียนเหตุผล เว้นแต่คำถามระบุไว้ต่างหาก
การจัดอันดับใช้ >, < หรือ = ตามทิศที่โจทย์กำหนด ต้องระบุ “มากไปน้อย” หรือ “น้อยไปมาก” ให้เห็นชัด

| ข้อ | ข้อความคำถาม |
|---:|---|
| 21 | เรียง IE₁ ของ Li, Be, B, C, N, O, F และ Ne จากน้อยไปมาก ให้ครบทั้งคาบ 2 |
| 22 | เรียง IE₁ ของ Na, Mg, Al, Si, P, S, Cl และ Ar จากน้อยไปมาก ให้ครบทั้งคาบ 3 |
| 23 | ระหว่าง Cl กับ N ธาตุใดมี EN สูงกว่า เมื่อใช้ค่า Pauling ในชุดอ้างอิงนี้? |
| 24 | เรียง EN ของ F, O, N และ Cl จากมากไปน้อย |
| 25 | เรียงขนาดอะตอม Na, Mg และ Cl จากใหญ่ไปเล็ก โดยใช้แนวโน้มรัศมีชนิดเดียวกันในคาบ 3 |
| 26 | เปรียบเทียบขนาด Na กับ Na⁺ และ Cl กับ Cl⁻ โดยเติม > หรือ < แยกสองคู่ |
| 27 | เรียงรัศมีของ O²⁻, F⁻, Na⁺, Mg²⁺ และ Al³⁺ จากใหญ่ไปเล็ก กำหนดเลขอะตอม O = 8, F = 9, Na = 11, Mg = 12, Al = 13 |
| 28 | เมื่อ IE₂ ของ Na = 4562 และ Mg = 1451 kJ mol⁻¹ ธาตุใดต้องใช้พลังงานมากกว่าในการดึงอิเล็กตรอนตัวที่สอง? |
| 29 | จากตารางข้อมูลจำลองด้านล่าง ระบุหมู่ของธาตุหมู่หลัก A, B และ C |
| 30 | ใช้ตารางเดียวกัน เรียง A, B และ C ตาม IE₁ จากน้อยไปมาก แล้วเรียงตาม IE₂ จากน้อยไปมากอีกครั้ง |

ข้อมูลสำหรับข้อ 29–30 (ข้อมูลจำลองเพื่อฝึกอ่านจุดกระโดด ไม่อ้างเป็นค่าของธาตุจริง; หน่วย kJ mol⁻¹):

| ธาตุหมู่หลัก | IE₁ | IE₂ | IE₃ | IE₄ |
|---|---:|---:|---:|---:|
| A | 500 | 4600 | 6900 | 9500 |
| B | 740 | 1450 | 7700 | 10500 |
| C | 580 | 1820 | 2740 | 11600 |

ข้อมูล IE₂ ในข้อ 28 เป็นค่าปัดเศษสำหรับเปรียบเทียบ ไม่ใช้ต่างหลักทศนิยมเป็นกับดัก ไม่ให้คำนวณผลต่างพลังงานเพิ่มเติม

## 7. ส่วน ค เติมเหตุผล ข้อ 31–40

คำชี้แจง: เลือกประโยคที่ตรงจาก Sentence Bank ด้านหลัง แล้วเขียนข้อความเหตุผลลงในพื้นที่ตอบ
เลือกใช้ประโยคซ้ำได้เมื่อใช้ได้จริง ไม่ต้องคัดประโยคที่ไม่เกี่ยวข้อง และไม่ให้เขียนเพียงรหัสหรือลำดับ

| ข้อ | ข้อความคำถาม |
|---:|---|
| 31 | He มีเวเลนซ์อิเล็กตรอน 2 ตัว แต่จัดไว้ในหมู่ 18 เพราะเหตุใด? |
| 32 | Ca²⁺ มีการจัดเรียงอิเล็กตรอน 2,8,8 แต่ธาตุ Ca อยู่คาบ 4 เพราะเหตุใด? |
| 33 | อะตอม Cl เล็กกว่า Na ทั้งที่มีโปรตอนและอิเล็กตรอนมากกว่า เพราะเหตุใด? |
| 34 | อะตอม K ใหญ่กว่า Na เพราะเหตุใด? |
| 35 | Na⁺ เล็กกว่าอะตอม Na เพราะเหตุใด? |
| 36 | IE₁ ของ Al ต่ำกว่า Mg เพราะเหตุใด? |
| 37 | IE₁ ของ O ต่ำกว่า N เพราะเหตุใด? |
| 38 | เมื่อเปลี่ยนจาก Ne ไปเป็น Na ค่า IE₁ ลดลงมาก เพราะเหตุใด? |
| 39 | ค่า IE ต่อเนื่องเพิ่มขึ้นมากเป็นพิเศษเมื่อเริ่มดึงอิเล็กตรอนชั้นใน เพราะเหตุใด? |
| 40 | อะตอม Cl ในสถานะแก๊สรับอิเล็กตรอนแล้วคายพลังงานมากกว่าอะตอม F เพราะเหตุใด? |

ขอบเขตข้อ 40: เปรียบเทียบขนาดพลังงานที่คาย ไม่ใช้คำว่า “EA มากกว่า” โดยไม่บอกข้อตกลงเครื่องหมาย และไม่ให้เด็กคำนวณตัวเลข

## 8. ส่วน ง ถูก–ผิด ข้อ 41–60

คำชี้แจง: เขียน ✓ เมื่อข้อความถูก และ ✗ เมื่อข้อความผิด ไม่ต้องอธิบายเหตุผลหรือแก้ข้อความ

| ข้อ | ข้อความ |
|---:|---|
| 41 | ตารางธาตุปัจจุบันจัดเรียงตามมวลอะตอมจากน้อยไปมากเป็นหลัก |
| 42 | กฎชุดสามของเดอเบอไรเนอร์ใช้จัดธาตุทั้งหมดได้อย่างถูกต้อง |
| 43 | กฎของนิวแลนด์ที่กล่าวถึงสมบัติซ้ำทุกธาตุที่แปดใช้ได้กับธาตุทุกชนิดโดยไม่มีข้อจำกัด |
| 44 | เมนเดเลเอฟเว้นช่องว่างไว้สำหรับธาตุที่ยังไม่ค้นพบ และใช้ตำแหน่งช่วยทำนายสมบัติได้ |
| 45 | ธาตุหมู่เดียวกันต้องมีสถานะทางกายภาพและสมบัติทุกอย่างเหมือนกัน |
| 46 | H อยู่หมู่ 1 แต่ไม่จัดเป็นโลหะแอลคาไล |
| 47 | He อยู่หมู่ 18 แต่จัดอยู่ในบล็อก s ตามการจัดเรียงอิเล็กตรอน |
| 48 | Ga ที่มี [Ar]3d¹⁰4s²4p¹ มีเวเลนซ์อิเล็กตรอน 1 ตัว เพราะดูเฉพาะ 4p¹ |
| 49 | อะตอมที่มีจำนวนอิเล็กตรอนมากกว่า ต้องมีขนาดใหญ่กว่าเสมอ |
| 50 | ในชุดไอออนที่มีการจัดเรียงอิเล็กตรอนเหมือนกัน ตัวที่มีโปรตอนมากกว่ามีแนวโน้มรัศมีเล็กกว่า |
| 51 | เมื่อ Mg เปลี่ยนเป็น Mg²⁺ จำนวนโปรตอนจะลดลง 2 ตัว |
| 52 | การดึงอิเล็กตรอนออกตามนิยาม IE₁ ของอะตอมสถานะแก๊สต้องใช้พลังงาน |
| 53 | สำหรับธาตุที่มีอิเล็กตรอนอย่างน้อย 2 ตัว ค่า IE₂ สูงกว่า IE₁ ของธาตุเดียวกัน |
| 54 | IE₁ เพิ่มขึ้นจากซ้ายไปขวาในคาบทุกคู่ธาตุ โดยไม่มีข้อยกเว้น |
| 55 | IE₁ ของ Be สูงกว่า B |
| 56 | IE₁ ของ P สูงกว่า S |
| 57 | ค่า EN บนสเกล Pauling เป็นค่าที่ไม่มีหน่วย |
| 58 | เพราะ F มี EN สูงกว่า Cl จึงสรุปได้ว่า F ต้องรับอิเล็กตรอนแล้วคายพลังงานมากกว่า Cl |
| 59 | การรับอิเล็กตรอนตามกระบวนการ EA ของทุกธาตุต้องคายพลังงานเสมอ |
| 60 | การที่ตารางไม่ระบุค่า EN ของธาตุหนึ่ง ไม่ได้หมายความว่า EN ของธาตุนั้นเท่ากับศูนย์ |

แต่ละข้อความต้องเป็นข้อเดียวที่ตัดสินได้ชัด ชุดที่เสนอมีถูก 10 ข้อและผิด 10 ข้อ เป็นข้อมูลสำหรับครูและ AI ไม่ประกาศสัดส่วนนี้ในใบแจกนักเรียน

## 9. Sentence Bank ฉบับร่าง: เพิ่มเต็มหน้าด้านหลัง

ด้านล่างคือประโยคสำหรับหน้าของนักเรียน ไม่มีรหัส ไม่มีเลขข้อ และไม่ได้เรียงตามข้อคำถาม
เมื่อจัดหน้าจริง ใช้กรอบหรือระยะห่างแยกประโยคได้ แต่ห้ามเพิ่มสัญลักษณ์ที่เด็กใช้แทนคำตอบเป็นรหัส
คำชี้แจง: คลังนี้มีทั้งประโยคที่ใช้เป็นเหตุผลได้ ประโยคที่ไม่ตรงกับคำถาม และประโยคที่ไม่ถูกต้อง จงพิจารณาก่อนเลือกเขียน ประโยคหนึ่งอาจใช้ได้มากกว่าหนึ่งข้อ

มีเวเลนซ์อิเล็กตรอนอยู่ในชั้นหลักเดียวกัน แต่แรงดึงดูดจากนิวเคลียสยังผลมากกว่า

กำลังเปรียบเทียบการดึงอิเล็กตรอนที่ใช้ร่วมกันในพันธะ ไม่ใช่การรับอิเล็กตรอนของอะตอมอิสระ

เมื่ออะตอมเกิดเป็นไอออน หมู่และคาบของธาตุต้องเปลี่ยนตามการจัดเรียงอิเล็กตรอนของไอออน

ได้รับอิเล็กตรอนเพิ่มโดยจำนวนโปรตอนเท่าเดิม ทำให้แรงผลักระหว่างอิเล็กตรอนเพิ่มขึ้น

การจับคู่ในออร์บิทัลเดียวกันทำให้แรงผลักระหว่างอิเล็กตรอนลดลง จึงดึงอิเล็กตรอนออกได้ง่ายกว่า

ตำแหน่งของธาตุในตารางธาตุพิจารณาจากการจัดเรียงอิเล็กตรอนของอะตอมเป็นกลาง

อิเล็กตรอนที่ดึงออกเป็น 3p ซึ่งมีพลังงานสูงกว่าและดึงออกง่ายกว่า 3s ของอีกธาตุหนึ่ง

เมื่อดึงเวเลนซ์อิเล็กตรอนออกหมดแล้ว ต้องดึงอิเล็กตรอนชั้นในที่ถูกยึดไว้แน่นกว่า

ระดับพลังงานย่อย ns เต็มแล้ว อิเล็กตรอนที่รับเพิ่มต้องเข้า np ที่มีพลังงานสูงกว่า

อิเล็กตรอน 3p มีพลังงานต่ำกว่าอิเล็กตรอน 3s จึงถูกดึงออกได้ง่ายกว่า

ระดับพลังงานหลักชั้นนอกเต็มแล้ว จึงมีสมบัติใกล้เคียงกับแก๊สมีสกุล

อิเล็กตรอนที่ดึงออกเป็นตัวที่จับคู่ในออร์บิทัลเดียวกัน จึงมีแรงผลักระหว่างอิเล็กตรอนเพิ่มขึ้น

ออร์บิทัล 2p มีขนาดเล็กกว่า 3p จึงทำให้การรับอิเล็กตรอนคายพลังงานมากกว่าเสมอ

มีอิเล็กตรอนเท่ากัน แต่ตัวที่มีโปรตอนมากกว่าดึงอิเล็กตรอนได้แรงกว่า

มีเวเลนซ์อิเล็กตรอน 2 ตัว จึงต้องจัดอยู่ในหมู่ 2 โดยไม่มีข้อยกเว้น

สูญเสียอิเล็กตรอนชั้นนอกสุดจนระดับพลังงานหลักสูงสุดที่มีอิเล็กตรอนลดลง

อิเล็กตรอนที่รับเข้าไปใน 2p ซึ่งมีบริเวณเล็กได้รับแรงผลักมากกว่าการรับเข้าไปใน 3p

มีเวเลนซ์อิเล็กตรอนอยู่ในระดับพลังงานหลักที่สูงขึ้น และถูกอิเล็กตรอนชั้นในกำบังมากขึ้น

ในชั้นพลังงานหลักเดียวกัน จำนวนโปรตอนที่เพิ่มขึ้นทำให้แรงดึงดูดอิเล็กตรอนจากนิวเคลียสลดลง

อิเล็กตรอนใหม่เริ่มอยู่ในระดับพลังงานหลักชั้นถัดไป จึงอยู่ห่างนิวเคลียสมากขึ้น

### แนวทางตัวลวงสำหรับครูและ AI

จำนวนประโยคต้องไม่น้อยกว่า 2 เท่าของจำนวนข้อเติมเหตุผลที่ใช้คลังนั้น: M ≥ 2N
แบบนี้มี 20 ประโยคสำหรับ 10 ข้อ ประกอบด้วยประโยคคำตอบเป้าหมาย 10 ประโยค และตัวลวง 10 ประโยค ไม่แสดงสัดส่วนนี้ในหน้าของนักเรียน
ตัวลวง 4 ประโยคเป็นเหตุผลที่ใช้ได้ในบริบทอื่น อีก 6 ประโยคเป็นความเข้าใจคลาดเคลื่อนที่ใกล้เคียงกับเหตุผลเป้าหมาย จัดความยาวและรูปแบบใกล้เคียงกัน ไม่ให้เดาจากตำแหน่งหรือรูปลักษณ์
หากเพิ่มข้อเติมเหตุผลในอนาคต ต้องเพิ่มจำนวนประโยคจนยังคง M ≥ 2N และตรวจว่าครอบคลุมเหตุผลของทุกข้อก่อนส่งงาน
หน้าด้านหลังยังเป็น 1 หน้าเต็มต่อภาษา จัดได้เป็นสองคอลัมน์หากเหมาะสม โดยรักษาความชัดเจนของตัวอักษร
ตัวลวงต้องไม่ถูกพอ ๆ กับคำตอบที่ตั้งไว้ หากเหตุผลอีกประโยคอธิบายข้อนั้นได้จริง ต้องยอมรับหรือแก้คำถาม ไม่ตัดว่าผิดเพียงไม่ตรงประโยคเป้าหมาย
Sentence Bank ไม่ใช้บอกลำดับ EN ไม่ใส่คำตอบตัวเลข และไม่มีลำดับวิธีทำข้อคำนวณ
ส่วนถูก–ผิดไม่ให้ใช้ Sentence Bank เป็นภาระเขียนเพิ่ม

## 10. เฉลยสำหรับตรวจแบบก่อนสร้างใบจริง

### ส่วน ก

| ข้อ | คำตอบที่รับได้ |
|---:|---|
| 1 | เลขอะตอม หรือจำนวนโปรตอน |
| 2 | สมบัติของธาตุ/สมบัติทางเคมีและกายภาพที่คล้ายคลึงกัน |
| 3 | เฮนรี โมสลีย์ |
| 4 | คาบ |
| 5 | หมู่ |
| 6 | 1, 2, 13, 14, 15, 16, 17, 18 |
| 7 | 13 |
| 8 | แฮโลเจน |
| 9 | โลหะแอลคาไล; โลหะแอลคาไลน์เอิร์ท |
| 10 | หมู่ 17 หรือ VIIA; คาบ 3 |
| 11 | 3 ตัว; หมู่ 13 หรือ IIIA นับ 4s² และ 4p¹ รวมกัน |
| 12 | 20 |
| 13 | Na โลหะ; Si กึ่งโลหะ; Cl อโลหะ |
| 14 | พลังงานไอออไนเซชันลำดับที่ 1 หรือ IE₁ |
| 15 | IE₂ |
| 16 | สัมพรรคภาพอิเล็กตรอน หรือ EA |
| 17 | อิเล็กโทรเนกาติวิตี หรือ EN |
| 18 | ไม่มีหน่วย |
| 19 | 2 ตัว |
| 20 | F > O > Cl > N > Br > I > Xe > S > C = Se ตามชุด RSC ที่เสนอ |

### ส่วน ข

| ข้อ | คำตอบและจุดตรวจ |
|---:|---|
| 21 | Li < B < Be < C < O < N < F < Ne |
| 22 | Na < Al < Mg < Si < S < P < Cl < Ar |
| 23 | Cl; ค่าอ้างอิง Cl 3.16 และ N 3.04 ไม่ปัดเหลือ 3.0 จนลำดับหาย |
| 24 | F > O > Cl > N |
| 25 | Na > Mg > Cl |
| 26 | Na > Na⁺ และ Cl < Cl⁻ |
| 27 | O²⁻ > F⁻ > Na⁺ > Mg²⁺ > Al³⁺; ทุกตัวมี 10 อิเล็กตรอน |
| 28 | Na; การเปรียบเทียบนี้เป็น IE₂ ไม่ใช่ IE₁ |
| 29 | A หมู่ 1, B หมู่ 2, C หมู่ 13 |
| 30 | IE₁: A < C < B; IE₂: B < C < A ห้ามนำลำดับของสมบัติหนึ่งไปใช้แทนอีกสมบัติ |

### ส่วน ค: ครูตรวจข้อความ ไม่ตรวจรหัส

| ข้อ | ใจความเหตุผลที่ต้องได้ |
|---:|---|
| 31 | ชั้นแรกเต็มด้วย 1s² แล้ว จึงมีสมบัติแบบแก๊สมีสกุล แม้มีเวเลนซ์ 2 |
| 32 | ใช้อะตอม Ca เป็นกลางซึ่งชั้นนอกสุด n = 4 หาตำแหน่ง ไม่ใช้จำนวนชั้นของ Ca²⁺ |
| 33 | เวเลนซ์อยู่ n = 3 เหมือนกัน แต่ Cl มีแรงดึงนิวเคลียสยังผลสูงกว่า |
| 34 | K มีชั้นนอก n = 4 สูงกว่า Na ที่ n = 3 และมีการกำบังมากขึ้น |
| 35 | Na เสียอิเล็กตรอน 3s ชั้นนอกสุด เหลือชั้นสูงสุด n = 2 จึงเล็กลง |
| 36 | Al ดึงอิเล็กตรอน 3p¹ ที่มีพลังงานสูงกว่าออก ส่วน Mg ดึงจาก 3s² |
| 37 | O มี 2p⁴ และมีอิเล็กตรอนจับคู่ เกิดแรงผลัก จึงดึงตัวหนึ่งออกง่ายกว่า N ที่มี 2p³ |
| 38 | Na เริ่มมีอิเล็กตรอนในชั้น n = 3 ซึ่งห่างและถูกกำบังมากกว่าอิเล็กตรอนชั้นนอกของ Ne ที่ n = 2 |
| 39 | หลังเวเลนซ์หมด ต้องเริ่มดึงอิเล็กตรอนชั้นในที่ถูกยึดแน่นกว่า |
| 40 | F รับอิเล็กตรอนเข้า 2p ที่เล็กและมีแรงผลักมากกว่า ขณะที่ Cl รับเข้า 3p ที่มีบริเวณกว้างกว่า |

ยอมรับการคัดประโยคจาก Bank ที่ตรง การเชื่อมประโยคที่สมเหตุผล และการเขียนด้วยคำของเด็กที่ใจความถูก ไม่บังคับสะกดเหมือนเฉลยทุกคำ
ประโยคเรื่องชั้นพลังงานและการกำบังอาจใช้ได้ทั้งข้อ 34 และ 38 ห้ามบังคับใช้ได้เพียงข้อเดียวเพื่อทำให้ตัวลวงเพิ่มขึ้น

### ส่วน ง: ถูก–ผิดและเหตุผลในฉบับเฉลยเท่านั้น

| ข้อ | เฉลย | เหตุผลสั้น |
|---:|:---:|---|
| 41 | ✗ | ปัจจุบันใช้เลขอะตอมเป็นหลัก |
| 42 | ✗ | กฎชุดสามอธิบายได้เพียงบางกลุ่มธาตุ |
| 43 | ✗ | กฎของนิวแลนด์มีข้อจำกัด ไม่ใช้ได้กับธาตุทุกชนิด |
| 44 | ✓ | เป็นแนวคิดสำคัญของการจัดตารางและการทำนายธาตุที่ยังไม่พบ |
| 45 | ✗ | คล้ายกันทางเคมีไม่ได้หมายถึงสถานะและสมบัติทุกอย่างเหมือนกัน |
| 46 | ✓ | H เป็นอโลหะ แม้อยู่หมู่ 1 |
| 47 | ✓ | He มีการจัดเรียง 1s² จึงอยู่บล็อก s |
| 48 | ✗ | ต้องนับ 4s² + 4p¹ รวมเป็นเวเลนซ์ 3 |
| 49 | ✗ | ในคาบเดียวกันจำนวนอิเล็กตรอนเพิ่ม แต่รัศมีโดยทั่วไปลดลง |
| 50 | ✓ | เมื่อการจัดเรียงอิเล็กตรอนเหมือนกัน โปรตอนมากขึ้นดึงอิเล็กตรอนได้แรงกว่า |
| 51 | ✗ | เปลี่ยนจำนวนอิเล็กตรอน ไม่เปลี่ยนจำนวนโปรตอน |
| 52 | ✓ | IE เป็นพลังงานที่ใช้ดึงอิเล็กตรอนออก จึงเป็นกระบวนการดูดพลังงาน |
| 53 | ✓ | อิเล็กตรอนที่เหลือถูกไอออนบวกยึดไว้แน่นขึ้น |
| 54 | ✗ | มีจุดลดลง เช่น Be→B, N→O, Mg→Al และ P→S |
| 55 | ✓ | อิเล็กตรอน 2p¹ ของ B ดึงออกง่ายกว่า 2s² ของ Be |
| 56 | ✓ | S มี 3p⁴ ที่เกิดการจับคู่และแรงผลัก ต่างจาก P ที่มี 3p³ |
| 57 | ✓ | EN เป็นค่าความสามารถสัมพัทธ์บนสเกลที่ใช้ |
| 58 | ✗ | EN กับ EA เป็นคนละสมบัติ Cl รับอิเล็กตรอนแล้วคายพลังงานมากกว่า F |
| 59 | ✗ | การรับอิเล็กตรอนอาจดูดหรือคายพลังงาน ขึ้นกับธาตุ |
| 60 | ✓ | ไม่มีข้อมูลในตารางไม่เท่ากับมีค่าศูนย์ |

## 11. จุดตรวจตัวลวงและข้อควรระวังก่อนผลิต

- ข้อเติมคำ: แยกเลขอะตอม/มวลอะตอม หมู่/คาบ หมู่ 13/เวเลนซ์ 3 และ IE/EA/EN ให้ชัด
- ข้อ 20: อย่าใส่ตัวเลข EN ให้เด็กลอกข้างคำถามทดสอบความจำ
- ข้อ 21–22: ต้องเรียงตามค่า IE₁ ไม่ใช่เรียงตำแหน่งในตารางธาตุ
- ข้อ 23: ระบุสเกลและข้อมูลปัดเศษ ไม่ใช้การปัดเท่ากันเป็นกับดัก
- ข้อ 26–27: อย่าบอกว่าไอออนบวกทุกตัวเล็กกว่าไอออนลบทุกตัวต่างธาตุ ต้องพิจารณาชั้นและอิเล็กตรอน
- ข้อ 28–30: ระบุ IE ลำดับให้เด่นพออ่าน ไม่ซ่อนเลขลำดับด้วยตัวอักษรจิ๋ว
- ส่วน ค: มีประโยคคำตอบเป้าหมาย 10 ประโยคและตัวลวง 10 ประโยค รวม 20 ประโยคสำหรับ 10 ข้อ (ไม่น้อยกว่า 2 เท่า) แต่ยอมรับทุกประโยคที่ใช้อธิบายข้อนั้นได้จริง
- ส่วน ง: มีคำเหมารวม เช่น ทุก เสมอ และไม่มีข้อยกเว้น เพื่อวัดเงื่อนไข แต่ไม่ทำให้ทุกข้อที่มีคำเหล่านี้ผิดโดยอัตโนมัติ
- ตัวลวงอยู่ในสาระ ไม่ใช่รูปแบบตัวพิมพ์หรือภาษาอังกฤษยาก
- ตัวลวงและเฉลย TH/EN ต้องสมมูลกัน ห้ามแปลแล้วทำให้ค่าความจริงเปลี่ยน
- คำถามนี้ยังไม่ครอบคลุมเนื้อหาเคมีทุกบท ส่วนออกไซด์ ปฏิกิริยารายหมู่ จุดหลอมเหลว/เดือด และรีดอกซ์เป็นส่วนเชื่อม ไม่แทรกเป็นข้อหลักของแบบนี้โดยไม่ได้ตกลงเพิ่ม
- แบบนี้ไม่เพิ่มข้อคำนวณยาว เรื่องนี้ไม่ควรถูกทำให้กลายเป็นชุดฝึกแทนค่าสูตร

## 12. เมื่อครู CF แล้ว AI ต้องทำอะไรครั้งเดียวให้ครบ

1. ตรวจเนื้อหา 2.4 และไฟล์ต้นแบบปัจจุบันอีกครั้งก่อนแก้จริง ยึดรหัสหัวข้อที่มีอยู่จริง
2. สร้างใบใหม่ตามแบบที่ CF พร้อม TH/EN และเฉลยครบ 60 ข้อ ไม่เขียนทับใบเดิมโดยพลการ
3. จัด Sentence Bank เต็มหน้าด้านหลัง ไม่มีรหัส ไม่มีคำตอบคำนวณ และมีจำนวนประโยคไม่น้อยกว่า 2 เท่าของข้อเติมเหตุผลที่ใช้คลังนั้น งานนี้ 10 ข้อต้องมีอย่างน้อย 20 ประโยค รวมตัวลวง 10 ประโยค
4. ทดสอบระบบภาษา เปิด–ปิดเฉลย ไกด์ และพิมพ์ฉบับนักเรียน/เฉลยทั้งสองภาษา
5. ตรวจข้อถูก–ผิดว่าไม่มีช่องบังคับเขียนเหตุผล ตรวจข้อเติมเหตุผลว่าต้องเขียนข้อความ
6. หากมีข้อคำนวณที่ได้รับอนุมัติเพิ่มในอนาคต บรรทัดถัดจากโจทย์ต้องเป็น (คำตอบ: ตัวเลขพร้อมหน่วย) ซึ่งเห็นในฉบับนักเรียน ส่วนวิธีทำยังซ่อนในเฉลย
7. ตรวจการแบ่งหน้า โดยเฉพาะหน้า Bank ต้องเป็นหน้าคู่สำหรับพิมพ์สองหน้า ตัวอักษรไม่ล้น และพื้นที่ตอบไม่ถูกตัด
8. รายงานจำนวนหน้าจริงและผล QA ตามที่ทดสอบ ห้ามนำเป้าหมาย 8–10 หน้ามาอ้างว่าเป็นผลสำเร็จ
9. นำขึ้นปุ่ม/ทำ PR/เผยแพร่ตามขอบเขตที่ครูอนุมัติ ไม่ถือว่าการ CF เนื้อหาอย่างเดียวเป็นคำสั่งเปลี่ยน audience หรือเผยแพร่ทุกที่
10. ห้ามเพิ่มการขอ CF ซ้ำสำหรับงานย่อยตามแบบที่อนุมัติแล้ว เว้นแต่มีการเปลี่ยนเนื้อหาหรือขอบเขตสาระสำคัญ

## 13. สถานะและจุดที่ครูตรวจรอบนี้

- รูปแบบ 4 ส่วนและจำนวน 60 ข้อหลักเป็นข้อเสนอฉบับรวม
- คำถาม เฉลย และ Sentence Bank รวมไว้ครบเพื่อให้ตรวจครั้งเดียว
- ชุด EN ที่เสนอใช้ RSC รวม Xe และเสมอ C/Se ต้องอ่านเงื่อนไขชุดข้อมูลก่อน CF
- จำนวนหน้าเป็นประมาณการ ยังไม่มีไฟล์ใบจริงหรือผล render
- ยังไม่ได้เพิ่มปุ่มหรือแก้เว็บไซต์ในงานจัดทำเอกสารนี้
- การสร้างไฟล์กติกา/แบบออกแบบนี้ได้รับคำสั่งตรงจากครูแล้ว ส่วนผลิตใบจริงรอ CF ตามที่ครูขอ

## ภาคผนวก ก: แบบคำถามภาษาอังกฤษคู่ขนาน / Parallel English question draft

This is a reviewable question design, not the final student handout. The answer key in Section 10 applies to the corresponding question numbers. The final English teacher edition must also include the explanations in English.

### Part A: Short answers — Questions 1–20

Instructions: Write a brief answer in each space provided. The Sentence Bank is for Part C only.

| No. | Question |
|---:|---|
| 1 | Which quantity determines the order of elements in the modern periodic table? |
| 2 | In addition to atomic mass, what information did Mendeleev use to place elements in the same group? |
| 3 | Which scientist established atomic number as the basis for ordering the elements? |
| 4 | What is a horizontal row in the periodic table called? |
| 5 | What is a vertical column in the periodic table called? |
| 6 | List all the main-group numbers in the 1–18 numbering system. |
| 7 | Which group in the 1–18 system corresponds to Group IIIA in the older system? |
| 8 | What is the collective name for the Group 17 elements? |
| 9 | State the collective names for the Group 1 elements, excluding H, and the Group 2 elements, respectively. |
| 10 | A neutral atom X in its ground state has the electron configuration [Ne]3s²3p⁵. Identify its group and period. |
| 11 | Ga has the ground-state electron configuration [Ar]3d¹⁰4s²4p¹. How many valence electrons does it have, and which group is it in? |
| 12 | An X²⁺ ion has 18 electrons. What is the atomic number of element X? |
| 13 | Classify Na, Si and Cl as a metal, metalloid or nonmetal. |
| 14 | What is the name of the energy required for X(g) → X⁺(g) + e⁻? Specify its order. |
| 15 | Which symbol denotes the energy required for X⁺(g) → X²⁺(g) + e⁻? |
| 16 | Which property is associated with the process X(g) + e⁻ → X⁻(g)? |
| 17 | What is the tendency of an atom to attract shared electrons in a chemical bond called? |
| 18 | Does electronegativity on the Pauling scale have a unit? |
| 19 | A main-group element X shows a large increase from IE₂ to IE₃. How many valence electrons is it expected to have? |
| 20 | From memory, write the symbols of the ten elements with the highest electronegativities in decreasing order, using the RSC dataset for the Pauling scale studied in this course. Use an equals sign for equal values. Do not consult the reference table. |

### Part B: Ordering, comparison and data interpretation — Questions 21–30

Instructions: Give the requested order or brief answer. An explanation is not required for this part. Use >, < or = as appropriate.

| No. | Question |
|---:|---|
| 21 | Arrange Li, Be, B, C, N, O, F and Ne in order of increasing first ionization energy. Include all eight Period 2 elements. |
| 22 | Arrange Na, Mg, Al, Si, P, S, Cl and Ar in order of increasing first ionization energy. Include all eight Period 3 elements. |
| 23 | Which has the higher electronegativity, Cl or N, using the Pauling values in the reference dataset? |
| 24 | Arrange F, O, N and Cl in order of decreasing electronegativity. |
| 25 | Arrange Na, Mg and Cl in order of decreasing atomic size, using the trend for the same type of atomic radius across Period 3. |
| 26 | Compare the sizes of Na and Na⁺, then Cl and Cl⁻. Insert > or < for each pair. |
| 27 | Arrange O²⁻, F⁻, Na⁺, Mg²⁺ and Al³⁺ in order of decreasing ionic radius. The atomic numbers are O = 8, F = 9, Na = 11, Mg = 12 and Al = 13. |
| 28 | The second ionization energies of Na and Mg are 4562 and 1451 kJ mol⁻¹, respectively. Which element requires more energy for the removal of its second electron? |
| 29 | Use the simulated data below to identify the groups of main-group elements A, B and C. |
| 30 | Using the same data, arrange A, B and C in order of increasing IE₁, then arrange them in order of increasing IE₂. |

Simulated data for Questions 29–30. These values are provided for interpreting large increases in successive ionization energies; they are not claimed to be measurements for actual elements. Unit: kJ mol⁻¹.

| Main-group element | IE₁ | IE₂ | IE₃ | IE₄ |
|---|---:|---:|---:|---:|
| A | 500 | 4600 | 6900 | 9500 |
| B | 740 | 1450 | 7700 | 10500 |
| C | 580 | 1820 | 2740 | 11600 |

### Part C: Complete the explanation — Questions 31–40

Instructions: Select an appropriate sentence from the Sentence Bank on the reverse page and write the explanation in the answer space. A sentence may be used more than once when it applies. Write the words; do not substitute a code or a sentence number.

| No. | Question |
|---:|---|
| 31 | Explain why He is placed in Group 18 even though it has only two valence electrons. |
| 32 | A Ca²⁺ ion has the electron arrangement 2,8,8. Explain why element Ca is nevertheless in Period 4. |
| 33 | Explain why a Cl atom is smaller than a Na atom even though it has more protons and electrons. |
| 34 | Explain why a K atom is larger than a Na atom. |
| 35 | Explain why Na⁺ is smaller than a Na atom. |
| 36 | Explain why the first ionization energy of Al is lower than that of Mg. |
| 37 | Explain why the first ionization energy of O is lower than that of N. |
| 38 | Explain the large decrease in first ionization energy from Ne to Na. |
| 39 | Explain why a particularly large increase in successive ionization energies occurs when removal of core electrons begins. |
| 40 | Explain why the addition of an electron to a gaseous Cl atom releases more energy than the addition of an electron to a gaseous F atom. |

### Part D: True–false — Questions 41–60

Instructions: Write ✓ for a true statement and ✗ for a false statement. Do not give an explanation or rewrite the statement.

| No. | Statement |
|---:|---|
| 41 | Elements in the modern periodic table are ordered primarily by increasing atomic mass. |
| 42 | Döbereiner's law of triads can correctly classify all elements. |
| 43 | Newlands' law, which describes similar properties recurring at every eighth element, applies to all elements without limitation. |
| 44 | Mendeleev left gaps for undiscovered elements and used their positions to predict their properties. |
| 45 | Elements in the same group must have the same physical state and identical properties in every respect. |
| 46 | H is in Group 1 but is not classified as an alkali metal. |
| 47 | He is in Group 18 but belongs to the s block based on its electron configuration. |
| 48 | Ga, with the electron configuration [Ar]3d¹⁰4s²4p¹, has one valence electron because only 4p¹ is counted. |
| 49 | An atom with more electrons must always be larger than an atom with fewer electrons. |
| 50 | In a series of ions with the same electron configuration, an ion with more protons tends to have a smaller radius. |
| 51 | When Mg forms Mg²⁺, its number of protons decreases by two. |
| 52 | Removing an electron from a gaseous atom according to the definition of first ionization energy requires an input of energy. |
| 53 | For an element with at least two electrons, IE₂ is higher than IE₁ for that same element. |
| 54 | First ionization energy increases between every adjacent pair of elements from left to right across a period, without exception. |
| 55 | The first ionization energy of Be is higher than that of B. |
| 56 | The first ionization energy of P is higher than that of S. |
| 57 | Electronegativity on the Pauling scale has no unit. |
| 58 | Because F has a higher electronegativity than Cl, adding an electron to F must release more energy than adding an electron to Cl. |
| 59 | Electron addition in the electron-affinity process must release energy for every element. |
| 60 | The absence of an electronegativity value in a table does not mean that the element has an electronegativity of zero. |

## ภาคผนวก ข: Sentence Bank ภาษาอังกฤษ / English Sentence Bank

Use a full separate reverse page in the final English student edition. Do not add codes, item numbers or letter labels to the sentences.

Instructions: This bank includes suitable explanations, statements that do not apply to the questions, and incorrect statements. Consider each statement before selecting and writing an explanation. A sentence may be used more than once.

The valence electrons occupy the same principal shell, but they experience a greater effective nuclear charge.

The comparison concerns attraction for shared electrons in a bond rather than electron addition to an isolated atom.

When an atom forms an ion, the element's group and period must change to match the ion's electron configuration.

Electrons are added while the number of protons remains unchanged, increasing electron–electron repulsion.

Pairing electrons in the same orbital reduces electron–electron repulsion, making an electron easier to remove.

An element's position in the periodic table is determined using the electron configuration of its neutral atom.

The electron removed occupies a higher-energy 3p subshell and is easier to remove than a 3s electron in the other element.

Once all valence electrons have been removed, the next electron must be removed from a more tightly bound core shell.

The ns subshell is full, so an additional electron must enter the higher-energy np subshell.

A 3p electron has lower energy than a 3s electron and is therefore easier to remove.

Its outermost occupied principal shell is complete, so its chemical behavior resembles that of the noble gases.

The electron removed is paired with another electron in the same orbital and therefore experiences additional electron–electron repulsion.

A 2p orbital is smaller than a 3p orbital, so electron addition must always release more energy.

The species have the same number of electrons, but the one with more protons attracts those electrons more strongly.

It has two valence electrons and must therefore belong to Group 2 without exception.

The outermost electron is removed, leaving a lower highest occupied principal shell.

An electron added to the compact 2p subshell experiences greater repulsion than one added to the more spacious 3p subshell.

Its valence electrons occupy a higher principal shell and experience greater shielding by inner electrons.

Within the same principal shell, an increase in the number of protons reduces the attraction between the nucleus and the electrons.

The additional electron begins to occupy the next principal shell, farther from the nucleus.

หมายเหตุบรรณาธิการ: ข้อความ “additional electron” ในเหตุผลเปรียบเทียบ Ne กับ Na หมายถึงการเพิ่มอิเล็กตรอนเมื่อพิจารณาธาตุลำดับถัดไปพร้อมเลขอะตอมที่เพิ่มขึ้น ไม่ได้หมายถึงกระบวนการเปลี่ยน Ne เป็นไอออน Na ต้องรักษาบริบทนี้ในเฉลยสองภาษา




## บันทึกปรับกติกา: อัตราส่วน Sentence Bank

คำสั่งล่าสุดของครู: จำนวนประโยคใน Sentence Bank ต้องไม่น้อยกว่า 2 เท่าของข้อเติมเหตุผล เพื่อให้มีตัวลวงเพียงพอและลดการเลือกจากบริบทอย่างเดียว
ฉบับปรับนี้คงคำถามเดิม 60 ข้อ เพิ่มเฉพาะ Sentence Bank จาก 14 เป็น 20 ประโยคต่อภาษา และแก้กติกาทั้งเอกสารให้ตรงกัน

### ตรวจตัวลวงที่เพิ่ม 6 ประโยค — สำหรับครูและ AI เท่านั้น

| ข้อความคลาดเคลื่อน | จุดที่ต้องอธิบายในเฉลย |
|---|---|
| เวเลนซ์ 2 จึงต้องอยู่หมู่ 2 โดยไม่มีข้อยกเว้น | He มี 1s² และอยู่หมู่ 18 ต้องพิจารณาการเต็มชั้นและสมบัติด้วย |
| หมู่และคาบเปลี่ยนตามไอออน | การเกิดไอออนไม่เปลี่ยนเลขอะตอมหรือตำแหน่งธาตุในตาราง |
| ในชั้นเดียวกัน โปรตอนมากขึ้นทำให้แรงดึงลดลง | สำหรับการเปรียบเทียบตามคาบในแบบนี้ แรงดึงนิวเคลียสยังผลโดยทั่วไปเพิ่มขึ้น |
| 3p มีพลังงานต่ำกว่า 3s จึงดึงออกง่ายกว่า | ในบริบท Mg/Al อิเล็กตรอน 3p ของ Al มีพลังงานสูงกว่าและดึงออกง่ายกว่า |
| จับคู่แล้วแรงผลักลดลงจึงดึงออกง่ายกว่า | การจับคู่ในออร์บิทัลเดียวกันเพิ่มแรงผลักระหว่างอิเล็กตรอนในบริบท N/O |
| 2p เล็กกว่าจึงคายพลังงานมากกว่าเสมอ | ต้องพิจารณาแรงผลักด้วย Cl รับอิเล็กตรอนแล้วคายพลังงานมากกว่า F |

### Mandatory ratio check for AI

Let N be the number of explanation questions that use this Sentence Bank and M be the number of distinct sentences in that bank. Require M ≥ 2N in each language. For this design, N = 10 and M = 20. Retain the same meaning and shuffled order in Thai and English. The current bank contains ten intended answer sentences and ten distractors. Do not reveal that split to students. If a distractor genuinely explains a question, accept it or revise the item; never reject a valid explanation solely because it differs from the intended sentence.
