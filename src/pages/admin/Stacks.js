import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Nav, Row, Table } from 'react-bootstrap';
import { useLibrary } from '../../store/LibraryContext';
import { BookCover, PageHeader, StockPill } from '../../components/common';
import { FLOORS, racksByFloor } from '../../components/RackLocator';
import { SECTIONS } from '../../data/books';

export default function Stacks() {
  const { db, stock } = useLibrary();
  const floors = racksByFloor(db.books);
  const [floor, setFloor] = useState('First Floor');
  const [rack, setRack] = useState(floors['First Floor'][0]?.rack);
  const racks = floors[floor] || [];
  const current = racks.find((r) => r.rack === rack) || racks[0];
  const copiesOn = (r) => r.books.reduce((s, b) => s + stock.get(b.id).total, 0);
  const sectionColor = (name) => Object.values(SECTIONS).find((s) => s.name === name)?.color;

  return (
    <>
      <PageHeader title="Stack Map" subtitle="Racks are arranged by section and call number. Select a rack to see what is shelved on it." />
      <Nav variant="pills" activeKey={floor} className="mb-3 gap-1">
        {FLOORS.map((f) => (
          <Nav.Item key={f}>
            <Nav.Link eventKey={f} onClick={() => { setFloor(f); setRack(floors[f][0]?.rack); }}>{f} <span className="opacity-75 small">({floors[f].length} racks)</span></Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <Row className="g-3">
        <Col lg={5}>
          <Card className="mb-3">
            <Card.Header><span>{floor}</span><span className="small text-muted fw-normal">{racks.reduce((s, r) => s + r.books.length, 0)} titles</span></Card.Header>
            <Card.Body>
              {[...new Set(racks.map((r) => r.section))].map((sec) => (
                <div key={sec} className="mb-3">
                  <div className="small fw-600 mb-2" style={{ color: sectionColor(sec) }}><i className="bi bi-square-fill me-1" />{sec}</div>
                  <div className="floor-map">
                    {racks.filter((r) => r.section === sec).map((r) => (
                      <button type="button" key={r.rack} className={`rack-cell clickable ${current?.rack === r.rack ? 'active' : ''}`} onClick={() => setRack(r.rack)}>
                        <div className="rack-no">{r.rack}</div>
                        <div className="text-muted" style={{ fontSize: '0.68rem' }}>{r.books.length} titles · {copiesOn(r)} copies</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          {current && (
            <Card>
              <Card.Header>
                <span><i className="bi bi-bookshelf me-2 text-primary" />Rack {current.rack}</span>
                <span className="small text-muted fw-normal">{current.section} · {floor}</span>
              </Card.Header>
              <div className="table-responsive">
                <Table hover>
                  <thead><tr><th>Shelf</th><th>Title</th><th>Call no.</th><th>Stock</th></tr></thead>
                  <tbody>
                    {[...current.books].sort((a, b) => a.location.shelf - b.location.shelf).map((b) => (
                      <tr key={b.id}>
                        <td className="fw-bold text-center" style={{ width: 60 }}>{b.location.shelf}</td>
                        <td>
                          <div className="d-flex gap-2 align-items-center">
                            <BookCover book={b} size="xs" />
                            <div><Link to={`/admin/book/${b.id}`} className="fw-600 text-body">{b.title}</Link><div className="small text-muted">{b.authors.split(',')[0]}</div></div>
                          </div>
                        </td>
                        <td className="mono small text-nowrap">{b.callNo}</td>
                        <td><StockPill stock={stock.get(b.id)} /><div className="small text-muted mt-1">{stock.get(b.id).total} copies</div></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
