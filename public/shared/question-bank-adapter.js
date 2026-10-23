import { bankContentId, bankQuestionId, bankKeyPattern } from './question-bank-model.js';
import { readQuizContent } from './quiz-content-adapter.js';
import { parseNumericAnswer } from './quiz-question-model.js';
import { staticBankSvgImage } from './question-bank-svg.js?v=bank-svg-1';

// Construct fresh nodes with an allowlist. Never attach the remote document,
// execute its scripts, or copy its styles, event handlers or IDs. Only the
// explicit question contract below may supply data attributes on fresh nodes.
const safeTags = new Set('p div span b strong i em u s sub sup br hr ul ol li table thead tbody tfoot tr td th caption blockquote pre code h4 h5 h6 img'.split(' '));
const discard = new Set('script style iframe frame object embed link meta base form input button select textarea svg math audio video source template'.split(' '));
function copyRich(source, target, doc) {
  for (const child of source.childNodes) {
    if (child.nodeType === 3) { target.append(doc.createTextNode(child.textContent)); continue; }
    if (child.nodeType !== 1) continue;
    const tag = child.localName;
    if (tag === 'svg') { target.append(staticBankSvgImage(child, doc)); continue; }
    if (discard.has(tag)) continue;
    if (!safeTags.has(tag)) { copyRich(child, target, doc); continue; }
    const node = doc.createElement(tag);
    if (tag === 'img') {
      let url;
      try { url = new URL(child.getAttribute('src')); } catch { throw Error('รูปต้องใช้ URL เต็มแบบ HTTPS / Image needs an absolute HTTPS URL'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw Error('Unsupported image URL');
      node.src = url.href; node.alt = child.getAttribute('alt') || ''; node.referrerPolicy = 'no-referrer';
      if (url.pathname.toLowerCase().endsWith('.svg')) node.dataset.bankSvg = '';
    }
    if (['td', 'th'].includes(tag)) for (const attribute of ['colspan', 'rowspan']) {
      const value = child.getAttribute(attribute); if (/^[1-9]\d?$/.test(value || '')) node.setAttribute(attribute, value);
    }
    copyRich(child, node, doc); target.append(node);
  }
}
export function adaptLegacyBank(snapshot, { document: doc = document, Parser = DOMParser } = {}) {
  const root = doc.createElement('article');
  Object.assign(root.dataset, { learningActivityContent: '', activityKind: 'quiz',
    activityId: bankContentId(snapshot.subjectId, snapshot.bankKey), bankRevision: snapshot.revision });
  const heading = doc.createElement('h1'); heading.dataset.activityTitle = ''; heading.dataset.quizTitle = '';
  heading.dataset.th = snapshot.title; heading.dataset.en = snapshot.title; heading.textContent = snapshot.title;
  const questions = doc.createElement('section'); questions.dataset.activityQuestions = '';
  const intro = doc.createElement('header'); intro.dataset.activityIntro = ''; intro.append(heading);
  root.append(intro, questions); let ordinal = 0;
  for (const row of snapshot.rows) {
    const parsed = new Parser().parseFromString(row.html, 'text/html');
    const steps = [...parsed.querySelectorAll('.question-step')];
    if (!steps.length) throw Error(`แถว ${row.rowNumber}: ไม่พบข้อสอบที่รองรับ / No supported questions`);
    for (const step of steps) {
      ++ordinal;
      const fail = message => { throw Error(`แถว ${row.rowNumber}, ข้อ ${ordinal}: ${message}`); };
      const rich = (source, target) => {
        try { copyRich(source, target, doc); } catch (error) { fail(error.message); }
      };
      if (step.querySelector('.question-step')) fail('Nested questions are not supported');
      if (step.querySelector('math, canvas, iframe, object, embed, audio, video')) fail('มีภาพหรือสื่อที่ต้องแปลงก่อน / This embedded media needs conversion');
      const prompt = step.querySelector('h3');
      const inputs = [...step.querySelectorAll('.options input')];
      const numeric = step.dataset.type === 'fill-in';
      const answer = numeric ? (step.dataset.ans || '').trim() : (step.dataset.ans || '').trim().toLowerCase();
      if (!prompt?.textContent.trim()) fail('ไม่พบข้อความโจทย์ / Missing question prompt');
      if (numeric) {
        const fields = [...step.querySelectorAll('.num-answer')];
        if (inputs.length || fields.length !== 1 || fields[0].localName !== 'input' || !['number', 'text'].includes(fields[0].type)) fail('ข้อเติมตัวเลขต้องมีช่อง .num-answer เดียวและไม่มีตัวเลือก / Invalid numeric answer field');
        if (parseNumericAnswer(answer) === null) fail('เฉลยต้องเป็นค่าตัวเลข / Invalid numeric answer');
        if (step.hasAttribute('data-tolerance')) {
          const tolerance = parseNumericAnswer(step.dataset.tolerance);
          if (tolerance === null || tolerance < 0) fail('ค่าคลาดเคลื่อนต้องเป็นตัวเลขตั้งแต่ศูนย์ขึ้นไป / Invalid numeric tolerance');
        }
      } else if (inputs.length < 2 || inputs.length > 12 || inputs.some(input => input.type !== 'radio')) fail('รองรับข้อเลือกตอบหรือข้อเติมตัวเลขที่มีข้อมูลครบเท่านั้น / Incomplete choice or numeric question');
      const article = doc.createElement('article');
      Object.assign(article.dataset, { question: '', questionId: bankQuestionId(snapshot.subjectId, snapshot.bankKey, ordinal), questionType: numeric ? 'number' : 'choice', answer });
      if (bankKeyPattern.test(row.reviewTopicKey || '')) article.dataset.topicIds = row.reviewTopicKey;
      if (numeric) {
        article.dataset.tolerance = step.dataset.tolerance ?? '0';
        for (const key of ['unitTh', 'unitEn']) if (step.dataset[key]) article.dataset[key] = step.dataset[key];
      }
      const promptTarget = doc.createElement('div'); promptTarget.dataset.questionPrompt = ''; rich(prompt, promptTarget); article.append(promptTarget);
      // Images, tables or paragraphs placed between h3 and the option block are
      // part of the question too. Do not lose them by copying h3 alone.
      const contextSource = step.cloneNode(true);
      contextSource.querySelectorAll('h3, .options, .hint-box, .feedback-box').forEach(node => node.remove());
      // Legacy controls are replaced by the shared MathLive field, not rendered
      // as a second input or an orphaned label in the question context.
      if (numeric) {
        contextSource.querySelectorAll('.answer-section').forEach(node => node.remove());
        contextSource.querySelectorAll('.num-answer').forEach(field => {
          contextSource.querySelectorAll('label').forEach(label => {
            if (label.contains(field) || (field.id && label.getAttribute('for') === field.id)) label.remove();
          });
          field.remove();
        });
      }
      const context = doc.createElement('div'); context.dataset.questionContext = ''; rich(contextSource, context);
      if (context.textContent.trim() || context.querySelector('img, table')) article.prepend(context);
      if (!numeric) {
        const choices = doc.createElement('ol'); choices.dataset.questionOptions = '';
        const seen = new Set();
        for (const input of inputs) {
          const id = (input.getAttribute('value') || '').trim().toLowerCase();
          const label = input.closest('label') || [...step.querySelectorAll('label[for]')].find(item => item.htmlFor === input.id);
          if (!/^[a-z][a-z0-9-]{0,15}$/.test(id) || seen.has(id) || !label || !label.textContent.trim()) fail('ตัวเลือกไม่ครบหรือรหัสซ้ำ / Invalid choices');
          seen.add(id);
          const option = doc.createElement('li'); option.dataset.choiceId = id; rich(label, option);
          if (!option.textContent.trim()) fail('ตัวเลือกภาพต้องมีข้อความกำกับ / Image choices need a text caption');
          choices.append(option);
        }
        if (!seen.has(answer)) fail('เฉลยไม่ตรงกับตัวเลือก / Invalid answer');
        article.append(choices);
      }
      const hints = doc.createElement('ol'); hints.dataset.questionHints = ''; hints.hidden = true;
      step.querySelectorAll('.hint-box').forEach(hint => {
        const node = doc.createElement('li'); node.dataset.questionHint = ''; rich(hint, node); hints.append(node);
      });
      article.append(hints);
      const solution = doc.createElement('div'); solution.dataset.questionSolution = '';
      const feedback = step.querySelector('.feedback-box');
      if (feedback) rich(feedback, solution); else solution.textContent = `เฉลย / Answer: ${numeric ? answer : answer.toUpperCase()}`;
      article.append(solution); questions.append(article);
    }
  }
  const validation = readQuizContent(root);
  if (validation.errors.length) throw Error(validation.errors.join(' '));
  return root;
}
