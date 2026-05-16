'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
  isPro: boolean
  isOwnerPro: boolean
  coveredByOwner: boolean
  isLoggedIn: boolean
}

export default function PricingClient({ isPro, isOwnerPro, coveredByOwner, isLoggedIn }: Props) {
  const t = useTranslations('pricing')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  async function handleManage() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  const freePlan = {
    name: t('free.name'),
    price: t('free.price'),
    features: [t('free.features.0'), t('free.features.1'), t('free.features.2'), t('free.features.3')],
  }
  const proPlan = {
    name: t('pro.name'),
    price: t('pro.price'),
    features: [
      t('pro.features.0'), t('pro.features.1'), t('pro.features.2'),
      t('pro.features.3'), t('pro.features.4'), t('pro.features.5'),
    ],
  }

  const faqItems = [
    { qKey: 'faq1q', aKey: 'faq1a' },
    { qKey: 'faq2q', aKey: 'faq2a' },
    { qKey: 'faq3q', aKey: 'faq3a' },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-300 text-sm mb-8">
            {t('backToProjects')}
          </Link>
          <h1 className="text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-slate-400 text-lg">{t('subtitle')}</p>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-2xl px-6 py-4 flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
            </div>
            <div>
              <p className="text-blue-300 font-semibold text-sm mb-0.5">{t('teamBadge')}</p>
              <p className="text-slate-300 text-sm leading-relaxed">{t('teamNote')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">{freePlan.name}</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold text-white">{freePlan.price}</span>
                <span className="text-slate-400 ml-1">{t('monthly')}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {freePlan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="w-full py-3 text-center rounded-xl border border-white/20 text-slate-400 text-sm font-medium">
              {!isPro ? t('current') : t('free.name')}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent pointer-events-none" />

            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
              ✦ {t('popularBadge')}
            </div>

            <div className="mb-6 relative">
              <h2 className="text-xl font-bold text-white">{proPlan.name}</h2>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold text-white">{proPlan.price}</span>
                <span className="text-blue-200 mb-1">{t('monthly')}</span>
              </div>
              <p className="text-blue-200 text-xs mt-1 opacity-80">
                {t('proThreePersonHint')}
              </p>
            </div>

            <ul className="space-y-3 mb-8 relative">
              {proPlan.features.map((f, i) => (
                <li key={i} className={`flex items-center gap-2 text-sm ${
                  i === 4 ? 'text-yellow-200 font-semibold' : 'text-white'
                }`}>
                  <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>

            <div className="relative">
              {coveredByOwner && !isOwnerPro && (
                <div className="mb-3 text-center text-sm text-yellow-200 bg-white/10 rounded-xl py-2.5 px-3">
                  {t('coveredByOwner')}
                </div>
              )}

              {isOwnerPro ? (
                <button
                  type="button"
                  onClick={handleManage}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  {loading ? t('upgrading') : t('manage')}
                </button>
              ) : coveredByOwner ? (
                <div className="w-full py-3 text-center rounded-xl bg-white/20 text-white text-sm font-medium">
                  {t('current')}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors shadow-lg"
                >
                  {loading ? t('upgrading') : t('upgrade')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-12 space-y-4">
          <h3 className="text-center text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6">{t('faqHeading')}</h3>
          {faqItems.map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white font-semibold text-sm mb-2">{t(item.qKey)}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{t(item.aKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
