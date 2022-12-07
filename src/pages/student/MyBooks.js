import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Tab, Table, Tabs } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { BookCover, DueLabel, EmptyState, money, PageHeader, RackTag, StatusBadge } from '../../components/common';
import { accruingFine } from '../../services/library';
import { fmtDate } from '../../utils/dates';

function Stars({ value, onRate }) {
  return (
    <span className="text-nowrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="btn btn-link p-0 me-1" onClick={() => onRate(n)} aria-label={`${n} star`}>
          <i className={`bi ${value >= n ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`} />
        </button>
      ))}
    </span>
  );
}

export default function MyBooks() {
  const { db, user, actions } = useLibrary();
  const notify = useToast();
  const book = (id) => db.books.find((b) => b.id === id);
  const loans = db.loans.filter((l) => l.studentId === user.id);
  const current = loans.filter((l) => !l.returnDate).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  const history = loans.filter((l) => l.returnDate).sort((a, b) => (a.returnDate < b.returnDate ? 1 : -1));
  const holds = db.holds.filter((h) => h.studentId === user.id).sort((a, b) => (a.placedOn < b.placedOn ? 1 : -1));
  const fines = db.fines.filter((f) => f.studentId === user.id).sort((a, b) => (a.createdOn < b.createdOn ? 1 : -1));

  const BookCell = ({ id, sub }) => {
    const b = book(id);
    if (!b) return <span className="text-muted">Withdrawn title</span>;
    return (
      <div className="d-flex gap-2 align-items-center">
        <BookCover book={b} size="xs" />
        <div style={{ minWidth: 0 }}>
          <Link to={`/student/book/${b.id}`} className="fw-600 text-body d-block text-truncate" style={{ maxWidth: 280 }}>{b.title}</Link>
          <div className="small text-muted">{sub}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader title="My Books" subtitle={`Loan period ${db.settings.loanDays} days · up to ${db.settings.maxRenewals} renewals · fine ₹${db.settings.finePerDay} per day after the due date`} />
      <Card>
        <Tabs defaultActiveKey="current" className="px-3 pt-2" mountOnEnter>
          <Tab eventKey="current" title={`Issued (${current.length})`}>
            {current.length ? (
              <div className="table-responsive">
                <Table hover>
                  <thead><tr><th>Book</th><th>Issued on</th><th>Due</th><th>Renewals</th><th>Fine</th><th /></tr></thead>
                  <tbody>
                    {current.map((l) => (
                      <tr key={l.id}>
                        <td><BookCell id={l.bookId} sub={<span className="mono">{l.copyId}</span>} /></td>
                        <td className="small text-nowrap">{fmtDate(l.issueDate)}</td>
                        <td className="small text-nowrap"><DueLabel loan={l} /></td>
                        <td className="small">{l.renewals} / {db.settings.maxRenewals}</td>
                        <td className="small">{accruingFine(db, l) ? <span className="text-danger fw-600">{money(accruingFine(db, l))}</span> : '-'}</td>
                        <td className="text-end"><Button size="sm" variant="outline-primary" disabled={l.renewals >= db.settings.maxRenewals} onClick={() => notify(actions.renew(l.id))}>Renew</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : <EmptyState icon="journal" title="You have no books issued" />}
          </Tab>
          <Tab eventKey="holds" title={`Holds (${holds.filter((h) => ['waiting', 'ready'].includes(h.status)).length})`}>
            {holds.length ? (
              <div className="table-responsive">
                <Table hover>
                  <thead><tr><th>Book</th><th>Placed on</th><th>Status</th><th>Location</th><th /></tr></thead>
                  <tbody>
                    {holds.map((h) => {
                      const pos = db.holds.filter((x) => x.bookId === h.bookId && x.status === 'waiting' && x.placedOn <= h.placedOn).length;
                      return (
                        <tr key={h.id}>
                          <td><BookCell id={h.bookId} sub={h.status === 'ready' ? `Collect by ${fmtDate(h.expiresOn)} · copy ${h.copyId}` : h.status === 'waiting' ? `Queue position #${pos}` : ''} /></td>
                          <td className="small text-nowrap">{fmtDate(h.placedOn)}</td>
                          <td><StatusBadge status={h.status} label={h.status === 'ready' ? 'ready for pickup' : undefined} /></td>
                          <td>{book(h.bookId) && <RackTag location={book(h.bookId).location} />}</td>
                          <td className="text-end">{['waiting', 'ready'].includes(h.status) && <Button size="sm" variant="outline-secondary" onClick={() => notify(actions.cancelHold(h.id))}>Cancel</Button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : <EmptyState icon="bookmark" title="No holds">Place a hold from any book page when all copies are issued.</EmptyState>}
          </Tab>
          <Tab eventKey="history" title={`History (${history.length})`}>
            {history.length ? (
              <div className="table-responsive">
                <Table hover>
                  <thead><tr><th>Book</th><th>Issued</th><th>Returned</th><th>Your rating</th></tr></thead>
                  <tbody>
                    {history.map((l) => (
                      <tr key={l.id}>
                        <td><BookCell id={l.bookId} sub={book(l.bookId)?.authors.split(',')[0]} /></td>
                        <td className="small text-nowrap">{fmtDate(l.issueDate)}</td>
                        <td className="small text-nowrap">{fmtDate(l.returnDate)}{l.returnDate > l.dueDate && <Badge bg="danger" className="ms-1 fw-normal">late</Badge>}</td>
                        <td><Stars value={l.rating || 0} onRate={(n) => notify(actions.rate(l.id, n))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : <EmptyState icon="clock-history" title="No borrowing history yet" />}
          </Tab>
          <Tab eventKey="fines" title={`Fines (${fines.filter((f) => f.status === 'unpaid').length})`}>
            {fines.length ? (
              <div className="table-responsive">
                <Table hover>
                  <thead><tr><th>Book</th><th>Reason</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {fines.map((f) => (
                      <tr key={f.id}>
                        <td><BookCell id={f.bookId} sub={`${f.id} · ${fmtDate(f.createdOn)}`} /></td>
                        <td className="small">{f.reason}</td>
                        <td className="fw-600">{money(f.amount)}</td>
                        <td><StatusBadge status={f.status} />{f.paidOn && <div className="small text-muted">{fmtDate(f.paidOn)}</div>}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : <EmptyState icon="emoji-smile" title="No fines. Thank you for returning on time!" />}
            <div className="px-3 pb-3 small text-muted">Fines are paid at the circulation desk (cash or UPI).</div>
          </Tab>
        </Tabs>
      </Card>
    </>
  );
}
