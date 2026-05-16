import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import AcceptInviteClient from './AcceptInviteClient'
import type { ProjectInvite } from '@/lib/types'

interface Props {
  params: Promise<{ token: string }>
}

interface InviteWithProject extends ProjectInvite {
  projects: { id: string; name: string; color: string } | null
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const t = await getTranslations('invite')
  const supabase = await createClient()

  const { data: invite } = await supabase
    .from('project_invites')
    .select('*, projects(id, name, color)')
    .eq('token', token)
    .is('accepted_at', null)
    .single() as { data: InviteWithProject | null }

  if (!invite || !invite.projects) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold mb-2">{t('invalid')}</h1>
          <p className="text-slate-400 text-sm">{t('invalidDesc')}</p>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AcceptInviteClient
      invite={invite}
      project={invite.projects}
      token={token}
      isLoggedIn={!!user}
      userEmail={user?.email ?? null}
    />
  )
}
