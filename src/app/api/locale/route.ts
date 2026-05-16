import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { locale } = await req.json()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return res
}
