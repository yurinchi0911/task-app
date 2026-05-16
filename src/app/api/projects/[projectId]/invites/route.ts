import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FREE_PLAN_LIMITS } from '@/lib/stripe'
import { isPayingSubscriber } from '@/lib/pro'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single() as { data: { owner_id: string } | null }

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ownerPaying = await isPayingSubscriber(project.owner_id)

  const { count: memberCount } = await supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const { count: pendingCount } = await supabase
    .from('project_invites')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('accepted_at', null)

  const slotsUsed = (memberCount ?? 0) + (pendingCount ?? 0)

  if (!ownerPaying && slotsUsed >= FREE_PLAN_LIMITS.maxMembers) {
    return NextResponse.json(
      {
        error: 'LIMIT_MEMBERS',
        message:
          'Freeプランではメンバーは最大3人までです（保留中の招待も枠を使います）。オーナーがProになると無制限になります。',
      },
      { status: 403 },
    )
  }

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!emailRaw || !emailRaw.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const token = uuidv4()
  const { data, error } = await supabase
    .from('project_invites')
    .insert({
      project_id: projectId,
      email: emailRaw,
      role: 'member',
      invited_by: user.id,
      token,
    } as Record<string, string>)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ invite: data })
}
