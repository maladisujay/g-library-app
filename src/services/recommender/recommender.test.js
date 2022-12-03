import { createSeed } from '../../data/seed';
import { buildModel, recommend, similarStudents, examPlan } from './engine';
import { trainRecommender } from './evaluate';

describe('recommender', () => {
  const db = createSeed();

  test('seed has 20 students and a catalogue', () => {
    expect(db.students).toHaveLength(20);
    expect(db.books.length).toBeGreaterThan(80);
    expect(db.loans.length).toBeGreaterThan(100);
  });

  test('recommends unseen books with reasons', () => {
    const model = buildModel(db);
    const recs = recommend(model, db.students[0].id, { limit: 10 });
    expect(recs.length).toBeGreaterThanOrEqual(6);
    const borrowed = new Set(db.loans.filter((l) => l.studentId === db.students[0].id).map((l) => l.bookId));
    recs.forEach((r) => expect(borrowed.has(r.book.id)).toBe(false));
    expect(recs[0].reasons.length).toBeGreaterThan(0);
  });

  test('cold-start student still gets recommendations from profile and syllabus', () => {
    const model = buildModel(db);
    const fresher = db.students.find((s) => s.semester === 1);
    expect(db.loans.some((l) => l.studentId === fresher.id)).toBe(false);
    const recs = recommend(model, fresher.id, { limit: 6 });
    expect(recs).toHaveLength(6);
    expect(similarStudents(model, fresher.id)[0].student.program).toBe('CSE');
  });

  test('hybrid beats popularity in leave-last-out evaluation', () => {
    const run = trainRecommender(db);
    expect(run.evaluation.tuned.metrics.hr10).toBeGreaterThanOrEqual(run.evaluation.results.popularity.hr10);
    expect(examPlan(run.model, db.students[0].id).length).toBeGreaterThan(0);
  });
});
