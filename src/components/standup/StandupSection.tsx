'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Standup } from '@/lib/types'

interface Props {
  projectId: string
  currentUserId: string
}

interface StandupWithProfile extends Omit<Standup, 'profiles'> {
  profiles: { name: string | null; email: string | null } | null
}

function todayJST(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
}

export default function StandupSection({ projectId, currentUserId }: Props) {
  const t = useTranslations('standup')
  const locale = useLocale()
  const dateLocaleTag = locale === 'ja' ? 'ja-JP' : 'en-US'

  const [expanded, setExpanded] = useState(false)
  const [standups, setStandups] = useState<StandupWithProfile[]>([])
  const [myStandup, setMyStandup] = useState<StandupWithProfile | null>(null)
  const [yesterday, setYesterday] = useState('')
  const [today, setToday] = useState('')
  const [blockers, setBlockers] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const todayStr = todayJST()

  const headerDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocaleTag, {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }).format(new Date()),
    [dateLocaleTag],
  )

  const loadStandups = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('standups')
      .select('*, profiles(name, email)')
      .eq('project_id', projectId)
      .eq('standup_date', todayStr)
      .order('created_at', { ascending: true }) as { data: StandupWithProfile[] | null }

    if (data) {
      setStandups(data)
      const mine = data.find(s => s.user_id === currentUserId)
      if (mine) {
        setMyStandup(mine)
        setYesterday(mine.yesterday ?? '')
        setToday(mine.today)
        setBlockers(mine.blockers ?? '')
      }
    }
    setLoading(false)
  }, [projectId, currentUserId, supabase, todayStr])

  useEffect(() => {
    if (expanded) {
      loadStandups()
    }
  }, [expanded, loadStandups])

  // Realtime購読
  useEffect(() => {
    if (!expanded) return

    const channel = supabase
      .channel(`standups:project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'standups',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const id = (payload.new as { id: string }).id
            const { data } = await supabase
              .from('standups')
              .select('*, profiles(name, email)')
              .eq('id', id)
              .single() as { data: StandupWithProfile | null }

            if (data) {
              setStandups(prev => {
                const exists = prev.some(s => s.id === data.id)
                if (exists) return prev.map(s => s.id === data.id ? data : s)
                return [...prev, data]
              })
              if (data.user_id === currentUserId) setMyStandup(data)
            }
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id
            setStandups(prev => prev.filter(s => s.id !== id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [expanded, projectId, currentUserId, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!today.trim()) return
    setSubmitting(true)

    const payload = {
      project_id: projectId,
      user_id: currentUserId,
      standup_date: todayStr,
      yesterday: yesterday.trim() || null,
      today: today.trim(),
      blockers: blockers.trim() || null,
    }

    if (myStandup) {
      const { data } = await supabase
        .from('standups')
        .update({ yesterday: payload.yesterday, today: payload.today, blockers: payload.blockers })
        .eq('id', myStandup.id)
        .select('*, profiles(name, email)')
        .single() as { data: StandupWithProfile | null }

      if (data) {
        setMyStandup(data)
        setStandups(prev => prev.map(s => s.id === data.id ? data : s))
      }
    } else {
      const { data } = await supabase
        .from('standups')
        .insert(payload)
        .select('*, profiles(name, email)')
        .single() as { data: StandupWithProfile | null }

      if (data) {
        setMyStandup(data)
        setStandups(prev => [...prev, data])
      }
    }

    setSubmitting(false)
  }

  const getDisplayName = (s: StandupWithProfile) =>
    s.profiles?.name || s.profiles?.email || t('unknownUser')

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ヘッダー（クリックで展開） */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 text-sm">{t('title')}</span>
              {myStandup && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  ✓ {t('postedBadge')}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {expanded
                ? t('subheaderExpanded', { date: headerDateLabel, count: standups.length })
                : t('subheaderCollapsed', { date: headerDateLabel })}
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {/* 自分のスタンドアップフォーム */}
              <form onSubmit={handleSubmit} className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl p-4 border border-violet-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">
                    {myStandup ? '✓' : '!'}
                  </span>
                  {myStandup ? t('formTitleEdit') : t('formTitleNew')}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t('yesterdayLabel')}
                      <span className="ml-1 font-normal text-slate-400">{t('optional')}</span>
                    </label>
                    <textarea
                      value={yesterday}
                      onChange={e => setYesterday(e.target.value)}
                      placeholder={t('yesterdayPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t('todayLabel')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={today}
                      onChange={e => setToday(e.target.value)}
                      placeholder={t('todayPlaceholder')}
                      rows={2}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {t('blockersLabel')}
                      <span className="ml-1 font-normal text-slate-400">{t('optional')}</span>
                    </label>
                    <textarea
                      value={blockers}
                      onChange={e => setBlockers(e.target.value)}
                      placeholder={t('blockersPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white resize-none text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !today.trim()}
                    className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('submitting')}
                      </>
                    ) : myStandup ? t('submitUpdate') : t('submitNew')}
                  </button>
                </div>
              </form>

              {/* チームのスタンドアップ */}
              {standups.filter(s => s.user_id !== currentUserId).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    {t('teamStandups')}
                  </h3>
                  <div className="space-y-3">
                    {standups
                      .filter(s => s.user_id !== currentUserId)
                      .map(s => (
                        <div key={s.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                              {getDisplayName(s).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{getDisplayName(s)}</span>
                            <span className="text-xs text-slate-400 ml-auto">
                              {new Date(s.created_at).toLocaleTimeString(dateLocaleTag, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            {s.yesterday && (
                              <div>
                                <span className="text-xs font-medium text-slate-400 block mb-0.5">
                                  {t('sectionYesterday')}
                                </span>
                                <p className="text-slate-700 whitespace-pre-wrap">{s.yesterday}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-medium text-slate-400 block mb-0.5">
                                {t('sectionToday')}
                              </span>
                              <p className="text-slate-700 whitespace-pre-wrap">{s.today}</p>
                            </div>
                            {s.blockers && (
                              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-100">
                                <span className="text-xs font-medium text-amber-600 block mb-0.5">
                                  ⚠ {t('sectionBlockers')}
                                </span>
                                <p className="text-slate-700 whitespace-pre-wrap text-sm">{s.blockers}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {standups.length === 0 && !loading && (
                <div className="text-center py-4 text-slate-400 text-sm">{t('emptyState')}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
