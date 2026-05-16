'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useState, useCallback, useMemo } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'
import TaskFormModal from './TaskFormModal'
import type { ProjectMember } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

// ──────────────────────────────────────────────
// レイアウト定数
// ──────────────────────────────────────────────
const CARD_W   = 186
const CARD_H   = 76
const H_GAP    = 88   // 列間の水平間隔
const V_GAP    = 10   // 兄弟間の垂直間隔
const PAD      = 24   // キャンバス周囲の余白

// 枝カラーパレット（線・背景・テキスト）
const BRANCH_COLORS = [
  { line: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', dot: '#3B82F6' },
  { line: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', dot: '#8B5CF6' },
  { line: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', dot: '#10B981' },
  { line: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#F59E0B' },
  { line: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#EF4444' },
  { line: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D', dot: '#EC4899' },
  { line: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC', text: '#155E75', dot: '#06B6D4' },
  { line: '#84CC16', bg: '#F7FEE7', border: '#D9F99D', text: '#3F6212', dot: '#84CC16' },
]

const PRIORITY_DOT: Record<string, string> = {
  low: '#94A3B8', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444',
}

/** DB上の親IDが一覧に無いときはルートとして扱い、ツリーが欠落しないようにする */
function normalizeParentsForTree(tasks: Task[]): Task[] {
  const ids = new Set(tasks.map(t => t.id))
  return tasks.map(t => ({
    ...t,
    parent_task_id: t.parent_task_id && ids.has(t.parent_task_id) ? t.parent_task_id : null,
  }))
}

/** 親子の接続線（ベジェよりカードとの重なりが少ない折れ線） */
function orthogonalEdgePath(x1: number, y1: number, x2: number, y2: number): string {
  const bend = x1 + Math.max((x2 - x1) * 0.42, (CARD_W + H_GAP) * 0.25)
  const midX = Math.min(bend, x2 - 8)
  return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`
}

interface FormValues {
  title: string
  assignee_id: string | null
  due_date: string | null
  status: TaskStatus
  priority: TaskPriority
  notes: string | null
  parent_task_id: string | null
}

// ──────────────────────────────────────────────
// レイアウト計算
// ──────────────────────────────────────────────
interface LayoutEntry {
  task: Task
  cx: number        // カード中心 X
  cy: number        // カード中心 Y
  depth: number
  colorIdx: number
  parentId: string | null
}

function siblingTasks(all: Task[], parentId: string | null): Task[] {
  return all
    .filter(t => t.parent_task_id === parentId)
    .sort(
      (a, b) =>
        (a.created_at ?? '').localeCompare(b.created_at ?? '') ||
        (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' }),
    )
}

/** このタスクのサブツリー全体が占める高さ */
function subtreeH(id: string, all: Task[]): number {
  const kids = siblingTasks(all, id)
  if (kids.length === 0) return CARD_H
  const total = kids.reduce((s, k) => s + subtreeH(k.id, all) + V_GAP, -V_GAP)
  return Math.max(CARD_H, total)
}

/** 再帰的にレイアウトエントリを生成 */
function buildEntries(
  all: Task[],
  parentId: string | null,
  depth: number,
  topY: number,
  colorIdx: number,
  result: LayoutEntry[],
): void {
  const kids = siblingTasks(all, parentId)
  let y = topY
  kids.forEach((task, i) => {
    const sh   = subtreeH(task.id, all)
    const ci   = parentId === null ? i % BRANCH_COLORS.length : colorIdx
    const cx   = PAD + depth * (CARD_W + H_GAP) + CARD_W / 2
    const cy   = PAD + y + sh / 2
    result.push({ task, cx, cy, depth, colorIdx: ci, parentId })
    buildEntries(all, task.id, depth + 1, y, ci, result)
    y += sh + V_GAP
  })
}

// ──────────────────────────────────────────────
// タスクカード（SVG外の絶対配置 div）
// ──────────────────────────────────────────────
interface CardProps {
  entry: LayoutEntry
  selected: boolean
  onSelect: (id: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, s: TaskStatus) => void
  onAddChild: (id: string) => void
  childCount: number
  doneCount: number
}

function TreeMindMapCard({
  entry, selected, onSelect, onEdit, onDelete, onStatusChange, onAddChild, childCount, doneCount,
}: CardProps) {
  const t = useTranslations('tasks')
  const locale = useLocale()
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  const { task, cx, cy, colorIdx } = entry
  const col    = BRANCH_COLORS[colorIdx]
  const isOver = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress', in_progress: 'done', done: 'todo',
  }

  const statusStyle = {
    todo:        { ring: '#CBD5E1', fill: 'white',    icon: '' },
    in_progress: { ring: '#3B82F6', fill: '#DBEAFE',  icon: '…' },
    done:        { ring: '#10B981', fill: '#10B981',   icon: '✓' },
  }[task.status]

  return (
    <div
      style={{
        position: 'absolute',
        left:  cx - CARD_W / 2,
        top:   cy - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
      }}
      className="group"
    >
      {/* カード本体 */}
      <div
        onClick={() => onSelect(task.id)}
        style={{
          background: selected ? col.bg : 'white',
          border: `1.5px solid ${selected ? col.border : '#E2E8F0'}`,
          boxShadow: selected
            ? `0 0 0 2px ${col.line}33, 0 4px 12px ${col.line}22`
            : '0 1px 4px rgba(0,0,0,0.08)',
        }}
        className="relative w-full h-full rounded-xl cursor-pointer transition-all duration-150 hover:shadow-md overflow-hidden"
      >
        {/* 左アクセントバー */}
        <div
          style={{ background: col.line }}
          className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        />

        <div className="pl-3.5 pr-2.5 pt-2 pb-2 h-full flex flex-col justify-between">
          {/* 上段：ステータス + タイトル + アクション */}
          <div className="flex items-start gap-1.5">
            {/* ステータスサークル */}
            <button
              onClick={e => { e.stopPropagation(); onStatusChange(task.id, nextStatus[task.status]) }}
              style={{
                width: 16, height: 16,
                borderRadius: '50%',
                border: `2px solid ${statusStyle.ring}`,
                background: statusStyle.fill,
                color: '#fff',
                fontSize: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
                cursor: 'pointer',
              }}
              title={t('treeChangeStatus')}
            >
              {statusStyle.icon}
            </button>

            {/* タイトル */}
            <p
              style={{ color: task.status === 'done' ? '#94A3B8' : '#1E293B' }}
              className={`flex-1 text-xs font-semibold leading-snug line-clamp-2 ${task.status === 'done' ? 'line-through' : ''}`}
            >
              {task.title}
            </p>

            {/* hover アクションボタン */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); onAddChild(task.id) }}
                style={{ color: '#94A3B8' }}
                className="hover:text-emerald-500 p-0.5 rounded"
                title={t('treeAddSubtask')}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); onEdit(task) }}
                style={{ color: '#94A3B8' }}
                className="hover:text-blue-500 p-0.5 rounded"
                title={t('treeEditTooltip')}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(task.id) }}
                style={{ color: '#94A3B8' }}
                className="hover:text-red-500 p-0.5 rounded"
                title={t('treeDeleteTooltip')}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* 下段：バッジ類 */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* 優先度 */}
            <span style={{ background: `${PRIORITY_DOT[task.priority]}18`, color: PRIORITY_DOT[task.priority] }}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            >
              <span style={{ background: PRIORITY_DOT[task.priority] }} className="w-1.5 h-1.5 rounded-full" />
              {t(`priorityLabel.${task.priority}`)}
            </span>

            {/* 期限 */}
            {task.due_date && (
              <span style={{ background: isOver ? '#FEE2E2' : '#F1F5F9', color: isOver ? '#DC2626' : '#64748B' }}
                className="text-[10px] px-1.5 py-0.5 rounded-full">
                {new Date(task.due_date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                {isOver && ' ⚠'}
              </span>
            )}

            {/* 担当者 */}
            {task.profiles?.name && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 truncate max-w-[60px]">
                {task.profiles.name}
              </span>
            )}

            {/* 子タスク進捗 */}
            {childCount > 0 && (
              <span style={{ background: col.bg, color: col.text }}
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-auto">
                {doneCount}/{childCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// ツリービュー本体
// ──────────────────────────────────────────────
interface Props {
  projectId: string
  tasks: Task[]
  members: ProjectMember[]
  onTasksChange: (tasks: Task[]) => void
}

export default function TaskTreeView({ projectId, tasks, members, onTasksChange }: Props) {
  const t = useTranslations('tasks')
  const [showModal, setShowModal]       = useState(false)
  const [editingTask, setEditingTask]   = useState<Task | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const supabase = createClient()

  const layoutTasks = useMemo(() => normalizeParentsForTree(tasks), [tasks])
  const rootsCount = layoutTasks.filter(t => !t.parent_task_id).length

  // ── レイアウト計算 ──
  const entries = useMemo(() => {
    const result: LayoutEntry[] = []
    buildEntries(layoutTasks, null, 0, 0, 0, result)
    return result
  }, [layoutTasks])

  const canvasW = entries.length > 0
    ? Math.max(...entries.map(e => e.cx)) + CARD_W / 2 + PAD
    : 480
  const canvasH = entries.length > 0
    ? Math.max(...entries.map(e => e.cy)) + CARD_H / 2 + PAD
    : 320

  // ── SVG パス ──
  const paths = useMemo(() => entries
    .filter(e => e.parentId !== null)
    .map(e => {
      const parent = entries.find(p => p.task.id === e.parentId)
      if (!parent) return null
      const col = BRANCH_COLORS[e.colorIdx]
      const x1 = parent.cx + CARD_W / 2
      const y1 = parent.cy
      const x2 = e.cx - CARD_W / 2
      const y2 = e.cy
      const d = orthogonalEdgePath(x1, y1, x2, y2)
      return (
        <path
          key={e.task.id}
          d={d}
          stroke={col.line}
          strokeWidth="2.5"
          fill="none"
          strokeLinejoin="round"
          opacity="0.75"
        />
      )
    }), [entries])

  // ── CRUD ──
  const handleSaveTask = useCallback(async (values: FormValues) => {
    if (editingTask) {
      const { data } = await supabase
        .from('tasks')
        .update(values as unknown as Record<string, unknown>)
        .eq('id', editingTask.id)
        .select('*')
        .single() as { data: Task | null }
      if (data) onTasksChange(tasks.map(t => t.id === data.id ? data : t))
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...values, project_id: projectId } as Record<string, unknown>)
        .select('*')
        .single() as { data: Task | null; error: { message: string } | null }
      if (error) alert(t('taskAddError') + error.message)
      else if (data) onTasksChange([...tasks, data])
    }
    setShowModal(false); setEditingTask(null); setDefaultParentId(null)
  }, [editingTask, projectId, supabase, tasks, onTasksChange, t])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) onTasksChange(tasks.filter(t => t.id !== taskId))
  }, [supabase, tasks, onTasksChange])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase.from('tasks').update({ status } as Record<string, string>).eq('id', taskId)
    if (!error) onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status } : t))
  }, [supabase, tasks, onTasksChange])

  const openCreate    = () => { setEditingTask(null); setDefaultParentId(null); setShowModal(true) }
  const openEdit      = (task: Task) => { setEditingTask(task); setDefaultParentId(null); setShowModal(true) }
  const openAddChild  = (parentId: string) => { setEditingTask(null); setDefaultParentId(parentId); setShowModal(true) }

  // ── 集計 ──
  const completedCount = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="space-y-4">
      {/* ── 全体進捗バー ── */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-slate-700">{t('treeOverallProgress')}</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">{t('treeCompletedOfTotal', { completed: completedCount, total: tasks.length })}</span>
              <span className={`font-bold text-base ${progress === 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                {progress}%
              </span>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg,#34D399,#10B981)'
                  : 'linear-gradient(90deg,#60A5FA,#818CF8)',
              }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            {(['todo','in_progress','done'] as TaskStatus[]).map(s => {
              const c = tasks.filter(t => t.status === s).length
              const colors = { todo: '#94A3B8', in_progress: '#3B82F6', done: '#10B981' }
              return (
                <span key={s} style={{ color: colors[s] }} className="font-medium">
                  {c} {t(`statusLabel.${s}`)}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ツリーキャンバス ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h3m0 0v5m0-5h3m6-3v3m0 0h3M7 11v5m0 0h3m-3 0v2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">{t('treePanelTitle')}</span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {t('treeStats', { rootCount: rootsCount, total: tasks.length })}
            </span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('addTask')}
          </button>
        </div>

        {/* スクロール可能なキャンバス */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">{t('treeEmptyTitle')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('treeEmptyHint')}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 px-4 text-center">
            <p className="text-sm font-medium text-slate-600">{t('treeUnexpectedEmpty')}</p>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">{t('treeUnexpectedEmptyHint')}</p>
          </div>
        ) : (
          <div
            className="overflow-auto"
            style={{ minHeight: 240 }}
            onClick={() => setSelectedId(null)}
          >
            <div className="relative" style={{ width: canvasW, height: canvasH }}>
              {/* SVG 接続線 */}
              <svg
                width={canvasW}
                height={canvasH}
                className="absolute inset-0 pointer-events-none"
              >
                {/* 枝ごとのグロー風の太い線（背景） */}
                {entries
                  .filter(e => e.parentId !== null)
                  .map(e => {
                    const parent = entries.find(p => p.task.id === e.parentId)
                    if (!parent) return null
                    const col = BRANCH_COLORS[e.colorIdx]
                    const x1 = parent.cx + CARD_W / 2
                    const y1 = parent.cy
                    const x2 = e.cx - CARD_W / 2
                    const y2 = e.cy
                    const d = orthogonalEdgePath(x1, y1, x2, y2)
                    return (
                      <path
                        key={`glow-${e.task.id}`}
                        d={d}
                        stroke={col.line}
                        strokeWidth="6"
                        fill="none"
                        strokeLinejoin="round"
                        opacity="0.12"
                      />
                    )
                  })}
                {/* メインの線 */}
                {paths}
              </svg>

              {/* タスクカード */}
              {entries.map(e => {
                const kids      = tasks.filter(t => t.parent_task_id === e.task.id)
                const doneKids  = kids.filter(k => k.status === 'done').length
                return (
                  <TreeMindMapCard
                    key={e.task.id}
                    entry={e}
                    selected={selectedId === e.task.id}
                    onSelect={id => { setSelectedId(prev => prev === id ? null : id) }}
                    onEdit={openEdit}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    onAddChild={openAddChild}
                    childCount={kids.length}
                    doneCount={doneKids}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TaskFormModal
          task={editingTask}
          members={members}
          allTasks={tasks}
          defaultParentId={defaultParentId}
          allowParentTasks
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditingTask(null); setDefaultParentId(null) }}
        />
      )}
    </div>
  )
}
