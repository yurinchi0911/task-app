import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Project, ProjectMember } from '@/lib/types'
import { FREE_PLAN_LIMITS } from '@/lib/stripe'
import { isPayingSubscriber } from '@/lib/pro'

function colorClass(hex: string) {
  const map: Record<string, string> = {
    '#3B82F6': 'bg-blue-500',
    '#8B5CF6': 'bg-violet-500',
    '#EC4899': 'bg-pink-500',
    '#EF4444': 'bg-red-500',
    '#F59E0B': 'bg-amber-500',
    '#10B981': 'bg-emerald-500',
    '#06B6D4': 'bg-cyan-500',
    '#F97316': 'bg-orange-500',
  }
  return map[hex] ?? 'bg-slate-500'
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const t = await getTranslations('projects')
  const tLimit = await getTranslations('limit')
  const locale = await getLocale()
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const paying = await isPayingSubscriber(user.id)
  const { count: ownedCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  const canCreateOwnedProject =
    paying || (ownedCount ?? 0) < FREE_PLAN_LIMITS.maxProjects

  const { data: memberships } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id) as { data: Pick<ProjectMember, 'project_id'>[] | null }

  const projectIds = memberships?.map(m => m.project_id) ?? []

  let projects: Project[] = []
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .order('created_at', { ascending: false }) as { data: Project[] | null }
    projects = data ?? []
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
        </div>
        {canCreateOwnedProject ? (
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('new')}
          </Link>
        ) : (
          <Link
            href="/pricing?reason=project_limit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-semibold hover:bg-amber-100 transition-colors"
          >
            {tLimit('freeProjectBanner')}
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">{t('empty')}</h2>
          <p className="text-slate-400 text-sm mb-4">{t('emptyDesc')}</p>
          {canCreateOwnedProject ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              {t('create')}
            </Link>
          ) : (
            <Link
              href="/pricing?reason=project_limit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm font-semibold"
            >
              {tLimit('addProjectsWithPro')}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group p-5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${colorClass(project.color)}`}>
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 truncate transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {new Date(project.created_at).toLocaleDateString(dateLocale)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">
                  {t('open')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
