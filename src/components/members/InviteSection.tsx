'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProjectInvite } from '@/lib/types'

interface Props {
  projectId: string
  pendingInvites: ProjectInvite[]
  canInviteMembers: boolean
  slotsUsed: number
  slotsMax: number
}

export default function InviteSection({
  projectId,
  pendingInvites,
  canInviteMembers,
  slotsUsed,
  slotsMax,
}: Props) {
  const t = useTranslations('members')
  const locale = useLocale()
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successUrl, setSuccessUrl] = useState('')
  const [invites, setInvites] = useState<ProjectInvite[]>(pendingInvites)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSuccessUrl('')

    const res = await fetch(`/api/projects/${projectId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(typeof json.message === 'string' ? json.message : t('inviteCreateFailed'))
      setLoading(false)
      return
    }

    const invite = json.invite as ProjectInvite
    const inviteUrl = `${window.location.origin}/invite/${invite.token}`
    setSuccessUrl(inviteUrl)
    setInvites(prev => [invite, ...prev])
    setEmail('')
    setLoading(false)
  }

  async function handleCancelInvite(inviteId: string) {
    const supabase = createClient()
    await supabase.from('project_invites').delete().eq('id', inviteId)
    setInvites(prev => prev.filter(i => i.id !== inviteId))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">{t('invite')}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('inviteDesc')}</p>
      </div>

      <div className="p-5">
        {!canInviteMembers && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            {t('slotLimitLine', { slotsMax, slotsUsed })}
            <span className="block mt-1 text-xs text-amber-800">{t('slotLimitProHint')}</span>
          </div>
        )}

        <form onSubmit={handleInvite} className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={!canInviteMembers}
            placeholder={t('inviteEmail')}
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !email.trim() || !canInviteMembers}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? t('processing') : t('generateLink')}
          </button>
        </form>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {successUrl && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <p className="font-medium mb-1">✅ {t('inviteSuccess')}</p>
            <p className="text-xs break-all bg-white border border-emerald-200 rounded p-2 font-mono">
              {successUrl}
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(successUrl)}
              className="mt-2 text-xs text-emerald-700 hover:underline"
            >
              {t('copyLink')}
            </button>
          </div>
        )}

        {invites.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">{t('pending')}</p>
            <ul className="space-y-2">
              {invites.map(inv => (
                <li key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-sm text-slate-800">{inv.email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancelInvite(inv.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    {t('revoke')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
