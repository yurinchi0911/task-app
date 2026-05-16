'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
  isPro: boolean
  isLoggedIn: boolean
}

export default function PricingClient({ isPro, isLoggedIn }: Props) {
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
    features: [t('pro.features.0'), t('pro.features.1'), t('pro.features.2'), t('pro.features.3'), t('pro.features.4')],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-300 text-sm mb-8">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-slate-400 text-lg">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
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
              {!isPro ? t('current') : 'Free'}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-blue-600 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
              Popular
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">{proPlan.name}</h2>
              <div className="mt-3">
                <span className="text-4xl font-bold text-white">{proPlan.price}</span>
                <span className="text-blue-200 ml-1">{t('monthly')}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {proPlan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-white text-sm">
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <button
                onClick={handleManage}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {loading ? t('upgrading') : t('manage')}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {loading ? t('upgrading') : t('upgrade')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
