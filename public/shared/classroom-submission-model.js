import { hasAnswer, isCorrectAnswer, isStoredAnswer, parseNumericAnswer } from './quiz-question-model.js';
export const submissionRoot = 'classroomSubmissionsV1';
export const quizRevisionPattern = /^[a-f0-9]{64}$/;
export const failSubmission = code => Object.assign(new Error(code), { code });
export function homeworkStorageKey(uid, homework) {
  return `learning-hub-homework:v1:${uid}:${homework.roomId}:${homework.id}:${homework.quizRevision}`;
}
const map = value => value && typeof value === 'object' && !Array.isArray(value);
export function gradeHomework(questions, answers = {}, giveUps = {}, { draft = false } = {}) {
  if (!map(answers) || !map(giveUps) || !questions.length) throw failSubmission('homework/invalid-answers');
  const byId = new Map(questions.map(question => [question.id, question]));
  for (const [id, answer] of Object.entries(answers)) {
    const question = byId.get(id);
    if (!question || !isStoredAnswer(question, answer) || (!draft && question.type === 'number' && hasAnswer(answer) && parseNumericAnswer(answer) === null)) throw failSubmission('homework/invalid-answers');
  }
  if (Object.entries(giveUps).some(([id, value]) => !byId.has(id) || typeof value !== 'boolean')) throw failSubmission('homework/invalid-answers');
  const rows = questions.map(question => {
    const answered = hasAnswer(answers[question.id]), givenUp = giveUps[question.id] === true;
    const correct = !givenUp && answered && isCorrectAnswer(question, answers[question.id]);
    return { id: question.id, correct, status: givenUp ? 'giveup' : !answered ? 'unanswered' : correct ? 'correct' : 'incorrect' };
  });
  const score = rows.filter(row => row.correct).length;
  return { score, maxScore: questions.length, percent: Math.round(score / questions.length * 10000) / 100, rows };
}
export function submissionPayload(progress, questions, { draft = false } = {}) {
  if (!map(progress) || !Number.isFinite(progress.elapsedMs) || progress.elapsedMs < 0) throw failSubmission('homework/invalid-answers');
  const answers = progress.answers || {}, giveUps = progress.giveUps || {};
  gradeHomework(questions, answers, giveUps, { draft });
  const answersJson = JSON.stringify(answers), giveUpsJson = JSON.stringify(giveUps);
  if (answersJson.length > 60000 || giveUpsJson.length > 16000) throw failSubmission('homework/invalid-answers');
  return { answersJson, giveUpsJson, elapsedMs: Math.min(31536000000, Math.floor(progress.elapsedMs)) };
}
export function gradeSubmission(record, quiz, questions) {
  try {
    if (!record || record.version !== 1 || record.quizRevision !== quiz.revision || record.contentId !== quiz.contentId || !Number.isFinite(record.submittedAt)) throw Error();
    if (record.submissionRevision != null && (!Number.isSafeInteger(record.submissionRevision) || record.submissionRevision < 1)) throw Error();
    return { ...gradeHomework(questions, JSON.parse(record.answersJson), JSON.parse(record.giveUpsJson)),
      submittedAt: record.submittedAt, submissionRevision: record.submissionRevision || 1, late: record.dueAt > 0 && record.submittedAt > record.dueAt };
  } catch { return { error: 'homework/invalid-result' }; }
}
