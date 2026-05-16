'use client'

import { setUserLocale } from '@/app/actions/locale'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LocaleSwitcher({ current }: { current: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function switchLocale(locale: string) {
    if (locale === current || loading) return
    setLoading(true)
    const { ok } = await setUserLocale(locale)
    if (ok) {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
      <button
        onClick={() => switchLocale('en')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
          current === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('ja')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
          current === 'ja' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        日本語
      </button>
    </div>
  )
}
