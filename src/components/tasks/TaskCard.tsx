'use client'

import type { Task, TaskStatus } from '@/lib/types'

const priorityConfig = {
  low: { label: '低', class: 'text-slate-500 bg-slate-100', dot: 'bg-slate-400' },
  medium: { label: '中', class: 'text-blue-600 bg-blue-100', dot: 'bg-blue-400' },
  high: { label: '高', class: 'text-amber-600 bg-amber-100', dot: 'bg-amber-400' },
  urgent: { label: '緊急', class: 'text-red-600 bg-red-100', dot: 'bg-red-500' },
}

const nextStatus: Record<TaskStatus, TaskStatus | null> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: null,
}

const nextStatusLabel: Record<TaskStatus, string> = {
  todo: '→ 進行中へ',
  in_progress: '→ 完了へ',
  done: '✓ 完了',
}

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
}


export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: Props) {
  const p = priorityConfig[task.priority]
  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-slate-800 leading-snug flex-1">{task.title}</p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${p.class}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`}></span>
          {p.label}
        </span>

        {task.profiles?.name && (
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[80px]">
            {task.profiles.name}
          </span>
        )}

        {task.due_date && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${isOverdue ? 'text-red-600 bg-red-100' : 'text-slate-400 bg-slate-100'}`}>
            {new Date(task.due_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
          </span>
        )}
      </div>

      {task.notes && (
        <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-1.5 line-clamp-2">
          {task.notes}
        </p>
      )}

      {nextStatus[task.status] !== null ? (
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status] as TaskStatus)}
          className="mt-2 w-full text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 py-1 rounded transition-colors"
        >
          {nextStatusLabel[task.status]}
        </button>
      ) : (
        <div className="mt-2 w-full text-xs text-emerald-500 text-center py-1">
          {nextStatusLabel[task.status]}
        </div>
      )}
    </div>
  )
}
