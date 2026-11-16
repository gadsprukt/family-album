import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import { saveMemory, listMemories, updateMemory, DATA_DIR } from '@/lib/db';
import { transcribeHebrewAudio } from '@/lib/whisper';
import { startAnimation } from '@/lib/runway';
import { isValidCode } from '@/lib/auth';

// Uploaded files live under DATA_DIR (the persistent volume on a real
// host), not under /public — /public isn't writable at runtime on
// hosts that rebuild the container on every deploy. Files are served
// back out through /api/uploads/[filename].
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET(request) {
  const code = request.headers.get('x-access-code') || '';
  if (!isValidCode(code, 'ALBUM_ACCESS_CODE')) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 401 });
  }
  return NextResponse.json({ memories: listMemories() });
}

export async function POST(request) {
  const code = request.headers.get('x-access-code') || '';
  if (!isValidCode(code, 'UPLOAD_ACCESS_CODE')) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 401 });
  }

  ensureUploadDir();

  const form = await request.formData();
  const photo = form.get('photo');
  const audio = form.get('audio');
  const personName = (form.get('personName') || '').toString().trim();

  if (!photo) {
    return NextResponse.json({ error: 'חסרה תמונה' }, { status: 400 });
  }

  const id = nanoid(10);
  const photoExt = photo.name?.split('.').pop() || 'jpg';
  const photoFilename = `${id}-photo.${photoExt}`;
  const photoBuffer = Buffer.from(await photo.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, photoFilename), photoBuffer);

  let audioFilename = null;
  let transcript = '';
  if (audio) {
    audioFilename = `${id}-audio.webm`;
    const audioBuffer = Buffer.from(await audio.arrayBuffer());
    const audioPath = path.join(UPLOAD_DIR, audioFilename);
    fs.writeFileSync(audioPath, audioBuffer);

    try {
      transcript = await transcribeHebrewAudio(audioPath);
    } catch (err) {
      console.error('Transcription failed:', err);
      // Keep going — the photo and audio are still saved even if
      // transcription fails; the memory just won't have text yet.
    }
  }

  const memory = {
    id,
    personName,
    photoUrl: `/api/uploads/${photoFilename}`,
    audioUrl: audioFilename ? `/api/uploads/${audioFilename}` : null,
    transcript,
    clipUrl: null,
    clipStatus: 'pending',
    runwayTaskId: null,
    createdAt: new Date().toISOString(),
  };
  saveMemory(memory);

  // Kick off animation in the background — don't make the phone wait.
  (async () => {
    try {
      const mimeType = photo.type || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${photoBuffer.toString('base64')}`;
      const taskId = await startAnimation(dataUrl);
      updateMemory(id, { runwayTaskId: taskId, clipStatus: 'processing' });
    } catch (err) {
      console.error('Animation start failed:', err);
      updateMemory(id, { clipStatus: 'failed' });
    }
  })();

  return NextResponse.json({ memory });
}
