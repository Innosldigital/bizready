// src/app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { connectDB } from '@/lib/db'
import { Tenant } from '@/models'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_STARTER_PRICE_ID!]:    'starter',
  [process.env.STRIPE_GROWTH_PRICE_ID!]:     'growth',
  [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: 'enterprise',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  await connectDB()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id
      const plan    = PLAN_MAP[priceId] || 'starter'
      await Tenant.findOneAndUpdate(
        { stripeCustomerId: sub.customer },
        { stripeSubscriptionId: sub.id, plan, isActive: sub.status === 'active' }
      )
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await Tenant.findOneAndUpdate(
        { stripeCustomerId: sub.customer },
        { plan: 'starter', isActive: false }
      )
      break
    }
    case 'invoice.payment_succeeded': {
      // Reset monthly submission count at the start of each billing cycle
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.billing_reason === 'subscription_cycle') {
        await Tenant.findOneAndUpdate(
          { stripeCustomerId: invoice.customer },
          { $set: { submissionsThisMonth: 0 } }
        )
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
