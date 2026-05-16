import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedbackClient from './FeedbackClient'
import type { Feedback } from '@/lib/types'

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single() as { data: { subscription_status?: string } | null }

  const isPro = profile?.subscription_status === 'pro'

  if (!isPro) {
    redirect('/pricing?reason=feedback')
  }

  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: Feedback[] | null }

  return <FeedbackClient feedbacks={feedbacks ?? []} />
}
