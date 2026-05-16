'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { Task, TaskStatus, TaskPriority, ProjectMember } from '@/lib/types'

interface FormValues {
  title: string
  assignee_id: string | null
  due_date: string | null
  status: TaskStatus
  priority: TaskPriority
  notes: string | null
  parent_task_id: string | null
}

interface Props {
  task: Task | null
  members: ProjectMember[]
  allTasks?: Task[]
  defaultParentId?: string | null
  /** false のとき親子タスクは使わない（Free のカンバン／リスト） */
  allowParentTasks?: boolean
  onSave: (values: FormValues) => Promise<void>
  onClose: () => void
}

export default function TaskFormModal({
  task,
  members,
  allTasks = [],
  defaultParentId = null,
  allowParentTasks = true,
  onSave,
  onClose,
}: Props) {
  const t = useTranslations('tasks')
  const [title, setTitle] = useState(task?.title ?? '')
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee_id ?? '')
  const [dueDate, setDueDate] = useState<string>(task?.due_date ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [notes, setNotes] = useState<string>(task?.notes ?? '')
  const [parentTaskId, setParentTaskId] = useState<string>(task?.parent_task_id ?? defaultParentId ?? '')
  const [loading, setLoading] = useState(false)

  // 自分自身と子孫タスクを親候補から除外
  const getDescendantIds = (taskId: string): Set<string> => {
    const ids = new Set<string>([taskId])
    const findChildren = (id: string) => {
      allTasks.filter(t => t.parent_task_id === id).forEach(child => {
        ids.add(child.id)
        findChildren(child.id)
      })
    }
    findChildren(taskId)
    return ids
  }

  const excludedIds = task ? getDescendantIds(task.id) : new Set<string>()
  const parentCandidates = allTasks.filter(t => !excludedIds.has(t.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await onSave({
      title: title.trim(),
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      status,
      priority,
      notes: notes.trim() || null,
      parent_task_id: allowParentTasks ? (parentTaskId || null) : null,
    })
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            {task ? t('editTask') : t('addTask')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('title')} *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder={t('titlePlaceholder')}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('priority')}</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="low">{t('priorityLabel.low')}</option>
                <option value="medium">{t('priorityLabel.medium')}</option>
                <option value="high">{t('priorityLabel.high')}</option>
                <option value="urgent">{t('priorityLabel.urgent')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('status')}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="todo">{t('statusLabel.todo')}</option>
                <option value="in_progress">{t('statusLabel.in_progress')}</option>
                <option value="done">{t('statusLabel.done')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('assignee')}</label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            >
              <option value="">{t('unassigned')}</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles?.name || m.profiles?.email || m.user_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('dueDate')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {allowParentTasks && parentCandidates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('parentTask')}
                <span className="ml-1 text-xs text-slate-400 font-normal">{t('parentHint')}</span>
              </label>
              <select
                value={parentTaskId}
                onChange={e => setParentTaskId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="">{t('rootTaskOption')}</option>
                {parentCandidates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('notes')}</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {loading ? t('saving') : task ? t('update') : t('addTask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
