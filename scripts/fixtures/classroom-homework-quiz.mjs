import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { bankKeyPattern } from '../../public/shared/question-bank-model.js';

// Classroom integration needs four choice questions for correction and teacher
// handoff. Keep this test-only quiz independent of changing authored worksheets.
export function createHomeworkBrowserQuiz(catalog, templateHtml) {
  const qaLocation = catalog.contents.flatMap(content => content.placements || []).find(placement =>
    placement.subjectId === 'physics' && placement.chapterId === 'bank' && bankKeyPattern.test(placement.topicId || '') &&
    catalog.routes.some(route => route.hash === placement.parentHash && route.kind === 'bank'));
  assert.ok(qaLocation, 'Homework browser QA requires an existing Physics bank placement');
  const { document } = parseHTML(templateHtml);
  const root = document.querySelector('[data-learning-activity-content]');
  const questions = [...root.querySelectorAll('[data-question]')];
  assert.equal(questions.length, 2, 'The prerequisite template must keep its two questions');
  assert.ok(questions.every(question => question.dataset.questionType === 'choice'));
  for (let index = 3; index <= 4; index++) {
    const question = questions[(index - 1) % questions.length].cloneNode(true);
    question.dataset.questionId = 'qa-q' + index;
    questions[0].parentNode.append(question);
  }
  root.dataset.activityId = 'qa-homework-quiz';
  const hash = '#content/qa-homework-quiz';
  return { qaLocation, homeworkHtml: root.outerHTML,
    homeworkContent: { id: 'qa-homework-quiz', toolKind: 'quiz', source: 'content/qa-homework-quiz.html',
      titleTh: 'โจทย์ทดสอบการบ้าน 4 ข้อ', titleEn: 'Four-question homework QA', canonicalHash: hash, placements: [qaLocation] },
    homeworkQuizRoute: { hash, aliases: [], kind: 'content', status: 'ready', contentId: 'qa-homework-quiz',
      ...qaLocation, titleTh: 'โจทย์ทดสอบการบ้าน 4 ข้อ', titleEn: 'Four-question homework QA' } };
}
