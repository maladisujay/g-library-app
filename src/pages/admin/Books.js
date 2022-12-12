import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Card, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { BookCover, EmptyState, PageHeader, Pager, RackTag } from '../../components/common';
import { CatalogFilters, useCatalogSearch } from '../student/Catalog';
import BookForm from './BookForm';

function downloadCsv(name, rows) {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Books() {
  const { db, stock } = useLibrary();
  const [params] = useSearchParams();
  const [adding, setAdding] = useState(params.get('new') === '1');
  const s = useCatalogSearch(db.books, stock, db.loans);
  const totals = [...stock.values()].reduce((a, x) => ({ total: a.total + x.total, available: a.available + x.available, issued: a.issued + x.issued }), { total: 0, available: 0, issued: 0 });

  const exportStock = () => downloadCsv('g-library-stock.csv', [
    ['Book ID', 'Title', 'Authors', 'ISBN', 'Call No', 'Subject', 'Floor', 'Rack', 'Shelf', 'Total', 'Lending', 'Reference', 'Available', 'Issued', 'On hold shelf', 'Lost/Damaged'],
    ...s.results.map((b) => {
      const x = stock.get(b.id);
      return [b.id, b.title, b.authors, b.isbn, b.callNo, b.subject, b.location.floor, b.location.rack, b.location.shelf, x.total, x.lending, x.reference, x.available, x.issued, x.held, x.unavailable];
    }),
  ]);

  return (
    <>
      <PageHeader title="Books & Stock" subtitle={`${db.books.length} titles · ${totals.total} copies · ${totals.available} on shelf · ${totals.issued} issued`}>
        <Button variant="outline-secondary" onClick={exportStock}><i className="bi bi-download me-1" />Export CSV</Button>
        <Button onClick={() => setAdding(true)}><i className="bi bi-plus-lg me-1" />Add book</Button>
      </PageHeader>
      <CatalogFilters s={s} />
      <Card className="mb-3">
        <div className="table-responsive">
          <Table hover>
            <thead>
              <tr><th>Title</th><th>Call no.</th><th>Location</th><th className="text-center">Total</th><th className="text-center">On shelf</th><th className="text-center">Issued</th><th className="text-center">Holds</th><th /></tr>
            </thead>
            <tbody>
              {s.pageItems.map((b) => {
                const x = stock.get(b.id);
                return (
                  <tr key={b.id}>
                    <td style={{ minWidth: 260 }}>
                      <div className="d-flex gap-2 align-items-center">
                        <BookCover book={b} size="xs" />
                        <div>
                          <Link to={`/admin/book/${b.id}`} className="fw-600 text-body">{b.title}</Link>
                          <div className="small text-muted">{b.id} · {b.authors.split(',')[0]} · {b.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono small text-nowrap">{b.callNo}</td>
                    <td><RackTag location={b.location} /><div className="small text-muted mt-1">{b.location.floor}</div></td>
                    <td className="text-center fw-600">{x.total}{x.reference > 0 && <div className="small text-muted fw-normal">{x.reference} ref</div>}</td>
                    <td className="text-center"><span className={`fw-600 ${x.available === 0 && x.lending ? 'text-danger' : 'text-success'}`}>{x.available}</span></td>
                    <td className="text-center">{x.issued}</td>
                    <td className="text-center">{x.holdsWaiting || '-'}</td>
                    <td className="text-end"><Link to={`/admin/book/${b.id}`} className="btn btn-sm btn-light border">Manage</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
        {!s.results.length && <EmptyState icon="search" title="No titles match" />}
      </Card>
      <Pager page={s.page} pages={s.pages} onChange={s.setPage} />
      <BookForm show={adding} onHide={() => setAdding(false)} />
    </>
  );
}
