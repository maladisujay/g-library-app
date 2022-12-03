import { daysBetween, todayISO } from '../../utils/dates';
import { TfIdf, bookTokens, courseTokens, phraseTokens, addScaled, normalize, cosineSparse, topSharedTerms } from './text';
import { studentFeatures, profileSimilarity, cosineDense, FEATURE_WEIGHTS } from './similarity';
import { trainBPR, bprScore, foldIn } from './bpr';

export const COMPONENTS = ['userKNN', 'itemCF', 'bpr', 'content', 'academic'];

export const COMPONENT_INFO = {
  userKNN: { label: 'Similar students', short: 'Peers', color: '#a6192e', desc: 'User-based collaborative filtering. Neighbours are found with a hybrid similarity: Gower similarity on the student profile blended with cosine similarity of borrowing history.' },
  itemCF: { label: 'Co-borrowed titles', short: 'Co-borrow', color: '#d9822b', desc: 'Item-based collaborative filtering. Books that are frequently borrowed by the same students are treated as similar (cosine with significance shrinkage).' },
  bpr: { label: 'Latent factors (BPR)', short: 'BPR-MF', color: '#6b3fa0', desc: 'Matrix factorisation trained with Bayesian Personalised Ranking on implicit borrow events. New students are folded in from similar students.' },
  content: { label: 'Content match', short: 'Content', color: '#2f6f9f', desc: 'TF-IDF content model: the student profile vector is built from borrowed books, interests and current course syllabi, and matched to each book.' },
  academic: { label: 'Syllabus and exams', short: 'Syllabus', color: '#1f7a6d', desc: 'Books prescribed in the syllabus of the student\'s registered courses and electives, boosted as the next exam for that course gets closer.' },
};

export const DEFAULT_WEIGHTS = { userKNN: 0.26, itemCF: 0.14, bpr: 0.14, content: 0.16, academic: 0.3 };
const POP_WEIGHT = 0.03;
const K_NEIGHBOURS = 6;

