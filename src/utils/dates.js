const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d, n) {
  const x = typeof d === 'string' ? parseISO(d) : new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addDaysISO(s, n) {
  return toISO(addDays(s, n));
}

export function todayISO() {
  return toISO(today());
}

// Whole days from a to b (b - a).
export function daysBetween(a, b) {
  const da = typeof a === 'string' ? parseISO(a) : a;
  const db = typeof b === 'string' ? parseISO(b) : b;
  return Math.round((db - da) / DAY);
}

export function fmtDate(s) {
  if (!s) return '-';
  const d = parseISO(s);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtShort(s) {
  const d = parseISO(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function relDays(n) {
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n === -1) return 'yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

export function ageFrom(dob, ref = today()) {
  const d = parseISO(dob);
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age -= 1;
  return age;
}

export function academicYear(ref = today()) {
  const y = ref.getMonth() >= 5 ? ref.getFullYear() : ref.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}
