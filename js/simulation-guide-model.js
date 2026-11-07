// The shell is shared; lesson walkthroughs will be authored in a later round.
// Register each walkthrough by its real simulation content ID and source.
export const simulationGuideCatalog = Object.freeze({});
const idPattern = /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/;
const windowTargets = new Set(['guide', 'language', 'split']);

export function validateSimulationGuide(guide) {
  const errors = [];
  const text = value => value && ['th', 'en'].every(lang => typeof value[lang] === 'string' &&
    value[lang].trim() && value[lang].length <= 1800 && !/<\/?[a-z]/i.test(value[lang]));
  if (!guide || guide.schemaVersion !== 1 || !idPattern.test(guide.contentId || '')) errors.push('Invalid guide identity');
  if (!text(guide?.title)) errors.push('Bilingual title required');
  if (!Array.isArray(guide?.steps) || !guide.steps.length || guide.steps.length > 80) return [...errors, 'Expected 1–80 steps'];
  const ids = new Set();
  for (const step of guide.steps) {
    if (!idPattern.test(step?.id || '') || ids.has(step.id)) errors.push('Unique step IDs required');
    ids.add(step?.id);
    if (!text(step?.title) || !text(step?.instruction)) errors.push('Bilingual step text required');
    if (step?.blocked !== undefined && !text(step.blocked)) errors.push('Bilingual blocked text required');
    const target = step?.target;
    if (target && !(target.scope === 'simulation' && idPattern.test(target.key || '') ||
      target.scope === 'window' && windowTargets.has(target.key))) errors.push('Invalid target');
    // This is a click walkthrough, not a second answer/grade system.
    if (step && ['answer', 'solution', 'correct', 'action', 'script'].some(key => Object.hasOwn(step, key))) errors.push('Instructions only');
  }
  return errors;
}

export function simulationGuideFor(tool, hubUrl, catalog = simulationGuideCatalog) {
  if (tool?.context?.toolKind !== 'simulation' || !Object.hasOwn(catalog, tool.context.contentId)) return null;
  const guide = catalog[tool.context.contentId];
  if (validateSimulationGuide(guide).length || guide.contentId !== tool.context.contentId) return null;
  try {
    const hub = new URL(hubUrl), expected = new URL(guide.source, hub), actual = new URL(tool.source, hub);
    if (expected.origin !== hub.origin || !expected.pathname.startsWith(new URL('content/', hub).pathname) ||
      !expected.pathname.endsWith('.html') || expected.search || expected.hash || expected.href !== actual.href) return null;
    return guide;
  } catch { return null; }
}

export function createSimulationGuideTool(owner, hubUrl) {
  if (owner?.context?.toolKind !== 'simulation' || !idPattern.test(owner.context.contentId || '') ||
    typeof owner.id !== 'string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(owner.id)) return null;
  const page = new URL('pages/tools/simulation-guide-player.html', hubUrl).href;
  return { id: `simulation-guide-${owner.id}`, page, source: page,
    simulationGuideOwnerId: owner.id, icon: '▤', accent: 'mint',
    titleTh: `คู่มือเล่น · ${owner.titleTh}`, titleEn: `Play guide · ${owner.titleEn}`,
    context: { ...owner.context, toolKind: 'simulation-guide' } };
}

export function simulationGuideExample(contentId) {
  return { schemaVersion: 1, contentId,
    title: { th: 'ตัวอย่างการใช้ปุ่มคู่มือ', en: 'Guide control example' }, steps: [
      { id: 'open', title: { th: 'เปิดคู่มือเป็นจอคู่', en: 'Open the guide side by side' },
        instruction: { th: 'ปุ่มคู่มือเล่นอยู่บนหน้าต่าง simulation กด “ชี้ตำแหน่ง” เพื่อลองหาปุ่มนี้ แล้วกด “ถัดไป” ในคู่มือ', en: 'The Play guide button is on the simulation window. Use Locate control to find it, then choose Next in this guide.' },
        target: { scope: 'window', key: 'guide' } },
      { id: 'language', title: { th: 'ลองชี้ตำแหน่งปุ่มภาษา', en: 'Locate the language controls' },
        instruction: { th: 'กด “ชี้ตำแหน่ง” เพื่อดูตำแหน่งปุ่มภาษา การชี้เป็นเพียงการเน้นกรอบ คุณเป็นคนเลือกกดปุ่มเอง', en: 'Use Locate control to highlight the language buttons. Highlighting only shows their location; you choose whether to press them.' },
        target: { scope: 'window', key: 'language' } },
      { id: 'layout', title: { th: 'ลองชี้ตำแหน่งปุ่มจัดหน้าต่าง', en: 'Locate the layout controls' },
        instruction: { th: 'กด “ชี้ตำแหน่ง” เพื่อหาปุ่มแบ่งจอ/จัดหน้าต่าง ลองย้อนกลับหรือปิดคู่มือแล้วเปิดอีกครั้งได้ ตัวอย่างนี้เป็นการลองระบบ ไม่ใช่ขั้นตอนการทดลอง', en: 'Locate the Split view / Arrange button. Try Previous, or close and reopen the guide. This is a control example, not an experiment walkthrough.' },
        target: { scope: 'window', key: 'split' } },
    ] };
}