export function buildModel(db, opts = {}) {
  const started = Date.now();
  const today = opts.today || todayISO();
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights || {}) };
  const { students, books } = db;
  const n = students.length;
  const m = books.length;
  const uIdx = new Map(students.map((s, i) => [s.id, i]));
  const bIdx = new Map(books.map((b, j) => [b.id, j]));
  const courseMap = new Map(db.courses.map((c) => [c.code, c]));

  // ----- implicit feedback matrix -----
  const R = Array.from({ length: n }, () => new Float64Array(m));
  const hist = Array.from({ length: n }, () => new Set());
  const lastBorrow = Array.from({ length: n }, () => new Map());
  const pop = new Float64Array(m);
  db.loans.forEach((l) => {
    const u = uIdx.get(l.studentId);
    const j = bIdx.get(l.bookId);
    if (u == null || j == null) return;
    const age = Math.max(0, daysBetween(l.issueDate, today));
    let w = 1 + 0.3 * (l.renewals || 0);
    if (l.rating) w += (l.rating - 3) * 0.3;
    w *= 0.6 + 0.4 * Math.exp(-age / 365);
    R[u][j] += Math.max(0.2, w);
    hist[u].add(j);
    const prev = lastBorrow[u].get(j);
    if (!prev || prev < l.issueDate) lastBorrow[u].set(j, l.issueDate);
    if (age <= 180) pop[j] += 1;
  });
  const popMax = Math.max(1, ...pop);

  // ----- student similarity -----
  const feats = students.map((s) => studentFeatures(s, today));
  const P = Array.from({ length: n }, () => new Float64Array(n));
  const Pparts = Array.from({ length: n }, () => new Array(n));
  const B = Array.from({ length: n }, () => new Float64Array(n));
  const H = Array.from({ length: n }, () => new Float64Array(n));
  for (let a = 0; a < n; a++) {
    for (let b = a; b < n; b++) {
      const { sim, parts } = a === b ? { sim: 1, parts: null } : profileSimilarity(feats[a], feats[b], opts.featureWeights || FEATURE_WEIGHTS);
      P[a][b] = P[b][a] = sim;
      Pparts[a][b] = Pparts[b][a] = parts;
      const c = a === b ? 1 : cosineDense(R[a], R[b]);
      B[a][b] = B[b][a] = c;
    }
  }
  // Shrink towards the profile when a student has little history (cold start).
  for (let a = 0; a < n; a++) {
    const lam = hist[a].size / (hist[a].size + 4);
    for (let b = 0; b < n; b++) {
      const lamB = hist[b].size / (hist[b].size + 4);
      const l = Math.min(lam, lamB);
      H[a][b] = (1 - 0.5 * l) * P[a][b] + 0.5 * l * B[a][b];
    }
  }

  // ----- item-item similarity on co-borrowing -----
  const colNorm = new Float64Array(m);
  for (let j = 0; j < m; j++) {
    let s = 0;
    for (let u = 0; u < n; u++) s += R[u][j] * R[u][j];
    colNorm[j] = Math.sqrt(s);
  }
  const itemSim = Array.from({ length: m }, () => new Float64Array(m));
  for (let i = 0; i < m; i++) {
    if (!colNorm[i]) continue;
    for (let j = i + 1; j < m; j++) {
      if (!colNorm[j]) continue;
      let dot = 0;
      let co = 0;
      for (let u = 0; u < n; u++) {
        if (R[u][i] && R[u][j]) {
          dot += R[u][i] * R[u][j];
          co += 1;
        }
      }
      if (!co) continue;
      const s = (dot / (colNorm[i] * colNorm[j])) * (co / (co + 2));
      itemSim[i][j] = itemSim[j][i] = s;
    }
  }

  // ----- content model -----
  const bookToks = books.map(bookTokens);
  const tfidf = new TfIdf(bookToks);
  const bookVecs = bookToks.map((t) => tfidf.vector(t));
  const contentSim = Array.from({ length: m }, () => new Float64Array(m));
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {
      const s = cosineSparse(bookVecs[i], bookVecs[j]);
      contentSim[i][j] = contentSim[j][i] = s;
    }
  }
  const courseVecs = new Map(db.courses.map((c) => [c.code, tfidf.vector(courseTokens(c))]));

  // ----- BPR matrix factorisation -----
  const bpr = trainBPR(hist, m, { factors: 16, epochs: 60, seed: 11 });
  const userVecs = students.map((s, u) => {
    if (hist[u].size >= 2) return bpr.P[u];
    const neigh = rankNeighbours(P, u, K_NEIGHBOURS).filter(([v]) => hist[v].size >= 2);
    return foldIn(bpr, neigh);
  });

  // ----- exams: next upcoming exam per course -----
  const nextExam = new Map();
  db.exams.forEach((e) => {
    const d = daysBetween(today, e.date);
    if (d < 0) return;
    const prev = nextExam.get(e.courseCode);
    if (!prev || d < prev.days) nextExam.set(e.courseCode, { ...e, days: d });
  });

  return {
    today,
    weights,
    students,
    books,
    uIdx,
    bIdx,
    courseMap,
    R,
    hist,
    lastBorrow,
    pop,
    popMax,
    P,
    Pparts,
    B,
    H,
    itemSim,
    tfidf,
    bookVecs,
    contentSim,
    courseVecs,
    bpr,
    userVecs,
    nextExam,
    stats: {
      students: n,
      books: m,
      interactions: db.loans.length,
      pairs: hist.reduce((s, h) => s + h.size, 0),
      density: hist.reduce((s, h) => s + h.size, 0) / (n * m),
      vocabulary: tfidf.df.size,
      bprLoss: bpr.losses,
      buildMs: Date.now() - started,
    },
  };
}

function rankNeighbours(S, u, k) {
  const arr = [];
  for (let v = 0; v < S.length; v++) if (v !== u && S[u][v] > 0) arr.push([v, S[u][v]]);
  return arr.sort((a, b) => b[1] - a[1]).slice(0, k);
}

