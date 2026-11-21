// Reference readouts from the simulation’s Exact measurement control, rounded to 0.01 mm.
export const sampleTrials = [
  { set: 'A', wavelength: 532, slit: 50, distance: 1, right: '5.32', width: '10.64' },
  { set: 'B', wavelength: 532, slit: 100, distance: 1, right: '2.66', width: '5.32' },
  { set: 'C', wavelength: 650, slit: 100, distance: 1, right: '3.25', width: '6.50' },
  { set: 'B', wavelength: 532, slit: 100, distance: 2, right: '5.32', width: '10.64' },
  { set: 'C', wavelength: 650, slit: 100, distance: 2, right: '6.50', width: '13.00' },
];

export function sampleTable(lang) {
  const th = lang === 'th';
  const caption = th ? 'ตัวอย่างผลจากปุ่ม «วัดพอดี» ตามแบบจำลอง' : 'Sample model readings from Exact measurement';
  const headings = th
    ? ['บันทึก', 'ชุด', 'λ (nm)', 'd (μm)', 'ระยะฉาก (m)', 'ซ้าย (mm)', 'ขวา (mm)', 'กว้าง (mm)']
    : ['Record', 'Set', 'λ (nm)', 'd (μm)', 'Screen (m)', 'Left (mm)', 'Right (mm)', 'Width (mm)'];
  const rows = sampleTrials.map(({ set, wavelength, slit, distance, right, width }, i) =>
    `<tr><th scope="row">${i + 1}</th><td>${set}</td><td>${wavelength}</td><td>${slit}</td><td>${distance}</td><td>−${right}</td><td>+${right}</td><td>${width}</td></tr>`
  );
  return `<table class="tbl lab-sample"><caption>${caption}</caption><thead><tr>${headings.map(title=>`<th scope="col">${title}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}
