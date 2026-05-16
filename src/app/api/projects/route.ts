import { NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { FREE_PLAN_LIMITS } from '@/lib/stripe'
import { isPayingSubscriber } from '@/lib/pro'

export async function POST(req: Request) {
  const t = await getTranslations('limit')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const paying = await isPayingSubscriber(user.id)
  if (!paying) {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    if ((count ?? 0) >= FREE_PLAN_LIMITS.maxProjects) {
      return NextResponse.json(
        {
          error: 'LIMIT_PROJECTS',
          message: t('projectLimit'),
        },
        { status: 403 },
      )
    }
  }

  let body: { name?: string; color?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const color = typeof body.color === 'string' && body.color.startsWith('#') ? body.color : '#3B82F6'
  if (!name || name.length > 120) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, color, owner_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
