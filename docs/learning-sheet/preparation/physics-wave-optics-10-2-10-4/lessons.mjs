const raw = String.raw;
export const assetRoot = 'assets/10-2-10-4/';

export function figure(file, caption, className = '') {
  return `<figure class="note-figure source-figure ${className}"><img src="${assetRoot}${file}.jpg" alt="${caption}"><figcaption>${caption}</figcaption></figure>`;
}

export const formulaGroups = [
  [
    [1, 'ความต่างเฟสจากผลต่างทางเดิน', 'Phase from path difference', raw`\Delta\phi=\frac{2\pi}{\lambda}\Delta r`],
    [2, 'ตำแหน่งสว่างของสลิตคู่ที่เริ่มเฟสตรงกัน', 'Bright condition for initially in-phase slits', raw`\Delta r=m\lambda,\quad m=0,1,2,\ldots`],
    [3, 'ตำแหน่งมืดของสลิตคู่ นับมืดแรกเป็นอันดับ 1', 'Dark condition, numbering the first dark fringe 1', raw`\Delta r=(m-\tfrac12)\lambda,\quad m=1,2,\ldots`],
    [4, 'ผลต่างทางเดินเมื่อฉากไกลเทียบกับระยะช่อง', 'Path difference for far-field geometry', raw`\Delta r\approx d\sin|\theta|`],
    [5, 'มุมและพิกัดบนฉาก', 'Angle and screen coordinate', raw`\tan\theta=\frac{x}{L}`],
    [9, 'ระยะระหว่างแถบสว่างติดกันของสลิตคู่ เมื่อมุมเล็ก', 'Double-slit bright fringe spacing, for small angles', raw`\Delta x\approx\frac{\lambda L}{d}`],
    [13, 'หาระยะแถบจากการวัดหลายช่วงที่ห่างเท่ากัน', 'Spacing from several equally spaced intervals', raw`\Delta x=\frac{D_{\mathrm{span}}}{k}`],
    [14, 'ระยะจริงระหว่างพิกัดสองตำแหน่ง', 'Distance between two screen coordinates', raw`D=|x_2-x_1|`],
  ],
  [
    [16, 'เงื่อนไขแถบมืดของสลิตเดี่ยว', 'Single-slit dark-fringe condition', raw`a\sin\theta_m=m\lambda,\quad m=1,2,\ldots`],
    [17, 'ความกว้างแถบสว่างกลางบนฉากและความกว้างเชิงมุม', 'Central width on a screen and angular width', raw`W=2L\tan\theta_1\approx\frac{2\lambda L}{a},\quad \Omega=2\theta_1`],
    [18, 'ระยะระหว่างช่องจากจำนวนช่องต่อหน่วยความยาว', 'Slit separation from line density', raw`d=\frac{1}{N}`],
    [19, 'เงื่อนไขแถบสว่างหลักของเกรตติง', 'Grating principal bright orders', raw`d\sin\theta_m=m\lambda,\quad m=0,1,2,\ldots`],
    [20, 'แถบด้านข้างบนฉากด้านหน้า', 'Off-axis orders on a forward screen', raw`0<\Delta r=d\sin\theta_m=m\lambda<d`],
  ],
];

export function eq(number, tex, filled) {
  return `<div class="chapter-equation${filled ? ' filled' : ''}" data-combined-equation="${number}"><div>${filled ? '\\(' + tex + '\\)' : ''}</div><span>(${number})</span></div>`;
}

