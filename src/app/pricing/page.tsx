import { createClient } from '@/lib/supabase/server'
import { getProAccess } from '@/lib/pro'
import PricingClient from './PricingClient'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPro = false
  let isOwnerPro = false
  let coveredByOwner = false

  if (user) {
    const access = await getProAccess(user.id)
    isPro = access.isPro
    isOwnerPro = access.isOwnerPro
    coveredByOwner = access.coveredByOwner
  }

  return (
    <PricingClient
      isPro={isPro}
      isOwnerPro={isOwnerPro}
      coveredByOwner={coveredByOwner}
      isLoggedIn={!!user}
    />
  )
}
