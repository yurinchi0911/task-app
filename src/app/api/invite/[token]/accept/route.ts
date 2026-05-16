import { NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FREE_PLAN_LIMITS } from '@/lib/stripe'

/**
 * 招待受諾は RLS で招待先ユーザーが project_members に insert できないため、
 * Service Role で検証・更新する。
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ token: string }> },
) {
  const t = await getTranslations('invite')
  const { token } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: t('acceptErrors.unauthorized') },
      { status: 401 },
    )
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json(
      { error: 'SERVER_CONFIG', message: t('acceptErrors.serverConfig') },
      { status: 500 },
    )
  }

  const { data: invite } = await admin
    .from('project_invites')
    .select('id, email, role, project_id, accepted_at')
    .eq('token', token)
    .maybeSingle() as {
      data: {
        id: string
        email: string
        role: string
        project_id: string
        accepted_at: string | null
      } | null
    }

  if (!invite || invite.accepted_at) {
    return NextResponse.json(
      { error: 'INVALID_INVITE', message: t('acceptErrors.invalidInvite') },
      { status: 400 },
    )
  }

  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'EMAIL_MISMATCH', message: t('acceptErrors.emailMismatch') },
      { status: 403 },
    )
  }

  const { data: project } = await admin
    .from('projects')
    .select('owner_id')
    .eq('id', invite.project_id)
    .single() as { data: { owner_id: string } | null }

  if (!project) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: t('acceptErrors.notFound') },
      { status: 404 },
    )
  }

  const { data: ownerProf } = await admin
    .from('profiles')
    .select('subscription_status')
    .eq('id', project.owner_id)
    .single() as { data: { subscription_status?: string } | null }

  const paying = ownerProf?.subscription_status === 'pro'

  const { count } = await admin
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', invite.project_id)

  const { data: existingMember } = await admin
    .from('project_members')
    .select('user_id')
    .eq('project_id', invite.project_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingMember) {
    await admin.from('project_invites').update({ accepted_at: new Date().toISOString() }).eq('id', invite.id)
    return NextResponse.json({ ok: true, projectId: invite.project_id, alreadyMember: true })
  }

  if (!paying && (count ?? 0) >= FREE_PLAN_LIMITS.maxMembers) {
    return NextResponse.json(
      {
        error: 'MEMBER_LIMIT',
        message: t('acceptErrors.memberLimit'),
      },
      { status: 403 },
    )
  }

  await admin
    .from('project_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  const { error: insErr } = await admin.from('project_members').insert({
    project_id: invite.project_id,
    user_id: user.id,
    role: invite.role,
  } as Record<string, string>)

  if (insErr && !insErr.message.includes('duplicate')) {
    return NextResponse.json(
      {
        error: insErr.code ?? 'INSERT_FAILED',
        message: t('acceptErrors.genericInsert'),
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true, projectId: invite.project_id })
}
