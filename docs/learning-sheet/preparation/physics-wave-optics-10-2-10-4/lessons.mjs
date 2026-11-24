const raw = String.raw;
export const assetRoot = 'assets/10-2-10-4/';

export function figure(file, caption, className = '') {
  return `<figure class="note-figure source-figure ${className}"><img src="${assetRoot}${file}.jpg" alt="${caption}"><figcaption>${caption}</figcaption></figure>`;
}

export function diagram(file, caption, className = '') {
  return `<figure class="note-figure teaching-diagram ${className}"><img src="${assetRoot}${file}.svg" alt="${caption}"><figcaption>${caption}</figcaption></figure>`;
}

export const formulaGroups = [
  [
    [1, 'ความต่างเฟสจากผลต่างทางเดิน', 'Phase from path difference', raw`\Delta\phi=\frac{2\pi}{\lambda}\Delta r`],
    [2, 'ตำแหน่งสว่างของสลิตคู่ที่เริ่มเฟสตรงกัน', 'Bright condition for initially in-phase slits', raw`\Delta r=m\lambda,\quad m=0,1,2,\ldots`],
    [3, 'ตำแหน่งมืดของสลิตคู่ นับมืดแรกเป็นอันดับ 1', 'Dark condition, numbering the first dark fringe 1', raw`\Delta r=(m-\tfrac12)\lambda,\quad m=1,2,\ldots`],
    [4, 'ผลต่างทางเดินเมื่อฉากไกลเทียบกับระยะช่อง', 'Path difference for far-field geometry', raw`\Delta r\approx d\sin\theta`],
    [5, 'มุมและพิกัดบนฉาก', 'Angle and screen coordinate', raw`\tan\theta=\frac{x}{L}`],
    [6, 'ผลต่างทางเดินใกล้แนวกลางของสลิตคู่', 'Double-slit path difference near the axis', raw`\Delta r\approx dx/L`],
    [7, 'ตำแหน่งแถบสว่างของสลิตคู่เมื่อมุมเล็ก', 'Double-slit bright position for small angles', raw`x_{\mathrm B,m}\approx m\lambda L/d`],
    [8, 'ตำแหน่งแถบมืดของสลิตคู่เมื่อมุมเล็ก', 'Double-slit dark position for small angles', raw`x_{\mathrm D,m}\approx(m-\tfrac12)\lambda L/d`],
    [9, 'ระยะระหว่างแถบสว่างติดกันของสลิตคู่ เมื่อมุมเล็ก', 'Double-slit bright fringe spacing, for small angles', raw`\Delta x\approx\frac{\lambda L}{d}`],
    [10, 'อัตราส่วนระยะห่างแถบเมื่อโจทย์ให้ความยาวคลื่น', 'Spacing ratio with a wavelength change', raw`\frac{\Delta x_2}{\Delta x_1}\approx\frac{\lambda_2}{\lambda_1}\frac{L_2}{L_1}\frac{d_1}{d_2}`],
    [11, 'อัตราเร็ว ความถี่ และความยาวคลื่น', 'Wave speed, frequency and wavelength', raw`v=f\lambda`],
    [12, 'อัตราส่วนระยะห่างแถบเมื่อโจทย์ให้ความถี่', 'Spacing ratio with a frequency change at fixed wave speed', raw`\frac{\Delta x_2}{\Delta x_1}\approx\frac{f_1}{f_2}\frac{L_2}{L_1}\frac{d_1}{d_2}`],
    [13, 'หาระยะแถบจากการวัดหลายช่วงที่ห่างเท่ากัน', 'Spacing from several equally spaced intervals', raw`\Delta x=\frac{|x_{\mathrm{last}}-x_{\mathrm{first}}|}{N-1}`],
    [14, 'ระยะจริงระหว่างพิกัดสองตำแหน่ง', 'Distance between two screen coordinates', raw`D=|x_2-x_1|`],
    [15, 'ความกว้างแถบสว่างกลางของสลิตคู่เมื่อมุมเล็ก', 'Central double-slit width for small angles', raw`W_0=2x_{\mathrm D,1}\approx\frac{\lambda L}{d}\approx\Delta x`],
  ],
  [
    [16, 'เงื่อนไขแถบมืดของสลิตเดี่ยว', 'Single-slit dark-fringe condition', raw`a\sin\theta_m=m\lambda,\quad m=1,2,\ldots`],
    [17, 'ความกว้างแถบสว่างกลางบนฉากและความกว้างเชิงมุม', 'Central width on a screen and angular width', raw`W_0=2L\tan\theta_1\approx\frac{2\lambda L}{a},\quad \Omega=2\theta_1`],
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
      p(raw`ที่มืดแรก จับคู่จุดที่อยู่ห่างกัน \(a/2\) ให้ผลต่างทางเดิน \(\Delta r=\lambda/2\) จากรูป \(\sin\theta_1=\frac{\Delta r}{a/2}=\frac{\lambda/2}{a/2}=\frac{\lambda}{a}\) ทุกคู่หักล้าง จึงได้ \(a\sin\theta_1=\lambda\)`,
        raw`For the first minimum, pairs \(a/2\) apart must have path difference \(\Delta r=\lambda/2\). From the triangle, \(\sin\theta_1=\frac{\Delta r}{a/2}=\frac{\lambda/2}{a/2}=\frac{\lambda}{a}\). The pairs cancel and \(a\sin\theta_1=\lambda\).`) +
      note('เหตุใดแถบสว่างตรงกลางจึงเกิดที่มุมศูนย์?', 'Why is the on-axis fringe bright?', 'ที่มุมศูนย์ คลื่นจากทุกส่วนของช่องมาถึงโดยมีผลต่างทางเดินเป็นศูนย์ จึงเสริมกัน', 'At zero angle, the contributions from the whole slit have zero path difference and add constructively.')],

    ['single-higher', 'theory', t('แถบมืดที่ 2–3 และแถบสว่างข้าง', 'Second and third minima and side maxima'),
      `<div class="minima-pair">${[2,3].map(m => diagram(`minimum-${m}`, t(
        `มืดที่ ${m} · แบ่งช่องเป็น ${2*m} ส่วนเท่า ๆ กัน`, `Minimum ${m} · Divide the slit into ${2*m} equal parts`))).join('')}</div>` +
      p(raw`จับคู่ส่วนที่ติดกัน เช่น A กับ A′ จุดคู่กันห่าง \(a/4\) ที่มืดที่ 2 และ \(a/6\) ที่มืดที่ 3 ทุกคู่หักล้างเมื่อผลต่างทางเดินเป็น \(\lambda/2\)`,
        raw`Pair adjacent parts, such as A and A′. Matching points are \(a/4\) apart at minimum 2 and \(a/6\) apart at minimum 3. Each pair cancels when the path difference is \(\lambda/2\).`) +
      `<div class="two-col"><p>${raw`\(\sin\theta_2=\frac{\lambda/2}{a/4}=\frac{2\lambda}{a}\)`}</p><p>${raw`\(\sin\theta_3=\frac{\lambda/2}{a/6}=\frac{3\lambda}{a}\)`}</p></div>` +
      p(raw`สำหรับมืดที่ \(m\) ใช้ \(2m\) ส่วน ระยะคู่เป็น \(a/(2m)\) แล้วให้ผลต่างทางเดิน \(\lambda/2\) เหมือนเดิม`,
        raw`For dark order \(m\), use \(2m\) equal parts. Each pair is \(a/(2m)\) apart and its path difference is \(\lambda/2\).`) +
      formula(16) +
      h('ใช้เส้นมืดเป็นขอบของแถบสว่างข้าง', 'Use the minima to bound each side maximum') +
      raw`<table class="tbl minima-table"><tbody><tr><th>${t('ตำแหน่งด้านเดียว', 'Position on one side')}</th><td>${t('มืดที่ 1', 'Minimum 1')}</td><td>${t('สว่างข้างที่ 1', 'Side maximum 1')}</td><td>${t('มืดที่ 2', 'Minimum 2')}</td><td>${t('สว่างข้างที่ 2', 'Side maximum 2')}</td><td>${t('มืดที่ 3', 'Minimum 3')}</td></tr>
      <tr><th>\(a\sin\theta\)</th><td>\(\lambda\)</td><td>${t('ระหว่าง', 'Between')}</td><td>\(2\lambda\)</td><td>${t('ระหว่าง', 'Between')}</td><td>\(3\lambda\)</td></tr></tbody></table>` +
      p('เวลาอ่านกราฟความเข้ม จุดมืดคือจุดที่เส้นแตะศูนย์ ส่วนยอดสว่างข้างอยู่ภายในช่วงระหว่างจุดมืด', 'On an intensity plot, a dark fringe touches zero and a side maximum lies between two minima.')],

    ['single-width', 'theory', t('อ่านกราฟและหาความกว้างแถบสว่างกลาง', 'Reading intensity and finding central width'),
      '<div class="width-layout">' +
      photo('ipst-10-10-intensity', 'สสวท. รูป 10.10 ความเข้มสัมพัทธ์ตามมุม สำหรับ a = λ, 5λ และ 10λ', 'IPST Figure 10.10. Relative intensity versus angle for a = λ, 5λ and 10λ.', 'tall-source') +
      '<div>' + diagram('single-central-width', t(
        'รูปฉาก · มืดแรกสองฝั่งห่างจากกลางข้างละ x₁',
        'Screen geometry · The first minima are x₁ from the centre on both sides.')) +
      p(raw`อ่านมืดแรกจากศูนย์ของกราฟซ้ายและขวา สำหรับ \(a=5\lambda\) อ่านได้ราว \(\pm12^\circ\) และเมื่อ \(a=10\lambda\) ได้ราว \(\pm6^\circ\) แกนนอนใช้หน่วยองศา ดังนั้นความกว้างเชิงมุมระหว่างมืดถึงมืดคือประมาณ 24° และ 12° ตามลำดับ ลูกศรที่ระดับความเข้ม 0.5 ในรูปเป็นการวัดที่ครึ่งความเข้มสูงสุด`, raw`Read the first zeros on the left and right. For \(a=5\lambda\) they are about \(\pm12^\circ\), and for \(a=10\lambda\) about \(\pm6^\circ\). The horizontal axis is in degrees, giving dark-to-dark widths of about 24° and 12°, respectively. The arrow at intensity 0.5 marks the width at half the maximum intensity.`) +
      p(raw`บนฉาก มืดแรกอยู่ที่ \(x=\pm L\tan\theta_1\) จึงวัด \(W_0\) จากมืดแรกซ้ายถึงมืดแรกขวา เมื่อมุมเล็ก \(\frac{ax_1}{L}\approx\lambda\) สำหรับมืดแรก จึงได้ \(x_1\approx\frac{\lambda L}{a}\) แล้วคูณสอง`, raw`On a screen the first minima are at \(x=\pm L\tan\theta_1\). The central width \(W_0\) spans both first minima. For small angles, \(\frac{ax_1}{L}\approx\lambda\) at the first minimum. Thus \(x_1\approx\frac{\lambda L}{a}\); double it for the width.`) +
      formula(17) + '</div></div>'],

    ['single-examples', 'examples', t('ตัวอย่าง 10.3 · อ่านตำแหน่งมืดและคำนวณย้อนกลับ', 'Worked examples 10.3 · Read a minimum and work backwards'),
      example(t('หาแถบมืดแรกและความกว้าง', 'First minimum and central width'),
        t('เลเซอร์ 600 nm ผ่านสลิตกว้าง 150 µm ฉากอยู่ห่าง 2.00 m จงหามุมมืดแรก ระยะจากกลางถึงมืดแรกหนึ่งด้าน และความกว้างแถบสว่างกลาง', 'A 600 nm laser passes through a 150 µm slit. The screen is 2.00 m away. Find the first dark angle, its distance from the centre and the central bright width.'),
        p(raw`ใช้สมการ (16) ที่ \(m=1\) ได้ \(\sin\theta_1=(600\times10^{-9}\ \mathrm m)/(150\times10^{-6}\ \mathrm m)=0.00400\) จึงได้ \(\theta_1\approx0.229^\circ\) จากสมการ (5) \(x_1=2.00\tan\theta_1\approx8.00\ \mathrm{mm}\) แล้วใช้ (17) ได้ \(W_0\approx16.0\ \mathrm{mm}\)`, raw`Use (16) with \(m=1\): \(\sin\theta_1=(600\times10^{-9}\ \mathrm m)/(150\times10^{-6}\ \mathrm m)=0.00400\). Thus \(\theta_1\approx0.229^\circ\). From (5), \(x_1=2.00\tan\theta_1\approx8.00\ \mathrm{mm}\). Equation (17) gives \(W_0\approx16.0\ \mathrm{mm}\).`)) +
      example(t('โจทย์ให้ระยะจากมืดซ้ายถึงมืดขวา', 'Working back from two minima'),
        t('ในอีกชุดทดลอง เลเซอร์ 500 nm ให้มืดแรกซ้ายและขวาห่างกัน 12.0 mm บนฉากที่ห่าง 1.50 m ช่องกว้างเท่าไร?', 'In another setup a 500 nm laser gives first minima 12.0 mm apart on a screen 1.50 m away. Find the slit width.'),
        p(raw`จาก (17) ระยะข้างเดียว \(x_1=6.00\ \mathrm{mm}\) และ \(x_1/L=0.00400\) จึงใช้มุมเล็กกับ (16) และ (5) ได้ \(a\approx\lambda L/x_1=125\ \mathrm{\mu m}\)`, raw`From (17), the one-sided distance is \(x_1=6.00\ \mathrm{mm}\) and \(x_1/L=0.00400\). Use the small-angle form of (16) and (5) to find \(a\approx\lambda L/x_1=125\ \mathrm{\mu m}\).`))],

    ['single-graph-example', 'examples', t('ตัวอย่าง 10.3 · อ่านกราฟก่อนคำนวณ', 'Worked example 10.3 · Read the graph first'),
      photo('ipst-10-10c-intensity', 'สสวท. รูป 10.10 กราฟล่าง', 'IPST Figure 10.10, bottom plot.', 'exercise-graph') +
      example(t('ระบุขอบจากจุดมืดแรก', 'Identify the first minima'),
        t('กราฟล่างมี a = 10λ ถ้าฉากอยู่ห่างสลิต 0.80 m ให้อ่านมุมมืดแรกทั้งสองด้าน ประมาณความกว้างเชิงมุมและความกว้างแถบกลางบนฉาก', 'The bottom graph has a = 10λ. The screen is 0.80 m away. Read both first-minimum angles, then estimate the angular and screen widths.'),
        p(raw`ใช้สมการ (17) \(\Omega=2\theta_1\) และ \(W_0=2L\tan\theta_1\) อ่านจากกราฟได้ \(\theta_1\approx6^\circ\) จึงได้ \(\Omega\approx12^\circ\) และ \(W_0\approx2(0.80\,\mathrm m)\tan6^\circ\approx0.17\,\mathrm m\)`,
          raw`Use equation (17), \(\Omega=2\theta_1\) and \(W_0=2L\tan\theta_1\). The graph gives \(\theta_1\approx6^\circ\), so \(\Omega\approx12^\circ\) and \(W_0\approx2(0.80\,\mathrm m)\tan6^\circ\approx0.17\,\mathrm m\).`))],

    ['grating-observe', 'theory', t('10.4 · จากสองช่องสู่เกรตติง', '10.4 · From two slits to a diffraction grating'),
      diagram('multi-slit-intensity', t('เปรียบเทียบ 2, 5 และ 100 ช่อง โดยให้ความสูงยอดกลางเท่ากับ 1 ทุกกราฟ', 'Compare 2, 5 and 100 slits with each central peak normalized to 1.'), 'multi-slit') +
      p('เมื่อใช้แสงเดิมและคงความกว้างช่องกับระยะห่างระหว่างช่องไว้ ยอดสว่างหลักอยู่ที่มุมเดิม แต่แคบและคมขึ้นเมื่อแสงผ่านช่องมากขึ้น เกรตติงคือแผ่นที่มีช่องหรือร่องขนานจำนวนมากเรียงห่างเท่า ๆ กัน', 'With wavelength, slit width and slit separation fixed, more illuminated slits narrow the principal peaks at the same angles. A grating has many parallel, equally spaced slits or grooves.') +
      photo('ipst-10-13-grating-patterns', 'สสวท. รูป 10.13 เลเซอร์สีแดงและแสงขาวผ่านเกรตติง', 'IPST Figure 10.13. Red laser light and white light through a grating.') +
      note('เมื่อเปลี่ยนจากเลเซอร์สีเดียวเป็นแสงขาว กลางกับด้านข้างต่างกันอย่างไร?', 'How do the centre and sides change when white light replaces the laser?', 'แถบกลางรวมทุกสีเป็นแสงขาว ด้านข้างแยกเป็นสเปกตรัม', 'All wavelengths overlap at the centre, forming white light. Off-axis orders separate into spectra.')],

    ['grating-proof', 'theory', t('ระยะช่อง เงื่อนไขสว่าง และอันดับสูงสุด', 'Slit separation, bright orders and the highest order'),
      photo('ipst-10-12-grating-geometry', 'สสวท. รูป 10.12 เปรียบเทียบทางเดินจากช่องที่อยู่ติดกัน', 'IPST Figure 10.12. Compare the paths from adjacent slits.') +
      p(raw`ถ้าเกรตติงมี \(N\) ช่องต่อหนึ่งหน่วยความยาว ระยะจากกึ่งกลางช่องหนึ่งถึงอีกช่องหนึ่งคือส่วนกลับ เช่น 500 ช่อง/mm ให้ \(d=(1\ \mathrm{mm})/500=2.00\ \mathrm{\mu m}\)`, raw`If the line density is \(N\) slits per unit length, the centre-to-centre separation is its reciprocal. For example, 500 lines/mm gives \(d=(1\ \mathrm{mm})/500=2.00\ \mathrm{\mu m}\).`) +
      formula(18) +
      p(raw`แสงตกตั้งฉากทำให้คลื่นจากทุกช่องเริ่มเฟสตรงกัน ในแนวไกล ผลต่างทางเดินระหว่างช่องติดกันคือ \(d\sin\theta_m\) เมื่อเท่ากับจำนวนเต็มเท่าของ \(\lambda\) ทุกช่องจึงเสริมกัน`, raw`For normal illumination the slit waves start in phase. In the far field the path difference between neighbours is \(d\sin\theta_m\). An integer multiple of \(\lambda\) puts all the slit contributions in phase.`) +
      formula(19) +
      p(raw`แนวกลางมี \(m=0\) ส่วนแถบด้านข้างบนฉากด้านหน้ามี \(0<\theta_m<90^\circ\) ถ้า \(m\lambda=d\) แนวแสงขนานกับฉากและจะไม่ตัดฉากที่ระยะจำกัด`, raw`The centre is \(m=0\). Off-axis fringes on a forward screen require \(0<\theta_m<90^\circ\). If \(m\lambda=d\), the ray is parallel to the screen and does not meet it at a finite position.`) + formula(20) +
      p(raw`ที่อันดับเดียวกัน \(m>0\) แสงที่มีความยาวคลื่นมากกว่าเบนออกจากกลางมากกว่า จึงใช้ \(\lambda_{\max}\) ตรวจว่าเห็นครบช่วงหรือไม่ ถ้าสองสีซ้อนกันที่มุมเดียวกัน ผลคูณ \(m\lambda\) เท่ากัน`,
        raw`At a fixed positive order, a longer wavelength lies farther from the centre. Use \(\lambda_{\max}\) to check whether a whole spectrum fits. Coincident colours have the same \(m\lambda\).`)],

    ['grating-laser', 'examples', t('ตัวอย่าง 10.4 · จากจำนวนช่องไปถึงตำแหน่งบนฉาก', 'Worked examples 10.4 · From line density to screen position'),
      example(t('เลเซอร์ 600 nm ผ่านเกรตติง 500 ช่อง/mm', '600 nm laser through a 500 lines/mm grating'),
        t('ฉากอยู่ห่าง 1.00 m จงหามุมและตำแหน่งแถบสว่างอันดับ 1 แล้วตรวจว่าอันดับ 4 เกิดบนฉากด้านหน้าได้หรือไม่', 'A screen is 1.00 m away. Find the angle and position of the first order, then decide if order 4 can reach a forward screen.'),
        p(raw`จาก (18) ได้ \(d=2.00\ \mathrm{\mu m}\) ใช้ (19) ได้ \(\sin\theta_1=0.300\) จึงได้ \(\theta_1=17.46^\circ\) และจาก (5) ได้ \(x_1=1.00\tan(17.46^\circ)\approx31.4\ \mathrm{cm}\) ส่วนอันดับ 4 ต้องการ \(4\lambda/d=1.20\) ขัดกับ (20) ดังนั้นอันดับสูงสุดคือ 3 และแถบรวมเป็น 7 ถ้าฉากกว้างพอ`, raw`Equation (18) gives \(d=2.00\ \mathrm{\mu m}\). From (19), \(\sin\theta_1=0.300\), so \(\theta_1=17.46^\circ\). From (5), \(x_1=1.00\tan(17.46^\circ)\approx31.4\ \mathrm{cm}\). Order 4 requires \(4\lambda/d=1.20\), which fails (20). The highest order is 3, giving seven fringes on a sufficiently wide screen.`)) +
      example(t('อ่านไม้เมตรโดยใช้พิกัดกลาง', 'Read a scale using the centre coordinate'),
        t('แนวกลางอ่านได้ 50.0 cm และสว่างอันดับ 1 อ่านได้ 70.0 cm ฉากห่าง 1.00 m ใช้เกรตติง 300 ช่อง/mm จงหา λ', 'The central fringe reads 50.0 cm and first order reads 70.0 cm. The screen is 1.00 m away and the grating has 300 lines/mm. Find λ.'),
        p(raw`ใช้ (14) ได้ \(x_1=20.0\ \mathrm{cm}\) ใช้ (5) หามุมจาก \(\tan\theta_1=0.200\) และได้ \(\sin\theta_1\approx0.1961\) จาก (18) และ (19) ได้ \(\lambda=d\sin\theta_1\approx654\ \mathrm{nm}\)`, raw`Equation (14) gives \(x_1=20.0\ \mathrm{cm}\). Equation (5) gives \(\tan\theta_1=0.200\), hence \(\sin\theta_1\approx0.1961\). From (18) and (19), \(\lambda=d\sin\theta_1\approx654\ \mathrm{nm}\).`))],

    ['grating-spectrum', 'examples', t('ตัวอย่าง 10.4 · สเปกตรัมครบช่วงและเส้นที่ซ้อนกัน', 'Worked examples 10.4 · Complete spectra and overlapping lines'),
      example(t('แสงขาวช่วง 400–700 nm', 'White light, 400–700 nm'),
        t('เกรตติงมี 500 ช่อง/mm ฉากห่าง 1.00 m จงหาอันดับสูงสุดที่เห็นครบช่วงบนฉากที่กว้างพอ และความกว้างสเปกตรัมอันดับ 1 ด้านเดียว', 'A 500 lines/mm grating is 1.00 m from a sufficiently wide screen. Find the highest complete order and the width of the first-order spectrum on one side.'),
        p(raw`จาก (18) ได้ \(d=2000\ \mathrm{nm}\) จาก (20) \(m<2000/700\approx2.86\) จึงได้ครบถึงอันดับ 2. สำหรับอันดับ 1 ใช้ (19) ได้ \(\sin\theta_{400}=0.200\) และ \(\sin\theta_{700}=0.350\) จาก (5) ตำแหน่งขอบอยู่ที่ 20.4 และ 37.4 cm ตามลำดับ จึงกว้างประมาณ 17.0 cm`, raw`Equation (18) gives \(d=2000\ \mathrm{nm}\). From (20), \(m<2000/700\approx2.86\), so order 2 is the last complete one. For order 1, (19) gives \(\sin\theta_{400}=0.200\) and \(\sin\theta_{700}=0.350\). From (5), the edges are at 20.4 and 37.4 cm, giving a width of about 17.0 cm.`)) +
      example(t('สองสีอยู่ที่ตำแหน่งเดียวกัน', 'Two colours at the same position'),
        t('แสง 600 nm อันดับ 2 ซ้อนกับแสงอีกสีอันดับ 3 ในเกรตติงแผ่นเดิม แสงอีกสีนั้นมีความยาวคลื่นเท่าไร?', 'The second order of 600 nm light coincides with the third order of another colour on the same grating. Find that wavelength.'),
        p(raw`จาก (19) ทั้งสองสีมี \(d\) และ \(\theta\) เท่ากัน จึงได้ \(2(600\ \mathrm{nm})=3\lambda\) ดังนั้น \(\lambda=400\ \mathrm{nm}\)`, raw`From (19), both colours share \(d\) and \(\theta\), so \(2(600\ \mathrm{nm})=3\lambda\). Hence \(\lambda=400\ \mathrm{nm}\).`))],
    ...[[...formulaGroups[0].slice(0,8)], [...formulaGroups[0].slice(8)], formulaGroups[1]].map((group, i) => [
      `formula-summary-${i + 1}`, 'theory',
      t(['สรุปสมการ · สลิตคู่และตำแหน่ง', 'สรุปสมการ · วัดและเทียบแถบ', 'สรุปสมการ · สลิตเดี่ยวและเกรตติง'][i],
        ['Formula summary · Double-slit positions', 'Formula summary · Fringe measurements', 'Formula summary · Single slit and grating'][i]),
      `<div class="summary-grid">` + group.map(([n, thai, english, tex]) =>
        `<div>${p(thai, english)}${eq(n, tex, filled)}</div>`).join('') + '</div>',
    ]),
  ];
}
