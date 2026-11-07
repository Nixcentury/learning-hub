import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { readFileSync } from 'node:fs';
import { createSimulationGuideTool, simulationGuideFor, simulationGuideExample, validateSimulationGuide, simulationGuideCatalog } from '../js/simulation-guide-model.js';
import { mountSimulationGuide, createSimulationGuideHighlighter } from '../js/simulation-guide.js';
import { waveMiniPlayGuide } from '../public/content/physics/ipst/wave-optics/assets/10-1-sim/guide-data.js';
import { renderLearningObjectives } from '../public/content/physics/ipst/wave-optics/assets/10-1-sim/learning-objectives.js';

const tool = { id:'content-simulation-lab', titleTh:'ทดลอง',titleEn:'Lab', source:'https://school.test/hub/content/physics/lab.html',
  context:{toolKind:'simulation',contentId:'lab',subjectId:'physics',chapterId:'10',topicId:'waves'} };
const hub='https://school.test/hub/index.html';
const html=readFileSync(new URL('../public/pages/tools/simulation-guide-player.html',import.meta.url),'utf8');

test('guide windows bind only authored simulation identities and leave other activities empty',()=>{
  assert.deepEqual(Object.keys(simulationGuideCatalog),['physics-ipst-wave-optics-10-1-mini-sim']);
  const guide=createSimulationGuideTool(tool,hub);
  assert.equal(guide.simulationGuideOwnerId,tool.id);assert.equal(guide.context.toolKind,'simulation-guide');
  assert.equal(guide.page,'https://school.test/hub/pages/tools/simulation-guide-player.html');
  assert.equal(createSimulationGuideTool({...tool,context:{...tool.context,toolKind:'html'}},hub),null);
  assert.equal(createSimulationGuideTool({...tool,id:'bad"><script>'},hub),null);
  assert.equal(simulationGuideFor(tool,hub),null);
});

test('reading guide binds four complete sections and validates bilingual articles without tour steps',()=>{
  assert.deepEqual(validateSimulationGuide(waveMiniPlayGuide),[]);
  assert.equal(waveMiniPlayGuide.format,'reading');assert.equal('steps' in waveMiniPlayGuide,false);
  const real={...tool,source:new URL(waveMiniPlayGuide.source,hub).href,context:{...tool.context,contentId:waveMiniPlayGuide.contentId}};
  assert.equal(simulationGuideFor(real,hub),waveMiniPlayGuide);
  assert.equal(simulationGuideFor({...real,source:real.source+'?state=1'},hub),null);
  assert.deepEqual(waveMiniPlayGuide.sections.map(s=>s.id),['reflection','refraction','interference','diffraction']);
  for(const section of waveMiniPlayGuide.sections){
    assert.deepEqual(section.parts.map(p=>p.id),['mission-1','mission-2']);
    assert.equal(section.objectives.length,3);assert.ok(section.parts.every(p=>p.items.length>=4));
  }
  for(const change of [g=>g.sections[0].objectives[0].en='',g=>g.sections[1].id=g.sections[0].id,
    g=>g.sections[0].parts[0].items[0].en='',g=>g.sections[0].parts[1].id='mission-1',
    g=>g.sections[0].parts[0].answer='secret',g=>g.sections[0].parts[0].items[0].th='<b>HTML</b>',
    g=>g.steps=[],g=>g.sections[0].parts[0]=null,g=>g.introduction.en='']){
    const changed=structuredClone(waveMiniPlayGuide);change(changed);assert.ok(validateSimulationGuide(changed).length);
  }
});

test('the complete manual is readable without click handlers, including after old tour state and language changes',()=>{
  const {document}=parseHTML(html),state={example:true,stepId:'interference-goals'};let actions=0;
  const mount=()=>mountSimulationGuide({document,contentId:waveMiniPlayGuide.contentId,title:waveMiniPlayGuide.title,state,guide:waveMiniPlayGuide,onLocate:()=>actions++,onReturn:()=>actions++});
  let controller=mount();
  assert.equal(document.querySelector('[data-simulation-guide]').dataset.guideState,'reading');
  assert.equal(document.querySelector('button'),null);
  assert.equal(document.querySelector('[data-guide-next]'),null);assert.equal(document.querySelector('[data-guide-locate]'),null);
  for(const section of waveMiniPlayGuide.sections){
    const article=document.getElementById('guide-reading-'+section.id);assert.ok(article);assert.equal(article.hidden,false);
    for(const part of section.parts)assert.ok(article.textContent.includes(part.title.th));
  }
  for(const link of document.querySelectorAll('a[href^="#"]'))assert.ok(document.getElementById(link.getAttribute('href').slice(1)));
  controller.setLanguage('en');assert.equal(document.documentElement.lang,'en');
  assert.match(document.body.textContent,/Mission 2 · Change the opening/);
  assert.equal(actions,0);assert.equal(state.stepId,'interference-goals');
  controller.dispose();controller=mount();assert.equal(document.querySelectorAll('.reading-section').length,6);
  assert.equal(document.querySelector('button'),null);controller.dispose();
});

