const keyRegex = /^[a-z0-9][a-z0-9\-\/.]{2,200}$/

export function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidKey(raw: string): boolean {
  return keyRegex.test(normalizeKey(raw))
}


