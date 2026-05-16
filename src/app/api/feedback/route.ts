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

  const body = await req.json()
  const { category, content, rating } = body

  if (!content?.trim()) {
    return NextResponse.json({ error: t('api.contentRequired') }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('feedbacks')
    .insert({
      user_id: user.id,
      category: category || 'general',
      content: content.trim(),
      rating: rating || null,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
