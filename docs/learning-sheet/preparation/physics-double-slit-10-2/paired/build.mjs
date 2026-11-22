import {readFileSync as read,writeFileSync as write,mkdirSync,existsSync,readdirSync,unlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {parseHTML} from 'linkedom';import {pages,noteSourceFiles} from './notes.mjs';
import {addFormulaRecall,formulaRecallCSS} from '../../numbered-formula-recall.mjs';
import {sampleTrials} from './lab-sample.mjs';
import {prepareExerciseWorking} from './equation-starts.mjs';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../../../../..'),out=resolve(root,'public/content/physics/ipst/wave-optics');
const require=createRequire(resolve(root,'tools/pdf-authoring/package.json'));
const mjRoot=process.env.HUB_MATHJAX_ROOT||resolve(root,'tools/pdf-authoring/node_modules/mathjax-full');
const {mathjax}=require(mjRoot+'/js/mathjax.js'),{TeX}=require(mjRoot+'/js/input/tex.js'),{SVG}=require(mjRoot+'/js/output/svg.js'),{liteAdaptor}=require(mjRoot+'/js/adaptors/liteAdaptor.js'),{RegisterHTMLHandler}=require(mjRoot+'/js/handlers/html.js');require(mjRoot+'/js/input/tex/ams/AmsConfiguration.js');
if(mathjax.version!=='3.2.2')throw Error('Use the existing PDF-authoring dependency MathJax 3.2.2.');
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);const math=mathjax.document('',{InputJax:new TeX({packages:['base','ams']}),OutputJax:new SVG({fontCache:'none'})});
const hash=x=>createHash('sha256').update(x).digest('hex');const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const assetRel='assets/10-2-paired',assetDir=out+'/'+assetRel;mkdirSync(assetDir,{recursive:true});const inventory=new Map();
function asset(bytes,ext){const sha=hash(bytes),file=sha.slice(0,24)+'.'+ext,path=assetDir+'/'+file;if(!existsSync(path))write(path,bytes);inventory.set(file,{file,sha256:sha});return assetRel+'/'+file;}
function mathSvg(tex){
 const markup=adaptor.outerHTML(math.convert(tex,{display:false}));
 if(/merror|data-mjx-error/.test(markup))throw Error(tex);
 const svg=parseHTML('<html><body>'+markup+'</body></html>').document.querySelector('svg');
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
 return svg;
}
function renderDiagramLabels(doc,diagram){
 for(const label of diagram.querySelectorAll('text[data-tex]')){
  const tex=label.getAttribute('data-tex');
  const svg=doc.importNode(mathSvg(tex),true);
  const [,top,width,height]=(svg.getAttribute('viewBox')||svg.getAttribute('viewbox')).split(/\s+/).map(Number);
  const scale=Number(label.getAttribute('font-size'))/1000;
  const offset={start:0,middle:width/2,end:width}[label.getAttribute('text-anchor')];
  svg.setAttribute('x',String(Number(label.getAttribute('x'))-offset*scale));
  svg.setAttribute('y',String(Number(label.getAttribute('y'))+top*scale));
  svg.setAttribute('width',String(width*scale));
  svg.setAttribute('height',String(height*scale));
  svg.removeAttribute('style');
  svg.setAttribute('data-tex',tex);
  label.replaceWith(svg);
 }
}
function render(html){const doc=parseHTML('<html><body>'+html+'</body></html>').document;doc.body.normalize();
 function walk(node){for(const c of [...node.childNodes]){if(c.nodeType===1){walk(c);continue;}if(c.nodeType!==3)continue;const text=c.textContent,matches=[...text.matchAll(/\\\(([\s\S]*?)\\\)/g)];if(!matches.length)continue;let i=0;const nodes=[];
 for(const m of matches){nodes.push(doc.createTextNode(text.slice(i,m.index)));const tex=m[1],s=mathSvg(tex);const src=asset(s.outerHTML,'svg');const span=doc.createElement('span');span.className='mj-asset';span.setAttribute('role','math');span.setAttribute('aria-label',tex);span.dataset.tex=tex;span.innerHTML=`<img class="math-svg" src="${src}" alt="" style="width:${s.getAttribute('width')};height:auto;${s.getAttribute('style')||''}">`;nodes.push(span);i=m.index+m[0].length;}
 nodes.push(doc.createTextNode(text.slice(i)));c.replaceWith(...nodes);}}
 walk(doc.body);
 for(const svg of [...doc.querySelectorAll('svg')]){if(svg.hasAttribute('viewbox')){svg.setAttribute('viewBox',svg.getAttribute('viewbox'));svg.removeAttribute('viewbox');}svg.setAttribute('xmlns','http://www.w3.org/2000/svg');renderDiagramLabels(doc,svg);const img=doc.createElement('img');img.setAttribute('src',asset(svg.outerHTML,'svg'));img.className='diagram-svg';img.setAttribute('alt',svg.getAttribute('aria-label')||svg.querySelector('title')?.textContent||'Double-slit fringe ruler');svg.replaceWith(img);}
 if(/\\[()]/.test(doc.body.textContent))throw Error('Unrendered TeX remains in the paired document');
 return doc.body.innerHTML;
}
const exercises=JSON.parse(read(here+'/exit-exercises.json','utf8'));
let css=read(here+'/paired.css','utf8');
const classroomSource={file:'Physics_10_2_Double_Slit_Classroom_Note_TH_EN_R03.html',sha256:'ac1bbecfb417308047b7b1799f0d36b3007ab6a2e048dbb45436cbb61e58d46d'};
const modelHash=hash(Buffer.concat(noteSourceFiles.map(p=>read(here+'/'+p)))),rendered={};for(const lang of ['th','en'])rendered[lang]=pages.map(p=>({...p,content:render(`<section class="shared-note" data-note-key="${p.key}" data-note-kind="${p.kind}">${p.html[lang].match(/^<h1>[\s\S]*?<\/h1>/)?.[0]||''}<h2>${p.title[lang]}</h2>${p.html[lang].replace(/^<h1>[\s\S]*?<\/h1>/,'')}</section>`)}));
const nameLine=lang=>`<p class="identity">${lang==='th'?'ชื่อ':'Name'} <span class="identity-name">........................................................................................................................</span> ${lang==='th'?'ห้อง':'Class'} <span class="identity-class">....................</span></p>`;
function page(body,lang,edition,kind){return `<section class="page ${kind}"><header class="running-head"><span>PHYSICS · 10.2 · ${lang==='th'?'สลิตคู่':'Double slit'}</span><span>${kind==='review'?'Revision Notes':kind==='lesson'?'Classroom Note':'Exit Ticket'} · ${edition==='answers'?(lang==='th'?'เฉลย':'Answers'):(lang==='th'?'เรียนรู้ / ลงมือทำ':'Learn / practise')}</span></header><div class="page-body">${body}</div><footer class="page-foot"><span>Nix-century</span><span data-page-number></span></footer></section>`;}
const formulaCues=[
 ['ความต่างเฟสจากผลต่างทางเดิน','Phase difference from path difference'],
 ['เงื่อนไขแถบสว่าง','Bright-fringe condition'],
 ['เงื่อนไขแถบมืด','Dark-fringe condition'],
 ['ผลต่างทางเดินจากมุม','Path difference from the angle'],
 ['มุมจากตำแหน่งบนฉาก','Angle from screen position'],
 ['ผลต่างทางเดินจากตำแหน่งบนฉาก','Path difference from screen position'],
 ['ตำแหน่งแถบสว่างอันดับที่กำหนด','Position of a chosen bright fringe'],
 ['ตำแหน่งแถบมืดอันดับที่กำหนด','Position of a chosen dark fringe'],
 ['ระยะระหว่างแถบสว่างติดกัน','Spacing between adjacent bright fringes'],
 ['อัตราส่วนระยะแถบเมื่อเปลี่ยนการตั้งค่า','Fringe-spacing ratio when the setup changes'],
 ['อัตราเร็ว ความถี่ และความยาวคลื่น','Wave speed, frequency and wavelength'],
 ['อัตราส่วนระยะแถบเมื่อเปลี่ยนความถี่','Fringe-spacing ratio when frequency changes'],
 ['หาระยะแถบจากการวัดหลายช่วง','Fringe spacing from several intervals'],
 ['ระยะห่างระหว่างสองตำแหน่งบนฉาก','Distance between two screen positions'],
 ['ร้อยละความต่างจากค่าทฤษฎี','Percentage difference relative to theory'],
];
function notePages(lang,edition,filled,kind,range='all'){return rendered[lang].flatMap(p=>{const d=parseHTML('<html><body>'+p.content+'</body></html>').document;
 if(kind==='classroom'&&range==='quiz'){const examples=[...d.querySelectorAll('.example')];if(!examples.length)return [];const section=d.querySelector('.shared-note');section.innerHTML='<h2>'+p.title[lang]+'</h2>'+examples.map(e=>e.outerHTML).join('');}
 if(kind==='classroom'&&range==='review'&&p.kind==='examples')return [];
 if(filled && p.key==='observe'){
   const table=d.querySelector('.trial-log');
   const caption=d.createElement('caption');
   caption.textContent=lang==='th'?'ตัวอย่างผล 4 ชุดแรกจากปุ่ม «วัดพอดี»':'Sample results for the first four trials from Exact measurement';
   table.prepend(caption);
   table.querySelectorAll('tbody tr').forEach((row,i)=>{
     row.children[4].textContent=String(i+1);
     row.children[5].textContent=sampleTrials[i].width;
   });
 }
 if(!filled)for(const a of d.querySelectorAll('.note-answer')){const space=d.createElement('div');space.className='note-write';a.replaceWith(space);}
 if(kind==='classroom')addFormulaRecall(d,lang,formulaCues);
 return [page(d.body.innerHTML,lang,edition,kind==='classroom'?'lesson':'review')];});}
