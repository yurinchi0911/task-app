import { createClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/safe-redirect'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const reqUrl = new URL(request.url)
  const code = reqUrl.searchParams.get('code')
  const nextPath = getSafeRedirectPath(reqUrl.searchParams.get('next')) ?? '/projects'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, reqUrl.origin).toString())
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', reqUrl.origin).toString())
}
