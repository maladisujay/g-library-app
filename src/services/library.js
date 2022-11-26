// Library business rules: circulation, holds, fines and catalogue maintenance.
// Every mutating function works on a draft copy of the database and returns
// { ok, message } so the UI can show the outcome.
import { addDaysISO, daysBetween, fmtDate, todayISO } from '../utils/dates';

const ok = (message, extra = {}) => ({ ok: true, message, ...extra });
const fail = (message) => ({ ok: false, message });

export const bookById = (db, id) => db.books.find((b) => b.id === id);
export const studentById = (db, id) => db.students.find((s) => s.id === id);
export const copyById = (db, id) => db.copies.find((c) => c.id === String(id).trim().toUpperCase());

export function stockOf(db, bookId) {
  const cs = db.copies.filter((c) => c.bookId === bookId);
  const lending = cs.filter((c) => c.type === 'lending');
  return {
    total: cs.length,
    lending: lending.length,
    reference: cs.filter((c) => c.type === 'reference').length,
    available: lending.filter((c) => c.status === 'available').length,
    issued: cs.filter((c) => c.status === 'issued').length,
    held: cs.filter((c) => c.status === 'held').length,
    unavailable: cs.filter((c) => c.status === 'lost' || c.status === 'damaged').length,
    holdsWaiting: db.holds.filter((h) => h.bookId === bookId && h.status === 'waiting').length,
  };
}

export function stockMap(db) {
  const map = new Map(db.books.map((b) => [b.id, { total: 0, lending: 0, reference: 0, available: 0, issued: 0, held: 0, unavailable: 0, holdsWaiting: 0 }]));
  db.copies.forEach((c) => {
    const s = map.get(c.bookId);
    if (!s) return;
    s.total += 1;
    if (c.type === 'reference') s.reference += 1;
    else {
      s.lending += 1;
      if (c.status === 'available') s.available += 1;
    }
    if (c.status === 'issued') s.issued += 1;
    if (c.status === 'held') s.held += 1;
    if (c.status === 'lost' || c.status === 'damaged') s.unavailable += 1;
  });
  db.holds.forEach((h) => { if (h.status === 'waiting' && map.get(h.bookId)) map.get(h.bookId).holdsWaiting += 1; });
  return map;
}

export const activeLoans = (db, sid) => db.loans.filter((l) => l.studentId === sid && !l.returnDate);

export function overdueDays(loan, today = todayISO()) {
  if (loan.returnDate) return 0;
  return Math.max(0, daysBetween(loan.dueDate, today));
}

export function accruingFine(db, loan) {
  return overdueDays(loan) * db.settings.finePerDay;
}

