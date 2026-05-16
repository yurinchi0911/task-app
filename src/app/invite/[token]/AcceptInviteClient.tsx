'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ProjectInvite } from '@/lib/types'

interface Props {
  invite: ProjectInvite
  project: { id: string; name: string; color: string }
  token: string
  isLoggedIn: boolean
  userEmail: string | null
}

export default function AcceptInviteClient({ invite, project, token, isLoggedIn, userEmail }: Props) {
  const t = useTranslations('invite')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')

    const res = await fetch(`/api/invite/${token}/accept`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      const msg = typeof json?.message === 'string' && json.message.trim() ? json.message : t('acceptFailed')
      setError(msg)
      setLoading(false)
      return
    }

    router.push(`/projects/${json.projectId ?? project.id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-2xl font-bold mb-4"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-white mb-1">{t('invited')}</h1>
          <p className="text-slate-300 text-lg font-semibold">{project.name}</p>
          <p className="text-slate-400 text-sm mt-2">
            {t('invitedEmail')} <span className="text-slate-300">{invite.email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-center text-slate-400 text-sm mb-4">{t('loginToJoin')}</p>
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="block w-full py-3 text-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              {t('loginJoin')}
            </Link>
            <Link
              href={`/signup?redirect=/invite/${token}`}
              className="block w-full py-3 text-center rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium transition-colors"
            >
              {t('signupJoin')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userEmail ? (
              <p className="text-center text-slate-400 text-sm mb-4">{t('loggedInLine', { email: userEmail })}</p>
            ) : null}
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? t('joining') : t('join')}
            </button>
            <Link
              href="/projects"
              className="block w-full py-3 text-center text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              {t('cancel')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
