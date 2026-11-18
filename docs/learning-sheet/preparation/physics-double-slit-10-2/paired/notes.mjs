import {parseHTML} from 'linkedom';
import intro from './intro-v1.3.json' with {type:'json'};
import originalExamples from './examples-v1.2.json' with {type:'json'};
import {proofPages} from './proofs.mjs';
import {equationStart,exampleReferences,separateWorkingMath} from './equation-starts.mjs';
import {workedVisual} from './note-diagrams.mjs';

// One canonical teacher answer Note supplies both Classroom Note and Revision Notes.
const groups=[[1,2],[3],[4,5],[6,7],[8,9,10],[11,12]];

const separationExplanation = {
  th: [
    'กำหนดให้แถบสว่างกลางอยู่ที่พิกัดศูนย์ ด้านขวาเป็นบวกและด้านซ้ายเป็นลบ หาพิกัดของทั้งสองแถบก่อน แล้วใช้ค่าสัมบูรณ์ของผลต่างเป็นระยะห่าง',
    'ระยะห่างแถบสว่างติดกัน 1 ช่วงคือ 4.0 มม. สว่างอันดับ 1 จึงห่างจากกลาง 4.0 มม. มืดอันดับ 2 อยู่กึ่งกลางระหว่างสว่างอันดับ 1 กับ 2 จึงห่างจากกลาง 1.5 ช่วง หรือ 6.0 มม. ส่วนสว่างอันดับ 3 ห่างจากกลาง 3 ช่วง หรือ 12 มม.',
  ],
  en: [
    'Set the central bright fringe at zero. Coordinates are positive to the right and negative to the left. Find both coordinates first, then take the absolute difference to get the separation.',
    'One bright-fringe spacing is 4.0 mm. Bright order 1 is 4.0 mm from the centre. Dark order 2 is halfway between bright orders 1 and 2, so it is 1.5 spacings, or 6.0 mm, from the centre. Bright order 3 is three spacings, or 12 mm, from the centre.',
  ],
};
const separationCases = [
  {
    th: '① ด้านเดียวกัน · เลือกสว่างอันดับ 1 และมืดอันดับ 2 ทางขวาทั้งคู่ พิกัดจึงเป็นบวกทั้งสองค่า',
    en: '① Same side · Take bright order 1 and dark order 2 on the right, so both coordinates are positive.',
    math: String.raw`\mathrm{separation}=|(+6.0)-(+4.0)|\,\mathrm{mm}=2.0\,\mathrm{mm}`,
  },
  {
    th: '② คนละด้าน · เลือกสว่างอันดับ 1 ทางซ้ายและมืดอันดับ 2 ทางขวา จึงลบพิกัดลบของแถบทางซ้าย',
    en: '② Opposite sides · Take bright order 1 on the left and dark order 2 on the right. Subtract the negative coordinate of the left fringe.',
    math: String.raw`\mathrm{separation}=|(+6.0)-(-4.0)|\,\mathrm{mm}=10\,\mathrm{mm}`,
  },
  {
    th: '③ สว่างอันดับ 3 ซ้าย–ขวา · ทั้งสองแถบอยู่ห่างจากกลางเท่ากันและอยู่คนละด้าน',
    en: '③ Third bright fringe on each side · The two fringes lie equally far from the centre on opposite sides.',
    math: String.raw`\mathrm{separation}=|(+12)-(-12)|\,\mathrm{mm}=24\,\mathrm{mm}`,
  },
];

function expandSeparationAnswer(answer, lang) {
  const [coordinates, spacing] = separationExplanation[lang];
  const thinking = lang === 'th' ? 'อธิบายวิธีคิด' : 'Reasoning';
  const working = lang === 'th' ? 'วิธีทำ' : 'Working';
  answer.innerHTML = `
    <p class="method-note"><b>${thinking}</b> ${coordinates}</p>
    <p>${spacing}</p>
    ${equationStart(exampleReferences[10], lang)}
    ${separationCases.map(item => `<p>${item[lang]}<span class="math-line">\\(${item.math}\\)</span></p>`).join('')}
  `;
  answer.querySelector('.equation-citation').insertAdjacentHTML('afterbegin', `<b>${working}</b> · `);
}

