import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parseHTML } from 'linkedom';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/mhchem/MhchemConfiguration.js';
import { normalizePrintMetadata } from '../../js/print-metadata.js';
import { prepareDocument, templateVersion } from './content-model.mjs';

const directory=dirname(fileURLToPath(import.meta.url)),root=resolve(directory,'../..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){if(!['--input','--out','--language','--edition'].includes(args[i])||!args[i+1])throw Error('Use --input DIR --out DIR --language th|en --edition student|teacher');options[args[i].slice(2)]=args[i+1];}
if(!options.input||!options.out)throw Error('Both --input and --out are required.');
const lockBytes=await readFile(resolve(directory,'template.lock.json'));
const lock=JSON.parse(lockBytes);
if(mathjax.version!==lock.mathjaxVersion)throw Error(`Use MathJax ${lock.mathjaxVersion}; found ${mathjax.version}.`);
if(lock.templateVersion!==templateVersion)throw Error('Template version mismatch.');
for(const [name,sha] of Object.entries(lock.files))if(hash(await readFile(resolve(root,name)))!==sha)throw Error(`Master changed: ${name}. Use the approved master, not a redesigned copy.`);
const prepared=await prepareDocument(resolve(options.input),options.language||'th',options.edition||'student');
const labels=normalizePrintMetadata(prepared.labels);
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const tex=new TeX({packages:['base','ams','mhchem'],maxBuffer:12000});
const mathDocument=mathjax.document('',{InputJax:tex,OutputJax:new SVG({fontCache:'local'})});
const {document}=parseHTML(`<html><head></head><body>${prepared.html}</body></html>`);
// A table and its caption are one semantic block in this master.
for(const table of document.querySelectorAll('table')){
 const wrapper=document.createElement('div');wrapper.setAttribute('data-print-keep','');table.before(wrapper);wrapper.append(table);
}
document.body.normalize();
let equations=0;
function typeset(node){
 for(const child of [...node.childNodes]){
  if(child.nodeType===1){typeset(child);continue;}
  if(child.nodeType!==3)continue;
  const source=child.textContent,pattern=/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
  const matches=[...source.matchAll(pattern)];if(!matches.length)continue;
  let offset=0;const replacement=[];
  for(const match of matches){
   if(++equations>500)throw Error('Split documents above 500 equations.');
   const equation=match[1]??match[2];if(equation.length>12000)throw Error('Equation is too long.');
   if(/\\(?:require|href|htmlClass|htmlStyle|htmlId|style|class|cssId|tiny|scriptsize|footnotesize|small|large|Large|LARGE|huge|Huge|color|textcolor|fontfamily|fontsize)\b/.test(equation))throw Error('Equation styling and external packages are forbidden.');
   replacement.push(document.createTextNode(source.slice(offset,match.index)));
   const svg=adaptor.outerHTML(mathDocument.convert(equation,{display:match[1]!==undefined}));
   if(/data-mjx-error|data-mml-node="merror"/.test(svg))throw Error(`Invalid equation: ${equation}`);
   const fragment=parseHTML(`<html><body>${svg}</body></html>`).document.body.firstElementChild;
   fragment.setAttribute('data-pdf-equation',match[1]!==undefined?'display':'inline');replacement.push(fragment);
   offset=match.index+match[0].length;
  }
  replacement.push(document.createTextNode(source.slice(offset)));child.replaceWith(...replacement);
 }
}
typeset(document.body);
if(/\\[\[\]()]|\\(?:ce|frac)\{/.test(document.body.textContent))throw Error('Unrendered equation delimiters remain. Check complete TeX expressions.');
const expectedAnswers=prepared.edition==='teacher'?prepared.questionIds.length:0;
if(document.querySelectorAll('[data-pdf-answer]').length!==expectedAnswers)throw Error('Answer visibility check failed.');
const css=(await readFile(resolve(directory,'fonts.css'),'utf8'))+'\n'+await readFile(resolve(directory,'master.css'),'utf8');
const header=`<div class="pdf-running pdf-header"><span>${escape(labels.subject)}</span><span>${escape(labels.chapter)}</span><span>${escape(labels.topic)}</span></div>`;
const footer=`<div class="pdf-running pdf-footer"><span>${escape(labels.work)}</span><span>${prepared.language==='th'?'หน้า':'Page'} <b class="pdf-page-number"></b> / <b class="pdf-page-total"></b></span><span>Nix-century</span></div>`;
const html=`<!doctype html><html lang="${prepared.language}"><head><meta charset="utf-8"><meta name="author" content="Nix-century"><title>${escape(prepared.meta.title[prepared.language])}</title><style>${css}</style></head><body class="pdf-authoring">${header}${footer}${document.body.innerHTML}</body></html>`;
const out=resolve(options.out);await mkdir(out,{recursive:true});
const stem=prepared.meta.id+'-'+prepared.language+'-'+prepared.edition;
const target=resolve(out,stem+'.pdf'),snapshot=resolve(out,stem+'.html');
const temporary=await mkdtemp(resolve(tmpdir(),'hub-pdf-'));
try{
 const input=resolve(temporary,'source.html');await writeFile(input,html);
 const python=process.env.HUB_PDF_PYTHON || process.env.CODEX_PRIMARY_RUNTIME_PYTHON || 'python3';
 const result=spawnSync(python,[resolve(directory,'render_pdf.py'),input,target],{encoding:'utf8',maxBuffer:5*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error(result.stderr||result.stdout||'PDF render failed.');
 const rendered=JSON.parse(result.stdout);
 await writeFile(snapshot,html);
 const report={templateVersion,language:prepared.language,edition:prepared.edition,pages:rendered.pages,questions:prepared.questionIds,equations,metadata:labels,engine:rendered.engine,templateLockSha256:hash(lockBytes),pdfSha256:hash(await readFile(target)),paperMm:[210,297]};
 await writeFile(resolve(out,stem+'.report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({file:target,...report}));
}finally{await rm(temporary,{recursive:true,force:true});}
