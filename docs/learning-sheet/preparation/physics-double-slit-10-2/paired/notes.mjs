import {parseHTML} from 'linkedom';
import intro from './intro-v1.3.json' with {type:'json'};
import originalExamples from './examples-v1.2.json' with {type:'json'};
import {proofPages} from './proofs.mjs';
import {equationStart,exampleReferences,separateWorkingMath} from './equation-starts.mjs';

// One canonical teacher answer Note supplies both Classroom Note and Revision Notes.
const groups=[[1,2],[3],[4,5],[6,7],[8,9,10],[11,12]];

const workedVisuals={
  10:{file:'example-10-coincidence.svg',th:'แผนภาพตำแหน่งซ้อนกัน: มืดอันดับ 3 ของสีแรกอยู่ตรงกับสว่างอันดับ 2 ของสีที่สอง',en:'Coincident positions: dark fringe 3 of colour 1 meets bright fringe 2 of colour 2.'},
  11:{file:'example-11-separation.svg',th:'① ด้านเดียวกัน 2 mm  ② คนละด้าน 10 mm  ③ สว่างอันดับ 3 ซ้าย–ขวา 24 mm',en:'① Same side: 2 mm  ② Opposite sides: 10 mm  ③ Third bright fringes: 24 mm.'},
  12:{file:'example-12-angle.svg',th:'ใช้ sin θ หาองศาจากเงื่อนไขแทรกสอด แล้วใช้ tan θ หาตำแหน่งบนฉาก',en:'Use sin θ for the interference angle, then tan θ to find the screen position.'}
};
function workedVisual(n,lang){
  const v=workedVisuals[n];
  if(!v)return '';
  return '<figure class="note-figure compact-visual worked-visual" data-visual-example="'+n+'"><img src="assets/10-2-paired/'+v.file+'" alt="'+v[lang]+'"><figcaption>'+v[lang]+'</figcaption></figure>';
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
    if(workedVisuals[n]){
      const prompt=example.querySelector('h3')?.nextElementSibling;
      if(!prompt||prompt.tagName.toLowerCase()!=='p')throw Error('Example '+n+' requires a prompt paragraph');
      prompt.insertAdjacentHTML('afterend',workedVisual(n,lang));
    }
    const answer=example.querySelector('.note-answer');
    // The original numerical givens and all original requests/results are retained.
    // Only the common spacing symbol and the initial equation citation change.
    answer.insertAdjacentHTML('afterbegin',equationStart(exampleReferences[n-1],lang));
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
export const noteSourceFiles=['notes.mjs','proofs.mjs','proof-figures.json','intro-v1.3.json','examples-v1.2.json','equation-starts.mjs'];
