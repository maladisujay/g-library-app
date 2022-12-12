import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Col, Row, Tab, Table, Tabs } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { DueLabel, EmptyState, Initials, money, PageHeader, StatusBadge } from '../../components/common';
import { RecCard } from '../../components/BookCard';
import { StudentForm } from './Members';
import { eligibility, fineSummary } from '../../services/library';
import { recommend, similarStudents } from '../../services/recommender/engine';
import { ageFrom, fmtDate } from '../../utils/dates';

export default function MemberDetail() {
  const { id } = useParams();
  const { db, stock, rec, actions } = useLibrary();
  const notify = useToast();
  const [edit, setEdit] = useState(false);
  const s = db.students.find((x) => x.id === id);
  const recs = useMemo(() => (s ? recommend(rec.model, s.id, { limit: 6 }) : []), [rec, s]);
  const peers = useMemo(() => (s ? similarStudents(rec.model, s.id, 4) : []), [rec, s]);
  if (!s) return <Card><EmptyState title="Member not found"><Link to="/admin/members">Back to members</Link></EmptyState></Card>;
  const book = (bid) => db.books.find((b) => b.id === bid);
  const loans = db.loans.filter((l) => l.studentId === s.id).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  const active = loans.filter((l) => !l.returnDate);
  const fines = db.fines.filter((f) => f.studentId === s.id);
  const holds = db.holds.filter((h) => h.studentId === s.id && ['waiting', 'ready'].includes(h.status));
  const el = eligibility(db, s.id);
  const fs = fineSummary(db, s.id);
  const course = (c) => db.courses.find((x) => x.code === c)?.title || c;

  return (
    <>
      <Link to="/admin/members" className="small d-inline-block mb-2"><i className="bi bi-arrow-left me-1" />Members</Link>
      <PageHeader title={s.name} subtitle={`${s.regNo} · ${s.programName} · Semester ${s.semester}`}>
        <Link className="btn btn-primary" to={`/admin/circulation?member=${s.regNo}`}><i className="bi bi-arrow-left-right me-1" />Issue a book</Link>
        <Button variant="outline-secondary" onClick={() => setEdit(true)}><i className="bi bi-pencil me-1" />Edit</Button>
        <Button variant={s.status === 'Active' ? 'outline-danger' : 'outline-success'} onClick={() => notify(actions.saveStudent({ ...s, status: s.status === 'Active' ? 'Suspended' : 'Active', editing: true }))}>
          {s.status === 'Active' ? 'Suspend' : 'Reactivate'}
        </Button>
      </PageHeader>
      <Row className="g-3">
        <Col lg={4}>
          <Card className="mb-3">
            <Card.Body className="text-center border-bottom">
              <Initials name={s.name} size="lg" />
              <div className="fw-600 mt-2">{s.name}</div>
              <div className="small text-muted">{s.gender} · {ageFrom(s.dob)} years · {s.residence}</div>
              <div className="mt-2"><StatusBadge status={s.status} /> <Badge bg={el.ok ? 'success' : 'danger'} className="fw-normal">{el.ok ? 'Eligible to borrow' : 'Borrowing blocked'}</Badge></div>
              {!el.ok && <div className="small text-danger mt-2">{el.reasons.join('; ')}</div>}
            </Card.Body>
            <Table size="sm" className="small mb-0">
              <tbody>
                <tr><td className="text-muted ps-3">School</td><td>{s.school}</td></tr>
                <tr><td className="text-muted ps-3">Year / Section</td><td>{s.year} / {s.section}</td></tr>
                <tr><td className="text-muted ps-3">CGPA</td><td>{s.cgpa ?? '-'}</td></tr>
                <tr><td className="text-muted ps-3">Email</td><td className="text-break">{s.email}</td></tr>
                <tr><td className="text-muted ps-3">Phone</td><td>{s.phone}</td></tr>
                <tr><td className="text-muted ps-3">Member since</td><td>{fmtDate(s.memberSince)}</td></tr>
                <tr><td className="text-muted ps-3">Fines</td><td className={fs.total ? 'text-danger fw-600' : ''}>{money(fs.unpaid)} unpaid{fs.accruing ? `, ${money(fs.accruing)} accruing` : ''}</td></tr>
              </tbody>
            </Table>
          </Card>
          <Card className="mb-3">
            <Card.Header><span>Courses this semester</span></Card.Header>
            <Card.Body className="small">
              {s.courses.map((c) => <div key={c} className="mb-1"><span className="mono text-muted me-2">{c}</span>{course(c)}{s.electives.includes(c) && <Badge bg="info" className="ms-1 fw-normal">Elective</Badge>}</div>)}
              <div className="mt-2 text-muted">Interests: {s.interests.join(', ') || '-'}</div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><span>Most similar members</span></Card.Header>
            <Card.Body className="p-0">
              {peers.map((p) => (
                <Link key={p.student.id} to={`/admin/members/${p.student.id}`} className="d-flex justify-content-between px-3 py-2 border-bottom small text-reset">
                  <span>{p.student.name}<span className="text-muted"> · {p.student.program} Sem {p.student.semester}</span></span>
                  <span className="fw-600 text-primary">{Math.round(p.sim * 100)}%</span>
                </Link>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="mb-3">
            <Tabs defaultActiveKey="active" className="px-3 pt-2">
              <Tab eventKey="active" title={`Issued (${active.length})`}>
                {active.length ? (
                  <div className="table-responsive">
                    <Table hover>
                      <thead><tr><th>Book</th><th>Copy</th><th>Issued</th><th>Due</th><th /></tr></thead>
                      <tbody>
                        {active.map((l) => (
                          <tr key={l.id}>
                            <td><Link to={`/admin/book/${l.bookId}`} className="fw-600 text-body">{book(l.bookId)?.title}</Link></td>
                            <td className="mono small">{l.copyId}</td>
                            <td className="small text-nowrap">{fmtDate(l.issueDate)}</td>
                            <td className="small text-nowrap"><DueLabel loan={l} /></td>
                            <td className="text-end text-nowrap">
                              <Button size="sm" variant="outline-primary" className="me-1" onClick={() => notify(actions.renew(l.id))}>Renew</Button>
                              <Button size="sm" variant="outline-secondary" onClick={() => notify(actions.returnCopy(l.copyId))}>Return</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : <EmptyState icon="journal" title="No books issued" />}
              </Tab>
              <Tab eventKey="history" title={`History (${loans.length - active.length})`}>
                <div className="table-responsive" style={{ maxHeight: 420 }}>
                  <Table hover size="sm">
                    <thead><tr><th>Book</th><th>Issued</th><th>Returned</th><th>Rating</th></tr></thead>
                    <tbody>
                      {loans.filter((l) => l.returnDate).map((l) => (
                        <tr key={l.id}>
                          <td className="small"><Link to={`/admin/book/${l.bookId}`}>{book(l.bookId)?.title || 'Withdrawn title'}</Link></td>
                          <td className="small text-nowrap">{fmtDate(l.issueDate)}</td>
                          <td className="small text-nowrap">{fmtDate(l.returnDate)}{l.returnDate > l.dueDate && <Badge bg="danger" className="ms-1 fw-normal">late</Badge>}</td>
                          <td className="small">{l.rating ? `${l.rating}★` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab>
              <Tab eventKey="holds" title={`Holds (${holds.length})`}>
                {holds.length ? holds.map((h) => (
                  <div key={h.id} className="px-3 py-2 border-bottom d-flex justify-content-between small">
                    <span>{book(h.bookId)?.title}</span><StatusBadge status={h.status} />
                  </div>
                )) : <EmptyState icon="bookmark" title="No active holds" />}
              </Tab>
              <Tab eventKey="fines" title={`Fines (${fines.filter((f) => f.status === 'unpaid').length})`}>
                <div className="table-responsive">
                  <Table size="sm" hover>
                    <thead><tr><th>Fine</th><th>Book</th><th>Amount</th><th>Status</th><th /></tr></thead>
                    <tbody>
                      {fines.map((f) => (
                        <tr key={f.id}>
                          <td className="small"><span className="mono">{f.id}</span><div className="text-muted">{f.reason}</div></td>
                          <td className="small">{book(f.bookId)?.title}</td>
                          <td className="fw-600">{money(f.amount)}</td>
                          <td><StatusBadge status={f.status} /></td>
                          <td className="text-end">{f.status === 'unpaid' && <Button size="sm" onClick={() => notify(actions.payFine(f.id))}>Collect</Button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {!fines.length && <EmptyState icon="emoji-smile" title="No fines" />}
                </div>
              </Tab>
            </Tabs>
          </Card>
          <Card>
            <Card.Header><span><i className="bi bi-stars me-2 text-primary" />What the recommender suggests for this student</span><Link to="/admin/recommender" className="small">Engine</Link></Card.Header>
            <Card.Body>
              <Row className="g-3">{recs.map((r) => <Col md={6} key={r.book.id}><RecCard rec={r} stock={stock.get(r.book.id)} base="/admin" compact /></Col>)}</Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <StudentForm show={edit} onHide={() => setEdit(false)} student={s} />
    </>
  );
}