// Raw (unnormalised) score vectors for every component, plus explanation data.
export function componentScores(model, u) {
  const { R, hist, H, itemSim, bookVecs, books, courseMap, courseVecs, nextExam, bpr, userVecs } = model;
  const m = books.length;
  const s = model.students[u];
  const out = {};
  const explain = { userKNN: new Map(), itemCF: new Map(), academic: new Map(), content: new Map() };

  // user-kNN
  const neigh = rankNeighbours(H, u, K_NEIGHBOURS);
  const uk = new Float64Array(m);
  const tot = neigh.reduce((a, [, w]) => a + w, 0) || 1;
  neigh.forEach(([v, w]) => {
    for (let j = 0; j < m; j++) {
      if (!R[v][j]) continue;
      uk[j] += (w * Math.min(1.5, R[v][j])) / tot;
      const list = explain.userKNN.get(j) || [];
      list.push(v);
      explain.userKNN.set(j, list);
    }
  });
  out.userKNN = uk;

  // item-item
  const ic = new Float64Array(m);
  const best = new Map();
  hist[u].forEach((i) => {
    for (let j = 0; j < m; j++) {
      const sv = itemSim[i][j] * R[u][i];
      if (!sv) continue;
      ic[j] += sv;
      // explain with the co-borrowed title that is also closest in content
      const ex = sv * (0.3 + model.contentSim[i][j]);
      if (!best.has(j) || best.get(j)[1] < ex) best.set(j, [i, ex]);
    }
  });
  best.forEach(([i], j) => explain.itemCF.set(j, i));
  out.itemCF = ic;

  // BPR
  const bp = new Float64Array(m);
  if (bpr.pairs) for (let j = 0; j < m; j++) bp[j] = bprScore(bpr, userVecs[u], j);
  out.bpr = bp;

  // content profile
  const profile = new Map();
  hist[u].forEach((i) => addScaled(profile, bookVecs[i], Math.min(2, R[u][i])));
  const interestVec = model.tfidf.vector(phraseTokens((s.interests || []).map((x) => x.replace(/-/g, ' '))));
  addScaled(profile, interestVec, 1.5);
  (s.courses || []).forEach((c) => {
    const cv = courseVecs.get(c);
    if (cv) addScaled(profile, cv, 0.8);
  });
  const pvec = normalize(profile);
  const ct = new Float64Array(m);
  for (let j = 0; j < m; j++) ct[j] = cosineSparse(pvec, bookVecs[j]);
  out.content = ct;
  explain.contentProfile = pvec;

  // syllabus and exam timetable
  const ac = new Float64Array(m);
  (s.courses || []).forEach((code) => {
    const c = courseMap.get(code);
    if (!c) return;
    const ex = nextExam.get(code);
    const urgency = ex ? 1 + 1.5 * Math.exp(-ex.days / 7) : 1;
    const cv = courseVecs.get(code);
    for (let j = 0; j < m; j++) {
      const id = books[j].id;
      let base = 0;
      let role = null;
      if (c.textbooks.includes(id)) { base = 1; role = 'Textbook'; }
      else if (c.references.includes(id)) { base = 0.75; role = 'Reference'; }
      else if (cv) {
        const sim = cosineSparse(cv, bookVecs[j]);
        if (sim > 0.15) { base = 0.6 * Math.min(1, sim / 0.45); role = 'Syllabus match'; }
      }
      if (!base) continue;
      const sc = base * urgency;
      if (sc > ac[j]) {
        ac[j] = sc;
        explain.academic.set(j, { course: c, role, exam: ex || null });
      }
    }
  });
  out.academic = ac;
  out.explain = explain;
  out.neighbours = neigh;
  return out;
}

function normVec(v, excluded) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < v.length; j++) {
    if (excluded.has(j)) continue;
    if (v[j] < lo) lo = v[j];
    if (v[j] > hi) hi = v[j];
  }
  const out = new Float64Array(v.length);
  if (!(hi > lo)) return out;
  // non-negative components are scaled by their max; BPR (can be negative) by min-max
  const floor = lo < 0 ? lo : 0;
  for (let j = 0; j < v.length; j++) out[j] = Math.max(0, (v[j] - floor) / (hi - floor));
  return out;
}

export function normalisedComponents(model, u, excluded) {
  const raw = componentScores(model, u);
  const norm = {};
  COMPONENTS.forEach((c) => { norm[c] = normVec(raw[c], excluded); });
  // Normalisation hides how similar the neighbours really are, so scale the
  // peer signal by neighbourhood confidence (students with no close peers rely on other signals).
  const nb = raw.neighbours;
  const avgSim = nb.length ? nb.reduce((a, [, w]) => a + w, 0) / nb.length : 0;
  const conf = Math.min(1, avgSim / 0.45);
  for (let j = 0; j < norm.userKNN.length; j++) norm.userKNN[j] *= conf;
  // BPR is also less reliable for students with very little history
  const h = model.hist[u].size;
  const bconf = h >= 2 ? Math.min(1, h / 6) : 0.5 * conf;
  for (let j = 0; j < norm.bpr.length; j++) norm.bpr[j] *= bconf;
  norm.pop = Float64Array.from(model.pop, (x) => x / model.popMax);
  return { raw, norm };
}

export function blend(norm, weights, j) {
  let s = POP_WEIGHT * norm.pop[j];
  COMPONENTS.forEach((c) => { s += (weights[c] || 0) * norm[c][j]; });
  return s;
}

