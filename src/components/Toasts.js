import React, { createContext, useCallback, useContext, useState } from 'react';
import { Toast } from 'react-bootstrap';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const notify = useCallback((res, fallback) => {
    if (!res) return res;
    const id = Math.random().toString(36).slice(2);
    const item = { id, ok: res.ok !== false, text: res.message || fallback || (res.ok === false ? 'Something went wrong.' : 'Done.') };
    setItems((xs) => [...xs.slice(-2), item]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), res.ok === false ? 6000 : 4500);
    return res;
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <Toast key={t.id} className="mb-2 border-0 shadow" onClose={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
            <Toast.Body className={`d-flex gap-2 align-items-start ${t.ok ? '' : 'text-danger'}`}>
              <i className={`bi ${t.ok ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill'} mt-1`} />
              <span className="flex-grow-1">{t.text}</span>
              <button type="button" className="btn-close btn-sm" aria-label="Close" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))} />
            </Toast.Body>
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
