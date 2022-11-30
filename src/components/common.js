import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Pagination } from 'react-bootstrap';
import { SECTIONS } from '../data/books';
import { daysBetween, fmtDate, todayISO } from '../utils/dates';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, tone = 'red', to }) {
  const body = (
    <Card className="stat-card h-100">
      <Card.Body>
        <div className={`stat-icon tone-${tone}`}><i className={`bi bi-${icon}`} /></div>
        <div className="min-w-0">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
          {hint && <div className="small text-muted mt-1">{hint}</div>}
        </div>
      </Card.Body>
    </Card>
  );
  return to ? <Link to={to} className="text-reset d-block h-100">{body}</Link> : body;
}

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
};

export function BookCover({ book, size = 'md' }) {
  const base = SECTIONS[book.subject]?.color || '#5a6470';
  const n = parseInt(book.id.replace(/\D/g, ''), 10) || 0;
  const varied = shade(base, ((n * 37) % 50) - 25);
  return (
    <div className={`book-cover ${size}`} style={{ background: `linear-gradient(150deg, ${varied}, ${shade(base, -45)})` }} aria-hidden="true">
      <span className="cover-band" style={{ top: '18%' }} />
      <div className="cover-title" style={{ marginTop: '22%' }}>{book.title}</div>
      <div className="cover-author">{book.authors.split(',')[0]}</div>
    </div>
  );
}

export function StockPill({ stock }) {
  if (!stock) return null;
  if (!stock.lending) return <span className="stock-pill ref"><i className="bi bi-bookmark" />Reference only</span>;
  const cls = stock.available === 0 ? 'none' : stock.available <= 1 ? 'low' : 'ok';
  return (
    <span className={`stock-pill ${cls}`}>
      <i className={`bi ${stock.available ? 'bi-check-circle' : 'bi-x-circle'}`} />
      {stock.available ? `${stock.available} of ${stock.lending} available` : 'All copies issued'}
    </span>
  );
}

export function RackTag({ location, showFloor = false }) {
  if (!location) return null;
  return (
    <span className="rack-tag" title={`${location.floor} · ${location.section} · Rack ${location.rack} · Shelf ${location.shelf}`}>
      <i className="bi bi-geo-alt-fill" />
      Rack {location.rack} · Shelf {location.shelf}
      {showFloor && <span className="fw-normal text-muted">· {location.floor}</span>}
    </span>
  );
}

const STATUS_TONES = {
  available: 'success', issued: 'info', held: 'warning', lost: 'dark', damaged: 'secondary', reference: 'secondary',
  waiting: 'warning', ready: 'success', fulfilled: 'secondary', cancelled: 'secondary', expired: 'dark',
  unpaid: 'danger', paid: 'success', waived: 'secondary', overdue: 'danger', returned: 'secondary', active: 'primary', Active: 'success', Suspended: 'danger',
};

export function StatusBadge({ status, label }) {
  const tone = STATUS_TONES[status] || 'secondary';
  return <span className={`status-badge bg-${tone} bg-opacity-10 text-${tone === 'warning' ? 'warning-emphasis' : tone} border border-${tone} border-opacity-25`}>{label || (status === 'held' ? 'on hold shelf' : status)}</span>;
}

export function DueLabel({ loan }) {
  if (loan.returnDate) return <span className="text-muted">Returned {fmtDate(loan.returnDate)}</span>;
  const d = daysBetween(todayISO(), loan.dueDate);
  if (d < 0) return <span className="text-danger fw-600">Overdue by {-d} day{d < -1 ? 's' : ''}</span>;
  if (d <= 2) return <span className="text-warning-emphasis fw-600">Due {d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}</span>;
  return <span>Due {fmtDate(loan.dueDate)}</span>;
}

export function Initials({ name, size = '', variant = '' }) {
  const parts = (name || '?').replace(/^(Dr\.|Prof\.)\s*/, '').split(/\s+/).filter((p) => !/^[A-Z]\.$/.test(p));
  const ini = ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
  return <span className={`avatar ${size} ${variant}`}>{ini}</span>;
}

export function EmptyState({ icon = 'inbox', title, children }) {
  return (
    <div className="text-center text-muted py-5 px-3">
      <i className={`bi bi-${icon} d-block mb-2`} style={{ fontSize: '2rem', opacity: 0.5 }} />
      <div className="fw-600 text-body mb-1">{title}</div>
      {children && <div className="small">{children}</div>}
    </div>
  );
}

export function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const items = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, from + 4);
  for (let p = from; p <= to; p++) items.push(<Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>{p}</Pagination.Item>);
  return (
    <Pagination size="sm" className="mb-0 justify-content-center">
      <Pagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
      {items}
      <Pagination.Next disabled={page === pages} onClick={() => onChange(page + 1)} />
    </Pagination>
  );
}

export function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}