const yearName = (y) => ['First', 'Second', 'Third', 'Fourth', 'Fifth'][y - 1] || `${y}th`;

export function describePeer(s) {
  const el = s.electives?.length ? ` · ${s.electives.length} elective${s.electives.length > 1 ? 's' : ''}` : '';
  return `${yearName(s.year)}-year ${s.program === 'AIML' ? 'CSE (AI&ML)' : s.program} student, Sem ${s.semester}${el}`;
}

function reasonsFor(model, u, j, comps, weights) {
  const { raw, norm } = comps;
  const contribs = COMPONENTS.map((c) => [c, (weights[c] || 0) * norm[c][j]]).filter(([, x]) => x > 0.01).sort((a, b) => b[1] - a[1]);
  const reasons = [];
  contribs.slice(0, 3).forEach(([c]) => {
    if (c === 'academic') {
      const a = raw.explain.academic.get(j);
      if (!a) return;
      let txt = `${a.role} for ${a.course.code} ${a.course.title}`;
      if (a.exam) txt += ` · ${a.exam.type.replace('Mid Semester Exam', 'Mid-term')} ${a.exam.days === 0 ? 'today' : `in ${a.exam.days} day${a.exam.days > 1 ? 's' : ''}`}`;
      reasons.push({ type: c, text: txt });
    } else if (c === 'userKNN') {
      const peers = raw.explain.userKNN.get(j) || [];
      if (!peers.length) return;
      reasons.push({ type: c, text: `Borrowed by ${peers.length} student${peers.length > 1 ? 's' : ''} with a profile similar to yours` });
    } else if (c === 'itemCF') {
      const i = raw.explain.itemCF.get(j);
      if (i == null) return;
      reasons.push({ type: c, text: `Readers of "${model.books[i].title}" also borrowed this` });
    } else if (c === 'content') {
      const terms = topSharedTerms(raw.explain.contentProfile, model.bookVecs[j], 3);
      if (!terms.length) return;
      reasons.push({ type: c, text: `Matches topics you read and study: ${terms.join(', ')}` });
    } else if (c === 'bpr') {
      reasons.push({ type: c, text: 'Fits your overall borrowing pattern' });
    }
  });
  return reasons;
}

// Hybrid recommendations with MMR re-ranking for diversity.
export function recommend(model, studentId, opts = {}) {
  const { limit = 12, weights = model.weights, diversity = 0.25, includeBorrowed = false } = opts;
  const u = model.uIdx.get(studentId);
  if (u == null) return [];
  const excluded = includeBorrowed ? new Set() : new Set(model.hist[u]);
  const comps = normalisedComponents(model, u, excluded);
  const m = model.books.length;
  const scored = [];
  for (let j = 0; j < m; j++) {
    if (excluded.has(j)) continue;
    scored.push([j, blend(comps.norm, weights, j)]);
  }
  scored.sort((a, b) => b[1] - a[1]);
  const cutoff = scored.length ? scored[0][1] * (opts.minRelative ?? 0.45) : 0;
  const pool = scored.slice(0, Math.max(limit * 3, 30)).filter(([, sc], k) => k < Math.min(limit, 6) || sc >= cutoff); // always keep a minimum list
  const chosen = [];
  while (chosen.length < limit && pool.length) {
    let bestK = 0;
    let bestV = -Infinity;
    pool.forEach(([j, sc], k) => {
      const red = chosen.length ? Math.max(...chosen.map((c) => model.contentSim[j][c.j])) : 0;
      const v = (1 - diversity) * sc - diversity * red;
      if (v > bestV) { bestV = v; bestK = k; }
    });
    const [j, sc] = pool.splice(bestK, 1)[0];
    chosen.push({ j, score: sc });
  }
  const top = Math.max(1e-9, ...chosen.map((c) => c.score));
  let prev = 99;
  return chosen.map(({ j, score }) => ({
    book: model.books[j],
    score,
    match: (prev = Math.min(prev, Math.round(Math.min(99, 55 + 44 * (score / top))))),
    parts: Object.fromEntries(COMPONENTS.map((c) => [c, (weights[c] || 0) * comps.norm[c][j]])),
    reasons: reasonsFor(model, u, j, comps, weights),
  }));
}

