import { waveMiniPlayGuide } from './guide-data.js?v=reading-guide-20261107';

export function renderLearningObjectives(doc, mode, language) {
  const panel = doc.getElementById('learning-objectives');
  const section = waveMiniPlayGuide.sections.find(item => item.id === mode);
  if (!panel || !section) return;
  const lang = language === 'en' ? 'en' : 'th';
  if (panel.dataset.objectiveMode === mode && panel.dataset.language === lang) return;
  panel.dataset.objectiveMode = mode; panel.dataset.language = lang;
  // Update the contents, keeping the learner's open/closed panel and focus.
  doc.getElementById('learning-objectives-title').textContent =
    (lang === 'th' ? 'จุดประสงค์การเรียนรู้ · ' : 'Learning objectives · ') + section.title[lang];
  const list = doc.getElementById('learning-objectives-list'); list.replaceChildren();
  for (const goal of section.objectives) {
    const item = doc.createElement('li'); item.textContent = goal[lang]; list.append(item);
  }
}

if (typeof document !== 'undefined') {
  globalThis.MiniWaveObjectives = { render: (mode, language) => renderLearningObjectives(document, mode, language) };
  const bridge = globalThis.WaveMiniBridge;
  if (bridge) globalThis.MiniWaveObjectives.render(bridge.read().mode, bridge.language());
}
