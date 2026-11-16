// Animates a still photo into a short, gentle video clip using Runway's
// image-to-video API.
//
// NOTE: Runway retires models on a schedule (gen3a_turbo was sunset
// 2026-07-30, which is why this uses gen4_turbo now) — if this starts
// failing again, check https://docs.dev.runwayml.com for the current
// model name and that model's supported ratio/duration values, and
// adjust the two functions below. Everything else in the app
// (storage, transcription, the pages) doesn't need to change.

const RUNWAY_BASE = 'https://api.dev.runwayml.com/v1';
const RUNWAY_VERSION = '2024-11-06';

// A deliberately gentle prompt: small, natural movement rather than
// anything dramatic, so old/fragile photos don't warp.
const GENTLE_MOTION_PROMPT =
  'Subtle, gentle, natural movement: a soft blink, a slight smile, a small ' +
  'turn of the head. Slow and calm. No camera movement, no zoom, no change ' +
  'in lighting, nothing dramatic. The person should look alive and at ease.';

export async function startAnimation(imageBase64DataUrl) {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY is not set. Add it to .env.local');
  }

  const res = await fetch(`${RUNWAY_BASE}/image_to_video`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Runway-Version': RUNWAY_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gen4_turbo',
      promptImage: imageBase64DataUrl,
      promptText: GENTLE_MOTION_PROMPT,
      ratio: '720:1280',
      duration: 5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Runway animation request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.id; // task id to poll
}

export async function checkAnimation(taskId) {
  const apiKey = process.env.RUNWAY_API_KEY;
  const res = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-Runway-Version': RUNWAY_VERSION,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Runway status check failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  // data.status is one of: PENDING, RUNNING, SUCCEEDED, FAILED
  return data;
}
