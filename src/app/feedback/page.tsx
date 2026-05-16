import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProAccess } from '@/lib/pro'
import FeedbackClient from './FeedbackClient'
import type { Feedback } from '@/lib/types'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { isPro } = await getProAccess(user.id)
  if (!isPro) redirect('/pricing?reason=feedback')

  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: Feedback[] | null }

  return <FeedbackClient feedbacks={feedbacks ?? []} />
}