export function similarStudents(model, studentId, k = 5) {
  const u = model.uIdx.get(studentId);
  if (u == null) return [];
  return rankNeighbours(model.H, u, k).map(([v, sim]) => {
    const a = model.students[u];
    const b = model.students[v];
    const shared = [];
    if (a.program === b.program) shared.push('Same programme');
    if (a.semester === b.semester) shared.push('Same semester');
    const el = (a.electives || []).filter((x) => (b.electives || []).includes(x) || (b.courses || []).includes(x));
    el.forEach((x) => shared.push(model.courseMap.get(x)?.title || x));
    const it = (a.interests || []).filter((x) => (b.interests || []).includes(x));
    if (it.length) shared.push(`Interests: ${it.join(', ')}`);
    const common = [...model.hist[u]].filter((j) => model.hist[v].has(j)).length;
    return {
      student: b,
      label: describePeer(b),
      sim,
      profileSim: model.P[u][v],
      behaviourSim: model.B[u][v],
      parts: model.Pparts[u][v],
      shared,
      commonBooks: common,
      books: [...model.lastBorrow[v].entries()]
        .filter(([j]) => !model.hist[u].has(j))
        .sort((x, y) => (x[1] < y[1] ? 1 : -1))
        .map(([j]) => model.books[j]),
    };
  });
}

export function becauseYouBorrowed(model, studentId, seeds = 2, per = 4) {
  const u = model.uIdx.get(studentId);
  if (u == null) return [];
  const recent = [...model.lastBorrow[u].entries()].sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, seeds);
  return recent.map(([i]) => {
    const row = model.itemSim[i];
    const cs = model.contentSim[i];
    const items = [];
    for (let j = 0; j < model.books.length; j++) {
      if (j === i || model.hist[u].has(j)) continue;
      const sc = row[j] * (0.4 + cs[j]) + 0.3 * cs[j];
      if (sc > 0.05) items.push([j, sc]);
    }
    items.sort((a, b) => b[1] - a[1]);
    return { seed: model.books[i], books: items.slice(0, per).map(([j]) => model.books[j]) };
  }).filter((g) => g.books.length);
}

export function examPlan(model, studentId) {
  const u = model.uIdx.get(studentId);
  if (u == null) return [];
  const s = model.students[u];
  return (s.courses || []).map((code) => {
    const c = model.courseMap.get(code);
    if (!c) return null;
    const ex = model.nextExam.get(code) || null;
    const cv = model.courseVecs.get(code);
    const rows = [];
    model.books.forEach((b, j) => {
      let role = null;
      let w = 0;
      if (c.textbooks.includes(b.id)) { role = 'Textbook'; w = 3; }
      else if (c.references.includes(b.id)) { role = 'Reference'; w = 2; }
      else if (cv) {
        const sim = cosineSparse(cv, model.bookVecs[j]);
        if (sim > 0.2) { role = 'Also useful'; w = sim; }
      }
      if (role) rows.push({ book: b, role, w, borrowedBefore: model.hist[u].has(j) });
    });
    rows.sort((a, b) => b.w - a.w);
    return {
      course: c,
      elective: (s.electives || []).includes(code),
      exam: ex,
      books: rows.slice(0, 6),
    };
  }).filter(Boolean).sort((a, b) => (a.exam?.days ?? 999) - (b.exam?.days ?? 999));
}

export function trendingInCohort(model, studentId, limit = 6) {
  const u = model.uIdx.get(studentId);
  if (u == null) return [];
  const s = model.students[u];
  const counts = new Float64Array(model.books.length);
  model.students.forEach((o, v) => {
    if (v === u) return;
    const w = (o.program === s.program ? 1 : 0.3) * (o.semester === s.semester ? 1 : 0.5);
    model.lastBorrow[v].forEach((date, j) => {
      if (daysBetween(date, model.today) <= 150) counts[j] += w;
    });
  });
  return [...counts.keys()]
    .filter((j) => counts[j] > 0 && !model.hist[u].has(j))
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, limit)
    .map((j) => model.books[j]);
}

export function similarBooks(model, bookId, limit = 4) {
  const i = model.bIdx.get(bookId);
  if (i == null) return [];
  const out = [];
  for (let j = 0; j < model.books.length; j++) {
    if (j === i) continue;
    // co-borrowing, damped for unrelated titles that everyone in a cohort borrows
    const sc = model.itemSim[i][j] * (0.4 + model.contentSim[i][j]) + 0.3 * model.contentSim[i][j];
    if (sc > 0.05) out.push([j, sc]);
  }
  return out.sort((a, b) => b[1] - a[1]).slice(0, limit).map(([j]) => model.books[j]);
}
