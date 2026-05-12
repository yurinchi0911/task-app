'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus, TaskPriority, ProjectMember } from '@/lib/types'
import TaskCard from './TaskCard'
import TaskFormModal from './TaskFormModal'

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo', label: '未着手', color: 'bg-slate-100' },
  { key: 'in_progress', label: '進行中', color: 'bg-blue-50' },
  { key: 'done', label: '完了', color: 'bg-emerald-50' },
]

interface Props {
  projectId: string
  initialTasks: Task[]
  members: ProjectMember[]
  currentUserId: string
}

export default function TaskBoard({ projectId, initialTasks, members }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const supabase = createClient()

  // Realtimeサブスクリプション
  useEffect(() => {
    const channel = supabase
      .channel(`tasks:project:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', (payload.new as { id: string }).id)
              .single() as { data: Task | null }
            if (data) setTasks(prev =>
              prev.some(t => t.id === data.id) ? prev : [...prev, data]
            )
          } else if (payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', (payload.new as { id: string }).id)
              .single() as { data: Task | null }
            if (data) setTasks(prev => prev.map(t => t.id === data.id ? data : t))
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== (payload.old as { id: string }).id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, supabase])

  const handleSaveTask = useCallback(async (values: {
    title: string
    assignee_id: string | null
    due_date: string | null
    status: TaskStatus
    priority: TaskPriority
    notes: string | null
  }) => {
    if (editingTask) {
      const { data } = await supabase
        .from('tasks')
        .update(values as Record<string, unknown>)
        .eq('id', editingTask.id)
        .select('*')
        .single() as { data: Task | null }
      if (data) setTasks(prev => prev.map(t => t.id === data.id ? data : t))
    } else {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...values, project_id: projectId } as Record<string, unknown>)
        .select('*')
        .single() as { data: Task | null; error: { message: string } | null }
      if (error) {
        alert('タスク追加エラー: ' + error.message)
      } else if (data) {
        setTasks(prev => [...prev, data])
      }
    }
    setShowModal(false)
    setEditingTask(null)
  }, [editingTask, projectId, supabase])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) setTasks(prev => prev.filter(t => t.id !== taskId))
  }, [supabase])

  const handleStatusChange = useCallback(async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase.from('tasks').update({ status } as Record<string, string>).eq('id', taskId)
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }, [supabase])

  const openCreate = () => { setEditingTask(null); setShowModal(true) }
  const openEdit = (task: Task) => { setEditingTask(task); setShowModal(true) }

  return (
    <div>
      {/* ツールバー */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => setView('kanban')}
            className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
              view === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            カンバン
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
              view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            リスト
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{tasks.length} タスク</span>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            タスクを追加
          </button>
        </div>
      </div>

      {/* カンバンビュー */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key)
            return (
              <div key={col.key} className={`rounded-xl p-3 ${col.color} min-h-[200px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-700 text-sm">{col.label}</h3>
                  <span className="text-xs bg-white/70 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={openEdit}
                      onDelete={handleDeleteTask}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  <button
                    onClick={openCreate}
                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    追加
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* リストビュー */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {tasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">タスクがありません。追加してみましょう！</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">タスク名</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden sm:table-cell">担当者</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium hidden md:table-cell">期限</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">優先度</th>
                  <th className="text-left px-4 py-3 text-slate-600 font-medium">ステータス</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <ListRow
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <TaskFormModal
          task={editingTask}
          members={members}
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}

function ListRow({ task, onEdit, onDelete, onStatusChange }: {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, s: TaskStatus) => void
}) {
  const priorityConfig = {
    low: { label: '低', class: 'text-slate-500 bg-slate-100' },
    medium: { label: '中', class: 'text-blue-600 bg-blue-100' },
    high: { label: '高', class: 'text-amber-600 bg-amber-100' },
    urgent: { label: '緊急', class: 'text-red-600 bg-red-100' },
  }
  const statusConfig = {
    todo: { label: '未着手', class: 'text-slate-600 bg-slate-100' },
    in_progress: { label: '進行中', class: 'text-blue-700 bg-blue-100' },
    done: { label: '完了', class: 'text-emerald-700 bg-emerald-100' },
  }
  const p = priorityConfig[task.priority]
  const s = statusConfig[task.status]

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-3 text-slate-900 font-medium">{task.title}</td>
      <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
        {task.profiles?.name || task.profiles?.email || '—'}
      </td>
      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
        {task.due_date ? new Date(task.due_date).toLocaleDateString('ja-JP') : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${p.class}`}>
          {p.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${s.class}`}
        >
          {s.label}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}
