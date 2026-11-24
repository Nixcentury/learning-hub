import {figure} from './lessons.mjs';
const raw = String.raw;

const exams = [
  {
    id: 'common-2564-11',
    title: ['วิชาสามัญ 2564 · ฟิสิกส์ (49) · ข้อ 11', 'Common Subjects 2564 · Physics (49) · Question 11'],
    source: 'https://drive.google.com/file/d/1hMzx_QHKrRYQgWzjOpxPzKqkK2424d4c/view#page=12',
    thai: ['ฉายแสงความยาวคลื่น 600 นาโนเมตร ให้ตกกระทบตั้งฉากกับสลิตคู่ซึ่งมีระยะห่างระหว่างช่อง 0.050 มิลลิเมตร แล้วสังเกตลวดลายของการแทรกสอดบนฉาก จากนั้นฉายแสงเดิมแต่เปลี่ยนจากสลิตคู่เป็นสลิตเดี่ยว พบว่า <u>แถบมืดแถบแรก</u> ที่เกิดจากทั้งสลิตคู่และสลิตเดี่ยวปรากฏที่ตำแหน่งห่างจากแถบสว่างกลางเป็นระยะเท่ากัน', 'ความกว้างของช่องสลิตเดี่ยวมีค่ากี่เมตร'],
    english: ['Light of wavelength 600 nanometres is incident normally on a double slit whose slit separation is 0.050 millimetres. The interference pattern is observed on a screen. The same light is then used with a single slit in place of the double slit. The <u>first dark fringe</u> in both patterns occurs at the same distance from the central bright fringe.', 'What is the width of the single slit, in metres?'],
    options: [raw`\(1.0\times10^{-4}\)`, raw`\(5.0\times10^{-5}\)`, raw`\(2.5\times10^{-5}\)`, raw`\(1.4\times10^{-8}\)`, raw`\(7.2\times10^{-9}\)`],
    answers: [
      raw`ใช้ (3), (4) และ (16) ฉากเดิมและระยะจากกลางเท่ากันให้มุมเท่ากัน สำหรับสลิตคู่ มืดแรกให้ \(d\sin\theta=\lambda/2\) สำหรับสลิตเดี่ยว มืดแรกให้ \(a\sin\theta=\lambda\) หารสมการได้ \(a=2d=2(0.050\ \mathrm{mm})=1.0\times10^{-4}\ \mathrm{m}\) ตอบตัวเลือก 1`,
      raw`Use (3), (4) and (16). The same displacement on the same screen gives the same angle. The double-slit minimum satisfies \(d\sin\theta=\lambda/2\); the single-slit minimum satisfies \(a\sin\theta=\lambda\). Dividing gives \(a=2d=2(0.050\ \mathrm{mm})=1.0\times10^{-4}\ \mathrm{m}\). Option 1.`,
    ],
  },
  {
    id: 'alevel-2568-8',
    title: ['A-Level 2568 · ฟิสิกส์ (64) · ชุด 1 ข้อ 8', 'A-Level 2568 · Physics (64) · Set 1 Question 8'],
    source: 'https://assets.mytcas.com/68/answer/tcas68-phy-a-level.pdf#page=7',
    key: 'https://assets.mytcas.com/68/alevel/alevel-answers.pdf#page=4',
    thai: ['ฉายแสงความยาวคลื่น 720 นาโนเมตร ลงบนเกรตติงที่มี 2500 ช่องต่อเซนติเมตร', 'คำถาม จะเกิดแถบสว่างบนฉากรับทั้งหมดกี่แถบ'],
    english: ['Light of wavelength 720 nanometres is incident on a grating with 2500 slits per centimetre.', 'Question: How many bright fringes appear in total on the screen?'],
    options: ['5', '7', '9', '10', '11'],
    answers: [
      raw`จาก (18) \(d=(1\ \mathrm{cm})/2500=4.0\ \mathrm{\mu m}\) จาก (19)–(20) \(m<4.0/0.720\approx5.56\) จึงมีอันดับสูงสุด 5 นับซ้าย 5 กลาง 1 ขวา 5 ได้ 11 แถบ ตอบตัวเลือก 5 ตรงเฉลย ทปอ.`,
      raw`By (18), \(d=(1\ \mathrm{cm})/2500=4.0\ \mathrm{\mu m}\). Equations (19)–(20) give \(m<4.0/0.720\approx5.56\), so the highest order is 5. Five on the left, one in the centre and five on the right give 11 fringes. Official answer: option 5.`,
    ],
  },
  {
    id: 'alevel-2569-27',
    title: ['A-Level 2569 · ฟิสิกส์ (64) · ชุด 1 ข้อ 27', 'A-Level 2569 · Physics (64) · Set 1 Question 27'],
    source: 'https://assets.mytcas.com/69/answer/tcas69-phy-a-level.pdf#page=25',
    key: 'https://assets.mytcas.com/69/answer/tcas69-phy-a-level.pdf#page=29',
    thai: ['นักเรียนฉายแสงสีแดงความยาวคลื่น 600 นาโนเมตร ผ่านเกรตติงที่มีจำนวนช่อง 1,000 ช่องต่อเซนติเมตร พบว่าเส้นสว่างกลาง เส้นสว่างลำดับที่ 1 และ 2 เกิดขึ้นบนฉากที่อยู่ห่างออกไป 1.00 เมตร ตามตำแหน่งดังรูป เมื่อพิจารณาว่าฉากอยู่ไกลมากเมื่อเทียบกับระยะห่างระหว่างช่องของเกรตติง จงหาระยะ <i>x</i> ในหน่วยเซนติเมตร'],
    english: ['A student shines red light of wavelength 600 nanometres through a grating with 1,000 slits per centimetre. The central bright line and the first- and second-order bright lines appear on a screen 1.00 metres away at the positions shown. Treat the screen as very distant compared with the slit separation. Find the distance <i>x</i> in centimetres.'],
    image: ['tcas69-q27', 'รูปต้นฉบับ ทปอ. ข้อ 27', 'Original diagram, TCAS Question 27. Labels: grating, screen and red light.'],
    answers: [
      raw`ใช้ (18) ได้ \(d=(1\ \mathrm{cm})/1000=1.00\times10^{-5}\ \mathrm m\) จาก (19) ที่ \(m=2\) ได้ \(\sin\theta_2=2(600\times10^{-9})/(1.00\times10^{-5})=0.120\) หรือ \(\theta_2\approx6.89^\circ\) จาก (5) เมื่อประมาณมุมเล็ก ระยะข้างเดียวคือ \(L\sin\theta_2=12.0\ \mathrm{cm}\) ลูกศรคร่อมอันดับ 2 ทั้งสองฝั่ง จึงได้ \(x=24.00\ \mathrm{cm}\) ตามเฉลย ทปอ. หากใช้ \(\tan\theta_2\) โดยตรงจะได้ประมาณ 24.17 cm`,
      raw`Equation (18) gives \(d=(1\ \mathrm{cm})/1000=1.00\times10^{-5}\ \mathrm m\). By (19) with \(m=2\), \(\sin\theta_2=2(600\times10^{-9})/(1.00\times10^{-5})=0.120\) or \(\theta_2\approx6.89^\circ\). In the small-angle form of (5), the one-sided distance is \(L\sin\theta_2=12.0\ \mathrm{cm}\). The arrow joins the two second-order maxima, giving the official answer \(x=24.00\ \mathrm{cm}\). Using \(\tan\theta_2\) directly gives about 24.17 cm.`,
    ],
  },
  {
    id: 'common-2556-14',
    title: ['วิชาสามัญ 2556 · ฟิสิกส์ (49) · ข้อ 14', 'Common Subjects 2556 · Physics (49) · Question 14'],
    source: 'https://drive.google.com/file/d/1CTBI-c3OUDRF4zTZP7dkjVQuW7u9p-Ch/view#page=11',
    thai: ['เกรตติงอันหนึ่งมีจำนวนสลิต 25,000 ช่อง ต่อระยะทาง 2.5 เซนติเมตร ถ้าฉายลำเล็กๆ ของแสงเลเซอร์ความยาวคลื่น 600 นาโนเมตร ทะลุตั้งฉากเกรตติงไปตกบนฉาก จะเห็นจุดสว่างรวมทั้งหมดกี่จุด'],
    english: ['A grating contains 25,000 slits over a distance of 2.5 centimetres. A narrow laser beam of wavelength 600 nanometres is directed normally through the grating onto a screen. How many bright spots are seen altogether?'],
    options: [['1 จุด','1 spot'], ['2 จุด','2 spots'], ['3 จุด','3 spots'], ['4 จุด','4 spots'], ['5 จุด','5 spots']],
    answers: [
      raw`จาก (18) \(d=(2.5\ \mathrm{cm})/25000=1.0\ \mathrm{\mu m}\) และจาก (19)–(20) \(m<1.0/0.600\approx1.67\) จึงมีอันดับ 1 ทั้งสองด้านและอันดับศูนย์ตรงกลาง รวม 3 จุด ตอบตัวเลือก 3`,
      raw`Equation (18) gives \(d=(2.5\ \mathrm{cm})/25000=1.0\ \mathrm{\mu m}\). By (19)–(20), \(m<1.0/0.600\approx1.67\). The first order on both sides and the centre give three spots. Option 3.`,
    ],
  },
  {
    id: 'alevel-2567-11',
    title: ['A-Level 2567 · ฟิสิกส์ · ข้อ 11 (ฉบับรวบรวมใน Drive)', 'A-Level 2567 · Physics · Question 11 (Drive compilation)'],
    source: 'https://drive.google.com/file/d/15--h0epmi6Xpz-OndCPlf6sTXAIBjH5e/view',
    thai: ['เกรตติงอันหนึ่งมีจำนวนสลิต 4,000 ช่องเซนติเมตร ถ้าฉายลำเล็กๆ ของแสงเลเซอร์ความยาวคลื่น 550 นาโนเมตร ทะลุตั้งฉากเกรตติงไปตกบนฉาก จงหาลำดับการเลี้ยวเบนที่มากที่สุด ของแถบสว่างบนฉาก (A-Level#67)'],
    english: ['A grating has 4,000 slits per centimetre. A narrow laser beam with wavelength 550 nanometres is incident normally on the grating and reaches a screen. Find the highest diffraction order of the bright fringes on the screen. (A-Level#67)'],
    options: [[2],[3],[4],[5],[6]].map(([n])=>[`ลำดับที่ ${n}`, `Order ${n}`]),
    answers: [
      raw`จาก (18) \(d=(1\ \mathrm{cm})/4000=2.50\ \mathrm{\mu m}\) และจาก (20) \(m<2.50/0.550\approx4.55\) อันดับสูงสุดบนฉากคือ 4 อันดับ 5 ต้องใช้ \(\sin\theta>1\) ตอบตัวเลือก 3`,
      raw`By (18), \(d=(1\ \mathrm{cm})/4000=2.50\ \mathrm{\mu m}\). From (20), \(m<2.50/0.550\approx4.55\), so the highest order is 4. Order 5 would require \(\sin\theta>1\). Option 3.`,
    ],
  },
  {
    id: 'common-2565-13-archive',
    title: ['วิชาสามัญ 2565 · ข้อ 13 (ฉบับพิมพ์ Mathbynutty)', 'Common Subjects 2565 · Question 13 (Mathbynutty edition)'],
    source: 'https://upload.syntax-online.com/handout_TGAT/Physics2565.pdf#page=14',
    thai: ['ฉายเคลื่อนแม่เหล็กไฟฟ้าความยาวคลื่น 650 นาโนเมตร ตกกระทบตั้งฉากกับเกรตติง พบว่าเกิดแถบสว่างกลางและแถบสว่างอันดับที่ 1 บนฉากซึ่งวางอยู่ห่างจากเกรตติง 1 เมตร ดังรูป', 'พิจารณาข้อความต่อไปนี้', 'ก. ระยะห่างระหว่างช่องของเกรตติงมีค่าเท่ากับ 5 ไมโครเมตร', 'ข. ถ้าฉายคลื่นแม่เหล็กไฟฟ้าที่มีความยาวคลื่นน้อยกว่า 650 นาโนเมตร ระยะห่างระหว่างแถบสว่างจะมีค่าเพิ่มขึ้น', 'ค. ถ้าเปลี่ยนเกรตติง แล้วพบว่าระยะห่างระหว่างแถบสว่างมีค่าน้อยลง แสดงว่าระยะห่างระหว่างช่องของเกรตติงมีค่าเพิ่มขึ้น'],
    english: ['An electromagnetic wave of wavelength 650 nanometres is incident normally on a grating. The central bright fringe and first-order fringes appear on a screen 1 metre from the grating, as shown.', 'Consider the following statements.', 'A. The slit separation of the grating is 5 micrometres.', 'B. If the incident wavelength is less than 650 nanometres, the separation of the bright fringes increases.', 'C. If replacing the grating reduces the separation of the bright fringes, the slit separation has increased.'],
    options: [
      ['ข้อ ก. กล่าวถูกต้องเท่านั้น', 'Only A is correct'],
      ['ข้อ ข. กล่าวถูกต้องเท่านั้น', 'Only B is correct'],
      ['ข้อ ค. กล่าวถูกต้องเท่านั้น', 'Only C is correct'],
      ['ข้อ ก. และ ค. กล่าวถูกต้องเท่านั้น', 'Only A and C are correct'],
      ['ข้อ ข. และ ค. กล่าวถูกต้องเท่านั้น', 'Only B and C are correct'],
    ],
    image: ['mathbynutty65-q13', 'รูปจากฉบับ Mathbynutty ข้อ 13', 'Diagram from Mathbynutty Question 13. Scale readings are 37, 50 and 63 cm.'],
    answers: [
      raw`ใช้ (14) จากแนวกลาง 50 cm ถึงอันดับแรก 63 cm ได้ \(x_1=13\ \mathrm{cm}\) ใช้ (5) ได้ \(\sin\theta=0.13/\sqrt{1^2+0.13^2}\approx0.1289\) ใช้ (19) ได้ \(d\approx5.04\ \mathrm{\mu m}\) หรือประมาณ 5 µm ตามความละเอียดของข้อมูล ก. จึงถูก ข. ผิดเพราะลดความยาวคลื่นทำให้มุมลดลง ค. ถูกเพราะที่ความยาวคลื่นเดิม มุมที่เล็กลงต้องใช้ระยะช่องมากขึ้น ตอบตัวเลือก 4`,
      raw`Equation (14) gives \(x_1=63-50=13\ \mathrm{cm}\). Using (5), \(\sin\theta=0.13/\sqrt{1^2+0.13^2}\approx0.1289\), so (19) gives \(d\approx5.04\ \mathrm{\mu m}\), about 5 µm at the precision of the data. A is true. B is false because reducing the wavelength reduces the angle. C is true because a smaller angle at the same wavelength requires a larger separation. Option 4.`,
    ],
  },
];

export function examPages(lang, filled) {
  const l = lang === 'th' ? 0 : 1;
  return exams.map(e => [e.id, e.title[l],
    (l ? e.english : e.thai).map(line => `<p class="exam-prompt">${line}</p>`).join('') +
    (e.image ? figure(e.image[0],e.image[l+1], 'exam-source-figure') : '') +
    (e.options ? `<ol class="chapter-options">${e.options.map(o => `<li>${Array.isArray(o)?o[l]:o}</li>`).join('')}</ol>` : '') +
    `<p class="exam-source"><a href="${e.source}" target="_blank" rel="noopener noreferrer">${l?'Source edition':'ฉบับอ้างอิง'}</a>${filled&&e.key?` · <a href="${e.key}" target="_blank" rel="noopener noreferrer">${l?'Official answer':'เฉลยทางการ'}</a>`:''}</p>` +
    (filled ? `<div class="chapter-solution"><p>${e.answers[l]}</p></div>` : '<div class="chapter-work"></div>')]);
}
