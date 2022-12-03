import { ageFrom, parseISO } from '../../utils/dates';

// Weights for the mixed-type (Gower) student similarity.
export const FEATURE_WEIGHTS = {
  program: 3,
  school: 1,
  semester: 2,
  age: 1,
  gender: 0.5,
  electives: 3,
  courses: 2.5,
  completed: 1.5,
  interests: 2,
  cgpa: 0.5,
};

export const FEATURE_LABELS = {
  program: 'Programme',
  school: 'School',
  semester: 'Semester',
  age: 'Age',
  gender: 'Gender',
  electives: 'Electives',
  courses: 'Current courses',
  completed: 'Completed courses',
  interests: 'Reading interests',
  cgpa: 'CGPA band',
};

export function jaccard(a, b) {
  if (!a.length && !b.length) return null;
  const sa = new Set(a);
  let inter = 0;
  b.forEach((x) => { if (sa.has(x)) inter += 1; });
  const union = sa.size + new Set(b).size - inter;
  return union ? inter / union : 0;
}

export function studentFeatures(s, todayStr) {
  return {
    program: s.program,
    school: s.school,
    semester: s.semester,
    age: ageFrom(s.dob, parseISO(todayStr)),
    gender: s.gender,
    electives: s.electives || [],
    courses: s.courses || [],
    completed: s.completed || [],
    interests: s.interests || [],
    cgpa: s.cgpa,
  };
}

// Gower similarity: per-feature similarity in [0,1], weighted and averaged
// over the features that are defined for both students.
export function profileSimilarity(a, b, weights = FEATURE_WEIGHTS) {
  const parts = {};
  const cat = (k) => (a[k] === b[k] ? 1 : 0);
  const num = (k, range) => (a[k] == null || b[k] == null ? null : Math.max(0, 1 - Math.abs(a[k] - b[k]) / range));
  parts.program = cat('program');
  parts.school = cat('school');
  parts.semester = num('semester', 6);
  parts.age = num('age', 6);
  parts.gender = cat('gender');
  parts.electives = jaccard(a.electives, b.electives);
  parts.courses = jaccard(a.courses, b.courses);
  parts.completed = jaccard(a.completed, b.completed);
  parts.interests = jaccard(a.interests, b.interests);
  parts.cgpa = num('cgpa', 3);
  let s = 0;
  let w = 0;
  Object.keys(parts).forEach((k) => {
    if (parts[k] == null) return;
    s += weights[k] * parts[k];
    w += weights[k];
  });
  return { sim: w ? s / w : 0, parts };
}

export function cosineDense(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / Math.sqrt(na * nb);
}
