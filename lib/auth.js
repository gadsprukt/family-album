// Very simple shared-code "auth" — no accounts, no passwords to remember.
// One code lets you add memories, a different (or the same) code lets you
// view the album. This is deliberately lightweight: it keeps the pages
// away from random visitors and search engines, not a bank-grade lock.

export function isValidCode(code, envVarName) {
  const expected = process.env[envVarName];
  if (!expected) return true; // no code configured -> don't block anyone
  return code === expected;
}
