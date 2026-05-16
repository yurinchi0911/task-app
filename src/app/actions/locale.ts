'use server'

import { cookies } from 'next/headers'
import { locales, type Locale } from '@/i18n'

const LOCALE_COOKIE = 'locale'
const MAX_AGE = 60 * 60 * 24 * 365

export async function setUserLocale(locale: string) {
  if (!locales.includes(locale as Locale)) {
    return { ok: false as const }
  }
  const jar = await cookies()
  jar.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return { ok: true as const }
}
