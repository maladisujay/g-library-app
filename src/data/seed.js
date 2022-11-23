import { buildBooks } from './books';
import { COURSES, CURRICULUM, PROGRAMS, coreCourses, completedCourses } from './courses';
import { STUDENT_ROWS, LIBRARIANS, INTEREST_BOOKS } from './students';
import { addDays, toISO, today, daysBetween } from '../utils/dates';
import { createRng } from '../utils/random';

export const SEED_VERSION = 4;

export const DEFAULT_SETTINGS = {
  loanDays: 14,
  maxLoans: 4,
  maxRenewals: 2,
  finePerDay: 2,
  fineBlockLimit: 100,
  holdExpiryDays: 3,
  semesterLabel: 'Odd Semester',
};

function courseSemester(program, code) {
  const core = CURRICULUM[program]?.core || {};
  const found = Object.keys(core).find((s) => core[s].includes(code));
  if (found) return Number(found);
  const el = CURRICULUM[program]?.electives || {};
  const f2 = Object.keys(el).find((s) => el[s].includes(code));
  return f2 ? Number(f2) : null;
}

export function createSeed() {
  const t = today();
  const iso = (d) => toISO(d);
  const R = createRng(20221128);
  const courseMap = Object.fromEntries(COURSES.map((c) => [c.code, c]));

  // ---------- Books and copies ----------
  const books = buildBooks().map((b) => ({ ...b, addedOn: iso(addDays(t, -R.int(420, 1400))) }));
  const copies = [];
  let acc = 1001;
  books.forEach((b) => {
    for (let k = 1; k <= b.initialCopies; k++) {
      copies.push({
        id: `GL${String(acc++).padStart(6, '0')}`,
        bookId: b.id,
        type: k === b.initialCopies && b.initialCopies >= 4 ? 'reference' : 'lending',
        status: 'available',
        condition: 'Good',
        addedOn: b.addedOn,
      });
    }
    delete b.initialCopies;
  });

  // ---------- Students ----------
  const students = STUDENT_ROWS.map((r) => {
    const p = PROGRAMS[r.program];
    const admYear = 2000 + Number(r.regNo.slice(1, 3));
    return {
      id: r.regNo,
      regNo: r.regNo,
      name: r.name,
      gender: r.gender,
      dob: r.dob,
      program: r.program,
      programName: p.name,
      school: p.school,
      semester: r.semester,
      year: Math.ceil(r.semester / 2),
      section: r.section,
      electives: r.electives,
      pastElectives: r.pastElectives,
      courses: [...coreCourses(r.program, r.semester), ...r.electives],
      completed: completedCourses(r.program, r.semester, r.pastElectives),
      interests: r.interests,
      cgpa: r.cgpa,
      residence: r.residence,
      phone: r.phone,
      email: `${r.regNo}@student.glibrary.edu.in`,
      admissionYear: admYear,
      campus: 'Visakhapatnam',
      password: 'student123',
      memberSince: iso(addDays(t, -R.int(60, 90) - (r.semester - 1) * 182)),
      status: 'Active',
    };
  });

  // ---------- Loans (simulated borrowing history) ----------
  const loans = [];
  const fines = [];
  let loanSeq = 1;
  const lending = (bookId) => copies.filter((c) => c.bookId === bookId && c.type === 'lending');
  const settings = DEFAULT_SETTINGS;

  const borrowed = new Map(); // studentId -> Set(bookId)
  const pending = [];

  const plan = (s, bookId, issue, kind) => {
    if (!bookId) return;
    const set = borrowed.get(s.id) || new Set();
    if (set.has(bookId)) return;
    if (daysBetween(s.memberSince, iso(issue)) < 0) return;
    if (daysBetween(iso(issue), iso(t)) < 0) return;
    set.add(bookId);
    borrowed.set(s.id, set);
    pending.push({ s, bookId, issue, kind });
  };

  students.forEach((s) => {
    if (s.semester === 1 && s.regNo === '122210301004') return; // first-semester student with no history (cold start)
    // Completed semesters
    s.completed.forEach((code) => {
      const c = courseMap[code];
      if (!c) return;
      const sem = courseSemester(s.program, code) || s.semester - 2;
      const semStart = addDays(t, -100 - (s.semester - sem) * 182);
      if (R.chance(0.7)) plan(s, R.pick(c.textbooks), addDays(semStart, R.int(15, 95)), 'past');
      if (c.references.length && R.chance(0.3)) plan(s, R.pick(c.references), addDays(semStart, R.int(20, 100)), 'past');
    });
    // Current semester
    s.courses.forEach((code) => {
      const c = courseMap[code];
      if (!c) return;
      if (R.chance(0.6)) plan(s, R.pick(c.textbooks), addDays(t, -R.int(2, 90)), 'current');
      if (c.references.length && R.chance(0.25)) plan(s, R.pick(c.references), addDays(t, -R.int(2, 80)), 'current');
    });
    // Interests
    s.interests.forEach((it) => {
      const pool = INTEREST_BOOKS[it] || [];
      if (pool.length && R.chance(0.65)) plan(s, R.pick(pool), addDays(t, -R.int(5, 420)), 'interest');
      if (pool.length > 1 && R.chance(0.3)) plan(s, R.pick(pool), addDays(t, -R.int(5, 420)), 'interest');
    });
  });

  pending.sort((a, b) => a.issue - b.issue);
  const activeCount = {};
  pending.forEach(({ s, bookId, issue }) => {
    const age = daysBetween(iso(issue), iso(t));
    const pool = lending(bookId);
    if (!pool.length) return;
    const due = addDays(issue, settings.loanDays);
    let active = age <= 13 || (age <= 26 && R.chance(0.3));
    if (active && (activeCount[s.id] || 0) >= 3) active = false;
    let copy;
    if (active) {
      copy = pool.find((c) => c.status === 'available');
      if (!copy) active = false;
    }
    if (!copy) copy = R.pick(pool);
    const loan = {
      id: `L${String(loanSeq++).padStart(5, '0')}`,
      copyId: copy.id,
      bookId,
      studentId: s.id,
      issueDate: iso(issue),
      dueDate: iso(due),
      returnDate: null,
      renewals: 0,
      rating: null,
      issuedBy: R.chance(0.6) ? 'LIB002' : 'LIB001',
    };
    if (active) {
      copy.status = 'issued';
      activeCount[s.id] = (activeCount[s.id] || 0) + 1;
    } else {
      let keep = R.int(5, 13);
      if (R.chance(0.25)) {
        loan.renewals = 1;
        loan.dueDate = iso(addDays(issue, settings.loanDays * 2));
        keep = R.int(16, 27);
      }
      if (R.chance(0.15)) keep += R.int(2, 9); // late return
      let ret = addDays(issue, keep);
      if (daysBetween(iso(ret), iso(t)) < 1) ret = addDays(t, -1);
      loan.returnDate = iso(ret);
      if (R.chance(0.55)) loan.rating = R.chance(0.7) ? R.int(4, 5) : 3;
      const late = daysBetween(loan.dueDate, loan.returnDate);
      if (late > 0) {
        fines.push({
          id: `F${String(fines.length + 1).padStart(4, '0')}`,
          studentId: s.id,
          loanId: loan.id,
          bookId,
          amount: late * settings.finePerDay,
          reason: `Overdue by ${late} day${late > 1 ? 's' : ''}`,
          status: daysBetween(loan.returnDate, iso(t)) > 60 || R.chance(0.5) ? 'paid' : 'unpaid',
          createdOn: loan.returnDate,
          paidOn: null,
        });
      }
    }
    loans.push(loan);
  });
  fines.forEach((f) => {
    if (f.status === 'paid') f.paidOn = toISO(addDays(f.createdOn, R.int(0, 5)));
  });

  // The most in-demand ML textbook is fully issued (drives the holds queue in the demo).
  ['B029'].forEach((bookId) => {
    const takers = students.filter((s) => s.courses.some((c) => ['CSEN3101', 'CSEN4101'].includes(c)) && !loans.some((l) => l.studentId === s.id && l.bookId === bookId));
    lending(bookId).filter((c) => c.status === 'available').forEach((copy, i) => {
      const s = takers[takers.length - 1 - i];
      if (!s) return;
      const issue = addDays(t, -(3 + i * 4));
      copy.status = 'issued';
      loans.push({ id: `L${String(loanSeq++).padStart(5, '0')}`, copyId: copy.id, bookId, studentId: s.id, issueDate: iso(issue), dueDate: iso(addDays(issue, settings.loanDays)), returnDate: null, renewals: 0, rating: null, issuedBy: 'LIB002' });
    });
  });

  // ---------- Holds on titles with no copy on the shelf ----------
  const holds = [];
  books.forEach((b) => {
    const pool = lending(b.id);
    if (!pool.length || pool.some((c) => c.status === 'available')) return;
    const usedBy = COURSES.filter((c) => c.textbooks.includes(b.id) || c.references.includes(b.id)).map((c) => c.code);
    const candidates = students.filter(
      (s) => s.courses.some((c) => usedBy.includes(c)) && !loans.some((l) => l.studentId === s.id && l.bookId === b.id && !l.returnDate),
    );
    candidates.slice(0, 2).forEach((s, i) => {
      holds.push({
        id: `H${String(holds.length + 1).padStart(4, '0')}`,
        bookId: b.id,
        studentId: s.id,
        placedOn: iso(addDays(t, -R.int(1, 4) + i)),
        status: 'waiting',
        copyId: null,
        readyOn: null,
        expiresOn: null,
      });
    });
  });

  // A hold that is ready for pickup, for the demo
  const demo = students[1];
  const mine = new Set(loans.filter((l) => l.studentId === demo.id).map((l) => l.bookId));
  const want = demo.courses.flatMap((c) => [...courseMap[c].textbooks, ...courseMap[c].references]).find((b) => !mine.has(b) && lending(b).some((c) => c.status === 'available'));
  if (want) {
    const copy = lending(want).find((c) => c.status === 'available');
    copy.status = 'held';
    holds.push({ id: `H${String(holds.length + 1).padStart(4, '0')}`, bookId: want, studentId: demo.id, placedOn: iso(addDays(t, -5)), status: 'ready', copyId: copy.id, readyOn: iso(addDays(t, -1)), expiresOn: iso(addDays(t, 2)) });
  }

  // ---------- Exam timetable ----------
  const current = Array.from(new Set(students.flatMap((s) => s.courses))).sort();
  const exams = [];
  current.forEach((code, i) => {
    const slot = i % 9;
    exams.push({ id: `E${exams.length + 1}`, courseCode: code, type: 'Mid Semester Exam I', date: iso(addDays(t, -52 + slot)), session: 'FN', venue: 'As per seating plan' });
    exams.push({ id: `E${exams.length + 1}`, courseCode: code, type: 'Mid Semester Exam II', date: iso(addDays(t, 4 + slot)), session: slot % 2 ? 'AN' : 'FN', venue: 'As per seating plan' });
    exams.push({ id: `E${exams.length + 1}`, courseCode: code, type: 'End Semester Exam', date: iso(addDays(t, 34 + (i % 12) * 2)), session: 'FN', venue: 'As per seating plan' });
  });

  const notices = [
    { id: 'N1', date: iso(addDays(t, -2)), title: 'Extended hours during Mid Semester Exams II', body: 'The reading hall on the first floor will remain open from 8:00 AM to 10:00 PM until the end of the mid-term exams.' },
    { id: 'N2', date: iso(addDays(t, -9)), title: 'New arrivals: AI and Data Science', body: 'Latest editions of Python for Data Analysis and Computer Vision: Algorithms and Applications are now on rack A-02 and A-01.' },
    { id: 'N3', date: iso(addDays(t, -20)), title: 'Return books before End Semester registrations', body: 'Students with overdue books or unpaid fines will not be issued a library clearance for end semester hall tickets.' },
  ];

  return {
    version: SEED_VERSION,
    seededOn: iso(t),
    settings: { ...DEFAULT_SETTINGS },
    librarians: LIBRARIANS,
    students,
    books,
    copies,
    loans,
    fines,
    holds,
    courses: COURSES,
    exams,
    notices,
    activity: [],
    counters: { loan: loanSeq, copy: acc, fine: fines.length + 1, hold: holds.length + 1, book: 97, exam: exams.length + 1 },
  };
}

// Shift every stored date so a saved demo database never goes stale.
const DATE_FIELDS = {
  books: ['addedOn'],
  copies: ['addedOn'],
  students: ['memberSince'],
  loans: ['issueDate', 'dueDate', 'returnDate'],
  fines: ['createdOn', 'paidOn'],
  holds: ['placedOn', 'readyOn', 'expiresOn'],
  exams: ['date'],
  notices: ['date'],
  activity: ['date'],
};

export function rebaseDates(db, days) {
  if (!days) return db;
  const shift = (v) => (v ? toISO(addDays(v, days)) : v);
  Object.entries(DATE_FIELDS).forEach(([coll, fields]) => {
    (db[coll] || []).forEach((row) => fields.forEach((f) => { row[f] = shift(row[f]); }));
  });
  db.seededOn = shift(db.seededOn);
  return db;
}
