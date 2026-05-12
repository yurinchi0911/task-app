'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ProjectInvite } from '@/lib/types'

interface Props {
  invite: ProjectInvite
  project: { id: string; name: string; color: string }
  token: string
  isLoggedIn: boolean
  userEmail: string | null
}

export default function AcceptInviteClient({ invite, project, token, isLoggedIn, userEmail }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccept() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/invite/${token}`)
      return
    }

    const { error: updateError } = await supabase
      .from('project_invites')
      .update({ accepted_at: new Date().toISOString() } as Record<string, string>)
      .eq('token', token)

    if (updateError) {
      setError('招待の受諾に失敗しました: ' + updateError.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: invite.role,
      } as Record<string, string>)

    if (memberError && !memberError.message.includes('duplicate')) {
      setError('メンバー追加に失敗しました: ' + memberError.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${project.id}`)
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
          <h1 className="text-xl font-bold text-white mb-1">プロジェクトへ招待されました</h1>
          <p className="text-slate-300 text-lg font-semibold">{project.name}</p>
          <p className="text-slate-400 text-sm mt-2">
            招待メール: <span className="text-slate-300">{invite.email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {!isLoggedIn ? (
          <div className="space-y-3">
            <p className="text-center text-slate-400 text-sm mb-4">
              参加するにはログインまたはアカウント作成が必要です
            </p>
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="block w-full py-3 text-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              ログインして参加
            </Link>
            <Link
              href={`/signup?redirect=/invite/${token}`}
              className="block w-full py-3 text-center rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium transition-colors"
            >
              新規登録して参加
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-slate-400 text-sm mb-4">
              {userEmail} としてログイン中
            </p>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? '参加中…' : 'プロジェクトに参加する'}
            </button>
            <Link
              href="/projects"
              className="block w-full py-3 text-center text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              キャンセル
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
