import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row, Table } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useLibrary } from '../../store/LibraryContext';
import { BookCover, DueLabel, EmptyState, money, PageHeader, StatCard } from '../../components/common';
import { PALETTE, RED } from '../../components/charts';
import { SECTIONS } from '../../data/books';
import { addDaysISO, daysBetween, fmtDate, fmtShort, todayISO } from '../../utils/dates';

export default function AdminDashboard() {
  const { db, user, stock } = useLibrary();
  const today = todayISO();
  const active = db.loans.filter((l) => !l.returnDate);
  const overdue = active.filter((l) => l.dueDate < today);
  const holdsOpen = db.holds.filter((h) => ['waiting', 'ready'].includes(h.status));
  const unpaid = db.fines.filter((f) => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);
  const book = (id) => db.books.find((b) => b.id === id);
  const student = (id) => db.students.find((s) => s.id === id);

  const trend = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => addDaysISO(today, i - 29));
    const iss = Object.fromEntries(days.map((d) => [d, 0]));
    const ret = Object.fromEntries(days.map((d) => [d, 0]));
    db.loans.forEach((l) => {
      if (iss[l.issueDate] != null) iss[l.issueDate] += 1;
      if (l.returnDate && ret[l.returnDate] != null) ret[l.returnDate] += 1;
    });
    return {
      labels: days.map(fmtShort),
      datasets: [
        { label: 'Issued', data: days.map((d) => iss[d]), backgroundColor: RED, borderRadius: 3, maxBarThickness: 14 },
        { label: 'Returned', data: days.map((d) => ret[d]), backgroundColor: '#9fb8cc', borderRadius: 3, maxBarThickness: 14 },
      ],
    };
  }, [db.loans, today]);

  const bySection = useMemo(() => {
    const counts = {};
    db.loans.forEach((l) => {
      if (daysBetween(l.issueDate, today) > 180) return;
      const b = book(l.bookId);
      if (!b) return;
      const sec = SECTIONS[b.subject]?.name || b.subject;
      counts[sec] = (counts[sec] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { labels: entries.map((e) => e[0]), datasets: [{ data: entries.map((e) => e[1]), backgroundColor: PALETTE, borderWidth: 0 }] };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.loans, db.books, today]);

  const top = useMemo(() => {
    const m = new Map();
    db.loans.forEach((l) => { if (daysBetween(l.issueDate, today) <= 180) m.set(l.bookId, (m.get(l.bookId) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [db.loans, today]);

  const recent = useMemo(() => {
    const ev = [];
    db.loans.forEach((l) => {
      if (daysBetween(l.issueDate, today) <= 4) ev.push({ date: l.issueDate, type: 'issue', l });
      if (l.returnDate && daysBetween(l.returnDate, today) <= 4) ev.push({ date: l.returnDate, type: 'return', l });
    });
    return ev.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  }, [db.loans, today]);

  const dueSoon = active.filter((l) => l.dueDate <= addDaysISO(today, 2)).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).slice(0, 7);
  const lowStock = db.books.filter((b) => { const s = stock.get(b.id); return s.lending > 0 && s.available === 0; });

  return (
    <>
      <PageHeader title="Library Dashboard" subtitle={`Welcome, ${user.name} · ${fmtDate(today)}`}>
        <Link to="/admin/circulation" className="btn btn-primary"><i className="bi bi-arrow-left-right me-2" />Issue / Return</Link>
        <Link to="/admin/books?new=1" className="btn btn-outline-primary"><i className="bi bi-plus-lg me-2" />Add book</Link>
      </PageHeader>

      <Row className="g-3 mb-3">
        <Col xs={6} md={4} xl={2}><StatCard icon="book" label="Titles" value={db.books.length} to="/admin/books" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon="stack" tone="blue" label="Copies" value={db.copies.length} hint={`${db.copies.filter((c) => c.status === 'available').length} on shelf`} /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon="journal-arrow-up" tone="purple" label="Issued now" value={active.length} /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon="exclamation-octagon" tone="red" label="Overdue" value={overdue.length} to="/admin/fines" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon="bookmark-star" tone="amber" label="Open holds" value={holdsOpen.length} hint={`${holdsOpen.filter((h) => h.status === 'ready').length} ready for pickup`} to="/admin/holds" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon="cash-coin" tone="green" label="Fines unpaid" value={money(unpaid)} to="/admin/fines" /></Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col xl={8}>
          <Card className="h-100">
            <Card.Header><span>Circulation, last 30 days</span><span className="small text-muted fw-normal">{db.students.length} active members</span></Card.Header>
            <Card.Body style={{ height: 280 }}>
              <Bar data={trend} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0f1f3' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } } } }} />
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="h-100">
            <Card.Header><span>Borrowing by section (6 months)</span></Card.Header>
            <Card.Body style={{ height: 280 }}>
              <Doughnut data={bySection} options={{ maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right' } } }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col xl={4} lg={6}>
          <Card className="h-100">
            <Card.Header><span>Due today and overdue</span><Link to="/admin/fines" className="small">All overdues</Link></Card.Header>
            <Card.Body className="p-0">
              {dueSoon.length ? dueSoon.map((l) => (
                <div key={l.id} className="px-3 py-2 border-bottom small">
                  <div className="fw-600 text-truncate">{book(l.bookId)?.title}</div>
                  <div className="d-flex justify-content-between"><Link to={`/admin/members/${l.studentId}`}>{student(l.studentId)?.name}</Link><DueLabel loan={l} /></div>
                </div>
              )) : <EmptyState icon="check2-circle" title="Nothing due" />}
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4} lg={6}>
          <Card className="h-100">
            <Card.Header><span>Most borrowed (6 months)</span></Card.Header>
            <Card.Body className="p-0">
              {top.map(([id, n]) => {
                const b = book(id);
                if (!b) return null;
                return (
                  <Link key={id} to={`/admin/book/${id}`} className="d-flex gap-2 px-3 py-2 border-bottom text-reset align-items-center">
                    <BookCover book={b} size="xs" />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="small fw-600 text-truncate">{b.title}</div>
                      <div className="small text-muted">Rack {b.location.rack} · {stock.get(id).available}/{stock.get(id).lending} on shelf</div>
                    </div>
                    <span className="badge text-bg-light border">{n}</span>
                  </Link>
                );
              })}
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="mb-3">
            <Card.Header><span>Recent transactions</span></Card.Header>
            <div className="table-responsive">
              <Table size="sm" className="small">
                <tbody>
                  {(db.activity.length ? db.activity.slice(0, 6).map((a) => (
                    <tr key={a.id}><td className="text-muted text-nowrap ps-3">{fmtShort(a.date)} {a.time}</td><td className="pe-3">{a.text}</td></tr>
                  )) : recent.map((e) => (
                    <tr key={`${e.type}${e.l.id}`}>
                      <td className="text-muted text-nowrap ps-3">{fmtShort(e.date)}</td>
                      <td className="pe-3"><span className={e.type === 'issue' ? 'text-primary' : 'text-success'}>{e.type === 'issue' ? 'Issued' : 'Returned'}</span> {book(e.l.bookId)?.title} · {student(e.l.studentId)?.name}</td>
                    </tr>
                  )))}
                </tbody>
              </Table>
            </div>
          </Card>
          {lowStock.length > 0 && (
            <Card>
              <Card.Header><span><i className="bi bi-exclamation-triangle text-warning me-2" />No copies on shelf</span></Card.Header>
              <Card.Body className="small">
                {lowStock.slice(0, 5).map((b) => <div key={b.id} className="mb-1"><Link to={`/admin/book/${b.id}`}>{b.title}</Link> <span className="text-muted">· {stock.get(b.id).holdsWaiting} waiting</span></div>)}
                <div className="text-muted mt-2">Consider adding copies for titles with a hold queue.</div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