const examplePages=groups.map((numbers,i)=>({
  key:'examples-'+(i+1),kind:'examples',
  title:{th:'ตัวอย่าง '+numbers[0]+'–'+numbers.at(-1),en:'Examples '+numbers[0]+'–'+numbers.at(-1)},
  html:Object.fromEntries(['th','en'].map(lang=>[lang,numbers.map(n=>{
    const original=originalExamples.languages[lang][n-1];
    let html=original.html.replaceAll('\\beta','\\Delta x');
    if(n===3)html=html.replaceAll('|x_2|','x_{\\mathrm B,2}');
    if(n===4)html=html.replaceAll('|x_m|','x_{\\mathrm D,m}');
    const {document}=parseHTML('<html><body>'+html+'</body></html>');
    const example=document.querySelector('.example');example.dataset.exampleNumber=String(n);
    const visual=workedVisual(n,lang);
    if(visual){
      const prompt=example.querySelector('h3')?.nextElementSibling;
      if(!prompt||prompt.tagName.toLowerCase()!=='p')throw Error('Example '+n+' requires a prompt paragraph');
      prompt.insertAdjacentHTML('afterend',visual);
    }
    const answer=example.querySelector('.note-answer');
    if(n===11)expandSeparationAnswer(answer,lang);
    else answer.insertAdjacentHTML('afterbegin',equationStart(exampleReferences[n-1],lang));
    if(n===4){
      const angle=[...answer.querySelectorAll('p')].find(p=>/ถ้าให้มุม|For an angle/.test(p.textContent));
      if(angle){
        const math=[...angle.textContent.matchAll(/\\\(([\s\S]*?)\\\)/g)].map(m=>m[0]);
        const labels=lang==='th'?['ถ้าให้มุม ใช้สมการ ','จัดรูปหาอันดับ:','ตัวอย่างค่ามุมที่สอดคล้องกับข้อมูล:','แทนค่าแล้วได้มืดอันดับเดิม:']:['For an angle, use equations ','Rearrange for the order:','For an angle consistent with the data:','Substitution gives the same dark order:'];
        angle.outerHTML=math.map((tex,i)=>'<p>'+labels[i]+(i===0?'<span data-equation-ref="3">(3)</span>, <span data-equation-ref="4">(4)</span>:':'')+'</p><p>'+tex+'</p>').join('');
      }
      if(lang==='en'){
        answer.innerHTML=answer.innerHTML.replace('An integer at least 1 → second dark fringe. The bright formula instead gives 1.5, which is not an allowed bright order.','Order 2 is an allowed dark order. The bright condition gives 1.5, so it fails.').replace('Rounded angle data may give an order near an integer; state “near” according to data precision. Do not round arbitrary results into orders.','For rounded data, report “near”. Never round arbitrary data into an order.').replace('Method: use the chosen fringe condition to obtain its order from position or angle, then check for an allowed integer.','Method: choose bright/dark, solve for order, then check the allowed integer range.');
      }
    }
    if(n===10)answer.querySelector('.equation-start').insertAdjacentHTML('afterend','<p class="symbol-context">'+(lang==='th'?'ในข้อนี้ เลขห้อย 1 และ 2 ของความยาวคลื่นหมายถึงแสงสีแรกและสีที่สอง ตามลำดับ':'Here, wavelength subscripts 1 and 2 refer to the first and second colours, respectively.')+'</p>');
    separateWorkingMath(answer);
    return example.outerHTML;
  }).join('')]))
}));
export const pages=[intro,...proofPages,...examplePages];
export const noteSourceFiles=['notes.mjs','proofs.mjs','proof-figures.json','intro-v1.3.json','examples-v1.2.json','equation-starts.mjs','note-diagrams.mjs'];
