import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createSeed, rebaseDates, SEED_VERSION } from '../data/seed';
import { daysBetween, todayISO } from '../utils/dates';
import * as lib from '../services/library';
import { trainRecommender } from '../services/recommender/evaluate';

const DB_KEY = 'glibrary.db';
const SESSION_KEY = 'glibrary.session';

const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

function save(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    // storage full or disabled: the app keeps working in memory
  }
}

function loadDb() {
  let db = null;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) db = JSON.parse(raw);
  } catch (e) {
    db = null;
  }
  if (!db || db.version !== SEED_VERSION) {
    db = createSeed();
  } else {
    // keep the demo current: move all dates forward if the data is older than a few days
    const gap = daysBetween(db.seededOn, todayISO());
    if (gap >= 3) rebaseDates(db, gap);
  }
  lib.expireHolds(db);
  save(db);
  return db;
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch (e) {
    return null;
  }
}

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const [db, setDb] = useState(loadDb);
  const [session, setSession] = useState(loadSession);
  const [trainTick, setTrainTick] = useState(0);
  const dbRef = useRef(db);

  // Mutations run on a draft; on success the draft becomes the new state.
  const run = useCallback((fn, ...args) => {
    const draft = clone(dbRef.current);
    const result = fn(draft, ...args);
    if (result && result.ok === false) return result;
    dbRef.current = draft;
    save(draft);
    setDb(draft);
    return result;
  }, []);

  // The recommender is retrained whenever the data it learns from changes.
  const rec = useMemo(
    () => trainRecommender({ students: db.students, books: db.books, loans: db.loans, courses: db.courses, exams: db.exams }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.students, db.books, db.loans, db.courses, db.exams, trainTick],
  );

  const login = useCallback((role, id, password) => {
    const uid = String(id || '').trim().toUpperCase();
    const list = role === 'librarian' ? db.librarians : db.students;
    const user = list.find((u) => u.id.toUpperCase() === uid);
    if (!user || user.password !== password) return { ok: false, message: 'Invalid ID or password.' };
    if (role === 'student' && user.status !== 'Active') return { ok: false, message: 'Your library membership is not active. Contact the circulation desk.' };
    const s = { role, id: user.id };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    return { ok: true };
  }, [db]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createSeed();
    dbRef.current = fresh;
    save(fresh);
    setDb(fresh);
  }, []);

  const user = useMemo(() => {
    if (!session) return null;
    const list = session.role === 'librarian' ? db.librarians : db.students;
    return list.find((u) => u.id === session.id) || null;
  }, [session, db.librarians, db.students]);

  const stock = useMemo(() => lib.stockMap(db), [db]);

  const value = useMemo(() => {
    const actor = session?.id || 'system';
    return {
      db,
      user,
      role: session?.role || null,
      stock,
      rec,
      login,
      logout,
      resetDemo,
      retrain: () => setTrainTick((x) => x + 1),
      actions: {
        issue: (studentId, copyId) => run(lib.issueCopy, { studentId, copyId }, actor),
        returnCopy: (copyId) => run(lib.returnCopy, copyId, actor),
        renew: (loanId) => run(lib.renewLoan, loanId, actor),
        placeHold: (studentId, bookId) => run(lib.placeHold, studentId, bookId, actor),
        cancelHold: (holdId) => run(lib.cancelHold, holdId, actor),
        payFine: (id) => run(lib.payFine, id, actor),
        waiveFine: (id) => run(lib.waiveFine, id, actor),
        rate: (loanId, r) => run(lib.rateLoan, loanId, r),
        saveBook: (data) => run(lib.saveBook, data, actor),
        deleteBook: (id) => run(lib.deleteBook, id, actor),
        addCopies: (bookId, n, type) => run(lib.addCopies, bookId, n, type, actor),
        setCopyStatus: (copyId, status) => run(lib.setCopyStatus, copyId, status, actor),
        setCopyType: (copyId, type) => run(lib.setCopyType, copyId, type, actor),
        saveStudent: (data) => run(lib.saveStudent, data, actor),
        updateInterests: (sid, list) => run(lib.updateInterests, sid, list),
        saveExam: (e) => run(lib.saveExam, e, actor),
        deleteExam: (id) => run(lib.deleteExam, id, actor),
        importExams: (text) => run(lib.importExamsCsv, text, actor),
        importSyllabus: (text) => run(lib.importSyllabusJson, text, actor),
        saveCourseBooks: (code, t, r) => run(lib.saveCourseBooks, code, t, r, actor),
        addNotice: (t, b) => run(lib.addNotice, t, b, actor),
        deleteNotice: (id) => run(lib.deleteNotice, id),
        updateSettings: (patch) => run(lib.updateSettings, patch, actor),
      },
    };
  }, [db, user, session, stock, rec, login, logout, resetDemo, run]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  return useContext(LibraryContext);
}
