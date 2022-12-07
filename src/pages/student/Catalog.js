import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, ButtonGroup, Card, Col, Form, InputGroup, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { BookCard } from '../../components/BookCard';
import { BookCover, EmptyState, PageHeader, Pager, RackTag, StockPill } from '../../components/common';
import { SECTIONS, SUBJECTS } from '../../data/books';

const PAGE = 12;

export function useCatalogSearch(books, stock, loans) {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [subject, setSubject] = useState(params.get('subject') || '');
  const [category, setCategory] = useState('');
  const [floor, setFloor] = useState('');
  const [avail, setAvail] = useState(false);
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);

  const borrowCount = useMemo(() => {
    const m = new Map();
    loans.forEach((l) => m.set(l.bookId, (m.get(l.bookId) || 0) + 1));
    return m;
  }, [loans]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let list = books.map((b) => {
      if (!terms.length) return [b, 0];
      const hay = {
        title: b.title.toLowerCase(),
        authors: b.authors.toLowerCase(),
        other: `${b.isbn} ${b.callNo} ${b.subject} ${b.tags.join(' ')} ${b.publisher} ${b.location.rack}`.toLowerCase(),
      };
      let score = 0;
      for (const t of terms) {
        const s = (hay.title.includes(t) ? 3 : 0) + (hay.authors.includes(t) ? 2 : 0) + (hay.other.includes(t) ? 1 : 0);
        if (!s) return [b, -1];
        score += s;
      }
      return [b, score];
    }).filter(([, s]) => s >= 0);
    if (subject) list = list.filter(([b]) => b.subject === subject);
    if (category) list = list.filter(([b]) => b.category === category);
    if (floor) list = list.filter(([b]) => b.location.floor === floor);
    if (avail) list = list.filter(([b]) => (stock.get(b.id)?.available || 0) > 0);
    const by = {
      relevance: (a, b) => b[1] - a[1] || a[0].title.localeCompare(b[0].title),
      title: (a, b) => a[0].title.localeCompare(b[0].title),
      newest: (a, b) => (b[0].year || 0) - (a[0].year || 0),
      popular: (a, b) => (borrowCount.get(b[0].id) || 0) - (borrowCount.get(a[0].id) || 0),
      rack: (a, b) => a[0].location.rack.localeCompare(b[0].location.rack) || a[0].location.shelf - b[0].location.shelf,
    };
    return list.sort(by[sort]).map(([b]) => b);
  }, [books, q, subject, category, floor, avail, sort, stock, borrowCount]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE));
  const cur = Math.min(page, pages);
  const set = (fn) => (v) => { fn(v); setPage(1); };
  return {
    q, setQ: (v) => { setQ(v); setPage(1); setParams(v ? { q: v } : {}, { replace: true }); },
    subject, setSubject: set(setSubject), category, setCategory: set(setCategory), floor, setFloor: set(setFloor),
    avail, setAvail: set(setAvail), sort, setSort, page: cur, setPage, pages, results,
    pageItems: results.slice((cur - 1) * PAGE, cur * PAGE),
    reset: () => { setQ(''); setSubject(''); setCategory(''); setFloor(''); setAvail(false); setPage(1); setParams({}, { replace: true }); },
  };
}

export function CatalogFilters({ s }) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Row className="g-2">
          <Col lg={5}>
            <InputGroup>
              <InputGroup.Text className="bg-white"><i className="bi bi-search" /></InputGroup.Text>
              <Form.Control value={s.q} onChange={(e) => s.setQ(e.target.value)} placeholder="Title, author, ISBN, subject or keyword" aria-label="Search" />
            </InputGroup>
          </Col>
          <Col xs={6} lg={2}>
            <Form.Select value={s.subject} onChange={(e) => s.setSubject(e.target.value)} aria-label="Subject">
              <option value="">All subjects</option>
              {SUBJECTS.map((x) => <option key={x}>{x}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} lg={2}>
            <Form.Select value={s.category} onChange={(e) => s.setCategory(e.target.value)} aria-label="Type">
              <option value="">All types</option>
              <option>Textbook</option>
              <option>Reference</option>
              <option>General</option>
            </Form.Select>
          </Col>
          <Col xs={6} lg={2}>
            <Form.Select value={s.floor} onChange={(e) => s.setFloor(e.target.value)} aria-label="Floor">
              <option value="">All floors</option>
              <option>Ground Floor</option>
              <option>First Floor</option>
              <option>Second Floor</option>
            </Form.Select>
          </Col>
          <Col xs={6} lg={1} className="d-flex align-items-center">
            <Button variant="link" className="p-0 small text-decoration-none" onClick={s.reset}>Clear</Button>
          </Col>
        </Row>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
          <Form.Check type="switch" id="avail" label="Available on shelf only" checked={s.avail} onChange={(e) => s.setAvail(e.target.checked)} />
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Sort</span>
            <Form.Select size="sm" value={s.sort} onChange={(e) => s.setSort(e.target.value)} style={{ width: 170 }} aria-label="Sort">
              <option value="relevance">Relevance</option>
              <option value="title">Title A-Z</option>
              <option value="newest">Newest edition</option>
              <option value="popular">Most borrowed</option>
              <option value="rack">Rack order</option>
            </Form.Select>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function Catalog() {
  const { db, stock } = useLibrary();
  const s = useCatalogSearch(db.books, stock, db.loans);
  const [view, setView] = useState(window.innerWidth < 768 ? 'grid' : 'list');

  return (
    <>
      <PageHeader title="Search Catalogue" subtitle={`${db.books.length} titles · ${db.copies.length} copies · 3 floors`}>
        <ButtonGroup size="sm">
          <Button variant={view === 'list' ? 'primary' : 'outline-secondary'} onClick={() => setView('list')} aria-label="List view"><i className="bi bi-list-ul" /></Button>
          <Button variant={view === 'grid' ? 'primary' : 'outline-secondary'} onClick={() => setView('grid')} aria-label="Grid view"><i className="bi bi-grid" /></Button>
        </ButtonGroup>
      </PageHeader>
      <CatalogFilters s={s} />
      <div className="small text-muted mb-2">{s.results.length} result{s.results.length === 1 ? '' : 's'}</div>
      {!s.results.length && <Card><EmptyState icon="search" title="No books match your search">Try a different keyword or clear the filters.</EmptyState></Card>}
      {view === 'grid' ? (
        <Row className="g-3 mb-3">
          {s.pageItems.map((b) => <Col md={6} xl={4} key={b.id}><BookCard book={b} stock={stock.get(b.id)} /></Col>)}
        </Row>
      ) : s.results.length > 0 && (
        <Card className="mb-3">
          <div className="table-responsive">
            <Table hover>
              <thead><tr><th>Title</th><th>Call no.</th><th>Location</th><th>Availability</th></tr></thead>
              <tbody>
                {s.pageItems.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        <BookCover book={b} size="xs" />
                        <div>
                          <Link to={`/student/book/${b.id}`} className="fw-600 text-body">{b.title}</Link>
                          <div className="small text-muted">{b.authors} · {b.edition} ed. · {b.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono small text-nowrap">{b.callNo}</td>
                    <td>
                      <RackTag location={b.location} />
                      <div className="small text-muted mt-1" style={{ color: SECTIONS[b.subject]?.color }}>{b.location.floor} · {b.location.section}</div>
                    </td>
                    <td><StockPill stock={stock.get(b.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
      <Pager page={s.page} pages={s.pages} onChange={s.setPage} />
    </>
  );
}
