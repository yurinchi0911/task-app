import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestUiLocale } from '@/lib/request-locale'
import { getStripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  const customerId = profile?.stripe_customer_id as string | undefined
  if (!customerId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  const stripe = getStripe()
  const uiLocale = await getRequestUiLocale()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/projects`,
    locale: uiLocale,
  })

  return NextResponse.json({ url: session.url })
}
