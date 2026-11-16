'use client';

import { useEffect, useState } from 'react';

// Wraps a page and only shows it once the right code has been entered.
// The code is remembered in this browser so grandma only has to type it
// once (she'll usually just open the link from a saved bookmark anyway).
export default function Gate({ purpose, title, children }) {
  const storageKey = `family-album-code-${purpose}`;
  const [code, setCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      verify(saved, true);
    } else {
      setChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(value, silent) {
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value, purpose }),
      });
      const data = await res.json();
      if (data.ok) {
        window.localStorage.setItem(storageKey, value);
        setUnlocked(true);
      } else if (!silent) {
        setError('הקוד לא נכון, נסי שוב');
      }
    } catch (err) {
      if (!silent) setError('הייתה תקלה, נסי שוב');
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <div className="screen gate">
        <p>רק רגע…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="screen gate">
        <h1>{title}</h1>
        <div className="card">
          <label htmlFor="code">קוד כניסה</label>
          <input
            id="code"
            type="text"
            inputMode="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="הקלידי כאן"
          />
          {error && <p className="hint">{error}</p>}
          <div style={{ height: 12 }} />
          <button className="btn-primary" onClick={() => verify(code, false)}>
            כניסה
          </button>
        </div>
      </div>
    );
  }

  return children;
}
