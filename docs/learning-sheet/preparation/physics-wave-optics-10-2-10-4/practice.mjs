const raw = String.raw;
import {figure} from './lessons.mjs';

const problems = [
  {
    id: 'five-fringes',
    title: ['สลิตคู่ · นับช่วงจากไม้บรรทัด', 'Double slit · Count ruler intervals'],
    prompt: ['ภาพบันทึกจากซิมมีแถบสว่างเรียงติดกัน 5 แถบ กึ่งกลางแถบแรกตรง 1.2 cm และกึ่งกลางแถบสุดท้ายตรง 3.2 cm ให้ร่างขีดแสดงกึ่งกลางทั้งห้า ระยะห่างเฉลี่ยของแถบติดกันเท่าไร?', 'A simulation screenshot shows five consecutive bright fringes. The first centre is at 1.2 cm and the last at 3.2 cm. Draw a tick for each centre and find the mean spacing.'],
    answer: ['0.50 cm'],
    working: [raw`ใช้ (14) วัดจากกึ่งกลางแถบแรกถึงกึ่งกลางแถบที่ห้าได้ \(3.2-1.2=2.0\ \mathrm{cm}\) ระหว่างห้าจุดมีสี่ช่วง ใช้ (13) ได้ \(\Delta x=2.0\ \mathrm{cm}/4=0.50\ \mathrm{cm}\)`, raw`From (14), the span of the five centres is \(3.2-1.2=2.0\ \mathrm{cm}\). Five marks delimit four intervals, so (13) gives \(\Delta x=2.0\ \mathrm{cm}/4=0.50\ \mathrm{cm}\).`],
  },
  {
    id: 'single-data',
    title: ['สลิตเดี่ยว · อธิบายหลักฐานและทำนาย', 'Single slit · Interpret evidence and predict'],
    prompt: ['ดูภาพ สสวท. จากการทดลองใช้ช่องกว้าง 50, 100 และ 200 µm ประกอบคำตอบ เมื่อใช้เลเซอร์และระยะฉากเดิม รุ่นช่อง 100 µm ให้แถบสว่างกลางกว้าง 10.0 mm รุ่นช่อง 50 µm ควรกว้างประมาณเท่าไรในกรณีมุมเล็ก? บอกหลักฐานจากภาพและสมการที่ใช้', 'Use the IPST photograph of the 50, 100 and 200 µm slits. With the same laser and screen distance, the 100 µm slit gives a 10.0 mm central width. Predict the width for the 50 µm slit in the small-angle regime. Refer to both the image and an equation.'],
    figure: ['ipst-10-7-patterns', 'สสวท. รูป 10.7 ลายเลี้ยวเบนของสลิตเดี่ยว', 'IPST Figure 10.7. Single-slit diffraction patterns.'],
    answer: ['ประมาณ 20.0 mm', 'about 20.0 mm'],
    working: [raw`ในภาพรุ่นช่อง 50 µm มีแถบกลางแผ่กว้างกว่ารุ่น 100 µm จาก (17) ที่ \(\lambda,L\) คงที่ จะได้ \(W_{0,50}/W_{0,100}\approx100/50=2\) จึงได้ \(W_{0,50}\approx20.0\ \mathrm{mm}\) ค่าตัวเลขมาจากข้อมูลในโจทย์ ส่วนภาพใช้ตรวจแนวโน้ม`, raw`The 50 µm pattern has a wider centre in the image. By (17) at fixed \(\lambda,L\), \(W_{0,50}/W_{0,100}\approx100/50=2\), so \(W_{0,50}\approx20.0\ \mathrm{mm}\). The numerical width comes from the given measurement; the image supports the trend.`],
  },
  {
    id: 'single-width',
    title: ['สลิตเดี่ยว · แยกระยะบนฉากกับมุม', 'Single slit · Separate screen width and angular width'],
    prompt: ['เลเซอร์ 500 nm ผ่านช่องกว้าง 125 µm ฉากห่าง 1.00 m จงหามุมมืดอันดับ 1 ความกว้างเชิงมุม และระยะระหว่างมืดอันดับ 1 สองด้านบนฉาก', 'A 500 nm laser passes through a 125 µm slit and the screen is 1.00 m away. Find the first dark angle, central angular width and separation of the two first minima on the screen.'],
    answer: ['0.229° · 0.458° · 8.00 mm'],
    working: [raw`จาก (16) \(\sin\theta_1=(500\times10^{-9})/(125\times10^{-6})=0.00400\) จึงได้ \(\theta_1=0.229^\circ\) จาก (17) ความกว้างเชิงมุม \(2\theta_1=0.458^\circ\) และความกว้างบนฉาก \(2(1.00\ \mathrm m)\tan\theta_1\approx8.00\ \mathrm{mm}\)`, raw`Equation (16) gives \(\sin\theta_1=(500\times10^{-9})/(125\times10^{-6})=0.00400\), so \(\theta_1=0.229^\circ\). By (17), the angular width is \(2\theta_1=0.458^\circ\) and the screen width is \(2(1.00\ \mathrm m)\tan\theta_1\approx8.00\ \mathrm{mm}\).`],
  },
  {
    id: 'match-minima',
    title: ['สลิตคู่–สลิตเดี่ยว · มืดที่ตำแหน่งเดียวกัน', 'Double and single slit · Coincident minima'],
    prompt: ['ใช้เลเซอร์และฉากเดิม สลิตคู่ห่างกัน 180 µm ให้มืดอันดับ 2 ณ ตำแหน่งเดียวกับมืดอันดับ 1 ของสลิตเดี่ยว ช่องเดี่ยวกว้างเท่าไร? ระบุเงื่อนไขของแต่ละระบบ', 'With the same laser and screen, a double slit of separation 180 µm has its second minimum at the same position as the first minimum of a single slit. Find the single-slit width and state both conditions.'],
    answer: ['120 µm'],
    working: [raw`ตำแหน่งเดียวกันและ \(L\) เดิมให้มุมเดียวกัน จาก (3) และ (4) สำหรับสลิตคู่ \(d\sin\theta=(2-\tfrac12)\lambda\) จาก (16) สำหรับสลิตเดี่ยว \(a\sin\theta=\lambda\) หารสมการจึงได้ \(a=180\ \mathrm{\mu m}/1.5=120\ \mathrm{\mu m}\)`, raw`The same position at the same \(L\) gives the same angle. By (3) and (4), the double slit gives \(d\sin\theta=(2-\tfrac12)\lambda\). By (16), the single slit gives \(a\sin\theta=\lambda\). Dividing the equations gives \(a=180\ \mathrm{\mu m}/1.5=120\ \mathrm{\mu m}\).`],
  },
  {
    id: 'grating-scale',
    title: ['เกรตติง · อ่านตำแหน่งสองด้านแล้วหาความยาวคลื่น', 'Grating · Read two positions to find the wavelength'],
    prompt: ['ฉากห่าง 1.20 m เกรตติงมี 400 ช่อง/mm อ่านแถบสว่างอันดับ 1 สองด้านได้ 23.0 และ 83.0 cm บนไม้เมตร หาแนวกลาง ระยะข้างเดียว และความยาวคลื่น โดยใช้ตรีโกณมิติ', 'A screen 1.20 m away is used with a 400 lines/mm grating. First-order maxima on opposite sides are at 23.0 and 83.0 cm on a ruler. Find the centre, the one-sided distance and the wavelength using trigonometry.'],
    answer: ['53.0 cm · 30.0 cm · 606 nm'],
    working: [raw`จากสมมาตร พิกัดกลางคือ \((23.0+83.0)/2=53.0\ \mathrm{cm}\) ระยะข้างเดียวคือ \(30.0\ \mathrm{cm}\) จาก (5) \(\tan\theta=0.300/1.20=0.250\) และ \(\sin\theta=0.2425\) ใช้ (18) ได้ \(d=2.50\ \mathrm{\mu m}\) ใช้ (19) ที่ \(m=1\) จึงได้ \(\lambda=d\sin\theta\approx606\ \mathrm{nm}\)`, raw`By symmetry the centre is \((23.0+83.0)/2=53.0\ \mathrm{cm}\), and the one-sided distance is \(30.0\ \mathrm{cm}\). By (5), \(\tan\theta=0.300/1.20=0.250\), so \(\sin\theta=0.2425\). By (18), \(d=2.50\ \mathrm{\mu m}\). Equation (19) with \(m=1\) gives \(\lambda=d\sin\theta\approx606\ \mathrm{nm}\).`],
  },
  {
    id: 'grating-count',
    title: ['เกรตติง · อันดับที่ขนานกับฉาก', 'Grating · An order parallel to the screen'],
    prompt: ['ใช้เกรตติง 500 ช่อง/mm กับแสงที่มีความยาวคลื่นเท่ากับหนึ่งในสามของระยะระหว่างช่อง บนฉากด้านหน้าที่วางตั้งฉากกับแนวกลางและกว้างพอ อันดับสูงสุดที่ตกบนฉากคือเท่าไร และเห็นแถบสว่างหลักกี่แถบ?', 'A 500 lines/mm grating is illuminated with a wavelength exactly one-third of the slit separation. On a sufficiently wide forward screen perpendicular to the central ray, find the largest order that hits the screen and the number of principal maxima.'],
    answer: ['อันดับ 2 · 5 แถบ', 'order 2 · 5 fringes'],
    working: [raw`จาก (19) และ (20) อันดับ 3 ให้ \(\sin\theta=1\) คือแนวขนานกับฉาก จึงไม่นับบนฉากด้านหน้า นับ \(m=-2,-1,0,+1,+2\) ได้ 5 แถบ โดยเครื่องหมายใช้ระบุด้านบนฉาก`, raw`Equations (19) and (20) give \(\sin\theta=1\) for order 3. Those rays are parallel to the screen. Count \(m=-2,-1,0,+1,+2\), giving five principal maxima, with the signs indicating screen sides.`],
  },
  {
    id: 'spectrum',
    title: ['เกรตติง · เห็นครบช่วงและเส้นซ้อน', 'Grating · Complete spectra and coincident lines'],
    prompt: ['เกรตติง 500 ช่อง/mm รับแสงในช่วง 420–680 nm บนฉากกว้างพอ จงหาอันดับสูงสุดที่เห็นครบช่วง และหาว่าแสง 630 nm อันดับ 2 ซ้อนกับแสงใดในอันดับ 3', 'A 500 lines/mm grating receives 420–680 nm light and the screen is sufficiently wide. Find the highest complete order and the third-order wavelength that coincides with second-order 630 nm light.'],
    answer: ['อันดับ 2 · 420 nm', 'order 2 · 420 nm'],
    working: [raw`จาก (18) ได้ \(d=2000\ \mathrm{nm}\) ตรวจปลายช่วงที่ \(\lambda_{\max}=680\ \mathrm{nm}\) ด้วย (20) จึงมี \(m<2000/680\approx2.94\) ครบถึงอันดับ 2 จาก (19) จุดเดียวกันมี \(d\sin\theta\) ค่าเดียว จึงได้ \(\lambda=2(630\ \mathrm{nm})/3=420\ \mathrm{nm}\)`, raw`Equation (18) gives \(d=2000\ \mathrm{nm}\). Test \(\lambda_{\max}=680\ \mathrm{nm}\) in (20): \(m<2000/680\approx2.94\), so order 2 is the last complete one. By (19), the same position gives the same \(d\sin\theta\), so \(\lambda=2(630\ \mathrm{nm})/3=420\ \mathrm{nm}\).`],
  },
];