// Explicit page groups; measured in the real browser after every content change.
const groups={blank:[['quiz-intro','cloze-A'],['cloze-B','problem-1'],['problem-2','problem-3'],['problem-4','problem-5'],['problem-6','problem-7'],['problem-8','problem-9']],answers:[['quiz-intro','cloze-A','cloze-B'],['problem-1'],['problem-2'],['problem-3'],['problem-4'],['problem-5'],['problem-6'],['problem-7'],['problem-8'],['problem-9']]};
const pastExamPages=[['a-level-2566-11'],['a-level-2568-9','practice-ipst-10-2-2c']];
for(const pages of Object.values(groups))pages.push(...pastExamPages);
const recallGroups={blank:[['recall-1','recall-2'],['recall-3','recall-4']],answers:[['recall-1','recall-2'],['recall-3'],['recall-4']]};
function quizPages(lang,edition,which){const byKey=new Map(exercises.languages[lang].map(x=>[x.key,prepareExerciseWorking(x.html,lang)]));return which.map(keys=>{const d=parseHTML('<html><body>'+keys.map(k=>byKey.get(k)).join('')+'</body></html>').document;
 if(edition==='blank'){
  d.querySelectorAll('.teacher-key,.answer-inline').forEach(x=>x.remove());
  for(const task of d.querySelectorAll('.task[data-part-key]')){
   const value=exercises.calculationChecks[task.dataset.partKey];
   if(!value)continue;
   const line=d.createElement('p');
   line.className='calculation-check';
   line.dataset.calculationCheck=task.dataset.partKey;
   const label=d.createElement('strong');
   label.textContent=lang==='th'?'ตรวจคำตอบ':'Check Answer';
   line.append(label,' '+value);
   task.querySelector(':scope > p').after(line);
  }
 }else d.querySelectorAll('.response-space,.recall-space').forEach(x=>x.remove());
 return page(render(d.body.innerHTML),lang,edition,'quiz');});}
