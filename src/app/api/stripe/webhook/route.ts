import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

function subscriptionGrantsPro(status: Stripe.Subscription.Status): boolean {
  // canceled / unpaid / incomplete* は無料。リトライ中の past_due は一旦 Pro を維持
  return status === 'active' || status === 'trialing' || status === 'past_due'
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const isPro = subscriptionGrantsPro(subscription.status)

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_status: isPro ? 'pro' : 'free' } as Record<string, string>)
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('[stripe webhook] profile update failed:', error.message)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
