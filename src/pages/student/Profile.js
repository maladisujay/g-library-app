import React, { useState } from 'react';
import { Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { Initials, PageHeader } from '../../components/common';
import { INTEREST_OPTIONS } from '../../data/students';
import { ageFrom, fmtDate } from '../../utils/dates';

export default function Profile() {
  const { db, user, actions } = useLibrary();
  const notify = useToast();
  const [interests, setInterests] = useState(user.interests);
  const course = (c) => db.courses.find((x) => x.code === c);
  const toggle = (i) => setInterests((xs) => (xs.includes(i) ? xs.filter((x) => x !== i) : [...xs, i]));
  const loans = db.loans.filter((l) => l.studentId === user.id);

  const rows = [
    ['Registration no.', <span className="mono">{user.regNo}</span>],
    ['Programme', user.programName],
    ['School', user.school],
    ['Year / Semester', `Year ${user.year} · Semester ${user.semester} · Section ${user.section}`],
    ['Gender', user.gender],
    ['Date of birth', `${fmtDate(user.dob)} (${ageFrom(user.dob)} years)`],
    ['CGPA', user.cgpa ?? 'Not yet available'],
    ['Campus', user.campus],
    ['Residence', user.residence],
    ['Email', user.email],
    ['Phone', user.phone],
    ['Member since', fmtDate(user.memberSince)],
  ];

  return (
    <>
      <PageHeader title="My Profile" subtitle="Academic details are synced from the university records. Contact the library to correct them." />
      <Row className="g-3">
        <Col lg={7}>
          <Card>
            <Card.Body className="d-flex gap-3 align-items-center border-bottom">
              <Initials name={user.name} size="lg" />
              <div>
                <div className="h5 mb-0">{user.name}</div>
                <div className="text-muted small">{user.programName}</div>
                <Badge bg="success" className="mt-1 fw-normal">Library membership {user.status.toLowerCase()}</Badge>
              </div>
            </Card.Body>
            <Table className="mb-0">
              <tbody>
                {rows.map(([k, v]) => <tr key={k}><td className="text-muted small" style={{ width: 170 }}>{k}</td><td>{v}</td></tr>)}
              </tbody>
            </Table>
          </Card>
        </Col>
        <Col lg={5}>
          <Card className="mb-3">
            <Card.Header><span><i className="bi bi-mortarboard me-2 text-primary" />Registered courses</span></Card.Header>
            <Card.Body className="p-0">
              {user.courses.map((c) => (
                <div key={c} className="px-3 py-2 border-bottom d-flex justify-content-between gap-2 small">
                  <span><span className="mono text-muted me-2">{c}</span>{course(c)?.title}</span>
                  {user.electives.includes(c) && <Badge bg="info" className="fw-normal align-self-center">Elective</Badge>}
                </div>
              ))}
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Header><span><i className="bi bi-heart me-2 text-primary" />Reading interests</span></Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {INTEREST_OPTIONS.map((i) => (
                  <Form.Check key={i} type="checkbox" id={`int-${i}`} className="me-2" label={i} checked={interests.includes(i)} onChange={() => toggle(i)} />
                ))}
              </div>
              <Button size="sm" onClick={() => notify(actions.updateInterests(user.id, interests))}>Save interests</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><span><i className="bi bi-shield-check me-2 text-primary" />Data used for recommendations</span></Card.Header>
            <Card.Body className="small">
              <p className="mb-2">To suggest books, G-Library compares your programme, semester, age, gender, electives, registered and completed courses, interests and CGPA band with other students, along with your {loans.length} borrowing records and ratings.</p>
              <p className="mb-0 text-muted">Other students only ever see you as an anonymous profile (for example "Third-year CSE student"). Your name and registration number are never shown to them.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
