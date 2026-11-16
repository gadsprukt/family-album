// Tiny file-based "database" for the MVP.
// Good enough for a family album with a handful of memories.
// If this grows, swap this file for a real database later —
// nothing else in the app needs to change as long as these
// function signatures stay the same.

import fs from 'fs';
import path from 'path';

// DATA_DIR should point at a mounted persistent volume on hosts like
// Railway/Render, where the rest of the filesystem resets on every
// deploy. Falls back to a local ./data folder for running this on
// your own machine.
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'memories.json');

function ensureReady() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

export function listMemories() {
  ensureReady();
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  const items = JSON.parse(raw);
  // newest first
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getMemory(id) {
  return listMemories().find((m) => m.id === id) || null;
}

export function saveMemory(memory) {
  ensureReady();
  const items = listMemories();
  items.push(memory);
  fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2));
  return memory;
}

export function updateMemory(id, patch) {
  ensureReady();
  const items = listMemories();
  const idx = items.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  fs.writeFileSync(DB_FILE, JSON.stringify(items, null, 2));
  return items[idx];
}
