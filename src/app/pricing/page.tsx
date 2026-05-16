import { createClient } from '@/lib/supabase/server'
import PricingClient from './PricingClient'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPro = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    isPro = (profile?.subscription_status as string) === 'pro'
  }

  return <PricingClient isPro={isPro} isLoggedIn={!!user} />
}
