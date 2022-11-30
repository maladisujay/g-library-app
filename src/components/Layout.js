import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Dropdown, Offcanvas } from 'react-bootstrap';
import { useLibrary } from '../store/LibraryContext';
import { Initials } from './common';
import { academicYear, todayISO } from '../utils/dates';

const STUDENT_NAV = [
  { section: 'My Library' },
  { to: '/student', icon: 'grid-1x2', label: 'Dashboard', end: true },
  { to: '/student/catalog', icon: 'search', label: 'Search Catalogue' },
  { to: '/student/recommendations', icon: 'stars', label: 'Recommended for You' },
  { to: '/student/exams', icon: 'calendar2-check', label: 'Exam Preparation' },
  { to: '/student/my-books', icon: 'journal-bookmark', label: 'My Books', badge: 'loans' },
  { section: 'Account' },
  { to: '/student/profile', icon: 'person-badge', label: 'My Profile' },
];

const ADMIN_NAV = [
  { section: 'Overview' },
  { to: '/admin', icon: 'speedometer2', label: 'Dashboard', end: true },
  { section: 'Circulation' },
  { to: '/admin/circulation', icon: 'arrow-left-right', label: 'Issue / Return' },
  { to: '/admin/holds', icon: 'bookmark-star', label: 'Holds & Reservations', badge: 'holds' },
  { to: '/admin/fines', icon: 'cash-coin', label: 'Overdues & Fines', badge: 'overdue' },
  { section: 'Collection' },
  { to: '/admin/books', icon: 'book', label: 'Books & Stock' },
  { to: '/admin/stacks', icon: 'grid-3x3-gap', label: 'Stack Map (Racks)' },
  { to: '/admin/members', icon: 'people', label: 'Members' },
  { section: 'Academics & Insights' },
  { to: '/admin/academics', icon: 'mortarboard', label: 'Syllabus & Exams' },
  { to: '/admin/recommender', icon: 'cpu', label: 'Recommendation Engine' },
  { to: '/admin/settings', icon: 'gear', label: 'Rules & Notices' },
];

function NavList({ items, counts, onNavigate }) {
  return (
    <nav className="gl-nav">
      {items.map((it, i) => (it.section ? (
        <div key={`s${i}`} className="nav-section small-caps">{it.section}</div>
      ) : (
        <NavLink key={it.to} to={it.to} end={it.end} onClick={onNavigate}>
          <i className={`bi bi-${it.icon}`} />
          <span>{it.label}</span>
          {it.badge && counts[it.badge] > 0 && <span className="badge rounded-pill bg-primary">{counts[it.badge]}</span>}
        </NavLink>
      )))}
    </nav>
  );
}

export default function Layout({ role }) {
  const { user, logout, db } = useLibrary();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = role === 'librarian' ? ADMIN_NAV : STUDENT_NAV;
  const today = todayISO();
  const counts = role === 'librarian'
    ? {
      holds: db.holds.filter((h) => h.status === 'waiting' || h.status === 'ready').length,
      overdue: db.loans.filter((l) => !l.returnDate && l.dueDate < today).length,
    }
    : { loans: db.loans.filter((l) => l.studentId === user?.id && !l.returnDate).length };

  const doLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="gl-topbar d-flex align-items-center px-3 px-lg-4">
        <button type="button" className="btn btn-link p-0 me-3 d-lg-none" aria-label="Open menu" onClick={() => setOpen(true)}>
          <i className="bi bi-list" style={{ fontSize: '1.6rem' }} />
        </button>
        <div className="brand">
          <span className="brand-mark"><i className="bi bi-book-half" /></span>
          <span>G-Library<small>{role === 'librarian' ? 'Librarian Console' : 'Student Portal'}</small></span>
        </div>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="d-none d-md-inline small opacity-75"><i className="bi bi-geo-alt me-1" />Visakhapatnam Campus</span>
          <Dropdown align="end">
            <Dropdown.Toggle as="button" className="btn btn-link p-0 d-flex align-items-center gap-2 dropdown-toggle">
              <Initials name={user?.name} variant="on-red" />
              <span className="d-none d-sm-inline text-start lh-sm">
                <span className="d-block fw-600 small">{user?.name}</span>
                <span className="d-block opacity-75" style={{ fontSize: '0.72rem' }}>{role === 'librarian' ? user?.designation : user?.regNo}</span>
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {role === 'student' && <Dropdown.Item onClick={() => navigate('/student/profile')}><i className="bi bi-person me-2" />My profile</Dropdown.Item>}
              {role === 'librarian' && <Dropdown.Item onClick={() => navigate('/admin/settings')}><i className="bi bi-gear me-2" />Rules & notices</Dropdown.Item>}
              <Dropdown.Divider />
              <Dropdown.Item onClick={doLogout} className="text-danger"><i className="bi bi-box-arrow-right me-2" />Sign out</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>

      <aside className="gl-sidebar">
        <NavList items={items} counts={counts} />
      </aside>

      <Offcanvas show={open} onHide={() => setOpen(false)} style={{ width: 280 }}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold text-primary"><i className="bi bi-book-half me-2" />G-Library</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="pt-0">
          <NavList items={items} counts={counts} onNavigate={() => setOpen(false)} />
          <button type="button" className="btn btn-outline-secondary w-100 mt-3" onClick={doLogout}><i className="bi bi-box-arrow-right me-2" />Sign out</button>
        </Offcanvas.Body>
      </Offcanvas>

      <main className="gl-main">
        <Outlet />
        <div className="footer-note">G-Library · Library Management System · Academic Year {academicYear()}</div>
      </main>
    </>
  );
}
