import {sampleTable, sampleTrials} from './lab-sample.mjs';

const route = 'https://nixcentury.github.io/learning-hub/#physics/bank/double-slit-interference';
const context = 'data-subject-id="physics" data-chapter-id="bank" data-topic-id="b-21460452889578f11c3a8bac"';
const lab = label => `<a href="${route}/double-slit-lab" data-hub-simulation data-html-src="10-2-double-slit-lab.html" data-content-id="physics-ipst-wave-optics-10-2-double-slit-lab" ${context} data-title-th="แล็บสลิตคู่" data-title-en="Double-slit lab">${label}</a>`;
const exit = label => `<a href="${route}/exit-ticket-revision" data-hub-html data-html-src="10-2-double-slit-exit-ticket-revision-v1-3.html" data-content-id="physics-ipst-wave-optics-10-2-exit-ticket-revision" ${context} data-title-th="Exit Ticket Revision 10.2" data-title-en="Exit Ticket Revision 10.2">${label}</a>`;
const math = formula => `\\(${formula}\\)`;
const spacing = math(String.raw`W\approx\Delta x\approx|x_{\mathrm{B},1}|\approx\lambda L/d`);
const ratio = math(String.raw`W_2/W_1\approx L_2/L_1=2`);
const [, B1, C1, B2, C2] = sampleTrials;
const predictedB = (2 * Number(B1.width)).toFixed(2);
const samplePrediction = math(String.raw`2\times${B1.width}\,\mathrm{mm}=${predictedB}\,\mathrm{mm}`);
const difference = math(String.raw`|${B2.width}-${predictedB}|\,\mathrm{mm}=0.00\,\mathrm{mm}`);
const inverse = math(String.raw`\lambda\approx dW/L`);
const sampleLambda = math(String.raw`\lambda\approx\frac{(100\times10^{-6}\,\mathrm{m})(${C2.width}\times10^{-3}\,\mathrm{m})}{2\,\mathrm{m}}=6.50\times10^{-7}\,\mathrm{m}=650\,\mathrm{nm}`);
const ref = number => `<a class="equation-citation" data-equation-ref="${number}">(${number})</a>`;

