import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card, Col, Dropdown, Form, Modal, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../store/LibraryContext';
import { useToast } from '../components/Toasts';
import { BookCover, EmptyState, RackTag, StatusBadge, StockPill } from '../components/common';
import RackLocator from '../components/RackLocator';
import BookForm from './admin/BookForm';
import { similarBooks } from '../services/recommender/engine';
import { fmtDate } from '../utils/dates';

export default function BookDetail({ admin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, user, stock, rec, actions } = useLibrary();
  const notify = useToast();
  const [edit, setEdit] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addN, setAddN] = useState(1);
  const [addType, setAddType] = useState('lending');
  const book = db.books.find((b) => b.id === id);
  const related = useMemo(() => (book ? similarBooks(rec.model, book.id, 4) : []), [rec, book]);
  if (!book) return <Card><EmptyState icon="book" title="Book not found"><Link to={admin ? '/admin/books' : '/student/catalog'}>Back to catalogue</Link></EmptyState></Card>;

  const base = admin ? '/admin' : '/student';
  const st = stock.get(book.id);
  const copies = db.copies.filter((c) => c.bookId === book.id);
  const loanOf = (cid) => db.loans.find((l) => l.copyId === cid && !l.returnDate);
  const courses = db.courses.filter((c) => c.textbooks.includes(book.id) || c.references.includes(book.id));
  const queue = db.holds.filter((h) => h.bookId === book.id && h.status === 'waiting');
  const myHold = !admin && db.holds.find((h) => h.bookId === book.id && h.studentId === user.id && ['waiting', 'ready'].includes(h.status));
  const myLoan = !admin && db.loans.find((l) => l.bookId === book.id && l.studentId === user.id && !l.returnDate);
  const borrowedTimes = db.loans.filter((l) => l.bookId === book.id).length;
  const ratings = db.loans.filter((l) => l.bookId === book.id && l.rating);
  const avgRating = ratings.length ? ratings.reduce((s, l) => s + l.rating, 0) / ratings.length : null;

  const meta = [
    ['ISBN', <span className="mono">{book.isbn}</span>],
    ['Call number', <span className="mono">{book.callNo}</span>],
    ['Publisher', book.publisher],
    ['Edition', `${book.edition} edition, ${book.year}`],
    ['Pages', book.pages],
    ['Language', book.language],
    ['Subject', book.subject],
    ['Type', book.category],
  ];

  return (
    <>
      <button type="button" className="btn btn-link px-0 mb-2 text-decoration-none" onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-1" />Back</button>
      <Card className="mb-3">
        <Card.Body className="p-3 p-md-4">
          <Row className="g-4">
            <Col xs="auto" className="mx-auto mx-md-0"><BookCover book={book} size="lg" /></Col>
            <Col md>
              <div className="small-caps mb-1">{book.category} · {book.subject}</div>
              <h1 className="h3 fw-bold mb-1">{book.title}</h1>
              <div className="text-muted mb-3">{book.authors}</div>
              <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <StockPill stock={st} />
                <RackTag location={book.location} showFloor />
                {st.reference > 0 && <Badge bg="light" text="dark" className="border">{st.reference} reference cop{st.reference > 1 ? 'ies' : 'y'}</Badge>}
                {queue.length > 0 && <Badge bg="info" className="bg-opacity-75">{queue.length} on hold queue</Badge>}
                {avgRating && <span className="small text-muted"><i className="bi bi-star-fill text-warning me-1" />{avgRating.toFixed(1)} ({ratings.length})</span>}
                <span className="small text-muted">Borrowed {borrowedTimes} times</span>
              </div>
              <p className="mb-3">{book.description}</p>
              <div className="d-flex flex-wrap gap-1 mb-3">
                {book.tags.map((t) => <Link key={t} to={`${admin ? '/admin/books' : '/student/catalog'}?q=${encodeURIComponent(t)}`} className="badge rounded-pill text-bg-light border fw-normal">{t}</Link>)}
              </div>
              <div className="d-flex flex-wrap gap-2">
                {!admin && (myLoan ? (
                  <Button variant="success" disabled><i className="bi bi-check2 me-1" />Issued to you · due {fmtDate(myLoan.dueDate)}</Button>
                ) : myHold ? (
                  <Button variant="outline-secondary" onClick={() => notify(actions.cancelHold(myHold.id))}>
                    <i className="bi bi-x-circle me-1" />{myHold.status === 'ready' ? 'Cancel pickup' : 'Cancel hold'}
                  </Button>
                ) : st.lending > 0 && (
                  <Button onClick={() => notify(actions.placeHold(user.id, book.id))}>
                    <i className="bi bi-bookmark-plus me-1" />{st.available ? 'Reserve for pickup' : 'Place hold'}
                  </Button>
                ))}
                {!admin && st.available > 0 && !myLoan && <span className="small text-muted align-self-center">Or pick it up from rack {book.location.rack} and issue it at the counter.</span>}
                {admin && (
                  <>
                    <Button onClick={() => setEdit(true)}><i className="bi bi-pencil me-1" />Edit details</Button>
                    <Button variant="outline-primary" onClick={() => setAddOpen(true)}><i className="bi bi-plus-lg me-1" />Add copies</Button>
                    <Link className="btn btn-outline-secondary" to={`/admin/circulation?copy=${copies.find((c) => c.status === 'available' && c.type === 'lending')?.id || ''}`}><i className="bi bi-arrow-left-right me-1" />Issue</Link>
                    <Button variant="outline-danger" onClick={() => { if (window.confirm(`Withdraw "${book.title}" and all its copies?`)) { const r = notify(actions.deleteBook(book.id)); if (r.ok) navigate('/admin/books'); } }}><i className="bi bi-trash me-1" />Withdraw</Button>
                  </>
                )}
              </div>
            </Col>
            <Col lg={4}>
              <Table size="sm" className="mb-0 small">
                <tbody>
                  {meta.map(([k, v]) => <tr key={k}><th className="text-muted fw-normal border-0 ps-0" style={{ width: 110, background: 'transparent', textTransform: 'none', letterSpacing: 0, fontSize: '0.85rem' }}>{k}</th><td className="border-0">{v}</td></tr>)}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col xl={7}>
          <Card className="mb-3">
            <Card.Header>
              <span><i className="bi bi-geo-alt me-2 text-primary" />Where to find it</span>
              <span className="small text-muted">{book.location.section}</span>
            </Card.Header>
            <Card.Body>
              <Row className="g-2 mb-3 text-center">
                {[['Floor', book.location.floor], ['Section', book.location.section], ['Rack', book.location.rack], ['Shelf', book.location.shelf]].map(([k, v]) => (
                  <Col xs={6} md={3} key={k}>
                    <div className="border rounded-3 py-2 px-1 h-100">
                      <div className="small-caps">{k}</div>
                      <div className={`fw-bold ${k === 'Rack' ? 'text-primary fs-4' : k === 'Shelf' ? 'fs-4' : ''}`}>{v}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <RackLocator book={book} books={db.books} />
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>
              <span><i className="bi bi-upc-scan me-2 text-primary" />Copies ({copies.length})</span>
              <span className="small text-muted">{st.available} on shelf · {st.issued} issued{st.held ? ` · ${st.held} on hold shelf` : ''}</span>
            </Card.Header>
            <div className="table-responsive">
              <Table hover>
                <thead><tr><th>Accession no.</th><th>Type</th><th>Status</th><th>Due back</th>{admin && <th />}</tr></thead>
                <tbody>
                  {copies.map((c) => {
                    const l = loanOf(c.id);
                    const borrower = l && db.students.find((s) => s.id === l.studentId);
                    return (
                      <tr key={c.id}>
                        <td className="mono">{c.id}</td>
                        <td className="small">{c.type === 'reference' ? 'Reference (in-library)' : 'Lending'}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td className="small">
                          {l ? (
                            <>
                              {fmtDate(l.dueDate)}
                              {admin && borrower && <div className="text-muted"><Link to={`/admin/members/${borrower.id}`}>{borrower.name}</Link></div>}
                            </>
                          ) : '-'}
                        </td>
                        {admin && (
                          <td className="text-end">
                            <Dropdown align="end">
                              <Dropdown.Toggle size="sm" variant="light" className="border">Actions</Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item disabled={c.status === 'available'} onClick={() => notify(actions.setCopyStatus(c.id, 'available'))}>Mark available</Dropdown.Item>
                                <Dropdown.Item onClick={() => notify(actions.setCopyStatus(c.id, 'damaged'))}>Mark damaged</Dropdown.Item>
                                <Dropdown.Item onClick={() => notify(actions.setCopyStatus(c.id, 'lost'))}>Mark lost</Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={() => notify(actions.setCopyType(c.id, c.type === 'reference' ? 'lending' : 'reference'))}>
                                  Make {c.type === 'reference' ? 'lending' : 'reference'} copy
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="mb-3">
            <Card.Header><span><i className="bi bi-mortarboard me-2 text-primary" />Prescribed in courses</span></Card.Header>
            <Card.Body className="p-0">
              {courses.length ? courses.map((c) => (
                <div key={c.code} className="p-3 border-bottom d-flex justify-content-between gap-2">
                  <div>
                    <div className="fw-600">{c.title}</div>
                    <div className="small text-muted">{c.code} · {c.credits} credits</div>
                  </div>
                  <Badge bg={c.textbooks.includes(book.id) ? 'primary' : 'secondary'} className="align-self-start">{c.textbooks.includes(book.id) ? 'Textbook' : 'Reference'}</Badge>
                </div>
              )) : <div className="p-3 small text-muted">Not listed in any course syllabus.</div>}
            </Card.Body>
          </Card>
          {admin && queue.length > 0 && (
            <Card className="mb-3">
              <Card.Header><span><i className="bi bi-hourglass-split me-2 text-primary" />Hold queue</span></Card.Header>
              <Card.Body className="p-0">
                {queue.sort((a, b) => (a.placedOn < b.placedOn ? -1 : 1)).map((h, i) => {
                  const s = db.students.find((x) => x.id === h.studentId);
                  return <div key={h.id} className="p-3 border-bottom small d-flex justify-content-between"><span>#{i + 1} <Link to={`/admin/members/${s.id}`}>{s.name}</Link></span><span className="text-muted">since {fmtDate(h.placedOn)}</span></div>;
                })}
              </Card.Body>
            </Card>
          )}
          <Card>
            <Card.Header><span><i className="bi bi-link-45deg me-2 text-primary" />Readers also borrowed</span></Card.Header>
            <Card.Body className="p-0">
              {related.map((b) => (
                <Link key={b.id} to={`${base}/book/${b.id}`} className="d-flex gap-3 p-3 border-bottom text-reset">
                  <BookCover book={b} size="xs" />
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-600 text-truncate">{b.title}</div>
                    <div className="small text-muted text-truncate">{b.authors}</div>
                    <div className="mt-1"><StockPill stock={stock.get(b.id)} /> <span className="small text-muted ms-1">Rack {b.location.rack}</span></div>
                  </div>
                </Link>
              ))}
              {!related.length && <div className="p-3 small text-muted">Not enough borrowing data yet.</div>}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {admin && <BookForm show={edit} onHide={() => setEdit(false)} book={book} />}
      <Modal show={addOpen} onHide={() => setAddOpen(false)} centered>
        <Modal.Header closeButton><Modal.Title as="h5">Accession new copies</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Number of copies</Form.Label>
            <Form.Control type="number" min={1} max={50} value={addN} onChange={(e) => setAddN(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Copy type</Form.Label>
            <Form.Select value={addType} onChange={(e) => setAddType(e.target.value)}>
              <option value="lending">Lending</option>
              <option value="reference">Reference (in-library use)</option>
            </Form.Select>
          </Form.Group>
          <div className="small text-muted mt-3">Accession numbers are generated automatically. New copies are shelved at rack {book.location.rack}, shelf {book.location.shelf}.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={() => { const r = notify(actions.addCopies(book.id, addN, addType)); if (r.ok) setAddOpen(false); }}>Add copies</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
