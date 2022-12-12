import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Row, Tab, Table, Tabs } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { BookCover, DueLabel, Initials, money, PageHeader, RackTag, StatusBadge } from '../../components/common';
import { accruingFine, eligibility, fineSummary, overdueDays } from '../../services/library';
import { addDaysISO, fmtDate, todayISO } from '../../utils/dates';

function MemberCard({ db, student }) {
  if (!student) return null;
  const el = eligibility(db, student.id);
  const f = fineSummary(db, student.id);
  const loans = db.loans.filter((l) => l.studentId === student.id && !l.returnDate);
  return (
    <Card className="mb-3 border-start border-4" style={{ borderLeftColor: el.ok ? '#1e7e4f' : '#c0392b' }}>
      <Card.Body>
        <div className="d-flex gap-3 align-items-center mb-2">
          <Initials name={student.name} />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <Link to={`/admin/members/${student.id}`} className="fw-600">{student.name}</Link>
            <div className="small text-muted text-truncate">{student.regNo} · {student.programName} · Sem {student.semester}</div>
          </div>
          <Badge bg={el.ok ? 'success' : 'danger'}>{el.ok ? `Can borrow ${el.remaining} more` : 'Blocked'}</Badge>
        </div>
        <div className="d-flex flex-wrap gap-3 small">
          <span><i className="bi bi-journal-bookmark me-1" />{loans.length} / {db.settings.maxLoans} issued</span>
          <span className={f.total ? 'text-danger' : ''}><i className="bi bi-cash-coin me-1" />{money(f.unpaid)} unpaid{f.accruing ? ` + ${money(f.accruing)} accruing` : ''}</span>
        </div>
        {!el.ok && <div className="small text-danger mt-2"><i className="bi bi-x-circle me-1" />{el.reasons.join('; ')}</div>}
      </Card.Body>
    </Card>
  );
}

