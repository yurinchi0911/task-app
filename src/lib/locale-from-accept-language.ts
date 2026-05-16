/** Parses Accept-Language and picks the highest-q match among `supported`; otherwise `fallback`. */
export function negotiateLocaleFromAcceptLanguage<T extends string>(
  header: string | null | undefined,
  supported: readonly T[],
  fallback: T
): T {
  const supportedSet = new Set<string>(supported)
  const h = (header ?? '').trim()
  if (!h) return fallback

  const parsed = h.split(',').map((part, order) => {
    const trimmed = part.trim()
    const [rangePart, ...params] = trimmed.split(';').map((s) => s.trim())
    const lang = rangePart.toLowerCase()
    let q = 1
    for (const p of params) {
      const [k, v] = p.split('=').map((s) => s.trim().toLowerCase())
      if (k === 'q') {
        const n = Number.parseFloat(v)
        q = Number.isFinite(n) ? n : 0
      }
    }
    return { lang, q, order }
  })

  parsed.sort((a, b) => {
    if (b.q !== a.q) return b.q - a.q
    return a.order - b.order
  })

  for (const { lang } of parsed) {
    if (!lang) continue
    if (supportedSet.has(lang)) return lang as T
    const primary = lang.split('-')[0]
    if (primary && supportedSet.has(primary)) return primary as T
  }

  return fallback
}
