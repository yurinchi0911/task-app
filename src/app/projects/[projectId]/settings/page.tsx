import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import InviteSection from '@/components/members/InviteSection'
import type { Project, ProjectMember, ProjectInvite } from '@/lib/types'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myMembership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single() as { data: Pick<ProjectMember, 'role'> | null }

  if (!myMembership) notFound()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single() as { data: Project | null }

  if (!project) notFound()

  const { data: members } = await supabase
    .from('project_members')
    .select('*, profiles(id, name, email)')
    .eq('project_id', projectId) as { data: ProjectMember[] | null }

  const { data: invites } = await supabase
    .from('project_invites')
    .select('*')
    .eq('project_id', projectId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false }) as { data: ProjectInvite[] | null }

  const isAdmin = myMembership.role === 'owner' || myMembership.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
        >
          ← プロジェクトに戻る
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">メンバー管理</h1>
        <p className="text-slate-500 text-sm mt-1">{project.name}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">現在のメンバー</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {(members ?? []).map(m => (
            <li key={m.user_id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="font-medium text-slate-800 text-sm">
                  {m.profiles?.name || m.profiles?.email || m.user_id}
                </p>
                {m.profiles?.name && (
                  <p className="text-xs text-slate-400">{m.profiles.email}</p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                m.role === 'owner' ? 'bg-amber-100 text-amber-700' :
                m.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {m.role === 'owner' ? 'オーナー' : m.role === 'admin' ? '管理者' : 'メンバー'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <InviteSection
          projectId={projectId}
          pendingInvites={invites ?? []}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