test('learning objectives use the same authored goals without resetting the panel or experiment controls',()=>{
  const {document}=parseHTML('<html><body><details id="learning-objectives" open><summary id="learning-objectives-title"></summary><ul id="learning-objectives-list"></ul></details><input id="param-angle" value="57"></body></html>');
  const panel=document.getElementById('learning-objectives');
  renderLearningObjectives(document,'reflection','th');
  assert.equal(panel.hasAttribute('data-mode'),false,'The objectives card must not join the simulation tab selector');
  assert.equal(document.querySelectorAll('#learning-objectives-list li').length,3);
  const first=document.querySelector('#learning-objectives-list li');
  renderLearningObjectives(document,'reflection','th');assert.equal(document.querySelector('#learning-objectives-list li'),first);
  panel.open=false;renderLearningObjectives(document,'refraction','en');
  assert.equal(panel.open,false);assert.match(document.getElementById('learning-objectives-title').textContent,/Refraction/);
  assert.deepEqual([...document.querySelectorAll('#learning-objectives-list li')].map(n=>n.textContent),waveMiniPlayGuide.sections[1].objectives.map(g=>g.en));
  assert.equal(document.getElementById('param-angle').value,'57');
});

test('future lesson guides require the matching content ID, exact local source and plain bilingual instructions',()=>{
  const guide={...simulationGuideExample('lab'),source:'content/physics/lab.html'};
  assert.equal(simulationGuideFor(tool,hub,{lab:guide}),guide);
  for(const changed of [{...guide,contentId:'other'},{...guide,source:'content/physics/other.html'},
    {...guide,source:'https://foreign.test/lab.html'},{...guide,source:'content/physics/lab.html?state=1'}]){
    assert.equal(simulationGuideFor(tool,hub,{lab:changed}),null);
  }
  for(const change of [g=>g.steps[0].answer='secret',g=>g.steps[0].target={scope:'simulation',key:'x"] script'},
    g=>delete g.steps[0].instruction.en,g=>g.steps[0].instruction.th='<b>HTML</b>',g=>g.steps[1].id=g.steps[0].id]){
    const changed=structuredClone(guide);change(changed);assert.ok(validateSimulationGuide(changed).length);
  }
});

test('guide controls keep manual progress across language and document remount; no answers or experiment actions',()=>{
  const {document}=parseHTML(html),state={example:false,stepId:null};let located,returned=0;
  const mount=()=>mountSimulationGuide({document,contentId:'lab',title:{th:'ทดลอง',en:'Lab'},state,
    onLocate:target=>{located=target;return 'disabled';},onReturn:()=>returned++});
  let controller=mount();
  assert.equal(document.querySelector('[data-guide-next]').disabled,true);
  document.querySelector('[data-guide-example]').click();
  document.querySelector('[data-guide-next]').click();
  document.querySelector('[data-guide-locate]').click();
  assert.deepEqual(located,{scope:'window',key:'language'});
  assert.match(document.querySelector('[role="status"]').textContent,/ยังไม่พร้อม/);
  controller.setLanguage('en');assert.match(document.body.textContent,/Step 2 of 3/);
  document.querySelector('[data-guide-return]').click();assert.equal(returned,1);
  controller.dispose();controller=mount();assert.equal(state.stepId,'language');
  document.querySelector('[data-guide-previous]').click();assert.equal(state.stepId,'open');
  document.querySelector('[data-guide-previous]').click();assert.equal(state.stepId,'open');
  document.querySelector('[data-guide-example-exit]').click();assert.equal(state.example,false);
  assert.equal(document.querySelector('[data-guide-next]').disabled,true);controller.dispose();
});

test('locating a control highlights and scrolls it without clicking or changing its value',()=>{
  const {document}=parseHTML('<html><head></head><body><article><button class="guide">Guide</button><button class="split">Split</button><div class="window-language">TH EN</div></article><iframe></iframe></body></html>');
  const child=parseHTML('<html><head></head><body><button id="run" disabled>Run</button><input id="setting" value="45"><div hidden><button id="hidden">Hidden</button></div></body></html>');
  const owner={element:document.querySelector('article'),frame:document.querySelector('iframe'),simulationGuideButton:document.querySelector('.guide'),splitButton:document.querySelector('.split')};
  Object.defineProperty(owner.frame,'contentDocument',{value:child.document});
  let clicks=0,scrolled=0;const run=child.document.querySelector('#run');
  run.addEventListener('click',()=>clicks++);run.scrollIntoView=()=>scrolled++;
  const marker=createSimulationGuideHighlighter();
  assert.equal(marker.locate(owner,{scope:'simulation',key:'run'}),'disabled');
  assert.equal(clicks,0);assert.equal(scrolled,1);assert.equal(run.classList.contains('hub-simulation-guide-target'),true);
  assert.equal(marker.locate(owner,{scope:'simulation',key:'hidden'}),'missing');
  assert.equal(run.classList.contains('hub-simulation-guide-target'),false);
  assert.equal(marker.locate(owner,{scope:'simulation',key:'setting'}),'ready');
  assert.equal(child.document.querySelector('#setting').value,'45');
  marker.dispose();assert.equal(child.document.querySelector('.hub-simulation-guide-target'),null);
});
