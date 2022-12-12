import React, { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { SECTIONS, SUBJECTS } from '../../data/books';

const empty = {
  title: '', authors: '', publisher: '', year: new Date().getFullYear(), edition: '1st', isbn: '', subject: 'Computer Science', category: 'Textbook', callNo: '', tags: '', pages: 300, language: 'English', description: '',
  location: { floor: SECTIONS['Computer Science'].floor, section: SECTIONS['Computer Science'].name, rack: 'C-01', shelf: 1 }, copies: 3, referenceCopy: true,
};

export default function BookForm({ show, onHide, book }) {
  const { actions, db } = useLibrary();
  const notify = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState(empty);
  useEffect(() => {
    if (show) setF(book ? { ...book, tags: book.tags.join(', '), location: { ...book.location } } : empty);
  }, [show, book]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setLoc = (k) => (e) => setF((x) => ({ ...x, location: { ...x.location, [k]: e.target.value } }));
  const setSubject = (e) => {
    const subject = e.target.value;
    const sec = SECTIONS[subject];
    const racks = db.books.filter((b) => b.subject === subject).map((b) => b.location.rack).sort();
    setF((x) => ({ ...x, subject, location: { ...x.location, floor: sec.floor, section: sec.name, rack: racks[racks.length - 1] || `${sec.prefix}-01` } }));
  };

  const submit = (e) => {
    e.preventDefault();
    const res = notify(actions.saveBook({ ...f, id: book?.id }));
    if (res.ok) {
      onHide();
      if (!book && res.id) navigate(`/admin/book/${res.id}`);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Form onSubmit={submit}>
        <Modal.Header closeButton><Modal.Title as="h5">{book ? 'Edit book details' : 'Add a new title'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="small-caps mb-2">Bibliographic details</div>
          <Row className="g-3 mb-4">
            <Col md={8}><Form.Label>Title *</Form.Label><Form.Control value={f.title} onChange={set('title')} required /></Col>
            <Col md={4}><Form.Label>ISBN</Form.Label><Form.Control value={f.isbn} onChange={set('isbn')} placeholder="978..." /></Col>
            <Col md={8}><Form.Label>Author(s) *</Form.Label><Form.Control value={f.authors} onChange={set('authors')} placeholder="Separate with commas" required /></Col>
            <Col md={4}><Form.Label>Publisher</Form.Label><Form.Control value={f.publisher} onChange={set('publisher')} /></Col>
            <Col xs={4} md={2}><Form.Label>Year</Form.Label><Form.Control type="number" value={f.year} onChange={set('year')} /></Col>
            <Col xs={4} md={2}><Form.Label>Edition</Form.Label><Form.Control value={f.edition} onChange={set('edition')} /></Col>
            <Col xs={4} md={2}><Form.Label>Pages</Form.Label><Form.Control type="number" value={f.pages} onChange={set('pages')} /></Col>
            <Col md={3}>
              <Form.Label>Subject</Form.Label>
              <Form.Select value={f.subject} onChange={setSubject}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Type</Form.Label>
              <Form.Select value={f.category} onChange={set('category')}><option>Textbook</option><option>Reference</option><option>General</option></Form.Select>
            </Col>
            <Col md={4}><Form.Label>Call number (DDC)</Form.Label><Form.Control value={f.callNo} onChange={set('callNo')} placeholder="e.g. 006.31 GER" /></Col>
            <Col md={8}><Form.Label>Keywords</Form.Label><Form.Control value={f.tags} onChange={set('tags')} placeholder="machine learning, python, ..." /><Form.Text>Used by search and by the recommendation engine.</Form.Text></Col>
            <Col xs={12}><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={f.description} onChange={set('description')} /></Col>
          </Row>
          <div className="small-caps mb-2">Shelf location</div>
          <Row className="g-3 mb-4">
            <Col md={3}><Form.Label>Floor</Form.Label><Form.Select value={f.location.floor} onChange={setLoc('floor')}><option>Ground Floor</option><option>First Floor</option><option>Second Floor</option></Form.Select></Col>
            <Col md={4}><Form.Label>Section</Form.Label><Form.Control value={f.location.section} onChange={setLoc('section')} /></Col>
            <Col xs={6} md={3}><Form.Label>Rack no.</Form.Label><Form.Control value={f.location.rack} onChange={setLoc('rack')} required /></Col>
            <Col xs={6} md={2}><Form.Label>Shelf</Form.Label><Form.Control type="number" min={1} max={6} value={f.location.shelf} onChange={setLoc('shelf')} /></Col>
          </Row>
          {!book && (
            <>
              <div className="small-caps mb-2">Stock</div>
              <Row className="g-3 align-items-end">
                <Col xs={6} md={3}><Form.Label>Number of copies</Form.Label><Form.Control type="number" min={1} max={50} value={f.copies} onChange={set('copies')} /></Col>
                <Col md={9}><Form.Check id="refcopy" label="Keep one copy as reference (in-library use only)" checked={f.referenceCopy} onChange={set('referenceCopy')} /></Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Cancel</Button>
          <Button type="submit">{book ? 'Save changes' : 'Add to catalogue'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
