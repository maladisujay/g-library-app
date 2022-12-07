import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import { BookCover, RackTag, StockPill } from './common';
import { COMPONENT_INFO, COMPONENTS } from '../services/recommender/engine';

export function BookCard({ book, stock, base = '/student', footer }) {
  return (
    <Card className="book-card">
      <Card.Body className="d-flex gap-3">
        <Link to={`${base}/book/${book.id}`}><BookCover book={book} size="sm" /></Link>
        <div className="min-w-0 flex-grow-1" style={{ minWidth: 0 }}>
          <Link to={`${base}/book/${book.id}`} className="book-title">{book.title}</Link>
          <div className="book-author mb-2">{book.authors}</div>
          <div className="d-flex flex-wrap gap-1 mb-1"><StockPill stock={stock} /></div>
          <RackTag location={book.location} />
          {footer}
        </div>
      </Card.Body>
    </Card>
  );
}

export function ScoreBar({ parts, total }) {
  const sum = total || COMPONENTS.reduce((s, c) => s + (parts[c] || 0), 0) || 1;
  return (
    <div className="score-bar" title={COMPONENTS.map((c) => `${COMPONENT_INFO[c].label}: ${Math.round(((parts[c] || 0) / sum) * 100)}%`).join('\n')}>
      {COMPONENTS.map((c) => <span key={c} style={{ width: `${((parts[c] || 0) / sum) * 100}%`, background: COMPONENT_INFO[c].color }} />)}
    </div>
  );
}

const REASON_ICON = { academic: 'mortarboard', userKNN: 'people', itemCF: 'link-45deg', content: 'tags', bpr: 'diagram-3' };

export function RecCard({ rec, stock, base = '/student', compact = false }) {
  const { book } = rec;
  return (
    <Card className="book-card rec-card">
      <Card.Body className="d-flex gap-3">
        <Link to={`${base}/book/${book.id}`}><BookCover book={book} size={compact ? 'sm' : 'md'} /></Link>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex justify-content-between gap-2 align-items-start">
            <Link to={`${base}/book/${book.id}`} className="book-title">{book.title}</Link>
            <span className="match text-nowrap">{rec.match}%</span>
          </div>
          <div className="book-author mb-2">{book.authors}</div>
          <div className="d-flex flex-wrap gap-1 mb-2">
            <StockPill stock={stock} />
            <RackTag location={book.location} />
          </div>
          {!compact && (
            <>
              <ScoreBar parts={rec.parts} />
              <ul className="reasons">
                {rec.reasons.slice(0, 2).map((r) => (
                  <li key={r.text}><i className={`bi bi-${REASON_ICON[r.type]}`} style={{ color: COMPONENT_INFO[r.type].color }} /><span>{r.text}</span></li>
                ))}
              </ul>
            </>
          )}
          {compact && rec.reasons[0] && <div className="small text-muted text-truncate"><i className={`bi bi-${REASON_ICON[rec.reasons[0].type]} me-1`} />{rec.reasons[0].text}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}
