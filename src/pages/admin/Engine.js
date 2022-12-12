import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonGroup, Card, Col, Form, ProgressBar, Row, Table } from 'react-bootstrap';
import { Bar, Line } from 'react-chartjs-2';
import { useLibrary } from '../../store/LibraryContext';
import { useToast } from '../../components/Toasts';
import { PageHeader, StatCard } from '../../components/common';
import { ScoreBar } from '../../components/BookCard';
import { COMPONENT_INFO, COMPONENTS, DEFAULT_WEIGHTS, recommend, similarStudents } from '../../services/recommender/engine';
import { FEATURE_LABELS, FEATURE_WEIGHTS } from '../../services/recommender/similarity';

const METHOD_LABEL = { popularity: 'Popularity baseline', ...Object.fromEntries(COMPONENTS.map((c) => [c, COMPONENT_INFO[c].label])), hybrid: 'Hybrid (default weights)' };
const pct = (x) => `${(x * 100).toFixed(1)}%`;

function heatColor(v) {
  const a = Math.max(0, Math.min(1, v));
  return `rgba(166, 25, 46, ${0.06 + a * 0.85})`;
}

export default function Engine() {
  const { db, rec, retrain, stock } = useLibrary();
  const notify = useToast();
  const [matrix, setMatrix] = useState('H');
  const [sid, setSid] = useState(db.students[0].id);
  const { model, evaluation } = rec;
  const results = { ...evaluation.results, tuned: evaluation.tuned.metrics };
  const methods = [...Object.keys(evaluation.results), 'tuned'];

  const evalChart = {
    labels: methods.map((m) => (m === 'tuned' ? 'Hybrid (tuned)' : METHOD_LABEL[m])),
    datasets: [
      { label: 'HitRate@10', data: methods.map((m) => results[m].hr10 * 100), backgroundColor: methods.map((m) => (m === 'tuned' ? '#a6192e' : m === 'hybrid' ? '#d46a7a' : '#c7ccd1')) },
      { label: 'NDCG@10', data: methods.map((m) => results[m].ndcg10 * 100), backgroundColor: methods.map((m) => (m === 'tuned' ? '#5d0d19' : m === 'hybrid' ? '#a6192e99' : '#8d959c')) },
    ],
  };
  const lossChart = {
    labels: model.stats.bprLoss.map((l) => l.epoch),
    datasets: [{ label: 'BPR loss', data: model.stats.bprLoss.map((l) => l.loss), borderColor: '#6b3fa0', backgroundColor: 'rgba(107,63,160,0.08)', fill: true, tension: 0.3, pointRadius: 2 }],
  };

  const recs = useMemo(() => recommend(model, sid, { limit: 8 }), [model, sid]);
  const peers = useMemo(() => similarStudents(model, sid, 5), [model, sid]);
  const M = model[matrix];
  const short = (s) => s.name.split(' ').map((p) => p[0]).join('');

  return (
    <>
      <PageHeader title="Recommendation Engine" subtitle="Hybrid recommender: collaborative filtering, matrix factorisation, content and syllabus signals. It retrains automatically whenever loans, members, books or the timetable change.">
        <Button onClick={() => { retrain(); notify({ ok: true, message: 'Model retrained on the latest data.' }); }}><i className="bi bi-arrow-repeat me-1" />Retrain now</Button>
      </PageHeader>

      <Row className="g-3 mb-3">
        <Col xs={6} xl={2}><StatCard icon="clock" tone="grey" label="Last trained" value={new Date(rec.trainedAt).toTimeString().slice(0, 5)} hint={`${rec.durationMs} ms`} /></Col>
        <Col xs={6} xl={2}><StatCard icon="people" tone="blue" label={`students · ${model.stats.books} titles`} value={model.stats.students} /></Col>
        <Col xs={6} xl={2}><StatCard icon="arrow-left-right" tone="purple" label="Borrow events" value={model.stats.interactions} hint={`${model.stats.pairs} unique pairs`} /></Col>
        <Col xs={6} xl={2}><StatCard icon="grid-3x3" tone="amber" label="Matrix density" value={pct(model.stats.density)} hint="pairs observed" /></Col>
        <Col xs={6} xl={2}><StatCard icon="fonts" tone="green" label="Vocabulary" value={model.stats.vocabulary} hint="TF-IDF terms" /></Col>
        <Col xs={6} xl={2}><StatCard icon="collection" tone="red" label="Coverage" value={pct(rec.coverage)} hint="of titles in top-10s" /></Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col xl={7}>
          <Card className="h-100">
            <Card.Header><span>Offline evaluation (leave-last-out)</span><span className="small text-muted fw-normal">{evaluation.holdouts} students · last borrowed title hidden</span></Card.Header>
            <div className="table-responsive">
              <Table size="sm" hover>
                <thead><tr><th className="ps-3">Model</th><th>HR@5</th><th>HR@10</th><th>NDCG@10</th><th>MRR</th></tr></thead>
                <tbody>
                  {methods.map((m) => (
                    <tr key={m} className={m === 'tuned' ? 'fw-600' : ''} style={m === 'tuned' ? { background: '#fbeef0' } : undefined}>
                      <td className="ps-3">{m === 'tuned' ? 'Hybrid (tuned weights, in use)' : METHOD_LABEL[m]}</td>
                      <td>{pct(results[m].hr5)}</td>
                      <td>{pct(results[m].hr10)}</td>
                      <td>{pct(results[m].ndcg10)}</td>
                      <td>{results[m].mrr.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <Card.Body style={{ height: 240 }}>
              <Bar data={evalChart} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end' } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` }, grid: { color: '#f0f1f3' } }, x: { grid: { display: false }, ticks: { autoSkip: false, maxRotation: 30, minRotation: 0 } } } }} />
            </Card.Body>
          </Card>
        </Col>
        <Col xl={5}>
          <Card className="mb-3">
            <Card.Header><span>Blend weights</span><span className="small text-muted fw-normal">random search, {evaluation.tuned.trials} trials</span></Card.Header>
            <Card.Body>
              {COMPONENTS.map((c) => (
                <div key={c} className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span><span className="legend-dot" style={{ background: COMPONENT_INFO[c].color }} />{COMPONENT_INFO[c].label}</span>
                    <span><strong>{Math.round(rec.weights[c] * 100)}%</strong> <span className="text-muted">(default {Math.round(DEFAULT_WEIGHTS[c] * 100)}%)</span></span>
                  </div>
                  <ProgressBar now={rec.weights[c] * 100} style={{ height: 6 }} variant="primary" />
                </div>
              ))}
              <div className="small text-muted mt-2">The syllabus weight has a 15% floor so prescribed textbooks always count. A small popularity prior (3%) breaks ties.</div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header><span>BPR matrix factorisation</span><span className="small text-muted fw-normal">16 factors · SGD</span></Card.Header>
            <Card.Body style={{ height: 170 }}>
              <Line data={lossChart} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'epoch' }, grid: { display: false } }, y: { grid: { color: '#f0f1f3' } } } }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col xl={8}>
          <Card className="h-100">
            <Card.Header className="flex-wrap">
              <span>Student similarity matrix</span>
              <ButtonGroup size="sm">
                <Button variant={matrix === 'P' ? 'primary' : 'outline-secondary'} onClick={() => setMatrix('P')}>Profile</Button>
                <Button variant={matrix === 'B' ? 'primary' : 'outline-secondary'} onClick={() => setMatrix('B')}>Borrowing</Button>
                <Button variant={matrix === 'H' ? 'primary' : 'outline-secondary'} onClick={() => setMatrix('H')}>Hybrid</Button>
              </ButtonGroup>
            </Card.Header>
            <div className="table-responsive p-2">
              <table className="table table-sm table-borderless mb-0" style={{ fontSize: '0.7rem' }}>
                <thead>
                  <tr><th />{model.students.map((s) => <th key={s.id} className="heat-cell" title={s.name}>{short(s)}</th>)}</tr>
                </thead>
                <tbody>
                  {model.students.map((s, a) => (
                    <tr key={s.id}>
                      <th className="text-nowrap pe-2" style={{ fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0, background: 'transparent' }}>
                        <button type="button" className={`btn btn-link p-0 small ${sid === s.id ? 'fw-bold' : ''}`} style={{ fontSize: '0.7rem' }} onClick={() => setSid(s.id)}>{s.name}</button>
                        <span className="text-muted"> {s.program}{s.semester}</span>
                      </th>
                      {model.students.map((t, b) => (
                        <td key={t.id} className="heat-cell" style={{ background: a === b ? '#eef0f2' : heatColor(M[a][b]), color: M[a][b] > 0.55 && a !== b ? '#fff' : '#333' }} title={`${s.name} / ${t.name}: ${M[a][b].toFixed(2)}`}>
                          {a === b ? '' : Math.round(M[a][b] * 100)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Card.Body className="pt-0 small text-muted">
              {matrix === 'P' && 'Gower similarity over mixed attributes: categorical (programme, school, gender), numeric (semester, age, CGPA) and set-valued (electives, courses, interests) features.'}
              {matrix === 'B' && 'Cosine similarity of implicit-feedback vectors (borrows weighted by renewals, ratings and recency). The new first-semester student has no history.'}
              {matrix === 'H' && 'Profile and borrowing similarity blended with a shrinkage factor n/(n+4): students with little history rely more on their profile.'}
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="h-100">
            <Card.Header><span>Profile feature weights</span></Card.Header>
            <Table size="sm" className="mb-0">
              <tbody>
                {Object.entries(FEATURE_WEIGHTS).sort((a, b) => b[1] - a[1]).map(([k, w]) => (
                  <tr key={k}>
                    <td className="ps-3 small">{FEATURE_LABELS[k]}</td>
                    <td style={{ width: '45%' }}><ProgressBar now={(w / 3) * 100} style={{ height: 6, marginTop: 6 }} /></td>
                    <td className="small text-end pe-3">{w}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="flex-wrap">
          <span>Inspect a student</span>
          <Form.Select size="sm" value={sid} onChange={(e) => setSid(e.target.value)} style={{ maxWidth: 320 }}>
            {db.students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.program} Sem {s.semester}</option>)}
          </Form.Select>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            <Col lg={5}>
              <div className="small-caps mb-2">Nearest neighbours</div>
              <Table size="sm">
                <thead><tr><th>Student</th><th>Profile</th><th>Borrow</th><th>Hybrid</th></tr></thead>
                <tbody>
                  {peers.map((p) => (
                    <tr key={p.student.id}>
                      <td className="small"><Link to={`/admin/members/${p.student.id}`}>{p.student.name}</Link><div className="text-muted">{p.shared.slice(0, 2).join(' · ')}</div></td>
                      <td className="small">{p.profileSim.toFixed(2)}</td>
                      <td className="small">{p.behaviourSim.toFixed(2)}</td>
                      <td className="small fw-600">{p.sim.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
            <Col lg={7}>
              <div className="small-caps mb-2">Top recommendations and score breakdown</div>
              <div className="table-responsive">
                <Table size="sm">
                  <thead><tr><th>#</th><th>Title</th><th style={{ width: 160 }}>Signals</th><th>Score</th></tr></thead>
                  <tbody>
                    {recs.map((r, i) => (
                      <tr key={r.book.id}>
                        <td className="small">{i + 1}</td>
                        <td className="small"><Link to={`/admin/book/${r.book.id}`}>{r.book.title}</Link><div className="text-muted">{r.reasons[0]?.text} · {stock.get(r.book.id).available} on shelf</div></td>
                        <td><ScoreBar parts={r.parts} /><div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.65rem' }}>{COMPONENTS.map((c) => <span key={c} title={COMPONENT_INFO[c].label}>{(r.parts[c] * 100).toFixed(0)}</span>)}</div></td>
                        <td className="small fw-600">{r.score.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  );
}
