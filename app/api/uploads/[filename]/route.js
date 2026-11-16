import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { DATA_DIR } from '@/lib/db';

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.webm': 'audio/webm',
  '.mp4': 'video/mp4',
};

// Serves photos, voice notes and clips straight from DATA_DIR/uploads.
// Deliberately NOT access-code-gated here, the same way static files
// in /public never were — the filename itself (a random id) is the
// only thing you'd need, and that's only ever seen by someone who
// already has a memory link from the app.
export async function GET(request, { params }) {
  const filename = params.filename;

  // Guard against path traversal (e.g. "../../.env.local").
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
