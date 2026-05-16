import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'
import { getProAccess } from '@/lib/pro'

export async function POST(req: Request) {
  const t = await getTranslations('feedback')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: t('api.authRequired') }, { status: 401 })
  }

  const { isPro } = await getProAccess(user.id)
  if (!isPro) {
    return NextResponse.json({ error: t('api.proRequired') }, { status: 403 })
  }

  let body: { category?: unknown; content?: unknown; rating?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const category = typeof body.category === 'string' ? body.category : undefined
  const content = typeof body.content === 'string' ? body.content : ''
  const rating =
    typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5 ? body.rating : undefined

  if (!content.trim()) {
    return NextResponse.json({ error: t('api.contentRequired') }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      user_id: user.id,
      category: category || 'general',
      content: content.trim(),
      rating: rating ?? null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[POST /api/feedback]', error.code, error.message)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}
