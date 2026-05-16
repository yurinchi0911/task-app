'use client'

import { useState, useCallback } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@/lib/types'
import TaskFormModal from './TaskFormModal'
import type { ProjectMember } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const priorityConfig = {
  low: { label: '低', class: 'text-slate-500 bg-slate-100' },
  medium: { label: '中', class: 'text-blue-600 bg-blue-100' },
  high: { label: '高', class: 'text-amber-600 bg-amber-100' },
  urgent: { label: '緊急', class: 'text-red-600 bg-red-100' },
}

const statusConfig = {
  todo: { label: '未着手', class: 'text-slate-600 bg-slate-100', dot: 'bg-slate-400' },
  in_progress: { label: '進行中', class: 'text-blue-700 bg-blue-100', dot: 'bg-blue-500' },
  done: { label: '完了', class: 'text-emerald-700 bg-emerald-100', dot: 'bg-emerald-500' },
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

interface TreeNodeProps {
  task: Task
  allTasks: Task[]
  depth: number
  members: ProjectMember[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onAddChild: (parentId: string) => void
}

function TreeNode({
  task,
  allTasks,
  depth,
  members,
  onEdit,
  onDelete,
  onStatusChange,
  onAddChild,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const children = allTasks.filter(t => t.parent_task_id === task.id)
  const p = priorityConfig[task.priority]
  const s = statusConfig[task.status]
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  const nextStatus: Record<TaskStatus, TaskStatus> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 group transition-colors ${
          depth > 0 ? 'ml-' + (depth * 6) : ''
        }`}
        style={{ marginLeft: depth * 24 }}
      >
        {/* 展開/折りたたみボタン */}
        <button
          onClick={() => setExpanded(v => !v)}
          className={`flex-shrink-0 w-4 h-4 flex items-center justify-center transition-transform ${
            children.length === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* ステータスドット */}
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status])}
          className={`flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 hover:scale-110 transition-transform cursor-pointer ${
            task.status === 'done'
              ? 'bg-emerald-500 border-emerald-500'
              : task.status === 'in_progress'
              ? 'border-blue-500 bg-blue-100'
              : 'border-slate-300 bg-white'
          }`}
          title={`ステータス: ${s.label} → クリックで変更`}
        />

        {/* タイトル */}
        <span
          className={`flex-1 text-sm font-medium truncate ${
            task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
          }`}
        >
          {task.title}
        </span>

        {/* メタ情報 */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {children.length > 0 && (
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {children.filter(c => c.status === 'done').length}/{children.length}
            </span>
          )}

          <span className={`hidden sm:inline-flex text-xs px-1.5 py-0.5 rounded font-medium ${p.class}`}>
            {p.label}
          </span>

          <span className={`hidden md:inline-flex text-xs px-1.5 py-0.5 rounded font-medium ${s.class}`}>
            {s.label}
          </span>

          {task.due_date && (
            <span className={`hidden sm:inline-flex text-xs px-1.5 py-0.5 rounded ${
              isOverdue ? 'text-red-600 bg-red-100' : 'text-slate-400 bg-slate-100'
            }`}>
              {new Date(task.due_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
            </span>
          )}

          {task.profiles?.name && (
            <span className="hidden sm:inline-flex text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[70px]">
              {task.profiles.name}
            </span>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onAddChild(task.id)}
            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
            title="サブタスクを追加"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            title="編集"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="削除"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 子タスク */}
      {expanded && children.length > 0 && (
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 border-l-2 border-dashed border-slate-200"
            style={{ marginLeft: depth * 24 + 14 }}
          />
          {children.map(child => (
            <TreeNode
              key={child.id}
              task={child}
              allTasks={allTasks}
              depth={depth + 1}
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
  )
}

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

  const openCreate = () => {
    setEditingTask(null)
    setDefaultParentId(null)
    setShowModal(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setDefaultParentId(null)
    setShowModal(true)
  }

  const openAddChild = (parentId: string) => {
    setEditingTask(null)
    setDefaultParentId(parentId)
    setShowModal(true)
  }

  const completedCount = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div>
      {/* 進捗バー */}
      {tasks.length > 0 && (
        <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">全体進捗</span>
            <span className="text-sm text-slate-500">{completedCount} / {tasks.length} 完了 ({progress}%)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ツリー本体 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8" />
            </svg>
            <span className="text-sm font-medium text-slate-700">
              {rootTasks.length} 件のルートタスク
            </span>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            タスクを追加
          </button>
        </div>

        {/* タスクツリー */}
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">タスクがありません。追加してみましょう！</p>
          </div>
        ) : (
          <div className="py-2 px-2">
            {rootTasks.map(task => (
              <TreeNode
                key={task.id}
                task={task}
                allTasks={tasks}
                depth={0}
                members={members}
                onEdit={openEdit}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                onAddChild={openAddChild}
              />
            ))}
          </div>
        )}
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