const reading = [
  {
    id: 'single-cloze', title: ['10.3 · การหักล้างจากช่องเดียว', '10.3 · Cancellation across one slit'],
    words: [['แหล่งคลื่นย่อย', 'secondary wave sources'], ['แถบมืดอันดับ 1', 'first dark fringe'], ['กึ่งกลางช่อง', 'slit centre'], ['แถบสว่างอันดับ 1', 'first bright fringe']],
    sentences: [['แถบสว่างกลางกว้างขึ้นเมื่อช่องแคบลง', 'A narrower slit gives a wider central maximum.'], ['ใช้ตำแหน่งมืดแรกสองฝั่งเป็นขอบเขตของแถบสว่างกลาง', 'Use the first minima on opposite sides as the boundaries of the central bright fringe.'], ['วัดจากกลางถึงมืดแรกเพียงฝั่งเดียวเพื่อหาความกว้างเต็มแถบ', 'The centre-to-minimum distance on just one side gives the full width.']],
    text: ['จุดต่าง ๆ ในช่องทำหน้าที่เป็น (1) ______ เมื่อคลื่นจากจุดคู่ซึ่งห่างกันครึ่งความกว้างช่องต่างทางเดินกันครึ่งความยาวคลื่น จะเกิด (2) ______ จากภาพ สสวท. เมื่อคงสีแสงและระยะฉาก ผลของการลดความกว้างช่องคือ (3) ______ หากต้องวัดความกว้างบนฉาก ให้ (4) ______', 'Points across the opening act as (1) ______. When paired points half a slit width apart differ in path by half a wavelength, they produce the (2) ______. At fixed wavelength and screen distance, the IPST image shows that (3) ______. To measure the width on a screen, (4) ______'],
    key: '1 W1 · 2 W2 · 3 S1 · 4 S2',
  },
  {
    id: 'grating-cloze', title: ['10.4 · อ่านลายเกรตติง', '10.4 · Interpreting a grating pattern'],
    words: [['ตำแหน่งเสริมกัน', 'constructive-interference position'], ['แถบกลาง', 'central fringe'], ['แถบมืด', 'dark fringe'], ['ความกว้างช่อง', 'slit width']],
    sentences: [['สีแดงเบนมากกว่าสีม่วงในอันดับเดียวกัน', 'Red diffracts more than violet in the same order.'], ['ตรวจจากความยาวคลื่นมากที่สุดในช่วง', 'Test the longest wavelength in the supplied range.'], ['ที่อันดับเดียวกันทุกสีมีมุมเท่ากัน', 'Every colour in one order has the same angle.']],
    text: ['เมื่อผลต่างทางเดินจากช่องติดกันเป็นจำนวนเต็มเท่าของความยาวคลื่น จุดนั้นเป็น (1) ______ เมื่อฉายแสงขาว ทุกสีรวมกันที่ (2) ______ ส่วนด้านข้าง (3) ______ ถ้าจะตรวจว่าอันดับหนึ่ง ๆ เห็นครบช่วงหรือไม่ ให้ (4) ______', 'If the path difference between neighbouring slits is a whole number of wavelengths, the point is a (1) ______. For white light, all colours overlap at the (2) ______. Off axis, (3) ______. To decide whether a given order contains the full spectrum, (4) ______'],
    key: '1 W1 · 2 W2 · 3 S1 · 4 S2',
  },
];

