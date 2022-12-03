// Tokenisation and TF-IDF vectors (sparse, stored as Map<term, weight>).
const STOP = new Set(
  'a an and the of for to in on with by from at as is are be into its their your our it this that or using vol ed edition introduction principles practice approach fundamentals concepts theory applications engineering'.split(' '),
);

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

// Phrases such as "machine learning" are kept as an extra joined token.
export function phraseTokens(phrases) {
  const out = [];
  phrases.forEach((p) => {
    const toks = tokenize(p);
    out.push(...toks);
    if (toks.length > 1) out.push(toks.join('_'));
  });
  return out;
}

export function bookTokens(book) {
  return [
    ...tokenize(book.title),
    ...tokenize(book.title),
    ...tokenize(book.subject),
    ...phraseTokens(book.tags || []),
    ...phraseTokens(book.tags || []),
  ];
}

export function courseTokens(course) {
  const units = (course.units || []).flatMap((u) => [u.title, u.topics]);
  return [...phraseTokens([course.title, course.title]), ...phraseTokens(units)];
}

export class TfIdf {
  constructor(docs) {
    this.df = new Map();
    this.N = docs.length;
    docs.forEach((toks) => {
      new Set(toks).forEach((w) => this.df.set(w, (this.df.get(w) || 0) + 1));
    });
  }

  idf(w) {
    return Math.log((1 + this.N) / (1 + (this.df.get(w) || 0))) + 1;
  }

  vector(tokens) {
    const tf = new Map();
    tokens.forEach((w) => tf.set(w, (tf.get(w) || 0) + 1));
    const v = new Map();
    tf.forEach((c, w) => {
      if (!this.df.has(w)) return; // ignore terms outside the catalogue vocabulary
      v.set(w, (1 + Math.log(c)) * this.idf(w));
    });
    return normalize(v);
  }
}

export function normalize(v) {
  let s = 0;
  v.forEach((x) => { s += x * x; });
  const n = Math.sqrt(s) || 1;
  const out = new Map();
  v.forEach((x, k) => out.set(k, x / n));
  return out;
}

export function addScaled(target, v, scale) {
  v.forEach((x, k) => target.set(k, (target.get(k) || 0) + x * scale));
  return target;
}

export function cosineSparse(a, b) {
  if (!a.size || !b.size) return 0;
  const [s, l] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  s.forEach((x, k) => {
    const y = l.get(k);
    if (y) dot += x * y;
  });
  return dot; // vectors are L2-normalised
}

const GENERIC = new Set(['science', 'general', 'self', 'help', 'personal', 'handling', 'systems', 'design', 'reading', 'basics']);

export function topSharedTerms(a, b, n = 3) {
  const out = [];
  a.forEach((x, k) => {
    const y = b.get(k);
    if (y && !k.includes('_') && !GENERIC.has(k)) out.push([k, x * y]);
  });
  return out.sort((p, q) => q[1] - p[1]).slice(0, n).map((p) => p[0]);
}
