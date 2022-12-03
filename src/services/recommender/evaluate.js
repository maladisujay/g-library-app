import { buildModel, normalisedComponents, blend, COMPONENTS, DEFAULT_WEIGHTS, recommend } from './engine';
import { createRng } from '../../utils/random';

const METHODS = ['popularity', ...COMPONENTS, 'hybrid'];

function rankOf(scores, target, excluded) {
  const t = scores[target];
  let rank = 1;
  for (let j = 0; j < scores.length; j++) {
    if (j === target || excluded.has(j)) continue;
    if (scores[j] > t) rank += 1;
  }
  return rank;
}

function metricsFromRanks(ranks) {
  const n = ranks.length || 1;
  const hr = (k) => ranks.filter((r) => r <= k).length / n;
  const ndcg = (k) => ranks.reduce((s, r) => s + (r <= k ? 1 / Math.log2(r + 1) : 0), 0) / n;
  const mrr = ranks.reduce((s, r) => s + 1 / r, 0) / n;
  return { hr5: hr(5), hr10: hr(10), ndcg10: ndcg(10), mrr };
}

// Leave-last-out evaluation: each student's most recent borrowed title is hidden,
// the model is trained on everything else and must rank the hidden title.
export function evaluate(db, opts = {}) {
  const { today, tune = true, trials = 150 } = opts;
  const byStudent = new Map();
  db.loans.forEach((l) => {
    const arr = byStudent.get(l.studentId) || [];
    arr.push(l);
    byStudent.set(l.studentId, arr);
  });
  const holdouts = [];
  byStudent.forEach((arr, sid) => {
    const distinct = new Set(arr.map((l) => l.bookId));
    if (distinct.size < 3) return;
    const last = [...arr].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))[0];
    holdouts.push({ studentId: sid, bookId: last.bookId });
  });
  const hold = new Set(holdouts.map((h) => `${h.studentId}|${h.bookId}`));
  const trainDb = { ...db, loans: db.loans.filter((l) => !hold.has(`${l.studentId}|${l.bookId}`)) };
  const model = buildModel(trainDb, { today });

  const cases = holdouts.map((h) => {
    const u = model.uIdx.get(h.studentId);
    const target = model.bIdx.get(h.bookId);
    const excluded = new Set(model.hist[u]);
    const { norm } = normalisedComponents(model, u, excluded);
    return { u, target, excluded, norm };
  });

  const ranksFor = (scoreFn) => cases.map((c) => {
    const scores = new Float64Array(model.books.length);
    for (let j = 0; j < scores.length; j++) scores[j] = scoreFn(c, j);
    return rankOf(scores, c.target, c.excluded);
  });

  const results = {};
  METHODS.forEach((meth) => {
    let fn;
    if (meth === 'popularity') fn = (c, j) => c.norm.pop[j] + j * 1e-9;
    else if (meth === 'hybrid') fn = (c, j) => blend(c.norm, DEFAULT_WEIGHTS, j);
    else fn = (c, j) => c.norm[meth][j] + 1e-6 * c.norm.pop[j];
    results[meth] = metricsFromRanks(ranksFor(fn));
  });

  let tuned = { weights: DEFAULT_WEIGHTS, metrics: results.hybrid, trials: 0 };
  if (tune && cases.length) {
    const R = createRng(42);
    const objective = (m) => m.ndcg10 + 0.5 * m.hr10 + 0.25 * m.hr5;
    let bestObj = objective(results.hybrid);
    for (let t = 0; t < trials; t++) {
      const raw = COMPONENTS.map(() => -Math.log(1 - R.next() + 1e-9)); // Dirichlet(1) sample
      const sum = raw.reduce((a, b) => a + b, 0);
      const w = Object.fromEntries(COMPONENTS.map((c, i) => [c, raw[i] / sum]));
      if (w.academic < 0.15) continue; // keep the syllabus signal as a policy floor
      const met = metricsFromRanks(ranksFor((c, j) => blend(c.norm, w, j)));
      const obj = objective(met);
      if (obj > bestObj + 1e-9) {
        bestObj = obj;
        tuned = { weights: w, metrics: met, trials: t + 1 };
      }
    }
    tuned.trials = trials;
  }

  return {
    holdouts: holdouts.length,
    results,
    tuned,
    perStudent: cases.map((c, i) => ({
      studentId: holdouts[i].studentId,
      bookId: holdouts[i].bookId,
      rank: rankOf(Float64Array.from({ length: model.books.length }, (_, j) => blend(c.norm, tuned.weights, j)), c.target, c.excluded),
    })),
  };
}

// Full training run used by the app: evaluate, tune the blend, build the final model.
export function trainRecommender(db, opts = {}) {
  const started = Date.now();
  const evaluation = evaluate(db, opts);
  const weights = evaluation.tuned.weights;
  const model = buildModel(db, { today: opts.today, weights });
  // catalogue coverage of the top-10 lists
  const seen = new Set();
  db.students.forEach((s) => recommend(model, s.id, { limit: 10 }).forEach((r) => seen.add(r.book.id)));
  return {
    model,
    evaluation,
    weights,
    coverage: seen.size / db.books.length,
    trainedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
  };
}
