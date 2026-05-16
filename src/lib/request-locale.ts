import { cookies, headers } from 'next/headers'
import { negotiateLocaleFromAcceptLanguage } from '@/lib/locale-from-accept-language'
import { defaultLocale, locales, type Locale } from '@/i18n'

/** Cookie → Accept-Language → default (aligned with `src/i18n.ts`) for Route Handlers. */
export async function getRequestUiLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get('locale')?.value
  if (cookieLang && locales.includes(cookieLang as Locale)) {
    return cookieLang as Locale
  }
  const acceptLang = (await headers()).get('accept-language')
  return negotiateLocaleFromAcceptLanguage(acceptLang, locales, defaultLocale)
}
