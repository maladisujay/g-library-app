import React, { useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Form, Modal, Row, Tab, Table, Tabs } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { PageHeader } from '../../components/common';
import { daysBetween, fmtDate, todayISO } from '../../utils/dates';

const EXAM_TYPES = ['Mid Semester Exam I', 'Mid Semester Exam II', 'End Semester Exam'];

const SAMPLE_CSV = 'course_code,exam_type,date,session\nCSEN3101,Mid Semester Exam II,2022-12-05,FN\nCSEN3011,End Semester Exam,2022-12-20,AN';
const SAMPLE_JSON = JSON.stringify([{ code: 'CSEN3101', title: 'Machine Learning', credits: 3, units: [{ title: 'Introduction', topics: 'supervised and unsupervised learning' }], textbooks: ['B028', 'B029'], references: ['B030'] }], null, 2);

function readFile(file, cb) {
  const r = new FileReader();
  r.onload = () => cb(String(r.result));
  r.readAsText(file);
}

export default function Academics() {
  const { db, actions } = useLibrary();
  const notify = useToast();
  const today = todayISO();
  const [q, setQ] = useState('');
  const [exam, setExam] = useState(null);
  const [mapCourse, setMapCourse] = useState(null);
  const [csv, setCsv] = useState('');
  const [json, setJson] = useState('');
  const title = (c) => db.courses.find((x) => x.code === c)?.title || c;

  const offered = useMemo(() => new Set(db.students.flatMap((s) => s.courses)), [db.students]);
  const enrolled = (code) => db.students.filter((s) => s.courses.includes(code)).length;
  const courses = db.courses.filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.code.localeCompare(b.code));
  const exams = [...db.exams].filter((e) => `${e.courseCode} ${title(e.courseCode)}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => {
      const pa = a.date < today;
      const pb = b.date < today;
      if (pa !== pb) return pa ? 1 : -1; // upcoming first, then past exams
      return pa ? (a.date < b.date ? 1 : -1) : (a.date < b.date ? -1 : 1);
    });
  const bookTitle = (id) => db.books.find((b) => b.id === id)?.title || id;

  return (
    <>
      <PageHeader title="Syllabus & Exams" subtitle="Course syllabi, prescribed books and the exam timetable used for exam-aware recommendations." />
      <Card>
        <Tabs defaultActiveKey="exams" className="px-3 pt-2" mountOnEnter>
          <Tab eventKey="exams" title="Exam timetable">
            <Card.Body className="d-flex flex-wrap gap-2 justify-content-between">
              <Form.Control placeholder="Filter by course" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
              <Button onClick={() => setExam({ courseCode: [...offered][0], type: EXAM_TYPES[1], date: today, session: 'FN', venue: 'As per seating plan' })}><i className="bi bi-plus-lg me-1" />Add exam</Button>
            </Card.Body>
            <div className="table-responsive" style={{ maxHeight: 560 }}>
              <Table hover size="sm">
                <thead><tr><th className="ps-3">Date</th><th>Course</th><th>Exam</th><th>Session</th><th>Students</th><th /></tr></thead>
                <tbody>
                  {exams.map((e) => {
                    const d = daysBetween(today, e.date);
                    return (
                      <tr key={e.id} className={d < 0 ? 'text-muted' : ''}>
                        <td className="ps-3 text-nowrap">{fmtDate(e.date)}{d >= 0 && d <= 7 && <Badge bg="primary" className="ms-2 fw-normal">in {d}d</Badge>}</td>
                        <td><span className="mono small me-2">{e.courseCode}</span>{title(e.courseCode)}</td>
                        <td className="small">{e.type}</td>
                        <td className="small">{e.session}</td>
                        <td className="small">{enrolled(e.courseCode)}</td>
                        <td className="text-end text-nowrap pe-3">
                          <Button size="sm" variant="link" onClick={() => setExam({ ...e })}>Edit</Button>
                          <Button size="sm" variant="link" className="text-danger" onClick={() => notify(actions.deleteExam(e.id))}>Delete</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Tab>
          <Tab eventKey="syllabus" title="Courses & prescribed books">
            <Card.Body><Form.Control placeholder="Filter by course" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} /></Card.Body>
            <div className="table-responsive">
              <Table hover>
                <thead><tr><th className="ps-3">Course</th><th>Units</th><th>Textbooks</th><th>References</th><th /></tr></thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.code}>
                      <td className="ps-3" style={{ minWidth: 220 }}>
                        <div className="fw-600">{c.title}</div>
                        <div className="small text-muted"><span className="mono">{c.code}</span> · {c.credits} credits{offered.has(c.code) && <Badge bg="success" className="ms-2 fw-normal">offered this semester</Badge>}</div>
                      </td>
                      <td className="small" style={{ maxWidth: 260 }}>{c.units.map((u) => u.title).join('; ')}</td>
                      <td className="small">{c.textbooks.map(bookTitle).join('; ') || '-'}</td>
                      <td className="small">{c.references.map(bookTitle).join('; ') || '-'}</td>
                      <td className="text-end pe-3"><Button size="sm" variant="light" className="border" onClick={() => setMapCourse({ ...c })}>Map books</Button></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Tab>
          <Tab eventKey="import" title="Import">
            <Card.Body>
              <Row className="g-4">
                <Col lg={6}>
                  <h2 className="h6">Exam timetable (CSV)</h2>
                  <p className="small text-muted">Columns: course_code, exam_type, date (YYYY-MM-DD), session. Existing entries for the same course and exam type are updated.</p>
                  <Form.Control type="file" accept=".csv,text/csv" className="mb-2" onChange={(e) => e.target.files[0] && readFile(e.target.files[0], setCsv)} />
                  <Form.Control as="textarea" rows={6} className="mono mb-2" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={SAMPLE_CSV} />
                  <Button onClick={() => { const r = notify(actions.importExams(csv)); if (r.ok) setCsv(''); }} disabled={!csv.trim()}>Import timetable</Button>
                </Col>
                <Col lg={6}>
                  <h2 className="h6">Syllabus (JSON)</h2>
                  <p className="small text-muted">An array of courses with code, title, credits, units and the book IDs of prescribed textbooks and references, as published in the syllabus document.</p>
                  <Form.Control type="file" accept=".json,application/json" className="mb-2" onChange={(e) => e.target.files[0] && readFile(e.target.files[0], setJson)} />
                  <Form.Control as="textarea" rows={6} className="mono mb-2" value={json} onChange={(e) => setJson(e.target.value)} placeholder={SAMPLE_JSON} />
                  <Button onClick={() => { const r = notify(actions.importSyllabus(json)); if (r.ok) setJson(''); }} disabled={!json.trim()}>Import syllabus</Button>
                </Col>
              </Row>
            </Card.Body>
          </Tab>
        </Tabs>
      </Card>

      <Modal show={!!exam} onHide={() => setExam(null)} centered>
        {exam && (
          <Form onSubmit={(e) => { e.preventDefault(); const r = notify(actions.saveExam(exam)); if (r.ok) setExam(null); }}>
            <Modal.Header closeButton><Modal.Title as="h5">{exam.id ? 'Edit exam' : 'Add exam'}</Modal.Title></Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3"><Form.Label>Course</Form.Label>
                <Form.Select value={exam.courseCode} onChange={(e) => setExam({ ...exam, courseCode: e.target.value })}>
                  {db.courses.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.title}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3"><Form.Label>Exam</Form.Label>
                <Form.Select value={exam.type} onChange={(e) => setExam({ ...exam, type: e.target.value })}>{EXAM_TYPES.map((t) => <option key={t}>{t}</option>)}</Form.Select>
              </Form.Group>
              <Row className="g-3">
                <Col xs={7}><Form.Label>Date</Form.Label><Form.Control type="date" value={exam.date} onChange={(e) => setExam({ ...exam, date: e.target.value })} required /></Col>
                <Col xs={5}><Form.Label>Session</Form.Label><Form.Select value={exam.session} onChange={(e) => setExam({ ...exam, session: e.target.value })}><option value="FN">FN (10:00 AM)</option><option value="AN">AN (2:00 PM)</option></Form.Select></Col>
              </Row>
            </Modal.Body>
            <Modal.Footer><Button variant="light" onClick={() => setExam(null)}>Cancel</Button><Button type="submit">Save</Button></Modal.Footer>
          </Form>
        )}
      </Modal>

      <Modal show={!!mapCourse} onHide={() => setMapCourse(null)} size="lg" centered scrollable>
        {mapCourse && (
          <>
            <Modal.Header closeButton><Modal.Title as="h5">Prescribed books · {mapCourse.code} {mapCourse.title}</Modal.Title></Modal.Header>
            <Modal.Body>
              <div className="small text-muted mb-3">Tick T for a textbook or R for a reference book. These drive the syllabus signal of the recommender.</div>
              <Table size="sm" hover>
                <thead><tr><th>T</th><th>R</th><th>Book</th><th>Subject</th></tr></thead>
                <tbody>
                  {[...db.books].sort((a, b) => ((mapCourse.textbooks.includes(b.id) || mapCourse.references.includes(b.id)) - (mapCourse.textbooks.includes(a.id) || mapCourse.references.includes(a.id))) || a.subject.localeCompare(b.subject)).map((b) => (
                    <tr key={b.id}>
                      <td><Form.Check aria-label="textbook" checked={mapCourse.textbooks.includes(b.id)} onChange={() => setMapCourse((m) => ({ ...m, textbooks: m.textbooks.includes(b.id) ? m.textbooks.filter((x) => x !== b.id) : [...m.textbooks, b.id], references: m.references.filter((x) => x !== b.id) }))} /></td>
                      <td><Form.Check aria-label="reference" checked={mapCourse.references.includes(b.id)} onChange={() => setMapCourse((m) => ({ ...m, references: m.references.includes(b.id) ? m.references.filter((x) => x !== b.id) : [...m.references, b.id], textbooks: m.textbooks.filter((x) => x !== b.id) }))} /></td>
                      <td className="small">{b.title}</td>
                      <td className="small text-muted">{b.subject}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setMapCourse(null)}>Cancel</Button>
              <Button onClick={() => { const r = notify(actions.saveCourseBooks(mapCourse.code, mapCourse.textbooks, mapCourse.references)); if (r.ok) setMapCourse(null); }}>Save</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}
