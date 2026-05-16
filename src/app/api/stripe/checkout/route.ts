import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRequestUiLocale } from '@/lib/request-locale'
import { getStripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  const stripe = getStripe()
  let customerId = profile?.stripe_customer_id as string | undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId } as Record<string, string>)
      .eq('id', user.id)
  }

  const uiLocale = await getRequestUiLocale()

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/projects?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    locale: uiLocale,
  })

  return NextResponse.json({ url: session.url })
}
