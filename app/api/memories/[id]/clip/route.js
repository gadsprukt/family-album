import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getMemory, updateMemory, DATA_DIR } from '@/lib/db';
import { checkAnimation } from '@/lib/runway';
import { isValidCode } from '@/lib/auth';

const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

// Called by the album/upload page every few seconds while a clip is
// still processing, to check whether Runway has finished it yet.
export async function GET(request, { params }) {
  const code = request.headers.get('x-access-code') || '';
  const okAlbum = isValidCode(code, 'ALBUM_ACCESS_CODE');
  const okUpload = isValidCode(code, 'UPLOAD_ACCESS_CODE');
  if (!okAlbum && !okUpload) {
    return NextResponse.json({ error: 'קוד שגוי' }, { status: 401 });
  }

  const memory = getMemory(params.id);
  if (!memory) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (memory.clipStatus !== 'processing' || !memory.runwayTaskId) {
    return NextResponse.json({ memory });
  }

  try {
    const task = await checkAnimation(memory.runwayTaskId);

    if (task.status === 'SUCCEEDED') {
      const videoUrl = task.output?.[0];
      if (!videoUrl) throw new Error('No output video URL from Runway');

      const videoRes = await fetch(videoUrl);
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
      const clipFilename = `${memory.id}-clip.mp4`;
      fs.writeFileSync(path.join(UPLOAD_DIR, clipFilename), videoBuffer);

      const updated = updateMemory(memory.id, {
        clipStatus: 'ready',
        clipUrl: `/api/uploads/${clipFilename}`,
      });
      return NextResponse.json({ memory: updated });
    }

    if (task.status === 'FAILED') {
      const updated = updateMemory(memory.id, { clipStatus: 'failed' });
      return NextResponse.json({ memory: updated });
    }

    // still PENDING/RUNNING
    return NextResponse.json({ memory });
  } catch (err) {
    console.error('Clip check failed:', err);
    return NextResponse.json({ memory });
  }
}
