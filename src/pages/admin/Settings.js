import React, { useState } from 'react';
import { Button, Card, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { PageHeader } from '../../components/common';
import { fmtDate } from '../../utils/dates';

const RULES = [
  ['loanDays', 'Loan period', 'days'],
  ['maxLoans', 'Books per student', 'books'],
  ['maxRenewals', 'Renewals per loan', 'times'],
  ['finePerDay', 'Overdue fine', '₹ / day'],
  ['fineBlockLimit', 'Block borrowing above', '₹ unpaid'],
  ['holdExpiryDays', 'Hold shelf period', 'days'],
];

export default function Settings() {
  const { db, actions, resetDemo } = useLibrary();
  const notify = useToast();
  const [rules, setRules] = useState(db.settings);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <>
      <PageHeader title="Rules & Notices" subtitle="Circulation policy and announcements shown on the student portal." />
      <Row className="g-3">
        <Col lg={6}>
          <Card className="mb-3">
            <Card.Header><span>Circulation rules</span></Card.Header>
            <Card.Body>
              <Row className="g-3">
                {RULES.map(([k, label, unit]) => (
                  <Col sm={6} key={k}>
                    <Form.Label>{label}</Form.Label>
                    <InputGroup>
                      <Form.Control type="number" min={0} value={rules[k]} onChange={(e) => setRules((r) => ({ ...r, [k]: e.target.value }))} />
                      <InputGroup.Text>{unit}</InputGroup.Text>
                    </InputGroup>
                  </Col>
                ))}
              </Row>
              <Button className="mt-3" onClick={() => notify(actions.updateSettings(rules))}>Save rules</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><span>Demo data</span></Card.Header>
            <Card.Body>
              <p className="small text-muted">This deployment keeps its database in the browser. Resetting restores the 20 sample students, the catalogue, loan history, holds, fines and exam timetable.</p>
              <Button variant="outline-danger" onClick={() => { if (window.confirm('Reset all demo data? Changes made in this browser will be lost.')) { resetDemo(); notify({ ok: true, message: 'Demo data restored.' }); } }}>
                <i className="bi bi-arrow-counterclockwise me-1" />Reset demo data
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="mb-3">
            <Card.Header><span>Publish a notice</span></Card.Header>
            <Card.Body>
              <Form.Group className="mb-2"><Form.Label>Title</Form.Label><Form.Control value={title} onChange={(e) => setTitle(e.target.value)} /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Message</Form.Label><Form.Control as="textarea" rows={3} value={body} onChange={(e) => setBody(e.target.value)} /></Form.Group>
              <Button onClick={() => { const r = notify(actions.addNotice(title, body)); if (r.ok) { setTitle(''); setBody(''); } }}>Publish</Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><span>Current notices</span></Card.Header>
            <Card.Body className="p-0">
              {db.notices.map((n) => (
                <div key={n.id} className="p-3 border-bottom d-flex justify-content-between gap-2">
                  <div>
                    <div className="small text-muted">{fmtDate(n.date)}</div>
                    <div className="fw-600">{n.title}</div>
                    <div className="small text-muted">{n.body}</div>
                  </div>
                  <Button size="sm" variant="link" className="text-danger" onClick={() => notify(actions.deleteNotice(n.id))}>Remove</Button>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
