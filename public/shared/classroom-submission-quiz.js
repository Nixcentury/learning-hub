import { readQuizContent } from './quiz-content-adapter.js';
import { failSubmission, quizRevisionPattern } from './classroom-submission-model.js';

// Frozen quiz HTML is content, never executable application code. Keep diagrams,
// bilingual data and math, but remove active markup and unsafe resource URLs.
export function sanitizeHomeworkRoot(root, baseUrl) {
  const copy = root.cloneNode(true), base = new URL(baseUrl);
  for (const node of copy.querySelectorAll('script,iframe,object,embed,link,base,form,input,button,textarea,select,meta,foreignObject,animate,set,style')) node.remove();
  for (const node of [copy, ...copy.querySelectorAll('*')]) for (const attrName of node.getAttributeNames()) {
    const name = attrName.toLowerCase(), value = node.getAttribute(attrName);
    if (name.startsWith('on') || ['srcdoc','srcset','action','formaction'].includes(name)) { node.removeAttribute(attrName); continue; }
    if (!['src','href','xlink:href'].includes(name)) continue;
    if (value.startsWith('#')) continue;
    try {
      const url = new URL(value, base);
      const image = ['img','image'].includes(node.localName.toLowerCase());
      const dataImage = image && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value);
      if (!dataImage && (!['http:','https:'].includes(url.protocol) || url.username || url.password || (url.origin !== base.origin && url.protocol !== 'https:'))) node.removeAttribute(attrName);
      else if (!dataImage) { node.setAttribute(attrName, url.href); if (node.localName === 'a') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); } }
    } catch { node.removeAttribute(attrName); }
  }
  return copy;
}
export function readHomeworkQuiz(quiz, documentObject = document, baseUrl = location.href) {
  if (!quizRevisionPattern.test(quiz?.revision || '') || typeof quiz.html !== 'string' || quiz.html.length > 400000) throw failSubmission('homework/invalid-quiz');
  const doc = documentObject.implementation.createHTMLDocument('');
  doc.body.innerHTML = quiz.html;
  const root = doc.querySelector('[data-learning-activity-content]');
  if (!root || root.dataset.activityId !== quiz.contentId) throw failSubmission('homework/invalid-quiz');
  const clean = sanitizeHomeworkRoot(root, baseUrl);
  const parsed = readQuizContent(clean);
  if (parsed.errors.length || parsed.questions.length !== quiz.questionCount || parsed.questions.length > 500) throw failSubmission('homework/invalid-quiz');
  return { root: clean, questions: parsed.questions };
}
