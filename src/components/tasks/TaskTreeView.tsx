'use client'

import { useState, useCallback } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'
import TaskFormModal from './TaskFormModal'
import type { ProjectMember } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const priorityConfig = {
  low:    { label: '低',  bg: 'bg-slate-100',  text: 'text-slate-600',  border: 'border-slate-300',  dot: 'bg-slate-400' },
  medium: { label: '中',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500' },
  high:   { label: '高',  bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-300',  dot: 'bg-amber-500' },
  urgent: { label: '緊急', bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500' },
}

const statusConfig = {
  todo:        { label: '未着手', ring: 'ring-slate-300',   fill: '',              icon: null },
  in_progress: { label: '進行中', ring: 'ring-blue-400',    fill: 'bg-blue-100',   icon: null },
  done:        { label: '完了',   ring: 'ring-emerald-400', fill: 'bg-emerald-500', icon: '✓' },
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
// タスクノード（1枚のカード）
// ──────────────────────────────────────────────
interface NodeProps {
  task: Task
  allTasks: Task[]
  depth: number
  isLast: boolean
  ancestorHasNext: boolean[]   // 各祖先レベルで「次の兄弟」が存在するか
  members: ProjectMember[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onAddChild: (parentId: string) => void
}

function TaskNode({
  task,
  allTasks,
  depth,
  isLast,
  ancestorHasNext,
  members,
  onEdit,
  onDelete,
  onStatusChange,
  onAddChild,
}: NodeProps) {
  const [expanded, setExpanded] = useState(true)
  const children = allTasks.filter(t => t.parent_task_id === task.id)
  const hasChildren = children.length > 0
  const p = priorityConfig[task.priority]
  const s = statusConfig[task.status]
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()
  const doneCount = children.filter(c => c.status === 'done').length

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  }

  return (
    <div className="flex">
      {/* ─── ガイドライン（縦線群） ─── */}
      <div className="flex flex-shrink-0">
        {Array.from({ length: depth }).map((_, i) => (
          <div key={i} className="w-8 flex-shrink-0 relative">
            {/* 祖先レベルに次の兄弟がいれば縦線を引く */}
            {ancestorHasNext[i] && (
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-200" />
            )}
          </div>
        ))}

        {/* 現ノードへの L 字コネクター */}
        {depth > 0 && (
          <div className="w-8 flex-shrink-0 relative">
            {/* 上から中央まで縦線 */}
            <div className="absolute left-3.5 top-0 w-px bg-slate-200"
              style={{ height: 'calc(50% + 2px)' }} />
            {/* 中央から右へ横線 */}
            <div className="absolute left-3.5 top-1/2 -translate-y-px h-px bg-slate-200"
              style={{ width: 'calc(100% - 14px)' }} />
            {/* 最後の子でなければ下へ縦線を続ける */}
            {!isLast && (
              <div className="absolute left-3.5 w-px bg-slate-200"
                style={{ top: 'calc(50% + 1px)', bottom: 0 }} />
            )}
          </div>
        )}
      </div>

      {/* ─── カード本体 ─── */}
      <div className="flex-1 min-w-0 py-1.5 pr-2">
        <div className={`
          group relative rounded-xl border bg-white shadow-sm
          transition-all duration-150 hover:shadow-md
          ${p.border}
          ${task.status === 'done' ? 'opacity-60' : ''}
        `}>
          {/* 左アクセントバー */}
          <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${p.dot}`} />

          <div className="pl-4 pr-3 py-2.5">
            <div className="flex items-start gap-2">
              {/* ステータスサークル */}
              <button
                onClick={() => onStatusChange(task.id, nextStatus[task.status])}
                title={`${s.label} → クリックで変更`}
                className={`
                  mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ring-2 flex items-center justify-center
                  transition-all hover:scale-110 cursor-pointer text-xs font-bold text-white
                  ${s.ring} ${s.fill}
                `}
              >
                {s.icon}
              </button>

              {/* タイトル */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug truncate ${
                  task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
                }`}>
                  {task.title}
                </p>

                {/* サブ情報 */}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${p.bg} ${p.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.label}
                  </span>

                  {task.due_date && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isOverdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {new Date(task.due_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                      {isOverdue && ' ⚠'}
                    </span>
                  )}

                  {task.profiles?.name && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                      {task.profiles.name}
                    </span>
                  )}

                  {hasChildren && (
                    <span className="text-xs bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">
                      {doneCount}/{children.length}
                    </span>
                  )}
                </div>

                {task.notes && (
                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-1">{task.notes}</p>
                )}
              </div>

              {/* アクションボタン群 */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {/* 展開トグル */}
                {hasChildren && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title={expanded ? '折りたたむ' : '展開'}
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                {/* サブタスク追加 */}
                <button
                  onClick={() => onAddChild(task.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="サブタスクを追加"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {/* 編集 */}
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="編集"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {/* 削除 */}
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="削除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 子タスク進捗バー（展開時に子がいる場合のみ） */}
            {hasChildren && expanded && (
              <div className="mt-2">
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${children.length > 0 ? (doneCount / children.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 子ノードを再帰描画 ─── */}
        {expanded && hasChildren && (
          <div className="mt-0">
            {children.map((child, idx) => (
              <TaskNode
                key={child.id}
                task={child}
                allTasks={allTasks}
                depth={depth + 1}
                isLast={idx === children.length - 1}
                ancestorHasNext={[...ancestorHasNext, !isLast]}
                members={members}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onAddChild={onAddChild}
              />
            ))}
          </div>
        )}
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
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)
  const supabase = createClient()

  const rootTasks = tasks.filter(t => !t.parent_task_id)
  const completedCount = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

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
      if (error) {
        alert('タスク追加エラー: ' + error.message)
      } else if (data) {
        onTasksChange([...tasks, data])
      }
    }
    setShowModal(false)
    setEditingTask(null)
    setDefaultParentId(null)
  }, [editingTask, projectId, supabase, tasks, onTasksChange])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) onTasksChange(tasks.filter(t => t.id !== taskId))
  }, [supabase, tasks, onTasksChange])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase.from('tasks').update({ status } as Record<string, string>).eq('id', taskId)
    if (!error) onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status } : t))
  }, [supabase, tasks, onTasksChange])

  const openCreate = () => { setEditingTask(null); setDefaultParentId(null); setShowModal(true) }
  const openEdit = (task: Task) => { setEditingTask(task); setDefaultParentId(null); setShowModal(true) }
  const openAddChild = (parentId: string) => { setEditingTask(null); setDefaultParentId(parentId); setShowModal(true) }

  return (
    <div className="space-y-4">
      {/* ─── 全体進捗バー ─── */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-semibold text-slate-700">全体進捗</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>{completedCount} / {tasks.length} 完了</span>
              <span className={`font-bold text-base ${
                progress === 100 ? 'text-emerald-500' : progress >= 50 ? 'text-blue-500' : 'text-slate-400'
              }`}>{progress}%</span>
            </div>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progress === 100
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-500 to-violet-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* ステータス別内訳 */}
          <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(s => {
              const count = tasks.filter(t => t.status === s).length
              const labels = { todo: '未着手', in_progress: '進行中', done: '完了' }
              const colors = { todo: 'text-slate-500', in_progress: 'text-blue-500', done: 'text-emerald-500' }
              return (
                <span key={s} className={`flex items-center gap-1 ${colors[s]}`}>
                  <span className="font-semibold">{count}</span>
                  <span>{labels[s]}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── ツリー本体 ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h3m0 0v5m0-5h3m6-3v3m0 0h3M7 11v5m0 0h3m-3 0v2" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">タスクツリー</span>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {rootTasks.length} ルート · {tasks.length} 合計
            </span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            タスクを追加
          </button>
        </div>

        {/* ツリーノード */}
        <div className="p-4 space-y-1">
          {tasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">タスクがありません</p>
              <p className="text-xs text-slate-400 mt-1">「タスクを追加」から始めましょう</p>
            </div>
          ) : (
            rootTasks.map((task, idx) => (
              <TaskNode
                key={task.id}
                task={task}
                allTasks={tasks}
                depth={0}
                isLast={idx === rootTasks.length - 1}
                ancestorHasNext={[]}
                members={members}
                onEdit={openEdit}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddChild={openAddChild}
              />
            ))
          )}
        </div>
      </div>

      {showModal && (
        <TaskFormModal
          task={editingTask}
          members={members}
          allTasks={tasks}
          defaultParentId={defaultParentId}
          onSave={handleSaveTask}
          onClose={() => {
            setShowModal(false)
            setEditingTask(null)
            setDefaultParentId(null)
          }}
        />
      )}
    </div>
  )
}
