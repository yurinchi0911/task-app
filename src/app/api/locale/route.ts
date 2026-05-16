import { locales } from '@/i18n'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let body: { locale?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const locale = typeof body.locale === 'string' ? body.locale : ''
  if (!locales.includes(locale as (typeof locales)[number])) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
