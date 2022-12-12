import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { EmptyState, money, PageHeader, StatCard, StatusBadge } from '../../components/common';
import { accruingFine, overdueDays } from '../../services/library';
import { fmtDate, todayISO } from '../../utils/dates';

export default function Fines() {
  const { db, actions } = useLibrary();
  const notify = useToast();
  const today = todayISO();
  const book = (id) => db.books.find((b) => b.id === id);
  const student = (id) => db.students.find((s) => s.id === id);
  const overdue = db.loans.filter((l) => !l.returnDate && l.dueDate < today).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  const unpaid = db.fines.filter((f) => f.status === 'unpaid');
  const collected = db.fines.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);

  return (
    <>
      <PageHeader title="Overdues & Fines" subtitle={`Fine rate ₹${db.settings.finePerDay} per day. Borrowing is blocked for overdue books or unpaid fines above ₹${db.settings.fineBlockLimit}.`} />
      <Row className="g-3 mb-3">
        <Col xs={6} lg={3}><StatCard icon="exclamation-octagon" label="Overdue books" value={overdue.length} /></Col>
        <Col xs={6} lg={3}><StatCard icon="hourglass-split" tone="amber" label="Accruing on overdues" value={money(overdue.reduce((s, l) => s + accruingFine(db, l), 0))} /></Col>
        <Col xs={6} lg={3}><StatCard icon="receipt" tone="red" label="Unpaid fines" value={money(unpaid.reduce((s, f) => s + f.amount, 0))} hint={`${unpaid.length} receipts pending`} /></Col>
        <Col xs={6} lg={3}><StatCard icon="cash-stack" tone="green" label="Collected (all time)" value={money(collected)} /></Col>
      </Row>
      <Card className="mb-3">
        <Card.Header><span>Overdue books</span></Card.Header>
        {overdue.length ? (
          <div className="table-responsive">
            <Table hover>
              <thead><tr><th>Book</th><th>Member</th><th>Due date</th><th>Days late</th><th>Fine so far</th><th /></tr></thead>
              <tbody>
                {overdue.map((l) => {
                  const s = student(l.studentId);
                  return (
                    <tr key={l.id}>
                      <td><Link to={`/admin/book/${l.bookId}`} className="fw-600 text-body">{book(l.bookId)?.title}</Link><div className="mono small text-muted">{l.copyId}</div></td>
                      <td className="small"><Link to={`/admin/members/${s.id}`}>{s.name}</Link><div className="text-muted">{s.phone}</div></td>
                      <td className="small text-nowrap">{fmtDate(l.dueDate)}</td>
                      <td className="text-danger fw-600">{overdueDays(l)}</td>
                      <td className="fw-600">{money(accruingFine(db, l))}</td>
                      <td className="text-end text-nowrap">
                        <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => notify({ ok: true, message: `Reminder sent to ${s.email} and ${s.phone}.` })}><i className="bi bi-envelope me-1" />Remind</Button>
                        <Button size="sm" onClick={() => notify(actions.returnCopy(l.copyId))}>Receive</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : <EmptyState icon="check2-circle" title="No overdue books" />}
      </Card>
      <Card>
        <Card.Header><span>Fine register</span></Card.Header>
        <div className="table-responsive">
          <Table hover>
            <thead><tr><th>Receipt</th><th>Member</th><th>Book</th><th>Reason</th><th>Amount</th><th>Status</th><th /></tr></thead>
            <tbody>
              {[...db.fines].sort((a, b) => (a.status === 'unpaid' ? -1 : 1) - (b.status === 'unpaid' ? -1 : 1) || (a.createdOn < b.createdOn ? 1 : -1)).map((f) => (
                <tr key={f.id}>
                  <td className="mono small">{f.id}<div className="text-muted">{fmtDate(f.createdOn)}</div></td>
                  <td className="small"><Link to={`/admin/members/${f.studentId}`}>{student(f.studentId)?.name}</Link></td>
                  <td className="small">{book(f.bookId)?.title}</td>
                  <td className="small">{f.reason}</td>
                  <td className="fw-600">{money(f.amount)}</td>
                  <td><StatusBadge status={f.status} />{f.paidOn && <div className="small text-muted">{fmtDate(f.paidOn)}</div>}</td>
                  <td className="text-end text-nowrap">
                    {f.status === 'unpaid' && (
                      <>
                        <Button size="sm" className="me-1" onClick={() => notify(actions.payFine(f.id))}>Collect</Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => notify(actions.waiveFine(f.id))}>Waive</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </>
  );
}
