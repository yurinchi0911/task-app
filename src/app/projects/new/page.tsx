import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewProjectForm from './NewProjectForm'
import { FREE_PLAN_LIMITS } from '@/lib/stripe'
import { isPayingSubscriber } from '@/lib/pro'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const paying = await isPayingSubscriber(user.id)
  if (!paying) {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    if ((count ?? 0) >= FREE_PLAN_LIMITS.maxProjects) {
      redirect('/pricing?reason=project_limit')
    }
  }

  return <NewProjectForm />
}
