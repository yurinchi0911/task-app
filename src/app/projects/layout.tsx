import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/ui/LogoutButton'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher'
import { getLocale, getTranslations } from 'next-intl/server'
import { getProAccess } from '@/lib/pro'
import type { Profile } from '@/lib/types'

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'name' | 'email'> | null }

  const { isPro, isOwnerPro, coveredByOwner } = await getProAccess(user.id)

  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const tPricing = await getTranslations('pricing')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <Link href="/projects" className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            {tNav('brand')}
          </Link>
          <div className="flex items-center gap-3">
            {/* Pro バッジ or アップグレードリンク */}
            {!isPro && (
              <Link
                href="/pricing"
                className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                ⚡ {tPricing('upgrade')}
              </Link>
            )}
            {isOwnerPro && (
              <Link
                href="/pricing"
                className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 text-white font-medium"
                title={tPricing('manage')}
              >
                ✦ Pro
              </Link>
            )}
            {coveredByOwner && !isOwnerPro && (
              <span className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 text-white font-medium"
                title={tNav('teamOwnerProTooltip')}>
                ✦ {tNav('teamProBadge')}
              </span>
            )}

            {/* フィードバックリンク（Pro ユーザーのみ） */}
            {isPro && (
              <Link
                href="/feedback"
                className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {tNav('feedback')}
              </Link>
            )}

            <LocaleSwitcher current={locale} />
            <span className="text-sm text-slate-600 hidden sm:block">
              {profile?.name || profile?.email || user.email}
            </span>
            <LogoutButton label={tNav('logout')} />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
