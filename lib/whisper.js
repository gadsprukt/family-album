// Transcribes a Hebrew voice note using OpenAI's Whisper API.

export async function transcribeHebrewAudio(audioFilePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Add it to .env.local');
  }

  const fs = await import('fs');
  const audioBuffer = fs.readFileSync(audioFilePath);

  const form = new FormData();
  form.append('file', new Blob([audioBuffer]), 'note.webm');
  form.append('model', 'whisper-1');
  form.append('language', 'he'); // tell Whisper it's Hebrew up front

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Whisper transcription failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.text?.trim() || '';
}
