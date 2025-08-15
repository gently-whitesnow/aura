export function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidKey(s: string) {
  return /^[a-z0-9._-]{3,}$/.test(s)
}