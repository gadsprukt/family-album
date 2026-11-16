'use client';

import { useEffect, useState, useCallback } from 'react';
import Gate from '../components/Gate';

function getCode() {
  return window.localStorage.getItem('family-album-code-album') || '';
}

function MemoryCard({ memory, onUpdate }) {
  useEffect(() => {
    if (memory.clipStatus !== 'processing') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/memories/${memory.id}/clip`, {
          headers: { 'x-access-code': getCode() },
        });
        const data = await res.json();
        if (data.memory) onUpdate(data.memory);
      } catch (err) {
        // quietly retry next tick
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [memory.clipStatus, memory.id, onUpdate]);

  return (
    <div className="memory-card">
      {memory.clipStatus === 'ready' && memory.clipUrl ? (
        <video className="memory-media" src={memory.clipUrl} autoPlay loop muted playsInline />
      ) : (
        <img className="memory-media" src={memory.photoUrl} alt={memory.personName || 'זכרון משפחתי'} />
      )}
      <div className="memory-body">
        {memory.personName && <p className="memory-name">{memory.personName}</p>}
        {memory.transcript && <p className="memory-transcript">{memory.transcript}</p>}
        {memory.audioUrl && <audio className="audio-player" controls src={memory.audioUrl} />}
        {memory.clipStatus === 'processing' && (
          <p className="memory-status">✨ התמונה מקבלת חיים… זה יכול לקחת כמה דקות</p>
        )}
        {memory.clipStatus === 'failed' && (
          <p className="memory-status">לא הצלחנו להנפיש את התמונה הזו, אבל היא נשמרה.</p>
        )}
      </div>
    </div>
  );
}

function Album() {
  const [memories, setMemories] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/memories', {
        headers: { 'x-access-code': getCode() },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'הייתה תקלה');
        return;
      }
      setMemories(data.memories);
    } catch (err) {
      setError('הייתה תקלה בחיבור');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleUpdate(updated) {
    setMemories((prev) => (prev ? prev.map((m) => (m.id === updated.id ? updated : m)) : prev));
  }

  return (
    <div className="screen">
      <h1>אלבום המשפחה</h1>
      <p className="subtitle">הזכרונות שלנו, חיים מחדש</p>

      {error && <div className="status-banner status-error">{error}</div>}

      {memories === null && !error && <p className="hint">טוען…</p>}

      {memories && memories.length === 0 && (
        <p className="hint">עדיין אין זכרונות באלבום. אפשר להוסיף אחד!</p>
      )}

      {memories &&
        memories.map((m) => <MemoryCard key={m.id} memory={m} onUpdate={handleUpdate} />)}

      <a className="nav-link" href="/">
        להוספת זכרון חדש
      </a>
    </div>
  );
}

export default function AlbumPage() {
  return (
    <Gate purpose="album" title="אלבום המשפחה">
      <Album />
    </Gate>
  );
}
