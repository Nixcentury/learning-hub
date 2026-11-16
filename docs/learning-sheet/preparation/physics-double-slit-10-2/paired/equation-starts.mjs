import {parseHTML} from 'linkedom';
import {proofPages} from './proofs.mjs';

// Read the actual numbered formulas, rather than maintaining a second formula list.
const equations=new Map();
for(const page of proofPages){
  const {document}=parseHTML('<html><body>'+page.html.th+'</body></html>');
  for(const box of document.querySelectorAll('[data-equation]')){
    const n=Number(box.dataset.equation);
    if(equations.has(n))throw Error('Duplicate equation '+n);
    equations.set(n,box.querySelector('.equation-box').textContent);
  }
}
export function equationStart(numbers,lang){
  const {document}=parseHTML('<html><body><div class="equation-start"></div></body></html>');
  const start=document.querySelector('.equation-start');
  const citation=document.createElement('p');citation.className='equation-citation';
  citation.append(lang==='th'?'ใช้สมการ ':'Use equation'+(numbers.length>1?'s ':' '));
  numbers.forEach((n,i)=>{
    if(!equations.has(n))throw Error('Unknown equation '+n);
    if(i)citation.append(', ');
    const span=document.createElement('span');span.dataset.equationRef=String(n);span.textContent='('+n+')';citation.append(span);
  });
  start.append(citation);
  for(const n of numbers){
    const line=document.createElement('div');line.className='derivation-line';line.textContent=equations.get(n);start.append(line);
  }
  return start.outerHTML;
}
export function separateWorkingMath(root){
  // Preserve each original TeX expression and the prose, while displaying formulas on their own lines.
  function visit(node){
    for(const child of [...node.childNodes]){
      if(child.nodeType===1){if(!child.matches('.derivation-line,.math-line'))visit(child);continue;}
      if(child.nodeType!==3)continue;
      const source=child.textContent,matches=[...source.matchAll(/\\\(([\s\S]*?)\\\)/g)];
      if(!matches.length)continue;
      const nodes=[];let i=0;
      for(const m of matches){
        nodes.push(root.ownerDocument.createTextNode(source.slice(i,m.index)));
        const span=root.ownerDocument.createElement('span');span.className='math-line';span.textContent='\\('+wrapLongEquation(m[1])+'\\)';nodes.push(span);i=m.index+m[0].length;
      }
      nodes.push(root.ownerDocument.createTextNode(source.slice(i)));child.replaceWith(...nodes);
    }
  }
  visit(root);
}
function wrapLongEquation(tex){
  if(tex.length<95||tex.includes('\\begin'))return tex;
  const points=[];let depth=0;
  for(let i=0;i<tex.length;i++){
    if(tex[i]==='{'){depth++;continue;}if(tex[i]==='}'){depth--;continue;}
    if(depth)continue;
    const op=tex.slice(i).match(/^(?:=|\\approx\b|\\Rightarrow\b|\\Longrightarrow\b|\\equiv\b)/)?.[0];
    if(op){points.push({i,op});i+=op.length-1;}
  }
  if(points.length<2)return tex;
  let result='',from=0;
  for(const [index,p] of points.entries()){result+=tex.slice(from,p.i)+(index?'\\\\&':'&')+p.op;from=p.i+p.op.length;}
  return '\\begin{aligned}'+result+tex.slice(from)+'\\end{aligned}';
}
export const exampleReferences=[[2,3],[1],[7],[8],[13],[9,13],[1,6],[12],[10],[7,8],[14],[2,4,5]];
export const exerciseReferences={
  'problem-2-1':[2],'problem-2-2':[3],'problem-2-3':[2,3],
  'problem-3-1':[9],'problem-3-2':[7],'problem-3-3':[8],
  'problem-4-1':[13],'problem-4-2':[13],'problem-4-3':[8,9],
  'problem-5-1':[9],'problem-5-2':[9],'problem-5-3':[8,9],
  'problem-6-1':[10],'problem-6-2':[10],'problem-6-3':[10],
  'problem-7-1':[9],'problem-7-2':[9],'problem-7-3':[15],
  'problem-8-1':[2,4],'problem-8-2':[5],
  'problem-9-1':[9,11],'problem-9-2':[12],'problem-9-3':[10]
};
export function prepareExerciseWorking(html,lang){
  const {document}=parseHTML('<html><body>'+html+'</body></html>');
  for(const solution of document.querySelectorAll('[data-solution-key]')){
    const refs=exerciseReferences[solution.dataset.solutionKey];
    if(!refs)continue;
    const first=solution.querySelector('p');
    if(first)first.insertAdjacentHTML('afterend',equationStart(refs,lang));else solution.insertAdjacentHTML('afterbegin',equationStart(refs,lang));
    separateWorkingMath(solution);
  }
  for(const task of document.querySelectorAll('[data-recall-key]')){
    const answer=task.querySelector('.teacher-key');
    const refs=({'recall-4-4':[1,3],'recall-4-5':[7,8]})[task.dataset.recallKey];
    if(answer&&refs){
      answer.insertAdjacentHTML('afterbegin',equationStart(refs,lang));
      if(task.dataset.recallKey==='recall-4-5')answer.querySelector('.equation-start').insertAdjacentHTML('afterend','<p>'+(lang==='th'?'เลขห้อย 1 และ 2 แทนแสงสีแรกและสีที่สอง':'Subscripts 1 and 2 denote the first and second colours.')+'</p>');
    }
    const factRefs=({'recall-1-2':[2,3],'recall-2-2':[7,8],'recall-3-1':[9],'recall-4-1':[9]})[task.dataset.recallKey];
    if(answer&&factRefs){
      const {document:label}=parseHTML('<html><body>'+equationStart(factRefs,lang)+'</body></html>');
      label.querySelectorAll('.derivation-line').forEach(x=>x.remove());
      answer.insertAdjacentHTML('afterbegin',label.body.innerHTML);
    }
    if(answer)separateWorkingMath(answer);
  }
  return document.body.innerHTML;
}