function CopyPreview({ db, copy }) {
  if (!copy) return null;
  const b = db.books.find((x) => x.id === copy.bookId);
  const loan = db.loans.find((l) => l.copyId === copy.id && !l.returnDate);
  const holder = loan && db.students.find((s) => s.id === loan.studentId);
  const hold = copy.status === 'held' && db.holds.find((h) => h.copyId === copy.id && h.status === 'ready');
  return (
    <Card className="mb-3">
      <Card.Body className="d-flex gap-3">
        <BookCover book={b} size="sm" />
        <div style={{ minWidth: 0 }}>
          <div className="fw-600">{b.title}</div>
          <div className="small text-muted mb-1">{b.authors}</div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="mono small">{copy.id}</span>
            <StatusBadge status={copy.status} />
            {copy.type === 'reference' && <Badge bg="secondary" className="fw-normal">Reference copy</Badge>}
            <RackTag location={b.location} />
          </div>
          {holder && <div className="small mt-2">With <strong>{holder.name}</strong> ({holder.regNo}) · <DueLabel loan={loan} />{overdueDays(loan) > 0 && <span className="text-danger"> · fine {money(accruingFine(db, loan))}</span>}</div>}
          {hold && <div className="small mt-2 text-warning-emphasis"><i className="bi bi-bookmark-fill me-1" />Reserved for {db.students.find((s) => s.id === hold.studentId)?.name} until {fmtDate(hold.expiresOn)}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}

export default function Circulation() {
  const { db, actions } = useLibrary();
  const notify = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'issue');
  const [reg, setReg] = useState(params.get('member') || '');
  const [acc, setAcc] = useState(params.get('copy') || '');
  const [retAcc, setRetAcc] = useState('');
  const [renReg, setRenReg] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [sessionLog, setSessionLog] = useState([]);

  const student = db.students.find((s) => s.regNo === reg.trim());
  const copy = db.copies.find((c) => c.id === acc.trim().toUpperCase());
  const retCopy = db.copies.find((c) => c.id === retAcc.trim().toUpperCase());
  const renStudent = db.students.find((s) => s.regNo === renReg.trim());
  const readyHolds = student ? db.holds.filter((h) => h.studentId === student.id && h.status === 'ready') : [];
  const availableCopies = useMemo(() => db.copies.filter((c) => c.type === 'lending' && c.status === 'available'), [db.copies]);
  const book = (id) => db.books.find((b) => b.id === id);

  const record = (res, kind) => {
    notify(res);
    setLastResult(res);
    if (res.ok) setSessionLog((l) => [{ kind, text: res.message, at: new Date().toTimeString().slice(0, 5) }, ...l].slice(0, 10));
    return res;
  };

  const doIssue = (e) => {
    e.preventDefault();
    if (!student || !copy) return;
    const r = record(actions.issue(student.id, copy.id), 'issue');
    if (r.ok) setAcc('');
  };
  const doReturn = (e) => {
    e.preventDefault();
    if (!retCopy) return;
    const r = record(actions.returnCopy(retCopy.id), 'return');
    if (r.ok) setRetAcc('');
  };

  return (
    <>
      <PageHeader title="Circulation Desk" subtitle={`Loan period ${db.settings.loanDays} days · max ${db.settings.maxLoans} books per student · fine ₹${db.settings.finePerDay}/day`} />
      <datalist id="members">{db.students.map((s) => <option key={s.id} value={s.regNo}>{s.name}</option>)}</datalist>
      <datalist id="avail-copies">{availableCopies.map((c) => <option key={c.id} value={c.id}>{book(c.bookId)?.title}</option>)}</datalist>
      <datalist id="issued-copies">{db.copies.filter((c) => c.status === 'issued').map((c) => <option key={c.id} value={c.id}>{book(c.bookId)?.title}</option>)}</datalist>

      <Row className="g-3">
        <Col xl={8}>
          <Card>
            <Tabs activeKey={tab} onSelect={(k) => { setTab(k); setLastResult(null); }} className="px-3 pt-2">
              <Tab eventKey="issue" title={<><i className="bi bi-box-arrow-up-right me-1" />Issue</>}>
                <Card.Body>
                  <Form onSubmit={doIssue}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Label>1. Member registration no.</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-white"><i className="bi bi-person-vcard" /></InputGroup.Text>
                          <Form.Control list="members" value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Scan ID card or type" />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Label>2. Accession no. of the copy</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-white"><i className="bi bi-upc-scan" /></InputGroup.Text>
                          <Form.Control list="avail-copies" value={acc} onChange={(e) => setAcc(e.target.value)} placeholder="Scan barcode, e.g. GL001010" />
                        </InputGroup>
                      </Col>
                    </Row>
                    {reg && !student && <div className="small text-danger mt-2">No member with this registration number.</div>}
                    {acc && !copy && <div className="small text-danger mt-2">No copy with this accession number.</div>}
                    <div className="mt-3">
                      <MemberCard db={db} student={student} />
                      {readyHolds.length > 0 && (
                        <Alert variant="warning" className="small">
                          <i className="bi bi-bookmark-fill me-1" />On the hold shelf for this member:{' '}
                          {readyHolds.map((h) => <Button key={h.id} size="sm" variant="link" className="p-0 me-2" onClick={() => setAcc(h.copyId)}>{book(h.bookId)?.title} ({h.copyId})</Button>)}
                        </Alert>
                      )}
                      <CopyPreview db={db} copy={copy} />
                    </div>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <Button type="submit" disabled={!student || !copy}><i className="bi bi-check2 me-1" />Issue book</Button>
                      {student && copy && <span className="small text-muted">Due date will be {fmtDate(addDaysISO(todayISO(), db.settings.loanDays))}</span>}
                    </div>
                  </Form>
                </Card.Body>
              </Tab>
              <Tab eventKey="return" title={<><i className="bi bi-box-arrow-in-down-left me-1" />Return</>}>
                <Card.Body>
                  <Form onSubmit={doReturn}>
                    <Form.Label>Accession no. of the returned copy</Form.Label>
                    <InputGroup className="mb-3" style={{ maxWidth: 420 }}>
                      <InputGroup.Text className="bg-white"><i className="bi bi-upc-scan" /></InputGroup.Text>
                      <Form.Control list="issued-copies" value={retAcc} onChange={(e) => setRetAcc(e.target.value)} placeholder="Scan barcode" />
                      <Button type="submit" disabled={!retCopy || retCopy.status !== 'issued'}>Receive</Button>
                    </InputGroup>
                    {retAcc && !retCopy && <div className="small text-danger mb-2">No copy with this accession number.</div>}
                    {retCopy && retCopy.status !== 'issued' && <div className="small text-warning-emphasis mb-2">This copy is not issued.</div>}
                    <CopyPreview db={db} copy={retCopy} />
                  </Form>
                  {lastResult?.hold && (
                    <Alert variant="info" className="small mb-0"><i className="bi bi-arrow-right-circle me-1" />Do not reshelve: place the copy on the hold shelf for the next member in the queue.</Alert>
                  )}
                </Card.Body>
              </Tab>
              <Tab eventKey="renew" title={<><i className="bi bi-arrow-repeat me-1" />Renew</>}>
                <Card.Body>
                  <Form.Label>Member registration no.</Form.Label>
                  <Form.Control list="members" value={renReg} onChange={(e) => setRenReg(e.target.value)} placeholder="Scan ID card or type" className="mb-3" style={{ maxWidth: 420 }} />
                  <MemberCard db={db} student={renStudent} />
                  {renStudent && (
                    <div className="table-responsive">
                      <Table hover>
                        <thead><tr><th>Book</th><th>Due</th><th>Renewals</th><th /></tr></thead>
                        <tbody>
                          {db.loans.filter((l) => l.studentId === renStudent.id && !l.returnDate).map((l) => (
                            <tr key={l.id}>
                              <td><div className="fw-600">{book(l.bookId)?.title}</div><div className="mono small text-muted">{l.copyId}</div></td>
                              <td className="small"><DueLabel loan={l} /></td>
                              <td className="small">{l.renewals}/{db.settings.maxRenewals}</td>
                              <td className="text-end">
                                <Button size="sm" variant="outline-primary" className="me-1" onClick={() => record(actions.renew(l.id), 'renew')}>Renew</Button>
                                <Button size="sm" variant="outline-secondary" onClick={() => record(actions.returnCopy(l.copyId), 'return')}>Return</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Tab>
            </Tabs>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="mb-3">
            <Card.Header><span><i className="bi bi-clock-history me-2 text-primary" />This session</span></Card.Header>
            <Card.Body className="p-0">
              {sessionLog.length ? sessionLog.map((l, i) => (
                <div key={i} className="px-3 py-2 border-bottom small d-flex gap-2">
                  <span className="text-muted">{l.at}</span>
                  <span><Badge bg={l.kind === 'issue' ? 'primary' : l.kind === 'return' ? 'success' : 'info'} className="me-1 fw-normal text-capitalize">{l.kind}</Badge>{l.text}</span>
                </div>
              )) : <div className="p-3 small text-muted">Transactions you make here will be listed for quick reference.</div>}
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><span><i className="bi bi-info-circle me-2 text-primary" />Desk rules</span></Card.Header>
            <Card.Body className="small">
              <ul className="ps-3 mb-0 list-unstyled-tight">
                <li>Reference copies are for in-library use and cannot be issued.</li>
                <li>Members with overdue books or more than ₹{db.settings.fineBlockLimit} in unpaid fines cannot borrow.</li>
                <li>A title with a waiting hold cannot be renewed.</li>
                <li>Returned copies with a waiting hold go to the hold shelf for {db.settings.holdExpiryDays} days.</li>
                <li>Fines are calculated automatically on return.</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
