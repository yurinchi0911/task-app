'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProjectInvite } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  projectId: string
  pendingInvites: ProjectInvite[]
  currentUserId: string
}

export default function InviteSection({ projectId, pendingInvites, currentUserId }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invites, setInvites] = useState<ProjectInvite[]>(pendingInvites)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')

    const supabase = createClient()
    const token = uuidv4()

    const { data, error: insertError } = await supabase
      .from('project_invites')
      .insert({
        project_id: projectId,
        email: email.trim().toLowerCase(),
        role: 'member',
        invited_by: currentUserId,
        token,
      } as Record<string, string>)
      .select()
      .single() as { data: ProjectInvite | null; error: { message: string } | null }

    if (insertError) {
      setError('招待の作成に失敗しました: ' + insertError.message)
      setLoading(false)
      return
    }

    const inviteUrl = `${window.location.origin}/invite/${token}`
    setSuccess(`招待リンクを生成しました！\n${inviteUrl}`)
    if (data) setInvites(prev => [data, ...prev])
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
        <h2 className="font-semibold text-slate-800">メンバーを招待</h2>
        <p className="text-xs text-slate-400 mt-0.5">メールアドレスを入力すると招待リンクが生成されます</p>
      </div>

      <div className="p-5">
        <form onSubmit={handleInvite} className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="招待するメールアドレス"
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? '処理中…' : '招待リンクを生成'}
          </button>
        </form>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <p className="font-medium mb-1">✅ 招待リンクを生成しました</p>
            <p className="text-xs break-all bg-white border border-emerald-200 rounded p-2 font-mono">
              {success.split('\n')[1]}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(success.split('\n')[1])}
              className="mt-2 text-xs text-emerald-700 hover:underline"
            >
              コピーする
            </button>
          </div>
        )}

        {invites.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">保留中の招待</p>
            <ul className="space-y-2">
              {invites.map(inv => (
                <li key={inv.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-sm text-slate-800">{inv.email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(inv.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    取り消す
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
