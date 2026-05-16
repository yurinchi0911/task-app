import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import TaskBoard from '@/components/tasks/TaskBoard'
import StandupSection from '@/components/standup/StandupSection'
import type { Project, Task, ProjectMember } from '@/lib/types'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single() as { data: Pick<ProjectMember, 'role'> | null }

  if (!membership) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single() as { data: Project | null }

  if (!project) notFound()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true }) as { data: Task[] | null }

  const { data: members } = await supabase
    .from('project_members')
    .select('*, profiles(id, name, email)')
    .eq('project_id', projectId) as { data: ProjectMember[] | null }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
        </div>
        <Link
          href={`/projects/${projectId}/settings`}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
          メンバー管理
        </Link>
      </div>

      <StandupSection
        projectId={projectId}
        currentUserId={user.id}
      />

      <div className="mt-6">
        <TaskBoard
          projectId={projectId}
          initialTasks={tasks ?? []}
          members={members ?? []}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
