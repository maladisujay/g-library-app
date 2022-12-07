import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Col, Collapse, ProgressBar, Row } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { BookCover, EmptyState, PageHeader, StockPill } from '../../components/common';
import { RecCard } from '../../components/BookCard';
import { becauseYouBorrowed, COMPONENT_INFO, COMPONENTS, recommend, similarStudents, trendingInCohort } from '../../services/recommender/engine';

function MiniBook({ book, stock }) {
  return (
    <Link to={`/student/book/${book.id}`} className="d-flex gap-2 text-reset mb-2">
      <BookCover book={book} size="xs" />
      <div style={{ minWidth: 0 }}>
        <div className="small fw-600 text-truncate">{book.title}</div>
        <div className="d-flex gap-1 align-items-center flex-wrap"><StockPill stock={stock} /><span className="small text-muted">Rack {book.location.rack}</span></div>
      </div>
    </Link>
  );
}

export default function Recommendations() {
  const { db, user, stock, rec } = useLibrary();
  const [how, setHow] = useState(false);
  const model = rec.model;
  const recs = useMemo(() => recommend(model, user.id, { limit: 12 }), [model, user.id]);
  const peers = useMemo(() => similarStudents(model, user.id, 5), [model, user.id]);
  const because = useMemo(() => becauseYouBorrowed(model, user.id), [model, user.id]);
  const trending = useMemo(() => trendingInCohort(model, user.id, 6), [model, user.id]);
  const historyCount = model.hist[model.uIdx.get(user.id)]?.size || 0;
  const course = (c) => db.courses.find((x) => x.code === c);

  return (
    <>
      <PageHeader title="Recommended for You" subtitle="Personalised from your academic profile, your courses and what similar students borrow.">
        <Button variant="outline-secondary" size="sm" onClick={() => setHow((h) => !h)}><i className="bi bi-question-circle me-1" />How this works</Button>
      </PageHeader>

      <Collapse in={how}>
        <div>
          <Card className="mb-3">
            <Card.Body>
              <p className="mb-3">Every suggestion is scored by five models and blended into one ranking. The coloured bar on each card shows how much each model contributed.</p>
              <Row className="g-3">
                {COMPONENTS.map((c) => (
                  <Col md={6} xl={4} key={c}>
                    <div className="d-flex gap-2">
                      <span className="legend-dot mt-1 flex-shrink-0" style={{ background: COMPONENT_INFO[c].color }} />
                      <div>
                        <div className="fw-600 small">{COMPONENT_INFO[c].label} <span className="text-muted fw-normal">· weight {Math.round((rec.weights[c] || 0) * 100)}%</span></div>
                        <div className="small text-muted">{COMPONENT_INFO[c].desc}</div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div className="small text-muted mt-3">Results are re-ranked for variety so you do not see five books on the same topic. Books you have already borrowed are left out.</div>
            </Card.Body>
          </Card>
        </div>
      </Collapse>

      <Card className="mb-3">
        <Card.Body className="d-flex flex-wrap gap-4 align-items-center">
          <div>
            <div className="small-caps">Your profile</div>
            <div className="fw-600">{user.programName}</div>
            <div className="small text-muted">Year {user.year} · Semester {user.semester} · {historyCount} titles borrowed</div>
          </div>
          <div>
            <div className="small-caps mb-1">Electives</div>
            {user.electives.length ? user.electives.map((e) => <Badge key={e} bg="light" text="dark" className="border me-1 fw-normal">{course(e)?.title || e}</Badge>) : <span className="small text-muted">None this semester</span>}
          </div>
          <div>
            <div className="small-caps mb-1">Reading interests</div>
            {user.interests.map((i) => <Badge key={i} bg="light" text="dark" className="border me-1 fw-normal">{i}</Badge>)}
            <Link to="/student/profile" className="small ms-1">Edit</Link>
          </div>
          {historyCount === 0 && <div className="ms-lg-auto small rounded-2 px-2 py-1 bg-info bg-opacity-10 text-info-emphasis"><i className="bi bi-info-circle me-1" />New member: suggestions use your profile and syllabus until you borrow books.</div>}
        </Card.Body>
      </Card>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h2 className="h5 mb-0">Top picks</h2>
        <div className="d-flex flex-wrap gap-3 small text-muted">
          {COMPONENTS.map((c) => <span key={c}><span className="legend-dot" style={{ background: COMPONENT_INFO[c].color }} />{COMPONENT_INFO[c].short}</span>)}
        </div>
      </div>
      <Row className="g-3 mb-4">
        {recs.map((r) => <Col md={6} xxl={4} key={r.book.id}><RecCard rec={r} stock={stock.get(r.book.id)} /></Col>)}
        {!recs.length && <Col><Card><EmptyState icon="stars" title="No recommendations yet" /></Card></Col>}
      </Row>

      <Row className="g-3">
        <Col xl={7}>
          <Card className="mb-3">
            <Card.Header>
              <span><i className="bi bi-people me-2 text-primary" />Students like you</span>
              <span className="small text-muted fw-normal">Names hidden for privacy</span>
            </Card.Header>
            <Card.Body className="p-0">
              {peers.map((p, i) => (
                <div key={p.student.id} className="p-3 border-bottom">
                  <div className="d-flex justify-content-between gap-2 mb-1">
                    <div>
                      <div className="fw-600">Student {String.fromCharCode(65 + i)} <span className="text-muted fw-normal small">· {p.label}</span></div>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {p.shared.slice(0, 4).map((x) => <Badge key={x} bg="light" text="dark" className="border fw-normal">{x}</Badge>)}
                        {p.commonBooks > 0 && <Badge bg="light" text="dark" className="border fw-normal">{p.commonBooks} books in common</Badge>}
                      </div>
                    </div>
                    <div className="text-end" style={{ minWidth: 90 }}>
                      <div className="fw-bold text-primary">{Math.round(p.sim * 100)}% match</div>
                      <ProgressBar now={p.sim * 100} style={{ height: 5 }} className="mt-1" />
                    </div>
                  </div>
                  {p.books.length > 0 && (
                    <div className="small text-muted mt-2">
                      Also borrowed: {p.books.slice(0, 3).map((b, k) => (
                        <span key={b.id}>{k > 0 && ', '}<Link to={`/student/book/${b.id}`}>{b.title}</Link></span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card.Body>
          </Card>

          {because.map((g) => (
            <Card className="mb-3" key={g.seed.id}>
              <Card.Header><span className="text-truncate"><i className="bi bi-link-45deg me-2 text-primary" />Because you borrowed <em>{g.seed.title}</em></span></Card.Header>
              <Card.Body>
                <Row>
                  {g.books.map((b) => <Col sm={6} key={b.id}><MiniBook book={b} stock={stock.get(b.id)} /></Col>)}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
        <Col xl={5}>
          <Card className="mb-3">
            <Card.Header>
              <span><i className="bi bi-graph-up-arrow me-2 text-primary" />Popular in {user.program === 'AIML' ? 'CSE (AI&ML)' : user.program}, Sem {user.semester}</span>
            </Card.Header>
            <Card.Body>
              {trending.map((b) => <MiniBook key={b.id} book={b} stock={stock.get(b.id)} />)}
            </Card.Body>
          </Card>
          <Card>
            <Card.Body className="d-flex gap-3 align-items-center">
              <div className="stat-icon tone-green rounded-3 d-inline-flex align-items-center justify-content-center" style={{ width: 46, height: 46, fontSize: '1.3rem' }}><i className="bi bi-calendar2-check" /></div>
              <div className="flex-grow-1">
                <div className="fw-600">Preparing for exams?</div>
                <div className="small text-muted">See textbooks for each of your courses, ordered by exam date.</div>
              </div>
              <Link to="/student/exams" className="btn btn-sm btn-outline-primary">Open</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
