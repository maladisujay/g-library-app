import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { useLibrary } from '../store/LibraryContext';

const FEATURES = [
  { icon: 'search', title: 'Online catalogue (OPAC)', text: 'Search every title with live stock, call number and the exact rack and shelf.' },
  { icon: 'stars', title: 'Personalised recommendations', text: 'Suggestions learned from students with a similar programme, semester, electives and reading history.' },
  { icon: 'calendar2-check', title: 'Exam-aware reading lists', text: 'Prescribed textbooks from your course syllabus, prioritised by upcoming exam dates.' },
  { icon: 'arrow-left-right', title: 'Circulation and holds', text: 'Issue, return, renew and reserve books with automatic fine calculation.' },
];

export default function Login() {
  const { login, user, role: current, db } = useLibrary();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={current === 'librarian' ? '/admin' : '/student'} replace />;

  const submit = (e) => {
    e.preventDefault();
    const res = login(role, id, password);
    if (!res.ok) setError(res.message);
    else navigate(role === 'librarian' ? '/admin' : '/student');
  };

  const fillDemo = (r, uid, pwd) => {
    setRole(r);
    setId(uid);
    setPassword(pwd);
    setError('');
  };

  const demoStudents = [db.students[0], db.students[8], db.students[12]];

  return (
    <div className="login-page">
      <section className="login-side">
        <div>
          <div className="d-flex align-items-center gap-2 mb-4">
            <span className="d-inline-flex align-items-center justify-content-center bg-white text-primary rounded-3" style={{ width: 44, height: 44, fontSize: '1.4rem' }}><i className="bi bi-book-half" /></span>
            <div>
              <div className="fw-bold fs-4 lh-1">G-Library</div>
              <div className="small opacity-75">Central Library · Visakhapatnam Campus</div>
            </div>
          </div>
          <h2 className="fw-bold mb-2 d-none d-lg-block" style={{ fontSize: '2rem', maxWidth: 460 }}>Your university library, one search away.</h2>
          <p className="opacity-75 d-none d-lg-block mb-5" style={{ maxWidth: 460 }}>{db.books.length} titles · {db.copies.length} copies across 3 floors · Open 8:00 AM to 8:00 PM</p>
          <div className="features d-none d-lg-block">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <i className={`bi bi-${f.icon}`} />
                <div>
                  <div className="fw-600">{f.title}</div>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="small opacity-75 d-none d-lg-block">© 2022 G-Library. For students and staff of the university.</div>
      </section>

      <section className="login-form-wrap">
        <div className="login-box">
          <h1 className="h3 fw-bold mb-1">Sign in</h1>
          <p className="text-muted mb-4">Use your university credentials to access the library.</p>
          <div className="role-switch mb-4" role="tablist">
            <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => { setRole('student'); setError(''); }}><i className="bi bi-mortarboard me-2" />Student</button>
            <button type="button" className={role === 'librarian' ? 'active' : ''} onClick={() => { setRole('librarian'); setError(''); }}><i className="bi bi-person-workspace me-2" />Librarian</button>
          </div>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Form onSubmit={submit}>
            <Form.Group className="mb-3" controlId="uid">
              <Form.Label>{role === 'student' ? 'Registration number' : 'Staff ID'}</Form.Label>
              <Form.Control size="lg" value={id} onChange={(e) => setId(e.target.value)} placeholder={role === 'student' ? 'e.g. 121910301012' : 'e.g. LIB001'} autoComplete="username" required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="pwd">
              <Form.Label>Password</Form.Label>
              <InputGroup size="lg">
                <Form.Control type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                <Button variant="outline-secondary" onClick={() => setShow((s) => !s)} aria-label="Show password"><i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} /></Button>
              </InputGroup>
            </Form.Group>
            <Button type="submit" size="lg" className="w-100 mb-3">Sign in</Button>
          </Form>
          <div className="demo-box">
            <div className="fw-600 mb-2"><i className="bi bi-info-circle me-1" />Demo accounts</div>
            {role === 'student' ? (
              <>
                {demoStudents.map((s) => (
                  <button key={s.id} type="button" className="btn btn-sm btn-light border w-100 text-start mb-1 d-flex justify-content-between" onClick={() => fillDemo('student', s.regNo, 'student123')}>
                    <span>{s.name}</span><span className="text-muted mono">{s.regNo}</span>
                  </button>
                ))}
                <div className="text-muted mt-1">Password for all 20 demo students: <span className="mono">student123</span></div>
              </>
            ) : (
              <>
                {db.librarians.map((l) => (
                  <button key={l.id} type="button" className="btn btn-sm btn-light border w-100 text-start mb-1 d-flex justify-content-between" onClick={() => fillDemo('librarian', l.id, 'admin123')}>
                    <span>{l.name}</span><span className="text-muted mono">{l.id}</span>
                  </button>
                ))}
                <div className="text-muted mt-1">Password: <span className="mono">admin123</span></div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
