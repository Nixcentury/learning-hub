import { readFile, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { parseHTML } from 'linkedom';

export const templateVersion = '1.0.0';
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tags = new Set('main section div h2 h3 h4 p ul ol li table caption thead tbody tfoot tr th td figure img figcaption strong em sub sup span a br blockquote'.split(' '));
const attributes = new Set('class lang data-pdf-content data-content-lang data-pdf-question data-pdf-answer data-pdf-space data-print-keep data-pdf-change scope colspan rowspan src alt width height href rel'.split(' '));
const classes = new Set(['pdf-example','pdf-note']);
function fail(message) { throw Error(`PDF content: ${message}`); }
function textPair(value, name) {
  if (!value || typeof value !== 'object' || Object.keys(value).sort().join(',') !== 'en,th') fail(`${name} needs exactly th and en.`);
  for (const lang of ['th','en']) if (typeof value[lang] !== 'string' || !value[lang].trim() || value[lang].length > 200 || /[<>]/.test(value[lang])) fail(`Invalid ${name}.${lang}.`);
}
export function validateMetadata(meta) {
  const keys = ['templateVersion','id','subject','chapter','topic','title','subtitle','work'];
  if (!meta || typeof meta !== 'object' || Object.keys(meta).some(key => !keys.includes(key))) fail('Only documented metadata fields are allowed; no design settings.');
  if (meta.templateVersion !== templateVersion) fail(`Use templateVersion ${templateVersion}.`);
  if (!/^[a-z][a-z0-9-]{0,100}$/.test(meta.id || '')) fail('Use a stable lowercase document id.');
  for (const key of keys.slice(2)) textPair(meta[key], key);
  return meta;
}
export function validateContent(source) {
  const {document} = parseHTML(`<html><head></head><body>${source}</body></html>`);
  const roots = document.body.querySelectorAll('[data-pdf-content]');
  if (roots.length !== 1 || roots[0].localName !== 'main' || document.body.children.length !== 1) fail('One main data-pdf-content root is required.');
  if (/<!doctype|<\/?(?:html|head)\b/i.test(source)) fail('Supply content only, without html/head wrappers.');
  for (const element of document.body.querySelectorAll('*')) {
    if (!tags.has(element.localName)) fail(`Forbidden element <${element.localName}>; the master owns layout and scripts.`);
    for (const attr of element.attributes) if (!attributes.has(attr.name)) fail(`Forbidden attribute ${attr.name}; styles/fonts/header/footer cannot be authored.`);
    if (element.className && String(element.className).split(/\s+/).some(name => !classes.has(name))) fail('Use only approved content classes.');
    if (element.hasAttribute('data-pdf-space')) {
      const height=Number(element.dataset.pdfSpace);
      if (element.localName !== 'div' || !Number.isFinite(height) || height<16 || height>80 || element.textContent.trim() || element.children.length) fail('Writing spaces must be empty divs, 16–80 mm.');
    }
    if (element.localName === 'a') {
      try {const url=new URL(element.getAttribute('href'));if(url.protocol!=='https:'||url.username||url.password) throw Error();}
      catch { fail('Document links must be real https URLs.'); }
    }
    if ((element.hasAttribute('width') || element.hasAttribute('height')) && element.localName!=='img') fail('Only figures may supply dimensions.');
    if (element.hasAttribute('data-pdf-question') && element.parentElement.closest('[data-pdf-question]')) fail('Questions cannot be nested.');
    if (element.localName==='img' && (!element.getAttribute('alt')?.trim() || !/^\d+$/.test(element.getAttribute('width')||'') || !/^\d+$/.test(element.getAttribute('height')||''))) fail('Images need alt, width and height.');
    if (element.hasAttribute('data-pdf-change') && element.localName!=='tr') fail('Change emphasis belongs on a table row.');
    if (element.hasAttribute('data-pdf-answer') && element.localName!=='div') fail('Answers must be div blocks.');
    if (element.hasAttribute('data-pdf-answer') && !element.closest('[data-pdf-question]')) fail('Answers must be inside a question.');
  }
  if ([...document.body.childNodes].some(node=>node.nodeType===3 && node.textContent.trim())) fail('All content must be inside the main root.');
  const languageBlocks=[...roots[0].children];
  if(languageBlocks.length!==2 || ['th','en'].some(lang=>languageBlocks.filter(node=>node.localName==='section' && node.dataset.contentLang===lang).length!==1)) fail('Supply one complete th block and one complete en block.');
  const ids=[];
  for(const lang of ['th','en']) {
    const block=languageBlocks.find(node=>node.dataset.contentLang===lang), seen=new Set();
    const questions=[...block.querySelectorAll('[data-pdf-question]')];
    for(const question of questions) {
      const id=question.dataset.pdfQuestion;
      if(!/^[a-z][a-z0-9-]{0,63}$/.test(id)||seen.has(id)) fail('Question ids must be stable and unique in each language.');
      seen.add(id);
      if(question.querySelectorAll('[data-pdf-answer]').length!==1 || question.querySelectorAll('[data-pdf-space]').length!==1) fail(`${id} needs exactly one answer and one writing space.`);
      if(!question.querySelector('[data-pdf-answer]').textContent.trim()) fail(`${id} has no worked answer.`);
    }
    ids.push([...seen]);
  }
  if(JSON.stringify(ids[0])!==JSON.stringify(ids[1]))fail('TH/EN must contain the same question ids in the same order.');
  return { document, root:roots[0], questionIds:ids[0] };
}
export async function prepareDocument(inputDirectory, language, edition) {
  if(!['th','en'].includes(language)||!['student','teacher'].includes(edition))fail('Use th/en and student/teacher.');
  const input=await realpath(inputDirectory);
  const meta=validateMetadata(JSON.parse(await readFile(resolve(input,'metadata.json'),'utf8')));
  const model=validateContent(await readFile(resolve(input,'content.html'),'utf8'));
  const selected=model.root.querySelector(`[data-content-lang="${language}"]`);
  for(const image of selected.querySelectorAll('img')) {
    const src=image.getAttribute('src');
    if(!src || /^(?:[a-z][\w+.-]*:|\/|\\)/i.test(src))fail('Images must be local assets within the input directory.');
    const path=await realpath(resolve(input,src));
    if(!path.startsWith(input+sep))fail('Images must stay inside the input directory.');
    const mime={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[extname(path).toLowerCase()];
    if(!mime)fail('Use SVG, PNG or JPEG figures.');
    image.setAttribute('src',`data:${mime};base64,${(await readFile(path)).toString('base64')}`);
  }
  for(const question of selected.querySelectorAll('[data-pdf-question]')) {
    question.className='pdf-question'; question.setAttribute('data-print-keep','');
    const answer=question.querySelector('[data-pdf-answer]'), blank=question.querySelector('[data-pdf-space]');
    if(edition==='student') {
      answer.remove();blank.className='pdf-writing-space';blank.setAttribute('style',`height:${Number(blank.dataset.pdfSpace)}mm`);
    }else{
      blank.remove();const label=model.document.createElement('h4');label.textContent=language==='th'?'แนวคำตอบ':'Worked answer';answer.prepend(label);
    }
  }
  const labels=Object.fromEntries(['subject','chapter','topic','work'].map(key=>[key,meta[key][language]]));
  labels.work+=' · '+(language==='th'?(edition==='student'?'นักเรียน':'เฉลย'):(edition==='student'?'Student':'Answers'));
  const identification=language==='th'?'ชื่อ ........................................ ชั้น ............ วันที่ ....../....../......':'Name ........................................ Class ............ Date ....../....../......';
  const html=`<h1>${escape(meta.title[language])}</h1><p class="pdf-lead">${escape(meta.subtitle[language])}</p><p class="pdf-identification">${identification}</p>${selected.innerHTML}`;
  return {meta,labels,html,questionIds:model.questionIds,language,edition};
}
