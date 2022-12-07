import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Col, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { BookCover, DueLabel, EmptyState, money, PageHeader, RackTag, StatCard } from '../../components/common';
import { RecCard } from '../../components/BookCard';
import { eligibility, fineSummary } from '../../services/library';
import { examPlan, recommend } from '../../services/recommender/engine';
import { addDaysISO, fmtDate, fmtShort, todayISO } from '../../utils/dates';

export default function StudentDashboard() {
  const { db, user, stock, rec, actions } = useLibrary();
  const notify = useToast();
  const today = todayISO();
  const myLoans = db.loans.filter((l) => l.studentId === user.id && !l.returnDate).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  const holds = db.holds.filter((h) => h.studentId === user.id && ['waiting', 'ready'].includes(h.status));
  const ready = holds.filter((h) => h.status === 'ready');
  const fines = fineSummary(db, user.id);
  const elig = eligibility(db, user.id);
  const recs = useMemo(() => recommend(rec.model, user.id, { limit: 4 }), [rec, user.id]);
  const exams = useMemo(() => examPlan(rec.model, user.id).filter((e) => e.exam).slice(0, 4), [rec, user.id]);
  const book = (id) => db.books.find((b) => b.id === id);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(' ')[0]}`} subtitle={`${user.programName} · Semester ${user.semester} · Section ${user.section}`}>
        <Link to="/student/catalog" className="btn btn-primary"><i className="bi bi-search me-2" />Search catalogue</Link>
      </PageHeader>

      {ready.map((h) => (
        <Alert key={h.id} variant="success" className="d-flex gap-2 align-items-start">
          <i className="bi bi-bookmark-check-fill mt-1" />
          <div><strong>{book(h.bookId)?.title}</strong> is ready for pickup at the circulation desk (copy {h.copyId}). Collect it by {fmtDate(h.expiresOn)}.</div>
        </Alert>
      ))}
      {!elig.ok && (
        <Alert variant="warning" className="d-flex gap-2 align-items-start">
          <i className="bi bi-exclamation-triangle-fill mt-1" />
          <div><strong>Borrowing is blocked:</strong> {elig.reasons.join('; ')}.</div>
        </Alert>
      )}

      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}><StatCard icon="journal-bookmark" label="Books issued" value={`${myLoans.length} / ${db.settings.maxLoans}`} to="/student/my-books" /></Col>
        <Col xs={6} lg={3}><StatCard icon="clock-history" tone="amber" label="Due in 3 days" value={myLoans.filter((l) => l.dueDate >= today && l.dueDate <= addDaysISO(today, 3)).length} hint={myLoans.some((l) => l.dueDate < today) ? 'You have overdue books' : null} /></Col>
        <Col xs={6} lg={3}><StatCard icon="bookmark-star" tone="blue" label="Active holds" value={holds.length} to="/student/my-books" /></Col>
        <Col xs={6} lg={3}><StatCard icon="cash-coin" tone={fines.total ? 'red' : 'green'} label="Fines due" value={money(fines.total)} hint={fines.accruing ? `${money(fines.accruing)} accruing on overdue books` : null} /></Col>
      </Row>

      <Row className="g-3">
        <Col xl={7}>
          <Card className="mb-3">
            <Card.Header>
              <span><i className="bi bi-journal-bookmark me-2 text-primary" />Books with me</span>
              <Link to="/student/my-books" className="small">View all</Link>
            </Card.Header>
            {myLoans.length ? (
              <div className="table-responsive">
                <Table hover className="table-responsive-stack">
                  <thead><tr><th>Book</th><th>Issued</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {myLoans.map((l) => {
                      const b = book(l.bookId);
                      return (
                        <tr key={l.id}>
                          <td>
                            <div className="d-flex gap-2 align-items-center">
                              <BookCover book={b} size="xs" />
                              <div style={{ minWidth: 0 }}>
                                <Link to={`/student/book/${b.id}`} className="fw-600 text-body d-block text-truncate" style={{ maxWidth: 260 }}>{b.title}</Link>
                                <span className="small text-muted mono">{l.copyId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="small text-nowrap">{fmtDate(l.issueDate)}</td>
                          <td className="small text-nowrap"><DueLabel loan={l} /></td>
                          <td className="text-end">
                            <Button size="sm" variant="outline-primary" disabled={l.renewals >= db.settings.maxRenewals} onClick={() => notify(actions.renew(l.id))}>Renew</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : <EmptyState icon="journal" title="No books issued">Find a book in the catalogue and collect it from its rack.</EmptyState>}
          </Card>

          <Card>
            <Card.Header>
              <span><i className="bi bi-stars me-2 text-primary" />Recommended for you</span>
              <Link to="/student/recommendations" className="small">See all recommendations</Link>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {recs.map((r) => <Col md={6} key={r.book.id}><RecCard rec={r} stock={stock.get(r.book.id)} compact /></Col>)}
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="mb-3">
            <Card.Header>
              <span><i className="bi bi-calendar2-check me-2 text-primary" />Upcoming exams</span>
              <Link to="/student/exams" className="small">Exam preparation</Link>
            </Card.Header>
            <Card.Body className="p-0">
              {exams.length ? exams.map((e) => {
                const tb = e.books.find((x) => x.role === 'Textbook');
                return (
                  <div key={e.course.code} className="d-flex gap-3 p-3 border-bottom">
                    <div className={`text-center rounded-3 px-2 py-1 ${e.exam.days <= 7 ? 'tone-red' : 'tone-grey'}`} style={{ minWidth: 58 }}>
                      <div className="fw-bold fs-5 lh-1 mt-1">{e.exam.days}</div>
                      <div style={{ fontSize: '0.68rem' }}>day{e.exam.days === 1 ? '' : 's'}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-600">{e.course.title}</div>
                      <div className="small text-muted">{e.course.code} · {e.exam.type} · {fmtShort(e.exam.date)} ({e.exam.session})</div>
                      {tb && (
                        <div className="small mt-1 text-truncate">
                          <i className="bi bi-book me-1 text-primary" />
                          <Link to={`/student/book/${tb.book.id}`}>{tb.book.title}</Link>
                          <span className="text-muted"> · Rack {tb.book.location.rack}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : <EmptyState icon="calendar" title="No upcoming exams" />}
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header><span><i className="bi bi-megaphone me-2 text-primary" />Library notices</span></Card.Header>
            <Card.Body className="p-0">
              {db.notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 border-bottom">
                  <div className="small text-muted">{fmtDate(n.date)}</div>
                  <div className="fw-600">{n.title}</div>
                  <div className="small text-muted">{n.body}</div>
                </div>
              ))}
            </Card.Body>
          </Card>

          {holds.length > 0 && (
            <Card>
              <Card.Header><span><i className="bi bi-bookmark-star me-2 text-primary" />My holds</span></Card.Header>
              <Card.Body className="p-0">
                {holds.map((h) => {
                  const b = book(h.bookId);
                  const pos = db.holds.filter((x) => x.bookId === h.bookId && x.status === 'waiting' && x.placedOn <= h.placedOn).length;
                  return (
                    <div key={h.id} className="p-3 border-bottom d-flex justify-content-between gap-2">
                      <div style={{ minWidth: 0 }}>
                        <Link to={`/student/book/${b.id}`} className="fw-600 text-body">{b.title}</Link>
                        <div className="small text-muted">{h.status === 'ready' ? `Ready at desk until ${fmtDate(h.expiresOn)}` : `Queue position #${pos}`}</div>
                      </div>
                      <RackTag location={b.location} />
                    </div>
                  );
                })}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}