export const labToExit = {
  key: 'lab-to-exit',
  kind: 'theory',
  title: {
    th: 'ใช้ผลที่วัด ทำนาย แล้วกลับไปทดลอง',
    en: 'Use your readings, predict, then return to the lab',
  },
  html: {
    th: `
<p>ชี้สามระยะบนรูปเดิมบนกระดาน ให้เพื่อนวงตำแหน่งที่ใช้วัดลงบน iPad <b>ความกว้างแถบกลาง</b> W วัดจากขอบมืดด้านหนึ่งถึงอีกด้าน <b>ระยะห่างแถบสว่าง</b> วัดจากศูนย์กลางแถบสว่างหนึ่งถึงศูนย์กลางแถบสว่างถัดไป และ <b>ระยะถึงสว่างอันดับ 1</b> วัดจากกลางฉากถึงศูนย์กลางแถบสว่างแรกด้านใดด้านหนึ่ง</p>
<p>ในซิมสองช่องเริ่มเฟสตรงกัน เมื่อฉากไกลและมุมเล็ก สมการพิกัดสว่างและมืดให้ ${spacing} ตามสมการ ${ref(7)}–${ref(9)} จึงใช้ความกว้างที่วัดแทนระยะห่างแถบสว่างได้ในกิจกรรมนี้</p>
<p>จากสูตรนี้ให้ชี้หลักฐานสามคู่ในตาราง เมื่อคงตัวแปรอื่นไว้ เพิ่มระยะสลิตทำให้แถบแคบลง ส่วนเพิ่มความยาวคลื่นหรือระยะฉากทำให้แถบกว้างขึ้น</p>
${sampleTable('th')}
<h3>ก · ใช้ชุด B อธิบายผลบนกระดาน</h3>
<p>คัดเลขบันทึกและ W ของ B ที่ 1 m และ 2 m จากหน้าแรก ใช้ค่าที่ 1 m ทำนายค่าที่ 2 m ด้วยสมการ ${ref(9)} ระบุว่าอะไรคงเดิม แล้วหาผลต่างสัมบูรณ์ระหว่างค่าที่ทำนายกับค่าที่วัดได้</p>
<div class="note-answer"><p>เมื่อสีแสงและระยะสลิตคงเดิม ${ratio} จากบันทึกตัวอย่างที่ 2 ใช้ ${B1.width} mm ที่ 1 m ทำนายได้ ${samplePrediction} เทียบกับบันทึกที่ 4 วัดได้ ${B2.width} mm ผลต่างคือ ${difference} ใช้ค่าของกลุ่มแทนค่าตัวอย่าง</p></div>
<h3>ข · ทำนายชุด C แล้วกลับไปวัด</h3>
<p>เขียนค่าที่ทำนายจาก C ที่ 1 m ก่อน ${lab('กลับไปที่แล็บ')} เลือก C และเลื่อนฉากไปที่ 2 m วัดแล้วจดเลขบันทึกและ W ใหม่ เทียบกับค่าที่ทำนาย ถ้าต่างกันให้ตรวจว่าตัววัดทั้งสองวางตรงขอบมืดที่ติดกับแถบกลางและอ่านสเกลตรงตำแหน่งหรือไม่</p>
<p>ใช้ค่าที่วัดได้ใหม่ประมาณความยาวคลื่นเป็น nm ด้วย ${inverse} แล้วเปรียบเทียบกับค่าที่ระบุบนปุ่มเลเซอร์แดง</p>
<div class="note-answer"><p>ระยะฉากเพิ่มเป็นสองเท่า จึงทำนาย W จากบันทึกที่ 3 เป็น 2 × ${C1.width} = ${C2.width} mm บันทึกที่ 5 ได้ ${C2.width} mm ใช้ ${sampleLambda} ค่าที่ตั้งไว้คือ 650 nm คำตอบของแต่ละกลุ่มขึ้นกับตำแหน่งที่อ่านได้</p></div>
<p><b>ลองเองใน Exit Ticket Revision</b> ${exit('เปิดชุดโจทย์')} ข้อ 6 ใช้การเปลี่ยนระยะฉาก ข้อ 7 ใช้ตารางวัดเพื่อทำนายและหาความยาวคลื่น ข้อสอบจริง A-Level ฟิสิกส์ 2566 ข้อ 11 ใช้ระยะจากกลางถึงสว่างอันดับ 1 และการคุมตัวแปร ให้ลองเขียนสมมติฐานจาก A/B และบอกว่าจะวัดระยะใด ส่วนปี 2568 ข้อ 9 ให้เชื่อมความถี่กับความยาวคลื่นในตัวกลางเดิม แล้วพิจารณาการเปลี่ยนระยะฉาก ระยะสลิต หรือความถี่ของแสง</p>`,
    en: `
<p>Point out three distances using the existing figure on the board. Have students mark the endpoints on the teacher’s iPad. <b>Central-fringe width</b> W runs between the two neighbouring dark minima. <b>Bright-fringe spacing</b> runs between two adjacent bright centres. <b>Distance to the first bright fringe</b> runs from the screen centre to the centre of the first bright fringe on either side.</p>
<p>In the lab both slits start in phase. For a distant screen and small angles, the bright- and dark-position equations give ${spacing} by equations ${ref(7)}–${ref(9)}. The measured width can therefore stand in for the bright-fringe spacing here.</p>
<p>Use the formula to explain the three comparisons in the table. With the other variables fixed, increasing slit separation narrows the fringes. Increasing wavelength or screen distance widens them.</p>
${sampleTable('en')}
<h3>A · Explain the B readings on the board</h3>
<p>Copy the trial numbers and W for B at 1 m and 2 m from page one. Use your 1 m width and equation ${ref(9)} to predict the 2 m width. State what stays fixed and find the absolute difference between prediction and measurement.</p>
<div class="note-answer"><p>With colour and slit separation fixed, ${ratio}. Sample trial 2 gives ${B1.width} mm at 1 m, so the prediction is ${samplePrediction}. Sample trial 4 gives ${B2.width} mm, so the difference is ${difference}. Use your group’s readings in place of these samples.</p></div>
<h3>B · Predict for C and return to measure</h3>
<p>Write your prediction using the C reading at 1 m before you ${lab('return to the lab')}. Choose C, move the screen to 2 m, and log the new trial number and W. Compare with your prediction. If they differ, check that both markers were on the dark positions next to the centre and that the scale was read at the correct positions.</p>
<p>Use the new reading to estimate the wavelength in nm with ${inverse}. Compare it with the value shown on the red laser selector.</p>
<div class="note-answer"><p>Doubling the screen distance predicts 2 × ${C1.width} = ${C2.width} mm from trial 3. Trial 5 gives ${C2.width} mm. Use ${sampleLambda}. The configured wavelength is 650 nm. Groups’ results depend on the positions they read.</p></div>
<p><b>Try the Exit Ticket Revision</b> ${exit('Open the practice set')} Problem 6 changes the screen distance. Problem 7 uses a measurement table to predict and estimate the wavelength. A-Level Physics 2566 (2023), Q11, uses the centre-to-first-bright distance and controlled variables. Write a hypothesis from A/B and say which distance you would measure. For 2568 (2025) Q9, relate frequency to wavelength in the same medium, then consider changing screen distance, slit separation, or light frequency.</p>`,
  },
};
