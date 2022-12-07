import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Col, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { BookCover, PageHeader, RackTag, StockPill } from '../../components/common';
import { examPlan } from '../../services/recommender/engine';
import { daysBetween, fmtDate, fmtShort, todayISO } from '../../utils/dates';

export default function ExamPrep() {
  const { db, user, stock, rec, actions } = useLibrary();
  const notify = useToast();
  const [open, setOpen] = useState({});
  const plan = useMemo(() => examPlan(rec.model, user.id), [rec, user.id]);
  const today = todayISO();
  const upcoming = db.exams
    .filter((e) => user.courses.includes(e.courseCode) && e.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const next = upcoming[0];
  const courseTitle = (code) => db.courses.find((c) => c.code === code)?.title || code;
  const activeHold = (bookId) => db.holds.some((h) => h.bookId === bookId && h.studentId === user.id && ['waiting', 'ready'].includes(h.status));
  const hasLoan = (bookId) => db.loans.some((l) => l.bookId === bookId && l.studentId === user.id && !l.returnDate);

  return (
    <>
      <PageHeader title="Exam Preparation" subtitle="Books from your course syllabus, ordered by your next exam. Exam dates are taken from the university timetable." />

      <Card className="mb-3">
        <Card.Header>
          <span><i className="bi bi-calendar-week me-2 text-primary" />Your exam timetable</span>
          {next && <span className="small text-muted">Next: {courseTitle(next.courseCode)} {daysBetween(today, next.date) === 0 ? 'today' : `in ${daysBetween(today, next.date)} days`}</span>}
        </Card.Header>
        <Card.Body className="d-flex gap-2 overflow-auto">
          {upcoming.slice(0, 14).map((e) => {
            const d = daysBetween(today, e.date);
            return (
              <div key={e.id} className={`exam-chip ${d <= 7 ? 'soon' : ''}`}>
                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="days">{d}<small className="fs-6 fw-normal"> d</small></span>
                  <span className="small text-muted">{fmtShort(e.date)} · {e.session}</span>
                </div>
                <div className="small fw-600 mt-1 text-truncate">{courseTitle(e.courseCode)}</div>
                <div className="small text-muted">{e.courseCode} · {e.type.replace('Mid Semester Exam', 'Mid-term').replace('End Semester Exam', 'End-sem')}</div>
              </div>
            );
          })}
          {!upcoming.length && <span className="text-muted small">No upcoming exams in the timetable.</span>}
        </Card.Body>
      </Card>

      {plan.map(({ course, elective, exam, books }) => (
        <Card key={course.code} className="mb-3">
          <Card.Header className="flex-wrap">
            <div>
              <div>{course.title} {elective && <Badge bg="info" className="ms-1 fw-normal">Elective</Badge>}</div>
              <div className="small text-muted fw-normal">{course.code} · {course.credits} credits</div>
            </div>
            {exam ? (
              <Badge bg={exam.days <= 7 ? 'primary' : 'light'} text={exam.days <= 7 ? 'light' : 'dark'} className={`fw-normal ${exam.days <= 7 ? '' : 'border'}`} style={{ fontSize: '0.8rem' }}>
                {exam.type} · {fmtDate(exam.date)} · {exam.days === 0 ? 'today' : `${exam.days} days left`}
              </Badge>
            ) : <span className="small text-muted">No upcoming exam</span>}
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col lg={4}>
                <div className="small-caps mb-2">Syllabus</div>
                <ol className="ps-3 small mb-1">
                  {course.units.slice(0, open[course.code] ? 99 : 5).map((u) => (
                    <li key={u.no} className="mb-1"><span className="fw-600">{u.title}</span>{u.topics && <span className="text-muted">: {u.topics}</span>}</li>
                  ))}
                </ol>
                {!course.units.length && <div className="small text-muted">Syllabus not uploaded yet.</div>}
              </Col>
              <Col lg={8}>
                <div className="small-caps mb-2">Books for this course</div>
                <div className="table-responsive">
                  <Table size="sm" className="align-middle">
                    <tbody>
                      {books.map(({ book, role, borrowedBefore }) => {
                        const st = stock.get(book.id);
                        return (
                          <tr key={book.id}>
                            <td style={{ width: 44 }}><BookCover book={book} size="xs" /></td>
                            <td style={{ minWidth: 200 }}>
                              <Link to={`/student/book/${book.id}`} className="fw-600 text-body">{book.title}</Link>
                              <div className="small text-muted">{book.authors.split(',')[0]} · <span className={role === 'Textbook' ? 'text-primary fw-600' : ''}>{role}</span>{borrowedBefore && ' · borrowed before'}</div>
                            </td>
                            <td className="text-nowrap"><StockPill stock={st} /><div className="mt-1"><RackTag location={book.location} /></div></td>
                            <td className="text-end text-nowrap">
                              {hasLoan(book.id) ? <Badge bg="success" className="fw-normal">With you</Badge>
                                : activeHold(book.id) ? <Badge bg="info" className="fw-normal">Reserved</Badge>
                                  : st.lending > 0 && <Button size="sm" variant="outline-primary" onClick={() => notify(actions.placeHold(user.id, book.id))}>{st.available ? 'Reserve' : 'Hold'}</Button>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
                {!books.length && <div className="small text-muted">No books are mapped to this course yet.</div>}
              </Col>
            </Row>
            {course.units.length > 5 && <Button variant="link" size="sm" className="p-0" onClick={() => setOpen((o) => ({ ...o, [course.code]: !o[course.code] }))}>{open[course.code] ? 'Show less' : 'Show full syllabus'}</Button>}
          </Card.Body>
        </Card>
      ))}
    </>
  );
}
