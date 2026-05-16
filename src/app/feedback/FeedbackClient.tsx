'use client'

import { useState } from 'react'
import type { Feedback } from '@/lib/types'
import Link from 'next/link'

interface Props {
  feedbacks: Feedback[]
}

const CATEGORIES = [
  { value: 'general', label: '一般的なフィードバック' },
  { value: 'bug', label: 'バグ報告' },
  { value: 'feature', label: '機能リクエスト' },
  { value: 'ux', label: 'UI/UX改善提案' },
  { value: 'other', label: 'その他' },
]

export default function FeedbackClient({ feedbacks: initialFeedbacks }: Props) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks)
  const [category, setCategory] = useState('general')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState<number>(5)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content: content.trim(), rating }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '送信に失敗しました')
      }

      const newFeedback = await res.json()
      setFeedbacks(prev => [newFeedback, ...prev])
      setContent('')
      setCategory('general')
      setRating(5)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const categoryLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label ?? cat

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">フィードバック</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-medium">
              ✦ Pro限定
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">改善のためのご意見をお聞かせください</p>
        </div>
      </div>

      {/* フォーム */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">新しいフィードバックを送る</h2>

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            フィードバックを送信しました。ありがとうございます！
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">評価</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    star <= rating ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm text-slate-500">{rating} / 5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">フィードバック内容 *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="ご意見・ご要望・バグ報告などをご自由にお書きください"
              rows={5}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                送信中…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                フィードバックを送信
              </>
            )}
          </button>
        </form>
      </div>

      {/* 過去のフィードバック */}
      {feedbacks.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">過去のフィードバック</h2>
          <div className="space-y-3">
            {feedbacks.map(fb => (
              <div key={fb.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {categoryLabel(fb.category)}
                    </span>
                    {fb.rating && (
                      <span className="text-sm text-amber-400">
                        {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(fb.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{fb.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