export function lessonPages(lang, filled) {
  const th = lang === 'th';
  const t = (thai, english) => th ? thai : english;
  const p = (thai, english) => `<p>${t(thai, english)}</p>`;
  const h = (thai, english) => `<h3>${t(thai, english)}</h3>`;
  const note = (thai, english, answerThai, answerEnglish) =>
    `<div class="chapter-note"><p><strong>${t('จดระหว่างเรียน', 'Class notes')}</strong> · ${t(thai, english)}</p>${filled ? p(answerThai, answerEnglish) : '<div class="chapter-write"></div>'}</div>`;
  const example = (title, prompt, answer) =>
    `<section class="example"><h3>${title}</h3><p>${prompt}</p>${filled ? `<div class="note-answer">${answer}</div>` : '<div class="chapter-work"></div>'}</section>`;
  const formula = number => eq(number, formulaGroups.flat().find(row => row[0] === number)[3], filled);
  const photo = (name, thai, english, cls = '') => figure(name, t(thai, english), cls);
  const external = (id, thai, english) => `<p class="source"><a href="https://nixcentury.github.io/learning-hub/#physics/bank/${id}/video-01" data-hub-video data-content-id="physics-ipst-wave-optics-${id === 'b-890bbcf0b7148976b06084d2' ? '10-3' : '10-4'}-video-01" data-subject-id="physics" data-chapter-id="bank" data-topic-id="${id}" data-video-src="${id === 'b-890bbcf0b7148976b06084d2' ? 'https://www.youtube.com/watch?v=PgW7qaOZD0U&amp;t=180s' : 'https://www.youtube.com/watch?v=vgVFMujlRLo'}">${t(thai, english)}</a></p>`;

  return [
    ['single-observe', 'theory', t('10.3 · ปิดให้เหลือช่องเดียว ยังมีแถบมืดไหม?', '10.3 · Can one slit produce dark fringes?'),
      external('b-890bbcf0b7148976b06084d2', 'ดูคลิปทดลองสลิตเดี่ยวของ MIT OpenCourseWare', 'Watch the MIT OpenCourseWare single-slit demonstration') +
      photo('ipst-10-7-patterns', 'สสวท. รูป 10.7 ลายบนฉากเมื่อใช้ช่อง 50, 100 และ 200 µm', 'IPST Figure 10.7. Screen patterns for 50, 100 and 200 µm slits.') +
      p('มองที่กึ่งกลางของภาพ แล้วหาขอบมืดข้างแถบสว่างกลางทั้งสองด้าน วัดขนาดจากรูปนี้ได้ในเชิงเปรียบเทียบ เพราะไม่มีสเกลวัดระยะบนฉากที่กำกับไว้', 'Find the dark regions on each side of the central maximum. Compare widths qualitatively from this figure, which has no labelled screen-distance scale.') +
      note('เมื่อคงสีแสงและระยะฉากไว้ ช่องแคบลงแล้วลายแสงเปลี่ยนอย่างไร?', 'What happens as the slit gets narrower at fixed wavelength and screen distance?', 'แถบสว่างกลางกว้างขึ้น และลายด้านข้างแผ่ออกไปมากขึ้น', 'The central bright fringe widens and the side fringes spread farther out.') +
      note('คลื่นจากตำแหน่งต่าง ๆ ในช่องเดียวมาหักล้างกันบนฉากได้อย่างไร?', 'How can light from different parts of one slit cancel on the screen?', 'จุดต่าง ๆ ภายในช่องทำหน้าที่เป็นแหล่งคลื่นย่อย แสงที่ไปถึงจุดเดียวกันจึงอาจมีผลต่างทางเดินที่ทำให้หักล้างกัน', 'Points across the opening act as secondary wave sources. At some screen positions their path differences lead to cancellation.')],

    ['single-proof', 'theory', t('พิสูจน์แถบมืดของสลิตเดี่ยว', 'Deriving the single-slit minima'),
      photo('ipst-10-8-paired-rays', 'สสวท. รูป 10.8 จับคู่คลื่นจากช่องสองครึ่ง', 'IPST Figure 10.8. Pairing wave sources across the two halves of the slit.') +
      p(raw`ให้ \(a\) เป็นความกว้างช่อง วัด \(\theta_m\) จากแนวกลางถึงมืดอันดับ \(m\) พิจารณาแสงตกตั้งฉากและฉากอยู่ไกล เลือกจุดคู่หนึ่งที่ห่างกัน \(a/2\) ตามรูป`, raw`Let \(a\) be the slit width and \(\theta_m\) the angle to dark order \(m\). For normal illumination and a distant screen, choose two points separated by \(a/2\) as shown.`) +
      p(raw`ที่แถบมืดแรก ผลต่างทางเดินของทุกคู่เป็น \((a/2)\sin\theta_1=\lambda/2\) จึงหักล้างกันทั้งช่อง ที่มืดอันดับ 2 แบ่งเป็นสี่ส่วนแล้วจับคู่ส่วนที่ติดกัน เหตุผลทั่วไปใช้ \(2m\) ส่วน แต่ละคู่ห่างกัน \(a/(2m)\) และมีผลต่างทางเดิน \(\lambda/2\)`, raw`At the first minimum, every pair has path difference \((a/2)\sin\theta_1=\lambda/2\), giving cancellation across the slit. For the second minimum, use four equal parts and pair adjacent parts. In general, use \(2m\) parts with pair separation \(a/(2m)\) and path difference \(\lambda/2\).`) +
      h('สรุปเงื่อนไขแถบมืด', 'Record the minimum condition') + formula(16) +
      note('เหตุใดแถบสว่างตรงกลางจึงเกิดที่มุมศูนย์?', 'Why is the on-axis fringe bright?', 'ที่มุมศูนย์ คลื่นจากทุกส่วนของช่องมาถึงโดยมีผลต่างทางเดินเป็นศูนย์ จึงเสริมกัน', 'At zero angle, the contributions from the whole slit have zero path difference and add constructively.')],

    ['single-width', 'theory', t('อ่านกราฟและหาความกว้างแถบสว่างกลาง', 'Reading intensity and finding central width'),
      photo('ipst-10-10-intensity', 'สสวท. รูป 10.10 ความเข้มสัมพัทธ์ตามมุม สำหรับ a = λ, 5λ และ 10λ', 'IPST Figure 10.10. Relative intensity versus angle for a = λ, 5λ and 10λ.', 'tall-source') +
      p(raw`อ่านมืดแรกจากศูนย์ของกราฟซ้ายและขวา สำหรับ \(a=5\lambda\) อ่านได้ราว \(\pm12^\circ\) และเมื่อ \(a=10\lambda\) ได้ราว \(\pm6^\circ\) กราฟใช้หน่วยองศา จึงให้ความกว้างเชิงมุมโดยตรง`, raw`Read the first zeros on the left and right. For \(a=5\lambda\) they are about \(\pm12^\circ\), and for \(a=10\lambda\) about \(\pm6^\circ\). The horizontal axis is in degrees, so it gives the angular width directly.`) +
      p(raw`บนฉาก มืดแรกอยู่ที่ \(x=\pm L\tan\theta_1\) ดังนั้นความกว้างคือพิกัดขวาลบพิกัดซ้าย ส่วนสูตรประมาณใช้ได้เมื่อ \(\sin\theta_1\approx\tan\theta_1\)`, raw`On a screen the first minima are at \(x=\pm L\tan\theta_1\). Subtract the left coordinate from the right. The approximation requires \(\sin\theta_1\approx\tan\theta_1\).`) +
      formula(17)],

    ['single-examples', 'examples', t('ตัวอย่าง 10.3 · อ่านตำแหน่งมืดและคำนวณย้อนกลับ', 'Worked examples 10.3 · Read a minimum and work backwards'),
      example(t('หาแถบมืดแรกและความกว้าง', 'First minimum and central width'),
        t('เลเซอร์ 600 nm ผ่านสลิตกว้าง 150 µm ฉากอยู่ห่าง 2.00 m จงหามุมมืดแรก ระยะจากกลางถึงมืดแรกหนึ่งด้าน และความกว้างแถบสว่างกลาง', 'A 600 nm laser passes through a 150 µm slit. The screen is 2.00 m away. Find the first dark angle, its distance from the centre and the central bright width.'),
        p(raw`ใช้สมการ (16) ที่ \(m=1\) ได้ \(\sin\theta_1=(600\times10^{-9}\ \mathrm m)/(150\times10^{-6}\ \mathrm m)=0.00400\) จึงได้ \(\theta_1\approx0.229^\circ\) จากสมการ (5) \(x_1=2.00\tan\theta_1\approx8.00\ \mathrm{mm}\) แล้วใช้ (17) ได้ \(W\approx16.0\ \mathrm{mm}\)`, raw`Use (16) with \(m=1\): \(\sin\theta_1=(600\times10^{-9}\ \mathrm m)/(150\times10^{-6}\ \mathrm m)=0.00400\). Thus \(\theta_1\approx0.229^\circ\). From (5), \(x_1=2.00\tan\theta_1\approx8.00\ \mathrm{mm}\). Equation (17) gives \(W\approx16.0\ \mathrm{mm}\).`)) +
      example(t('โจทย์ให้ระยะจากมืดซ้ายถึงมืดขวา', 'Working back from two minima'),
        t('ในอีกชุดทดลอง เลเซอร์ 500 nm ให้มืดแรกซ้ายและขวาห่างกัน 12.0 mm บนฉากที่ห่าง 1.50 m ช่องกว้างเท่าไร?', 'In another setup a 500 nm laser gives first minima 12.0 mm apart on a screen 1.50 m away. Find the slit width.'),
        p(raw`จาก (17) ระยะข้างเดียว \(x_1=6.00\ \mathrm{mm}\) และ \(x_1/L=0.00400\) จึงใช้มุมเล็กกับ (16) และ (5) ได้ \(a\approx\lambda L/x_1=125\ \mathrm{\mu m}\)`, raw`From (17), the one-sided distance is \(x_1=6.00\ \mathrm{mm}\) and \(x_1/L=0.00400\). Use the small-angle form of (16) and (5) to find \(a\approx\lambda L/x_1=125\ \mathrm{\mu m}\).`))],

    ['grating-observe', 'theory', t('10.4 · จากสองช่องสู่เกรตติง', '10.4 · From two slits to a diffraction grating'),
      external('b-0c4e16bd5a0e0352ea77c1ea', 'ดูคลิปทดลองแสงผ่านเกรตติง', 'Watch the diffraction grating demonstration') +
      photo('ipst-10-11-comparison', 'สสวท. รูป 10.11 เปรียบเทียบสลิตเดี่ยวกับสลิตคู่', 'IPST Figure 10.11. Comparing single- and double-slit patterns.') +
      photo('ipst-10-13-grating-patterns', 'สสวท. รูป 10.13 เลเซอร์สีแดงและแสงขาวผ่านเกรตติง', 'IPST Figure 10.13. A red laser and white light through a grating.') +
      p('เมื่อเพิ่มจำนวนช่องที่แสงผ่านโดยคงระยะระหว่างช่องเท่าเดิม แถบสว่างหลักจะแคบและคมขึ้น การเสริมจากหลายช่องเด่นชัดมาก ณ มุมที่แต่ละช่องให้คลื่นเฟสตรงกัน', 'At fixed slit separation, illuminating more slits makes principal bright fringes narrower and sharper. The many contributions reinforce strongly at angles where they are in phase.') +
      note('เมื่อเปลี่ยนจากเลเซอร์สีเดียวเป็นแสงขาว กลางกับด้านข้างต่างกันอย่างไร?', 'How do the centre and sides change when white light replaces the laser?', 'แถบกลางรวมทุกสีเป็นแสงขาว ด้านข้างแยกเป็นสเปกตรัม', 'All wavelengths overlap at the centre, forming white light. Off-axis orders separate into spectra.')],

    ['grating-proof', 'theory', t('ระยะช่อง เงื่อนไขสว่าง และอันดับสูงสุด', 'Slit separation, bright orders and the highest order'),
      photo('ipst-10-12-grating-geometry', 'สสวท. รูป 10.12 เปรียบเทียบทางเดินจากช่องที่อยู่ติดกัน', 'IPST Figure 10.12. Compare the paths from adjacent slits.') +
      p(raw`ถ้าเกรตติงมี \(N\) ช่องต่อหนึ่งหน่วยความยาว ระยะจากกึ่งกลางช่องหนึ่งถึงอีกช่องหนึ่งคือส่วนกลับ เช่น 500 ช่อง/mm ให้ \(d=(1\ \mathrm{mm})/500=2.00\ \mathrm{\mu m}\)`, raw`If the line density is \(N\) slits per unit length, the centre-to-centre separation is its reciprocal. For example, 500 lines/mm gives \(d=(1\ \mathrm{mm})/500=2.00\ \mathrm{\mu m}\).`) +
      formula(18) +
      p(raw`แสงตกตั้งฉากทำให้คลื่นจากทุกช่องเริ่มเฟสตรงกัน ในแนวไกล ผลต่างทางเดินระหว่างช่องติดกันคือ \(d\sin\theta_m\) เมื่อเท่ากับจำนวนเต็มเท่าของ \(\lambda\) ทุกช่องจึงเสริมกัน`, raw`For normal illumination the slit waves start in phase. In the far field the path difference between neighbours is \(d\sin\theta_m\). An integer multiple of \(\lambda\) puts all the slit contributions in phase.`) +
      formula(19) +
      p(raw`แนวกลางมี \(m=0\) ส่วนแถบด้านข้างบนฉากด้านหน้ามี \(0<\theta_m<90^\circ\) ถ้า \(m\lambda=d\) แนวแสงขนานกับฉากและจะไม่ตัดฉากที่ระยะจำกัด`, raw`The centre is \(m=0\). Off-axis fringes on a forward screen require \(0<\theta_m<90^\circ\). If \(m\lambda=d\), the ray is parallel to the screen and does not meet it at a finite position.`) + formula(20)],

    ['grating-laser', 'examples', t('ตัวอย่าง 10.4 · จากจำนวนช่องไปถึงตำแหน่งบนฉาก', 'Worked examples 10.4 · From line density to screen position'),
      example(t('เลเซอร์ 600 nm ผ่านเกรตติง 500 ช่อง/mm', '600 nm laser through a 500 lines/mm grating'),
        t('ฉากอยู่ห่าง 1.00 m จงหามุมและตำแหน่งแถบสว่างอันดับ 1 แล้วตรวจว่าอันดับ 4 เกิดบนฉากด้านหน้าได้หรือไม่', 'A screen is 1.00 m away. Find the angle and position of the first order, then decide if order 4 can reach a forward screen.'),
        p(raw`จาก (18) ได้ \(d=2.00\ \mathrm{\mu m}\) ใช้ (19) ได้ \(\sin\theta_1=0.300\) จึงได้ \(\theta_1=17.46^\circ\) และจาก (5) ได้ \(x_1=1.00\tan(17.46^\circ)\approx31.4\ \mathrm{cm}\) ส่วนอันดับ 4 ต้องการ \(4\lambda/d=1.20\) ขัดกับ (20) ดังนั้นอันดับสูงสุดคือ 3 และแถบรวมเป็น 7 ถ้าฉากกว้างพอ`, raw`Equation (18) gives \(d=2.00\ \mathrm{\mu m}\). From (19), \(\sin\theta_1=0.300\), so \(\theta_1=17.46^\circ\). From (5), \(x_1=1.00\tan(17.46^\circ)\approx31.4\ \mathrm{cm}\). Order 4 requires \(4\lambda/d=1.20\), which fails (20). The highest order is 3, giving seven fringes on a sufficiently wide screen.`)) +
      example(t('อ่านไม้เมตรโดยใช้พิกัดกลาง', 'Read a scale using the centre coordinate'),
        t('แนวกลางอ่านได้ 50.0 cm และสว่างอันดับ 1 อ่านได้ 70.0 cm ฉากห่าง 1.00 m ใช้เกรตติง 300 ช่อง/mm จงหา λ', 'The central fringe reads 50.0 cm and first order reads 70.0 cm. The screen is 1.00 m away and the grating has 300 lines/mm. Find λ.'),
        p(raw`ใช้ (14) ได้ \(x_1=20.0\ \mathrm{cm}\) ใช้ (5) หามุมจาก \(\tan\theta_1=0.200\) และได้ \(\sin\theta_1\approx0.1961\) จาก (18) และ (19) ได้ \(\lambda=d\sin\theta_1\approx654\ \mathrm{nm}\)`, raw`Equation (14) gives \(x_1=20.0\ \mathrm{cm}\). Equation (5) gives \(\tan\theta_1=0.200\), hence \(\sin\theta_1\approx0.1961\). From (18) and (19), \(\lambda=d\sin\theta_1\approx654\ \mathrm{nm}\).`))],

    ['grating-spectrum', 'examples', t('ตัวอย่าง 10.4 · สเปกตรัมครบช่วงและเส้นที่ซ้อนกัน', 'Worked examples 10.4 · Complete spectra and overlapping lines'),
      p(raw`ที่อันดับเดียวกัน \(m>0\) สีที่มี \(\lambda\) มากกว่าจะเบนมากกว่า หากต้องตรวจว่าเห็นครบช่วง ให้ใช้ความยาวคลื่นมากที่สุดตรวจเงื่อนไข (20) ถ้าฉากมีขอบ ให้ตรวจตำแหน่งบนฉากด้วย`, raw`At a fixed positive order, longer wavelengths diffract through larger angles. To test whether the whole band can appear, use the longest wavelength in (20). For a screen of finite width, also check its edge.`) +
      example(t('แสงขาวช่วง 400–700 nm', 'White light, 400–700 nm'),
        t('เกรตติงมี 500 ช่อง/mm ฉากห่าง 1.00 m จงหาอันดับสูงสุดที่เห็นครบช่วงบนฉากที่กว้างพอ และความกว้างสเปกตรัมอันดับ 1 ด้านเดียว', 'A 500 lines/mm grating is 1.00 m from a sufficiently wide screen. Find the highest complete order and the width of the first-order spectrum on one side.'),
        p(raw`จาก (18) ได้ \(d=2000\ \mathrm{nm}\) จาก (20) \(m<2000/700\approx2.86\) จึงได้ครบถึงอันดับ 2. สำหรับอันดับ 1 ใช้ (19) ได้ \(\sin\theta_{400}=0.200\) และ \(\sin\theta_{700}=0.350\) จาก (5) ตำแหน่งขอบอยู่ที่ 20.4 และ 37.4 cm ตามลำดับ จึงกว้างประมาณ 17.0 cm`, raw`Equation (18) gives \(d=2000\ \mathrm{nm}\). From (20), \(m<2000/700\approx2.86\), so order 2 is the last complete one. For order 1, (19) gives \(\sin\theta_{400}=0.200\) and \(\sin\theta_{700}=0.350\). From (5), the edges are at 20.4 and 37.4 cm, giving a width of about 17.0 cm.`)) +
      example(t('สองสีอยู่ที่ตำแหน่งเดียวกัน', 'Two colours at the same position'),
        t('แสง 600 nm อันดับ 2 ซ้อนกับแสงอีกสีอันดับ 3 ในเกรตติงแผ่นเดิม แสงอีกสีนั้นมีความยาวคลื่นเท่าไร?', 'The second order of 600 nm light coincides with the third order of another colour on the same grating. Find that wavelength.'),
        p(raw`จาก (19) ทั้งสองสีมี \(d\) และ \(\theta\) เท่ากัน จึงได้ \(2(600\ \mathrm{nm})=3\lambda\) ดังนั้น \(\lambda=400\ \mathrm{nm}\)`, raw`From (19), both colours share \(d\) and \(\theta\), so \(2(600\ \mathrm{nm})=3\lambda\). Hence \(\lambda=400\ \mathrm{nm}\).`))],
    ...formulaGroups.map((group, i) => [
      `formula-summary-${i + 1}`, 'theory', t(i ? 'สรุปสมการ · สลิตเดี่ยวและเกรตติง' : 'สรุปสมการ · สลิตคู่และการอ่านฉาก', i ? 'Formula recall · Single slit and grating' : 'Formula recall · Double slit and screen measurements'),
      p('เขียนสมการตามชื่อและเงื่อนไขที่กำกับไว้', 'Write each equation with the condition stated for it.') +
      group.map(([n, thai, english, tex]) => p(thai, english) + eq(n, tex, filled)).join(''),
    ]),
  ];
}
