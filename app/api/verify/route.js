import { NextResponse } from 'next/server';
import { isValidCode } from '@/lib/auth';

// The client calls this once to check a code the person typed in,
// before storing it in localStorage for future visits.
export async function POST(request) {
  const { code, purpose } = await request.json();
  const envVarName = purpose === 'album' ? 'ALBUM_ACCESS_CODE' : 'UPLOAD_ACCESS_CODE';
  const ok = isValidCode(code, envVarName);
  return NextResponse.json({ ok });
}