const recall = [
  ['สลิตคู่ · จากแล็บถึงการนับช่วง', 'Double slit · From the lab to interval counting',
    [
      ['เปลี่ยนระยะสลิต ขณะที่ตัวแปรอื่นคงเดิม ระยะห่างแถบเปลี่ยนอย่างไร?', 'How does fringe spacing change when slit separation changes and other variables stay fixed?', raw`ระยะแถบลดลงเมื่อ \(d\) เพิ่มขึ้น ตาม (9) ภายใต้เงื่อนไขมุมเล็ก`, raw`Spacing decreases as \(d\) increases by (9), for small angles.`],
      ['สว่าง 5 แถบติดกันคร่อมกี่ช่วง? เขียนว่าแต่ละปลายของช่วงที่วัดคือจุดใด', 'How many intervals lie between five consecutive bright fringes? Describe both ends of the span.', 'สี่ช่วง จากกึ่งกลางแถบแรกถึงกึ่งกลางแถบที่ห้า', 'Four intervals, from the first bright centre to the fifth.'],
      ['ความกว้างแถบสว่างกลาง W₀ วัดจากจุดใดถึงจุดใด?', 'Which points bound the central bright width W₀?', 'มืดแรกด้านซ้ายถึงมืดแรกด้านขวา', 'Measure between the first minimum on the left and the first minimum on the right.'],
    ]],
  ['สลิตเดี่ยวและเกรตติง · อธิบายและเลือกเงื่อนไข', 'Single slit and grating · Explain and choose conditions',
    [
      ['ทำไมสลิตเดี่ยวจึงให้มืดแรก? เมื่อช่องแคบลง แถบสว่างกลางเปลี่ยนอย่างไร?', 'Why does a single slit give a first minimum? What happens to its central fringe when the slit narrows?', 'ที่มืดแรก จุดคู่จากสองครึ่งช่องมีผลต่างทางเดินครึ่งความยาวคลื่นจึงหักล้างกัน เมื่อช่องแคบลง แถบกลางกว้างขึ้นเมื่อคงความยาวคลื่นและระยะฉาก', 'At the first minimum, pairs across the two halves differ in path by half a wavelength and cancel. Narrowing the slit broadens the centre at fixed wavelength and screen distance.'],
      ['แสงขาวผ่านเกรตติง แนวกลางมีสีอะไร? ควรตรวจจากสีใดก่อนถ้าต้องการเห็นครบช่วง?', 'What colour is the centre for white light through a grating? Which wavelength should be checked first to see if the entire range is visible?', 'แนวกลางสีขาวเพราะทุกสีซ้อนกัน ตรวจจากความยาวคลื่นมากที่สุด เพราะที่อันดับเดียวกันเบนไกลที่สุด', 'The centre is white because all wavelengths overlap. Check the longest wavelength because it diffracts the farthest at a fixed order.'],
      ['สมการ (16) และ (19) ใช้หาตำแหน่งชนิดใด? เมื่อไรจึงแทน sin θ ด้วย tan θ ได้?', 'What types of position do (16) and (19) locate? When can sin θ be approximated by tan θ?', 'สมการ (16) ให้แถบมืดของสลิตเดี่ยว และ (19) ให้แถบสว่างหลักของเกรตติง ใช้การประมาณได้เมื่อมุมเล็ก', 'Equation (16) locates single-slit minima; (19) locates principal grating maxima. The approximation requires a small angle.'],
    ]],
];

