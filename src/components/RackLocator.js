import React from 'react';
import { Col, Row } from 'react-bootstrap';

export const FLOORS = ['Ground Floor', 'First Floor', 'Second Floor'];

export function racksByFloor(books) {
  const map = {};
  FLOORS.forEach((f) => { map[f] = {}; });
  books.forEach((b) => {
    const f = map[b.location.floor] || (map[b.location.floor] = {});
    const r = f[b.location.rack] || (f[b.location.rack] = { rack: b.location.rack, section: b.location.section, books: [] });
    r.books.push(b);
  });
  Object.keys(map).forEach((f) => {
    map[f] = Object.values(map[f]).sort((a, b) => a.rack.localeCompare(b.rack));
  });
  return map;
}

// Shows a book's floor with all racks, the target rack highlighted, and the shelf position.
export default function RackLocator({ book, books }) {
  const floors = racksByFloor(books);
  const racks = floors[book.location.floor] || [];
  const shelves = Math.max(4, ...racks.find((r) => r.rack === book.location.rack)?.books.map((b) => b.location.shelf) || [4]);
  return (
    <Row className="g-3">
      <Col md={8}>
        <div className="small-caps mb-2">{book.location.floor} layout</div>
        <div className="floor-map">
          {racks.map((r) => (
            <div key={r.rack} className={`rack-cell ${r.rack === book.location.rack ? 'active' : ''}`}>
              <div className="rack-no">{r.rack}</div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>{r.section}</div>
            </div>
          ))}
        </div>
        <div className="small text-muted mt-2"><i className="bi bi-door-open me-1" />Entrance and issue counter are next to the stairs. Racks are arranged in call-number order.</div>
      </Col>
      <Col md={4}>
        <div className="small-caps mb-2">Rack {book.location.rack} shelves</div>
        <div className="shelf-stack">
          {Array.from({ length: shelves }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`shelf ${s === book.location.shelf ? 'active' : ''}`}>
              <span>Shelf {s}{s === 1 ? ' (top)' : ''}</span>
              {s === book.location.shelf && <i className="bi bi-arrow-left-short" />}
            </div>
          ))}
        </div>
      </Col>
    </Row>
  );
}
