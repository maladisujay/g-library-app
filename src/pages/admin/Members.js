import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, Form, InputGroup, Modal, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { Initials, money, PageHeader, StatusBadge } from '../../components/common';
import { fineSummary } from '../../services/library';
import { PROGRAMS, CURRICULUM, coreCourses, completedCourses } from '../../data/courses';
import { INTEREST_OPTIONS } from '../../data/students';
import { todayISO } from '../../utils/dates';

export function StudentForm({ show, onHide, student }) {
  const { actions, db } = useLibrary();
  const notify = useToast();
  const blank = { regNo: '', name: '', gender: 'Female', dob: '2004-01-01', program: 'CSE', semester: 1, section: 'A', electives: [], interests: [], cgpa: '', residence: 'Day Scholar', phone: '' };
  const [f, setF] = useState(blank);
  React.useEffect(() => { if (show) setF(student ? { ...student } : blank); }, [show, student]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const pool = CURRICULUM[f.program]?.electives?.[f.semester] || [];
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  const submit = (e) => {
    e.preventDefault();
    const sem = Number(f.semester);
    const p = PROGRAMS[f.program];
    const electives = f.electives.filter((x) => pool.includes(x));
    const data = {
      ...f,
      semester: sem,
      year: Math.ceil(sem / 2),
      programName: p.name,
      school: p.school,
      cgpa: f.cgpa === '' || f.cgpa == null ? null : Number(f.cgpa),
      electives,
      courses: [...coreCourses(f.program, sem), ...electives],
      completed: completedCourses(f.program, sem, f.pastElectives || []),
      pastElectives: f.pastElectives || [],
      admissionYear: 2000 + Number(String(f.regNo).slice(1, 3)),
      editing: !!student,
    };
    const r = notify(actions.saveStudent(data));
    if (r.ok) onHide();
  };
  const course = (c) => db.courses.find((x) => x.code === c)?.title || c;
  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title as="h5">{student ? 'Edit member' : 'Register new member'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={5}><Form.Label>Registration no. *</Form.Label><Form.Control value={f.regNo} onChange={set('regNo')} disabled={!!student} placeholder="12 digits" required /></Col>
            <Col md={7}><Form.Label>Full name *</Form.Label><Form.Control value={f.name} onChange={set('name')} required /></Col>
            <Col xs={6} md={3}><Form.Label>Gender</Form.Label><Form.Select value={f.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Other</option></Form.Select></Col>
            <Col xs={6} md={3}><Form.Label>Date of birth</Form.Label><Form.Control type="date" value={f.dob} max={todayISO()} onChange={set('dob')} /></Col>
            <Col xs={6} md={3}><Form.Label>Residence</Form.Label><Form.Select value={f.residence} onChange={set('residence')}><option>Day Scholar</option><option>Hostel</option></Form.Select></Col>
            <Col xs={6} md={3}><Form.Label>Phone</Form.Label><Form.Control value={f.phone} onChange={set('phone')} /></Col>
            <Col md={6}><Form.Label>Programme</Form.Label><Form.Select value={f.program} onChange={(e) => setF((x) => ({ ...x, program: e.target.value, electives: [] }))}>{Object.values(PROGRAMS).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Form.Select></Col>
            <Col xs={4} md={2}><Form.Label>Semester</Form.Label><Form.Select value={f.semester} onChange={(e) => setF((x) => ({ ...x, semester: Number(e.target.value), electives: [] }))}>{[1, 3, 5, 7].map((s) => <option key={s}>{s}</option>)}</Form.Select></Col>
            <Col xs={4} md={2}><Form.Label>Section</Form.Label><Form.Control value={f.section} onChange={set('section')} /></Col>
            <Col xs={4} md={2}><Form.Label>CGPA</Form.Label><Form.Control type="number" step="0.01" min={0} max={10} value={f.cgpa ?? ''} onChange={set('cgpa')} /></Col>
            <Col xs={12}>
              <Form.Label>Electives this semester</Form.Label>
              <div className="d-flex flex-wrap gap-3">
                {pool.length ? pool.map((c) => <Form.Check key={c} id={`el-${c}`} label={`${c} ${course(c)}`} checked={f.electives.includes(c)} onChange={() => toggle('electives', c)} />) : <span className="small text-muted">No electives offered in this semester.</span>}
              </div>
            </Col>
            <Col xs={12}>
              <Form.Label>Reading interests</Form.Label>
              <div className="d-flex flex-wrap gap-3">{INTEREST_OPTIONS.map((i) => <Form.Check key={i} id={`in-${i}`} label={i} checked={f.interests.includes(i)} onChange={() => toggle('interests', i)} />)}</div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Cancel</Button>
          <Button type="submit">{student ? 'Save' : 'Register'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function Members() {
  const { db } = useLibrary();
  const [q, setQ] = useState('');
  const [program, setProgram] = useState('');
  const [adding, setAdding] = useState(false);
  const today = todayISO();
  const rows = useMemo(() => db.students
    .filter((s) => (!program || s.program === program) && (`${s.name} ${s.regNo}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.name.localeCompare(b.name)), [db.students, q, program]);

  return (
    <>
      <PageHeader title="Members" subtitle={`${db.students.length} student members`}>
        <Button onClick={() => setAdding(true)}><i className="bi bi-person-plus me-1" />Register member</Button>
      </PageHeader>
      <Card className="mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={7}><InputGroup><InputGroup.Text className="bg-white"><i className="bi bi-search" /></InputGroup.Text><Form.Control placeholder="Name or registration number" value={q} onChange={(e) => setQ(e.target.value)} /></InputGroup></Col>
            <Col md={5}><Form.Select value={program} onChange={(e) => setProgram(e.target.value)}><option value="">All programmes</option>{Object.values(PROGRAMS).map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</Form.Select></Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <div className="table-responsive">
          <Table hover>
            <thead><tr><th>Member</th><th>Programme</th><th className="text-center">Sem</th><th className="text-center">Issued</th><th className="text-center">Overdue</th><th>Fines</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((s) => {
                const act = db.loans.filter((l) => l.studentId === s.id && !l.returnDate);
                const od = act.filter((l) => l.dueDate < today).length;
                const f = fineSummary(db, s.id);
                return (
                  <tr key={s.id}>
                    <td style={{ minWidth: 220 }}>
                      <Link to={`/admin/members/${s.id}`} className="d-flex gap-2 align-items-center text-reset">
                        <Initials name={s.name} />
                        <div><div className="fw-600">{s.name}</div><div className="small text-muted mono">{s.regNo}</div></div>
                      </Link>
                    </td>
                    <td className="small">{PROGRAMS[s.program]?.short}</td>
                    <td className="text-center">{s.semester}</td>
                    <td className="text-center">{act.length}</td>
                    <td className="text-center">{od ? <span className="text-danger fw-600">{od}</span> : '-'}</td>
                    <td className="small">{f.total ? <span className="text-danger">{money(f.total)}</span> : '-'}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>
      <StudentForm show={adding} onHide={() => setAdding(false)} />
    </>
  );
}
