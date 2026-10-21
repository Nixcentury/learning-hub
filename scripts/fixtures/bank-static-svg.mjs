// Deliberately reuse IDs across all instances to exercise image-local defs.
export const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="150" viewBox="0 0 340 150" role="img" aria-label="ลูกศรแสดงการเปลี่ยนจาก A ไป B">
<title>A to B · ลูกศร</title><desc>Static vector shapes and text</desc>
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#174e70"/></marker>
  <linearGradient id="shade"><stop offset="0%" stop-color="#e1f2ff"/><stop offset="100%" stop-color="#82c6ef"/></linearGradient>
  <clipPath id="clip"><rect x="10" y="10" width="320" height="130" rx="12"/></clipPath>
  <symbol id="atom" viewBox="-24 -24 48 48"><circle cx="0" cy="0" r="22" fill="url(#shade)" stroke="#174e70" stroke-width="2"/></symbol>
</defs>
<g clip-path="url(#clip)"><rect x="10" y="10" width="320" height="130" rx="12" fill="#f7fbff"/>
<use href="#atom" x="41" y="51" width="48" height="48"/><use href="#atom" x="251" y="51" width="48" height="48"/>
<path d="M105 75H235" fill="none" stroke="#174e70" stroke-width="4" marker-end="url(#arrow)"/>
<text x="65" y="81" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">A</text>
<text x="275" y="81" text-anchor="middle" font-family="Arial,sans-serif" font-size="18">B</text>
<text x="170" y="125" text-anchor="middle" font-family="Arial,sans-serif" font-size="16">A → B</text></g></svg>`;

export const legacySvgQuestions = `<div class="question-step" data-ans="A">
<h3>SVG ทดสอบ 1: จากภาพ ลูกศรชี้จาก A ไป B ใช่หรือไม่<br>${svg}</h3>
<p>ตัวอย่าง SVG ในบริบทประกอบโจทย์</p>${svg}
<div class="options"><label><input type="radio" value="A">ชี้จาก A ไป B ${svg}</label>
<label><input type="radio" value="B">ชี้จาก B ไป A ${svg}</label></div>
<div class="hint-box">ดูหัวลูกศร ${svg}</div>
<div class="feedback-box"><b>เฉลย: ชี้จาก A ไป B</b>${svg}</div></div>
<div class="question-step" data-ans="A"><h3>SVG ทดสอบ 2: รูปใดเป็นโวลต์มิเตอร์</h3>
<div class="options"><label><input type="radio" value="A">โวลต์มิเตอร์ <img src="https://nixcentury.github.io/learning-hub/content/samples/assets/meter-v.svg" alt="สัญลักษณ์โวลต์มิเตอร์"></label>
<label><input type="radio" value="B">แอมมิเตอร์ <img src="https://nixcentury.github.io/learning-hub/content/samples/assets/meter-a.svg" alt="สัญลักษณ์แอมมิเตอร์"></label></div>
<div class="hint-box">ตัวอักษร V หมายถึงโวลต์</div>
<div class="feedback-box">เฉลย: โวลต์มิเตอร์ <img src="https://nixcentury.github.io/learning-hub/content/samples/assets/meter-v.svg" alt="สัญลักษณ์โวลต์มิเตอร์"></div></div>`;
