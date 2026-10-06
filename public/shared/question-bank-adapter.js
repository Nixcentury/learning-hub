import { bankContentId, bankQuestionId } from './question-bank-model.js';
import { readQuizContent } from './quiz-content-adapter.js';

// Construct fresh nodes with an allowlist. Never attach the remote document,
// execute its scripts, or copy its styles, event handlers, IDs or data attributes.
const safeTags = new Set('p div span b strong i em u s sub sup br hr ul ol li table thead tbody tfoot tr td th caption blockquote pre code h4 h5 h6 img'.split(' '));
const discard = new Set('script style iframe frame object embed link meta base form input button select textarea svg math audio video source template'.split(' '));
function copyRich(source, target, doc) {
  for (const child of source.childNodes) {
    if (child.nodeType === 3) { target.append(doc.createTextNode(child.textContent)); continue; }
    if (child.nodeType !== 1) continue;
    const tag = child.localName;
    if (discard.has(tag)) continue;
    if (!safeTags.has(tag)) { copyRich(child, target, doc); continue; }
    const node = doc.createElement(tag);
    if (tag === 'img') {
      let url;
      try { url = new URL(child.getAttribute('src')); } catch { throw Error('รูปต้องใช้ URL เต็มแบบ HTTPS / Image needs an absolute HTTPS URL'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw Error('Unsupported image URL');
      node.src = url.href; node.alt = child.getAttribute('alt') || ''; node.referrerPolicy = 'no-referrer';
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
  const heading = doc.createElement('h1'); heading.dataset.activityTitle = '';
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
      if (step.querySelector('.question-step')) fail('Nested questions are not supported');
      if (step.querySelector('svg, math, canvas, iframe, object, embed, audio, video')) fail('มีภาพหรือสื่อที่ต้องแปลงก่อน / This embedded media needs conversion');
      const prompt = step.querySelector('h3');
      const inputs = [...step.querySelectorAll('.options input')];
      const answer = (step.dataset.ans || '').trim().toLowerCase();
      if (!prompt?.textContent.trim() || inputs.length < 2 || inputs.length > 12 || inputs.some(input => input.type !== 'radio')) fail('รองรับข้อเลือกตอบที่มีโจทย์และตัวเลือกครบเท่านั้น');
      const article = doc.createElement('article');
      Object.assign(article.dataset, { question: '', questionId: bankQuestionId(snapshot.subjectId, snapshot.bankKey, ordinal), questionType: 'choice', answer });
      const promptTarget = doc.createElement('div'); promptTarget.dataset.questionPrompt = ''; copyRich(prompt, promptTarget, doc); article.append(promptTarget);
      // Images, tables or paragraphs placed between h3 and the option block are
      // part of the question too. Do not lose them by copying h3 alone.
      const contextSource = step.cloneNode(true);
      contextSource.querySelectorAll('h3, .options, .hint-box, .feedback-box').forEach(node => node.remove());
      const context = doc.createElement('div'); context.dataset.questionContext = ''; copyRich(contextSource, context, doc);
      if (context.textContent.trim() || context.querySelector('img, table')) article.prepend(context);
      const choices = doc.createElement('ol'); choices.dataset.questionOptions = '';
      const seen = new Set();
      for (const input of inputs) {
        const id = (input.getAttribute('value') || '').trim().toLowerCase();
        const label = input.closest('label') || [...step.querySelectorAll('label[for]')].find(item => item.htmlFor === input.id);
        if (!/^[a-z][a-z0-9-]{0,15}$/.test(id) || seen.has(id) || !label || !label.textContent.trim()) fail('ตัวเลือกไม่ครบหรือรหัสซ้ำ / Invalid choices');
        seen.add(id);
        const option = doc.createElement('li'); option.dataset.choiceId = id; copyRich(label, option, doc); choices.append(option);
      }
      if (!seen.has(answer)) fail('เฉลยไม่ตรงกับตัวเลือก / Invalid answer');
      article.append(choices);
      const hints = doc.createElement('ol'); hints.dataset.questionHints = ''; hints.hidden = true;
      step.querySelectorAll('.hint-box').forEach(hint => {
        const node = doc.createElement('li'); node.dataset.questionHint = ''; copyRich(hint, node, doc); hints.append(node);
      });
      article.append(hints);
      const solution = doc.createElement('div'); solution.dataset.questionSolution = '';
      const feedback = step.querySelector('.feedback-box');
      if (feedback) copyRich(feedback, solution, doc); else solution.textContent = `เฉลย / Answer: ${answer.toUpperCase()}`;
      article.append(solution); questions.append(article);
    }
  }
  const validation = readQuizContent(root);
  if (validation.errors.length) throw Error(validation.errors.join(' '));
  return root;
}
