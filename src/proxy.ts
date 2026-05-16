import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSafeRedirectPath } from '@/lib/safe-redirect'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // API と /auth/* はセッション同期のみ（Webhook・OAuth などをログインへ飛ばさない）
  if (pathname.startsWith('/api') || pathname.startsWith('/auth')) {
    return supabaseResponse
  }

  // 未認証: 公開パス以外はログインへ
  if (!user) {
    const allowAnon =
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/invite') ||
      pathname.startsWith('/pricing')

    if (!allowAnon) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 認証済み: ログイン/新規登録は redirect 優先で退避
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const dest = getSafeRedirectPath(request.nextUrl.searchParams.get('redirect'))
    return NextResponse.redirect(new URL(dest ?? '/projects', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