export function practicePages(lang, filled) {
  const l = lang === 'th' ? 0 : 1;
  const t = (thai, english) => l ? english : thai;
  const check = t('ตรวจคำตอบ', 'Check answer');
  const sections = reading.map(r => [r.id, r.title[l],
    `<div class="chapter-bank"><div><h3>Word Bank</h3><ul>${r.words.map((w,i)=>`<li>W${i+1} · ${w[l]}</li>`).join('')}</ul></div><div><h3>Sentence Bank</h3><ul>${r.sentences.map((s,i)=>`<li>S${i+1} · ${s[l]}</li>`).join('')}</ul></div></div><p>${r.text[l]}</p>` +
    (filled ? `<div class="chapter-solution"><p>${t('เฉลย', 'Answers')} · ${r.key}</p></div>` : '<div class="chapter-work"></div>')]);
  const practice = problems.map(r => [r.id, r.title[l],
    `<p>${r.prompt[l]}</p>${r.figure ? figure(r.figure[0], r.figure[l+1]) : ''}` +
    (filled ? `<div class="chapter-solution"><p>${r.working[l]}</p><p><strong>${r.answer[l] ?? r.answer[0]}</strong></p></div>` :
      `<p class="calculation-check"><strong>${check}</strong> ${r.answer[l] ?? r.answer[0]}</p><div class="chapter-work"></div>`)]);
  return {reading: sections, practice};
}

export function recallPages(lang, filled) {
  const l = lang === 'th' ? 0 : 1;
  return recall.map((r,i) => [`combined-recall-${i+1}`, r[l],
      r[2].map((q,n) => `<section class="chapter-task"><p><b>${n+1}.</b> ${q[l]}</p>${filled ? `<p class="chapter-solution">${q[l+2]}</p>` : '<div class="chapter-write"></div>'}</section>`).join('')]);
}
