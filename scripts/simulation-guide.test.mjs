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

test('wave guide covers four mode sections and both missions without embedding answer or execution fields',()=>{
  assert.deepEqual(validateSimulationGuide(waveMiniPlayGuide),[]);
  const real={...tool,source:new URL(waveMiniPlayGuide.source,hub).href,context:{...tool.context,contentId:waveMiniPlayGuide.contentId}};
  assert.equal(simulationGuideFor(real,hub),waveMiniPlayGuide);
  assert.equal(simulationGuideFor({...real,source:real.source+'?state=1'},hub),null);
  assert.deepEqual(waveMiniPlayGuide.sections.map(s=>s.id),['reflection','refraction','interference','diffraction']);
  for(const section of waveMiniPlayGuide.sections){
    const steps=waveMiniPlayGuide.steps.filter(s=>s.sectionId===section.id);
    assert.equal(steps[0].target.key,'tab-'+section.id);
    for(const suffix of ['mission-1','answer-1-open','answer-1-fill','answer-1-check','mission-2','answer-2-open','answer-2-fill','answer-2-check','finish'])assert.ok(steps.some(s=>s.id===section.id+'-'+suffix));
    assert.equal(section.objectives.length,3);
  }
  for(const change of [g=>g.sections[0].objectives[0].en='',g=>g.sections[1].id=g.sections[0].id,
    g=>g.steps[0].sectionId='missing',g=>g.sections.push({id:'empty',title:{th:'ว่าง',en:'Empty'},objectives:[{th:'เป้าหมาย',en:'Goal'}]}),
    g=>g.sections[0].objectives[0].th='<b>goal</b>',g=>g.steps[0]=null]){
    const changed=structuredClone(waveMiniPlayGuide);change(changed);assert.ok(validateSimulationGuide(changed).length);
  }
});

test('section navigation remains a manual guide action and retains its step across language and remount',()=>{
  const {document}=parseHTML(html),state={example:false,stepId:null};let located=null;
  const mount=()=>mountSimulationGuide({document,contentId:waveMiniPlayGuide.contentId,title:waveMiniPlayGuide.title,state,guide:waveMiniPlayGuide,onLocate:t=>{located=t;return 'missing';}});
  let controller=mount();
  const select=document.querySelector('[data-guide-section]');
  select.querySelector('option[value="interference"]').selected=true;
  select.dispatchEvent(new document.defaultView.Event('change'));
  assert.equal(state.stepId,'interference-mode');assert.equal(located,null);
  document.querySelector('[data-guide-locate]').click();assert.equal(located.key,'tab-interference');
  assert.match(document.querySelector('[role=status]').textContent,/เลือกโหมด/);
  document.querySelector('[data-guide-next]').click();assert.equal(state.stepId,'interference-goals');
  controller.setLanguage('en');assert.equal(state.stepId,'interference-goals');
  assert.match(document.querySelector('.guide-objectives').textContent,/source phase/);
  controller.dispose();controller=mount();assert.equal(state.stepId,'interference-goals');
  assert.equal(document.querySelector('[data-guide-section]').value,'interference');controller.dispose();
});

test('learning objectives use the same authored goals without resetting the panel or experiment controls',()=>{
  const {document}=parseHTML('<html><body><details id="learning-objectives" open><summary id="learning-objectives-title"></summary><ul id="learning-objectives-list"></ul></details><input id="param-angle" value="57"></body></html>');
  const panel=document.getElementById('learning-objectives');
  renderLearningObjectives(document,'reflection','th');
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
