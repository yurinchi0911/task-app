import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { negotiateLocaleFromAcceptLanguage } from '@/lib/locale-from-accept-language'

export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export default getRequestConfig(async () => {
  // クッキー優先 → Accept-Languageヘッダー → デフォルト英語
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get('locale')?.value
  const headersList = await headers()
  const acceptLang = headersList.get('accept-language') ?? ''

  let locale: Locale = defaultLocale

  if (cookieLang && locales.includes(cookieLang as Locale)) {
    locale = cookieLang as Locale
  } else {
    locale = negotiateLocaleFromAcceptLanguage(acceptLang, locales, defaultLocale)
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