function finish(list,lang,kind){const d=parseHTML('<html><body>'+list.join('')+'</body></html>').document;const first=d.querySelector('.page-body');let title=first.querySelector('h1');if(!title){title=d.createElement('h1');title.textContent=(kind==='classroom'?'Classroom Note':'Revision Notes')+(lang==='th'?' · 10.2 สลิตคู่':' · 10.2 Double slit');first.prepend(title);}title.insertAdjacentHTML('afterend',nameLine(lang));const all=[...d.querySelectorAll('.page')];all.forEach((p,i)=>{p.dataset.page=String(i+1);p.querySelector('[data-page-number]').textContent=(lang==='th'?'หน้า ':'Page ')+(i+1)+' / '+all.length;});return d.body.innerHTML;}
const report={modelSha256:modelHash,sources:{classroom:classroomSource,exit:exercises.source},views:[]};
for(const kind of ['classroom','exit']){const ranges=['all','quiz','review'];let views='';
 for(const lang of ['th','en']){let editions='';for(const edition of ['blank','answers']){const notes=notePages(lang,edition,kind==='exit'||edition==='answers',kind);const quiz=kind==='exit'?quizPages(lang,edition,groups[edition]):[];const recall=kind==='exit'?quizPages(lang,edition,recallGroups[edition]):[];let rs='';for(const range of ranges){const selected=kind==='classroom'?notePages(lang,edition,edition==='answers',kind,range):range==='quiz'?[...quiz,...recall]:range==='review'?notes:[...quiz,...notes,...recall];const content=finish(selected,lang,kind);report.views.push({kind,lang,edition,range,pages:selected.length});rs+=`<div class="document-shell" data-revision-range="${range}">${content}</div>`;}editions+=`<div data-revision-edition="${edition}">${rs}</div>`;}views+=`<section class="language-view" data-content-lang="${lang}" lang="${lang}"${lang==='en'?' hidden':''}>${editions}</section>`;}
 const labels=kind==='classroom'?['Classroom Note','Classroom Note']:['Exit Ticket Revision','Exit Ticket Revision'];
 const attrs={'lang':'th','data-learning-html':'','data-exit-ticket-revision':'1','data-exit-ticket-editions':'1','data-exit-ticket-ranges':ranges.join(' '),'data-revision-topic':'10.2','data-content-revision':kind==='exit'?'1.3.4':'1.3.3','data-rules-version':'1.5','data-source-sha256':(kind==='classroom'?classroomSource:exercises.source).sha256,'data-shared-notes-sha256':modelHash,'data-revision-student-default':'1','data-revision-label-th':labels[0],'data-revision-label-en':labels[1],'data-revision-quiz-th':kind==='classroom'?'เฉพาะตัวอย่างพาทำ':'ควิซและ Recall','data-revision-quiz-en':kind==='classroom'?'Guided examples':'Quiz and Recall','data-revision-review-th':kind==='classroom'?'ทฤษฎีและการทดลอง':'Revision Notes ฉบับอ่านครบ','data-revision-review-en':kind==='classroom'?'Theory and experiment':'Complete Revision Notes','data-print-subject-th':'ฟิสิกส์','data-print-subject-en':'Physics','data-print-chapter-th':'แสงเชิงคลื่น','data-print-chapter-en':'Wave optics','data-print-topic-th':'10.2 สลิตคู่','data-print-topic-en':'10.2 Double slit'};
 const filename=kind==='classroom'?'10-2-double-slit-classroom-note-v1-3.html':'10-2-double-slit-exit-ticket-revision-v1-3.html';
 write(out+'/'+filename,`<!doctype html>\n<html ${Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Physics 10.2 · ${labels[0]}</title><style>${css}${kind==='exit'?'\n.calculation-check{margin:.7mm 0 0;font-size:9.5pt;line-height:1.3;color:#254959}.calculation-check strong{margin-inline-end:.2em}.page.quiz .question:has(.calculation-check)>.task-grid{grid-auto-rows:auto}.page.quiz:has([data-calculation-check="problem-6-3"]) .task>.response-space{min-height:20mm}':formulaRecallCSS}</style></head><body><main>${views}</main></body></html>\n`);
}
// Retain published assets for older handout versions and cached readers.
for(const file of readdirSync(assetDir))if(!inventory.has(file))inventory.set(file,{file,sha256:hash(read(assetDir+'/'+file))});
write(here+'/build-record-v1.3.json',JSON.stringify({...report,assets:[...inventory.values()]},null,2)+'\n');console.log(JSON.stringify({views:report.views,assets:inventory.size}));
