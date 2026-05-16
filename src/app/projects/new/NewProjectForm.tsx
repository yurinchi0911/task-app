'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Project } from '@/lib/types'

const COLORS = [
  { hex: '#3B82F6', label: 'ブルー' },
  { hex: '#8B5CF6', label: 'バイオレット' },
  { hex: '#EC4899', label: 'ピンク' },
  { hex: '#EF4444', label: 'レッド' },
  { hex: '#F59E0B', label: 'アンバー' },
  { hex: '#10B981', label: 'グリーン' },
  { hex: '#06B6D4', label: 'シアン' },
  { hex: '#F97316', label: 'オレンジ' },
]

export default function NewProjectForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0].hex)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [limitHit, setLimitHit] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    setLimitHit(false)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), color }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      setLimitHit(json.error === 'LIMIT_PROJECTS')
      setError(
        typeof json.message === 'string'
          ? json.message
          : 'プロジェクトの作成に失敗しました。',
      )
      setLoading(false)
      return
    }

    const data = json as Project
    router.push(`/projects/${data.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4">
          ← プロジェクト一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">新規プロジェクト</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">プロジェクト名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="例: ウェブサイトリニューアル"
              maxLength={60}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">カラー</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-9 h-9 rounded-full transition-transform hover:scale-110 ${
                    color === c.hex ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : ''
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: color }}
            >
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{name || 'プロジェクト名'}</p>
              <p className="text-xs text-slate-400">プレビュー</p>
            </div>
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              {limitHit && (
                <Link href="/pricing?reason=project_limit" className="text-sm text-blue-600 hover:underline">
                  Pro で無制限にする →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {loading ? '作成中…' : 'プロジェクトを作成'}
          </button>
        </form>
      </div>
    </div>
  )
}
