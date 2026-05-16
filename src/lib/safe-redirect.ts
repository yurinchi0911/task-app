const MAX_REDIRECT_LEN = 512

/**
 * Validates `redirect` query (internal path only). Returns null when unsafe.
 */
export function getSafeRedirectPath(raw: string | null): string | null {
  if (raw == null || raw === '') return null
  let s: string
  try {
    s = decodeURIComponent(raw).trim()
  } catch {
    return null
  }
  if (s.length === 0 || s.length > MAX_REDIRECT_LEN) return null
  if (!s.startsWith('/') || s.startsWith('//')) return null
  if (s.includes('://') || s.includes('\\')) return null
  return s
}

export function postAuthDestination(raw: string | null, fallback = '/projects'): string {
  return getSafeRedirectPath(raw) ?? fallback
}
