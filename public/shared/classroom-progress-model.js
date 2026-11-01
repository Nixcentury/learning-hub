// Read-only room totals. Work that has not been submitted earns zero in this
// display; stored submissions and CSV values are never changed.
export function summarizeClassroomProgress({ uid, roomId, items = [], grades = {}, connected = false, error = '' }) {
  if (!uid || !roomId) return null;
  const published = items.filter(item => ['published', 'closed'].includes(item.status));
  const base = { uid, roomId, connected: connected === true, assignmentCount: published.length,
    submittedCount: null, completionPercent: null, score: null, maxScore: null, percent: null,
    unpreparedCount: 0, invalidCount: 0 };
  if (error) return { ...base, status: 'error' };
  if (!published.length) return { ...base, submittedCount: 0, status: 'empty' };
  let score = 0, maxScore = 0, submittedCount = 0, loading = false, unpreparedCount = 0, invalidCount = 0;
  for (const item of published) {
    const book = grades[item.id];
    if (!book?.loaded) { loading = true; continue; }
    // A peer's row must never supply this student's score or completion count.
    const row = book.rows?.find(value => value.uid === uid);
    if (row?.submitted === true) submittedCount++;
    if (!book.ready) { unpreparedCount++; continue; }
    if (!Number.isSafeInteger(book.maxScore) || book.maxScore <= 0 || !row) { invalidCount++; continue; }
    maxScore += book.maxScore;
    if (row.submitted === true) {
      const grade = row.grade;
      if (!grade || grade.error || !Number.isSafeInteger(grade.score) || grade.score < 0 || grade.maxScore !== book.maxScore || grade.score > grade.maxScore) invalidCount++;
      else score += grade.score;
    }
  }
  if (loading) return { ...base, status: 'loading' };
  const counted = { ...base, submittedCount, completionPercent: Math.round(submittedCount / published.length * 10000) / 100, unpreparedCount, invalidCount };
  if (invalidCount) return { ...counted, status: 'error' };
  if (unpreparedCount) return { ...counted, status: 'waiting' };
  return { ...counted, status: 'ready', score, maxScore, percent: Math.round(score / maxScore * 10000) / 100 };
}
