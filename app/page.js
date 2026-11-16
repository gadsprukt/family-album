'use client';

import { useRef, useState } from 'react';
import Gate from './components/Gate';

function AddMemoryForm() {
  const fileInputRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [personName, setPersonName] = useState('');

  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      alert('לא הצלחתי לגשת למיקרופון. בדקי את ההרשאות בטלפון.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function resetForm() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPersonName('');
    setAudioBlob(null);
    setAudioUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit() {
    if (!photoFile) {
      alert('בחרי תמונה קודם');
      return;
    }
    setSubmitting(true);
    setResult(null);

    try {
      const code = window.localStorage.getItem('family-album-code-upload') || '';
      const form = new FormData();
      form.append('photo', photoFile);
      if (audioBlob) form.append('audio', audioBlob, 'note.webm');
      form.append('personName', personName);

      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'x-access-code': code },
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, message: data.error || 'הייתה תקלה, נסי שוב' });
      } else {
        setResult({ ok: true, message: 'התמונה והזכרון נשלחו! האנימציה בדרך, זה יכול לקחת כמה דקות.' });
        resetForm();
      }
    } catch (err) {
      setResult({ ok: false, message: 'הייתה תקלה בחיבור, נסי שוב' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <h1>הוספת זכרון</h1>
      <p className="subtitle">תמונה אחת + סיפור קטן על מי שבתמונה</p>

      {result && (
        <div className={`status-banner ${result.ok ? 'status-success' : 'status-error'}`}>
          {result.message}
        </div>
      )}

      <div className="card">
        <label>תמונה</label>
        {photoPreview && <img className="photo-preview" src={photoPreview} alt="תצוגה מקדימה" />}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          style={{ marginBottom: 10 }}
        />
      </div>

      <div className="card">
        <label htmlFor="personName">מי זה בתמונה? (לא חובה)</label>
        <input
          id="personName"
          type="text"
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="לדוגמה: סבא משה"
        />
      </div>

      <div className="card">
        <label>ספרי לי קצת עליה או עליו</label>
        {!recording && !audioUrl && (
          <button className="btn-record" onClick={startRecording}>
            🎙️ התחילי הקלטה
          </button>
        )}
        {recording && (
          <button className="btn-record recording" onClick={stopRecording}>
            ⏹️ עצרי הקלטה
          </button>
        )}
        {audioUrl && !recording && (
          <>
            <audio className="audio-player" controls src={audioUrl} />
            <p className="hint">רוצה להקליט מחדש?</p>
            <button className="btn-secondary" onClick={startRecording}>
              🎙️ הקלטה חדשה
            </button>
          </>
        )}
      </div>

      <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
        {submitting ? 'שולח…' : 'שליחה לאלבום'}
      </button>

      <a className="nav-link" href="/album">
        לצפייה באלבום
      </a>
    </div>
  );
}

export default function AddMemoryPage() {
  return (
    <Gate purpose="upload" title="אלבום המשפחה">
      <AddMemoryForm />
    </Gate>
  );
}
