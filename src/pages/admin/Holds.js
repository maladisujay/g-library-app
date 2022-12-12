import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Nav, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { EmptyState, PageHeader, RackTag, StatusBadge } from '../../components/common';
import { daysBetween, fmtDate, todayISO } from '../../utils/dates';

export default function Holds() {
  const { db, stock, actions } = useLibrary();
  const notify = useToast();
  const [filter, setFilter] = useState('open');
  const today = todayISO();
  const book = (id) => db.books.find((b) => b.id === id);
  const student = (id) => db.students.find((s) => s.id === id);
  const list = db.holds
    .filter((h) => (filter === 'open' ? ['waiting', 'ready'].includes(h.status) : filter === 'ready' ? h.status === 'ready' : !['waiting', 'ready'].includes(h.status)))
    .sort((a, b) => (a.status === 'ready' ? -1 : 0) - (b.status === 'ready' ? -1 : 0) || (a.placedOn < b.placedOn ? -1 : 1));

  return (
    <>
      <PageHeader title="Holds & Reservations" subtitle={`Ready holds are kept on the hold shelf for ${db.settings.holdExpiryDays} days, then released to the next member in the queue.`} />
      <Nav variant="pills" activeKey={filter} className="mb-3 gap-1" onSelect={setFilter}>
        <Nav.Item><Nav.Link eventKey="open">Open ({db.holds.filter((h) => ['waiting', 'ready'].includes(h.status)).length})</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="ready">Ready for pickup ({db.holds.filter((h) => h.status === 'ready').length})</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="closed">Closed</Nav.Link></Nav.Item>
      </Nav>
      <Card>
        {list.length ? (
          <div className="table-responsive">
            <Table hover>
              <thead><tr><th>Book</th><th>Member</th><th>Placed</th><th>Status</th><th>Shelf / copy</th><th /></tr></thead>
              <tbody>
                {list.map((h) => {
                  const b = book(h.bookId);
                  const s = student(h.studentId);
                  const pos = db.holds.filter((x) => x.bookId === h.bookId && x.status === 'waiting' && x.placedOn <= h.placedOn).length;
                  return (
                    <tr key={h.id}>
                      <td style={{ minWidth: 220 }}><Link to={`/admin/book/${b?.id}`} className="fw-600 text-body">{b?.title}</Link><div className="small text-muted">{stock.get(h.bookId)?.available ?? 0} on shelf · {stock.get(h.bookId)?.issued ?? 0} issued</div></td>
                      <td className="small"><Link to={`/admin/members/${s?.id}`}>{s?.name}</Link><div className="text-muted mono">{s?.regNo}</div></td>
                      <td className="small text-nowrap">{fmtDate(h.placedOn)}<div className="text-muted">{daysBetween(h.placedOn, today)} days ago</div></td>
                      <td><StatusBadge status={h.status} label={h.status === 'waiting' ? `waiting #${pos}` : h.status === 'ready' ? 'ready' : undefined} />{h.status === 'ready' && <div className="small text-muted">until {fmtDate(h.expiresOn)}</div>}</td>
                      <td className="small">{h.copyId ? <span className="mono">{h.copyId}</span> : b && <RackTag location={b.location} />}</td>
                      <td className="text-end text-nowrap">
                        {h.status === 'ready' && <Link className="btn btn-sm btn-primary me-1" to={`/admin/circulation?member=${s?.regNo}&copy=${h.copyId}`}>Issue</Link>}
                        {['waiting', 'ready'].includes(h.status) && <Button size="sm" variant="outline-secondary" onClick={() => notify(actions.cancelHold(h.id))}>Cancel</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : <EmptyState icon="bookmark" title="No holds in this list" />}
      </Card>
    </>
  );
}
