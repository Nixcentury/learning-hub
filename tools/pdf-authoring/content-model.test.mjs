import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { validateContent, validateMetadata, prepareDocument } from './content-model.mjs';

const directory=dirname(fileURLToPath(import.meta.url));
const example=resolve(directory,'examples/ionization');
const source=await readFile(resolve(example,'content.html'),'utf8');
const metadata=JSON.parse(await readFile(resolve(example,'metadata.json'),'utf8'));

test('one frozen master defines the design and shared metadata contract',async()=>{
 const root=resolve(directory,'../..');
 const lock=JSON.parse(await readFile(resolve(directory,'template.lock.json'),'utf8'));
 assert.equal(lock.templateVersion,metadata.templateVersion);
 for(const [path,expected] of Object.entries(lock.files))assert.equal(createHash('sha256').update(await readFile(resolve(root,path))).digest('hex'),expected,path);
});

test('complete TH/EN input has matching questions and required worked answers',()=>{
 assert.equal(validateMetadata(metadata),metadata);
 assert.deepEqual(validateContent(source).questionIds,['q-1','q-2','q-3']);
 assert.throws(()=>validateMetadata({...metadata,fontSize:8}),/design settings/);
 assert.throws(()=>validateContent(source.replace('data-pdf-question="q-1"','data-pdf-question="q-other"')),/same question ids/);
 assert.throws(()=>validateContent(source.replace('data-pdf-answer','data-removed-answer')),/Forbidden attribute/);
});

test('authored styles, fonts, scripts and page chrome cannot bypass the master',()=>{
 for(const fragment of ['<style>body{font-size:8pt}</style>','<script>alert(1)</script>','<header>Different header</header>','<footer>Different footer</footer>','<iframe src="https://example.com"></iframe>','<p style="font-size:8pt">small</p>','<p class="custom-font">font</p>','<p onclick="alert(1)">action</p>','<p width="1000">width</p>']){
  assert.throws(()=>validateContent(source.replace('<h2>',fragment+'<h2>')),/Forbidden|approved content classes|figures/);
 }
});

test('student output removes practice answers entirely; teacher output removes blanks',async()=>{
 for(const language of ['th','en']){
  const student=await prepareDocument(example,language,'student');
  const teacher=await prepareDocument(example,language,'teacher');
  assert.doesNotMatch(student.html,/data-pdf-answer|Worked answer|แนวคำตอบ/);
  assert.equal((student.html.match(/pdf-writing-space/g)||[]).length,3);
  assert.doesNotMatch(teacher.html,/data-pdf-space|pdf-writing-space/);
  assert.equal((teacher.html.match(/data-pdf-answer/g)||[]).length,3);
  assert.ok(teacher.html.includes(language==='th'?'แนวคำตอบ':'Worked answer'));
 }
});

test('question nesting and excessive or nonempty writing spaces are rejected',()=>{
 assert.throws(()=>validateContent(source.replace('data-pdf-space="32"','data-pdf-space="81"')),/16–80/);
 assert.throws(()=>validateContent(source.replace('<div data-pdf-space="32"></div>','<div data-pdf-space="32"><br></div>')),/empty divs/);
 assert.throws(()=>validateContent(source.replace('<div data-pdf-answer>','<div data-pdf-question="nested"><div data-pdf-answer>')),/nested/);
});

test('figures embed inside their input folder; traversal and external sources fail',async()=>{
 const temp=await mkdtemp(resolve(tmpdir(),'pdf-content-test-'));
 try{
  const input=resolve(temp,'input');await mkdir(input);
  await writeFile(resolve(input,'metadata.json'),JSON.stringify(metadata));
  const figure='<figure><img src="figure.svg" alt="Test figure" width="100" height="100"></figure>';
  await writeFile(resolve(input,'figure.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="30"/></svg>');
  await writeFile(resolve(input,'content.html'),source.replace('<h2>',figure+'<h2>'));
  assert.match((await prepareDocument(input,'th','student')).html,/data:image\/svg\+xml;base64/);
  await writeFile(resolve(temp,'outside.svg'),'<svg/>');
  for(const src of ['../outside.svg','https://example.com/figure.svg']){
   await writeFile(resolve(input,'content.html'),source.replace('<h2>',figure.replace('figure.svg',src)+'<h2>'));
   await assert.rejects(prepareDocument(input,'th','student'),/inside the input directory|local assets/);
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});