export function fineSummary(db, sid) {
  const unpaid = db.fines.filter((f) => f.studentId === sid && f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
  const accruing = activeLoans(db, sid).reduce((s, l) => s + accruingFine(db, l), 0);
  return { unpaid, accruing, total: unpaid + accruing };
}

export function eligibility(db, sid) {
  const st = studentById(db, sid);
  const reasons = [];
  if (!st) return { ok: false, reasons: ['Member not found'] };
  if (st.status !== 'Active') reasons.push(`Membership is ${st.status.toLowerCase()}`);
  const act = activeLoans(db, sid);
  if (act.length >= db.settings.maxLoans) reasons.push(`Borrowing limit reached (${db.settings.maxLoans} books)`);
  const od = act.filter((l) => overdueDays(l) > 0);
  if (od.length) reasons.push(`${od.length} overdue book${od.length > 1 ? 's' : ''} must be returned first`);
  const f = fineSummary(db, sid);
  if (f.unpaid > db.settings.fineBlockLimit) reasons.push(`Unpaid fines above ₹${db.settings.fineBlockLimit}`);
  return { ok: reasons.length === 0, reasons, remaining: Math.max(0, db.settings.maxLoans - act.length) };
}

function log(db, actor, type, text) {
  const now = new Date();
  db.activity.unshift({
    id: `A${Date.now()}${Math.floor(Math.random() * 1000)}`,
    date: todayISO(),
    time: now.toTimeString().slice(0, 5),
    actor,
    type,
    text,
  });
  db.activity = db.activity.slice(0, 200);
}

const nextId = (db, key, prefix, pad) => {
  const n = db.counters[key]++;
  return `${prefix}${String(n).padStart(pad, '0')}`;
};

// ---------- circulation ----------
export function issueCopy(db, { studentId, copyId }, actor) {
  const st = studentById(db, studentId);
  if (!st) return fail('No member with that registration number.');
  const copy = copyById(db, copyId);
  if (!copy) return fail('No copy with that accession number.');
  const book = bookById(db, copy.bookId);
  if (copy.type === 'reference') return fail('This is a reference copy (in-library use only).');
  if (copy.status === 'issued') return fail('This copy is already issued.');
  if (copy.status === 'lost' || copy.status === 'damaged') return fail(`This copy is marked ${copy.status}.`);
  let hold = null;
  if (copy.status === 'held') {
    hold = db.holds.find((h) => h.copyId === copy.id && h.status === 'ready');
    if (hold && hold.studentId !== studentId) return fail(`This copy is on the hold shelf for ${studentById(db, hold.studentId)?.name}.`);
  }
  if (activeLoans(db, studentId).some((l) => l.bookId === copy.bookId)) return fail('The member already has a copy of this title.');
  const el = eligibility(db, studentId);
  if (!el.ok) return fail(`Cannot issue: ${el.reasons.join('; ')}.`);
  const today = todayISO();
  const loan = {
    id: nextId(db, 'loan', 'L', 5),
    copyId: copy.id,
    bookId: copy.bookId,
    studentId,
    issueDate: today,
    dueDate: addDaysISO(today, db.settings.loanDays),
    returnDate: null,
    renewals: 0,
    rating: null,
    issuedBy: actor,
  };
  db.loans.push(loan);
  copy.status = 'issued';
  const waiting = hold || db.holds.find((h) => h.bookId === copy.bookId && h.studentId === studentId && (h.status === 'waiting' || h.status === 'ready'));
  if (waiting) {
    if (waiting.status === 'ready' && waiting.copyId && waiting.copyId !== copy.id) {
      const other = copyById(db, waiting.copyId);
      if (other && other.status === 'held') other.status = 'available';
    }
    waiting.status = 'fulfilled';
  }
  log(db, actor, 'issue', `Issued "${book.title}" (${copy.id}) to ${st.name} (${st.regNo}), due ${fmtDate(loan.dueDate)}`);
  return ok(`Issued "${book.title}" to ${st.name}. Due on ${fmtDate(loan.dueDate)}.`, { loan });
}

function promoteHold(db, copy, actor) {
  const queue = db.holds
    .filter((h) => h.bookId === copy.bookId && h.status === 'waiting')
    .sort((a, b) => (a.placedOn < b.placedOn ? -1 : 1));
  if (!queue.length) return null;
  const h = queue[0];
  h.status = 'ready';
  h.copyId = copy.id;
  h.readyOn = todayISO();
  h.expiresOn = addDaysISO(h.readyOn, db.settings.holdExpiryDays);
  copy.status = 'held';
  log(db, actor, 'hold', `Copy ${copy.id} placed on hold shelf for ${studentById(db, h.studentId)?.name}`);
  return h;
}

export function returnCopy(db, copyId, actor) {
  const copy = copyById(db, copyId);
  if (!copy) return fail('No copy with that accession number.');
  const loan = db.loans.find((l) => l.copyId === copy.id && !l.returnDate);
  if (!loan) return fail('This copy is not currently issued.');
  const today = todayISO();
  const late = overdueDays(loan, today);
  loan.returnDate = today;
  copy.status = 'available';
  const st = studentById(db, loan.studentId);
  const book = bookById(db, loan.bookId);
  let fine = null;
  if (late > 0) {
    fine = {
      id: nextId(db, 'fine', 'F', 4),
      studentId: loan.studentId,
      loanId: loan.id,
      bookId: loan.bookId,
      amount: late * db.settings.finePerDay,
      reason: `Overdue by ${late} day${late > 1 ? 's' : ''}`,
      status: 'unpaid',
      createdOn: today,
      paidOn: null,
    };
    db.fines.push(fine);
  }
  const hold = promoteHold(db, copy, actor);
  log(db, actor, 'return', `Returned "${book.title}" (${copy.id}) from ${st.name}${fine ? `, fine ₹${fine.amount}` : ''}`);
  let msg = `Returned "${book.title}" from ${st.name}.`;
  if (fine) msg += ` Late by ${late} day${late > 1 ? 's' : ''}: fine of ₹${fine.amount} added.`;
  if (hold) msg += ` Place this copy on the hold shelf for ${studentById(db, hold.studentId)?.name}.`;
  return ok(msg, { fine, hold });
}

export function renewLoan(db, loanId, actor) {
  const loan = db.loans.find((l) => l.id === loanId);
  if (!loan || loan.returnDate) return fail('Loan not found.');
  if (loan.renewals >= db.settings.maxRenewals) return fail(`Renewal limit reached (${db.settings.maxRenewals}).`);
  if (overdueDays(loan) > 0) return fail('Overdue books cannot be renewed online. Please visit the circulation desk.');
  if (db.holds.some((h) => h.bookId === loan.bookId && h.status === 'waiting' && h.studentId !== loan.studentId)) {
    return fail('Another member has placed a hold on this title, so it cannot be renewed.');
  }
  loan.renewals += 1;
  loan.dueDate = addDaysISO(todayISO(), db.settings.loanDays);
  log(db, actor, 'renew', `Renewed "${bookById(db, loan.bookId).title}" for ${studentById(db, loan.studentId).name}, new due date ${fmtDate(loan.dueDate)}`);
  return ok(`Renewed. New due date: ${fmtDate(loan.dueDate)}.`);
}

export function placeHold(db, studentId, bookId, actor) {
  const book = bookById(db, bookId);
  if (!book) return fail('Book not found.');
  if (db.holds.some((h) => h.bookId === bookId && h.studentId === studentId && ['waiting', 'ready'].includes(h.status))) return fail('You already have a hold on this title.');
  if (activeLoans(db, studentId).some((l) => l.bookId === bookId)) return fail('You already have this book issued.');
  const st = stockOf(db, bookId);
  if (!st.lending) return fail('This title is for reference only and cannot be reserved.');
  const mine = db.holds.filter((h) => h.studentId === studentId && ['waiting', 'ready'].includes(h.status));
  if (mine.length >= 3) return fail('You can have at most 3 active holds.');
  const hold = {
    id: nextId(db, 'hold', 'H', 4),
    bookId,
    studentId,
    placedOn: todayISO(),
    status: 'waiting',
    copyId: null,
    readyOn: null,
    expiresOn: null,
  };
  db.holds.push(hold);
  // if a copy is on the shelf, it goes straight to the hold shelf
  const copy = db.copies.find((c) => c.bookId === bookId && c.type === 'lending' && c.status === 'available');
  if (copy) {
    promoteHold(db, copy, actor);
    log(db, actor, 'hold', `${studentById(db, studentId).name} reserved "${book.title}"`);
    return ok(`Reserved. A copy (${copy.id}) is being kept at the circulation desk for ${db.settings.holdExpiryDays} days.`);
  }
  const pos = db.holds.filter((h) => h.bookId === bookId && h.status === 'waiting').length;
  log(db, actor, 'hold', `${studentById(db, studentId).name} placed a hold on "${book.title}" (queue #${pos})`);
  return ok(`Hold placed. You are #${pos} in the queue. You will be notified when a copy is returned.`);
}

export function cancelHold(db, holdId, actor) {
  const h = db.holds.find((x) => x.id === holdId);
  if (!h || !['waiting', 'ready'].includes(h.status)) return fail('Hold not found.');
  if (h.status === 'ready' && h.copyId) {
    const copy = copyById(db, h.copyId);
    h.status = 'cancelled';
    if (copy) {
      copy.status = 'available';
      promoteHold(db, copy, actor);
    }
  } else h.status = 'cancelled';
  log(db, actor, 'hold', `Hold ${h.id} on "${bookById(db, h.bookId)?.title}" cancelled`);
  return ok('Hold cancelled.');
}

export function expireHolds(db) {
  const today = todayISO();
  let changed = false;
  db.holds.forEach((h) => {
    if (h.status === 'ready' && h.expiresOn && h.expiresOn < today) {
      h.status = 'expired';
      const copy = copyById(db, h.copyId);
      if (copy && copy.status === 'held') {
        copy.status = 'available';
        promoteHold(db, copy, 'system');
      }
      changed = true;
    }
  });
  return changed;
}

export function payFine(db, fineId, actor) {
  const f = db.fines.find((x) => x.id === fineId);
  if (!f || f.status !== 'unpaid') return fail('Fine not found.');
  f.status = 'paid';
  f.paidOn = todayISO();
  log(db, actor, 'fine', `Collected ₹${f.amount} from ${studentById(db, f.studentId)?.name} (${f.id})`);
  return ok(`₹${f.amount} collected. Receipt no. R-${f.id.slice(1)}.`);
}

export function waiveFine(db, fineId, actor) {
  const f = db.fines.find((x) => x.id === fineId);
  if (!f || f.status !== 'unpaid') return fail('Fine not found.');
  f.status = 'waived';
  f.paidOn = todayISO();
  log(db, actor, 'fine', `Waived ₹${f.amount} for ${studentById(db, f.studentId)?.name} (${f.id})`);
  return ok('Fine waived.');
}

export function rateLoan(db, loanId, rating) {
  const l = db.loans.find((x) => x.id === loanId);
  if (!l) return fail('Loan not found.');
  l.rating = rating;
  return ok('Thanks! Your rating helps improve recommendations.');
}

// ---------- catalogue ----------
export function saveBook(db, data, actor) {
  const clean = {
    ...data,
    title: data.title.trim(),
    authors: data.authors.trim(),
    year: Number(data.year) || null,
    tags: Array.isArray(data.tags) ? data.tags : String(data.tags || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
    location: { ...data.location, shelf: Number(data.location.shelf) || 1, rack: data.location.rack.trim().toUpperCase() },
  };
  if (!clean.title || !clean.authors) return fail('Title and author are required.');
  if (data.id) {
    const i = db.books.findIndex((b) => b.id === data.id);
    if (i < 0) return fail('Book not found.');
    db.books[i] = { ...db.books[i], ...clean };
    log(db, actor, 'catalogue', `Updated "${clean.title}"`);
    return ok('Book details saved.', { id: data.id });
  }
  const id = nextId(db, 'book', 'B', 3);
  const { copies: count = 1, referenceCopy = false, ...rest } = clean;
  db.books.push({ ...rest, id, language: rest.language || 'English', addedOn: todayISO(), description: rest.description || `${rest.category} covering ${rest.tags.slice(0, 4).join(', ')}.` });
  const n = Math.max(1, Number(count) || 1);
  for (let k = 0; k < n; k++) {
    db.copies.push({ id: nextId(db, 'copy', 'GL', 6), bookId: id, type: referenceCopy && k === n - 1 ? 'reference' : 'lending', status: 'available', condition: 'New', addedOn: todayISO() });
  }
  log(db, actor, 'catalogue', `Added "${clean.title}" with ${n} cop${n > 1 ? 'ies' : 'y'} on rack ${clean.location.rack}`);
  return ok(`Added "${clean.title}" with ${n} cop${n > 1 ? 'ies' : 'y'}.`, { id });
}

export function deleteBook(db, bookId, actor) {
  if (db.copies.some((c) => c.bookId === bookId && c.status === 'issued')) return fail('Copies of this title are issued. Receive them before withdrawing the title.');
  const b = bookById(db, bookId);
  db.books = db.books.filter((x) => x.id !== bookId);
  db.copies = db.copies.filter((c) => c.bookId !== bookId);
  db.holds.forEach((h) => { if (h.bookId === bookId && ['waiting', 'ready'].includes(h.status)) h.status = 'cancelled'; });
  log(db, actor, 'catalogue', `Withdrew "${b?.title}" from the catalogue`);
  return ok('Title withdrawn from the catalogue.');
}

export function addCopies(db, bookId, count, type, actor) {
  const n = Math.max(1, Math.min(50, Number(count) || 1));
  const ids = [];
  for (let k = 0; k < n; k++) {
    const id = nextId(db, 'copy', 'GL', 6);
    ids.push(id);
    db.copies.push({ id, bookId, type, status: 'available', condition: 'New', addedOn: todayISO() });
  }
  const b = bookById(db, bookId);
  // new stock can satisfy waiting holds
  ids.forEach((id) => { if (type === 'lending') promoteHold(db, copyById(db, id), actor); });
  log(db, actor, 'catalogue', `Accessioned ${n} new cop${n > 1 ? 'ies' : 'y'} of "${b.title}" (${ids[0]}${n > 1 ? ` to ${ids[n - 1]}` : ''})`);
  return ok(`Added ${n} cop${n > 1 ? 'ies' : 'y'}: ${ids.join(', ')}.`);
}

export function setCopyStatus(db, copyId, status, actor) {
  const c = copyById(db, copyId);
  if (!c) return fail('Copy not found.');
  if (c.status === 'issued') return fail('Receive the copy before changing its status.');
  if (c.status === 'held') return fail('This copy is reserved on the hold shelf.');
  c.status = status;
  if (status === 'available' && c.type === 'lending') promoteHold(db, c, actor);
  log(db, actor, 'catalogue', `Copy ${c.id} marked ${status}`);
  return ok(`Copy ${c.id} marked ${status}.`);
}

export function setCopyType(db, copyId, type, actor) {
  const c = copyById(db, copyId);
  if (!c) return fail('Copy not found.');
  if (c.status !== 'available') return fail('Only copies on the shelf can be changed.');
  c.type = type;
  log(db, actor, 'catalogue', `Copy ${c.id} changed to ${type}`);
  return ok(`Copy ${c.id} is now a ${type} copy.`);
}

// ---------- members ----------
export function saveStudent(db, data, actor) {
  const regNo = String(data.regNo || '').trim();
  if (!/^\d{12}$/.test(regNo)) return fail('Registration number must have 12 digits.');
  if (!data.name?.trim()) return fail('Name is required.');
  const existing = studentById(db, regNo);
  if (existing && !data.editing) return fail('A member with this registration number already exists.');
  const record = { ...(existing || {}), ...data, id: regNo, regNo, name: data.name.trim() };
  delete record.editing;
  if (existing) Object.assign(existing, record);
  else db.students.push({ status: 'Active', memberSince: todayISO(), password: 'student123', email: `${regNo}@student.glibrary.edu.in`, campus: 'Visakhapatnam', ...record });
  log(db, actor, 'member', `${existing ? 'Updated' : 'Registered'} member ${record.name} (${regNo})`);
  return ok(existing ? 'Member details saved.' : `Member registered. Default password: student123.`);
}

export function updateInterests(db, sid, interests) {
  const s = studentById(db, sid);
  if (!s) return fail('Not found');
  s.interests = interests;
  return ok('Reading interests updated. Your recommendations have been refreshed.');
}

// ---------- academics ----------
export function saveExam(db, exam, actor) {
  if (!db.courses.some((c) => c.code === exam.courseCode)) return fail('Unknown course code.');
  if (!exam.date) return fail('Date is required.');
  if (exam.id) {
    const e = db.exams.find((x) => x.id === exam.id);
    Object.assign(e, exam);
  } else db.exams.push({ ...exam, id: `E${db.counters.exam++}` });
  log(db, actor, 'academics', `Exam schedule updated: ${exam.courseCode} ${exam.type} on ${exam.date}`);
  return ok('Exam schedule saved.');
}

export function deleteExam(db, id, actor) {
  db.exams = db.exams.filter((e) => e.id !== id);
  log(db, actor, 'academics', `Exam entry ${id} removed`);
  return ok('Exam removed.');
}

// CSV columns: course_code,exam_type,date(YYYY-MM-DD),session
export function importExamsCsv(db, text, actor) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return fail('The file is empty.');
  const start = /course/i.test(lines[0]) ? 1 : 0;
  let added = 0;
  let updated = 0;
  const errors = [];
  lines.slice(start).forEach((line, i) => {
    const [code, type, date, session = 'FN'] = line.split(',').map((x) => x.trim().replace(/^"|"$/g, ''));
    if (!db.courses.some((c) => c.code === code)) { errors.push(`Row ${i + 1 + start}: unknown course ${code}`); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) { errors.push(`Row ${i + 1 + start}: bad date`); return; }
    const e = db.exams.find((x) => x.courseCode === code && x.type === type);
    if (e) { e.date = date; e.session = session; updated += 1; } else { db.exams.push({ id: `E${db.counters.exam++}`, courseCode: code, type, date, session, venue: 'As per seating plan' }); added += 1; }
  });
  if (!added && !updated) return fail(errors.slice(0, 3).join('; ') || 'No rows imported.');
  log(db, actor, 'academics', `Imported exam timetable: ${added} added, ${updated} updated`);
  return ok(`Imported: ${added} added, ${updated} updated${errors.length ? `, ${errors.length} skipped` : ''}.`);
}

// JSON: [{ code, title, credits, units:[{title, topics}], textbooks:[bookId], references:[bookId] }]
export function importSyllabusJson(db, text, actor) {
  let rows;
  try {
    rows = JSON.parse(text);
  } catch (e) {
    return fail('Invalid JSON file.');
  }
  if (!Array.isArray(rows)) rows = [rows];
  let n = 0;
  rows.forEach((r) => {
    if (!r.code || !r.title) return;
    const units = (r.units || []).map((u, i) => ({ no: i + 1, title: u.title || String(u), topics: u.topics || '' }));
    const record = { code: r.code, title: r.title, credits: r.credits || 3, units, textbooks: r.textbooks || [], references: r.references || [] };
    const i = db.courses.findIndex((c) => c.code === r.code);
    if (i >= 0) db.courses[i] = { ...db.courses[i], ...record };
    else db.courses.push(record);
    n += 1;
  });
  if (!n) return fail('No valid course entries found.');
  log(db, actor, 'academics', `Imported syllabus for ${n} course${n > 1 ? 's' : ''}`);
  return ok(`Syllabus imported for ${n} course${n > 1 ? 's' : ''}.`);
}

export function saveCourseBooks(db, code, textbooks, references, actor) {
  const c = db.courses.find((x) => x.code === code);
  if (!c) return fail('Course not found.');
  c.textbooks = textbooks;
  c.references = references;
  log(db, actor, 'academics', `Updated prescribed books for ${code}`);
  return ok('Prescribed books updated.');
}

export function addNotice(db, title, body, actor) {
  if (!title.trim()) return fail('Title is required.');
  db.notices.unshift({ id: `N${Date.now()}`, date: todayISO(), title: title.trim(), body: body.trim() });
  log(db, actor, 'notice', `Published notice "${title.trim()}"`);
  return ok('Notice published.');
}

export function deleteNotice(db, id) {
  db.notices = db.notices.filter((n) => n.id !== id);
  return ok('Notice removed.');
}

export function updateSettings(db, patch, actor) {
  const next = { ...db.settings };
  ['loanDays', 'maxLoans', 'maxRenewals', 'finePerDay', 'fineBlockLimit', 'holdExpiryDays'].forEach((k) => {
    if (patch[k] === undefined) return;
    const v = Number(patch[k]);
    if (!Number.isFinite(v) || v < 0) return;
    next[k] = Math.round(v);
  });
  if (next.loanDays < 1 || next.maxLoans < 1) return fail('Loan period and borrowing limit must be at least 1.');
  db.settings = next;
  log(db, actor, 'settings', 'Circulation rules updated');
  return ok('Circulation rules saved.');
}
